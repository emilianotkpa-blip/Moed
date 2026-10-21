"""Recorre la portada como una persona (rueda del raton, tiempo real) y toma
capturas en cada tramo. Falla si hay errores de JavaScript.

    npm run dev            # http://localhost:5205
    python pruebas/vistazo.py [--movil]
"""
import datetime as dt
import os
import sys

from playwright.sync_api import sync_playwright

BASE = os.environ.get('MOED_SITIO', 'http://localhost:5205/')
AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, 'capturas')
os.makedirs(SALIDA, exist_ok=True)
movil = '--movil' in sys.argv
sello = dt.datetime.now().strftime('%H-%M-%S')
errores = []

with sync_playwright() as p:
    nav = p.chromium.launch()
    try:
        if movil:
            ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        else:
            ctx = nav.new_context(viewport={'width': 1440, 'height': 900})
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errores.append(m.text))
        pg.goto(BASE, wait_until='domcontentloaded')
        pg.wait_for_timeout(700)
        pg.screenshot(path=os.path.join(SALIDA, f'{sello}_{"m" if movil else "d"}_00-portada.png'))
        pg.wait_for_selector('#portada', state='detached', timeout=8000)
        pg.wait_for_timeout(2600)
        pg.screenshot(path=os.path.join(SALIDA, f'{sello}_{"m" if movil else "d"}_01-hero.png'))
        alto = pg.evaluate('document.documentElement.scrollHeight')
        paso = 700 if movil else 820
        i = 2
        y = 0
        while y < alto - 900 and i < 40:
            if movil:
                pg.evaluate(f'window.scrollBy(0, {paso})')
            else:
                pg.mouse.move(720, 450)
                pg.mouse.wheel(0, paso)
            y += paso
            pg.wait_for_timeout(1300)
            pg.screenshot(path=os.path.join(SALIDA, f'{sello}_{"m" if movil else "d"}_{i:02d}.png'))
            i += 1
        ancho = pg.evaluate('document.documentElement.scrollWidth')
        print(f'capturas: {i} · alto {alto}px · ancho {ancho}px (ventana {390 if movil else 1440})')
    finally:
        nav.close()

print('errores JS:', errores or 'ninguno')
sys.exit(1 if errores else 0)
