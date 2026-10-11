// Real pointer/touch regression: Aero Shards animated background must NEVER rise above
// foreground artwork when Background > Customize selects it. Studio remains native.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
(async()=>{
  const vp=JSON.parse(process.env.VP||'{"width":390,"height":844}'),touch=vp.width<900,dir=process.env.QA_SCREENSHOT_DIR||os.tmpdir();
  const browser=await chromium.launch({headless:true,...(process.env.QA_CHROMIUM_PATH?{executablePath:process.env.QA_CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:vp,isMobile:vp.width<700,hasTouch:touch,deviceScaleFactor:+process.env.QA_DPR||1});
  const errors=[],optional=u=>/\/favicon\.ico(?:$|\?)/.test(u);
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&!optional(r.url()))errors.push('HTTP '+r.status()+' '+r.url());});
  page.on('requestfailed',r=>{if(!optional(r.url()))errors.push('REQUEST '+r.url()+' '+r.failure()?.errorText);});
  page.on('console',m=>{if(m.type()==='error'&&!optional(m.location().url||''))errors.push('CONSOLE '+m.text());});
  await page.addInitScript(()=>localStorage.setItem('cerebra-hide-welcome','true'));
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8000');
  await page.locator('#gateway').waitFor({state:'visible',timeout:180000});
  await page.locator('#gateway .gateway-enter').first().click();
  await page.locator('.cl-page.cl-hub-open').waitFor({state:'visible',timeout:120000});
  // The first native route defaults to Studio. Only its separate Enter opens it.
  await page.locator('[data-cl-enter]').click();
  await page.waitForTimeout(600);
  const skip=page.getByRole('button',{name:'Skip and enter Studio'});
  if(await skip.isVisible())await skip.click();
  await page.waitForFunction(()=>window.__cerebra?.studio?.active,{timeout:120000});
  await page.waitForFunction(()=>__cerebra.studio.__nativeBackgroundHitGuard,{timeout:30000});
  const state=()=>page.evaluate(()=>{
    const s=__cerebra.studio,bg=s.backgroundItem(),text=s.items.find(i=>i.kind==='text'&&i.content==='ABOVE THE SHARDS'),f=document.querySelector('#studio [data-kit-panel]');
    const r=f.getBoundingClientRect(),t=text?.el.getBoundingClientRect(),bc=bg?.el.querySelector('canvas.st-kitc');
    const hit=t&&document.elementFromPoint(t.left+t.width/2,t.top+t.height/2);
    return {bgCount:s.items.filter(i=>i.bg).length,first:s.items[0]===bg,kit:bg?.kit,sel:s.sel?.kit||s.sel?.content||null,
      bgZ:bg&&getComputedStyle(bg.el).zIndex,bgPointer:bg&&getComputedStyle(bg.el).pointerEvents,outline:bg&&getComputedStyle(bg.el.querySelector('.st-outline')).display,
      bgHit:!!bg&&s.hitItem(bg,innerWidth/2,innerHeight/2),hitText:!!text&&(hit===text.el||text.el.contains(hit)),
      textZ:text&&getComputedStyle(text.el).zIndex,canvas:bc&&{w:bc.width,h:bc.height},panel:{hidden:f.hidden,left:r.left,right:r.right,top:r.top,bottom:r.bottom,translate:getComputedStyle(f).translate},
      W:innerWidth,H:innerHeight};
  });
  // Build a real foreground object first; then trigger the native Background UI.
  await page.evaluate(()=>{
    const s=__cerebra.studio;
    s.addItem('text',{content:'ABOVE THE SHARDS',x:.79,y:.28,size:30,font:'sans',color:'#ffffff'});
  });
  await page.locator('[data-menu-top="Image"]').click();
  await page.getByRole('menuitem',{name:'Animated background presets…',exact:true}).click();
  await page.locator('[data-studio-template="aeroShards"]').click();
  await page.waitForTimeout(1700);
  let a=await state();console.log('AERO_BACKGROUND_CUSTOMIZE',JSON.stringify(a));
  assert.equal(a.bgCount,1);assert(a.first);assert.equal(a.kit,'aeroShards');assert.equal(a.sel,'aeroShards');
  assert.equal(a.bgPointer,'none');assert.equal(a.bgZ,'auto');assert.equal(a.outline,'none');assert.equal(a.bgHit,false);
  assert(a.hitText,'foreground text must remain topmost at its center when background is selected');
  assert(a.panel.hidden===false,'Customize panel should remain open');
  assert(a.panel.left>=-1&&a.panel.right<=vp.width+1,'Customize panel escaped horizontally');
  assert(a.panel.top>=-1&&a.panel.bottom<=vp.height+1,'Customize panel escaped vertically');
  await page.screenshot({path:path.join(dir,`aero-bg-selected-${vp.width}x${vp.height}.png`)});
  if(touch){
    // Simulate a leftover dragged-flyout offset; background sheet must ignore it.
    await page.evaluate(()=>document.querySelector('#studio [data-kit-panel]').style.setProperty('--fdx','-280px'));
    a=await state();console.log('AERO_MOBILE_SHIFT',JSON.stringify(a.panel));
    assert(a.panel.left>=-1&&a.panel.right<=vp.width+1,'Mobile settings panel shifted offscreen');
    await page.evaluate(()=>document.querySelector('#studio [data-kit-panel]').style.removeProperty('--fdx'));
  }
  // Native real click must select the foreground, not an invisible full-screen BG.
  await page.locator('#studio .st-text').filter({hasText:'ABOVE THE SHARDS'}).click({timeout:15000});
  a=await state();console.log('SELECT_FOREGROUND',JSON.stringify(a));
  assert.equal(a.sel,'ABOVE THE SHARDS');
  assert.equal(a.bgCount,1);assert.equal(a.bgZ,'auto');
  await page.screenshot({path:path.join(dir,`aero-bg-foreground-${vp.width}x${vp.height}.png`)});
  // Switching back to background Configure must never cover foreground again.
  await page.evaluate(()=>__cerebra.studio.customizeBackground());
  await page.waitForTimeout(200);
  a=await state();assert.equal(a.sel,'aeroShards');assert(a.hitText&&a.panel.left>=-1&&a.panel.right<=vp.width+1,JSON.stringify(a));
  // Changing a real shader control must retain layering and native Undo/history.
  await page.evaluate(()=>{const s=__cerebra.studio;const b=s.backgroundItem();b.p.bloom=1.2;s.kitRedraw(b);s.commit();});
  await page.waitForTimeout(400);
  a=await state();assert(a.hitText);assert.equal(a.bgZ,'auto');
  // GPU background frames should be reused while editing, without losing
  // a changed shader parameter or downgrading full export dimensions.
  const perf=await page.evaluate(async()=>{
    const kit=window.CerebraAeroShards,studio=__cerebra.studio;
    const c=document.createElement('canvas');c.width=160;c.height=100;
    const g=c.getContext('2d'),bg=studio.backgroundItem();
    const opts={preview:true,background:true,k:1,item:bg};
    const p={...kit.defaults,quality:'low',density:.5,bloom:0,grain:0,chromaticAberration:0};
    const frame=(t,v=p)=>kit.draw(g,160,100,t,v,opts);
    const wait=async()=>{
      for(let i=0;i<100;i++){
        const a=kit.inspect(g);
        if(a&&!a.pending&&a.width&&a.renders)return a;
        await new Promise(ok=>setTimeout(ok,50));
      }
      return kit.inspect(g);
    };
    frame(0);const initial=await wait();
    for(let i=1;i<=14;i++)frame(i/30);
    const rapid=kit.inspect(g);
    // Rapid calls may have left the async GPU readback in flight. Wait for
    // it to complete before testing parameter-bypass on this synthetic canvas.
    // Production UI also queues native redraw if the *real* item changes mid-read.
    const settledRapid=await wait();
    const updated={...p,bloom:1.25};frame(.8,updated);
    const changed=await wait();
    return {initial,rapid,settledRapid,changed};
  });
  console.log('AERO_INTERACTION_BUDGET',JSON.stringify(perf));
  assert(perf.initial?.renders>0,'background render did not initialize');
  assert(perf.rapid.skipped>perf.initial.skipped,'identical preview frames should reuse GPU results');
  assert(perf.rapid.renders<=perf.initial.renders+1,'preview interaction created excessive render passes');
  assert(perf.changed.renders>perf.settledRapid.renders,'shader parameter change must render despite live preview budget');
  assert.deepEqual(errors,[],JSON.stringify(errors));
  console.log('PASS',JSON.stringify(vp));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
