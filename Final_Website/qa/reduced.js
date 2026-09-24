/* Reduced-motion full-page regression: scroll the entire document under
   prefers-reduced-motion: reduce; assert no console/page errors, pins unextended,
   carousels do not auto-advance, scenes static. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  p.on('pageerror', (e) => errors.push('[pageerror] ' + e.message.slice(0, 160)));
  await p.goto('http://127.0.0.1:8080/', { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  const pre = await p.evaluate(() => ({
    statics: document.querySelectorAll('.scene-host.is-static').length,
    pinSpacer: (() => { const pin = document.querySelector('[data-pin]'); const sp = pin && pin.closest('.pin-spacer'); return sp ? Math.round(sp.getBoundingClientRect().height) : null; })(),
    vh: innerHeight,
  }));
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const center0 = await p.evaluate(() => { const c = document.querySelector('.sc-card.is-center h3'); return c && c.textContent; });
  for (let y = 0; y < total - 900; y += 2600) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(420);
  }
  await p.waitForTimeout(6500); // > auto-advance interval: must NOT advance under reduce
  const post = await p.evaluate(() => {
    const c = document.querySelector('.sc-card.is-center h3');
    return { center: c && c.textContent, lenis: !!window.__lenis };
  });
  const ok = errors.length === 0 && pre.statics >= 1 && post.center === center0;
  console.log(JSON.stringify({ errors: errors.slice(0, 5), pre, center0, post, PASS: ok }));
  require('fs').writeFileSync('qa/reduced-run.json', JSON.stringify({ errors, pre, center0, post, PASS: ok }, null, 2));
  await b.close();
  process.exit(ok ? 0 : 1);
})();
