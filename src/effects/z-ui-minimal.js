/* Planet 2 / Cerebra — Phase A: cross-page minimal UI foundation.
 * Presentation only. Shared by gateway, Explore, Tune, Studio, Guide and tool
 * panels. No DOM/state/controller/canvas/export changes. */
(() => {
  if(document.querySelector('style[data-ui-minimal-foundation]'))return;
  const style=document.createElement('style');
  style.dataset.uiMinimalFoundation='true';
  style.textContent=`
    :root{
      --ui-surface:#0c1019;
      --ui-surface-2:#141927;
      --ui-outline:rgba(203,211,229,.16);
      --ui-outline-hover:rgba(203,211,229,.32);
      --ui-text:#edf0f7;
      --ui-muted:#aeb8cc;
      --ui-violet:#c7b3ec;
      --ui-blue:#95b8e8;
      --ui-red:#df7a90;
      --ui-radius:12px;
      --ui-radius-sm:9px;
      --ui-shadow:0 12px 30px rgba(0,0,0,.24);
    }
    :root:not([data-theme=light]){
      --line:rgba(203,211,229,.13);
      --line-2:rgba(203,211,229,.23);
      --ink:#e8ebf2;--ink-2:#aeb8cb;
    }
    /* Entire site navigation: calmer outlines and state feedback. */
    :is(#gateway,#atelier,.cl-page,#studio,#tune,#wtune,#obuild) :is(button,[role=button]):focus-visible{
      outline:2px solid var(--ui-blue);outline-offset:3px;
    }
    :is(#gateway,#atelier,.cl-page,#studio,#tune,#wtune,#obuild) :is(input,select,textarea):focus-visible{
      outline:2px solid var(--ui-blue);outline-offset:2px;
    }
    /* Entry and universe pages: keep 3D artwork untouched. */
    #gateway .gateway-choice{border-color:var(--ui-outline);}
    #gateway .gateway-enter,
    #atelier .atelier-copy button,#atelier .atelier-bar button{
      border-color:var(--ui-outline-hover);
      border-radius:var(--ui-radius-sm);
      background-color:rgba(11,15,23,.84);
      box-shadow:none;
      letter-spacing:.07em;
    }
    #atelier .atelier-copy p{color:var(--ui-muted);line-height:1.65;max-width:46ch}
    #atelier .atelier-bar{gap:12px}
    #atelier .atelier-rail{background:rgba(7,10,16,.54);border:1px solid var(--ui-outline);}
    /* How-to: one readable rhythm, rather than many distinct card surfaces. */
    .cl-page:not(.cl-hub-open){
      --cl-ink:var(--ui-text);--cl-muted:var(--ui-muted);
      --cl-line:var(--ui-outline);--cl-pink:var(--ui-violet);
    }
    .cl-page:not(.cl-hub-open) :is(.cl-search,.cl-param,.cl-toolbar,.cl-step-visual){
      border-color:var(--ui-outline);border-radius:var(--ui-radius-sm);
      background:rgba(13,17,27,.84);
      box-shadow:none;
    }
    .cl-page:not(.cl-hub-open) .cl-chapters button[aria-current=true]{
      color:var(--ui-violet);background:rgba(173,147,220,.09);border-color:var(--ui-violet);
    }
    .cl-page:not(.cl-hub-open) .cl-step{border-color:var(--ui-outline);gap:16px;}
    .cl-page:not(.cl-hub-open) .cl-topic{border-color:var(--ui-outline);}
    .cl-page:not(.cl-hub-open) .cl-content :is(p,dd){line-height:1.7}
    /* Studio chrome: intentionally excludes .studio-stage, .st-item,
       artwork itself, and any GPU/rendered layers. */
    #studio{
      --ui-control:rgba(211,221,239,.07);
      color:var(--ui-text);
    }
    #studio :is(.st-glass,.st-fly,.studio-panel,.st-menu-popup){
      border-color:var(--ui-outline);
      border-radius:var(--ui-radius);
      box-shadow:var(--ui-shadow);
    }
    #studio .st-glass{background-color:rgba(12,16,25,.93);}
    #studio :is(.studio-panel,.st-fly){background-color:rgba(12,16,25,.96);}
    #studio .st-fly{gap:10px;}
    #studio .st-btn:not(.is-primary){
      border-color:var(--ui-outline);
      border-radius:var(--ui-radius-sm);
      box-shadow:none;
    }
    #studio .st-btn:not(.is-primary):hover{border-color:var(--ui-outline-hover);}
    #studio .st-btn[aria-pressed=true]:not(.is-primary){
      background:rgba(179,144,231,.15);
      border-color:rgba(204,175,246,.58);
      color:#f3e7ff;
    }
    #studio :is(.st-fly-title,.studio-panel h2,.st-sub-t){letter-spacing:.07em;}
    #studio :is(.st-fly-title,.st-sub-t){color:var(--ui-violet);}
    #studio :is(.st-fly-note,.studio-control>span,.st-fly-row>span){color:var(--ui-muted);}
    #studio :is(.st-layer,.studio-layer,.st-ghead){border-color:var(--ui-outline);box-shadow:none;}
    #studio .st-layer.is-sel{border-color:var(--ui-violet);background:rgba(178,148,222,.1);}
    #studio :is(.st-fly,.studio-panel) :is(input:not([type=range]):not([type=checkbox]),select,textarea){
      border-color:var(--ui-outline);border-radius:var(--ui-radius-sm);
      background-color:rgba(211,221,239,.055);
    }
    #studio :is(.st-fly,.studio-panel) :is(input,select,textarea):disabled{opacity:.45;}
    #studio .st-dock .st-sep{background:var(--ui-outline);}
    /* Tune Core and Explore's floating controls share one quieter surface. */
    :is(#tune,#wtune,#obuild){
      border-color:var(--ui-outline)!important;
      border-radius:var(--ui-radius)!important;
      box-shadow:var(--ui-shadow)!important;
    }
    :is(#tune,#wtune,#obuild) :is(.tune-tabs,.tune-seg){border-color:var(--ui-outline);}
    :is(#tune,#wtune,#obuild) .tune-row{border-color:var(--ui-outline);}
    :is(#tune,#wtune,#obuild) :is(.tune-tabs button[aria-selected=true],.tune-seg button[aria-pressed=true]){
      background:rgba(176,141,223,.22)!important;
      color:#f6edff!important;
      box-shadow:none!important;
    }
    :is(#tune,#wtune,#obuild) :is(.tune-btn,.tune-reset){box-shadow:none!important;border-radius:var(--ui-radius-sm);}
    /* Short viewports: preserve the original native sheet dimensions. */
    @media(max-width:760px){
      .cl-page:not(.cl-hub-open) .cl-guide-layout{gap:12px;}
      .cl-page:not(.cl-hub-open) .cl-content{min-width:0;}
      #studio .st-btn{min-height:44px;}
      #atelier .atelier-copy button{min-height:44px;}
    }
    @media(prefers-reduced-motion:reduce){
      :is(#gateway,#atelier,.cl-page,#studio,#tune,#wtune,#obuild) :is(button,input,select,textarea){scroll-behavior:auto;}
    }
  `;
  document.head.append(style);
})();
