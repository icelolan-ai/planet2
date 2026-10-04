/* S9 core — lightweight fluid wisps + life layers + sound response.
   Uses Cerebra's existing WebGL renderer and microphone analyser. No WebGPU / second GL context. */
(() => {
  const KEY='cerebra-s9-lab-v1';
  const TYPES=[['planet','Planet'],['cloud','Cloud'],['jelly','Jelly'],['cell','Cell'],['venom','Venom'],['germ','Germ'],['blackhole','Black hole']];
  const DEF={fluid:{on:true,amount:7,flow:1,color:'#8b5cf6',opacity:.48},life:{planet:false,cloud:false,jelly:false,cell:false,venom:false,germ:false,blackhole:false},sound:{on:false,gain:1.4}};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const merge=v=>({fluid:{...DEF.fluid,...(v&&v.fluid||{})},life:{...DEF.life,...(v&&v.life||{})},sound:{...DEF.sound,...(v&&v.sound||{})}});
  let state=clone(DEF); try{state=merge(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){} state.sound.on=false;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}};
  const api=window.__cerebraS9={KEY,TYPES,DEF,clone,merge,get:()=>state,set:v=>{state=merge(v);save();api.sync&&api.sync()},save,snapshot:()=>clone(state)};
  function boot(){
    // Cerebra's vendor bundle currently exposes Three.js as KY. Keep THREE as a
    // compatibility fallback for development/standalone environments.
    const app=window.__cerebra,s=app&&app.studio,T=window.KY||window.THREE;
    if(!app||!s||!T||!app.stage||!app.core){setTimeout(boot,220);return}
    if(api.ready)return; api.ready=true; api.app=app; api.studio=s;
    const scene=app.stage.scene,reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches,coarse=matchMedia('(pointer: coarse)').matches;
    const fluidRoot=new T.Group(),lifeRoot=new T.Group(); fluidRoot.name='S9 Fluid Wisps';lifeRoot.name='S9 Life Layers';scene.add(fluidRoot,lifeRoot);
    const U={uTime:{value:0},uColor:{value:new T.Color(state.fluid.color)},uOpacity:{value:state.fluid.opacity},uFlow:{value:state.fluid.flow},uBands:{value:state.fluid.amount},uAudio:{value:0}};
    const mat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'precision mediump float;varying vec2 vUv;uniform float uTime,uOpacity,uFlow,uBands,uAudio;uniform vec3 uColor;void main(){vec2 p=(vUv-.5)*2.;float t=uTime*uFlow;float q=sin(p.x*(2.2+uBands*.08)+sin(p.y*3.4-t*.72)+t);q+=.72*sin(p.y*(3.1+uBands*.06)+cos(p.x*4.2+t*.55)-t*.8);q+=.38*sin((p.x+p.y)*6.+sin(t*.7+p.x*2.));float w=1.-smoothstep(.04,.48,abs(q*.36));float r=1.-smoothstep(.45,1.42,length(p));float h=smoothstep(.16,.58,length(p));float a=w*r*h*uOpacity*(.72+uAudio*.55);vec3 c=uColor*(.82+uAudio*.45)+vec3(.12,.08,.2)*w;gl_FragColor=vec4(c,a);}'});
    const plane=new T.Mesh(new T.PlaneGeometry(6.8,6.8,1,1),mat);plane.position.z=-1.05;plane.frustumCulled=false;fluidRoot.add(plane);
    const lifeGroups={},geos={},colors={planet:'#79b8ff',cloud:'#d7e4ff',jelly:'#7ae5db',cell:'#ff74b8',venom:'#b967ff',germ:'#9dff4c',blackhole:'#07070b'};
    const geo=type=>geos[type]||(geos[type]=type==='planet'?new T.SphereGeometry(.12,12,8):type==='cloud'?new T.SphereGeometry(.16,9,6):type==='jelly'?new T.SphereGeometry(.13,12,8):type==='cell'?new T.DodecahedronGeometry(.13,0):type==='venom'?new T.TetrahedronGeometry(.15,0):type==='germ'?new T.IcosahedronGeometry(.14,1):new T.SphereGeometry(.11,12,8));
    const count=coarse?3:4;
    TYPES.forEach(([type],ti)=>{const g=lifeGroups[type]=new T.Group();g.name='S9 '+type;lifeRoot.add(g);for(let i=0;i<count;i++){const mm=new T.MeshBasicMaterial({color:colors[type],transparent:true,opacity:type==='cloud'?.24:.8,depthWrite:false,wireframe:type==='cell'}),m=new T.Mesh(geo(type),mm),seed=i*2.37+ti*.83;m.userData={seed,r:1.95+(seed%1.7)*.55,sp:.16+(seed%.9)*.13,y:((seed*1.7)%1-.5)*1.2};if(type==='jelly')m.scale.set(1,.72,1);if(type==='cloud')m.scale.set(1.7,.65,1.1);g.add(m);if(type==='planet'){const ring=new T.Mesh(new T.TorusGeometry(.18,.012,5,24),new T.MeshBasicMaterial({color:'#b8d7ff',transparent:true,opacity:.5,depthWrite:false}));ring.rotation.x=1.1;m.add(ring)}if(type==='blackhole'){const ring=new T.Mesh(new T.TorusGeometry(.22,.035,8,32),new T.MeshBasicMaterial({color:'#b04cff',transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending}));ring.rotation.x=1.22;m.add(ring)}}});
    const sync=api.sync=()=>{state=api.get();fluidRoot.visible=!!(s.active&&s.subject<0&&state.fluid.on);U.uColor.value.set(state.fluid.color);U.uOpacity.value=state.fluid.opacity;U.uFlow.value=state.fluid.flow;U.uBands.value=state.fluid.amount;lifeRoot.visible=!!(s.active&&s.subject<0);TYPES.forEach(([type])=>lifeGroups[type].visible=!!state.life[type]);api.onSync&&api.onSync()};
    api.maxWisps=coarse?8:12;api.syncMicUI=on=>document.querySelectorAll('[data-t-mic] button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.v==='1')===!!on)));
    api.startSound=async()=>{const p=app.core&&app.core.planet;if(!p||!p.startAudio)return false;const ok=await p.startAudio();if(!ok){state.sound.on=false;api.syncMicUI(false);save();sync()}else api.syncMicUI(true);return !!ok};
    api.stopSound=()=>{const p=app.core&&app.core.planet;p&&p.stopAudio&&p.stopAudio();state.sound.on=false;api.syncMicUI(false);save();sync()};
    const centre=new T.Vector3();let last=performance.now(),smooth=0;
    const level=()=>{const a=app.core&&app.core.planet&&app.core.planet.audio;return a?Math.max(0,Math.min(1.5,a.level||0)):0};
    const frame=now=>{requestAnimationFrame(frame);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;sync();if(!s.active||s.subject>=0||document.hidden)return;app.core.group.getWorldPosition(centre);fluidRoot.position.copy(centre);lifeRoot.position.copy(centre);const raw=state.sound.on?level()*state.sound.gain:0;smooth+=(raw-smooth)*(1-Math.exp(-7*dt));const t=now/1000,motion=reduced()?0:1,flow=state.fluid.flow*(1+smooth*2.2)*motion;if(fluidRoot.visible){U.uTime.value=reduced()?0:t*.32;U.uFlow.value=Math.max(.08,flow);U.uAudio.value=smooth}TYPES.forEach(([type],ti)=>{const g=lifeGroups[type];if(!g.visible)return;g.children.forEach((m,i)=>{const d=m.userData;if(!d||d.seed==null)return;const a=d.seed+t*d.sp*(1+smooth*2.8)*motion;m.position.set(Math.cos(a)*d.r,d.y+Math.sin(a*1.7)*.32,Math.sin(a)*d.r*.55-.1);m.rotation.x+=dt*(.18+ti*.02)*motion;m.rotation.y+=dt*(.3+i*.03)*motion;const react=(type==='jelly'||type==='cell')?.8:.35,p=1+smooth*react;if(type!=='jelly'&&type!=='cloud')m.scale.setScalar(p);else if(type==='jelly')m.scale.set(p,.72/Math.max(.7,p),p)})})};
    sync();requestAnimationFrame(frame);
  }
  setTimeout(boot,0);
})();