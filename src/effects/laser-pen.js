/* Freehand Laser Flow: warp the actual Kit shader along a native stroke.
   Native stroke/history/project/export and native line clock remain the owners. */
(() => {
  if (window.CerebraLaserPen) return;
  const frames = new WeakMap(), scratch = new WeakMap(), textures = new Map();
  const defaults = { effect: 'plain', laserSpeed: 1, laserDensity: 1, laserIntensity: 5, laserFog: .45, laserOn: true };
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
    const parameters={c2:st.color,horizontalBeamOffset:0,verticalBeamOffset:-.5,horizontalSizing:.1,verticalSizing:2,wispDensity:p.density??1,wispIntensity:p.intensity??5,wispSpeed:15*(p.speed??1),flowSpeed:.35*(p.speed??1),fogFallSpeed:.6*(p.speed??1),fogIntensity:p.fog??.45,mstyle:'flow'};
    const textureKey=JSON.stringify([parameters,!!preview,p.on!==false]);let texture=textures.get(textureKey);
    if(!texture){const cv=document.createElement('canvas');cv.width=256;cv.height=1024;texture={cv,g:cv.getContext('2d'),source:{p:parameters}};textures.set(textureKey,texture);if(textures.size>12)textures.delete(textures.keys().next().value);}
    if(!texture.g)return;texture.g.clearRect(0,0,256,1024);
    window.CerebraLaser.draw(texture.g,texture.source,0,0,256,1024,1,s.app.reduced?0:time,p.on===false?0:1,{preview:preview&&!s.app.reduced&&p.on!==false&&(p.speed??1)>0});
    if(c.w!==w||c.h!==h||c.w0!==it.w0||c.h0!==it.h0||c.pts!==st.pts){
      c.path.setAttribute('d',s.strokeD(it,w,h,0,0,st.pts));const length=c.path.getTotalLength();
      c.length=length;const n=Math.max(2,Math.min(128,Math.ceil(length/10)));c.points=[];
      for(let i=0;i<=n;i++){const at=length*i/n,P=c.path.getPointAtLength(at),A=c.path.getPointAtLength(Math.max(0,at-.5)),B=c.path.getPointAtLength(Math.min(length,at+.5)),L=Math.hypot(B.x-A.x,B.y-A.y)||1;c.points.push({x:P.x,y:P.y,nx:-(B.y-A.y)/L,ny:(B.x-A.x)/L,q:i/n});}
      Object.assign(c,{w,h,w0:it.w0,h0:it.h0,pts:st.pts});
    }
    const half=Math.max(1,st.size*k*10),L=Math.min(...c.points.map(v=>v.x))-half,T=Math.min(...c.points.map(v=>v.y))-half,R=Math.max(...c.points.map(v=>v.x))+half,Btm=Math.max(...c.points.map(v=>v.y))+half;
    if(c.length<1){const P=c.points[0];g.drawImage(texture.cv,96,896,64,128,x+P.x-half/2,y+P.y-st.size*k,half,st.size*k*2);return;}
    let buffer=scratch.get(g);if(!buffer){const cv=document.createElement('canvas'),mask=document.createElement('canvas');buffer={cv,g:cv.getContext('2d'),mask,mg:mask.getContext('2d')};scratch.set(g,buffer);}if(!buffer.g)return;
    const transform=g.getTransform(),density=Math.min(Math.hypot(transform.a,transform.b)||1,4096/Math.max(R-L,Btm-T),Math.sqrt((preview?2e6:8e6)/Math.max(1,(R-L)*(Btm-T)))),W=Math.max(1,Math.ceil((R-L)*density)),H=Math.max(1,Math.ceil((Btm-T)*density));
    if(buffer.cv.width!==W||buffer.cv.height!==H){buffer.cv.width=W;buffer.cv.height=H;}
    const out=buffer.g;out.setTransform(1,0,0,1,0,0);out.clearRect(0,0,W,H);out.setTransform(density,0,0,density,-L*density,-T*density);out.globalCompositeOperation='lighter';out.imageSmoothingEnabled=true;out.imageSmoothingQuality='high';
    const point=(v,side)=>[v.x+v.nx*half*side,v.y+v.ny*half*side];
    for(let i=1;i<c.points.length;i++){
      const A=c.points[i-1],B=c.points[i],a=point(A,-1),b=point(A,1),c1=point(B,-1),d=point(B,1),v0=896-A.q*640,v1=896-B.q*640;
      // Use the continuous beam above the source's T-shaped launch flare;
      // taper freehand ends so a pen stroke never starts with a clipped block.
      const q=(A.q+B.q)*.5;out.globalAlpha=Math.min(1,q/.025,(1-q)/.025);
      triangle(out,texture.cv,[[0,v0],[256,v0],[0,v1]],[a,b,c1]);triangle(out,texture.cv,[[256,v0],[256,v1],[0,v1]],[b,d,c1]);
    }
    // The native export path already applies masks/alpha lock. Apply them here
    // only for the moving overlay, which otherwise sits outside the native SVG.
    if(preview&&(st.clip||it.mask?.on)&&buffer.mg){
      if(buffer.mask.width!==W||buffer.mask.height!==H){buffer.mask.width=W;buffer.mask.height=H;}
      const m=buffer.mg;m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,W,H);m.setTransform(density,0,0,density,-L*density,-T*density);m.globalCompositeOperation='source-over';m.strokeStyle=m.fillStyle='#fff';m.lineCap=m.lineJoin='round';
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
    const controls=[['laserSpeed','Flow speed',0,2,.05],['laserDensity','Wisp density',.1,2,.1],['laserIntensity','Wisp intensity',0,20,.1],['laserFog','Fog intensity',0,1,.05]];
    const section=document.createElement('section');section.className='st-laser-pen';
    section.innerHTML='<label class="st-fly-row"><span>Pen effect</span><select data-laser-pref="effect"><option value="plain">Plain pen</option><option value="laser-flow">Laser Flow</option></select></label><div data-laser-options><label class="st-fly-row"><span>Animate Laser Flow</span><input type="checkbox" data-laser-pref="laserOn"></label>'+controls.map(([key,label,min,max,step])=>`<label class="st-fly-row"><span>${label}</span><output data-laser-value="${key}"></output><input type="range" min="${min}" max="${max}" step="${step}" data-laser-pref="${key}"></label>`).join('')+'</div><button type="button" class="st-btn" data-laser-apply>Apply effect to selected drawing</button>';
    fly.querySelector('[data-draw-done]').before(section);
    const quick=document.createElement('div');quick.className='st-assist-sl';quick.innerHTML='<span>Pen effect</span><select aria-label="Pen effect"><option value="plain">Plain pen</option><option value="laser-flow">Laser Flow</option></select><button type="button" class="st-btn" data-laser-settings>Pen effect settings</button>';bar.querySelector('.st-assist-rp').append(quick);
    quick.querySelector('[data-laser-settings]').onclick=ev=>{s.closeStudioMenus?.('fly');fly.hidden=false;s.layoutFly(fly,ev.currentTarget,true);};
    let targetId=null;
    const sync=()=>{section.querySelectorAll('[data-laser-pref]').forEach(el=>{const v=s.drawSet[el.dataset.laserPref];if(el.type==='checkbox')el.checked=!!v;else el.value=v;const out=section.querySelector(`[data-laser-value="${el.dataset.laserPref}"]`);if(out)out.textContent=String(+Number(v).toFixed(2));});section.querySelector('[data-laser-options]').hidden=s.drawSet.effect!=='laser-flow';quick.querySelector('select').value=s.drawSet.effect;section.querySelector('[data-laser-apply]').hidden=!s.items.some(i=>i.id===targetId&&i.kind==='stroke'&&!i.locked);s.ink.closest('svg').style.filter=s.drawSet.effect==='laser-flow'?`drop-shadow(0 0 6px ${s.drawSet.color})`:'';};
    const prefs=()=>({speed:s.drawSet.laserSpeed,density:s.drawSet.laserDensity,intensity:s.drawSet.laserIntensity,fog:s.drawSet.laserFog,on:s.drawSet.laserOn});
    const save=()=>{try{localStorage.setItem('cerebra-studio-pencil',JSON.stringify(s.drawSet));}catch{}sync();};
    section.querySelectorAll('[data-laser-pref]').forEach(el=>el.addEventListener('input',()=>{s.drawSet[el.dataset.laserPref]=el.type==='checkbox'?el.checked:el.type==='range'?+el.value:el.value;save();}));
    quick.querySelector('select').onchange=ev=>{s.drawSet.effect=ev.target.value;save();};
    const add=s.addStrokeAbs.bind(s);s.addStrokeAbs=(sk,P)=>{if(s.drawTool==='pen'&&!sk.type&&s.drawSet.effect==='laser-flow')sk={...sk,type:'laser',laser:prefs()};return add(sk,P);};
    const select=s.select.bind(s);s.select=it=>{if(it)targetId=it.kind==='stroke'?it.id:null;const prev=s.sel;select(it);if(prev?.kind==='kit'&&prev!==it&&s.items.includes(prev))s.drawKit(prev,prev.el.offsetWidth,prev.el.offsetHeight);if(it?.kind==='kit')s.drawKit(it,it.el.offsetWidth,it.el.offsetHeight);sync();};
    section.querySelector('[data-laser-apply]').onclick=()=>{const it=s.items.find(i=>i.id===targetId&&i.kind==='stroke'&&!i.locked);if(!it)return;s.flushCommit();it.strokes.forEach(st=>{if(st.type==='line')return;if(s.drawSet.effect==='laser-flow'){st.type='laser';st.laser=prefs();}else{delete st.type;delete st.laser;}});s.writeStrokes(it,s.strokesAbs(it));};
    const reset=s.resetDrawingDefaults.bind(s);s.resetDrawingDefaults=()=>{reset();sync();};
    const resetItem=s.resetItemDesign.bind(s);s.resetItemDesign=it=>{resetItem(it);if(it?.kind==='stroke'&&it.strokes?.some(st=>st.type==='laser')){it.strokes.filter(st=>st.type==='laser').forEach(st=>Object.assign(st,{color:'#ffffff',size:4,opacity:1,dash:'solid',laser:{speed:1,density:1,intensity:5,fog:.45,on:true}}));s.writeStrokes(it,s.strokesAbs(it),true);}};
    const language=window.__cerebraLanguage,nodes=[...section.querySelectorAll('label > span,option,[data-laser-apply]'),...quick.querySelectorAll('span,option,[data-laser-settings]')],labels=nodes.map(n=>n.textContent);
    const localize=()=>nodes.forEach((n,i)=>{n.textContent=language?.label(labels[i])||labels[i];});language?.onChange(localize);localize();
    fly.addEventListener('input',sync);sync();
    const css=document.createElement('style');css.textContent='#studio .st-laser-pen{border-top:1px solid #ffffff20;padding-top:12px;margin-top:10px}#studio .st-assist-rp > div:last-child{grid-column:1/-1}#studio [data-laser-settings]{grid-column:1/-1;min-height:32px}#studio .st-assist-rp select{max-width:140px;min-height:36px;background:#202430;color:#f4f2f6;border:1px solid #444957;border-radius:8px}';document.head.append(css);
  }
  setTimeout(boot,0);
})();
