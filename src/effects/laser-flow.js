/* Laser Flow-inspired beam + falling wisps, adapted to the native Canvas2D Kit
 * pipeline. Reference: reactbits.dev/animations/laser-flow. No copied shader,
 * new renderer, or new storage schema. Kits own selection, history and export. */
(() => {
  if(window.CerebraLaser)return;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
  const defaults={beamX:.5,beamY:.32,length:.85,height:.9,width:1.8,glow:.75,fog:.3,density:36,wispIntensity:.6,wispSpeed:1,flow:1,c2:'#a488ff',mstyle:'flow'};
  function draw(g,it,x,y,w,h,k,time=0,amount=0) {
    const p={...defaults,...it.p},cx=x+w*clamp(p.beamX,.08,.92),cy=y+h*clamp(p.beamY,.08,.75);
    const color=/^#[0-9a-f]{6}$/i.test(p.c2)?p.c2:defaults.c2,ink=it.fill||'#f5eaff';
    const length=clamp(p.length,.2,1)*w*.5,lw=clamp(p.width,.4,8)*k,glow=clamp(p.glow,0,1),fog=clamp(p.fog,0,1);
    const t=time*clamp(p.flow,0,3),wt=time*clamp(p.wispSpeed,0,3)*amount;
    const pulse=p.mstyle==='pulse'?1-amount*.3+amount*.3*Math.sin(t*2.5):1;
    const height=Math.max(1,(y+h-cy-h*.06)*clamp(p.height,.2,1));
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.globalAlpha*=Math.max(.25,pulse);
    if(fog>0){const mist=g.createRadialGradient(cx,cy+height*.35,0,cx,cy+height*.35,Math.max(w,h)*.5);mist.addColorStop(0,color+Math.round(fog*70).toString(16).padStart(2,'0'));mist.addColorStop(1,color+'00');g.fillStyle=mist;g.fillRect(x,y,w,h);}
    const path=()=>{g.beginPath();g.moveTo(cx-length,cy);g.lineTo(cx+length,cy);g.moveTo(cx,cy);g.bezierCurveTo(cx+Math.sin(t*.7)*amount*w*.01,cy+height*.25,cx,cy+height*.6,cx,cy+height);};
    // Three bounded strokes replace the reference's volumetric shader passes.
    if(glow>0){g.strokeStyle=color;g.lineCap='round';g.shadowColor=color;g.shadowBlur=clamp(Math.min(w,h)*.05*glow,0,40*k);g.lineWidth=lw*(3+glow*5);g.globalAlpha*=.3;path();g.stroke();g.globalAlpha/=.3;}
    g.shadowBlur=0;const beam=g.createLinearGradient(cx-length,cy,cx+length,cy);beam.addColorStop(0,color+'00');beam.addColorStop(.25,color);beam.addColorStop(.5,ink);beam.addColorStop(.75,color);beam.addColorStop(1,color+'00');g.strokeStyle=beam;g.lineWidth=lw;path();g.stroke();
    const vertical=g.createLinearGradient(cx,cy,cx,cy+height);vertical.addColorStop(0,ink);vertical.addColorStop(.2,color);vertical.addColorStop(1,color+'00');g.strokeStyle=vertical;g.lineWidth=lw*.7;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,cy+height);g.stroke();
    const n=Math.round(clamp(p.density,0,96)),seed=(it.seed||913)%997;
    for(let i=0;i<n;i++){
      const hash=Math.abs(Math.sin(i*127.1+seed*3.7)*43758.5453)%1,phase=((hash+wt*.13)%1+1)%1;
      const py=cy+phase*height,spread=w*.1*(1-phase)**2,px=cx+Math.sin(i*2.4+wt*.3)*spread*(.3+hash),len=(.02+hash*.07)*height;
      g.save();g.globalAlpha*=(.3+hash*.5)*clamp(p.wispIntensity,0,1);g.strokeStyle=color;g.lineWidth=Math.max(.5*k,lw*.35);g.beginPath();g.moveTo(px,py);g.quadraticCurveTo(px+Math.sin(i)*spread*.25,py+len*.5,px,Math.min(cy+height,py+len));g.stroke();g.restore();
    }
    const flare=g.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*(.035+.07*glow));flare.addColorStop(0,'#ffffff');flare.addColorStop(.15,ink);flare.addColorStop(.4,color+'aa');flare.addColorStop(1,color+'00');g.fillStyle=flare;const fr=Math.min(w,h)*(.035+.07*glow);g.fillRect(cx-fr,cy-fr,fr*2,fr*2);g.restore();
  }
  const kit={label:'Laser Flow',size:[.65,.5],noShuffle:true,anim:true,motionOnAdd:true,defaults,
    ui:[
      {k:'c2',t:'color',label:'Laser colour'},
      {k:'beamX',t:'range',label:'Beam horizontal position',min:.08,max:.92,step:.01,pct:1},
      {k:'beamY',t:'range',label:'Beam vertical position',min:.08,max:.75,step:.01,pct:1},
      {k:'length',t:'range',label:'Beam length',min:.2,max:1,step:.01,pct:1},
      {k:'height',t:'range',label:'Beam height',min:.2,max:1,step:.01,pct:1},
      {k:'width',t:'range',label:'Beam width',min:.4,max:8,step:.1,unit:'px'},
      {k:'glow',t:'range',label:'Laser glow',min:0,max:1,step:.05,pct:1},
      {k:'fog',t:'range',label:'Laser haze',min:0,max:1,step:.05,pct:1},
      {k:'density',t:'range',label:'Laser wisps',min:0,max:96,step:1},
      {k:'wispIntensity',t:'range',label:'Wisp brightness',min:0,max:1,step:.05,pct:1},
      {k:'wispSpeed',t:'range',label:'Wisp speed',min:0,max:3,step:.05},
      {k:'flow',t:'range',label:'Flow speed',min:0,max:3,step:.05},
    ],
    draw(g,it,x,y,w,h,k){const M=kitM(it);draw(g,it,x,y,w,h,k,M.t,M.a);}
  };
  window.CerebraLaser={draw,kit};
})();
