/* Adapted from icelolan-ai/Nava-art index.html, main: 142483255861e1f6646af2fc6fdf357abb91a457.
 * Nava's stable-fluid shaders, pressure/advection/vorticity/tension solver,
 * ripple splats, Verlet water brush and particle interactions. Renderer and
 * persistence adapters are Cerebra-specific. No second WebGL context/WebGPU.
 */
(() => {
  window.CerebraNavaWater = function(T, renderer, settings) {
    let state=settings, freezeProgress=0, obstacle={x:0,y:0,r:0}, collisionMap=null;
    const textures=[];
    const fluidCanvas={width:1,height:1};
    const assign=(slot,...values)=>{if(values.length===1)slot.value=values[0];else slot.value=values.length===2?new T.Vector2(...values):values.length===3?new T.Vector3(...values):new T.Vector4(...values)};
const BASE_VS = `
precision highp float;

varying vec2 vUv;
varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform vec2 texel;
void main(){
  vUv = position.xy*0.5+0.5;
  vL = vUv - vec2(texel.x, 0.0);
  vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y);
  vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FS_SPLAT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
uniform float mixMode; // 0 = additive (velocity), 1 = blend toward color, bounded (dye/paint)
uniform float sharpness; // reshapes the edge: <1 = soft/wispy, >1 = crisp/sharp
void main(){
  vec2 p = vUv - point;
  p.x *= aspect;
  float d = exp(-dot(p,p)/radius);
  d = pow(clamp(d,0.0,1.0), sharpness);
  vec3 base = texture2D(uTarget, vUv).xyz;
  vec3 result = mixMode > 0.5 ? mix(base, color, clamp(d,0.0,1.0)) : base + d*color;
  gl_FragColor = vec4(result, 1.0);
}`;

const FS_ADVECT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texel;
uniform float dt;
uniform float dissipation;
uniform vec3 obstacle;uniform float aspect;uniform float dyePass;uniform sampler2D collisionMap;uniform float meshCollision;
void main(){
  vec2 vel = texture2D(uVelocity, vUv).xy;
  vec2 coord = vUv - dt*vel*texel*20.0;
  if(dyePass>.5&&obstacle.z>0.){
    vec2 here=(vUv-obstacle.xy)*vec2(aspect,1.);if(length(here)<obstacle.z){gl_FragColor=vec4(0.);return;}
    vec2 from=(coord-obstacle.xy)*vec2(aspect,1.);float d=length(from);
    if(d<obstacle.z)coord=obstacle.xy+normalize(from+vec2(.00001))*(obstacle.z+texel.y*2.)/vec2(aspect,1.);
  }
  if(dyePass>.5&&meshCollision>.5){
    if(texture2D(collisionMap,vUv).r>.5){gl_FragColor=vec4(0.);return;}
    // Never backtrace through a solid: keep the incoming colour outside it.
    for(int i=1;i<=6;i++){vec2 q=mix(vUv,coord,float(i)/6.);if(texture2D(collisionMap,q).r>.5){coord=mix(vUv,coord,float(i-1)/6.);break;}}
  }
  vec4 result = texture2D(uSource, clamp(coord,vec2(0.),vec2(1.)));
  gl_FragColor = dissipation * result;
}`;

const FS_DIVERGENCE = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  float div = 0.5*(R-L+T-B);
  gl_FragColor = vec4(div,0.0,0.0,1.0);
}`;

const FS_CURL = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vort = 0.5*(R-L-T+B);
  gl_FragColor = vec4(vort,0.0,0.0,1.0);
}`;

const FS_VORTICITY = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curlAmount;
uniform float dt;
void main(){
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5*vec2(abs(T)-abs(B), abs(R)-abs(L));
  force /= (length(force)+0.0001);
  force *= curlAmount*C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  // Bound confinement acceleration and speed so a high curl cannot feed back indefinitely.
  force *= min(1.0, 30.0 / max(length(force), 0.0001));
  vel += force*dt;
  vel *= min(1.0, 40.0 / max(length(vel), 0.0001));
  gl_FragColor = vec4(vel,0.0,1.0);
}`;

const FS_PRESSURE = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main(){
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float div = texture2D(uDivergence, vUv).x;
  float p = (L+R+B+T-div)*0.25;
  gl_FragColor = vec4(p,0.0,0.0,1.0);
}`;

const FS_GRADIENT = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  vel -= vec2(R-L, T-B);
  gl_FragColor = vec4(vel,0.0,1.0);
}`;

const FS_CLEAR = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }`;

/* Reflective wall for the velocity field. Any flow heading OUT through the
   frame gets reversed (with energy loss), so fluid genuinely bounces back
   inside instead of merely being slowed down and eventually leaking out.
   Inward flow is left untouched, so paint can still move freely. */
/* Realistic water: surface tension. Compares each point's paint density to
   its neighbours — dense cores pull inward and bead up into cohesive blobs,
   while thin films at the edges get pushed outward, so a stream hitting a
   pool visibly splashes apart instead of just smearing. */
const FS_TENSION = `
precision highp float;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform float cohesion;
uniform float splash;
uniform float dt;
float lum(vec3 c){ return max(c.r, max(c.g, c.b)); }
void main(){
  float L = lum(texture2D(uDye, vL).rgb);
  float R = lum(texture2D(uDye, vR).rgb);
  float T = lum(texture2D(uDye, vT).rgb);
  float B = lum(texture2D(uDye, vB).rgb);
  float C = lum(texture2D(uDye, vUv).rgb);

  // gradient points toward denser paint; curvature tells surface vs. core
  vec2 grad = vec2(R-L, T-B) * 0.5;
  float curvature = (L + R + T + B) - 4.0*C;

  vec2 vel = texture2D(uVelocity, vUv).xy;

  // cohesion: drift toward denser neighbours so droplets merge and bead
  if(C > 0.01) vel += grad * cohesion * C * dt * 60.0;

  // splash: where paint is piling up (negative curvature) push outward.
  // Guarded by the gradient length — normalising a near-zero gradient used to
  // return a fixed diagonal, which pushed the whole canvas one way like wind.
  float gradLen = length(grad);
  if(gradLen > 0.002){
    float pileUp = max(0.0, -curvature) * C;
    vel -= (grad / gradLen) * pileUp * splash * dt * 60.0;
  }

  vel = clamp(vel, -600.0, 600.0);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}`;

const FS_MASK = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float margin;
void main(){
  vec4 c = texture2D(uTexture, vUv);
  vec2 v = c.xy;
  // Outward flow is fully stopped (not just reflected) — a reflected
  // current still leaked when Ambient Flow kept re-driving it outward.
  const float bounce = 0.0;
  if(vUv.x < margin       && v.x < 0.0) v.x = -v.x * bounce;
  if(vUv.x > 1.0 - margin && v.x > 0.0) v.x = -v.x * bounce;
  if(vUv.y < margin       && v.y < 0.0) v.y = -v.y * bounce;
  if(vUv.y > 1.0 - margin && v.y > 0.0) v.y = -v.y * bounce;
  gl_FragColor = vec4(v, c.zw);
}`;


// Preserve Nava's dye intensity and highlight rolloff. Studio owns the
// background; alpha is coverage, not an extra 1.6x colour gain or edge light.
// A screen-space solid boundary for Studio's projected Cerebra sphere.
const FS_OBSTACLE = `precision highp float;varying vec2 vUv;uniform sampler2D uTexture;uniform vec3 obstacle;uniform float aspect;uniform vec2 texel;uniform float bounce;uniform sampler2D collisionMap;uniform float meshCollision;uniform float spread;
void main(){vec4 c=texture2D(uTexture,vUv);vec2 n=vec2(0.);float inside=0.,edge=0.;
if(meshCollision>.5){inside=texture2D(collisionMap,vUv).r;vec2 e=texel*2.;float l=texture2D(collisionMap,vUv-vec2(e.x,0.)).r,r=texture2D(collisionMap,vUv+vec2(e.x,0.)).r;
float b=texture2D(collisionMap,vUv-vec2(0.,e.y)).r,t=texture2D(collisionMap,vUv+vec2(0.,e.y)).r;n=vec2(l-r,b-t);edge=step(.01,length(n));n/=max(length(n),.00001);}
else if(obstacle.z>0.){vec2 d=(vUv-obstacle.xy)*vec2(aspect,1.);float r=length(d);inside=1.-step(obstacle.z,r);edge=1.-step(obstacle.z+texel.y*3.,r);n=d/max(r,.00001);}
if(inside>.5)c.xy=vec2(0.);else if(edge>.5){float inward=dot(c.xy,n);if(inward<0.){c.xy-=(1.+bounce)*inward*n;vec2 tangent=vec2(-n.y,n.x);float side=dot(c.xy,tangent);c.xy+=tangent*sign(side+.00001)*min(-inward*spread,8.);}}
gl_FragColor=c;}`;
const IMPACT = `precision highp float;varying vec2 vUv;uniform sampler2D uTexture;uniform sampler2D collisionMap;uniform vec2 texel;
void main(){if(texture2D(collisionMap,vUv).r<.5){gl_FragColor=vec4(0.);return;}vec3 col=vec3(0.);for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){vec2 q=vUv+vec2(float(x),float(y))*texel*2.;if(texture2D(collisionMap,q).r<.5)col=max(col,texture2D(uTexture,q).rgb);}}gl_FragColor=vec4(col,1.);}`;
const DISPLAY = `precision highp float;varying vec2 vUv;uniform sampler2D uDye;uniform float clarity;uniform float glowAmount;uniform float opacity;
void main(){vec3 dye=max(texture2D(uDye,vUv).rgb,vec3(0.));
float detail=clamp((clarity-1.)/4.,0.,1.);vec3 col=mix(dye,smoothstep(.16,.82,dye),detail*.75);
float peak=max(col.r,max(col.g,col.b));if(peak<.001){gl_FragColor=vec4(0.);return;}
col*=glowAmount;peak=max(col.r,max(col.g,col.b));col/=1.+max(peak-.8,0.)*2.6;
float coverage=clamp(max(col.r,max(col.g,col.b)),0.,1.);if(coverage<.001){gl_FragColor=vec4(0.);return;}gl_FragColor=vec4(col/coverage,coverage*opacity);}`;
const PACK = `precision highp float;varying vec2 vUv;uniform sampler2D uTexture;void main(){vec2 v=texture2D(uTexture,vUv).xy;gl_FragColor=vec4(clamp(v/80.+128./255.,0.,1.),0.,1.);}`;
const UNPACK = `precision highp float;varying vec2 vUv;uniform sampler2D uTexture;void main(){vec2 v=texture2D(uTexture,vUv).xy;gl_FragColor=vec4((v-128./255.)*80.,0.,1.);}`;
const scene=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial());quad.frustumCulled=false;scene.add(quad);
const materials=[];
function program(fragment){const uniforms={};for(const match of (BASE_VS+fragment).matchAll(/uniform\s+(sampler2D|float|vec2|vec3|vec4)\s+(\w+)\s*;/g))uniforms[match[2]]={value:match[1]==='vec2'?new T.Vector2():match[1]==='vec3'?new T.Vector3():match[1]==='vec4'?new T.Vector4():match[1]==='sampler2D'?null:0};
const material=new T.ShaderMaterial({uniforms,vertexShader:BASE_VS,fragmentShader:fragment,depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});materials.push(material);return {material,uniforms};}
class FluidSim {
 constructor(){
  const gl=renderer.getContext();if(!(gl instanceof WebGL2RenderingContext)||!gl.getExtension('EXT_color_buffer_float'))throw Error('Water Lab needs floating-point WebGL2 render targets.');
  const compact=Math.min(innerWidth,innerHeight)<900;
  this.type=T.HalfFloatType;this.simRes=compact?96:128;this.dyeRes=compact?384:512;
  for(const [key,shader] of Object.entries({Splat:FS_SPLAT,Advect:FS_ADVECT,Div:FS_DIVERGENCE,Curl:FS_CURL,Vort:FS_VORTICITY,Pressure:FS_PRESSURE,Gradient:FS_GRADIENT,Clear:FS_CLEAR,Mask:FS_MASK,Tension:FS_TENSION,Display:DISPLAY,Impact:IMPACT,Obstacle:FS_OBSTACLE,Pack:PACK,Unpack:UNPACK}))this['prog'+key]=program(shader);
 }
 createFBO(w,h,type=this.type){const rt=new T.WebGLRenderTarget(w,h,{type,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false,stencilBuffer:false});rt.texture.generateMipmaps=false;rt.texture.colorSpace=T.NoColorSpace;return{rt,tex:rt.texture,w,h,texel:[1/w,1/h]};}
 createDoubleFBO(w,h){return{a:this.createFBO(w,h),b:this.createFBO(w,h),swap(){const t=this.a;this.a=this.b;this.b=t}};}
 bindQuad(p,texel){quad.material=p.material;if(p.uniforms.texel&&texel)assign(p.uniforms.texel,...texel);}
 draw(target){const previous=renderer.getRenderTarget(),auto=renderer.autoClear,color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();renderer.setClearColor(0,0);renderer.autoClear=true;renderer.setRenderTarget(target.rt);renderer.render(scene,camera);renderer.setRenderTarget(previous);renderer.autoClear=auto;renderer.setClearColor(color,alpha);}
 copy(source,target,program0=this.progClear){this.bindQuad(program0,source.texel);assign(program0.uniforms.uTexture,source.tex);if(program0.uniforms.value)assign(program0.uniforms.value,1);this.draw(target);}
 resize(w,h){
  fluidCanvas.width=w;fluidCanvas.height=h;const aspect=w/h,simW=Math.max(32,Math.min(256,Math.round(this.simRes*aspect))),dyeW=Math.max(64,Math.min(768,Math.round(this.dyeRes*aspect)));
  const old=this.dye;const oldV=this.velocity;
  for(const key of ['divergence','curl','pressure','output','sample','packed']){const f=this[key];if(f){if(f.a){f.a.rt.dispose();f.b.rt.dispose()}else f.rt.dispose()}}
  this.velocity=this.createDoubleFBO(simW,this.simRes);this.divergence=this.createFBO(simW,this.simRes);this.curl=this.createFBO(simW,this.simRes);this.pressure=this.createDoubleFBO(simW,this.simRes);this.dye=this.createDoubleFBO(dyeW,this.dyeRes);this.output=this.createFBO(dyeW,this.dyeRes,T.UnsignedByteType);this.sample=this.createFBO(128,128,T.UnsignedByteType);this.packed=this.createFBO(simW,this.simRes,T.UnsignedByteType);
  this.clearAll();
  if(old){this.copy(old.a,this.dye.a);old.a.rt.dispose();old.b.rt.dispose()}
  if(oldV){this.copy(oldV.a,this.velocity.a);oldV.a.rt.dispose();oldV.b.rt.dispose()}
 }
  splat(x,y,dx,dy,color,radius){
    if(obstacle.r>0){const aspect=fluidCanvas.width/fluidCanvas.height,px=(x-obstacle.x)*aspect,py=y-obstacle.y,d=Math.hypot(px,py);
      if(d<obstacle.r){const nx=d>.00001?px/d:0,ny=d>.00001?py/d:1;x=obstacle.x+nx*(obstacle.r+.012)/aspect;y=obstacle.y+ny*(obstacle.r+.012);const force=Math.max(1,Math.hypot(dx,dy)*.5);dx=nx*force;dy=ny*force}}

    const aspect = fluidCanvas.width/fluidCanvas.height;
    // velocity — additive, needs signed values so it is never clamped
    this.bindQuad(this.progSplat, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progSplat.uniforms.uTarget, textures[0]);
    assign(this.progSplat.uniforms.aspect, aspect);
    assign(this.progSplat.uniforms.point, x, y);
    assign(this.progSplat.uniforms.color, dx, dy, 0.0);
    assign(this.progSplat.uniforms.radius, radius||0.0025);
    assign(this.progSplat.uniforms.mixMode, 0.0);
    assign(this.progSplat.uniforms.sharpness, 1.0);
    this.draw(this.velocity.b); this.velocity.swap();
    // dye — blends toward the brush color instead of stacking additively,
    // so repeated strokes never overflow into solid white. Sharpness comes
    // from the Wispiness setting: low = soft/feathered edges that break
    // apart, high = a crisp, solid-edged blob.
    const wisp = (typeof state!=='undefined' && state.wispiness) ? state.wispiness : 5;
    const sharpnessAmt = 0.35 + (wisp-1)/9 * 2.3;
    this.bindQuad(this.progSplat, this.dye.a.texel);
    textures[0] = this.dye.a.tex;
    assign(this.progSplat.uniforms.uTarget, textures[0]);
    assign(this.progSplat.uniforms.aspect, aspect);
    assign(this.progSplat.uniforms.point, x, y);
    assign(this.progSplat.uniforms.color, color[0]/255, color[1]/255, color[2]/255);
    assign(this.progSplat.uniforms.radius, (radius||0.0025)*1.6);
    assign(this.progSplat.uniforms.mixMode, 1.0);
    assign(this.progSplat.uniforms.sharpness, sharpnessAmt);
    this.draw(this.dye.b); this.dye.swap();
  }

  // pushes the fluid without adding any color — used for audio-reactive
  // pulses so existing paint visibly moves/bounces with the music
  splatVelocityOnly(x,y,dx,dy,radius){
    const aspect = fluidCanvas.width/fluidCanvas.height;
    this.bindQuad(this.progSplat, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progSplat.uniforms.uTarget, textures[0]);
    assign(this.progSplat.uniforms.aspect, aspect);
    assign(this.progSplat.uniforms.point, x, y);
    assign(this.progSplat.uniforms.color, dx, dy, 0.0);
    assign(this.progSplat.uniforms.radius, radius||0.02);
    assign(this.progSplat.uniforms.mixMode, 0.0);
    assign(this.progSplat.uniforms.sharpness, 1.0);
    this.draw(this.velocity.b); this.velocity.swap();
  }

  // blends velocity TOWARD a target vector instead of adding to it — this
  // is self-limiting (it converges to the target and stays there) so it
  // never runs away no matter how many frames it's applied for. Used for
  // Ambient Flow, which needs a genuinely stable, comparable 1..10 speed.
  splatVelocitySet(x,y,dx,dy,radius){
    const aspect = fluidCanvas.width/fluidCanvas.height;
    this.bindQuad(this.progSplat, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progSplat.uniforms.uTarget, textures[0]);
    assign(this.progSplat.uniforms.aspect, aspect);
    assign(this.progSplat.uniforms.point, x, y);
    assign(this.progSplat.uniforms.color, dx, dy, 0.0);
    assign(this.progSplat.uniforms.radius, radius||0.3);
    assign(this.progSplat.uniforms.mixMode, 1.0);
    assign(this.progSplat.uniforms.sharpness, 1.0);
    this.draw(this.velocity.b); this.velocity.swap();
  }

  step(dt){

    // curl
    this.bindQuad(this.progCurl, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progCurl.uniforms.uVelocity, textures[0]);
    this.draw(this.curl);
    // vorticity confinement
    this.bindQuad(this.progVort, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progVort.uniforms.uVelocity, textures[0]);
    textures[1] = this.curl.tex;
    assign(this.progVort.uniforms.uCurl, textures[1]);
    // Quantum Superfluid: below a "λ point" near the bottom of the
    // Viscosity slider, real Helium-4 loses friction almost entirely and
    // its vortices stop decaying (circulation gets "quantized" rather
    // than dissipating). Stylized here as vorticity confinement ramping
    // up sharply as viscosity approaches zero, so swirls persist and
    // amplify instead of settling — a frictionless-flow feel rather than
    // literal quantized circulation.
    let curlAmount = state.curl;
    if(typeof state !== 'undefined' && state.viscosity < 0.08){
      const sfMix = 1 - Math.min(1, state.viscosity/0.08);
      curlAmount = state.curl * (1 + sfMix*1.8);
    }
    assign(this.progVort.uniforms.curlAmount, curlAmount);
    assign(this.progVort.uniforms.dt, dt);
    this.draw(this.velocity.b); this.velocity.swap();
    // surface tension (Realistic Water) — runs before the pressure solve so
    // its cohesion/splash forces are made divergence-free like any other force
    if(typeof state !== 'undefined' && state.realWater){
      this.bindQuad(this.progTension, this.velocity.a.texel);
      textures[0] = this.velocity.a.tex;
      assign(this.progTension.uniforms.uVelocity, textures[0]);
      textures[1] = this.dye.a.tex;
      assign(this.progTension.uniforms.uDye, textures[1]);
      assign(this.progTension.uniforms.cohesion, (state.cohesion??5) * 1.6);
      assign(this.progTension.uniforms.splash, (state.splash??5) * 2.2);
      assign(this.progTension.uniforms.dt, dt);
      this.draw(this.velocity.b); this.velocity.swap();
    }
    // divergence
    this.bindQuad(this.progDiv, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progDiv.uniforms.uVelocity, textures[0]);
    this.draw(this.divergence);
    // clear pressure partially
    this.bindQuad(this.progClear, this.pressure.a.texel);
    textures[0] = this.pressure.a.tex;
    assign(this.progClear.uniforms.uTexture, textures[0]);
    assign(this.progClear.uniforms.value, 0.8);
    this.draw(this.pressure.b); this.pressure.swap();
    // jacobi pressure solve
    this.bindQuad(this.progPressure, this.pressure.a.texel);
    textures[1] = this.divergence.tex;
    assign(this.progPressure.uniforms.uDivergence, textures[1]);
    for(let i=0;i<12;i++){
      textures[0] = this.pressure.a.tex;
      assign(this.progPressure.uniforms.uPressure, textures[0]);
      this.draw(this.pressure.b); this.pressure.swap();
    }
    // gradient subtract
    this.bindQuad(this.progGradient, this.velocity.a.texel);
    textures[0] = this.pressure.a.tex;
    assign(this.progGradient.uniforms.uPressure, textures[0]);
    textures[1] = this.velocity.a.tex;
    assign(this.progGradient.uniforms.uVelocity, textures[1]);
    this.draw(this.velocity.b); this.velocity.swap();
    // Canvas Frame wall — applied here, after the pressure solve produced
    // the final divergence-free field but BEFORE advection uses it, so the
    // velocity that actually transports the dye already respects the frame.
    if(typeof state !== 'undefined' && state.canvasFrame) this.applyFrameMask(Math.max(this.velocity.a.texel[0], this.velocity.a.texel[1]));
    this.applyObstacle();
    // advect velocity
    this.bindQuad(this.progAdvect, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progAdvect.uniforms.uVelocity, textures[0]);
    textures[1] = this.velocity.a.tex;
    assign(this.progAdvect.uniforms.uSource, textures[1]);
    assign(this.progAdvect.uniforms.dt, dt);
    assign(this.progAdvect.uniforms.obstacle,obstacle.x,obstacle.y,obstacle.r);assign(this.progAdvect.uniforms.aspect,fluidCanvas.width/fluidCanvas.height);assign(this.progAdvect.uniforms.dyePass,0);assign(this.progAdvect.uniforms.collisionMap,collisionMap);assign(this.progAdvect.uniforms.meshCollision,collisionMap?1:0);
    // recentShearRate decays back toward rest on its own whenever nothing
    // is actively painting, so the fluid re-thickens after a stroke ends
    // rather than staying "thinned out" forever.
    recentShearRate *= 0.965;
    // Non-Newtonian Power Law: τ = K·γ̇ⁿ (n<1 ⇒ shear-thinning, like the
    // Oobleck example in the reference material). recentShearRate tracks
    // how fast the person has actually been painting/dragging lately, so
    // the effective viscosity used here isn't the fixed slider value —
    // slow, gentle strokes feel thicker and more resistant, while a fast
    // flick thins the fluid out and lets it move more freely, then it
    // settles back as the motion slows down.
    const shear = Math.max(0.01, Math.min(3, recentShearRate*8));
    const thinning = Math.pow(shear, 0.55 - 1); // n=0.55: shear-thinning
    let effViscosity = Math.max(0.02, Math.min(0.98, state.viscosity * thinning));
    // Phase Change: blended toward "solid" as freezeProgress ramps up —
    // see the note by freezeProgress's declaration.
    if(typeof freezeProgress !== 'undefined' && freezeProgress > 0){
      effViscosity = effViscosity*(1-freezeProgress) + 0.999*freezeProgress;
    }
    assign(this.progAdvect.uniforms.dissipation, Math.exp(-dt * (0.25 + effViscosity * 1.75)));
    this.draw(this.velocity.b); this.velocity.swap();
    // Velocity advection can reintroduce outward flow at the edges, so the
    // wall is enforced once more on the exact field the dye will be moved by.
    if(typeof state !== 'undefined' && state.canvasFrame) this.applyFrameMask(Math.max(this.velocity.a.texel[0], this.velocity.a.texel[1]));
    this.applyObstacle();
    // advect dye
    this.bindQuad(this.progAdvect, this.dye.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progAdvect.uniforms.uVelocity, textures[0]);
    textures[1] = this.dye.a.tex;
    assign(this.progAdvect.uniforms.uSource, textures[1]);
    assign(this.progAdvect.uniforms.dt, dt);
    assign(this.progAdvect.uniforms.dyePass,1);
    assign(this.progAdvect.uniforms.dissipation, state.dissipation);
    this.draw(this.dye.b); this.dye.swap();
  }

  applyObstacle(){if(!obstacle.r&&!collisionMap)return;const u=this.progObstacle.uniforms;this.bindQuad(this.progObstacle,this.velocity.a.texel);assign(u.uTexture,this.velocity.a.tex);assign(u.obstacle,obstacle.x,obstacle.y,obstacle.r);assign(u.aspect,fluidCanvas.width/fluidCanvas.height);assign(u.bounce,Number.isFinite(state.collisionBounce)?state.collisionBounce:.5);assign(u.collisionMap,collisionMap);assign(u.meshCollision,collisionMap?1:0);assign(u.spread,state.collisionSpread??.5);this.draw(this.velocity.b);this.velocity.swap()}
 stopVelocity(){
  const previous=renderer.getRenderTarget(),color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();renderer.setClearColor(0,0);
  for(const key of ['velocity','pressure'])for(const f of [this[key].a,this[key].b]){renderer.setRenderTarget(f.rt);renderer.clear()}
  renderer.setRenderTarget(previous);renderer.setClearColor(color,alpha);recentShearRate=0;
 }
 clearDye(){
    this.bindQuad(this.progClear, this.dye.a.texel);
    textures[0] = this.dye.a.tex;
    assign(this.progClear.uniforms.uTexture, textures[0]);
    assign(this.progClear.uniforms.value, 0.0);
    this.draw(this.dye.b); this.dye.swap();
  }

  // Canvas Frame: applies a reflective wall to the VELOCITY field at the
  // canvas edge — outward flow is reversed so fluid bounces back inside.
  // The dye (the actual painted color) is deliberately never touched here,
  // since masking it would repeatedly erase artwork every frame.
  applyFrameMask(margin){
    if(!this.progMask || !this.progMask.uniforms || this.progMask.uniforms.margin === undefined) return;
    this.bindQuad(this.progMask, this.velocity.a.texel);
    textures[0] = this.velocity.a.tex;
    assign(this.progMask.uniforms.uTexture, textures[0]);
    assign(this.progMask.uniforms.margin, margin);
    this.draw(this.velocity.b); this.velocity.swap();
  }


 render(){const u=this.progDisplay.uniforms;this.bindQuad(this.progDisplay,this.dye.a.texel);assign(u.uDye,this.dye.a.tex);assign(u.clarity,state.clarity);assign(u.glowAmount,state.glow);assign(u.opacity,state.opacity);this.draw(this.output);}
 sampleImpact(){const u=this.progImpact.uniforms;this.bindQuad(this.progImpact,this.velocity.a.texel);assign(u.uTexture,this.dye.a.tex);assign(u.collisionMap,collisionMap);this.draw(this.sample);return this.read(this.sample);}
 sampleDye(){this.copy(this.dye.a,this.sample);const data=new Uint8Array(128*128*4);renderer.readRenderTargetPixels(this.sample.rt,0,0,128,128,data);return data;}
 read(target){const data=new Uint8Array(target.w*target.h*4);renderer.readRenderTargetPixels(target.rt,0,0,target.w,target.h,data);return data;}
 checkpoint(){const byte=this.createFBO(this.dye.a.w,this.dye.a.h,T.UnsignedByteType);this.copy(this.dye.a,byte);const encode=f=>{const bytes=this.read(f);let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return{w:f.w,h:f.h,data:btoa(text)}};const dye=encode(byte);byte.rt.dispose();this.copy(this.velocity.a,this.packed,this.progPack);return {dye,velocity:encode(this.packed)};}
 load(data){this.clearAll();if(!data)return;const upload=(image,target,p)=>{if(!image||!Number.isInteger(image.w)||!Number.isInteger(image.h)||image.w<1||image.h<1||typeof image.data!=='string'||image.w*image.h>768*768||image.data.length>image.w*image.h*6)return;const bytes=Uint8Array.from(atob(image.data),c=>c.charCodeAt(0));if(bytes.length!==image.w*image.h*4)return;const tex=new T.DataTexture(bytes,image.w,image.h,T.RGBAFormat,T.UnsignedByteType);tex.minFilter=tex.magFilter=T.LinearFilter;tex.needsUpdate=true;this.copy({tex,texel:[1/image.w,1/image.h]},target,p);tex.dispose()};upload(data.dye,this.dye.a,this.progClear);upload(data.velocity,this.velocity.a,this.progUnpack);}
 clearAll(){const previous=renderer.getRenderTarget(),color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();renderer.setClearColor(0,0);for(const key of ['velocity','dye','pressure'])if(this[key])for(const f of [this[key].a,this[key].b]){renderer.setRenderTarget(f.rt);renderer.clear()}renderer.setRenderTarget(previous);renderer.setClearColor(color,alpha);}
 dispose(){for(const key of ['velocity','dye','pressure','divergence','curl','output','sample','packed']){const f=this[key];if(f){if(f.a){f.a.rt.dispose();f.b.rt.dispose()}else f.rt.dispose()}}materials.forEach(m=>m.dispose());quad.geometry.dispose();}
}
let fluidSim=new FluidSim();
const particles = [];
function seedParticles(){
  particles.length = 0;
  const total = (typeof state!=='undefined' && state.particleCount) ? state.particleCount : 380;
  for(let i=0;i<total;i++){
    const pc = state.particleColors || [];
    const cn = state.particleColorCount || 1;
    particles.push({x:Math.random(), y:Math.random(), a:Math.random()*Math.PI*2, life:Math.random(),
      color:(pc[i % cn] || state.brushColor || [0,240,255]).slice()});
  }
}
/* Tops up the particle count without clearing what's already there —
   Black Hole, Planet, Venom and Germ can all eat through particles fairly
   fast once several of them are on screen together, and re-seeding from
   scratch (the Randomise button) throws away whatever's left. This just
   adds more on top. */
function addMoreParticles(count){
  const pc = state.particleColors || [];
  const cn = state.particleColorCount || 1;
  for(let i=0;i<count;i++){
    particles.push({x:Math.random(), y:Math.random(), a:Math.random()*Math.PI*2, life:Math.random(),
      color:(pc[i % cn] || state.brushColor || [0,240,255]).slice()});
  }
  if(particles.length > 2000) particles.splice(0, particles.length-2000);
}

function noise2(x,y,t){ return Math.sin(x*3.1+t*0.6)+Math.cos(y*2.7-t*0.5)+Math.sin((x+y)*4.2+t*0.3); }
/* Reads the painted dye back from the GPU at a low resolution so particles
   can react to the water. Done once per frame and cached — reading per
   particle would stall the pipeline badly. */
let dyeSample = null, dyeSampleW = 0, dyeSampleH = 0;
function sampleDyeField(){dyeSample=fluidSim.sampleDye();dyeSampleW=dyeSampleH=128;return true;}
function dyeAt(x, y){
  if(!dyeSample) return null;
  const px = Math.max(0, Math.min(dyeSampleW-1, Math.round(x*(dyeSampleW-1))));
  const py = Math.max(0, Math.min(dyeSampleH-1, Math.round(y*(dyeSampleH-1))));
  const i = (py*dyeSampleW + px)*4;
  return [dyeSample[i], dyeSample[i+1], dyeSample[i+2]];
}

function drawParticles(ctx, t, frozen){
  ctx.save();
  const w = jellyCanvas.width, h = jellyCanvas.height;
  ctx.globalCompositeOperation = 'lighter';
  const touches = Object.values(pointerData).filter(pd=>pd.down);

  // drawParticles is only ever called once particles actually exist (see
  // the mainLoop hook), so Water Interaction just applies directly now —
  // no more separate "is the right mode active" gate on top of that.
  const mode0 = state.particleInteract || 'none';
  // Coulomb's Law ("Charged") needs every particle to check nearby
  // particles against each other — naively that's O(n²) across up to
  // ~1200 particles. Bucketing them into a coarse grid once per frame
  // means each particle only ever compares itself against the handful
  // of neighbours sharing its own cell or one of the 8 adjacent ones.
  let chargeGrid = null;
  const gridSize = 14;
  if(!frozen && (mode0 === 'charged' || mode0 === 'sph')){
    chargeGrid = new Map();
    particles.forEach((p, idx)=>{
      if(p.charge == null) p.charge = Math.random() < 0.5 ? 1 : -1; // assigned once, stays fixed
      const gx = Math.max(0, Math.min(gridSize-1, Math.floor(p.x*gridSize)));
      const gy = Math.max(0, Math.min(gridSize-1, Math.floor(p.y*gridSize)));
      const key = gx*gridSize + gy;
      if(!chargeGrid.has(key)) chargeGrid.set(key, []);
      chargeGrid.get(key).push(idx);
    });
  }

  particles.forEach((p, pIdx)=>{
    if(!frozen){
      const n = noise2(p.x*3,p.y*3,t*0.001)*0.5;
      p.a += n*0.02*frameScale;
      const spd = frameScale * 0.0016 * ((state.particleSpeed||5)/5);
      p.x += Math.cos(p.a)*spd*(1+state.audioReactive);
      p.y += Math.sin(p.a)*spd*(1+state.audioReactive);
      // scatter away from any active touch/click point
      touches.forEach(pd=>{
        const dx = p.x-pd.lx, dy = p.y-pd.ly;
        const d = Math.hypot(dx,dy);
        const radius = 0.16;
        if(d < radius && d > 0.0001){
          const push = (1 - d/radius) * 0.05;
          p.x += (dx/d)*push;
          p.y += (dy/d)*push;
        }
      });
      // --- interaction with the painted water ---
      const mode = mode0;
      if(mode === 'charged' && chargeGrid){
        // Coulomb's Law: F = k·q1·q2/r² — like charges (both +1 or both
        // -1) push apart, opposite charges pull together. Only checked
        // against the handful of particles in this particle's own grid
        // cell and the 8 around it, and only within a short radius, so it
        // behaves like a local electrostatic field rather than a global one.
        const amt = (state.particleInteractAmt || 5) / 5;
        const k = 0.00034 * amt;
        const gx = Math.max(0, Math.min(gridSize-1, Math.floor(p.x*gridSize)));
        const gy = Math.max(0, Math.min(gridSize-1, Math.floor(p.y*gridSize)));
        let fx = 0, fy = 0;
        for(let ox=-1; ox<=1; ox++){
          for(let oy=-1; oy<=1; oy++){
            const nx = gx+ox, ny = gy+oy;
            if(nx<0 || ny<0 || nx>=gridSize || ny>=gridSize) continue;
            const bucket = chargeGrid.get(nx*gridSize+ny);
            if(!bucket) continue;
            for(let bi=0; bi<bucket.length; bi++){
              const j = bucket[bi];
              if(j === pIdx) continue;
              const q = particles[j];
              const dx = p.x-q.x, dy = p.y-q.y;
              const rMag = Math.hypot(dx,dy);
              if(rMag > 0.09) continue; // ignore anything outside the local neighbourhood
              const rSafe = Math.max(rMag, 0.012); // softening — avoids the force spiking at r→0
              const f = k * p.charge * q.charge / (rSafe*rSafe);
              fx += (dx/rSafe) * f;
              fy += (dy/rSafe) * f;
            }
          }
        }
        p.x += fx;
        p.y += fy;
      } else if(mode === 'sph' && chargeGrid){
        // Lightweight SPH: estimate local density (ρᵢ = Σ mⱼW(rᵢ-rⱼ,h),
        // Poly6-style falloff) from nearby particles, then push away from
        // over-dense neighbours proportional to pressure p=k(ρ-ρ₀) — the
        // same core idea as the reference material's SPH solver, just
        // without a full neighbour-force integral. This is what makes the
        // swarm behave like a cohesive fluid (self-spacing, pushing back
        // when compressed) instead of independent noise-driven dust.
        const amt = (state.particleInteractAmt || 5) / 5;
        const H = 0.045, REST_DENSITY = 5, K_STIFF = 0.0009 * amt;
        const gx = Math.max(0, Math.min(gridSize-1, Math.floor(p.x*gridSize)));
        const gy = Math.max(0, Math.min(gridSize-1, Math.floor(p.y*gridSize)));
        let density = 0;
        const neighbours = [];
        for(let ox=-1; ox<=1; ox++){
          for(let oy=-1; oy<=1; oy++){
            const nx = gx+ox, ny = gy+oy;
            if(nx<0 || ny<0 || nx>=gridSize || ny>=gridSize) continue;
            const bucket = chargeGrid.get(nx*gridSize+ny);
            if(!bucket) continue;
            for(let bi=0; bi<bucket.length; bi++){
              const j = bucket[bi];
              if(j === pIdx) continue;
              const q = particles[j];
              const dx = p.x-q.x, dy = p.y-q.y;
              const r = Math.hypot(dx,dy);
              if(r >= H) continue;
              const w = Math.pow(1 - (r*r)/(H*H), 3); // Poly6 kernel (unnormalized — fine for a relative pressure signal)
              density += w;
              neighbours.push({dx,dy,r,w});
            }
          }
        }
        const pressure = K_STIFF * Math.max(0, density - REST_DENSITY);
        if(pressure > 0){
          let fx=0, fy=0;
          neighbours.forEach(nb=>{
            const rSafe = Math.max(nb.r, 0.008);
            fx += (nb.dx/rSafe) * pressure * nb.w * 0.02;
            fy += (nb.dy/rSafe) * pressure * nb.w * 0.02;
          });
          p.x += fx; p.y += fy;
        }
      } else if(mode !== 'none' && dyeSample){
        const amt = (state.particleInteractAmt || 5) / 5;
        const c = dyeAt(p.x, p.y);
        if(c){
          const density = Math.max(c[0], Math.max(c[1], c[2])) / 255;
          if(mode === 'absorb' && density > 0.04){
            // gradually take on the colour of the paint it passes through
            const k = Math.min(1, 0.06 * amt * density * 60 * 0.016);
            p.color = [
              p.color[0]*(1-k) + c[0]*k,
              p.color[1]*(1-k) + c[1]*k,
              p.color[2]*(1-k) + c[2]*k
            ];
          } else if(mode === 'deposit'){
            // leave its own colour behind in the fluid
            if(Math.random() < 0.08 * amt){
              fluidSim.splat(p.x, p.y, 0, 0, p.color, 0.0008 * amt);
            }
          } else if(mode === 'bounce' && density > 0.08){
            // denser paint scatters the particle sharply away — a visible
            // kick plus an erratic turn, not just a gentle nudge, so it
            // reads clearly as "bouncing off" rather than doing nothing
            const e = 0.012;
            const gx = (Math.max(...(dyeAt(Math.min(1,p.x+e), p.y)||[0,0,0])) -
                        Math.max(...(dyeAt(Math.max(0,p.x-e), p.y)||[0,0,0]))) / 255;
            const gy = (Math.max(...(dyeAt(p.x, Math.min(1,p.y+e))||[0,0,0])) -
                        Math.max(...(dyeAt(p.x, Math.max(0,p.y-e))||[0,0,0]))) / 255;
            const len = Math.hypot(gx, gy) || 1;
            const kick = 0.02 * amt * (0.6 + density);
            p.x -= (gx/len) * kick;
            p.y -= (gy/len) * kick;
            p.a += (Math.random()-0.5) * 2.4 * amt;
          } else if(mode === 'carry' && density > 0.03){
            // caught in the current: flows ALONG the edge of the paint
            // (tangent to the colour gradient) instead of straight toward
            // or away from it — particles visibly stream around and skirt
            // the shape of what's painted, like leaves in a stream, which
            // reads as clearly distinct from Scatter's straight-line push.
            const e = 0.012;
            const gx = (Math.max(...(dyeAt(Math.min(1,p.x+e), p.y)||[0,0,0])) -
                        Math.max(...(dyeAt(Math.max(0,p.x-e), p.y)||[0,0,0]))) / 255;
            const gy = (Math.max(...(dyeAt(p.x, Math.min(1,p.y+e))||[0,0,0])) -
                        Math.max(...(dyeAt(p.x, Math.max(0,p.y-e))||[0,0,0]))) / 255;
            const len = Math.hypot(gx, gy) || 1;
            const tx = -gy/len, ty = gx/len; // gradient rotated 90° = flows along the contour
            const flow = 0.05 * amt * (0.5 + density);
            p.x += tx * flow;
            p.y += ty * flow;
          }
        }
      }
      if(p.x<0)p.x+=1; if(p.x>1)p.x-=1; if(p.y<0)p.y+=1; if(p.y>1)p.y-=1;
    }
    const [r,g,b] = p.color || state.brushColor;
    // In Charged mode, tint particles by their charge sign (cool blue for
    // +, warm magenta for −) so the attract/repel pattern is actually
    // legible rather than just a mono-colour swarm.
    let dr=r, dg=g, db=b;
    if(mode0 === 'charged' && p.charge != null){
      const tint = p.charge > 0 ? [80,200,255] : [255,90,190];
      dr = r*0.45 + tint[0]*0.55; dg = g*0.45 + tint[1]*0.55; db = b*0.45 + tint[2]*0.55;
    }
    const pa = ((state.particleAlpha!=null?state.particleAlpha:80)/100).toFixed(2);
    ctx.fillStyle = `rgba(${dr|0},${dg|0},${db|0},${pa})`;
    ctx.beginPath();
    ctx.arc(p.x*w, (1-p.y)*h, (state.particleSize||2.4)*1, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function symmetricPoints(x, y, dx, dy){
  const n = state.symmetry || 1;
  const out = [];
  const cx = 0.5, cy = 0.5;
  const aspect = fluidCanvas.width / fluidCanvas.height;
  // work in aspect-corrected space so rotations stay circular, not oval
  const px = (x-cx)*aspect, py = (y-cy);
  const vx = (dx||0)*aspect, vy = (dy||0);
  for(let i=0;i<n;i++){
    const a = (i/n) * Math.PI*2;
    const cos = Math.cos(a), sin = Math.sin(a);
    const rx = px*cos - py*sin, ry = px*sin + py*cos;
    const rvx = vx*cos - vy*sin, rvy = vx*sin + vy*cos;
    out.push([cx + rx/aspect, cy + ry, rvx/aspect, rvy]);
    if(state.mirror){
      // mirror across this arm's axis for a true kaleidoscope
      const mx = px*cos + py*sin, my = px*sin - py*cos;
      const mvx = vx*cos + vy*sin, mvy = vx*sin - vy*cos;
      out.push([cx + mx/aspect, cy + my, mvx/aspect, mvy]);
    }
  }
  return out;
}
let symBudget = 0, symBudgetFrame = -1;
/* Weber Number impact splashing: We = ρv²D/γ decides whether a fast
   splat just spreads (We below critical) or breaks apart into a crown of
   secondary droplets flung outward from the impact point (We above
   critical) — same rule real splashing liquid follows. ρ/γ here are
   tuned constants for this app's coordinate/velocity scale, not literal
   SI units, calibrated so a normal calm drag never triggers it but a
   sharp flick or a Water Ripple tap reliably does. */
let lastCrownSplashT = 0;
let recentShearRate = 0; // smoothed drag/paint speed, feeds the Non-Newtonian viscosity above
function maybeCrownSplash(x, y, dx, dy, color, radius){
  if(!fluidSim) return;
  const speed = Math.hypot(dx, dy);
  if(speed < 0.001) return;
  const D = Math.max(0.002, radius*2);
  const GAMMA = 0.02;
  const We = (speed*speed*D) / GAMMA;
  const We_CRIT = 5.5;
  if(We <= We_CRIT) return;
  // Throttled — a fast sustained drag would otherwise re-trigger this
  // every single frame, which reads as noisy static rather than a splash.
  const now = performance.now();
  if(now - lastCrownSplashT < 45) return;
  lastCrownSplashT = now;
  const numSplashes = Math.max(2, Math.min(8, Math.round(We / We_CRIT)));
  const spreadFactor = Math.sqrt(We / 12);
  const crownR = Math.min(0.045, radius * Math.min(2.6, spreadFactor*0.4));
  for(let i=0;i<numSplashes;i++){
    const ang = (i/numSplashes)*Math.PI*2 + Math.random()*0.5;
    const dist = crownR * (0.6 + Math.random()*0.5);
    const sx = Math.max(0, Math.min(1, x + Math.cos(ang)*dist));
    const sy = Math.max(0, Math.min(1, y + Math.sin(ang)*dist));
    fluidSim.splat(sx, sy, Math.cos(ang)*speed*0.5, Math.sin(ang)*speed*0.5, color, radius*0.4);
  }
}
function splatSym(x, y, dx, dy, color, radius){
  const speed = Math.hypot(dx, dy);
  recentShearRate = recentShearRate*0.92 + speed*0.08;
  if((state.symmetry||1) <= 1 && !state.mirror){
    fluidSim.splat(x, y, dx, dy, color, radius);
    maybeCrownSplash(x, y, dx, dy, color, radius);
    return;
  }
  // Every mirrored copy is another pair of full-screen simulation passes, so
  // a high symmetry during a fast drag can issue dozens per frame. Cap the
  // number of copies drawn in any single frame; the rest are simply skipped,
  // which is invisible in motion but keeps the frame rate stable.
  const frame = Math.floor(performance.now() / 16);
  if(frame !== symBudgetFrame){ symBudgetFrame = frame; symBudget = 16; }
  const pts = symmetricPoints(x, y, dx, dy);
  for(const [sx, sy, sdx, sdy] of pts){
    if(symBudget <= 0) break;
    if(sx < -0.1 || sx > 1.1 || sy < -0.1 || sy > 1.1) continue;
    fluidSim.splat(sx, sy, sdx, sdy, color, radius);
    symBudget--;
  }
  maybeCrownSplash(x, y, dx, dy, color, radius);
}

const tentacleBrushes = {}; // keyed by pointer id, only exists while dragging
function startTentacleBrush(id, x, y){
  const n = Math.max(5, Math.min(15, Math.round(state.tentacleLength||9)));
  const nodes = [];
  for(let i=0;i<n;i++) nodes.push({x, y, px:x, py:y});
  tentacleBrushes[id] = { nodes, noisePhase: Math.random()*1000 };
}
function updateTentacleBrush(id, x, y){
  const tb = tentacleBrushes[id];
  if(!tb) return;
  // handleMove fires per pointer event, not per rendered frame, so this
  // tracks its own elapsed time rather than relying on a frame dt.
  const now = performance.now();
  if(tb.lastT == null) tb.lastT = now;
  const dt = Math.min(0.05, Math.max(0.001, (now-tb.lastT)/1000));
  tb.lastT = now;
  const nodes = tb.nodes, n = nodes.length;
  const aspect = fluidCanvas.height / fluidCanvas.width;
  const swayAmt = (state.tentacleSway??5) / 10;

  // the head is an IK target driven directly by the finger
  nodes[0].x = x; nodes[0].y = y;

  // Verlet-integrate every other node (implicit velocity + fluid drag)
  const drag = 0.9;
  for(let i=1;i<n;i++){
    const node = nodes[i];
    const vx = (node.x-node.px)*drag, vy = (node.y-node.py)*drag;
    node.px = node.x; node.py = node.y;
    node.x += vx; node.y += vy;
  }

  // Perlin-style noise sway on the middle joints — keeps the curl looking
  // organic and alive even while the finger holds still, rather than the
  // chain going rigid the instant it stops moving.
  tb.noisePhase += dt;
  for(let i=1;i<n-1;i++){
    const amt = 0.0022 * swayAmt * (i/n);
    nodes[i].x += (noise2(i*1.7, tb.noisePhase*0.6, 0) * 0.33) * amt;
    nodes[i].y += (noise2(i*1.7+50, tb.noisePhase*0.6, 0) * 0.33) * amt;
  }

  // Flagellum propulsion (Resistive Force Theory): y(s,t)=A(s)sin(ks-ωt),
  // a genuine travelling wave running from head to tail — amplitude grows
  // toward the tip, same as a real flagellum — layered on top of the
  // noise sway. At low Reynolds number this whip generates thrust
  // (F ∝ (Cₙ-Cₜ)·v⊥·sinθ), so the tail end also gives the surrounding
  // fluid a paddling push, leaving a visible "swimming" wake instead of
  // just being dragged along inertly.
  tb.flagPhase = (tb.flagPhase||0) + dt * 6.2;
  const k_wave = 13;
  for(let i=1;i<n-1;i++){
    const s = i/n;
    const A = 0.0075 * swayAmt * s;
    const wave = A * Math.sin(k_wave*s - tb.flagPhase);
    const prevN = nodes[Math.max(0,i-1)], nextN = nodes[Math.min(n-1,i+1)];
    const tangX = nextN.x-prevN.x, tangY = nextN.y-prevN.y;
    const tlen = Math.hypot(tangX,tangY) || 0.0001;
    nodes[i].x += (-tangY/tlen) * wave;
    nodes[i].y += (tangX/tlen) * wave;
  }
  if(fluidSim && n >= 2){
    const tail = nodes[n-1], preTail = nodes[n-2];
    const tTangX = tail.x-preTail.x, tTangY = tail.y-preTail.y;
    const tlen = Math.hypot(tTangX,tTangY) || 0.0001;
    const thrustDir = Math.sin(k_wave - tb.flagPhase); // matches the tail segment's own wave phase
    const pushX = (-tTangY/tlen) * thrustDir, pushY = (tTangX/tlen) * thrustDir;
    fluidSim.splatVelocityOnly(tail.x, tail.y, pushX*3.2, pushY*3.2, 0.015);
  }

  // distance-constraint relaxation (inextensible rope), head re-pinned
  // every pass since the noise/verlet steps above may have nudged it
  const segLen = 0.02;
  for(let iter=0; iter<3; iter++){
    nodes[0].x = x; nodes[0].y = y;
    for(let i=0;i<n-1;i++){
      const a = nodes[i], b = nodes[i+1];
      const dx = b.x-a.x, dy = (b.y-a.y)*aspect;
      const dist = Math.hypot(dx,dy) || 0.0001;
      const diff = (dist-segLen)/dist;
      if(i === 0){ b.x -= dx*diff; b.y -= (dy*diff)/aspect; }
      else {
        a.x += dx*diff*0.5; a.y += (dy*diff*0.5)/aspect;
        b.x -= dx*diff*0.5; b.y -= (dy*diff*0.5)/aspect;
      }
    }
  }

  // paint along the whole chain, tapering the splat radius from base to
  // tip with the same exponential profile used for Venom's tendrils.
  // Base radius matched to Water Ripple's centre-burst size (0.009) so the
  // two feel the same weight at the same Brush Size instead of Tentacle
  // Brush always painting noticeably thicker by default.
  if(fluidSim){
    const col = activeBrushColor();
    nodes.forEach((node,i)=>{
      const tNorm = i/(n-1);
      const rad = 0.009 * Math.pow(1-tNorm, 1.3) * state.brushSize;
      fluidSim.splat(node.x, node.y, 0, 0, col, Math.max(0.0018, rad));
    });
  }
}
function endTentacleBrush(id){
  delete tentacleBrushes[id];
}
/* Driven every rendered frame (not just on pointer-move events) for any
   pointer that's currently down in Tentacle Brush mode, using its last
   known position — this is what keeps the Perlin-noise sway animating
   even while the finger holds still instead of the chain freezing solid. */
function updateAllTentacleBrushes(){
  Object.keys(pointerData).forEach(id=>{
    const pd = pointerData[id];
    if(pd && pd.down && state.tool==='tentacle' && tentacleBrushes[id]){
      updateTentacleBrush(id, pd.lx, pd.ly);
    }
  });
}
/* A bright overlay outline on top of the freshly-painted stroke, purely
   while the finger is still down — helps the tapered tentacle shape read
   clearly while it's being drawn, on top of the fluid colour underneath. */
function drawTentacleBrushes(ctx){
  const ids = Object.keys(tentacleBrushes);
  if(!ids.length) return;
  const W = jellyCanvas.width, H = jellyCanvas.height;
  ids.forEach(id=>{
    const tb = tentacleBrushes[id];
    const nodes = tb.nodes, n = nodes.length;
    if(n < 3) return;
    const pts = nodes.map(nd => ({x: nd.x, y: 1-nd.y}));
    const [r,g,b] = activeBrushColor();
    const path = new Path2D();
    path.moveTo(pts[0].x*W, pts[0].y*H);
    for(let i=1;i<n-1;i++){
      const mx=(pts[i].x+pts[i+1].x)/2*W, my=(pts[i].y+pts[i+1].y)/2*H;
      path.quadraticCurveTo(pts[i].x*W, pts[i].y*H, mx, my);
    }
    path.lineTo(pts[n-1].x*W, pts[n-1].y*H);
    for(let i=0;i<n-1;i++){
      const a=pts[i], b2=pts[i+1];
      const tNorm = i/(n-1);
      // Was a flat constant regardless of Brush Size, so adjusting the
      // slider never visibly changed how thick the tentacle was drawn —
      // only the actual painted fluid stroke underneath it scaled.
      // Scaled down (7→4) to match the 0.016→0.009 reduction in the
      // actual painted radius above, so the preview and the real stroke
      // stay proportional to each other.
      const w = Math.max(0.6, 4*1*(state.brushSize||1)*Math.pow(1-tNorm, 1.3));
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 - tNorm*0.25})`;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.moveTo(a.x*W, a.y*H); ctx.lineTo(b2.x*W, b2.y*H);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = Math.max(0.6, 2*1*(state.brushSize||1));
    ctx.stroke(path);
  });
}

function applyAmbientFlow(dt){
  if(!fluidSim || !state.flowEnabled) return;
  if(!state.flowDir.x && !state.flowDir.y) return;
  const target = (state.flowSpeed||5) * 3.2;
  const dx = state.flowDir.x*target, dy = state.flowDir.y*target;
  // With Canvas Frame on, keep the flow injection well inside the frame and
  // tighter in radius, so it doesn't constantly re-push color into the wall.
  const framed = state.canvasFrame;
  const pts = framed
    ? [[0.35,0.35],[0.65,0.35],[0.35,0.65],[0.65,0.65],[0.5,0.5]]
    : [[0.2,0.2],[0.8,0.2],[0.2,0.8],[0.8,0.8],[0.5,0.5]];
  const radius = framed ? 0.2 : 0.45;
  pts.forEach(([x,y])=>{
    fluidSim.splatVelocitySet(x, y, dx, dy, radius);
  });
}

/* Canvas Frame: bounces outward-flowing fluid back inside at the frame edge.
   The main enforcement happens inside FluidSim.step() (around the pressure
   solve and advection); this extra pass catches velocity injected by tools
   and Ambient Flow before the step even begins. Paint is never erased. */
function applyCanvasFrameContainment(dt){
  if(!fluidSim || !state.canvasFrame) return;
  fluidSim.applyFrameMask(Math.max(fluidSim.velocity.a.texel[0], fluidSim.velocity.a.texel[1]));
}


const pointerData={},jellyCanvas=document.createElement('canvas');let frameScale=1;let gradientHue=0;
const activeBrushColor=()=>{
  if(!state.gradientBrush)return state.brushColor;
  gradientHue=(gradientHue+(state.gradientSpeed||5)*.0025)%1;
  const h=gradientHue*6,i=Math.floor(h),f=h-i,p=.15,q=1-f*.85,t=1-(1-f)*.85;
  const rgb=[[1,t,p],[q,1,p],[p,1,t],[p,q,1],[t,p,1],[1,p,q]][i%6];
  return rgb.map(v=>Math.round(v*255));
};
const pendingRipples=[];
const ripple=(x,y)=>{const col=activeBrushColor().slice();for(let i=0;i<12;i++)pendingRipples.push({x,y,col,angle:i/12*Math.PI*2,delay:i*.014,size:state.brushSize});splatSym(x,y,0,0,col,.009*state.brushSize)};
const tickRipples=dt=>{for(const p of pendingRipples)p.delay-=dt;pendingRipples.sort((a,b)=>a.delay-b.delay);while(pendingRipples.length&&pendingRipples[0].delay<=0){const p=pendingRipples.shift();splatSym(p.x,p.y,Math.cos(p.angle)*4.5,Math.sin(p.angle)*4.5,p.col,.003*p.size)}};
// Checkpoints preserve the remaining timed impulses; saving never fast-forwards water.
const rippleSnapshot=()=>pendingRipples.map(p=>({...p,col:p.col.slice()}));
const restoreRipples=v=>{pendingRipples.length=0;if(!Array.isArray(v))return;for(const p of v.slice(0,2048)){
  if(!p||![p.x,p.y,p.angle,p.delay,p.size].every(Number.isFinite)||p.x<0||p.x>1||p.y<0||p.y>1||p.delay<-.2||p.delay>.2||p.size<.2||p.size>3||!Array.isArray(p.col)||p.col.length!==3||!p.col.every(c=>Number.isFinite(c)&&c>=0&&c<=255))continue;
  pendingRipples.push({...p,col:p.col.slice()});
}};
return{solver:fluidSim,canvas:fluidCanvas,particles,pointers:pointerData,brushes:tentacleBrushes,particleCanvas:jellyCanvas,
setObstacle:v=>{obstacle=v||{x:0,y:0,r:0}},setCollisionMap:v=>{collisionMap=v||null},color:activeBrushColor,rippleSnapshot,restoreRipples,cancelRipples:()=>{pendingRipples.length=0},setState:v=>{state=v},seed:seedParticles,addParticles:addMoreParticles,splat:splatSym,ripple,
startTentacle:startTentacleBrush,endTentacle:endTentacleBrush,pick:(x,y)=>{sampleDyeField();return dyeAt(x,y)},
frame(dt,frozen,elapsed=dt){
if(frozen&&state.paused)freezeProgress=1;
frameScale=Math.min(2,dt*60);freezeProgress+=(Number(frozen)-freezeProgress)*Math.min(1,dt/.9);
if(Math.abs(freezeProgress-Number(frozen))<.004)freezeProgress=Number(frozen);
const simDt=dt*Math.max(.1,state.timeScale);
if(!frozen){tickRipples(elapsed);applyAmbientFlow(simDt);updateAllTentacleBrushes();fluidSim.step(simDt);applyCanvasFrameContainment(simDt)}
else if(freezeProgress<.985){fluidSim.step(simDt)}
fluidSim.render();
const ctx=jellyCanvas.getContext('2d');if(!state.particleTrail||frozen){ctx.clearRect(0,0,jellyCanvas.width,jellyCanvas.height)}else{ctx.globalCompositeOperation='destination-out';ctx.fillStyle=`rgba(0,0,0,${Math.max(.015,1-state.particleTrail*.095)})`;ctx.fillRect(0,0,jellyCanvas.width,jellyCanvas.height);ctx.globalCompositeOperation='source-over'}
if(state.particles){if(!frozen&&state.particleInteract!=='none')sampleDyeField();drawParticles(ctx,performance.now(),frozen)}drawTentacleBrushes(ctx);
},clear(){pendingRipples.length=0;fluidSim.clearAll();particles.length=0;const c=jellyCanvas.getContext('2d');c.clearRect(0,0,jellyCanvas.width,jellyCanvas.height)},resize(w,h){fluidSim.resize(w,h);jellyCanvas.width=Math.min(1024,w);jellyCanvas.height=Math.round(jellyCanvas.width*h/w)}
};
  };
})();
