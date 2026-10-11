// Native Rocket integration: real GLBs, rendered pixels, controls, history, project and composition.
// Browser plugin not available; Playwright Chromium emulation. Screenshots outside repository.
const {chromium}=require('playwright'),assert=require('assert'),os=require('os'),path=require('path');
(async()=>{
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{channel:'chrome'}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:vp,isMobile:vp.width<700,hasTouch:vp.width<700,deviceScaleFactor:+process.env.QA_DPR||1});const errors=[];
const optionalIcon=url=>/\/favicon\.ico(?:$|\?)/.test(url);
p.on('requestfailed',r=>{const message='REQUEST_FAILED '+r.url()+' '+r.failure()?.errorText;console.log(message);if(!optionalIcon(r.url()))errors.push(message);});
p.on('response',r=>{if(r.status()>=400&&!optionalIcon(r.url()))errors.push('HTTP '+r.status()+' '+r.url());});
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/\/favicon\.ico(?:$|\?)/.test(m.location().url||''))errors.push(m.text()+' '+(m.location().url||''));});
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto(process.env.QA_URL||'http://127.0.0.1:8000');await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
console.log('identity',await p.title(),p.url());
// Pause only the unrelated main-stage composition render; Rocket still renders real scenes
// through the original shared WebGLRenderer into its native layer targets.
if(process.env.QA_PAUSE_STAGE==='1')await p.evaluate(()=>{__cerebra.stage.render=()=>{};});
await p.locator('#gateway .gateway-enter').first().click();await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);
await p.locator('[data-cl-enter]').click();await p.locator('[data-cl-back]').click();await p.locator('[data-cl-enter]').click();
await p.getByRole('button',{name:'Skip and enter Studio'}).click();await p.waitForFunction(()=>__cerebra.studio.active);
for(const model of ['f9','fh','sv']){
 if(model==='f9'){
  await p.locator('[data-cl-lang="th"]:visible').first().click();assert.equal(await p.locator('[data-empty-rocket]').textContent(),'เพิ่มจรวด…');await p.locator('[data-cl-lang="en"]:visible').first().click();
  const empty=p.locator('[data-empty-rocket]');await empty.waitFor({state:'visible'});const r=await empty.boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=vp.width&&r.y+r.height<=vp.height);
  await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-empty-${vp.width}.png`)});await empty.click();
 }else{await p.locator('[data-menu-top="Layer"]').click();await p.getByRole('menuitem',{name:'Add planet…',exact:true}).click();await p.locator('[data-rocket-category]').click();}
 assert.equal(await p.locator('[data-rocket]').count(),3);
 if(model==='f9')await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-menu-${vp.width}.png`)});
 await p.locator(`[data-rocket="${model}"]`).click();
 await p.waitForFunction(()=>{const s=__cerebra.studio,i=s.items.filter(i=>i.kit==='rocket').at(-1),q=CerebraRockets.inspect(i);return q?.meshes>0||q?.error;},null,{timeout:90000});
 const loaded=await p.evaluate(()=>{const q=CerebraRockets.inspect(__cerebra.studio.sel);return {loading:q.loading,error:q.error,meshes:q.meshes};});console.log(model,loaded);assert(!loaded.error&&loaded.meshes>20);
 await p.evaluate(()=>{const s=__cerebra.studio;for(const i of s.items.filter(i=>i.kit==='rocket'&&i!==s.sel)){i.hide=true;s.place(i);}s.renderLayers();});
 const pixel=()=>p.evaluate(async()=>{const s=__cerebra.studio,i=s.sel;await CerebraRockets.kit.ready(i);const c=CerebraRockets.inspect(i).canvas,a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,hash=0;for(let j=0;j<a.length;j++){hash=(hash*31+a[j])|0;if(j%4===3&&a[j])n++;}const q=CerebraRockets.inspect(i);return {n,hash,viewport:q.viewport,target:q.target,dpr:s.app.stage.renderer.getPixelRatio(),visible:q.visibleParts};});
 const base=await pixel();assert(base.n>100);assert.deepEqual(base.viewport,[0,0,...base.target]);assert.equal(base.visible.length,loaded.meshes);console.log('native target',model,{dpr:base.dpr,viewport:base.viewport,target:base.target});let previous=base;
 // Test fractional Lite DPR and Retina DPR without creating a second renderer.
 for(const ratio of [1.25,2]){await p.evaluate(v=>__cerebra.stage.renderer.setPixelRatio(v),ratio);const q=await pixel();assert.deepEqual(q.viewport,[0,0,...q.target]);assert.equal(q.hash,base.hash);}
 await p.evaluate(v=>__cerebra.stage.renderer.setPixelRatio(v),base.dpr);
 // Visible projected pixels must be centered in the same native canvas as Select.
 const centered=await p.evaluate(async()=>{const i=__cerebra.studio.sel;await CerebraRockets.kit.ready(i);const c=CerebraRockets.inspect(i).canvas,a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=c.width,r=-1,t=c.height,b=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(a[(y*c.width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {dx:Math.abs((l+r)-(c.width-1)),dy:Math.abs((t+b)-(c.height-1))};});assert(centered.dx<=2&&centered.dy<=2,JSON.stringify(centered));
 const pose=()=>p.evaluate(()=>{const s=__cerebra.studio,i=s.sel;return {id:i.id,yaw:i.p.yaw,pitch:i.p.pitch,layout:[i.x,i.y,i.w,i.h,i.rot||0],others:s.items.filter(x=>x!==i&&x.kit==='rocket').map(x=>JSON.stringify(x.p)),hi:s.hi};});
 await p.evaluate(()=>__cerebra.studio.commit());const beforeHand=await pose();
 const hand=p.locator('[data-studio-tool="hand"]');assert(await hand.isEnabled());await hand.click();
 assert.equal(await p.evaluate(()=>__cerebra.studio.sel?.id),beforeHand.id);
 const point=await p.evaluate(()=>{const r=__cerebra.studio.sel.el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 if(vp.width<700){const cd=await p.context().newCDPSession(p);await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});for(let n=1;n<=6;n++){await cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+n*8,y:point.y+n*5}]});await p.waitForTimeout(25);}await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cd.detach();}
 else{await p.mouse.move(point.x,point.y);await p.mouse.down();await p.mouse.move(point.x+48,point.y+30,{steps:6});await p.mouse.up();}
 const afterHand=await pose();assert.notEqual(afterHand.yaw,beforeHand.yaw);assert.notEqual(afterHand.pitch,beforeHand.pitch);assert.deepEqual(afterHand.layout,beforeHand.layout);assert.deepEqual(afterHand.others,beforeHand.others);assert.equal(afterHand.hi,beforeHand.hi+1);assert.notEqual((await pixel()).hash,base.hash);
 await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-hand-${model}-${vp.width}.png`)});
 await p.evaluate(id=>{const s=__cerebra.studio;s.undo();s.select(s.items.filter(i=>i.kit==='rocket'&&i.p.model===id).at(-1));},model);assert.equal((await pose()).yaw,beforeHand.yaw);
 await p.evaluate(id=>{const s=__cerebra.studio;s.redo();s.select(s.items.filter(i=>i.kit==='rocket'&&i.p.model===id).at(-1));},model);assert.equal((await pose()).yaw,afterHand.yaw);
 await p.evaluate(id=>{const s=__cerebra.studio;s.undo();s.setTool('move');s.select(s.items.filter(i=>i.kit==='rocket'&&i.p.model===id).at(-1));},model);assert.equal((await pixel()).hash,base.hash);
 await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-select-${model}-${vp.width}.png`)});
 await p.evaluate(()=>{const s=__cerebra.studio;s.lockItem(s.sel,true);});assert(await hand.isDisabled());await p.keyboard.press('h');assert.equal(await p.evaluate(()=>__cerebra.studio.tool),'move');
 await p.evaluate(()=>{const s=__cerebra.studio;s.lockItem(s.sel,false);s.sel.hide=true;s.place(s.sel);s.renderLayers();});assert(await hand.isDisabled());
 await p.evaluate(()=>{const s=__cerebra.studio;s.sel.hide=false;s.place(s.sel);s.renderLayers();});assert(await hand.isEnabled());


 // The native Tune button follows the selected object, using the same Kit panel/history.
 const tune=p.locator('[data-studio-tune]');assert(await tune.isEnabled());assert.equal(await tune.locator('[data-tune-label]').textContent(),'Tune Rocket');await tune.click();
 await p.locator('[data-rocket-assembly]').waitFor({state:'visible'});assert.equal(await tune.getAttribute('aria-expanded'),'true');
 assert(await p.evaluate(()=>!document.body.classList.contains('tune-open')&&!document.body.classList.contains('wtune-open')));
 const fly=await p.locator('[data-kit-panel]').boundingBox();assert(fly.x>=0&&fly.y>=0&&fly.x+fly.width<=vp.width+1&&fly.y+fly.height<=vp.height+1);
 await p.locator('[data-rocket-explode]').click();assert.equal(await p.evaluate(()=>__cerebra.studio.sel.p.explode),1);assert.notEqual((await pixel()).hash,base.hash);
 await p.locator('[data-rocket-assemble]').click();assert.equal((await pixel()).hash,base.hash);
 await p.locator('[data-kp="stagger"]').check();await p.locator('[data-kp="explode"]').evaluate(e=>{e.value=.5;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});assert.notEqual((await pixel()).hash,base.hash);await p.locator('[data-rocket-assemble]').click();await p.locator('[data-kp="stagger"]').uncheck();
 await p.locator('summary').filter({hasText:'Parts & variants'}).click();
 const nose=model==='sv'?'SV-CSM-000':'PL-020';await p.locator('[data-rocket-part]').selectOption(nose);await p.locator('[data-rocket-scope]').selectOption('@selected');
 await p.locator('[data-rocket-explode]').click();assert.notEqual((await pixel()).hash,base.hash);await p.locator('[data-rocket-assemble]').click();await p.locator('[data-rocket-scope]').selectOption('');
 await p.locator('[data-rocket-isolate]').click();assert.notEqual((await pixel()).hash,base.hash);
 await p.locator('[data-rocket-show-all]').click();assert.equal((await pixel()).hash,base.hash);
 await p.locator('[data-rocket-remove]').click();const removed=await pixel();assert.notEqual(removed.hash,base.hash);assert(removed.visible.length<loaded.meshes);
 await p.evaluate(model=>{const s=__cerebra.studio;s.undo();s.select(s.items.filter(i=>i.kit==='rocket'&&i.p.model===model).at(-1));},model);assert.equal((await pixel()).hash,base.hash);
 await p.evaluate(model=>{const s=__cerebra.studio;s.redo();s.select(s.items.filter(i=>i.kit==='rocket'&&i.p.model===model).at(-1));},model);assert.equal((await pixel()).hash,removed.hash);
 await p.evaluate(model=>{const s=__cerebra.studio,snap=s.snapshot();s.restore(snap);s.select(s.items.filter(i=>i.kit==='rocket'&&i.p.model===model).at(-1));},model);assert.equal((await pixel()).hash,removed.hash);
 await tune.click();await p.locator('summary').filter({hasText:'Parts & variants'}).click();await p.locator('[data-rocket-show-all]').click();assert.equal((await pixel()).hash,base.hash);
 await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-tune-${model}-${vp.width}.png`)});
 await tune.click();assert(await p.locator('[data-kit-panel]').isHidden());
 const instances=await p.evaluate(()=>JSON.stringify(CerebraRockets.inspect(__cerebra.studio.sel).instances));
 await p.locator('[data-menu-top="Edit"]').click();await p.getByRole('menuitem',{name:'Design selected…',exact:true}).click();
 for(const [key,value]of [['explode',.6],['yaw',75],['zoom',1.3]]){
  await p.locator(`[data-kp="${key}"]`).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},value);
  const now=await pixel();assert.notEqual(now.hash,previous.hash);assert(now.n>100);previous=now;
 }
 await p.locator('[data-kp="painted"]').check();await p.locator('[data-kp="colour"]').evaluate(e=>{e.value='#ff3344';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
 const painted=await pixel();assert.notEqual(painted.hash,previous.hash);
 await p.locator('[data-kp="finished"]').check();
 await p.locator('[data-kp="roughness"]').evaluate(e=>{e.value=.9;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.notEqual((await pixel()).hash,painted.hash);
 await p.locator('summary').filter({hasText:'Parts & variants'}).click();
 const paintable=await p.locator('[data-rocket-part]').evaluate(e=>[...e.options].find(o=>/TNK|SV-IC|FAIR/.test(o.value))?.value||e.options[0].value);
 await p.locator('[data-rocket-part]').selectOption(paintable);
 const beforeHide=await pixel();await p.locator('[data-rocket-part-hidden]').check();assert.notEqual((await pixel()).hash,beforeHide.hash);await p.locator('[data-rocket-part-hidden]').uncheck();
  if(await p.locator('[data-rocket-part-colour]').isVisible()){await p.locator('[data-rocket-part-colour]').evaluate(e=>{e.value='#33ccff';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});assert.notEqual((await pixel()).hash,beforeHide.hash);}
 if(await p.locator('[data-rocket-variant]').count()){const v=await p.locator('[data-rocket-variant]').evaluate(e=>e.options[1].value);await p.locator('[data-rocket-variant]').selectOption(v);await p.waitForTimeout(300);await pixel();}
 if(model==='f9')await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-design-${vp.width}.png`)});
 // Rotation/centering must never offset instanced hardware in the assembled state.
 await p.evaluate(()=>{const s=__cerebra.studio;s.sel.p.explode=0;});await pixel();
 assert.equal(await p.evaluate(()=>JSON.stringify(CerebraRockets.inspect(__cerebra.studio.sel).instances)),instances);
 await p.evaluate(()=>{const s=__cerebra.studio;s.sel.p.explode=.6;s.kitRedraw(s.sel);s.commit();});
 const round=await p.evaluate(()=>{const s=__cerebra.studio,snap=s.snapshot();s.restore(snap);const i=s.items.filter(i=>i.kit==='rocket').at(-1);s.select(i);return {p:i.p,count:s.items.filter(i=>i.kit==='rocket').length};});assert.equal(round.p.model,model);assert.equal(round.p.explode,.6);assert.equal(round.p.colour,'#ff3344');
 await p.waitForFunction(()=>CerebraRockets.inspect(__cerebra.studio.sel)?.meshes>0,null,{timeout:90000});
 // Native remove/Undo/Redo restores the same model and parameters.
 const id=await p.evaluate(()=>{const s=__cerebra.studio,i=s.sel;s.commit();s.removeItem(i);s.undo();return s.items.filter(i=>i.kit==='rocket').at(-1).p.model;});assert.equal(id,model);
 await p.evaluate(()=>{const s=__cerebra.studio;s.redo();s.undo();const i=s.items.filter(i=>i.kit==='rocket').at(-1);s.select(i);});
 await p.waitForFunction(()=>CerebraRockets.inspect(__cerebra.studio.sel)?.meshes>0,null,{timeout:90000});
 await p.evaluate(()=>{const s=__cerebra.studio;s.closeFly();for(const i of s.items.filter(i=>i.kit==='rocket')){i.hide=i!==s.sel;s.place(i);}s.select(null);});
 await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-${model}-${vp.width}.png`)});
 await p.evaluate(()=>{const s=__cerebra.studio;s.select(s.items.filter(i=>i.kit==='rocket').at(-1));});
 await p.locator('[data-menu-top="Edit"]').click();await p.getByRole('menuitem',{name:'Design selected…',exact:true}).click();
 await p.locator('[data-kit-reset]').click();
 assert.equal(await p.evaluate(()=>__cerebra.studio.sel.p.model),model);
 await p.waitForFunction(()=>CerebraRockets.inspect(__cerebra.studio.sel)?.meshes>0,null,{timeout:90000});
 assert.equal((await pixel()).hash,base.hash);
 assert.equal(await p.evaluate(()=>{const s=__cerebra.studio,snap=s.snapshot();s.restore(snap);const i=s.items.filter(i=>i.kit==='rocket').at(-1);s.select(i);s.closeFly();return i.p.model;}),model);
}
const beforePlanet=await p.evaluate(()=>__cerebra.studio.snapshot());
await p.evaluate(()=>{const s=__cerebra.studio;s.addPlanet(-1);s.select(s.fxItem('planet'));});
assert.equal(await p.locator('[data-tune-label]').textContent(),'Tune the core');await p.locator('[data-studio-tune]').click();await p.waitForFunction(()=>document.getElementById('tune').dataset.open==='true');
await p.evaluate(()=>{const s=__cerebra.studio;s.select(s.items.filter(i=>i.kit==='rocket').at(-1));});assert.equal(await p.locator('[data-tune-label]').textContent(),'Tune Rocket');assert(await p.evaluate(()=>document.getElementById('tune').dataset.open!=='true'));
await p.locator('[data-studio-tune]').click();assert(await p.locator('[data-rocket-assembly]').isVisible());
await p.evaluate(snap=>{const s=__cerebra.studio;s.closeFly();s.restore(snap);},beforePlanet);
const bounds=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,iframes:document.querySelectorAll('iframe').length}));assert(!bounds.overflow);assert.equal(bounds.iframes,0);
if(process.env.QA_EXPORT==='1'){const out=await p.evaluate(async()=>{const c=await __cerebra.studio.composePoster(1,true);return {w:c.width,h:c.height,size:c.toDataURL().length};});assert(out.w>0&&out.h>0&&out.size>10000);console.log('composition export',out);}
console.log('errors',errors);assert.deepEqual(errors,[]);await b.close();console.log('PASS',vp,'device DPR',+process.env.QA_DPR||1);
})().catch(e=>{console.error(e);process.exit(1)});
