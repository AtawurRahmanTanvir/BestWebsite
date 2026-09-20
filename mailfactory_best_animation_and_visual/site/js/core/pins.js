/* Pinned scenes with staged captions, and horizontal scroll-driven sequences. */
import { env } from './env.js';
import { gsap, ScrollTrigger } from './scroll.js';
import { $$ } from './ui.js';

export function initPins() {
  $$('[data-pin]').forEach((sec) => { try {
    const inner = sec.querySelector('.pin-inner'); if (!inner) return;
    const len = env.reduced ? 1 : (parseFloat(sec.dataset.pinLength) || 2);
    const stages = $$('[data-stage]', sec).map((el) => { const [a, b] = el.dataset.stage.split('-').map(Number); return { el, a, b }; });
    const hosts = $$('.scene-host,.grad-host', sec);
    const update = (p) => {
      sec.style.setProperty('--p', p.toFixed(4));
      stages.forEach((s) => s.el.classList.toggle('is-on', p >= s.a && p < s.b));
      hosts.forEach((h) => { h.__pin = p; });
      sec.dispatchEvent(new CustomEvent('mf:pin', { detail: p }));
    };
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * len), pin: inner, pinSpacing: true, anticipatePin: 1, refreshPriority: 1, onUpdate: (self) => update(self.progress), onRefresh: (self) => update(self.progress) });
    update(0);
  } catch (err) { console.warn('[pin]', sec.id, err); } });

  $$('[data-hscroll]').forEach((sec) => { try {
    const pin = sec.querySelector('.hseq-pin'); const track = sec.querySelector('.hseq-track'); if (!pin || !track) return;
    const items = [...track.children];
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft || 0));
    const extras = $$('.workflow-line', sec);
    let glow = sec.querySelector('.wl-glow'); let glowL = 0; try { if (glow) { glowL = glow.getTotalLength(); glow.style.strokeDasharray = glowL; glow.style.strokeDashoffset = glowL; } } catch (_) { glow = null; }
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
      trigger: sec, start: 'top top', end: () => '+=' + Math.round(dist() * (env.small ? 1 : 1.15)), pin, scrub: env.reduced ? false : 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
      onUpdate: (self) => {
        const p = self.progress; sec.style.setProperty('--p', p.toFixed(4));
        extras.forEach((el) => { el.style.transform = `translate(${(-p * (el.offsetWidth - innerWidth)).toFixed(1)}px, -50%)`; });
        if (glow) glow.style.strokeDashoffset = glowL * (1 - Math.min(1, p * 1.08));
        const cx = innerWidth / 2; let best = null, bd = 1e9;
        items.forEach((it) => { const r = it.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - cx); if (d < bd) { bd = d; best = it; } });
        items.forEach((it) => it.classList.toggle('is-hot', it === best));
      },
    } });
  } catch (err) { console.warn('[hscroll]', sec.id, err); } });
}
