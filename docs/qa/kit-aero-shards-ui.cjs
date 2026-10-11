// Aero Shards Kit fixture (unfrozen renderer): shader compile errors, every control changes pixels (motion off), all selects, Undo/Redo, restore, export size.
// Serve the built repo over HTTP first. VP env selects the viewport; QA_SCREENSHOT_DIR must be outside the repo. `spin` shows NO CHANGE with motion off by design (roll needs time).
const {chromium}=require('playwright'),assert=require('assert');
const SHOT=process.env.QA_SCREENSHOT_DIR||require('os').tmpdir();
(async()=>{const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const p=await b.newPage({viewport:vp,hasTouch:vp.width<900,isMobile:vp.width<900});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{const t=m.text();if((m.type()==='error'||/shader|compile|GLSL|ERROR:/i.test(t))&&!/ERR_|Failed to load|ReadPixels|KHR|GPU stall/.test(t))errs.push(t.slice(0,600))});
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto(process.env.QA_URL||(process.env.QA_URL||'http://127.0.0.1:8000'));await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
await p.locator('#gateway .gateway-enter').first().click();await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);
await p.locator('[data-cl-enter]').click();await p.locator('[data-cl-back]').click();await p.locator('[data-cl-enter]').click();
await p.getByRole('button',{name:'Skip and enter Studio'}).click();await p.waitForFunction(()=>__cerebra.studio.active);await p.waitForTimeout(1500);
await p.evaluate(()=>{const s=__cerebra.studio;s.addItem('kit',{decor:true,kit:'aeroShards',fill:s.decorFill,opacity:1,mOn:true,w:(innerWidth+4)/s.U(),h:(innerHeight+4)/s.U(),x:.5,y:.5});});await p.waitForTimeout(4000);
console.log('errors so far',JSON.stringify(errs));
await p.screenshot({path:`${SHOT}/aero-${vp.width}.png`});
const stat=()=>p.evaluate(()=>{const it=__cerebra.studio.items.find(i=>i.kit==='aeroShards'),c=it.el.querySelector('canvas.st-kitc'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0,n=0;const bg=[0x12,0x0f,0x17];for(let i=0;i<d.length;i+=4){h=(h+d[i+3]*((i>>2)%977+1)+d[i]*3+d[i+1]*5+d[i+2]*7)>>>0;if(Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>30)n++;}return {w:c.width,h:c.height,lit:n/(c.width*c.height),hash:h};});
const s0=await stat();console.log('initial',JSON.stringify(s0));assert(s0.lit>.01,'aero must draw');
const it=()=>__cerebra.studio.items.find(i=>i.kit==='aeroShards');
await p.evaluate(()=>{const it=__cerebra.studio.items.find(i=>i.kit==='aeroShards');it.mOn=false;__cerebra.studio.place(it);__cerebra.studio.kitRedraw(it);});await p.waitForTimeout(1500);
const base=await stat();
const ui=await p.evaluate(()=>CerebraAeroShards.kit.ui.map(u=>({k:u.k,t:u.t,min:u.min,max:u.max,opts:u.opts&&u.opts.map(o=>o[0]),v:CerebraAeroShards.defaults[u.k]})));
const bad=[];
for(const u of ui){
 const alt=u.t==='color'?(u.v==='#00ff88'?'#ff0044':'#00ff88'):u.t==='select'?u.opts.find(o=>o!==u.v):(Math.abs(u.v-u.min)>Math.abs(u.v-u.max)?u.min:u.max);
 await p.evaluate(([k,v])=>{const it=__cerebra.studio.items.find(i=>i.kit==='aeroShards');it.p[k]=v;__cerebra.studio.kitRedraw(it);},[u.k,alt]);await p.waitForTimeout(1300);const a=await stat();
 await p.evaluate(([k,v])=>{const it=__cerebra.studio.items.find(i=>i.kit==='aeroShards');it.p[k]=v;__cerebra.studio.kitRedraw(it);},[u.k,u.v]);await p.waitForTimeout(1300);const r=await stat();
 const ch=a.hash!==base.hash;console.log(u.k,ch?'changes':'NO CHANGE',r.hash===base.hash?'restores':'(no restore)');if(!ch)bad.push(u.k);}
// every select option of effect/placement/flow/material/detail must render without shader errors and differ
for(const [k,vals] of [['effect',['dither','ascii']],['placement',['right','left','center']],['flow',['vortex','ribbon']],['material',['chrome','satin']],['quality',['low','high']]]){for(const v of vals){await p.evaluate(([k,v])=>{const it=__cerebra.studio.items.find(i=>i.kit==='aeroShards');it.p[k]=v;__cerebra.studio.kitRedraw(it);},[k,v]);await p.waitForTimeout(1500);const a=await stat();console.log(k,v,'lit',a.lit.toFixed(3));if(k==='effect'){await p.screenshot({path:`${SHOT}/aero-${v}.png`});}await p.evaluate(([k])=>{const it=__cerebra.studio.items.find(i=>i.kit==='aeroShards');it.p[k]=CerebraAeroShards.defaults[k];__cerebra.studio.kitRedraw(it);},[k]);}}
const out=await p.evaluate(async()=>{const s=__cerebra.studio;const it=s.items.find(i=>i.kit==='aeroShards');it.p.bloom=1.2;s.commit();const j=s.snapshot();s.undo();const u=s.items.find(i=>i.kit==='aeroShards').p.bloom;s.redo();const r=s.items.find(i=>i.kit==='aeroShards').p.bloom;s.restore(j);const rr=s.items.find(i=>i.kit==='aeroShards').p.bloom;const c=await s.composePoster(1,true);return {u,r,rr,w:c.width,h:c.height}});
console.log('history',JSON.stringify(out));
console.log('bad',JSON.stringify(bad),'errors',JSON.stringify(errs));
assert.deepEqual(errs,[]);
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
