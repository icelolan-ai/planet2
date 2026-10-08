// Animated Background UI fixture (unfrozen renderer). Serve the built repo over HTTP first. VP='{"width":390,"height":844}' selects the viewport.
// QA_SCREENSHOT_DIR must be outside the repository. Requires an installed playwright; no app dependency.
const {chromium}=require('playwright'),assert=require('assert');
const out=process.env.QA_SCREENSHOT_DIR||require('os').tmpdir();
(async()=>{const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const p=await b.newPage({viewport:vp,hasTouch:vp.width<900,isMobile:vp.width<900});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|ReadPixels|KHR|GPU stall/.test(m.text()))errs.push(m.text())});
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto(process.env.QA_URL||'http://127.0.0.1:8000');
await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
await p.locator('#gateway .gateway-enter').first().click();
await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);
await p.locator('[data-cl-enter]').click();await p.locator('[data-cl-back]').click();await p.locator('[data-cl-enter]').click();
await p.getByRole('button',{name:'Skip and enter Studio'}).click();
await p.waitForFunction(()=>__cerebra.studio.active,{timeout:60000});
await p.waitForTimeout(1500);
const st=()=>p.evaluate(()=>{const s=__cerebra.studio,bg=s.items.filter(i=>i.bg),W=innerWidth,H=innerHeight,U=s.U();return {n:bg.length,kits:bg.map(i=>i.kit),first:s.items[0].bg===true,geo:bg[0]&&{x:bg[0].x,y:bg[0].y,w:bg[0].w*U,h:bg[0].h*U,W,H,rot:bg[0].rot},rect:bg[0]&&(r=>({l:r.left,t:r.top,w:r.width,h:r.height}))(bg[0].el.getBoundingClientRect()),pe:bg[0]&&getComputedStyle(bg[0].el).pointerEvents,fly:!document.querySelector('[data-fly=kitdesign]').hidden,kitList:[...document.querySelectorAll('[data-kit-types] [data-studio-kit]')].map(x=>x.dataset.studioKit).filter(k=>/Ether|Pillar/i.test(k)),total:s.items.length}});
await p.locator('[data-menu-top="Image"]').click();
await p.getByRole('menuitem',{name:'Animated background presets…',exact:true}).click();
await p.waitForTimeout(400);
await p.locator('[data-studio-template="liquidEther"]').click();await p.waitForTimeout(1200);
let r=await st();console.log('ether',JSON.stringify(r));
assert.equal(r.n,1);assert(r.first);assert.equal(r.pe,'none');assert(r.fly,'customize open');assert(Math.abs(r.geo.w-r.geo.W)<1&&Math.abs(r.geo.h-r.geo.H)<1);assert.equal(r.kitList.length,0);
await p.screenshot({path:`${out}/bg-ether-${vp.width}.png`});
console.log('panel',await p.evaluate(()=>[...document.querySelectorAll('[data-kit-panel] summary')].map(x=>x.textContent)));
console.log('cols',await p.evaluate(()=>{const f=document.querySelector('[data-kit-panel]');return getComputedStyle(f).gridTemplateColumns+' w='+f.offsetWidth}));
const reopen=async()=>{await p.locator('[data-menu-top="Image"]').click();await p.getByRole('menuitem',{name:'Animated background presets…',exact:true}).click();await p.waitForTimeout(400);};
await p.evaluate(()=>__cerebra.studio.closeFly());await reopen();
// reopen customize keeps values
await p.evaluate(()=>{const it=__cerebra.studio.backgroundItem();it.p.mouseForce=33;it.p.color1='#00ff88';});
await p.locator('[data-studio-template="liquidEther"]').click();await p.waitForTimeout(500);
r=await st();assert.equal(r.n,1);assert.equal(await p.evaluate(()=>__cerebra.studio.backgroundItem().p.mouseForce),33);
// switch to pillar
await p.evaluate(()=>__cerebra.studio.closeFly());await reopen();await p.locator('[data-studio-template="lightPillar"]').click();await p.waitForTimeout(1000);
r=await st();console.log('pillar',JSON.stringify(r.kits),r.n);assert.deepEqual(r.kits,['lightPillar']);assert(r.fly);
await p.screenshot({path:`${out}/bg-pillar-${vp.width}.png`});
// resize / orientation
await p.setViewportSize({width:vp.height,height:vp.width});await p.waitForTimeout(1500);
r=await st();console.log('rotated',JSON.stringify(r.geo),JSON.stringify(r.rect));assert(Math.abs(r.geo.w-r.geo.W)<1&&Math.abs(r.geo.h-r.geo.H)<1);
await p.setViewportSize(vp);await p.waitForTimeout(1500);
r=await st();assert(Math.abs(r.geo.w-r.geo.W)<1&&Math.abs(r.geo.h-r.geo.H)<1);
// canvas click does not select the background / drag does nothing
await p.evaluate(()=>{__cerebra.studio.closeFly();__cerebra.studio.select(null)});const before=await p.evaluate(()=>JSON.stringify(__cerebra.studio.backgroundItem().p));await p.mouse.move(vp.width*.8,vp.height*.3);await p.mouse.down();await p.mouse.move(vp.width*.3,vp.height*.6,{steps:8});await p.mouse.up();await p.mouse.click(vp.width*.85,vp.height*.8);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>__cerebra.studio.sel?.bg===true),false);assert.equal(await p.evaluate(()=>JSON.stringify(__cerebra.studio.backgroundItem().p)),before);assert.equal(await p.evaluate(()=>{const b=__cerebra.studio.backgroundItem();return b.x+','+b.y}),'0.5,0.5');
console.log('sel after click',await p.evaluate(()=>__cerebra.studio.sel&&(__cerebra.studio.sel.kit||__cerebra.studio.sel.kind)));
// Thai + layers list
await p.evaluate(()=>__cerebraLanguage.set('th'));await p.waitForTimeout(300);await p.evaluate(()=>__cerebra.studio.renderLayers());await p.locator('[data-menu-top="Image"]').click();await p.getByRole('menuitem',{name:'พรีเซ็ตพื้นหลังเคลื่อนไหว…'}).click();await p.waitForTimeout(400);console.log('th manager',await p.locator('[data-bg-manager]').innerText());await p.evaluate(()=>__cerebra.studio.closeFly());await p.screenshot({path:out+'/bg-th-'+vp.width+'.png'});await p.evaluate(()=>__cerebraLanguage.set('en'));
// hide / undo / redo / project round trip
await p.evaluate(()=>{const s=__cerebra.studio;s.setBackground('lightPillar');});
await p.evaluate(()=>{const s=__cerebra.studio;const it=s.backgroundItem();it.hide=true;s.place(it);s.commit();});
await p.evaluate(()=>__cerebra.studio.undo());await p.waitForTimeout(300);
assert.equal(await p.evaluate(()=>__cerebra.studio.backgroundItem().hide||false),false);
await p.evaluate(()=>__cerebra.studio.redo());await p.waitForTimeout(300);
assert.equal(await p.evaluate(()=>!!__cerebra.studio.backgroundItem().hide),true);
const snap=await p.evaluate(()=>{const s=__cerebra.studio;const it=s.backgroundItem();it.hide=false;it.p.intensity=1.7;s.commit();const j=s.snapshot();s.setBackground(null);s.restore(j);const b=s.backgroundItem();return {bg:!!b,i:b&&b.p.intensity,first:s.items[0]===b}});
console.log('restore',JSON.stringify(snap));assert(snap.bg&&snap.i===1.7&&snap.first);
// legacy project migration
const legacy=await p.evaluate(()=>{const s=__cerebra.studio,U=s.U();const j=JSON.parse(s.snapshot());j.items=j.items.filter(i=>!i.bg);j.items.push({kind:'kit',kit:'liquidEther',x:.5,y:.5,w:(innerWidth+4)/U,h:(innerHeight+4)/U,decor:true,tpl:'liquidEther',p:{mouseForce:41},opacity:.8,seed:5});j.items.push({kind:'kit',kit:'lightPillar',x:.3,y:.3,w:.3,h:.3,decor:true,p:{}});s.restore(JSON.stringify(j));const bg=s.items.filter(i=>i.bg);return {bg:bg.map(i=>i.kit),mf:bg[0]?.p.mouseForce,op:bg[0]?.opacity,objects:s.items.filter(i=>i.kit==='lightPillar'&&!i.bg).length,tpl:bg[0]?.tpl}});
console.log('legacy',JSON.stringify(legacy));assert.deepEqual(legacy.bg,['liquidEther']);assert.equal(legacy.mf,41);assert.equal(legacy.objects,1);
// zoom / scale / shift cannot detach the background
let zs=await p.evaluate(()=>{const s=__cerebra.studio;const bg=s.backgroundItem();s.select(bg);s.zoomStep(1.6);s.setScaleOf(bg,2.5);s.place(bg);const U=s.U();const a={w:bg.w*U,h:bg.h*U,W:innerWidth,H:innerHeight};s.shift={x:70,y:-40};s.stage.style.transform='translate(70px,-40px)';s.place(bg);return a});await p.waitForTimeout(600);const zr=await p.evaluate(()=>{const s=__cerebra.studio,r=s.backgroundItem().el.getBoundingClientRect();const o={l:r.left,t:r.top,w:r.width,h:r.height};s.shift=null;s.stage.style.transform='';s.place(s.backgroundItem());return o});zs={a:zs,r:zr};
console.log('zoomshift',JSON.stringify(zs));assert(Math.abs(zs.a.w-zs.a.W)<1&&Math.abs(zs.r.l)<1&&Math.abs(zs.r.t)<1&&Math.abs(zs.r.w-zs.a.W)<1);
// export fills the frame
const ex=await p.evaluate(async()=>{const s=__cerebra.studio;s.setBackground('lightPillar');await new Promise(r=>setTimeout(r,1500));const c=await s.composePoster(1,true);const g=c.getContext('2d');const px=(x,y)=>[...g.getImageData(x,y,1,1).data];return {w:c.width,h:c.height,corners:[px(2,2),px(c.width-3,2),px(2,c.height-3),px(c.width-3,c.height-3)]}});
console.log('export',JSON.stringify(ex));
await p.screenshot({path:`${out}/bg-final-${vp.width}.png`});
console.log('PASS',vp,'errors',errs);assert.deepEqual(errs,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
