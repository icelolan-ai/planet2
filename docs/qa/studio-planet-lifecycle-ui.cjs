// Studio planet lifecycle fixture: Add-planet menu (incl. reserved disabled 3D-file entry), add Cerebra, customise, delete from Layers, Undo/Redo, re-add = factory defaults, add a world.
// Serve the built repo over HTTP first. VP env selects the viewport; QA_SCREENSHOT_DIR must be outside the repository.
const {chromium}=require('playwright'),assert=require('assert');
const SHOT=process.env.QA_SCREENSHOT_DIR||require('os').tmpdir();
(async()=>{const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const p=await b.newPage({viewport:vp,hasTouch:vp.width<900,isMobile:vp.width<900});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|ReadPixels|KHR|GPU stall/.test(m.text()))errs.push(m.text().slice(0,300))});
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto(process.env.QA_URL||(process.env.QA_URL||'http://127.0.0.1:8000'));await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
await p.locator('#gateway .gateway-enter').first().click();await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);
await p.locator('[data-cl-enter]').click();await p.locator('[data-cl-back]').click();await p.locator('[data-cl-enter]').click();
await p.getByRole('button',{name:'Skip and enter Studio'}).click();await p.waitForFunction(()=>__cerebra.studio.active);await p.waitForTimeout(2500);
const info=()=>p.evaluate(()=>{const s=__cerebra.studio,pl=s.fxItem('planet');return {present:s.planetPresent(),deleted:pl.deleted,hide:pl.hide,show:s.showSubject,hint:!s.emptyHint.hidden,subject:s.subject,rows:[...document.querySelectorAll('[data-studio-objects] .st-layer')].map(x=>x.textContent.trim().slice(0,12)),layers:JSON.stringify(s.layers),tune:JSON.stringify(window.CerebraTune.snapshot())}});
const i0=await info();console.log('start',JSON.stringify({...i0,tune:i0.tune.length,layers:undefined}));assert(!i0.present&&i0.deleted&&i0.hint&&!i0.rows.some(r=>/Cerebra/.test(r)));
// add via Layers header menu
await p.evaluate(()=>{const l=__cerebra.studio.trays.layers;if(l.classList.contains('is-folded'))document.querySelector('[data-layers-fold]').click();});await p.waitForTimeout(500);await p.locator('[data-add-planet]').click();await p.waitForTimeout(300);
const menu=await p.evaluate(()=>[...document.querySelectorAll('.st-planetmenu [data-pm]')].map(b=>b.dataset.pm+(b.disabled?'(disabled)':'')+':'+b.textContent.trim().slice(0,18)));console.log('menu',JSON.stringify(menu));
assert(menu.some(m=>m.startsWith('cerebra'))&&menu.some(m=>m.startsWith('file3d(disabled)')));
await p.locator('.st-planetmenu [data-pm="cerebra"]').click();await p.waitForTimeout(1200);
const base=await info();console.log('added',JSON.stringify({...base,tune:base.tune.length,layers:undefined}));assert(base.present&&base.rows.some(r=>/Cerebra/.test(r))&&!base.hint);
// customise: tune + layer flags + planet item opacity + pan/zoom
await p.evaluate(()=>{const s=__cerebra.studio;const t=window.CerebraTune.snapshot();window.CerebraTune.apply({...t,theme:'toxic',neon:'#9dff4c'});s.layers.atmo=false;s.coreLayers[1]=false;s.fxItem('planet').alpha=.4;s.x=.2;});
const dirty=await info();assert(dirty.tune!==base.tune&&dirty.layers!==base.layers);
// delete via Layers trash
await p.locator('.st-pdel').click();await p.waitForTimeout(600);
const del=await info();console.log('deleted',JSON.stringify({...del,tune:del.tune.length,layers:undefined}));assert(!del.present&&del.hint&&!del.rows.some(r=>/Cerebra/.test(r)));
// undo restores presence, redo deletes again
await p.evaluate(()=>__cerebra.studio.undo());await p.waitForTimeout(500);const u=await info();console.log('undo',u.present);assert(u.present);
await p.evaluate(()=>__cerebra.studio.redo());await p.waitForTimeout(500);const r2=await info();assert(!r2.present&&r2.hint);
// add again: must be fresh defaults, not the customised ones
await p.locator('[data-empty-add]').click();await p.waitForTimeout(1200);
const fresh=await info();console.log('fresh equals first default',fresh.tune===base.tune,fresh.layers===base.layers);
const ex=await p.evaluate(()=>{const s=__cerebra.studio,pl=s.fxItem('planet');return {alpha:pl.alpha,x:s.x}});console.log('item',JSON.stringify(ex));
assert(fresh.present&&fresh.tune===base.tune&&fresh.layers===base.layers&&ex.alpha===1&&ex.x===0);
// replace with a world (if loaded) using the dock select path while present: fresh too
const worlds=await p.evaluate(()=>__cerebra.app?.orrery?.worlds?.length??window.__cerebra.orrery.worlds.length);console.log('worlds loaded',worlds);
if(worlds>0){await p.evaluate(()=>{const s=__cerebra.studio;s.addPlanet(0);});await p.waitForTimeout(800);const w=await info();console.log('world',JSON.stringify({present:w.present,subject:w.subject}));assert(w.present&&w.subject===0);
 await p.evaluate(()=>{__cerebra.studio.deletePlanet();});await p.waitForTimeout(300);assert(!(await info()).present);}
await p.screenshot({path:`${SHOT}/planet-${vp.width}.png`});
console.log('errors',JSON.stringify(errs));assert.deepEqual(errs,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
