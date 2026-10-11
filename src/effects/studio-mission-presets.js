/* Authored mission compositions. Native Kit/layers/history/project/capture own all state. */
(() => {
  const range=(k,label,min,max,step=.01)=>({k,label,t:'range',min,max,step});
  const trajectory={label:'Mission trajectory',size:[.7,.35],noShuffle:true,
    defaults:{bend:.5,width:2,nodes:5,glow:12,dashed:false},
    ui:[range('bend','Path bend / ความโค้ง',-1,1),range('width','Line width / ความหนา',.5,8,.5),range('nodes','Waypoint count / จุดเส้นทาง',0,12,1),range('glow','Path glow / แสงเส้นทาง',0,30,1),{k:'dashed',label:'Dashed route / เส้นประ',t:'check'}],
    draw(g,it,x,y,w,h){const p=it.p;g.save();g.strokeStyle=g.fillStyle=it.fill;g.lineWidth=p.width;g.shadowColor=it.fill;g.shadowBlur=p.glow;g.setLineDash(p.dashed?[8,6]:[]);
      const point=t=>[x+w*(.07+.86*t),y+h*(.75-.5*t-p.bend*Math.sin(Math.PI*t)*.45)];g.beginPath();for(let i=0;i<=80;i++){const q=point(i/80);i?g.lineTo(...q):g.moveTo(...q);}g.stroke();g.setLineDash([]);g.shadowBlur=0;
      for(let i=0;i<p.nodes;i++){const q=point(p.nodes===1?.5:i/(p.nodes-1));g.beginPath();g.arc(...q,3,0,Math.PI*2);g.fill();}const q=point(1);g.beginPath();g.moveTo(q[0]-10,q[1]-3);g.lineTo(...q);g.lineTo(q[0]-5,q[1]+9);g.stroke();g.restore();}
  };
  const callout={label:'Technical callout',size:[.35,.2],noShuffle:true,
    defaults:{label:'ASSEMBLY / 01',size:13,side:'right',line:1.5,endpoint:true},
    ui:[{k:'label',label:'Annotation / คำอธิบาย',t:'text'},range('size','Label size / ขนาดข้อความ',8,32,1),{k:'side',label:'Leader side / ทิศเส้น',t:'select',opts:[['left','Left / ซ้าย'],['right','Right / ขวา']]},range('line','Leader width / ความหนาเส้น',.5,5,.5),{k:'endpoint',label:'Endpoint ring / วงจุดปลาย',t:'check'}],
    draw(g,it,x,y,w,h){const p=it.p,left=p.side==='left',a=x+w*(left?.93:.07),b=x+w*(left?.58:.42),end=x+w*(left?.08:.92);g.save();g.strokeStyle=g.fillStyle=it.fill;g.lineWidth=p.line;g.beginPath();g.moveTo(a,y+h*.85);g.lineTo(b,y+h*.3);g.lineTo(end,y+h*.3);g.stroke();if(p.endpoint){g.beginPath();g.arc(a,y+h*.85,4,0,Math.PI*2);g.stroke();}g.font=`${p.size}px "Barlow Condensed","Noto Sans Thai",sans-serif`;g.textAlign=left?'right':'left';g.textBaseline='bottom';g.fillText(p.label,left?end:b,y+h*.25,Math.max(1,w*.5));g.restore();}
  };
  const presets=[
    ['rocketNoir','Rocket · Product dossier','จรวด · แฟ้มจัดแสดง','rocket','#090a0f','#474c58','Catalog imagery and editable product typography.'],
    ['rocketTechnical','Rocket · Technical study','จรวด · แบบศึกษา','rocket','#102332','#b9e2ed','Blueprint composition with assembly annotations.'],
    ['rocketAssembly','Rocket · Assembly atlas','จรวด · แผนผังประกอบ','rocket','#12121a','#d2bc96','Falcon Heavy in staggered exploded view.'],
    ['rocketMission','Rocket · Mission console','จรวด · ภารกิจ','rocket','#10171d','#f69947','Editable mission route and demonstration data.'],
    ['rocketFleet','Rocket · Fleet collection','จรวด · คอลเลกชัน','rocket','#101014','#b4bed0','All three original GLBs in one display.'],
    ['rocketOrbit','Rocket · Orbital encounter','จรวด · พบกันในวงโคจร','rocket','#030c1b','#77cdda','Rocket and your planet with a luminous route.'],
    ['planetSurvey','Planet · Surface survey','ดาว · สำรวจพื้นผิว','planet','#311b16','#d6a984','Terracotta survey layout and editable sample panels.'],
    ['planetNetwork','Planet · Neural observatory','ดาว · หอดูเครือข่าย','planet','#05121c','#7ce5ef','Native network and concentric scales.'],
    ['planetEditorial','Planet · Editorial study','ดาว · บทบรรณาธิการ','planet','#d8d8d1','#354c50','Quiet editorial typography and orbital geometry.']
  ];
  function apply(s,key){
    const def=presets.find(d=>d[0]===key);if(!def)return false;
    s.flushCommit?.();s.commit();const pre=s.planetLook(),commit=s.commit; s.commit=()=>{};
    const wide=innerWidth/innerHeight>1.15,m=Math.min(innerWidth,innerHeight),U=s.U(),sc=Math.max(.65,Math.min(1.25,m/850));
    const ink=key==='planetEditorial'?'#25393e':def[5],name=window.__cerebraLanguage?.current==='th'?def[2]:def[1];
    let featured=null;
    const add=(kind,o)=>s.addItem(kind,{...o,tpl:key,silent:true,missionLayout:true});
    const text=(content,x,y,size=16,opts={})=>add('text',{content,x,y,size:Math.round(size*sc),color:ink,font:'cond',align:'l',weight:400,ls:.1,...opts});
    const kit=(kind,x,y,w,h,p={},opts={})=>add('kit',{kit:kind,x,y,w:w*m/U,h:h*m/U,p,fill:ink,...opts});
    const rocket=(model,x,y,height,opts={})=>{const it=kit('rocket',x,y,height*.44,height,{model,yaw:25,zoom:1.65,...opts});it.name={f9:'Falcon 9',fh:'Falcon Heavy',sv:'Saturn V'}[model];return it;};
    try{
      // Swap only our template-owned layers. Manual/other poster/background work stays editable.
      s.items.filter(i=>i.missionLayout&&!i.locked).forEach(i=>s.removeItem(i,true));
      s.applyPreset(key,false,{background:'gradient',a:def[4],b:key==='planetEditorial'?'#adb9b5':'#02050a',angle:145,grid:false,light:1.2,lightX:-3,shadow:.6,soft:.7,effect:'off',amount:0,ink});
      text(def[1].split(' · ')[1].toUpperCase(),.12,.17,wide?42:29,{ls:.13});
      text('CEREBRA / STUDIO STUDY',.12,.12,12,{font:'mono',ls:.2});
      if(def[3]==='rocket'){
        if(key==='rocketFleet'){
          const xs=[.29,.5,.71];['f9','fh','sv'].forEach((model,i)=>{const it=rocket(model,xs[i],.51,wide?.72:1.1);text(it.name,xs[i],.79,16,{align:'c'});if(i===0)featured=it;});
          text('01 / THREE VEHICLES · ORIGINAL CAD',.12,.85,12,{font:'mono'});
        }else{
          const model=key==='rocketTechnical'?'sv':key==='rocketAssembly'?'fh':'f9';
          const x=wide?.65:.5, y=wide?.53:.49;
          featured=rocket(model,x,y,wide?.86:1.1,{explode:key==='rocketAssembly'?.42:key==='rocketTechnical'?.18:0,stagger:key==='rocketAssembly'});
          text(featured.name,wide?.12:.12,wide?.31:.75,wide?48:25);
          if(key==='rocketNoir'){
            text('ORIGINAL CAD MODEL\nRotate with Hand · Tune for parts\nMaterials and variants stay editable',.12,wide?.43:.81,14,{upper:false,ls:0});
            kit('hud',x,y,.5,.94,{glyph:'brackets',len:.05},{opacity:.45});
          }else if(['rocketTechnical','rocketAssembly'].includes(key)){
            kit('scaleRing',x,y,.95,.95,{n:96,major:8,numbers:false,inner:.9},{opacity:.25});
            kit('technicalCallout',wide?.37:.31,.31,wide?.42:.34,.14,{label:'ASSEMBLY / 01',side:'left'});
            kit('technicalCallout',wide?.77:.72,.62,wide?.35:.34,.14,{label:'ASSEMBLY / 02',side:'right'});
            text('COMPOSITION STUDY\nTune: assemble / explode / isolate\nLabels are editable artwork',.12,wide?.69:.84,13,{upper:false,ls:0});
          }else{
            kit('missionTrajectory',.5,wide?.68:.63,wide?1.1:.75,.35,{bend:.7,nodes:5,glow:14});
            if(key==='rocketMission')kit('widget',wide?.27:.5,wide?.58:.83,wide?.38:.7,wide?.32:.16,{mode:'table',data:'DEMO / MISSION STUDY\nPHASE: COAST\nROUTE: ORBITAL\nSTATUS: READY'});
            if(key==='rocketOrbit'){if(!s.planetPresent())s.addPlanet(-1);s.app.core.planet.setView(wide?.75:.65);s.x=wide?-2.2:-1.2;s.y=wide?.15:1.4;kit('rings',wide?.27:.32,wide?.48:.37,.68,.68,{n:3,inner:.7},{opacity:.45});}
          }
        }
      }else{
        if(!s.planetPresent())s.addPlanet(-1);
        s.app.core.planet.setView(wide?.95:.7);s.x=wide?1.2:0;s.y=wide?0:.55;
        if(key==='planetSurvey'){
          kit('widget',wide?.25:.5,wide?.48:.75,wide?.38:.68,wide?.3:.16,{mode:'table',data:'DEMO / SURFACE STUDY\nZONE: A-02\nLAYER: MINERAL\nMODE: ANALYZE'});
          kit('technicalCallout',wide?.75:.65,.45,.4,.18,{label:'SURFACE / STUDY',side:'left'});
          kit('missionTrajectory',.5,.67,wide?1.15:.8,.25,{bend:.3,nodes:3,glow:7},{fill:'#efaa67'});
        }else if(key==='planetNetwork'){
          kit('plexus2d',wide?.62:.5,.49,.87,.87,{n:38,link:.24},{opacity:.5});
          kit('scaleRing',wide?.62:.5,.49,.95,.95,{n:96,major:8,numbers:false},{opacity:.5});
          text('NETWORK / OBSERVATORY\nEditable nodes and orbital scale',.12,.82,14,{upper:false,ls:0});
        }else{
          kit('scaleRing',wide?.65:.5,.52,.85,.85,{n:72,major:6,numbers:false},{opacity:.45});
          text('A WORLD / IN DETAIL',.12,wide?.73:.78,wide?48:28);text('01  ·  EDITORIAL COMPOSITION',.12,.85,12,{font:'mono'});
        }
      }
      const made=s.items.filter(i=>i.tpl===key&&i.missionLayout&&!i.locked);s.groupPresetItems(name,made);s.stackDom();s.renderLayers();s.updateFocus();s.syncEmptyHint();
    }finally{s.commit=commit;}
    const post=s.planetLook();s.commit(post?{pre,pl:post}:undefined);s.select(featured);s.paintBackground();s.paintVfx();return true;
  }
  window.CerebraMissionPresets={trajectory,callout,presets,has:key=>presets.some(d=>d[0]===key),apply};
})();
