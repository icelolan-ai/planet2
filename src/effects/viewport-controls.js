/* Viewport UX: native fullscreen gesture and full-width paths on desktop. */
(() => {
  function boot(){
    const app=window.__cerebra,s=app?.studio,page=document.querySelector('.cl-page'),language=window.__cerebraLanguage;
    if(!s?.menuEntries||!page||!app.entry?.launchPaths||!language){setTimeout(boot,180);return;}
    if(page.dataset.viewportReady)return;page.dataset.viewportReady='true';
    const css=document.createElement('style');css.textContent='.cl-hub-open .cl-shell{width:100%;max-width:none;margin:0;box-sizing:border-box}.cl-fullscreen{border:1px solid #354054!important;border-radius:6px;padding:0 12px!important;color:#b5bed2!important;font:14px var(--cl-body)!important;white-space:nowrap}@media(max-width:760px){.cl-fullscreen{padding:0 8px!important;font-size:12px!important}.cl-head-actions{gap:8px}}';document.head.append(css);
    const button=document.createElement('button');button.type='button';button.className='cl-fullscreen';button.dataset.clFullscreen='';
    button.hidden=!document.fullscreenEnabled||!document.documentElement.requestFullscreen;
    page.querySelector('.cl-head-actions').prepend(button);
    const label=()=>document.fullscreenElement?'Exit full screen':'Full screen';
    function sync(){button.textContent=language.label(label());button.setAttribute('aria-pressed',String(!!document.fullscreenElement));button.setAttribute('aria-label',language.label(label()));}
    async function toggle(){
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
      catch(_){button.title=language.current==='th'?'ไม่สามารถเปิดเต็มจอในหน้าต่างนี้ได้':'Full screen is unavailable in this window';}
      sync();
    }
    button.addEventListener('click',toggle);
    const view=s.menuEntries.View;
    s.menuEntries.View=function(){const result=view.call(s);return !button.hidden?[...result,[label(),toggle,!!document.fullscreenElement]]:result;};
    document.addEventListener('fullscreenchange',()=>{sync();dispatchEvent(new Event('resize'));s.closeMenuBar();});
    language.onChange(sync);sync();
  }
  setTimeout(boot,0);
})();
