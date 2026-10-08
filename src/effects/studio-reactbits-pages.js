/* React Bits-inspired page motion, implemented for Cerebra's vanilla runtime.
 * References: reactbits.dev/text-animations/rotating-text and
 * reactbits.dev/animations/crystalized-ball. No React/OGL dependency or canvas
 * artwork mutation: these are presentation-only effects, not Studio layers. */
(() => {
  function boot() {
    const app = window.__cerebra, page = document.querySelector('.cl-page');
    if (!app?.entry?.launchPaths || !page || !window.__cerebraLanguage) { setTimeout(boot, 180); return; }
    if (page.dataset.bitsReady) return;
    page.dataset.bitsReady = 'true';
    const language = window.__cerebraLanguage;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const css = document.createElement('style');
    css.textContent = `
      .cl-rotating-line{position:relative;display:inline-grid;vertical-align:bottom;overflow:hidden;line-height:1.4;isolation:isolate}
      .cl-rotating-line>span{grid-area:1/1;white-space:nowrap}.cl-rotating-reserve{visibility:hidden;pointer-events:none}
      .cl-rotating-word{display:inline-block;white-space:nowrap}.cl-rotating-char{display:inline-block;white-space:pre}
      .cl-rotating-out{position:absolute!important;inset:0;pointer-events:none}
      .cl-hero h1[data-cl-rotating]{line-height:1.1;max-width:100%;pointer-events:none}
      .cl-ready-prefix{display:block;font:400 clamp(17px,2.5vw,26px)/1.4 var(--cl-body);letter-spacing:.04em;color:#b5bed2}
      .cl-hero .cl-rotating-line{color:#f3b4d0;line-height:1.3}
      .cl-guide-rotating{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#b5bed2;font:16px/1.5 var(--cl-body)}
      .cl-guide-rotating .cl-rotating-line{color:#f3f1f4;background:#354054;padding:0 10px;border-radius:5px;min-width:90px}
      .cl-crystal{position:absolute;pointer-events:none;overflow:hidden;contain:layout paint;z-index:0;opacity:.9}
      .cl-crystal canvas{display:block;width:100%;height:100%}.cl-hero>.cl-crystal{width:clamp(180px,34vw,390px);height:clamp(180px,34vw,390px);right:-25px;top:50%;transform:translateY(-50%)}
      .cl-hero:has(.cl-crystal) .cl-art,.cl-hero:has(.cl-crystal) .cl-orbit{visibility:hidden}
      .cl-guide-head{position:relative;isolation:isolate}.cl-guide-head>.cl-crystal{width:170px;height:170px;right:30%;top:-30px;opacity:.45;z-index:-1}
      .cl-guide-head>div:not(.cl-crystal),.cl-guide-head input{position:relative;z-index:1}
      @media(max-width:760px){.cl-hero>.cl-crystal{width:220px;height:220px;right:-25px;opacity:.65}.cl-guide-head>.cl-crystal{right:-35px;top:-10px;width:150px;height:150px;opacity:.3}}
      @media(max-height:620px){.cl-ready-prefix{font-size:13px;line-height:1.2}.cl-hero .cl-rotating-line{line-height:1.2}.cl-hero>.cl-crystal{width:140px;height:140px;right:0}}
    `;
    document.head.append(css);
    const hero = page.querySelector('.cl-hero h1');
    hero.dataset.clRotating = '';
    hero.setAttribute('aria-label', 'Choose your path');
    const prefix = document.createElement('span');prefix.className = 'cl-ready-prefix';
    const rotating = document.createElement('span');rotating.className = 'cl-rotating-line';rotating.setAttribute('aria-hidden','true');
    hero.replaceChildren(prefix, rotating);
    const guide = page.querySelector('.cl-guide-head p');
    guide.dataset.clRotating = '';guide.className = 'cl-guide-rotating';
    const guidePrefix = document.createElement('span');
    const guideWord = document.createElement('span');guideWord.className = 'cl-rotating-line';guideWord.setAttribute('aria-hidden','true');
    guide.replaceChildren(guidePrefix, guideWord);
    let animations = [], guideIndex = 0, timer = 0, previous = '', previousGuide = '', previousLanguage = '';
    const active = () => page.open && !document.hidden;
    const segments = text => typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(language.current, {granularity:'grapheme'}).segment(text)].map(s=>s.segment)
      : [text]; // Never split Thai combining marks when Segmenter is unavailable.
    function wordNode(text) {
      const node = document.createElement('span');node.className = 'cl-rotating-word';
      for (const char of segments(text)) {const span=document.createElement('span');span.className='cl-rotating-char';span.textContent=char;node.append(span);}
      return node;
    }
    function rotate(host, text, words) {
      if (host.dataset.word === text) return;
      host.dataset.word = text;
      host.getAnimations({subtree:true}).forEach(a=>a.cancel());
      host.querySelectorAll('.cl-rotating-out').forEach(n=>n.remove());
      let reserve = host.querySelector('.cl-rotating-reserve');
      if (!reserve) {reserve=document.createElement('span');reserve.className='cl-rotating-reserve';host.prepend(reserve);}
      reserve.textContent = words.reduce((a,b)=>a.length>b.length?a:b,'');
      const old=host.querySelector('.cl-rotating-word'), next=wordNode(text);
      if (old) old.classList.add('cl-rotating-out');host.append(next);
      if (reduced.matches || !active()) {old?.remove();return;}
      const chars=[...next.children];
      chars.forEach((c,i)=>animations.push(c.animate([{transform:'translateY(110%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:560,delay:(chars.length-1-i)*20,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})));
      if (old) {const exit=old.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-120%)',opacity:0}],{duration:260,easing:'ease-in'});exit.finished.then(()=>old.remove()).catch(()=>old.remove());animations.push(exit);}
      animations=animations.filter(a=>a.playState!=='finished');
    }
    const hubWords=()=>language.current==='th'?['สร้างสรรค์','เรียนรู้','สำรวจ']:['Create','Learn','Explore'];
    const guideWords=()=>language.current==='th'?['สร้างสรรค์','เคลื่อนไหว','ส่งออก']:['Create','Animate','Export'];
    function sync() {
      clearTimeout(timer);timer=0;
      if (previousLanguage!==language.current) {
        previousLanguage=language.current;
        prefix.textContent=language.current==='th'?'พื้นที่สำหรับ':'A space to';
        guidePrefix.textContent=language.current==='th'?'เรียนรู้วิธี':'Learn to';
        hero.setAttribute('aria-label',language.current==='th'?'เลือกเส้นทางของคุณ':'Choose your path');
        guide.setAttribute('aria-label',language.current==='th'?'เรียนรู้วิธีสร้างสรรค์ เคลื่อนไหว และส่งออก':'Learn to create, animate and export');
      }
      const selected=page.querySelector('[data-cl-path].is-selected')?.dataset.clPath||'studio';
      const index=['studio','guide','planets'].indexOf(selected),words=hubWords();
      if(previous!==selected+language.current){rotate(rotating,words[Math.max(0,index)],words);previous=selected+language.current;}
      const wordsGuide=guideWords();rotate(guideWord,wordsGuide[guideIndex],wordsGuide);
      const guideVisible=active()&&!page.querySelector('[data-cl-guide]').hidden;
      if(guideVisible&&!reduced.matches)timer=setTimeout(()=>{guideIndex=(guideIndex+1)%wordsGuide.length;sync();},2800);
      if(!active()) {animations.forEach(a=>a.cancel());animations=[];}
      if(previousGuide!==String(guideVisible)){previousGuide=String(guideVisible);}
    }
    // Source electric rim / GPU dust, using this page's existing clock.
    const crystals=[];let frame=0,last=0,clock=0;
    function crystal(root, size, color) {
      const host=document.createElement('div');host.className='cl-crystal';host.setAttribute('aria-hidden','true');
      const canvas=document.createElement('canvas');host.append(canvas);root.append(host);
      const ctx=canvas.getContext('2d');if(!ctx){host.remove();return;}
      const item={host,canvas,ctx,settings:{...window.CerebraCrystalBall.defaults,color},x:0,y:0};crystals.push(item);
      new ResizeObserver(()=>{const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(host.clientWidth*dpr));canvas.height=Math.max(1,Math.round(host.clientHeight*dpr));draw(item,clock);}).observe(host);
    }
    function draw(item,t) {
      if(!active()||!item.host.getClientRects().length)return;
      const dpr=Math.min(devicePixelRatio||1,2),w=item.host.clientWidth,h=item.host.clientHeight;
      if(item.canvas.width!==Math.round(w*dpr)||item.canvas.height!==Math.round(h*dpr)){item.canvas.width=Math.max(1,Math.round(w*dpr));item.canvas.height=Math.max(1,Math.round(h*dpr));}
      window.CerebraCrystalBall.draw(item.ctx,w,h,dpr,t,item.settings,reduced.matches);
    }
    crystal(page.querySelector('.cl-hero'),innerWidth<760?260:360,'#ec7ba8');
    crystal(page.querySelector('.cl-guide-head'),100,'#9478ff');
    window.CerebraCrystalBall.pages=crystals;
    // A subdued, customizable backdrop stays behind all route controls.
    const laserHost=document.createElement('div');laserHost.className='cl-page-laser';laserHost.setAttribute('aria-hidden','true');
    const laserCanvas=document.createElement('canvas');laserHost.append(laserCanvas);page.append(laserHost);
    css.textContent+='.cl-page{isolation:isolate}.cl-page-laser{position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden}.cl-page:not(.cl-hub-open) .cl-page-laser{display:none}.cl-hub-open [data-cl-hub]{position:relative;isolation:isolate}.cl-bg-choose{position:relative;font:12px/1.4 var(--cl-body)}.cl-bg-choose summary{cursor:pointer;list-style:none;border:1px solid #354054;padding:7px 10px;border-radius:6px;color:#b5bed2;min-height:34px;box-sizing:border-box}.cl-bg-panel{position:absolute;bottom:calc(100% + 10px);left:0;z-index:10;width:min(280px,calc(100vw - 48px));max-height:min(420px,60dvh);overflow:auto;background:#191e2e;border:1px solid #56617b;border-radius:10px;padding:14px;box-shadow:0 15px 40px #0008}.cl-bg-panel label{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center;margin:8px 0;min-height:36px}.cl-bg-panel input,.cl-bg-panel select{width:100%;min-width:0;min-height:36px;box-sizing:border-box;accent-color:#ec7ba8;background:#252d40;border:1px solid #56617b;border-radius:5px;color:#f3f1f4}.cl-bg-panel input[type=color]{padding:3px}.cl-bg-panel input[type=checkbox]{width:22px;height:22px;min-height:22px;justify-self:end}.cl-bg-panel button{width:100%;min-height:40px;background:#354054;border:1px solid #56617b;border-radius:6px;color:#f3f1f4;font:inherit;cursor:pointer}.cl-bg-panel .cl-bg-note{font-size:12px;line-height:1.6;color:#b5bed2}.cl-hub-open .cl-slide-hint{display:none}';
    const settings=document.createElement('details');settings.className='cl-bg-choose';settings.dataset.clBg='';
    css.textContent+='.cl-bg-panel [hidden]{display:none!important}.cl-bg-panel{width:min(480px,calc(100vw - 48px))}@media(min-width:650px){.cl-bg-panel{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px}.cl-bg-panel>button,.cl-bg-panel>.cl-bg-note,.cl-bg-panel>label:first-child{grid-column:1/-1}}';
    settings.innerHTML="<summary data-bg-title>Backdrop</summary><div class=\"cl-bg-panel\"><label><span data-bg-label=\"kind\">Style</span><select data-bg-key=\"kind\"><option value=\"lightPillar\">Light Pillar</option><option value=\"liquidEther\">Liquid Ether</option><option value=\"colourFlow\">Colour flow</option><option value=\"off\">Off</option></select></label><label data-bg-shared><span data-bg-label=\"color1\">Top colour</span><input type=\"color\" data-bg-key=\"color1\"></label><label data-bg-shared><span data-bg-label=\"color2\">Bottom colour</span><input type=\"color\" data-bg-key=\"color2\"></label><label data-bg-ether><span data-bg-label=\"color3\">Colour 3</span><input type=\"color\" data-bg-key=\"color3\"></label><label data-bg-legacy><span data-bg-label=\"intensity\">Intensity</span><input type=\"range\" data-bg-key=\"intensity\" min=\"0\" max=\"3\" step=\"0.1\"></label><label data-bg-shared><span data-bg-label=\"opacity\">Backdrop opacity</span><input type=\"range\" data-bg-key=\"opacity\" min=\"0\" max=\"1\" step=\"0.05\"></label><label data-bg-legacy><span data-bg-label=\"speed\">Rotation speed</span><input type=\"range\" data-bg-key=\"speed\" min=\"0\" max=\"2\" step=\"0.1\"></label><label data-bg-ether><span data-bg-label=\"viscosity\">Viscosity</span><input type=\"range\" data-bg-key=\"viscosity\" min=\"1\" max=\"100\" step=\"1\"></label><label data-bg-pillar><span data-bg-label=\"glowAmount\">Glow amount</span><input type=\"range\" data-bg-key=\"glowAmount\" min=\"0.001\" max=\"0.02\" step=\"0.001\"></label><label data-bg-pillar><span data-bg-label=\"pillarWidth\">Pillar width</span><input type=\"range\" data-bg-key=\"pillarWidth\" min=\"1\" max=\"10\" step=\"0.1\"></label><label data-bg-pillar><span data-bg-label=\"pillarHeight\">Pillar height</span><input type=\"range\" data-bg-key=\"pillarHeight\" min=\"0.1\" max=\"2\" step=\"0.1\"></label><label data-bg-pillar><span data-bg-label=\"noiseIntensity\">Noise intensity</span><input type=\"range\" data-bg-key=\"noiseIntensity\" min=\"0\" max=\"2\" step=\"0.1\"></label><label data-bg-pillar><span data-bg-label=\"rotation\">Pillar rotation</span><input type=\"range\" data-bg-key=\"rotation\" min=\"0\" max=\"360\" step=\"1\"></label><label data-bg-pillar><span data-bg-label=\"interactive\">Pointer interaction</span><input type=\"checkbox\" data-bg-key=\"interactive\"></label><label data-bg-pillar><span data-bg-label=\"mixBlendMode\">Blend mode</span><select data-bg-key=\"mixBlendMode\"><option value=\"normal\">Normal</option><option value=\"screen\">Screen</option><option value=\"darken\">Darken</option><option value=\"lighten\">Lighten</option><option value=\"color-dodge\">Color Dodge</option><option value=\"luminosity\">Luminosity</option></select></label><label data-bg-pillar><span data-bg-label=\"quality\">Quality</span><select data-bg-key=\"quality\"><option value=\"low\">Low</option><option value=\"medium\">Medium</option><option value=\"high\">High</option></select></label><label data-bg-ether><span data-bg-label=\"mouseForce\">Mouse force</span><input type=\"range\" data-bg-key=\"mouseForce\" min=\"0\" max=\"60\" step=\"1\"></label><label data-bg-ether><span data-bg-label=\"cursorSize\">Cursor size</span><input type=\"range\" data-bg-key=\"cursorSize\" min=\"10\" max=\"300\" step=\"5\"></label><label data-bg-ether><span data-bg-label=\"resolution\">Resolution</span><input type=\"range\" data-bg-key=\"resolution\" min=\"0.2\" max=\"0.5\" step=\"0.05\"></label><label data-bg-ether><span data-bg-label=\"iterationsPoisson\">Pressure iterations</span><input type=\"range\" data-bg-key=\"iterationsPoisson\" min=\"1\" max=\"64\" step=\"1\"></label><label data-bg-ether><span data-bg-label=\"iterationsViscous\">Viscosity iterations</span><input type=\"range\" data-bg-key=\"iterationsViscous\" min=\"1\" max=\"64\" step=\"1\"></label><label data-bg-ether><span data-bg-label=\"autoSpeed\">Auto speed</span><input type=\"range\" data-bg-key=\"autoSpeed\" min=\"0\" max=\"1\" step=\"0.05\"></label><label data-bg-ether><span data-bg-label=\"autoIntensity\">Auto intensity</span><input type=\"range\" data-bg-key=\"autoIntensity\" min=\"0\" max=\"4\" step=\"0.1\"></label><label data-bg-ether><span data-bg-label=\"dt\">Simulation step</span><input type=\"range\" data-bg-key=\"dt\" min=\"0.005\" max=\"0.05\" step=\"0.001\"></label><label data-bg-ether><span data-bg-label=\"takeoverDuration\">Pointer takeover</span><input type=\"range\" data-bg-key=\"takeoverDuration\" min=\"0\" max=\"1\" step=\"0.05\"></label><label data-bg-ether><span data-bg-label=\"autoResumeDelay\">Auto resume delay</span><input type=\"range\" data-bg-key=\"autoResumeDelay\" min=\"0\" max=\"5000\" step=\"100\"></label><label data-bg-ether><span data-bg-label=\"autoRampDuration\">Auto ramp duration</span><input type=\"range\" data-bg-key=\"autoRampDuration\" min=\"0\" max=\"2\" step=\"0.1\"></label><label data-bg-ether><span data-bg-label=\"autoDemo\">Auto animate</span><input type=\"checkbox\" data-bg-key=\"autoDemo\"></label><label data-bg-ether><span data-bg-label=\"isViscous\">Viscous</span><input type=\"checkbox\" data-bg-key=\"isViscous\"></label><label data-bg-ether><span data-bg-label=\"isBounce\">Bounce edges</span><input type=\"checkbox\" data-bg-key=\"isBounce\"></label><label data-bg-ether><span data-bg-label=\"BFECC\">BFECC detail</span><input type=\"checkbox\" data-bg-key=\"BFECC\"></label><label data-bg-ether><span data-bg-label=\"lightMode\">Light mode</span><input type=\"checkbox\" data-bg-key=\"lightMode\"></label><label data-bg-ether><span data-bg-label=\"backgroundColor\">Background colour</span><input type=\"color\" data-bg-key=\"backgroundColor\"></label><button type=\"button\" data-bg-reset>Reset backdrop</button><p class=\"cl-bg-note\">Swipe or use arrow keys to choose. Press Enter to open.</p></div>";
    page.querySelector('.cl-slide-footer').prepend(settings);
    const backdrop={...window.CerebraLiquidEther.defaults,...window.CerebraLightPillar.defaults,kind:'lightPillar',color3:'#b497cf',opacity:.45,viscosity:30,mouseX:0,mouseY:0};
    const initial={...backdrop};
    function syncBackdrop(){
      settings.querySelectorAll('[data-bg-key]').forEach(input=>{const v=backdrop[input.dataset.bgKey];if(input.type==='checkbox')input.checked=!!v;else input.value=String(v);});
      settings.querySelectorAll('[data-bg-shared]').forEach(row=>row.hidden=backdrop.kind==='off');
      settings.querySelectorAll('[data-bg-ether]').forEach(row=>row.hidden=backdrop.kind!=='liquidEther'&&!(row.querySelector('[data-bg-key=color3]')&&backdrop.kind==='colourFlow'));
      settings.querySelectorAll('[data-bg-legacy]').forEach(row=>row.hidden=!['lightPillar','colourFlow'].includes(backdrop.kind));
      for(const key of ['viscosity','iterationsViscous'])settings.querySelector('[data-bg-key='+key+']').closest('label').hidden=backdrop.kind!=='liquidEther'||!backdrop.isViscous;
      settings.querySelector('[data-bg-key=backgroundColor]').closest('label').hidden=backdrop.kind!=='liquidEther'||!backdrop.lightMode;
      settings.querySelectorAll('[data-bg-pillar]').forEach(row=>row.hidden=backdrop.kind!=='lightPillar');
      laserHost.style.mixBlendMode=backdrop.kind==='lightPillar'?backdrop.mixBlendMode:'normal';
      laserHost.style.opacity=String(backdrop.opacity);
      const th=language.current==='th',fluid=backdrop.kind==='liquidEther'||backdrop.kind==='colourFlow';
      for(const [key,n]of [['color1',1],['color2',2]])settings.querySelector('[data-bg-label='+key+']').textContent=fluid?(th?'สีที่ '+n:'Colour '+n):(th?(n===1?'สีด้านบน':'สีด้านล่าง'):(n===1?'Top colour':'Bottom colour'));
      settings.querySelectorAll('input[type=range]').forEach(input=>{const title=input.closest('label').querySelector('[data-bg-label]');let out=title.querySelector('output');if(!out){out=document.createElement('output');out.style.cssText='display:block;color:#ec7ba8;font:11px monospace';title.append(out);}out.textContent=input.value;});
    }
    settings.querySelectorAll('[data-bg-key]').forEach(input=>input.addEventListener('input',()=>{if(input.dataset.bgKey==='kind'&&input.value!=='liquidEther')window.CerebraLiquidEther.reset(laserContext);backdrop[input.dataset.bgKey]=input.type==='checkbox'?input.checked:input.type==='range'?+input.value:input.value;syncBackdrop();drawLaser(reduced.matches?0:clock);}));
    settings.querySelector('[data-bg-reset]').addEventListener('click',()=>{window.CerebraLiquidEther.reset(laserContext);Object.assign(backdrop,initial);syncBackdrop();drawLaser(reduced.matches?0:clock);});
    document.addEventListener('pointerdown',event=>{if(!settings.contains(event.target))settings.open=false;},{passive:true});
    const backdropLabels={"mouseForce":["Mouse force","แรงเมาส์ / นิ้ว"],"cursorSize":["Cursor size","ขนาดแรงสัมผัส"],"resolution":["Resolution","ความละเอียด"],"iterationsPoisson":["Pressure iterations","รอบคำนวณแรงดัน"],"iterationsViscous":["Viscosity iterations","รอบคำนวณความหนืด"],"autoSpeed":["Auto speed","ความเร็วอัตโนมัติ"],"autoIntensity":["Auto intensity","แรงอัตโนมัติ"],"dt":["Simulation step","จังหวะจำลอง"],"takeoverDuration":["Pointer takeover","เวลาเปลี่ยนสู่ตัวชี้"],"autoResumeDelay":["Auto resume delay","เวลารอกลับอัตโนมัติ"],"autoRampDuration":["Auto ramp duration","เวลาเร่งอัตโนมัติ"],"autoDemo":["Auto animate","เคลื่อนไหวอัตโนมัติ"],"isViscous":["Viscous","เปิดความหนืด"],"isBounce":["Bounce edges","สะท้อนขอบ"],"BFECC":["BFECC detail","รักษารายละเอียดการไหล"],"lightMode":["Light mode","โหมดสว่าง"],"backgroundColor":["Background colour","สีพื้นหลัง"],"color1":["Top colour","สีด้านบน"],"color2":["Bottom colour","สีด้านล่าง"],"color3":["Colour 3","สีที่ 3"],"intensity":["Intensity","ความสว่าง"],"opacity":["Backdrop opacity","ความทึบพื้นหลัง"],"speed":["Rotation speed","ความเร็วการหมุน"],"viscosity":["Viscosity","ความหนืด"],"glowAmount":["Glow amount","แสงฟุ้ง"],"pillarWidth":["Pillar width","ความกว้างเสาแสง"],"pillarHeight":["Pillar height","ความสูงลวดลาย"],"noiseIntensity":["Noise intensity","ความเข้มเม็ดฟิล์ม"],"rotation":["Pillar rotation","มุมเสาแสง"],"interactive":["Pointer interaction","ตอบสนองตัวชี้"],"kind":["Style","รูปแบบ"],"mixBlendMode":["Blend mode","ผสมสี"],"quality":["Quality","คุณภาพ"]};
    function translateBackdrop(){
      const th=language.current==='th';settings.querySelector('[data-bg-title]').textContent=th?'พื้นหลัง':'Backdrop';
      settings.querySelector('.cl-bg-note').textContent=th?'ปัดหรือใช้ลูกศรเพื่อเลือก กด Enter เพื่อเปิด':'Swipe or use arrow keys to choose. Press Enter to open.';
      settings.querySelector('[data-bg-reset]').textContent=th?'คืนค่าพื้นหลัง':'Reset backdrop';
      settings.querySelectorAll('[data-bg-label]').forEach(span=>span.textContent=backdropLabels[span.dataset.bgLabel][th?1:0]);
      settings.querySelector('option[value=liquidEther]').textContent='Liquid Ether';
      settings.querySelector('option[value=colourFlow]').textContent=th?'สีไหล':'Colour flow';
      settings.querySelector('option[value=off]').textContent=th?'ปิด':'Off';
      for(const [v,en,label] of [['low','Low','ต่ำ'],['medium','Medium','กลาง'],['high','High','สูง']])settings.querySelector('[data-bg-key=quality] option[value='+v+']').textContent=th?label:en;
    }
    language.onChange(()=>{translateBackdrop();syncBackdrop();});translateBackdrop();syncBackdrop();
    // Debug/review view of session-only settings; no project/storage owner.
    window.CerebraPageBackdrop.settings=backdrop;
    const laserContext=laserCanvas.getContext('2d');
    const ballConfig={...window.CerebraCrystalBall.defaults};
    for(const c of crystals)c.settings=ballConfig;
    const ballRows=[
      ['preset','Preset','ชุดสี','select',Object.keys(window.CerebraCrystalBall.presets)],
      ['motion','Dust motion','การเคลื่อนฝุ่น','select',['rise','fall','drift','orbit']],
      ['particleShape','Particle shape','รูปทรงอนุภาค','select',['square','round']],
      ['color','Colour','สี','color'],
      ['size','Size','ขนาด','range',.25,1,.01],
      ['glow','Glow','แสงฟุ้ง','range',0,1.5,.05],['haze','Haze','หมอกแสง','range',0,1.5,.05],
      ['strands','Strands','เส้นขอบไฟฟ้า','range',1,8,1],['crackle','Crackle','ความปั่นป่วนขอบ','range',0,1,.05],
      ['flares','Flares','แสงเปลวขอบ','range',0,1,.05],['sparks','Sparks','ประกายไฟ','range',0,1,.05],
      ['particleCount','Particles','จำนวนอนุภาค','range',0,40000,500],['fill','Fill','ระดับฝุ่น','range',0,1,.05],
      ['depth','Depth','มิติความลึก','range',0,1,.05],['twinkle','Twinkle','การกะพริบ','range',0,1,.05],
      ['speed','Rim speed','ความเร็วขอบ','range',0,2,.05],['dustSpeed','Dust speed','ความเร็วฝุ่น','range',0,2,.05],
      ['sway','Sway','การแกว่ง','range',0,1,.05],['interactive','Interactive','ตอบสนองเมาส์ / นิ้ว','checkbox'],
      ['hoverStrength','Touch strength','แรงสัมผัส','range',0,1,.05],['intro','Intro','เปิดตัวลูกแก้ว','checkbox'],
      ['paused','Paused','หยุดการเคลื่อนไหว','checkbox']
    ];
    const ballMenus=[];
    function syncBall(){
      const th=language.current==='th';
      for(const menu of ballMenus){
        menu.querySelector('summary').textContent=th?'ลูกแก้ว':'Crystal Ball';
        for(const [k,en,label]of ballRows){const input=menu.querySelector('[data-ball-key='+k+']');if(input.type==='checkbox')input.checked=!!ballConfig[k];else input.value=String(ballConfig[k]);const title=input.closest('label').querySelector('span');title.textContent=th?label:en;if(input.type==='range'){const output=document.createElement('output');output.style.cssText='display:block;color:#ec7ba8;font:11px monospace';output.textContent=input.value;title.append(output);}if(k==='hoverStrength')input.closest('label').hidden=!ballConfig.interactive;}
        menu.querySelector('[data-ball-reset]').textContent=th?'คืนค่าลูกแก้ว':'Reset Crystal Ball';
      }
    }
    for(const root of [page.querySelector('.cl-slide-footer'),page.querySelector('.cl-guide-head')]){
      const menu=document.createElement('details');menu.className='cl-bg-choose cl-ball-choose';menu.dataset.clBg='';menu.dataset.ballMenu='';
      menu.innerHTML='<summary>Crystal Ball</summary><div class="cl-bg-panel">'+ballRows.map(([k,en,label,type,min,max,step])=>'<label><span>'+en+'</span>'+(type==='select'?'<select data-ball-key="'+k+'">'+min.map(v=>'<option value="'+v+'">'+v[0].toUpperCase()+v.slice(1)+'</option>').join('')+'</select>':'<input type="'+type+'" data-ball-key="'+k+'"'+(type==='range'?' min="'+min+'" max="'+max+'" step="'+step+'"':'')+'>')+'</label>').join('')+'<button type="button" data-ball-reset>Reset Crystal Ball</button></div>';
      root.prepend(menu);ballMenus.push(menu);
      menu.addEventListener('input',event=>{const input=event.target.closest('[data-ball-key]');if(!input)return;const k=input.dataset.ballKey,v=input.type==='checkbox'?input.checked:input.type==='range'?+input.value:input.value;if(k==='preset')Object.assign(ballConfig,window.CerebraCrystalBall.presets[v]);ballConfig[k]=v;if(k==='intro')for(const c of crystals)window.CerebraCrystalBall.reset(c.ctx);syncBall();for(const c of crystals)draw(c,reduced.matches?0:clock);});
      menu.querySelector('[data-ball-reset]').addEventListener('click',()=>{Object.assign(ballConfig,window.CerebraCrystalBall.defaults);for(const c of crystals)window.CerebraCrystalBall.reset(c.ctx);syncBall();for(const c of crystals)draw(c,reduced.matches?0:clock);});
      menu.addEventListener('toggle',()=>{if(menu.open)for(const other of [...ballMenus,settings])if(other!==menu)other.open=false;});
    }
    css.textContent+='.cl-slide-footer{gap:10px}.cl-ball-choose .cl-bg-panel{bottom:calc(100% + 10px);max-height:min(420px,60dvh)}.cl-guide-head>.cl-ball-choose{align-self:start;z-index:5}.cl-guide-head>.cl-ball-choose .cl-bg-panel{bottom:auto;top:calc(100% + 8px);left:0}.cl-guide-head .cl-ball-choose .cl-bg-panel{width:min(480px,calc(100vw - 48px))}.cl-ball-choose [hidden]{display:none!important}';
    document.addEventListener('pointerdown',event=>{for(const menu of ballMenus)if(!menu.contains(event.target))menu.open=false;},{passive:true});
    settings.addEventListener('toggle',()=>{if(settings.open)for(const menu of ballMenus)menu.open=false;});
    language.onChange(syncBall);syncBall();
    css.textContent+='@media(max-width:360px){.cl-hub-open .cl-slide-footer{gap:6px}.cl-hub-open .cl-slide-enter{min-width:94px;padding-inline:12px}.cl-ball-choose summary{padding-inline:7px}}';
    window.CerebraCrystalBall.pageSettings=ballConfig;
    // Native Studio Full Reset already dispatches this hidden page reset.
    settings.querySelector('[data-bg-reset]').addEventListener('click',()=>{if(app.studio.active)ballMenus[0].querySelector('[data-ball-reset]').click();});
    function drawLaser(t){if(!laserContext||!laserHost.getClientRects().length)return;const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(laserHost.clientWidth*dpr)),h=Math.max(1,Math.round(laserHost.clientHeight*dpr));if(laserCanvas.width!==w||laserCanvas.height!==h){laserCanvas.width=w;laserCanvas.height=h;}laserCanvas.style.width='100%';laserCanvas.style.height='100%';laserContext.clearRect(0,0,w,h);window.CerebraPageBackdrop.draw(laserContext,w,h,dpr,t,backdrop);}
    let laserTimer=0,backdropStart=0,backdropLast=0;
    function queueLaser(){clearTimeout(laserTimer);backdropStart=performance.now()+150;laserTimer=setTimeout(()=>{laserTimer=0;if(active())drawLaser(reduced.matches?0:clock);},150);}
    new ResizeObserver(queueLaser).observe(laserHost);
    function tick(now){frame=0;if(!active())return;if(now-last>=1000/30){clock+=Math.min((now-last)/1000,.08);last=now;for(const c of crystals)if(c.host.getClientRects().length)draw(c,reduced.matches?0:clock);if(now>=backdropStart&&now-backdropLast>=1000/(backdrop.kind==='liquidEther'?30:15)){backdropLast=now;drawLaser(reduced.matches?0:clock);}}if(!reduced.matches)frame=requestAnimationFrame(tick);}
    function wake(){if(!active()){cancelAnimationFrame(frame);clearTimeout(laserTimer);laserTimer=0;frame=0;return;}for(const c of crystals)if(c.host.getClientRects().length)draw(c,reduced.matches?0:clock);queueLaser();if(!frame&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}}
    page.addEventListener('pointermove',event=>{if(backdrop.kind==='liquidEther'&&!settings.contains(event.target)){window.CerebraLiquidEther.pointer(laserContext,event);if(reduced.matches)drawLaser(0);}if(backdrop.interactive&&!reduced.matches&&backdrop.kind==='lightPillar'){const r=laserHost.getBoundingClientRect();backdrop.mouseX=Math.max(-1,Math.min(1,(event.clientX-r.left)/Math.max(1,r.width)*2-1));backdrop.mouseY=Math.max(-1,Math.min(1,-(event.clientY-r.top)/Math.max(1,r.height)*2+1));}if(event.pointerType==='touch'||reduced.matches)return;for(const c of crystals){const r=c.host.getBoundingClientRect();c.x=Math.max(-1,Math.min(1,(event.clientX-r.left-r.width/2)/(r.width/2)));}},{passive:true});
    page.addEventListener('pointerleave',()=>{window.CerebraLiquidEther.leave(laserContext);backdrop.mouseX=backdrop.mouseY=0;for(const c of crystals)window.CerebraCrystalBall.leave(c.ctx);},{passive:true});
    for(const eventName of ['pointermove','pointerdown'])page.addEventListener(eventName,event=>{if(event.target.closest('[data-cl-bg]')){for(const c of crystals)window.CerebraCrystalBall.leave(c.ctx);return;}for(const c of crystals)if(c.host.getClientRects().length)window.CerebraCrystalBall.pointer(c.ctx,event,eventName==='pointerdown');},{passive:true});
    page.addEventListener('pointerup',event=>{if(event.pointerType==='touch')for(const c of crystals)window.CerebraCrystalBall.leave(c.ctx);},{passive:true});
    const observer=new MutationObserver(()=>{sync();wake();});
    observer.observe(page,{attributes:true,attributeFilter:['open','class']});
    page.querySelectorAll('[data-cl-path]').forEach(b=>observer.observe(b,{attributes:true,attributeFilter:['class']}));
    page.querySelectorAll('[data-cl-hub],[data-cl-guide]').forEach(s=>observer.observe(s,{attributes:true,attributeFilter:['hidden']}));
    language.onChange(()=>{sync();wake();});
    document.addEventListener('visibilitychange',()=>{sync();wake();});
    reduced.addEventListener('change',()=>{animations.forEach(a=>a.cancel());animations=[];sync();wake();});
    page.addEventListener('close',()=>{sync();wake();});
    sync();wake();
  }
  setTimeout(boot,0);
})();
