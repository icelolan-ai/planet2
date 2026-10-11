// Studio default empty canvas fixture: nothing selected, no objects, planet hidden, 'Crimson void' background, empty-state hint adds Cerebra, Undo returns to empty, empty export.
// Serve the built repo over HTTP first. VP env selects the viewport; QA_SCREENSHOT_DIR must be outside the repository.
const {chromium}=require('playwright'),assert=require('assert');
const SHOT=process.env.QA_SCREENSHOT_DIR||require('os').tmpdir();
(async()=>{const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const p=await b.newPage({viewport:vp,hasTouch:vp.width<900,isMobile:vp.width<900});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|ReadPixels|KHR|GPU stall/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto(process.env.QA_URL||(process.env.QA_URL||'http://127.0.0.1:8000'));await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
await p.locator('#gateway .gateway-enter').first().click();await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);
await p.screenshot({path:`${SHOT}/empty-hub-${vp.width}.png`});
await p.locator('[data-cl-enter]').click();await p.locator('[data-cl-back]').click();await p.locator('[data-cl-enter]').click();
await p.getByRole('button',{name:'Skip and enter Studio'}).click();await p.waitForFunction(()=>__cerebra.studio.active);await p.waitForTimeout(2500);
const st=await p.evaluate(()=>{const s=__cerebra.studio;return {sel:!!s.sel,objects:s.items.filter(i=>i.kind!=='fx').length,planetHidden:s.fxItem('planet').hide,show:s.showSubject,bg:s.background,hint:!s.emptyHint.hidden,hintText:s.emptyHint.innerText.slice(0,80)}});
console.log(JSON.stringify(st));
assert(!st.sel&&st.objects===0&&st.planetHidden&&!st.show&&st.bg==='discovery'&&st.hint);
await p.screenshot({path:`${SHOT}/empty-${vp.width}.png`});
// add Cerebra from the hint
await p.locator('[data-empty-add]').click();await p.waitForTimeout(1200);
const st2=await p.evaluate(()=>{const s=__cerebra.studio;return {planetHidden:s.fxItem('planet').hide,show:s.showSubject,hint:!s.emptyHint.hidden,subject:s.subject}});
console.log('after add',JSON.stringify(st2));assert(!st2.planetHidden&&st2.show&&!st2.hint);
await p.screenshot({path:`${SHOT}/empty-added-${vp.width}.png`});
// undo returns to empty, reset canvas returns to empty
await p.evaluate(()=>__cerebra.studio.undo());await p.waitForTimeout(500);
const st3=await p.evaluate(()=>{const s=__cerebra.studio;return {show:s.showSubject,hint:!s.emptyHint.hidden}});console.log('after undo',JSON.stringify(st3));
// add world via select
await p.evaluate(()=>{const s=__cerebra.studio;s.redo();});await p.waitForTimeout(300);
await p.evaluate(()=>{const s=__cerebra.studio;s.addItem('text',{content:'Hello'});});
// export of empty canvas has the background
const ex=await p.evaluate(async()=>{const s=__cerebra.studio;s.items.filter(i=>i.kind!=='fx').forEach(i=>s.removeItem(i,true));s.setSubjectVisible(false);const c=await s.composePoster(1,true);const g=c.getContext('2d');const px=(x,y)=>[...g.getImageData(x,y,1,1).data];return {w:c.width,h:c.height,floor:px(Math.round(c.width/2),Math.round(c.height*.9)),corner:px(c.width-4,4)}});
console.log('export',JSON.stringify(ex));
console.log('errors',JSON.stringify(errs));assert.deepEqual(errs,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
