/* Deep per-style Surface controls for Studio -> Tune Core. */
(() => {
  const STYLE = {
    none:{title:'Original surface',group:'Original material',keys:[]},
    dotgrid:{title:'Dot grid',group:'Dot pattern',keys:['s_freq','s_grad']},
    halftone:{title:'Halftone dots',group:'Halftone pattern',keys:['s_freq','s_grad']},
    spike:{title:'Spikes',group:'Spike geometry',keys:['s_freq','s_len','s_tipdots','s_dsize']},
    threads:{title:'Curly threads',group:'Thread fibres',keys:['s_len','s_curl','s_steps','s_tipdots','s_dsize']},
    fur:{title:'Fur bristles',group:'Bristle fibres',keys:['s_len','s_curl']},
    wire:{title:'Wire polyhedron',group:'Wire geometry',keys:['s_freq','s_grad','s_twist','s_wdetail','s_shell']},
    plexus3d:{title:'Plexus 3D',group:'Network topology',keys:['s_freq','s_grad','s_links']},
    contour:{title:'Contour rings',group:'Contour lines',keys:['s_freq','s_count']},
    meridian:{title:'Meridian lines',group:'Meridian lines',keys:['s_freq','s_count']},
    cloud:{title:'Particle cloud',group:'Cloud volume',keys:['s_grad','s_depth','s_hole','s_clump']},
    shards:{title:'Crystal shards',group:'Crystal geometry',keys:['s_freq','s_len','s_wide','s_tipdots','s_dsize']},
    radial:{title:'Radial data spokes',group:'Spoke system',keys:['s_rrings','s_rvar','s_rgold','s_rn','s_dsize']},
    orrery:{title:'Orrery rings',group:'Orrery system',keys:['s_orings','s_oband','s_oarcs','s_ospokes','s_obubble','s_dsize']},
    neural:{title:'Neural cells',group:'Cells & fibres',keys:['s_nn','s_nweb','s_nlinks','s_nstr','s_nscatter','s_dsize']},
    dataflow:{title:'Data flow arcs',group:'Flow curves',keys:['s_dn','s_dbundle','s_dbow','s_dbeads','s_dtilt','s_dsize']},
    strands:{title:'Drifting strands',group:'Drifting fibres',keys:['s_tn','s_tlen','s_tdrift','s_tpole','s_tbig','s_dsize']}
  };
  const COMMON=['s_hide','s_colorA','s_colorB','s_colorC','s_bright','s_density','s_disp','s_size'];
  const MOTION=['s_spin','s_scale','s_tilt','s_roll','s_breath','s_bspeed','s_pulse','s_seed'];
  const DEFAULTS={
    s_hide:1,s_colorA:'#7a5cff',s_colorB:'#38c8ff',s_colorC:'#ffe9a8',s_bright:1,s_density:.55,s_disp:.35,s_size:1,
    s_spin:.15,s_scale:1,s_tilt:0,s_roll:0,s_breath:0,s_bspeed:.8,s_pulse:0,s_seed:7,s_freq:1,s_grad:'auto',
    s_links:3,s_len:1,s_curl:1,s_steps:34,s_wide:1,s_tipdots:0,s_twist:1,s_wdetail:0,s_shell:1,s_count:0,
    s_depth:1,s_hole:.45,s_clump:1.8,s_dsize:1,s_rrings:6,s_rvar:1,s_rgold:.08,s_rn:0,s_orings:4,s_oband:7,
    s_oarcs:8,s_ospokes:14,s_obubble:1,s_nn:12,s_nweb:22,s_nlinks:2,s_nstr:4,s_nscatter:50,s_dn:400,
    s_dbundle:14,s_dbow:.5,s_dbeads:.2,s_dtilt:1.1,s_tn:400,s_tlen:1,s_tdrift:1,s_tpole:.05,s_tbig:.05
  };
  const esc=v=>String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

  function boot(){
    const app=window.__cerebra, studio=app&&app.studio, tune=document.getElementById('tune');
    const design=studio&&studio.el&&studio.el.querySelector('[data-studio-corefx]');
    if(!studio||!tune||!design||design.dataset.ready!=='1'||!studio.coreFxTarget||!studio.coreFxSet){
      setTimeout(boot,180); return;
    }
    if(studio.__surfaceTuneCoreReady)return;
    studio.__surfaceTuneCoreReady=true;

    const css=document.createElement('style');
    css.textContent=`
      #tune .tc-surface-tab{white-space:nowrap}
      #tune .tc-surface-pane{overflow-x:hidden}
      #tune .tc-surface-intro{display:grid;gap:6px;margin:0 0 10px;padding:10px 11px;border:1px solid #ffffff18;border-radius:13px;background:#ffffff08}
      #tune .tc-surface-intro b{font:600 12px var(--f-cond);letter-spacing:.1em;text-transform:uppercase;color:#fff}
      #tune .tc-surface-intro small{font:11px/1.45 var(--f-sans);color:#9ca7b7}
      #tune .tc-stylegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:10px}
      #tune .tc-stylegrid button{min-height:42px;padding:7px 8px;border:1px solid #ffffff18;border-radius:10px;background:#ffffff09;color:#cbd3df;font:600 9px var(--f-cond);letter-spacing:.055em;text-transform:uppercase}
      #tune .tc-stylegrid button[aria-pressed="true"]{background:var(--cyg);color:#fff;border-color:transparent;box-shadow:0 0 16px #8b5cf64f}
      #tune .tc-surface-group{display:grid;gap:8px;margin:0 0 10px;padding:9px;border:1px solid #ffffff12;border-radius:13px;background:#00000016}
      #tune .tc-surface-group>h4{margin:0;padding:0 0 6px;border-bottom:1px solid #ffffff12;font:600 10px var(--f-cond);letter-spacing:.13em;text-transform:uppercase;color:#d9ccff}
      #tune .tc-surface-group[hidden]{display:none!important}
      #tune .tc-row-lock{opacity:.28;filter:grayscale(1);pointer-events:none}
      #tune .tc-lock-note{display:none;margin:6px 0 10px;padding:8px 10px;border-radius:10px;background:#ffffff08;color:#8d96a5;font:10px/1.4 var(--f-sans)}
      #tune.is-surface-exclusive .tc-lock-note{display:block}
      #tune.is-surface-exclusive [data-pane]:not(.tc-surface-pane){opacity:.38;filter:grayscale(.9)}
      #tune.is-surface-exclusive .tune-tabs button:not(.tc-surface-tab){opacity:.34;filter:grayscale(1);pointer-events:none}
      #tune .tc-reset{width:100%;min-height:42px;justify-content:center}
      @media(max-width:600px){#tune .tc-stylegrid button,#tune .tc-reset{min-height:44px}}
    `;
    document.head.append(css);

    const tabs=tune.querySelector('.tune-tabs');
    const panes=[...tune.querySelectorAll('[data-pane]')];
    if(!tabs||!panes.length)return;
    const originalTabs=[...tabs.querySelectorAll('button')];
    const tab=document.createElement('button');
    tab.type='button';tab.className='tc-surface-tab';tab.dataset.tab='surface';tab.textContent='Surface';tab.setAttribute('aria-selected','false');
    tabs.append(tab);
    const pane=document.createElement('div');
    pane.className='tc-surface-pane';pane.dataset.pane='surface';pane.hidden=true;
    panes[0].parentNode.insertBefore(pane,panes[0].nextSibling);

    const styleButtons=[...design.querySelectorAll('[data-cfx-style]')].map(b=>({key:b.dataset.cfxStyle,name:b.textContent.trim()}));
    pane.innerHTML=`<div class="tc-surface-intro"><b data-tcs-title>Surface</b><small data-tcs-note></small></div>
      <div class="tc-stylegrid">${styleButtons.map(x=>`<button type="button" data-tcs-style="${x.key}" aria-pressed="false">${esc(x.name)}</button>`).join('')}</div>
      <section class="tc-surface-group" data-tcs-group="common"><h4>Surface look & material</h4><div data-tcs-common></div></section>
      <section class="tc-surface-group" data-tcs-group="motion"><h4>Transform & motion</h4><div data-tcs-motion></div></section>
      <section class="tc-surface-group" data-tcs-group="specific"><h4 data-tcs-specific-title>Style options</h4><div data-tcs-specific></div></section>
      <button type="button" class="tune-btn tc-reset" data-tcs-reset>Reset current surface</button>`;

    const srcFor=key=>design.querySelector(`[data-cfx="${key}"]`)||design.querySelector(`[data-cfx-sw="${key}"]`);
    const labelFor=key=>{const src=srcFor(key),row=src&&(src.closest('[data-cfx-rel]')||src.closest('label,.cfx-row')),sp=row&&row.querySelector(':scope > span');return sp?sp.textContent.trim():key.replace(/^s_/,'')};
    const control=key=>{
      const src=design.querySelector(`[data-cfx="${key}"]`),sw=design.querySelector(`[data-cfx-sw="${key}"]`),label=esc(labelFor(key));
      if(sw)return `<div class="tune-row" data-tcs-row="${key}"><span>${label}</span><div class="tune-seg" data-tcs-sw="${key}"><button type="button" data-v="1">On</button><button type="button" data-v="0">Off</button></div></div>`;
      if(!src)return '';
      if(src.type==='color')return `<label class="tune-row" data-tcs-row="${key}"><span>${label}</span><input type="color" data-tcs="${key}"></label>`;
      if(src.tagName==='SELECT')return `<label class="tune-row" data-tcs-row="${key}"><span>${label}</span><select data-tcs="${key}">${[...src.options].map(o=>`<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('')}</select></label>`;
      return `<label class="tune-row" data-tcs-row="${key}"><span>${label}</span><input type="range" min="${src.min}" max="${src.max}" step="${src.step}" data-tcs="${key}"><b data-tcs-out></b></label>`;
    };
    pane.querySelector('[data-tcs-common]').innerHTML=COMMON.map(control).join('');
    pane.querySelector('[data-tcs-motion]').innerHTML=MOTION.map(control).join('');

    const setValue=(key,val)=>{studio.coreFxSet(key,val);sync()};
    const bindBox=root=>{
      root.querySelectorAll('[data-tcs]').forEach(el=>{
        const ev=el.tagName==='SELECT'?'change':'input';
        el.addEventListener(ev,()=>setValue(el.dataset.tcs,el.type==='range'?+el.value:el.value));
      });
      root.querySelectorAll('[data-tcs-sw]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setValue(g.dataset.tcsSw,+b.dataset.v))));
    };
    bindBox(pane);

    let currentSpecific='';
    const renderSpecific=style=>{
      const meta=STYLE[style]||STYLE.none;
      if(currentSpecific===style)return;
      currentSpecific=style;
      pane.querySelector('[data-tcs-specific-title]').textContent=meta.group;
      const box=pane.querySelector('[data-tcs-specific]');
      box.innerHTML=meta.keys.map(control).join('');
      bindBox(box);
    };

    const showSurface=()=>{
      originalTabs.forEach(b=>b.setAttribute('aria-selected','false'));
      tab.setAttribute('aria-selected','true');
      [...tune.querySelectorAll('[data-pane]')].forEach(p=>{p.hidden=p!==pane});
      sync();
    };
    tab.addEventListener('click',showSurface);
    originalTabs.forEach(b=>b.addEventListener('click',()=>{tab.setAttribute('aria-selected','false');pane.hidden=true}));
    pane.querySelectorAll('[data-tcs-style]').forEach(b=>b.addEventListener('click',()=>setValue('s_style',b.dataset.tcsStyle)));

    function sync(){
      const target=studio.coreFxTarget();
      if(!target||!target.tune)return;
      const v=target.tune,style=v.s_style||'none',meta=STYLE[style]||STYLE.none;
      renderSpecific(style);
      pane.querySelector('[data-tcs-title]').textContent=meta.title;
      pane.querySelector('[data-tcs-note]').textContent=style==='none'?'Original Cerebra material is active. Core material, structure and layer controls remain available.':`${meta.group}. Tune Core now edits this generated surface directly.`;
      pane.querySelectorAll('[data-tcs-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tcsStyle===style)));

      const originalHidden=style!=='none'&&+(v.s_hide??1)===1;
      tune.classList.toggle('is-surface-exclusive',originalHidden);
      if(originalHidden){const selected=originalTabs.find(b=>b.getAttribute('aria-selected')==='true');if(selected)showSurface()}
      originalTabs.forEach(b=>{
        b.disabled=originalHidden;
        b.setAttribute('aria-disabled',String(originalHidden));
        b.title=originalHidden?'Locked: this generated surface hides the Original surface. Turn off “Hide original surface” in Surface to unlock.':'';
      });

      const rel=studio.coreFxRelevant?studio.coreFxRelevant(target):{};
      const allKeys=[...COMMON,...MOTION,...meta.keys];
      allKeys.forEach(key=>{
        const row=pane.querySelector(`[data-tcs-row="${key}"]`);
        if(!row)return;
        const relevant=rel[key]!==false&&(COMMON.includes(key)||MOTION.includes(key)||meta.keys.includes(key));
        row.classList.toggle('tc-row-lock',!relevant);
        row.querySelectorAll('input,select,button').forEach(el=>{el.disabled=!relevant});
      });
      pane.querySelector('[data-tcs-group="common"]').hidden=style==='none';
      pane.querySelector('[data-tcs-group="motion"]').hidden=style==='none';
      pane.querySelector('[data-tcs-group="specific"]').hidden=style==='none'||!meta.keys.length;

      pane.querySelectorAll('[data-tcs]').forEach(el=>{
        const val=v[el.dataset.tcs];if(val==null)return;
        if(document.activeElement!==el)el.value=String(val);
        if(el.type==='range'){
          const out=el.parentNode.querySelector('[data-tcs-out]');if(out)out.textContent=+el.step>=1?String(Math.round(+val)):(+val).toFixed(2);
          const min=+el.min,max=+el.max;el.style.setProperty('--p',((+val-min)/(max-min)*100)+'%');
        }
      });
      pane.querySelectorAll('[data-tcs-sw]').forEach(g=>{const val=+(v[g.dataset.tcsSw]??0);g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===val)))});
    }

    pane.querySelector('[data-tcs-reset]').addEventListener('click',()=>{
      const target=studio.coreFxTarget(),style=target&&target.tune?target.tune.s_style:'none';
      new Set([...COMMON,...MOTION,...((STYLE[style]||STYLE.none).keys)]).forEach(key=>{if(DEFAULTS[key]!==undefined)studio.coreFxSet(key,DEFAULTS[key])});
      studio.coreFxSet('s_style',style);sync();
    });

    const baseSync=studio.syncCoreFx.bind(studio);
    studio.syncCoreFx=(...args)=>{const out=baseSync(...args);queueMicrotask(sync);return out};
    const baseSet=studio.coreFxSet.bind(studio);
    studio.coreFxSet=(...args)=>{const out=baseSet(...args);queueMicrotask(sync);return out};
    sync();
  }
  setTimeout(boot,0);
})();
