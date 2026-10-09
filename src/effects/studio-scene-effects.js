/* Native Kit adapters for original React Bits shaders. No additional renderer or clock. */
(() => {
  if(window.CerebraStudioEffects)return;
  const ball=window.CerebraCrystalBall, ether=window.CerebraLiquidEther;
  const buffers=new WeakMap();
  function buffer(it,w,h,limit){
    let b=buffers.get(it);if(!b){const canvas=document.createElement('canvas');b={canvas,g:canvas.getContext('2d'),host:{clientWidth:1,getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}},first:true};buffers.set(it,b);}
    const scale=Math.min(1,limit/Math.max(w,h),Math.sqrt(8e6/Math.max(1,w*h))),W=Math.max(8,Math.round(w*scale)),H=Math.max(8,Math.round(h*scale));
    if(b.canvas.width!==W||b.canvas.height!==H){b.canvas.width=W;b.canvas.height=H;b.first=true;}
    b.host.clientWidth=W;b.host.clientHeight=H;return b;
  }
  const range=(k,label,min,max,step=.01)=>({k,label,t:'range',min,max,step});
  const color=(k,label)=>({k,label,t:'color'}),check=(k,label)=>({k,label,t:'check'});
  const select=(k,label,opts)=>({k,label,t:'select',opts});
  const crystalKit={label:'Crystal Ball',size:[.5,.5],anim:true,motionOnAdd:true,noShuffle:true,
    defaults:{...ball.defaults,interactive:false,intro:false},
    ui:[select('preset','Crystal preset',Object.keys(ball.presets).map(k=>[k,k[0].toUpperCase()+k.slice(1)])),color('color','Crystal colour'),range('size','Ball size',.25,1),range('glow','Glow',0,1.5),range('haze','Haze',0,1.5),range('strands','Electric strands',1,8,1),range('crackle','Crackle',0,1),range('flares','Flares',0,1),range('sparks','Sparks',0,1),range('particleCount','Dust particles',0,40000,500),select('particleShape','Dust shape',[['square','Square'],['round','Round']]),range('fill','Dust fill',0,1),range('depth','Dust depth',0,1),range('twinkle','Twinkle',0,1),range('sway','Sway',0,1),select('motion','Dust motion',['rise','fall','drift','orbit'].map(k=>[k,k])),range('speed','Field speed',0,2),range('dustSpeed','Dust speed',0,2),select('theme','Crystal theme',[['dark','Dark'],['light','Light']])],
    draw(g,it,x,y,w,h){if(!window.__cerebra?.stage.renderer)return;const M=kitM(it),preview=KIT_PREVIEW,limit=preview?(window.__cerebra.studio.sel===it?1536:768):4096,b=buffer(it,w,h,limit);ball.draw(b.g,b.canvas.width,b.canvas.height,1,M.t,{...it.p,sway:it.p.sway*(it.mAmt??.6)/.6,interactive:false,intro:false,paused:false},!preview,limit);g.drawImage(b.canvas,x,y,w,h);b.first=false;},
    dispose(it){const b=buffers.get(it);if(b)ball.reset(b.g);buffers.delete(it);}
  };
  const etherKit={label:'Liquid Ether',cover:true,background:true,anim:true,motionOnAdd:true,noShuffle:true,
    defaults:{...ether.defaults,color1:'#5227ff',color2:'#ff9ffc',color3:'#b497cf',interactive:false},
    bgGroups:{colour:['color1','color2','color3','lightMode','backgroundColor'],look:['isViscous','viscosity','isBounce'],motion:['autoDemo','autoSpeed','autoIntensity'],interaction:['interactive','mouseForce','cursorSize','takeoverDuration','autoResumeDelay','autoRampDuration'],quality:['resolution','iterationsViscous','iterationsPoisson','dt','BFECC']},
    ui:[color('color1','Fluid colour 1'),color('color2','Fluid colour 2'),color('color3','Fluid colour 3'),range('mouseForce','Flow force',0,60,1),range('cursorSize','Flow radius',10,300,1),check('autoDemo','Auto animation'),range('autoSpeed','Flow speed',0,1),range('autoIntensity','Flow intensity',0,4),range('resolution','Simulation resolution',.2,.5,.05),check('isViscous','Viscosity enabled'),range('viscosity','Viscosity',1,100,1),range('iterationsViscous','Viscosity iterations',1,64,1),range('iterationsPoisson','Pressure iterations',1,64,1),range('dt','Simulation step',.005,.05,.001),check('BFECC','BFECC correction'),check('isBounce','Bounce at edges'),check('interactive','Follow pointer'),range('takeoverDuration','Takeover duration',0,2,.05),range('autoResumeDelay','Resume delay (ms)',0,5000,100),range('autoRampDuration','Resume ramp',0,2,.05),check('lightMode','Light background'),color('backgroundColor','Background colour')],
    draw(g,it,x,y,w,h){
      if(!window.__cerebra?.stage.renderer)return;
      const M=kitM(it),screen=it.el?.querySelector('.st-kitc'),capture=!!screen&&g.canvas!==screen,b=(capture&&buffers.get(it))||buffer(it,w,h,matchMedia('(pointer:coarse)').matches?672:960);
      const physics=JSON.stringify(['mouseForce','cursorSize','autoDemo','autoSpeed','autoIntensity','resolution','isViscous','viscosity','iterationsViscous','iterationsPoisson','dt','BFECC','isBounce','takeoverDuration','autoResumeDelay','autoRampDuration'].map(k=>it.p[k]).concat(it.mAmt??.6,it.seed));
      if(b.physics!==undefined&&b.physics!==physics){ether.reset(b.g);b.first=true;}b.physics=physics;
      b.g.clearRect(0,0,b.canvas.width,b.canvas.height);
      ether.draw(b.g,b.canvas.width,b.canvas.height,1,M.t,{...it.p,autoIntensity:it.p.autoIntensity*(it.mAmt??.6)/.6},{studio:true,stopped:capture||!KIT_PREVIEW,first:b.first,seed:it.seed,host:b.host});g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(b.canvas,x,y,w,h);b.first=false;
    },
    dispose(it){const b=buffers.get(it);if(b)ether.reset(b.g);buffers.delete(it);}
  };
  etherKit.ui.forEach(u=>{if(['viscosity','iterationsViscous'].includes(u.k))u.when=['isViscous',true];if(['takeoverDuration','autoResumeDelay','autoRampDuration'].includes(u.k))u.when=['interactive',true];if(u.k==='backgroundColor')u.when=['lightMode',true];});
  function decorate(s,it,f){
    if(!['crystalBall','liquidEther','lightPillar'].includes(it.kit))return;
    if(it.bg)return;
    const th=window.__cerebraLanguage?.current==='th',button=document.createElement('button'),legacy=it.kit!=='crystalBall';button.type='button';button.className='st-btn st-kit-shuffle';button.dataset.sceneBackground='';button.textContent=legacy?(th?'แปลงเป็นพื้นหลัง':'Convert to background'):(th?'จัดเป็นพื้นหลังเต็มพื้นที่':'Fit as background');
    button.onclick=()=>{if(legacy){s.convertToBackground(it);return;}s.commit();it.x=it.y=.5;it.w=(innerWidth+4)/s.U();it.h=(innerHeight+4)/s.U();s.items=[it,...s.items.filter(i=>i!==it)];s.stackDom();s.place(it);s.renderLayers();s.commit();s.layoutKitFly();};f.querySelector('[data-kit-reset]').before(button);
    const preset=f.querySelector('[data-kp=preset]');if(preset){const apply=()=>{Object.assign(it.p,ball.presets[preset.value]||{});it.p.preset=preset.value;};preset.addEventListener('input',apply,{capture:true});preset.addEventListener('change',()=>{apply();queueMicrotask(()=>{if(s.sel===it)s.syncKit();});},{capture:true});}
  }
  const pointers=new WeakMap();
  function feed(it,x,y){
    const W=innerWidth,H=innerHeight;pointers.set(it,{x:Math.max(-1,Math.min(1,x/W*2-1)),y:Math.max(-1,Math.min(1,-(y/H*2-1)))});
    const b=buffers.get(it);if(it.kit==='liquidEther'&&b)ether.pointer(b.g,{clientX:x/W*b.canvas.width,clientY:y/H*b.canvas.height});
  }
  addEventListener('pointermove',e=>{
    const s=window.__cerebra?.studio;if(!s?.active||e.pointerType==='touch'||e.buttons||s.drawing||s.itemDrag)return;
    const it=s.items?.find(i=>i.bg&&i.p?.interactive&&!s.isHid(i));if(!it||e.target!==s.catcher)return;
    feed(it,e.clientX,e.clientY);
  },{passive:true});
  window.CerebraStudioEffects={pointerOf:it=>it.p?.interactive?pointers.get(it):null,crystalKit,etherKit,decorate,inspect:it=>{const b=buffers.get(it);return b?{width:b.canvas.width,height:b.canvas.height,state:(it.kit==='crystalBall'?ball:ether).inspect(b.g),canvas:b.canvas}:null;}};
  function thumbnails(){const s=window.__cerebra?.studio;if(!s?.el||!window.__cerebra?.stage.renderer){setTimeout(thumbnails,200);return;}for(const [key,def]of [['crystalBall',crystalKit],['liquidEther',etherKit]]){const canvas=s.el.querySelector(`[data-studio-kit="${key}"] canvas`);if(canvas){const it={p:def.defaults,seed:7};def.draw(canvas.getContext('2d'),it,0,0,88,88);def.dispose(it);}}}
  setTimeout(thumbnails,0);
})();
