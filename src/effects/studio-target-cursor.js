/* Target Cursor-inspired corner lock, scoped to UI controls only.
 * Reference: reactbits.dev/animations/target-cursor. Native pointer is retained
 * in Studio; no canvas overlay, focus interception or touch gesture changes. */
(() => {
  if (document.querySelector('.cb-target-cursor')) return;
  const fine=matchMedia('(hover:hover) and (pointer:fine)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const style=document.createElement('style');
  style.textContent=`
    .cb-target-cursor{position:fixed;inset:0;pointer-events:none!important;z-index:2147483647;color:#f3b4d0;contain:strict}
    .cb-target-cursor[hidden]{display:none!important}.cb-target-cursor i{position:absolute;width:10px;height:10px;border:2px solid currentColor;box-shadow:0 0 5px #151627;pointer-events:none}
    html.cb-target-active #cursor{visibility:hidden!important}
    html.has-cursor .cl-page :is(input,textarea,[contenteditable=true]){cursor:text!important}
    html.has-cursor .cl-page :is(select,input[type=range],input[type=color]){cursor:auto!important}
    .cb-target-cursor i:nth-child(1){border-right:0;border-bottom:0}.cb-target-cursor i:nth-child(2){border-left:0;border-bottom:0}.cb-target-cursor i:nth-child(3){border-left:0;border-top:0}.cb-target-cursor i:nth-child(4){border-right:0;border-top:0}
  `;document.head.append(style);
  const cursor=document.createElement('div');cursor.className='cb-target-cursor';cursor.setAttribute('aria-hidden','true');cursor.hidden=true;
  for(let i=0;i<4;i++)cursor.append(document.createElement('i'));
  document.body.append(cursor);
  const corners=[...cursor.children];
  // An open modal is above document.body's stacking context, regardless of z-index.
  // Move the overlay into that modal so the corner lock remains visible there.
  const selector='#gateway button,.cl-page button,.cl-page summary,#studio button:not([data-tray-grip]):not([data-dock-fold]),#studio summary,main button,a[data-cursor]';
  let target=null,frame=0,x=0,y=0,positions=null;
  const enabled=()=>fine.matches&&!reduced.matches&&!document.hidden;
  function hide(){cursor.hidden=true;document.documentElement.classList.remove('cb-target-active');target=null;positions=null;cancelAnimationFrame(frame);frame=0;}
  function render(){frame=0;if(!enabled()||!target?.isConnected||!target.getClientRects().length){hide();return;}
    const under=document.elementFromPoint(x,y);
    if(!under||under.closest(selector)!==target){hide();return;}
    const r=target.getBoundingClientRect();
    if(r.width<1||r.height<1){hide();return;}
    const modal=target.closest('dialog[open]'),parent=modal||target.closest('#studio')||document.body;
    if(cursor.parentElement!==parent)parent.append(cursor);
    // Fixed coordinates are local to a transformed dialog's containing block.
    const offset=modal&&getComputedStyle(modal).transform!=='none'?modal.getBoundingClientRect():{left:0,top:0};
    const l=Math.max(1,r.left-4)-offset.left,t=Math.max(1,r.top-4)-offset.top;
    const right=Math.min(innerWidth-11,r.right-6)-offset.left,b=Math.min(innerHeight-11,r.bottom-6)-offset.top;
    const next=[[l,t],[right,t],[right,b],[l,b]];
    if(!positions)positions=next.map(()=>[x-offset.left-5,y-offset.top-5]);
    let settling=false;
    corners.forEach((c,i)=>{for(let axis=0;axis<2;axis++){const d=next[i][axis]-positions[i][axis];positions[i][axis]+=Math.abs(d)<.3?d:d*.3;if(Math.abs(d)>.3)settling=true;}c.style.transform=`translate(${positions[i][0]}px,${positions[i][1]}px)`;});
    cursor.hidden=false;
    document.documentElement.classList.add('cb-target-active');
    // Continue only while a target is active: handles expanding menu cards and scrolling.
    if(target)frame=requestAnimationFrame(render);
  }
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||!enabled()){hide();return;}
    x=event.clientX;y=event.clientY;
    const next=event.target.closest?.(selector);
    if(!next||next.disabled||next.getAttribute('aria-disabled')==='true'||event.target.closest('input,textarea,[contenteditable=true],canvas,.st-draw-pad')){hide();return;}
    if(next!==target){target=next;positions=null;}
    if(!frame)frame=requestAnimationFrame(render);
  },{passive:true});
  document.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')hide();},{passive:true});
  document.addEventListener('keydown',hide);document.addEventListener('visibilitychange',hide);
  window.addEventListener('blur',hide);document.addEventListener('pointerout',event=>{if(!event.relatedTarget)hide();});
  fine.addEventListener('change',hide);reduced.addEventListener('change',hide);
})();
