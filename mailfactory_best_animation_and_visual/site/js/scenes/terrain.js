/* Deep dive — "Terrain": a slow flight over displaced ground with contour lines. */
import { THREE, makeRenderer, disposeAll, damp, NOISE } from './util.js';

export async function create({ canvas, quality, env, width, height }) {
  const renderer = makeRenderer(canvas, quality, { exposure: 1.0 });
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x050505, 6, 34);
  const camera = new THREE.PerspectiveCamera(50, width / height, .1, 80);
  const seg = quality.tier === 2 ? 220 : 140;
  const geo = new THREE.PlaneGeometry(60, 60, seg, seg); geo.rotateX(-Math.PI / 2);
  const uniforms = { uT: { value: 0 }, uOff: { value: 0 }, uFog: { value: scene.fog.color }, uNear: { value: scene.fog.near }, uFar: { value: scene.fog.far }, uP: { value: new THREE.Vector2(100, 100) } };
  const vert = NOISE + `
    uniform float uT, uOff; uniform vec2 uP; varying float vH; varying vec3 vPos; varying float vFog; varying float vPush;
    float height(vec2 p){ float h = snoise(vec3(p*0.075, uT*0.03))*1.6; h += snoise(vec3(p*0.18, 3.0+uT*0.05))*0.55; h += snoise(vec3(p*0.5, 9.0))*0.12; float ridge = 1.0-abs(snoise(vec3(p*0.05, 20.0))); h += ridge*ridge*1.4; return h; }
    void main(){ vec3 p = position; vec2 w = vec2(p.x, p.z + uOff); float h = height(w); float d = distance(w, uP); float push = smoothstep(4.0, 0.0, d); h += push*1.2; vPush = push; p.y = h; vH = h; vPos = p; vec4 mv = modelViewMatrix*vec4(p,1.0); vFog = -mv.z; gl_Position = projectionMatrix*mv; }`;
  const fragSolid = `
    uniform vec3 uFog; uniform float uNear, uFar; varying float vH; varying vec3 vPos; varying float vFog; varying float vPush;
    void main(){ float c = fract(vH*2.2); float line = smoothstep(0.0, 0.06, c) * (1.0 - smoothstep(0.06, 0.12, c)); float lineFar = smoothstep(0.0,0.03,c)*(1.0-smoothstep(0.03,0.06,c));
      vec3 base = mix(vec3(0.045,0.045,0.05), vec3(0.12,0.12,0.13), smoothstep(-1.0, 2.5, vH));
      vec3 red = vec3(1.0, 0.14, 0.22); vec3 col = base + red*line*0.9*smoothstep(0.2, 2.2, vH) + vec3(1.0)*lineFar*0.18 + red*vPush*0.8;
      float f = smoothstep(uNear, uFar, vFog); col = mix(col, uFog, f); gl_FragColor = vec4(col, 1.0); }`;
  const solid = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: fragSolid })); scene.add(solid);
  const wire = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: `uniform vec3 uFog; uniform float uNear,uFar; varying float vFog; varying float vH; void main(){ float f = smoothstep(uNear, uFar*0.8, vFog); gl_FragColor = vec4(mix(vec3(1.0), uFog, f), (1.0-f)*0.08); }`, wireframe: true, transparent: true, depthWrite: false })); wire.position.y = .01; scene.add(wire);
  // sky glow line at horizon
  const horizon = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: {}, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vUv; void main(){ float a = exp(-abs(vUv.y-0.32)*9.0)*0.35; gl_FragColor = vec4(1.0,0.14,0.22,a); }' })); horizon.position.set(0, 2, -34); scene.add(horizon);

  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const hit = new THREE.Vector3();
  let camX = 0, camY = 3.2;
  function render(state) {
    const p = state.progress, dt = state.dt, t = state.t;
    uniforms.uT.value = t; uniforms.uOff.value = t * .8 + p * 18;
    camX = damp(camX, (env.finePointer ? state.global.nx : Math.sin(t * .15)) * 2.5, 2, dt); camY = damp(camY, 3.4 + (env.finePointer ? state.global.ny : 0) * .8 - p * 1.2, 2, dt);
    camera.position.set(camX, camY, 10); camera.lookAt(camX * .4, 1.2 - p * .6, -8); camera.rotation.z = -camX * .02;
    if (state.pointer.inside) { ndc.set(state.pointer.x, state.pointer.y); ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(plane, hit)) uniforms.uP.value.set(hit.x, hit.z + uniforms.uOff.value); } else uniforms.uP.value.set(100, 100);
    renderer.render(scene, camera);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() { disposeAll(scene, renderer); }
  return { render, resize, dispose };
}
