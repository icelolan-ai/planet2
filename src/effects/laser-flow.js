/* Laser Flow: upstream shader, adapted to native Kit.
 * Source: DavidHDev/react-bits src/content/Animations/LaserFlow/LaserFlow.jsx
 * Blob 977e160f9b2669beb96e179856dd1f5bb5a78c47.
 * MIT + Commons Clause, copyright 2026 David Haz. Full notice in template.html.
 * Shared renderer / native clock, no additional RAF or export owner.
 */
(() => {
  if(window.CerebraLaser)return;
  const cache=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
  const defaults={c2:'#CF9EFF',horizontalBeamOffset:.1,verticalBeamOffset:-.2,horizontalSizing:.5,verticalSizing:2,wispDensity:1,wispSpeed:15,wispIntensity:5,flowSpeed:.35,flowStrength:.25,fogIntensity:.45,fogScale:.3,fogFallSpeed:.6,decay:1.1,falloffStart:1.2,mstyle:'flow'};
  const vertex="\nprecision highp float;\nattribute vec3 position;\nvoid main(){\n  gl_Position = vec4(position, 1.0);\n}\n",fragment="\n#ifdef GL_ES\n#extension GL_OES_standard_derivatives : enable\n#endif\nprecision highp float;\nprecision mediump int;\n\nuniform float iTime;\nuniform vec3 iResolution;\nuniform vec4 iMouse;\nuniform float uWispDensity;\nuniform float uTiltScale;\nuniform float uFlowTime;\nuniform float uFogTime;\nuniform float uBeamXFrac;\nuniform float uBeamYFrac;\nuniform float uFlowSpeed;\nuniform float uVLenFactor;\nuniform float uHLenFactor;\nuniform float uFogIntensity;\nuniform float uFogScale;\nuniform float uWSpeed;\nuniform float uWIntensity;\nuniform float uFlowStrength;\nuniform float uDecay;\nuniform float uFalloffStart;\nuniform float uFogFallSpeed;\nuniform vec3 uColor;\nuniform float uFade;\n\n// Core beam/flare shaping and dynamics\n#define PI 3.14159265359\n#define TWO_PI 6.28318530718\n#define EPS 1e-6\n#define EDGE_SOFT (DT_LOCAL*4.0)\n#define DT_LOCAL 0.0038\n#define TAP_RADIUS 6\n#define R_H 150.0\n#define R_V 150.0\n#define FLARE_HEIGHT 16.0\n#define FLARE_AMOUNT 8.0\n#define FLARE_EXP 2.0\n#define TOP_FADE_START 0.1\n#define TOP_FADE_EXP 1.0\n#define FLOW_PERIOD 0.5\n#define FLOW_SHARPNESS 1.5\n\n// Wisps (animated micro-streaks) that travel along the beam\n#define W_BASE_X 1.5\n#define W_LAYER_GAP 0.25\n#define W_LANES 10\n#define W_SIDE_DECAY 0.5\n#define W_HALF 0.01\n#define W_AA 0.15\n#define W_CELL 20.0\n#define W_SEG_MIN 0.01\n#define W_SEG_MAX 0.55\n#define W_CURVE_AMOUNT 15.0\n#define W_CURVE_RANGE (FLARE_HEIGHT - 3.0)\n#define W_BOTTOM_EXP 10.0\n\n// Volumetric fog controls\n#define FOG_ON 1\n#define FOG_CONTRAST 1.2\n#define FOG_SPEED_U 0.1\n#define FOG_SPEED_V -0.1\n#define FOG_OCTAVES 5\n#define FOG_BOTTOM_BIAS 0.8\n#define FOG_TILT_TO_MOUSE 0.05\n#define FOG_TILT_DEADZONE 0.01\n#define FOG_TILT_MAX_X 0.35\n#define FOG_TILT_SHAPE 1.5\n#define FOG_BEAM_MIN 0.0\n#define FOG_BEAM_MAX 0.75\n#define FOG_MASK_GAMMA 0.5\n#define FOG_EXPAND_SHAPE 12.2\n#define FOG_EDGE_MIX 0.5\n\n// Horizontal vignette for the fog volume\n#define HFOG_EDGE_START 0.20\n#define HFOG_EDGE_END 0.98\n#define HFOG_EDGE_GAMMA 1.4\n#define HFOG_Y_RADIUS 25.0\n#define HFOG_Y_SOFT 60.0\n\n// Beam extents and edge masking\n#define EDGE_X0 0.22\n#define EDGE_X1 0.995\n#define EDGE_X_GAMMA 1.25\n#define EDGE_LUMA_T0 0.0\n#define EDGE_LUMA_T1 2.0\n#define DITHER_STRENGTH 1.0\n\n    float g(float x){return x<=0.00031308?12.92*x:1.055*pow(x,1.0/2.4)-0.055;}\n    float bs(vec2 p,vec2 q,float powr){\n        float d=distance(p,q),f=powr*uFalloffStart,r=(f*f)/(d*d+EPS);\n        return powr*min(1.0,r);\n    }\n    float bsa(vec2 p,vec2 q,float powr,vec2 s){\n        vec2 d=p-q; float dd=(d.x*d.x)/(s.x*s.x)+(d.y*d.y)/(s.y*s.y),f=powr*uFalloffStart,r=(f*f)/(dd+EPS);\n        return powr*min(1.0,r);\n    }\n    float tri01(float x){float f=fract(x);return 1.0-abs(f*2.0-1.0);}\n    float tauWf(float t,float tmin,float tmax){float a=smoothstep(tmin,tmin+EDGE_SOFT,t),b=1.0-smoothstep(tmax-EDGE_SOFT,tmax,t);return max(0.0,a*b);} \n    float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+34.123);return fract(p.x*p.y);}\n    float vnoise(vec2 p){\n        vec2 i=floor(p),f=fract(p);\n        float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));\n        vec2 u=f*f*(3.0-2.0*f);\n        return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);\n    }\n    float fbm2(vec2 p){\n        float v=0.0,amp=0.6; mat2 m=mat2(0.86,0.5,-0.5,0.86);\n        for(int i=0;i<FOG_OCTAVES;++i){v+=amp*vnoise(p); p=m*p*2.03+17.1; amp*=0.52;}\n        return v;\n    }\n    float rGate(float x,float l){float a=smoothstep(0.0,W_AA,x),b=1.0-smoothstep(l,l+W_AA,x);return max(0.0,a*b);}\n    float flareY(float y){float t=clamp(1.0-(clamp(y,0.0,FLARE_HEIGHT)/max(FLARE_HEIGHT,EPS)),0.0,1.0);return pow(t,FLARE_EXP);}\n\n    float vWisps(vec2 uv,float topF){\n    float y=uv.y,yf=(y+uFlowTime*uWSpeed)/W_CELL;\n    float dRaw=clamp(uWispDensity,0.0,2.0),d=dRaw<=0.0?1.0:dRaw;\n    float lanesF=floor(float(W_LANES)*min(d,1.0)+0.5); // WebGL1-safe\n    int lanes=int(max(1.0,lanesF));\n    float sp=min(d,1.0),ep=max(d-1.0,0.0);\n    float fm=flareY(max(y,0.0)),rm=clamp(1.0-(y/max(W_CURVE_RANGE,EPS)),0.0,1.0),cm=fm*rm;\n    const float G=0.05; float xS=1.0+(FLARE_AMOUNT*W_CURVE_AMOUNT*G)*cm;\n    float sPix=clamp(y/R_V,0.0,1.0),bGain=pow(1.0-sPix,W_BOTTOM_EXP),sum=0.0;\n    for(int s=0;s<2;++s){\n        float sgn=s==0?-1.0:1.0;\n        for(int i=0;i<W_LANES;++i){\n            if(i>=lanes) break;\n            float off=W_BASE_X+float(i)*W_LAYER_GAP,xc=sgn*(off*xS);\n            float dx=abs(uv.x-xc),lat=1.0-smoothstep(W_HALF,W_HALF+W_AA,dx),amp=exp(-off*W_SIDE_DECAY);\n            float seed=h21(vec2(off,sgn*17.0)),yf2=yf+seed*7.0,ci=floor(yf2),fy=fract(yf2);\n            float seg=mix(W_SEG_MIN,W_SEG_MAX,h21(vec2(ci,off*2.3)));\n            float spR=h21(vec2(ci,off+sgn*31.0)),seg1=rGate(fy,seg)*step(spR,sp);\n            if(ep>0.0){float spR2=h21(vec2(ci*3.1+7.0,off*5.3+sgn*13.0)); float f2=fract(fy+0.5); seg1+=rGate(f2,seg*0.9)*step(spR2,ep);}\n            sum+=amp*lat*seg1;\n        }\n    }\n    float span=smoothstep(-3.0,0.0,y)*(1.0-smoothstep(R_V-6.0,R_V,y));\n    return uWIntensity*sum*topF*bGain*span;\n}\n\nvoid mainImage(out vec4 fc,in vec2 frag){\n    vec2 C=iResolution.xy*.5; float invW=1.0/max(C.x,1.0);\n    vec2 sc=(512.0/iResolution.xy)*.4;\n    vec2 uv=(frag-C)*sc,off=vec2(uBeamXFrac*iResolution.x*sc.x,uBeamYFrac*iResolution.y*sc.y);\n    vec2 uvc = uv - off;\n    float a=0.0,b=0.0;\n    float basePhase=1.5*PI+uDecay*.5; float tauMin=basePhase-uDecay; float tauMax=basePhase;\n    float cx=clamp(uvc.x/(R_H*uHLenFactor),-1.0,1.0),tH=clamp(TWO_PI-acos(cx),tauMin,tauMax);\n    for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){\n        float tu=tH+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;\n        float spd=max(abs(sin(tu)),0.02),u=clamp((basePhase-tu)/max(uDecay,EPS),0.0,1.0),env=pow(1.0-abs(u*2.0-1.0),0.8);\n        vec2 p=vec2((R_H*uHLenFactor)*cos(tu),0.0);\n        a+=wt*bs(uvc,p,env*spd);\n    }\n    float yPix=uvc.y,cy=clamp(-yPix/(R_V*uVLenFactor),-1.0,1.0),tV=clamp(TWO_PI-acos(cy),tauMin,tauMax);\n    for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){\n        float tu=tV+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;\n        float yb=(-R_V)*cos(tu),s=clamp(yb/R_V,0.0,1.0),spd=max(abs(sin(tu)),0.02);\n        float env=pow(1.0-s,0.6)*spd;\n        float cap=1.0-smoothstep(TOP_FADE_START,1.0,s); cap=pow(cap,TOP_FADE_EXP); env*=cap;\n        float ph=s/max(FLOW_PERIOD,EPS)+uFlowTime*uFlowSpeed;\n        float fl=pow(tri01(ph),FLOW_SHARPNESS);\n        env*=mix(1.0-uFlowStrength,1.0,fl);\n        float yp=(-R_V*uVLenFactor)*cos(tu),m=pow(smoothstep(FLARE_HEIGHT,0.0,yp),FLARE_EXP),wx=1.0+FLARE_AMOUNT*m;\n        vec2 sig=vec2(wx,1.0),p=vec2(0.0,yp);\n        float mask=step(0.0,yp);\n        b+=wt*bsa(uvc,p,mask*env,sig);\n    }\n    float sPix=clamp(yPix/R_V,0.0,1.0),topA=pow(1.0-smoothstep(TOP_FADE_START,1.0,sPix),TOP_FADE_EXP);\n    float L=a+b*topA;\n    float w=vWisps(vec2(uvc.x,yPix),topA);\n    float fog=0.0;\n#if FOG_ON\n    vec2 fuv=uvc*uFogScale;\n    float mAct=step(1.0,length(iMouse.xy)),nx=((iMouse.x-C.x)*invW)*mAct;\n    float ax = abs(nx);\n    float stMag = mix(ax, pow(ax, FOG_TILT_SHAPE), 0.35);\n    float st = sign(nx) * stMag * uTiltScale;\n    st = clamp(st, -FOG_TILT_MAX_X, FOG_TILT_MAX_X);\n    vec2 dir=normalize(vec2(st,1.0));\n    fuv+=uFogTime*uFogFallSpeed*dir;\n    vec2 prp=vec2(-dir.y,dir.x);\n    fuv+=prp*(0.08*sin(dot(uvc,prp)*0.08+uFogTime*0.9));\n    float n=fbm2(fuv+vec2(fbm2(fuv+vec2(7.3,2.1)),fbm2(fuv+vec2(-3.7,5.9)))*0.6);\n    n=pow(clamp(n,0.0,1.0),FOG_CONTRAST);\n    float pixW = 1.0 / max(iResolution.y, 1.0);\n#ifdef GL_OES_standard_derivatives\n    float wL = max(fwidth(L), pixW);\n#else\n    float wL = pixW;\n#endif\n    float m0=pow(smoothstep(FOG_BEAM_MIN - wL, FOG_BEAM_MAX + wL, L),FOG_MASK_GAMMA);\n    float bm=1.0-pow(1.0-m0,FOG_EXPAND_SHAPE); bm=mix(bm*m0,bm,FOG_EDGE_MIX);\n    float yP=1.0-smoothstep(HFOG_Y_RADIUS,HFOG_Y_RADIUS+HFOG_Y_SOFT,abs(yPix));\n    float nxF=abs((frag.x-C.x)*invW),hE=1.0-smoothstep(HFOG_EDGE_START,HFOG_EDGE_END,nxF); hE=pow(clamp(hE,0.0,1.0),HFOG_EDGE_GAMMA);\n    float hW=mix(1.0,hE,clamp(yP,0.0,1.0));\n    float bBias=mix(1.0,1.0-sPix,FOG_BOTTOM_BIAS);\n    float browserFogIntensity = uFogIntensity;\n    browserFogIntensity *= 1.8;\n    float radialFade = 1.0 - smoothstep(0.0, 0.7, length(uvc) / 120.0);\n    float safariFog = n * browserFogIntensity * bBias * bm * hW * radialFade;\n    fog = safariFog;\n#endif\n    float LF=L+fog;\n    float dith=(h21(frag)-0.5)*(DITHER_STRENGTH/255.0);\n    float tone=g(LF+w);\n    vec3 col=tone*uColor+dith;\n    float alpha=clamp(g(L+w*0.6)+dith*0.6,0.0,1.0);\n    float nxE=abs((frag.x-C.x)*invW),xF=pow(clamp(1.0-smoothstep(EDGE_X0,EDGE_X1,nxE),0.0,1.0),EDGE_X_GAMMA);\n    float scene=LF+max(0.0,w)*0.5,hi=smoothstep(EDGE_LUMA_T0,EDGE_LUMA_T1,scene);\n    float eM=mix(xF,1.0,hi);\n    col*=eM; alpha*=eM;\n    col*=uFade; alpha*=uFade;\n    fc=vec4(col,alpha);\n}\n\nvoid main(){\n  vec4 fc;\n  mainImage(fc, gl_FragCoord.xy);\n  gl_FragColor = fc;\n}\n";
  function params(it){
    const old=it.p||{},p={...defaults,...old};
    const legacy=(key,oldKey,convert)=>{if(old[key]===undefined&&old[oldKey]!==undefined)p[key]=convert(+old[oldKey]);};
    legacy('horizontalBeamOffset','beamX',v=>v-.5);legacy('verticalBeamOffset','beamY',v=>.5-v);
    legacy('horizontalSizing','length',v=>v);legacy('verticalSizing','height',v=>v*2);
    legacy('wispDensity','density',v=>v/36);legacy('flowSpeed','flow',v=>v*.35);
    legacy('fogIntensity','fog',v=>v);legacy('falloffStart','width',v=>v/1.8*1.2);
    if(old.horizontalSizing===undefined){if(old.wispSpeed!==undefined)p.wispSpeed=old.wispSpeed*15;if(old.wispIntensity!==undefined)p.wispIntensity=old.wispIntensity/.6*5;}
    for(const [key,,min,max] of controls)p[key]=clamp(p[key],min,max);
    return p;
  }
  let gpu;
  function init(){
    const renderer=window.__cerebra?.stage.renderer;if(!renderer)return;
    const uniforms={iTime:{value:0},iResolution:{value:new THREE.Vector3()},iMouse:{value:new THREE.Vector4()},uTiltScale:{value:0},uFlowTime:{value:0},uFogTime:{value:0},uFade:{value:1},uColor:{value:new THREE.Vector3()}};
    for(const c of controls)uniforms[c[5]]={value:0};
    const material=new THREE.RawShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:false,depthTest:false,depthWrite:false,blending:THREE.NormalBlending});
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
    const scene=new THREE.Scene(),mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
    const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false});target.texture.colorSpace=THREE.NoColorSpace;
    gpu={renderer,uniforms,scene,camera:new THREE.OrthographicCamera(-1,1,1,-1,0,1),target,bytes:new Uint8Array(4)};
    addEventListener('pagehide',()=>{target.dispose();material.dispose();geometry.dispose();gpu=null;},{once:true});return gpu;
  }
  const controls=[
    ['horizontalBeamOffset','Beam horizontal offset',-.5,.5,.01,'uBeamXFrac'],
    ['verticalBeamOffset','Beam vertical offset',-.5,.5,.01,'uBeamYFrac'],
    ['horizontalSizing','Horizontal sizing',.1,2,.01,'uHLenFactor'],
    ['verticalSizing','Vertical sizing',.1,5,.1,'uVLenFactor'],
    // The original shader clamps to 2 and treats 0 as 1. Use intensity=0 to disable wisps.
    ['wispDensity','Wisp density',.1,2,.1,'uWispDensity'],
    ['wispSpeed','Wisp speed',0,50,.5,'uWSpeed'],
    ['wispIntensity','Wisp intensity',0,20,.1,'uWIntensity'],
    ['flowSpeed','Flow speed',0,2,.01,'uFlowSpeed'],
    ['flowStrength','Flow strength',0,1,.01,'uFlowStrength'],
    ['fogIntensity','Fog intensity',0,1,.01,'uFogIntensity'],
    ['fogScale','Fog scale',.1,1,.01,'uFogScale'],
    ['fogFallSpeed','Fog fall speed',0,2,.01,'uFogFallSpeed'],
    ['decay','Decay',.5,3,.01,'uDecay'],
    ['falloffStart','Falloff start',.5,3,.01,'uFalloffStart']
  ];
  function draw(g,it,x,y,w,h,k,time=0,amount=0){
    const p=params(it),moving=p.flowSpeed>0||p.wispSpeed>0||p.fogFallSpeed>0||p.mstyle==='pulse';
    // Zero speeds freeze the source's implicit lateral fog drift too, including export/resizes.
    const t=amount&&moving?Math.floor(time*amount*30)/30:0;
    const preview=typeof KIT_PREVIEW!=='undefined'&&KIT_PREVIEW;
    const scale=Math.min((preview?1024:2048)/Math.max(w,h),1),W=Math.max(8,Math.round(w*scale)),H=Math.max(8,Math.round(h*scale));
    const key=JSON.stringify([p,W,H,t,amount]);let frames=cache.get(it);if(!frames)cache.set(it,frames=new WeakMap());let c=frames.get(g);
    if((!c||c.key!==key)&&!(preview&&c?.pending)){
      const a=gpu||init();if(!a)return;
      if(!c){const cv=document.createElement('canvas');c={cv,ctx:cv.getContext('2d')};frames.set(g,c);}if(!c.ctx)return;
      const {renderer:r,uniforms:u,target}=a;target.setSize(W,H);if(a.bytes.length!==W*H*4)a.bytes=new Uint8Array(W*H*4);
      u.iResolution.value.set(W,H,1);u.iTime.value=t;u.uFlowTime.value=t;u.uFogTime.value=t;u.iMouse.value.set(0,0,0,0);
      // Pointer tilt/fade-in are demo behavior, not persistent/exportable Studio state.
      u.uFade.value=p.mstyle==='pulse'&&amount ? .7+.3*Math.sin(t*2) : 1;
      for(const [key,,min,max,,uniform] of controls)u[uniform].value=clamp(p[key],min,max);
      const hex=/^#[0-9a-f]{6}$/i.test(p.c2)?p.c2:defaults.c2;u.uColor.value.set(...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255));
      const oldTarget=r.getRenderTarget(),viewport=r.getViewport(new THREE.Vector4()),scissor=r.getScissor(new THREE.Vector4()),scissorTest=r.getScissorTest(),auto=r.autoClear;
      const ticket=c.ticket=(c.ticket||0)+1;
      const present=bytes=>{
      if(c.ticket!==ticket||gpu!==a)return;
      if(c.cv.width!==W||c.cv.height!==H){c.cv.width=W;c.cv.height=H;c.image=null;}const image=c.image||(c.image=c.ctx.createImageData(W,H));
      for(let row=0;row<H;row++)image.data.set(bytes.subarray((H-1-row)*W*4,(H-row)*W*4),row*W*4);
      // Upstream uses an opaque black canvas + CSS screen. Optical alpha keeps
      // exactly that light contribution with native screen blend, without an opaque
      // rectangular layer. The shader's alpha excludes fog and must not dim it.
      for(let i=0;i<image.data.length;i+=4){const alpha=Math.max(image.data[i],image.data[i+1],image.data[i+2]);for(let ch=0;ch<3;ch++)image.data[i+ch]=alpha?Math.round(image.data[i+ch]*255/alpha):0;image.data[i+3]=alpha;}
      c.ctx.putImageData(image,0,0);c.key=key;
      };
      try{r.autoClear=true;r.setRenderTarget(target);r.setViewport(0,0,W,H);r.setScissorTest(false);r.render(a.scene,a.camera);
        if(preview&&r.readRenderTargetPixelsAsync&&!c.asyncFailed){
          if(c.bytes?.length!==W*H*4)c.bytes=new Uint8Array(W*H*4);c.pending=true;
          r.readRenderTargetPixelsAsync(target,0,0,W,H,c.bytes).then(present).catch(()=>{c.asyncFailed=true;}).finally(()=>{c.pending=false;});
        }else{r.readRenderTargetPixels(target,0,0,W,H,a.bytes);present(a.bytes);}
      }finally{r.setRenderTarget(oldTarget);r.setViewport(viewport);r.setScissor(scissor);r.setScissorTest(scissorTest);r.autoClear=auto;}
    }
    g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c.cv,x,y,w,h);g.restore();
  }
  const kit={label:'Laser Flow',size:[.65,.5],blend:'screen',noShuffle:true,anim:true,motionOnAdd:true,defaults,normalizeP:p=>params({p}),
    ui:[{k:'c2',t:'color',label:'Laser colour'},...controls.map(([k,label,min,max,step])=>({k,t:'range',label,min,max,step}))],
    draw(g,it,x,y,w,h,k){const M=kitM(it);draw(g,it,x,y,w,h,k,M.t,M.a);}
  };
  window.CerebraLaser={draw,kit,reference:'DavidHDev/react-bits/LaserFlow',renderer:'shared-webgl'};
})();
