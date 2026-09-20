/* ============================================================
   MAIL FACTORY — BOOT
   ============================================================ */
import {
  $, $$, ENV, scenes, liveApp, initReveal, initMagnetic, initCursor,
  doShare, doDownload, toast, scrollToEl
} from './app.js';
import {
  initNav, initRail, initProductIndex, initAppSync, initSpotlight, initLayered,
  initRibbon, initHRail, initKinetic, initTicker, initProcess, initExpand,
  initEngineBoard, initNodeMap, initRating, initTilt, initParallax,
  initGallery, initSteps, initDrum
} from './interactions.js';

/* ---------- body flags ---------- */
if(ENV.touch) document.body.classList.add('touch');
if(ENV.low) document.body.classList.add('low');

/* ============================================================
   PRELOADER → HERO IGNITION
   ============================================================ */
function ignite(){
  const pre = $('#pre'), cut = $('#preCut'), bar = $('#preBar'), pct = $('#prePct');
  const logo = $('#preLogo');
  let p = 0, done = false;

  // logo fades in
  requestAnimationFrame(()=>{
    logo.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1)';
    logo.style.opacity = '1'; logo.style.transform = 'scale(1)';
  });

  const tick = ()=>{
    p += (100 - p) * (0.028 + Math.random() * 0.05);
    if(p > 99.2) p = 99.2;
    bar.style.transform = `scaleX(${p / 100})`;
    pct.textContent = String(Math.floor(p)).padStart(3, '0');
    if(!done) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const finish = ()=>{
    if(done) return; done = true;
    bar.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    bar.style.transform = 'scaleX(1)';
    pct.textContent = '100';
    setTimeout(()=>{
      pre.style.transition = 'opacity .6s ease';
      pre.style.opacity = '0';
      pre.classList.add('done');
      cut.style.transition = 'transform 1.05s cubic-bezier(.76,0,.24,1)';
      cut.style.transform = 'scaleY(0)';
      setTimeout(()=>{ pre.remove(); cut.remove(); }, 1200);
      heroIn();
    }, 420);
  };

  if(document.readyState === 'complete') setTimeout(finish, ENV.reduced ? 120 : 620);
  else addEventListener('load', ()=> setTimeout(finish, ENV.reduced ? 120 : 620));
  setTimeout(finish, 3400); // hard cap — never block the user
}

function heroIn(){
  const logo = $('#heroLogo');
  const lines = $$('#heroTitle .ln > span');
  const sub = $('.hero-sub');
  const meta = $$('.hero-meta');
  const brackets = $$('.hero-bracket');
  const D = ENV.reduced ? 0 : 1;

  if(logo){
    logo.style.transition = `opacity ${.9*D||.01}s cubic-bezier(.16,1,.3,1),transform ${1.1*D||.01}s cubic-bezier(.16,1,.3,1)`;
    logo.style.opacity = '1'; logo.style.transform = 'none';
  }
  lines.forEach((l, i)=>{
    l.style.transition = `transform ${1.15*D||.01}s cubic-bezier(.16,1,.3,1) ${(0.16 + i * 0.13)*D}s`;
    requestAnimationFrame(()=> l.style.transform = 'none');
  });
  if(sub){
    sub.style.opacity = '0'; sub.style.transform = 'translateY(22px)';
    sub.style.transition = `opacity ${.9*D||.01}s ease ${.5*D}s,transform ${1*D||.01}s cubic-bezier(.16,1,.3,1) ${.5*D}s`;
    requestAnimationFrame(()=>{ sub.style.opacity = '1'; sub.style.transform = 'none'; });
  }
  meta.forEach((m, i)=>{
    m.style.opacity = '0';
    m.style.transition = `opacity ${.8*D||.01}s ease ${(.7 + i * .1)*D}s`;
    requestAnimationFrame(()=> m.style.opacity = '1');
  });
  brackets.forEach((b, i)=>{
    b.style.opacity = '0'; b.style.transform = 'scale(.5)';
    b.style.transition = `opacity .7s ease ${(.8 + i * .07)*D}s,transform .9s cubic-bezier(.16,1,.3,1) ${(.8 + i * .07)*D}s`;
    requestAnimationFrame(()=>{ b.style.opacity = '1'; b.style.transform = 'none'; });
  });
  const scroll = $('.hero-scroll');
  if(scroll){
    scroll.style.opacity = '0';
    scroll.style.transition = `opacity .9s ease ${1.1*D}s`;
    requestAnimationFrame(()=> scroll.style.opacity = '1');
  }
}

/* ============================================================
   SCENE REGISTRATION
   ============================================================ */
function registerScenes(){
  $$('[data-scene3d]').forEach(el=>{
    if(!el.querySelector('canvas')) return;
    scenes.register(el, '3d', el.dataset.scene3d);
  });
  $$('[data-grad]').forEach(el=>{
    if(!el.querySelector('canvas')) return;
    scenes.register(el, 'grad', el.dataset.grad);
  });
}

/* ============================================================
   BUTTON WIRING
   ============================================================ */
function wireButtons(){
  ['navDl','heroDl','finalDl','brandDl'].forEach(id=>{
    const b = $('#' + id);
    b?.addEventListener('click', ()=> doDownload(b));
  });
  ['navShare','heroShare','finalShare','footShare'].forEach(id=>{
    $('#' + id)?.addEventListener('click', doShare);
  });
}

/* ============================================================
   SMOOTH SCROLL (Lenis, progressive enhancement)
   ============================================================ */
async function initSmooth(){
  if(ENV.reduced) return;
  try{
    await import('../vendor/lenis.min.js');
    const L = window.Lenis;
    if(!L) return;
    const lenis = new L({
      duration:1.05,
      easing:(t)=> Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel:true,
      syncTouch:false,       // native touch scrolling stays native
      touchMultiplier:1.6
    });
    window.__lenis = lenis;
    const raf = (time)=>{ lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }catch(e){ /* native scrolling is a fine fallback */ }
}

/* ============================================================
   KEYBOARD SHORTCUTS + a11y niceties
   ============================================================ */
function initKeys(){
  addEventListener('keydown', e=>{
    if(e.target.matches('input,textarea')) return;
    if(e.key === 'd' && (e.metaKey || e.ctrlKey)) return;
    if(e.key === '?'){ toast('Arrow keys move carousels · Tab to explore','alert'); }
  });
  // first Tab press reveals focus styling context
  addEventListener('keydown', function once(e){
    if(e.key === 'Tab'){ document.body.classList.add('kb'); removeEventListener('keydown', once); }
  });
}

/* ============================================================
   BOOT
   ============================================================ */
function boot(){
  ignite();
  registerScenes();
  initReveal();
  initNav();
  initRail();
  initProductIndex();
  initAppSync();
  initTicker();
  initKinetic();
  initProcess();
  initExpand();
  initEngineBoard();
  initNodeMap();
  initRating();
  initTilt();
  initParallax();
  initGallery();
  initSteps();
  initDrum();
  wireButtons();
  initKeys();

  $$('.spot').forEach(initSpotlight);
  $$('.layered').forEach(initLayered);
  $$('.rib-track').forEach(initRibbon);
  $$('.hrail').forEach(initHRail);

  // non-critical, after first paint
  requestIdleCallback ? requestIdleCallback(()=>{ initMagnetic(); initCursor(); initSmooth(); }, {timeout:1800})
                      : setTimeout(()=>{ initMagnetic(); initCursor(); initSmooth(); }, 900);

  console.log('%cMAIL FACTORY','color:#e8112d;font-weight:800;font-size:13px','— master experience ready');
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
