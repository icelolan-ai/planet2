/* Actual React Bits Light Pillar ray-march shader, adapted to page backdrop.
 * DavidHDev/react-bits/src/content/Backgrounds/LightPillar/LightPillar.jsx
 * MIT + Commons Clause, copyright 2026 David Haz; full notice in template.html.
 * Shared stage renderer; caller owns page visibility, time and scheduling.
 */
(() => {
  if(window.CerebraLightPillar)return;
  const profiles={low:{iterations:24,waveIterations:1,precision:'mediump',stepMultiplier:1.5,size:256},medium:{iterations:40,waveIterations:2,precision:'mediump',stepMultiplier:1.2,size:384},high:{iterations:80,waveIterations:4,precision:'highp',stepMultiplier:1,size:512}};
  const defaults={color1:'#5227ff',color2:'#ff9ffc',intensity:1,speed:.3,glowAmount:.002,pillarWidth:3,pillarHeight:.4,noiseIntensity:.5,rotation:25,quality:matchMedia('(pointer:coarse)').matches?'low':'medium',interactive:false,mixBlendMode:'screen'};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a)),cache=new WeakMap();
  const vertex="\n      varying vec2 vUv;\n      void main() {\n        vUv = uv;\n        gl_Position = vec4(position, 1.0);\n      }\n    ",fragmentTemplate="\n      precision ${settings.precision} float;\n\n      uniform float uTime;\n      uniform vec2 uResolution;\n      uniform vec2 uMouse;\n      uniform vec3 uTopColor;\n      uniform vec3 uBottomColor;\n      uniform float uIntensity;\n      uniform bool uInteractive;\n      uniform float uGlowAmount;\n      uniform float uPillarWidth;\n      uniform float uPillarHeight;\n      uniform float uNoiseIntensity;\n      uniform float uLightMode;\n      uniform float uRotCos;\n      uniform float uRotSin;\n      uniform float uPillarRotCos;\n      uniform float uPillarRotSin;\n      uniform float uWaveSin;\n      uniform float uWaveCos;\n      varying vec2 vUv;\n\n      const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};\n      const int MAX_ITER = ${settings.iterations};\n      const int WAVE_ITER = ${settings.waveIterations};\n\n      void main() {\n        vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);\n        uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);\n\n        vec3 ro = vec3(0.0, 0.0, -10.0);\n        vec3 rd = normalize(vec3(uv, 1.0));\n\n        float rotC = uRotCos;\n        float rotS = uRotSin;\n        if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {\n          float a = uMouse.x * 6.283185;\n          rotC = cos(a);\n          rotS = sin(a);\n        }\n\n        vec3 col = vec3(0.0);\n        float t = 0.1;\n        \n        for(int i = 0; i < MAX_ITER; i++) {\n          vec3 p = ro + rd * t;\n          p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);\n\n          vec3 q = p;\n          q.y = p.y * uPillarHeight + uTime;\n          \n          float freq = 1.0;\n          float amp = 1.0;\n          for(int j = 0; j < WAVE_ITER; j++) {\n            q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);\n            q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;\n            freq *= 2.0;\n            amp *= 0.5;\n          }\n          \n          float d = length(cos(q.xz)) - 0.2;\n          float bound = length(p.xz) - uPillarWidth;\n          float k = 4.0;\n          float h = max(k - abs(d - bound), 0.0);\n          d = max(d, bound) + h * h * 0.0625 / k;\n          d = abs(d) * 0.15 + 0.01;\n\n          float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);\n          col += mix(uBottomColor, uTopColor, grad) / d;\n\n          t += d * STEP_MULT;\n          if(t > 50.0) break;\n        }\n\n        float widthNorm = uPillarWidth / 3.0;\n        col = tanh(col * uGlowAmount / widthNorm);\n        \n        col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;\n        \n        vec3 result = clamp(col * uIntensity, 0.0, 1.0);\n        if (uLightMode > 0.5) {\n          float energy = max(result.r, max(result.g, result.b));\n          vec3 hue = result / max(energy, 0.001);\n          float coverage = smoothstep(0.025, 0.95, energy);\n          hue = pow(clamp(hue, 0.0, 1.0), vec3(1.25));\n          result = mix(vec3(1.0), hue, coverage * 0.94);\n        }\n        gl_FragColor = vec4(result, 1.0);\n      }\n    ";
  let gpu;
  function init(){
    const renderer=window.__cerebra?.stage.renderer;if(!renderer)return;
    const uniforms={uTime:{value:0},uResolution:{value:new THREE.Vector2()},uMouse:{value:new THREE.Vector2()},uTopColor:{value:new THREE.Vector3()},uBottomColor:{value:new THREE.Vector3()},uIntensity:{value:1},uInteractive:{value:false},uGlowAmount:{value:.002},uPillarWidth:{value:3},uPillarHeight:{value:.4},uNoiseIntensity:{value:.5},uLightMode:{value:0},uRotCos:{value:1},uRotSin:{value:0},uPillarRotCos:{value:1},uPillarRotSin:{value:0},uWaveSin:{value:Math.sin(.4)},uWaveCos:{value:Math.cos(.4)}};
    const geometry=new THREE.PlaneGeometry(2,2),scene=new THREE.Scene(),mesh=new THREE.Mesh(geometry);mesh.frustumCulled=false;scene.add(mesh);
    const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false});target.texture.colorSpace=THREE.NoColorSpace;
    gpu={renderer,uniforms,geometry,scene,mesh,camera:new THREE.OrthographicCamera(-1,1,1,-1,0,1),target,materials:{},bytes:new Uint8Array(4)};
    addEventListener('pagehide',()=>{target.dispose();geometry.dispose();Object.values(gpu?.materials||{}).forEach(m=>m.dispose());gpu=null;},{once:true});return gpu;
  }
  function shader(profile){return fragmentTemplate.replaceAll('${settings.precision}',profile.precision).replaceAll('${settings.stepMultiplier.toFixed(1)}',profile.stepMultiplier.toFixed(1)).replaceAll('${settings.iterations}',profile.iterations).replaceAll('${settings.waveIterations}',profile.waveIterations);}
  function draw(g,w,h,t,options){
    const p={...defaults,...options},q=profiles[p.quality]?p.quality:defaults.quality,profile=profiles[q];
    const scale=Math.min(profile.size/Math.max(w,h),1),W=Math.max(8,Math.round(w*scale)),H=Math.max(8,Math.round(h*scale));
    // Page time advances in seconds; equivalent to source 60fps reference clock.
    const time=Math.floor(t*clamp(p.speed,0,2)*.96*30)/30;
    const key=JSON.stringify([p,W,H,time]);let c=cache.get(g);
    if(!c||c.key!==key){
      const a=gpu||init();if(!a)return;
      if(!c){const canvas=document.createElement('canvas');c={canvas,ctx:canvas.getContext('2d')};cache.set(g,c);}if(!c.ctx)return;
      if(!a.materials[q])a.materials[q]=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:shader(profile),uniforms:a.uniforms,transparent:true,depthWrite:false,depthTest:false});
      a.mesh.material=a.materials[q];
      const {renderer:r,uniforms:u,target}=a;target.setSize(W,H);if(a.bytes.length!==W*H*4)a.bytes=new Uint8Array(W*H*4);
      u.uTime.value=time;u.uResolution.value.set(W,H);
      u.uMouse.value.set(clamp(p.mouseX??0,-1,1),clamp(p.mouseY??0,-1,1));u.uInteractive.value=!!p.interactive;
      const color=new THREE.Color(/^#[0-9a-f]{6}$/i.test(p.color1)?p.color1:defaults.color1);u.uTopColor.value.set(color.r,color.g,color.b);
      color.set(/^#[0-9a-f]{6}$/i.test(p.color2)?p.color2:defaults.color2);u.uBottomColor.value.set(color.r,color.g,color.b);
      u.uIntensity.value=clamp(p.intensity,0,3);u.uGlowAmount.value=clamp(p.glowAmount,.001,.02);u.uPillarWidth.value=clamp(p.pillarWidth,1,10);u.uPillarHeight.value=clamp(p.pillarHeight,.1,2);u.uNoiseIntensity.value=clamp(p.noiseIntensity,0,2);
      const rotation=clamp(p.rotation,0,360)*Math.PI/180;u.uPillarRotCos.value=Math.cos(rotation);u.uPillarRotSin.value=Math.sin(rotation);u.uRotCos.value=Math.cos(time*.3);u.uRotSin.value=Math.sin(time*.3);
      const old=r.getRenderTarget(),vp=r.getViewport(new THREE.Vector4()),sc=r.getScissor(new THREE.Vector4()),test=r.getScissorTest(),auto=r.autoClear;
      try{r.autoClear=true;r.setRenderTarget(target);r.setViewport(0,0,W,H);r.setScissorTest(false);r.render(a.scene,a.camera);r.readRenderTargetPixels(target,0,0,W,H,a.bytes);}
      finally{r.setRenderTarget(old);r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);r.autoClear=auto;}
      if(c.canvas.width!==W||c.canvas.height!==H){c.canvas.width=W;c.canvas.height=H;c.image=null;}const image=c.image||(c.image=c.ctx.createImageData(W,H));
      for(let row=0;row<H;row++)image.data.set(a.bytes.subarray((H-1-row)*W*4,(H-row)*W*4),row*W*4);
      c.ctx.putImageData(image,0,0);c.key=key;
    }
    g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c.canvas,0,0,w,h);g.restore();
  }
  window.CerebraLightPillar={draw,defaults,reference:'DavidHDev/react-bits/LightPillar',renderer:'shared-webgl'};
})();
