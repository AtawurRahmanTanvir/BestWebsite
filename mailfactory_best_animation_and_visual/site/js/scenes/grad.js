/* Pointer-interactive gradients: plain WebGL, one fragment shader each, no three.js. */

const COMMON = `
precision highp float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_pointer; uniform float u_vel; uniform float u_progress; uniform vec3 u_trail[8];
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for(int i=0;i<4;i++){ v += a*noise(p); p = m*p; a *= 0.5; } return v; }
vec2 uvA(){ vec2 uv = gl_FragCoord.xy / u_res; uv.x *= u_res.x/u_res.y; return uv; }
vec2 ptA(){ vec2 p = u_pointer; p.x *= u_res.x/u_res.y; return p; }
`;

const SHADERS = {
  ember: `void main(){ vec2 uv = uvA(); vec2 p = ptA(); float d = distance(uv, p);
    float heat = smoothstep(0.9, 0.0, d) * (0.6 + u_vel*2.0);
    vec2 q = uv*2.2; q.y -= u_time*0.12*(1.0+heat); float n = fbm(q + noise(q*1.7 + u_time*0.05)*0.8);
    float embers = smoothstep(0.48, 0.92, n) * (0.55 + heat);
    vec3 base = vec3(0.02, 0.018, 0.02);
    vec3 red = vec3(0.92, 0.05, 0.12); vec3 hot = vec3(1.0, 0.55, 0.3);
    vec3 col = base + red*embers*1.1 + hot*pow(embers, 3.0)*1.4;
    col += red * exp(-d*d*6.0) * 0.18 * (0.8 + 0.2*sin(u_time*2.0));
    float grain = (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.04; col += grain;
    gl_FragColor = vec4(col, 1.0); }`,

  beam: `void main(){ vec2 uv = uvA(); vec2 p = ptA(); float aspect = u_res.x/u_res.y;
    vec2 src = vec2(p.x, 1.35); vec2 d = uv - src; float ang = atan(d.x, -d.y); float len = length(d);
    float pang = (p.x - uv.x) * 0.0;
    float beam = smoothstep(0.55, 0.0, abs(ang)) ; beam *= smoothstep(1.6, 0.2, len);
    float dust = fbm(vec2(ang*3.0, len*2.5 - u_time*0.25)); beam *= 0.55 + dust*0.9;
    float core = smoothstep(0.12, 0.0, abs(ang)) * smoothstep(1.2, 0.0, len);
    vec3 col = vec3(0.01);
    col += vec3(1.0, 0.16, 0.24) * beam * 0.55; col += vec3(1.0) * core * 0.35 * (0.7 + u_vel*3.0);
    float floorGlow = exp(-pow((uv.y - 0.05)*4.0, 2.0)) * smoothstep(0.8, 0.0, abs(uv.x - p.x)); col += vec3(1.0, 0.3, 0.35) * floorGlow * 0.25;
    col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.03;
    gl_FragColor = vec4(col, 1.0); }`,

  ink: `void main(){ vec2 uv = uvA(); float ink = 0.0;
    for(int i=0;i<8;i++){ vec3 t = u_trail[i]; if(t.z < 0.0) continue; vec2 tp = vec2(t.x*(u_res.x/u_res.y), t.y); float age = t.z; float r = 0.05 + age*0.35; float d = distance(uv, tp); float edge = fbm(uv*9.0 + float(i)*3.1 + age*0.3)*0.12; ink += smoothstep(r + edge, r*0.3, d) * exp(-age*0.9); }
    float bg = fbm(uv*3.0 + u_time*0.03)*0.08;
    vec3 paper = vec3(0.035, 0.035, 0.04) + bg;
    vec3 col = mix(paper, vec3(0.93, 0.93, 0.95), clamp(ink, 0.0, 1.0));
    float edgeRed = smoothstep(0.02, 0.0, abs(ink - 0.5)) * 0.8; col = mix(col, vec3(1.0, 0.1, 0.18), edgeRed*step(0.05, ink));
    gl_FragColor = vec4(col, 1.0); }`,

  caustic: `void main(){ vec2 uv = uvA(); vec2 p = ptA(); float t = u_time*0.35;
    vec2 q = uv*3.2; float c = 0.0; for(int i=0;i<4;i++){ float fi = float(i); q += vec2(sin(q.y*1.7 + t + fi), cos(q.x*1.5 - t*1.2 + fi))*0.35; c += 1.0/(1.0 + 24.0*abs(sin(q.x + q.y + t*0.7))); }
    c = pow(c/4.0, 1.6);
    float d = distance(uv, p); float spot = exp(-d*d*4.0) * (0.6 + u_vel*3.0);
    vec3 col = vec3(0.02, 0.02, 0.022) + vec3(1.0, 0.16, 0.24) * c * (0.35 + spot*1.2) + vec3(1.0) * c*c * spot * 0.6;
    gl_FragColor = vec4(col, 1.0); }`,

  metal: `void main(){ vec2 uv = uvA(); vec2 p = ptA();
    float brush = noise(vec2(uv.x*2.0, uv.y*900.0)) * 0.5 + noise(vec2(uv.x*7.0, uv.y*300.0))*0.5;
    float band = uv.x - p.x; float hi = exp(-band*band*9.0) * 0.9 + exp(-band*band*1.2)*0.25;
    float shade = 0.05 + hi*0.26 + brush*0.05;
    vec3 col = vec3(shade) * vec3(0.98, 0.98, 1.0);
    float redline = exp(-pow((uv.y - p.y)*30.0, 2.0)) * 0.3 * hi; col += vec3(1.0, 0.15, 0.22) * redline;
    col *= 0.85 + 0.15*smoothstep(1.4, 0.0, distance(uv, p));
    gl_FragColor = vec4(col, 1.0); }`,

  paper: `void main(){ vec2 uv = uvA(); vec2 p = ptA();
    float grain = noise(gl_FragCoord.xy*0.9)*0.06 + noise(uv*40.0)*0.04;
    float shade = 1.0 - 0.10*smoothstep(1.3, 0.0, distance(uv, p + vec2(0.15, -0.2)));
    float fold = fbm(uv*2.0 + u_time*0.02); shade -= (fold-0.5)*0.08;
    vec3 col = vec3(0.945, 0.937, 0.92) * shade - grain*0.5;
    float ring = smoothstep(0.012, 0.0, abs(distance(uv, p) - 0.16 - u_vel*0.6)) * 0.35 * (0.3 + u_vel*3.0); col = mix(col, vec3(0.9, 0.08, 0.15), ring);
    gl_FragColor = vec4(col, 1.0); }`,

  spark: `void main(){ vec2 uv = uvA(); vec2 p = ptA(); vec3 col = vec3(0.01);
    for(int i=0;i<8;i++){ vec3 t = u_trail[i]; if(t.z < 0.0) continue; vec2 tp = vec2(t.x*(u_res.x/u_res.y), t.y); float age = t.z;
      for(int k=0;k<6;k++){ float fk = float(k) + float(i)*6.0; vec2 dir = vec2(hash(vec2(fk, 1.0))-0.5, hash(vec2(fk, 2.0))-0.2) * 1.6; vec2 sp = tp + dir*age*0.8 + vec2(0.0, -age*age*0.5); float d = distance(uv, sp); float s = 0.0035/(d+0.002) * exp(-age*1.6); col += vec3(1.0, 0.35 + 0.4*hash(vec2(fk,3.0)), 0.3) * s; } }
    float d = distance(uv, p); col += vec3(1.0, 0.14, 0.22) * exp(-d*d*30.0) * 0.5;
    float base = fbm(uv*3.0 - u_time*0.05); col += vec3(0.05, 0.02, 0.025)*base;
    gl_FragColor = vec4(col, 1.0); }`,

  haze: `void main(){ vec2 uv = uvA(); vec2 p = ptA();
    float h = fbm(uv*1.8 + vec2(u_time*0.04, -u_time*0.02)); h = smoothstep(0.25, 0.8, h);
    float clear = smoothstep(0.9, 0.0, distance(uv, p)) * (0.6 + u_vel*2.0);
    h *= 1.0 - clear*0.8;
    vec3 col = mix(vec3(0.03, 0.03, 0.035), vec3(0.42, 0.42, 0.46), h);
    col += vec3(1.0, 0.14, 0.22) * clear * 0.12 * h;
    gl_FragColor = vec4(col, 1.0); }`,

  water: `void main(){ vec2 uv = uvA(); float wave = 0.0;
    for(int i=0;i<8;i++){ vec3 t = u_trail[i]; if(t.z < 0.0) continue; vec2 tp = vec2(t.x*(u_res.x/u_res.y), t.y); float d = distance(uv, tp); float r = t.z*0.5; wave += sin((d - r)*60.0) * exp(-abs(d - r)*18.0) * exp(-t.z*1.2); }
    float base = fbm(uv*3.0 + vec2(u_time*0.06, u_time*0.03)) ;
    float light = smoothstep(0.35, 0.65, base + wave*0.15);
    vec3 col = mix(vec3(0.02, 0.02, 0.024), vec3(0.10, 0.10, 0.12), light);
    col += vec3(1.0, 0.16, 0.24) * pow(max(wave, 0.0), 1.5) * 0.9 + vec3(1.0) * pow(max(wave, 0.0), 4.0)*0.6;
    gl_FragColor = vec4(col, 1.0); }`,

  smoke: `void main(){ vec2 uv = uvA(); vec2 p = ptA();
    vec2 q = uv*1.6; q.y -= u_time*0.08; vec2 warp = vec2(fbm(q + u_time*0.05), fbm(q + 5.0));
    float push = smoothstep(0.8, 0.0, distance(uv, p)); q += (uv - p) * push * 0.6;
    float s = fbm(q + warp*1.2);
    s = smoothstep(0.3, 0.85, s) * (1.0 - push*0.5);
    vec3 col = mix(vec3(0.02), vec3(0.26, 0.26, 0.28), s);
    col += vec3(1.0, 0.14, 0.22) * push * s * 0.35;
    gl_FragColor = vec4(col, 1.0); }`,
};

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export async function create({ canvas, name, quality, env, width, height }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl');
  const src = SHADERS[name] || SHADERS.ember;
  const compile = (type, s) => { const sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(name + ': ' + gl.getShaderInfoLog(sh)); return sh; };
  const prog = gl.createProgram(); gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, COMMON + src)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('u_res'), uTime = U('u_time'), uPtr = U('u_pointer'), uVel = U('u_vel'), uProg = U('u_progress'), uTrail = U('u_trail[0]');
  const scale = quality.tier === 2 ? 0.6 : 0.45;
  let px = .5, py = .5, vel = 0, lastX = .5, lastY = .5;
  const trail = new Float32Array(24).fill(-1); let trailHead = 0; let lastDrop = 0;
  function resize(w, h) { canvas.width = Math.max(2, Math.round(w * scale * Math.min(quality.dpr, 1.5))); canvas.height = Math.max(2, Math.round(h * scale * Math.min(quality.dpr, 1.5))); gl.viewport(0, 0, canvas.width, canvas.height); }
  resize(width, height);
  function render(state) {
    const dt = state.dt;
    const tx = state.pointer.inside ? (state.pointer.x + 1) / 2 : 0.5 + Math.sin(state.t * .23) * .25;
    const ty = state.pointer.inside ? (state.pointer.y + 1) / 2 : 0.5 + Math.cos(state.t * .19) * .2;
    px += (tx - px) * (1 - Math.exp(-dt * 6)); py += (ty - py) * (1 - Math.exp(-dt * 6));
    const v = Math.hypot(px - lastX, py - lastY) / Math.max(dt, .001); vel += (Math.min(v, 3) * .25 - vel) * (1 - Math.exp(-dt * 5)); lastX = px; lastY = py;
    // ripple/ink/spark trail
    for (let i = 0; i < 8; i++) if (trail[i * 3 + 2] >= 0) { trail[i * 3 + 2] += dt; if (trail[i * 3 + 2] > 3.5) trail[i * 3 + 2] = -1; }
    if (state.t - lastDrop > (state.pointer.inside ? .14 : .9) && (state.pointer.inside || !env.reduced)) { lastDrop = state.t; trail[trailHead * 3] = px; trail[trailHead * 3 + 1] = py; trail[trailHead * 3 + 2] = 0; trailHead = (trailHead + 1) % 8; }
    gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uTime, state.t); gl.uniform2f(uPtr, px, py); gl.uniform1f(uVel, vel); gl.uniform1f(uProg, state.progress); gl.uniform3fv(uTrail, trail);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function dispose() { gl.deleteProgram(prog); gl.deleteBuffer(buf); const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); }
  return { render, resize, dispose };
}
