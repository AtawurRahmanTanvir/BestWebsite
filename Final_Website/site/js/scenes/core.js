/* Download — "Core": everything converges on one object; pressing Download sends a shockwave. */
import { THREE, makeRenderer, disposeAll, damp, dotTexture, NOISE, makeEnvironment } from './util.js';

export async function create({ host, canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.15 });
  const scene = new THREE.Scene(); scene.environment = makeEnvironment(renderer); scene.environmentIntensity = .8;
  const camera = new THREE.PerspectiveCamera(36, width / height, .1, 60); camera.position.set(0, 0, 9);

  // the core: fresnel shell over a hot interior
  const shellU = { uT: { value: 0 }, uPulse: { value: 0 } };
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 5), new THREE.ShaderMaterial({ uniforms: shellU, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: NOISE + `uniform float uT, uPulse; varying float vF; varying float vN; void main(){ vec3 p = position; float n = snoise(p*1.8 + uT*0.4); p += normal * n * (0.06 + uPulse*0.25); vN = n; vec3 nrm = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix*vec4(p,1.0); vec3 vdir = normalize(-mv.xyz); vF = pow(1.0 - max(dot(nrm, vdir), 0.0), 2.2); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uPulse; varying float vF; varying float vN; void main(){ vec3 red = vec3(1.0,0.12,0.2); vec3 white = vec3(1.0); vec3 col = mix(red, white, vF*0.9 + uPulse*0.5); float a = 0.12 + vF*1.1 + uPulse*0.4 + vN*0.05; gl_FragColor = vec4(col*a, a); }` }));
  scene.add(shell);
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(.9, 3), new THREE.MeshStandardMaterial({ color: 0x1a0306, metalness: 1, roughness: .25, emissive: 0xff1a2a, emissiveIntensity: 1.2 })); scene.add(inner);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xff2438, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(7); scene.add(glow);
  // converging particles
  const N = Math.round(2600 * quality.particles); const pos = new Float32Array(N * 3); const data = [];
  for (let i = 0; i < N; i++) { const th = Math.random() * Math.PI * 2; const ph = Math.acos(2 * Math.random() - 1); data.push({ th, ph, r: 3 + Math.random() * 9, sp: .4 + Math.random() * 1.2, sz: Math.random() }); }
  const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pgeo, new THREE.PointsMaterial({ size: .06, map: dotTexture(), color: 0xffffff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })); scene.add(pts);
  // orbit rings
  const rings = [0, 1, 2].map((i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * .5, .008, 6, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25 })); r.rotation.set(Math.PI / 2 + i * .4, i * .5, 0); scene.add(r); return r; });
  const wave = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.68, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })); scene.add(wave);
  const key = new THREE.PointLight(0xffffff, 20, 20); key.position.set(3, 3, 5); scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, .2));

  let pulse = 0, waveT = -1;
  host.addEventListener('mf:core-pulse', () => { pulse = 1; waveT = 0; });
  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    pulse = damp(pulse, 0, 1.5, dt);
    shellU.uT.value = t; shellU.uPulse.value = pulse;
    inner.rotation.y = t * .3; inner.rotation.z = t * .12; inner.material.emissiveIntensity = 1 + pulse * 3 + Math.sin(t * 3) * .15;
    shell.rotation.y = -t * .1; glow.material.opacity = .55 + pulse * .5 + Math.sin(t * 2.4) * .08; glow.scale.setScalar(6.5 + pulse * 4);
    const conv = .25 + p * .75; // particles fall in faster as the section progresses
    for (let i = 0; i < N; i++) { const d = data[i]; d.r -= d.sp * conv * dt * 1.6 + pulse * dt * 4; if (d.r < 1.7) { d.r = 8 + Math.random() * 5; d.th = Math.random() * Math.PI * 2; d.ph = Math.acos(2 * Math.random() - 1); } d.th += dt * .25 / Math.max(1, d.r * .3); const s = Math.sin(d.ph); pos[i * 3] = Math.cos(d.th) * s * d.r; pos[i * 3 + 1] = Math.cos(d.ph) * d.r; pos[i * 3 + 2] = Math.sin(d.th) * s * d.r; }
    pgeo.attributes.position.needsUpdate = true;
    rings.forEach((r, i) => { r.rotation.z += dt * (.08 + i * .03); r.rotation.x += dt * .02; r.material.opacity = .18 + pulse * .5; });
    if (waveT >= 0) { waveT += dt; wave.scale.setScalar(1 + waveT * 4); wave.material.opacity = Math.max(0, 1 - waveT / 1.2); wave.lookAt(camera.position); if (waveT > 1.2) waveT = -1; }
    camera.position.x = damp(camera.position.x, (env.finePointer ? state.global.nx : Math.sin(t * .2)) * .8, 2, dt); camera.position.y = damp(camera.position.y, (env.finePointer ? state.global.ny : 0) * .5, 2, dt); if (camera.aspect > 1) camera.lookAt(-2.1, 0.1, 0); else camera.lookAt(0, -2.2, 0);
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
