/* Scene manager: lazy-mounts 3D worlds and gradient shaders near the viewport,
   prefetches upcoming modules, renders only what is visible, disposes what is far. */
import { env, quality, clamp } from './env.js';
import { gsap } from './scroll.js';

const entries = [];
const moduleCache = new Map();

function loadModule(kind, name) {
  const key = kind + ':' + name;
  if (!moduleCache.has(key)) {
    const p = kind === 'grad' ? import('../scenes/grad.js') : import(`../scenes/${name}.js`);
    moduleCache.set(key, p.catch((err) => { console.warn('[scenes] failed to load', key, err); moduleCache.delete(key); throw err; }));
  }
  return moduleCache.get(key);
}

async function mount(e) {
  if (e.instance || e.mounting || e.disabled) return;
  e.mounting = true; clearTimeout(e.disposeTimer);
  try {
    const mod = await loadModule(e.kind, e.name);
    if (!e.near) { e.mounting = false; return; }
    enforceCap(e.kind, e);
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
    e.el.appendChild(canvas); e.canvas = canvas;
    const rect = e.el.getBoundingClientRect();
    const create = e.kind === 'grad' ? mod.create : (mod.create || mod.default);
    e.instance = await create({ host: e.el, canvas, name: e.name, quality, env, width: rect.width, height: rect.height, opts: e.el.dataset });
    e.instance && e.instance.resize && e.instance.resize(rect.width, rect.height);
    e.el.classList.add('is-mounted');
    e.mountedAt = performance.now();
  } catch (err) {
    console.warn('[scenes] mount failed', e.name, err); e.disabled = true; e.el.classList.add('is-failed');
    if (e.canvas) { e.canvas.remove(); e.canvas = null; }
  }
  e.mounting = false;
}

function unmount(e) {
  if (!e.instance) return;
  try { e.instance.dispose && e.instance.dispose(); } catch (err) { console.warn('[scenes] dispose', err); }
  e.instance = null; if (e.canvas) { e.canvas.remove(); e.canvas = null; }
  e.el.classList.remove('is-mounted');
}

function enforceCap(kind, incoming) {
  const max = kind === 'grad' ? quality.maxGradients : quality.maxScenes;
  const mounted = entries.filter((x) => x.kind === kind && x.instance && x !== incoming);
  if (mounted.length < max) return;
  const vc = env.vh / 2;
  mounted.sort((a, b) => dist(b) - dist(a));
  function dist(x) { const r = x.el.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - vc); }
  unmount(mounted[0]);
}

function scheduleDispose(e) { clearTimeout(e.disposeTimer); e.disposeTimer = setTimeout(() => { if (!e.near) unmount(e); }, 1800); }

export function initScenes() {
  const els = [...document.querySelectorAll('[data-scene],[data-grad]')];
  els.forEach((el) => {
    const kind = el.dataset.scene ? 'scene' : 'grad';
    const name = el.dataset.scene || el.dataset.grad;
    if (quality.tier === 0 && kind === 'scene' && el.dataset.reducedKeep !== 'true') { el.classList.add('is-static'); return; }
    entries.push({ el, kind, name, near: false, visible: false, instance: null, pointer: { x: 0, y: 0, inside: false } });
  });

  const nearIO = new IntersectionObserver((list) => list.forEach((en) => { const e = entries.find((x) => x.el === en.target); if (!e) return; e.near = en.isIntersecting; if (e.near) mount(e); else scheduleDispose(e); }), { rootMargin: '110% 0px 110% 0px' });
  const visIO = new IntersectionObserver((list) => list.forEach((en) => { const e = entries.find((x) => x.el === en.target); if (e) e.visible = en.isIntersecting; }), { rootMargin: '2% 0px 2% 0px' });
  const preIO = new IntersectionObserver((list) => list.forEach((en) => { if (!en.isIntersecting) return; const e = entries.find((x) => x.el === en.target); if (e) loadModule(e.kind, e.name).catch(() => {}); }), { rootMargin: '320% 0px 320% 0px' });
  entries.forEach((e) => { nearIO.observe(e.el); visIO.observe(e.el); preIO.observe(e.el); });

  const ro = new ResizeObserver((list) => list.forEach((en) => { const e = entries.find((x) => x.el === en.target); if (e && e.instance && e.instance.resize) e.instance.resize(en.contentRect.width, en.contentRect.height); }));
  entries.forEach((e) => ro.observe(e.el));

  // local pointer per host
  entries.forEach((e) => {
    e.el.addEventListener('pointermove', (ev) => { const r = e.el.getBoundingClientRect(); e.pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1; e.pointer.y = -(((ev.clientY - r.top) / r.height) * 2 - 1); e.pointer.inside = true; }, { passive: true });
    e.el.addEventListener('pointerleave', () => { e.pointer.inside = false; });
    e.el.addEventListener('pointerdown', (ev) => { if (e.instance && e.instance.onPointer) { const r = e.el.getBoundingClientRect(); e.instance.onPointer('down', { x: ((ev.clientX - r.left) / r.width) * 2 - 1, y: -(((ev.clientY - r.top) / r.height) * 2 - 1), event: ev }); } });
  });

  let last = performance.now();
  const state = { t: 0, dt: 0, progress: 0, pointer: null, rect: null, global: env.pointer, visible: true };
  gsap.ticker.add(() => {
    const now = performance.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    state.t += dt; state.dt = dt;
    for (const e of entries) {
      if (!e.instance || !e.visible) continue;
      if (document.hidden) continue;
      const r = e.el.getBoundingClientRect();
      state.rect = r;
      state.progress = e.el.__pin !== undefined ? e.el.__pin : clamp((env.vh - r.top) / (env.vh + r.height), 0, 1);
      state.scroll = clamp((env.vh - r.top) / (env.vh + r.height), 0, 1);
      state.pointer = e.pointer;
      const t0 = performance.now();
      try { e.instance.render(state); } catch (err) { console.warn('[scenes] render error in', e.name, err); e.disabled = true; unmount(e); }
      e.cost = (e.cost || 0) * 0.9 + (performance.now() - t0) * 0.1;
    }
  });
  window.__mfScenes = entries;

  document.addEventListener('visibilitychange', () => { last = performance.now(); });
  return entries;
}

export function getScene(name) { const e = entries.find((x) => x.name === name); return e && e.instance; }
