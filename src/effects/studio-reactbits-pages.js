/* React Bits-inspired page motion, implemented for Cerebra's vanilla runtime.
 * References: reactbits.dev/text-animations/rotating-text and
 * Crystal Ball and backgrounds now belong to native Studio Kit layers. */
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
      @media(max-height:620px){.cl-ready-prefix{font-size:13px;line-height:1.2}.cl-hero .cl-rotating-line{line-height:1.2}}
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
    const observer=new MutationObserver(()=>{sync();});
    observer.observe(page,{attributes:true,attributeFilter:['open','class']});
    page.querySelectorAll('[data-cl-path]').forEach(b=>observer.observe(b,{attributes:true,attributeFilter:['class']}));
    page.querySelectorAll('[data-cl-hub],[data-cl-guide]').forEach(s=>observer.observe(s,{attributes:true,attributeFilter:['hidden']}));
    language.onChange(()=>{sync();});
    document.addEventListener('visibilitychange',()=>{sync();});
    reduced.addEventListener('change',()=>{animations.forEach(a=>a.cancel());animations=[];sync();});
    page.addEventListener('close',()=>{sync();});
    sync();
  }
  setTimeout(boot,0);
})();
