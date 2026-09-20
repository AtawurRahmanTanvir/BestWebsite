/* QA: real-browser run. Scrolls the whole page, screenshots checkpoints, records console errors & app sync. */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8080/';
const OUT = process.env.OUT || path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const MOBILE = process.env.MOBILE === '1';
const STEP = +(process.env.STEP || 1400);
const MAX = +(process.env.MAX || 400);

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const logs = []; const errors = [];
  page.on('console', (m) => { const t = m.type(); const txt = m.text(); logs.push(`[${t}] ${txt}`); if (t === 'error' || t === 'warning') errors.push(`[${t}] ${txt}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('requestfailed', (r) => { if (!/google|gstatic|cloudflare|api\.github/.test(r.url())) errors.push('[requestfailed] ' + r.url() + ' ' + (r.failure() && r.failure().errorText)); });
  page.on('response', (r) => { if (r.status() >= 400 && !/google|gstatic|api\.github/.test(r.url())) errors.push('[http ' + r.status() + '] ' + r.url()); });
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(4200);
  const shots = []; let idx = 0;
  const shot = async (label) => { const f = `${String(idx++).padStart(2, '0')}-${label}.jpg`; try { await page.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 78, timeout: 60000 }); shots.push(f); } catch (e) { errors.push('[screenshot timeout] ' + label); } };
  await shot('hero');
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let y = 0; const maxScroll = total - (MOBILE ? 844 : 900);
  const chapters = await page.evaluate(() => [...document.querySelectorAll('.sec')].map((s) => ({ id: s.id, top: s.getBoundingClientRect().top + scrollY })));
  const sync = [];
  while (y < maxScroll && idx < MAX) {
    y = Math.min(maxScroll, y + STEP);
    await page.evaluate((yy) => { const l = window.__lenis; if (l) l.scrollTo(yy, { immediate: true }); else window.scrollTo(0, yy); }, y);
    await page.waitForTimeout(+(process.env.WAIT || 900));
    const sec = chapters.filter((c) => c.top <= y + 450).pop();
    const state = await page.evaluate(() => { const st = window.__mf && window.__mf.stage; const frame = document.getElementById('app-stage'); let appScreen = null; try { const d = document.getElementById('app-frame').contentDocument; const a = d && d.querySelector('.screen-view.active'); appScreen = a && a.dataset.screen; } catch (e) {} return { slot: frame.classList.contains('is-active') ? frame.dataset.frame : null, expected: st ? st.screen : null, appScreen, loaded: frame.classList.contains('is-loaded') }; });
    sync.push({ y, sec: sec && sec.id, ...state });
    await shot((sec && sec.id.replace('s-', '')) || 'y' + y);
  }
  // interaction probes on desktop
  const probes = {};
  if (!MOBILE) {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
    probes.downloadToast = await page.evaluate(async () => { document.querySelector('.hero .btn-primary').click(); await new Promise((r) => setTimeout(r, 400)); const t = document.querySelector('.toast'); return t ? t.textContent : null; });
    probes.indexJump = await page.evaluate(async () => { document.querySelector('[data-index-item="generator"]').click(); await new Promise((r) => setTimeout(r, 2600)); const st = window.__mf.stage; let appScreen = null; try { appScreen = document.getElementById('app-frame').contentDocument.querySelector('.screen-view.active').dataset.screen; } catch (e) {} return { expected: st.screen, appScreen, y: Math.round(scrollY) }; });
    await page.waitForTimeout(500); await shot('probe-index-generator');
  }
  const perf = await page.evaluate(() => { const m = performance.getEntriesByType('resource'); const bytes = m.reduce((a, r) => a + (r.transferSize || 0), 0); return { resources: m.length, transferKB: Math.round(bytes / 1024), jsHeapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; });
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round(n / 2)); }; requestAnimationFrame(tick); }));
  const report = { url: URL, mobile: MOBILE, loadMs, total, shots: shots.length, errors, perf, fps, sync, probes, logsTail: logs.slice(-30) };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ loadMs, total, shots: shots.length, errors: errors.slice(0, 40), perf, fps, probes, syncMismatches: sync.filter((s) => s.slot && s.appScreen && s.expected && s.appScreen !== s.expected) }, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
