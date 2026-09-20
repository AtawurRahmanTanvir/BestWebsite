/* ============================================================
   MAIL FACTORY — INTERACTIVE GRADIENT LAYER
   Raw WebGL (no three.js). ~4KB runtime. Pointer-reactive,
   paused off-screen, DPR-clamped, reduced-motion aware.
   8 distinct shader moments: spotlight, aurora, caustic, heat,
   ink, chrome, signal, ember.
   ============================================================ */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const HEAD = `precision highp float;
uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;uniform float u_e;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
vec3 dither(vec3 c,vec2 sc){return c+ (hash(sc)-.5)/255.;}
`;

/* ── g1 SPOTLIGHT — pointer torch over a dark technical field ── */
const F_SPOTLIGHT = HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy; vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  float d=length(st-m);
  float torch=exp(-d*1.9)*(.55+.45*u_e);
  float g=0.;
  float gs=28.;
  vec2 gr=abs(fract(uv*vec2(gs*u_res.x/u_res.y,gs))-.5);
  g=smoothstep(.47,.5,max(gr.x,gr.y))*.16;
  float drift=fbm(st*1.6+vec2(u_t*.035,-u_t*.02));
  vec3 base=vec3(.016,.017,.021)+drift*.022;
  vec3 red=vec3(.91,.07,.18);
  vec3 col=base+g*vec3(.1,.1,.13)*(.3+torch*2.4);
  col+=red*torch*.42;
  col+=red*exp(-d*7.)*.3;
  float vig=smoothstep(1.25,.25,length(st));
  col*=vig;
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g2 AURORA — slow vertical light curtains ── */
const F_AURORA = HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy; vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  float t=u_t*.08;
  float w=0.;
  for(int i=0;i<4;i++){
    float fi=float(i);
    float x=st.x*(1.1+fi*.35)+sin(t+fi*1.7)*.4+m.x*.18;
    float band=fbm(vec2(x*1.4,st.y*.7-t*.6+fi));
    float curtain=exp(-pow(abs(st.y-(band-.5)*1.5+.1),1.4)*(2.4+fi*.6));
    w+=curtain*(.3-fi*.045);
  }
  vec3 c1=vec3(.85,.06,.16), c2=vec3(.16,.18,.3), c3=vec3(.98,.42,.35);
  vec3 col=vec3(.01,.011,.014);
  col+=mix(c2,c1,smoothstep(0.,.35,w))*w*1.5;
  col+=c3*pow(w,3.)*.5;
  col+=c1*exp(-length(st-m)*3.5)*.1*(.4+u_e);
  col*=smoothstep(1.3,.2,length(st*vec2(.7,1.)));
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g3 CAUSTIC — refracted light sheet ── */
const F_CAUSTIC = HEAD + `
void main(){
  vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  vec2 p=st*2.6; float t=u_t*.13;
  vec2 q=p+vec2(m.x*.5,m.y*.5);
  float acc=0.;
  for(int i=0;i<6;i++){
    float fi=float(i)+1.;
    q+=vec2(sin(q.y*1.6+t*fi*.4),cos(q.x*1.5-t*fi*.35))*.34;
    acc+=1./(abs(sin(q.x*1.2)*sin(q.y*1.2))*6.+1.4);
  }
  acc/=6.;
  float c=pow(acc,2.3);
  vec3 col=vec3(.012,.013,.016);
  col+=vec3(.55,.58,.66)*c*.42;
  col+=vec3(.92,.1,.2)*pow(c,2.2)*.75*(.5+.5*u_e);
  col*=smoothstep(1.35,.15,length(st));
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g4 HEAT — bloom that follows pointer with inertia ── */
const F_HEAT = HEAD + `
void main(){
  vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  float t=u_t*.2;
  float n=fbm(st*2.2+vec2(0,-t*1.2));
  vec2 warp=st+vec2(n-.5,0)*.22;
  float d=length(warp-m);
  float core=exp(-d*3.2);
  float halo=exp(-d*1.05);
  vec3 col=vec3(.013,.013,.016);
  col+=vec3(.95,.13,.22)*core*(.75+.6*u_e);
  col+=vec3(.5,.06,.12)*halo*.4;
  col+=vec3(1.,.72,.55)*pow(core,3.4)*.55;
  col+=n*.02;
  col*=smoothstep(1.4,.2,length(st));
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g5 INK — diffusion in dark water ── */
const F_INK = HEAD + `
void main(){
  vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  float t=u_t*.055;
  vec2 p=st*1.5;
  float f1=fbm(p+vec2(t,t*.7));
  float f2=fbm(p*1.7-vec2(t*.8,t*1.3)+f1*.8);
  float f3=fbm(p*.8+f2*1.1+vec2(-t*.5,t*.3));
  float ink=smoothstep(.34,.72,f3);
  float edge=smoothstep(.3,.46,f3)-smoothstep(.5,.66,f3);
  vec3 col=vec3(.9,.9,.93)*0.;
  col+=vec3(.028,.03,.036)*(1.-ink);
  col+=vec3(.07,.075,.09)*ink;
  col+=vec3(.86,.09,.19)*edge*.55;
  col+=vec3(.9,.12,.22)*exp(-length(st-m)*4.)*.16*(.4+u_e);
  col*=smoothstep(1.4,.3,length(st))*.95+.05;
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g6 CHROME — brushed metal sweep, near-monochrome ── */
const F_CHROME = HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;
  vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  float t=u_t*.1;
  float brush=noise(vec2(st.x*260.,st.y*3.))*.055;
  float ang=st.x*1.1+st.y*.45;
  float band=sin(ang*3.2+t*1.4+m.x*1.3)*.5+.5;
  band=pow(band,2.6);
  float band2=sin(ang*7.1-t*2.1+m.y*.9)*.5+.5;
  vec3 col=vec3(.04,.042,.05);
  col+=vec3(.38,.4,.45)*band*.72;
  col+=vec3(.75,.77,.82)*pow(band,5.)*.55;
  col+=vec3(.16,.17,.2)*band2*.2;
  col+=vec3(.8,.1,.18)*pow(band,9.)*.85*u_e;
  col+=brush;
  col*=smoothstep(1.5,.1,length(st*vec2(.85,1.)));
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g7 SIGNAL — scanning data field, technical ── */
const F_SIGNAL = HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/u_res.xy;
  vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=u_m/u_res;
  float t=u_t;
  float cell=54.;
  vec2 gid=floor(uv*vec2(cell*u_res.x/u_res.y,cell));
  float r=hash(gid);
  float blink=step(.9915,fract(r+t*.055))*.5;
  float scan=exp(-abs(fract(uv.y*1.0-t*.05)-.5)*16.);
  float hline=smoothstep(.988,1.,fract(uv.y*cell));
  float vline=smoothstep(.988,1.,fract(uv.x*cell*u_res.x/u_res.y));
  float grid=max(hline,vline)*.055;
  float pd=length(uv-m)*1.4;
  float probe=exp(-pd*5.5);
  vec3 col=vec3(.009,.0095,.012);
  col+=vec3(.09,.1,.12)*grid*(.5+probe*1.6);
  col+=vec3(.9,.1,.2)*blink*(.12+probe*1.1);
  col+=vec3(.42,.46,.54)*scan*.05;
  col+=vec3(.85,.12,.2)*probe*.1;
  /* keep the centre quiet so content stays legible */
  col*=mix(.32,1.,smoothstep(.12,.62,length(st*vec2(.82,1.))));
  col*=smoothstep(1.55,.2,length(st));
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

/* ── g8 EMBER — final warm drift ── */
const F_EMBER = HEAD + `
void main(){
  vec2 st=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  vec2 m=(u_m-.5*u_res)/u_res.y;
  float t=u_t*.09;
  float acc=0.;
  for(int i=0;i<3;i++){
    float fi=float(i);
    vec2 q=st*(1.+fi*.7)+vec2(sin(t*(1.+fi*.3))*.3,t*(.35+fi*.15));
    acc+=fbm(q)*(.5-fi*.12);
  }
  float glow=exp(-length(st-m*.6)*1.5);
  vec3 col=vec3(.012,.012,.015);
  col+=vec3(.85,.1,.2)*pow(acc,2.6)*1.5;
  col+=vec3(1.,.55,.3)*pow(acc,6.)*.9;
  col+=vec3(.7,.08,.16)*glow*.28*(.5+.5*u_e);
  col*=smoothstep(1.45,.15,length(st));
  gl_FragColor=vec4(dither(col,gl_FragCoord.xy),1.);
}`;

export const GRADIENTS = {
  spotlight: F_SPOTLIGHT, aurora: F_AURORA, caustic: F_CAUSTIC, heat: F_HEAT,
  ink: F_INK, chrome: F_CHROME, signal: F_SIGNAL, ember: F_EMBER
};

function compile(gl, type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    console.warn('[gradient] shader:', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null;
  }
  return s;
}

export class GradientLayer{
  constructor(canvas, name, opts = {}){
    this.canvas = canvas; this.name = name;
    this.reduced = opts.reduced || false;
    this.maxDpr = opts.maxDpr || 1.6;
    this.ok = false; this.running = false; this.t = 0; this.energy = 0; this.energyT = 0;
    this.m = [0.5, 0.5]; this.mT = [0.5, 0.5]; this.raf = 0; this.last = 0;
    this.init();
  }
  init(){
    const gl = this.canvas.getContext('webgl', {
      alpha:false, antialias:false, depth:false, stencil:false,
      powerPreference:'low-power', preserveDrawingBuffer:false
    });
    if(!gl) return;
    this.gl = gl;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, GRADIENTS[this.name] || GRADIENTS.spotlight);
    if(!vs || !fs) return;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr, gl.LINK_STATUS)){ console.warn('[gradient] link fail'); return; }
    gl.useProgram(pr); this.pr = pr;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {
      res: gl.getUniformLocation(pr, 'u_res'),
      t:   gl.getUniformLocation(pr, 'u_t'),
      m:   gl.getUniformLocation(pr, 'u_m'),
      e:   gl.getUniformLocation(pr, 'u_e')
    };
    this.buf = buf; this.vs = vs; this.fs = fs;
    this.ok = true;
    this.resize();
    this.bind();
    this.draw(performance.now(), true); // one static frame immediately
  }
  bind(){
    const el = this.canvas.parentElement || this.canvas;
    this._move = (e)=>{
      const r = this.canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
      this.mT = [x, y]; this.energyT = 1;
      clearTimeout(this._et);
      this._et = setTimeout(()=>{ this.energyT = 0; }, 900);
    };
    el.addEventListener('pointermove', this._move, {passive:true});
    this._el = el;
  }
  resize(){
    if(!this.ok) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if(this.canvas.width !== w || this.canvas.height !== h){
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }
  draw(now, force){
    const gl = this.gl;
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    if(!this.reduced || force) this.t += dt;
    this.m[0] += (this.mT[0] - this.m[0]) * Math.min(1, dt * 4.2);
    this.m[1] += (this.mT[1] - this.m[1]) * Math.min(1, dt * 4.2);
    this.energy += (this.energyT - this.energy) * Math.min(1, dt * 2.6);
    gl.useProgram(this.pr);
    gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.t, this.t);
    gl.uniform2f(this.u.m, this.m[0] * this.canvas.width, this.m[1] * this.canvas.height);
    gl.uniform1f(this.u.e, this.energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  start(){
    if(!this.ok || this.running) return;
    if(this.reduced){ this.resize(); this.draw(performance.now(), true); return; }
    this.running = true; this.last = performance.now();
    const loop = (now)=>{ if(!this.running) return; this.draw(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  stop(){ this.running = false; if(this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  dispose(){
    this.stop();
    if(this._el && this._move) this._el.removeEventListener('pointermove', this._move);
    if(!this.gl) return;
    const gl = this.gl;
    try{
      gl.deleteBuffer(this.buf); gl.deleteProgram(this.pr);
      gl.deleteShader(this.vs); gl.deleteShader(this.fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }catch(e){}
    this.ok = false;
  }
}
