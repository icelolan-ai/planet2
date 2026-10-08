/* Freehand Laser Flow: warp the actual Kit shader along a native stroke.
   Native stroke/history/project/export and native line clock remain the owners. */
(() => {
  if (window.CerebraLaserPen) return;
  const frames = new WeakMap(), scratch = new WeakMap(), textures = new Map();
  const defaults = { effect: 'plain', laserSpeed: 1, laserDensity: 1, laserIntensity: 5, laserFog: .45, laserOn: true, laserWispSpeed: 1, laserFlowStrength: .25, laserFogScale: .3, laserFogSpeed: 1, laserDecay: 1.1, laserFalloff: 1.2, laserGlow: 3 };
  function triangle(g, image, uv, xy) {
    const u1=uv[1][0]-uv[0][0],v1=uv[1][1]-uv[0][1],u2=uv[2][0]-uv[0][0],v2=uv[2][1]-uv[0][1],det=u1*v2-u2*v1;
    if (Math.abs(det)<.0001) return;
    const X1=xy[1][0]-xy[0][0],Y1=xy[1][1]-xy[0][1],X2=xy[2][0]-xy[0][0],Y2=xy[2][1]-xy[0][1];
    const a=(X1*v2-X2*v1)/det,b=(Y1*v2-Y2*v1)/det,c=(X2*u1-X1*u2)/det,d=(Y2*u1-Y1*u2)/det;
    g.save();g.beginPath();xy.forEach((p,i)=>g[i?'lineTo':'moveTo'](...p));g.closePath();g.clip();
    g.transform(a,b,c,d,xy[0][0]-a*uv[0][0]-c*uv[0][1],xy[0][1]-b*uv[0][0]-d*uv[0][1]);
    g.drawImage(image,0,0);g.restore();
  }
  function draw(g,it,st,w,h,x,y,k,time,preview) {
    const s=window.__cerebra?.studio;if(!s||!window.CerebraLaser||!st.pts?.length)return;
    let byContext=frames.get(st);if(!byContext)frames.set(st,byContext=new WeakMap());let c=byContext.get(g);
    if(!c){c={path:document.createElementNS('http://www.w3.org/2000/svg','path')};byContext.set(g,c);}
    const p=st.laser||{};
    const parameters={c2:st.color,horizontalBeamOffset:0,verticalBeamOffset:-.5,horizontalSizing:.1,verticalSizing:2,wispDensity:p.density??1,wispIntensity:p.intensity??5,wispSpeed:15*(p.wispSpeed??1),flowSpeed:.35,flowStrength:p.flowStrength??.25,fogFallSpeed:.6*(p.fogSpeed??1),fogIntensity:p.fog??.45,fogScale:p.fogScale??.3,decay:p.decay??1.1,falloffStart:p.falloff??1.2,mstyle:'flow'};
    const textureKey=JSON.stringify([parameters,!!preview,p.on!==false]);let texture=textures.get(textureKey);
    if(!texture){const cv=document.createElement('canvas');cv.width=256;cv.height=1024;texture={cv,g:cv.getContext('2d'),source:{p:parameters}};textures.set(textureKey,texture);if(textures.size>12)textures.delete(textures.keys().next().value);}
    if(!texture.g)return;texture.g.clearRect(0,0,256,1024);
    window.CerebraLaser.draw(texture.g,texture.source,0,0,256,1024,1,s.app.reduced?0:time*(p.speed??1),p.on===false||p.speed===0?0:1,{preview:preview&&!s.app.reduced&&p.on!==false&&(p.speed??1)>0});
    if(c.w!==w||c.h!==h||c.w0!==it.w0||c.h0!==it.h0||c.pts!==st.pts){
      c.path.setAttribute('d',s.strokeD(it,w,h,0,0,st.pts));const length=c.path.getTotalLength();
      c.length=length;const n=Math.max(2,Math.min(128,Math.ceil(length/10)));c.points=[];
      for(let i=0;i<=n;i++){const at=length*i/n,P=c.path.getPointAtLength(at),A=c.path.getPointAtLength(Math.max(0,at-.5)),B=c.path.getPointAtLength(Math.min(length,at+.5)),L=Math.hypot(B.x-A.x,B.y-A.y)||1;c.points.push({x:P.x,y:P.y,nx:-(B.y-A.y)/L,ny:(B.x-A.x)/L,q:i/n});}
      Object.assign(c,{w,h,w0:it.w0,h0:it.h0,pts:st.pts});
    }
    const glow=Math.max(0,Math.min(8,p.glow??3)),half=Math.max(1,st.size*k*Math.max(10,glow*2+2));
    // Extend the sampled texture past each endpoint. A round stroked mask, not
    // per-quad alpha, defines the visible tip and its soft halo.
    const first=c.points[0],last=c.points.at(-1),extension=half,total=c.length+2*extension;
    const points=c.length<1?c.points:[{...first,x:first.x-first.ny*extension,y:first.y+first.nx*extension,q:0},...c.points.map(v=>({...v,q:(v.q*c.length+extension)/total})),{...last,x:last.x+last.ny*extension,y:last.y-last.nx*extension,q:1}];
    const L=Math.min(...points.map(v=>v.x))-half,T=Math.min(...points.map(v=>v.y))-half,R=Math.max(...points.map(v=>v.x))+half,Btm=Math.max(...points.map(v=>v.y))+half;
    let buffer=scratch.get(g);if(!buffer){const cv=document.createElement('canvas'),mask=document.createElement('canvas');buffer={cv,g:cv.getContext('2d'),mask,mg:mask.getContext('2d')};scratch.set(g,buffer);}if(!buffer.g)return;
    const transform=g.getTransform(),density=Math.min(Math.hypot(transform.a,transform.b)||1,4096/Math.max(R-L,Btm-T),Math.sqrt((preview?2e6:8e6)/Math.max(1,(R-L)*(Btm-T)))),W=Math.max(1,Math.ceil((R-L)*density)),H=Math.max(1,Math.ceil((Btm-T)*density));
    if(buffer.cv.width!==W||buffer.cv.height!==H){buffer.cv.width=W;buffer.cv.height=H;}
    const out=buffer.g;out.setTransform(1,0,0,1,0,0);out.clearRect(0,0,W,H);out.setTransform(density,0,0,density,-L*density,-T*density);out.globalCompositeOperation='lighter';out.imageSmoothingEnabled=true;out.imageSmoothingQuality='high';
    const point=(v,side)=>[v.x+v.nx*half*side,v.y+v.ny*half*side];
    if(c.length<1){
      // A tap is a round ink dot with a radial halo, never a texture rectangle.
      const radius=Math.max(.5,st.size*k/2),halo=Math.max(radius+.01,radius+glow*st.size*k),hex=/^#[0-9a-f]{6}$/i.test(st.color)?st.color:'#ffffff';
      const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',');
      const fade=out.createRadialGradient(first.x,first.y,radius,first.x,first.y,halo);fade.addColorStop(0,`rgba(${rgb},1)`);fade.addColorStop(1,`rgba(${rgb},0)`);
      out.globalAlpha=1;out.fillStyle=fade;out.beginPath();out.arc(first.x,first.y,halo,0,Math.PI*2);out.fill();
    }else{
      out.globalAlpha=1;
      for(let i=1;i<points.length;i++){
        const A=points[i-1],B=points[i],a=point(A,-1),b=point(A,1),c1=point(B,-1),d=point(B,1),v0=928-A.q*160,v1=928-B.q*160;
        triangle(out,texture.cv,[[0,v0],[256,v0],[0,v1]],[a,b,c1]);triangle(out,texture.cv,[[256,v0],[256,v1],[0,v1]],[b,d,c1]);
      }
      if(buffer.mg){
        if(buffer.mask.width!==W||buffer.mask.height!==H){buffer.mask.width=W;buffer.mask.height=H;}
        const m=buffer.mg;m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,W,H);m.setTransform(density,0,0,density,-L*density,-T*density);m.globalCompositeOperation='source-over';m.globalAlpha=1;m.lineCap=m.lineJoin='round';m.lineWidth=st.size*k;m.strokeStyle='#fff';m.shadowColor='#fff';m.shadowBlur=glow*st.size*k*density;
        m.stroke(new Path2D(c.path.getAttribute('d')));m.shadowBlur=0;
        out.setTransform(1,0,0,1,0,0);out.globalCompositeOperation='destination-in';out.drawImage(buffer.mask,0,0);
      }
    }
    // The native export path already applies masks/alpha lock. Apply them here
    // only for the moving overlay, which otherwise sits outside the native SVG.
    if(preview&&(st.clip||it.mask?.on)&&buffer.mg){
      if(buffer.mask.width!==W||buffer.mask.height!==H){buffer.mask.width=W;buffer.mask.height=H;}
      const m=buffer.mg;m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,W,H);m.setTransform(density,0,0,density,-L*density,-T*density);m.globalCompositeOperation='source-over';m.globalAlpha=1;m.shadowBlur=0;m.strokeStyle=m.fillStyle='#fff';m.lineCap=m.lineJoin='round';
      if(st.clip)(it.strokes||[]).filter(q=>!q.clip).forEach(q=>{m.lineWidth=q.size*k;m.stroke(new Path2D(s.strokeD(it,w,h,0,0,q.pts)));});else m.fillRect(L,T,R-L,Btm-T);
      if(it.mask?.on)(it.mask.strokes||[]).forEach(q=>{m.globalCompositeOperation=q.mode==='hide'?'destination-out':'source-over';m.lineWidth=q.size*k;m.stroke(new Path2D(s.maskD(q.pts,w,h)));});
      out.setTransform(1,0,0,1,0,0);out.globalAlpha=1;out.globalCompositeOperation='destination-in';out.drawImage(buffer.mask,0,0);
    }
    g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(buffer.cv,x+L,y+T,R-L,Btm-T);g.restore();
  }
  window.CerebraLaserPen={draw,defaults,source:'CerebraLaser shared upstream shader'};
  function boot(){
    const s=window.__cerebra?.studio;if(!s?.addStrokeAbs||!s.syncAssistBar||!s.__s7Ready){setTimeout(boot,180);return;}if(s.__laserPenReady)return;s.__laserPenReady=true;
    for(const [key,value]of Object.entries(defaults)){if(s.drawSet[key]===undefined)s.drawSet[key]=value;s.drawDefaults[key]=value;}
    const fly=s.el.querySelector('[data-fly="draw"]'),bar=s.el.querySelector('.st-assist');
    const controls=[['laserGlow','Glow spread',0,8,.1],['laserFlowStrength','Flow strength',0,1,.01],['laserDensity','Wisp density',.1,2,.1],['laserIntensity','Wisp intensity',0,20,.1],['laserFog','Fog intensity',0,1,.05],['laserFogScale','Fog scale',.1,1,.01],['laserDecay','Decay',.5,3,.01],['laserFalloff','Beam fade',.5,3,.01],['laserSpeed','Animation speed',0,2,.05],['laserWispSpeed','Wisp speed',0,3,.05],['laserFogSpeed','Fog speed',0,3,.05]];
    const section=document.createElement('section');section.className='st-laser-pen';
    section.innerHTML='<b class="st-fly-sub">Laser Flow pen</b><label class="st-fly-row"><span>Pen effect</span><select data-laser-pref="effect"><option value="plain">Plain pen</option><option value="laser-flow">Laser Flow</option></select></label><div data-laser-options><label class="st-fly-row"><span>Edit current drawing</span><input type="checkbox" data-laser-edit></label><label class="st-fly-row"><span>Laser colour</span><input type="color" data-laser-ink="color"></label><label class="st-fly-row"><span>Pen thickness</span><output data-laser-ink-value="size"></output><input type="range" min="1" max="40" step="1" data-laser-ink="size"></label><label class="st-fly-row"><span>Pen opacity</span><output data-laser-ink-value="opacity"></output><input type="range" min="0.05" max="1" step="0.05" data-laser-ink="opacity"></label><label class="st-fly-row"><span>Animate Laser Flow</span><input type="checkbox" data-laser-pref="laserOn"></label>'+controls.map(([key,label,min,max,step])=>`<label class="st-fly-row"><span>${label}</span><output data-laser-value="${key}"></output><input type="range" min="${min}" max="${max}" step="${step}" data-laser-pref="${key}"></label>`).join('')+'</div><button type="button" class="st-btn" data-laser-apply>Apply effect to selected drawing</button>';
    fly.querySelector('[data-draw-done]').before(section);
    const quick=document.createElement('div');quick.className='st-assist-sl';quick.innerHTML='<span>Pen effect</span><select aria-label="Pen effect"><option value="plain">Plain pen</option><option value="laser-flow">Laser Flow</option></select><button type="button" class="st-btn" data-laser-settings>Pen effect settings</button>';bar.querySelector('.st-assist-rp').append(quick);
    let targetId=null;
    const editable=()=>s.items.find(i=>i.id===targetId&&i.kind==='stroke'&&!i.locked);
    quick.querySelector('[data-laser-settings]').onclick=ev=>{
      const it=s.sel?.kind==='stroke'?s.sel:s.items.find(i=>i.kind==='stroke'&&i.drawCur&&!i.locked);if(it)targetId=it.id;
      const st=it?.strokes?.find(q=>q.type==='laser');section.querySelector('[data-laser-edit]').checked=!!st;
      if(st){s.drawSet.effect='laser-flow';Object.assign(s.drawSet,{color:st.color,size:st.size,opacity:st.opacity});for(const [key,value]of Object.entries(defaults))if(key.startsWith('laser')){const prop=key.slice(5);s.drawSet[key]=st.laser?.[prop[0].toLowerCase()+prop.slice(1)]??value;}}
      sync();s.syncAssistBar();s.closeStudioMenus?.('fly');fly.hidden=false;s.layoutFly(fly,ev.currentTarget,true);fly.scrollTop=section.offsetTop-12;
    };
    const sync=()=>{section.querySelectorAll('[data-laser-ink]').forEach(el=>{const v=s.drawSet[el.dataset.laserInk];el.value=v;const out=section.querySelector(`[data-laser-ink-value="${el.dataset.laserInk}"]`);if(out)out.textContent=el.dataset.laserInk==='opacity'?Math.round(v*100)+'%':v+'px';});const edit=section.querySelector('[data-laser-edit]');edit.closest('label').hidden=!editable();if(!editable())edit.checked=false;section.querySelectorAll('[data-laser-pref]').forEach(el=>{const v=s.drawSet[el.dataset.laserPref];if(el.type==='checkbox')el.checked=!!v;else el.value=v;const out=section.querySelector(`[data-laser-value="${el.dataset.laserPref}"]`);if(out)out.textContent=String(+Number(v).toFixed(2));});section.querySelector('[data-laser-options]').hidden=s.drawSet.effect!=='laser-flow';quick.querySelector('select').value=s.drawSet.effect;section.querySelector('[data-laser-apply]').hidden=!s.items.some(i=>i.id===targetId&&i.kind==='stroke'&&!i.locked);s.ink.closest('svg').style.filter=s.drawSet.effect==='laser-flow'?`drop-shadow(0 0 6px ${s.drawSet.color})`:'';};
    const prefs=()=>({speed:s.drawSet.laserSpeed,density:s.drawSet.laserDensity,intensity:s.drawSet.laserIntensity,fog:s.drawSet.laserFog,on:s.drawSet.laserOn,wispSpeed:s.drawSet.laserWispSpeed,flowStrength:s.drawSet.laserFlowStrength,fogScale:s.drawSet.laserFogScale,fogSpeed:s.drawSet.laserFogSpeed,decay:s.drawSet.laserDecay,falloff:s.drawSet.laserFalloff,glow:s.drawSet.laserGlow});
    const updateDrawing=(quick=false)=>{const it=editable();if(!it)return;it.strokes.forEach(st=>{if(st.type==='line')return;Object.assign(st,{color:s.drawSet.color,size:s.drawSet.size,opacity:s.drawSet.opacity});if(s.drawSet.effect==='laser-flow'){st.type='laser';st.laser=prefs();}else{delete st.type;delete st.laser;}});s.writeStrokes(it,s.strokesAbs(it),quick);if(quick)s.commitSoon();};
    const save=()=>{try{localStorage.setItem('cerebra-studio-pencil',JSON.stringify(s.drawSet));}catch{}sync();};
    section.querySelectorAll('[data-laser-pref]').forEach(el=>el.addEventListener('input',()=>{s.drawSet[el.dataset.laserPref]=el.type==='checkbox'?el.checked:el.type==='range'?+el.value:el.value;save();if(section.querySelector('[data-laser-edit]').checked)updateDrawing(true);}));
    section.querySelectorAll('[data-laser-ink]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.laserInk;s.drawSet[key]=el.type==='range'?+el.value:el.value;const base=fly.querySelector(`[data-dset="${key}"]`);base.value=el.value;base.dispatchEvent(new Event('input',{bubbles:true}));save();if(section.querySelector('[data-laser-edit]').checked)updateDrawing(true);}));
    section.addEventListener('change',()=>s.flushCommit());
    section.querySelector('[data-laser-edit]').onchange=()=>{if(section.querySelector('[data-laser-edit]').checked){s.flushCommit();updateDrawing();}};
    quick.querySelector('select').onchange=ev=>{s.drawSet.effect=ev.target.value;save();};
    const add=s.addStrokeAbs.bind(s);s.addStrokeAbs=(sk,P)=>{if(s.drawTool==='pen'&&!sk.type&&s.drawSet.effect==='laser-flow')sk={...sk,type:'laser',laser:prefs()};return add(sk,P);};
    const select=s.select.bind(s);s.select=it=>{if(it){if(it.id!==targetId)section.querySelector('[data-laser-edit]').checked=false;targetId=it.kind==='stroke'?it.id:null;}const prev=s.sel;select(it);if(prev?.kind==='kit'&&prev!==it&&s.items.includes(prev))s.drawKit(prev,prev.el.offsetWidth,prev.el.offsetHeight);if(it?.kind==='kit')s.drawKit(it,it.el.offsetWidth,it.el.offsetHeight);sync();};
    section.querySelector('[data-laser-apply]').onclick=()=>{if(!editable())return;s.flushCommit();updateDrawing();section.querySelector('[data-laser-edit]').checked=true;sync();};
    const reset=s.resetDrawingDefaults.bind(s);s.resetDrawingDefaults=()=>{reset();section.querySelector('[data-laser-edit]').checked=false;sync();};
    const resetItem=s.resetItemDesign.bind(s);s.resetItemDesign=it=>{resetItem(it);if(it?.kind==='stroke'&&it.strokes?.some(st=>st.type==='laser')){it.strokes.filter(st=>st.type==='laser').forEach(st=>Object.assign(st,{color:'#ffffff',size:4,opacity:1,dash:'solid',laser:{speed:1,density:1,intensity:5,fog:.45,on:true,wispSpeed:1,flowStrength:.25,fogScale:.3,fogSpeed:1,decay:1.1,falloff:1.2,glow:3}}));s.writeStrokes(it,s.strokesAbs(it),true);}};
    const language=window.__cerebraLanguage,nodes=[...section.querySelectorAll('.st-fly-sub,label > span,option,[data-laser-apply]'),...quick.querySelectorAll('span,option,[data-laser-settings]')],labels=nodes.map(n=>n.textContent);
    const localize=()=>nodes.forEach((n,i)=>{n.textContent=language?.label(labels[i])||labels[i];});language?.onChange(localize);localize();
    fly.addEventListener('input',sync);sync();
    const css=document.createElement('style');css.textContent='#studio .st-laser-pen{border-top:1px solid #ffffff20;padding-top:12px;margin-top:10px}#studio [data-fly=draw]:has(.st-laser-pen [data-laser-options]:not([hidden])){width:560px;max-width:calc(100vw - 24px)}#studio .st-laser-pen [data-laser-options]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}#studio .st-laser-pen [data-laser-options][hidden]{display:none}#studio .st-laser-pen .st-fly-row{min-width:0;padding:8px;border:1px solid #ffffff18;border-radius:12px}#studio .st-laser-pen [data-laser-options] label:first-child{grid-column:1/-1}@media(max-width:600px){#studio .st-laser-pen [data-laser-options]{grid-template-columns:1fr}}#studio .st-assist-rp > div:last-child{grid-column:1/-1}#studio [data-laser-settings]{grid-column:1/-1;min-height:32px}#studio .st-assist-rp select{max-width:140px;min-height:36px;background:#202430;color:#f4f2f6;border:1px solid #444957;border-radius:8px}';document.head.append(css);
  }
  setTimeout(boot,0);
})();
