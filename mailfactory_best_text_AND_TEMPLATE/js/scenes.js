/* ============================================================
   MAIL FACTORY — 3D ENVIRONMENT LIBRARY (three.js)
   10 environments, each a different visual family.
   Built on approach, paused off-screen, fully disposed when far.
   Camera is directed (dolly / orbit / tilt / focus) per scene.
   ============================================================ */
import * as THREE from '../vendor/three.module.js';

const RED = 0xe8112d, EMBER = 0xff2438;

/* ---------- shared base ---------- */
class Scene3D{
  constructor(canvas, opts = {}){
    this.canvas = canvas;
    this.low = opts.low || false;
    this.reduced = opts.reduced || false;
    this.maxDpr = this.low ? 1.35 : (opts.maxDpr || 1.85);
    this.running = false; this.raf = 0; this.t = 0; this.last = 0;
    this.p = {x:0, y:0};      // smoothed pointer -1..1
    this.pT = {x:0, y:0};
    this.prog = 0;            // 0..1 scroll progress through the section
    this.disposed = false;
    this._init();
  }
  _init(){
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.renderer = new THREE.WebGLRenderer({
      canvas:this.canvas, antialias:!this.low, alpha:true,
      powerPreference:this.low ? 'low-power' : 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxDpr));
    this.renderer.setSize(this.w, this.h, false);
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.w / this.h, 0.1, 200);
    this.camera.position.set(0, 0, 8);
    this.build();
    this.render();
  }
  build(){}
  update(dt){}
  setPointer(x, y){ this.pT.x = x; this.pT.y = y; }
  setProgress(v){ this.prog = v; }
  resize(){
    if(this.disposed) return;
    const r = this.canvas.getBoundingClientRect();
    if(r.width < 2 || r.height < 2) return;
    this.w = r.width; this.h = r.height;
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxDpr));
    this.renderer.setSize(this.w, this.h, false);
  }
  render(){ this.renderer.render(this.scene, this.camera); }
  start(){
    if(this.running || this.disposed) return;
    this.running = true; this.last = performance.now();
    const loop = (now)=>{
      if(!this.running || this.disposed) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if(!this.reduced) this.t += dt;
      this.p.x += (this.pT.x - this.p.x) * Math.min(1, dt * 3.4);
      this.p.y += (this.pT.y - this.p.y) * Math.min(1, dt * 3.4);
      this.update(this.reduced ? 0 : dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop(){ this.running = false; if(this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  dispose(){
    this.stop(); this.disposed = true;
    this.scene?.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      if(o.material){
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(m=>{ Object.values(m).forEach(v=>{ if(v && v.isTexture) v.dispose(); }); m.dispose(); });
      }
    });
    this.renderer?.dispose();
    this.renderer?.forceContextLoss?.();
    this.scene = null; this.renderer = null;
  }
}

/* ============================================================
   01 · LATTICE — hero: luminous volumetric grid tunnel
   family: wireframe / technical architecture
   ============================================================ */
class Lattice extends Scene3D{
  build(){
    const g = new THREE.Group(); this.scene.add(g); this.g = g;
    this.camera.position.set(0, 0, 11); this.camera.fov = 62; this.camera.updateProjectionMatrix();

    // concentric square rings receding in Z — the "factory corridor"
    this.rings = [];
    const N = this.low ? 22 : 36;
    const STEP = 2.05, BASE = 5.2, FLARE = 0.085;
    for(let i = 0; i < N; i++){
      const s = BASE + i * FLARE;
      const geo = new THREE.BufferGeometry();
      const pts = [];
      for(let k = 0; k <= 4; k++){
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        pts.push(Math.cos(a) * s, Math.sin(a) * s, 0);
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const key = i % 6 === 0;
      const fade = 1 - i / (N * 1.35);
      const mat = new THREE.LineBasicMaterial({
        color: key ? RED : 0xffffff,
        transparent:true, opacity:(key ? 0.42 : 0.085) * fade
      });
      const line = new THREE.Line(geo, mat);
      line.position.z = -i * STEP;
      line.rotation.z = i * 0.009;            // gentle twist, not a spiral
      line.userData = {key, fade, i};
      g.add(line); this.rings.push(line);
    }
    this.depth = N * STEP;

    // longitudinal rails along the four corners
    const railMat = new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0.05});
    for(let k = 0; k < 4; k++){
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * BASE, Math.sin(a) * BASE, 0),
        new THREE.Vector3(Math.cos(a) * (BASE + N * FLARE), Math.sin(a) * (BASE + N * FLARE), -this.depth)
      ]);
      g.add(new THREE.Line(geo, railMat));
    }

    // travelling data motes — hug the walls so the centre stays clean
    const cnt = this.low ? 200 : 460;
    const pos = new Float32Array(cnt * 3), spd = new Float32Array(cnt);
    for(let i = 0; i < cnt; i++){
      const a = Math.random() * Math.PI * 2, rr = 3.1 + Math.random() * 2.3;
      pos[i*3] = Math.cos(a) * rr; pos[i*3+1] = Math.sin(a) * rr;
      pos[i*3+2] = -Math.random() * this.depth;
      spd[i] = 4 + Math.random() * 11;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.motes = new THREE.Points(pg, new THREE.PointsMaterial({
      color:0xffffff, size:0.028, transparent:true, opacity:0.5,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true
    }));
    this.spd = spd; this.mCount = cnt;
    g.add(this.motes);

    // vanishing-point glow, far down the corridor
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 20, 20),
      new THREE.MeshBasicMaterial({color:RED, transparent:true, opacity:0.95})
    );
    core.position.z = -this.depth * 0.94; this.core = core; g.add(core);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 24, 24),
      new THREE.MeshBasicMaterial({color:RED, transparent:true, opacity:0.05,
        blending:THREE.AdditiveBlending, depthWrite:false})
    );
    halo.position.z = core.position.z; this.halo = halo; g.add(halo);
  }
  update(dt){
    const t = this.t;
    // camera sits inside the mouth of the corridor and dollies forward on scroll
    this.camera.position.z = 3.4 - this.prog * 12;
    this.camera.position.x += (this.p.x * 0.85 - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.p.y * 0.6 - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.p.x * 0.3, -this.p.y * 0.2, -this.depth);
    this.g.rotation.z = Math.sin(t * 0.07) * 0.03;

    const pa = this.motes.geometry.attributes.position;
    for(let i = 0; i < this.mCount; i++){
      let z = pa.array[i*3+2] + this.spd[i] * dt;
      if(z > this.camera.position.z + 1) z -= this.depth;
      pa.array[i*3+2] = z;
    }
    pa.needsUpdate = true;

    this.rings.forEach((r)=>{
      const u = r.userData;
      r.rotation.z += dt * 0.014;
      if(u.key) r.material.opacity = (0.3 + Math.sin(t * 1.15 + u.i * 0.42) * 0.2) * u.fade;
    });
    const pulse = 1 + Math.sin(t * 1.9) * 0.16;
    this.core.scale.setScalar(pulse);
    this.halo.scale.setScalar(pulse);
  }
}

/* ============================================================
   02 · CORE — faceted glass monolith (product core)
   family: glass / refractive
   ============================================================ */
class Core extends Scene3D{
  build(){
    this.camera.position.set(0, 0, 6.2);
    const env = new THREE.Group(); this.scene.add(env); this.env = env;

    const geo = new THREE.IcosahedronGeometry(1.75, 0);
    // solid, lit faceted body — reads as an object, not a wire cloud
    const mat = new THREE.MeshPhysicalMaterial({
      color:0x1b1e25, metalness:0.55, roughness:0.22,
      clearcoat:1, clearcoatRoughness:0.12,
      emissive:0x2a0810, emissiveIntensity:0.45,
      flatShading:true
    });
    this.solid = new THREE.Mesh(geo, mat); env.add(this.solid);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({color:EMBER, transparent:true, opacity:0.85})
    );
    wire.scale.setScalar(1.012); this.wire = wire; env.add(wire);

    // glowing inner filament, visible through the facet gaps
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 0),
      new THREE.MeshBasicMaterial({color:RED, transparent:true, opacity:0.55})
    );
    this.inner = inner; env.add(inner);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.9, 1),
      new THREE.MeshBasicMaterial({color:0xffffff, wireframe:true, transparent:true, opacity:0.035})
    );
    this.shell = shell; env.add(shell);

    // orbiting satellites = the six product areas
    this.sats = [];
    for(let i = 0; i < 6; i++){
      const s = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.115, 0),
        new THREE.MeshBasicMaterial({color:i % 2 ? EMBER : 0xffffff, transparent:true, opacity:0.9})
      );
      env.add(s); this.sats.push(s);
    }

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const k = new THREE.DirectionalLight(0xffffff, 3.2); k.position.set(4, 5, 5); this.scene.add(k);
    const f = new THREE.DirectionalLight(0xc8d2ff, 1.1); f.position.set(-5, -2, 3); this.scene.add(f);
    const r1 = new THREE.PointLight(RED, 40, 16); r1.position.set(-3.4, -1.4, 2.6); this.scene.add(r1); this.r1 = r1;
    const r2 = new THREE.PointLight(0x6a8cff, 14, 13); r2.position.set(3.2, 2.4, -2.4); this.scene.add(r2);
  }
  update(dt){
    const t = this.t;
    this.env.rotation.y = t * 0.16 + this.p.x * 0.5 + this.prog * 1.3;
    this.env.rotation.x = Math.sin(t * 0.22) * 0.12 - this.p.y * 0.32;
    this.inner.rotation.y = -t * 0.55; this.inner.rotation.x = t * 0.32;
    this.inner.material.opacity = 0.42 + Math.sin(t * 1.8) * 0.2;
    this.shell.rotation.y = -t * 0.08; this.shell.rotation.z = t * 0.05;
    this.wire.material.opacity = 0.62 + Math.sin(t * 1.5) * 0.22;
    this.solid.material.emissiveIntensity = 0.35 + Math.sin(t * 1.4) * 0.18;
    this.sats.forEach((s, i)=>{
      const a = t * (0.4 + i * 0.05) + (i / 6) * Math.PI * 2;
      const rr = 2.5 + Math.sin(t * 0.6 + i) * 0.22;
      s.position.set(Math.cos(a) * rr, Math.sin(a * 0.8 + i) * 0.85, Math.sin(a) * rr);
      s.rotation.set(t * 0.8 + i, t * 0.6, 0);
    });
    this.r1.intensity = 26 + Math.sin(t * 2.2) * 10;
    this.camera.position.z = 6.2 - this.prog * 1.5;
    this.camera.lookAt(0, 0, 0);
  }
}

/* ============================================================
   03 · ENGINES — six metallic nodes in orbit (ENGINE chapter)
   family: metallic / mechanical
   ============================================================ */
class Engines extends Scene3D{
  build(){
    this.camera.position.set(0, 1.6, 8.4);
    const g = new THREE.Group(); this.scene.add(g); this.g = g;
    this.nodes = [];
    const R = 3.1;
    for(let i = 0; i < 6; i++){
      const a = (i / 6) * Math.PI * 2;
      const node = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.4, 0.125, this.low ? 60 : 116, 10, 2, 3),
        new THREE.MeshStandardMaterial({color:0x14161b, metalness:0.95, roughness:0.22,
          emissive:RED, emissiveIntensity:0.05})
      );
      node.add(body);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.008, 6, 56),
        new THREE.MeshBasicMaterial({color:EMBER, transparent:true, opacity:0.3})
      );
      ring.rotation.x = Math.PI / 2; node.add(ring);
      node.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      node.userData = {body, ring, a, on:true, i};
      g.add(node); this.nodes.push(node);
    }
    // hub
    this.hub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 1),
      new THREE.MeshStandardMaterial({color:0x0c0e12, metalness:1, roughness:0.15,
        emissive:RED, emissiveIntensity:0.5})
    );
    g.add(this.hub);
    // spokes
    this.spokes = [];
    const sm = new THREE.LineBasicMaterial({color:EMBER, transparent:true, opacity:0.22});
    this.nodes.forEach(n=>{
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), n.position.clone()]);
      const l = new THREE.Line(geo, sm.clone()); g.add(l); this.spokes.push(l);
    });
    // ground grid
    const grid = new THREE.GridHelper(22, 22, 0x333842, 0x1a1d23);
    grid.position.y = -1.9; grid.material.transparent = true; grid.material.opacity = 0.3;
    this.scene.add(grid); this.grid = grid;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.34));
    const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(3, 7, 4); this.scene.add(d);
    const p = new THREE.PointLight(RED, 30, 16); p.position.set(0, 1, 0); this.scene.add(p); this.hubLight = p;
  }
  setActive(list){ this.nodes.forEach((n,i)=>{ n.userData.on = list ? !!list[i] : true; }); }
  update(dt){
    const t = this.t;
    this.g.rotation.y = t * 0.12 + this.p.x * 0.6 + this.prog * 0.9;
    this.camera.position.y = 1.6 - this.p.y * 0.7 + this.prog * 0.8;
    this.camera.position.z = 8.4 - this.prog * 2.2;
    this.camera.lookAt(0, 0, 0);
    this.nodes.forEach((n, i)=>{
      const u = n.userData;
      u.body.rotation.x += dt * (u.on ? 0.7 + i * 0.09 : 0.05);
      u.body.rotation.y += dt * (u.on ? 0.5 : 0.03);
      const tgt = u.on ? 0.9 : 0.04;
      u.body.material.emissiveIntensity += (tgt - u.body.material.emissiveIntensity) * 0.08;
      u.ring.material.opacity += ((u.on ? 0.34 + Math.sin(t * 2 + i) * 0.16 : 0.05) - u.ring.material.opacity) * 0.1;
      u.ring.rotation.z += dt * (u.on ? 0.5 : 0.04);
      n.position.y = u.on ? Math.sin(t * 0.9 + i * 1.1) * 0.16 : -0.24;
      this.spokes[i].geometry.setFromPoints([new THREE.Vector3(0,0,0), n.position.clone()]);
      this.spokes[i].material.opacity = u.on ? 0.18 + Math.sin(t * 3 + i) * 0.12 : 0.03;
    });
    this.hub.rotation.y = -t * 0.4; this.hub.rotation.x = t * 0.2;
    const live = this.nodes.filter(n=>n.userData.on).length;
    this.hub.material.emissiveIntensity = 0.2 + (live / 6) * 0.9;
    this.hubLight.intensity = 8 + live * 5;
  }
}

/* ============================================================
   04 · STREAM — GPU particle river (GENERATOR)
   family: particles / flow
   ============================================================ */
class Stream extends Scene3D{
  build(){
    this.camera.position.set(0, 0, 7);
    const cnt = this.low ? 1400 : 4200;
    const pos = new Float32Array(cnt * 3), col = new Float32Array(cnt * 3), ph = new Float32Array(cnt);
    const cRed = new THREE.Color(RED), cWhite = new THREE.Color(0xffffff), cGrey = new THREE.Color(0x6b7280);
    for(let i = 0; i < cnt; i++){
      pos[i*3] = (Math.random() - 0.5) * 16;
      pos[i*3+1] = (Math.random() - 0.5) * 7;
      pos[i*3+2] = (Math.random() - 0.5) * 7;
      ph[i] = Math.random() * Math.PI * 2;
      const c = Math.random() < 0.26 ? cRed : (Math.random() < 0.55 ? cWhite : cGrey);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.ph = ph; this.cnt = cnt;
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size:0.036, vertexColors:true, transparent:true, opacity:0.85,
      blending:THREE.AdditiveBlending, depthWrite:false
    }));
    this.scene.add(this.pts);

    // funnel rings — the "factory" aperture the stream passes through
    this.gates = [];
    for(let i = 0; i < 3; i++){
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(1.5 - i * 0.26, 0.012, 6, 84),
        new THREE.MeshBasicMaterial({color:i === 1 ? EMBER : 0xffffff, transparent:true, opacity:0.34})
      );
      r.rotation.y = Math.PI / 2; r.position.x = -1 + i * 1;
      this.scene.add(r); this.gates.push(r);
    }
  }
  update(dt){
    const t = this.t, a = this.pts.geometry.attributes.position;
    for(let i = 0; i < this.cnt; i++){
      let x = a.array[i*3], y = a.array[i*3+1], z = a.array[i*3+2];
      const d = Math.hypot(y, z);
      const squeeze = Math.exp(-Math.pow(x * 0.7, 2)) * 0.9;
      x += (2.6 + squeeze * 2.2) * dt;
      const k = 1 - squeeze * 0.055;
      y *= k; z *= k;
      y += Math.sin(t * 1.1 + this.ph[i]) * 0.0055;
      z += Math.cos(t * 0.9 + this.ph[i]) * 0.0055;
      if(x > 8){ x = -8; const ang = Math.random() * Math.PI * 2, rr = 0.6 + Math.random() * 3.1;
        y = Math.cos(ang) * rr; z = Math.sin(ang) * rr; }
      a.array[i*3] = x; a.array[i*3+1] = y; a.array[i*3+2] = z;
    }
    a.needsUpdate = true;
    this.gates.forEach((g, i)=>{
      g.rotation.z = t * (0.4 + i * 0.2) * (i % 2 ? -1 : 1);
      g.material.opacity = 0.22 + Math.sin(t * 2 + i * 1.3) * 0.16;
    });
    this.camera.position.y = this.p.y * -0.9;
    this.camera.position.x = this.p.x * 1.2 - 0.4 + this.prog * 0.8;
    this.camera.position.z = 7 - this.prog * 1.6;
    this.camera.lookAt(0.6, 0, 0);
  }
}

/* ============================================================
   05 · VAULT — instanced data slabs (LIBRARY)
   family: data structures / archive
   ============================================================ */
class Vault extends Scene3D{
  build(){
    this.camera.position.set(0, 0.5, 9);
    const rows = this.low ? 9 : 14, cols = this.low ? 11 : 17;
    const N = rows * cols;
    const geo = new THREE.BoxGeometry(0.62, 0.075, 0.42);
    const mat = new THREE.MeshStandardMaterial({color:0x1a1d23, metalness:0.85, roughness:0.35});
    this.inst = new THREE.InstancedMesh(geo, mat, N);
    this.inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const colArr = new Float32Array(N * 3);
    this.base = [];
    let k = 0;
    for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
      const x = (c - (cols - 1) / 2) * 0.78;
      const y = (r - (rows - 1) / 2) * 0.34;
      const z = (Math.random() - 0.5) * 1.4;
      this.base.push({x, y, z, ph:Math.random() * Math.PI * 2, hot:Math.random() < 0.13});
      const col = this.base[k].hot ? new THREE.Color(RED) : new THREE.Color(0x272b33);
      colArr[k*3] = col.r; colArr[k*3+1] = col.g; colArr[k*3+2] = col.b;
      k++;
    }
    this.inst.instanceColor = new THREE.InstancedBufferAttribute(colArr, 3);
    this.scene.add(this.inst); this.N = N;
    this.dummy = new THREE.Object3D();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const d = new THREE.DirectionalLight(0xffffff, 1.5); d.position.set(2, 4, 6); this.scene.add(d);
    const p = new THREE.PointLight(RED, 26, 18); p.position.set(-4, 0, 4); this.scene.add(p); this.pl = p;
  }
  update(dt){
    const t = this.t;
    for(let i = 0; i < this.N; i++){
      const b = this.base[i];
      const wave = Math.sin(t * 0.85 + b.x * 0.4 + b.y * 0.7 + b.ph) * 0.14;
      this.dummy.position.set(b.x, b.y + wave, b.z + Math.sin(t * 0.5 + b.ph) * 0.22);
      this.dummy.rotation.set(0, Math.sin(t * 0.3 + b.ph) * 0.14 + this.p.x * 0.2, 0);
      const s = b.hot ? 1 + Math.sin(t * 2.4 + b.ph) * 0.09 : 1;
      this.dummy.scale.set(s, s, s);
      this.dummy.updateMatrix();
      this.inst.setMatrixAt(i, this.dummy.matrix);
    }
    this.inst.instanceMatrix.needsUpdate = true;
    this.inst.rotation.y = this.p.x * 0.25 + Math.sin(t * 0.1) * 0.06 + this.prog * 0.4;
    this.inst.rotation.x = -this.p.y * 0.16 + 0.04;
    this.pl.position.x = Math.sin(t * 0.5) * 5;
    this.camera.position.z = 9 - this.prog * 2.4;
    this.camera.lookAt(0, 0, 0);
  }
}

/* ============================================================
   06 · PULSE — radial shader corona (ONE TOUCH)
   family: luminous / energetic shader
   ============================================================ */
class Pulse extends Scene3D{
  build(){
    this.camera.position.set(0, 0, 4.4);
    const uni = {
      uT:{value:0}, uE:{value:0}, uP:{value:new THREE.Vector2(0,0)}
    };
    this.uni = uni;
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:uni,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`
        varying vec2 vUv;uniform float uT;uniform float uE;uniform vec2 uP;
        float h(vec2 p){return fract(sin(dot(p,vec2(12.98,78.23)))*43758.5453);}
        void main(){
          vec2 st=(vUv-.5)*2.;
          st-=uP*.22;
          float r=length(st);
          float a=atan(st.y,st.x);
          float rings=0.;
          for(int i=0;i<5;i++){
            float fi=float(i);
            float ph=fract(uT*.28+fi*.2);
            float rr=ph*1.35;
            rings+=smoothstep(.035,0.,abs(r-rr))*(1.-ph)*.9;
          }
          float spokes=(sin(a*22.+uT*1.1)*.5+.5);
          spokes*=smoothstep(.95,.25,r)*smoothstep(.12,.34,r)*.24;
          float core=exp(-r*5.5)*(1.1+uE*.9);
          float grain=h(vUv*420.+uT)*.035;
          vec3 red=vec3(.93,.08,.18);
          vec3 col=red*(rings*.85+core);
          col+=vec3(1.,.55,.5)*pow(core,2.4)*.85;
          col+=red*spokes;
          col+=grain*.4;
          float alpha=clamp(rings*.8+core*1.15+spokes*.8+grain*.25,0.,1.);
          alpha*=smoothstep(1.32,.2,r);
          gl_FragColor=vec4(col,alpha);
        }`
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), mat);
    this.scene.add(this.quad);

    // thin orbit rings in 3D around the corona
    this.orbits = [];
    for(let i = 0; i < 3; i++){
      const o = new THREE.Mesh(
        new THREE.TorusGeometry(1.15 + i * 0.36, 0.0055, 6, 96),
        new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.14 - i * 0.03})
      );
      o.rotation.x = 1.15 + i * 0.16; o.rotation.y = i * 0.5;
      this.scene.add(o); this.orbits.push(o);
    }
  }
  update(dt){
    this.uni.uT.value = this.t;
    this.uni.uE.value += ((Math.abs(this.p.x) + Math.abs(this.p.y)) * 0.8 - this.uni.uE.value) * 0.06;
    this.uni.uP.value.set(this.p.x, -this.p.y);
    this.orbits.forEach((o, i)=>{
      o.rotation.z += dt * (0.16 + i * 0.1);
      o.rotation.y += dt * 0.06 * (i % 2 ? -1 : 1);
    });
    this.camera.position.z = 4.4 - this.prog * 0.7;
  }
}

/* ============================================================
   07 · MESH — technical wire terrain (SYSTEM)
   family: terrain / topology
   ============================================================ */
class Mesh3D extends Scene3D{
  build(){
    this.camera.position.set(0, 2.6, 6.4);
    const seg = this.low ? 46 : 84;
    const geo = new THREE.PlaneGeometry(18, 12, seg, seg);
    geo.rotateX(-Math.PI / 2);
    this.geo = geo;
    this.baseY = Float32Array.from(geo.attributes.position.array);
    this.terrain = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color:0x3a4049, wireframe:true, transparent:true, opacity:0.4
    }));
    this.scene.add(this.terrain);

    const geo2 = geo.clone();
    this.glow = new THREE.Mesh(geo2, new THREE.MeshBasicMaterial({
      color:RED, wireframe:true, transparent:true, opacity:0.11
    }));
    this.glow.position.y = 0.06; this.glow.scale.setScalar(1.002);
    this.scene.add(this.glow);

    // markers riding the surface
    this.marks = [];
    for(let i = 0; i < (this.low ? 6 : 11); i++){
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 10, 10),
        new THREE.MeshBasicMaterial({color:i % 3 === 0 ? EMBER : 0xffffff, transparent:true, opacity:0.9})
      );
      m.userData = {x:(Math.random() - 0.5) * 14, z:(Math.random() - 0.5) * 9, ph:Math.random() * 6.28};
      this.scene.add(m); this.marks.push(m);
    }
  }
  wave(x, z, t){
    return Math.sin(x * 0.42 + t * 0.62) * 0.42
         + Math.cos(z * 0.55 - t * 0.44) * 0.3
         + Math.sin((x + z) * 0.24 + t * 0.3) * 0.22;
  }
  update(dt){
    const t = this.t, pa = this.geo.attributes.position, b = this.baseY;
    for(let i = 0; i < pa.count; i++){
      const x = b[i*3], z = b[i*3+2];
      pa.array[i*3+1] = this.wave(x, z, t);
    }
    pa.needsUpdate = true;
    this.glow.geometry.attributes.position.array.set(pa.array);
    this.glow.geometry.attributes.position.needsUpdate = true;
    this.marks.forEach((m, i)=>{
      const u = m.userData;
      u.x += dt * 0.42 * (i % 2 ? 1 : -1);
      if(u.x > 9) u.x = -9; if(u.x < -9) u.x = 9;
      m.position.set(u.x, this.wave(u.x, u.z, t) + 0.11, u.z);
      m.material.opacity = 0.55 + Math.sin(t * 2.4 + u.ph) * 0.4;
    });
    this.camera.position.x = this.p.x * 1.6;
    this.camera.position.y = 2.6 - this.p.y * 0.9 - this.prog * 1.1;
    this.camera.lookAt(0, 0, -1);
  }
}

/* ============================================================
   08 · FLUID — soft organic drifting forms
   family: soft organic / fluid
   ============================================================ */
class Fluid extends Scene3D{
  build(){
    this.camera.position.set(0, 0, 6);
    this.blobs = [];
    const palette = [0x14161c, 0x1d2027, 0x2a0e14];
    for(let i = 0; i < (this.low ? 4 : 7); i++){
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.8 + Math.random() * 0.75, this.low ? 24 : 46, this.low ? 24 : 46),
        new THREE.MeshPhysicalMaterial({
          color:palette[i % 3], metalness:0.25, roughness:0.28,
          clearcoat:0.9, clearcoatRoughness:0.2,
          transmission:i % 3 === 2 ? 0.5 : 0.12, thickness:1.2,
          emissive:i % 3 === 2 ? RED : 0x000000, emissiveIntensity:i % 3 === 2 ? 0.22 : 0
        })
      );
      const g = m.geometry;
      m.userData = {
        base:Float32Array.from(g.attributes.position.array),
        ph:Math.random() * 6.28, sp:0.4 + Math.random() * 0.5,
        ox:(Math.random() - 0.5) * 5.4, oy:(Math.random() - 0.5) * 3.2, oz:(Math.random() - 0.5) * 2.4
      };
      this.scene.add(m); this.blobs.push(m);
    }
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.38));
    const d = new THREE.DirectionalLight(0xffffff, 1.7); d.position.set(3, 4, 5); this.scene.add(d);
    const r = new THREE.PointLight(RED, 22, 15); r.position.set(-3, -2, 3); this.scene.add(r); this.rl = r;
  }
  update(dt){
    const t = this.t;
    this.blobs.forEach((m, i)=>{
      const u = m.userData, g = m.geometry, pa = g.attributes.position, b = u.base;
      if(!this.low || i < 3){
        for(let k = 0; k < pa.count; k++){
          const x = b[k*3], y = b[k*3+1], z = b[k*3+2];
          const n = Math.sin(x * 2.1 + t * u.sp + u.ph) * Math.cos(y * 1.9 - t * u.sp * 0.7)
                  * Math.sin(z * 2.3 + t * 0.4) * 0.11;
          const l = Math.hypot(x, y, z) || 1;
          pa.array[k*3] = x + (x / l) * n;
          pa.array[k*3+1] = y + (y / l) * n;
          pa.array[k*3+2] = z + (z / l) * n;
        }
        pa.needsUpdate = true; g.computeVertexNormals();
      }
      m.position.set(
        u.ox + Math.sin(t * 0.23 + u.ph) * 0.85 + this.p.x * 0.5,
        u.oy + Math.cos(t * 0.19 + u.ph) * 0.7 - this.p.y * 0.4,
        u.oz + Math.sin(t * 0.15 + u.ph) * 0.5
      );
      m.rotation.set(t * 0.1 + u.ph, t * 0.14, 0);
    });
    this.rl.position.x = Math.sin(t * 0.4) * 4;
    this.camera.position.z = 6 - this.prog * 1.2;
  }
}

/* ============================================================
   09 · SHARDS — dark metallic debris (DOWNLOAD finale)
   family: dark metallic / sculptural
   ============================================================ */
class Shards extends Scene3D{
  build(){
    this.camera.position.set(0, 0, 9);
    this.items = [];
    const geos = [
      new THREE.TetrahedronGeometry(0.44),
      new THREE.OctahedronGeometry(0.36),
      new THREE.BoxGeometry(0.5, 0.06, 0.5),
      new THREE.IcosahedronGeometry(0.3, 0)
    ];
    const N = this.low ? 26 : 54;
    for(let i = 0; i < N; i++){
      const hot = i % 6 === 0;
      const m = new THREE.Mesh(
        geos[i % geos.length],
        new THREE.MeshStandardMaterial({
          color:hot ? 0x2a0b11 : 0x15171c, metalness:0.98, roughness:0.16 + Math.random() * 0.24,
          emissive:hot ? RED : 0x000000, emissiveIntensity:hot ? 0.8 : 0
        })
      );
      const a = Math.random() * Math.PI * 2, rr = 2.1 + Math.random() * 4.6;
      m.userData = {
        a, rr, y:(Math.random() - 0.5) * 5.4, sp:0.06 + Math.random() * 0.16,
        rx:Math.random() * 0.5, ry:Math.random() * 0.5, ph:Math.random() * 6.28
      };
      this.scene.add(m); this.items.push(m);
    }
    this.geos = geos;
    // central beam
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 22, 8),
      new THREE.MeshBasicMaterial({color:EMBER, transparent:true, opacity:0.2,
        blending:THREE.AdditiveBlending, depthWrite:false})
    );
    this.beam.rotation.z = Math.PI / 2; this.scene.add(this.beam);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.24));
    const d = new THREE.DirectionalLight(0xffffff, 2.1); d.position.set(4, 5, 6); this.scene.add(d);
    const r = new THREE.PointLight(RED, 42, 20); r.position.set(0, 0, 2); this.scene.add(r); this.rl = r;
  }
  update(dt){
    const t = this.t;
    this.items.forEach((m, i)=>{
      const u = m.userData;
      u.a += dt * u.sp;
      const rr = u.rr * (1 - this.prog * 0.3);
      m.position.set(Math.cos(u.a) * rr, u.y + Math.sin(t * 0.4 + u.ph) * 0.34, Math.sin(u.a) * rr);
      m.rotation.x += dt * u.rx; m.rotation.y += dt * u.ry;
    });
    this.beam.material.opacity = 0.11 + Math.sin(t * 1.6) * 0.07 + this.prog * 0.18;
    this.rl.intensity = 30 + Math.sin(t * 2) * 12 + this.prog * 30;
    this.camera.position.x = this.p.x * 1.4;
    this.camera.position.y = -this.p.y * 1.1;
    this.camera.position.z = 9 - this.prog * 3.4;
    this.camera.lookAt(0, 0, 0);
  }
}

/* ============================================================
   10 · BRANDFIN — final logo resolve
   family: luminous particulate → form
   ============================================================ */
class BrandFin extends Scene3D{
  build(){
    this.camera.position.set(0, 0, 7);
    const cnt = this.low ? 1100 : 3000;
    const pos = new Float32Array(cnt * 3), tgt = new Float32Array(cnt * 3), rnd = new Float32Array(cnt * 3);
    // target = a chevron "M/V" silhouette matching the brand mark
    for(let i = 0; i < cnt; i++){
      const side = Math.random() < 0.5 ? -1 : 1;
      let x, y;
      if(Math.random() < 0.62){
        // the V stroke
        const u = Math.random();
        x = side * (0.25 + u * 2.1);
        y = 1.55 - u * 2.6 + (Math.random() - 0.5) * 0.14;
      }else{
        // the outer pillars
        x = side * (1.75 + Math.random() * 0.55);
        y = (Math.random() - 0.5) * 2.5 - 0.25;
      }
      tgt[i*3] = x; tgt[i*3+1] = y; tgt[i*3+2] = (Math.random() - 0.5) * 0.36;
      const a = Math.random() * Math.PI * 2, rr = 4 + Math.random() * 7;
      rnd[i*3] = Math.cos(a) * rr; rnd[i*3+1] = (Math.random() - 0.5) * 9; rnd[i*3+2] = Math.sin(a) * rr - 3;
      pos[i*3] = rnd[i*3]; pos[i*3+1] = rnd[i*3+1]; pos[i*3+2] = rnd[i*3+2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.tgt = tgt; this.rnd = rnd; this.cnt = cnt;
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color:EMBER, size:0.03, transparent:true, opacity:0.9,
      blending:THREE.AdditiveBlending, depthWrite:false
    }));
    this.scene.add(this.pts);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, 26, 26),
      new THREE.MeshBasicMaterial({color:RED, transparent:true, opacity:0.035,
        blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.BackSide})
    );
    this.scene.add(halo); this.halo = halo;
  }
  update(dt){
    const a = this.pts.geometry.attributes.position, t = this.t;
    const k = Math.pow(Math.min(1, Math.max(0, this.prog * 1.25)), 1.4);
    for(let i = 0; i < this.cnt; i++){
      const jx = Math.sin(t * 0.9 + i * 0.13) * 0.035 * (1 - k);
      const jy = Math.cos(t * 0.8 + i * 0.17) * 0.035 * (1 - k);
      a.array[i*3]   += ((this.rnd[i*3]   * (1 - k) + this.tgt[i*3]   * k + jx) - a.array[i*3])   * 0.1;
      a.array[i*3+1] += ((this.rnd[i*3+1] * (1 - k) + this.tgt[i*3+1] * k + jy) - a.array[i*3+1]) * 0.1;
      a.array[i*3+2] += ((this.rnd[i*3+2] * (1 - k) + this.tgt[i*3+2] * k)      - a.array[i*3+2]) * 0.1;
    }
    a.needsUpdate = true;
    this.pts.material.size = 0.028 + k * 0.016;
    this.pts.material.opacity = 0.55 + k * 0.45;
    this.pts.rotation.y = (1 - k) * 0.5 + this.p.x * 0.18;
    this.halo.material.opacity = 0.02 + k * 0.05;
    this.camera.position.z = 7.4 - k * 1.5;
    this.camera.position.x = this.p.x * 0.5;
    this.camera.position.y = -this.p.y * 0.4;
    this.camera.lookAt(0, 0, 0);
  }
}

export const SCENES = {
  lattice:Lattice, core:Core, engines:Engines, stream:Stream, vault:Vault,
  pulse:Pulse, mesh:Mesh3D, fluid:Fluid, shards:Shards, brandfin:BrandFin
};

export function makeScene(name, canvas, opts){
  const K = SCENES[name];
  if(!K) { console.warn('[3d] unknown scene', name); return null; }
  try { return new K(canvas, opts); }
  catch(e){ console.warn('[3d] build failed', name, e); return null; }
}
