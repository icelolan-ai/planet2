/* Fullscreen modal top-layer regression and phase-A minimal shell smoke QA. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
(async()=>{
 const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}'),touch=vp.width<900,dir=process.env.QA_SCREENSHOT_DIR||os.tmpdir();
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const p=await browser.newPage({viewport:vp,isMobile:vp.width<700,hasTouch:touch,deviceScaleFactor:+process.env.QA_DPR||1});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
 await p.goto(process.env.QA_URL||'http://127.0.0.1:8000');
 await p.locator('#gateway').waitFor({state:'visible',timeout:180000});
 await p.locator('#gateway .gateway-enter').first().click();
 await p.locator('.cl-page.cl-hub-open[open]').waitFor({state:'visible',timeout:120000});
 assert(await p.locator('style[data-ui-minimal-foundation]').count(),'minimal theme was not injected');
 const getHit=()=>p.evaluate(()=>{
   const b=document.querySelector('[data-cl-enter]'),r=b.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
   const e=document.elementFromPoint(x,y);
   return {tag:e?.tagName,classes:e?.className,hit:e===b||b.contains(e),x,y,fullscreen:document.fullscreenElement?.className||null,
    dialogOpen:!!document.querySelector('.cl-page[open]')};
 });
 const full=p.locator('.cl-fullscreen'),available=await full.isVisible();
 let entered=false;
 if(available){
   await full.click();
   await p.waitForTimeout(350);
   let hit=await getHit();console.log('fullscreen native modal',hit);
   if(hit.fullscreen){
     entered=true;
     assert(String(hit.fullscreen).includes('cl-page'),JSON.stringify(hit));
     assert(hit.hit,'Enter button must be reachable while the modal is fullscreen');
   }
 }
 await p.locator('[data-cl-path="guide"]').click();
 await p.locator('[data-cl-enter]').click();
 await p.locator('[data-cl-guide]').waitFor({state:'visible'});
 await p.locator('[data-cl-chapter="design"]').click();
 assert((await p.locator('[data-cl-content]').innerText()).length>90);
 await p.locator('[data-cl-search]').fill('effect');
 assert((await p.locator('[data-cl-content]').innerText()).length>10);
 await p.locator('[data-cl-back]').click();
 await p.locator('.cl-page.cl-hub-open').waitFor({state:'visible'});
 const afterGuide=await getHit();console.log('after fullscreen guide and Back',afterGuide);
 assert(afterGuide.hit,'Enter must stay interactive after visiting the guide');
 await p.screenshot({path:path.join(dir,`fullscreen-guide-return-${vp.width}x${vp.height}.png`)});
 await p.locator('[data-cl-path="studio"]').click();
 await p.locator('[data-cl-enter]').click();
 const skip=p.getByRole('button',{name:'Skip and enter Studio'});
 if(await skip.isVisible({timeout:5000}).catch(()=>false))await skip.click();
 await p.waitForFunction(()=>window.__cerebra?.studio?.active,{timeout:120000});
 const state=await p.evaluate(()=>{
   const panel=document.querySelector('#studio .st-dock');
   const st=panel&&getComputedStyle(panel);
   return {full:!!document.fullscreenElement,studioOn:document.body.classList.contains('studio-on'),
     panel:!!panel,ui:!!document.querySelector('style[data-ui-minimal-foundation]'),panelBorder:st?.borderColor};
 });
 console.log('after fullscreen -> Studio',state);
 assert(state.studioOn&&state.ui&&state.panel);
 if(entered)assert(!state.full,'closing fullscreen launch dialog should release Fullscreen before Studio interactions');
 await p.locator('#studio .st-menu-exit').click({timeout:15000});
 await p.locator('.cl-page.cl-hub-open').waitFor({state:'visible'});
 await p.locator('[data-cl-path="planets"]').click();
 await p.locator('[data-cl-enter]').click();
 await p.locator('#atelier').waitFor({state:'visible',timeout:90000});
 await p.locator('[data-at-back]').click();
 await p.locator('.cl-page.cl-hub-open').waitFor({state:'visible'});
 await p.screenshot({path:path.join(dir,`minimal-shell-return-${vp.width}x${vp.height}.png`)});
 assert.deepEqual(errors,[],JSON.stringify(errors));
 console.log('PASS fullscreen modal / Studio / Guide / Explore / minimal shell',vp,'wasFullscreen',entered);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
