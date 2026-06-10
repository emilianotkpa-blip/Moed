/* ═══════════════════════════════════════════
   MOED Wedding Planning — gallery.js
   Portafolio: filtros + lightbox
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Filtros ─────────────────────────────────────────── */
  const filterBtns = document.querySelectorAll('[data-filter]');
  const allItems   = document.querySelectorAll('.gallery-item');

  if (filterBtns.length && allItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.filter;

        /* reset todos los botones */
        filterBtns.forEach(b => {
          b.classList.remove('border-olive', 'bg-olive', 'text-white');
          b.classList.add('border-brand-border', 'text-brand-mid');
        });
        /* activar el pulsado */
        btn.classList.add('border-olive', 'bg-olive', 'text-white');
        btn.classList.remove('border-brand-border', 'text-brand-mid');

        allItems.forEach(item => {
          const show = cat === 'todo' || item.dataset.category === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ── Lightbox ────────────────────────────────────────── */
  const lb        = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbClose   = document.getElementById('lb-close');
  const lbPrev    = document.getElementById('lb-prev');
  const lbNext    = document.getElementById('lb-next');

  if (!lb || !lbImg) return;

  let visibleItems = [];
  let activeIdx = 0;

  const openLb = (idx) => {
    visibleItems = Array.from(allItems).filter(el => el.style.display !== 'none');
    activeIdx = idx % visibleItems.length;
    const item = visibleItems[activeIdx];
    lbImg.src = item.dataset.src || item.querySelector('img').src;
    lbImg.alt = item.dataset.alt || '';
    if (lbCaption) lbCaption.textContent = item.dataset.caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose && lbClose.focus();
  };

  const closeLb = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  };

  const navigate = (dir) => {
    activeIdx = (activeIdx + dir + visibleItems.length) % visibleItems.length;
    const item = visibleItems[activeIdx];
    lbImg.src = item.dataset.src || item.querySelector('img').src;
    lbImg.alt = item.dataset.alt || '';
    if (lbCaption) lbCaption.textContent = item.dataset.caption || '';
  };

  allItems.forEach((item, i) => {
    const open = () => openLb(i);
    item.addEventListener('click', open);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lbPrev)  lbPrev.addEventListener('click', () => navigate(-1));
  if (lbNext)  lbNext.addEventListener('click', () => navigate(1));

  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

})();
