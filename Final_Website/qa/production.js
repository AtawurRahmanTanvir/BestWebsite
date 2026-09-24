/* Production gates G3–G7 (real browser, executed): app-swap integrity, email decode,
   help alias, FAV crop geometry + expand, keyboard walk, reduced-motion behaviour. */
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:8080/';
const out = { gates: {} };
const ok = (g, pass, detail) => { out.gates[g] = { pass, detail }; console.log((pass ? 'PASS' : 'FAIL'), g, JSON.stringify(detail).slice(0, 300)); };

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });

  /* ---- G3: app swap integrity (desktop) ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(4500);
    const r = await page.evaluate(async () => {
      const res = await fetch('app/mail-factory.html'); const buf = await res.arrayBuffer(); const txt = new TextDecoder().decode(buf);
      const frame = document.getElementById('app-frame');
      let decoded = null, cf = null, help = null, atCount = 0;
      try {
        const d = frame.contentDocument;
        cf = [...d.querySelectorAll('[data-cfemail]')];
        decoded = cf.length > 0 && cf.every((e) => (e.textContent || '').includes('@'));
        const w = frame.contentWindow;
        w.showScreen('help');
        await new Promise((r2) => setTimeout(r2, 400));
        const active = d.querySelector('.screen-view.active');
        const sub = d.querySelector('#page-helpcenter.open, [id^="page-"].open');
        help = { screen: active && active.dataset.screen, subOpen: !!sub, subId: sub && sub.id };
        atCount = (d.body.textContent.match(/@/g) || []).length;
      } catch (e) { decoded = 'err:' + e.message; }
      return { bytes: buf.byteLength, hasPwrSub: txt.includes('pwrSub'), cfCount: cf && cf.length, decoded: atCount >= 11, atCount, help, version: /v1\.0\.0/.test(txt) };
    });
    ok('G3-app-swap', r.bytes === 553575 && !r.hasPwrSub && r.cfCount === 0 && r.decoded === true && r.help && r.help.screen === 'settings' && r.help.subOpen === true, r);
    /* G8 honesty spot checks in served site HTML */
    const html = await page.evaluate(async () => (await (await fetch('./')).text()));
    const honest = !/1\.7\.9/.test(html) && /fourteen pages|14 settings|settings destinations/i.test(html) && !/data-cursor=/.test(html) && !/class="cursor/.test(html);
    const slotLive = !/data-slot-live/.test(html); /* honesty badge is runtime-created (#live-tag); per-slot visibility asserted in G4 liveTag */
    ok('G8-honesty', honest && slotLive, { has179: /1\.7\.9/.test(html), cursor: /data-cursor=/.test(html), slotLive });
    /* G5 keyboard walk */
    const seen = [];
    await page.evaluate(() => window.scrollTo(0, 0));
    for (let i = 0; i < 260; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => { const a = document.activeElement; if (!a) return ''; return [a.tagName, a.className, a.getAttribute && a.getAttribute('role'), a.dataset && Object.keys(a.dataset).join('.'), a.dataset && a.dataset.treeAct || '', getComputedStyle(a).outlineWidth].join(' '); });
      seen.push(f);
    }
    const hits = {
      navDownload: seen.some((s) => /btn-primary/.test(s)),
      indexRows: seen.some((s) => /index|idx-|data-index/.test(s)),
      capCols: seen.some((s) => /cap-col/.test(s)),
      compareSlider: seen.some((s) => /gc-divider/.test(s)),
      treeNodes: await (async () => {
        await page.evaluate(() => document.querySelector('[data-tree]').scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(600);
        const started = await page.evaluate(() => {
          const nodes = [...document.querySelectorAll('[data-tree-act]')];
          const tabbables = [...document.querySelectorAll('a[href], button, [tabindex="0"], input, select, textarea')].filter((el) => !el.disabled && el.getClientRects().length && !el.closest('iframe'));
          const idx = tabbables.indexOf(nodes[0]);
          if (idx <= 0) return false;
          tabbables[idx - 1].focus();
          return true;
        });
        if (!started) return false;
        const acts = [];
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
          acts.push(await page.evaluate(() => (document.activeElement.dataset || {}).treeAct || ''));
        }
        return new Set(acts.filter(Boolean)).size === 14;
      })(),
      treeFocusRing: seen.filter((s) => /tl node/.test(s)).every((s) => /2px$/.test(s.trim())),
      ratingStars: seen.some((s) => /radio/.test(s)),
      favOrArrows: seen.some((s) => /sc-arrow|fav-btn|ibtn/.test(s)),
    };
    ok('G5-keyboard', Object.values(hits).filter(Boolean).length >= 5, hits);
    await ctx.close();
  }

  /* ---- G4: FAV crop geometry (mobile) ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(4500);
    const slots = await page.evaluate(() => [...document.querySelectorAll('.app-slot[data-focus-region]')].map((s) => s.dataset.slot));
    const results = {};
    for (const slot of slots) {
      const m = await page.evaluate(async (slot) => {
        const el = document.querySelector(`.app-slot[data-slot="${slot}"]`);
        el.scrollIntoView({ block: 'center' });
        await new Promise((r) => setTimeout(r, 2300));
        const stage = document.getElementById('app-stage');
        const sr = stage.getBoundingClientRect(), br = el.getBoundingClientRect();
        const inView = br.top < innerHeight && br.bottom > 0;
        if (!inView) return { inView };
        const [x, y, w, h] = el.dataset.focusRegion.split(',').map(Number);
        const expectW = br.width / Math.max(w, 1 / 2.2), expectH = br.height / Math.max(h, 1 / 2.2);
        const cropped = stage.classList.contains('is-crop') && el.classList.contains('is-cropped');
        const btn = el.querySelector('.fav-btn');
        const btnVisible = btn && getComputedStyle(btn).display !== 'none';
        const liveTag = document.getElementById('live-tag');
        return { inView, cropped, btnVisible, liveTag: !!liveTag && !liveTag.hidden && /LIVE · /.test(liveTag.textContent), ratioW: +(sr.width / expectW).toFixed(3), ratioH: +(sr.height / expectH).toFixed(3), clip: (stage.style.clipPath || '').slice(0, 24) };
      }, slot);
      results[slot] = m;
      if (!m.inView) continue;
      /* expand toggle */
      const exp = await page.evaluate(async (slot) => {
        const el = document.querySelector(`.app-slot[data-slot="${slot}"]`);
        const btn = el.querySelector('.fav-btn'); btn.click();
        await new Promise((r) => setTimeout(r, 1900));
        const stage = document.getElementById('app-stage');
        const sr = stage.getBoundingClientRect(), br = el.getBoundingClientRect();
        const full = Math.abs(sr.width - br.width) < 4 && Math.abs(sr.height - br.height) < 4;
        btn.click(); await new Promise((r) => setTimeout(r, 1800));
        const sr2 = stage.getBoundingClientRect();
        return { full, backToCrop: sr2.height > br.height * 1.2 || sr2.width > br.width * 1.08 };
      }, slot);
      results[slot].expand = exp;
    }
    const measured = Object.values(results).filter((r) => r.inView);
    const geomOk = measured.length >= 4 && measured.every((m) => m.cropped && m.liveTag && m.ratioW > .93 && m.ratioW < 1.07 && m.ratioH > .93 && m.ratioH < 1.07);
    const expandOk = measured.every((m) => m.expand && m.expand.full && m.expand.backToCrop);
    ok('G4-crop-geometry', geomOk, results);
    ok('G4-expand-toggle', expandOk, measured.map((m) => m.expand));
    await ctx.close();
  }

  /* ---- G7: reduced motion ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    const r = await page.evaluate(() => {
      const pin = document.querySelector('[data-pin]');
      const spacer = pin && (pin.parentElement.classList.contains('pin-spacer') ? pin.parentElement : null);
      const host = document.querySelector('.scene-host');
      return { pinH: pin && pin.getBoundingClientRect().height, spacerH: spacer && spacer.getBoundingClientRect().height, statics: document.querySelectorAll('.scene-host.is-static').length, vh: innerHeight };
    });
    ok('G7-reduced', r.spacerH < r.vh * 2.2 && r.statics >= 1, r);
    await ctx.close();
  }

  await browser.close();
  require('fs').writeFileSync(require('path').join(__dirname, 'production-gates.json'), JSON.stringify(out, null, 2));
  const fails = Object.entries(out.gates).filter(([, v]) => !v.pass);
  console.log('GATES SUMMARY:', Object.keys(out.gates).length - fails.length, 'pass /', fails.length, 'fail');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('PROBE CRASH', e); process.exit(2); });
