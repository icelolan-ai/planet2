/* Deep Surface Tune: expose only controls that affect the selected surface style. */
(() => {
  const SPEC={
    none:['Original surface',[]],
    dotgrid:['Dot pattern',['s_freq','s_grad']],
    halftone:['Halftone pattern',['s_freq','s_grad']],
    spike:['Spike geometry',['s_colorC','s_freq','s_len','s_tipdots','s_dsize']],
    threads:['Thread fibres',['s_colorC','s_len','s_curl','s_steps','s_tipdots','s_dsize']],
    fur:['Bristle fibres',['s_len','s_curl']],
    wire:['Wire geometry',['s_colorC','s_freq','s_grad','s_twist','s_wdetail','s_shell']],
    plexus3d:['Network topology',['s_freq','s_grad','s_links']],
    contour:['Contour lines',['s_freq','s_count']],
    meridian:['Meridian lines',['s_freq','s_count']],
    cloud:['Cloud volume',['s_grad','s_depth','s_hole','s_clump']],
    shards:['Crystal geometry',['s_colorC','s_freq','s_len','s_wide','s_tipdots','s_dsize']],
    radial:['Spoke system',['s_colorC','s_rrings','s_rvar','s_rgold','s_rn','s_dsize']],
    orrery:['Orrery system',['s_colorC','s_orings','s_oband','s_oarcs','s_ospokes','s_obubble','s_dsize']],
    neural:['Cells & fibres',['s_colorC','s_nn','s_nweb','s_nlinks','s_nstr','s_nscatter','s_dsize']],
    dataflow:['Flow curves',['s_colorC','s_dn','s_dbundle','s_dbow','s_dbeads','s_dtilt','s_dsize']],
    strands:['Drifting fibres',['s_colorC','s_tn','s_tlen','s_tdrift','s_tpole','s_tbig','s_dsize']]
  };
  const COMMON=['s_hide','s_colorA','s_colorB','s_bright','s_density','s_disp','s_size'];
  const MOTION=['s_spin','s_scale','s_tilt','s_roll','s_breath','s_bspeed','s_pulse','s_seed'];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function boot(){
    const app=window.__cerebra,s=app&&app.studio,tune=document.getElementById('tune');
    const src=s&&s.el&&s.el.querySelector('[data-studio-corefx]');
    if(!s||!tune||!src||!src.dataset.ready||!s.coreFxTarget||!s.coreFxSet){setTimeout(boot,180);return}
    if(s.__deepSurfaceTune)return;s.__deepSurfaceTune=true;
    const nav=tune.querySelector('.tune-tabs'),panes=[...tune.querySelectorAll('[data-pane]')];if(!nav||!panes.length)return;
    const originalTabs=[...nav.querySelectorAll('[data-tab]')];

    const css=document.createElement('style');css.textContent=`
      #tune .dst-pane{overflow-x:hidden}#tune .dst-note{margin:0 0 10px;padding:10px 11px;border:1px solid #ffffff18;border-radius:13px;background:#ffffff08;font:11px/1.45 var(--f-sans);color:#a8b1bf}
      #tune .dst-note b{display:block;margin-bottom:3px;color:#fff;font:600 12px var(--f-cond);letter-spacing:.1em;text-transform:uppercase}
      #tune .dst-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:12px}#tune .dst-grid button{min-height:42px;padding:7px 8px;border:1px solid #ffffff18;border-radius:12px;background:#ffffff09;color:#cbd3df;font:600 9px var(--f-cond);letter-spacing:.05em;text-transform:uppercase}
      #tune .dst-grid button[aria-pressed=true]{background:var(--cyg)!important;color:#fff;border-color:transparent;box-shadow:0 0 16px #8b5cf655}
      #tune .dst-group{margin:0 0 11px;padding:9px;border:1px solid #ffffff12;border-radius:14px;background:#0002}#tune .dst-group h4{margin:0 0 9px;font:600 10px var(--f-cond);letter-spacing:.13em;text-transform:uppercase;color:#d9ccff}
      #tune .dst-group .tune-row:last-child{margin-bottom:0}#tune .dst-reset{width:100%;min-height:42px;justify-content:center}
      @media(max-width:600px){#tune .dst-grid button,#tune .dst-reset{min-height:44px}}
    `;document.head.append(css);

    const tab=document.createElement('button');tab.type='button';tab.dataset.tab='surface-deep';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');tab.textContent='Surface';nav.append(tab);
    const pane=document.createElement('div');pane.className='tune-pane dst-pane';pane.dataset.pane='surface-deep';pane.hidden=true;panes[0].parentNode.append(pane);
    const styleBtns=[...src.querySelectorAll('[data-cfx-style]')].map(b=>[b.dataset.cfxStyle,b.textContent.trim()]);
    pane.innerHTML=`<div class="dst-note"><b data-dst-title>Surface</b><span data-dst-note></span></div><div class="dst-grid">${styleBtns.map(([k,n])=>`<button type="button" data-dst-style="${k}" aria-pressed="false">${esc(n)}</button>`).join('')}</div><section class="dst-group" data-dst-commonwrap><h4>Surface look</h4><div data-dst-common></div></section><section class="dst-group" data-dst-motionwrap><h4>Transform & motion</h4><div data-dst-motion></div></section><section class="dst-group" data-dst-specwrap><h4 data-dst-spech>Style detail</h4><div data-dst-spec></div></section><button type="button" class="tune-reset dst-reset" data-dst-reset>Reset this surface</button>`;

    const source=k=>src.querySelector(`[data-cfx="${k}"]`)||src.querySelector(`[data-cfx-sw="${k}"]`);
    const label=k=>{const x=source(k),r=x&&(x.closest('[data-cfx-rel]')||x.closest('label,.cfx-row')),z=r&&r.querySelector(':scope > span');return z?z.textContent.trim():k.replace(/^s_/,'')};
    const html=k=>{const x=src.querySelector(`[data-cfx="${k}"]`),sw=src.querySelector(`[data-cfx-sw="${k}"]`),n=esc(label(k));if(sw)return `<div class="tune-row"><span>${n}</span><div class="tune-seg" data-dst-sw="${k}"><button type="button" data-v="1">On</button><button type="button" data-v="0">Off</button></div></div>`;if(!x)return'';if(x.type==='color')return `<label class="tune-row"><span>${n}</span><input type="color" data-dst="${k}"></label>`;if(x.tagName==='SELECT')return `<label class="tune-row"><span>${n}</span><select data-dst="${k}">${[...x.options].map(o=>`<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('')}</select></label>`;return `<label class="tune-row"><span>${n}</span><input type="range" min="${x.min}" max="${x.max}" step="${x.step}" data-dst="${k}"><b data-out></b></label>`};
    pane.querySelector('[data-dst-common]').innerHTML=COMMON.map(html).join('');pane.querySelector('[data-dst-motion]').innerHTML=MOTION.map(html).join('');
    let specStyle='';
    const bind=root=>{root.querySelectorAll('[data-dst]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{s.coreFxSet(el.dataset.dst,el.type==='range'?+el.value:el.value);sync()}));root.querySelectorAll('[data-dst-sw]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{s.coreFxSet(g.dataset.dstSw,+b.dataset.v);sync()}))};bind(pane);
    const renderSpec=st=>{if(specStyle===st)return;specStyle=st;const [title,keys]=SPEC[st]||SPEC.none,box=pane.querySelector('[data-dst-spec]');pane.querySelector('[data-dst-spech]').textContent=title;box.innerHTML=keys.map(html).join('');pane.querySelector('[data-dst-specwrap]').hidden=!keys.length;bind(box)};
    const show=()=>{originalTabs.forEach(b=>b.setAttribute('aria-selected','false'));[...tune.querySelectorAll('[data-pane]')].forEach(p=>p.hidden=p!==pane);tab.setAttribute('aria-selected','true');sync()};tab.onclick=show;originalTabs.forEach(b=>b.addEventListener('click',()=>{tab.setAttribute('aria-selected','false');pane.hidden=true}));
    pane.querySelectorAll('[data-dst-style]').forEach(b=>b.onclick=()=>{s.coreFxSet('s_style',b.dataset.dstStyle);sync()});
    pane.querySelector('[data-dst-reset]').onclick=()=>{const t=s.coreFxTarget(),st=t&&t.tune.s_style||'none';if(s.resetFx)s.resetFx('subject');s.coreFxSet('s_style',st);sync()};

    const hideIrrelevantDesign=()=>src.querySelectorAll('[data-cfx-rel]').forEach(el=>{el.hidden=el.classList.contains('st-off')||el.classList.contains('cfx-hide')});
    function sync(){const t=s.coreFxTarget();if(!t||!t.tune)return;const v=t.tune,st=v.s_style||'none',[title]=SPEC[st]||SPEC.none;renderSpec(st);pane.querySelector('[data-dst-title]').textContent=title;pane.querySelector('[data-dst-note]').textContent=st==='none'?'Original surface is active. Its normal Tune Core tabs remain available.':'Only controls that affect this surface are shown.';pane.querySelectorAll('[data-dst-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dstStyle===st)));
      const generated=st!=='none';pane.querySelector('[data-dst-commonwrap]').hidden=!generated;pane.querySelector('[data-dst-motionwrap]').hidden=!generated;pane.querySelector('[data-dst-reset]').hidden=!generated;
      pane.querySelectorAll('[data-dst],[data-dst-sw]').forEach(el=>{const k=el.dataset.dst||el.dataset.dstSw,val=v[k];if(el.dataset.dst){if(el.type==='range'){el.value=val;const out=el.parentNode.querySelector('[data-out]');if(out)out.textContent=(+val).toFixed(+el.step>=1?0:2)}else el.value=val}if(el.dataset.dstSw)el.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===+(val??0))))});
      const surfaceOnly=generated&&+(v.s_hide??1)===1;originalTabs.forEach(b=>{const hide=surfaceOnly&&['shape','colour','core','motion'].includes(b.dataset.tab);b.hidden=hide;const p=tune.querySelector(`[data-pane="${b.dataset.tab}"]`);if(p&&hide)p.hidden=true});if(surfaceOnly&&originalTabs.some(b=>b.hidden&&b.getAttribute('aria-selected')==='true'))show();hideIrrelevantDesign();
    }
    const baseSync=s.syncCoreFx&&s.syncCoreFx.bind(s);if(baseSync)s.syncCoreFx=(...a)=>{const r=baseSync(...a);sync();return r};
    const baseAvail=s.updateAvail&&s.updateAvail.bind(s);if(baseAvail)s.updateAvail=(...a)=>{const r=baseAvail(...a);[s.fxSection,s.coreSection,s.partsSection,s.worldSection,s.el.querySelector('[data-studio-fx]'),s.fxBox].forEach(el=>{if(el)el.hidden=el.classList.contains('st-off')});return r};
    const mo=new MutationObserver(sync);mo.observe(src,{attributes:true,subtree:true,attributeFilter:['aria-pressed','class']});
    sync();s.updateAvail&&s.updateAvail();
  }
  setTimeout(boot,0);
})();
