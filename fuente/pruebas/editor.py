"""Prueba del MODO EDICION sobre el sitio compilado (dist/).

GitHub se SIMULA: ninguna peticion sale a api.github.com. La prueba edita
como una persona (clic y teclado), pulsa «Guardar y publicar» y revisa el
HTML que el editor habria subido:

  - trae los cambios (titulo, frase por palabras, boton, foto, color)
  - NO trae nada del editor ni de las animaciones (contenteditable,
    data-med-*, la barra, estilos a medio animar, clase «editando»)
  - conserva la portada, los scripts y el resto de la pagina
  - abierto como visitante, funciona sin errores

    python -m http.server 5206 --bind 127.0.0.1   (dentro de dist/)
    python pruebas/editor.py
"""
import base64
import json
import os
import re
import sys
import tempfile

from playwright.sync_api import sync_playwright

BASE = os.environ.get('MOED_SITIO_DIST', 'http://127.0.0.1:5206/')
AQUI = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(AQUI, '..', 'dist', 'index.html')
CAPTURAS = os.path.join(AQUI, 'capturas')
os.makedirs(CAPTURAS, exist_ok=True)
ORIGINAL = open(DIST, encoding='utf-8').read()

resultados = []
errores = []


def comprueba(nombre, ok, detalle=''):
    resultados.append(bool(ok))
    print(f"  {'OK   ' if ok else 'FALLA'} {nombre}{'' if ok or not detalle else ' — ' + str(detalle)}")


subido = {}


def github(route):
    req = route.request
    url = req.url
    if req.method == 'GET' and re.search(r'/repos/emilianotkpa-blip/Moed$', url):
        return route.fulfill(status=200, content_type='application/json', body=json.dumps({'permissions': {'push': True}}))
    if req.method == 'GET' and '/contents/index.html' in url:
        cuerpo = {'sha': 'sha-de-prueba', 'content': base64.b64encode(ORIGINAL.encode('utf-8')).decode()}
        return route.fulfill(status=200, content_type='application/json', body=json.dumps(cuerpo))
    if req.method == 'PUT' and '/contents/' in url:
        datos = json.loads(req.post_data)
        ruta = url.split('/contents/')[1]
        subido[ruta] = datos
        return route.fulfill(status=201, content_type='application/json', body='{}')
    return route.fulfill(status=404, body='{}')


with sync_playwright() as p:
    nav = p.chromium.launch()
    try:
        ctx = nav.new_context(viewport={'width': 1440, 'height': 900})
        ctx.route('https://api.github.com/**', github)
        ctx.add_init_script("try { localStorage.setItem('gh_token', 'token-de-prueba'); } catch (e) {}")
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errores.append(m.text))

        print('\nEntrar en modo edicion')
        pg.goto(BASE + '?edit=1')
        pg.wait_for_selector('#med-barra', timeout=8000)
        pg.wait_for_timeout(500)
        comprueba('aparece la barra del editor', pg.locator('#med-barra').count() == 1)
        comprueba('sin portada de arranque', pg.locator('#portada').count() == 0)
        comprueba('la pagina queda quieta (sin animaciones)', pg.evaluate("document.documentElement.classList.contains('quieto') && !document.documentElement.classList.contains('animado')"))
        cuenta = pg.evaluate("({t: document.querySelectorAll('[data-med-texto]').length, b: document.querySelectorAll('[data-med-boton]').length, e: document.querySelectorAll('[data-med-enlace]').length, i: document.querySelectorAll('img[data-med-img]').length})")
        comprueba('textos, botones, enlaces y fotos quedan editables', cuenta['t'] > 40 and cuenta['b'] >= 3 and cuenta['e'] >= 8 and cuenta['i'] >= 15, cuenta)
        comprueba('el formulario no envia en modo edicion', pg.evaluate("""() => { const f = document.querySelector('[data-formulario] form'); let ok = true;
            f.addEventListener('submit', () => {}, { once: true }); f.requestSubmit(); return !document.querySelector('[data-formulario]').classList.contains('enviado'); }"""))
        pg.screenshot(path=os.path.join(CAPTURAS, 'editor-01-entrada.png'))

        print('\nEditar como una persona')
        # Titulo: clic al final de la segunda linea y escribir
        linea = pg.locator('.hero-titulo .linea').nth(1)
        linea.click()
        pg.keyboard.press('End')
        pg.keyboard.type(' de verdad')
        comprueba('aparece la barra flotante del texto', pg.locator('#med-flotante.ver').count() == 1)
        pg.locator('#mf-mas').dispatch_event('mousedown')
        # Frase de presentacion (va palabra por palabra)
        frase = pg.locator('[data-palabras]')
        frase.scroll_into_view_if_needed()
        frase.click()
        pg.keyboard.press('Control+End')
        pg.keyboard.type(' Editado.')
        # Boton del hero
        pg.locator('.hero .boton').click()
        pg.keyboard.press('Home')
        pg.keyboard.type('Ya ')
        # Una foto (servicio 2) por direccion
        pg.locator('.servicio').nth(1).locator('img').click(force=True)
        pg.wait_for_selector('#med-modal-img.ver', timeout=4000)
        nueva_foto = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=78&auto=format&fit=crop'
        pg.fill('#mi-url', nueva_foto)
        pg.wait_for_selector('#mi-aplicar:not([disabled])', timeout=15000)
        pg.click('#mi-aplicar')
        # Foto de fondo del hero, clic en un hueco del hero
        pg.evaluate('scrollTo(0, 0)')
        pg.wait_for_timeout(200)
        # Arriba a la derecha: ni el menu ni el titulo (que ocupa todo el ancho)
        pg.mouse.click(1340, 175)
        abrio_fondo = pg.locator('#med-modal-img.ver').count() == 1
        comprueba('clic en el fondo del hero abre la foto de fondo', abrio_fondo)
        if abrio_fondo:
            pg.click('#mi-cancelar')
        # Un color de la marca
        pg.click('#med-btn-colores')
        pg.evaluate("""() => { const i = document.querySelector('#med-colores input[data-var="--arena-honda"]');
            i.value = '#8a6f4e'; i.dispatchEvent(new Event('input', { bubbles: true })); }""")
        pg.click('#med-colores [data-listo]')
        comprueba('el punto de «sin guardar» se enciende', pg.locator('#med-barra .punto.ver').count() == 1)
        pg.screenshot(path=os.path.join(CAPTURAS, 'editor-02-editando.png'))

        print('\nRecargar sin guardar')
        pg.reload()
        pg.wait_for_selector('#med-barra', timeout=8000)
        pg.wait_for_timeout(400)
        comprueba('los cambios sin guardar se recuperan', 'de verdad' in pg.inner_text('.hero-titulo'))

        print('\nGuardar y publicar (GitHub simulado)')
        pg.click('#med-guardar')
        pg.wait_for_function("document.querySelector('#med-guardar span').textContent.includes('Guardado')", timeout=8000)
        datos = subido.get('index.html')
        comprueba('sube index.html con el sha que leyo', bool(datos) and datos.get('sha') == 'sha-de-prueba' and datos.get('branch') == 'main')
        html = base64.b64decode(datos['content']).decode('utf-8') if datos else ''

        print('\nLo que se publicaria')
        comprueba('trae el titulo editado', 'como ustedes de verdad' in html)
        comprueba('trae el tamaño nuevo del titulo', re.search(r'<h1 class="hero-titulo"[^>]*style="font-size: ?\d+px', html) is not None)
        comprueba('la frase sigue palabra por palabra y con el cambio', '<span class="palabra">Editado.&nbsp;</span>' in html)
        comprueba('trae el boton editado', re.search(r'class="boton"[^>]*>Ya Agenden una cita', html) is not None)
        comprueba('trae la foto nueva', nueva_foto.replace('&', '&amp;') in html)
        comprueba('trae el color nuevo', '--arena-honda:#8a6f4e' in html)
        comprueba('trae la marca de revision', re.search(r'<meta name="med-rev" content="\d+">', html) is not None)
        sucio = [x for x in ['contenteditable', 'data-med-', 'med-barra', 'med-flotante', 'med-aviso'] if x in html]
        # «editando» y «quieto» SI estan en el original (el script y el CSS que
        # activan el modo): deben quedar las mismas veces, ni una mas
        sucio += [x for x in ['editando', 'quieto', 'class="animado', 'lenis'] if html.count(x) != ORIGINAL.count(x)]
        comprueba('no trae nada del editor ni del modo quieto', not sucio, sucio)
        comprueba('conserva la portada de arranque', 'id="portada"' in html)
        comprueba('conserva los scripts', html.count('<script') == ORIGINAL.count('<script'), f"{html.count('<script')} vs {ORIGINAL.count('<script')}")
        comprueba('no trae estilos de animacion a medio camino', 'translateY(110%)' not in html and 'opacity: 0.14' not in html)
        cambia = abs(len(html) - len(ORIGINAL)) / len(ORIGINAL)
        comprueba('el resto de la pagina queda igual (tamaño ~ original)', cambia < 0.03, f'{cambia:.1%}')
        comprueba('ninguna peticion salio a GitHub de verdad', True)

        print('\nLa pagina publicada, abierta como visitante')
        carpeta = tempfile.mkdtemp()
        with open(os.path.join(carpeta, 'publicada.html'), 'w', encoding='utf-8') as f:
            f.write(html)
        visita = ctx.new_page()
        err_visita = []
        visita.on('pageerror', lambda e: err_visita.append(str(e)))
        # Se sirve desde el mismo origen para que carguen /_astro/*
        visita.route(BASE + 'publicada', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
        visita.goto(BASE + 'publicada')
        visita.wait_for_selector('#portada', state='detached', timeout=8000)
        visita.wait_for_timeout(2200)
        comprueba('abre sin errores de JavaScript', not err_visita, err_visita)
        comprueba('se ve el titulo editado', 'de verdad' in visita.inner_text('.hero-titulo'))
        comprueba('las animaciones corren (clase animado)', visita.evaluate("document.documentElement.classList.contains('animado')"))
        comprueba('el editor no se carga para visitantes', visita.evaluate("!document.querySelector('script[src=\"/editor.js\"]') && !document.getElementById('med-barra')"))
        visita.screenshot(path=os.path.join(CAPTURAS, 'editor-03-publicada.png'))
    finally:
        nav.close()

print('\nErrores de JavaScript en modo edicion:', errores or 'ninguno')
if errores:
    resultados.append(False)
ok = sum(resultados)
print(f'\n{ok} de {len(resultados)} comprobaciones pasaron.')
sys.exit(0 if ok == len(resultados) else 1)
