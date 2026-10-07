/* Meta Balls-inspired scalar-field union for a native editable Kit.
 * Reference: reactbits.dev/animations/meta-balls. The liquid silhouette is
 * rendered from a summed inverse-square field, not overlapping circle shapes.
 * Raster work is bounded to 160x160 and 12 blobs, cached at <=24fps per item. */
(() => {
  const cache=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
  const defaults={count:6,radius:.14,spread:.3,softness:.12,speed:1,c2:'#9b77ff',mstyle:'orbit'};
  const rgb=(color,fallback)=>{const valid=/^#[0-9a-f]{6}$/i.test(color)?color:fallback;return [1,3,5].map(i=>parseInt(valid.slice(i,i+2),16));};
  const kit={label:'Meta Balls',size:[.5,.5],defaults,noShuffle:true,anim:true,
    ui:[
      {k:'count',t:'range',label:'Ball count',min:2,max:12,step:1},
      {k:'radius',t:'range',label:'Ball size',min:.06,max:.22,step:.01,pct:1},
      {k:'spread',t:'range',label:'Ball separation',min:.08,max:.4,step:.01,pct:1},
      {k:'softness',t:'range',label:'Liquid edge softness',min:.02,max:.5,step:.02,pct:1},
      {k:'c2',t:'color',label:'Liquid accent colour'},
      {k:'speed',t:'range',label:'Liquid speed',min:0,max:3,step:.05},
    ],
    draw(g,it,x,y,w,h,k){
      const p={...defaults,...it.p},M=kitM(it),t=M.t*clamp(p.speed,0,3),quant=M.a?Math.floor(t*24)/24:0;
      const scale=Math.min(160/Math.max(w,h),1),W=Math.max(8,Math.round(w*scale)),H=Math.max(8,Math.round(h*scale));
      const key=JSON.stringify([p,it.fill,it.seed,W,H,quant,M.a]);let c=cache.get(it);
      if(!c||c.key!==key){
        if(!c){const cv=document.createElement('canvas'),ctx=cv.getContext('2d');if(!ctx)return;c={cv,ctx};cache.set(it,c);}
        c.cv.width=W;c.cv.height=H;c.key=key;
        const image=c.ctx.createImageData(W,H),pixels=image.data,n=Math.round(clamp(p.count,2,12)),r=clamp(p.radius,.06,.22),spread=clamp(p.spread,.08,.4);
        const min=Math.min(W,H),seed=(it.seed||913)%997,balls=[];
        for(let i=0;i<n;i++){const a=i/n*Math.PI*2+seed*.01,phase=a+quant*.4*M.a,breathe=p.mstyle==='breathe'?1+Math.sin(quant*1.3)*M.a*.35:1;
          balls.push({x:W/2+Math.cos(phase)*min*spread*breathe*(.65+.35*Math.sin(i*2.7+quant*.3*M.a)),y:H/2+Math.sin(phase)*min*spread*breathe,r2:(min*r*(.78+.22*Math.sin(i*1.9+2)))**2});}
        const A=rgb(it.fill,'#edf1ff'),B=rgb(p.c2,'#9b77ff'),soft=clamp(p.softness,.02,.5);
        for(let py=0;py<H;py++)for(let px=0;px<W;px++){
          let field=0;for(const b of balls){const dx=px-b.x,dy=py-b.y;field+=b.r2/Math.max(.5,dx*dx+dy*dy);}
          const alpha=clamp((field-1)/soft+.5,0,1),o=(py*W+px)*4,mix=clamp(py/H*.8+px/W*.2,0,1);
          for(let channel=0;channel<3;channel++)pixels[o+channel]=Math.round(A[channel]*(1-mix)+B[channel]*mix);pixels[o+3]=Math.round(alpha*255);
        }
        c.ctx.putImageData(image,0,0);
      }
      g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(c.cv,x,y,w,h);g.restore();
    }
  };
  window.CerebraMetaBalls={kit};
})();
