const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const t0 = Date.now();
  await page.goto(process.env.URL || 'http://127.0.0.1:8080/', { waitUntil: 'load', timeout: 60000 });
  console.log('load ms', Date.now() - t0);
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res({ fps: n / 2, mounted: [...document.querySelectorAll('.is-mounted')].map(e => e.dataset.scene || e.dataset.grad), ready: document.body.classList.contains('is-ready'), stageLoaded: document.getElementById('app-stage').classList.contains('is-loaded'), h: document.documentElement.scrollHeight }); }; requestAnimationFrame(tick); }));
  console.log(JSON.stringify(info));
  console.log('errors', errors.slice(0, 20));
  const t1 = Date.now();
  await page.screenshot({ path: 'qa/diag.jpg', type: 'jpeg', quality: 70, timeout: 60000 }).catch(e => console.log('shot fail', e.message.slice(0, 100)));
  console.log('shot ms', Date.now() - t1);
  await browser.close();
})();
