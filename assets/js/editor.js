/* ═══════════════════════════════════════════════════════════
   MOED Visual Editor — activa con ?edit=1 en la URL
   Token de GitHub se guarda en sessionStorage, nunca en código
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!new URLSearchParams(window.location.search).has('edit')) return;

  /* ── Config del repo ─────────────────────────────────────── */
  const GH_OWNER  = 'emilianotkpa-blip';
  const GH_REPO   = 'Moed';
  const GH_BRANCH = 'main';

  /* ── Estado ──────────────────────────────────────────────── */
  let dirty        = false;
  let colorPanel   = null;
  let sizeBar      = null;
  let activeFocused = null;

  /* ── Color overrides actuales (por sesión) ───────────────── */
  const colorKeys = {
    gold:   { label: 'Color dorado (principal)', value: '#C9A86A' },
    cream:  { label: 'Fondo oscuro',             value: '#0E0E0C' },
    ink:    { label: 'Texto principal',           value: '#F5F0E6' },
    border: { label: 'Bordes / líneas',           value: '#2A2A25' },
  };
  try {
    const saved = JSON.parse(sessionStorage.getItem('moed_colors') || '{}');
    Object.keys(saved).forEach(k => { if (colorKeys[k]) colorKeys[k].value = saved[k]; });
  } catch (_) {}

  /* ═══════════════════════════════════════════════════════════
     ESTILOS DEL EDITOR (inyectados, no tocan main.css)
  ════════════════════════════════════════════════════════════ */
  const editorCSS = `
    #moed-toolbar{position:fixed;top:0;left:0;right:0;z-index:2147483647;
      display:flex;align-items:center;gap:12px;padding:0 20px;height:48px;
      background:#111110;border-bottom:1px solid #C9A86A44;
      font-family:system-ui,sans-serif;font-size:13px;color:#F5F0E6;
      box-shadow:0 2px 16px #00000088;}
    #moed-toolbar .med-logo{font-weight:600;letter-spacing:.12em;color:#C9A86A;
      text-transform:uppercase;font-size:11px;margin-right:4px;}
    #moed-toolbar .med-badge{background:#C9A86A22;border:1px solid #C9A86A55;
      color:#C9A86A;font-size:10px;padding:2px 8px;border-radius:99px;
      text-transform:uppercase;letter-spacing:.1em;}
    #moed-toolbar .med-dirty{color:#C9A86A;font-size:18px;line-height:1;
      margin-left:2px;opacity:0;transition:opacity .2s;}
    #moed-toolbar .med-dirty.show{opacity:1;}
    #moed-toolbar .med-spacer{flex:1;}
    #moed-toolbar button{cursor:pointer;border:1px solid #2A2A25;background:#1A1A18;
      color:#F5F0E6;font-size:12px;padding:6px 14px;border-radius:4px;
      font-family:inherit;transition:all .15s;}
    #moed-toolbar button:hover{border-color:#C9A86A;color:#C9A86A;}
    #moed-toolbar #med-btn-save{background:#C9A86A;border-color:#C9A86A;
      color:#0E0E0C;font-weight:600;}
    #moed-toolbar #med-btn-save:hover{background:#DFC090;border-color:#DFC090;}
    #moed-toolbar #med-btn-save:disabled{opacity:.5;cursor:not-allowed;}

    /* Elementos editables */
    [data-med-text]:hover{outline:1px dashed #C9A86A55;outline-offset:2px;cursor:text;}
    [data-med-text]:focus{outline:2px solid #C9A86A;outline-offset:3px;}
    [data-med-text]:empty:before{content:attr(data-med-placeholder);color:#66665e;}

    /* Overlay imagen */
    .med-img-wrap{position:relative;display:inline-block;}
    .med-img-wrap .med-img-overlay{position:absolute;inset:0;background:#C9A86A22;
      display:flex;align-items:center;justify-content:center;opacity:0;
      transition:opacity .2s;cursor:pointer;z-index:10;}
    .med-img-wrap:hover .med-img-overlay{opacity:1;}
    .med-img-overlay span{background:#0E0E0C;border:1px solid #C9A86A;
      color:#C9A86A;font-size:11px;padding:6px 12px;border-radius:4px;
      font-family:system-ui,sans-serif;pointer-events:none;}

    /* Mini-toolbar tamaño */
    #med-size-bar{position:fixed;z-index:2147483646;display:none;
      background:#111110;border:1px solid #2A2A25;border-radius:6px;
      padding:4px 8px;gap:6px;align-items:center;box-shadow:0 4px 12px #00000066;
      font-family:system-ui,sans-serif;font-size:12px;color:#A8A296;}
    #med-size-bar.show{display:flex;}
    #med-size-bar button{background:none;border:none;color:#C9A86A;
      font-size:16px;cursor:pointer;padding:2px 4px;line-height:1;}
    #med-size-bar span{min-width:36px;text-align:center;color:#F5F0E6;}

    /* Panel de colores */
    #med-color-panel{position:fixed;top:56px;right:16px;z-index:2147483646;
      background:#111110;border:1px solid #2A2A25;border-radius:8px;
      padding:20px;width:280px;box-shadow:0 8px 32px #00000088;
      font-family:system-ui,sans-serif;display:none;}
    #med-color-panel.show{display:block;}
    #med-color-panel h3{margin:0 0 16px;font-size:11px;text-transform:uppercase;
      letter-spacing:.15em;color:#C9A86A;font-weight:600;}
    #med-color-panel .med-color-row{display:flex;align-items:center;
      gap:12px;margin-bottom:14px;}
    #med-color-panel .med-color-row label{font-size:12px;color:#A8A296;flex:1;}
    #med-color-panel .med-color-row input[type=color]{width:36px;height:28px;
      border:1px solid #2A2A25;background:none;cursor:pointer;border-radius:4px;
      padding:2px;}

    /* Modal imagen */
    #med-img-modal{position:fixed;inset:0;z-index:2147483647;
      background:#080806cc;display:none;align-items:center;justify-content:center;}
    #med-img-modal.show{display:flex;}
    #med-img-modal .med-modal-box{background:#111110;border:1px solid #2A2A25;
      border-radius:10px;padding:28px;width:480px;max-width:90vw;
      font-family:system-ui,sans-serif;}
    #med-img-modal h3{margin:0 0 16px;font-size:13px;color:#F5F0E6;font-weight:600;}
    #med-img-modal input{width:100%;box-sizing:border-box;background:#1A1A18;
      border:1px solid #2A2A25;color:#F5F0E6;font-size:13px;padding:10px 12px;
      border-radius:6px;outline:none;margin-bottom:14px;}
    #med-img-modal input:focus{border-color:#C9A86A;}
    #med-img-modal .med-preview{width:100%;height:160px;object-fit:cover;
      border-radius:6px;margin-bottom:16px;background:#1A1A18;display:block;}
    #med-img-modal .med-modal-actions{display:flex;gap:10px;justify-content:flex-end;}
    #med-img-modal button{cursor:pointer;border:1px solid #2A2A25;background:#1A1A18;
      color:#F5F0E6;font-size:12px;padding:8px 16px;border-radius:4px;font-family:inherit;}
    #med-img-modal #med-img-apply{background:#C9A86A;border-color:#C9A86A;
      color:#0E0E0C;font-weight:600;}

    /* Modal auth */
    #med-auth-modal{position:fixed;inset:0;z-index:2147483647;
      background:#080806ee;display:flex;align-items:center;justify-content:center;}
    #med-auth-modal .med-modal-box{background:#111110;border:1px solid #C9A86A44;
      border-radius:10px;padding:32px;width:420px;max-width:90vw;
      font-family:system-ui,sans-serif;text-align:center;}
    #med-auth-modal .med-logo-big{font-size:22px;letter-spacing:.3em;color:#C9A86A;
      margin-bottom:8px;font-weight:300;}
    #med-auth-modal p{color:#A8A296;font-size:13px;margin:8px 0 20px;line-height:1.6;}
    #med-auth-modal input{width:100%;box-sizing:border-box;background:#1A1A18;
      border:1px solid #2A2A25;color:#F5F0E6;font-size:13px;padding:11px 14px;
      border-radius:6px;outline:none;margin-bottom:12px;letter-spacing:.04em;}
    #med-auth-modal input:focus{border-color:#C9A86A;}
    #med-auth-modal button{width:100%;background:#C9A86A;border:none;color:#0E0E0C;
      font-size:13px;font-weight:600;padding:12px;border-radius:6px;cursor:pointer;
      font-family:inherit;letter-spacing:.08em;text-transform:uppercase;}
    #med-auth-modal .med-err{color:#f87171;font-size:12px;margin-top:8px;display:none;}

    /* Toast */
    #med-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      z-index:2147483647;padding:12px 24px;border-radius:8px;font-family:system-ui,sans-serif;
      font-size:13px;font-weight:500;box-shadow:0 4px 24px #00000088;
      transition:opacity .3s;opacity:0;pointer-events:none;}
    #med-toast.show{opacity:1;}
    #med-toast.ok{background:#166534;color:#bbf7d0;border:1px solid #16a34a55;}
    #med-toast.err{background:#7f1d1d;color:#fecaca;border:1px solid #dc262655;}

    /* Empujar contenido de la página hacia abajo */
    body{padding-top:48px !important;}
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = editorCSS;
  document.head.appendChild(styleEl);

  /* ═══════════════════════════════════════════════════════════
     HELPER: ruta del archivo en el repo
  ════════════════════════════════════════════════════════════ */
  function getRepoPath() {
    const p = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    return p ? p + '/index.html' : 'index.html';
  }

  /* ═══════════════════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════════════════════ */
  function toast(msg, type = 'ok', ms = 4000) {
    let el = document.getElementById('med-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'med-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ''; }, ms);
  }

  /* ═══════════════════════════════════════════════════════════
     COLOR OVERRIDES
  ════════════════════════════════════════════════════════════ */
  function buildColorCSS(colors) {
    const g = colors.gold, c = colors.cream, i = colors.ink, b = colors.border;
    return `
/* moed-color-overrides — generado por el editor visual */
:root{--gold:${g};--gold-light:${lighten(g,15)};--gold-dark:${darken(g,15)};--cream:${c};--cream-dark:${darken(c,-5)};--ink:${i};--border:${b};}
.bg-olive,.bg-gold{background-color:${g}!important;}
.text-olive,.text-gold{color:${g}!important;}
.border-olive,.border-gold{border-color:${g}!important;}
.bg-cream{background-color:${c}!important;}
.text-brand-dark{color:${i}!important;}
.border-brand-border{border-color:${b}!important;}
.btn-primary{background-color:${g}!important;}
.btn-primary:hover{background-color:${darken(g,10)}!important;}
.btn-outline{border-color:${g}!important;color:${i}!important;}
.btn-outline:hover{background-color:${g}!important;color:${c}!important;}
.nav-link.active{color:${g}!important;border-bottom-color:${g}!important;}
.label{color:${g}!important;}
.gold-divider{background-color:${g}!important;}
.hover\\:bg-olive:hover,.hover\\:text-gold:hover,.hover\\:text-olive:hover{color:${g}!important;background-color:${g}!important;}
#main-nav[data-scrolled=true]{border-bottom-color:${g}44!important;}`.trim();
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  }
  function rgbToHex(r,g,b) {
    return '#' + [r,g,b].map(x => Math.min(255,Math.max(0,x)).toString(16).padStart(2,'0')).join('');
  }
  function lighten(hex, amt) {
    const [r,g,b] = hexToRgb(hex);
    return rgbToHex(r+amt, g+amt, b+amt);
  }
  function darken(hex, amt) {
    return lighten(hex, -amt);
  }

  function applyColors(colors) {
    let el = document.getElementById('moed-color-overrides');
    if (!el) {
      el = document.createElement('style');
      el.id = 'moed-color-overrides';
      document.head.appendChild(el);
    }
    el.textContent = buildColorCSS(colors);
    sessionStorage.setItem('moed_colors', JSON.stringify(
      Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,v]))
    ));
  }

  /* Aplicar colores guardados en sesión al cargar */
  const savedColorVals = {};
  Object.entries(colorKeys).forEach(([k,v]) => { savedColorVals[k] = v.value; });
  const anyNonDefault = Object.entries(colorKeys).some(
    ([k,v]) => v.value !== { gold:'#C9A86A', cream:'#0E0E0C', ink:'#F5F0E6', border:'#2A2A25' }[k]
  );
  if (anyNonDefault) applyColors(savedColorVals);

  /* ═══════════════════════════════════════════════════════════
     TOOLBAR
  ════════════════════════════════════════════════════════════ */
  function buildToolbar() {
    const bar = document.createElement('div');
    bar.id = 'moed-toolbar';
    bar.innerHTML = `
      <span class="med-logo">MOED</span>
      <span class="med-badge">Editor</span>
      <span class="med-dirty" id="med-dirty">●</span>
      <span class="med-spacer"></span>
      <button id="med-btn-colors">🎨 Colores</button>
      <button id="med-btn-cancel">Cancelar</button>
      <button id="med-btn-save" disabled>💾 Guardar</button>
    `;
    document.body.prepend(bar);

    document.getElementById('med-btn-cancel').onclick = () => {
      if (!dirty || confirm('¿Descartar cambios?')) {
        window.location.reload();
      }
    };
    document.getElementById('med-btn-save').onclick = saveToGitHub;
    document.getElementById('med-btn-colors').onclick = toggleColorPanel;
  }

  function markDirty() {
    dirty = true;
    const d = document.getElementById('med-dirty');
    const s = document.getElementById('med-btn-save');
    if (d) d.classList.add('show');
    if (s) s.disabled = false;
  }

  /* ═══════════════════════════════════════════════════════════
     EDICIÓN DE TEXTO
  ════════════════════════════════════════════════════════════ */
  const TEXT_SELECTORS = 'h1,h2,h3,h4,h5,p,span.label,blockquote,li,.section-title,.page-hero-title';

  function enableTextEditing() {
    document.querySelectorAll(TEXT_SELECTORS).forEach(el => {
      if (el.closest('#moed-toolbar,#med-color-panel,#med-img-modal,#med-auth-modal,#med-size-bar')) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-med-text', '1');
      el.style.cursor = 'text';

      el.addEventListener('focus', () => {
        activeFocused = el;
        showSizeBar(el);
      });
      el.addEventListener('blur', () => {
        hideSizeBar();
        activeFocused = null;
        markDirty();
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); el.blur(); }
      });
    });
  }

  /* ── Mini-toolbar tamaño ─────────────────────────────────── */
  function buildSizeBar() {
    sizeBar = document.createElement('div');
    sizeBar.id = 'med-size-bar';
    sizeBar.innerHTML = `
      <button id="med-sz-down" title="Reducir">A−</button>
      <span id="med-sz-val">16px</span>
      <button id="med-sz-up" title="Aumentar">A+</button>
    `;
    document.body.appendChild(sizeBar);
    document.getElementById('med-sz-down').onmousedown = e => { e.preventDefault(); changeSize(-2); };
    document.getElementById('med-sz-up').onmousedown  = e => { e.preventDefault(); changeSize(+2); };
  }

  function showSizeBar(el) {
    if (!sizeBar) return;
    const rect = el.getBoundingClientRect();
    const sz   = Math.round(parseFloat(getComputedStyle(el).fontSize));
    document.getElementById('med-sz-val').textContent = sz + 'px';
    sizeBar.style.top  = (rect.top + window.scrollY - 44) + 'px';
    sizeBar.style.left = rect.left + 'px';
    sizeBar.classList.add('show');
  }

  function hideSizeBar() {
    setTimeout(() => { if (!activeFocused) sizeBar && sizeBar.classList.remove('show'); }, 80);
  }

  function changeSize(delta) {
    if (!activeFocused) return;
    const cur = parseFloat(getComputedStyle(activeFocused).fontSize) || 16;
    const next = Math.max(8, cur + delta);
    activeFocused.style.fontSize = next + 'px';
    document.getElementById('med-sz-val').textContent = Math.round(next) + 'px';
    markDirty();
  }

  /* ═══════════════════════════════════════════════════════════
     EDICIÓN DE IMÁGENES
  ════════════════════════════════════════════════════════════ */
  let currentImgEl = null;

  function buildImgModal() {
    const modal = document.createElement('div');
    modal.id = 'med-img-modal';
    modal.innerHTML = `
      <div class="med-modal-box">
        <h3>Cambiar imagen</h3>
        <input id="med-img-url" type="url" placeholder="https://images.unsplash.com/photo-... o cualquier URL de imagen">
        <img id="med-img-preview" class="med-preview" src="" alt="Vista previa">
        <div class="med-modal-actions">
          <button id="med-img-cancel">Cancelar</button>
          <button id="med-img-apply">Aplicar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const urlInput = document.getElementById('med-img-url');
    const preview  = document.getElementById('med-img-preview');

    let debTimer;
    urlInput.addEventListener('input', () => {
      clearTimeout(debTimer);
      debTimer = setTimeout(() => { preview.src = urlInput.value; }, 600);
    });
    document.getElementById('med-img-cancel').onclick = () => { modal.classList.remove('show'); };
    document.getElementById('med-img-apply').onclick  = () => {
      if (currentImgEl && urlInput.value.trim()) {
        currentImgEl.src = urlInput.value.trim();
        markDirty();
      }
      modal.classList.remove('show');
    };
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
  }

  function openImgModal(imgEl) {
    currentImgEl = imgEl;
    document.getElementById('med-img-url').value = imgEl.src;
    document.getElementById('med-img-preview').src = imgEl.src;
    document.getElementById('med-img-modal').classList.add('show');
    setTimeout(() => document.getElementById('med-img-url').focus(), 50);
  }

  function enableImageEditing() {
    document.querySelectorAll('img').forEach(img => {
      if (img.closest('#moed-toolbar,#med-img-modal,#med-auth-modal')) return;
      const wrap = document.createElement('span');
      wrap.className = 'med-img-wrap';
      const overlay = document.createElement('span');
      overlay.className = 'med-img-overlay';
      overlay.innerHTML = '<span>📷 Cambiar imagen</span>';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      wrap.appendChild(overlay);
      overlay.addEventListener('click', () => openImgModal(img));
    });
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL DE COLORES
  ════════════════════════════════════════════════════════════ */
  function buildColorPanel() {
    colorPanel = document.createElement('div');
    colorPanel.id = 'med-color-panel';

    let rows = '<h3>Colores del sitio</h3>';
    Object.entries(colorKeys).forEach(([k, {label, value}]) => {
      rows += `
        <div class="med-color-row">
          <label>${label}</label>
          <input type="color" data-color-key="${k}" value="${value}">
        </div>`;
    });
    rows += `<button id="med-colors-reset" style="margin-top:8px;width:100%;background:none;border:1px solid #2A2A25;color:#A8A296;font-size:11px;padding:6px;border-radius:4px;cursor:pointer;">Resetear colores originales</button>`;
    colorPanel.innerHTML = rows;
    document.body.appendChild(colorPanel);

    colorPanel.querySelectorAll('input[type=color]').forEach(input => {
      input.addEventListener('input', () => {
        colorKeys[input.dataset.colorKey].value = input.value;
        const vals = {};
        Object.entries(colorKeys).forEach(([k,v]) => { vals[k] = v.value; });
        applyColors(vals);
        markDirty();
      });
    });
    document.getElementById('med-colors-reset').onclick = () => {
      const defaults = { gold:'#C9A86A', cream:'#0E0E0C', ink:'#F5F0E6', border:'#2A2A25' };
      Object.entries(defaults).forEach(([k,v]) => {
        colorKeys[k].value = v;
        colorPanel.querySelector(`[data-color-key="${k}"]`).value = v;
      });
      const el = document.getElementById('moed-color-overrides');
      if (el) el.remove();
      sessionStorage.removeItem('moed_colors');
      markDirty();
    };
  }

  function toggleColorPanel() {
    colorPanel && colorPanel.classList.toggle('show');
  }

  /* ═══════════════════════════════════════════════════════════
     GUARDAR → GITHUB API
  ════════════════════════════════════════════════════════════ */
  async function saveToGitHub() {
    const token = sessionStorage.getItem('gh_token');
    if (!token) { toast('Sin token de GitHub', 'err'); return; }

    const btn = document.getElementById('med-btn-save');
    btn.disabled = true;
    btn.textContent = '⏳ Guardando…';

    try {
      const path = getRepoPath();

      /* Serializar HTML limpio */
      const clone = document.documentElement.cloneNode(true);

      /* Quitar artefactos del editor del clone */
      ['#moed-toolbar','#med-color-panel','#med-img-modal','#med-size-bar','#med-toast','#med-auth-modal'].forEach(sel => {
        clone.querySelector(sel)?.remove();
      });
      clone.querySelectorAll('[data-med-text]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-med-text');
        el.style.cursor = '';
        if (!el.style.length) el.removeAttribute('style');
      });
      /* Quitar wraps de imagen (dejar el <img> directo) */
      clone.querySelectorAll('.med-img-wrap').forEach(wrap => {
        const img = wrap.querySelector('img');
        if (img) wrap.parentNode.replaceChild(img, wrap);
      });
      /* Quitar padding-top del body que inyecta el editor */
      clone.querySelector('body').style.paddingTop = '';

      /* Mantener style#moed-color-overrides si hay colores custom */
      /* (ya está en el clone porque es parte del head) */

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;

      /* GET → obtener SHA actual */
      const getRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
        { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' } }
      );
      if (!getRes.ok) throw new Error('No se pudo leer el archivo. Verifica el token.');
      const { sha } = await getRes.json();

      /* PUT → actualizar */
      const putRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            Authorization: 'token ' + token,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
          },
          body: JSON.stringify({
            message: `Editor MOED: actualizar ${path}`,
            content: btoa(unescape(encodeURIComponent(html))),
            sha,
            branch: GH_BRANCH,
          }),
        }
      );
      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || 'Error al guardar');
      }

      dirty = false;
      document.getElementById('med-dirty').classList.remove('show');
      btn.textContent = '✓ Guardado';
      setTimeout(() => { btn.textContent = '💾 Guardar'; btn.disabled = false; }, 3000);
      toast('¡Guardado! El sitio se actualizará en ~30 segundos.', 'ok');

    } catch (err) {
      btn.textContent = '💾 Guardar';
      btn.disabled = false;
      toast('Error: ' + err.message, 'err', 6000);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     AUTH — Modal para pedir el GitHub PAT
  ════════════════════════════════════════════════════════════ */
  function buildAuthModal(onSuccess) {
    const modal = document.createElement('div');
    modal.id = 'med-auth-modal';
    modal.innerHTML = `
      <div class="med-modal-box">
        <div class="med-logo-big">MOED</div>
        <p>Modo edición activo.<br>
           Ingresa tu <strong style="color:#F5F0E6">GitHub Personal Access Token</strong><br>
           para poder guardar cambios en el sitio.</p>
        <input id="med-token-input" type="password" placeholder="github_pat_..." autocomplete="off">
        <div class="med-err" id="med-token-err">Token inválido o sin permisos de escritura.</div>
        <button id="med-token-btn">Entrar al editor</button>
      </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('med-token-input');
    const errEl = document.getElementById('med-token-err');
    const btn   = document.getElementById('med-token-btn');

    async function tryToken() {
      const tok = input.value.trim();
      if (!tok) return;
      btn.disabled = true;
      btn.textContent = 'Verificando…';
      errEl.style.display = 'none';
      try {
        /* Verificar el token con un GET del repo */
        const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`, {
          headers: { Authorization: 'token ' + tok }
        });
        if (!res.ok) throw new Error('invalid');
        sessionStorage.setItem('gh_token', tok);
        modal.remove();
        onSuccess();
      } catch (_) {
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Entrar al editor';
      }
    }

    btn.onclick = tryToken;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryToken(); });
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════ */
  function init() {
    buildToolbar();
    buildSizeBar();
    buildImgModal();
    buildColorPanel();
    enableTextEditing();
    enableImageEditing();
    toast('Modo edición activo. Haz clic en cualquier texto o imagen para editar.', 'ok', 5000);
  }

  if (sessionStorage.getItem('gh_token')) {
    init();
  } else {
    /* Mostrar auth modal antes de activar el editor */
    document.addEventListener('DOMContentLoaded', () => {
      buildAuthModal(init);
    });
    if (document.readyState !== 'loading') buildAuthModal(init);
  }

})();
