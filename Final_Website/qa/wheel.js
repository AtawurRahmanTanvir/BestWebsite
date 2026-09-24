const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8080/?q=0', { waitUntil: 'load' }); await page.waitForTimeout(3000);
  const y = await page.evaluate(() => { const el = document.getElementById('s-dash-live'); return Math.round(el.getBoundingClientRect().top + scrollY + 200); });
  await page.evaluate((yy) => window.__lenis.scrollTo(yy, { immediate: true }), y); await page.waitForTimeout(1500);
  const box = await page.evaluate(() => { const r = document.getElementById('app-frame').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; });
  console.log('frame box', box);
  await page.mouse.move(box.x, box.y); await page.waitForTimeout(200);
  const before = await page.evaluate(() => Math.round(scrollY));
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(120); }
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => Math.round(scrollY));
  const appScroll = await page.evaluate(() => { const d = document.getElementById('app-frame').contentDocument; return d.scrollingElement.scrollTop; });
  console.log({ before, after, moved: after - before, appScroll, cursorHover: await page.evaluate(() => document.body.classList.contains('cursor-in-app') || document.documentElement.className) });
  await browser.close();
})();
