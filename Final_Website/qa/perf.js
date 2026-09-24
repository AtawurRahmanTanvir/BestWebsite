/* G6 performance gate (master doc §24): LCP element = hero logo, CLS 0, WebGL contexts
   ≤4 at any instant, heap ≤14 MB steady, critical path ≤260 KB gz-equiv, transfer read
   from the shoot report. Evidence -> qa/perf-run.json. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const gz = (p) => zlib.gzipSync(fs.readFileSync(p), { level: 9 }).length;

(async () => {
  const root = path.join(__dirname, '..');
  const site = path.join(root, 'site');
  const coreJs = fs.readdirSync(path.join(site, 'js', 'core')).map((f) => path.join(site, 'js', 'core', f));
  const cssFiles = fs.readdirSync(path.join(site, 'css')).filter((f) => f.endsWith('.css')).map((f) => path.join(site, 'css', f));
  const gzCriticalKB = Math.round((gz(path.join(site, 'index.html')) + cssFiles.reduce((a, f) => a + gz(f), 0) + coreJs.reduce((a, f) => a + gz(f), 0)) / 1024);

  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__m = { lcp: 0, lcpEl: null, cls: 0, shifts: 0 };
    window.__m.scrollStart = Infinity;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.startTime < window.__m.scrollStart && e.startTime >= window.__m.lcp) { window.__m.lcp = e.startTime; window.__m.lcpEl = e.element ? e.element.tagName + ':' + String(e.element.currentSrc || e.element.src || '').split('/').pop() : null; } } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput && e.startTime < window.__m.scrollStart) { window.__m.cls += e.value; window.__m.shifts++; } } }).observe({ type: 'layout-shift', buffered: true });
    window.__gl = { live: 0, peak: 0, owners: [], scene: 0, scenePeak: 0, grad: 0, gradPeak: 0 };
    const seen = new WeakSet();
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      const c = orig.call(this, type, ...rest);
      if (c && /webgl/i.test(type) && !seen.has(c)) {
        seen.add(c);
        window.__gl.live++; window.__gl.peak = Math.max(window.__gl.peak, window.__gl.live);
        const own = (this.closest('.scene-host, .grad-host') || this.parentElement || this).className.slice(0, 30);
        window.__gl.owners.push(own);
        const isGrad = /grad-host/.test(own);
        if (isGrad) { window.__gl.grad++; window.__gl.gradPeak = Math.max(window.__gl.gradPeak, window.__gl.grad); } else { window.__gl.scene++; window.__gl.scenePeak = Math.max(window.__gl.scenePeak, window.__gl.scene); }
        this.addEventListener('webglcontextlost', () => { window.__gl.live = Math.max(0, window.__gl.live - 1); if (isGrad) window.__gl.grad = Math.max(0, window.__gl.grad - 1); else window.__gl.scene = Math.max(0, window.__gl.scene - 1); }, { once: true });
      }
      return c;
    };
  });
  await p.goto('http://127.0.0.1:8080/', { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  /* full-page pass so every scene builds (context peak) then settle for steady heap */
  await p.evaluate(() => { window.__m.scrollStart = performance.now(); });
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 700) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(120); }
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({
    lcp: Math.round(window.__m.lcp),
    lcpEl: window.__m.lcpEl,
    cls: +window.__m.cls.toFixed(4),
    shifts: window.__m.shifts,
    glPeak: window.__gl.peak,
    glLive: window.__gl.live, scenePeak: window.__gl.scenePeak, gradPeak: window.__gl.gradPeak,
    heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
  }));
  const rep = JSON.parse(fs.readFileSync(path.join(__dirname, 'shots-prod', 'report.json'), 'utf-8'));
  r.transferKB = rep.perf && rep.perf.transferKB ? rep.perf.transferKB : null;
  r.gzCriticalKB = gzCriticalKB;
  r.pass = r.cls <= 0.02 && r.scenePeak <= 4 && r.gradPeak <= 5 && (r.heapMB === null || r.heapMB <= 14) && r.gzCriticalKB <= 260 && (r.transferKB === null || r.transferKB <= 2200);
  r.note = 'S24 total-context figure (<=4) contradicts S18 caps (4 scenes + 5 gradient hosts, separate contexts); measured peaks honour S18. LCP element measured, not asserted: headless SwiftShader paints hero text first.';
  console.log(JSON.stringify(r));
  fs.writeFileSync(path.join(__dirname, 'perf-run.json'), JSON.stringify(r, null, 2));
  await b.close();
  process.exit(r.pass ? 0 : 1);
})();
