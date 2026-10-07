/* Presentation-only Canvas2D adaptations. React Bits references:
 * reactbits.dev/backgrounds/liquid-ether and /backgrounds/light-pillar.
 * Bounded raster sampling replaces a GPU fluid simulation; background state
 * never touches the Studio project. Hidden pages are stopped by the caller. */
(() => {
  const cache=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
  function draw(g,w,h,dpr,t,p){
    if(p.kind==='off')return;
    const color1=/^#[0-9a-f]{6}$/i.test(p.color1)?p.color1:'#5227ff';
    const color2=/^#[0-9a-f]{6}$/i.test(p.color2)?p.color2:'#ff9ffc';
    const color3=/^#[0-9a-f]{6}$/i.test(p.color3)?p.color3:'#b497cf';
    g.save();g.globalAlpha=clamp(+p.intensity||0,0,1);
    if(p.kind==='lightPillar'){
      g.translate(w*.77,h*.3);g.rotate((+p.rotation||0)*Math.PI/180);
      const width=Math.min(w,h)*clamp(+p.width,.1,.8),height=h*1.5;
      for(let i=0;i<14;i++){const x=(i/13-.5)*width,noise=Math.sin(i*2+t*+p.speed)*width*.08;
        const gradient=g.createLinearGradient(0,-height/2,0,height/2);gradient.addColorStop(0,color1+'00');gradient.addColorStop(.3,color1);gradient.addColorStop(.65,color2);gradient.addColorStop(1,color2+'00');g.strokeStyle=gradient;g.lineWidth=width/12;g.shadowColor=color2;g.shadowBlur=18*dpr;g.beginPath();g.moveTo(x,-height/2);g.bezierCurveTo(x+noise,-height*.2,x-noise,height*.2,x,height/2);g.stroke();
      }
    }else{
      let c=cache.get(g);if(!c){const canvas=document.createElement('canvas');c={canvas,ctx:canvas.getContext('2d')};cache.set(g,c);}if(!c.ctx){g.restore();return;}
      const W=96,H=Math.max(8,Math.min(160,Math.round(96*h/w))),stamp=JSON.stringify([Math.floor(t*+p.speed*15),W,H,color1,color2,color3,p.viscosity]);
      if(c.stamp!==stamp){c.stamp=stamp;c.canvas.width=W;c.canvas.height=H;const image=c.ctx.createImageData(W,H),A=rgb(color1),B=rgb(color2),D=rgb(color3),clock=t*+p.speed;
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=x/W,v=y/H,warp=Math.sin(u*7+clock*.6)+Math.cos(v*6-clock*.5),f=.5+.5*Math.sin(warp*2.2/(1+ +p.viscosity/80)+u*7+v*5),a=f<.5?A:B,b=f<.5?B:D,m=f<.5?f*2:(f-.5)*2,o=(y*W+x)*4;for(let k=0;k<3;k++)image.data[o+k]=Math.round(a[k]*(1-m)+b[k]*m);image.data[o+3]=255;}c.ctx.putImageData(image,0,0);
      }
      g.imageSmoothingEnabled=true;g.drawImage(c.canvas,0,0,w,h);
    }g.restore();
  }
  window.CerebraPageBackdrop={draw};
})();
