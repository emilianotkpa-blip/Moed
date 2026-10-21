/* ═══════════════════════════════════════════════════════════════════
   MOËD · MODO EDICIÓN — se activa con ?edit=1 en la dirección
   ───────────────────────────────────────────────────────────────────
   Textos, botones, enlaces, fotos (también las de fondo) y colores de
   la marca. Guarda en GitHub (emilianotkpa-blip/Moed) y, si se le dio
   la URL de despliegue de EasyPanel, publica y comprueba que el sitio
   ya muestra el cambio.

   LA DIFERENCIA CON EL EDITOR DEL SITIO ANTERIOR
   Aquel guardaba una copia de la página EN VIVO. Esta página se mueve:
   animaciones, portada que se retira, carrusel, cursor de vidrio. Una
   copia en vivo se habría llevado ese estado (cosas a medio aparecer,
   la portada ya quitada) y el sitio publicado saldría roto.
   Aquí se guarda el HTML ORIGINAL del repo con SOLO los cambios encima:
   se descarga de GitHub, se ubican los mismos elementos en el mismo
   orden (las mismas reglas de `marcar`) y se les copia lo editado. Si
   el original ya no cuadra con lo que se editó, no se guarda nada.

   El token de GitHub se queda en este navegador (localStorage), nunca
   en el código.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!/[?&]edit(=|&|$)/.test(location.search)) return;

  const GH = { owner: 'emilianotkpa-blip', repo: 'Moed', rama: 'main' };
  const API = `https://api.github.com/repos/${GH.owner}/${GH.repo}`;
  const RAW = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.rama}`;

  /* ── Qué se edita ──────────────────────────────────────────────────
     Mismas reglas para la página en vivo y para el original descargado:
     de eso depende que el elemento N de uno sea el elemento N del otro. */
  const UI = '#med-barra,#med-flotante,#med-modal-img,#med-acceso,#med-confirma,#med-colores,#med-aviso';
  const FUERA = `#portada,.trampa,.form-error,[data-error],.cursor,script,style,noscript,svg,${UI}`;
  const SEL_BOTON = 'a.boton,button.boton,a.nav-cita';
  const SEL_TEXTO = 'h1,h2,h3,h4,p,li,blockquote,.rotulo,.hero-vertical,.intro-firma .cursiva,'
    + '.nota-ejemplo,.pie-abajo > span,.marquesina-pista > span:first-child';

  function marcar(doc) {
    const fuera = (el) => !!el.closest(FUERA);
    const l = { boton: [], enlace: [], texto: [], img: [], fondo: [] };
    doc.querySelectorAll(SEL_BOTON).forEach((el) => { if (!fuera(el)) l.boton.push(el); });
    const esBoton = new Set(l.boton);
    doc.querySelectorAll('a[href]').forEach((el) => {
      if (fuera(el) || esBoton.has(el) || !el.textContent.trim()) return;
      l.enlace.push(el);
    });
    const marcados = [...l.boton, ...l.enlace];
    doc.querySelectorAll(SEL_TEXTO).forEach((el) => {
      if (fuera(el) || !el.textContent.trim()) return;
      // Nada editable dentro de algo editable: manda lo de dentro
      if (marcados.some((m) => m.contains(el) || el.contains(m))) return;
      l.texto.push(el);
      marcados.push(el);
    });
    doc.querySelectorAll('img').forEach((el) => { if (!fuera(el)) l.img.push(el); });
    doc.querySelectorAll('[data-fondo]').forEach((el) => { if (!fuera(el)) l.fondo.push(el); });
    return l;
  }

  /* ── Colores de la marca (variables de tokens.css) ── */
  const COLORES = [
    ['--crema', 'Crema (fondo)'],
    ['--crema-clara', 'Crema clara (secciones)'],
    ['--tinta', 'Tinta (textos y secciones oscuras)'],
    ['--tinta-tenue', 'Texto secundario'],
    ['--arena', 'Arena (acentos)'],
    ['--arena-honda', 'Arena honda (detalles)'],
  ];
  const cssColores = (c) => `:root{${Object.entries(c).map(([k, v]) => `${k}:${v}`).join(';')}}`;

  /* ── Borrador: lo editado, por tipo e índice, sobrevive a recargar ── */
  const CLAVE = 'moed_borrador_' + location.pathname;
  let b = {};
  try { b = JSON.parse(sessionStorage.getItem(CLAVE) || '{}'); } catch (_) { b = {}; }
  ['texto', 'boton', 'enlace', 'img', 'fondo'].forEach((k) => { b[k] = b[k] || {}; });
  b.colores = b.colores || null;
  const guardaBorrador = () => { try { sessionStorage.setItem(CLAVE, JSON.stringify(b)); } catch (_) { /* lleno */ } };
  const hayCambios = () => ['texto', 'boton', 'enlace', 'img', 'fondo'].some((k) => Object.keys(b[k]).length) || !!b.colores;
  const apunta = (tipo, i, campos) => { b[tipo][i] = Object.assign({}, b[tipo][i], campos); guardaBorrador(); sucio(); };

  /* ── Iconos (línea, como el resto del sitio) ── */
  const ic = {
    paleta: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/></svg>',
    guardar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12.5 10 17l9-10"/></svg>',
    deshacer: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
    subir: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
    foto: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/></svg>',
  };

  /* ═════════════════════ ESTILOS ═════════════════════ */
  const estilo = document.createElement('style');
  estilo.textContent = `
    .editando body{padding-top:52px}
    .editando .nav{top:66px}
    .editando .destinos-cabeza{pointer-events:auto}
    .editando [data-med-texto],.editando [data-med-boton],.editando [data-med-enlace]{pointer-events:auto;cursor:text}
    .editando [data-med-texto]:hover,.editando [data-med-boton]:hover,.editando [data-med-enlace]:hover{outline:1px dashed rgba(159,134,101,.7);outline-offset:3px}
    .editando [data-med-texto]:focus,.editando [data-med-boton]:focus,.editando [data-med-enlace]:focus{outline:2px solid #9F8665;outline-offset:4px}
    .editando img[data-med-img],.editando [data-fondo]{cursor:pointer}
    .editando .destino::after{pointer-events:none}

    #med-barra,#med-flotante,#med-modal-img,#med-acceso,#med-confirma,#med-colores,#med-aviso{font-family:'Jost',system-ui,sans-serif;letter-spacing:0;text-transform:none}
    #med-barra{position:fixed;top:0;left:0;right:0;z-index:2147483646;height:52px;display:flex;align-items:center;gap:10px;padding:0 16px;
      background:rgba(18,17,16,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:#FCF9F4;border-bottom:1px solid rgba(226,210,186,.25);font-size:13px}
    #med-barra .marca{font-family:'Bodoni Moda',serif;font-size:17px;letter-spacing:.02em}
    #med-barra .etiqueta{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#E2D2BA;border:1px solid rgba(226,210,186,.4);padding:3px 9px;border-radius:99px}
    #med-barra .punto{width:7px;height:7px;border-radius:50%;background:#E2D2BA;opacity:0;transition:opacity .2s}
    #med-barra .punto.ver{opacity:1}
    #med-barra .hueco{flex:1}
    #med-barra button,#med-colores button,#med-modal-img button,#med-acceso button,#med-flotante button{font:inherit;cursor:pointer}
    #med-barra button{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:99px;border:1px solid rgba(252,249,244,.22);background:transparent;color:#FCF9F4;font-size:12.5px}
    #med-barra button:hover{border-color:#E2D2BA;color:#E2D2BA}
    #med-barra #med-guardar{background:#F4ECE0;color:#121110;border-color:#F4ECE0;font-weight:500}
    #med-barra #med-guardar:hover{background:#E2D2BA;color:#121110}
    #med-barra #med-guardar:disabled{opacity:.45;cursor:not-allowed}

    #med-flotante{position:fixed;z-index:2147483646;display:none;align-items:center;gap:6px;padding:6px 8px;border-radius:14px;background:rgba(18,17,16,.94);color:#FCF9F4;font-size:12px;box-shadow:0 12px 30px -12px rgba(0,0,0,.6)}
    #med-flotante.ver{display:flex}
    #med-flotante .sep{width:1px;height:20px;background:rgba(252,249,244,.18);margin:0 2px}
    #med-flotante button{height:28px;min-width:28px;padding:0 8px;border-radius:8px;border:1px solid rgba(252,249,244,.2);background:transparent;color:#FCF9F4;display:inline-flex;align-items:center;justify-content:center;gap:4px}
    #med-flotante button:hover{border-color:#E2D2BA}
    #med-flotante .tag{color:#CBB596;font-size:11px}
    #med-flotante .muestra{position:relative;width:22px;height:22px;border-radius:6px;border:1px solid rgba(252,249,244,.35);overflow:hidden}
    #med-flotante .muestra input{position:absolute;inset:-8px;width:40px;height:40px;opacity:0;cursor:pointer}
    #med-flotante input.href{width:150px;height:28px;border-radius:8px;border:1px solid rgba(252,249,244,.2);background:rgba(252,249,244,.08);color:#FCF9F4;padding:0 8px;font:inherit;font-size:12px}

    .med-fondo-modal{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;background:rgba(18,17,16,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:16px}
    .med-fondo-modal.ver{display:flex}
    .med-caja{width:min(460px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#FCF9F4;color:#121110;border-radius:22px;padding:26px;box-shadow:0 30px 60px -20px rgba(0,0,0,.45)}
    .med-caja h3{font-family:'Bodoni Moda',serif;font-size:26px;font-weight:400;margin:0 0 6px}
    .med-caja p{color:#6C6257;font-size:13px;line-height:1.55;margin:0 0 14px}
    .med-caja label{display:block;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#6C6257;margin:14px 0 6px}
    .med-caja input[type=url],.med-caja input[type=password],.med-caja input[type=text]{width:100%;box-sizing:border-box;height:42px;border-radius:12px;border:1px solid #E7DDCD;background:#fff;color:#121110;padding:0 12px;font:inherit;font-size:13.5px}
    .med-caja input:focus{outline:2px solid #CBB596;outline-offset:1px}
    .med-acciones{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
    .med-acciones button,.med-subir{height:40px;padding:0 18px;border-radius:99px;border:1px solid #E7DDCD;background:transparent;color:#121110;font-size:13px}
    .med-acciones .principal{background:#121110;color:#FCF9F4;border-color:#121110}
    .med-acciones button:disabled{opacity:.45;cursor:not-allowed}
    .med-subir{display:inline-flex;align-items:center;gap:8px;width:100%;justify-content:center;border-style:dashed;height:46px}
    .med-vista{margin-top:14px;height:170px;border-radius:14px;background:#F2E8D9 center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:#A39787;font-size:12px}
    .med-estado{font-size:12px;margin-top:8px;min-height:16px}
    .med-estado.ok{color:#3E7B52}.med-estado.mal{color:#A3473A}
    .med-fila-color{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #F2E8D9;font-size:13px}
    .med-fila-color input{width:42px;height:30px;border:1px solid #E7DDCD;border-radius:8px;background:none;padding:2px;cursor:pointer}

    #med-aviso{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483647;max-width:calc(100% - 32px);padding:12px 20px;border-radius:14px;font-size:13px;line-height:1.45;
      background:rgba(18,17,16,.94);color:#FCF9F4;box-shadow:0 14px 34px -12px rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity .25s}
    #med-aviso.ver{opacity:1}
    #med-aviso.mal{background:#7A2F25}
  `;
  document.head.appendChild(estilo);

  /* ═════════════════════ AYUDAS ═════════════════════ */
  function aviso(msg, tipo = 'ok', ms = 4500) {
    let el = document.getElementById('med-aviso');
    if (!el) { el = document.createElement('div'); el.id = 'med-aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.className = `ver ${tipo === 'mal' ? 'mal' : ''}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ''; }, ms);
  }
  function sucio() {
    document.querySelector('#med-barra .punto')?.classList.add('ver');
    const g = document.getElementById('med-guardar');
    if (g) g.disabled = false;
  }
  const aHex = (css) => {
    const m = String(css || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return /^#[0-9a-f]{6}$/i.test(String(css).trim()) ? String(css).trim() : '#000000';
    return '#' + m[1].split(',').slice(0, 3).map((n) => Math.max(0, Math.min(255, parseInt(n, 10) || 0)).toString(16).padStart(2, '0')).join('');
  };
  const rutaRepo = () => {
    const p = location.pathname.replace(/^\//, '').replace(/\/$/, '');
    return p ? `${p}/index.html` : 'index.html';
  };
  const token = () => { try { return localStorage.getItem('gh_token'); } catch (_) { return null; } };
  const gh = (ruta, opciones = {}) => fetch(`${API}${ruta}`, {
    ...opciones,
    headers: { Authorization: `token ${token()}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(opciones.headers || {}) },
  });
  const deB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  function aB64(texto) {
    const bytes = new TextEncoder().encode(texto);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const urlFondo = (el) => (el.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [])[1] || '';

  /* ═════════════════════ BARRA ═════════════════════ */
  let vivo = null;   // marcar(document) al arrancar, antes de tocar nada

  function barra() {
    const el = document.createElement('div');
    el.id = 'med-barra';
    el.innerHTML = `
      <span class="marca">MOËD</span><span class="etiqueta">Modo edición</span><span class="punto" title="Cambios sin guardar"></span>
      <span class="hueco"></span>
      <button id="med-btn-colores" type="button">${ic.paleta}<span>Colores</span></button>
      <button id="med-descartar" type="button">${ic.deshacer}<span>Descartar</span></button>
      <button id="med-guardar" type="button" disabled>${ic.guardar}<span>Guardar y publicar</span></button>`;
    document.body.prepend(el);
    document.getElementById('med-descartar').onclick = () => {
      if (!hayCambios()) { location.reload(); return; }
      confirmar('Descartar los cambios', 'Se pierden los cambios de esta página que no se han guardado.', 'Descartar', () => {
        try { sessionStorage.removeItem(CLAVE); } catch (_) { /* nada */ }
        location.reload();
      });
    };
    document.getElementById('med-guardar').onclick = guardar;
    document.getElementById('med-btn-colores').onclick = () => document.getElementById('med-colores').classList.add('ver');
  }

  /* Modal propio (no window.confirm: ese anuncia el dominio en crudo) */
  function confirmar(titulo, texto, accion, alAceptar) {
    const m = document.createElement('div');
    m.className = 'med-fondo-modal ver';
    m.id = 'med-confirma';
    m.innerHTML = `<div class="med-caja" role="dialog" aria-modal="true"><h3></h3><p></p>
      <div class="med-acciones"><button type="button" data-no>Cancelar</button><button type="button" class="principal" data-si></button></div></div>`;
    m.querySelector('h3').textContent = titulo;
    m.querySelector('p').textContent = texto;
    m.querySelector('[data-si]').textContent = accion;
    document.body.appendChild(m);
    const cierra = () => m.remove();
    m.querySelector('[data-no]').onclick = cierra;
    m.addEventListener('click', (e) => { if (e.target === m) cierra(); });
    m.querySelector('[data-si]').onclick = () => { cierra(); alAceptar(); };
  }

  /* ═════════════════════ BARRA FLOTANTE ═════════════════════ */
  let flot = null;
  let elFlot = null;

  function flotante() {
    flot = document.createElement('div');
    flot.id = 'med-flotante';
    document.body.appendChild(flot);
    ['scroll', 'resize'].forEach((ev) => window.addEventListener(ev, () => { if (elFlot) coloca(); }, { passive: true }));
    // Un solo portero decide cuándo se va: al pulsar fuera de ella y de lo editable
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#med-flotante,[data-med-texto],[data-med-boton],[data-med-enlace]')) return;
      oculta();
    }, true);
  }
  function coloca() {
    const r = elFlot.getBoundingClientRect();
    const ancho = flot.offsetWidth || 260;
    const arriba = r.top - 46 >= 60 ? r.top - 46 : Math.min(innerHeight - 46, r.bottom + 8);
    flot.style.top = `${Math.max(60, arriba)}px`;
    flot.style.left = `${Math.max(8, Math.min(r.left, innerWidth - ancho - 8))}px`;
  }
  function oculta() { elFlot = null; flot?.classList.remove('ver'); }
  const muestra = (id, tag, valor) => `<span class="tag">${tag}</span><span class="muestra" style="background:${valor}"><input type="color" id="${id}" value="${valor}"></span>`;

  function tipoDe(el) {
    if (el.dataset.medBoton !== undefined) return ['boton', el.dataset.medBoton];
    if (el.dataset.medEnlace !== undefined) return ['enlace', el.dataset.medEnlace];
    return ['texto', el.dataset.medTexto];
  }

  function muestraFlotante(el) {
    elFlot = el;
    const cs = getComputedStyle(el);
    const [tipo, i] = tipoDe(el);
    if (tipo === 'boton') {
      flot.innerHTML = `${muestra('mf-fondo', 'Fondo', aHex(cs.backgroundColor))}<span class="sep"></span>${muestra('mf-letra', 'Letra', aHex(cs.color))}<span class="sep"></span>${muestra('mf-borde', 'Borde', aHex(cs.borderTopColor))}<button type="button" id="mf-quita" title="Quitar los colores puestos aquí">${ic.deshacer}</button>`;
      enlazaColor('mf-fondo', 'backgroundColor', tipo, i);
      enlazaColor('mf-letra', 'color', tipo, i);
      enlazaColor('mf-borde', 'borderColor', tipo, i);
    } else if (tipo === 'enlace') {
      flot.innerHTML = `${muestra('mf-letra', 'Color', aHex(cs.color))}<span class="sep"></span><span class="tag">Lleva a</span><input class="href" id="mf-href" title="A dónde lleva este enlace"><button type="button" id="mf-quita" title="Quitar el color puesto aquí">${ic.deshacer}</button>`;
      enlazaColor('mf-letra', 'color', tipo, i);
      const campo = document.getElementById('mf-href');
      campo.value = el.getAttribute('href') || '';
      campo.addEventListener('input', () => { el.setAttribute('href', campo.value); apunta('enlace', i, { href: campo.value }); });
      campo.addEventListener('keydown', (e) => e.stopPropagation());
    } else {
      flot.innerHTML = `<button type="button" id="mf-menos" title="Más chico">A−</button><span class="tag" id="mf-tam">${Math.round(parseFloat(cs.fontSize))}px</span><button type="button" id="mf-mas" title="Más grande">A+</button><span class="sep"></span>${muestra('mf-letra', 'Color', aHex(cs.color))}<button type="button" id="mf-quita" title="Quitar tamaño y color puestos aquí">${ic.deshacer}</button>`;
      const tam = (d) => {
        const nuevo = Math.max(10, Math.round(parseFloat(getComputedStyle(el).fontSize) + d));
        el.style.fontSize = `${nuevo}px`;
        document.getElementById('mf-tam').textContent = `${nuevo}px`;
        apunta('texto', i, { fontSize: `${nuevo}px` });
        coloca();
      };
      document.getElementById('mf-menos').onmousedown = (e) => { e.preventDefault(); tam(-2); };
      document.getElementById('mf-mas').onmousedown = (e) => { e.preventDefault(); tam(2); };
      enlazaColor('mf-letra', 'color', tipo, i);
    }
    document.getElementById('mf-quita').onclick = () => {
      ['color', 'backgroundColor', 'borderColor', 'borderStyle', 'borderWidth', 'fontSize'].forEach((k) => { el.style[k] = ''; });
      apunta(tipo, i, { color: '', backgroundColor: '', borderColor: '', fontSize: '' });
      muestraFlotante(el);
    };
    flot.classList.add('ver');
    coloca();
  }

  function enlazaColor(id, prop, tipo, i) {
    const inp = document.getElementById(id);
    inp.addEventListener('input', () => {
      if (!elFlot) return;
      elFlot.style[prop] = inp.value;
      if (prop === 'borderColor' && getComputedStyle(elFlot).borderTopWidth === '0px') {
        elFlot.style.borderStyle = 'solid';
        elFlot.style.borderWidth = '1px';
      }
      inp.parentElement.style.background = inp.value;
      apunta(tipo, i, { [prop]: inp.value });
    });
  }

  /* ═════════════════════ EDICIÓN EN LA PÁGINA ═════════════════════ */
  function habilita() {
    const unir = (lista, tipo, atributo) => lista.forEach((el, n) => {
      const i = String(n);
      el.dataset[atributo] = i;
      el.setAttribute('contenteditable', 'true');
      el.spellcheck = true;
      const g = b[tipo][i];
      if (g) {
        if (g.html !== undefined) el.innerHTML = g.html;
        ['color', 'backgroundColor', 'borderColor', 'fontSize'].forEach((k) => { if (g[k]) el.style[k] = g[k]; });
        if (g.href !== undefined) el.setAttribute('href', g.href);
      }
      el.addEventListener('focus', () => muestraFlotante(el));
      el.addEventListener('pointerdown', () => muestraFlotante(el));
      el.addEventListener('input', () => apunta(tipo, i, { html: el.innerHTML }));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); el.blur(); oculta(); }
        // Enter = salto de línea, nunca un <div> nuevo
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!document.execCommand('insertLineBreak')) document.execCommand('insertHTML', false, '<br>');
        }
      });
      // Pegar sin formato: de Word o de otra página llegarían estilos ajenos
      el.addEventListener('paste', (e) => {
        e.preventDefault();
        document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
      });
    });
    unir(vivo.boton, 'boton', 'medBoton');
    unir(vivo.enlace, 'enlace', 'medEnlace');
    unir(vivo.texto, 'texto', 'medTexto');

    vivo.img.forEach((img, n) => {
      img.dataset.medImg = String(n);
      const g = b.img[n];
      if (g) img.src = g.vista || g.src;
    });
    vivo.fondo.forEach((el, n) => {
      const g = b.fondo[n];
      if (g) el.style.backgroundImage = `url('${g.vista || g.src}')`;
    });

    // En modo edición los botones y enlaces se editan; el clic DERECHO navega
    document.addEventListener('click', (e) => {
      if (e.target.closest(UI)) return;
      if (e.target.closest('[data-med-boton],[data-med-enlace]')) { e.preventDefault(); return; }
      if (e.target.closest('[data-med-texto]')) return;
      if (e.target.closest('button,input,select,textarea,label,[data-nav],[data-menu]')) return;
      // Una foto puede estar tapada por un degradado o por el texto: se busca
      // debajo del puntero la primera foto editable que se vea
      const bajo = document.elementsFromPoint(e.clientX, e.clientY)
        .find((x) => (x.matches('img[data-med-img]') || x.hasAttribute('data-fondo')) && parseFloat(getComputedStyle(x).opacity) > 0.1);
      if (bajo) { e.preventDefault(); e.stopPropagation(); abreImagen(bajo); }
    }, true);
    document.addEventListener('contextmenu', (e) => {
      const a = e.target.closest('a[data-med-enlace],a[data-med-boton]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      e.preventDefault();
      if (href.startsWith('#')) document.querySelector(href.length > 1 ? href : 'body')?.scrollIntoView({ behavior: 'smooth' });
      else if (/^(https?:|mailto:|tel:)/.test(href)) open(href, '_blank', 'noopener');
      else location.href = href + (href.includes('?') ? '&' : '?') + 'edit=1';
    });
    // El formulario no envía nada mientras se edita
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      aviso('En modo edición el formulario no envía nada.');
    }, true);
  }

  /* ═════════════════════ FOTOS ═════════════════════ */
  let imgActual = null;

  function modalImagen() {
    const m = document.createElement('div');
    m.id = 'med-modal-img';
    m.className = 'med-fondo-modal';
    m.innerHTML = `
      <div class="med-caja" role="dialog" aria-modal="true" aria-label="Cambiar foto">
        <h3>Cambiar foto</h3>
        <p>Súbanla desde la computadora (se ajusta sola a un tamaño ligero para la web) o peguen la dirección de una foto en línea.</p>
        <input type="file" id="mi-archivo" accept="image/*" hidden>
        <button type="button" class="med-subir" id="mi-subir">${ic.subir}<span>Subir desde la computadora</span></button>
        <label for="mi-url">O la dirección de una foto</label>
        <input type="url" id="mi-url" placeholder="https://…" autocomplete="off">
        <div class="med-vista" id="mi-vista">Vista previa</div>
        <div class="med-estado" id="mi-estado"></div>
        <div class="med-acciones"><button type="button" id="mi-cancelar">Cancelar</button><button type="button" class="principal" id="mi-aplicar" disabled>Usar esta foto</button></div>
      </div>`;
    document.body.appendChild(m);
    const $ = (id) => document.getElementById(id);
    const url = $('mi-url'); const vista = $('mi-vista'); const estado = $('mi-estado'); const aplicar = $('mi-aplicar');
    let elegida = null;   // { src: lo que se guarda, vista: lo que se ve ya }

    const enseña = (src, msg, ok = true) => {
      vista.style.backgroundImage = src ? `url('${src}')` : '';
      vista.textContent = src ? '' : 'Vista previa';
      estado.className = `med-estado ${ok ? 'ok' : 'mal'}`;
      estado.textContent = msg;
    };
    m._abre = (actual) => {
      elegida = null;
      url.value = /^https?:/.test(actual) ? actual : '';
      enseña(actual, 'Foto actual');
      aplicar.disabled = true;
      m.classList.add('ver');
    };
    const cierra = () => m.classList.remove('ver');
    $('mi-cancelar').onclick = cierra;
    m.addEventListener('click', (e) => { if (e.target === m) cierra(); });

    $('mi-subir').onclick = () => $('mi-archivo').click();
    $('mi-archivo').addEventListener('change', async () => {
      const f = $('mi-archivo').files[0];
      $('mi-archivo').value = '';
      if (!f) return;
      $('mi-subir').disabled = true;
      enseña('', 'Preparando y subiendo la foto…');
      try {
        elegida = await subeFoto(f);
        enseña(elegida.vista, 'Foto subida. Se verá en el sitio al guardar y publicar.');
        aplicar.disabled = false;
      } catch (err) {
        enseña('', `No se pudo subir: ${err.message}`, false);
      } finally {
        $('mi-subir').disabled = false;
      }
    });

    let espera;
    url.addEventListener('input', () => {
      clearTimeout(espera);
      aplicar.disabled = true;
      const v = normaliza(url.value);
      if (!v) { enseña('', ''); return; }
      enseña('', 'Revisando…');
      espera = setTimeout(() => {
        const prueba = new Image();
        prueba.onload = () => { elegida = { src: v, vista: v }; enseña(v, 'La foto carga bien.'); aplicar.disabled = false; };
        prueba.onerror = () => enseña('', 'Esa dirección no abre como foto. Prueben otra (Google Fotos e Instagram no sirven).', false);
        prueba.src = v;
      }, 600);
    });

    aplicar.onclick = () => {
      if (!imgActual || !elegida) return;
      if (imgActual.hasAttribute('data-fondo')) {
        const n = vivo.fondo.indexOf(imgActual);
        imgActual.style.backgroundImage = `url('${elegida.vista}')`;
        b.fondo[n] = elegida;
      } else {
        imgActual.src = elegida.vista;
        b.img[imgActual.dataset.medImg] = elegida;
      }
      guardaBorrador();
      sucio();
      cierra();
    };
  }

  function abreImagen(el) {
    imgActual = el;
    document.getElementById('med-modal-img')._abre(el.hasAttribute('data-fondo') ? urlFondo(el) : el.currentSrc || el.src);
  }

  /* Enlaces de «compartir» a dirección directa */
  function normaliza(crudo) {
    const u = String(crudo || '').trim();
    const gd = u.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (gd) return `https://drive.google.com/uc?export=view&id=${gd[1]}`;
    if (u.includes('dropbox.com')) return u.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/, '');
    return u;
  }

  /* Fotos de celular de 8 MB no: se reducen a 2400 px y JPEG antes de subir.
     Se guardan en el repo (assets/images) y la página las pide por su ruta
     del sitio; la vista previa sale de GitHub mientras se publica. */
  async function subeFoto(archivo) {
    if (!token()) throw new Error('falta el token de GitHub');
    let blob = archivo;
    let ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
    const ligeraYConTransparencia = archivo.type === 'image/png' && archivo.size < 1.5e6;
    if (!ligeraYConTransparencia && /^image\/(jpeg|png|webp|heic|heif)/.test(archivo.type)) {
      try {
        const bmp = await createImageBitmap(archivo);
        const escala = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(bmp.width * escala);
        lienzo.height = Math.round(bmp.height * escala);
        lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
        blob = await new Promise((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.84));
        ext = 'jpg';
      } catch (_) { blob = archivo; }
    }
    const base = archivo.name.replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'foto';
    const ruta = `assets/images/${Date.now()}-${base}.${ext}`;
    const b64 = await new Promise((ok, mal) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result).split(',')[1]);
      r.onerror = mal;
      r.readAsDataURL(blob);
    });
    const res = await gh(`/contents/${ruta}`, { method: 'PUT', body: JSON.stringify({ message: `Editor MOËD: foto ${ruta.split('/').pop()}`, content: b64, branch: GH.rama }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `GitHub respondió ${res.status}`);
    return { src: `/${ruta}`, vista: `${RAW}/${ruta}` };
  }

  /* ═════════════════════ COLORES ═════════════════════ */
  function panelColores() {
    const m = document.createElement('div');
    m.id = 'med-colores';
    m.className = 'med-fondo-modal';
    const cs = getComputedStyle(document.documentElement);
    const actual = Object.fromEntries(COLORES.map(([v]) => [v, aHex(cs.getPropertyValue(v).trim())]));
    const originales = { ...actual };
    if (b.colores) Object.assign(actual, b.colores);
    m.innerHTML = `<div class="med-caja" role="dialog" aria-modal="true" aria-label="Colores del sitio">
      <h3>Colores del sitio</h3><p>Cambian en todo el sitio a la vez. Se ven al momento y se publican al guardar.</p>
      ${COLORES.map(([v, nombre]) => `<div class="med-fila-color"><span>${nombre}</span><input type="color" data-var="${v}" value="${actual[v]}"></div>`).join('')}
      <div class="med-acciones"><button type="button" data-original>Como estaban</button><button type="button" class="principal" data-listo>Listo</button></div></div>`;
    document.body.appendChild(m);
    const aplica = () => {
      let s = document.getElementById('moed-colores');
      if (!s) { s = document.createElement('style'); s.id = 'moed-colores'; document.head.appendChild(s); }
      s.textContent = cssColores(actual);
    };
    if (b.colores) aplica();
    m.querySelectorAll('input[type=color]').forEach((inp) => inp.addEventListener('input', () => {
      actual[inp.dataset.var] = inp.value;
      b.colores = { ...actual };
      aplica();
      guardaBorrador();
      sucio();
    }));
    m.querySelector('[data-original]').onclick = () => {
      Object.assign(actual, originales);
      m.querySelectorAll('input[type=color]').forEach((inp) => { inp.value = actual[inp.dataset.var]; });
      b.colores = { ...actual };
      aplica();
      guardaBorrador();
      sucio();
    };
    m.querySelector('[data-listo]').onclick = () => m.classList.remove('ver');
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('ver'); });
  }

  /* ═════════════════════ GUARDAR ═════════════════════ */
  /* Aplica el borrador sobre el HTML ORIGINAL. Devuelve el HTML nuevo o
     lanza un error si el original no cuadra con lo que se editó. */
  function aplicaSobreOriginal(htmlOriginal, rev) {
    const doc = new DOMParser().parseFromString(htmlOriginal, 'text/html');
    const orig = marcar(doc);
    for (const k of ['boton', 'enlace', 'texto', 'img', 'fondo']) {
      if (orig[k].length !== vivo[k].length) {
        throw new Error('la página publicada cambió desde que la abrieron. Recarguen, vuelvan a hacer el cambio y guarden.');
      }
    }
    const estilos = (el, g) => ['color', 'backgroundColor', 'borderColor', 'fontSize'].forEach((p) => {
      if (g[p] === undefined) return;
      el.style[p] = g[p];
      if (p === 'borderColor' && g[p]) { el.style.borderStyle = 'solid'; el.style.borderWidth = el.style.borderWidth || '1px'; }
    });
    for (const [i, g] of Object.entries(b.texto)) {
      const el = orig.texto[i];
      if (!el) continue;
      if (g.html !== undefined) {
        if (el.hasAttribute('data-palabras')) {
          // La frase que se «escribe» al bajar va palabra por palabra
          const tmp = doc.createElement('div');
          tmp.innerHTML = g.html;
          el.innerHTML = tmp.textContent.trim().split(/\s+/).map((p) => `<span class="palabra">${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}&nbsp;</span>`).join('');
        } else {
          el.innerHTML = g.html;
        }
        // La marquesina va dos veces seguidas para dar la vuelta sin salto
        if (el.matches('.marquesina-pista > span:first-child')) {
          el.parentElement.querySelectorAll(':scope > span').forEach((otro) => { if (otro !== el) otro.innerHTML = el.innerHTML; });
        }
      }
      estilos(el, g);
    }
    for (const [i, g] of Object.entries(b.boton)) {
      const el = orig.boton[i];
      if (!el) continue;
      if (g.html !== undefined) el.innerHTML = g.html;
      estilos(el, g);
    }
    for (const [i, g] of Object.entries(b.enlace)) {
      const el = orig.enlace[i];
      if (!el) continue;
      if (g.html !== undefined) el.innerHTML = g.html;
      if (g.href !== undefined) el.setAttribute('href', g.href);
      estilos(el, g);
    }
    for (const [i, g] of Object.entries(b.img)) {
      const el = orig.img[i];
      if (el && g.src) { el.setAttribute('src', g.src); el.removeAttribute('srcset'); }
    }
    for (const [i, g] of Object.entries(b.fondo)) {
      const el = orig.fondo[i];
      if (el && g.src) el.style.backgroundImage = `url('${g.src}')`;
    }
    doc.querySelectorAll('[style=""]').forEach((el) => el.removeAttribute('style'));
    if (b.colores) {
      let s = doc.getElementById('moed-colores');
      if (!s) { s = doc.createElement('style'); s.id = 'moed-colores'; doc.head.appendChild(s); }
      s.textContent = cssColores(b.colores);
    }
    // Marca de revisión: así se sabe cuándo el sitio publicado ya trae el cambio
    let meta = doc.querySelector('meta[name="med-rev"]');
    if (!meta) { meta = doc.createElement('meta'); meta.setAttribute('name', 'med-rev'); doc.head.appendChild(meta); }
    meta.setAttribute('content', rev);
    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  }

  async function guardar() {
    if (!token()) { pideAcceso(); return; }
    document.activeElement?.blur?.();
    const boton = document.getElementById('med-guardar');
    const texto = boton.querySelector('span');
    boton.disabled = true;
    texto.textContent = 'Guardando…';
    try {
      const ruta = rutaRepo();
      const r = await gh(`/contents/${ruta}?ref=${GH.rama}`);
      if (r.status === 401) {
        try { localStorage.removeItem('gh_token'); } catch (_) { /* nada */ }
        pideAcceso(guardar);
        throw new Error('GitHub ya no acepta el token guardado. Peguen uno nuevo.');
      }
      if (!r.ok) throw new Error(`no se pudo leer la página del repo (${r.status}).`);
      const { sha, content } = await r.json();
      const rev = String(Date.now());
      const html = aplicaSobreOriginal(deB64(content), rev);
      const p = await gh(`/contents/${ruta}`, { method: 'PUT', body: JSON.stringify({ message: `Editor MOËD: actualizar ${ruta}`, content: aB64(html), sha, branch: GH.rama }) });
      if (!p.ok) throw new Error((await p.json().catch(() => ({}))).message || `GitHub respondió ${p.status}`);

      try { sessionStorage.removeItem(CLAVE); } catch (_) { /* nada */ }
      ['texto', 'boton', 'enlace', 'img', 'fondo'].forEach((k) => { b[k] = {}; });
      b.colores = null;
      document.querySelector('#med-barra .punto')?.classList.remove('ver');
      texto.textContent = 'Guardado';
      setTimeout(() => { texto.textContent = 'Guardar y publicar'; }, 2500);

      const despliegue = (() => { try { return localStorage.getItem('easypanel_url'); } catch (_) { return null; } })();
      if (despliegue) {
        aviso('Guardado. Publicando el sitio…', 'ok', 5000);
        try { await fetch(despliegue, { mode: 'no-cors' }); } catch (_) { /* se comprueba abajo */ }
        compruebaPublicado(rev);
      } else {
        aviso('Guardado en GitHub. Sin la URL de despliegue de EasyPanel, el sitio se actualiza cuando alguien le dé «Implementar».', 'ok', 8000);
      }
    } catch (err) {
      texto.textContent = 'Guardar y publicar';
      boton.disabled = false;
      aviso(`No se guardó: ${err.message}`, 'mal', 8000);
    }
  }

  /* Mira el sitio publicado hasta encontrar la revisión recién subida: es lo
     que separa «guardé» de «ya está en vivo». */
  async function compruebaPublicado(rev) {
    const limite = Date.now() + 150000;
    while (Date.now() < limite) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const r = await fetch(`${location.pathname}?med=${Date.now()}`, { cache: 'no-store' });
        if (r.ok && (await r.text()).includes(rev)) { aviso('Listo: el sitio ya está publicado con sus cambios.', 'ok', 7000); return; }
      } catch (_) { /* el servidor puede estar reiniciando */ }
    }
    aviso('Se guardó en GitHub, pero el sitio sigue con la versión anterior. Entren a EasyPanel y denle «Implementar».', 'mal', 12000);
  }

  /* ═════════════════════ ACCESO ═════════════════════ */
  function pideAcceso(alEntrar) {
    const m = document.createElement('div');
    m.id = 'med-acceso';
    m.className = 'med-fondo-modal ver';
    m.innerHTML = `<div class="med-caja" role="dialog" aria-modal="true" aria-label="Entrar al modo edición">
      <h3>Modo edición</h3>
      <p>Para guardar cambios en el sitio, peguen un <strong>token de GitHub</strong> con permiso de escritura sobre el repositorio ${GH.owner}/${GH.repo}. Se queda solo en este navegador.</p>
      <label for="ma-token">Token de GitHub</label>
      <input type="password" id="ma-token" placeholder="github_pat_…" autocomplete="off">
      <label for="ma-despliegue">URL de despliegue de EasyPanel (opcional)</label>
      <input type="url" id="ma-despliegue" placeholder="https://…/api/deploy/…" autocomplete="off">
      <div class="med-estado" id="ma-estado"></div>
      <div class="med-acciones"><button type="button" class="principal" id="ma-entrar">Entrar al editor</button></div></div>`;
    document.body.appendChild(m);
    const tok = document.getElementById('ma-token');
    const dep = document.getElementById('ma-despliegue');
    const est = document.getElementById('ma-estado');
    const entrar = document.getElementById('ma-entrar');
    try { dep.value = localStorage.getItem('easypanel_url') || ''; } catch (_) { /* nada */ }
    setTimeout(() => tok.focus(), 50);
    async function prueba() {
      const t = tok.value.trim();
      if (!t) return;
      entrar.disabled = true;
      est.className = 'med-estado';
      est.textContent = 'Revisando…';
      try {
        const r = await fetch(API, { headers: { Authorization: `token ${t}`, Accept: 'application/vnd.github+json' } });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error('GitHub no reconoce ese token.');
        if (d.permissions && !d.permissions.push) throw new Error('Ese token no puede escribir en el repositorio.');
        localStorage.setItem('gh_token', t);
        if (dep.value.trim()) localStorage.setItem('easypanel_url', dep.value.trim());
        else localStorage.removeItem('easypanel_url');
        m.remove();
        alEntrar?.();
      } catch (err) {
        est.className = 'med-estado mal';
        est.textContent = err.message;
        entrar.disabled = false;
      }
    }
    entrar.onclick = prueba;
    tok.addEventListener('keydown', (e) => { if (e.key === 'Enter') prueba(); });
  }

  /* ═════════════════════ ARRANQUE ═════════════════════ */
  function arranca() {
    vivo = marcar(document);
    barra();
    flotante();
    modalImagen();
    panelColores();
    habilita();
    if (hayCambios()) {
      sucio();
      aviso('Se recuperaron los cambios que no se habían guardado.');
    } else {
      aviso('Modo edición: clic en un texto para escribir, en una foto para cambiarla. Clic derecho en un enlace para seguirlo.', 'ok', 8000);
    }
  }

  const empieza = () => (token() ? arranca() : pideAcceso(arranca));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', empieza);
  else empieza();
})();
