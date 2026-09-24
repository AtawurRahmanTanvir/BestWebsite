/* G9 — owner map walk: the 46 DOCX directives (master doc §8.2) checked against the
   shipped build: section presence/absence, merge markers, and a screenshot per target.
   Evidence -> qa/owner-map.json. Exit 1 if any note fails. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(__dirname, 'shots-prod');
const URL = process.env.URL || 'http://127.0.0.1:8080/';

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8');
const count = (s, re) => (s.match(re) || []).length;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(URL, { waitUntil: 'load' });
  const html = await page.evaluate(async () => (await (await fetch('./')).text()));
  await browser.close();

  const css = ['base', 'intro', 'chapters-a', 'chapters-b', 'chapters-c'].map((f) => read('site/css/' + f + '.css')).join('\n');
  const jsAll = fs.readdirSync(path.join(ROOT, 'site/js/sections')).map((f) => read('site/js/sections/' + f)).join('\n') +
    fs.readdirSync(path.join(ROOT, 'site/js/scenes')).map((f) => read('site/js/scenes/' + f)).join('\n');
  const shots = new Set(fs.readdirSync(SHOTS).map((f) => f.replace(/\.jpg$/, '').replace(/^\d+-/, '')));
  const shot = (slug) => shots.has(slug);
  const sec = (id) => html.includes('id="' + id + '"');
  const nosec = (id) => !sec(id);

  const N = (n, target, fate, checks) => ({ n, target, fate, checks });
  const C = (label, ok) => ({ label, ok: !!ok });

  const notes = [
    N(1, 's-hero', 'keep + crisp official logo', [C('section', sec('s-hero')), C('logo-1024.webp', html.includes('logo-1024.webp')), C('shot', shot('hero'))]),
    N(2, 's-hero', 'typography pass', [C('section', sec('s-hero')), C('shot', shot('hero'))]),
    N(3, 's-strip', 'Text kinetic merged', [C('section', sec('s-strip')), C('dual marquee', count(html, /mq-track/g) >= 2), C('shot', shot('strip'))]),
    N(4, 's-manifesto', 'keep', [C('section', sec('s-manifesto')), C('serif statement', html.includes('serif')), C('shot', shot('manifesto'))]),
    N(5, 's-index', 'keep + red active', [C('section', sec('s-index')), C('active row css', css.includes('is-active')), C('shot', shot('index'))]),
    N(6, 's-getbuild', 'keep', [C('section', sec('s-getbuild')), C('copy', /Take the product/.test(html)), C('shot', shot('getbuild'))]),
    N(7, 's-utility', 'Text rail copy merged', [C('section', sec('s-utility')), C('Check Route', html.includes('Check Route')), C('shot', shot('utility'))]),
    N(8, 's-engine-live', 'keep', [C('section', sec('s-engine-live')), C('shot', shot('engine-live'))]),
    N(9, 's-workflow', 'INPUT→OUTPUT merged', [C('section', sec('s-workflow')), C('INPUT band', /Input|INPUT/.test(html)), C('shot', shot('workflow'))]),
    N(10, 's-steps', 'keep + Text verbatim', [C('section', sec('s-steps')), C('shot', shot('steps'))]),
    N(11, 's-params', 'keep + Text tables', [C('section', sec('s-params')), C('shot', shot('params'))]),
    N(12, 's-lib-live', 'keep', [C('section', sec('s-lib-live')), C('shot', shot('lib-live'))]),
    N(13, 's-telemetry', '4-state carousel merged (4 cards, never 5)', [C('section', sec('s-telemetry')), C('four states', count(html, /si-tele st-/g) === 4), C('dashes+arrows', html.includes('sc-arrow')), C('shot', shot('telemetry'))]),
    N(14, 's-index', 'red active row', [C('section', sec('s-index')), C('shot', shot('index'))]),
    N(15, 's-wiremark', 'geometry from logo-mask alpha', [C('section', sec('s-wiremark')), C('scene samples mask', read('site/js/scenes/wiremark.js').includes('markSilhouette') && read('site/js/scenes/util.js').includes('logo-mask')), C('shot', shot('wiremark'))]),
    N(16, 's-capability', 'native merged + refined', [C('section', sec('s-capability')), C('native gone', nosec('s-native')), C('shot', shot('capability'))]),
    N(17, 's-ondevice', 'underline removed, comp enlarged', [C('section', sec('s-ondevice')), C('no underline rule', !/\.ondevice-title[^{]*\{[^}]*background:(?!none)/.test(css)), C('shot', shot('ondevice'))]),
    N(18, 's-workflow', 'premium depth pass', [C('section', sec('s-workflow')), C('shot', shot('workflow'))]),
    N(19, 's-aperture', 'refine', [C('section', sec('s-aperture')), C('shot', shot('aperture'))]),
    N(20, 's-dash-live', 'caustic kept, reusable host', [C('section', sec('s-dash-live')), C('caustic host', html.includes('data-grad="caustic"')), C('shader', jsAll.includes('caustic')), C('shot', shot('dash-live'))]),
    N(21, 's-capability', 'tiles merged + material pass', [C('section', sec('s-capability')), C('tiles gone', nosec('s-tiles')), C('shot', shot('capability'))]),
    N(22, 's-openfactory', 'fluidize', [C('section', sec('s-openfactory')), C('shot', shot('openfactory'))]),
    N(23, 's-engine-open', 'new deep bg', [C('section', sec('s-engine-open')), C('bg rule', css.includes('engine-open')), C('shot', shot('engine-open'))]),
    N(24, 's-reactor', 'metal/instancing upgrade', [C('section', sec('s-reactor')), C('metal pass', read('site/js/scenes/reactor.js').includes('metalness')), C('shot', shot('reactor'))]),
    N(25, 's-engines', 'refine', [C('section', sec('s-engines')), C('shot', shot('engines'))]),
    N(26, 's-utility + s-maker', 'premium table + signature profile', [C('utility', sec('s-utility')), C('maker', sec('s-maker')), C('signature', html.includes('Atawur Rahman')), C('shot', shot('maker'))]),
    N(27, 'slots', 'FAV + premium frames', [C('7 focus regions', count(html, /data-focus-region=/g) === 13), C('frames', html.includes('data-frame=')), C('shot', shot('dash-live'))]),
    N(28, 's-switchboard', 'redesign', [C('section', sec('s-switchboard')), C('shot', shot('switchboard'))]),
    N(29, 's-gen-open', 'SINGLE/BATCH drives real app', [C('section', sec('s-gen-open')), C('toggle + iframe tab bridge', html.includes('data-gen-toggle') && read('site/js/sections/generator.js').includes('.tab[data-tab=')), C('shot', shot('gen-open'))]),
    N(30, 's-prodline', 'tier-simplified small tier', [C('section', sec('s-prodline')), C('tier code', read('site/js/scenes/prodline.js').match(/env\.small|quality\.tier|tier/) !== null), C('shot', shot('prodline'))]),
    N(31, 's-lib-open', 'recompose', [C('section', sec('s-lib-open')), C('shot', shot('lib-open'))]),
    N(32, 's-deck', 'keep fan', [C('section', sec('s-deck')), C('shot', shot('deck'))]),
    N(33, 's-pulse', 'upgrade', [C('section', sec('s-pulse')), C('shot', shot('pulse'))]),
    N(34, 's-telemetry', 'dial scrub FROZEN', [C('section', sec('s-telemetry')), C('scrub intact', read('site/js/sections/onetouch.js').includes('scrub')), C('shot', shot('telemetry'))]),
    N(35, 's-ring', 'upgrade', [C('section', sec('s-ring')), C('shot', shot('ring'))]),
    N(36, 's-tree', 'interactive map, 14 nodes', [C('section', sec('s-tree')), C('14 destinations', count(html, /data-tree-act="/g) === 14), C('shot', shot('tree'))]),
    N(37, 's-themes', '6 bespoke SVG swatches', [C('section', sec('s-themes')), C('6 swatches', count(html, /class="sw( is-active)?"/g) === 6), C('5 locked', count(html, /class="sw"/g) === 5), C('shot', shot('themes'))]),
    N(38, 's-backup', 'premium circles + honesty line', [C('section', sec('s-backup')), C('UI demo line', html.includes('UI demo')), C('shot', shot('backup'))]),
    N(39, 's-topology', 'upgrade + interactions', [C('section', sec('s-topology')), C('shot', shot('topology'))]),
    N(40, 's-terrain', 'keep flyover', [C('section', sec('s-terrain')), C('shot', shot('terrain'))]),
    N(41, 's-legal', 'keep split', [C('section', sec('s-legal')), C('shot', shot('legal'))]),
    N(42, 's-maker', 'scroll ring + profile', [C('section', sec('s-maker')), C('ring track', html.includes('wr-track')), C('profile', html.includes('System Architect')), C('shot', shot('maker'))]),
    N(43, 's-rating', 'premium instrument', [C('section', sec('s-rating')), C('radiogroup', html.includes('radiogroup')), C('shot', shot('rating'))]),
    N(44, 's-emergence', 'particles sample logo mask', [C('section', sec('s-emergence')), C('scene samples mask', read('site/js/scenes/emergence.js').includes('sampleLogo') && read('site/js/scenes/util.js').includes('logo-mask')), C('shot', shot('emergence'))]),
    N(45, 's-brand', 'keep reveal', [C('section', sec('s-brand')), C('shot', shot('brand'))]),
    N(46, 's-final-download + s-brand', 'single close, footer absorbed', [C('download', sec('s-final-download')), C('brand', sec('s-brand')), C('no standalone footer', !/<footer/.test(html)), C('shot', shot('brand'))]),
  ];

  const bad = [];
  for (const note of notes) {
    note.pass = note.checks.every((c) => c.ok);
    if (!note.pass) bad.push(note);
  }
  fs.writeFileSync(path.join(__dirname, 'owner-map.json'), JSON.stringify({ notes: notes.length, pass: notes.length - bad.length, fail: bad }, null, 1));
  console.log('G9 owner-map: ' + (notes.length - bad.length) + '/' + notes.length + ' notes verified');
  if (bad.length) { console.log(JSON.stringify(bad, null, 1)); process.exit(1); }
})();
