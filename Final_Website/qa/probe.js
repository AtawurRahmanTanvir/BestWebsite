const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type()==='warning') console.log('CONSOLE', m.text().slice(0, 300)); });
  await page.goto('http://127.0.0.1:8080/?q=1', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const strip = document.querySelector('#s-strip'); const track = strip.querySelector('.mq-track'); const span = track.querySelector('span');
    const lead = document.querySelector('.manifesto-lead'); const line = lead.querySelector('.line > span');
    const cs = (el) => { const c = getComputedStyle(el); return { display: c.display, opacity: c.opacity, transform: c.transform, visibility: c.visibility, color: c.color, fontSize: c.fontSize, width: el.getBoundingClientRect().width, top: el.getBoundingClientRect().top + scrollY }; };
    return { strip: cs(strip), track: cs(track), span: cs(span), lead: cs(lead), line: line ? cs(line) : 'no line', leadHTML: lead.innerHTML.slice(0, 300), st: window.__mf.ScrollTrigger.getAll().length, pins: document.querySelectorAll('.pin-spacer').length, heroH: document.querySelector('#s-hero').getBoundingClientRect().height };
  });
  console.log(JSON.stringify(r, null, 1));
  await page.evaluate(() => window.__lenis.scrollTo(1000, { immediate: true }));
  await page.waitForTimeout(1500);
  const r2 = await page.evaluate(() => { const line = document.querySelector('.manifesto-lead .line > span'); const c = getComputedStyle(line); return { transform: c.transform, scrollY, lenis: window.__lenis.scroll, top: line.getBoundingClientRect().top }; });
  console.log(JSON.stringify(r2));
  await browser.close();
})();
