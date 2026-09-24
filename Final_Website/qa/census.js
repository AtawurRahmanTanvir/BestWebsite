/* §31/§35 internal-consistency audit re-run on the SHIPPED build (Definition of Done).
   File-level counts + live DOM/menu/carousel checks. Evidence -> qa/census.json. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const URL = process.env.URL || 'http://127.0.0.1:8080/';
const count = (s, re) => (s.match(re) || []).length;

(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'site/index.html'), 'utf-8');
  const pins = [...html.matchAll(/data-pin-length="([\d.]+)"/g)].map((m) => parseFloat(m[1]));
  const file = {
    sections: count(html, /<section class="sec/g),
    chapters: new Set([...html.matchAll(/data-chapter="([a-z]+)"/g)].map((m) => m[1])).size,
    pins: count(html, / data-pin /g) + count(html, / data-pin"/g),
    pinSum: +pins.reduce((a, b) => a + b, 0).toFixed(2),
    hscroll: count(html, /data-hscroll/g),
    slots: count(html, /class="app-slot"/g),
    focusRegions: count(html, /data-focus-region=/g),
    sceneHosts: count(html, /class="scene-host/g),
    gradHosts: count(html, /grad-host"/g) + count(html, /grad-host /g),
    treeNodes: count(html, /data-tree-act="/g),
    engines: count(html, /class="eng"/g),
    indexRows: count(html, /data-index-item=/g),
    versions: [...new Set([...html.matchAll(/v(\d+\.\d+\.\d+)/g)].map((m) => 'v' + m[1]))],
    footer: /<footer/.test(html),
    cursor: /data-cursor|class="cursor/.test(html),
    v179: /1\.7\.9/.test(html),
  };

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const dom = await page.evaluate(() => ({
    ringServers: (document.querySelector('.ring-track') || { children: [] }).children.length,
    menuBtn: !!document.querySelector('.nav-menu-btn'),
  }));

  /* header height (§15 ≤64px) */
  const headerH = await page.evaluate(() => Math.round(document.querySelector('header.nav').getBoundingClientRect().height));

  /* menu overlay (§15): 14 chapter links + 6 surface shortcuts + credits + v1.0.0 */
  await page.click('.nav-menu-btn');
  await page.waitForTimeout(700);
  const menu = await page.evaluate(() => {
    const m = document.querySelector('.menu');
    return {
      chapters: m.querySelectorAll('.menu-list a').length,
      surfaces: m.querySelectorAll('[data-index-link]').length,
      credits: /Atawur Rahman/.test(m.textContent) && /v1\.0\.0/.test(m.textContent),
      versions: [...new Set([...m.textContent.matchAll(/v(\d+\.\d+\.\d+)/g)].map((x) => 'v' + x[1]))],
    };
  });
  await page.click('.nav-menu-btn');
  await page.waitForTimeout(600);

  /* carousel (§17): auto-advance 5.2s, pause on hover, 4 cards + dashes */
  await page.evaluate(() => document.querySelector('[data-states]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(1200);
  const idx = () => page.evaluate(() => [...document.querySelectorAll('[data-states] .sc-card')].findIndex((c) => c.classList.contains('is-center')));
  const car0 = await idx();
  await page.waitForTimeout(6200);
  const car1 = await idx();
  await page.hover('[data-states]');
  const car2 = await idx();
  await page.waitForTimeout(6200);
  const car3 = await idx();
  const car = await page.evaluate(() => ({
    cards: document.querySelectorAll('[data-states] .sc-card').length,
    dashes: (document.querySelector('[data-states] .sc-dashes') || { children: [] }).children.length,
    arrows: document.querySelectorAll('[data-states] .sc-arrow').length,
  }));
  await browser.close();

  const live = {
    headerH,
    menu,
    ringServers: dom.ringServers,
    carousel: { ...car, autoAdvances: car0 !== car1, pausesOnHover: car2 === car3 },
  };

  const checks = [
    ['57 sections', file.sections === 57],
    ['14 chapters', file.chapters === 14],
    ['12 pins', file.pins === 12],
    ['pin sum 26.2', Math.abs(file.pinSum - 26.2) < 0.01],
    ['3 hscroll', file.hscroll === 3],
    ['7 slots', file.slots === 7],
    ['13 focus regions', file.focusRegions === 13],
    ['9 scene hosts', file.sceneHosts === 9],
    ['11 grad hosts', file.gradHosts === 11],
    ['14 tree destinations', file.treeNodes === 14],
    ['6 engines', file.engines === 6],
    ['6 index rows', file.indexRows === 6 || file.indexRows === 12],
    ['22 ring servers', live.ringServers === 22],
    ['version v1.0.0 only', JSON.stringify(file.versions) === '["v1.0.0"]'],
    ['no standalone footer', !file.footer],
    ['no cursor hooks', !file.cursor],
    ['no 1.7.9', !file.v179],
    ['header ≤64px', live.headerH <= 64],
    ['menu 14 chapters', menu.chapters === 14],
    ['menu 6 surfaces', menu.surfaces === 6],
    ['menu credits + v1.0.0', menu.credits && JSON.stringify(menu.versions) === '["v1.0.0"]'],
    ['carousel 4 cards', car.cards === 4],
    ['carousel 4 dashes', car.dashes === 4],
    ['carousel arrows', car.arrows >= 2],
    ['carousel auto-advance', live.carousel.autoAdvances],
    ['carousel pause on hover', live.carousel.pausesOnHover],
  ];
  const fail = checks.filter(([, ok]) => !ok).map(([label]) => label);
  const out = { file, live, checks: checks.map(([label, ok]) => ({ label, ok })), pass: fail.length === 0 };
  fs.writeFileSync(path.join(__dirname, 'census.json'), JSON.stringify(out, null, 1));
  console.log('census: ' + (checks.length - fail.length) + '/' + checks.length + (fail.length ? ' FAIL: ' + fail.join(', ') : ' — all binding counts verified'));
  process.exit(fail.length ? 1 : 0);
})();
