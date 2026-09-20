/* Chapter 05: mode toggle, arc carousel, parameter board, one-tap copy demo. */
import { env } from '../core/env.js';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { $, $$, toast } from '../core/ui.js';

function modeToggle() {
  const root = $('[data-gen-toggle]'); if (!root) return;
  const words = $$('.gen-word', root); const descs = $$('[data-mode-desc]', root);
  const set = (mode, drive = true) => {
    words.forEach((w) => w.classList.toggle('is-active', w.dataset.mode === mode));
    descs.forEach((d) => d.classList.toggle('is-active', d.dataset.modeDesc === mode));
    if (!drive) return;
    // drive the real application's own tab, through its own click handler
    try { const doc = $('#app-frame').contentDocument; const tab = doc && doc.querySelector(`.tab[data-tab="${mode}"]`); if (tab && !tab.classList.contains('active')) tab.click(); } catch (_) {}
  };
  words.forEach((w) => w.addEventListener('click', () => set(w.dataset.mode)));
}

function arc() {
  const root = $('[data-arc]'); if (!root) return;
  const cards = $$('.arc-card', root); const n = cards.length; const dots = root.querySelector('.arc-dots'); const title = root.querySelector('[data-arc-title]');
  const titles = cards.map((c) => c.querySelector('h3').textContent);
  cards.forEach((_, i) => { const d = document.createElement('button'); d.type = 'button'; d.setAttribute('role', 'tab'); d.setAttribute('aria-label', 'Step ' + (i + 1)); d.addEventListener('click', () => go(i)); dots.appendChild(d); });
  const dotEls = [...dots.children];
  let pos = 0, target = 0, vel = 0, dragging = false, startX = 0, startPos = 0, lastX = 0, lastT = 0;
  const spread = () => (env.small ? 1.0 : 1.0);
  const layout = () => {
    const w = root.clientWidth; const radius = Math.max(w * .55, 420);
    cards.forEach((c, i) => {
      let d = i - pos; // relative position
      const ang = d * 0.42 * spread();
      const x = Math.sin(ang) * radius; const z = (Math.cos(ang) - 1) * radius * .9; const rot = ang * (180 / Math.PI) * .9;
      const scale = 1 - Math.min(Math.abs(d), 3) * .06;
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${(Math.abs(d) * 22).toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      c.style.opacity = String(Math.max(0, 1 - Math.abs(d) * .28));
      c.classList.toggle('is-front', Math.round(pos) === i);
    });
    const idx = ((Math.round(pos) % n) + n) % n;
    dotEls.forEach((d, i) => d.classList.toggle('is-on', i === idx));
    if (title.dataset.i !== String(idx)) { title.dataset.i = idx; title.innerHTML = `<em>${idx + 1}.</em> ${titles[idx]}`; gsap.fromTo(title, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }); }
  };
  const go = (i) => { target = Math.max(0, Math.min(n - 1, i)); };
  root.querySelector('[data-arc-prev]').addEventListener('click', () => go(Math.round(target) - 1));
  root.querySelector('[data-arc-next]').addEventListener('click', () => go(Math.round(target) + 1));
  cards.forEach((c, i) => c.addEventListener('click', () => { if (Math.abs(lastDrag) < 6) go(i); }));
  let lastDrag = 0;
  const pxPerCard = () => Math.max(160, root.clientWidth * .28);
  root.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; startPos = pos; lastX = e.clientX; lastT = performance.now(); vel = 0; lastDrag = 0; root.setPointerCapture(e.pointerId); });
  root.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - startX; lastDrag = dx; target = pos = startPos - dx / pxPerCard(); const now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now; });
  const end = () => { if (!dragging) return; dragging = false; const fling = -vel * 12; target = Math.max(0, Math.min(n - 1, Math.round(pos + fling))); };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { go(Math.round(target) - 1); e.preventDefault(); } if (e.key === 'ArrowRight') { go(Math.round(target) + 1); e.preventDefault(); } });
  gsap.ticker.add((t, dt) => { if (!dragging) pos += (target - pos) * (1 - Math.exp(-dt / 1000 * 10)); layout(); });
  addEventListener('resize', layout); layout();
}

function params() {
  const board = $('[data-params]'); if (!board) return;
  const readout = $('[data-readout] code'); const out = $('[data-out-count]'); const ro = $('[data-readout]');
  const state = { email: 12, pass: 16, qty: 10 };
  const render = () => { readout.textContent = `BATCH · QTY ${state.qty} · EMAIL ${state.email} · PASS ${state.pass}`; out.textContent = state.qty; ro.classList.add('is-flash'); setTimeout(() => ro.classList.remove('is-flash'), 220); };
  $$('.pgroup[data-group]', board).forEach((g) => { const k = g.dataset.group; $$('button', g).forEach((b) => b.addEventListener('click', () => { $$('button', g).forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on'); state[k] = +b.dataset.v; render(); gsap.fromTo(out, { scale: 1.15 }, { scale: 1, duration: .4, ease: 'power3.out' }); })); });
}

function copyDemo() {
  const demo = $('[data-copy-demo]'); if (!demo) return;
  const text = demo.querySelector('[data-cd-text]').textContent;
  const fire = async (e) => {
    if (e && e.clientX) { const r = demo.getBoundingClientRect(); demo.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100) + '%'); demo.style.setProperty('--cy', ((e.clientY - r.top) / r.height * 100) + '%'); }
    demo.classList.add('is-copied'); setTimeout(() => demo.classList.remove('is-copied'), 900);
    try { await navigator.clipboard.writeText(text); toast('Sample copied', 'ok'); } catch (_) { toast('Copy is blocked in this context'); }
  };
  demo.addEventListener('click', fire);
  demo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
}

export function init() { modeToggle(); arc(); params(); copyDemo(); }
