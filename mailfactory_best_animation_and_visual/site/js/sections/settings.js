/* Chapter 08: settings tree, draggable theme strip. */
import { env } from '../core/env.js';
import { gsap } from '../core/scroll.js';
import { $, $$ } from '../core/ui.js';

function tree() {
  const t = $('[data-tree]'); if (!t) return;
  const labels = $$('.tl', t);
  new IntersectionObserver(([en], io) => { if (!en.isIntersecting) return; io.disconnect(); gsap.from(labels, { opacity: 0, x: -8, duration: .6, stagger: .05, ease: 'power2.out' }); }, { threshold: .1 }).observe(t);
}

function swatches() {
  const root = $('[data-swatches]'); if (!root) return;
  const track = root.querySelector('.sw-track'); const items = $$('.sw', track);
  let x = 0, target = 0, dragging = false, startX = 0, startT = 0, vel = 0, lastX = 0, lastT = 0;
  const max = () => Math.max(0, track.scrollWidth - root.clientWidth);
  root.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; startT = x; lastX = e.clientX; lastT = performance.now(); vel = 0; root.setPointerCapture(e.pointerId); });
  root.addEventListener('pointermove', (e) => { if (!dragging) return; const now = performance.now(); target = startT - (e.clientX - startX); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now; });
  const end = () => { if (!dragging) return; dragging = false; target = target - vel * 260; snap(); };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  const snap = () => { const m = max(); target = Math.max(0, Math.min(m, target)); const gap = 18; const w = items[0].getBoundingClientRect().width + gap; target = Math.min(m, Math.round(target / w) * w); };
  root.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); target = Math.max(0, Math.min(max(), target + e.deltaX)); } }, { passive: false });
  gsap.ticker.add((t, dt) => { const k = dragging ? 1 : 1 - Math.exp(-dt / 1000 * 10); x += (target - x) * k; track.style.transform = `translate3d(${(-x).toFixed(2)}px,0,0)`; items.forEach((it) => { const r = it.getBoundingClientRect(); const c = r.left + r.width / 2 - innerWidth / 2; const s = 1 - Math.min(.08, Math.abs(c) / innerWidth * .12); it.style.transform = `scale(${s.toFixed(3)})`; }); });
}

export function init() { tree(); swatches(); }
