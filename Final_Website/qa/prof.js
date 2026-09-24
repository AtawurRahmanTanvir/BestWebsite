const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8080/?q=' + (process.env.Q || 2), { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const measure = () => page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res(+(n / 1.5).toFixed(1)); }; requestAnimationFrame(tick); }));
  console.log('baseline fps', await measure(), await page.evaluate(() => [...document.querySelectorAll('.is-mounted')].map(e => e.dataset.scene || e.dataset.grad)));
  // hide ember canvas by removing it
  await page.evaluate(() => { const g = document.querySelector('[data-grad="ember"]'); g.__pin = undefined; g.style.display = 'none'; });
  console.log('ember hidden (still rendering) fps', await measure());
  await page.evaluate(() => { document.querySelector('[data-grad="ember"] canvas').remove(); });
  await page.evaluate(() => { const s = document.querySelector('[data-scene="signal"]'); s.querySelector('canvas').style.display='none'; });
  console.log('canvases hidden fps', await measure());
  // now measure JS-only cost of the ticker
  const js = await page.evaluate(() => new Promise((res) => { const g = window.__mf.gsap; let acc = 0, n = 0; const t0 = performance.now(); const f = () => { }; const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res({ n }); }; requestAnimationFrame(tick); }));
  console.log(js);
  await browser.close();
})();
