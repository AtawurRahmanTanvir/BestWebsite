/* App Stage — the one real Mail Factory application (untouched, in an iframe) travelling
   through the page: it morphs between presentation slots and stays synchronised with the story. */
import { env, config, lerp } from './env.js';
import { gsap, ScrollTrigger, scrollBy } from './scroll.js';
import { $, $$ } from './ui.js';

export const stageState = { current: null, screen: 'dashboard', loaded: false };

export function initStage() {
  const stage = $('#app-stage'); const iframe = $('#app-frame'); if (!stage || !iframe) return null;
  const slots = $$('.app-slot');
  const morph = { t: 1 }; let prevRect = null; let pending = null;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---- application bridge ---- */
  function appWindow() { try { return iframe.contentWindow; } catch (_) { return null; } }
  function showScreen(name, force = false) {
    if (!name) return;
    if (!stageState.loaded) { pending = name; stageState.screen = name; return; }
    if (stageState.screen === name && !force) return;
    const w = appWindow();
    if (w && typeof w.showScreen === 'function') { try { w.showScreen(name); stageState.screen = name; document.dispatchEvent(new CustomEvent('mf:screen', { detail: name })); } catch (err) { console.warn('[stage] showScreen failed', err); } }
  }
  function detectScreen() { const w = appWindow(); if (!w) return; try { const active = w.document.querySelector('.screen-view.active'); if (active && active.dataset.screen && active.dataset.screen !== stageState.screen) { stageState.screen = active.dataset.screen; document.dispatchEvent(new CustomEvent('mf:screen', { detail: stageState.screen })); } } catch (_) {} }

  iframe.addEventListener('load', () => {
    stageState.loaded = true; stage.classList.add('is-loaded');
    detectScreen();
    if (pending) { const p = pending; pending = null; showScreen(p, true); }
    patchIframe();
    document.dispatchEvent(new CustomEvent('mf:app-ready'));
  });
  // load the application right after first paint — the hero never waits for it
  const startLoad = () => { if (!iframe.getAttribute('src')) iframe.setAttribute('src', config.appUrl); };
  if ('requestIdleCallback' in window) requestIdleCallback(startLoad, { timeout: 1200 }); else setTimeout(startLoad, 400);

  function patchIframe() {
    const w = appWindow(); if (!w) return;
    let doc; try { doc = w.document; } catch (_) { return; }
    // hand the wheel back to the page when the app cannot scroll further
    doc.addEventListener('wheel', (e) => {
      const dir = Math.sign(e.deltaY); if (!dir) return;
      let el = e.target; let can = false;
      while (el && el !== doc.body && el.nodeType === 1) { const st = w.getComputedStyle(el); if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 1) { if ((dir > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dir < 0 && el.scrollTop > 0)) { can = true; break; } } el = el.parentNode; }
      if (!can) { const se = doc.scrollingElement || doc.documentElement; if ((dir > 0 && se.scrollTop + se.clientHeight < se.scrollHeight - 1) || (dir < 0 && se.scrollTop > 0)) can = true; }
      if (!can) { e.preventDefault(); scrollBy(e.deltaY); }
    }, { passive: false });
    // keep the page informed of in-app navigation (the app's own buttons): watch the screen classes
    let detectTimer = 0; const queueDetect = () => { clearTimeout(detectTimer); detectTimer = setTimeout(detectScreen, 40); };
    try { new w.MutationObserver(queueDetect).observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['class'] }); } catch (_) {}
    doc.addEventListener('click', () => { setTimeout(detectScreen, 80); setTimeout(detectScreen, 400); }, true);
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') iframe.blur(); });
  }

  /* ---- slots ---- */
  function activate(slot) {
    if (stageState.current === slot) return;
    const prev = stageState.current || stageState.last;
    if (prev && prev !== slot) {
      const r = prev.getBoundingClientRect();
      // clamp a far-away origin to just outside the viewport so the app flies in, not teleports
      const top = r.top < 0 ? Math.max(r.top, -r.height - env.vh * .2) : Math.min(r.top, env.vh * 1.2);
      prevRect = { left: r.left, top, width: r.width, height: r.height };
      morph.t = 0; gsap.to(morph, { t: 1, duration: env.reduced ? 0 : 1.25, ease: 'none', overwrite: true });
    } else { prevRect = null; morph.t = 1; }
    stageState.current = slot; stageState.last = slot;
    stage.dataset.frame = slot.dataset.frame || 'phone';
    stage.classList.add('is-active');
    slot.classList.add('is-live');
    if (slot.dataset.screen) showScreen(slot.dataset.screen);
    document.dispatchEvent(new CustomEvent('mf:slot', { detail: slot.dataset.slot }));
    apply();
  }
  function deactivate(slot) {
    if (stageState.current !== slot) return;
    slot.classList.remove('is-live');
    stageState.current = null; stage.classList.remove('is-active');
    document.dispatchEvent(new CustomEvent('mf:slot', { detail: null }));
  }
  slots.forEach((slot) => {
    const trig = slot.closest('[data-slot-trigger]') || slot;
    ScrollTrigger.create({ trigger: trig, start: 'top 85%', end: 'bottom 15%', onEnter: () => activate(slot), onEnterBack: () => activate(slot), onLeave: () => deactivate(slot), onLeaveBack: () => deactivate(slot) });
  });
  // beats inside a slot section switch screens as the story progresses
  $$('[data-screen-beat]').forEach((b) => ScrollTrigger.create({ trigger: b, start: 'top 60%', end: 'bottom 40%', onEnter: () => showScreen(b.dataset.screenBeat), onEnterBack: () => showScreen(b.dataset.screenBeat) }));

  let lastW = 0, lastH = 0;
  function apply() {
    const slot = stageState.current; if (!slot) return;
    const b = slot.getBoundingClientRect();
    let r = b;
    if (morph.t < 1 && prevRect) { const k = ease(morph.t); r = { left: lerp(prevRect.left, b.left, k), top: lerp(prevRect.top, b.top, k), width: lerp(prevRect.width, b.width, k), height: lerp(prevRect.height, b.height, k) }; }
    stage.style.transform = `translate3d(${r.left.toFixed(2)}px, ${r.top.toFixed(2)}px, 0)`;
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w !== lastW || h !== lastH) { stage.style.width = w + 'px'; stage.style.height = h + 'px'; lastW = w; lastH = h; }
  }
  gsap.ticker.add(apply);
  addEventListener('resize', () => { lastW = 0; apply(); });

  /* ---- tilt presentation follows the pointer ---- */
  const tiltSections = slots.filter((s) => s.dataset.frame === 'tilt').map((s) => s.closest('.sec'));
  tiltSections.forEach((sec) => {
    if (!sec) return;
    sec.addEventListener('pointermove', (e) => { if (stage.dataset.frame !== 'tilt') return; const r = sec.getBoundingClientRect(); const nx = ((e.clientX - r.left) / r.width) * 2 - 1; const ny = ((e.clientY - r.top) / r.height) * 2 - 1; stage.style.setProperty('--ry', (nx * 14).toFixed(2) + 'deg'); stage.style.setProperty('--rx', (-ny * 10).toFixed(2) + 'deg'); }, { passive: true });
    sec.addEventListener('pointerleave', () => { stage.style.setProperty('--ry', '0deg'); stage.style.setProperty('--rx', '0deg'); });
  });

  stage.addEventListener('pointerenter', () => document.dispatchEvent(new CustomEvent('mf:iframe-hover', { detail: true })));
  stage.addEventListener('pointerleave', () => document.dispatchEvent(new CustomEvent('mf:iframe-hover', { detail: false })));

  const api = { showScreen, prepare: (name) => showScreen(name), activate, deactivate, slots, get screen() { return stageState.screen; } };
  window.__mf = Object.assign(window.__mf || {}, { stage: api, scrollBy });
  return api;
}
