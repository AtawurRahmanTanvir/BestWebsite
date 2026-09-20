/* Hero — "Signal": darkness, one line of light, then a field of streaks rushing toward the mark. */
import { THREE, makeRenderer, disposeAll, damp, smooth } from './util.js';

export async function create({ host, canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.1 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width / height, .1, 60); camera.position.set(0, 0, 9);

  // streak field
  const N = Math.round(520 * quality.particles);
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 1 });
  const inst = new THREE.InstancedMesh(geo, mat, N); inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const data = []; const m4 = new THREE.Matrix4(); const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const z = -10 + Math.random() * 11; const depth = (z + 10) / 11;
    const band = (Math.random() - .5) * (Math.random() < .6 ? 7 : 16); data.push({ x: (Math.random() - .5) * 34, y: band, z, len: .6 + Math.random() * 3.4 * (1 - depth * .4), th: .005 + Math.random() * .016, sp: (.5 + Math.random() * 1.8) * (0.4 + depth), ph: Math.random() });
    const bright = Math.random() < .12; const red = Math.random() < .8; const k = bright ? 1 : .28 + Math.random() * .3; col.setRGB(red ? k : k * .9, red ? k * .08 : k * .9, red ? k * .12 : k * .95); inst.setColorAt(i, col);
  }
  scene.add(inst);

  // the signal line
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xff2438, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(40, .02), lineMat); scene.add(line);
  const lineGlow = new THREE.Mesh(new THREE.PlaneGeometry(40, .5), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uA: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'uniform float uA; varying vec2 vUv; void main(){ float d=abs(vUv.y-0.5)*2.0; float a=pow(1.0-d,3.0)*uA; gl_FragColor=vec4(1.0,0.14,0.22,a);}' })); scene.add(lineGlow);

  // radial bloom behind the mark
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uA: { value: 0 }, uT: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'uniform float uA; uniform float uT; varying vec2 vUv; void main(){ vec2 p=vUv-0.5; float r=length(p); float a=exp(-r*r*14.0)*0.55 + exp(-r*r*3.5)*0.16; a*=uA*(0.92+0.08*sin(uT*1.7)); gl_FragColor=vec4(1.0,0.12,0.2,a);}' }));
  glow.position.z = -2; scene.add(glow);

  let px = 0, py = 0;
  function render(state) {
    const dt = state.dt, t = state.t;
    const phase = parseFloat(host.dataset.phase || '0');
    const tgtX = env.finePointer ? state.global.nx * .6 : Math.sin(t * .2) * .2; const tgtY = env.finePointer ? state.global.ny * .35 : Math.cos(t * .17) * .12;
    px = damp(px, tgtX, 2.5, dt); py = damp(py, tgtY, 2.5, dt);
    camera.position.x = px; camera.position.y = py; camera.lookAt(0, 0, 0);
    // signal line: 0 → .35
    const sig = smooth(0.02, 0.18, phase) * (1 - smooth(0.3, 0.48, phase));
    lineMat.opacity = sig * (0.7 + 0.3 * Math.sin(t * 9)); line.scale.x = 0.2 + smooth(0.02, 0.3, phase) * 0.8; lineGlow.material.uniforms.uA.value = sig * .9;
    lineGlow.scale.y = 1 + smooth(0.3, 0.48, phase) * 30;
    // field opens after the line
    const field = smooth(0.32, 0.7, phase); mat.opacity = field * .8; inst.visible = field > 0.001;
    glow.material.uniforms.uA.value = smooth(0.45, 1, phase) * .9 + sig * .25; glow.material.uniforms.uT.value = t;
    if (inst.visible) {
      const rush = 1 + (1 - smooth(0.5, 1, phase)) * 6; // fast when the field blows open, then settles
      for (let i = 0; i < N; i++) {
        const d = data[i];
        d.x += d.sp * rush * dt * 1.4; if (d.x > 18) d.x -= 36;
        const stretch = 1 + rush * .8;
        m4.makeScale(d.len * stretch, d.th, 1); m4.setPosition(d.x, d.y + Math.sin(t * .5 + d.ph * 6.28) * .05, d.z);
        inst.setMatrixAt(i, m4);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
