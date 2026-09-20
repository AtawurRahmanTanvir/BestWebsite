/* Engine — "Reactor": six engine nodes orbiting a core; scroll orbits the camera, tap reads a node. */
import { THREE, makeRenderer, disposeAll, damp, smooth, dotTexture, makeEnvironment } from './util.js';

const ENGINES = [
  { name: 'Identity Shift', on: true }, { name: 'Network Cycle', on: true }, { name: 'System Repo', on: true },
  { name: 'Core Boost', on: false }, { name: 'Memory Purge', on: false }, { name: 'DNS Tunnel', on: true },
];

export async function create({ host, canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.1 });
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x050505, 0.05); scene.environment = makeEnvironment(renderer); scene.environmentIntensity = .8;
  const camera = new THREE.PerspectiveCamera(40, width / height, .1, 60);

  // core
  const coreMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: .7, roughness: .2, clearcoat: 1, clearcoatRoughness: .12, emissive: 0xff1a2a, emissiveIntensity: .22, flatShading: true });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 3), coreMat); scene.add(core);
  const coreWire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.35, 1), 1), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25 })); scene.add(coreWire);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xff2438, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false })); coreGlow.scale.setScalar(3.8); scene.add(coreGlow);

  // nodes
  const R = 3.6; const nodes = []; const nodeGroup = new THREE.Group(); scene.add(nodeGroup);
  const metal = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, metalness: .95, roughness: .28 });
  const ringMat = (on) => new THREE.MeshStandardMaterial({ color: on ? 0xff2438 : 0x3a3a40, emissive: on ? 0xff2438 : 0x000000, emissiveIntensity: on ? 1.1 : 0, metalness: .4, roughness: .35 });
  ENGINES.forEach((e, i) => {
    const a = (i / 6) * Math.PI * 2;
    const g = new THREE.Group(); g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.46, .5, .14, 48), metal); body.userData.index = i;
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .18, 48), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: .9, roughness: .2 })); inner.position.y = .02;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .022, 12, 72), ringMat(e.on)); ring.rotation.x = Math.PI / 2; ring.position.y = .08;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.55, 8), metal); stem.position.y = -.82;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, .04, 32), metal); foot.position.y = -1.58;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.7, .008, 8, 72), new THREE.MeshBasicMaterial({ color: e.on ? 0xff2438 : 0x666670, transparent: true, opacity: .45 })); halo.rotation.x = Math.PI / 2; halo.position.y = .1;
    const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, .1, 0), g.position.clone().multiplyScalar(-1).setLength(R - 1.3).setY(.1)]), new THREE.LineDashedMaterial({ color: e.on ? 0xff2438 : 0x444449, dashSize: .12, gapSize: .1, transparent: true, opacity: .5 })); link.computeLineDistances();
    g.add(body, inner, ring, stem, foot, halo, link); g.userData = { i, body, ring, halo, link, on: e.on, a }; nodeGroup.add(g); nodes.push(g);
  });
  // particles drifting around the reactor
  const PN = Math.round(600 * quality.particles); const pp = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { const r = 2 + Math.random() * 5; const a = Math.random() * Math.PI * 2; const y = (Math.random() - .5) * 4; pp[i * 3] = Math.cos(a) * r; pp[i * 3 + 1] = y; pp[i * 3 + 2] = Math.sin(a) * r; }
  const pts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pp, 3)), new THREE.PointsMaterial({ size: .05, color: 0xff6677, map: dotTexture(), transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(pts);

  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(4, 6, 4); scene.add(key);
  const red = new THREE.PointLight(0xff2438, 40, 14); scene.add(red);
  scene.add(new THREE.AmbientLight(0xffffff, .2));
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, metalness: .9, roughness: .6 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; scene.add(floor);
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(R - .05, R + .05, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12, side: THREE.DoubleSide })); floorRing.rotation.x = -Math.PI / 2; floorRing.position.y = -1.58; scene.add(floorRing);

  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  let active = 0, focus = -1, focusUntil = 0; let camAng = 0, camElev = .3;
  const emit = (i) => { if (i === active) return; active = i; host.dispatchEvent(new CustomEvent('mf:reactor-node', { detail: i })); };
  host.addEventListener('mf:reactor-focus', (e) => { focus = e.detail; focusUntil = performance.now() + 2500; emit(focus); });

  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    const now = performance.now();
    // orbit: one full turn over the pin, nodes pass in front one by one
    let tAng = -p * Math.PI * 2 - Math.PI / 2;
    if (focus >= 0 && now < focusUntil) tAng = -nodes[focus].userData.a - Math.PI / 2 + Math.PI; else focus = -1;
    camAng = damp(camAng, tAng, 3.2, dt); camElev = damp(camElev, .32 + (env.finePointer ? state.global.ny * .12 : 0), 3, dt);
    const dist = camera.aspect < 1 ? 12.5 : camera.aspect < 1.4 ? 10 : 8.4;
    camera.position.set(Math.cos(camAng) * dist * Math.cos(camElev), Math.sin(camElev) * dist, Math.sin(camAng) * dist * Math.cos(camElev));
    camera.lookAt(0, -.2, 0);
    // which node faces the camera
    if (focus < 0) { let best = -1, bd = -2; nodes.forEach((n) => { const d = n.position.clone().normalize().dot(camera.position.clone().setY(0).normalize()); if (d > bd) { bd = d; best = n.userData.i; } }); emit(best); }
    core.rotation.y = t * .25; core.rotation.x = Math.sin(t * .2) * .2; coreWire.rotation.y = -t * .12; coreWire.rotation.z = t * .07;
    coreMat.emissiveIntensity = .22 + Math.sin(t * 2.2) * .08;
    coreGlow.material.opacity = .3 + Math.sin(t * 2.2) * .06;
    red.position.set(Math.cos(t * .6) * 1.5, .8, Math.sin(t * .6) * 1.5);
    nodes.forEach((n) => { const isA = n.userData.i === active; const s = damp(n.scale.x, isA ? 1.18 : 1, 6, dt); n.scale.set(s, 1, s); n.userData.ring.rotation.z += dt * (isA ? 1.2 : .25); n.userData.halo.rotation.z -= dt * .3; n.userData.link.material.dashOffset = (n.userData.link.material.dashOffset || 0) - dt * .4; n.userData.halo.material.opacity = isA ? .9 : .35; n.userData.ring.material.emissiveIntensity = n.userData.on ? (isA ? 2.2 : 1.0) : (isA ? .25 : 0); if (!n.userData.on && isA) n.userData.ring.material.emissive.setHex(0xffffff); });
    pts.rotation.y = t * .04;
    renderer.render(scene, camera);
  }
  function onPointer(type, p) {
    if (type !== 'down') return; ndc.set(p.x, p.y); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(nodes.map((n) => n.userData.body), false)[0];
    if (hit) { focus = hit.object.userData.index; focusUntil = performance.now() + 3500; emit(focus); }
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose, onPointer };
}
