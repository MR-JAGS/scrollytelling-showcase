/* ============================================================================
   app.js — Scrollytelling Framework (data-driven, 60 FPS+)
   Stack: HTML5 Canvas2D + Vanilla JS + GSAP ScrollTrigger + Lenis
   ----------------------------------------------------------------------------
   MODULE 1: DATA STORE & SCHEMAS ............ objeto PRODUCT_DATA (3 perfiles)
   MODULE 2: CANVAS & ASSET PRELOADER ........ fotos HD + Ken Burns + DPR
   MODULE 3: SCROLLTRIGGER & GSAP ENGINE ..... Lenis + scrub + waypoints
   MODULE 4: TEMPLATE RENDERER & INTERACTION .. DOM data-driven + demo switcher
   ============================================================================ */
"use strict";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================================
   // MODULE 1: DATA STORE & SCHEMAS
   ----------------------------------------------------------------------------
   Toda la narrativa vive aquí. Para reutilizar el framework con otro producto
   basta con añadir una nueva clave al objeto PRODUCT_DATA con este esquema:
     { id, kicker, title, titleThin, subtitle, price, priceNote, cta,
       accent, totalFrames, heroSpecs[{value,label}],
       sections[{num, align, title, text, stats[{value,label}]}],
       finale{ title, specs[{k,v}] } }
   Los "frames" son 100% procedurales: no hay URLs externas de imágenes.
   ========================================================================== */
const PRODUCT_DATA = {
  deportivo: {
    id: "deportivo",
    kicker: "SERIE GT · EDICIÓN 2026",
    title: "VÉRTICE",
    titleThin: "GT-R",
    subtitle: "El superdeportivo que convierte cada curva en una coreografía de 720 caballos. Aerodinámica activa, chasis de carbono y un rugido que se siente en el pecho.",
    price: "€189.900",
    priceNote: "Desde · impuestos incl.",
    cta: "Reservar prueba",
    // ⚙️ CONVERSIÓN — edita estos valores con tus datos reales:
    contact: {
      whatsapp: "", // ← TU NÚMERO en formato internacional sin "+" (ej. "34600123123"). Vacío = modo demo.
      phoneDisplay: "+34 600 123 123",
      phoneHref: "tel:+34600123123",
      ctaLabel: "Reservar prueba",
      headline: "Siente los 720 CV en persona",
      sub: "Déjanos tu nombre y teléfono y te llamamos hoy mismo para agendar tu prueba privada de 20 minutos. Sin compromiso.",
    },
    offer: { badge: "Lanzamiento · Solo quedan 3 de 8 unidades", unitsTotal: 8, unitsLeft: 3, deadline: "2026-12-31T23:59:59" },
    rating: { value: "4.9", count: "214" },
    comparison: {
      title: "Vértice GT-R frente al segmento",
      note: "Promedio de 6 superdeportivos híbridos 2025–2026 (datos de prensa especializada). Edítalo en el Estudio.",
      metrics: [
        { name: "Potencia", ours: 720, market: 560, unit: "CV", lowerBetter: false },
        { name: "0–100 km/h", ours: 2.9, market: 3.6, unit: "s", lowerBetter: true },
        { name: "Precio", ours: 190, market: 235, unit: "mil €", lowerBetter: true },
        { name: "Garantía", ours: 4, market: 2, unit: "años", lowerBetter: false },
      ],
    },
    testimonials: [
      { stars: 5, text: "La prueba de 20 minutos me vendió el coche. El modo pista es de otro planeta y el asesor, impecable.", name: "Carlos M.", place: "Madrid" },
      { stars: 5, text: "Entrega en 3 semanas, tal como prometieron. El head-up display con telemetría es adictivo.", name: "Lucía F.", place: "Barcelona" },
      { stars: 5, text: "Vengo de un alemán de 500 CV y no hay color. Financiación clara, sin letra pequeña.", name: "Andrés R.", place: "Valencia" },
    ],
    trust: [
      { icon: "🛡️", title: "Garantía 4 años", sub: "Motor e híbrido incluidos" },
      { icon: "💳", title: "Financiación a medida", sub: "Desde 890 €/mes" },
      { icon: "🚚", title: "Entrega en 30 días", sub: "En toda la península" },
      { icon: "🔑", title: "Prueba sin compromiso", sub: "20 min con instructor" },
    ],
    socialProof: [
      { name: "María G.", detail: "reservó una prueba privada", time: "hace 2 h" },
      { name: "Javier T.", detail: "pidió financiación a medida", time: "hace 5 h" },
      { name: "Sofía L.", detail: "configuró su Vértice GT-R", time: "ayer" },
    ],
    accent: "#ff4d2e",
    totalFrames: 72,
    // Secuencia fotográfica real (verificada, alta resolución). El canvas
    // funde entre ellas con zoom Ken Burns según el scroll.
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
    ],
    heroSpecs: [
      { value: "2.9 s", label: "0–100 km/h" },
      { value: "720 CV", label: "Potencia V8 híbrido" },
      { value: "340 km/h", label: "Velocidad máxima" },
    ],
    sections: [
      { num: "01 / AERODINÁMICA", align: "left", title: "Esculpido por el viento", text: "Cada línea del Vértice GT-R nace en el túnel de viento: difusor activo, alerón adaptativo y suelo plano generan 850 kg de carga aerodinámica a 250 km/h.", stats: [{ value: "0.29", label: "Cx ultrabajo" }, { value: "850 kg", label: "Downforce" }] },
      { num: "02 / POTENCIA", align: "right", title: "720 CV sin concesiones", text: "El V8 biturbo de 4.0 L trabaja con un motor eléctrico axial. Respuesta instantánea, corte a 9.000 rpm y modo pista que despierta a la bestia.", stats: [{ value: "9.000", label: "rpm corte" }, { value: "V8 + e-motor", label: "Híbrido" }] },
      { num: "03 / CHASIS", align: "center", title: "Carbono que abraza el asfalto", text: "Monocasco de fibra de carbono de 82 kg, suspensión push-rod y reparto de pesos 42/58. Gira donde otros frenan.", stats: [{ value: "82 kg", label: "Monocasco" }, { value: "1.4 G", label: "Agarre lateral" }] },
      { num: "04 / INTERIOR", align: "left", title: "Cockpit de piloto", text: "Asientos baquet de carbono, volante yugo con telemetría en vivo y head-up display de realidad aumentada sobre el parabrisas.", stats: [{ value: "12″", label: "Cluster curvo" }, { value: "−18 kg", label: "vs. generación anterior" }] },
    ],
    finale: {
      title: "Vértice GT-R · Ficha técnica",
      specs: [
        { k: "0–100 km/h", v: "2.9 s" }, { k: "Potencia", v: "720 CV" },
        { k: "Par máximo", v: "850 Nm" }, { k: "Peso", v: "1.420 kg" },
        { k: "Tracción", v: "Total AWD" }, { k: "Precio", v: "€189.900" },
      ],
    },
  },

  casa: {
    id: "casa",
    kicker: "RESIDENCIAL LOMAS · ENTREGA 2026",
    title: "CASA",
    titleThin: "Mirador",
    subtitle: "Arquitectura viva sobre la colina: 420 m² de luz, piedra y vidrio con domótica integral, piscina infinita y vistas de 180° al valle.",
    price: "€1.250.000",
    priceNote: "420 m² · 4 suites",
    cta: "Agendar visita",
    // ⚙️ CONVERSIÓN — edita estos valores con tus datos reales:
    contact: {
      whatsapp: "", // ← TU NÚMERO en formato internacional sin "+" (ej. "34600123123"). Vacío = modo demo.
      phoneDisplay: "+34 910 240 361",
      phoneHref: "tel:+34910240361",
      ctaLabel: "Agendar visita",
      headline: "Ven a verla este fin de semana",
      sub: "Tour privado de 45 minutos con asesor. Déjanos tus datos y confirmamos tu visita hoy mismo.",
    },
    offer: { badge: "Fase 1 · Últimas 2 villas disponibles", unitsTotal: 6, unitsLeft: 2, deadline: "2026-11-30T23:59:59" },
    rating: { value: "4.8", count: "96" },
    comparison: {
      title: "Casa Mirador frente a obra nueva premium",
      note: "Muestra de 9 villas de +300 m² en la zona (portales inmobiliarios 2026). Edítalo en el Estudio.",
      metrics: [
        { name: "Superficie", ours: 420, market: 310, unit: "m²", lowerBetter: false },
        { name: "Precio por m²", ours: 2976, market: 3850, unit: "€", lowerBetter: true },
        { name: "Domótica incluida", ours: 100, market: 35, unit: "%", lowerBetter: false },
        { name: "Garantía estructural", ours: 10, market: 5, unit: "años", lowerBetter: false },
      ],
    },
    testimonials: [
      { stars: 5, text: "El tour virtual nos convenció y la visita nos enamoró. Escritura en 40 días, todo transparente.", name: "Elena y Marco", place: "Pozuelo" },
      { stars: 5, text: "La domótica ya venía configurada a nuestro gusto el día de la entrega. Nivel de detalle brutal.", name: "David S.", place: "Madrid" },
      { stars: 5, text: "Compramos sobre plano con miedo y fue la mejor decisión: nos avisaban de cada avance con fotos.", name: "Paula R.", place: "Boadilla" },
    ],
    trust: [
      { icon: "🏦", title: "Hipoteca preaprobada", sub: "En 48 h con 3 bancos" },
      { icon: "🥽", title: "Tour 360° + visita", sub: "Privada de 45 minutos" },
      { icon: "🛡️", title: "Garantía 10 años", sub: "Estructura e instalaciones" },
      { icon: "🔑", title: "Llave en mano", sub: "Equipada y configurada" },
    ],
    socialProof: [
      { name: "Carmen D.", detail: "agendó visita el sábado", time: "hace 1 h" },
      { name: "Roberto P.", detail: "pidió el tour 360°", time: "hace 4 h" },
      { name: "Familia N.", detail: "reservó la villa 7", time: "esta semana" },
    ],
    accent: "#2ecc71",
    totalFrames: 72,
    // Secuencia fotográfica real (verificada, alta resolución). El canvas
    // funde entre ellas con zoom Ken Burns según el scroll.
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1920&auto=format&fit=crop",
    ],
    heroSpecs: [
      { value: "420 m²", label: "Superficie construida" },
      { value: "4 + 5", label: "Suites y baños" },
      { value: "A+", label: "Certificación energética" },
    ],
    sections: [
      { num: "01 / UBICACIÓN", align: "left", title: "Sobre la ciudad, dentro del bosque", text: "A 12 minutos del centro y a un mundo de distancia del ruido. Parcela de 1.800 m² con orientación sur y atardeceres de postal.", stats: [{ value: "180°", label: "Vistas al valle" }, { value: "1.800 m²", label: "Parcela privada" }] },
      { num: "02 / DISEÑO", align: "right", title: "Piedra, vidrio y calma", text: "Doble altura en el salón, ventanales correderos de 6 metros y un patio interior que mete el jardín en el corazón de la casa.", stats: [{ value: "6 m", label: "Ventanal corrido" }, { value: "5.2 m", label: "Techo a doble altura" }] },
      { num: "03 / SMART HOME", align: "center", title: "Una casa que piensa contigo", text: "Clima por zonas, persianas y luz circadiana automatizadas, seguridad perimetral con IA y consumo monitorizado en tiempo real.", stats: [{ value: "100%", label: "Domótica KNX" }, { value: "−60%", label: "Consumo vs. estándar" }] },
      { num: "04 / EXTERIOR", align: "left", title: "El horizonte como vecino", text: "Piscina infinita climatizada, deck de ipe, cocina exterior y huerto smart. El verano, extendido de abril a noviembre.", stats: [{ value: "18 m", label: "Piscina infinita" }, { value: "120 m²", label: "Terraza + deck" }] },
    ],
    finale: {
      title: "Casa Mirador · Ficha técnica",
      specs: [
        { k: "Ubicación", v: "Lomas, Lote 14" }, { k: "Superficie", v: "420 m²" },
        { k: "Habitaciones", v: "4 suites" }, { k: "Parcela", v: "1.800 m²" },
        { k: "Energía", v: "A+ · Solar" }, { k: "Precio", v: "€1.250.000" },
      ],
    },
  },

  laptop: {
    id: "laptop",
    kicker: "SERIE NÉBULA · NUEVO 2026",
    title: "NÉBULA",
    titleThin: "X16 Pro",
    subtitle: "La laptop que renderiza mientras juegas: RTX dedicada, Mini-LED a 240 Hz y refrigeración de cámara de vapor en 1.9 kg de aluminio.",
    price: "€2.499",
    priceNote: "16″ Mini-LED · 32 GB",
    cta: "Configurar la mía",
    // ⚙️ CONVERSIÓN — edita estos valores con tus datos reales:
    contact: {
      whatsapp: "", // ← TU NÚMERO en formato internacional sin "+" (ej. "34600123123"). Vacío = modo demo.
      phoneDisplay: "+34 910 240 362",
      phoneHref: "tel:+34910240362",
      ctaLabel: "Comprar ahora",
      headline: "Estrénala esta semana",
      sub: "Envío gratis en 24 h y 30 días de devolución. Déjanos tus datos y un especialista confirma tu configuración.",
    },
    offer: { badge: "Lanzamiento −15% + envío gratis 24 h", unitsTotal: 50, unitsLeft: 17, deadline: "2026-10-31T23:59:59" },
    rating: { value: "4.9", count: "341" },
    comparison: {
      title: "Nébula X16 Pro frente a la gama alta",
      note: "8 laptops de creador/gaming 2026 del mismo rango de precio. Edítalo en el Estudio.",
      metrics: [
        { name: "Rendimiento CPU", ours: 32, market: 21, unit: "k pts", lowerBetter: false },
        { name: "Batería real", ours: 22, market: 12, unit: "h", lowerBetter: false },
        { name: "Peso", ours: 1.9, market: 2.4, unit: "kg", lowerBetter: true },
        { name: "Precio 32 GB", ours: 2499, market: 2899, unit: "€", lowerBetter: true },
      ],
    },
    testimonials: [
      { stars: 5, text: "Renderizo en Premiere mientras juego. 32 dB reales: mi micro por fin no capta los ventiladores.", name: "Iván G.", place: "Streamer · Sevilla" },
      { stars: 5, text: "Compilo el monorepo en la mitad de tiempo que con mi sobremesa. La pantalla Mini-LED es otro nivel.", name: "Marta Q.", place: "Dev · Bilbao" },
      { stars: 5, text: "La compré un lunes y el martes ya trabajaba con ella. Devolución de 30 días que no necesité.", name: "Hugo T.", place: "Diseñador 3D · Valencia" },
    ],
    trust: [
      { icon: "↩️", title: "Devolución 30 días", sub: "Sin preguntas" },
      { icon: "🛡️", title: "Garantía 3 años", sub: "Batería incluida" },
      { icon: "🚀", title: "Envío 24 h gratis", sub: "Toda la península" },
      { icon: "💳", title: "Pago a plazos", sub: "Hasta 24 meses" },
    ],
    socialProof: [
      { name: "Alex M.", detail: "compró la config de 32 GB", time: "hace 3 h" },
      { name: "Norma V.", detail: "la financió a 12 meses", time: "hace 6 h" },
      { name: "Diego F.", detail: "jubila su sobremesa", time: "ayer" },
    ],
    accent: "#7c5cff",
    totalFrames: 72,
    // Secuencia fotográfica real (verificada, alta resolución). El canvas
    // funde entre ellas con zoom Ken Burns según el scroll.
    images: [
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=1920&auto=format&fit=crop",
    ],
    heroSpecs: [
      { value: "i9 + RTX", label: "CPU 24 núcleos / GPU 12 GB" },
      { value: "240 Hz", label: "Mini-LED 16″ QHD+" },
      { value: "22 h", label: "Autonomía mixta*" },
    ],
    sections: [
      { num: "01 / RENDIMIENTO", align: "left", title: "Potencia de sobremesa", text: "Procesador de 24 núcleos y GPU RTX con 12 GB dedicados. Compila, renderiza y juega a la vez sin despeinarse: +68% multihilo frente a la generación anterior.", stats: [{ value: "+68%", label: "Multihilo" }, { value: "140 W", label: "TGP dinámico" }] },
      { num: "02 / PANTALLA", align: "right", title: "Mini-LED que deslumbra", text: "1.152 zonas de atenuación local, 1.200 nits de pico y 100% DCI-P3 calibrado de fábrica. Negros OLED con brillo de exterior.", stats: [{ value: "240 Hz", label: "Refresco" }, { value: "1.200 nits", label: "Brillo pico" }] },
      { num: "03 / REFRIGERACIÓN", align: "center", title: "Fría bajo presión", text: "Doble ventilador de 89 aspas, cámara de vapor full-width y metal líquido. 32 dB a plena carga: más silenciosa que una biblioteca.", stats: [{ value: "32 dB", label: "A plena carga" }, { value: "−14 °C", label: "vs. heat-pipes" }] },
      { num: "04 / DISEÑO", align: "left", title: "1.9 kg de aluminio", text: "Unibody CNC de 16.9 mm, teclado per-key RGB de bajo perfil y huella dactilar en el botón de encendido. Viaja contigo a todas partes.", stats: [{ value: "1.9 kg", label: "Peso total" }, { value: "16.9 mm", label: "Grosor" }] },
    ],
    finale: {
      title: "Nébula X16 Pro · Ficha técnica",
      specs: [
        { k: "CPU", v: "i9 · 24 núcleos" }, { k: "GPU", v: "RTX 12 GB" },
        { k: "RAM / SSD", v: "32 GB / 2 TB" }, { k: "Pantalla", v: "16″ 240 Hz" },
        { k: "Batería", v: "99 Wh · 22 h*" }, { k: "Precio", v: "€2.499" },
      ],
    },
  },
};

const PRODUCT_ORDER = ["deportivo", "casa", "laptop"];

/* ============================================================================
   // MODULE 2: CANVAS & ASSET PRELOADER ........ fotos HD + Ken Burns + DPR
   ----------------------------------------------------------------------------
   - Buffer asíncrono de objetos Image() en memoria (fotos HD con timeout).
   - Render cinematográfico: fundido encadenado + zoom Ken Burns según scroll.
   - Mapeo scroll→foto: pos = progress * (total-1); la fracción = fundido.
   - DPR: canvas.width = cssW * devicePixelRatio (nitidez Retina/4K).
   - Dibujo con técnica "cover": la foto rellena el viewport sin deformarse.
   - Bucle rAF con interpolación (lerp): dibuja solo cuando hay cambio → 60FPS.
   - Respaldo procedural: si una foto falla, se genera un frame vectorial.
   ========================================================================== */
const CanvasEngine = (() => {
  const canvas = document.getElementById("scrollyCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const frameCounter = document.getElementById("frameCounter");

  // Dimensiones internas de cada frame generado (16:9, liviano para 60 FPS)
  const FW = 960;
  const FH = 540;

  // Caché por producto: Map<productId, HTMLImageElement[]>
  const frameCache = new Map();

  // Estado de render cinematográfico: pos flotante 0..(total-1) dictada por
  // el scroll, cur = versión suavizada (lerp). La parte fraccional = fundido.
  const state = { frames: [], total: 0, pos: 0, cur: -1, raf: 0, running: false };
  let dpr = 1;

  /* Ajusta el tamaño real del canvas al viewport × DPR (evita borrosidad). */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // tope 2: equilibrio Retina/perf
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    state.cur = -1; // fuerza repintado tras resize
    if (state.total) { state.cur = state.pos; drawCurrent(); }
  }

  /* Dibuja un Image con ajuste "cover" + zoom y paneo (efecto Ken Burns).
     zoom 1.0 = encaje exacto; panX desplaza en píxeles físicos. */
  function drawCoverZoom(img, zoom, panX, alpha) {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.width, ch / img.height) * zoom;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (cw - dw) / 2 + panX;
    const dy = (ch - dh) / 2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }

  /* Render cinematográfico: foto base con zoom-in progresivo + fundido a la
     siguiente. El zoom viaja de 1.06 → 1.14 dentro de cada segmento y el
     paneo alterna dirección por foto para variedad visual. */
  function drawCurrent() {
    if (!state.frames.length) return;
    const cur = Math.max(0, Math.min(state.total - 1, state.cur));
    const i0 = Math.floor(cur);
    const f = cur - i0; // 0..1 = fundido entre i0 e i1
    const i1 = Math.min(i0 + 1, state.total - 1);
    ctx.fillStyle = "#060608";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const a = state.frames[i0];
    const b = state.frames[i1];
    if (a && a.complete && a.naturalWidth > 0) {
      drawCoverZoom(a, 1.06 + 0.08 * f, (i0 % 2 === 0 ? 1 : -1) * f * 26 * dpr, 1);
    }
    if (b && f > 0.001 && b.complete && b.naturalWidth > 0) {
      drawCoverZoom(b, 1.06, (i1 % 2 === 0 ? -1 : 1) * (1 - f) * 26 * dpr, Math.min(1, f * 1.2));
    }
    const total = String(state.total).padStart(2, "0");
    frameCounter.textContent = "FOTO " + String(i0 + 1).padStart(2, "0") + " / " + total;
  }

  /* Bucle rAF: interpola cur→pos (0.1) y dibuja solo si hubo cambio.
     Esto desacopla el scroll del pintado y mantiene 60 FPS estables. */
  function loop() {
    const diff = state.pos - state.cur;
    if (Math.abs(diff) > 0.0006) {
      state.cur += diff * 0.1;
      if (Math.abs(state.pos - state.cur) < 0.004) state.cur = state.pos;
      drawCurrent();
    }
    state.raf = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!state.running) {
      state.running = true;
      state.raf = requestAnimationFrame(loop);
    }
  }

  /* API que usa el motor de scroll: convierte progreso 0..1 en posición
     flotante 0..(total-1). La fracción decimal produce el fundido. */
  function setProgress(progress) {
    if (!state.total) return;
    const p = Math.max(0, Math.min(1, progress));
    state.pos = p * (state.total - 1);
    // Hook para overlays externos (ej. edición holograma): notifica el
    // progreso crudo 0..1 sin acoplar el motor principal. No-op si no existe.
    if (window.__holoTarget) { try { window.__holoTarget(p); } catch (e) { /* noop */ } }
  }

  function setFrames(images) {
    state.frames = images;
    state.total = images.length;
    state.pos = 0;
    state.cur = 0;
    drawCurrent();
    startLoop();
  }

  /* ---------- Generador procedural de frames (cero dependencias externas) ----
     Cada frame es una escena vectorial dibujada en un canvas offscreen de
     960×540, con un elemento "3D" rotando según angle=(i/total)*2π:
       · deportivo → superdeportivo lateral + ruedas que giran + líneas de velocidad
       · casa      → casa isométrica + sol orbitando + árboles con sway
       · laptop    → laptop frontal + cubo 3D rotando + partículas de datos
     El offscreen se convierte a objeto Image() (requisito del buffer) vía
     dataURL y se espera a img.decode() antes de almacenarlo. */
  function paintScene(off, product, i, total) {
    const c = off.getContext("2d");
    const W = FW, H = FH;
    const angle = (i / total) * Math.PI * 2;
    const t = i / total;

    // Fondo: degradado vertical + halo del color de acento
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#101018");
    bg.addColorStop(0.55, "#0a0a10");
    bg.addColorStop(1, "#060608");
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // Halo radial que respira con el scroll
    const glowR = 300 + Math.sin(angle) * 40;
    const glow = c.createRadialGradient(W / 2, H * 0.46, 20, W / 2, H * 0.46, glowR);
    glow.addColorStop(0, product.accent + "55");
    glow.addColorStop(1, "transparent");
    c.fillStyle = glow;
    c.fillRect(0, 0, W, H);

    // Rejilla de suelo en perspectiva
    c.strokeStyle = "rgba(255,255,255,0.07)";
    c.lineWidth = 1;
    const horizon = H * 0.72;
    c.beginPath(); c.moveTo(0, horizon); c.lineTo(W, horizon); c.stroke();
    for (let g = 0; g <= 16; g++) {
      const x = (g / 16) * W;
      c.beginPath(); c.moveTo(W / 2 + (x - W / 2) * 0.25, horizon); c.lineTo(x, H); c.stroke();
    }

    // Partículas orbitales (profundidad 3D simulada con seno/coseno)
    for (let p = 0; p < 26; p++) {
      const pa = angle * (0.6 + (p % 5) * 0.15) + p * 1.7;
      const px = W / 2 + Math.cos(pa) * (180 + (p % 7) * 34);
      const py = H * 0.44 + Math.sin(pa) * (90 + (p % 4) * 22);
      const pr = 1 + (p % 3);
      c.fillStyle = p % 4 === 0 ? product.accent : "rgba(255,255,255,0.5)";
      c.globalAlpha = 0.35 + 0.3 * Math.abs(Math.sin(pa));
      c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    if (product.id === "deportivo") paintCar(c, W, H, angle, t, product);
    else if (product.id === "casa") paintHouse(c, W, H, angle, t, product);
    else paintLaptop(c, W, H, angle, t, product);

    // Placa del número de frame (HUD del demo)
    c.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(c, W - 178, 22, 156, 44, 10); c.fill();
    c.strokeStyle = product.accent; c.lineWidth = 1.5;
    roundRect(c, W - 178, 22, 156, 44, 10); c.stroke();
    c.fillStyle = "#fff";
    c.font = "700 22px Inter, sans-serif";
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("FRAME " + String(i).padStart(3, "0"), W - 100, 45);
    c.fillStyle = "rgba(255,255,255,0.55)";
    c.font = "600 12px Inter, sans-serif";
    c.fillText(product.title + " " + product.titleThin, W / 2, H - 26);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* Superdeportivo lateral: carrocería, cabina, ruedas con rotación real. */
  function paintCar(c, W, H, angle, t, product) {
    const cx = W / 2, gy = H * 0.72;
    const bob = Math.sin(angle * 2) * 4;

    // Sombra
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.beginPath(); c.ellipse(cx, gy + 44, 250, 26, 0, 0, Math.PI * 2); c.fill();
    // Reflejo bajo el coche
    c.fillStyle = product.accent + "33";
    c.beginPath(); c.ellipse(cx, gy + 40, 200, 12, 0, 0, Math.PI * 2); c.fill();

    // Líneas de velocidad (densidad ligada al progreso t)
    c.strokeStyle = "rgba(255,255,255,0.18)";
    c.lineWidth = 2;
    const lines = 4 + Math.floor(t * 8);
    for (let s = 0; s < lines; s++) {
      const ly = gy - 120 + s * 26 + Math.sin(angle * 3 + s) * 6;
      const len = 90 + ((s * 67) % 140);
      const lx = W - 60 - ((t * 900 + s * 160) % 900);
      c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + len, ly); c.stroke();
    }

    // Carrocería
    const bodyY = gy - 70 + bob;
    const grad = c.createLinearGradient(0, bodyY - 60, 0, bodyY + 30);
    grad.addColorStop(0, "#3a3a46");
    grad.addColorStop(0.5, "#1b1b24");
    grad.addColorStop(1, "#0c0c12");
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(cx - 240, bodyY + 20);
    c.quadraticCurveTo(cx - 235, bodyY - 12, cx - 170, bodyY - 16);
    c.quadraticCurveTo(cx - 120, bodyY - 62, cx - 40, bodyY - 60);   // capó→techo
    c.quadraticCurveTo(cx + 60, bodyY - 58, cx + 110, bodyY - 18);   // techo→cola
    c.quadraticCurveTo(cx + 200, bodyY - 14, cx + 235, bodyY + 8);
    c.quadraticCurveTo(cx + 240, bodyY + 22, cx + 220, bodyY + 22);
    c.lineTo(cx - 220, bodyY + 22);
    c.closePath(); c.fill();
    c.strokeStyle = product.accent; c.lineWidth = 2.5; c.stroke();

    // Cabina (cristal)
    c.fillStyle = "rgba(140,190,255,0.35)";
    c.beginPath();
    c.moveTo(cx - 110, bodyY - 18);
    c.quadraticCurveTo(cx - 70, bodyY - 54, cx - 10, bodyY - 54);
    c.quadraticCurveTo(cx + 60, bodyY - 52, cx + 95, bodyY - 18);
    c.closePath(); c.fill();

    // Franja de acento + faro
    c.fillStyle = product.accent;
    c.fillRect(cx - 170, bodyY + 2, 340, 4);
    c.fillStyle = "#ffe9c4";
    c.beginPath(); c.ellipse(cx + 228, bodyY - 2, 8, 5, 0, 0, Math.PI * 2); c.fill();

    // Ruedas con radios que giran con `angle`
    drawWheel(c, cx - 150, gy + 18, 44, angle * 4, product);
    drawWheel(c, cx + 155, gy + 18, 44, angle * 4, product);
  }

  function drawWheel(c, x, y, r, rot, product) {
    c.fillStyle = "#050507";
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#2c2c38"; c.lineWidth = 5;
    c.beginPath(); c.arc(x, y, r - 3, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = product.accent; c.lineWidth = 4;
    for (let k = 0; k < 5; k++) {
      const a = rot + (k / 5) * Math.PI * 2;
      c.beginPath(); c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * (r - 8), y + Math.sin(a) * (r - 8)); c.stroke();
    }
    c.fillStyle = "#888";
    c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
  }

  /* Casa isométrica: base, tejado, ventanas cálidas, sol orbitando. */
  function paintHouse(c, W, H, angle, t, product) {
    const cx = W / 2, gy = H * 0.72;
    const sway = Math.sin(angle) * 5;

    // Sol / luna orbitando (ciclo día-noche ligado al scroll)
    const sx = cx + Math.cos(angle) * 300;
    const sy = H * 0.3 + Math.sin(angle) * 90;
    const sun = c.createRadialGradient(sx, sy, 4, sx, sy, 60);
    sun.addColorStop(0, "#ffe9a8"); sun.addColorStop(1, "transparent");
    c.fillStyle = sun;
    c.beginPath(); c.arc(sx, sy, 60, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffe9a8";
    c.beginPath(); c.arc(sx, sy, 20, 0, Math.PI * 2); c.fill();

    // Sombra base
    c.fillStyle = "rgba(0,0,0,0.5)";
    c.beginPath(); c.ellipse(cx, gy + 52, 260, 24, 0, 0, Math.PI * 2); c.fill();

    // Cuerpo principal
    c.fillStyle = "#1d212b";
    c.fillRect(cx - 190, gy - 110, 380, 150);
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 2;
    c.strokeRect(cx - 190, gy - 110, 380, 150);

    // Tejado a dos aguas
    c.fillStyle = "#2b303d";
    c.beginPath();
    c.moveTo(cx - 220, gy - 108);
    c.lineTo(cx, gy - 200 + sway * 0.4);
    c.lineTo(cx + 220, gy - 108);
    c.closePath(); c.fill();
    c.strokeStyle = product.accent; c.lineWidth = 3; c.stroke();

    // Ventanas iluminadas (parpadeo sutil con el frame)
    for (let wnd = 0; wnd < 4; wnd++) {
      const wx = cx - 150 + wnd * 85;
      const lit = 0.55 + 0.25 * Math.sin(angle * 2 + wnd * 1.3);
      c.fillStyle = "rgba(255,214,130," + lit.toFixed(2) + ")";
      c.fillRect(wx, gy - 70, 52, 66);
      c.strokeStyle = "rgba(0,0,0,0.6)"; c.lineWidth = 3;
      c.strokeRect(wx, gy - 70, 52, 66);
      c.beginPath();
      c.moveTo(wx + 26, gy - 70); c.lineTo(wx + 26, gy - 4);
      c.moveTo(wx, gy - 37); c.lineTo(wx + 52, gy - 37);
      c.stroke();
    }

    // Puerta
    c.fillStyle = product.accent;
    roundRect(c, cx - 28, gy - 38, 56, 78, 6); c.fill();

    // Árboles laterales con balanceo
    drawTree(c, cx - 280, gy + 40, 1 + 0.1 * Math.sin(angle * 2), product);
    drawTree(c, cx + 280, gy + 40, 1 - 0.1 * Math.sin(angle * 2), product);
  }

  function drawTree(c, x, y, s, product) {
    c.fillStyle = "#4a3524";
    c.fillRect(x - 5, y - 40 * s, 10, 40 * s);
    c.fillStyle = "#1f6b3f";
    c.beginPath(); c.arc(x, y - 70 * s, 30 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = product.accent + "55";
    c.beginPath(); c.arc(x - 10 * s, y - 78 * s, 12 * s, 0, Math.PI * 2); c.fill();
  }

  /* Laptop frontal: pantalla con código, teclado y cubo 3D rotando encima. */
  function paintLaptop(c, W, H, angle, t, product) {
    const cx = W / 2, gy = H * 0.72;

    // Cubo 3D wireframe rotando (rotación real ligada al scroll)
    drawCube(c, cx, H * 0.24, 46, angle, product);

    // Resplandor de pantalla
    const scr = c.createLinearGradient(0, gy - 220, 0, gy - 40);
    scr.addColorStop(0, product.accent + "66");
    scr.addColorStop(1, "#14141f");
    c.fillStyle = scr;
    roundRect(c, cx - 210, gy - 230, 420, 200, 12); c.fill();
    c.strokeStyle = "#3a3a4a"; c.lineWidth = 4;
    roundRect(c, cx - 210, gy - 230, 420, 200, 12); c.stroke();

    // Líneas de código simuladas (avanzan con t)
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    for (let ln = 0; ln < 8; ln++) {
      const ly = gy - 196 + ln * 21;
      const indent = 24 + ((ln * 37) % 60);
      const total_w = 200 - ((ln * 53) % 110);
      const done = ((t * 10 + ln * 0.7) % 1);
      c.fillStyle = "rgba(255,255,255,0.12)";
      roundRect(c, cx - 186 + indent, ly - 9, total_w, 9, 4); c.fill();
      c.fillStyle = ln % 3 === 0 ? product.accent : "rgba(160,220,255,0.85)";
      roundRect(c, cx - 186 + indent, ly - 9, Math.max(14, total_w * done), 9, 4); c.fill();
    }

    // Base / teclado en perspectiva
    c.fillStyle = "#23232f";
    c.beginPath();
    c.moveTo(cx - 250, gy - 26);
    c.lineTo(cx + 250, gy - 26);
    c.lineTo(cx + 290, gy + 34);
    c.lineTo(cx - 290, gy + 34);
    c.closePath(); c.fill();
    c.strokeStyle = product.accent; c.lineWidth = 2.5; c.stroke();
    // Teclas
    c.fillStyle = "rgba(255,255,255,0.14)";
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 12; k++) {
        const kx = cx - 200 + k * 35 + r * 8;
        const ky = gy - 14 + r * 15;
        c.fillRect(kx, ky, 26, 8);
      }
    }
    // Trackpad
    c.strokeStyle = "rgba(255,255,255,0.25)"; c.lineWidth = 1.5;
    c.strokeRect(cx - 55, gy + 2, 110, 24);
  }

  /* Cubo wireframe con proyección 3D→2D (rotación Y + X). */
  function drawCube(c, cx, cy, size, angle, product) {
    const verts = [];
    for (const [x, y, z] of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]) {
      // Rotación Y
      const x1 = x * Math.cos(angle) - z * Math.sin(angle);
      const z1 = x * Math.sin(angle) + z * Math.cos(angle);
      // Rotación X (mitad de velocidad)
      const y2 = y * Math.cos(angle * 0.5) - z1 * Math.sin(angle * 0.5);
      const z2 = y * Math.sin(angle * 0.5) + z1 * Math.cos(angle * 0.5);
      const persp = 1 / (2.4 - z2 * 0.6);
      verts.push([cx + x1 * size * persp * 1.6, cy + y2 * size * persp * 1.6]);
    }
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    c.strokeStyle = product.accent; c.lineWidth = 3;
    c.shadowColor = product.accent; c.shadowBlur = 18;
    c.beginPath();
    for (const [a, b] of edges) {
      c.moveTo(verts[a][0], verts[a][1]);
      c.lineTo(verts[b][0], verts[b][1]);
    }
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = "#fff";
    for (const [vx, vy] of verts) {
      c.beginPath(); c.arc(vx, vy, 3.5, 0, Math.PI * 2); c.fill();
    }
  }

  /* Precargador asíncrono: descarga las fotos HD del producto a objetos
     Image() en memoria, con progreso real y timeout de 15 s por foto.
     Si una foto falla (sin conexión), se genera un frame procedural de
     respaldo con el motor vectorial (paintScene): la demo nunca se rompe.
     Los resultados se cachean por producto para cambios instantáneos. */
  async function preload(product, onProgress) {
    if (frameCache.has(product.id)) {
      const cached = frameCache.get(product.id);
      setFrames(cached);
      return cached;
    }
    const urls = product.images || [];
    const total = urls.length || product.totalFrames;
    const images = new Array(total);
    const off = document.createElement("canvas");
    off.width = FW;
    off.height = FH;

    for (let i = 0; i < total; i++) {
      if (urls[i]) images[i] = await loadPhoto(urls[i]);
      if (!images[i]) images[i] = await proceduralFallback(off, product, i, total);
      if (onProgress) onProgress((i + 1) / total);
      // Pinta la primera foto de inmediato para feedback instantáneo
      if (i === 0) {
        state.frames = images;
        state.total = total;
        state.pos = 0;
        state.cur = 0;
        drawCurrent();
        startLoop();
      }
      await new Promise((r) => setTimeout(r, 0)); // cede el hilo, UI fluida
    }
    frameCache.set(product.id, images);
    setFrames(images);
    return images;
  }

  /* Carga una foto con timeout: resuelve con el Image o null si falla. */
  function loadPhoto(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) { settled = true; resolve(null); }
      }, 15000);
      img.onload = () => {
        if (!settled) {
          settled = true; clearTimeout(timer);
          resolve(img.naturalWidth > 0 ? img : null);
        }
      };
      img.onerror = () => {
        if (!settled) { settled = true; clearTimeout(timer); resolve(null); }
      };
      img.src = url;
    });
  }

  /* Respaldo procedural: pinta la escena vectorial y la envuelve en Image(). */
  function proceduralFallback(off, product, i, total) {
    return new Promise((resolve) => {
      paintScene(off, product, i, total);
      const fb = new Image();
      fb.onload = () => resolve(fb);
      fb.onerror = () => resolve(fb);
      fb.src = off.toDataURL("image/jpeg", 0.82);
    });
  }

  window.addEventListener("resize", () => {
    clearTimeout(window.__scrollyResizeT);
    window.__scrollyResizeT = setTimeout(resize, 120); // debounce: evita relayouts
  });

  resize();
  return { preload, setProgress, resize };
})();

/* ============================================================================
   // MODULE 3: SCROLLTRIGGER & GSAP ANIMATION ENGINE
   ----------------------------------------------------------------------------
   - Lenis para smooth-scroll (con fallback custom si el CDN falla).
   - ScrollTrigger maestro con scrub: 0.5 → progreso 0..1 = índice de frame.
   - Waypoints: cada .panel__card entra con fromTo (fade + rise).
   - Barra de progreso superior sincronizada con el mismo ScrollTrigger.
   ========================================================================== */
const ScrollEngine = (() => {
  let lenis = null;
  let masterST = null;

  /* Smooth scroll: Lenis + sincronización con el ticker de GSAP (recomendado
     oficialmente para evitar doble rAF y mantener 60 FPS). */
  function initSmooth() {
    try {
      if (typeof Lenis !== "undefined") {
        lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      } else {
        // Fallback custom: lerp sobre scroll nativo si Lenis no cargó
        let targetY = window.scrollY, smoothY = targetY, ticking = false;
        window.addEventListener("wheel", () => { ticking = true; }, { passive: true });
        gsap.ticker.add(() => {
          targetY = window.scrollY;
          smoothY += (targetY - smoothY) * 0.12;
          if (Math.abs(targetY - smoothY) > 0.5 && ticking) ScrollTrigger.update();
        });
      }
    } catch (e) {
      console.warn("[Scrolly] Lenis no disponible, usando scroll nativo.", e);
    }
  }

  /* ScrollTrigger maestro: mapea todo el contenido a progreso 0→1. */
  function initMaster() {
    const bar = document.getElementById("scrollProgressBar");
    masterST = ScrollTrigger.create({
      trigger: "#scrollContent",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5, // respuesta suave con inercia (espec del framework)
      onUpdate: (self) => {
        CanvasEngine.setProgress(self.progress);
        bar.style.transform = "scaleX(" + self.progress + ")";
      },
    });
  }

  /* Waypoints narrativos: cada tarjeta se revela al entrar al viewport. */
  function initWaypoints() {
    // Sticky CTA: aparece al salir del hero, se oculta al volver arriba.
    // (Se recrea con cada producto porque destroy() mata todos los triggers.)
    const sticky = document.getElementById("stickyCta");
    if (sticky) {
      ScrollTrigger.create({
        trigger: "#heroSection",
        start: "bottom 65%",
        end: "max",
        onEnter: () => sticky.classList.add("is-visible"),
        onLeaveBack: () => sticky.classList.remove("is-visible"),
      });
    }
    gsap.utils.toArray(".panel__card").forEach((card) => {
      gsap.fromTo(
        card,
        { y: 70, opacity: 0, scale: 0.97 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 82%", end: "top 38%", scrub: 0.6 },
        }
      );
    });

    // Hero: entrada cinematográfica al cargar
    gsap.fromTo(
      ".hero > *",
      { y: 46, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.09, delay: 0.15 }
    );

    // Finale: zoom suave de la ficha
    gsap.fromTo(
      ".finale__card",
      { y: 60, opacity: 0, scale: 0.96 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".finale__card", start: "top 80%", end: "top 45%", scrub: 0.6 },
      }
    );
  }

  /* Desplaza a un selector con Lenis (offset para la demo-bar fija). */
  function scrollToEl(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  function scrollTop(instant) {
    if (lenis) {
      if (instant) lenis.scrollTo(0, { immediate: true });
      else lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
    }
  }

  /* Destruye triggers del producto anterior antes de re-renderizar. */
  function destroy() {
    ScrollTrigger.getAll().forEach((st) => st.kill());
    masterST = null;
  }

  function rebuild() {
    ScrollTrigger.refresh();
  }

  return { initSmooth, initMaster, initWaypoints, destroy, rebuild, scrollTop, scrollToEl };
})();

/* ============================================================================
   // MODULE 4: TEMPLATE RENDERER & INTERACTION CONTROLLER
   ----------------------------------------------------------------------------
   - Renderiza hero, waypoints y finale 100% desde PRODUCT_DATA (data-driven).
   - Selector flotante de "Modo Demostración": cambia de producto en caliente
     (mata triggers, precarga/carga caché, re-renderiza, refresca ScrollTrigger).
   - Respeta prefers-reduced-motion: desactiva scrub suavizado agresivo.
   ========================================================================== */
const App = (() => {
  const preloader = document.getElementById("preloader");
  const preloaderBar = document.getElementById("preloaderBar");
  const preloaderPct = document.getElementById("preloaderPct");
  const preloaderTitle = document.getElementById("preloaderTitle");
  const preloaderKicker = document.getElementById("preloaderKicker");
  const demoDot = document.getElementById("demoDot");

  let currentId = "deportivo";
  let switching = false;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Pinta hero + narrativa + finale desde el objeto de datos. */
  function render(product) {
    document.documentElement.style.setProperty("--accent", product.accent);
    document.documentElement.style.setProperty("--accent-soft", product.accent + "29");
    document.body.dataset.product = product.id;
    demoDot.style.background = product.accent;
    demoDot.style.boxShadow = "0 0 12px " + product.accent;

    // Hero
    document.getElementById("heroKicker").textContent = product.kicker;
    document.getElementById("heroTitle").innerHTML =
      escapeHtml(product.title) + ' <span class="thin">' + escapeHtml(product.titleThin) + "</span>";
    document.getElementById("heroSubtitle").textContent = product.subtitle;
    document.getElementById("heroCta").textContent = product.cta;
    document.getElementById("heroPrice").innerHTML =
      "<small>" + escapeHtml(product.priceNote) + "</small>" + escapeHtml(product.price);
    document.getElementById("heroSpecs").innerHTML = product.heroSpecs
      .map((s) => '<div class="spec-chip"><b>' + escapeHtml(s.value) + "</b><span>" + escapeHtml(s.label) + "</span></div>")
      .join("");

    // Waypoints narrativos
    const narrative = document.getElementById("narrative");
    narrative.innerHTML = product.sections
      .map(
        (s) =>
          '<section class="panel panel--' + s.align + '">' +
          '<article class="panel__card">' +
          '<span class="panel__num">' + escapeHtml(s.num) + "</span>" +
          "<h2>" + escapeHtml(s.title) + "</h2>" +
          "<p>" + escapeHtml(s.text) + "</p>" +
          '<div class="panel__stat">' +
          s.stats.map((st) => "<div><b>" + escapeHtml(st.value) + "</b><span>" + escapeHtml(st.label) + "</span></div>").join("") +
          "</div></article></section>"
      )
      .join("");

    // Finale
    document.getElementById("finaleTitle").textContent = product.finale.title;
    document.getElementById("finaleGrid").innerHTML = product.finale.specs
      .map((sp) => "<div><dt>" + escapeHtml(sp.k) + "</dt><dd>" + escapeHtml(sp.v) + "</dd></div>")
      .join("");

    // Botones del switcher
    document.querySelectorAll("[data-product-btn]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.productBtn === product.id);
    });

    renderConversion(product); // pack conversión: oferta, prueba social, lead, SEO
  }

  /* ---------- PACK CONVERSIÓN (100% data-driven) ----------
     Rellena oferta, testimonios, confianza, captación y SEO desde
     PRODUCT_DATA. Los temporizadores se registran en fxTimers para
     limpiarlos al cambiar de producto. */
  let fxTimers = [];
  let toastCount = 0;
  let leadBound = false;

  function clearFx() {
    fxTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    fxTimers = [];
    toastCount = 0;
    hideToast(true);
  }

  function renderConversion(product) {
    // Cinta de oferta en el hero
    const ribbon = document.getElementById("offerRibbon");
    if (ribbon) {
      if (product.offer && product.offer.badge) {
        ribbon.hidden = false;
        ribbon.textContent = "🔥 " + product.offer.badge;
      } else ribbon.hidden = true;
    }
    // Sticky CTA inferior
    const sp = document.getElementById("stickyPrice");
    if (sp) sp.textContent = product.price;
    const so = document.getElementById("stickyOffer");
    if (so) so.textContent = product.offer ? product.offer.badge : "";
    const sb = document.getElementById("stickyBtn");
    if (sb) sb.textContent = product.contact.ctaLabel;
    // Testimonios
    const pg = document.getElementById("proofGrid");
    if (pg) pg.innerHTML = product.testimonials.map((tm) =>
      '<article class="proof-card"><div class="stars">' + "★".repeat(tm.stars) +
      "</div><p>\u201C" + escapeHtml(tm.text) + "\u201D</p><footer><b>" +
      escapeHtml(tm.name) + "</b> · " + escapeHtml(tm.place) + "</footer></article>"
    ).join("");
    // Sellos de confianza
    const tr = document.getElementById("trustRow");
    if (tr) tr.innerHTML = product.trust.map((t) =>
      "<div><i>" + t.icon + "</i><div><b>" + escapeHtml(t.title) + "</b><span>" +
      escapeHtml(t.sub) + "</span></div></div>"
    ).join("");
    renderComparison(product);
    // Bloque de captación
    const lt = document.getElementById("leadTitle");
    if (lt) lt.textContent = product.contact.headline;
    const ls = document.getElementById("leadSub");
    if (ls) ls.textContent = product.contact.sub;
    const submit = document.getElementById("leadSubmit");
    if (submit) submit.textContent = product.contact.ctaLabel;
    const call = document.getElementById("leadCall");
    if (call) { call.textContent = product.contact.phoneDisplay; call.href = product.contact.phoneHref; }
    const okMsg = document.getElementById("leadSuccess");
    if (okMsg) okMsg.hidden = true;
    // Barra de stock (urgencia honesta: viene de tus datos)
    if (product.offer) {
      const pct = Math.round((product.offer.unitsLeft / product.offer.unitsTotal) * 100);
      document.getElementById("stockFill").style.width = pct + "%";
      document.getElementById("stockLabel").textContent =
        "⚡ Quedan " + product.offer.unitsLeft + " de " + product.offer.unitsTotal + " disponibles";
    }
    updateSEO(product);
    startCountdown(product);
    scheduleToast(product);
    if (!leadBound) { leadBound = true; bindLeadForm(); }
  }

  /* Comparativa de mercado: barras Nuestro vs Promedio con veredicto
     automático. La animación usa IntersectionObserver (coste casi nulo). */
  let compareBound = false;
  function renderComparison(product) {
    const rows = document.getElementById("compareRows");
    if (!rows || !product.comparison || !product.comparison.metrics) return;
    document.getElementById("compareTitle").textContent = product.comparison.title;
    document.getElementById("compareNote").textContent = product.comparison.note;
    let wins = 0;
    rows.innerHTML = product.comparison.metrics.map((m) => {
      const max = Math.max(m.ours, m.market, 0.0001);
      const win = m.lowerBetter ? m.ours < m.market : m.ours > m.market;
      if (win) wins++;
      return '<div class="cmp-row">' +
        '<div class="cmp-head"><b>' + escapeHtml(m.name) + "</b>" +
        (win ? '<span class="cmp-win">● NOSOTROS</span>' : '<span class="cmp-lose">○ MERCADO</span>') + "</div>" +
        '<div class="cmp-line"><span>Nuestro</span><div class="cmp-bar"><i class="' + (win ? "is-win" : "") +
        '" data-w="' + Math.round((m.ours / max) * 100) + '"></i></div><b>' +
        m.ours + " " + escapeHtml(m.unit) + "</b></div>" +
        '<div class="cmp-line dim"><span>Mercado</span><div class="cmp-bar"><i data-w="' +
        Math.round((m.market / max) * 100) + '"></i></div><b>' +
        m.market + " " + escapeHtml(m.unit) + "</b></div></div>";
    }).join("");
    const total = product.comparison.metrics.length;
    document.getElementById("compareVerdict").textContent =
      "✓ Ganamos en " + wins + " de " + total + " métricas · " + product.title + " " + product.titleThin;
    const paint = () => {
      rows.querySelectorAll(".cmp-bar i").forEach((bar) => { bar.style.width = bar.dataset.w + "%"; });
    };
    if (!compareBound) {
      compareBound = true;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { paint(); io.unobserve(en.target); }
        });
      }, { threshold: 0.25 });
      const sec = document.getElementById("comparativa");
      if (sec) io.observe(sec);
      else paint();
    } else paint();
  }

  /* SEO dinámico: título + Open Graph/Twitter + JSON-LD Product por plantilla.
     Al compartir el link en WhatsApp/Instagram se ve la tarjeta del producto. */
  function updateSEO(product) {
    const title = product.title + " " + product.titleThin + " — " + product.kicker;
    document.title = title + " | Scrollytelling";
    const setMeta = (sel, val) => {
      const m = document.querySelector(sel);
      if (m) m.setAttribute("content", val);
    };
    setMeta('meta[name="description"]', product.subtitle);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', product.subtitle);
    if (product.images && product.images[0]) setMeta('meta[property="og:image"]', product.images[0]);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', product.subtitle);
    const schema = document.getElementById("productSchema");
    if (schema) {
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title + " " + product.titleThin,
        description: product.subtitle,
        image: product.images || [],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating.value,
          reviewCount: product.rating.count,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: (product.price.match(/[\d.,]+/) || [""])[0],
          availability: "https://schema.org/InStock",
        },
      });
    }
  }

  /* Cuenta atrás de la oferta. Si la fecha ya pasó, se oculta sola. */
  function startCountdown(product) {
    const box = document.getElementById("countdownBox");
    if (!box || !product.offer || !product.offer.deadline) {
      if (box) box.style.display = "none";
      return;
    }
    box.style.display = "";
    const end = new Date(product.offer.deadline).getTime();
    const tick = () => {
      let d = Math.max(0, end - Date.now());
      if (d === 0) { box.style.display = "none"; return; }
      const dd = Math.floor(d / 864e5); d -= dd * 864e5;
      const hh = Math.floor(d / 36e5); d -= hh * 36e5;
      const mm = Math.floor(d / 6e4); d -= mm * 6e4;
      const ss = Math.floor(d / 1e3);
      document.getElementById("cdD").textContent = String(dd).padStart(2, "0");
      document.getElementById("cdH").textContent = String(hh).padStart(2, "0");
      document.getElementById("cdM").textContent = String(mm).padStart(2, "0");
      document.getElementById("cdS").textContent = String(ss).padStart(2, "0");
    };
    tick();
    fxTimers.push(setInterval(tick, 1000));
  }

  /* Formulario → WhatsApp con mensaje pre-rellenado (cero backend).
     Sin número configurado muestra confirmación en modo demo. */
  function bindLeadForm() {
    const form = document.getElementById("leadForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("leadName");
      const phone = document.getElementById("leadPhone");
      const okMsg = document.getElementById("leadSuccess");
      let valid = true;
      [name, phone].forEach((f) => {
        const bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, "").length < 6);
        f.classList.toggle("is-error", bad);
        if (bad) valid = false;
      });
      if (!valid) return;
      const product = PRODUCT_DATA[currentId];
      const text = encodeURIComponent(
        "Hola, soy " + name.value.trim() + ". Me interesa " + product.title + " " +
        product.titleThin + " (" + product.price + "). ¿Me contactan al " + phone.value.trim() + "?"
      );
      if (product.contact.whatsapp) {
        window.open("https://wa.me/" + product.contact.whatsapp + "?text=" + text, "_blank", "noopener");
        okMsg.textContent = "✓ Abriendo WhatsApp… ¡hablamos en segundos!";
      } else {
        okMsg.textContent = "✓ ¡Gracias, " + name.value.trim() +
          "! Te contactaremos hoy mismo. (Modo demo: configura contact.whatsapp en app.js)";
      }
      okMsg.hidden = false;
      form.reset();
    });
  }

  /* Toast de prueba social: rota tus casos desde PRODUCT_DATA.socialProof,
     máx. 3 vistas por producto, se pausa si la pestaña está oculta. */
  function scheduleToast(product) {
    if (!product.socialProof || !product.socialProof.length) return;
    const el = document.getElementById("proofToast");
    if (el && !el.dataset.bound) {
      el.dataset.bound = "1";
      el.addEventListener("click", () => hideToast());
    }
    const queue = () => {
      fxTimers.push(setTimeout(show, toastCount === 0 ? 9000 : 24000));
    };
    const show = () => {
      if (toastCount >= 3 || document.hidden || !document.getElementById("proofToast")) { queue(); return; }
      const item = product.socialProof[toastCount % product.socialProof.length];
      const box = document.getElementById("proofToast");
      box.innerHTML =
        '<div class="toast__avatar">' + escapeHtml(item.name.trim().charAt(0)) + "</div><div><b>" +
        escapeHtml(item.name) + " " + escapeHtml(item.detail) + "</b><span>" +
        escapeHtml(item.time) + ' · <span class="stars">★★★★★</span></span></div>';
      box.hidden = false;
      requestAnimationFrame(() => box.classList.add("is-visible"));
      toastCount++;
      fxTimers.push(setTimeout(() => hideToast(), 6000));
      queue();
    };
    queue();
  }
  function hideToast(hard) {
    const el = document.getElementById("proofToast");
    if (!el) return;
    el.classList.remove("is-visible");
    if (hard) el.hidden = true;
    else setTimeout(() => { if (!el.classList.contains("is-visible")) el.hidden = true; }, 500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function setLoading(product, active) {
    preloaderKicker.textContent = active ? "CARGANDO SECUENCIA" : "LISTO";
    preloaderTitle.textContent = product.title + " " + product.titleThin;
    preloader.classList.toggle("is-done", !active);
  }

  /* Carga (o recupera de caché) los frames y reconstruye el motor de scroll. */
  async function loadProduct(id, opts) {
    opts = opts || {};
    if (switching || (id === currentId && !opts.force)) return;
    switching = true;
    clearFx(); // detiene countdown/toast del producto anterior
    const product = PRODUCT_DATA[id];
    if (!product) { switching = false; return; }

    currentId = id;
    ScrollEngine.destroy();
    ScrollEngine.scrollTop(true);
    render(product);

    const firstLoad = !preloader.classList.contains("is-done");
    setLoading(product, true);
    preloaderBar.style.width = "0%";
    preloaderPct.textContent = "0%";

    await CanvasEngine.preload(product, (p) => {
      const pct = Math.round(p * 100);
      preloaderBar.style.width = pct + "%";
      preloaderPct.textContent = pct + "%";
    });

    ScrollEngine.initMaster();
    ScrollEngine.initWaypoints();
    ScrollEngine.rebuild();
    CanvasEngine.resize();

    // Pequeña pausa para apreciar el 100% antes de revelar
    setTimeout(() => {
      setLoading(product, false);
      switching = false;
      if (!firstLoad || !opts.silent) ScrollEngine.scrollTop(false);
    }, firstLoad ? 350 : 150);
  }

  function bindUI() {
    document.querySelectorAll("[data-product-btn]").forEach((btn) => {
      btn.addEventListener("click", () => loadProduct(btn.dataset.productBtn));
    });
    document.getElementById("replayBtn").addEventListener("click", () => ScrollEngine.scrollTop(false));
    document.getElementById("nextProductBtn").addEventListener("click", () => {
      const next = PRODUCT_ORDER[(PRODUCT_ORDER.indexOf(currentId) + 1) % PRODUCT_ORDER.length];
      loadProduct(next);
    });
    // Atajo de teclado 1/2/3 para el modo test
    window.addEventListener("keydown", (e) => {
      if (e.key === "1") loadProduct("deportivo");
      if (e.key === "2") loadProduct("casa");
      if (e.key === "3") loadProduct("laptop");
    });
    // Navegación suave a anclas (#contacto) respetando Lenis
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const sel = a.getAttribute("href");
      if (sel.length > 1 && document.querySelector(sel)) {
        e.preventDefault();
        if (window.Scrolly.goTo) window.Scrolly.goTo(sel);
      }
    });
  }

  /* Personalización local: fusiona lo editado en el Estudio (localStorage)
     sobre PRODUCT_DATA. Arrays se reemplazan, objetos se fusionan. */
  function deepMerge(base, over) {
    if (Array.isArray(over)) return over;
    if (over && typeof over === "object" && base && typeof base === "object") {
      const out = Object.assign({}, base);
      Object.keys(over).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
      return out;
    }
    return over === undefined ? base : over;
  }
  function applyOverrides() {
    try {
      const raw = localStorage.getItem("scrolly_overrides_v1");
      if (!raw) return false;
      const ov = JSON.parse(raw);
      let n = 0;
      Object.keys(ov).forEach((id) => {
        if (PRODUCT_DATA[id] && ov[id] && typeof ov[id] === "object") {
          PRODUCT_DATA[id] = deepMerge(PRODUCT_DATA[id], ov[id]);
          n++;
        }
      });
      return n > 0;
    } catch (e) { console.warn("[Scrolly] overrides inválidos, se ignoran.", e); return false; }
  }

  async function init() {
    applyOverrides(); // el Estudio puede haber personalizado el contenido
    if (reduceMotion) {
      // Accesibilidad: sin suavizado agresivo si el usuario lo pide
      try { gsap.globalTimeline.timeScale(1); } catch (e) { /* noop */ }
    }
    ScrollEngine.initSmooth();
    bindUI();
    await loadProduct(currentId, { force: true, silent: true });
  }

  // Solo auto-arranca la landing si existe su contenedor. Así el Estudio
  // (/estudio/) puede cargar este mismo app.js para reutilizar PRODUCT_DATA
  // sin ejecutar el render del showcase.
  const bootLanding = () => { if (document.getElementById("scrollContent")) init(); };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", bootLanding)
    : bootLanding();

  // API pública: permite reutilizar el framework desde consola u otro script
  // Ej: Scrolly.loadProduct("casa") · Scrolly.data
  window.Scrolly = { loadProduct, data: PRODUCT_DATA, goTo: ScrollEngine.scrollToEl };
  return { loadProduct };
})();
