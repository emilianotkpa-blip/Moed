# Sitio de MOËD · Wedding & Events

Portada de una sola página para MOËD (wedding planners en Valladolid, Yucatán):
hero con la pareja, presentación, servicios, destinos (Valladolid, Mérida,
Riviera Maya, Bacalar), portafolio, cómo trabajamos, testimonios y contacto.
Liquid Glass en los colores del CRM (crema `#F4ECE0` y tinta), Bodoni Moda + Jost,
animaciones con Motion y desplazamiento suave con Lenis.

## Qué hay en este repo

| Ruta | Qué es |
|---|---|
| `index.html`, `_astro/`, `editor.js`, `favicon.svg`, `robots.txt`, `sitemap.xml` | **Lo que se publica.** Es la compilación de `fuente/` |
| `fuente/` | El código (Astro 4). No se publica |
| `Dockerfile`, `nginx.conf` | nginx sirve la raíz en el puerto 80. Las páginas del sitio anterior (`/servicios`, `/portafolio`, `/contacto`…) redirigen a su sección |

EasyPanel construye el `Dockerfile` desde la rama `main`.

## Modo edición

Abran el sitio con **`?edit=1`** al final de la dirección (por ejemplo
`https://moed.mx/?edit=1`). La primera vez pide un **token de GitHub** con
permiso de escritura sobre este repo y, opcional, la **URL de despliegue de
EasyPanel**; los dos se quedan solo en ese navegador.

- **Textos, botones y enlaces:** clic y escribir. Arriba aparece una barra para
  el tamaño y el color (en botones: fondo, letra y borde; en enlaces: a dónde llevan).
  El clic derecho en un enlace lo sigue.
- **Fotos:** clic en la foto. También las de fondo (el hero y contacto: clic en
  una parte de la foto sin texto). Se suben desde la computadora (se reducen
  solas a un tamaño ligero, a `assets/images/`) o se pega una dirección.
- **Colores:** el botón «Colores» cambia los tonos de la marca en todo el sitio.
- **Guardar y publicar** sube `index.html` a GitHub; con la URL de EasyPanel,
  además despliega y avisa cuando el sitio ya muestra el cambio.

Los cambios sin guardar sobreviven a recargar la página. En modo edición no hay
animaciones ni portada de arranque y el formulario no envía nada.

**Cómo guarda:** descarga de GitHub el `index.html` publicado y le aplica
**solo** lo que se cambió (ubica cada texto y foto por su orden). Así no se
cuela el estado de las animaciones ni nada del editor. Si la página publicada
cambió mientras alguien editaba, no guarda y pide recargar.

## Formulario de contacto

Cada solicitud entra directo al **CRM de MOËD** (gateway de su n8n, operación
pública `solicitudWeb`): la pareja con origen «Sitio web», su boda en
**Prospecto** y un seguimiento para responder ese mismo día. Tiene un campo
trampa contra bots, rechaza envíos de menos de 3 segundos y pone un tope diario.
La dirección del gateway va en `fuente/.env.production`.

## Cambiar el diseño o el código

```bash
cd fuente
npm ci
npm run dev        # http://localhost:5205 (el formulario no envía en dev)
npm run build      # deja la compilación en fuente/dist/
```

Luego se copia `fuente/dist/*` a la raíz del repo.

**Ojo:** lo que se edita con el modo edición vive en el `index.html` de la raíz,
no en `fuente/src/data/contenido.js`. Antes de compilar de nuevo, pasen esos
cambios a `contenido.js` (o compárenlos con `git log -p index.html`), o se perderán.

Pruebas (Playwright, Python):

```bash
python fuente/pruebas/vistazo.py [--movil]   # recorre la página como visitante; falla con errores de JS
python fuente/pruebas/editor.py              # modo edición con GitHub SIMULADO: revisa el HTML que subiría
```

## Pendiente

- **Fotos reales de MOËD.** Las actuales son de Unsplash (provisionales); se
  cambian desde el modo edición.
- **Testimonios reales.** Los tres de ahora son de ejemplo y la página lo dice.
- Datos de contacto (Instagram, teléfono) por confirmar.
