/* One Touch — "Pulse": a sphere of light with the app's own connection states; tap to connect. */
import { THREE, makeRenderer, disposeAll, damp, dotTexture, NOISE } from './util.js';

export async function create({ host, canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.1 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, .1, 50); camera.position.set(0, 0, 8.5);

  const N = Math.round(9000 * quality.particles); const pos = new Float32Array(N * 3); const rnd = new Float32Array(N);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const th = phi * i; pos[i * 3] = Math.cos(th) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(th) * r; rnd[i] = Math.random(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const uniforms = { uT: { value: 0 }, uState: { value: 0 }, uEnergy: { value: 0 }, uColor: { value: new THREE.Color(0x7a7f88) }, uMap: { value: dotTexture() }, uPx: { value: quality.dpr }, uP: { value: new THREE.Vector3(0, 0, 0) } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: NOISE + `
      attribute float aRnd; uniform float uT, uState, uEnergy, uPx; uniform vec3 uP; varying float vA;
      void main(){
        vec3 p = position;
        float n = snoise(p*1.6 + uT*0.35);
        float r = 2.2 + n*(0.12 + uEnergy*0.35) + aRnd*0.02;
        // connecting: particles swirl and stretch outward in bands
        float band = sin(p.y*9.0 + uT*4.0)*0.5+0.5;
        r += uState*(band*0.35*(1.0-uEnergy));
        p *= r;
        // pointer push
        vec3 d = p - uP; float dist = length(d); p += normalize(d) * smoothstep(1.6, 0.0, dist) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_Position = projectionMatrix * mv;
        float sz = (1.4 + aRnd*1.6 + uEnergy*1.2) * uPx;
        gl_PointSize = sz * (7.0 / -mv.z);
        vA = 0.35 + 0.65*smoothstep(-1.0, 1.0, n) ;
      }`,
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uColor; varying float vA; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); }` });
  const pts = new THREE.Points(geo, mat); scene.add(pts);
  // inner core + rings
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x7a7f88, transparent: true, opacity: .25 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(.9, 32, 32), coreMat); scene.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(), color: 0x7a7f88, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.setScalar(6); scene.add(glow);
  const rings = [0, 1, 2].map((i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(2.9 + i * .35, .006, 6, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .18 - i * .04 })); r.rotation.x = Math.PI / 2 + i * .25; r.rotation.y = i * .6; scene.add(r); return r; });
  const wave = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.36, 96), new THREE.MeshBasicMaterial({ color: 0xff2438, transparent: true, opacity: 0, side: THREE.DoubleSide })); scene.add(wave);

  const COLORS = { disconnected: new THREE.Color(0xb8bcc6), connecting: new THREE.Color(0xffb020), connected: new THREE.Color(0xff2438), disconnecting: new THREE.Color(0xffb020) };
  let stateName = 'disconnected', energy = 0, tEnergy = 0, stateMix = 0, tStateMix = 0, timer = null, waveT = -1;
  const col = new THREE.Color(0x8a8f98);
  const setState = (s) => { stateName = s; host.dispatchEvent(new CustomEvent('mf:pulse-state', { detail: s })); tEnergy = s === 'connected' ? 1 : s === 'connecting' ? .55 : s === 'disconnecting' ? .3 : 0; tStateMix = (s === 'connecting' || s === 'disconnecting') ? 1 : 0; };
  const toggle = () => {
    clearTimeout(timer);
    if (stateName === 'disconnected' || stateName === 'disconnecting') { setState('connecting'); timer = setTimeout(() => { setState('connected'); waveT = 0; }, 1700); }
    else { setState('disconnecting'); timer = setTimeout(() => setState('disconnected'), 900); }
  };
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); const hit = new THREE.Vector3();

  function render(state) {
    const dt = state.dt, t = state.t;
    energy = damp(energy, tEnergy, 2.5, dt); stateMix = damp(stateMix, tStateMix, 4, dt);
    col.lerp(COLORS[stateName], 1 - Math.exp(-dt * 3));
    uniforms.uT.value = t; uniforms.uEnergy.value = energy; uniforms.uState.value = stateMix; uniforms.uColor.value.copy(col);
    coreMat.color.copy(col); glow.material.color.copy(col); coreMat.opacity = .15 + energy * .5; glow.material.opacity = .3 + energy * .5; glow.scale.setScalar(5 + energy * 3 + Math.sin(t * 3) * .2 * energy);
    core.scale.setScalar(1 + Math.sin(t * (1.2 + energy * 2)) * .06);
    pts.rotation.y = t * (.08 + energy * .25 + stateMix * .5); pts.rotation.x = Math.sin(t * .2) * .15;
    rings.forEach((r, i) => { r.rotation.z += dt * (.1 + i * .05) * (1 + energy * 2); r.material.opacity = (.18 - i * .04) * (1 + energy * 1.5); });
    if (waveT >= 0) { waveT += dt; const s = 1 + waveT * 2.2; wave.scale.setScalar(s); wave.material.opacity = Math.max(0, 1 - waveT / 1.4) * .9; if (waveT > 1.4) waveT = -1; }
    // pointer as a 3D point on the z=0 plane
    if (state.pointer.inside) { ndc.set(state.pointer.x, state.pointer.y); ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, hit); uniforms.uP.value.lerp(hit, .2); } else uniforms.uP.value.lerp(new THREE.Vector3(0, 0, 50), .05);
    const portrait = camera.aspect < 1; camera.position.x = damp(camera.position.x, (env.finePointer ? state.global.nx : 0) * .5 + (portrait ? 0 : 1.6), 2, dt); camera.position.z = portrait ? 12 : 8.5; camera.lookAt(portrait ? 0 : 0.9, portrait ? 1.2 : 0, 0);
    renderer.render(scene, camera);
  }
  function onPointer(type) { if (type === 'down') toggle(); }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { clearTimeout(timer); disposeAll(scene, renderer); }
  return { render, resize, dispose, onPointer };
}
