const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8080/?q=' + (process.env.Q || 2), { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const ys = (process.env.YS || '0,900,2000,3500,5000,6500,8000,9500,11000').split(',').map(Number);
  for (const y of ys) {
    await page.evaluate((yy) => { window.__lenis ? window.__lenis.scrollTo(yy, { immediate: true }) : window.scrollTo(0, yy); }, y);
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else res({ fps: n, mounted: window.__mfScenes.filter(e => e.instance).map(e => e.name + (e.visible ? '*' : '') + ':' + (e.cost || 0).toFixed(1) + 'ms') }); }; requestAnimationFrame(tick); }));
    const t1 = Date.now(); let shotMs = null;
    try { await page.screenshot({ path: `qa/prof-${y}.jpg`, type: 'jpeg', quality: 60, timeout: 20000 }); shotMs = Date.now() - t1; } catch (e) { shotMs = 'TIMEOUT'; }
    console.log(y, JSON.stringify(info), 'shot', shotMs);
  }
  await browser.close();
})();
