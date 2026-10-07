/* Meta Balls: actual upstream shader/hash/orbit equations, adapted to native Kit.
 * https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/MetaBalls/MetaBalls.jsx
 * MIT + Commons Clause, copyright 2026 David Haz. Full notice in template.html.
 * No second renderer or animation clock.
 */
(() => {
  if(window.CerebraMetaBalls)return;
  const cache=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
  const defaults={count:15,radius:.1,spread:.3,softness:.12,speed:.3,c2:'#ffffff',animationSize:30,cursorBallSize:3,mstyle:'orbit'};
  function fract(x) {
  return x - Math.floor(x);
}

function hash31(p) {
  let r = [p * 0.1031, p * 0.103, p * 0.0973].map(fract);
  const r_yzx = [r[1], r[2], r[0]];
  const dotVal = r[0] * (r_yzx[0] + 33.33) + r[1] * (r_yzx[1] + 33.33) + r[2] * (r_yzx[2] + 33.33);
  for (let i = 0; i < 3; i++) {
    r[i] = fract(r[i] + dotVal);
  }
  return r;
}

function hash33(v) {
  let p = [v[0] * 0.1031, v[1] * 0.103, v[2] * 0.0973].map(fract);
  const p_yxz = [p[1], p[0], p[2]];
  const dotVal = p[0] * (p_yxz[0] + 33.33) + p[1] * (p_yxz[1] + 33.33) + p[2] * (p_yxz[2] + 33.33);
  for (let i = 0; i < 3; i++) {
    p[i] = fract(p[i] + dotVal);
  }
  const p_xxy = [p[0], p[0], p[1]];
  const p_yxx = [p[1], p[0], p[0]];
  const p_zyx = [p[2], p[1], p[0]];
  const result = [];
  for (let i = 0; i < 3; i++) {
    result[i] = fract((p_xxy[i] + p_yxx[i]) * p_zyx[i]);
  }
  return result;
}


  const fragment="precision highp float;\nuniform vec3 iResolution;\nuniform float iTime;\nuniform float edgeSoftness;\nuniform vec3 iMouse;\nuniform vec3 iColor;\nuniform vec3 iCursorColor;\nuniform float iAnimationSize;\nuniform int iBallCount;\nuniform float iCursorBallSize;\nuniform vec3 iMetaBalls[50];\nuniform float iClumpFactor;\nuniform bool enableTransparency;\nout vec4 outColor;\nconst float PI = 3.14159265359;\n\nfloat getMetaBallValue(vec2 c, float r, vec2 p) {\n  vec2 d = p - c;\n  float dist2 = dot(d, d);\n  return (r * r) / dist2;\n}\n\nvoid main() {\n  vec2 fc = gl_FragCoord.xy;\n  float scale = iAnimationSize / iResolution.y;\n  vec2 coord = (fc - iResolution.xy * 0.5) * scale;\n  vec2 mouseW = (iMouse.xy - iResolution.xy * 0.5) * scale;\n  float m1 = 0.0;\n  for (int i = 0; i < 50; i++) {\n    if (i >= iBallCount) break;\n    m1 += getMetaBallValue(iMetaBalls[i].xy, iMetaBalls[i].z, coord);\n  }\n  float m2 = getMetaBallValue(mouseW, iCursorBallSize, coord);\n  float total = m1 + m2;\n  float f = smoothstep(-1.0, 1.0, (total - 1.3) / max(0.00001, min(1.0, fwidth(total)) * edgeSoftness));\n  vec3 cFinal = vec3(0.0);\n  if (total > 0.0) {\n    float alpha1 = m1 / total;\n    float alpha2 = m2 / total;\n    cFinal = iColor * alpha1 + iCursorColor * alpha2;\n  }\n  outColor = vec4(cFinal * f, enableTransparency ? f : 1.0);\n}\n";
  const balls=Array.from({length:50},(_,i)=>{const h1=hash31(i+1),h2=hash33(h1);return {st:h1[0]*Math.PI*2,dtFactor:.1*Math.PI+h1[1]*.3*Math.PI,baseScale:5+h1[1]*5,toggle:Math.floor(h2[0]*2),radius:.5+h2[2]*1.5};});
  let gpu;
  function init(){
    const renderer=window.__cerebra?.stage.renderer;if(!renderer)return;
    const uniforms={iResolution:{value:new THREE.Vector3()},iTime:{value:0},iMouse:{value:new THREE.Vector3()},iColor:{value:new THREE.Vector3()},iCursorColor:{value:new THREE.Vector3()},iAnimationSize:{value:30},iBallCount:{value:15},iCursorBallSize:{value:3},iMetaBalls:{value:Array.from({length:50},()=>new THREE.Vector3())},iClumpFactor:{value:1},enableTransparency:{value:true},edgeSoftness:{value:1}};
    const material=new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,uniforms,vertexShader:'precision highp float; in vec3 position; void main(){gl_Position=vec4(position,1.0);}',fragmentShader:fragment,depthTest:false,depthWrite:false});
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
    const scene=new THREE.Scene();scene.add(new THREE.Mesh(geometry,material));
    const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false});target.texture.colorSpace=THREE.NoColorSpace;
    gpu={renderer,uniforms,scene,camera:new THREE.Camera(),target,bytes:new Uint8Array(4)};
    addEventListener('pagehide',()=>{target.dispose();material.dispose();geometry.dispose();gpu=null;},{once:true});return gpu;
  }
  function rgb(out,hex){const c=/^#[0-9a-f]{6}$/i.test(hex)?hex:'#ffffff';out.set(...[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255));}
  const kit={label:'Meta Balls',size:[.5,.5],defaults,noShuffle:true,anim:true,motionOnAdd:true,
    ui:[
      {k:'count',t:'range',label:'Ball count',min:2,max:50,step:1},
      {k:'radius',t:'range',label:'Ball size',min:.04,max:.22,step:.01,pct:1},
      {k:'spread',t:'range',label:'Ball separation',min:.08,max:.6,step:.01,pct:1},
      {k:'animationSize',t:'range',label:'Animation size',min:10,max:60,step:1},
      {k:'softness',t:'range',label:'Liquid edge softness',min:.02,max:.5,step:.02,pct:1},
      {k:'cursorBallSize',t:'range',label:'Cursor ball size',min:0,max:6,step:.1},
      {k:'c2',t:'color',label:'Liquid accent colour'},
      {k:'speed',t:'range',label:'Liquid speed',min:0,max:3,step:.05}
    ],
    draw(g,it,x,y,w,h,k){
      const p={...defaults,...it.p},M=kitM(it),t=M.a?Math.floor(M.t*clamp(p.speed,0,3)*M.a*30)/30:0;
      const preview=typeof KIT_PREVIEW!=='undefined'&&KIT_PREVIEW;
      const scale=Math.min((preview?1024:2048)/Math.max(w,h),1),W=Math.max(8,Math.round(w*scale)),H=Math.max(8,Math.round(h*scale));
      const key=JSON.stringify([p,it.fill,W,H,Math.floor(t*30),M.a]);let frames=cache.get(it);if(!frames)cache.set(it,frames=new WeakMap());let c=frames.get(g);
      if((!c||c.key!==key)&&!(preview&&c?.pending)){
        const a=gpu||init();if(!a)return;
        if(!c){const cv=document.createElement('canvas');c={cv,ctx:cv.getContext('2d')};frames.set(g,c);}if(!c.ctx)return;
        const {renderer:r,uniforms:u,target}=a;target.setSize(W,H);if(a.bytes.length!==W*H*4)a.bytes=new Uint8Array(W*H*4);
        u.iResolution.value.set(W,H,0);u.iTime.value=t;u.iAnimationSize.value=clamp(p.animationSize,10,60);u.iBallCount.value=Math.round(clamp(p.count,2,50));
        u.iCursorBallSize.value=clamp(p.cursorBallSize,0,6);u.edgeSoftness.value=clamp(p.softness,.02,.5)/.12;rgb(u.iColor.value,it.fill);rgb(u.iCursorColor.value,p.c2);
        const clump=clamp(p.spread,.08,.6)/.3*(p.mstyle==='breathe'?1+Math.sin(t*1.3)*M.a*.35:1);
        for(let i=0;i<u.iBallCount.value;i++){const b=balls[i],dt=t*b.dtFactor,th=b.st+dt;u.iMetaBalls.value[i].set(Math.cos(th)*b.baseScale*clump,Math.sin(th+dt*b.toggle)*b.baseScale*clump,b.radius*clamp(p.radius,.04,.22)/.1);}
        // Upstream idle cursor orbit; deterministic instead of pointer-driven so export matches.
        u.iMouse.value.set(W*(.5+Math.cos(t)*.15),H*(.5+Math.sin(t)*.15),0);
        const oldTarget=r.getRenderTarget(),viewport=r.getViewport(new THREE.Vector4()),scissor=r.getScissor(new THREE.Vector4()),scissorTest=r.getScissorTest(),auto=r.autoClear;
        const ticket=c.ticket=(c.ticket||0)+1;
        const present=bytes=>{
          if(c.ticket!==ticket||gpu!==a)return;
          if(c.cv.width!==W||c.cv.height!==H){c.cv.width=W;c.cv.height=H;c.image=null;}
          const image=c.image||(c.image=c.ctx.createImageData(W,H));
          for(let row=0;row<H;row++)image.data.set(bytes.subarray((H-1-row)*W*4,(H-row)*W*4),row*W*4);
          c.ctx.putImageData(image,0,0);c.key=key;
        };
        try{r.autoClear=true;r.setRenderTarget(target);r.setViewport(0,0,W,H);r.setScissorTest(false);r.render(a.scene,a.camera);
          if(preview&&r.readRenderTargetPixelsAsync&&!c.asyncFailed){
            if(c.bytes?.length!==W*H*4)c.bytes=new Uint8Array(W*H*4);c.pending=true;
            // The existing Kit loop presents this cache under the native motion transforms.
            r.readRenderTargetPixelsAsync(target,0,0,W,H,c.bytes).then(present).catch(()=>{c.asyncFailed=true;}).finally(()=>{c.pending=false;});
          }else{r.readRenderTargetPixels(target,0,0,W,H,a.bytes);present(a.bytes);}
        }
        finally{r.setRenderTarget(oldTarget);r.setViewport(viewport);r.setScissor(scissor);r.setScissorTest(scissorTest);r.autoClear=auto;}
      }
      g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c.cv,x,y,w,h);g.restore();
    }
  };
  window.CerebraMetaBalls={kit,reference:'DavidHDev/react-bits/MetaBalls',renderer:'shared-webgl',preview:'async-readback'};
})();
