/* Screenshot specific sections at given progress offsets: node qa/spots.js "s-reactor:0.3,s-prodline:0.5" */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const list = (process.argv[2] || 's-hero:0').split(',').map((s) => { const [id, f] = s.split(':'); return { id, f: +(f || 0) }; });
const MOBILE = process.env.MOBILE === '1'; const OUT = process.env.OUT || 'qa/spots'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8080/?q=' + (process.env.Q || 2), { waitUntil: 'load' }); await page.waitForTimeout(3500);
  for (const { id, f } of list) {
    const y = await page.evaluate(({ id, f }) => { const el = document.getElementById(id); if (!el) return null; const top = el.getBoundingClientRect().top + scrollY; const h = el.offsetHeight; const vh = innerHeight; const span = Math.max(0, h - vh); return Math.round(top + span * f); }, { id, f });
    if (y == null) { console.log('no section', id); continue; }
    await page.evaluate((yy) => window.__lenis.scrollTo(yy, { immediate: true }), y);
    await page.waitForTimeout(+(process.env.WAIT || 1400));
    if (process.env.HOVER) { await page.mouse.move(720, 450); await page.waitForTimeout(600); }
    const f2 = path.join(OUT, `${id}-${f}${MOBILE ? '-m' : ''}.jpg`); await page.screenshot({ path: f2, type: 'jpeg', quality: 80, timeout: 60000 }); console.log('shot', f2, 'y=', y);
  }
  console.log('errors', errors);
  await browser.close();
})();
