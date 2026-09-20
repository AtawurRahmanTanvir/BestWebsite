/* Chapter 04: Engine opener, reactor panel, utility page previews. */
import { env } from '../core/env.js';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { $, $$ } from '../core/ui.js';

const ENGINES = [
  { name: 'Identity Shift', on: true, copy: 'Listed first on the Engine grid and enabled by default in System Settings. Disabled engines are skipped by Optimize System and won’t run in the background.' },
  { name: 'Network Cycle', on: true, copy: 'Second in the grid, drawn as a loop that returns to its start. Enabled out of the box.' },
  { name: 'System Repo', on: true, copy: 'A stacked repository, third in the grid. On by default in this build.' },
  { name: 'Core Boost', on: false, copy: 'A gauge with its needle raised. Shipped OFF — the switch is yours in System Settings.' },
  { name: 'Memory Purge', on: false, copy: 'A sweep across the dial. Shipped OFF, one switch away.' },
  { name: 'DNS Tunnel', on: true, copy: 'Nested rings receding into depth. Enabled by default, last in the grid.' },
];

function opener() {
  const sec = $('#s-engine-open'); if (!sec) return;
  const letters = $$('.eo-title span', sec); const scan = sec.querySelector('.eo-scan');
  ScrollTrigger.create({ trigger: sec, start: 'top 60%', once: true, onEnter: () => {
    const tl = gsap.timeline();
    tl.to(letters, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: { each: .07, from: 'center' } })
      .fromTo(scan, { top: '0%', opacity: 0 }, { top: '100%', opacity: 1, duration: 1.2, ease: 'power2.inOut' }, .2)
      .to(scan, { opacity: 0, duration: .3 }, '-=.2');
  } });
  if (!env.reduced) gsap.to(sec.querySelector('.eo-title'), { yPercent: -12, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
}

function reactor() {
  const sec = $('#s-reactor'); if (!sec) return;
  const panel = sec.querySelector('[data-reactor-panel]'); const legend = $$('.reactor-legend span', sec);
  const host = sec.querySelector('.scene-host');
  let current = -1;
  const show = (i) => {
    if (i === current) return; current = i; const e = ENGINES[i];
    panel.querySelector('.rp-idx').textContent = String(i + 1).padStart(2, '0') + ' / 06';
    const name = panel.querySelector('.rp-name'); name.textContent = e.name;
    const st = panel.querySelector('.rp-state'); st.classList.toggle('off', !e.on); st.lastElementChild.textContent = e.on ? 'Default ON' : 'Default OFF';
    panel.querySelector('.rp-copy').textContent = e.copy;
    legend.forEach((l, j) => l.classList.toggle('is-on', j === i));
    gsap.fromTo(panel, { y: 12, opacity: .4 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out', overwrite: true });
  };
  show(0);
  host.addEventListener('mf:reactor-node', (e) => show(e.detail));
  legend.forEach((l, i) => l.addEventListener('pointerenter', () => host.dispatchEvent(new CustomEvent('mf:reactor-focus', { detail: i }))));
  panel.querySelector('.rp-name').addEventListener('click', () => host.dispatchEvent(new CustomEvent('mf:reactor-focus', { detail: (current + 1) % 6 })));
}

function utility() {
  const sec = $('#s-utility'); if (!sec) return;
  // route preview
  const ut = sec.querySelector('.ut-route'); const btn = sec.querySelector('[data-route-demo]');
  const status = sec.querySelector('[data-route-status]'); const lat = sec.querySelector('[data-route-latency]'); const last = sec.querySelector('[data-route-last]');
  let busy = false;
  btn.addEventListener('click', () => {
    if (busy) return; busy = true; ut.classList.add('is-checking'); status.textContent = 'Checking…'; status.classList.remove('good'); lat.textContent = '—';
    const t0 = performance.now(); const obj = { v: 0 };
    gsap.to(obj, { v: 1, duration: 1.6, ease: 'power1.inOut', onUpdate: () => { lat.textContent = Math.round(obj.v * 148) + ' ms'; }, onComplete: () => {
      ut.classList.remove('is-checking'); status.textContent = 'CONNECTED'; status.classList.add('good'); lat.textContent = Math.round(performance.now() - t0) + ' ms (preview)';
      last.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); busy = false;
    } });
  });
  // console typewriter
  const con = sec.querySelector('[data-console]');
  const lines = ['<b>[SYSTEM]</b> Log engine initialized', '<b>[SYSTEM]</b> Console ready', '<b>[IDLE]</b> Awaiting activity…'];
  let started = false;
  ScrollTrigger.create({ trigger: con, start: 'top 85%', once: true, onEnter: () => {
    if (started) return; started = true; con.innerHTML = '';
    let i = 0; const next = () => { if (i >= lines.length) { con.innerHTML += '<span class="cursor-blink"></span>'; return; } const div = document.createElement('div'); con.appendChild(div); const html = lines[i++]; const plain = html.replace(/<[^>]+>/g, ''); let k = 0; const type = () => { k++; const bold = html.match(/<b>(.*?)<\/b>/); const head = bold ? bold[1] : ''; const shown = plain.slice(0, k); div.innerHTML = (bold && shown.length >= head.length) ? '<b>' + head + '</b>' + shown.slice(head.length) : shown; if (k < plain.length) setTimeout(type, env.reduced ? 0 : 18); else setTimeout(next, 260); }; type(); };
    next();
  } });
  // toggles (local only, mirrors the app's control)
  $$('.ut-toggles .tg', sec).forEach((t) => t.parentElement.addEventListener('click', () => t.classList.toggle('on')));
}

function switchboardRows() {
  const rows = $$('.sb-table tbody tr'); if (!rows.length) return;
  rows.forEach((r, i) => { const b = r.querySelector('b'); r.addEventListener('click', () => { b.classList.toggle('on'); b.textContent = b.classList.contains('on') ? 'ON' : 'OFF'; r.lastElementChild.textContent = b.classList.contains('on') ? 'Runs' : 'Skipped'; }); });
}

export function init() { opener(); reactor(); utility(); switchboardRows(); }
