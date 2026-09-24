/* Reveal system: split text, scroll reveals, counters, marquees, parallax, SVG drawing. */
import { env } from './env.js';
import { gsap, ScrollTrigger } from './scroll.js';
import { $$ } from './ui.js';

/* ---- split ---- */
export function splitWords(el) {
  if (el.dataset.split) return;
  const text = el.textContent; const words = text.split(/(\s+)/);
  el.innerHTML = ''; el.dataset.split = 'words';
  words.forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(' ')); return; } const wr = document.createElement('span'); wr.className = 'word'; const inner = document.createElement('span'); inner.textContent = w; wr.appendChild(inner); el.appendChild(wr); });
  el.classList.add('split-words');
}
export function splitChars(el) {
  if (el.dataset.split) return;
  const text = el.textContent; el.innerHTML = ''; el.dataset.split = 'chars'; el.classList.add('split-chars');
  [...text].forEach((ch) => { if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'char'; s.textContent = ch; el.appendChild(s); });
}
export function splitLines(el) {
  if (el.dataset.split === 'lines') return $$('.line > span', el);
  // preserve simple inline markup (<br>, <em>, <b>, <span class=red>) by splitting by word while keeping tags
  const html = el.innerHTML.replace(/<br\s*\/?>/gi, ' <br> ');
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const frag = document.createDocumentFragment();
  const walk = (node, parent) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) { n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { parent.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'w'; s.textContent = w; parent.appendChild(s); }); }
      else if (n.nodeName === 'BR') { const s = document.createElement('span'); s.className = 'w br'; parent.appendChild(s); }
      else { const c = n.cloneNode(false); parent.appendChild(c); walk(n, c); }
    });
  };
  walk(tmp, frag);
  el.innerHTML = ''; el.appendChild(frag);
  // group by offsetTop
  const ws = $$('.w', el); const lines = []; let cur = null; let top = null;
  ws.forEach((w) => { if (w.classList.contains('br')) { top = null; cur = null; w.remove(); return; } const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { top = t; cur = []; lines.push(cur); } cur.push(w); });
  const out = [];
  lines.forEach((ws2) => {
    const line = document.createElement('span'); line.className = 'line'; const inner = document.createElement('span'); line.appendChild(inner);
    const first = ws2[0]; const container = first.parentNode;
    container.insertBefore(line, first);
    ws2.forEach((w, i) => { const prev = w.previousSibling; inner.appendChild(w); if (i < ws2.length - 1) inner.appendChild(document.createTextNode(' ')); if (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev.remove(); });
    out.push(inner);
  });
  el.classList.add('split-lines'); el.dataset.split = 'lines';
  return out;
}

/* ---- reveals ---- */
export function initReveals(root = document) {
  $$('[data-reveal]', root).forEach((el) => {
    if (el.dataset.revealed) return; el.dataset.revealed = '1';
    const type = el.dataset.reveal || 'up'; const delay = +(el.dataset.revealDelay || 0); const stagger = +(el.dataset.revealStagger || 0.08);
    const start = el.dataset.revealStart || 'top 86%';
    let targets, from, to;
    if (env.reduced) { el.style.opacity = 1; return; }
    if (type === 'lines') { targets = splitLines(el); from = { yPercent: 110 }; to = { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger }; }
    else if (type === 'words') { splitWords(el); targets = $$('.word > span', el); from = { yPercent: 110 }; to = { yPercent: 0, duration: .9, ease: 'power4.out', stagger: stagger / 2 }; }
    else if (type === 'chars') { splitChars(el); targets = $$('.char', el); from = { yPercent: 60, opacity: 0, rotateX: -40 }; to = { yPercent: 0, opacity: 1, rotateX: 0, duration: .8, ease: 'power3.out', stagger: stagger / 3 }; }
    else if (type === 'fade') { targets = el; from = { opacity: 0 }; to = { opacity: 1, duration: 1.2, ease: 'power2.out' }; }
    else if (type === 'scale') { targets = el; from = { opacity: 0, scale: .92 }; to = { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' }; }
    else if (type === 'mask') { targets = el; from = { clipPath: 'inset(0 100% 0 0)' }; to = { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'expo.inOut' }; }
    else if (type === 'stagger') { targets = [...el.children]; from = { y: 30, opacity: 0 }; to = { y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger }; }
    else { targets = el; from = { y: 40, opacity: 0 }; to = { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }; }
    gsap.set(targets, from);
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => gsap.to(targets, { ...to, delay }) });
  });
  // counters
  $$('[data-count]', root).forEach((el) => {
    if (el.dataset.counted) return; el.dataset.counted = '1';
    const end = parseFloat(el.dataset.count); const dec = (el.dataset.count.split('.')[1] || '').length; const suffix = el.dataset.suffix || ''; const prefix = el.dataset.prefix || '';
    const obj = { v: 0 }; el.textContent = prefix + (0).toFixed(dec) + suffix;
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(obj, { v: end, duration: env.reduced ? 0 : 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = prefix + obj.v.toFixed(dec) + suffix; } }) });
  });
  // parallax
  $$('[data-parallax]', root).forEach((el) => {
    if (env.reduced || el.dataset.px) return; el.dataset.px = '1';
    const amt = parseFloat(el.dataset.parallax) || .2;
    gsap.fromTo(el, { yPercent: -amt * 50 }, { yPercent: amt * 50, ease: 'none', scrollTrigger: { trigger: el.closest('.sec') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // svg draw
  $$('[data-draw]', root).forEach((svg) => {
    if (svg.dataset.drawn) return; svg.dataset.drawn = '1';
    const paths = $$('path,line,polyline,circle,ellipse,rect', svg).filter((p) => p.getTotalLength);
    paths.forEach((p) => { try { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; } catch (_) {} });
    const scrub = svg.dataset.draw === 'scrub';
    if (env.reduced) { paths.forEach((p) => (p.style.strokeDashoffset = 0)); return; }
    gsap.to(paths, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: +(svg.dataset.drawStagger || 0.12), scrollTrigger: scrub ? { trigger: svg.closest('.sec') || svg, start: 'top 70%', end: 'bottom 60%', scrub: 1 } : { trigger: svg, start: 'top 85%', once: true } });
  });
}

/* ---- marquee: velocity-linked ---- */
export function initMarquees(root = document) {
  $$('[data-marquee]', root).forEach((m) => {
    if (m.dataset.mq) return; m.dataset.mq = '1';
    const track = m.firstElementChild; const dir = m.dataset.dir === 'rtl' ? -1 : 1; const base = parseFloat(m.dataset.speed) || 60;
    const originalCount = track.children.length;
    const need = Math.ceil((innerWidth * 2) / Math.max(track.scrollWidth, 1)) + 1; const html = track.innerHTML;
    for (let i = 0; i < need; i++) track.insertAdjacentHTML('beforeend', html);
    let x = 0; let vel = 0; let groupW = 0;
    const measure = () => { groupW = 0; const gap = parseFloat(getComputedStyle(track).gap || 0); for (let i = 0; i < originalCount; i++) groupW += track.children[i].getBoundingClientRect().width + gap; };
    measure(); addEventListener('resize', measure);
    ScrollTrigger.create({ onUpdate: (self) => { vel = self.getVelocity() / 900; } });
    let visible = true; new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(m);
    gsap.ticker.add((t, dt) => {
      if (!visible || env.reduced) return; const d = dt / 1000;
      vel *= 0.92; x -= (base + Math.min(Math.abs(vel) * 220, 900)) * d * dir * (vel < -0.05 && !m.dataset.lockDir ? -1 : 1);
      if (groupW > 0) { if (x <= -groupW) x += groupW; if (x > 0) x -= groupW; }
      track.style.transform = `translate3d(${x}px,0,0)`;
      const skew = Math.max(-8, Math.min(8, vel * 4)); m.style.setProperty('--skew', skew + 'deg');
    });
  });
}

export function initAll(root = document) { initReveals(root); initMarquees(root); }
