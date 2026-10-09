// Aero Shards as an Animated background preset: not in the Kit list, preset button, full-frame bg layer, Customize groups, replace/restore, legacy object -> background, no shader errors.
// Serve the built repo over HTTP first. VP env selects the viewport; QA_SCREENSHOT_DIR must be outside the repository.
const {chromium}=require('playwright'),assert=require('assert');
const SHOT=process.env.QA_SCREENSHOT_DIR||require('os').tmpdir();
(async()=>{const b=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{executablePath:'/opt/pw-browsers/chromium'}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const vp=JSON.parse(process.env.VP||'{"width":1440,"height":900}');
const p=await b.newPage({viewport:vp,hasTouch:vp.width<900,isMobile:vp.width<900});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{const t=m.text();if((m.type()==='error'||/shader|compile|GLSL/i.test(t))&&!/ERR_|Failed to load|ReadPixels|KHR|GPU stall/.test(t))errs.push(t.slice(0,400))});
await p.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
await p.goto(process.env.QA_URL||'http://127.0.0.1:8000');await p.locator('#gateway').waitFor({state:'visible',timeout:90000});
await p.locator('#gateway .gateway-enter').first().click();await p.locator('[data-cl-path="guide"]').click();await p.waitForTimeout(700);
await p.locator('[data-cl-enter]').click();await p.locator('[data-cl-back]').click();await p.locator('[data-cl-enter]').click();
await p.getByRole('button',{name:'Skip and enter Studio'}).click();await p.waitForFunction(()=>__cerebra.studio.active);await p.waitForTimeout(1500);
const kitList=await p.evaluate(()=>[...document.querySelectorAll('[data-kit-types] [data-studio-kit]')].map(x=>x.dataset.studioKit));
console.log('kit list has aero',kitList.includes('aeroShards'),'threads',kitList.includes('threads'));assert(!kitList.includes('aeroShards')&&kitList.includes('threads'));
await p.locator('[data-menu-top="Image"]').click();await p.getByRole('menuitem',{name:'Animated background presets…',exact:true}).click();await p.waitForTimeout(400);
await p.locator('[data-studio-template="aeroShards"]').click();await p.waitForTimeout(3500);
const st=await p.evaluate(()=>{const s=__cerebra.studio,bg=s.backgroundItem(),U=s.U();return {n:s.items.filter(i=>i.bg).length,kit:bg?.kit,w:bg&&bg.w*U,h:bg&&bg.h*U,W:innerWidth,H:innerHeight,pe:bg&&getComputedStyle(bg.el).pointerEvents,fly:!document.querySelector('[data-fly=kitdesign]').hidden,panel:[...document.querySelectorAll('[data-kit-panel] summary')].map(x=>x.textContent),mgr:document.querySelector('[data-bg-manager]')?.innerText.replace(/\s+/g,' ')}});
console.log(JSON.stringify(st));assert(st.n===1&&st.kit==='aeroShards'&&Math.abs(st.w-st.W)<1&&Math.abs(st.h-st.H)<1&&st.pe==='none'&&st.fly);
await p.screenshot({path:`${SHOT}/aerobg-${vp.width}.png`});
const lit=await p.evaluate(()=>{const it=__cerebra.studio.backgroundItem(),c=it.el.querySelector('canvas.st-kitc'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4){if(Math.abs(d[i]-18)+Math.abs(d[i+1]-15)+Math.abs(d[i+2]-23)>30)n++;}return n/(c.width*c.height)});console.log('lit',lit.toFixed(3));assert(lit>.01);
// replace with ether and back (one background only), values kept on re-select
await p.evaluate(()=>{const s=__cerebra.studio;s.backgroundItem().p.bloom=1.7;s.setBackground('liquidEther');s.closeFly();});await p.waitForTimeout(800);
assert(await p.evaluate(()=>__cerebra.studio.items.filter(i=>i.bg).map(i=>i.kit).join())==='liquidEther');
await p.evaluate(()=>{const s=__cerebra.studio;s.setBackground('aeroShards');s.closeFly();});await p.waitForTimeout(1500);
// undo / restore / legacy object conversion
const r=await p.evaluate(async()=>{const s=__cerebra.studio;const j=s.snapshot();s.setBackground(null);s.restore(j);const bg=s.backgroundItem();const small={kind:'kit',kit:'aeroShards',x:.3,y:.3,w:.3,h:.3,decor:true,p:{bloom:.9}};const jj=JSON.parse(s.snapshot());jj.items=jj.items.filter(i=>!i.bg);jj.items.push(small);s.restore(JSON.stringify(jj));const o=s.items.find(i=>i.kit==='aeroShards');const wasObj=!o.bg;s.convertToBackground(o);const c=await s.composePoster(1,true);return {restored:bg?.kit,wasObj,nowBg:s.items.find(i=>i.kit==='aeroShards').bg,bloom:s.backgroundItem().p.bloom,w:c.width,h:c.height}});
console.log(JSON.stringify(r));assert(r.restored==='aeroShards'&&r.wasObj&&r.nowBg&&r.bloom===.9);
console.log('errors',JSON.stringify(errs));assert.deepEqual(errs,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
