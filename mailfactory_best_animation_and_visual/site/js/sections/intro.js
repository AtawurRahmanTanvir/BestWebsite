/* Chapter 00–02: hero choreography, product index, ledger, comparison divider. */
import { env } from '../core/env.js';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { $, $$ } from '../core/ui.js';

function hero() {
  const sec = $('#s-hero'); if (!sec) return;
  const host = sec.querySelector('.hero-scene');
  const phase = { v: 0 };
  const lines = $$('.hero-line > span', sec);
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  const d = env.reduced ? 0.01 : 1;
  tl.to(phase, { v: 1, duration: 2.4 * d, ease: 'power2.inOut', onUpdate: () => { host.dataset.phase = phase.v.toFixed(3); } }, 0)
    .fromTo('.hero-mark', { opacity: 0, scale: .82, filter: 'blur(18px) drop-shadow(0 0 60px rgba(234,12,32,.35))' }, { opacity: 1, scale: 1, filter: 'blur(0px) drop-shadow(0 0 60px rgba(234,12,32,.35))', duration: 1.8 * d, ease: 'expo.out' }, 1.1 * d)
    .to(lines, { y: 0, duration: 1.4 * d, stagger: .12 * d, ease: 'expo.out' }, 1.9 * d)
    .to('.hero-sub', { opacity: 1, duration: 1 * d }, 2.6 * d)
    .to('.hero-actions', { opacity: 1, duration: 1 * d }, 2.8 * d)
    .to('.hero-scroll,.hero-side', { opacity: 1, duration: 1 * d }, 3.2 * d)
    .fromTo('.hero-top', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1 * d }, 2.4 * d);
  // scroll: camera pushes through the mark
  if (!env.reduced) {
    gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-mark', { scale: 1.9, y: 80, opacity: 0, ease: 'power2.in' }, 0)
      .to('.hero-title', { yPercent: -30, opacity: .2, ease: 'none' }, 0)
      .to('.hero-bottom', { y: 60, opacity: 0, ease: 'power1.in' }, 0)
      .to(host, { scale: 1.15, ease: 'none' }, 0);
  }
  // pointer parallax on the mark
  if (env.finePointer && !env.reduced) sec.addEventListener('pointermove', (e) => { const nx = (e.clientX / innerWidth - .5); const ny = (e.clientY / innerHeight - .5); gsap.to('.hero-mark', { x: nx * 24, y: ny * 18, duration: .8, overwrite: 'auto' }); gsap.to('.hero-title', { x: nx * -10, duration: .8, overwrite: 'auto' }); }, { passive: true });
}

function index() {
  const list = $('[data-index]'); if (!list) return;
  const words = $$('.pv-word');
  const show = (k) => words.forEach((w) => w.classList.toggle('is-on', w.dataset.pv === k));
  $$('button', list).forEach((b) => {
    b.addEventListener('pointerenter', () => show(b.dataset.indexItem));
    b.addEventListener('focus', () => show(b.dataset.indexItem));
  });
  list.addEventListener('pointerleave', () => show(null));
  // the index also reflects where the app currently is
  document.addEventListener('mf:screen', (e) => $$('button', list).forEach((b) => b.classList.toggle('is-active', b.dataset.indexItem === e.detail)));
}

function ledger() {
  $$('.lg').forEach((b) => b.addEventListener('click', () => { const open = b.classList.contains('is-open'); $$('.lg.is-open').forEach((x) => x.classList.remove('is-open')); if (!open) b.classList.add('is-open'); }));
}

function compare() {
  const cmp = $('[data-compare]'); if (!cmp) return;
  const handle = cmp.querySelector('.cmp-handle');
  let x = 50, target = 50, dragging = false;
  const set = (v) => { target = Math.max(4, Math.min(96, v)); handle.setAttribute('aria-valuenow', Math.round(target)); };
  const fromEvent = (e) => { const r = cmp.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  handle.addEventListener('pointerdown', (e) => { dragging = true; cmp.classList.add('is-dragging'); handle.setPointerCapture(e.pointerId); fromEvent(e); });
  handle.addEventListener('pointermove', (e) => dragging && fromEvent(e));
  const up = () => { dragging = false; cmp.classList.remove('is-dragging'); };
  handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  cmp.addEventListener('pointerdown', (e) => { if (e.target === handle || handle.contains(e.target)) return; fromEvent(e); });
  handle.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { set(target - 5); e.preventDefault(); } if (e.key === 'ArrowRight') { set(target + 5); e.preventDefault(); } if (e.key === 'Home') set(4); if (e.key === 'End') set(96); });
  // idle: a slow breathing hint until touched
  let touched = false; handle.addEventListener('pointerdown', () => (touched = true), { once: true });
  gsap.ticker.add((t, dt) => { if (!touched && !env.reduced) target = 50 + Math.sin(t * .7) * 6; x += (target - x) * (1 - Math.exp(-dt / 1000 * 14)); cmp.style.setProperty('--x', x.toFixed(2) + '%'); });
  // scroll reveal wipe
  ScrollTrigger.create({ trigger: cmp, start: 'top 80%', once: true, onEnter: () => { gsap.fromTo(cmp, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'expo.out' }); } });
}

export function init() { hero(); index(); ledger(); compare(); }
