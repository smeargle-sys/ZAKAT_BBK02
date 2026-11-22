"""Smoke test UI (opsional, butuh Python Playwright + Chrome). Jalankan dev server dulu: node tests/dev-server.js
   python3 tests/ui-smoke.py  → screenshot di tests/shots/"""
import asyncio, os
from playwright.async_api import async_playwright
BASE = os.environ.get('BASE', 'http://localhost:8787')
async def main():
    os.makedirs('tests/shots', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME') or None, args=['--no-sandbox'])
        errs = []
        m = await b.new_page(viewport={'width': 390, 'height': 844})
        m.on('pageerror', lambda e: errs.append(str(e)))
        await m.goto(BASE + '/'); await m.wait_for_selector('.keys')
        for d in '222222': await m.click(f'.keys button[data-k="{d}"]')
        await m.wait_for_selector('.kpi.dark')  # semua peran masuk ke Pemantauan setelah login
        await m.click('#nav a[href="#/amil"]')
        await m.wait_for_selector('#kkList li'); await m.screenshot(path='tests/shots/amil-home.png', full_page=True)
        await m.click('[data-act=kkFilter][data-f=BELUM]'); await m.click('#kkList li a'); await m.wait_for_selector('#fForm')
        await m.fill('#fTerima', '1000000'); await m.screenshot(path='tests/shots/form-fitrah.png', full_page=True)
        await m.click('#fSave'); await m.wait_for_selector('#kkList li')
        d = await b.new_page(viewport={'width': 1440, 'height': 900})
        d.on('pageerror', lambda e: errs.append(str(e)))
        await d.goto(BASE + '/'); await d.wait_for_selector('.keys')
        for x in '111111': await d.click(f'.keys button[data-k="{x}"]')
        await d.wait_for_selector('.kpi.dark'); await d.screenshot(path='tests/shots/dashboard.png', full_page=True)
        for h in ['tren', 'setoran', 'config']:
            await d.goto(BASE + '/#/' + h); await d.wait_for_timeout(1200); await d.screenshot(path=f'tests/shots/{h}.png', full_page=True)
        await b.close()
        if errs: raise SystemExit('Error JS di halaman: ' + '; '.join(errs))
        print('ui-smoke: lulus')
asyncio.run(main())
