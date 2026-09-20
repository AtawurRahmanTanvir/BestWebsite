/* System — "Lattice": a field of cells that parts around the pointer and tightens as you scroll. */
import { THREE, makeRenderer, disposeAll, damp, smooth, makeEnvironment } from './util.js';

export async function create({ canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.0 });
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x050505, 0.04); scene.environment = makeEnvironment(renderer); scene.environmentIntensity = .7;
  const camera = new THREE.PerspectiveCamera(42, width / height, .1, 80);

  const X = quality.tier === 2 ? 30 : 22, Y = quality.tier === 2 ? 16 : 12, Z = 3; const N = X * Y * Z; const gap = 1.15;
  const geo = new THREE.BoxGeometry(.3, .3, .3);
  const mat = new THREE.MeshStandardMaterial({ color: 0x9a9aa4, metalness: .75, roughness: .3, emissive: 0xff2438, emissiveIntensity: 0 });
  const inst = new THREE.InstancedMesh(geo, mat, N); inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(inst);
  const base = []; const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler(); const v = new THREE.Vector3(); const s = new THREE.Vector3();
  const col = new THREE.Color(); const cBase = new THREE.Color(0x8a8a96), cHot = new THREE.Color(0xff2438), cWhite = new THREE.Color(0xffffff);
  let k = 0; for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) { base.push({ x: (x - (X - 1) / 2) * gap, y: (y - (Y - 1) / 2) * gap, z: -z * gap * 2.2, heat: 0, seed: Math.random() }); inst.setColorAt(k++, cBase); }
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(2, 5, 8); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x330408, .8));
  const red = new THREE.PointLight(0xff2438, 0, 12); scene.add(red);
  scene.add(new THREE.AmbientLight(0xffffff, .35));

  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); const hit = new THREE.Vector3(0, 0, 100); const target = new THREE.Vector3(0, 0, 100);
  let camY = 0;
  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    const tight = smooth(0.45, 0.85, p); // second half: the lattice compresses
    const g = gap * (1 - tight * .35);
    camera.position.set((env.finePointer ? state.global.nx : 0) * 1.2, damp(camY, (env.finePointer ? state.global.ny : 0) * .8 + 1.5 - p * 1.5, 2, dt), 14 - p * 3); camY = camera.position.y;
    camera.lookAt(0, 0, -2);
    if (state.pointer.inside) { ndc.set(state.pointer.x, state.pointer.y); ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, target); } else target.set(0, 0, 100);
    hit.lerp(target, 1 - Math.exp(-dt * 8)); red.position.copy(hit); red.position.z = 1.5; red.intensity = hit.z > 50 ? 0 : 30;
    for (let i = 0; i < N; i++) {
      const b = base[i]; const bx = b.x * (g / gap), by = b.y * (g / gap), bz = b.z * (g / gap);
      const dx = bx - hit.x, dy = by - hit.y; const d = Math.sqrt(dx * dx + dy * dy + (bz) * (bz) * .3);
      const push = Math.max(0, 1 - d / 3.2); const heat = push * push;
      b.heat = damp(b.heat, heat, 6, dt);
      const wave = Math.sin(t * 1.2 + b.x * .5 + b.y * .7) * .06 * (1 - tight);
      const pz = bz + b.heat * 1.8 + wave; const px = bx + (d > 0 ? dx / d : 0) * b.heat * .9; const py = by + (d > 0 ? dy / d : 0) * b.heat * .9;
      e.set(b.heat * 1.2 + t * .1 * b.seed, b.heat * .8, 0); q.setFromEuler(e);
      const sc = 1 + b.heat * .6 - tight * .15; s.set(sc, sc, sc); v.set(px, py, pz); m4.compose(v, q, s); inst.setMatrixAt(i, m4);
      col.copy(cBase).lerp(cHot, Math.min(1, b.heat * 1.4)).lerp(cWhite, Math.max(0, b.heat - .7) * 2); inst.setColorAt(i, col);
    }
    inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
