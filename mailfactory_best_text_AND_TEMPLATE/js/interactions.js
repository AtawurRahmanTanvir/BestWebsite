/* ============================================================
   MAIL FACTORY — INTERACTION SYSTEMS
   ============================================================ */
import { $, $$, clamp, lerp, ENV, toast, scrollToEl, liveApp, scenes } from './app.js';

/* ============================================================
   1 · NAVIGATION + MOBILE MENU + CHAPTER RAIL
   ============================================================ */
export function initNav(){
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  let last = scrollY, open = false;

  const onScroll = ()=>{
    const y = scrollY;
    nav.classList.toggle('solid', y > 90);
    if(!open){
      if(y > last && y > 420) nav.classList.add('hide');
      else nav.classList.remove('hide');
    }
    last = y;
  };
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  const setOpen = (v)=>{
    open = v;
    burger.classList.toggle('open', v);
    menu.classList.toggle('open', v);
    burger.setAttribute('aria-expanded', String(v));
    document.body.classList.toggle('is-locked', v);
    if(v) nav.classList.remove('hide');
  };
  burger.addEventListener('click', ()=> setOpen(!open));
  menu.addEventListener('click', e=>{
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    e.preventDefault(); setOpen(false);
    setTimeout(()=> scrollToEl(a.getAttribute('href'), 70), 220);
  });
  addEventListener('keydown', e=>{ if(e.key === 'Escape' && open) setOpen(false); });

  // in-page anchors
  document.addEventListener('click', e=>{
    const a = e.target.closest('a[href^="#"]:not([data-raw])');
    if(!a) return;
    const id = a.getAttribute('href');
    if(id.length < 2 || !$(id)) return;
    e.preventDefault();
    scrollToEl(id, 70);
  });

  /* light-section awareness (nav + rail invert over paper) */
  const lights = $$('.tone-paper');
  const rail = $('#rail');
  const checkTone = ()=>{
    const probe = 46;
    let onLight = false;
    for(const s of lights){
      const r = s.getBoundingClientRect();
      if(r.top <= probe && r.bottom >= probe){ onLight = true; break; }
    }
    nav.classList.toggle('on-paper', onLight);
    let railLight = false;
    const mid = innerHeight / 2;
    for(const s of lights){
      const r = s.getBoundingClientRect();
      if(r.top <= mid && r.bottom >= mid){ railLight = true; break; }
    }
    rail?.classList.toggle('on-paper', railLight);
  };
  addEventListener('scroll', checkTone, {passive:true});
  checkTone();
}

/* chapter rail + scroll progress + active nav link */
export function initRail(){
  const rail = $('#rail'), prog = $('#prog');
  if(!rail) return;
  const chapters = $$('[data-chapter]');
  const buttons = $$('#rail button');

  buttons.forEach(b=> b.addEventListener('click', ()=>{
    scrollToEl('#' + b.dataset.go, 60);
  }));

  let ticking = false;
  const update = ()=>{
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    if(prog) prog.style.transform = `scaleX(${p})`;
    rail.classList.toggle('show', scrollY > innerHeight * 0.75 && p < 0.985);

    const probe = innerHeight * 0.42;
    let cur = null;
    for(const c of chapters){
      const r = c.getBoundingClientRect();
      if(r.top <= probe && r.bottom > probe){ cur = c.id; break; }
    }
    if(cur){
      buttons.forEach(b=> b.classList.toggle('cur', b.dataset.go === cur));
      $$('.nav-link[data-sec]').forEach(a=> a.classList.toggle('cur', a.dataset.sec === cur));
    }
  };
  addEventListener('scroll', ()=>{ if(!ticking){ ticking = true; requestAnimationFrame(update); } }, {passive:true});
  update();
}

/* ============================================================
   2 · PRODUCT INDEX (control panel) → scroll + app sync
   ============================================================ */
export function initProductIndex(){
  $$('[data-appnav]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const name = btn.dataset.appnav;
      const target = btn.dataset.target;
      // lock the scroll-driven picker so the jump isn't overridden mid-flight
      document.dispatchEvent(new CustomEvent('appjump', {detail:{ms:2100}}));
      const stage = target ? document.getElementById(target) : null;
      const slot = stage?.querySelector('.app-slot');
      if(slot) liveApp.attach(slot);
      liveApp.show(name, true);
      liveApp.onReady(()=> liveApp.show(name, true));
      if(stage) scrollToEl(stage, 60);
      $$('[data-appnav]').forEach(b=> b.classList.toggle('cur', b === btn));
    });
  });
}

/* ============================================================
   3 · LIVE APP SCROLL SYNCHRONISATION (two-way)
   Each [data-app-chapter] declares which real screen it shows.
   The iframe is physically moved into the chapter's slot.
   ============================================================ */
export function initAppSync(){
  const chapters = $$('[data-app-chapter]');
  if(!chapters.length) return;

  /* Pick the app chapter whose centre is closest to the viewport centre.
     Runs on scroll (rAF-throttled) so it is always correct regardless of
     which direction the user came from or how far they jumped. */
  /* Ordered "app intent" anchors: every chapter opener (prepare) and every
     live stage (mount + show), in document order. The active screen is the
     last anchor whose top has passed the viewport centre — so the app is
     correct everywhere, including in the gaps between sections, and in both
     scroll directions. */
  const anchors = $$('[data-prep],[data-app-chapter]')
    .map(el=>({
      el,
      screen: el.dataset.appChapter || el.dataset.prep,
      stage: el.hasAttribute('data-app-chapter')
    }))
    .sort((a,b)=> a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

  let raf = 0, lockUntil = 0;
  const pick = ()=>{
    raf = 0;
    if(performance.now() < lockUntil) return;
    const line = innerHeight * 0.45;
    let act = null;
    for(const a of anchors){
      if(a.el.getBoundingClientRect().top <= line) act = a;
      else break;
    }
    if(!act) return;
    // mount into the nearest stage at/behind this point so the frame is in place
    let stage = act.stage ? act : null;
    if(!stage){
      // the opener's own chapter stage is the next stage with the same screen
      stage = anchors.find(a=> a.stage && a.screen === act.screen) || null;
    }
    if(stage){
      const slot = stage.el.querySelector('.app-slot');
      if(slot) liveApp.attach(slot);
    }
    liveApp.show(act.screen);
  };
  addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(pick); }, {passive:true});
  addEventListener('resize', ()=>{ if(!raf) raf = requestAnimationFrame(pick); }, {passive:true});
  // an explicit index click wins for the duration of the smooth scroll
  document.addEventListener('appjump', e=>{ lockUntil = performance.now() + (e.detail?.ms || 1800); });
  pick();

  // pre-create the frame when the first chapter is approaching
  const pre = new IntersectionObserver(es=>{
    if(es.some(e=>e.isIntersecting)){
      liveApp.create();
      pre.disconnect();
    }
  }, {rootMargin:'200% 0px'});
  pre.observe(chapters[0]);

  // keep the dock aligned when layout changes (fonts, resize, reveal)
  addEventListener('resize', ()=> liveApp._sync?.(true), {passive:true});
  document.addEventListener('appready', ()=> liveApp._sync?.(true));
}

/* ============================================================
   4 · SPOTLIGHT CAROUSEL (centred active + depth)
   ============================================================ */
export function initSpotlight(root){
  const stage = root.querySelector('.spot-stage');
  const items = Array.from(stage.querySelectorAll('.spot-item'));
  const dots = root.querySelector('.spot-dots');
  const prev = root.querySelector('[data-spot="prev"]');
  const next = root.querySelector('[data-spot="next"]');
  if(!items.length) return;
  let i = 0, timer = 0, hovering = false;

  items.forEach((_, k)=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Go to item ${k + 1}`);
    b.addEventListener('click', ()=> go(k, true));
    dots.appendChild(b);
  });

  function layout(){
    const n = items.length;
    items.forEach((el, k)=>{
      let d = k - i;
      if(d > n / 2) d -= n;
      if(d < -n / 2) d += n;
      const ad = Math.abs(d);
      const narrow = innerWidth < 760;
      const x = d * (narrow ? 50 : (ENV.low ? 78 : 104));
      const z = -ad * (ENV.low ? 150 : 210);
      const rot = d * -7;
      const sc = 1 - ad * 0.085;
      el.style.transform =
        `translate3d(calc(-50% + ${x}%),-50%,${z}px) rotateY(${rot}deg) scale(${Math.max(0.6, sc)})`;
      el.style.opacity = ad > 2 ? 0 : (ad === 0 ? 1 : (narrow ? 0.12 : 0.26 - ad * 0.07));
      el.style.zIndex = String(50 - ad);
      el.style.pointerEvents = ad === 0 ? 'auto' : 'none';
      el.classList.toggle('act', ad === 0);
      el.setAttribute('aria-hidden', ad === 0 ? 'false' : 'true');
    });
    Array.from(dots.children).forEach((d, k)=> d.classList.toggle('cur', k === i));
  }
  function go(k, user){
    i = (k + items.length) % items.length;
    layout();
    if(user) restart();
  }
  function restart(){
    clearInterval(timer);
    if(ENV.reduced) return;
    timer = setInterval(()=>{ if(!hovering) go(i + 1); }, 5200);
  }
  prev?.addEventListener('click', ()=> go(i - 1, true));
  next?.addEventListener('click', ()=> go(i + 1, true));
  root.addEventListener('pointerenter', ()=> hovering = true);
  root.addEventListener('pointerleave', ()=> hovering = false);
  root.addEventListener('keydown', e=>{
    if(e.key === 'ArrowLeft'){ e.preventDefault(); go(i - 1, true); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); go(i + 1, true); }
  });
  // swipe
  let sx = 0, sy = 0, dragging = false;
  stage.addEventListener('pointerdown', e=>{ sx = e.clientX; sy = e.clientY; dragging = true; });
  stage.addEventListener('pointerup', e=>{
    if(!dragging) return; dragging = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if(Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) go(i + (dx < 0 ? 1 : -1), true);
  });
  stage.addEventListener('pointercancel', ()=> dragging = false);

  layout();
  const io = new IntersectionObserver(es=>{
    es.forEach(e=> e.isIntersecting ? restart() : clearInterval(timer));
  }, {threshold:0.25});
  io.observe(root);
}

/* ============================================================
   5 · LAYERED DEPTH CAROUSEL (drag + snap + inertia)
   ============================================================ */
export function initLayered(root){
  const stage = root.querySelector('.lay-stage');
  const cards = Array.from(stage.querySelectorAll('.lay-card'));
  const counter = root.querySelector('[data-lay-count]');
  const prev = root.querySelector('[data-lay="prev"]');
  const next = root.querySelector('[data-lay="next"]');
  if(!cards.length) return;
  let i = 0, drag = false, sx = 0, off = 0;

  function layout(anim = true){
    cards.forEach((c, k)=>{
      const d = k - i;
      const ad = Math.abs(d);
      c.style.transition = anim ? 'transform .78s cubic-bezier(.16,1,.3,1),opacity .6s' : 'none';
      const y = d * 22 + (d === 0 ? off * 0.12 : 0);
      const x = d === 0 ? off : d * 14;
      const sc = 1 - ad * 0.06;
      c.style.transform = `translate3d(${x}px,${y}px,0) scale(${Math.max(0.72, sc)}) rotate(${d * 0.7}deg)`;
      c.style.opacity = ad > 2 ? 0 : 1 - ad * 0.26;
      c.style.zIndex = String(40 - ad);
      c.style.pointerEvents = d === 0 ? 'auto' : 'none';
      c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
    });
    if(counter) counter.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
  }
  const go = (k)=>{ i = clamp(k, 0, cards.length - 1); off = 0; layout(); };
  prev?.addEventListener('click', ()=> go(i - 1));
  next?.addEventListener('click', ()=> go(i + 1));

  stage.addEventListener('pointerdown', e=>{
    drag = true; sx = e.clientX; stage.classList.add('grabbing');
    stage.setPointerCapture?.(e.pointerId);
  });
  stage.addEventListener('pointermove', e=>{
    if(!drag) return;
    off = e.clientX - sx;
    layout(false);
  });
  const end = ()=>{
    if(!drag) return; drag = false; stage.classList.remove('grabbing');
    if(Math.abs(off) > 84) go(i + (off < 0 ? 1 : -1));
    else { off = 0; layout(); }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('pointerleave', end);
  stage.tabIndex = 0;
  stage.addEventListener('keydown', e=>{
    if(e.key === 'ArrowLeft'){ e.preventDefault(); go(i - 1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); go(i + 1); }
  });
  layout(false);
}

/* ============================================================
   6 · DRAG RIBBON (free drag + momentum)
   ============================================================ */
export function initRibbon(track){
  let drag = false, sx = 0, start = 0, cur = 0, v = 0, lastX = 0, raf = 0, lastT = 0;
  const maxOff = ()=> Math.min(0, track.parentElement.clientWidth - track.scrollWidth - 20);

  const apply = ()=> track.style.transform = `translate3d(${cur}px,0,0)`;
  const momentum = ()=>{
    if(drag) return;
    v *= 0.94;
    cur = clamp(cur + v, maxOff(), 0);
    apply();
    if(Math.abs(v) > 0.4) raf = requestAnimationFrame(momentum);
    else raf = 0;
  };
  track.addEventListener('pointerdown', e=>{
    drag = true; sx = e.clientX; start = cur; lastX = e.clientX; lastT = performance.now();
    track.classList.add('grabbing');
    if(raf) cancelAnimationFrame(raf), raf = 0;
    track.setPointerCapture?.(e.pointerId);
  });
  track.addEventListener('pointermove', e=>{
    if(!drag) return;
    cur = clamp(start + (e.clientX - sx), maxOff(), 0);
    const now = performance.now(), dt = now - lastT;
    if(dt > 0){ v = (e.clientX - lastX) / dt * 14; lastX = e.clientX; lastT = now; }
    apply();
  });
  const end = ()=>{
    if(!drag) return; drag = false; track.classList.remove('grabbing');
    if(!raf) raf = requestAnimationFrame(momentum);
  };
  ['pointerup','pointercancel','pointerleave'].forEach(ev=> track.addEventListener(ev, end));
  track.addEventListener('wheel', e=>{
    if(Math.abs(e.deltaX) > Math.abs(e.deltaY)){
      e.preventDefault();
      cur = clamp(cur - e.deltaX, maxOff(), 0); apply();
    }
  }, {passive:false});
}

/* ============================================================
   7 · HORIZONTAL SCROLL RAIL (vertical scroll → horizontal)
   ============================================================ */
export function initHRail(section){
  const track = section.querySelector('.hrail-track');
  const bar = section.querySelector('.hrail-prog i');
  if(!track) return;
  let raf = 0;
  const run = ()=>{
    raf = 0;
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    if(total <= 0) return;
    const p = clamp(-r.top / total, 0, 1);
    const dist = Math.max(0, track.scrollWidth - innerWidth + 40);
    track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    if(bar) bar.style.transform = `scaleX(${p})`;
  };
  addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(run); }, {passive:true});
  addEventListener('resize', run, {passive:true});
  run();
}

/* ============================================================
   8 · KINETIC TYPE MARQUEE (scroll-velocity reactive)
   ============================================================ */
export function initKinetic(){
  const rows = $$('[data-kin]');
  if(!rows.length) return;
  const state = rows.map(r=>({el:r, x:0, dir:parseFloat(r.dataset.kin) || 1, w:0}));
  state.forEach(s=>{
    // duplicate content for seamless loop
    s.el.innerHTML += s.el.innerHTML;
    s.w = s.el.scrollWidth / 2;
    if(s.dir < 0) s.x = -s.w;
  });
  let vel = 0, lastY = scrollY;
  addEventListener('scroll', ()=>{
    vel = clamp((scrollY - lastY) * 0.35, -34, 34); lastY = scrollY;
  }, {passive:true});
  const loop = ()=>{
    vel *= 0.92;
    state.forEach(s=>{
      if(!s.w) s.w = s.el.scrollWidth / 2;
      const base = ENV.reduced ? 0 : 0.55;
      s.x -= (base + Math.abs(vel) * 0.1) * s.dir + vel * 0.34 * s.dir;
      if(s.dir > 0){ if(s.x <= -s.w) s.x += s.w; if(s.x > 0) s.x -= s.w; }
      else { if(s.x >= 0) s.x -= s.w; if(s.x < -s.w) s.x += s.w; }
      s.el.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ============================================================
   9 · TICKER
   ============================================================ */
export function initTicker(){
  $$('[data-tick]').forEach(row=>{
    row.innerHTML += row.innerHTML;
    const dir = parseFloat(row.dataset.tick) || 1;
    let x = dir > 0 ? 0 : -row.scrollWidth / 2;
    const w = row.scrollWidth / 2;
    const step = ()=>{
      x -= 0.34 * dir;
      if(dir > 0 && x <= -w) x += w;
      if(dir < 0 && x >= 0) x -= w;
      row.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      requestAnimationFrame(step);
    };
    if(!ENV.reduced) requestAnimationFrame(step);
  });
}

/* ============================================================
   10 · PROCESS TIMELINE + SVG DRAW
   ============================================================ */
export function initProcess(){
  $$('.proc-wrap').forEach(wrap=>{
    const line = wrap.querySelector('.proc-line i');
    const steps = Array.from(wrap.querySelectorAll('.proc-step'));
    let raf = 0;
    const run = ()=>{
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const p = clamp((innerHeight * 0.68 - r.top) / r.height, 0, 1);
      if(line) line.style.transform = `scaleY(${p})`;
      steps.forEach(s=>{
        const sr = s.getBoundingClientRect();
        s.classList.toggle('on', sr.top < innerHeight * 0.7);
      });
    };
    addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(run); }, {passive:true});
    run();
  });

  // generic SVG path drawing
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      e.target.querySelectorAll('[data-draw]').forEach((p, k)=>{
        const len = p.getTotalLength ? p.getTotalLength() : 300;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transition = `stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1) ${k * 0.09}s`;
        requestAnimationFrame(()=> p.style.strokeDashoffset = '0');
      });
      io.unobserve(e.target);
    });
  }, {threshold:0.2});
  $$('[data-draw-root]').forEach(r=> io.observe(r));
}

/* ============================================================
   11 · FAQ / EXPANDABLE / LEDGER
   ============================================================ */
export function initExpand(){
  $$('.faq-q').forEach(q=>{
    q.addEventListener('click', ()=>{
      const item = q.closest('.faq-item');
      const open = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(o=>{
        if(o !== item){ o.classList.remove('open'); o.querySelector('.faq-q').setAttribute('aria-expanded','false'); }
      });
      item.classList.toggle('open', !open);
      q.setAttribute('aria-expanded', String(!open));
    });
  });
  $$('.led-main').forEach(b=>{
    b.addEventListener('click', ()=>{
      const row = b.closest('.led-row');
      const open = row.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
    });
  });
}

/* ============================================================
   12 · ENGINE TOGGLE BOARD → drives the 3D engine scene
   ============================================================ */
export function initEngineBoard(){
  const board = $('#engineBoard');
  if(!board) return;
  const cells = $$('.ecell', board);
  const count = $('#engineLive');
  const sceneHost = $('#engineScene');
  const sync = ()=>{
    const list = cells.map(c=> c.classList.contains('on'));
    const inst = sceneHost ? scenes.get(sceneHost) : null;
    inst?.setActive?.(list);
    const n = list.filter(Boolean).length;
    if(count) count.textContent = String(n).padStart(2,'0');
  };
  cells.forEach(c=>{
    c.addEventListener('click', ()=>{
      const on = c.classList.toggle('on');
      c.setAttribute('aria-pressed', String(on));
      sync();
    });
  });
  sync();
  // re-sync once the scene finishes building
  const io = new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)) setTimeout(sync, 900); },
    {rootMargin:'50% 0px'});
  if(sceneHost) io.observe(sceneHost);
}

/* ============================================================
   13 · NODE MAP (interactive architecture)
   ============================================================ */
export function initNodeMap(){
  const map = $('#nodeMap');
  if(!map) return;
  const nodes = $$('.nm-node', map);
  const links = $$('.nm-link', map);
  const title = $('#nmTitle'), body = $('#nmBody'), kind = $('#nmKind');
  const DATA = {
    input:{t:'INPUT',k:'Entry layer',b:'Name pattern, email length, password length and quantity. Every value you set is a local instruction — nothing is sent anywhere.'},
    generator:{t:'GENERATOR',k:'Production layer',b:'Single builds one account. Batch builds 5, 10, 20, 50 or 100 in a single pass. Results appear immediately in Generated Output.'},
    engine:{t:'ENGINE',k:'Automation layer',b:'Six engines — Identity Shift, Network Cycle, System Repo, Core Boost, Memory Purge, DNS Tunnel — plus Check Route and the live Log Engine.'},
    library:{t:'LIBRARY',k:'Storage layer',b:'Every single and every batch lands here with a date and time stamp. Sort, search, star, verify, rename or delete. Stored on the device.'},
    onetouch:{t:'ONE TOUCH',k:'Session layer',b:'A single connect control with live ping, download, upload and session telemetry, plus country selection and an emergency stop.'},
    settings:{t:'SETTINGS',k:'Control layer',b:'Notifications, Appearance, Language, Backup destinations, the Help Centre, feedback routes and the version checker.'},
    device:{t:'DEVICE',k:'Boundary',b:'The outer boundary of the system. Accounts are generated and stored locally in your Library. Nothing is uploaded to a server.'}
  };
  function select(id){
    nodes.forEach(n=> n.classList.toggle('on', n.dataset.node === id));
    links.forEach(l=> l.classList.toggle('on', l.dataset.from === id || l.dataset.to === id));
    const d = DATA[id]; if(!d) return;
    if(title) title.textContent = d.t;
    if(kind) kind.textContent = d.k;
    if(body) body.textContent = d.b;
  }
  nodes.forEach(n=>{
    const id = n.dataset.node;
    n.addEventListener('pointerenter', ()=> select(id));
    n.addEventListener('click', ()=> select(id));
    n.addEventListener('focus', ()=> select(id));
    n.setAttribute('tabindex','0');
    n.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); select(id); } });
  });
  select('generator');
}

/* ============================================================
   14 · RATING INSTRUMENT
   ============================================================ */
export function initRating(){
  const wrap = $('#stars');
  if(!wrap) return;
  const stars = $$('.star', wrap);
  const label = $('#rateLabel');
  const submit = $('#rateSubmit');
  const note = $('#rateNote');
  const LABELS = ['','Not for me','It needs work','Solid','Really good','Exceptional'];
  let value = 0;

  const paint = (n, hover)=>{
    stars.forEach((s, k)=>{
      s.classList.toggle('on', k < (n || 0));
      s.classList.toggle('hov', hover && k < n);
      s.setAttribute('aria-checked', String(k === value - 1));
    });
    if(label) label.textContent = LABELS[n] || (value ? LABELS[value] : 'Select a rating');
  };
  stars.forEach((s, k)=>{
    s.addEventListener('pointerenter', ()=> paint(k + 1, true));
    s.addEventListener('click', ()=>{
      value = k + 1; paint(value, false);
      try{ localStorage.setItem('mf_rating', String(value)); }catch(e){}
      if(navigator.vibrate && ENV.touch) navigator.vibrate(12);
    });
    s.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); s.click(); }
      if(e.key === 'ArrowRight'){ e.preventDefault(); stars[Math.min(4, k + 1)].focus(); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); stars[Math.max(0, k - 1)].focus(); }
    });
  });
  wrap.addEventListener('pointerleave', ()=> paint(value, false));

  try{
    const saved = parseInt(localStorage.getItem('mf_rating') || '0', 10);
    if(saved > 0 && saved <= 5){ value = saved; paint(value, false); }
  }catch(e){}

  submit?.addEventListener('click', ()=>{
    if(!value){ toast('Choose a rating first','alert'); wrap.animate(
      [{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(0)'}],
      {duration:320, easing:'ease-out'}); return; }
    const payload = {rating:value, note:(note?.value || '').slice(0, 1200), at:new Date().toISOString()};
    try{
      const all = JSON.parse(localStorage.getItem('mf_feedback') || '[]');
      all.push(payload);
      localStorage.setItem('mf_feedback', JSON.stringify(all.slice(-40)));
    }catch(e){}
    toast('Feedback saved on this device','check');
    submit.classList.add('ok');
    const lb = submit.querySelector('.lb');
    if(lb) lb.textContent = 'Recorded';
    setTimeout(()=>{ submit.classList.remove('ok'); if(lb) lb.textContent = 'Submit feedback'; }, 2400);
  });
}

/* ============================================================
   15 · TILT / HOVER DISCOVERY MOMENTS
   ============================================================ */
export function initTilt(){
  if(ENV.reduced) return;
  $$('[data-tilt]').forEach(el=>{
    const str = parseFloat(el.dataset.tilt) || 7;
    el.addEventListener('pointermove', e=>{
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * str}deg) rotateX(${-y * str}deg) translateZ(0)`;
      el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', ()=>{
      el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)';
      el.style.transform = '';
      setTimeout(()=> el.style.transition = '', 700);
    });
  });

  // counters
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      const el = e.target;
      const to = parseFloat(el.dataset.count);
      const dur = 1400, t0 = performance.now();
      const pad = el.dataset.pad ? parseInt(el.dataset.pad, 10) : 0;
      const suf = el.dataset.suffix || '';
      const step = (now)=>{
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        let v = Math.round(to * eased);
        el.textContent = (pad ? String(v).padStart(pad, '0') : String(v)) + suf;
        if(p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, {threshold:0.5});
  $$('[data-count]').forEach(el=> io.observe(el));
}

/* ============================================================
   16 · PARALLAX
   ============================================================ */
export function initParallax(){
  if(ENV.reduced) return;
  const els = $$('[data-par]');
  if(!els.length) return;
  let raf = 0;
  const run = ()=>{
    raf = 0;
    els.forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.bottom < -200 || r.top > innerHeight + 200) return;
      const speed = parseFloat(el.dataset.par) || 0.1;
      const mid = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0,${(-mid * speed).toFixed(1)}px,0)`;
    });
  };
  addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(run); }, {passive:true});
  run();
}

/* ============================================================
   MARQUEE GALLERY — drifting plate row with drag + inertia
   ============================================================ */
export function initGallery(){
  $$('.gal-vp').forEach(vp=>{
    const track = vp.querySelector('.gal-track');
    if(!track) return;
    // duplicate once so the drift can wrap seamlessly
    track.innerHTML += track.innerHTML;
    let x = 0, vel = 0, half = 0, drift = ENV.reduced ? 0 : -0.35;
    let dragging = false, lastX = 0, raf = 0, hover = false;

    const measure = ()=>{ half = track.scrollWidth / 2; };
    measure();
    addEventListener('resize', ()=>{ measure(); }, {passive:true});

    const wrap = ()=>{ if(half){ while(x <= -half) x += half; while(x > 0) x -= half; } };

    const loop = ()=>{
      if(!dragging){
        x += (hover ? drift * 0.25 : drift) + vel;
        vel *= 0.94;
        if(Math.abs(vel) < 0.01) vel = 0;
      }
      wrap();
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(e.isIntersecting && !raf) raf = requestAnimationFrame(loop);
        else if(!e.isIntersecting && raf){ cancelAnimationFrame(raf); raf = 0; }
      });
    }, {rootMargin:'80px'});
    io.observe(vp);

    vp.addEventListener('pointerenter', ()=> hover = true);
    vp.addEventListener('pointerleave', ()=> hover = false);
    vp.addEventListener('pointerdown', e=>{
      dragging = true; lastX = e.clientX; vel = 0;
      vp.classList.add('drag'); vp.setPointerCapture?.(e.pointerId);
    });
    vp.addEventListener('pointermove', e=>{
      if(!dragging) return;
      const d = e.clientX - lastX; lastX = e.clientX;
      x += d; vel = d * 0.32;
    });
    const end = ()=>{ dragging = false; vp.classList.remove('drag'); };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
  });
}

/* ============================================================
   STEP SHOWCASE — click / keyboard step-through
   ============================================================ */
export function initSteps(){
  $$('.steps').forEach(sec=>{
    const tabs = $$('.step-t', sec);
    const panes = $$('.step-p', sec);
    if(!tabs.length) return;
    let i = 0, timer = 0;
    const go = (k, user)=>{
      i = (k + tabs.length) % tabs.length;
      tabs.forEach((t, n)=> t.classList.toggle('is-on', n === i));
      panes.forEach((p, n)=> p.classList.toggle('is-on', n === i));
      if(user){ clearInterval(timer); arm(); }
    };
    const arm = ()=>{
      if(ENV.reduced) return;
      clearInterval(timer);
      timer = setInterval(()=> go(i + 1), 6000);
    };
    tabs.forEach((t, k)=>{
      t.addEventListener('click', ()=> go(k, true));
      t.addEventListener('keydown', e=>{
        if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); go(i + 1, true); tabs[i].focus(); }
        if(e.key === 'ArrowUp'   || e.key === 'ArrowLeft'){  e.preventDefault(); go(i - 1, true); tabs[i].focus(); }
      });
    });
    const io = new IntersectionObserver(es=>{
      es.forEach(e=> e.isIntersecting ? arm() : clearInterval(timer));
    }, {threshold:0.25});
    io.observe(sec);
  });
}

/* ============================================================
   SIGNAL CAROUSEL (drum) — vertical drum: drag, wheel, keys
   ============================================================ */
export function initDrum(){
  $$('.drum-stage').forEach(stage=>{
    const track = stage.querySelector('.drum-track');
    const items = $$('.drum-i', stage);
    if(!items.length) return;
    let i = 0, step = 0, dragging = false, startY = 0, startI = 0, timer = 0;

    const measure = ()=>{ step = items[0].getBoundingClientRect().height || 110; };
    const paint = ()=>{
      track.style.transform = `translate3d(0,${(-i * step - step / 2).toFixed(1)}px,0)`;
      items.forEach((el, k)=>{
        const d = Math.abs(k - i);
        el.classList.toggle('on', k === i);
        el.style.transform = `scale(${(1 - Math.min(d, 3) * 0.05).toFixed(3)})`;
        el.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
    };
    const go = (k, user)=>{
      i = Math.max(0, Math.min(items.length - 1, k));
      paint();
      if(user) arm();
    };
    const arm = ()=>{
      clearInterval(timer);
      if(ENV.reduced) return;
      timer = setInterval(()=> go(i >= items.length - 1 ? 0 : i + 1), 4200);
    };

    measure(); paint();
    addEventListener('resize', ()=>{ measure(); paint(); }, {passive:true});

    stage.addEventListener('pointerdown', e=>{
      dragging = true; startY = e.clientY; startI = i;
      stage.classList.add('drag'); stage.setPointerCapture?.(e.pointerId);
      clearInterval(timer);
    });
    stage.addEventListener('pointermove', e=>{
      if(!dragging) return;
      const d = Math.round((startY - e.clientY) / (step || 110));
      if(startI + d !== i) go(startI + d);
    });
    const end = ()=>{ if(!dragging) return; dragging = false; stage.classList.remove('drag'); arm(); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    stage.addEventListener('wheel', e=>{
      if(Math.abs(e.deltaY) < 4) return;
      const next = i + (e.deltaY > 0 ? 1 : -1);
      // only capture the wheel while the drum can still move
      if(next >= 0 && next < items.length){ e.preventDefault(); go(next, true); }
    }, {passive:false});

    stage.addEventListener('keydown', e=>{
      // clear autoplay FIRST so a queued tick can't add an extra step
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault(); clearInterval(timer);
        go(i + (e.key === 'ArrowDown' ? 1 : -1), true);
      }
    });
    // pause autoplay while the user is hovering or focused
    stage.addEventListener('pointerenter', ()=> clearInterval(timer));
    stage.addEventListener('pointerleave', ()=>{ if(!dragging) arm(); });
    stage.addEventListener('focusin', ()=> clearInterval(timer));
    stage.addEventListener('focusout', ()=> arm());

    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting){ measure(); paint(); arm(); } else clearInterval(timer); });
    }, {threshold:0.3});
    io.observe(stage);
  });
}
