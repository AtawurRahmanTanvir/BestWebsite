/* Mail Factory — experience bootstrap.
   Configuration lives in window.MF_CONFIG (index.html). The download URL is a placeholder
   until the real build link exists; the site never invents one. */
import { env, quality, config } from './env.js';
import { gsap, ScrollTrigger } from './scroll.js';
import { initUI, $, $$ } from './ui.js';
import { initAll as initReveals } from './reveal.js';
import { initScenes } from './scenes.js';
import { initStage } from './stage.js';
import { initPins } from './pins.js';

document.documentElement.classList.add('js');
document.documentElement.dataset.tier = quality.tier;
if (env.coarse) document.documentElement.classList.add('is-touch');

let stage = null;
window.__mf = Object.assign(window.__mf || {}, { env, quality, config, gsap, ScrollTrigger });

async function boot() {
  initPins();            // pinned sections first: their spacers change every later position
  stage = initStage();
  initUI();
  initReveals();
  initScenes();
  ScrollTrigger.sort(); ScrollTrigger.refresh();

  const mods = ['intro', 'dashboard', 'engine', 'generator', 'library', 'onetouch', 'settings', 'deep'];
  for (const m of mods) {
    try { const mod = await import(`../sections/${m}.js`); mod.init && mod.init({ stage }); }
    catch (err) { console.warn('[section]', m, err); }
  }

  // product index → chapter + screen
  $$('[data-index-item],[data-index-link]').forEach((b) => {
    const screen = b.dataset.indexItem || b.dataset.indexLink;
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const target = $(b.dataset.target || b.getAttribute('href'));
      if (stage) stage.prepare(screen);
      document.body.classList.remove('menu-open'); $('.menu').classList.remove('is-open');
      import('./scroll.js').then(({ scrollTo }) => target && scrollTo(target, { offset: 0 }));
    });
  });

  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 200));
  document.body.classList.add('is-ready');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
