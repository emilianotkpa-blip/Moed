/* ═══════════════════════════════════════════
   MOED Wedding Planning — main.js
   Nav · Reveal · Parallax · Carousel · Form · Sparkler
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Nav: transparente → frosted glass al scroll ──────── */
  const nav = document.getElementById('main-nav');
  if (nav) {
    const update = () => {
      nav.dataset.scrolled = window.scrollY > 40 ? 'true' : 'false';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });

    /* Menú móvil */
    const btn   = document.getElementById('menu-btn');
    const menu  = document.getElementById('mobile-menu');
    const bars  = nav.querySelectorAll('.hamburger-bar');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        const open = menu.classList.toggle('hidden') === false;
        btn.setAttribute('aria-expanded', String(open));
        if (bars.length >= 3) {
          bars[0].style.transform = open ? 'translateY(6px) rotate(45deg)' : '';
          bars[1].style.opacity   = open ? '0' : '';
          bars[2].style.transform = open ? 'translateY(-6px) rotate(-45deg)' : '';
        }
      });
      /* Cerrar al hacer clic en un enlace */
      menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          menu.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
          bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
        });
      });
    }
  }

  /* ── Scroll reveal ───────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => io.observe(el));
  }

  /* ── Parallax ────────────────────────────────────────── */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const updateParallax = () => {
      parallaxEls.forEach(el => {
        const rect  = el.getBoundingClientRect();
        const cy    = rect.top + rect.height / 2;
        const delta = (cy - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = `scale(1.12) translateY(${delta * 60}px)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ── Testimonial carousel ────────────────────────────── */
  const track   = document.querySelector('.carousel-track');
  const slides  = track ? Array.from(track.children) : [];
  const dots    = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (track && slides.length) {
    let current = 0;
    let timer;

    const goTo = (idx) => {
      current = (idx + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        const active = i === current;
        d.classList.toggle('bg-olive', active);
        d.classList.toggle('bg-brand-border', !active);
      });
    };

    const startAuto = () => {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 5500);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); startAuto(); }));

    /* Swipe táctil */
    let touchX = 0;
    track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { goTo(current + (dx < 0 ? 1 : -1)); startAuto(); }
    }, { passive: true });

    goTo(0);
    startAuto();
  }

  /* ── Formulario de contacto ──────────────────────────── */
  const form = document.getElementById('contact-form');
  if (form) {
    const statusEl = document.getElementById('form-status');

    const showMsg = (msg, isError) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = isError
        ? 'mt-4 text-sm text-center text-red-400'
        : 'mt-4 text-sm text-center text-gold';
      statusEl.style.display = 'block';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

      const data = new FormData(form);
      const body = Object.fromEntries(data.entries());

      /* Honeypot */
      if (body._hp) return;

      try {
        /* Sin backend real: simular envío exitoso */
        await new Promise(r => setTimeout(r, 900));
        showMsg('¡Gracias! Te contactamos muy pronto.', false);
        form.reset();
      } catch {
        showMsg('Error al enviar. Escríbenos directo a contacto@moed.mx', true);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar mensaje'; }
      }
    });
  }

  /* ── Sparkler canvas (solo index) ────────────────────── */
  const section = document.getElementById('candle-scroll');
  const canvas  = document.getElementById('sp-canvas');
  const textEl  = document.getElementById('c-text');
  const hintEl  = document.getElementById('c-hint');

  if (section && canvas && textEl && hintEl) {
    const ctx = canvas.getContext('2d');
    const pool = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COLORS = [
      [255, 255, 230],
      [255, 240, 160],
      [255, 210,  70],
      [255, 175,  45],
      [220, 120,  30],
    ];

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const eio   = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const spawn = (tx, ty, intensity) => {
      const count = Math.floor(2 + intensity * 5);
      for (let i = 0; i < count; i++) {
        const angle  = Math.random() * Math.PI * 2;
        const spd    = (0.8 + Math.random() * 2.8) * intensity;
        const isLong = Math.random() < 0.35;
        const col    = COLORS[Math.floor(Math.random() * COLORS.length)];
        pool.push({
          x: tx + (Math.random() - 0.5) * 5,
          y: ty + (Math.random() - 0.5) * 5,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - intensity * 0.3,
          life: isLong ? 0.8 + Math.random() * 0.6 : 0.4 + Math.random() * 0.45,
          decay: isLong ? 0.010 + Math.random() * 0.008 : 0.018 + Math.random() * 0.018,
          size: isLong ? 1.4 + Math.random() * 1.6 : 0.8 + Math.random() * 2,
          r: col[0], g: col[1], b: col[2],
          long: isLong,
        });
      }
    };

    const BOKEH = [
      { rx: 0.12, ry: 0.28, rad: 55 }, { rx: 0.22, ry: 0.60, rad: 42 },
      { rx: 0.78, ry: 0.22, rad: 60 }, { rx: 0.85, ry: 0.55, rad: 38 },
      { rx: 0.40, ry: 0.75, rad: 48 }, { rx: 0.60, ry: 0.72, rad: 35 },
      { rx: 0.55, ry: 0.18, rad: 44 }, { rx: 0.90, ry: 0.38, rad: 32 },
      { rx: 0.08, ry: 0.80, rad: 40 }, { rx: 0.70, ry: 0.85, rad: 45 },
    ];

    let progress = 0;
    let rafId = 0;

    const getProgress = () => {
      const rect  = section.getBoundingClientRect();
      const range = section.offsetHeight - window.innerHeight;
      return range > 0 ? clamp(-rect.top / range, 0, 1) : 0;
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const tx = W * 0.50 + 18;
      const ty = H * 0.64;

      ctx.clearRect(0, 0, W, H);

      const bokehA = eio(clamp((progress - 0.08) / 0.45, 0, 1)) * 0.13;
      if (bokehA > 0.002) {
        BOKEH.forEach(b => {
          const grd = ctx.createRadialGradient(b.rx*W, b.ry*H, 0, b.rx*W, b.ry*H, b.rad);
          grd.addColorStop(0, `rgba(201,168,106,${bokehA.toFixed(3)})`);
          grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(b.rx*W, b.ry*H, b.rad, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      const stickAlpha = Math.min(progress * 8, 1);
      if (stickAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = stickAlpha;
        ctx.strokeStyle = '#2e1e0a';
        ctx.lineWidth   = 3;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(tx - 38, H + 20);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();
      }

      if (progress > 0.02) {
        const gP  = eio(clamp(progress / 0.5, 0, 1));
        const gR  = 6 + gP * 42;
        const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, gR);
        grd.addColorStop(0,    `rgba(255,255,240,${(gP * 0.95).toFixed(2)})`);
        grd.addColorStop(0.18, `rgba(255,230, 90,${(gP * 0.75).toFixed(2)})`);
        grd.addColorStop(0.45, `rgba(201,168,106,${(gP * 0.35).toFixed(2)})`);
        grd.addColorStop(1,    'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(tx, ty, gR, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress > 0.12) {
        spawn(tx, ty, eio(clamp((progress - 0.12) / 0.5, 0, 1)));
      }

      for (let i = pool.length - 1; i >= 0; i--) {
        const s = pool[i];
        s.x  += s.vx;
        s.y  += s.vy;
        s.vy += 0.07;
        s.vx *= 0.975;
        s.life -= s.decay;
        if (s.life <= 0) { pool.splice(i, 1); continue; }
        const a = Math.max(0, s.life);
        ctx.save();
        ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${a.toFixed(2)})`;
        ctx.lineWidth   = s.size * a;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 3.5, s.y - s.vy * 3.5);
        ctx.stroke();
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          progress = getProgress();
          const tp = eio(clamp((progress - 0.46) / 0.32, 0, 1));
          textEl.style.opacity = String(tp);
          hintEl.style.opacity = String(clamp(1 - progress * 8, 0, 1));
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        cancelAnimationFrame(rafId);
        pool.length = 0;
      } else {
        draw();
      }
    }, { threshold: 0 });
    observer.observe(section);

    draw();
    onScroll();
  }

})();
