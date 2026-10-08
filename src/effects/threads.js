/* Actual React Bits Threads fragment shader (40 Perlin-driven lines), adapted to the Studio Kit.
 * DavidHDev/react-bits/src/content/Backgrounds/Threads/Threads.jsx
 * MIT + Commons Clause, copyright 2026 David Haz; full notice in template.html.
 * Shared stage renderer; the native Kit loop owns time/visibility/scheduling (no OGL renderer, no own RAF).
 * Source blend (SRC_ALPHA, ONE_MINUS_SRC_ALPHA over a transparent clear) is reproduced so alpha = value^2 like the demo.
 */
(() => {
  if(window.CerebraThreads)return;
  const defaults={color:'#ffffff',amplitude:1,distance:0,start:0,mouseX:.5,mouseY:.5};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a)),cache=new WeakMap();
  const vertex="varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}";
  const fragment=`precision highp float;
uniform float iTime;uniform vec3 iResolution;uniform vec3 uColor;uniform float uAmplitude;uniform float uDistance;uniform vec2 uMouse;
#define PI 3.1415926538
const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;
float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}
float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}
float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;
    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);
    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;
    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );
    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;
    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        y,
        st.y
    );
    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        st.y
    );
    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }
    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}`;
  let gpu;
  function init(){
    const renderer=window.__cerebra?.stage.renderer;if(!renderer)return;
    const uniforms={iTime:{value:0},iResolution:{value:new THREE.Vector3(1,1,1)},uColor:{value:new THREE.Vector3(1,1,1)},uAmplitude:{value:1},uDistance:{value:0},uMouse:{value:new THREE.Vector2(.5,.5)}};
    const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,depthWrite:false,depthTest:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor});
    const geometry=new THREE.PlaneGeometry(2,2),scene=new THREE.Scene(),mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
    const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false});target.texture.colorSpace=THREE.NoColorSpace;
    gpu={renderer,uniforms,geometry,material,scene,camera:new THREE.OrthographicCamera(-1,1,1,-1,0,1),target,bytes:new Uint8Array(4)};
    addEventListener('pagehide',()=>{target.dispose();geometry.dispose();material.dispose();gpu=null;},{once:true});return gpu;
  }
  function draw(g,w,h,t,options,mode={}){
    const p={...defaults,...options};
    const limit=mode.preview?(mode.selected?1280:640):4096;
    const scale=Math.min(limit/Math.max(w,h),Math.sqrt((mode.preview?1.5e6:8e6)/Math.max(1,w*h)),1),W=Math.max(8,Math.round(w*scale)),H=Math.max(8,Math.round(h*scale));
    const time=Math.floor((t+clamp(p.start,0,600))*30)/30;
    const key=JSON.stringify([p,W,H,time]);let c=cache.get(g);
    if((!c||c.key!==key)&&!(mode.preview&&c?.pending)){
      const a=gpu||init();if(!a)return;
      if(!c){const canvas=document.createElement('canvas');c={canvas,ctx:canvas.getContext('2d')};cache.set(g,c);}if(!c.ctx)return;
      const {renderer:r,uniforms:u,target}=a;target.setSize(W,H);if(a.bytes.length!==W*H*4)a.bytes=new Uint8Array(W*H*4);
      u.iTime.value=time;u.iResolution.value.set(W,H,W/H);u.uAmplitude.value=clamp(p.amplitude,0,5);u.uDistance.value=clamp(p.distance,-2,3);u.uMouse.value.set(clamp(p.mouseX,0,1),clamp(p.mouseY,0,1));
      const color=new THREE.Color(/^#[0-9a-f]{6}$/i.test(p.color)?p.color:defaults.color);u.uColor.value.set(color.r,color.g,color.b);
      const old=r.getRenderTarget(),vp=r.getViewport(new THREE.Vector4()),sc=r.getScissor(new THREE.Vector4()),test=r.getScissorTest(),auto=r.autoClear,clear=r.getClearColor(new THREE.Color()),alpha=r.getClearAlpha();
      const ticket=c.ticket=(c.ticket||0)+1;
      const present=bytes=>{
        if(c.ticket!==ticket||gpu!==a)return;
        if(c.canvas.width!==W||c.canvas.height!==H){c.canvas.width=W;c.canvas.height=H;c.image=null;}const image=c.image||(c.image=c.ctx.createImageData(W,H));
        for(let row=0;row<H;row++)image.data.set(bytes.subarray((H-1-row)*W*4,(H-row)*W*4),row*W*4);
        // The GPU output is premultiplied (colour*alpha); Canvas2D ImageData is straight alpha.
        for(let i=0;i<image.data.length;i+=4){const al=image.data[i+3];if(al)for(let ch=0;ch<3;ch++)image.data[i+ch]=Math.min(255,Math.round(image.data[i+ch]*255/al));}
        c.ctx.putImageData(image,0,0);c.key=key;
      };
      try{r.autoClear=true;r.setClearColor(0x000000,0);r.setRenderTarget(target);r.setViewport(0,0,W,H);r.setScissorTest(false);r.render(a.scene,a.camera);
        if(mode.preview&&r.readRenderTargetPixelsAsync&&!c.asyncFailed){if(c.bytes?.length!==W*H*4)c.bytes=new Uint8Array(W*H*4);c.pending=true;r.readRenderTargetPixelsAsync(target,0,0,W,H,c.bytes).then(present).catch(()=>{c.asyncFailed=true;}).finally(()=>{c.pending=false;});}
        else{r.readRenderTargetPixels(target,0,0,W,H,a.bytes);present(a.bytes);}
      }
      finally{r.setRenderTarget(old);r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);r.autoClear=auto;r.setClearColor(clear,alpha);}
    }
    if(c?.key&&c.canvas.width){g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c.canvas,0,0,w,h);g.restore();}
  }
  const kit={label:'Threads',size:[.9,.6],noShuffle:true,anim:true,motionOnAdd:true,defaults,
    ui:[{k:'color',t:'color',label:'Thread colour'},
      {k:'amplitude',t:'range',label:'Amplitude',min:0,max:3,step:.1},{k:'distance',t:'range',label:'Distance',min:0,max:2,step:.05},
      {k:'start',t:'range',label:'Start time (s)',min:0,max:120,step:1},
      {k:'mouseX',t:'range',label:'Pointer X',min:0,max:1,step:.05},{k:'mouseY',t:'range',label:'Pointer Y',min:0,max:1,step:.05}],
    draw(g,it,x,y,w,h){const M=kitM(it),p={...defaults,...it.p};g.save();g.translate(x,y);try{draw(g,w,h,M.a?M.t*M.a/.6:0,p,{preview:typeof KIT_PREVIEW!=='undefined'&&KIT_PREVIEW,selected:it===window.__cerebra?.studio?.sel&&!window.__cerebra.studio.lite});}finally{g.restore();}}
  };
  window.CerebraThreads={draw,defaults,kit,reference:'DavidHDev/react-bits/Threads',renderer:'shared-webgl',preview:'async-readback'};
})();
