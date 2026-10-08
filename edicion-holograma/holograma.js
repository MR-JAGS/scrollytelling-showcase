/* ============================================================================
   holograma.js — Edición Holograma (motion graphics neón sobre la foto)
   ----------------------------------------------------------------------------
   Capa overlay 100% Canvas2D que interpreta el "ensamblaje" de cada producto
   con estética holograma: líneas finas neón, trazados que se dibujan solos
   (draw-on), barras de telemetría y HUD sincronizado al scroll.
     · deportivo → chasis + ruedas + alerón que se ensamblan por segmentos
     · casa      → plano arquitectónico que se traza (muros, rooms, cotas)
     · laptop    → vista explosionada que converge (display/chasis/placa/bat)
   Recibe el progreso crudo 0..1 vía window.__holoTarget (hook del motor
   principal) y el producto activo vía body[data-product]. Bucle rAF propio
   con lerp para 60 FPS. El "glow" se falsifica con doble trazo (ancho tenue
   + fino brillante) para no usar shadowBlur, que es costoso en GPU.
   ========================================================================== */
(() => {
  "use strict";

  const canvas = document.getElementById("holoCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

  let dpr = 1, W = 0, H = 0;
  let target = 0;   // progreso crudo 0..1 que envía el motor principal
  let cur = 0;      // versión suavizada (lerp) que realmente se dibuja
  let productId = "deportivo";
  let accent = "#ff4d2e";
  let fpsEMA = 60;

  // El motor principal (../app.js) llama a este hook en cada onUpdate.
  window.__holoTarget = (p) => { target = p; };

  /* Producto activo: se lee del <body data-product> que renderiza la app.
     MutationObserver = cambio instantáneo de color y escena al alternar demo. */
  function syncProduct() {
    productId = document.body.dataset.product || "deportivo";
    const d = window.Scrolly && window.Scrolly.data && window.Scrolly.data[productId];
    if (d && d.accent) accent = d.accent;
  }
  new MutationObserver(syncProduct).observe(document.body, {
    attributes: true, attributeFilter: ["data-product"],
  });
  syncProduct();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  let resizeT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 120);
  });
  resize();

  /* ---------- Utilidades de dibujo neón ---------- */

  function hexRgb(hex) {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  function rgba(hex, a) {
    const c = hexRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }
  // Trazo neón: pasada ancha tenue + pasada fina brillante (glow barato).
  function neon(pathFn, color, alpha, width) {
    ctx.strokeStyle = rgba(color, alpha * 0.22);
    ctx.lineWidth = (width || 1.5) + 4;
    ctx.beginPath(); pathFn(); ctx.stroke();
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = width || 1.5;
    ctx.beginPath(); pathFn(); ctx.stroke();
  }
  // Segmento 0..1 de un rango del scroll global.
  function seg(p, a, b) {
    return Math.max(0, Math.min(1, (p - a) / (b - a)));
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  // Dibuja una polilínea parcial (efecto "se está trazando solo").
  function tracePoly(pts, t, color, alpha, width) {
    if (t <= 0) return;
    let total = 0;
    const lens = [];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      const l = Math.hypot(dx, dy);
      lens.push(l); total += l;
    }
    let budget = total * Math.min(1, t);
    const sub = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (budget <= 0) break;
      const take = Math.min(lens[i - 1], budget);
      const f = take / lens[i - 1];
      sub.push([
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f,
      ]);
      budget -= take;
    }
    if (sub.length < 2) return;
    neon(() => {
      ctx.moveTo(sub[0][0], sub[0][1]);
      for (let i = 1; i < sub.length; i++) ctx.lineTo(sub[i][0], sub[i][1]);
    }, color, alpha, width);
  }
  // Arco parcial (gauges circulares).
  function traceArc(cx, cy, r, a0, a1, t, color, alpha, width) {
    if (t <= 0) return;
    const a = a0 + (a1 - a0) * Math.min(1, t);
    neon(() => ctx.arc(cx, cy, r, a0, a), color, alpha, width);
  }
  function label(txt, x, y, size, color, alpha, align) {
    ctx.fillStyle = color === "mono" ? "rgba(255,255,255," + alpha + ")" : rgba(color, alpha);
    ctx.font = "600 " + (size || 10) + 'px ' + MONO;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, y);
  }
  function rr(x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- HUD global (siempre visible) ---------- */

  function drawHUD(p, t) {
    const m = 26;
    const compact = W < 720;

    // Esquinas tipo visor
    const L = 30;
    neon(() => {
      ctx.moveTo(m, m + L); ctx.lineTo(m, m); ctx.lineTo(m + L, m);
      ctx.moveTo(W - m - L, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + L);
      ctx.moveTo(W - m, H - m - L); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m - L, H - m);
      ctx.moveTo(m + L, H - m); ctx.lineTo(m, H - m); ctx.lineTo(m, H - m - L);
    }, accent, 0.75, 1.5);

    // Riel superior de progreso con ticks + punto luminoso
    const rw = Math.min(420, W * 0.52);
    const rx = (W - rw) / 2, ry = m + 6;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i <= 10; i++) {
      const tx = rx + (i / 10) * rw;
      ctx.fillRect(tx - 0.5, ry - (i % 5 === 0 ? 5 : 3), 1, (i % 5 === 0 ? 10 : 6));
    }
    const dotX = rx + p * rw;
    ctx.fillStyle = rgba(accent, 0.3);
    ctx.beginPath(); ctx.arc(dotX, ry, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(dotX, ry, 2.6, 0, Math.PI * 2); ctx.fill();
    label("SYNC " + String(Math.round(p * 100)).padStart(3, "0") + "%", W / 2, ry + 20, 10, accent, 0.9, "center");

    if (!compact) {
      // Barras laterales izquierdas (telemetría viva con el tiempo)
      const names = ["SYS", "PWR", "NET"];
      for (let i = 0; i < 3; i++) {
        const bx = m + 6 + i * 16;
        const bh = 16 + 12 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7));
        ctx.fillStyle = rgba(accent, 0.75);
        ctx.fillRect(bx, H - m - 66 - bh, 8, bh);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(bx, H - m - 66 - 30, 8, 30);
        label(names[i], bx + 4, H - m - 46, 8, "mono", 0.5, "center");
      }
      // Retícula rotatoria derecha
      const gx = W - m - 34, gy = m + 66;
      ctx.save();
      ctx.strokeStyle = rgba(accent, 0.6);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -t * 22;
      ctx.beginPath(); ctx.arc(gx, gy, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.moveTo(gx - 32, gy); ctx.lineTo(gx + 32, gy);
      ctx.moveTo(gx, gy - 32); ctx.lineTo(gx, gy + 32);
      ctx.stroke();
      ctx.restore();
      label("TRK-" + String(Math.floor(t * 4) % 100).padStart(2, "0"), gx, gy + 40, 9, accent, 0.8, "center");
    }

    // Barrido de escaneo horizontal (muy sutil)
    const sy = ((t * 70) % (H + 120)) - 60;
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fillRect(0, sy, W, 1.5);
    ctx.fillStyle = rgba(accent, 0.05);
    ctx.fillRect(0, sy - 14, W, 14);

    // Telemetría inferior izquierda
    label(
      "HOLO.SYNC ▸ " + Math.round(fpsEMA) + " FPS ▸ DPR " + dpr,
      m, H - m, 10, "mono", 0.55, "left"
    );
  }

  /* ---------- Escena 1: SUPERDEPORTIVO — ensamblaje del chasis ---------- */

  function drawCar(p, t) {
    const s = Math.max(0.55, Math.min(1.15, Math.min(W, H) / 620));
    const cx = W / 2, cy = H * 0.44;

    label("CHASIS // GT-R — ENSAMBLAJE " + String(Math.round(seg(p, 0.02, 0.98) * 100)).padStart(3, "0") + "%", cx, cy - 150 * s, 11, accent, 0.9, "center");

    // Línea base de suelo
    tracePoly([[cx - 250 * s, cy + 56 * s], [cx + 250 * s, cy + 56 * s]], seg(p, 0, 0.12), accent, 0.5, 1);

    // Carrocería lateral (perfil que se traza solo)
    const body = [
      [cx - 220 * s, cy + 20 * s], [cx - 200 * s, cy - 8 * s],
      [cx - 120 * s, cy - 14 * s], [cx - 70 * s, cy - 44 * s],
      [cx + 20 * s, cy - 46 * s], [cx + 90 * s, cy - 14 * s],
      [cx + 170 * s, cy - 10 * s], [cx + 210 * s, cy + 6 * s],
      [cx + 220 * s, cy + 20 * s],
    ];
    tracePoly(body, seg(p, 0.05, 0.32), accent, 0.95, 1.6);

    // Ruedas: aros que se trazan + radios girando con el tiempo
    const wheels = [[cx - 140 * s, cy + 20 * s], [cx + 150 * s, cy + 20 * s]];
    const wt = seg(p, 0.25, 0.45);
    wheels.forEach((wpos) => {
      traceArc(wpos[0], wpos[1], 34 * s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2, wt, accent, 0.9, 1.6);
      if (wt >= 1) {
        for (let k = 0; k < 3; k++) {
          const a = t * 1.8 + (k / 3) * Math.PI * 2;
          neon(() => {
            ctx.moveTo(wpos[0], wpos[1]);
            ctx.lineTo(wpos[0] + Math.cos(a) * 26 * s, wpos[1] + Math.sin(a) * 26 * s);
          }, accent, 0.55, 1);
        }
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(wpos[0], wpos[1], 2.4, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Cabina + alerón (aparecen en el tramo medio)
    tracePoly([
      [cx - 90 * s, cy - 14 * s], [cx - 55 * s, cy - 40 * s],
      [cx + 10 * s, cy - 42 * s], [cx + 60 * s, cy - 14 * s],
    ], seg(p, 0.4, 0.56), "#ffffff", 0.7, 1.2);
    tracePoly([
      [cx + 150 * s, cy - 10 * s], [cx + 196 * s, cy - 34 * s], [cx + 232 * s, cy - 34 * s],
    ], seg(p, 0.5, 0.64), accent, 0.9, 1.5);

    // Halo bajo el chasis cuando el ensamblaje avanza
    const haloA = 0.28 * seg(p, 0.3, 0.8);
    if (haloA > 0.01) {
      ctx.strokeStyle = rgba(accent, haloA);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx + 5 * s, cy + 56 * s, 200 * s, 14 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Barras de specs que se llenan con el scroll
    const specs = [
      ["POTENCIA 720 CV", seg(p, 0.55, 0.78)],
      ["V.MAX 340 KM/H", seg(p, 0.62, 0.84)],
      ["AERO 850 KG", seg(p, 0.69, 0.9)],
    ];
    specs.forEach((sp, i) => {
      const by = cy + 92 * s + i * 26;
      label(sp[0], cx - 190 * s, by, 9, "mono", 0.35 + 0.45 * sp[1], "left");
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 60 * s, by - 5, 220 * s, 10);
      if (sp[1] > 0) {
        ctx.fillStyle = rgba(accent, 0.85);
        ctx.fillRect(cx - 60 * s, by - 5, 220 * s * easeOut(sp[1]), 10);
      }
    });

    // Gauge de potencia (arco que se completa al final del recorrido).
    // En pantallas estrechas se reubica arriba-derecha para no chocar.
    let gx = cx + 250 * s, gy = cy + 100 * s;
    if (gx > W - 80) { gx = W - 80; gy = 200; }
    traceArc(gx, gy, 34, Math.PI * 0.75, Math.PI * 2.25, seg(p, 0.7, 1), accent, 0.9, 2);
    label("PWR", gx, gy - 8, 9, "mono", 0.6, "center");
    label(String(Math.round(seg(p, 0.7, 1) * 720)), gx, gy + 8, 13, accent, 0.95, "center");
  }

  /* ---------- Escena 2: CASA — el plano que se va trazando ---------- */

  function drawHouse(p, t) {
    const s = Math.max(0.55, Math.min(1.05, Math.min(W, H) / 640));
    const cx = W / 2, cy = H * 0.44;
    const pw = 420 * s, ph = 250 * s;
    const x0 = cx - pw / 2, y0 = cy - ph / 2;

    // Retícula de plano de fondo (estética blueprint)
    ctx.strokeStyle = "rgba(120,180,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx < W; gx += 44) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (let gy = 0; gy < H; gy += 44) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();

    label("PLANO A-101 · ESC 1:50 — TRAZO " + String(Math.round(seg(p, 0.02, 0.95) * 100)).padStart(3, "0") + "%", cx, y0 - 34, 11, accent, 0.9, "center");

    // Muros exteriores
    tracePoly([[x0, y0], [x0 + pw, y0], [x0 + pw, y0 + ph], [x0, y0 + ph], [x0, y0]], seg(p, 0, 0.22), accent, 0.95, 1.8);
    // Particiones interiores
    tracePoly([[x0 + pw * 0.38, y0], [x0 + pw * 0.38, y0 + ph * 0.62]], seg(p, 0.2, 0.36), accent, 0.8, 1.2);
    tracePoly([[x0 + pw * 0.38, y0 + ph * 0.62], [x0 + pw, y0 + ph * 0.62]], seg(p, 0.28, 0.42), accent, 0.8, 1.2);
    tracePoly([[x0 + pw * 0.68, y0 + ph * 0.62], [x0 + pw * 0.68, y0 + ph]], seg(p, 0.34, 0.48), accent, 0.8, 1.2);

    // Etiquetas de estancias que emergen
    const rooms = [
      ["SALA", x0 + pw * 0.19, y0 + ph * 0.4],
      ["SUITE", x0 + pw * 0.53, y0 + ph * 0.3],
      ["COCINA", x0 + pw * 0.84, y0 + ph * 0.3],
      ["PATIO", x0 + pw * 0.53, y0 + ph * 0.81],
    ];
    const rt = seg(p, 0.45, 0.62);
    rooms.forEach((r, i) => {
      const a = Math.max(0, Math.min(1, rt * rooms.length - i));
      if (a <= 0) return;
      label("▸ " + r[0], r[1], r[2], 10, accent, 0.85 * a, "center");
      ctx.fillStyle = rgba(accent, 0.5 * a);
      ctx.beginPath(); ctx.arc(r[1], r[2] - 18, 2, 0, Math.PI * 2); ctx.fill();
    });

    // Cotas de dimensión
    const dt = seg(p, 0.6, 0.78);
    if (dt > 0) {
      ctx.strokeStyle = "rgba(255,255,255," + (0.5 * dt) + ")";
      ctx.lineWidth = 1;
      const dy = y0 + ph + 26;
      ctx.beginPath();
      ctx.moveTo(x0, dy); ctx.lineTo(x0 + pw, dy);
      ctx.moveTo(x0, dy - 5); ctx.lineTo(x0, dy + 5);
      ctx.moveTo(x0 + pw, dy - 5); ctx.lineTo(x0 + pw, dy + 5);
      ctx.stroke();
      label("12.40 m", cx, dy + 16, 9, "mono", 0.7 * dt, "center");
    }

    // Cubierta a dos aguas (cierre del recorrido)
    tracePoly(
      [[x0 - 20 * s, y0], [cx, y0 - 70 * s], [x0 + pw + 20 * s, y0]],
      seg(p, 0.75, 0.95), accent, 0.9, 1.5
    );
    // Punto norte / sello
    const st = seg(p, 0.9, 1);
    if (st > 0) {
      traceArc(x0 + pw + 44, y0 + 20, 16, 0, Math.PI * 2, st, accent, 0.85, 1.2);
      label("N↑", x0 + pw + 44, y0 + 20, 9, accent, 0.9 * st, "center");
    }
  }

  /* ---------- Escena 3: LAPTOP — vista explosionada que converge ---------- */

  function drawLaptop(p, t) {
    const s = Math.max(0.6, Math.min(1.1, Math.min(W, H) / 620));
    const cx = W / 2, cy = H * 0.42;
    const layers = [
      ["DISPLAY · MINI-LED 240HZ", "16″ QHD+"],
      ["CHASIS · ALU CNC 1.9KG", "16.9 MM"],
      ["PLACA · i9 + RTX 12GB", "140 W"],
      ["BATERÍA · 99WH", "22 H*"],
    ];
    const spread = (1 - easeOut(Math.max(0, Math.min(1, p * 1.05)))) * 74 * s;
    const lh = 46 * s, lw = Math.min(360 * s, W * 0.7);

    label(
      "VISTA EXPLOSIONADA — " + (p > 0.86 ? "ENSAMBLADO ✓" : "SEPARACIÓN " + String(Math.round(spread)) + "PX"),
      cx, cy - 170 * s, 11, accent, 0.9, "center"
    );

    // Eje vertical de ensamblaje
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 130 * s - spread * 1.6);
    ctx.lineTo(cx, cy + 130 * s + spread * 1.6);
    ctx.stroke();
    ctx.setLineDash([]);

    layers.forEach((L, i) => {
      const off = (i - 1.5);
      const ly = cy + off * (lh + 12 + spread * 0.55) - lh / 2;
      const a = 0.45 + 0.5 * seg(p, i * 0.12, 0.3 + i * 0.12);
      neon(() => rr(cx - lw / 2, ly, lw, lh, 8 * s), i === 2 ? accent : "#ffffff", i === 2 ? 0.9 : a * 0.7, i === 2 ? 1.6 : 1.2);
      label("0" + (i + 1) + " ▸ " + L[0], cx - lw / 2 + 12, ly + lh / 2 - 8, 9, i === 2 ? accent : "mono", 0.85, "left");
      label(L[1], cx + lw / 2 - 12, ly + lh / 2 + 8, 8, "mono", 0.5, "right");
    });

    // Trazas de circuito desde el "CPU" (capa PLACA = índice 2)
    const py = cy + 0.5 * (lh + 12 + spread * 0.55);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    const ct = seg(p, 0.3, 0.7);
    if (ct > 0) {
      tracePoly([[cx - 30 * s, py + lh / 2], [cx - 90 * s, py + lh / 2 + 34 * s], [cx - 150 * s, py + lh / 2 + 34 * s]], ct, accent, 0.8, 1.2);
      tracePoly([[cx + 30 * s, py + lh / 2], [cx + 90 * s, py + lh / 2 + 34 * s], [cx + 150 * s, py + lh / 2 + 34 * s]], ct, accent, 0.8, 1.2);
      // CPU latiendo
      ctx.fillStyle = rgba(accent, 0.25 + 0.45 * pulse * ct);
      ctx.fillRect(cx - 15 * s, py + lh / 2 - 8, 30 * s, 16);
      ctx.strokeStyle = rgba(accent, 0.9 * ct);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - 15 * s, py + lh / 2 - 8, 30 * s, 16);
      label("CPU", cx, py + lh / 2, 8, "mono", 0.9 * ct, "center");
    }

    // Barras de specs
    const specs = [
      ["RAM 32GB", seg(p, 0.5, 0.72)],
      ["GPU 12GB", seg(p, 0.58, 0.8)],
      ["240HZ", seg(p, 0.66, 0.88)],
    ];
    specs.forEach((sp, i) => {
      const by = cy + 148 * s + i * 24;
      label(sp[0], cx - 170 * s, by, 9, "mono", 0.4 + 0.4 * sp[1], "left");
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 60 * s, by - 5, 200 * s, 9);
      if (sp[1] > 0) {
        ctx.fillStyle = rgba(accent, 0.85);
        ctx.fillRect(cx - 60 * s, by - 5, 200 * s * easeOut(sp[1]), 9);
      }
    });
  }

  /* ---------- Bucle principal del overlay ---------- */

  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    if (dt > 0) fpsEMA += ((1 / dt) - fpsEMA) * 0.05;

    const diff = target - cur;
    if (Math.abs(diff) > 0.0004) {
      cur += diff * 0.12;
      if (Math.abs(target - cur) < 0.002) cur = target;
    }

    const t = RM ? 0 : now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    drawHUD(cur, t);
    if (productId === "casa") drawHouse(cur, t);
    else if (productId === "laptop") drawLaptop(cur, t);
    else drawCar(cur, t);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
