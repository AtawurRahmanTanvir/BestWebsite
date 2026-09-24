/* Dashboard — "Aperture": a corridor of machined rings the camera pushes through. */
import { THREE, makeRenderer, disposeAll, damp, smooth, makeEnvironment } from './util.js';

export async function create({ canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.0 });
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x000000, 0.085); scene.environment = makeEnvironment(renderer); scene.environmentIntensity = .6;
  const camera = new THREE.PerspectiveCamera(60, width / height, .1, 80);

  const COUNT = 26; const rings = [];
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, metalness: .95, roughness: .28 });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xff2438, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < COUNT; i++) {
    const g = new THREE.Group();
    const r = 3.2 + (i % 3) * .25;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .16, 10, 72), metal);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(r - .19, .012, 6, 90), edgeMat);
    // blades: segmented plates around the ring, like an aperture
    const blades = new THREE.Group(); const nb = 8;
    for (let b = 0; b < nb; b++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(1.1, .05, .5), metal); const a = (b / nb) * Math.PI * 2; pl.position.set(Math.cos(a) * (r - .75), Math.sin(a) * (r - .75), 0); pl.rotation.z = a + Math.PI / 2; blades.add(pl); }
    g.add(ring, edge, blades); g.position.z = -i * 2.2; g.rotation.z = i * .21; g.userData = { blades, i };
    scene.add(g); rings.push(g);
  }
  const key = new THREE.PointLight(0xffffff, 30, 20); key.position.set(0, 0, 4); scene.add(key);
  const red = new THREE.PointLight(0xff2438, 60, 30); scene.add(red);
  scene.add(new THREE.AmbientLight(0xffffff, .12));
  // end light: the "online" core at the end of the corridor
  const core = new THREE.Mesh(new THREE.SphereGeometry(.6, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff })); core.position.z = -COUNT * 2.2 - 4; scene.add(core);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uA: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'uniform float uA; varying vec2 vUv; void main(){ float r=length(vUv-0.5); float a=exp(-r*r*20.0)*uA; gl_FragColor=vec4(1.0,0.2,0.28,a);}' })); halo.position.z = core.position.z + .5; scene.add(halo);

  let px = 0, py = 0;
  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    const travel = -p * (COUNT * 2.2 - 6);
    px = damp(px, env.finePointer ? state.global.nx * .9 : Math.sin(t * .3) * .3, 2.5, dt); py = damp(py, env.finePointer ? state.global.ny * .6 : Math.cos(t * .27) * .2, 2.5, dt);
    camera.position.set(px, py, 3 + travel); camera.lookAt(px * .3, py * .3, travel - 10);
    camera.rotation.z = Math.sin(t * .2) * .02 + p * .3;
    key.position.set(px, py, camera.position.z + 1); red.position.set(0, 0, camera.position.z - 6);
    const open = smooth(0.35, 0.8, p);
    rings.forEach((g) => {
      const d = g.position.z - camera.position.z; const near = Math.max(0, 1 - Math.abs(d + 4) / 8);
      g.rotation.z += dt * (0.05 + near * .25) * ((g.userData.i % 2) ? 1 : -1);
      const bl = g.userData.blades; const spread = .75 - open * .55 - near * .1;
      bl.children.forEach((pl, b) => { const a = (b / bl.children.length) * Math.PI * 2 + g.rotation.z * .0; const r = 3.2 + (g.userData.i % 3) * .25 - spread; pl.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); });
    });
    edgeMat.opacity = .5 + open * .5; halo.material.uniforms.uA.value = .6 + open * 1.2; core.scale.setScalar(1 + open * 2.5);
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
