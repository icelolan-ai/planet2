/* React Bits LineSidebar native adapter.
 * Source JSX 844164c170320cfa59997cb098959b3bf3be3429;
 * source CSS d05dadf4ca2fb486b0b4e923fe23f092ced35418.
 * MIT + Commons Clause notice in template.html applies.
 * Existing buttons/summary, native active state and GSAP ticker remain owners.
 */
(() => {
  if (window.CerebraLineSidebar) return;
  const curves = { linear: p => p, smooth: p => p * p * (3 - 2 * p), sharp: p => p * p * p };
  const reduced = matchMedia('(prefers-reduced-motion:reduce)'), states = new Map();
  const defaults = { accentColor:'#ec7ba8', textColor:'#c4c4c4', markerColor:'#6c6c6c', showIndex:true, showMarker:true, proximityRadius:100, maxShift:12, falloff:'smooth', markerLength:24, markerGap:6, tickScale:.5, scaleTick:true, itemGap:4, fontSize:.85, smoothing:100 };
  const css = document.createElement('style');
  css.textContent = `
    .rb-line-nav{--accent-color:#ec7ba8;--text-color:#c4c4c4;--marker-color:#6c6c6c;--marker-length:24px;--marker-gap:6px;--tick-scale:.5;--max-shift:12px;--item-gap:4px;--font-size:.85rem}
    .rb-line-item{position:relative!important;--effect:0}
    .rb-line-label{position:relative;display:inline-flex;align-items:baseline;min-width:0;color:color-mix(in srgb,var(--accent-color) calc(var(--effect,0)*100%),var(--text-color));transform:translateX(calc(var(--effect,0)*var(--max-shift)));font-size:var(--font-size);line-height:1.2}
    .rb-line-nav .rb-line-index{font: .85em ui-monospace,SFMono-Regular,Menlo,monospace;margin-right:.6rem;opacity:calc(.55 + var(--effect,0)*.45);flex:none}
    .rb-line-text{min-width:0;overflow-wrap:anywhere}
    .rb-line-marker{position:absolute;top:50%;left:0;height:1px;width:var(--marker-length);background:color-mix(in srgb,var(--accent-color) calc(var(--effect,0)*100%),var(--marker-color));transform-origin:left center;transform:translateY(-50%) scaleX(calc(.7 + var(--effect,0)*.5));pointer-events:none}
    .rb-line-item:not(:last-child)::before{content:'';position:absolute;top:calc(100% + var(--item-gap)/2);left:0;height:1px;width:calc(var(--marker-length)*var(--tick-scale));background:var(--marker-color);opacity:.5;transform:translateY(-50%);pointer-events:none}
    .rb-line-nav.rb-line-scale .rb-line-item:not(:last-child)::before{transform-origin:left center;transform:translateY(-50%) scaleX(calc(.7 + var(--effect,0)*.6))}
    .rb-line-nav.rb-line-no-index .rb-line-index,.rb-line-nav.rb-line-no-marker .rb-line-marker{display:none}
    .rb-line-nav.rb-line-no-marker .rb-line-item::before{display:none}
    .cl-chapters.rb-line-nav{padding-right:12px;gap:var(--item-gap)}
    .cl-chapters.rb-line-nav .rb-line-item{padding:12px calc(var(--max-shift) + 4px) 12px calc(var(--marker-length) + var(--marker-gap));min-height:44px;border-left:0;background:none}
    .cl-chapters.rb-line-nav .rb-line-item[aria-current=true]{background:#ec7ba80a}
    #studio .rb-line-nav>.studio-section>.rb-line-item{padding:10px calc(var(--max-shift) + 8px) 10px calc(var(--marker-length) + var(--marker-gap));margin:0;box-shadow:none;letter-spacing:.06em}
    #studio .rb-line-nav>.studio-section>.rb-line-item::before{display:none}
    #studio .rb-line-nav>.studio-section>.rb-line-item::after{flex:none;position:absolute;right:2px;top:22px}
    .rail.rb-line-nav{gap:4px;right:16px}
    .rail.rb-line-nav .rb-line-item{min-height:26px;height:26px;padding:0 calc(var(--max-shift) + 4px) 0 calc(var(--marker-length) + var(--marker-gap))}
    .rail.rb-line-nav .rb-line-item>i{display:none}
    .rail.rb-line-nav .rb-line-label{transform:translateX(calc(var(--effect,0)*var(--max-shift)));transition:none}
    .rail.rb-line-nav .rb-line-label span{font-size:inherit;transform:none;transition:none}
    .rail.rb-line-nav .rb-line-marker{display:block!important;opacity:1!important;transform:translateY(-50%) scaleX(calc(.7 + var(--effect,0)*.5))!important}
    @media(max-width:760px){
      .cl-chapters.rb-line-nav{padding:0 0 10px;gap:4px;--max-shift:0px!important}
      .cl-chapters.rb-line-nav .rb-line-item{padding:10px 12px;flex:0 0 auto;white-space:nowrap;border-bottom:2px solid transparent}
      .cl-chapters.rb-line-nav .rb-line-item[aria-current=true]{border-bottom-color:var(--accent-color)}
      .cl-chapters.rb-line-nav .rb-line-marker,.cl-chapters.rb-line-nav .rb-line-item::before{display:none!important}
      .rail.rb-line-nav{right:3px;gap:3px}
      .rail.rb-line-nav .rb-line-item{min-height:16px;height:16px;padding:0;width:24px}
      .rail.rb-line-nav .rb-line-label{display:none}
      .rail.rb-line-nav .rb-line-marker{width:12px}
    }
  `;
  document.head.append(css);
  let ticking = false, last = 0;
  const visible = root => !document.hidden && root.getClientRects().length && root.checkVisibility({checkVisibilityCSS:true});
  function frame() {
    const now = performance.now(), dt = Math.min((now - last)/1000,.05); last = now;
    let moving = false;
    for (const s of states.values()) {
      const show = visible(s.root), k = 1 - Math.exp(-dt/(Math.max(s.options.smoothing,1)/1000));
      s.items.forEach((el,i) => {
        const target = Math.max(show && !reduced.matches ? s.targets[i] || 0 : 0, s.active(el) ? 1 : 0);
        const next = show && !reduced.matches ? s.current[i] + (target - s.current[i])*k : target;
        const settled = Math.abs(target - next)<.0015, value = settled ? target : next;
        s.current[i] = value; el.style.setProperty('--effect',value.toFixed(4));
        if (!settled) moving = true;
      });
    }
    if (!moving) { gsap.ticker.remove(frame); ticking = false; }
  }
  function start() { if (!ticking) { last=performance.now();ticking=true;gsap.ticker.add(frame); } }
  function configure(key, patch={}) {
    const s=states.get(key);if(!s)return;
    Object.assign(s.options,patch);const o=s.options;
    for(const [k,v] of Object.entries({ 'accent-color':o.accentColor,'text-color':o.textColor,'marker-color':o.markerColor,'marker-length':`${o.markerLength}px`,'marker-gap':`${o.markerGap}px`,'tick-scale':o.tickScale,'max-shift':`${o.maxShift}px`,'item-gap':`${o.itemGap}px`,'font-size':`${o.fontSize}rem` }))s.root.style.setProperty(`--${k}`,v);
    s.root.classList.toggle('rb-line-no-index',!o.showIndex);s.root.classList.toggle('rb-line-no-marker',!o.showMarker);s.root.classList.toggle('rb-line-scale',o.scaleTick);start();
  }
  function attach(key,root,selector,active,options={}) {
    if(!root||states.has(key))return;
    const items=[...root.querySelectorAll(selector)];if(!items.length)return;
    const s={root,items,active,options:{...defaults,...options},targets:items.map(()=>0),current:items.map(()=>0)};states.set(key,s);root.classList.add('rb-line-nav');root.dataset.lineSidebar=key;
    items.forEach((el,i)=>{
      el.classList.add('rb-line-item');
      const label=document.createElement('span'),index=document.createElement('span'),text=document.createElement('span'),marker=document.createElement('span');
      label.className='rb-line-label';index.className='rb-line-index';index.setAttribute('aria-hidden','true');index.textContent=String(i+1).padStart(2,'0');text.className='rb-line-text';
      // Keep native buttons/summary and their nodes, attributes and handlers.
      const nodes=[...el.childNodes].filter(n=>!(key==='sections'&&n.nodeType===1&&n.tagName==='I'));text.append(...nodes);label.append(index,text);marker.className='rb-line-marker';marker.setAttribute('aria-hidden','true');el.prepend(marker,label);
    });
    const clear=()=>{s.targets.fill(0);start();};
    const move=e=>{if(e.pointerType==='touch'||reduced.matches||(key==='guide'&&innerWidth<=760))return;const ease=curves[s.options.falloff]||curves.linear;s.items.forEach((el,i)=>{const r=el.getBoundingClientRect(),d=Math.abs(e.clientY-(r.top+r.height/2));s.targets[i]=ease(Math.max(0,1-d/Math.max(1,s.options.proximityRadius)));});start();};
    const focus=e=>{s.targets.fill(0);const i=s.items.findIndex(el=>el.contains(e.target));if(i>=0)s.targets[i]=1;start();};
    root.addEventListener('pointermove',move);root.addEventListener('pointerleave',clear);root.addEventListener('pointercancel',clear);root.addEventListener('focusin',focus);root.addEventListener('focusout',clear);root.addEventListener('toggle',clear,true);
    const observer=new MutationObserver(start);observer.observe(root,{subtree:true,attributes:true,attributeFilter:['aria-current','open','hidden']});
    s.dispose=()=>{observer.disconnect();for(const [event,fn,capture]of [['pointermove',move],['pointerleave',clear],['pointercancel',clear],['focusin',focus],['focusout',clear],['toggle',clear,true]])root.removeEventListener(event,fn,capture);};
    configure(key);
  }
  function boot(){
    const a=window.__cerebra,s=a?.studio,guide=document.querySelector('.cl-chapters');if(!s?.timelineSection||!guide){setTimeout(boot,180);return;}
    attach('guide',guide,'[data-cl-chapter]',el=>el.getAttribute('aria-current')==='true');
    attach('studio',s.panel,':scope > .studio-section > summary',el=>el.parentElement.open,{markerLength:16,maxShift:6,fontSize:.75});
    attach('sections',document.querySelector('nav.rail'),'[data-target]',el=>el.getAttribute('aria-current')==='true',{markerLength:16,maxShift:8,fontSize:.7});
  }
  reduced.addEventListener('change',()=>{for(const s of states.values())s.targets.fill(0);start();});
  document.addEventListener('visibilitychange',()=>{for(const s of states.values())s.targets.fill(0);start();});
  addEventListener('pagehide',()=>{gsap.ticker.remove(frame);ticking=false;});
  addEventListener('pageshow',start);
  window.CerebraLineSidebar={configure,curves,inspect:key=>{const s=states.get(key);return s?{options:{...s.options},current:[...s.current],targets:[...s.targets],count:s.items.length,ticking}:null;}};
  boot();
})();
