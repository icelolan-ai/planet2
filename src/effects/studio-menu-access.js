/* Menu commands reveal their canvas destination and keep the menu bar reachable. */
(() => {
 function boot(){
  const s=window.__cerebra?.studio;if(!s?.menuBar){setTimeout(boot,150);return;}
  const style=document.createElement('style');style.textContent=`
  #studio :is(.st-glass,.st-fly,.st-sub,.st-ctx,.st-lmenu,.st-dd,.st-edit-mini,.st-save,.st-assist,.st-dock,.studio-panel,.st-rail){background:#191d29!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;color:#eef1fa}
  #studio :is(.st-layer,.st-ghead){background:#232838!important;color:#eef1fa}
  #studio :is(.st-layer.is-sel,.st-ghead.is-multi){background:#413452!important}
  #studio .st-layers-tray:not(.is-folded){display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;padding-bottom:38px!important}#studio .st-layers-tray :is(.st-panel-head,.st-layer-bar,.studio-note){flex:0 0 auto}#studio .st-layers-tray .st-layers{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;align-content:start;padding:3px}#studio .st-layers .st-ghead .st-chev{display:block;width:9px!important;height:9px!important;max-width:9px;max-height:9px}
  #studio .st-layers .st-layer.in-group{border-left:2px solid #a78bfa!important}
  #studio .st-layers .st-layer.in-group::before,#studio .st-layers .st-layer.in-group:not(.is-drag)::after{content:none!important}
  body.studio-on .tune:not([data-open=true]),body.studio-on .tune:not([data-open=true]) *{visibility:hidden!important;pointer-events:none!important;transition:none!important}
  #studio .st-menu-front{z-index:110!important}
  #studio .st-fly{z-index:115!important}#studio :is(.st-save,.st-ctx,.st-dd){z-index:116!important}#studio .st-lmenu{z-index:140!important}
  body.studio-on :is(#tune,#wtune){top:calc(52px + env(safe-area-inset-top,0px))!important;max-height:calc(100dvh - 60px - env(safe-area-inset-top,0px))!important;box-sizing:border-box!important;padding-top:18px!important;background:#151a26!important}
  #studio .st-lib{background:#101522!important}#studio .st-lib-card{background:#242a39!important}
  #studio .studio-section{border-color:#ffffff30!important}
  #studio :is(select,input:not([type=range]):not([type=color]):not([type=checkbox]),textarea){background-color:#252c3b!important;color:#f0f3fa!important}
  #studio .st-btn:not(.is-primary):not(.is-on):not(.is-sel){background-color:#293142}
  #studio .studio-note,#studio .st-fly-note{color:#c4ccde!important}
  `;document.head.append(style);
  const drawers=['tune','wtune'].map(id=>document.getElementById(id)).filter(Boolean),homes=new Map(drawers.map(el=>{const marker=document.createComment('tune home');el.before(marker);return[el,marker]}));
  function scope(){for(const el of drawers){const parent=s.active?s.el:homes.get(el).parentNode;if(el.parentNode!==parent){if(s.active)s.el.append(el);else homes.get(el).after(el);}}}
  new MutationObserver(scope).observe(document.body,{attributes:true,attributeFilter:['class']});scope();
  const closeTune=()=>{if(document.getElementById('tune')?.dataset.open==='true')document.querySelector('[data-tune-close]')?.click();if(document.getElementById('wtune')?.dataset.open==='true')typeof WorldTune!=='undefined'&&WorldTune.open(false);};
  s.revealMenuTray=function(name){const tray=this.trays[name];if(!tray)return;this.el.classList.remove('st-ui-off');tray.hidden=false;tray.classList.remove('is-folded');tray.querySelector('[data-layers-fold],[data-panel-fold],[data-dock-fold]')?.setAttribute('aria-expanded','true');if(name==='panel')this.tools(true);this.el.querySelectorAll('.st-menu-front').forEach(el=>el.classList.remove('st-menu-front'));tray.classList.add('st-menu-front');this.layoutTrays();};
  s.prepareMenuAction=function(top,label){this.closeFly?.();this.closeGrp?.();if(this.lmenu)this.lmenu.hidden=true;this.toggleHelp?.(false);this.el.querySelectorAll('.st-menu-front').forEach(el=>el.classList.remove('st-menu-front'));if(!['Show interface','Exit Studio'].includes(label))this.el.classList.remove('st-ui-off');if(label!=='Tune the core')closeTune();if(top!=='Window'&&!label.includes('Library'))this.libOpen(false);if(top==='Layer'||label==='Group selection')this.revealMenuTray('layers');if(top==='Type'&&label==='Add text')this.revealMenuTray('add');};
  s.settleMenuAction=function(){this.layoutTrays();this.layoutOpenFlyouts?.();const tray=this.el.querySelector('.st-menu-front');if(tray){const r=tray.getBoundingClientRect(),top=this.menuBar.getBoundingClientRect().bottom+8;tray.style.top=Math.max(top,Math.min(r.top,innerHeight-Math.min(r.height,innerHeight-top-8)-8))+'px';tray.style.bottom='auto';tray.style.maxHeight=Math.max(80,innerHeight-parseFloat(tray.style.top)-8)+'px';tray.style.left=Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px';tray.style.right='auto';}if(tray===this.trays.layers){requestAnimationFrame(()=>this.el.querySelector('.st-ghead:last-child')?.scrollIntoView({block:'nearest'}));}};
 }
 setTimeout(boot,0);
})();
