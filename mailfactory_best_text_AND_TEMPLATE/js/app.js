/* ============================================================
   MAIL FACTORY — MASTER EXPERIENCE RUNTIME
   · scene lifecycle (prefetch → active → pause → dispose)
   · live-app two-way scroll synchronisation
   · 15 interaction systems
   ============================================================ */

/* ---------- environment ---------- */
export const ENV = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  touch: matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window,
  fine: matchMedia('(pointer: fine)').matches,
  low: false,
  dm: navigator.deviceMemory || 4,
  cores: navigator.hardwareConcurrency || 4
};
ENV.low = ENV.touch || ENV.dm <= 4 || ENV.cores <= 4 || innerWidth < 900;

export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- toast ---------- */
let toastT;
export function toast(msg, icon = 'check'){
  const el = $('#toast'); if(!el) return;
  const ic = {
    check:'<path d="M20 6L9 17l-5-5"/>',
    copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>',
    dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    star:'<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    alert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/>'
  }[icon] || '';
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">${ic}</svg><span>${msg}</span>`;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(()=> el.classList.remove('show'), 2600);
}

/* ============================================================
   SCENE MANAGER — lifecycle + prefetch + disposal
   ============================================================ */
class SceneManager{
  constructor(){
    this.reg = new Map();     // el -> record
    this.three = null;        // lazily imported module
    this.threeP = null;
    this.gradMod = null;
    this.gradP = null;
    this.active = new Set();
    this.raf = 0;
    this._boot();
  }
  _boot(){
    // NEAR: build (prefetch before arrival)
    this.near = new IntersectionObserver(es=>{
      es.forEach(e=>{
        const r = this.reg.get(e.target); if(!r) return;
        if(e.isIntersecting) this.ensure(r);
        else this.maybeDispose(r);
      });
    }, {rootMargin:'120% 0px 120% 0px', threshold:0});

    // VISIBLE: run / pause
    this.vis = new IntersectionObserver(es=>{
      es.forEach(e=>{
        const r = this.reg.get(e.target); if(!r) return;
        r.visible = e.isIntersecting;
        if(e.isIntersecting){ this.active.add(r); r.inst?.start?.(); }
        else{ this.active.delete(r); r.inst?.stop?.(); }
      });
    }, {rootMargin:'12% 0px 12% 0px', threshold:0});

    addEventListener('resize', ()=>{
      clearTimeout(this._rt);
      this._rt = setTimeout(()=> this.reg.forEach(r=> r.inst?.resize?.()), 160);
    }, {passive:true});

    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) this.reg.forEach(r=> r.inst?.stop?.());
      else this.active.forEach(r=> r.inst?.start?.());
    });

    // pointer feed → scenes (throttled via rAF)
    let px = 0, py = 0, pending = false;
    addEventListener('pointermove', e=>{
      px = (e.clientX / innerWidth) * 2 - 1;
      py = (e.clientY / innerHeight) * 2 - 1;
      if(pending) return; pending = true;
      requestAnimationFrame(()=>{
        pending = false;
        this.active.forEach(r=> r.inst?.setPointer?.(px, py));
      });
    }, {passive:true});

    // scroll progress feed
    const tick = ()=>{
      this.active.forEach(r=>{
        const b = r.el.getBoundingClientRect();
        const total = b.height + innerHeight;
        const p = clamp((innerHeight - b.top) / total, 0, 1);
        r.inst?.setProgress?.(p);
      });
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  async loadThree(){
    if(this.three) return this.three;
    if(!this.threeP) this.threeP = import('./scenes.js').then(m=>{ this.three = m; return m; })
      .catch(e=>{ console.warn('[3d] module load failed', e); return null; });
    return this.threeP;
  }
  async loadGrad(){
    if(this.gradMod) return this.gradMod;
    if(!this.gradP) this.gradP = import('./gradients.js').then(m=>{ this.gradMod = m; return m; })
      .catch(e=>{ console.warn('[gradient] module load failed', e); return null; });
    return this.gradP;
  }
  register(el, kind, name, opts = {}){
    const r = {el, kind, name, opts, inst:null, building:false, visible:false};
    this.reg.set(el, r);
    this.near.observe(el); this.vis.observe(el);
    return r;
  }
  async ensure(r){
    if(r.inst || r.building) return;
    r.building = true;
    try{
      const canvas = r.el.querySelector('canvas') || r.el;
      if(r.kind === '3d'){
        const m = await this.loadThree();
        if(!m || this.reg.get(r.el) !== r){ r.building = false; return; }
        r.inst = m.makeScene(r.name, canvas, {low:ENV.low, reduced:ENV.reduced, ...r.opts});
      }else{
        const m = await this.loadGrad();
        if(!m || this.reg.get(r.el) !== r){ r.building = false; return; }
        r.inst = new m.GradientLayer(canvas, r.name, {
          reduced:ENV.reduced, maxDpr:ENV.low ? 1.25 : 1.7, ...r.opts
        });
      }
      r.el.classList.add('scene-ready');
      if(r.visible) r.inst?.start?.();
    }catch(e){ console.warn('[scene] build error', r.name, e); }
    r.building = false;
  }
  maybeDispose(r){
    if(!r.inst) return;
    const b = r.el.getBoundingClientRect();
    const far = Math.abs(b.top) > innerHeight * 3.2;
    if(far){
      r.inst.dispose?.(); r.inst = null;
      r.el.classList.remove('scene-ready');
    }else{
      r.inst.stop?.();
      this._sweepSoon();   // re-check once it really is far away
    }
  }
  /* The IntersectionObserver only fires on transitions, so a scene that was
     merely "just off screen" would keep its WebGL context forever. Sweep
     periodically while scrolling and free anything that drifted far away —
     browsers cap simultaneous WebGL contexts (~16). */
  _sweepSoon(){
    if(this._sweepT) return;
    this._sweepT = setInterval(()=>{
      let held = 0;
      this.reg.forEach(r=>{
        if(!r.inst) return;
        held++;
        if(r.visible) return;
        const b = r.el.getBoundingClientRect();
        if(Math.abs(b.top) > innerHeight * 3.2){
          r.inst.dispose?.(); r.inst = null;
          r.el.classList.remove('scene-ready');
          held--;
        }
      });
      if(!held){ clearInterval(this._sweepT); this._sweepT = 0; }
    }, 1200);
  }
  get(el){ return this.reg.get(el)?.inst || null; }
}
export const scenes = new SceneManager();

/* ============================================================
   LIVE APP CONTROLLER
   The real Mail Factory HTML in ONE shared iframe that is moved
   between chapter mounts. Never recreated → app state persists.
   Screens driven through the app's own window.showScreen() API.
   ============================================================ */
export const APP_SCREENS = ['dashboard','engine','generator','library','onetouch','settings'];

class LiveApp{
  constructor(){
    this.frame = null;
    this.dock = null;
    this.ready = false;
    this.current = null;
    this.mount = null;        // active .app-slot
    this.queue = null;
    this.q = [];
    this._size = {w:0, h:0, r:''};
    this._raf = 0;
  }
  /* The iframe lives in ONE fixed dock that is never re-parented —
     re-parenting an iframe reloads it and would destroy app state.
     The dock is flown over whichever chapter slot is active. */
  create(){
    if(this.frame) return this.frame;
    const dock = document.createElement('div');
    dock.id = 'appDock';
    dock.setAttribute('aria-hidden','false');

    const f = document.createElement('iframe');
    f.id = 'appHost';
    f.src = 'app/mail-factory.html';
    f.title = 'Mail Factory — live application';
    f.setAttribute('scrolling','yes');
    f.setAttribute('allow','clipboard-write');
    f.addEventListener('load', ()=>{
      this.ready = true;
      document.querySelectorAll('.app-loading').forEach(l=>l.classList.add('gone'));
      dock.classList.add('ready');
      if(this.queue){ const q = this.queue; this.queue = null; this.show(q, true); }
      this.q.forEach(fn=>fn()); this.q = [];
      document.dispatchEvent(new CustomEvent('appready'));
    });

    const veil = document.createElement('div');
    veil.className = 'dock-veil';
    veil.textContent = 'Tap to interact';
    veil.addEventListener('pointerdown', ()=> dock.classList.add('live'), {once:true});

    dock.appendChild(f);
    dock.appendChild(veil);
    document.body.appendChild(dock);
    this.dock = dock; this.frame = f;
    this._track();
    return f;
  }
  /** point the dock at a chapter's slot (no DOM move → no reload) */
  attach(slot){
    if(!slot || this.mount === slot) return;
    this.create();
    this.mount = slot;
    const ld = slot.parentElement?.querySelector('.app-loading');
    if(ld && this.ready) ld.classList.add('gone');
    this._sync(true);
  }
  _sync(force){
    const d = this.dock, slot = this.mount;
    if(!d || !slot) return;
    const r = slot.getBoundingClientRect();
    if(r.width < 4 || r.height < 4) return;
    // hide (but keep alive) when the slot is well off-screen
    const off = r.bottom < -innerHeight * 0.6 || r.top > innerHeight * 1.6;
    d.classList.toggle('hid', off);
    d.style.transform = `translate3d(${r.left.toFixed(1)}px,${r.top.toFixed(1)}px,0)`;
    const w = Math.round(r.width), h = Math.round(r.height);
    const rad = getComputedStyle(slot).borderRadius;
    if(force || w !== this._size.w || h !== this._size.h){
      d.style.width = w + 'px'; d.style.height = h + 'px';
      this._size.w = w; this._size.h = h;
    }
    if(force || rad !== this._size.r){ d.style.borderRadius = rad; this._size.r = rad; }
  }
  _track(){
    const loop = ()=>{ this._sync(false); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }
  show(name, force){
    if(!APP_SCREENS.includes(name)) return;
    if(!force && this.current === name) return;
    this.current = name;
    document.querySelectorAll('[data-appnav]').forEach(b=>
      b.classList.toggle('cur', b.dataset.appnav === name));
    if(!this.ready || !this.frame){ this.queue = name; return; }
    try{
      const w = this.frame.contentWindow;
      if(w && typeof w.showScreen === 'function'){
        w.showScreen(name);
        document.dispatchEvent(new CustomEvent('appscreen', {detail:{name}}));
      }
    }catch(e){ /* cross-origin guard — same-origin in practice */ }
  }
  onReady(fn){ if(this.ready) fn(); else this.q.push(fn); }
}
export const liveApp = new LiveApp();

/* ============================================================
   REVEAL SYSTEM
   ============================================================ */
export function initReveal(){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('rv-in'); io.unobserve(e.target); }
    });
  }, {rootMargin:'0px 0px -8% 0px', threshold:0.06});
  $$('[data-rv]').forEach(el=> io.observe(el));
  return io;
}

/* ============================================================
   MAGNETIC POINTER (fine pointers only)
   ============================================================ */
export function initMagnetic(){
  if(!ENV.fine || ENV.reduced) return;
  $$('[data-mag]').forEach(el=>{
    const str = parseFloat(el.dataset.mag) || 0.28;
    let rafId = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const run = ()=>{
      cx = lerp(cx, tx, 0.18); cy = lerp(cy, ty, 0.18);
      el.style.transform = `translate3d(${cx.toFixed(2)}px,${cy.toFixed(2)}px,0)`;
      if(Math.abs(cx - tx) > 0.15 || Math.abs(cy - ty) > 0.15) rafId = requestAnimationFrame(run);
      else { el.style.transform = `translate3d(${tx}px,${ty}px,0)`; rafId = 0; }
    };
    el.addEventListener('pointermove', e=>{
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * str;
      ty = (e.clientY - (r.top + r.height / 2)) * str;
      if(!rafId) rafId = requestAnimationFrame(run);
    });
    el.addEventListener('pointerleave', ()=>{
      tx = 0; ty = 0; if(!rafId) rafId = requestAnimationFrame(run);
    });
  });
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
export function initCursor(){
  if(!ENV.fine || ENV.reduced) return;
  const dot = $('#cur'), ring = $('#curRing');
  if(!dot || !ring) return;
  document.body.classList.add('cursor-on');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('pointermove', e=>{ x = e.clientX; y = e.clientY; }, {passive:true});
  const loop = ()=>{
    rx = lerp(rx, x, 0.16); ry = lerp(ry, y, 0.16);
    dot.style.transform = `translate3d(${x - 4.5}px,${y - 4.5}px,0)`;
    ring.style.transform = `translate3d(${rx - 19}px,${ry - 19}px,0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const hot = 'a,button,[data-mag],.pi-row,.faq-q,.star,.led-main,.ecell,.nm-node,.hcard,.rib-item';
  document.addEventListener('pointerover', e=>{
    if(e.target.closest?.('[data-drag]')) document.body.classList.add('cur-drag');
    else if(e.target.closest?.(hot)) document.body.classList.add('cur-hot');
  });
  document.addEventListener('pointerout', e=>{
    if(e.target.closest?.('[data-drag]')) document.body.classList.remove('cur-drag');
    if(e.target.closest?.(hot)) document.body.classList.remove('cur-hot');
  });
}

/* ============================================================
   SHARE / DOWNLOAD / COPY
   ============================================================ */
export const CONFIG = {
  // configurable placeholder — replace with the real release URL
  downloadUrl: 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io/releases/latest',
  repoUrl: 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io',
  issuesUrl: 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io/issues',
  version: '1.7.9'
};

export async function doShare(){
  const data = {
    title:'Mail Factory',
    text:'Mail Factory — a native Android generator, engine suite and local library. Everything stays on your device.',
    url:location.href
  };
  try{
    if(navigator.share){ await navigator.share(data); toast('Shared','share'); return; }
    throw new Error('no share');
  }catch(e){
    if(e && e.name === 'AbortError') return;
    try{
      await navigator.clipboard.writeText(location.href);
      toast('Link copied to clipboard','copy');
    }catch(_){
      const ta = document.createElement('textarea');
      ta.value = location.href; ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); toast('Link copied','copy'); }
      catch(__){ toast('Copy unavailable','alert'); }
      ta.remove();
    }
  }
}

export function doDownload(btn){
  if(btn){
    btn.classList.add('ok');
    const lb = btn.querySelector('.lb');
    const prev = lb ? lb.textContent : '';
    if(lb) lb.textContent = 'Opening release';
    setTimeout(()=>{ btn.classList.remove('ok'); if(lb) lb.textContent = prev; }, 2100);
  }
  toast('Opening the release page','dl');
  window.open(CONFIG.downloadUrl, '_blank', 'noopener');
}

/* ============================================================
   SMOOTH SCROLL TO TARGET
   ============================================================ */
export function scrollToEl(target, offset = 0){
  const el = typeof target === 'string' ? $(target) : target;
  if(!el) return;
  const y = el.getBoundingClientRect().top + scrollY - offset;
  if(window.__lenis) window.__lenis.scrollTo(y, {duration:1.5});
  else scrollTo({top:y, behavior:ENV.reduced ? 'auto' : 'smooth'});
}
