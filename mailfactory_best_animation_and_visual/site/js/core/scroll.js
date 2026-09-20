/* Scroll engine: Lenis smooth scroll driving GSAP ScrollTrigger. */
import { env } from './env.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

export let lenis = null;

if (!env.reduced) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.6,
    wheelMultiplier: 0.95,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

ScrollTrigger.config({ ignoreMobileResize: true });
// Pins refresh first (priority 1, in page order); everything else refreshes after all pin spacers exist.
ScrollTrigger.defaults({ markers: false, refreshPriority: -1 });

export function scrollTo(target, opts = {}) {
  const offset = opts.offset ?? 0;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: opts.duration ?? 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), lock: false, force: true, onComplete: opts.onComplete });
  } else {
    const y = typeof target === 'number' ? target : (target.getBoundingClientRect().top + scrollY + offset);
    window.scrollTo({ top: y, behavior: env.reduced ? 'auto' : 'smooth' });
    opts.onComplete && setTimeout(opts.onComplete, 600);
  }
}

export function scrollBy(delta) {
  if (lenis) lenis.scrollTo(lenis.scroll + delta, { duration: 0.6, force: true });
  else window.scrollBy({ top: delta });
}

export function stopScroll() { lenis ? lenis.stop() : (document.documentElement.style.overflow = 'hidden'); }
export function startScroll() { lenis ? lenis.start() : (document.documentElement.style.overflow = ''); }

export const currentScroll = () => (lenis ? lenis.scroll : scrollY);
export { gsap, ScrollTrigger };
