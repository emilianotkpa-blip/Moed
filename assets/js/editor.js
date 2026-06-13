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
  let dirty         = false;
  let colorPanel    = null;
  let sizeBar       = null;
  let activeFocused = null;

  /* ── Draft: cambios en memoria por página ────────────────── */
  const PAGE_KEY = 'moed_draft_' + window.location.pathname;
  let draft = {};
  try { draft = JSON.parse(sessionStorage.getItem(PAGE_KEY) || '{}'); } catch (_) {}
  /* draft = { texts: {idx: {html, fontSize}}, images: {idx: src} } */
  if (!draft.texts)  draft.texts  = {};
  if (!draft.images) draft.images = {};

  function saveDraft() {
    try { sessionStorage.setItem(PAGE_KEY, JSON.stringify(draft)); } catch (_) {}
  }
  function clearDraft() {
    try { sessionStorage.removeItem(PAGE_KEY); } catch (_) {}
  }

  /* ── Color overrides (por sesión, afecta todas las páginas) ─ */
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
     ESTILOS DEL EDITOR
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

    [data-med-text]:hover{outline:1px dashed #C9A86A55;outline-offset:2px;cursor:text;}
    [data-med-text]:focus{outline:2px solid #C9A86A;outline-offset:3px;}

    /* Imágenes editables — sin tocar el DOM, solo cursor */
    img[data-med-img]{cursor:pointer !important;outline:0 solid #C9A86A44;transition:outline .15s;}
    img[data-med-img]:hover{outline:3px solid #C9A86A88;}

    #med-size-bar{position:fixed;z-index:2147483646;display:none;
      background:#111110;border:1px solid #2A2A25;border-radius:6px;
      padding:4px 8px;gap:6px;align-items:center;box-shadow:0 4px 12px #00000066;
      font-family:system-ui,sans-serif;font-size:12px;color:#A8A296;}
    #med-size-bar.show{display:flex;}
    #med-size-bar button{background:none;border:none;color:#C9A86A;
      font-size:16px;cursor:pointer;padding:2px 4px;line-height:1;}
    #med-size-bar span{min-width:36px;text-align:center;color:#F5F0E6;}

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
      border:1px solid #2A2A25;background:none;cursor:pointer;border-radius:4px;padding:2px;}

    #med-img-modal{position:fixed;inset:0;z-index:2147483647;
      background:#080806cc;display:none;align-items:center;justify-content:center;}
    #med-img-modal.show{display:flex;}
    #med-img-modal .med-modal-box{background:#111110;border:1px solid #2A2A25;
      border-radius:10px;padding:28px;width:500px;max-width:92vw;
      font-family:system-ui,sans-serif;}
    #med-img-modal h3{margin:0 0 6px;font-size:13px;color:#F5F0E6;font-weight:600;}
    #med-img-modal .med-url-hint{font-size:11px;color:#6B6560;margin:0 0 14px;line-height:1.5;}
    #med-img-modal .med-url-hint a{color:#C9A86A;text-decoration:none;}
    #med-img-modal input{width:100%;box-sizing:border-box;background:#1A1A18;
      border:1px solid #2A2A25;color:#F5F0E6;font-size:13px;padding:10px 12px;
      border-radius:6px;outline:none;margin-bottom:10px;}
    #med-img-modal input:focus{border-color:#C9A86A;}
    #med-img-modal .med-preview-wrap{position:relative;width:100%;height:160px;
      background:#1A1A18;border-radius:6px;margin-bottom:6px;overflow:hidden;}
    #med-img-modal .med-preview{width:100%;height:100%;object-fit:cover;display:block;}
    #med-img-modal .med-preview-msg{position:absolute;inset:0;display:flex;
      align-items:center;justify-content:center;font-size:12px;color:#6B6560;
      font-family:system-ui,sans-serif;pointer-events:none;}
    #med-img-modal .med-img-status{font-size:11px;margin-bottom:12px;min-height:16px;}
    #med-img-modal .med-img-status.ok{color:#86efac;}
    #med-img-modal .med-img-status.err{color:#fca5a5;}
    #med-img-modal .med-modal-actions{display:flex;gap:10px;justify-content:flex-end;}
    #med-img-modal button{cursor:pointer;border:1px solid #2A2A25;background:#1A1A18;
      color:#F5F0E6;font-size:12px;padding:8px 16px;border-radius:4px;font-family:inherit;}
    #med-img-modal #med-img-apply{background:#C9A86A;border-color:#C9A86A;
      color:#0E0E0C;font-weight:600;}
    #med-img-modal #med-img-apply:disabled{opacity:.4;cursor:not-allowed;}

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

    #med-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      z-index:2147483647;padding:12px 24px;border-radius:8px;font-family:system-ui,sans-serif;
      font-size:13px;font-weight:500;box-shadow:0 4px 24px #00000088;
      transition:opacity .3s;opacity:0;pointer-events:none;white-space:nowrap;}
    #med-toast.show{opacity:1;}
    #med-toast.ok{background:#166534;color:#bbf7d0;border:1px solid #16a34a55;}
    #med-toast.err{background:#7f1d1d;color:#fecaca;border:1px solid #dc262655;}

    body{padding-top:48px !important;}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = editorCSS;
  document.head.appendChild(styleEl);

  /* ═══════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════ */
  function getRepoPath() {
    const p = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    return p ? p + '/index.html' : 'index.html';
  }

  function toast(msg, type = 'ok', ms = 4000) {
    let el = document.getElementById('med-toast');
    if (!el) { el = document.createElement('div'); el.id = 'med-toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.className = 'show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ''; }, ms);
  }

  function markDirty() {
    dirty = true;
    const d = document.getElementById('med-dirty');
    const s = document.getElementById('med-btn-save');
    if (d) d.classList.add('show');
    if (s) s.disabled = false;
  }

  /* ═══════════════════════════════════════════════════════════
     COLOR OVERRIDES
  ════════════════════════════════════════════════════════════ */
  function hexToRgb(hex) {
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  }
  function rgbToHex(r,g,b) {
    return '#' + [r,g,b].map(x => Math.min(255,Math.max(0,x)).toString(16).padStart(2,'0')).join('');
  }
  function lighten(hex,amt){ const [r,g,b]=hexToRgb(hex); return rgbToHex(r+amt,g+amt,b+amt); }
  function darken(hex,amt){ return lighten(hex,-amt); }

  function buildColorCSS(colors) {
    const g=colors.gold, c=colors.cream, i=colors.ink, b=colors.border;
    return `/* moed-color-overrides */
:root{--gold:${g};--gold-light:${lighten(g,15)};--gold-dark:${darken(g,15)};--cream:${c};--ink:${i};--border:${b};}
.bg-olive,.bg-gold{background-color:${g}!important;}
.text-olive,.text-gold{color:${g}!important;}
.border-olive,.border-gold{border-color:${g}!important;}
.bg-cream{background-color:${c}!important;}
.text-brand-dark{color:${i}!important;}
.border-brand-border{border-color:${b}!important;}
.btn-primary{background-color:${g}!important;}
.btn-primary:hover{background-color:${darken(g,10)}!important;}
.btn-outline{border-color:${g}!important;}
.btn-outline:hover{background-color:${g}!important;color:${c}!important;}
.nav-link.active{color:${g}!important;border-bottom-color:${g}!important;}
.label{color:${g}!important;}
.gold-divider{background-color:${g}!important;}`;
  }

  function applyColors(colors) {
    let el = document.getElementById('moed-color-overrides');
    if (!el) { el = document.createElement('style'); el.id = 'moed-color-overrides'; document.head.appendChild(el); }
    el.textContent = buildColorCSS(colors);
    sessionStorage.setItem('moed_colors', JSON.stringify(Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,v]))));
  }

  const anyNonDefault = Object.entries(colorKeys).some(
    ([k,v]) => v.value !== {gold:'#C9A86A',cream:'#0E0E0C',ink:'#F5F0E6',border:'#2A2A25'}[k]
  );
  if (anyNonDefault) applyColors(Object.fromEntries(Object.entries(colorKeys).map(([k,v])=>[k,v.value])));

  /* ═══════════════════════════════════════════════════════════
     TOOLBAR
  ════════════════════════════════════════════════════════════ */
  function pushSiteNav() {
    const OFFSET = '48px';
    const nav = document.getElementById('main-nav');
    if (nav) nav.style.setProperty('top', OFFSET, 'important');
    document.querySelectorAll('header').forEach(h => {
      if (h.id === 'main-nav') return;
      const pos = getComputedStyle(h).position;
      if (pos === 'fixed' || pos === 'sticky') h.style.setProperty('top', OFFSET, 'important');
    });
    /* Re-aplica después de que los módulos JS del sitio terminen de correr */
    requestAnimationFrame(() => {
      if (nav) nav.style.setProperty('top', OFFSET, 'important');
    });
  }

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
      if (!dirty || confirm('¿Descartar cambios en esta página?')) {
        clearDraft();
        window.location.reload();
      }
    };
    document.getElementById('med-btn-save').onclick = saveToGitHub;
    document.getElementById('med-btn-colors').onclick = () => colorPanel && colorPanel.classList.toggle('show');
  }

  /* ═══════════════════════════════════════════════════════════
     EDICIÓN DE TEXTO  +  draft persistence
  ════════════════════════════════════════════════════════════ */
  const TEXT_SEL = 'h1,h2,h3,h4,h5,p,span.label,blockquote,li,.section-title,.page-hero-title';

  function enableTextEditing() {
    let idx = 0;
    document.querySelectorAll(TEXT_SEL).forEach(el => {
      if (el.closest('#moed-toolbar,#med-color-panel,#med-img-modal,#med-auth-modal,#med-size-bar')) return;

      const id = String(idx++);
      el.dataset.medText = id;
      el.setAttribute('contenteditable', 'true');
      el.style.cursor = 'text';

      /* Restaurar draft guardado */
      if (draft.texts[id]) {
        el.innerHTML = draft.texts[id].html;
        if (draft.texts[id].fontSize) el.style.fontSize = draft.texts[id].fontSize;
      }

      el.addEventListener('focus', () => {
        activeFocused = el;
        showSizeBar(el);
      });
      el.addEventListener('blur', () => {
        /* Guardar en draft */
        draft.texts[id] = { html: el.innerHTML, fontSize: el.style.fontSize || '' };
        saveDraft();
        hideSizeBar();
        activeFocused = null;
        markDirty();
      });
      el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); el.blur(); } });
    });
  }

  /* ── Mini-toolbar tamaño ─────────────────────────────────── */
  function buildSizeBar() {
    sizeBar = document.createElement('div');
    sizeBar.id = 'med-size-bar';
    sizeBar.innerHTML = `<button id="med-sz-down">A−</button><span id="med-sz-val">16px</span><button id="med-sz-up">A+</button>`;
    document.body.appendChild(sizeBar);
    document.getElementById('med-sz-down').onmousedown = e => { e.preventDefault(); changeSize(-2); };
    document.getElementById('med-sz-up').onmousedown  = e => { e.preventDefault(); changeSize(+2); };
  }

  function showSizeBar(el) {
    if (!sizeBar) return;
    const rect = el.getBoundingClientRect();
    const sz   = Math.round(parseFloat(getComputedStyle(el).fontSize));
    document.getElementById('med-sz-val').textContent = sz + 'px';
    sizeBar.style.top  = Math.max(56, rect.top + window.scrollY - 44) + 'px';
    sizeBar.style.left = rect.left + 'px';
    sizeBar.classList.add('show');
  }

  function hideSizeBar() {
    setTimeout(() => { if (!activeFocused) sizeBar && sizeBar.classList.remove('show'); }, 80);
  }

  function changeSize(delta) {
    if (!activeFocused) return;
    const cur  = parseFloat(getComputedStyle(activeFocused).fontSize) || 16;
    const next = Math.max(8, cur + delta);
    activeFocused.style.fontSize = next + 'px';
    document.getElementById('med-sz-val').textContent = Math.round(next) + 'px';
    const id = activeFocused.dataset.medText;
    if (id !== undefined) {
      draft.texts[id] = draft.texts[id] || { html: activeFocused.innerHTML };
      draft.texts[id].fontSize = next + 'px';
      saveDraft();
    }
    markDirty();
  }

  /* ═══════════════════════════════════════════════════════════
     EDICIÓN DE IMÁGENES  +  draft persistence
  ════════════════════════════════════════════════════════════ */
  let currentImgEl  = null;
  let currentImgIdx = null;

  /* Verificar si una URL carga como imagen */
  function checkImageUrl(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 8000);
    });
  }

  /* Intentar convertir links de compartir a URL directa */
  function normalizeImageUrl(raw) {
    const url = raw.trim();
    /* Google Drive: /file/d/{ID}/view → directa */
    const gd = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
    if (gd) return `https://drive.google.com/uc?export=view&id=${gd[1]}`;
    /* Dropbox: ?dl=0 → ?raw=1 */
    if (url.includes('dropbox.com') && url.includes('dl=0'))
      return url.replace('dl=0', 'raw=1');
    /* Dropbox: www.dropbox → dl.dropboxusercontent */
    if (url.includes('www.dropbox.com'))
      return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0','');
    return url;
  }

  function buildImgModal() {
    const modal = document.createElement('div');
    modal.id = 'med-img-modal';
    modal.innerHTML = `
      <div class="med-modal-box">
        <h3>Cambiar imagen</h3>
        <p class="med-url-hint">
          Pega una URL directa de imagen (.jpg, .png, .webp).<br>
          ✅ Unsplash &nbsp;·&nbsp; ✅ WordPress / tu hosting &nbsp;·&nbsp; ✅ Dropbox &nbsp;·&nbsp; ✅ Imgur<br>
          ⚠️ Google Drive: comparte el archivo como "Cualquier persona con el enlace"<br>
          ❌ Google Photos &nbsp;·&nbsp; ❌ Instagram &nbsp;·&nbsp; ❌ URLs que requieren login
        </p>
        <input id="med-img-url" type="url" placeholder="https://...">
        <div class="med-preview-wrap">
          <img id="med-img-preview" class="med-preview" src="" alt="" style="display:none">
          <div class="med-preview-msg" id="med-preview-msg">Vista previa</div>
        </div>
        <div class="med-img-status" id="med-img-status"></div>
        <div class="med-modal-actions">
          <button id="med-img-cancel">Cancelar</button>
          <button id="med-img-apply" disabled>Aplicar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const urlInput  = document.getElementById('med-img-url');
    const preview   = document.getElementById('med-img-preview');
    const previewMsg= document.getElementById('med-preview-msg');
    const statusEl  = document.getElementById('med-img-status');
    const applyBtn  = document.getElementById('med-img-apply');

    let debTimer;
    urlInput.addEventListener('input', () => {
      clearTimeout(debTimer);
      applyBtn.disabled = true;
      statusEl.className = 'med-img-status';
      statusEl.textContent = '';
      preview.style.display = 'none';
      previewMsg.textContent = 'Verificando…';
      const raw = urlInput.value.trim();
      if (!raw) { previewMsg.textContent = 'Vista previa'; return; }
      debTimer = setTimeout(async () => {
        const url = normalizeImageUrl(raw);
        const ok  = await checkImageUrl(url);
        if (ok) {
          preview.src = url;
          preview.style.display = 'block';
          previewMsg.textContent = '';
          statusEl.className = 'med-img-status ok';
          statusEl.textContent = '✓ Imagen válida';
          applyBtn.disabled = false;
          /* Actualizar input con URL normalizada si cambió */
          if (url !== raw) urlInput.value = url;
        } else {
          preview.style.display = 'none';
          previewMsg.textContent = 'No se pudo cargar';
          statusEl.className = 'med-img-status err';
          statusEl.textContent = '✗ URL inválida o bloqueada por CORS. Prueba otra fuente.';
          applyBtn.disabled = true;
        }
      }, 700);
    });

    document.getElementById('med-img-cancel').onclick = () => { modal.classList.remove('show'); };

    applyBtn.onclick = () => {
      const url = normalizeImageUrl(urlInput.value.trim());
      if (currentImgEl && url) {
        /* Actualizar imagen en el DOM directamente */
        currentImgEl.src = url;
        /* También actualizar data-src si existe (lightbox) */
        const wrap = currentImgEl.closest('[data-src]');
        if (wrap) wrap.dataset.src = url;
        /* Guardar en draft */
        draft.images[currentImgIdx] = url;
        saveDraft();
        markDirty();
      }
      modal.classList.remove('show');
    };
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
  }

  function openImgModal(imgEl, idx) {
    currentImgEl  = imgEl;
    currentImgIdx = idx;
    const urlInput = document.getElementById('med-img-url');
    const preview  = document.getElementById('med-img-preview');
    const applyBtn = document.getElementById('med-img-apply');
    const statusEl = document.getElementById('med-img-status');
    const previewMsg = document.getElementById('med-preview-msg');
    urlInput.value = imgEl.src;
    preview.src = imgEl.src;
    preview.style.display = 'block';
    previewMsg.textContent = '';
    statusEl.className = 'med-img-status ok';
    statusEl.textContent = '✓ Imagen actual';
    applyBtn.disabled = false;
    document.getElementById('med-img-modal').classList.add('show');
    setTimeout(() => urlInput.focus(), 50);
  }

  function enableImageEditing() {
    let idx = 0;
    document.querySelectorAll('img').forEach(img => {
      if (img.closest('#moed-toolbar,#med-img-modal,#med-auth-modal')) return;
      const imgIdx = String(idx++);

      /* Restaurar draft guardado sin tocar el DOM */
      if (draft.images[imgIdx]) {
        img.src = draft.images[imgIdx];
        const parent = img.closest('[data-src]');
        if (parent) parent.dataset.src = draft.images[imgIdx];
      }

      /* Solo marcar el img con atributo + click handler, sin wrap */
      img.dataset.medImg = imgIdx;
      img.title = '📷 Clic para cambiar imagen';

      img.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openImgModal(img, imgIdx);
      });
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
      rows += `<div class="med-color-row"><label>${label}</label><input type="color" data-color-key="${k}" value="${value}"></div>`;
    });
    rows += `<button id="med-colors-reset" style="margin-top:8px;width:100%;background:none;border:1px solid #2A2A25;color:#A8A296;font-size:11px;padding:6px;border-radius:4px;cursor:pointer;">Resetear colores originales</button>`;
    colorPanel.innerHTML = rows;
    document.body.appendChild(colorPanel);

    colorPanel.querySelectorAll('input[type=color]').forEach(input => {
      input.addEventListener('input', () => {
        colorKeys[input.dataset.colorKey].value = input.value;
        const vals = Object.fromEntries(Object.entries(colorKeys).map(([k,v])=>[k,v.value]));
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
      document.getElementById('moed-color-overrides')?.remove();
      sessionStorage.removeItem('moed_colors');
      markDirty();
    };
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
      const path  = getRepoPath();
      const clone = document.documentElement.cloneNode(true);

      /* Limpiar artefactos del editor */
      ['#moed-toolbar','#med-color-panel','#med-img-modal','#med-size-bar','#med-toast','#med-auth-modal'].forEach(sel => {
        clone.querySelector(sel)?.remove();
      });
      clone.querySelectorAll('[data-med-text]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-med-text');
        el.style.cursor = '';
        if (!el.getAttribute('style')) el.removeAttribute('style');
      });
      clone.querySelectorAll('[data-med-img]').forEach(img => {
        img.removeAttribute('data-med-img');
        img.removeAttribute('title');
        img.style.cursor = '';
        if (!img.getAttribute('style')) img.removeAttribute('style');
      });
      clone.querySelector('body').style.paddingTop = '';
      if (!clone.querySelector('body').getAttribute('style')) clone.querySelector('body').removeAttribute('style');
      /* Limpiar top inline del nav que puso el editor */
      const cloneNav = clone.querySelector('#main-nav');
      if (cloneNav) { cloneNav.style.top = ''; if (!cloneNav.getAttribute('style')) cloneNav.removeAttribute('style'); }
      clone.querySelectorAll('header').forEach(h => {
        if (h.id === 'main-nav') return;
        h.style.top = '';
        if (!h.getAttribute('style')) h.removeAttribute('style');
      });

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;

      const getRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
        { headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' } }
      );
      if (!getRes.ok) throw new Error('No se pudo leer el archivo. Verifica el token.');
      const { sha } = await getRes.json();

      const putRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
        {
          method: 'PUT',
          headers: { Authorization: 'token ' + token, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
          body: JSON.stringify({
            message: `Editor MOED: actualizar ${path}`,
            content: btoa(unescape(encodeURIComponent(html))),
            sha,
            branch: GH_BRANCH,
          }),
        }
      );
      if (!putRes.ok) { const e = await putRes.json(); throw new Error(e.message || 'Error al guardar'); }

      clearDraft();
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
     PERSISTIR ?edit=1 al navegar
  ════════════════════════════════════════════════════════════ */
  function enableEditPersistence() {
    document.addEventListener('click', e => {
      /* Si el clic es sobre una imagen editable, no navegar */
      if (e.target.closest('img[data-med-img]')) return;
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if (href.startsWith('#')) return;
      if (href.includes('?edit')) return;
      e.preventDefault();
      const sep = href.includes('?') ? '&' : '?';
      window.location.href = href + sep + 'edit=1';
    }, true);
  }

  /* ═══════════════════════════════════════════════════════════
     AUTH
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
    pushSiteNav();
    buildToolbar();
    buildSizeBar();
    buildImgModal();
    buildColorPanel();
    enableTextEditing();
    enableImageEditing();
    enableEditPersistence();
    if (Object.keys(draft.texts).length || Object.keys(draft.images).length) {
      markDirty();
      toast('Cambios no guardados restaurados.', 'ok', 3000);
    } else {
      toast('Modo edición activo. Haz clic en cualquier texto o imagen para editar.', 'ok', 5000);
    }
  }

  /* editor.js siempre corre al final del body (DOM listo) */
  if (sessionStorage.getItem('gh_token')) {
    init();
  } else {
    buildAuthModal(init);
  }

})();
