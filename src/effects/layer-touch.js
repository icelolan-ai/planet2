/* Mobile/coarse-pointer hit targets for compact Layers controls.
   Keep the visual icons compact while making the interactive button boxes at least 40px. */
(() => {
  if (window.__cerebraLayerTouchReady) return;
  window.__cerebraLayerTouchReady = true;
  const style = document.createElement('style');
  style.textContent = `
    @media (pointer:coarse), (max-width:760px){
      #studio .st-layers :is(.st-eye,.st-lmore,.st-ldel,.st-lcheck,.st-sw,.st-gtog),
      #studio .st-layers :is(button,[role="button"])[aria-label*="layer" i],
      #studio .st-layers :is(button,[role="button"])[aria-label*="delete" i],
      #studio .st-layers :is(button,[role="button"])[aria-label*="hide" i],
      #studio .st-layers :is(button,[role="button"])[aria-label*="lock" i],
      #studio .st-layers :is(button,[role="button"])[aria-label*="option" i]{
        width:40px!important;
        min-width:40px!important;
        height:40px!important;
        min-height:40px!important;
        flex:0 0 40px!important;
      }
      #studio .st-layers :is(.st-layer,.st-ghead){min-height:44px!important}
      #studio .st-layers .st-lname{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    }
  `;
  document.head.append(style);
})();
