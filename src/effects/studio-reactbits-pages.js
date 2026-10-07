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
      @media(max-width:760px){.cl-hero>.cl-crystal{width:240px;height:240px;right:-75px;opacity:.65}.cl-guide-head>.cl-crystal{right:-65px;top:-10px;width:180px;height:180px;opacity:.3}}
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
    // A bounded Canvas2D adaptation of the reference's electric rim + dust.
    // One scheduler, <=30fps, <=500 particles total, no extra WebGL contexts.
    const crystals=[];let frame=0,last=0,clock=0;
    function crystal(root, size, color) {
      const host=document.createElement('div');host.className='cl-crystal';host.setAttribute('aria-hidden','true');
      const canvas=document.createElement('canvas');host.append(canvas);root.append(host);
      const ctx=canvas.getContext('2d');if(!ctx){host.remove();return;}
      let seed=913;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const dust=Array.from({length:size},()=>({a:rand()*Math.PI*2,r:Math.sqrt(rand()),z:rand(),phase:rand()*6.28}));
      const item={host,canvas,ctx,dust,color,x:0,y:0};crystals.push(item);
      new ResizeObserver(()=>{const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(host.clientWidth*dpr));canvas.height=Math.max(1,Math.round(host.clientHeight*dpr));draw(item,clock);}).observe(host);
    }
    function draw(item,t) {
      const {canvas,ctx,dust,color}=item,w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,R=Math.min(w,h)*.34;
      ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);
      const haze=ctx.createRadialGradient(0,R*.28,0,0,0,R*1.4);haze.addColorStop(0,color+'22');haze.addColorStop(.65,color+'0c');haze.addColorStop(1,color+'00');ctx.fillStyle=haze;ctx.fillRect(-cx,-cy,w,h);
      ctx.save();ctx.beginPath();ctx.arc(0,0,R*.97,0,Math.PI*2);ctx.clip();
      for(const p of dust){const a=p.a+t*.07,pulse=.35+.65*(.5+.5*Math.sin(t*.9+p.phase)),x=Math.cos(a)*p.r*R+item.x*p.z*R*.04,y=Math.sin(a)*p.r*R*.85+R*.1+Math.sin(t*.35+p.phase)*R*.025;ctx.globalAlpha=(.2+p.z*.7)*pulse;ctx.fillStyle=p.z>.88?'#fff4fb':color;const s=(.7+p.z*1.3)*w/300;ctx.fillRect(x,y,s,s);}
      ctx.restore();ctx.globalAlpha=1;ctx.shadowColor=color;ctx.shadowBlur=R*.075;
      for(let strand=0;strand<3;strand++){ctx.beginPath();for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,r=R*(1+.012*Math.sin(a*19+t*(1+strand*.2)+strand)+.007*Math.sin(a*47-t*.6+strand));const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=strand===0?'#ffeaf5':color;ctx.globalAlpha=strand===0?.85:.5;ctx.lineWidth=(strand===0?.7:1.1)*w/300;ctx.stroke();}
      ctx.shadowBlur=0;ctx.restore();
    }
    crystal(page.querySelector('.cl-hero'),innerWidth<760?260:360,'#ec7ba8');
    crystal(page.querySelector('.cl-guide-head'),100,'#9478ff');
    // A subdued, customizable backdrop stays behind all route controls.
    const laserHost=document.createElement('div');laserHost.className='cl-page-laser';laserHost.setAttribute('aria-hidden','true');
    const laserCanvas=document.createElement('canvas');laserHost.append(laserCanvas);page.querySelector('[data-cl-hub]').append(laserHost);
    css.textContent+='.cl-page-laser{position:absolute;inset:0;pointer-events:none;z-index:-1;overflow:hidden;mask-image:linear-gradient(transparent,#000 25%,#000 60%,transparent)}.cl-hub-open [data-cl-hub]{position:relative;isolation:isolate}.cl-bg-choose{position:relative;font:12px/1.4 var(--cl-body)}.cl-bg-choose summary{cursor:pointer;list-style:none;border:1px solid #354054;padding:7px 10px;border-radius:6px;color:#b5bed2;min-height:34px;box-sizing:border-box}.cl-bg-panel{position:absolute;bottom:calc(100% + 10px);left:0;z-index:10;width:min(280px,calc(100vw - 48px));max-height:min(420px,60dvh);overflow:auto;background:#191e2e;border:1px solid #56617b;border-radius:10px;padding:14px;box-shadow:0 15px 40px #0008}.cl-bg-panel label{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center;margin:8px 0;min-height:36px}.cl-bg-panel input,.cl-bg-panel select{width:100%;min-width:0;min-height:36px;box-sizing:border-box;accent-color:#ec7ba8;background:#252d40;border:1px solid #56617b;border-radius:5px;color:#f3f1f4}.cl-bg-panel input[type=color]{padding:3px}.cl-bg-panel .cl-bg-note{font-size:12px;line-height:1.6;color:#b5bed2}.cl-hub-open .cl-slide-hint{display:none}';
    const settings=document.createElement('details');settings.className='cl-bg-choose';settings.dataset.clBg='';
    css.textContent+='.cl-bg-panel [hidden]{display:none!important}';
    settings.innerHTML='<summary data-bg-title>Backdrop</summary><div class="cl-bg-panel"><label><span>Style</span><select data-bg-key="kind"><option value="liquidEther">Liquid Ether</option><option value="lightPillar">Light Pillar</option><option value="off">Off</option></select></label><label><span>Colour 1</span><input type="color" data-bg-key="color1" value="#5227ff"></label><label><span>Colour 2</span><input type="color" data-bg-key="color2" value="#ff9ffc"></label><label data-bg-ether><span>Colour 3</span><input type="color" data-bg-key="color3" value="#b497cf"></label><label><span>Intensity</span><input type="range" data-bg-key="intensity" min="0" max="0.35" step="0.01" value="0.12"></label><label><span>Speed</span><input type="range" data-bg-key="speed" min="0" max="2" step="0.1" value="0.4"></label><label data-bg-ether><span>Viscosity</span><input type="range" data-bg-key="viscosity" min="0" max="80" step="1" value="30"></label><label data-bg-pillar hidden><span>Width</span><input type="range" data-bg-key="width" min="0.1" max="0.8" step="0.05" value="0.3"></label><label data-bg-pillar hidden><span>Rotation</span><input type="range" data-bg-key="rotation" min="0" max="180" step="1" value="25"></label><p class="cl-bg-note">Swipe or use arrow keys to choose. Press Enter to open.</p></div>';
    page.querySelector('.cl-slide-footer').prepend(settings);
    const backdrop={kind:'liquidEther',color1:'#5227ff',color2:'#ff9ffc',color3:'#b497cf',intensity:.12,speed:.4,viscosity:30,width:.3,rotation:25};
    settings.querySelectorAll('[data-bg-key]').forEach(input=>input.addEventListener('input',()=>{backdrop[input.dataset.bgKey]=input.type==='range'?+input.value:input.value;settings.querySelectorAll('[data-bg-ether]').forEach(row=>row.hidden=backdrop.kind!=='liquidEther');settings.querySelectorAll('[data-bg-pillar]').forEach(row=>row.hidden=backdrop.kind!=='lightPillar');drawLaser(reduced.matches?0:clock);}));
    document.addEventListener('pointerdown',event=>{if(!settings.contains(event.target))settings.open=false;},{passive:true});
    language.onChange(()=>{settings.querySelector('[data-bg-title]').textContent=language.current==='th'?'พื้นหลัง':'Backdrop';settings.querySelector('.cl-bg-note').textContent=language.current==='th'?'ปัดหรือใช้ลูกศรเพื่อเลือก กด Enter เพื่อเปิด':'Swipe or use arrow keys to choose. Press Enter to open.';});
    const laserContext=laserCanvas.getContext('2d');
    function drawLaser(t){if(!laserContext||!laserHost.getClientRects().length)return;const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(laserHost.clientWidth*dpr)),h=Math.max(1,Math.round(laserHost.clientHeight*dpr));if(laserCanvas.width!==w||laserCanvas.height!==h){laserCanvas.width=w;laserCanvas.height=h;}laserCanvas.style.width='100%';laserCanvas.style.height='100%';laserContext.clearRect(0,0,w,h);window.CerebraPageBackdrop.draw(laserContext,w,h,dpr,t,backdrop);}
    new ResizeObserver(()=>drawLaser(reduced.matches?0:clock)).observe(laserHost);
    function tick(now){frame=0;if(!active())return;if(now-last>=1000/30){clock+=Math.min((now-last)/1000,.08);last=now;for(const c of crystals)if(c.host.getClientRects().length)draw(c,reduced.matches?0:clock);drawLaser(reduced.matches?0:clock);}if(!reduced.matches)frame=requestAnimationFrame(tick);}
    function wake(){if(!active()){cancelAnimationFrame(frame);frame=0;return;}for(const c of crystals)if(c.host.getClientRects().length)draw(c,reduced.matches?0:clock);drawLaser(reduced.matches?0:clock);if(!frame&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}}
    page.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced.matches)return;for(const c of crystals){const r=c.host.getBoundingClientRect();c.x=Math.max(-1,Math.min(1,(event.clientX-r.left-r.width/2)/(r.width/2)));}},{passive:true});
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
