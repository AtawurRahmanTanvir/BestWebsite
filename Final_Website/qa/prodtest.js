const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (/\[scene|prod|mount/i.test(m.text())) console.log('LOG', m.text().slice(0, 200)); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'load' }); await page.waitForTimeout(2500);
  const y = await page.evaluate(() => { const el = document.getElementById('s-prodline'); return Math.round(el.getBoundingClientRect().top + scrollY + 400); });
  await page.evaluate((yy) => window.__lenis.scrollTo(yy, { immediate: true }), y);
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(2000);
    const info = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res({ fps: +(n / 1.5).toFixed(1), mounted: window.__mfScenes.filter(e => e.instance).map(e => e.name + (e.visible ? '*' : '') + ':' + (e.cost || 0).toFixed(1)), loading: window.__mfScenes.filter(e => e.loading).map(e => e.name), tier: window.__mf.quality.tier }); }; requestAnimationFrame(tick); }));
    console.log(i, JSON.stringify(info));
  }
  const t1 = Date.now(); try { await page.screenshot({ path: 'qa/prodtest.jpg', type: 'jpeg', quality: 70, timeout: 40000 }); console.log('shot ms', Date.now() - t1); } catch (e) { console.log('shot timeout'); }
  await browser.close();
})();
