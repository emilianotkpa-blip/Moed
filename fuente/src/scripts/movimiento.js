/* ============================================================
   MOVIMIENTO DEL SITIO — Motion + Lenis
   ------------------------------------------------------------
   Motion es de los mismos creadores de Framer Motion (la libreria
   del CRM), en su version para sitios sin React: los mismos
   resortes y la misma sensacion. Lenis suaviza el desplazamiento.

   Todo respeta «reducir movimiento»: en ese caso no se ejecuta nada
   de esto y el CSS deja todo visible desde el principio.
   ============================================================ */

import { animate, inView, scroll, stagger } from 'motion';
import Lenis from 'lenis';

// «Reducir movimiento» o modo edicion (?edit=1): la pagina no se anima
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
  || document.documentElement.classList.contains('editando');
const conRaton = matchMedia('(hover: hover) and (pointer: fine)').matches;
const escritorio = () => matchMedia('(min-width: 981px)').matches;
const ease = [0.22, 1, 0.36, 1];
const resorte = { type: 'spring', stiffness: 260, damping: 22, mass: 0.6 };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/* inView de Motion 11 entrega la entrada del IntersectionObserver; en
   versiones nuevas, el elemento. Esto acepta las dos. */
const elDe = (x) => (x instanceof Element ? x : x.target);

// ---------- Menu movil (va siempre, con o sin movimiento) ----------
const menu = $('[data-menu]');
const abreMenu = () => {
  menu.classList.add('abierto');
  if (!quieto) animate($$('a', menu), { opacity: [0, 1], y: [30, 0] }, { duration: 0.7, delay: stagger(0.06, { startDelay: 0.1 }), ease });
};
const cierraMenu = () => menu.classList.remove('abierto');
$('[data-abre-menu]')?.addEventListener('click', abreMenu);
$('[data-cierra-menu]')?.addEventListener('click', cierraMenu);

if (quieto) {
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', cierraMenu));
} else {
  arrancar();
}
// El carrusel funciona siempre; con «reducir movimiento» cambia sin animar
carrusel();

function arrancar() {
  // ---------- Desplazamiento suave ----------
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); };
  requestAnimationFrame(bucle);
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const destino = a.getAttribute('href');
    if (destino.length < 2) return;
    e.preventDefault();
    cierraMenu();
    lenis.scrollTo(destino === '#inicio' ? 0 : destino, { offset: -10, duration: 1.6 });
  }));

  // ---------- Entrada del hero, cuando se va la portada ----------
  const entraHero = () => {
    animate('.hero-foto', { scale: [1.16, 1] }, { duration: 2.8, ease });
    animate('.hero-titulo .linea > span', { y: ['110%', '0%'] }, { duration: 1.4, delay: stagger(0.16, { startDelay: 0.15 }), ease });
    animate('.hero [data-hero-fade]', { opacity: [0, 1], y: [18, 0] }, { duration: 1.1, delay: stagger(0.12, { startDelay: 0.6 }), ease });
    animate('[data-nav]', { opacity: [0, 1], y: [-24, 0] }, { duration: 1, delay: 0.3, ease });
  };
  if (window.__portadaFuera) entraHero();
  else window.addEventListener('moed:portada', entraHero, { once: true });

  // El hero se queda atras con profundidad: la foto baja mas lento que la
  // pagina y el texto se desvanece hacia arriba
  const heroEl = $('.hero');
  scroll(animate('.hero-foto', { y: ['0%', '16%'] }, { ease: 'linear' }), { target: heroEl, offset: ['start start', 'end start'] });
  scroll(animate('.hero-contenido', { opacity: [1, 0], y: [0, -90] }, { ease: 'linear' }), { target: heroEl, offset: ['start start', '0.75 start'] });

  // ---------- Apariciones ----------
  // Grupos: los hijos entran en cascada
  inView('[data-escalon]', (x) => {
    animate($$('[data-aparece]', elDe(x)), { opacity: [0, 1], y: [50, 0] }, { duration: 1.2, delay: stagger(0.14), ease });
  }, { amount: 0.2 });
  // Sueltos
  $$('[data-aparece]').filter((el) => !el.closest('[data-escalon]')).forEach((el) => {
    inView(el, () => { animate(el, { opacity: [0, 1], y: [34, 0] }, { duration: 1.1, ease }); }, { amount: 0.25 });
  });

  // ---------- La frase de presentacion se «escribe» al bajar ----------
  const frase = $('[data-palabras]');
  if (frase) {
    const palabras = $$('.palabra', frase);
    palabras.forEach((p) => { p.style.opacity = '0.14'; });
    scroll((avance) => {
      const n = palabras.length;
      palabras.forEach((p, i) => {
        const t = Math.min(1, Math.max(0, avance * (n + 4) - i));
        p.style.opacity = String(0.14 + 0.86 * t);
      });
    }, { target: frase, offset: ['start 0.82', 'end 0.42'] });
  }

  // ---------- Paralaje ----------
  $$('[data-parallax]').forEach((el) => {
    const f = Number(el.dataset.parallax) || 0.1;
    const caja = el.closest('.arco, .momento-foto') || el;
    scroll(animate(el, { y: [`${-f * 100}%`, `${f * 100}%`] }, { ease: 'linear' }), { target: caja, offset: ['start end', 'end start'] });
  });
  const fondoContacto = $('[data-parallax-fondo]');
  if (fondoContacto) scroll(animate(fondoContacto, { y: ['-8%', '8%'] }, { ease: 'linear' }), { target: $('.contacto'), offset: ['start end', 'end start'] });

  // ---------- Destinos: recorrido horizontal mientras se baja ----------
  const destinos = $('[data-destinos]');
  if (destinos) {
    const pista = $('[data-pista]', destinos);
    const barra = $('[data-barra]', destinos);
    const fotos = $$('img', pista);
    let distancia = 0;
    const mide = () => { distancia = Math.max(0, pista.scrollWidth - window.innerWidth); };
    mide();
    window.addEventListener('resize', mide);
    scroll((avance) => {
      if (!escritorio()) return;
      pista.style.transform = `translate3d(${-avance * distancia}px,0,0)`;
      barra.style.transform = `scaleX(${avance})`;
      // Cada foto se desliza un poco dentro de su marco: profundidad
      fotos.forEach((img, i) => { img.style.transform = `scale(1.15) translateX(${(avance * 4 - i) * -3}%)`; });
    }, { target: destinos, offset: ['start start', 'end end'] });
  }

  // ---------- Proceso: la linea se dibuja al bajar ----------
  const linea = $('[data-linea]');
  if (linea) scroll(animate(linea, { scaleY: [0, 1] }, { ease: 'linear' }), { target: $('[data-pasos]'), offset: ['start 0.7', 'end 0.55'] });

  // ---------- Servicios: la tarjeta se inclina hacia el raton ----------
  if (conRaton) {
    $$('[data-inclina]').forEach((tarjeta) => {
      tarjeta.addEventListener('pointermove', (e) => {
        const r = tarjeta.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        animate(tarjeta, { rotateY: x * 8, rotateX: -y * 8, y: -6, transformPerspective: 900 }, { ...resorte, stiffness: 180 });
      });
      tarjeta.addEventListener('pointerleave', () => animate(tarjeta, { rotateY: 0, rotateX: 0, y: 0, transformPerspective: 900 }, resorte));
    });

    // Botones «iman»: se acercan un poco al puntero
    $$('[data-iman]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3 }, resorte);
      });
      b.addEventListener('pointerleave', () => animate(b, { x: 0, y: 0 }, resorte));
    });

    // Cursor de vidrio: sigue al puntero con retraso y crece sobre las fotos
    const cursor = $('.cursor');
    let cx = innerWidth / 2; let cy = innerHeight / 2; let px = cx; let py = cy;
    window.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; cursor.classList.add('visible'); });
    document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
    const sigue = () => {
      cx += (px - cx) * 0.18; cy += (py - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(sigue);
    };
    requestAnimationFrame(sigue);
    document.addEventListener('pointerover', (e) => {
      const sobre = e.target.closest('[data-cursor]');
      cursor.classList.toggle('grande', !!sobre);
      cursor.textContent = sobre ? sobre.dataset.cursor : '';
    });
  }

  // ---------- Navegacion: se esconde al bajar, vuelve al subir ----------
  const nav = $('[data-nav]');
  const oscuras = $$('[data-oscuro]');
  let ultimo = 0;
  lenis.on('scroll', ({ scroll: y }) => {
    // Solo cambia con movimiento real: en celular llegan avisos repetidos
    // con la misma posicion y no deben volver a mostrarla
    const dy = y - ultimo;
    if (y <= 260 || menu.classList.contains('abierto')) nav.classList.remove('escondida');
    else if (Math.abs(dy) > 3) nav.classList.toggle('escondida', dy > 0);
    if (Math.abs(dy) > 3 || y <= 260) ultimo = y;
    // Sobre una seccion clara, la pastilla se vuelve vidrio crema
    const centro = 50;
    const encima = oscuras.some((s) => { const r = s.getBoundingClientRect(); return r.top <= centro && r.bottom >= centro; });
    nav.classList.toggle('sobre-claro', !encima);
  });

}

/* Con movimiento: anima. Sin movimiento: pone el estado final de una vez. */
function anima(el, cuadros, opciones) {
  if (!quieto) return animate(el, cuadros, opciones);
  const final = Object.fromEntries(Object.entries(cuadros).map(([k, v]) => [k, Array.isArray(v) ? v[v.length - 1] : v]));
  if ('opacity' in final) el.style.opacity = String(final.opacity);
  return Promise.resolve();
}

function carrusel() {
  const raiz = $('[data-testimonios]');
  if (!raiz) return;
  const textos = $$('[data-diapo]', raiz);
  const fotos = $$('[data-diapo-foto]', raiz);
  const puntos = $$('[data-punto]', raiz);
  let actual = 0;
  let reloj;

  function ir(n) {
    const sig = (n + textos.length) % textos.length;
    if (sig === actual) return;
    const t0 = textos[actual]; const t1 = textos[sig];
    anima(t0, { opacity: [1, 0], y: [0, -24] }, { duration: 0.45, ease }).then(() => { t0.style.visibility = 'hidden'; });
    t1.style.visibility = 'visible';
    anima(t1, { opacity: [0, 1], y: [30, 0] }, { duration: 0.9, delay: 0.25, ease });
    anima(fotos[actual], { opacity: [1, 0], scale: [1, 1.04] }, { duration: 0.8, ease });
    anima(fotos[sig], { opacity: [0, 1], scale: [1.14, 1] }, { duration: 1.4, ease });
    puntos.forEach((p, i) => p.classList.toggle('activo', i === sig));
    actual = sig;
    reinicia();
  }
  // Con «reducir movimiento» no avanza solo: lo pasa quien lee
  function reinicia() { clearInterval(reloj); if (!quieto) reloj = setInterval(() => ir(actual + 1), 7000); }
  $('[data-siguiente]', raiz).addEventListener('click', () => ir(actual + 1));
  $('[data-anterior]', raiz).addEventListener('click', () => ir(actual - 1));
  puntos.forEach((p) => p.addEventListener('click', () => ir(Number(p.dataset.punto))));
  raiz.addEventListener('pointerenter', () => clearInterval(reloj));
  raiz.addEventListener('pointerleave', reinicia);
  reinicia();
}
