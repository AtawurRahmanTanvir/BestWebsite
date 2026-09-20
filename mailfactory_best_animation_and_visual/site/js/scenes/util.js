/* Shared helpers for the 3D worlds. */
import * as THREE from 'three';
export { THREE };

export function makeRenderer(canvas, quality, opts = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: opts.antialias ?? quality.antialias, alpha: opts.alpha ?? true, powerPreference: 'high-performance', stencil: false, depth: true, premultipliedAlpha: true });
  r.setPixelRatio(Math.min(quality.dpr, opts.maxDpr || 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = opts.toneMapping ?? THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = opts.exposure ?? 1.05;
  r.setClearColor(0x000000, opts.alpha === false ? 1 : 0);
  return r;
}

export function disposeAll(scene, renderer) {
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); }); }
  });
  renderer.dispose();
  try { renderer.forceContextLoss(); } catch (_) {}
}

export const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* GLSL simplex noise (Ashima / Stefan Gustavson, public domain) */
export const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
`;

/* Sample the official logo mask into particle targets (x, y in -1..1 aspect-correct, rgb). */
export async function sampleLogo(count, { mask = 'assets/logo-mask.png', color = 'assets/logo-sample.png' } = {}) {
  const load = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const [m, c] = await Promise.all([load(mask), load(color)]);
  const w = m.width, h = m.height;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(m, 0, 0); const md = ctx.getImageData(0, 0, w, h).data;
  ctx.clearRect(0, 0, w, h); ctx.drawImage(c, 0, 0); const cd = ctx.getImageData(0, 0, w, h).data;
  const candidates = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; const a = md[i + 3] * (md[i] / 255); if (a > 40) candidates.push({ x, y, a, i }); }
  const pos = new Float32Array(count * 3); const col = new Float32Array(count * 3);
  const aspect = w / h;
  for (let k = 0; k < count; k++) {
    const s = candidates[Math.floor(Math.random() * candidates.length)];
    pos[k * 3] = ((s.x + Math.random()) / w * 2 - 1) * aspect; pos[k * 3 + 1] = -((s.y + Math.random()) / h * 2 - 1); pos[k * 3 + 2] = (Math.random() - .5) * .08;
    let r = cd[s.i] / 255, g = cd[s.i + 1] / 255, b = cd[s.i + 2] / 255;
    const lum = (r + g + b) / 3; if (lum < .12) { r = .32; g = .32; b = .35; }
    col[k * 3] = r; col[k * 3 + 1] = g; col[k * 3 + 2] = b;
  }
  return { pos, col, aspect };
}

/* The Mail Factory mark as 3D geometry: chevron, two leaning panels, the "new account" glyph. */
export function buildMark(materials) {
  const g = new THREE.Group();
  const { chevron, panel, glyph } = materials;
  // chevron (V pointing down)
  const sh = new THREE.Shape();
  sh.moveTo(-1.55, 1.15); sh.lineTo(-1.15, 1.15); sh.lineTo(0, 0.05); sh.lineTo(1.15, 1.15); sh.lineTo(1.55, 1.15); sh.lineTo(0, -0.42); sh.closePath();
  const chevGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 });
  chevGeo.center();
  const chev = new THREE.Mesh(chevGeo, chevron); chev.position.set(0, 0.62, 0); chev.name = 'chevron'; g.add(chev);
  // panels
  const mkPanel = (side) => {
    const s = new THREE.Shape();
    s.moveTo(0, -1.0); s.lineTo(0.62, -0.62); s.lineTo(0.62, 0.55); s.lineTo(0, 0.12); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }); geo.center();
    const m = new THREE.Mesh(geo, panel); m.position.set(side * 1.15, -0.32, 0); m.rotation.y = side * -0.35; if (side > 0) m.scale.x = -1; m.name = side < 0 ? 'left' : 'right'; return m;
  };
  g.add(mkPanel(-1), mkPanel(1));
  // glyph: head ring, shoulder arc, plus
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 12, 40), glyph); head.position.set(0.02, -0.45, 0.02); head.name = 'glyph';
  const arcGeo = new THREE.TorusGeometry(0.36, 0.03, 12, 40, Math.PI); const arc = new THREE.Mesh(arcGeo, glyph); arc.position.set(0.02, -1.08, 0.02); arc.name = 'glyph';
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.06), glyph); p1.position.set(0.5, -0.98, 0.04); p1.name = 'glyph';
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.06), glyph); p2.position.set(0.5, -0.98, 0.04); p2.name = 'glyph';
  g.add(head, arc, p1, p2);
  return g;
}

/* A small studio environment so metals have something to reflect: white key panels, one red panel, dark room. */
export function makeEnvironment(renderer, { red = 1 } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.02, 0.025), side: THREE.BackSide })));
  const panel = (w, h, x, y, z, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  panel(10, 4, 0, 10, 2, new THREE.Color(4, 4, 4.2));
  panel(4, 9, -10, 3, 3, new THREE.Color(2.2, 2.2, 2.4));
  panel(3, 8, 10, 1, -2, new THREE.Color(3 * red, 0.3 * red, 0.45 * red));
  panel(8, 2, 0, -4, -10, new THREE.Color(0.6, 0.6, 0.7));
  panel(2, 2, 4, -6, 6, new THREE.Color(1.5, 1.5, 1.6));
  const tex = pmrem.fromScene(s, 0.04).texture; pmrem.dispose(); return tex;
}

export function edgesOf(mesh, color = 0xffffff, opacity = .6) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  e.position.copy(mesh.position); e.rotation.copy(mesh.rotation); e.scale.copy(mesh.scale); return e;
}

/* small soft-dot sprite texture */
let dotTex;
export function dotTexture() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c); return dotTex;
}
