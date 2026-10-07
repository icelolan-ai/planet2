/* Option Wheel-inspired curved picker, using the existing route controller.
 * Reference: reactbits.dev/components/option-wheel. Selection never opens a
 * route: the existing Enter button/keyboard action remains the only launcher. */
(() => {
  function boot(){
    const page=document.querySelector('.cl-page'),nav=page?.querySelector('.cl-paths');
    if(!window.__cerebra?.entry?.launchPaths||!nav){setTimeout(boot,180);return;}
    if(nav.dataset.wheelReady)return;nav.dataset.wheelReady='true';
    const style=document.createElement('style');style.textContent=`
      .cl-hub-open .cl-paths[data-wheel-ready]{position:relative;display:block;height:310px;margin-top:8px;perspective:900px;--cl-wheel-step:103px;isolation:isolate}
      .cl-hub-open .cl-paths[data-wheel-ready]::before{content:'';position:absolute;inset:calc(50% - 67px) -8px;pointer-events:none;border-top:1px solid #ec7ba825;border-bottom:1px solid #ec7ba825}
      .cl-hub-open .cl-paths[data-wheel-ready] .cl-path{position:absolute;top:50%;left:0;width:100%;min-height:64px;transform:translate(18px,calc(var(--cl-wheel-d)*var(--cl-wheel-step) - 50%)) rotate(calc(var(--cl-wheel-d)*5deg)) scale(.94);transform-origin:left center;opacity:.58;transition:transform .48s cubic-bezier(.2,.8,.2,1),opacity .35s,min-height .35s,padding .35s,font-size .35s;z-index:1;filter:grayscale(1)}
      .cl-hub-open .cl-paths[data-wheel-ready] .cl-path.is-selected{transform:translate(0,-50%) rotate(0) scale(1);opacity:1;z-index:2;min-height:124px;padding:22px 24px;filter:none}
      .cl-hub-open .cl-paths[data-wheel-ready] .cl-path:focus-visible{outline:2px solid #f3b4d0;outline-offset:4px;opacity:1}
      @media(max-width:760px){.cl-hub-open .cl-paths[data-wheel-ready]{height:260px;--cl-wheel-step:88px}.cl-hub-open .cl-paths[data-wheel-ready] .cl-path{min-height:56px;transform:translate(8px,calc(var(--cl-wheel-d)*var(--cl-wheel-step) - 50%)) rotate(calc(var(--cl-wheel-d)*4deg)) scale(.94);padding:10px 14px}.cl-hub-open .cl-paths[data-wheel-ready] .cl-path.is-selected{min-height:106px;padding:18px 16px;transform:translate(0,-50%)}.cl-hub-open .cl-paths[data-wheel-ready]::before{inset:calc(50% - 58px) -4px}}
      @media(max-height:620px){.cl-hub-open .cl-paths[data-wheel-ready]{height:180px;--cl-wheel-step:60px;margin-top:4px}.cl-hub-open .cl-paths[data-wheel-ready] .cl-path{min-height:40px;padding:5px 12px}.cl-hub-open .cl-paths[data-wheel-ready] .cl-path.is-selected{min-height:70px;padding:8px 12px}.cl-hub-open .cl-paths[data-wheel-ready]::before{inset:calc(50% - 39px) -4px}}
      @media(prefers-reduced-motion:reduce){.cl-hub-open .cl-paths[data-wheel-ready] .cl-path{transition:none}}
    `;document.head.append(style);
    const buttons=[...nav.querySelectorAll('[data-cl-path]')];
    // Bound the rotated far edge: a fixed angle on wide cards can cover Enter.
    function angle(){nav.style.setProperty('--cl-wheel-angle',Math.min(4,Math.atan((innerHeight<=620?8:18)/Math.max(1,nav.clientWidth))*180/Math.PI)+'deg');}
    style.textContent=style.textContent.replaceAll('var(--cl-wheel-d)*5deg','var(--cl-wheel-d)*var(--cl-wheel-angle,1deg)').replaceAll('var(--cl-wheel-d)*4deg','var(--cl-wheel-d)*var(--cl-wheel-angle,1deg)');
    style.textContent+='@media(max-width:360px){.cl-hub-open .cl-paths[data-wheel-ready] .cl-path.is-selected strong{font-size:24px}}.cl-hub-open .cl-slide-footer{position:relative;z-index:3}';
    new ResizeObserver(angle).observe(nav);window.addEventListener('resize',angle,{passive:true});angle();
    function sync(){const selected=Math.max(0,buttons.findIndex(b=>b.classList.contains('is-selected')));buttons.forEach((b,i)=>{let d=i-selected;if(d>1)d-=buttons.length;if(d< -1)d+=buttons.length;b.style.setProperty('--cl-wheel-d',d);});}
    const observer=new MutationObserver(sync);buttons.forEach(b=>observer.observe(b,{attributes:true,attributeFilter:['class']}));sync();
    nav.addEventListener('keydown',event=>{if(event.key==='Home'||event.key==='End'){event.preventDefault();buttons[event.key==='Home'?0:buttons.length-1].click();}else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const i=buttons.findIndex(b=>b.classList.contains('is-selected'));buttons[(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].click();}});
  }
  setTimeout(boot,0);
})();
