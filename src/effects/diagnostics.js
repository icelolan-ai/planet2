/* F6 diagnostics: actual RAF intervals, with compilation separated from steady rendering. */
class FrameMetrics {
  constructor(){
    this.phase='before';this.last=null;this.compiles=[];
    this.before=this.empty();this.warmup=this.empty();this.after=this.empty();
    this.tick=t=>{if(this.last!==null&&!document.hidden)this.record(t-this.last);this.last=t;if(this.phase!=='done')this.raf=requestAnimationFrame(this.tick);};
    this.visibility=()=>{this.last=null;};document.addEventListener('visibilitychange',this.visibility);
    this.raf=requestAnimationFrame(this.tick);
  }
  empty(){return {frames:0,over50:0,totalMs:0,maxMs:0};}
  record(ms){if(!Number.isFinite(ms)||ms<=0||this.phase==='done')return;const s=this[this.phase];s.frames++;s.totalMs+=ms;s.maxMs=Math.max(s.maxMs,ms);if(ms>50)s.over50++;if(this.phase==='after'&&s.frames>=180)this.phase='done';}
  beginWarmup(label){this.phase='warmup';this.last=null;return {label,start:performance.now()};}
  endWarmup(mark){this.compiles.push({label:mark.label,durationMs:performance.now()-mark.start});this.phase='before';this.last=null;}
  ready(){this.phase='after';this.last=null;}
  snapshot(){const out={compiles:this.compiles.map(x=>({...x})),phase:this.phase,note:'RAF intervals before loading completes and first 180 frames after worlds are ready; different workloads, not a controlled benchmark.'};for(const k of ['before','warmup','after']){const s=this[k];out[k]={...s,fps:s.totalMs?1000*s.frames/s.totalMs:0};}return out;}
  dispose(){this.phase='done';cancelAnimationFrame(this.raf);document.removeEventListener('visibilitychange',this.visibility);}
}

/* Debug JSON only accepts the finite numeric controls exposed by Tune World. */
const CerebraDebug = {
  schema(){
    const schema=Object.create(null);
    document.querySelectorAll('#wtune input[data-wt]').forEach(el=>{schema[el.dataset.wt]={min:+el.min,max:+el.max,step:+el.step||.01,label:el.getAttribute('aria-label')||el.parentElement.querySelector('span')?.textContent||el.dataset.wt};});
    document.querySelectorAll('#wtune [data-wt-seg]').forEach(el=>{const values=[...el.querySelectorAll('[data-v]')].map(b=>+b.dataset.v);schema[el.dataset.wtSeg]={values,min:Math.min(...values),max:Math.max(...values),step:1,label:el.dataset.wtSeg};});return schema;
  },
  parse(text,app,schema){
    if(text.length>100000)throw Error('JSON is too large');
    const data=JSON.parse(text);if(data?.version!==1||!data.worlds||typeof data.worlds!=='object'||Array.isArray(data.worlds))throw Error('Expected a Cerebra version 1 preset');
    const changes=[];
    for(const [id,values]of Object.entries(data.worlds)){
      const world=app.orrery.worlds.find(w=>w.def.id===id);if(!world||!values||typeof values!=='object'||Array.isArray(values))throw Error('Unknown world or invalid settings');
      const clean={};for(const [key,value]of Object.entries(values)){const rule=schema[key];if(!rule||!Number.isFinite(value)||value<rule.min||value>rule.max||(rule.values&&!rule.values.includes(value)))throw Error('Invalid control: '+key);clean[key]=value;}changes.push({world,values:clean});
    }
    return changes;
  },
  export(app,schema){const worlds={};app.orrery.worlds.forEach(w=>{const v={};Object.keys(schema).forEach(k=>{if(Number.isFinite(w.tune[k]))v[k]=w.tune[k];});worlds[w.def.id]=v;});return JSON.stringify({version:1,worlds},null,2);},
  async open(app){
    if(!new URLSearchParams(location.search).has('debug'))return;
    const status=document.createElement('div');status.className='cerebra-debug-status';status.setAttribute('role','status');status.textContent='Loading debug tools…';document.body.append(status);
    try{
      const {default:GUI}=await import('https://cdn.jsdelivr.net/npm/lil-gui@0.21.0/dist/lil-gui.esm.min.js');
      if(app.ac.signal.aborted){status.remove();return;}
      const gui=new GUI({title:'Cerebra debug',width:280});app.debugGui=gui;
      Object.assign(gui.domElement.style,{zIndex:'120',top:'max(12px,env(safe-area-inset-top))',right:'12px',maxWidth:'calc(100vw - 24px)',maxHeight:'80dvh',overflowY:'auto'});
      ['pointerdown','wheel','touchmove'].forEach(t=>gui.domElement.addEventListener(t,e=>e.stopPropagation(),{passive:true}));
      const schema=this.schema(),state={world:app.orrery.worlds[0].def.id,fps:0,quality:'',over50:0};let folder;
      const show=()=>{if(folder)folder.destroy();const world=app.orrery.worlds.find(w=>w.def.id===state.world);folder=gui.addFolder(world.def.name);const values={...world.tune};Object.entries(schema).forEach(([k,r])=>{if(!Number.isFinite(values[k]))return;const c=r.values?folder.add(values,k,r.values):folder.add(values,k,r.min,r.max,r.step);c.name(r.label).onChange(v=>WorldTune.applyValues(world,{[k]:+v}));});};
      gui.add(state,'world',Object.fromEntries(app.orrery.worlds.map(w=>[w.def.name,w.def.id]))).name('World').onChange(show);
      gui.add(state,'fps').name('FPS').listen().disable();gui.add(state,'quality').name('Post quality').listen().disable();gui.add(state,'over50').name('Frames >50ms').listen().disable();
      const download=(name,text)=>{const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
      const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.append(input);
      input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>100000)throw Error('JSON is too large');const changes=this.parse(await file.text(),app,schema);changes.forEach(c=>WorldTune.applyValues(c.world,c.values));show();status.textContent='Imported settings for '+changes.length+' worlds';}catch(e){status.textContent=e.message;}finally{input.value='';}};
      gui.add({export:()=>download('cerebra-worlds.json',this.export(app,schema))},'export').name('Export world JSON');gui.add({import:()=>input.click()},'import').name('Import world JSON');gui.add({metrics:()=>download('cerebra-frames.json',JSON.stringify(app.metrics.snapshot(),null,2))},'metrics').name('Export frame metrics');
      show();status.textContent='Debug ready';const timer=setInterval(()=>{state.fps=Math.round(app.fps);state.quality=app.stage.post?.status||'off';state.over50=app.metrics.after.over50;},500);
      app.ac.signal.addEventListener('abort',()=>{clearInterval(timer);gui.destroy();input.remove();status.remove();},{once:true});
    }catch(e){status.textContent='Debug tools unavailable. Reload to retry.';}
  }
};
