/* Interaction QA on desktop: menu, share, rating, carousels, toggles, app bridge. */
const { chromium } = require('playwright');
const fs = require('fs'); fs.mkdirSync('qa/interact', { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8080/?q=1', { waitUntil: 'load' }); await page.waitForTimeout(3500);
  const R = {};
  const goto = async (id, f = 0) => { const y = await page.evaluate(({ id, f }) => { const el = document.getElementById(id); const top = el.getBoundingClientRect().top + scrollY; const span = Math.max(0, el.offsetHeight - innerHeight); return Math.round(top + span * f); }, { id, f }); await page.evaluate((yy) => window.__lenis.scrollTo(yy, { immediate: true }), y); await page.waitForTimeout(900); return y; };
  const shot = (n) => page.screenshot({ path: `qa/interact/${n}.jpg`, type: 'jpeg', quality: 75, timeout: 60000 });
  // 1. menu
  await page.click('.nav-menu-btn'); await page.waitForTimeout(700); R.menuOpen = await page.evaluate(() => document.body.classList.contains('menu-open') && getComputedStyle(document.querySelector('.menu')).visibility !== 'hidden'); await shot('01-menu');
  await page.keyboard.press('Escape'); await page.waitForTimeout(500); R.menuClosedByEsc = await page.evaluate(() => !document.body.classList.contains('menu-open'));
  // 2. share (no navigator.share in chromium headless → clipboard fallback)
  await page.click('.hero [data-share]'); await page.waitForTimeout(600); R.shareToast = await page.evaluate(() => (document.querySelector('.toast') || {}).textContent); R.clipboard = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
  // 3. rail click → chapter jump
  await page.click('.rail button:nth-child(7)'); await page.waitForTimeout(2500); R.railJump = await page.evaluate(() => ({ y: Math.round(scrollY), chapter: document.querySelector('.nav-chapter').textContent.trim().slice(0, 30) }));
  // 4. compare drag
  await goto('s-compare'); const h = await page.$('.cmp-handle'); const hb = await h.boundingBox(); await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.mouse.move(hb.x + 300, hb.y + hb.height / 2, { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(700); R.compareX = await page.evaluate(() => document.querySelector('[data-compare]').style.getPropertyValue('--x'));
  // 5. colonnade click
  await goto('s-tiles'); await page.click('.col:nth-child(3)'); await page.waitForTimeout(500); R.colonnadeActive = await page.evaluate(() => [...document.querySelectorAll('.col')].findIndex((c) => c.classList.contains('is-active')));
  // 6. reactor click (center-ish node) + legend hover
  await goto('s-reactor', 0.3); await page.hover('.reactor-legend span:nth-child(5)'); await page.waitForTimeout(1500); R.reactorPanel = await page.evaluate(() => document.querySelector('[data-reactor-panel] .rp-name').textContent); await shot('02-reactor');
  // 7. route demo + console + toggle
  await goto('s-utility'); await page.click('[data-route-demo]'); await page.waitForTimeout(2200); R.route = await page.evaluate(() => ({ status: document.querySelector('[data-route-status]').textContent, lat: document.querySelector('[data-route-latency]').textContent, console: document.querySelector('[data-console]').textContent.slice(0, 80) })); await shot('03-utility');
  // 8. gen toggle drives app tab
  await goto('s-gen-open'); await page.click('.gen-word[data-mode="batch"]'); await page.waitForTimeout(600); R.genBatch = await page.evaluate(() => { const d = document.getElementById('app-frame').contentDocument; return { site: document.querySelector('.gen-word.is-active').dataset.mode, app: d.querySelector('.tab.active') && d.querySelector('.tab.active').dataset.tab }; });
  // 9. arc carousel: keyboard + next button
  await goto('s-steps'); await page.click('[data-arc-next]'); await page.waitForTimeout(900); await page.focus('[data-arc]'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900); R.arc = await page.evaluate(() => ({ title: document.querySelector('[data-arc-title]').textContent, front: [...document.querySelectorAll('.arc-card')].findIndex((c) => c.classList.contains('is-front')) })); await shot('04-arc');
  // 10. params + copy demo
  await goto('s-params'); await page.click('.pgroup[data-group="qty"] button[data-v="50"]'); await page.waitForTimeout(300); R.params = await page.evaluate(() => ({ readout: document.querySelector('[data-readout] code').textContent, out: document.querySelector('[data-out-count]').textContent }));
  await goto('s-copy'); await page.click('[data-copy-demo]'); await page.waitForTimeout(500); R.copyDemo = await page.evaluate(() => ({ copied: document.querySelector('[data-copy-demo]').classList.contains('is-copied'), toast: (document.querySelector('.toast') || {}).textContent }));
  // 11. archive flip + shelf sort
  await goto('s-archive'); await page.click('[data-archive] .card:nth-child(2)'); await page.waitForTimeout(400); R.flip = await page.evaluate(() => document.querySelector('[data-archive] .card:nth-child(2)').classList.contains('is-flipped'));
  await goto('s-sorting'); await page.click('[data-sort-modes] button[data-sort="batches"]'); await page.waitForTimeout(900); R.sort = await page.evaluate(() => [...document.querySelectorAll('[data-shelf] li')].slice(0, 3).map((l) => l.dataset.type));
  // 12. pulse tap → connecting → connected
  await goto('s-pulse', 0.2); const ph = await page.$('#s-pulse .scene-host'); const pb = await ph.boundingBox(); await page.mouse.click(pb.x + pb.width * .6, pb.y + pb.height * .5); await page.waitForTimeout(500); R.pulse1 = await page.evaluate(() => document.querySelector('[data-pulse-state]').dataset.state); await page.waitForTimeout(2200); R.pulse2 = await page.evaluate(() => document.querySelector('[data-pulse-state]').dataset.state); await shot('05-pulse');
  // 13. ring drag + keyboard
  await goto('s-ot-live'); const ring = await page.$('[data-ring]'); const rb = await ring.boundingBox(); const before = await page.evaluate(() => document.querySelector('[data-ring-current]').textContent); await page.mouse.move(rb.x + rb.width * .6, rb.y + rb.height * .5); await page.mouse.down(); await page.mouse.move(rb.x + rb.width * .2, rb.y + rb.height * .5, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(1500); R.ring = { before, after: await page.evaluate(() => document.querySelector('[data-ring-current]').textContent) }; await shot('06-ring');
  // 14. swatches drag
  await goto('s-themes'); const sw = await page.$('[data-swatches]'); const sb = await sw.boundingBox(); await page.mouse.move(sb.x + sb.width * .7, sb.y + sb.height * .5); await page.mouse.down(); await page.mouse.move(sb.x + sb.width * .2, sb.y + sb.height * .5, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(1200); R.swatchX = await page.evaluate(() => document.querySelector('.sw-track').style.transform);
  // 15. topology hover
  await goto('s-topology'); await page.hover('.tn[data-node="engine"]'); await page.waitForTimeout(400); R.topo = await page.evaluate(() => ({ on: [...document.querySelectorAll('.tn.is-on')].map((n) => n.dataset.node), paths: document.querySelectorAll('.topo-lines path.is-on').length })); await shot('07-topology');
  // 16. FAQ
  await goto('s-faq'); await page.click('[data-faq] .fq:nth-child(2) button'); await page.waitForTimeout(400); R.faq = await page.evaluate(() => ({ open: document.querySelector('[data-faq] .fq:nth-child(2)').classList.contains('is-open'), aria: document.querySelector('[data-faq] .fq:nth-child(2) button').getAttribute('aria-expanded') }));
  // 17. rating: keyboard then click, persistence
  await goto('s-rating', 0.5); await page.focus('[data-rating] button'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300); R.ratingKb = await page.evaluate(() => ({ word: document.querySelector('[data-rating-word]').textContent, set: document.querySelectorAll('[data-rating] .is-set').length, form: document.querySelector('[data-rating-form]').classList.contains('is-on') }));
  await page.click('[data-rating] button:nth-child(5)'); await page.waitForTimeout(300); await page.fill('[data-rating-form] textarea', 'QA note'); await page.click('[data-rating-form] button[type=submit]'); await page.waitForTimeout(800); R.ratingSubmit = await page.evaluate(() => ({ thanks: !document.querySelector('[data-rating-thanks]').hidden, stored: localStorage.getItem('mf.site.rating') })); await shot('08-rating');
  // 18. final download button toast + core pulse
  await goto('s-final-download', 0.7); await page.click('.btn-final'); await page.waitForTimeout(500); R.finalToast = await page.evaluate(() => (document.querySelector('.toast') || {}).textContent); await shot('09-final');
  // 19. app bridge: in-app click propagates (dashboard → engine)
  await goto('s-dash-live', 0.3); await page.waitForTimeout(800); R.bridge = await page.evaluate(async () => { const d = document.getElementById('app-frame').contentDocument; const btn = d.querySelector('[data-nav="engine"]'); let got = null; document.addEventListener('mf:screen', (e) => (got = e.detail), { once: true }); btn && btn.click(); await new Promise((r) => setTimeout(r, 400)); return { clicked: !!btn, event: got, app: d.querySelector('.screen-view.active').dataset.screen, stage: window.__mf.stage.screen }; });
  // 20. reload → rating persisted
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2500); R.ratingPersist = await page.evaluate(() => ({ set: document.querySelectorAll('[data-rating] .is-set').length, thanksHidden: document.querySelector('[data-rating-thanks]').hidden }));
  // 21. reduced motion + keyboard nav sanity
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const p2 = await ctx2.newPage(); const err2 = []; p2.on('pageerror', (e) => err2.push(e.message));
  await p2.goto('http://127.0.0.1:8080/', { waitUntil: 'load' }); await p2.waitForTimeout(2000); R.reduced = await p2.evaluate(() => ({ tier: window.__mf.quality.tier, heroTitleVisible: getComputedStyle(document.querySelector('.hero-line > span')).transform, mounted: document.querySelectorAll('.is-mounted').length })); await p2.screenshot({ path: 'qa/interact/10-reduced.jpg', type: 'jpeg', quality: 70 }); R.reducedErrors = err2;
  console.log(JSON.stringify(R, null, 1)); console.log('errors', errors);
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
