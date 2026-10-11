// Unfrozen-renderer Line Sidebar fixture: rail click/Enter, wheel, touch (CDP touch events), reduced motion, no horizontal overflow.
// Serve the built repo over HTTP first. QA_URL / QA_CHROMIUM_PATH / QA_SCREENSHOT_DIR (outside the repo) are optional.
const {chromium}=require('playwright'),assert=require('assert');
const SHOT=process.env.QA_SCREENSHOT_DIR||require('os').tmpdir();
(async()=>{const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const [name,vp,touch,reduced] of [['desktop',{width:1440,height:900},false,false],['desktop-reduced',{width:1440,height:900},false,true],['mobile',{width:390,height:844},true,false]]){
const ctx=await b.newContext({viewport:vp,hasTouch:touch,isMobile:touch,reducedMotion:reduced?'reduce':'no-preference'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto((process.env.QA_URL||'http://127.0.0.1:8000'));await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
await p.locator('#gateway .gateway-enter').first().click();await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);await p.locator('[data-cl-back]').click();await p.locator('#gateway [data-route="orbit"]').click();await p.waitForTimeout(800);await p.locator('#gateway [data-enter="orbit"]').click();await p.waitForTimeout(2500);
const cur=()=>p.evaluate(()=>({t:Math.round(__cerebra.scroll.target),y:scrollY,aria:[...document.querySelectorAll('nav.rail [data-target]')].findIndex(x=>x.getAttribute('aria-current')==='true'),rafs:0}));
await p.locator('nav.rail [data-target="2"]').click();await p.waitForTimeout(2500);let c=await cur();console.log(name,'click',JSON.stringify(c));assert.equal(c.t,2);assert.equal(c.aria,2);
await p.locator('nav.rail [data-target="3"]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(2500);c=await cur();console.log(name,'enter',JSON.stringify(c));assert.equal(c.t,3);
if(touch){const y0=c.y;await p.touchscreen.tap(200,400);await p.evaluate(()=>{});
 // swipe via touch events
 const cdp=await ctx.newCDPSession(p);const tt=(type,yy)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:200,y:yy}]});await tt('touchStart',600);for(let i=1;i<=12;i++){await tt('touchMove',600-500*i/12);await p.waitForTimeout(16);}await tt('touchEnd');await p.waitForTimeout(2500);c=await cur();console.log(name,'swipe',JSON.stringify(c),'from',y0);assert(c.y>y0);}
else{const y0=c.y;await p.mouse.move(700,450);await p.mouse.wheel(0,600);await p.waitForTimeout(2500);c=await cur();console.log(name,'wheel',JSON.stringify(c),'from',y0);const mx=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);console.log(name,'max',mx);if(!reduced)assert(c.y>y0||c.y>=mx-3);
 await p.mouse.wheel(0,-600);await p.waitForTimeout(2500);c=await cur();console.log(name,'wheel back',JSON.stringify(c));}
await p.locator('nav.rail [data-target="1"]').click();{const sm=[];for(let i=0;i<12;i++){await p.waitForTimeout(500);const q=await cur();sm.push(q.y+'/'+q.t)}if(name!=='desktop'){await p.waitForTimeout(3000)}console.log(name,'sample',sm.join(' '));}c=await cur();assert.equal(c.t,1);
const ov=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);assert(ov);
await p.screenshot({path:`${SHOT}/ls-live-${name}.png`});
console.log(name,'PASS errors',errs);assert.deepEqual(errs,[]);await ctx.close();}
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
