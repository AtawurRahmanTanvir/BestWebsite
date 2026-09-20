const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8080/?q=0', { waitUntil: 'load' }); await page.waitForTimeout(3000);
  const y = await page.evaluate(() => { const el = document.getElementById('s-dash-live'); return Math.round(el.getBoundingClientRect().top + scrollY + 300); });
  await page.evaluate((yy) => window.__lenis.scrollTo(yy, { immediate: true }), y); await page.waitForTimeout(1200);
  const r = await page.evaluate(async () => { const d = document.getElementById('app-frame').contentDocument; const got = []; document.addEventListener('mf:screen', (e) => got.push(e.detail)); d.querySelector('[data-nav="engine"]').click(); await new Promise((r) => setTimeout(r, 700)); const label = document.querySelector('[data-story-screen]').textContent; const idx = [...document.querySelectorAll('[data-index-item]')].find((b) => b.classList.contains('is-active')); return { got, stage: window.__mf.stage.screen, app: d.querySelector('.screen-view.active').dataset.screen, storyLabel: label, indexActive: idx && idx.dataset.indexItem }; });
  console.log(JSON.stringify(r));
  // random jump test: jump between distant slots and verify app follows each time
  const ids = ['s-set-live', 's-dash-live', 's-ot-live', 's-engine-live', 's-lib-live', 's-gen-live', 's-story'];
  const out = [];
  for (const id of ids) { const yy = await page.evaluate((id) => { const el = document.getElementById(id); return Math.round(el.getBoundingClientRect().top + scrollY + 200); }, id); await page.evaluate((v) => window.__lenis.scrollTo(v, { immediate: true }), yy); await page.waitForTimeout(900); out.push(await page.evaluate((id) => { const d = document.getElementById('app-frame').contentDocument; return id + ':' + window.__mf.stage.screen + '/' + d.querySelector('.screen-view.active').dataset.screen + '/' + (document.getElementById('app-stage').classList.contains('is-active') ? document.getElementById('app-stage').dataset.frame : 'off'); }, id)); }
  console.log(out.join('  '));
  await browser.close();
})();
