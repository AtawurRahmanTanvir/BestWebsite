/* Chapter 06: archive cards, FLIP sorting shelf, pinned actions deck, paper wipe. */
import { env } from '../core/env.js';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { $, $$ } from '../core/ui.js';

function archive() {
  const root = $('[data-archive]'); if (!root) return;
  $$('.card:not(.card-total)', root).forEach((c) => c.addEventListener('click', () => c.classList.toggle('is-flipped')));
  if (env.reduced) return;
  ScrollTrigger.create({ trigger: root, start: 'top 80%', once: true, onEnter: () => gsap.fromTo(root.children, { y: 60, opacity: 0, rotateX: -12 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }) });
}

function shelf() {
  const shelf = $('[data-shelf]'); const modes = $('[data-sort-modes]'); if (!shelf || !modes) return;
  const items = $$('li', shelf);
  const sorters = {
    newest: (a, b) => b.dataset.time - a.dataset.time,
    oldest: (a, b) => a.dataset.time - b.dataset.time,
    singles: (a, b) => (a.dataset.type === 'single' ? 0 : 1) - (b.dataset.type === 'single' ? 0 : 1) || b.dataset.time - a.dataset.time,
    batches: (a, b) => (a.dataset.type === 'batch' ? 0 : 1) - (b.dataset.type === 'batch' ? 0 : 1) || b.dataset.time - a.dataset.time,
    starred: (a, b) => b.dataset.star - a.dataset.star || b.dataset.time - a.dataset.time,
    verified: (a, b) => b.dataset.ver - a.dataset.ver || b.dataset.time - a.dataset.time,
  };
  const apply = (mode) => {
    const first = new Map(items.map((el) => [el, el.getBoundingClientRect().top]));
    [...items].sort(sorters[mode]).forEach((el) => shelf.appendChild(el));
    items.forEach((el) => { const d = first.get(el) - el.getBoundingClientRect().top; if (Math.abs(d) < 1 || env.reduced) return; gsap.fromTo(el, { y: d }, { y: 0, duration: .8, ease: 'expo.out' }); });
    $$('button', modes).forEach((b) => { const on = b.dataset.sort === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
  };
  $$('button', modes).forEach((b) => b.addEventListener('click', () => apply(b.dataset.sort)));
}

function deck() {
  const sec = $('#s-deck'); if (!sec) return;
  const cards = $$('.dk', sec); const n = cards.length;
  sec.addEventListener('mf:pin', (e) => {
    const p = e.detail;
    cards.forEach((c, i) => {
      const center = (i + .5) / n; const d = (p - center) * n; // -n..n, 0 when this card is the crest
      const fan = Math.min(1, p * 3); // fan open during the first third
      const baseAng = (i - (n - 1) / 2) * 9 * fan;
      const lift = Math.max(0, 1 - Math.abs(d) * .9);
      const x = (i - (n - 1) / 2) * (env.small ? 26 : 70) * fan;
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${(-lift * 90).toFixed(1)}px, 0) rotate(${(baseAng - d * 2).toFixed(2)}deg) scale(${(1 + lift * .12).toFixed(3)})`;
      c.style.zIndex = String(10 + Math.round(lift * 10));
      c.style.boxShadow = `0 ${20 + lift * 30}px ${50 + lift * 40}px rgba(0,0,0,${.2 + lift * .2})`;
    });
  });
}

function wipe() {
  const sec = $('#s-wipe'); if (!sec) return;
  const black = sec.querySelector('.wipe-black'); const paper = sec.querySelector('.wipe-paper .wipe-word');
  sec.addEventListener('mf:pin', (e) => { const p = e.detail; black.style.clipPath = `inset(${(100 - p * 100).toFixed(2)}% 0 0 0)`; paper.style.transform = `translateY(${(-p * 30).toFixed(1)}vh)`; });
}

export function init() { archive(); shelf(); deck(); wipe(); }
