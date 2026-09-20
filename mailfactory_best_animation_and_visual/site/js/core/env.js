/* Environment: capability detection, quality tiers, shared pointer state, site configuration. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mem = navigator.deviceMemory || 4;
const cores = navigator.hardwareConcurrency || 4;
const small = innerWidth < 820;

let tier = 2;
if (reduced) tier = 0;
else if (coarse || small || mem <= 4 || cores <= 4) tier = 1;
const params = new URLSearchParams(location.search);
if (params.has('q')) tier = Math.max(0, Math.min(2, +params.get('q')));

export const quality = {
  tier,
  reduced,
  dpr: [1, Math.min(devicePixelRatio || 1, 1.5), Math.min(devicePixelRatio || 1, 2)][tier],
  particles: [0.3, 0.55, 1][tier],
  antialias: tier === 2,
  shadows: false,
  maxScenes: [2, 3, 4][tier],
  maxGradients: [2, 3, 5][tier],
};

export const env = {
  reduced,
  coarse,
  finePointer,
  small,
  pointer: { x: 0, y: 0, nx: 0, ny: 0, down: false, moved: false },
  vw: innerWidth,
  vh: innerHeight,
};

addEventListener('pointermove', (e) => {
  env.pointer.x = e.clientX; env.pointer.y = e.clientY;
  env.pointer.nx = (e.clientX / env.vw) * 2 - 1;
  env.pointer.ny = -((e.clientY / env.vh) * 2 - 1);
  env.pointer.moved = true;
}, { passive: true });
addEventListener('pointerdown', () => { env.pointer.down = true; }, { passive: true });
addEventListener('pointerup', () => { env.pointer.down = false; }, { passive: true });
addEventListener('resize', () => { env.vw = innerWidth; env.vh = innerHeight; env.small = innerWidth < 820; }, { passive: true });

/* Site configuration — never invents a download URL. Set window.MF_CONFIG before app.js. */
export const config = Object.assign({
  downloadUrl: '',                    // e.g. 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io/releases/latest'
  downloadLabel: 'Download',
  shareUrl: location.href.split('#')[0],
  shareTitle: 'Mail Factory',
  shareText: 'Mail Factory — System Architecture & Automation. Explore the interactive experience.',
  repoUrl: 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io',
  issuesUrl: 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io/issues',
  siteUrl: 'https://mailfactorylabs.github.io',
  feedbackEndpoint: '',               // optional POST endpoint for ratings
  appUrl: 'app/mail-factory.html',
}, window.MF_CONFIG || {});

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
