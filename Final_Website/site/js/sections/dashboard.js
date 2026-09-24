/* Chapter 03: colonnade tiles, Open Factory kinetic type, dashboard live annotations. */
import { env } from '../core/env.js';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { $, $$ } from '../core/ui.js';

function colonnade() {
  const c = $('[data-colonnade]'); if (!c) return;
  const cols = $$('.col', c);
  const activate = (col) => cols.forEach((x) => x.classList.toggle('is-active', x === col));
  cols.forEach((col) => { col.addEventListener('click', () => activate(col)); if (env.finePointer) col.addEventListener('pointerenter', () => activate(col)); });
  // auto-advance until the visitor interacts
  let auto = true; c.addEventListener('pointerdown', () => (auto = false), { once: true });
  let i = 0; const timer = setInterval(() => { if (!auto) return clearInterval(timer); const r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; i = (i + 1) % cols.length; activate(cols[i]); }, 3200);
}

function openFactory() {
  const sec = $('#s-openfactory'); if (!sec) return;
  const word = sec.querySelector('.of-word');
  sec.addEventListener('mf:pin', (e) => { const p = e.detail; const k = p < .5 ? p * 2 : 1; word.style.setProperty('--k', k.toFixed(3)); word.style.transform = `scale(${(0.92 + k * 0.08).toFixed(3)})`; });
}

function statement() {
  // dashboard statement: staggered big type reveals are generic; add a subtle horizontal drift to the copy
  const sec = $('#s-dash-state'); if (!sec || env.reduced) return;
  gsap.fromTo(sec.querySelector('.dash-state-copy'), { x: 40 }, { x: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
}

export function init() { colonnade(); openFactory(); statement(); }
