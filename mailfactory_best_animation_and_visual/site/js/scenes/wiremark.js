/* Discovery — "Wire mark": the emblem drawn as wire, then filled with metal and light as you scroll. */
import { THREE, makeRenderer, disposeAll, buildMark, edgesOf, damp, smooth, makeEnvironment } from './util.js';

export async function create({ canvas, quality, env, width, height, host }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.15 });
  const scene = new THREE.Scene(); scene.environment = makeEnvironment(renderer); scene.environmentIntensity = .9;
  const camera = new THREE.PerspectiveCamera(36, width / height, .1, 50);

  const chevron = new THREE.MeshStandardMaterial({ color: 0x5a0710, metalness: .85, roughness: .32, emissive: 0xff1a2a, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: .9, roughness: .28, emissive: 0xff1a2a, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const glyph = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .2, roughness: .35, emissive: 0xffffff, emissiveIntensity: .15, transparent: true, opacity: 0 });
  const mark = buildMark({ chevron, panel, glyph }); scene.add(mark);
  const parts = { chevron: mark.getObjectByName('chevron'), left: mark.getObjectByName('left'), right: mark.getObjectByName('right') };
  parts.left.material = panel.clone(); parts.right.material = panel.clone();
  const wires = new THREE.Group(); mark.children.forEach((m) => wires.add(edgesOf(m, 0xffffff, .5))); scene.add(wires);

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff2438, 3); rim.position.set(-4, -2, -3); scene.add(rim);
  const fill = new THREE.PointLight(0xff3344, 8, 12); fill.position.set(0, -1, 3); scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, .25));

  // faint grid floor for depth
  const grid = new THREE.GridHelper(20, 40, 0x222226, 0x151518); grid.position.y = -1.7; grid.material.transparent = true; grid.material.opacity = .5; scene.add(grid);

  let ang = 0, elev = 0, dist = 7.5;

  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    // camera: from a low side angle sweeping to the front, drifting up
    const tAng = (1 - p) * 1.25 - 0.15 + (env.finePointer ? state.global.nx * .12 : 0);
    const tElev = 0.35 - p * 0.3 + (env.finePointer ? state.global.ny * .08 : 0);
    ang = damp(ang, tAng, 3, dt); elev = damp(elev, tElev, 3, dt); dist = damp(dist, (8.2 - p * 1.4) * (camera.aspect < 1 ? 1.75 : camera.aspect < 1.4 ? 1.25 : 1), 3, dt);
    camera.position.set(Math.sin(ang) * dist * Math.cos(elev), Math.sin(elev) * dist + .2, Math.cos(ang) * dist * Math.cos(elev));
    camera.lookAt(0, -0.05, 0);
    mark.rotation.y = wires.rotation.y = Math.sin(t * .3) * .04;
    // fill: wire → solid
    const fillAmt = smooth(0.05, 0.5, p);
    chevron.opacity = parts.left.material.opacity = parts.right.material.opacity = fillAmt; glyph.opacity = smooth(0.3, 0.7, p);
    wires.children.forEach((w) => { w.material.opacity = .55 * (1 - fillAmt * .85); });
    // stage highlights
    const hC = smooth(0.15, 0.25, p) * (1 - smooth(0.42, 0.5, p));
    const hL = smooth(0.4, 0.48, p) * (1 - smooth(0.66, 0.72, p));
    const hR = smooth(0.65, 0.72, p);
    chevron.emissiveIntensity = .12 + hC * 1.4;
    parts.left.scale.setScalar(1 + hL * .04); parts.right.scale.set(-1 - hR * .04, 1 + hR * .04, 1 + hR * .04);
    parts.left.material.emissiveIntensity = .04 + hL * .9; parts.right.material.emissiveIntensity = .04 + hR * .9;
    fill.intensity = 6 + Math.max(hC, hL, hR) * 14 + Math.sin(t * 2) * .6;
    fill.position.x = hL ? -1.3 : hR ? 1.3 : 0;
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
