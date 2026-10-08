/* ============================================================================
   admin.js — SCROLLY ESTUDIO (detrás de escenas)
   ----------------------------------------------------------------------------
   Panel de edición sin código: modifica textos, fotos, ofertas, opiniones y
   comparativas de los 3 productos. Todo se guarda en localStorage
   (clave "scrolly_overrides_v1") y la landing lo fusiona al cargar.
   Reutiliza PRODUCT_DATA de ../app.js como valores por defecto: por eso
   esta página carga app.js pero NO ejecuta la landing (ver bootLanding).

   ACCESO: puerta blanda con clave (CLAVE_ACCESO). Ojo honesto: cualquiera
   puede leer el JS público, así que esto es disuasorio, no seguridad real.
   Si algún día necesitas multiusuario de verdad, hará falta un backend.
   ========================================================================== */
(() => {
  "use strict";

  // ⚙️ CÁMBIALA: clave de acceso al Estudio.
  const CLAVE_ACCESO = "scrolly123";
  const LS_KEY = "scrolly_overrides_v1";
  const ORDER = ["deportivo", "casa", "laptop"];
  const NAMES = { deportivo: "Superdeportivo", casa: "Casa Inteligente", laptop: "Laptop Gamer" };

  const $ = (id) => document.getElementById(id);

  if (!window.Scrolly || !window.Scrolly.data) {
    document.body.innerHTML = "<p style='padding:40px'>Error: no se cargó ../app.js</p>";
    return;
  }

  /* ---------- Estado ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function deepMerge(base, over) {
    if (Array.isArray(over)) return over;
    if (over && typeof over === "object" && base && typeof base === "object") {
      const out = Object.assign({}, base);
      Object.keys(over).forEach((k) => { out[k] = deepMerge(base[k], over[k]); });
      return out;
    }
    return over === undefined ? base : over;
  }
  function loadWorking() {
    const w = clone(window.Scrolly.data);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const ov = JSON.parse(raw);
        Object.keys(ov).forEach((id) => {
          if (w[id] && ov[id]) w[id] = deepMerge(w[id], ov[id]);
        });
      }
    } catch (e) { /* arranca con defecto */ }
    return w;
  }
  let working = loadWorking();
  let current = "deportivo";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, val) {
    const keys = path.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[k];
    }
    o[keys[keys.length - 1]] = val;
  }

  /* ---------- Login ---------- */
  function showStudio() {
    $("loginView").hidden = true;
    $("studioView").hidden = false;
    renderAll();
  }
  $("loginBtn").addEventListener("click", tryLogin);
  $("loginPass").addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  function tryLogin() {
    if ($("loginPass").value === CLAVE_ACCESO) {
      sessionStorage.setItem("scrolly_auth", "1");
      showStudio();
    } else {
      $("loginErr").textContent = "Clave incorrecta.";
    }
  }
  $("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("scrolly_auth");
    location.reload();
  });
  if (sessionStorage.getItem("scrolly_auth") === "1") showStudio();

  /* ---------- Pestañas y selector ---------- */
  document.querySelectorAll(".est-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".est-tab").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".est-pane").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.querySelector('[data-pane="' + btn.dataset.tab + '"]').classList.add("is-active");
    });
  });
  $("productSelect").addEventListener("change", (e) => {
    saveQuiet(); // no perder lo editado al cambiar de producto
    current = e.target.value;
    renderAll();
    status("Editando: " + NAMES[current]);
  });

  function status(msg) {
    const el = $("estStatus");
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(window.__estT);
    window.__estT = setTimeout(() => el.classList.remove("is-visible"), 3200);
  }

  /* ---------- Constructores de campos ---------- */
  function field(path, label, type, tall) {
    const v = getPath(working[current], path);
    if (type === "textarea" || tall) {
      return '<div class="est-field"><label>' + label + "</label>" +
        '<textarea data-p="' + path + '"' + (tall ? ' class="tall"' : "") + ">" + esc(v) + "</textarea></div>";
    }
    if (type === "color") {
      return '<div class="est-field"><label>' + label + "</label>" +
        '<input type="color" data-p="' + path + '" value="' + esc(v) + '" /></div>';
    }
    return '<div class="est-field"><label>' + label + "</label>" +
      '<input type="' + (type || "text") + '" data-p="' + path + '" value="' + esc(v) + '" /></div>';
  }
  function jsonArea(path, label, help) {
    const v = JSON.stringify(getPath(working[current], path) || [], null, 2);
    return '<div class="est-field"><label>' + label + "</label>" +
      '<textarea data-json="' + path + '" class="tall" spellcheck="false">' + esc(v) + "</textarea>" +
      (help ? '<p style="font-size:11.5px;color:var(--text-dim);margin-top:6px">' + help + "</p>" : "") + "</div>";
  }

  /* ---------- Render de pestañas ---------- */
  function renderAll() {
    renderContenido();
    renderComparativa();
    renderOferta();
    renderOpiniones();
    renderFotos();
    renderImportar();
  }

  function renderContenido() {
    const p = working[current];
    let specs = "";
    p.heroSpecs.forEach((s, i) => {
      specs += '<div class="est-grid2">' +
        field("heroSpecs." + i + ".value", "Spec " + (i + 1) + " · valor") +
        field("heroSpecs." + i + ".label", "Spec " + (i + 1) + " · etiqueta") + "</div>";
    });
    let sections = "";
    p.sections.forEach((s, i) => {
      sections += '<div class="est-group"><h3>Bloque narrativo ' + (i + 1) + "</h3>" +
        field("sections." + i + ".num", "Etiqueta (ej. 01 / POTENCIA)") +
        field("sections." + i + ".title", "Título") +
        field("sections." + i + ".text", "Texto", "textarea") +
        '<div class="est-grid2">' +
        field("sections." + i + ".stats.0.value", "Dato A · valor") +
        field("sections." + i + ".stats.0.label", "Dato A · etiqueta") +
        field("sections." + i + ".stats.1.value", "Dato B · valor") +
        field("sections." + i + ".stats.1.label", "Dato B · etiqueta") + "</div></div>";
    });
    $("paneContenido").innerHTML =
      '<div class="est-group"><h3>Hero principal</h3><p>Lo primero que ve el visitante.</p>' +
      field("kicker", "Antetítulo") +
      '<div class="est-grid2">' + field("title", "Título grande") + field("titleThin", "Título fino") + "</div>" +
      field("subtitle", "Subtítulo", "textarea") +
      '<div class="est-grid3">' + field("price", "Precio") + field("priceNote", "Nota de precio") + field("cta", "Texto del botón") + "</div>" +
      field("accent", "Color de acento", "color") + "</div>" +
      '<div class="est-group"><h3>Specs del hero</h3><p>Las 3 pastillas bajo el precio.</p>' + specs + "</div>" +
      sections;
  }

  function renderComparativa() {
    $("paneComparativa").innerHTML =
      '<div class="est-group"><h3>Gráfica vs mercado</h3><p>Barras animadas Nuestro vs Promedio. <b>lowerBetter</b> = true cuando gana el valor más bajo (precio, tiempo, peso).</p>' +
      field("comparison.title", "Título de la comparativa") +
      field("comparison.note", "Nota de fuente", "textarea") +
      jsonArea("comparison.metrics", "Métricas (JSON)",
        'Formato por métrica: {"name":"Potencia","ours":720,"market":560,"unit":"CV","lowerBetter":false}') +
      "</div>";
  }

  function renderOferta() {
    $("paneOferta").innerHTML =
      '<div class="est-group"><h3>Oferta y urgencia</h3><p>Si la fecha ya pasó, el countdown se oculta solo.</p>' +
      field("offer.badge", "Insignia de oferta") +
      '<div class="est-grid3">' +
      field("offer.unitsTotal", "Unidades totales", "number") +
      field("offer.unitsLeft", "Unidades restantes", "number") +
      field("offer.deadline", "Fin de oferta (AAAA-MM-DDTHH:MM:SS)") + "</div></div>" +
      '<div class="est-group"><h3>Contacto</h3><p>El formulario abre WhatsApp con mensaje pre-rellenado. Sin número = modo demo.</p>' +
      field("contact.whatsapp", "WhatsApp (solo dígitos, sin +)") +
      '<div class="est-grid2">' + field("contact.phoneDisplay", "Teléfono visible") + field("contact.phoneHref", "Enlace tel:") + "</div>" +
      field("contact.ctaLabel", "Texto del botón de compra") +
      field("contact.headline", "Titular del bloque final") +
      field("contact.sub", "Subtítulo del bloque final", "textarea") +
      '<div class="est-grid2">' + field("rating.value", "Nota media") + field("rating.count", "Nº de reseñas") + "</div></div>";
  }

  function renderOpiniones() {
    $("paneOpiniones").innerHTML =
      '<div class="est-group"><h3>Testimonios</h3>' +
      jsonArea("testimonials", "Testimonios (JSON)", 'Formato: {"stars":5,"text":"...","name":"...","place":"..."}') + "</div>" +
      '<div class="est-group"><h3>Sellos de confianza</h3>' +
      jsonArea("trust", "Sellos (JSON)", 'Formato: {"icon":"🛡️","title":"...","sub":"..."}') + "</div>" +
      '<div class="est-group"><h3>Actividad reciente (toast)</h3>' +
      jsonArea("socialProof", "Avisos (JSON)", 'Formato: {"name":"María G.","detail":"reservó una prueba","time":"hace 2 h"}') + "</div>";
  }

  function renderFotos() {
    const imgs = working[current].images || [];
    $("paneFotos").innerHTML =
      '<div class="est-group"><h3>Fotos de la secuencia</h3><p>Una URL por línea (la primera es el hero y la portada al compartir). Arrastra o edita el orden.</p>' +
      '<div class="est-field"><label>URLs (una por línea)</label>' +
      '<textarea id="imagesBox" class="tall" spellcheck="false">' + esc(imgs.join("\n")) + "</textarea></div>" +
      '<div class="est-thumbs" id="imagesPreview"></div></div>' +
      '<div class="est-group"><h3>🔍 Buscar fotos libres</h3><p>Banco Openverse (licencias abiertas). Clic en una foto para añadirla a la lista.</p>' +
      '<div class="est-grid2"><div class="est-field"><label>Búsqueda (inglés funciona mejor)</label>' +
      '<input type="text" id="ovQuery" value="' + esc(defaultQuery()) + '" /></div>' +
      '<div class="est-field"><label>&nbsp;</label><button class="est-btn est-btn--primary" id="ovBtn" type="button" style="width:100%">Buscar</button></div></div>' +
      '<div class="est-thumbs" id="ovResults"></div></div>';
    const paint = () => {
      const urls = $("imagesBox").value.split("\n").map((s) => s.trim()).filter(Boolean);
      $("imagesPreview").innerHTML = urls.map((u) =>
        '<img src="' + esc(u) + '" alt="" loading="lazy" title="' + esc(u) + '" />').join("");
    };
    $("imagesBox").addEventListener("input", paint);
    paint();
    $("ovBtn").addEventListener("click", searchOpenverse);
    $("ovQuery").addEventListener("keydown", (e) => { if (e.key === "Enter") searchOpenverse(); });
  }
  function defaultQuery() {
    return current === "deportivo" ? "sports car" : current === "casa" ? "modern luxury house" : "gaming laptop";
  }
  async function searchOpenverse() {
    const q = $("ovQuery").value.trim();
    const box = $("ovResults");
    if (!q) return;
    box.innerHTML = "<p style='font-size:13px'>Buscando…</p>";
    try {
      const r = await fetch("https://api.openverse.org/v1/images/?q=" + encodeURIComponent(q) + "&page_size=12");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      const items = data.results || [];
      if (!items.length) { box.innerHTML = "<p style='font-size:13px'>Sin resultados. Prueba otra palabra.</p>"; return; }
      box.innerHTML = items.map((it) =>
        '<img src="' + esc(it.thumbnail || it.url) + '" data-full="' + esc(it.url) +
        '" alt="' + esc(it.title || "") + '" loading="lazy" title="Clic para añadir" />').join("");
      box.querySelectorAll("img").forEach((img) => {
        img.addEventListener("click", () => {
          const ta = $("imagesBox");
          ta.value = (ta.value.trim() ? ta.value.trim() + "\n" : "") + img.dataset.full;
          ta.dispatchEvent(new Event("input"));
          status("✓ Foto añadida a la lista (pulsa Guardar)");
        });
      });
    } catch (e) {
      box.innerHTML = "<p style='font-size:13px'>No se pudo buscar (" + esc(e.message) + "). Pega URLs manualmente.</p>";
    }
  }

  /* ---------- Importar desde una URL (auto-relleno supervisado) ---------- */
  let imported = null;
  function renderImportar() {
    $("paneImportar").innerHTML =
      '<div class="est-group"><h3>🌐 Traer info de la web</h3>' +
      "<p>Pega la URL del producto (fabricante, concesionario, inmobiliaria…). Extraemos título, descripción, imagen y precio para que los revises antes de aplicar. Usa un proxy público de lectura; si falla, copia los textos a mano en las otras pestañas.</p>" +
      '<div class="est-field"><label>URL del producto</label>' +
      '<input type="text" id="impUrl" placeholder="https://…" /></div>' +
      '<button class="est-btn est-btn--primary" id="impBtn" type="button">Extraer información</button>' +
      '<div class="est-import-preview" id="impPreview" hidden></div>' +
      '<div style="margin-top:12px"><button class="est-btn" id="impApply" type="button" hidden>Aplicar al producto actual</button></div></div>';
    $("impBtn").addEventListener("click", extractFromUrl);
  }
  async function extractFromUrl() {
    const url = $("impUrl").value.trim();
    const prev = $("impPreview");
    if (!/^https?:\/\//i.test(url)) { status("Pega una URL válida (https://…)"); return; }
    prev.hidden = false;
    prev.innerHTML = "<p>Extrayendo…</p>";
    $("impApply").hidden = true;
    imported = null;
    try {
      const r = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent(url));
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      const doc = new DOMParser().parseFromString(data.contents || "", "text/html");
      const meta = (sel) => {
        const m = doc.querySelector(sel);
        return m ? (m.getAttribute("content") || "").trim() : "";
      };
      const priceMatch = (doc.body ? doc.body.textContent : "").replace(/\s+/g, " ")
        .match(/(€\s?[\d.,]+|[\d.,]+\s?€|\$\s?[\d.,]+|USD\s?[\d.,]+)/);
      imported = {
        title: meta('meta[property="og:title"]') || (doc.title || "").trim(),
        desc: meta('meta[property="og:description"]') || meta('meta[name="description"]'),
        image: meta('meta[property="og:image"]'),
        price: priceMatch ? priceMatch[0].trim() : "",
        source: url,
      };
      prev.innerHTML = "<b>Encontrado:</b><br>" +
        "📌 Título: " + esc(imported.title || "—") + "<br>" +
        "📝 Descripción: " + esc(imported.desc ? imported.desc.slice(0, 220) + "…" : "—") + "<br>" +
        "💰 Precio detectado: " + esc(imported.price || "no detectado") + "<br>" +
        (imported.image ? '<img src="' + esc(imported.image) + '" alt="" />' : "🖼️ Sin imagen");
      if (imported.title || imported.desc || imported.image) $("impApply").hidden = false;
      else prev.innerHTML += "<br><br>Esa web no expone datos legibles: copia los textos manualmente.";
    } catch (e) {
      prev.innerHTML = "No se pudo leer esa URL (" + esc(e.message) + "). Prueba con otra o edita a mano.";
    }
  }
  function applyImported() {
    if (!imported) return;
    const p = working[current];
    if (imported.title) {
      const parts = imported.title.split(/[-|·]/);
      p.title = (parts[0] || "").trim().slice(0, 24) || p.title;
      if (parts[1]) p.titleThin = parts[1].trim().slice(0, 16);
    }
    if (imported.desc) p.subtitle = imported.desc.slice(0, 220);
    if (imported.price) p.price = imported.price;
    if (imported.image && !(p.images || []).includes(imported.image)) {
      p.images = [imported.image].concat(p.images || []).slice(0, 6);
    }
    saveQuiet();
    renderAll();
    status("✓ Datos aplicados a " + NAMES[current] + " (revisa y pulsa Guardar)");
    document.querySelector('[data-tab="contenido"]').click();
  }

  /* ---------- Guardar / exportar / importar / restablecer ---------- */
  function collect() {
    const p = working[current];
    document.querySelectorAll("#studioView [data-p]").forEach((el) => {
      let v = el.value;
      if (el.type === "number") v = v === "" ? 0 : Number(v);
      setPath(p, el.dataset.p, v);
    });
    // Áreas JSON validadas
    const bad = [];
    document.querySelectorAll("#studioView [data-json]").forEach((el) => {
      try {
        setPath(p, el.dataset.json, JSON.parse(el.value));
        el.style.borderColor = "";
      } catch (e) { el.style.borderColor = "#ff5d5d"; bad.push(el.dataset.json); }
    });
    // Fotos: una URL por línea
    const lines = $("imagesBox") ? $("imagesBox").value.split("\n").map((s) => s.trim()).filter(Boolean) : null;
    if (lines) p.images = lines;
    return bad;
  }
  function persist() {
    localStorage.setItem(LS_KEY, JSON.stringify(working));
  }
  function saveQuiet() {
    const bad = collect();
    if (bad.length) return bad;
    persist();
    return [];
  }
  $("saveBtn").addEventListener("click", () => {
    const bad = saveQuiet();
    status(bad.length ? "⚠ Revisa el JSON marcado en rojo: " + bad.join(", ") : "✓ Guardado. Recarga la landing para verlo.");
  });
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "impApply") applyImported();
  });
  $("exportBtn").addEventListener("click", () => {
    saveQuiet();
    const blob = new Blob([JSON.stringify(working, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "scrolly-contenido.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    status("✓ JSON descargado. Envíamelo y lo publico en GitHub Pages.");
  });
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (!data.deportivo && !data.casa && !data.laptop) throw new Error("sin productos");
        working = deepMerge(clone(window.Scrolly.data), data);
        persist();
        renderAll();
        status("✓ Archivo importado y guardado.");
      } catch (err) {
        status("⚠ Archivo inválido: " + err.message);
      }
      e.target.value = "";
    };
    rd.readAsText(f);
  });
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("¿Borrar tus cambios y volver al contenido original?")) return;
    localStorage.removeItem(LS_KEY);
    working = loadWorking();
    renderAll();
    status("Contenido original restaurado.");
  });
})();
