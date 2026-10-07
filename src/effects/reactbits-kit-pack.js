/* Native, bounded Canvas2D adaptations of React Bits background concepts.
 * Each recipe exposes meaningful Customize parameters through the existing
 * Kit inspector. Same draw() path serves thumbnails, canvas, poster and video.
 * GPU-only fluid solvers/material lighting are intentionally not reproduced. */
(() => {
  const C=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a)),TAU=Math.PI*2;
  const range=(k,label,min,max,step=.05)=>({k,t:'range',label,min,max,step});
  const color=(k,label)=>({k,t:'color',label});
  const select=(k,label,values)=>({k,t:'select',label,opts:values.map(v=>Array.isArray(v)?v:[v,v])});
  const cache=new WeakMap();
  const defs={
    aeroShards:{label:'Aero Shards',defaults:{color1:'#896abd',color2:'#e2d6ff',placement:'full',material:'pearl',flow:'stream',scale:1,spread:1,depth:1,speed:1,spin:1,density:1,shardSize:1,stretch:1,turbulence:1,glow:.5},ui:[color('color1','Shard colour'),color('color2','Accent colour'),select('placement','Placement',['full','left','right','center']),select('material','Material',['pearl','chrome','satin']),select('flow','Flow',['stream','vortex','ribbon']),range('scale','Scale',.5,2.5),range('spread','Spread',.15,1.1),range('depth','Depth',0,1.25),range('speed','Flow speed',0,2),range('spin','Shard spin',0,2),range('density','Density',.5,1.5),range('shardSize','Shard size',.5,1.5),range('stretch','Stretch',.6,1.8),range('turbulence','Turbulence',0,2),range('glow','Glow',0,2)]},
    lightfall:{label:'Lightfall',defaults:{color1:'#a6c8ff',color2:'#ff9ffc',color3:'#5227ff',speed:.5,streakCount:2,streakWidth:1,streakLength:1,glow:1,density:.6,twinkle:1,zoom:3,backgroundGlow:.5},ui:[color('color1','Light colour 1'),color('color2','Light colour 2'),color('color3','Light colour 3'),range('speed','Fall speed',0,4,.1),range('streakCount','Streak count',1,16,1),range('streakWidth','Streak width',.2,4,.1),range('streakLength','Streak length',.3,3,.1),range('density','Density',.3,3,.1),range('twinkle','Twinkle',0,1),range('glow','Glow',.2,3,.1),range('backgroundGlow','Background glow',0,3,.1),range('zoom','Zoom',1,5,.1)]},
    lightPillar:{label:'Light Pillar',defaults:{color1:'#5227ff',color2:'#ff9ffc',intensity:1,rotationSpeed:.3,glowAmount:.008,pillarWidth:3,pillarHeight:.8,noiseIntensity:.5,pillarRotation:25},ui:[color('color1','Top colour'),color('color2','Bottom colour'),range('intensity','Intensity',.1,3,.1),range('rotationSpeed','Rotation speed',0,2,.1),range('glowAmount','Glow amount',.001,.02,.001),range('pillarWidth','Pillar width',1,10,.1),range('pillarHeight','Pillar height',.1,2,.1),range('noiseIntensity','Noise intensity',0,2,.1),range('pillarRotation','Pillar rotation',0,360,1)]},
    softAurora:{label:'Soft Aurora',defaults:{color1:'#f7f7f7',color2:'#e100ff',speed:.6,scale:1.5,brightness:1,noiseFrequency:2.5,noiseAmplitude:1,bandHeight:.5,bandSpread:1,octaveDecay:.1,layerOffset:0,colorSpeed:1},ui:[color('color1','Aurora colour 1'),color('color2','Aurora colour 2'),range('speed','Aurora speed',.1,5,.1),range('scale','Scale',.1,3,.1),range('brightness','Brightness',.1,3,.1),range('noiseFrequency','Noise frequency',.5,10,.5),range('noiseAmplitude','Noise amplitude',.5,10,.5),range('bandHeight','Band height',0,1),range('bandSpread','Band spread',.1,3,.1),range('octaveDecay','Octave decay',.01,.5,.01),range('layerOffset','Layer offset',0,1),range('colorSpeed','Colour speed',.1,5,.1)]},
    galaxy:{label:'Galaxy',defaults:{color1:'#d9ddff',color2:'#8a69ff',density:1,glowIntensity:.3,saturation:.6,hueShift:140,twinkleIntensity:.3,rotationSpeed:.1,starSpeed:.5,speed:1,focalX:.5,focalY:.5},ui:[color('color1','Star colour'),color('color2','Nebula colour'),range('density','Density',.1,3,.1),range('glowIntensity','Glow intensity',0,1,.1),range('saturation','Saturation',0,1,.1),range('hueShift','Hue shift',0,360,10),range('twinkleIntensity','Twinkle intensity',0,1,.1),range('rotationSpeed','Rotation speed',0,.5),range('starSpeed','Star speed',.1,2,.1),range('speed','Animation speed',.1,3,.1),range('focalX','Focal horizontal',0,1,.01),range('focalY','Focal vertical',0,1,.01)]},
    threads:{label:'Threads',defaults:{color1:'#f4dfff',amplitude:1,distance:.3,count:40,speed:.6,width:.7},ui:[color('color1','Thread colour'),range('amplitude','Amplitude',0,5,.1),range('distance','Distance',0,2,.1),range('count','Thread count',8,80,1),range('speed','Flow speed',0,3,.1),range('width','Line width',.3,3,.1)]},
    waves:{label:'Waves',defaults:{color1:'#a9caff',waveSpeedX:.0125,waveSpeedY:.005,waveAmpX:32,waveAmpY:16,xGap:20,yGap:16,tension:.005,friction:.9},ui:[color('color1','Wave colour'),range('waveSpeedX','Wave speed X',0,.1,.0025),range('waveSpeedY','Wave speed Y',0,.1,.0025),range('waveAmpX','Wave amplitude X',0,80,1),range('waveAmpY','Wave amplitude Y',0,80,1),range('xGap','Column gap',8,60,1),range('yGap','Row gap',8,60,1),range('tension','Tension',.001,.05,.001),range('friction','Friction',.5,.99,.01)]},
    hyperspeed:{label:'Hyperspeed',defaults:{color1:'#ae4cff',color2:'#ff3d8b',preset:'Cyberpunk',speed:1,lanes:4,distortion:.35,roadWidth:.65,trailLength:.35,count:80},ui:[select('preset','Animation preset',['Cyberpunk','Akira','Golden','Split','Highway','Neon Waves']),color('color1','Lane colour'),color('color2','Light colour'),range('speed','Travel speed',0,3,.1),range('lanes','Road lanes',2,8,1),range('distortion','Distortion',0,1),range('roadWidth','Road width',.2,1),range('trailLength','Trail length',.05,.8),range('count','Light trails',20,160,1)]},
    liquidChrome:{label:'Liquid Chrome',defaults:{color1:'#bfc9d8',color2:'#161d29',speed:.3,amplitude:.3,frequencyX:3,frequencyY:3},ui:[color('color1','Chrome highlight'),color('color2','Chrome shadow'),range('speed','Flow speed',0,5,.01),range('amplitude','Amplitude',.1,1,.01),range('frequencyX','Frequency X',1,8,.1),range('frequencyY','Frequency Y',1,8,.1)]},
    balatro:{label:'Balatro',defaults:{color1:'#de443b',color2:'#006bb4',color3:'#162325',spinRotation:-2,spinSpeed:7,spinAmount:.25,contrast:3.5,lighting:.4,pixelFilter:745,offsetX:0,offsetY:0,isRotate:false},ui:[color('color1','Colour 1'),color('color2','Colour 2'),color('color3','Colour 3'),range('spinRotation','Spin rotation',-10,10,.1),range('spinSpeed','Spin speed',0,15,.1),range('spinAmount','Spin amount',0,1),range('contrast','Contrast',1,5,.1),range('lighting','Lighting',0,1),range('pixelFilter','Pixelation',20,2000,10),range('offsetX','Horizontal offset',-.5,.5),range('offsetY','Vertical offset',-.5,.5),{k:'isRotate',t:'check',label:'Rotate swirl'}]},
    liquidEther:{label:'Liquid Ether',defaults:{color1:'#5227ff',color2:'#ff9ffc',color3:'#b497cf',autoSpeed:.5,autoIntensity:2.2,viscous:30,scale:2.5},ui:[color('color1','Liquid colour 1'),color('color2','Liquid colour 2'),color('color3','Liquid colour 3'),range('autoSpeed','Auto speed',0,2,.1),range('autoIntensity','Flow intensity',.2,4,.1),range('viscous','Viscosity',0,80,1),range('scale','Flow scale',1,6,.1)]},
  };
  const rgb=c=>/^#[0-9a-f]{6}$/i.test(c)?[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)):[200,200,255];
  function field(g,it,x,y,w,h,key,p,t){
    const res=key==='balatro'?C(p.pixelFilter/8,12,160):128,ratio=Math.min(res/Math.max(w,h),1),W=Math.max(8,Math.round(w*ratio)),H=Math.max(8,Math.round(h*ratio));
    const stamp=JSON.stringify([key,p,W,H,Math.round(t*20)/20]);let c=cache.get(it);
    if(!c){const canvas=document.createElement('canvas');c={canvas,ctx:canvas.getContext('2d')};cache.set(it,c);}if(!c.ctx)return;
    if(c.stamp!==stamp){c.stamp=stamp;c.canvas.width=W;c.canvas.height=H;const image=c.ctx.createImageData(W,H),A=rgb(p.color1),B=rgb(p.color2),D=rgb(p.color3||p.color2);
      for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++){
        let u=ix/W-.5-(p.offsetX||0),v=iy/H-.5-(p.offsetY||0),f;
        if(key==='liquidChrome'){const warp=p.amplitude*Math.sin(v*p.frequencyY*TAU+t);f=.5+.5*Math.sin((u*p.frequencyX+warp)*TAU+Math.cos(v*7-t));f=Math.pow(f,.32);}
        else if(key==='balatro'){const r=Math.hypot(u,v),a=Math.atan2(v,u)+p.spinRotation+r*p.spinAmount*18+(p.isRotate?t*.1:0);f=.5+.5*Math.sin(Math.sin(a*3+r*16-t)+Math.cos(r*21-a*2)+t*.08);f=C((f-.5)*p.contrast+.5,0,1);}
        else {const scale=p.scale,warp=Math.sin(u*scale*4+t*.6)+Math.cos(v*scale*3-t*.5);f=.5+.5*Math.sin(warp*p.autoIntensity/(1+p.viscous/80)+u*scale*3+v*scale*2);}
        const o=(iy*W+ix)*4,a=f<.5?A:B,b=f<.5?B:D,m=f<.5?f*2:(f-.5)*2,light=key==='balatro'?1+(p.lighting||0)*(.5-f)*.5:1;
        for(let k=0;k<3;k++)image.data[o+k]=C((a[k]*(1-m)+b[k]*m)*light,0,255);image.data[o+3]=255;
      }c.ctx.putImageData(image,0,0);
    }g.save();g.imageSmoothingEnabled=key!=='balatro';g.drawImage(c.canvas,x,y,w,h);g.restore();
  }
  function render(key,g,it,x,y,w,h,k,time=0,amount=0){
    const p={...defs[key].defaults,...it.p};const speed=p.speed??(key==='balatro'?p.spinSpeed*.15:p.autoSpeed??1),t=time*speed,M=Math.min(w,h),r=mulberry32(it.seed||913);
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
    if(['liquidChrome','balatro','liquidEther'].includes(key)){field(g,it,x,y,w,h,key,p,t);g.restore();return;}
    if(key==='aeroShards'){
      const n=Math.round(60*p.density);for(let i=0;i<n;i++){const a=r()*TAU,z=r(),travel=r(),angle=a+t*p.spin*amount*.5,spread=p.spread*M*.45,center=p.placement==='left'?.3:p.placement==='right'?.7:.5;
        let px=x+w*center+Math.cos(a)*spread,py=y+h/2+Math.sin(a)*spread;
        if(p.flow==='stream'){px=x+((travel+time*p.speed*amount*.06)%1)*w;py+=Math.sin(t+i)*p.turbulence*M*.035;}
        else if(p.flow==='vortex'){px=x+w*center+Math.cos(angle)*spread;py=y+h/2+Math.sin(angle)*spread;}
        else py=y+h/2+Math.sin(px/w*5+t*amount)*spread*.6;
        const size=M*.035*p.shardSize*p.scale*(.3+z*p.depth);g.save();g.translate(px,py);g.rotate(angle);g.globalAlpha*=.3+z*.7;
        const grad=g.createLinearGradient(-size,-size,size,size);grad.addColorStop(0,p.color1);grad.addColorStop(p.material==='chrome'?.48:.7,p.color2);grad.addColorStop(1,p.color1);g.fillStyle=p.material==='satin'?p.color1:grad;g.shadowColor=p.color2;g.shadowBlur=p.glow*4*k;g.beginPath();g.moveTo(-size*p.stretch,0);g.lineTo(size*p.stretch,-size*.36);g.lineTo(size*.5,size*.48);g.closePath();g.fill();g.restore();}
    }else if(key==='lightfall'){
      const ambient=g.createRadialGradient(x+w/2,y+h/2,0,x+w/2,y+h/2,M*.6);ambient.addColorStop(0,p.color3+'35');ambient.addColorStop(1,p.color3+'00');g.globalAlpha*=C(p.backgroundGlow/3,0,1);g.fillStyle=ambient;g.fillRect(x,y,w,h);g.globalAlpha/=Math.max(.0001,C(p.backgroundGlow/3,0,1));
      const n=Math.min(180,Math.round(p.streakCount*12*p.density));for(let i=0;i<n;i++){const px=x+r()*w,phase=(r()+t*amount*(.06+r()*.06))%1,py=y+phase*h,len=h*.09*p.streakLength/p.zoom,color=[p.color1,p.color2,p.color3][i%3];g.save();g.globalAlpha*=.25+.65*(1-p.twinkle+p.twinkle*(.5+.5*Math.sin(t*2+i)));g.strokeStyle=color;g.lineWidth=p.streakWidth*k;g.shadowColor=color;g.shadowBlur=p.glow*4*k;const grad=g.createLinearGradient(px,py-len,px,py);grad.addColorStop(0,color+'00');grad.addColorStop(1,color);g.strokeStyle=grad;g.beginPath();g.moveTo(px,py-len);g.lineTo(px,py);g.stroke();g.restore();}
    }else if(key==='lightPillar'){
      g.translate(x+w/2,y+h/2);g.rotate((p.pillarRotation+time*p.rotationSpeed*amount*12)*Math.PI/180);const height=h*p.pillarHeight,width=M*p.pillarWidth*.035;
      for(let i=0;i<18;i++){const dx=(i/17-.5)*width,noise=Math.sin(i*2+t*amount)*p.noiseIntensity*width*.1;const grad=g.createLinearGradient(0,-height/2,0,height/2);grad.addColorStop(0,p.color1+'00');grad.addColorStop(.2,p.color1);grad.addColorStop(.75,p.color2);grad.addColorStop(1,p.color2+'00');g.strokeStyle=grad;g.lineWidth=width/12;g.globalAlpha=.09*C(p.intensity,.1,3);g.shadowColor=p.color2;g.shadowBlur=C(p.glowAmount*2000*k,0,35*k);g.beginPath();g.moveTo(dx,-height/2);g.bezierCurveTo(dx+noise,-height*.2,dx-noise,height*.2,dx,height/2);g.stroke();}
    }else if(key==='softAurora'){
      for(let band=0;band<5;band++){g.save();const base=y+h*(p.bandHeight+(band-2)*p.bandSpread*.06+p.layerOffset*.1),amp=h*.035*p.noiseAmplitude/p.scale;
        const grad=g.createLinearGradient(0,base-amp*3,0,base+amp*3);grad.addColorStop(0,p.color1+'00');grad.addColorStop(.5,band%2?p.color1:p.color2);grad.addColorStop(1,p.color2+'00');g.strokeStyle=grad;g.lineWidth=M*.1*(1-band*p.octaveDecay);g.globalAlpha*=C(p.brightness*.16,0,1);g.shadowColor=band%2?p.color1:p.color2;g.shadowBlur=20*k;g.beginPath();for(let j=0;j<=48;j++){const u=j/48,py=base+Math.sin(u*p.noiseFrequency*3+t*amount+band)*amp+Math.cos(u*8-t*p.colorSpeed*amount)*amp*.5;if(!j)g.moveTo(x,py);else g.lineTo(x+u*w,py);}g.stroke();g.restore();}
    }else if(key==='galaxy'){
      const cx=x+w*p.focalX,cy=y+h*p.focalY,n=Math.min(800,Math.round(240*p.density));const mist=g.createRadialGradient(cx,cy,0,cx,cy,M*.55);mist.addColorStop(0,p.color2+'55');mist.addColorStop(1,p.color2+'00');g.save();g.globalAlpha*=p.glowIntensity;g.fillStyle=mist;g.fillRect(x,y,w,h);g.restore();
      for(let i=0;i<n;i++){const rad=Math.sqrt(r())*M*.48,angle=r()*TAU+rad/M*7+time*p.rotationSpeed*amount,px=cx+Math.cos(angle)*rad,py=cy+Math.sin(angle)*rad*.65;g.save();g.globalAlpha*=.35+.65*(1-p.twinkleIntensity+p.twinkleIntensity*(.5+.5*Math.sin(t*p.starSpeed*3+i)));g.fillStyle=i%3===0?`hsl(${p.hueShift+i%40} ${p.saturation*100}% 80%)`:p.color1;g.shadowColor=p.color2;g.shadowBlur=p.glowIntensity*8*k;const sz=(.5+r()*1.5)*k;g.fillRect(px,py,sz,sz);g.restore();}
    }else if(key==='threads'||key==='waves'){
      g.strokeStyle=p.color1;g.lineWidth=(p.width||.6)*k;const vertical=key==='waves',n=vertical?Math.min(65,Math.ceil(w/(p.xGap*k))):Math.round(p.count);
      for(let i=0;i<n;i++){g.beginPath();g.globalAlpha=key==='threads'?.2+.65*Math.sin((i+1)/(n+1)*Math.PI):.65;
        for(let j=0;j<=64;j++){const u=j/64;let px,py;
          if(vertical){px=x+(i+.5)*w/n+Math.sin(u*7+time*p.waveSpeedX*80*amount+i*.25)*p.waveAmpX*k*(1-p.friction*.25);py=y+u*h+Math.cos(u*5+time*p.waveSpeedY*80*amount+i)*p.waveAmpY*k*p.tension*10;}
          else {px=x+u*w;py=y+h/2+(i/(n-1)-.5)*h*p.distance*.35+Math.sin(u*5+t*amount+i*.035)*h*.08*p.amplitude*Math.sin(u*Math.PI);}
          if(!j)g.moveTo(px,py);else g.lineTo(px,py);
        }g.stroke();}
      if(vertical){const rows=Math.min(60,Math.ceil(h/(p.yGap*k)));g.globalAlpha=.25;for(let i=0;i<rows;i++){g.beginPath();for(let j=0;j<=48;j++){const u=j/48,px=x+u*w,py=y+(i+.5)*h/rows+Math.sin(u*8+time*p.waveSpeedY*80*amount)*p.waveAmpY*k;if(!j)g.moveTo(px,py);else g.lineTo(px,py);}g.stroke();}}
    }else if(key==='hyperspeed'){
      const preset={Cyberpunk:['#ae4cff','#ff3d8b'],Akira:['#f93338','#fff2be'],Golden:['#ffc567','#ff8b40'],Split:['#30c7f7','#f740a8'],Highway:['#dae7ff','#ff7548'],'Neon Waves':['#48ffd1','#8289ff']}[p.preset],cx=x+w/2,vanish=y+h*.22;
      const A=p.preset==='Cyberpunk'?p.color1:preset[0],B=p.preset==='Cyberpunk'?p.color2:preset[1];g.strokeStyle=A;g.globalAlpha=.3;
      for(let lane=0;lane<=p.lanes;lane++){g.beginPath();g.moveTo(cx,vanish);g.lineTo(cx+(lane/p.lanes-.5)*w*p.roadWidth,y+h);g.stroke();}
      const n=Math.min(160,p.count);for(let i=0;i<n;i++){const side=r()<.5?-1:1,depth=((r()+t*amount*.25)%1+1)%1,near=depth**2,len=p.trailLength*(.08+near*.35),end=Math.max(0,near-len),offset=(.05+r()*.45)*side*w*p.roadWidth;
        const point=d=>[cx+offset*d+Math.sin(d*3+t*amount)*p.distortion*w*.08*d,vanish+d*(y+h-vanish)];const a=point(end),b=point(near);g.save();g.globalAlpha*=.3+near*.7;g.strokeStyle=i%2?A:B;g.lineWidth=(.6+near*2)*k;g.shadowColor=g.strokeStyle;g.shadowBlur=5*k;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();g.restore();}
    }g.restore();
  }
  const kits={};Object.entries(defs).forEach(([key,d])=>{kits[key]={...d,size:[.7,.5],anim:true,noShuffle:false,draw(g,it,x,y,w,h,k){const M=kitM(it);render(key,g,it,x,y,w,h,k,M.t,M.a);}};});
  window.CerebraVisualKits=kits;window.CerebraVisualRender=render;
})();
