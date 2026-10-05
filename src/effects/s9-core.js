/* Water Lab — Nava solver on Studio's renderer, input and existing history.
   Art modes are intentionally limited to Particle Flow. Old Lab state is not revived. */
(() => {
  const KEY='cerebra-water-lab-v3';
  // Nava's default water tool and fluid settings; composition stays Studio-owned.
  const NAVA={tool:'ripple',brushColor:[0,240,255],brushSize:.3,viscosity:1,dissipation:.9999,curl:1,timeScale:1,
    realWater:false,cohesion:1,splash:1,canvasFrame:false,clarity:1,wispiness:1,glow:1,opacity:1,
    flowEnabled:false,flowSpeed:1,flowDir:{x:0,y:0},motion:'normal',symmetry:1,mirror:false,
    gradientBrush:false,gradientSpeed:1,tentacleLength:5,tentacleSway:1};
  const DEF={on:false,particles:false,layer:'front',paused:false,collision:false,collisionBounce:.5,collisionSpread:.5,collisionStick:.6,collisionStain:.65,stainSpread:.5,stainLifetime:30,waterColors:[[0,240,255],[255,0,200],[255,52,52]],...NAVA,
    particleCount:380,particleSpeed:5,particleSize:2.4,particleTrail:5,particleAlpha:70,particleInteract:'none',particleInteractAmt:5,
    particleColorCount:3,particleColors:[[53,190,255],[167,113,255],[255,169,206]],audioReactive:0};
  const clone=v=>JSON.parse(JSON.stringify(v)),merge=v=>{const out=clone(DEF);if(v&&typeof v==='object')for(const k of Object.keys(DEF))if(k in v&&typeof v[k]===typeof DEF[k])out[k]=clone(v[k]);const ranges={brushSize:[.2,3],viscosity:[.01,1],dissipation:[.97,1],curl:[0,50],timeScale:[.1,2],cohesion:[0,10],splash:[0,10],clarity:[1,5],wispiness:[1,10],glow:[0,5],opacity:[.1,1],flowSpeed:[1,10],symmetry:[1,12],gradientSpeed:[1,10],tentacleLength:[5,15],tentacleSway:[0,10],particleCount:[50,1200],particleSpeed:[1,10],particleSize:[.5,6],particleTrail:[0,10],particleAlpha:[10,100],particleInteractAmt:[1,10],particleColorCount:[1,5]};
    ranges.collisionBounce=[0,1];ranges.collisionSpread=[0,2];ranges.collisionStick=[0,1];ranges.collisionStain=[0,1];ranges.stainSpread=[0,2];ranges.stainLifetime=[0,120];
    for(const [k,[lo,hi]]of Object.entries(ranges))out[k]=Number.isFinite(out[k])?Math.max(lo,Math.min(hi,out[k])):DEF[k];
    for(const k of ['symmetry','tentacleLength','particleCount','particleColorCount'])out[k]=Math.round(out[k]);
    const color=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)?v.map(n=>Math.max(0,Math.min(255,n))):DEF.brushColor.slice();out.brushColor=color(out.brushColor);out.waterColors=Array.from({length:3},(_,i)=>color(out.waterColors?.[i]||DEF.waterColors[i]));out.particleColors=Array.isArray(out.particleColors)?out.particleColors.slice(0,5).map(color):clone(DEF.particleColors);
    if(!out.flowDir||!Number.isFinite(out.flowDir.x)||!Number.isFinite(out.flowDir.y))out.flowDir=clone(DEF.flowDir);else out.flowDir={x:Math.max(-1,Math.min(1,out.flowDir.x)),y:Math.max(-1,Math.min(1,out.flowDir.y))};
    for(const [k,choices]of Object.entries({tool:['paint','drop','pour','ripple','tentacle','stretch','eraser','picker'],layer:['front','back'],motion:['normal','spin','zigzag','wave','radial'],particleInteract:['none','absorb','deposit','bounce','carry','charged','sph']}))if(!choices.includes(out[k]))out[k]=DEF[k];out.audioReactive=0;return out};
  let state=clone(DEF),engine=null,cached=null,dirty=false;
  try{state=merge(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){}state.on=false;state.particles=false;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}};
  const api=window.__cerebraS9={KEY,DEF,clone,merge,get:()=>state,save};
  function boot(){
    const app=window.__cerebra,s=app&&app.studio,T=window.KY||window.THREE;
    if(!s||!s.el||!app.stage||!T||!window.CerebraNavaWater){setTimeout(boot,180);return}if(api.ready)return;
    api.ready=true;api.app=app;api.studio=s;
    const stage=app.stage,renderer=stage.renderer,collision=window.CerebraWaterCollision(T,app,s,stage.renderer),root=new T.Group();root.name='Nava Water Lab';stage.scene.add(root);
    const quadMat=texture=>new T.ShaderMaterial({uniforms:{map:{value:texture}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}',
      fragmentShader:'varying vec2 vUv;uniform sampler2D map;void main(){gl_FragColor=texture2D(map,vUv);}' });
    api.collision=collision;
    let water,particleMesh,particleTexture,last=performance.now(),size='';
    const dimensions=()=>{const r=renderer.domElement.getBoundingClientRect();return[Math.max(1,Math.round(r.width)),Math.max(1,Math.round(r.height))]};
    const ensure=()=>{
      if(engine)return true;
      try{engine=window.CerebraNavaWater(T,renderer,state);engine.resize(...dimensions());water=new T.Mesh(new T.PlaneGeometry(2,2),quadMat(engine.solver.output.tex));
        particleTexture=new T.CanvasTexture(engine.particleCanvas);particleMesh=new T.Mesh(new T.PlaneGeometry(2,2),quadMat(particleTexture));
        water.frustumCulled=particleMesh.frustumCulled=false;root.add(water,particleMesh);api.engine=engine;api.error=null;return true;
      }catch(e){engine=null;api.error=e.message;api.onSync&&api.onSync();return false}
    };
    const checkpoint=()=>{if(engine){engine.finishRipples();cached={field:engine.solver.checkpoint(),particles:clone(engine.particles)};dirty=false}};
    api.snapshot=()=>{if(dirty)checkpoint();return{version:3,settings:clone(state),...(cached||{}),stains:collision.snapshot()}};
    api.capture=()=>{if(engine)checkpoint();return api.snapshot()};
    api.set=v=>{
      api.activate(false,state.tool,false);state=merge(v&&v.version===3?v.settings:v);cached=v&&v.version===3?{field:v.field||null,particles:Array.isArray(v.particles)?v.particles.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.a)&&Array.isArray(p.color)&&p.color.length===3&&p.color.every(Number.isFinite)).slice(0,1200):[]}:null;dirty=false;
      collision.load(v&&v.version===3?v.stains:null);if(engine)engine.setState(state);
      if(state.on||state.particles||cached&&cached.field){if(ensure()){engine.setState(state);engine.cancelRipples();engine.solver.load(cached&&cached.field);engine.particles.splice(0,engine.particles.length,...(cached&&cached.particles||[]));if(state.particles&&!engine.particles.length)engine.seed()}}
      else if(engine)engine.clear();save();api.onSync&&api.onSync();
    };
    api.change=(key,value,commit=false)=>{
      const settling = key === 'curl' && Number(value) < state.curl || key === 'mirror' && !value && state.mirror;
      if(settling&&engine){engine.cancelRipples();engine.solver.stopVelocity();dirty=true}
      if(key==='flowEnabled'&&value)state.paused=false;
      state[key]=value;if(key==='paused'&&value&&engine){engine.cancelRipples();engine.solver.stopVelocity();dirty=true}if(key==='flowEnabled'&&!value&&engine){engine.solver.stopVelocity();dirty=true}if(key==='flowEnabled'&&value&&!state.flowDir.x&&!state.flowDir.y)state.flowDir={x:1,y:0};if(engine)engine.setState(state);
      if((state.on||state.particles)&&ensure()){if(key==='particles'&&value)engine.seed();if(key==='particleCount'&&state.particles)engine.seed();if(key==='particleColors'||key==='particleColorCount')engine.particles.forEach((p,i)=>p.color=(state.particleColors[i%state.particleColorCount]||state.brushColor).slice());dirty=true}
      save();api.onSync&&api.onSync();if(commit)s.commit();
    };
    api.navaFlow=()=>{Object.assign(state,clone(NAVA),{paused:false});if(engine){engine.cancelRipples();engine.solver.stopVelocity();dirty=true}api.activate(true,state.tool);s.commit()};
    api.stopFlow=(freeze=true)=>{state.paused=freeze;state.flowEnabled=false;state.flowDir={x:0,y:0};if(engine){engine.cancelRipples();engine.solver.stopVelocity();dirty=true}save();api.onSync&&api.onSync();s.commit()};
    api.resetMotion=()=>{motionTimer=0;Object.assign(state,{motion:NAVA.motion,symmetry:NAVA.symmetry,mirror:NAVA.mirror,flowSpeed:NAVA.flowSpeed,timeScale:NAVA.timeScale,tentacleLength:NAVA.tentacleLength,tentacleSway:NAVA.tentacleSway});api.stopFlow(false)};
    api.clear=()=>{collision.clear();if(engine){engine.clear();dirty=true}cached=null;s.commit();api.onSync&&api.onSync()};
    const pad=document.createElement('div');pad.className='st-water-pad';pad.hidden=true;pad.setAttribute('aria-label','Water drawing canvas');s.el.append(pad);
    const badge=document.createElement('div');badge.className='st-water-active st-glass';badge.hidden=true;badge.innerHTML='<span>Water brush</span><button type="button">Done</button>';s.el.append(badge);badge.querySelector('button').onclick=()=>api.activate(false);
    let active=false;
    api.activate=(on,tool=state.tool,commit=true)=>{
      if(on){state.tool=tool;state.on=true;if(!ensure())return;engine.setState(state);s.setDrawing(false);originalSetTool&&originalSetTool('move')}
      if(!on&&engine){for(const id of Object.keys(engine.pointers)){engine.endTentacle(id);delete engine.pointers[id]}if(dirty&&commit)s.commit()}
      active=!!on;pad.hidden=badge.hidden=!active;badge.querySelector('span').textContent=`Water · ${state.tool==='paint'?'Pen':state.tool}`;api.active=active;if(on)s.select(null);s.updateFocus();api.onSync&&api.onSync();save();
    };
    const originalSetTool=s.setTool&&s.setTool.bind(s);if(originalSetTool)s.setTool=(...args)=>{if(active)api.activate(false);return originalSetTool(...args)};
    const originalDrawing=s.setDrawing.bind(s);s.setDrawing=(on,...args)=>{if(on&&active)api.activate(false);return originalDrawing(on,...args)};
    // Dock actions must leave water input before their normal handlers run.
    s.el.addEventListener('click',e=>{if(active&&e.target.closest('[data-studio-tune],[data-studio-tools],[data-studio-reset-all],[data-grp-btn],[data-studio-export],[data-studio-lib],[data-studio-subject],[data-studio-keys],[data-flyout]'))api.activate(false)},true);

    const originalClose=s.close.bind(s);s.close=(...args)=>{api.activate(false);return originalClose(...args)};
    const point=e=>{const r=renderer.domElement.getBoundingClientRect(),margin=0;return{x:Math.max(margin,Math.min(1-margin,(e.clientX-r.left)/r.width)),y:Math.max(margin,Math.min(1-margin,1-(e.clientY-r.top)/r.height))}};
    let motionTimer=0;
    const dab=(p,pd,dx=0,dy=0,first=false)=>{
      const color=engine.color(),radius=(first ? .004 : .0032)*state.brushSize;
      if(state.tool==='drop'&&!first)return;
      if(['paint','drop','pour','ripple'].includes(state.tool))collision.hit(p.x,p.y,color,radius,state);
      if(state.tool==='picker'){const c=engine.pick(p.x,p.y);if(c&&Math.max(...c)>1)state.brushColor=c.slice(0,3);api.onSync&&api.onSync();return}
      if(state.tool==='tentacle'){if(first)engine.startTentacle(pd.id,p.x,p.y);return}
      if(state.tool==='ripple'){if(first||Math.hypot(dx,dy)>.02)engine.ripple(p.x,p.y);return}
      if(state.tool==='stretch'){engine.solver.splatVelocityOnly(p.x,p.y,dx*46*state.brushSize,dy*46*state.brushSize,.026*state.brushSize);engine.particles.forEach(q=>{if(Math.hypot(q.x-p.x,q.y-p.y)<.16){q.x+=dx;q.y+=dy}});return}
      if(state.tool==='eraser'){engine.splat(p.x,p.y,0,0,[0,0,0],.006*state.brushSize);for(let i=engine.particles.length-1;i>=0;i--)if(Math.hypot(engine.particles[i].x-p.x,engine.particles[i].y-p.y)<Math.sqrt(radius))engine.particles.splice(i,1);return}
      let fx=dx*6,fy=dy*6;motionTimer+=.05;
      if(state.motion==='spin'){fx-=dy*16;fy+=dx*16}
      else if(state.motion==='zigzag'){const sign=Math.sin(motionTimer*10)>0?1:-1;fx-=dy*20*sign;fy+=dx*20*sign}
      else if(state.motion==='wave'){const w=Math.sin(motionTimer*14);fx+=dx*w*9-dy*w*6;fy+=dy*w*9+dx*w*6}
      else if(state.motion==='radial'){fx+=dx*22;fy+=dy*22}
      pd.color=pd.color.map((v,i)=>v*.7+color[i]*.3);engine.splat(p.x,p.y,fx,fy,pd.color,state.tool==='drop'?radius*2:radius);
    };
    pad.addEventListener('pointerdown',e=>{if(!active||!s.active||e.button>0)return;e.preventDefault();pad.setPointerCapture(e.pointerId);s.flushCommit();if(dirty)checkpoint();s.closeStudioMenus&&s.closeStudioMenus();const p=point(e),pd={id:e.pointerId,down:true,lx:p.x,ly:p.y,color:engine.color().slice()};engine.pointers[e.pointerId]=pd;dab(p,pd,0,0,true);dirty=true});
    pad.addEventListener('pointermove',e=>{const pd=engine&&engine.pointers[e.pointerId];if(!pd)return;e.preventDefault();const p=point(e);dab(p,pd,p.x-pd.lx,p.y-pd.ly);pd.lx=p.x;pd.ly=p.y;dirty=true});
    const finish=e=>{if(!engine||!engine.pointers[e.pointerId])return;engine.endTentacle(e.pointerId);delete engine.pointers[e.pointerId];if(!Object.keys(engine.pointers).length){s.commit();save()}};
    pad.addEventListener('pointerup',finish);pad.addEventListener('pointercancel',finish);pad.addEventListener('lostpointercapture',finish);
    const originalRender=stage.render.bind(stage);stage.render=(...args)=>{
      root.visible=!!s.active&&!!engine&&(state.on||state.particles);
      const now=performance.now(),elapsed=Math.max(.001,(now-last)/1000),dt=Math.min(.033,elapsed);last=now;
      if(!root.visible)collision.hide();
      if(root.visible){const dims=dimensions(),key=dims.join('x');if(key!==size){engine.resize(...dims);size=key;water.material.uniforms.map.value=engine.solver.output.tex}
        engine.setObstacle(null);collision.update(state,engine,dt);
        if(active&&state.tool==='pour'&&!state.paused&&!s.frozen)for(const pd of Object.values(engine.pointers))engine.splat(pd.lx,pd.ly,0,-1.8,engine.color(),.006*state.brushSize);
        engine.frame(dt,state.paused||s.frozen,elapsed);if(collision.revision!==api.stainRevision){api.stainRevision=collision.revision;dirty=true}water.visible=state.on;particleMesh.visible=state.particles||Object.keys(engine.brushes).length>0;particleTexture.needsUpdate=true;
        const order=state.layer==='back'?-1000:1000;water.renderOrder=order;particleMesh.renderOrder=order+1;water.material.depthTest=particleMesh.material.depthTest=state.layer==='back';
      }
      return originalRender(...args);
    };
    api.visible=()=>!!engine&&(state.on||state.particles);
    const originalSnapshot=s.snapshot.bind(s);s.snapshot=extra=>{const v=JSON.parse(originalSnapshot(extra));v.s9=api.snapshot();return JSON.stringify(v)};
    const originalRestore=s.restore.bind(s);s.restore=text=>{const v=JSON.parse(text);const out=originalRestore(text);api.set(v.s9&&v.s9.version===3?v.s9:DEF);return out};
    s.s9State=api.snapshot;s.s9Apply=api.set;
    const resetCanvas=s.el.querySelector('[data-rs=canvas]');if(resetCanvas){const fn=resetCanvas.onclick;resetCanvas.onclick=e=>{api.set(DEF);return fn.call(resetCanvas,e)}}
    const resetFull=s.el.querySelector('[data-rs=full]');if(resetFull){const fn=resetFull.onclick;resetFull.onclick=e=>{const hist=s.hist;const result=fn.call(resetFull,e);if(hist!==s.hist){api.set(DEF);s.hist=[s.snapshot()];s.hi=0;s.syncHist()}return result}}
    if(s.hist)s.hist=s.hist.map(text=>{try{const v=JSON.parse(text);v.s9={version:3,settings:clone(state)};return JSON.stringify(v)}catch(_){return text}});
    // Save/library/export capture the current flow, while normal history keeps
    // gesture checkpoints stable rather than creating a new undo every frame.
    for(const name of ['exportProject','composePoster','libSave'])if(typeof s[name]==='function'){const fn=s[name].bind(s);s[name]=(...args)=>{api.capture();return fn(...args)}}
  }
  boot();
})();
