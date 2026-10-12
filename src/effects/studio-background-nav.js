/* Group existing native Animated Background presets inside Background settings.
 * Move DOM nodes: do NOT create parallel controls, scene state or kit listeners. */
(() => {
  if(window.__cerebraBackgroundNavigationBooted)return;
  window.__cerebraBackgroundNavigationBooted=true;
  let tries=0;
  function boot(){
    const studio=window.__cerebra?.studio;
    const root=studio?.el;
    const select=root?.querySelector('[data-studio-background]');
    const ether=root?.querySelector('[data-studio-template="liquidEther"]');
    const pillar=root?.querySelector('[data-studio-template="lightPillar"]');
    const aero=root?.querySelector('[data-studio-template="aeroShards"]');
    if(!select||!ether||!pillar||!aero){
      if(++tries<120)setTimeout(boot,250);
      return;
    }
    if(root.querySelector('[data-animated-background-group]'))return;
    const presets=ether.closest('.studio-preset-grid');
    if(!presets||pillar.parentElement!==presets||aero.parentElement!==presets)return;
    const note=presets.previousElementSibling;
    const heading=note?.previousElementSibling;
    if(!note?.classList.contains('studio-note'))return;
    // Another native menu module may have turned <h3> into a numbered
    // accordion <summary>. Preserve that existing details and its listeners.
    let details=heading?.tagName==='SUMMARY'?heading.closest('details'):null;
    if(details&&!details.contains(presets))details=null;
    if(!details){
      if(heading?.tagName!=='H3')return;
      details=document.createElement('details');
      details.className='studio-sub';
      details.innerHTML='<summary>Animated backgrounds</summary>';
      // Reparent original live controls, never duplicate them.
      details.append(note,presets);
      heading.remove();
    }
    details.classList.add('st-animated-bg-group');
    details.dataset.animatedBackgroundGroup='';
    details.open=false;
    select.insertAdjacentElement('afterend',details);
    const style=document.createElement('style');
    style.dataset.animatedBackgroundNav='';
    style.textContent=`
      #studio [data-animated-background-group]{margin:10px 0 16px;padding:10px 12px;
        border:1px solid var(--ui-outline,#ffffff26);border-radius:12px;
        background:rgba(13,18,29,.62)}
      #studio [data-animated-background-group] summary{cursor:pointer;min-height:35px;
        color:var(--ui-text,#eef1f8);font-weight:500;letter-spacing:.045em;
        list-style-position:inside;display:list-item;touch-action:manipulation}
      #studio [data-animated-background-group] .studio-note{margin:4px 0 10px;
        color:var(--ui-muted,#aeb8cc)}
      #studio [data-animated-background-group] .studio-preset-grid{margin:0;gap:8px}
      #studio [data-animated-background-group] .studio-preset{min-height:48px;
        border-radius:9px}
      @media(max-width:760px){#studio [data-animated-background-group] summary{min-height:44px}}
    `;
    document.head.append(style);
    // The existing Image > Animated background presets… shortcut can remain:
    // open our native Background subsection before its old handler scrolls.
    const openFromMenu=e=>{
      const item=e.target?.closest?.('[role="menuitem"]');
      if(!item)return;
      const label=(item.textContent||'').toLowerCase();
      if(label.includes('animated background')||label.includes('พื้นหลังเคลื่อนไหว')){
        details.open=true;
      }
    };
    root.addEventListener('click',openFromMenu,true);
    window.CerebraBackgroundNavigation={element:details,open:()=>{details.open=true;details.scrollIntoView({block:'nearest'});}};
  }
  boot();
})();