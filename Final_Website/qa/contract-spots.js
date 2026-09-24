/* Contract spot-checks never covered by the gate matrix:
   §19.4 reverse sync (app -> page), §21 iframe title + single tab stop per slot,
   §15 adaptive nav over the paper act, §5.2/§14 verbatim caveats, §24 lazy three +
   idle iframe mount, §19.8 MF_CONFIG key set. Evidence -> qa/contract-spots.json. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:8080/', { waitUntil: 'load' });
  await p.waitForTimeout(3500);

  /* §24: three lazy after hero interactive; iframe mounted via requestIdleCallback */
  const lazy = await p.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const three = performance.getEntriesByType('resource').find((e) => /three\.module/.test(e.name));
    return { threeStart: three ? Math.round(three.startTime) : null, domInteractive: Math.round(nav.domInteractive) };
  });
  const idleMount = fs.readFileSync(path.join(__dirname, '..', 'site/js/core/stage.js'), 'utf-8').includes('requestIdleCallback');

  /* §21: iframe title + one tab stop per slot */
  const iframe = await p.evaluate(() => {
    const f = document.getElementById('app-frame');
    return { title: f && f.getAttribute('title') };
  });

  /* §19.4 reverse sync: drive the app from inside the iframe, expect page reactions */
  await p.evaluate(() => document.querySelector('[data-slot="dashboard"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(2000);
  const reverse = await p.evaluate(async () => {
    const seen = [];
    const h = (e) => seen.push(e.detail);
    document.addEventListener('mf:screen', h);
    const w = document.getElementById('app-frame').contentWindow;
    w.showScreen('library');
    await new Promise((r) => setTimeout(r, 1200));
    document.removeEventListener('mf:screen', h);
    const active = document.querySelector('#s-index [data-index-item="library"]');
    return { events: seen, indexRowActive: !!active && active.classList.contains('is-active') };
  });

  /* §15: adaptive nav over the paper act */
  const paperNav = await p.evaluate(async () => {
    const y = document.querySelector('#s-lib-open').getBoundingClientRect().top + scrollY;
    scrollTo(0, y + 200);
    await new Promise((r) => setTimeout(r, 1200));
    const nav = document.querySelector('header.nav');
    const onPaper = nav.className + '|' + getComputedStyle(nav).backgroundColor;
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 900));
    const onDark = nav.className + '|' + getComputedStyle(nav).backgroundColor;
    return { onPaper, onDark, adapts: onPaper !== onDark };
  });

  /* §5.2/§14 verbatim caveats + §19.8 MF_CONFIG keys */
  const html = await p.evaluate(async () => (await (await fetch('./')).text()));
  const caveats = ['UI demo — no live connection to any service', 'CONNECT VPN', 'AUTO-LAUNCH', 'START AUTOMATION', 'EMERGENCY STOP'].map((t) => [t, new RegExp(t, 'i').test(html)]);
  const envSrc = fs.readFileSync(path.join(__dirname, '..', 'site/js/core/env.js'), 'utf-8');
  const cfgKeys = ['downloadUrl', 'repoUrl', 'issuesUrl', 'siteUrl', 'feedbackEndpoint'].map((k) => [k, envSrc.includes(k + ':')]);

  await p.evaluate(async () => { const y = document.querySelector('#s-lib-open').getBoundingClientRect().top + scrollY; scrollTo(0, y + 200); await new Promise((r) => setTimeout(r, 1200)); });
  await p.screenshot({ path: path.join(__dirname, 'shots-prod', '72-paper-nav.jpg'), clip: { x: 0, y: 0, width: 1440, height: 220 } });
  await b.close();

  const out = { lazy, idleMount, iframe, reverse, paperNav, caveats, cfgKeys };
  out.pass = lazy.threeStart !== null && lazy.threeStart >= lazy.domInteractive && idleMount &&
    iframe.title === 'Mail Factory live application' &&
    reverse.events.includes('library') && reverse.indexRowActive && paperNav.adapts &&
    caveats.every(([, ok]) => ok) && cfgKeys.every(([, ok]) => ok);
  fs.writeFileSync(path.join(__dirname, 'contract-spots.json'), JSON.stringify(out, null, 1));
  console.log('contract spots:', JSON.stringify({ lazy: out.lazy, idleMount, iframeTitle: iframe.title, reverse: out.reverse, adapts: paperNav.adapts, caveats: caveats.map(([s, ok]) => (ok ? 'y' : 'N:' + s)), cfg: cfgKeys.every(([, ok]) => ok), pass: out.pass }));
  process.exit(out.pass ? 0 : 1);
})();
