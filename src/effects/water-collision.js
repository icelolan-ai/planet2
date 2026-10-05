/* Water is a screen-space fluid. These solid boundaries are rasterized from
   Studio's 3D geometry on its existing renderer; coatings use mesh UVs, so they
   follow the object rather than remaining painted on the screen. */
(() => {
  window.CerebraWaterCollision = function(T, app, studio, renderer) {
    const scene=new T.Scene(), coating=new T.Group(), ray=new T.Raycaster(), mouse=new T.Vector2();
    coating.name='Water surface stains';app.stage.scene.add(coating);
    const maskMat=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,toneMapped:false});
    let target=null, pairs=[], source=null, signature='', sphere=null, stampTime=0, cursor=0, revision=0, loadToken=0, maskSignature='';
    const records=new Map(), box=new T.Box3(), point=new T.Vector3();
    const record=id=>{if(records.has(id))return records.get(id);const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
      const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.FrontSide,toneMapped:false});
      const r={canvas,texture,material,hasInk:false,age:0};records.set(id,r);return r};
    const dropPairs=()=>{for(const p of pairs){scene.remove(p.mask);coating.remove(p.coat)}pairs=[]};
    const sync=()=>{
      const w=studio.coreFxTarget(),t=w?.tune||{},generated=!!t.s_enabled&&(t.s_style||'none')!=='none';
      const key=[studio.subject,generated,t.s_shape,t.s_shapeAmt,t.s_shapeAspect,t.s_shapeHole].join('|');
      const model=studio.subject>=0&&!generated?w?.model:null;
      if(source!==model||signature!==key){dropPairs();sphere?.dispose();sphere=null;source=model;signature=key;
        const add=(geometry,original,id)=>{const r=record(id),mask=new T.Mesh(geometry,maskMat),coat=new T.Mesh(geometry,r.material);mask.matrixAutoUpdate=coat.matrixAutoUpdate=false;mask.frustumCulled=coat.frustumCulled=false;coat.renderOrder=900;scene.add(mask);coating.add(coat);pairs.push({mask,coat,original,r,id})};
        if(model){let index=0;model.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position)add(o.geometry,o,`${studio.subject}:${index++}`)})}
        else if(w){sphere=new T.SphereGeometry(studio.subject<0&&!generated?1.55:w.def.radius,48,32);
          const warp=typeof SURFACE!=='undefined'&&SURFACE.baseShapeWarp?SURFACE.baseShapeWarp(t,studio.subject<0&&!generated?1.55:w.def.radius):null;
          if(warp){const a=sphere.attributes.position;for(let i=0;i<a.count;i++){const v=warp(a.getX(i),a.getY(i),a.getZ(i));a.setXYZ(i,v.x,v.y,v.z)}sphere.computeVertexNormals();sphere.computeBoundingSphere()}
          add(sphere,studio.subject<0&&!generated?app.core.orient:generated?w.surf.g:w.spinG,`${studio.subject}:base`)}
      }
      let available=studio.showSubject&&pairs.length>0;
      for(const p of pairs){p.original.updateWorldMatrix(true,false);p.mask.matrix.copy(p.original.matrixWorld);p.coat.matrix.copy(p.original.matrixWorld);let visible=true;for(let o=p.original;o;o=o.parent)if(!o.visible)visible=false;
        // Original Core uses a solid proxy even when individual layers are off.
        p.mask.visible=available&&(sphere?true:visible);p.coat.visible=p.mask.visible&&!!p.coat.geometry.attributes.uv;p.mask.updateMatrixWorld(true);p.coat.updateMatrixWorld(true)}
      return available;
    };
    const update=(state,engine,dt)=>{
      const active=studio.active&&state.on;coating.visible=active;
      if(!active){engine.setCollisionMap(null);return}
      const available=sync();
      coating.visible=available&&state.collisionStain>0;
      for(const r of records.values())r.material.opacity=state.collisionStain??.5;
      if(!state.collision||!available){engine.setCollisionMap(null);return}
      const dims=engine.solver.velocity.a; if(!target||target.width!==dims.w||target.height!==dims.h){target?.dispose();target=new T.WebGLRenderTarget(dims.w,dims.h,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true});target.texture.colorSpace=T.NoColorSpace}
      const previous=renderer.getRenderTarget(),auto=renderer.autoClear,color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
      const key=[signature,target.width,target.height,...app.rig.camera.projectionMatrix.elements,...app.rig.camera.matrixWorldInverse.elements,...pairs.flatMap(p=>[p.mask.visible,...p.mask.matrix.elements])].join(',');
      if(key!==maskSignature){renderer.setClearColor(0,0);renderer.autoClear=true;renderer.setRenderTarget(target);renderer.render(scene,app.rig.camera);renderer.setRenderTarget(previous);renderer.autoClear=auto;renderer.setClearColor(color,alpha);maskSignature=key}engine.setCollisionMap(target.texture);
      // Fade is time based; a zero lifetime means permanent. No GPU readback
      // for idle/frozen work; at most one small dye sample every 200ms.
      if(!state.paused&&!studio.frozen){if(state.stainLifetime>0){const fade=1-Math.exp(-dt*4/state.stainLifetime);for(const {r} of pairs){if(!r.hasInk)continue;r.age+=dt;const c=r.canvas.getContext('2d');c.globalCompositeOperation='destination-out';c.fillStyle=`rgba(0,0,0,${fade})`;c.fillRect(0,0,256,256);c.globalCompositeOperation='source-over';r.texture.needsUpdate=true;if(r.age>state.stainLifetime*3){c.clearRect(0,0,256,256);r.hasInk=false}}revision++}
        stampTime+=dt;if(stampTime>=.2&&state.collisionStick&&state.collisionStain){stampTime=0;const data=engine.solver.sampleImpact();box.makeEmpty();for(const p of pairs)if(p.mask.visible)box.expandByObject(p.mask);
          const lo=new T.Vector2(1,1),hi=new T.Vector2(-1,-1);for(let i=0;i<8;i++){point.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).project(app.rig.camera);lo.min(new T.Vector2(point.x,point.y));hi.max(new T.Vector2(point.x,point.y))}
          for(let i=0;i<8;i++){const n=cursor++%64,x=(lo.x+(hi.x-lo.x)*(n%8+.5)/8)*.5+.5,y=(lo.y+(hi.y-lo.y)*(Math.floor(n/8)+.5)/8)*.5+.5;if(x<0||x>1||y<0||y>1)continue;
            const px=Math.min(127,Math.max(0,Math.round(x*127))),py=Math.min(127,Math.max(0,Math.round(y*127))),j=(py*128+px)*4,color=[data[j],data[j+1],data[j+2]];if(Math.max(...color)>12)hit(x,y,color,.004,state)}
        }
      }
    };
    const hit=(x,y,color,radius,state)=>{
      if(!state.collision||!state.collisionStick||!state.collisionStain||!sync())return null;
      mouse.set(x*2-1,y*2-1);ray.setFromCamera(mouse,app.rig.camera);const hits=ray.intersectObjects(pairs.filter(p=>p.mask.visible).map(p=>p.mask),false);const h=hits[0];if(!h?.uv)return null;
      const p=pairs.find(p=>p.mask===h.object),c=p.r.canvas.getContext('2d'),u=h.uv.x*256,v=(1-h.uv.y)*256,size=Math.max(2,Math.min(48,Math.sqrt(radius)*256*(.3+state.stainSpread)));
      c.globalAlpha=state.collisionStick;c.fillStyle=`rgb(${color.map(Math.round).join(',')})`;for(const offset of [-256,0,256]){const g=c.createRadialGradient(u+offset,v,0,u+offset,v,size);g.addColorStop(0,c.fillStyle);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(u+offset-size,v-size,size*2,size*2);c.fillStyle=`rgb(${color.map(Math.round).join(',')})`}c.globalAlpha=1;p.r.hasInk=true;p.r.age=0;p.r.texture.needsUpdate=true;revision++;
      return h;
    };
    return {update,hit,hide(){coating.visible=false},get pairs(){return pairs},get target(){return target},get revision(){return revision},snapshot:()=>Object.fromEntries([...records].filter(([,r])=>r.hasInk).map(([id,r])=>[id,r.canvas.toDataURL()])),
      clear(){loadToken++;for(const r of records.values()){r.canvas.getContext('2d').clearRect(0,0,256,256);r.hasInk=false;r.age=0;r.texture.needsUpdate=true}revision++},
      load(images){this.clear();const token=loadToken;if(!images||typeof images!=='object')return;for(const [id,url]of Object.entries(images).slice(0,100)){if(typeof url!=='string'||!url.startsWith('data:image/png;base64,')||url.length>500000)continue;const image=new Image();image.onload=()=>{if(token!==loadToken)return;const r=record(id);r.canvas.getContext('2d').drawImage(image,0,0,256,256);r.hasInk=true;r.age=0;r.texture.needsUpdate=true;revision++};image.src=url}}
    };
  };
})();
