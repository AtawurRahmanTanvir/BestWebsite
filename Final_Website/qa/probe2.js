const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('http://127.0.0.1:8080/?q=1', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => {
    const ST = window.__mf.ScrollTrigger;
    const out = [];
    ST.getAll().forEach((t) => { const el = t.trigger; if (el && el.hasAttribute && el.hasAttribute('data-slot-trigger')) out.push({ id: el.id, start: Math.round(t.start), end: Math.round(t.end), actualTop: Math.round(el.getBoundingClientRect().top + scrollY), pin: !!t.pin }); });
    const pins = ST.getAll().filter(t => t.pin).map(t => ({ id: t.trigger.id, start: Math.round(t.start), end: Math.round(t.end), actualTop: Math.round(t.trigger.getBoundingClientRect().top + scrollY) }));
    return { slots: out, pins, total: document.documentElement.scrollHeight };
  });
  console.log(JSON.stringify(r, null, 1));
  await page.evaluate(() => window.__mf.ScrollTrigger.refresh());
  await page.waitForTimeout(500);
  const r2 = await page.evaluate(() => { const ST = window.__mf.ScrollTrigger; const out = []; ST.getAll().forEach((t) => { const el = t.trigger; if (el && el.hasAttribute && el.hasAttribute('data-slot-trigger')) out.push({ id: el.id, start: Math.round(t.start), actualTop: Math.round(el.getBoundingClientRect().top + scrollY) }); }); return out; });
  console.log('after manual refresh', JSON.stringify(r2));
  await browser.close();
})();
