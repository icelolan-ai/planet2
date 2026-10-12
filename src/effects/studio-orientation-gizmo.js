/* Blender-inspired XYZ view gizmo; a view of the native Hand rotation only. */
(() => {
function boot(){
 const s=window.__cerebra?.studio,T=window.KY;
 if(!s?.setTool||!s.el||!s.handItem||!T?.Vector3){setTimeout(boot,240);return;}
 if(s.__orientationGizmoReady)return;s.__orientationGizmoReady=true;
 const style=document.createElement('style');style.dataset.stOrientationGizmo='true';style.textContent="\n#studio .st-orient{position:absolute;top:calc(max(10px,env(safe-area-inset-top)) + 74px);right:calc(var(--st-gap,10px) + var(--st-panel,262px) + 12px);width:114px;height:138px;padding:3px;z-index:63;pointer-events:auto;border:1px solid #b9b7d34d;border-radius:14px;background:#0a0e17e8;box-shadow:0 10px 25px #0009;color:#e9edf6;touch-action:none;user-select:none}\n#studio .st-orient[hidden]{display:none!important}\n#studio .st-orient-name{position:absolute;top:7px;left:0;right:0;text-align:center;font:600 9px var(--f-sans,sans-serif);letter-spacing:.13em;color:#cbd3e3;pointer-events:none}\n#studio .st-orient-space{position:absolute;top:20px;left:6px;right:6px;height:98px}\n#studio .st-orient-space svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\n#studio .st-orient-space .st-orient-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border:1px solid #e1e5ef55;border-radius:50%;background:#101925;display:grid;place-items:center;color:#ecf1fb;font:700 10px var(--f-sans,sans-serif);cursor:grab;touch-action:none}\n#studio .st-orient-space .st-orient-core:active{cursor:grabbing}\n#studio .st-orient-axis{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-height:0;min-width:0;width:25px;height:25px;padding:0;display:grid;place-items:center;border:1px solid var(--axis);border-radius:50%;background:#111722ee;color:var(--axis);font:700 11px var(--f-sans,sans-serif);cursor:pointer;touch-action:manipulation;box-shadow:0 2px 8px #0009}\n#studio .st-orient-axis[data-sign=\"-\"]{width:15px;height:15px;font-size:0;opacity:.55}\n#studio .st-orient-axis[data-sign=\"-\"]::before{content:\"\";width:5px;height:5px;border-radius:50%;background:currentColor}\n#studio .st-orient-axis:is(:hover,:focus-visible){background:var(--axis);color:#070c13;opacity:1}\n#studio .st-orient-axis[data-axis=\"X\"]{--axis:#f08696}\n#studio .st-orient-axis[data-axis=\"Y\"]{--axis:#7ad5b3}\n#studio .st-orient-axis[data-axis=\"Z\"]{--axis:#89adff}\n#studio .st-orient-foot{position:absolute;bottom:7px;left:0;right:0;text-align:center;font:500 8px var(--f-sans,sans-serif);letter-spacing:.06em;color:#bfc4d4}\n@media(max-width:900px){#studio .st-orient{top:calc(max(8px,env(safe-area-inset-top)) + 64px);right:10px;width:102px;height:127px}#studio .st-orient-space{height:88px}}\n@media(max-height:530px){#studio .st-orient{top:6px;height:109px}#studio .st-orient-space{height:76px}#studio .st-orient-foot{display:none}}\n";document.head.append(style);
 const el=document.createElement('div');el.className='st-orient';el.hidden=true;el.setAttribute('role','group');el.setAttribute('aria-label','3D orientation gizmo');
 el.innerHTML='<div class="st-orient-name">ORIENTATION</div><div class="st-orient-space"><svg aria-hidden="true"></svg><div class="st-orient-core" role="button" tabindex="0" aria-label="Drag to rotate the 3D model">3D</div></div><div class="st-orient-foot">DRAG · X / Y / Z</div>';
 s.el.append(el);
 const space=el.querySelector('.st-orient-space'),svg=space.querySelector('svg'),core=space.querySelector('.st-orient-core'),buttons=[];
 const axes=['X','Y','Z'];
 for(const axis of axes)for(const sign of [1,-1]){
   const b=document.createElement('button');b.type='button';b.className='st-orient-axis';
   b.dataset.axis=axis;b.dataset.sign=String(sign);b.textContent=sign>0?axis:'';
   b.setAttribute('aria-label','View '+(sign>0?'+':'-')+axis);b.title=b.getAttribute('aria-label');
   space.append(b);buttons.push(b);
 }
 const rad=x=>x*Math.PI/180;
 const pick=()=>{
   if(s.handItem(s.sel))return {kind:'kit',it:s.sel};
   if(s.showSubject!==false&&s.subject<0)return {kind:'core',body:s.app?.core?.planet};
   if(s.showSubject!==false&&s.subject>=0)return {kind:'world',body:s.app?.orrery?.worlds?.[s.subject]};
   const kit=s.items.slice().reverse().find(it=>s.handItem(it));
   return kit?{kind:'kit',it:kit}:null;
 };
 const rotation=t=>{
   if(!t)return [0,0,0];
   if(t.kind==='kit')return [t.it.p.pitch||0,t.it.p.yaw||0,t.it.p.roll||0];
   if(t.kind==='core')return [(t.body?.rotXT||0)*180/Math.PI,(t.body?.rotYT||0)*180/Math.PI,0];
   return [0,(t.body?.userRot||0)*180/Math.PI,0];
 };
 let frame=0;
 function render(){
   frame=0;const show=s.active&&s.tool==='hand'&&s.handAvailable();
   el.hidden=!show;if(!show)return;
   const t=pick(),[pitch,yaw,roll]=rotation(t),euler=new T.Euler(rad(pitch),rad(yaw),rad(roll),'XYZ');
   const cx=space.clientWidth/2,cy=space.clientHeight/2;
   let lines='';
   buttons.forEach(b=>{
      const axis=b.dataset.axis,sign=+b.dataset.sign;
      const v=(axis==='X'?new T.Vector3(1,0,0):axis==='Y'?new T.Vector3(0,1,0):new T.Vector3(0,0,1)).multiplyScalar(sign).applyEuler(euler);
      const len=Math.hypot(v.x,v.y),dist=Math.max(12,len*34);
      const angle=len<.15?(axis==='Z'?(sign>0?-.72:2.4):0):Math.atan2(-v.y,v.x);
      const x=cx+Math.cos(angle)*dist,y=cy+Math.sin(angle)*dist;
      b.style.left=x+'px';b.style.top=y+'px';
      if(sign>0)lines+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" stroke="'+(axis==='X'?'#f08696':axis==='Y'?'#7ad5b3':'#89adff')+'" stroke-width="1.8"/>';
   });
   svg.setAttribute('viewBox','0 0 '+space.clientWidth+' '+space.clientHeight);svg.innerHTML=lines;
   const tray=s.el.querySelector('.st-layers-tray'),r=tray?.getBoundingClientRect();
   if(innerWidth>900&&r&&r.width>100&&r.top<innerHeight*.6&&r.left>190){
     el.style.left=Math.max(8,r.left-128)+'px';el.style.right='auto';el.style.top=Math.max(62,r.top)+'px';
   }else{el.style.left='auto';el.style.right='10px';el.style.top='';}
 }
 function update(){if(!frame)frame=requestAnimationFrame(render);}
 function change(dx,dy){
    const t=pick();if(!t)return;
    const rx=dx*.008,ry=dy*.008;
    if(t.kind==='kit'){
       if(t.it.kit==='rocket'&&window.CerebraRockets?.kit)window.CerebraRockets.kit.turn(t.it,rx,ry);
       else {t.it.p.yaw=(t.it.p.yaw||0)+dx*.45;t.it.p.pitch=(t.it.p.pitch||0)+dy*.45;}
       s.kitRedraw(t.it);
    }else if(t.kind==='core')t.body?.turn(rx,ry);
    else if(t.kind==='world'&&t.body){t.body.userRot+=rx;t.body.userVel=0;}
    update();
 }
 function snap(axis,sign){
    const t=pick();if(!t)return;
    const pitch=axis==='Y'?(sign>0?-90:90):0;
    const yaw=axis==='X'?(sign>0?90:-90):axis==='Z'?(sign>0?0:180):0;
    if(t.kind==='kit'){
       t.it.p.pitch=pitch;t.it.p.yaw=yaw;t.it.p.roll=0;
       s.kitRedraw(t.it);s.commit();
    }else if(t.kind==='core'&&t.body?.turn){
       t.body.turn(rad(yaw)-(t.body.rotYT||0),rad(Math.max(-80,Math.min(80,pitch)))-(t.body.rotXT||0));
    }else if(t.kind==='world'&&t.body){t.body.userRot=rad(yaw);t.body.userVel=0;}
    update();
 }
 buttons.forEach(b=>b.addEventListener('click',()=>snap(b.dataset.axis,+b.dataset.sign)));
 let drag=null;
 core.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    core.setPointerCapture(e.pointerId);e.preventDefault();
 });
 core.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(dx||dy){change(dx,dy);drag.moved=true;}
    drag.x=e.clientX;drag.y=e.clientY;
 });
 function finish(e){
    if(!drag||e.pointerId!==drag.id)return;
    const didMove=drag.moved;drag=null;
    if(core.hasPointerCapture(e.pointerId))core.releasePointerCapture(e.pointerId);
    if(didMove&&pick()?.kind==='kit')s.commit();
    update();
 }
 core.addEventListener('pointerup',finish);core.addEventListener('pointercancel',finish);
 core.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    change(e.key==='ArrowLeft'?-12:e.key==='ArrowRight'?12:0,e.key==='ArrowUp'?-12:e.key==='ArrowDown'?12:0);
    if(pick()?.kind==='kit')s.commit();
 });
 const setTool=s.setTool.bind(s);
 s.setTool=function(tool){const v=setTool(tool);update();return v;};
 const kitRedraw=s.kitRedraw.bind(s);
 s.kitRedraw=function(it){const v=kitRedraw(it);if(s.tool==='hand')update();return v;};
 const select=s.select.bind(s);
 s.select=function(it,...args){const v=select(it,...args);update();return v;};
 s.el.addEventListener('pointermove',()=>{if(s.tool==='hand')update();},{passive:true});
 addEventListener('resize',update,{passive:true});
 const observer=new MutationObserver(update);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 observer.observe(s.el,{attributes:true,attributeFilter:['class']});
 window.CerebraOrientationGizmo={element:el,refresh:update,snap,pick};
 update();
}
boot();
})();