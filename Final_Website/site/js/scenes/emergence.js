/* Brand — "Emergence": particles sampled from the official mark gather out of a cloud as you scroll. */
import { THREE, makeRenderer, disposeAll, damp, sampleLogo, dotTexture, NOISE } from './util.js';

export async function create({ canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.1 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, .1, 60); camera.position.set(0, 0, 8);
  const N = Math.round(14000 * quality.particles);
  const { pos, col, aspect } = await sampleLogo(N);
  const scatter = new Float32Array(N * 3); const rnd = new Float32Array(N);
  for (let i = 0; i < N; i++) { const th = Math.random() * Math.PI * 2; const ph = Math.acos(2 * Math.random() - 1); const r = 2.5 + Math.random() * 6; scatter[i * 3] = Math.cos(th) * Math.sin(ph) * r; scatter[i * 3 + 1] = Math.sin(th) * Math.sin(ph) * r * .6; scatter[i * 3 + 2] = Math.cos(ph) * r - 2; rnd[i] = Math.random(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3)); geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const uniforms = { uT: { value: 0 }, uMix: { value: 0 }, uMap: { value: dotTexture() }, uPx: { value: quality.dpr }, uP: { value: new THREE.Vector3(0, 0, 100) }, uScale: { value: 2.3 } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: NOISE + `attribute vec3 aScatter; attribute vec3 aColor; attribute float aRnd; uniform float uT, uMix, uPx, uScale; uniform vec3 uP; varying vec3 vC; varying float vA;
      void main(){ float m = smoothstep(0.0, 1.0, clamp((uMix - aRnd*0.35) / 0.65, 0.0, 1.0)); vec3 target = position * uScale; vec3 n = vec3(snoise(aScatter*0.6 + uT*0.2), snoise(aScatter*0.6 + 10.0 + uT*0.2), snoise(aScatter*0.6 + 20.0 + uT*0.2)); vec3 from = aScatter + n*0.6; vec3 p = mix(from, target, m); p.z += (1.0-m)*sin(uT + aRnd*6.28)*0.3; vec3 d = p - uP; float dist = length(d.xy); p.xy += normalize(d.xy + 0.0001) * smoothstep(1.1, 0.0, dist) * 0.35 * m; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = (1.6 + aRnd*1.6 + (1.0-m)*1.2) * uPx * (6.0 / -mv.z); vC = mix(vec3(1.0,0.14,0.22)*0.9, aColor*1.5, m); vA = 0.5 + 0.5*m; }`,
    fragmentShader: `uniform sampler2D uMap; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC * (0.9 + 0.3*t.a), t.a * vA); }` });
  const pts = new THREE.Points(geo, mat); scene.add(pts);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0xff2438, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(9, 7, 1); glow.position.z = -1; scene.add(glow);
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); const hit = new THREE.Vector3();
  let mix = 0;
  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    mix = damp(mix, Math.min(1, Math.max(0, (p - .1) / .7)), 3, dt);
    uniforms.uT.value = t; uniforms.uMix.value = mix; glow.material.opacity = mix * .35;
    pts.rotation.y = (1 - mix) * Math.sin(t * .3) * .3 + (env.finePointer ? state.global.nx * .08 * mix : 0); pts.rotation.x = (env.finePointer ? -state.global.ny * .05 * mix : 0);
    if (state.pointer.inside) { ndc.set(state.pointer.x, state.pointer.y); ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, hit); uniforms.uP.value.lerp(hit, .25); } else uniforms.uP.value.lerp(new THREE.Vector3(0, 0, 100), .05);
    uniforms.uScale.value = Math.min(2.3, (camera.aspect < 1 ? 1.6 : 2.3));
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
