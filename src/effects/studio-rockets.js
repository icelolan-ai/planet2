/* Native Studio layer adapter for Rocket's real CAD GLBs. Shared renderer, native Kit history/compositor. */
(() => {
  if (window.CerebraRockets) return;
  const T = window.KY, source = window.CerebraRocketModel;
  const names = { f9: 'Falcon 9', fh: 'Falcon Heavy', sv: 'Saturn V' }, states = new WeakMap();
  let manifestPromise;
  const manifest = () => manifestPromise ||= source.Manifest.load(window.__ASSETS.rockets.manifest).catch(e => { manifestPromise = null; throw e; });
  const range = (k,label,min,max,step=1) => ({k,label,t:'range',min,max,step});
  const kit = {
    label: 'Rocket', noShuffle: true, size: [.35,.65],
    defaults: { model:'f9', explode:0, pitch:0, yaw:25, roll:0, zoom:1, painted:false, colour:'#ffffff', finished:false, roughness:.5, metalness:.1, texture:true },
    ui: [range('explode','Exploded view / แยกชิ้นส่วน',0,1,.01),range('pitch','Pitch / หมุนแกน X',-180,180),range('yaw','Yaw / หมุนแกน Y',-180,180),range('roll','Roll / หมุนแกน Z',-180,180),range('zoom','Zoom / ขนาดโมเดล',.25,2,.05),
      {k:'painted',t:'check',label:'Custom paint / ปรับสี'}, {k:'colour',t:'color',label:'Paint colour / สีจรวด',when:['painted',true]},
      {k:'finished',t:'check',label:'Custom finish / ปรับวัสดุ'}, {...range('roughness','Roughness / ความด้าน',0,1,.05),when:['finished',true]},{...range('metalness','Metalness / ความเป็นโลหะ',0,1,.05),when:['finished',true]},{k:'texture',t:'check',label:'Original textures / ลวดลายเดิม'}],
    draw(g,it,x,y,w,h) {
      if (!it.el) return; // no model requests for catalogue thumbnails
      let s=states.get(it);
      if (!s) {
        s={disposed:false,loading:true};states.set(it,s);
        s.loadPromise=Promise.all([manifest(), Promise.resolve(window.__ASSETS.rockets[it.p.model])]).then(async ([m,url]) => {
          const model=await source.loadModel(url,m,it.p.model);
          if(s.disposed){model.dispose();return;}
          s.model=model;s.loading=false;s.originalMats=model.meshes.map(m=>m._baseMat);s.variantRequested='';
          s.scene=new T.Scene();s.pivot=new T.Group();s.scene.add(s.pivot);s.pivot.add(model.root);
          const box=new T.Box3().setFromObject(model.root), center=box.getCenter(new T.Vector3());
          s.height=box.getSize(new T.Vector3()).length();s.center=center;
          s.camera=new T.PerspectiveCamera(35,1,.01,10000);
          s.scene.add(new T.HemisphereLight(0xffffff,0x667088,3));
          for(const [pos,intensity] of [[[3,4,5],4],[[-4,2,-3],3]]){const l=new T.DirectionalLight(0xffffff,intensity);l.position.set(...pos);s.scene.add(l);}
          const studio=window.__cerebra?.studio;studio?.kitRedraw(it);
          if(studio?.sel===it&&!studio.el.querySelector('[data-kit-panel]').hidden)studio.syncKit();
        }).catch(e=>{if(!s.disposed){s.loading=false;s.error=e.message;window.__cerebra?.studio?.kitRedraw(it);}});
      }
      if (!s.model) {g.fillStyle='#e8ecf5';g.font='14px sans-serif';g.textAlign='center';g.fillText(s.error?'Rocket failed to load / โหลดไม่สำเร็จ':'Loading Rocket… / กำลังโหลด',x+w/2,y+h/2);return;}
      const p=it.p,m=s.model;
      // Rocket's instanced ownership math runs in the untouched CAD world frame.
      // Centre/rotate only for rendering, and restore that frame before every explode.
      s.pivot.rotation.set(0,0,0);m.root.position.set(0,0,0);s.pivot.updateMatrixWorld(true);
      m.setExplode(p.explode);m.root.position.copy(s.center).multiplyScalar(-1);
      const desired=p.variant||'';
      if(s.variantRequested!==desired){
        s.variantRequested=desired;
        s.variantTask=(s.variantTask||Promise.resolve()).then(async()=>{
          if(s.disposed)return;
          if(desired)await m.setVariant(desired);
          else {m.meshes.forEach((mesh,i)=>mesh._baseMat=s.originalMats[i]);m.refreshMaterials();}
          if(s.disposed){m.dispose();return;}
          s.paintKey=null;if(!s.disposed)window.__cerebra.studio.kitRedraw(it);
        }).catch(e=>{s.error=e.message;});
      }
      const paintKey=JSON.stringify([p.painted,p.colour,p.finished,p.roughness,p.metalness,p.texture,p.partPaint]);
      if(s.paintKey!==paintKey){
        m.resetPaint();
        // One refresh per update; avoid paintAll's per-part refresh on large CAD assemblies.
        for(const mesh of m.meshes)if(m.isPaintable(mesh)){
          if(p.painted)m.paint.parts[mesh._pid]=p.colour;
          if(p.finished)m.paint.fin[mesh._pid]={r:p.roughness,m:p.metalness};
          if(!p.texture)m.paint.noTex[mesh._pid]=true;
        }
        Object.assign(m.paint.parts,p.partPaint||{});m.refreshMaterials();s.paintKey=paintKey;
      }
      m.showAll();for(const id of p.hiddenParts||[])m.setHidden(id,true);
      s.pivot.rotation.set(p.pitch*Math.PI/180,p.yaw*Math.PI/180,p.roll*Math.PI/180);
      const cap=KIT_PREVIEW?768:2048,scale=Math.min(1,cap/Math.max(w,h)),W=Math.max(1,Math.round(w*scale)),H=Math.max(1,Math.round(h*scale));
      if(!s.target||s.target.width!==W||s.target.height!==H){s.target?.dispose();s.target=new T.WebGLRenderTarget(W,H);s.target.texture.colorSpace=T.SRGBColorSpace;s.canvas=document.createElement('canvas');s.canvas.width=W;s.canvas.height=H;s.ctx=s.canvas.getContext('2d');s.image=s.ctx.createImageData(W,H);s.bytes=new Uint8Array(W*H*4);}
      s.camera.aspect=W/H;s.camera.position.set(0,0,s.height*1.25/Math.min(1,W/H)/Math.max(.25,p.zoom));s.camera.lookAt(0,0,0);s.camera.updateProjectionMatrix();
      const r=window.__cerebra.stage.renderer,target=r.getRenderTarget(),vp=r.getViewport(new T.Vector4()),sc=r.getScissor(new T.Vector4()),test=r.getScissorTest(),auto=r.autoClear,col=r.getClearColor(new T.Color()),alpha=r.getClearAlpha(),tone=r.toneMapping,exposure=r.toneMappingExposure;
      try{
        r.autoClear=true;r.setRenderTarget(s.target);r.setViewport(0,0,W,H);r.setScissorTest(false);r.setClearColor(0,0);r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1;
        r.render(s.scene,s.camera);r.readRenderTargetPixels(s.target,0,0,W,H,s.bytes);
        for(let row=0;row<H;row++)s.image.data.set(s.bytes.subarray(row*W*4,(row+1)*W*4),(H-1-row)*W*4);
        s.ctx.putImageData(s.image,0,0);g.drawImage(s.canvas,x,y,w,h);
      }finally{r.setRenderTarget(target);r.setViewport(vp);r.setScissor(sc);r.setScissorTest(test);r.autoClear=auto;r.setClearColor(col,alpha);r.toneMapping=tone;r.toneMappingExposure=exposure;}
    },
    async ready(it){if(!states.has(it))window.__cerebra.studio.kitRedraw(it);const s=states.get(it);await s?.loadPromise;await s?.variantTask;if(s?.error)throw Error('Rocket: '+s.error);},
    dispose(it){const s=states.get(it);if(!s)return;s.disposed=true;s.model?.dispose();s.target?.dispose();states.delete(it);}
  };
  function decorate(studio,panel,it){
    if(it.kit!=='rocket')return;const s=states.get(it);if(!s?.model)return;
    const m=s.model,section=document.createElement('details');section.className='st-ksec';
    const title=document.createElement('summary');title.textContent='Parts & variants / ชิ้นส่วนและรูปแบบ';section.append(title);
    function row(label,input){const r=document.createElement('label');r.className='st-fly-row';const span=document.createElement('span');span.textContent=label;r.append(span,input);section.append(r);return input;}
    const parts=row('Part / ชิ้นส่วน',document.createElement('select'));parts.dataset.rocketPart='';
    for(const id of m.partIds()){const o=document.createElement('option');o.value=id;const d=m.manifest.get(id);o.textContent=`${id} · ${d?.name_en||d?.name_th||id}`;parts.append(o);}
    parts.value=it.p.selectedPart||parts.options[0]?.value||'';
    const colour=row('Part colour / สีชิ้นนี้',document.createElement('input'));colour.type='color';colour.dataset.rocketPartColour='';
    const hidden=row('Hide part / ซ่อนชิ้นนี้',document.createElement('input'));hidden.type='checkbox';hidden.dataset.rocketPartHidden='';
    const reset=document.createElement('button');reset.type='button';reset.className='st-btn';reset.textContent='Restore part paint / คืนสีชิ้นนี้';section.append(reset);
    const sync=()=>{const id=parts.value,paintable=m.meshesOf(id).some(x=>m.isPaintable(x));colour.closest('label').hidden=!paintable;reset.hidden=!paintable;colour.value=it.p.partPaint?.[id]||'#ffffff';hidden.checked=(it.p.hiddenParts||[]).includes(id);};sync();
    parts.onchange=()=>{it.p.selectedPart=parts.value;sync();studio.commit();};
    const paint=()=>{it.p.partPaint={...it.p.partPaint,[parts.value]:colour.value};studio.kitRedraw(it);};colour.oninput=paint;colour.onchange=()=>{paint();studio.commit();};
    hidden.onchange=()=>{const ids=new Set(it.p.hiddenParts||[]);hidden.checked?ids.add(parts.value):ids.delete(parts.value);it.p.hiddenParts=[...ids];studio.kitRedraw(it);studio.commit();};
    reset.onclick=()=>{it.p.partPaint={...it.p.partPaint};delete it.p.partPaint[parts.value];sync();studio.kitRedraw(it);studio.commit();};
    if(m.variantNames.length){const variants=row('Variant / รูปแบบ',document.createElement('select'));variants.dataset.rocketVariant='';for(const [value,label]of [['','Original / ต้นฉบับ'],...m.variantNames.map(v=>[v,v])]){const o=document.createElement('option');o.value=value;o.textContent=label;variants.append(o);}variants.value=it.p.variant||'';variants.onchange=()=>{it.p.variant=variants.value;studio.kitRedraw(it);studio.commit();};}
    panel.querySelector('[data-kit-reset]').before(section);
  }
  function openMenu(studio,anchor){
    const old=studio.el.querySelector('.st-planetmenu');old?.remove();
    const pop=document.createElement('div');pop.className='st-lmenu st-glass st-planetmenu';pop.setAttribute('role','menu');
    pop.innerHTML='<p class="st-pm-n">Rocket / จรวด</p>'+Object.entries(names).map(([key,name])=>`<button type="button" role="menuitem" class="st-lm-i" data-rocket="${key}"><span>${name}</span></button>`).join('');studio.el.append(pop);
    const rect=anchor.getBoundingClientRect();pop.style.width='240px';pop.style.left=Math.max(8,Math.min(rect.left,innerWidth-248))+'px';pop.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-pop.offsetHeight-8))+'px';
    const close=()=>{pop.remove();document.removeEventListener('pointerdown',away,true);},away=e=>{if(!pop.contains(e.target)&&e.target!==anchor)close();};document.addEventListener('pointerdown',away,true);
    pop.querySelectorAll('[data-rocket]').forEach(b=>b.onclick=()=>{close();studio.closeFly();const it=studio.addItem('kit',{kit:'rocket',name:names[b.dataset.rocket],p:{...kit.defaults,model:b.dataset.rocket},opacity:1});studio.select(it);studio.syncEmptyHint();});
  }
  window.CerebraRockets={kit,openMenu,decorate,inspect:it=>{const s=states.get(it);return s?{loading:s.loading,error:s.error,meshes:s.model?.meshes.length,exploded:s.model?.t,canvas:s.canvas,instances:s.model?.inst.map(i=>Array.from(i.mesh.instanceMatrix.array))}:null;}};
})();
