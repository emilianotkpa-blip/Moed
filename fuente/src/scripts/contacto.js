/* ============================================================
   FORMULARIO DE CONTACTO -> CRM DE MOED
   ------------------------------------------------------------
   La solicitud entra directo al CRM como una pareja nueva, con su
   boda en «Prospecto» y un seguimiento para responder en 24 h
   (operacion publica `solicitudWeb` del gateway, sin sesion).

   Contra el spam: un campo trampa oculto (los bots lo llenan) y el
   tiempo que tardo en llenarse (un humano no envia en 2 segundos).
   El servidor lo vuelve a revisar: esto solo evita viajes inutiles.

   La direccion del gateway va en .env.production: `npm run build` la
   toma y el sitio publicado envia de verdad. En `npm run dev` no se
   carga, asi que el formulario solo muestra el agradecimiento y no
   llena el CRM de pruebas.
   ============================================================ */

const URL_CRM = import.meta.env.PUBLIC_CRM_URL || '';
const caja = document.querySelector('[data-formulario]');
const form = caja?.querySelector('form');
const error = caja?.querySelector('[data-error]');
const abierto = Date.now();

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.textContent = '';
  const d = Object.fromEntries(new FormData(form).entries());

  if (!String(d.nombre || '').trim()) return falla('Escriban sus nombres, por favor.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.correo || '').trim())) return falla('Revisen el correo: así les respondemos.');

  const boton = form.querySelector('button[type=submit]');
  boton.disabled = true;
  boton.style.opacity = '.6';
  try {
    if (URL_CRM) {
      const r = await fetch(URL_CRM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'solicitudWeb', args: [{ ...d, segundos: Math.round((Date.now() - abierto) / 1000) }] }),
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || !res.ok) throw new Error(res.error || 'No pudimos enviar su mensaje.');
    } else {
      await new Promise((ok) => setTimeout(ok, 700));
    }
    caja.classList.add('enviado');
    form.reset();
  } catch (err) {
    falla(`${err.message} Pueden escribirnos por WhatsApp mientras lo arreglamos.`);
  } finally {
    boton.disabled = false;
    boton.style.opacity = '';
  }
});

function falla(msg) {
  error.textContent = msg;
}
