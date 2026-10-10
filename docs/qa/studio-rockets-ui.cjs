// Native Rocket integration: real GLBs, rendered pixels, controls, history, project and composition.
// Browser plugin not available; Playwright Chromium emulation. Screenshots outside repository.
const {chromium}=require('playwright'),assert=require('assert'),os=require('os'),path=require('path');
(async()=>{
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{channel:'chrome'}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:vp,isMobile:vp.width<700,hasTouch:vp.width<700});const errors=[];
p.on('requestfailed',r=>console.log('REQUEST_FAILED',r.url(),r.failure()?.errorText));
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
 await p.locator('[data-menu-top="Layer"]').click();await p.getByRole('menuitem',{name:'Add planet…',exact:true}).click();
 await p.locator('[data-rocket-category]').click();assert.equal(await p.locator('[data-rocket]').count(),3);
 if(model==='f9')await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR||os.tmpdir(),`rocket-menu-${vp.width}.png`)});
 await p.locator(`[data-rocket="${model}"]`).click();
 await p.waitForFunction(()=>{const s=__cerebra.studio,i=s.items.filter(i=>i.kit==='rocket').at(-1),q=CerebraRockets.inspect(i);return q?.meshes>0||q?.error;},null,{timeout:90000});
 const loaded=await p.evaluate(()=>{const q=CerebraRockets.inspect(__cerebra.studio.sel);return {loading:q.loading,error:q.error,meshes:q.meshes};});console.log(model,loaded);assert(!loaded.error&&loaded.meshes>20);
 const pixel=()=>p.evaluate(async()=>{const s=__cerebra.studio,i=s.sel;await CerebraRockets.kit.ready(i);const c=CerebraRockets.inspect(i).canvas,a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,hash=0;for(let j=0;j<a.length;j++){hash=(hash*31+a[j])|0;if(j%4===3&&a[j])n++;}return {n,hash};});
 const base=await pixel();assert(base.n>100);let previous=base;
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
const bounds=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,iframes:document.querySelectorAll('iframe').length}));assert(!bounds.overflow);assert.equal(bounds.iframes,0);
if(process.env.QA_EXPORT==='1'){const out=await p.evaluate(async()=>{const c=await __cerebra.studio.composePoster(1,true);return {w:c.width,h:c.height,size:c.toDataURL().length};});assert(out.w>0&&out.h>0&&out.size>10000);console.log('composition export',out);}
console.log('errors',errors);assert.deepEqual(errors,[]);await b.close();console.log('PASS',vp);
})().catch(e=>{console.error(e);process.exit(1)});
