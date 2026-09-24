/* Global chrome: navigation, menu, chapter rail, cursor, toasts, Download & Share behaviours. */
import { env, config } from './env.js';
import { gsap, ScrollTrigger, scrollTo, currentScroll } from './scroll.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- toasts ---------------- */
let toastHost;
export function toast(msg, kind = '') {
  if (!toastHost) { toastHost = document.createElement('div'); toastHost.className = 'toasts'; toastHost.setAttribute('aria-live', 'polite'); document.body.appendChild(toastHost); }
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.innerHTML = `<i></i><span></span>`; el.lastChild.textContent = msg;
  toastHost.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 400); }, 2600);
}

/* ---------------- chapters ---------------- */
export const chapters = $$('[data-chapter]').map((el, i) => ({ el, i, id: el.dataset.chapter, label: el.dataset.chapterLabel || el.dataset.chapter }));

function buildRail() {
  const rail = $('.rail'); if (!rail) return;
  chapters.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.innerHTML = `<span>${String(i).padStart(2, '0')} ${c.label}</span><i></i>`;
    b.setAttribute('aria-label', `Go to chapter ${c.label}`);
    b.addEventListener('click', () => scrollTo(c.el, { offset: 0 }));
    rail.appendChild(b); c.railBtn = b;
  });
}

function buildMenu() {
  const list = $('.menu-list'); if (!list) return;
  chapters.forEach((c, i) => {
    const a = document.createElement('a');
    a.href = '#' + c.el.id; a.innerHTML = `<small>${String(i).padStart(2, '0')}</small>${c.label}`;
    a.style.transitionDelay = (i * 30) + 'ms';
    a.addEventListener('click', (e) => { e.preventDefault(); closeMenu(); setTimeout(() => scrollTo(c.el), 120); });
    list.appendChild(a);
  });
}

let menuOpen = false;
export function openMenu() { menuOpen = true; document.body.classList.add('menu-open'); $('.menu').classList.add('is-open'); $('.nav-menu-btn').setAttribute('aria-expanded', 'true'); }
export function closeMenu() { menuOpen = false; document.body.classList.remove('menu-open'); $('.menu').classList.remove('is-open'); $('.nav-menu-btn').setAttribute('aria-expanded', 'false'); }

function initNav() {
  const nav = $('.nav'); const label = $('.nav-chapter .label'); const num = $('.nav-chapter .num'); const prog = $('.nav-progress i');
  let lastY = 0; let current = -1;
  const setChapter = (i) => {
    if (i === current || !chapters[i]) return; current = i;
    if (label) { const span = document.createElement('span'); span.textContent = chapters[i].label; label.innerHTML = ''; label.appendChild(span); gsap.fromTo(span, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }); }
    if (num) num.textContent = String(i).padStart(2, '0');
    chapters.forEach((c, j) => c.railBtn && c.railBtn.classList.toggle('is-active', j === i));
    document.dispatchEvent(new CustomEvent('mf:chapter', { detail: chapters[i] }));
  };
  chapters.forEach((c, i) => {
    ScrollTrigger.create({ trigger: c.el, start: 'top 55%', end: 'bottom 55%', onEnter: () => setChapter(i), onEnterBack: () => setChapter(i) });
  });
  // theme adapts to the scene under the nav
  $$('.sec[data-theme]').forEach((sec) => {
    const theme = sec.dataset.theme;
    ScrollTrigger.create({ trigger: sec, start: 'top 40px', end: 'bottom 40px', onToggle: (self) => { if (self.isActive) { nav.classList.remove('theme-paper', 'theme-red'); if (theme !== 'dark') nav.classList.add('theme-' + theme); } } });
  });
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle('is-scrolled', y > 40);
    const goingDown = y > lastY + 6; const goingUp = y < lastY - 6;
    if (y > 500 && goingDown && !menuOpen) nav.classList.add('is-hidden'); else if (goingUp || y < 500) nav.classList.remove('is-hidden');
    lastY = y;
    if (prog) prog.style.transform = `scaleX(${self.progress})`;
  } });
  $('.nav-menu-btn').addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
  $$('[data-scroll-to]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); const t = $(el.dataset.scrollTo); if (t) scrollTo(t, { offset: el.dataset.offset ? +el.dataset.offset : 0 }); }));
}

/* ---------------- Download & Share ---------------- */
function initDownload() {
  $$('[data-download]').forEach((btn) => {
    if (config.downloadUrl) { if (btn.tagName === 'A') { btn.href = config.downloadUrl; btn.setAttribute('rel', 'noopener'); } }
    else btn.dataset.unconfigured = 'true';
    btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%'); });
    btn.addEventListener('click', (e) => {
      btn.classList.remove('is-pulsing'); void btn.offsetWidth; btn.classList.add('is-pulsing');
      if (navigator.vibrate) navigator.vibrate(8);
      if (!config.downloadUrl) { e.preventDefault(); toast('Download URL not configured yet — set MF_CONFIG.downloadUrl to enable the build link.'); document.dispatchEvent(new CustomEvent('mf:download', { detail: { configured: false } })); return; }
      toast('Opening the Mail Factory build…', 'ok');
      document.dispatchEvent(new CustomEvent('mf:download', { detail: { configured: true } }));
    });
  });
}

async function share(btn) {
  const data = { title: config.shareTitle, text: config.shareText, url: config.shareUrl };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) { await navigator.share(data); toast('Shared', 'ok'); }
    else { await navigator.clipboard.writeText(data.url); toast('Link copied to clipboard', 'ok'); }
    btn && btn.classList.add('is-done'); setTimeout(() => btn && btn.classList.remove('is-done'), 1600);
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    try { await navigator.clipboard.writeText(data.url); toast('Link copied to clipboard', 'ok'); }
    catch (_) { prompt('Copy this link', data.url); }
  }
}
function initShare() { $$('[data-share]').forEach((b) => b.addEventListener('click', () => share(b))); }

/* ---------------- cursor ----------------
   The owner's brief (§10) removes the custom ring cursor: native pointer everywhere,
   premium feel carried by magnetic buttons, hover states and focus rings instead. */

/* ---------------- magnetic buttons ---------------- */
function initMagnetic() {
  if (!env.finePointer) return;
  $$('[data-magnetic]').forEach((el) => {
    const s = +el.dataset.magnetic || 0.25;
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2); const dy = e.clientY - (r.top + r.height / 2); gsap.to(el, { x: dx * s, y: dy * s, duration: .4, ease: 'power3.out', overwrite: 'auto' }); });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.5)', overwrite: 'auto' }));
  });
}

export function initUI() {
  buildRail(); buildMenu(); initNav(); initDownload(); initShare(); initMagnetic();
}
export { $, $$ };
