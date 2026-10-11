/* React Bits Stepper interaction, adapted to the existing native launch dialog.
 * Reference: https://reactbits.dev/components/stepper.
 * Copyright (c) 2026 David Haz; MIT + Commons Clause notice in template.html.
 * Session-only tutorial: no renderer, animation loop, project or history writes.
 */
(() => {
  const copy = {
    en: {
      title:'A quick start for Studio', intro:'Four steps, then make it your own.', back:'Previous', next:'Next', finish:'Enter Studio', skip:'Skip and enter Studio', replay:'Quick start · 4 steps', cancel:'Back', step:'Step', of:'of',
      steps:[
        ['Choose your starting point','Start with Cerebra. Use Tune the core to change its appearance, or hide the subject in Design to build a composition from scratch.','Tune the core · Design'],
        ['Add and customise objects','Add Text, Shapes or Kit from the left toolbar. Select an object, then open its Design panel to adjust colours, size and effect settings.','Text · Shapes · Kit → Design'],
        ['Arrange layers and motion','Use Layers to change stacking order, group objects, hide or lock them. Open Motion on a selected object to animate it. Undo brings back an earlier edit.','Layers · Motion · Undo'],
        ['Save a project or export','Save project keeps an editable file you can open again. Export image or video creates the finished result to share. Browser Library is stored on this device.','Save project · Export image / video']
      ]
    },
    th: {
      title:'เริ่มใช้ Studio ทีละขั้น', intro:'รู้จัก 4 ขั้นตอน แล้วเริ่มสร้างงานของคุณ', back:'ย้อนกลับ', next:'ถัดไป', finish:'เข้า Studio', skip:'ข้ามและเข้า Studio', replay:'เริ่มใช้ Studio · 4 ขั้นตอน', cancel:'กลับ', step:'ขั้นตอน', of:'จาก',
      steps:[
        ['เลือกจุดเริ่มต้น','เริ่มจาก Cerebra แล้วใช้ Tune the core ปรับลักษณะดาว หรือซ่อนดาวใน Design เพื่อเริ่มจัดองค์ประกอบใหม่','Tune the core · Design'],
        ['เพิ่มและปรับแต่งวัตถุ','เพิ่ม Text, Shapes หรือ Kit จากแถบซ้าย เลือกวัตถุแล้วเปิด Design ของชิ้นนั้น เพื่อปรับสี ขนาด และค่าเอฟเฟกต์','Text · Shapes · Kit → Design'],
        ['จัดเลเยอร์และการเคลื่อนไหว','ใช้ Layers จัดลำดับ รวมกลุ่ม ซ่อน หรือล็อกวัตถุ เปิด Motion ของวัตถุที่เลือกเพื่อสร้างการเคลื่อนไหว และใช้ Undo ย้อนการแก้ไข','Layers · Motion · Undo'],
        ['บันทึกงานหรือส่งออก','Save project เก็บไฟล์ที่เปิดแก้ต่อได้ ส่วน Export image / video ส่งออกผลงานเพื่อแชร์ คลัง Library ในเบราว์เซอร์เก็บไว้เฉพาะเครื่องนี้','Save project · Export image / video']
      ]
    }
  };
  function boot(){
    const app=window.__cerebra, language=window.__cerebraLanguage, page=document.querySelector('.cl-page');
    if(!app?.entry?.launchPaths||!language||!page){setTimeout(boot,180);return;}
    if(window.CerebraStudioStepper)return;
    const css=document.createElement('style');
    css.textContent=`
      .ct-section{width:100%;max-width:448px;margin:36px auto 48px}.ct-heading{margin:0 0 24px}.ct-heading h1{font:600 clamp(25px,4vw,34px)/1.25 var(--cl-body);margin:0 0 10px;letter-spacing:-.025em}.ct-heading p{margin:0;color:var(--cl-muted)}
      .ct-card{border:1px solid var(--cl-line);border-radius:32px;background:#151925;box-shadow:0 16px 48px #0003;overflow:hidden}.ct-indicators{display:flex;align-items:center;padding:28px 24px}.ct-indicator{padding:0;border:0;background:none;display:grid;place-items:center;min-width:44px;height:44px;flex-shrink:0}.ct-circle{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#252b3c;color:#b5bed2;font:500 14px/1 var(--cl-body);transition:background .4s,color .4s}.ct-indicator[aria-current=step] .ct-circle,.ct-indicator.is-complete .ct-circle{background:var(--cl-pink);color:#10131e}.ct-dot{width:12px;height:12px;border-radius:50%;background:#10131e}.ct-circle svg{width:18px;height:18px;stroke-width:2.5}.ct-connector{height:2px;flex:1;background:#465066;margin:0 4px;overflow:hidden}.ct-connector span{display:block;width:100%;height:100%;background:var(--cl-pink);transform:scaleX(0);transform-origin:left;transition:transform .4s}.ct-connector.is-complete span{transform:scaleX(1)}
      .ct-content{position:relative;overflow:hidden}.ct-slide{padding:0 28px;box-sizing:border-box;width:100%}.ct-slide h2{font:600 24px/1.3 var(--cl-body)!important;letter-spacing:-.025em;margin:0 0 16px}.ct-slide p{font-size:16px;line-height:1.7;margin:0;color:var(--cl-muted)}.ct-location{border-top:1px solid var(--cl-line);padding-top:18px;margin-top:24px!important;color:var(--cl-pink)!important;font-size:13px!important}.ct-progress{margin:0 0 12px!important;font-size:12px!important;color:var(--cl-muted)!important;letter-spacing:.06em}
      .ct-footer{display:flex;justify-content:space-between;gap:12px;padding:28px}.ct-footer button{border:0;border-radius:999px;padding:10px 18px;min-height:44px;font-weight:600;font-size:14px;letter-spacing:-.025em}.ct-previous{background:transparent;color:var(--cl-muted)!important}.ct-next{background:var(--cl-pink);color:#10131e!important;margin-left:auto}.ct-skip{display:block;min-height:44px;margin:16px auto 0;padding:8px 16px;background:none;border:0;text-decoration:underline;text-underline-offset:4px;color:var(--cl-muted)!important;font-size:14px!important}.ct-replay{display:block;margin:20px 0 0;padding:10px 18px;border:1px solid var(--cl-line);border-radius:999px;background:transparent}
      .cl-page.cl-stepper-open{touch-action:pan-y}.cl-stepper-open .cl-shell{min-height:100dvh}.cl-stepper-open .cl-head{margin-bottom:0}
      @media(max-width:480px){.ct-section{margin:24px auto 32px}.ct-indicators{padding:20px 16px}.ct-slide{padding:0 22px}.ct-footer{padding:24px 22px}.ct-slide h2{font-size:22px!important}.ct-slide p{font-size:15px}.ct-heading h1{font-size:27px}.ct-card{border-radius:26px}}
      @media(max-width:360px){.cl-stepper-open .cl-head{flex-wrap:wrap;row-gap:12px}.cl-stepper-open .cl-head-actions{margin-left:auto;max-width:100%;flex-wrap:wrap;justify-content:flex-end}.cl-stepper-open .cl-back{white-space:nowrap}}
      .ct-circle path{stroke-dasharray:1;animation:ct-check .3s .1s both}@keyframes ct-check{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
      @media(prefers-reduced-motion:reduce){.ct-circle,.ct-connector span{transition:none}.ct-circle path{animation:none}}
    `;
    document.head.append(css);
    const section=document.createElement('section');section.className='ct-section';section.hidden=true;section.setAttribute('aria-labelledby','ct-heading');
    section.innerHTML='<header class="ct-heading"><h1 id="ct-heading"></h1><p></p></header><div class="ct-card"><nav class="ct-indicators" aria-label="Tutorial steps"></nav><div class="ct-content"></div><footer class="ct-footer"><button type="button" class="ct-previous"></button><button type="button" class="ct-next"></button></footer></div><button type="button" class="ct-skip"></button>';
    page.querySelector('.cl-shell').append(section);
    const indicators=section.querySelector('.ct-indicators'), content=section.querySelector('.ct-content'), previous=section.querySelector('.ct-previous'), next=section.querySelector('.ct-next'), skip=section.querySelector('.ct-skip'), back=page.querySelector('[data-cl-back]'), nativeBack=back.onclick;
    const hub=page.querySelector('[data-cl-hub]'), guide=page.querySelector('[data-cl-guide]');
    let active=false, seen=false, index=0, complete=null, saved=null, current=null, tween=null;
    const reduced=matchMedia('(prefers-reduced-motion:reduce)');
    const texts=()=>copy[language.current==='th'?'th':'en'];
    const resize=new ResizeObserver(entries=>{if(active&&current&&!tween?.isActive()&&entries.some(entry=>entry.target===current)){content.style.height=`${current.offsetHeight}px`;}});
    const stepButtons=[], connectors=[];
    for(let i=0;i<4;i++){
      const button=document.createElement('button');button.type='button';button.className='ct-indicator';button.dataset.ctStep=i;button.innerHTML='<span class="ct-circle"></span>';
      button.onclick=()=>{const direction=i>=index?1:-1;index=i;render(true,direction);next.focus({preventScroll:true});};indicators.append(button);stepButtons.push(button);
      if(i<3){const line=document.createElement('span');line.className='ct-connector';line.setAttribute('aria-hidden','true');line.innerHTML='<span></span>';indicators.append(line);connectors.push(line);}
    }
    function render(animate=false,direction=1){
      const t=texts(), old=current;
      section.querySelector('h1').textContent=t.title;section.querySelector('.ct-heading p').textContent=t.intro;
      previous.textContent=t.back;previous.hidden=index===0;next.textContent=index===3?t.finish:t.next;skip.textContent=t.skip;
      indicators.setAttribute('aria-label',language.current==='th'?'ขั้นตอนแนะนำ Studio':'Studio tutorial steps');
      t.steps.forEach(([title],i)=>{
        const button=stepButtons[i],status=i<index?'complete':i===index?'active':'inactive';button.classList.toggle('is-complete',i<index);button.setAttribute('aria-label',`${t.step} ${i+1}: ${title}`);if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
        if(button.dataset.status!==status){button.querySelector('.ct-circle').innerHTML=i<index?'<svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M5 13l4 4L19 7"/></svg>':i===index?'<span class="ct-dot"></span>':i+1;button.dataset.status=status;}
        connectors[i]?.classList.toggle('is-complete',i<index);
      });
      tween?.kill();tween=null;content.querySelectorAll('.ct-slide').forEach(slide=>{if(slide!==old)slide.remove();});
      if(old){old.style.transform='';old.style.opacity='1';}
      if(old)resize.unobserve(old);
      current=document.createElement('article');current.className='ct-slide';current.setAttribute('aria-live','polite');
      const progress=document.createElement('p');progress.className='ct-progress';progress.textContent=`${t.step} ${index+1} ${t.of} 4`;
      const title=document.createElement('h2');title.textContent=t.steps[index][0];const description=document.createElement('p');description.textContent=t.steps[index][1];const location=document.createElement('p');location.className='ct-location';location.textContent=t.steps[index][2];current.append(progress,title,description,location);content.append(current);
      const height=current.offsetHeight;
      if(animate&&old&&!reduced.matches){
        old.style.position='absolute';old.style.inset='0';old.setAttribute('aria-hidden','true');
        const incoming=current, fromHeight=parseFloat(content.style.height)||old.offsetHeight, motion={progress:0};
        // Tween a value on the existing GSAP ticker, like the launch-path menu.
        const paint=()=>{const p=motion.progress;old.style.transform=`translateX(${(direction>=0?50:-50)*p}%)`;old.style.opacity=1-p;incoming.style.transform=`translateX(${(direction>=0?-100:100)*(1-p)}%)`;incoming.style.opacity=p;content.style.height=`${fromHeight+(height-fromHeight)*p}px`;};
        paint();tween=gsap.to(motion,{progress:1,duration:.4,ease:'power2.out',onUpdate:paint,onComplete:()=>{old.remove();incoming.style.transform='';incoming.style.opacity='';tween=null;resize.observe(incoming);}});
      }else{old?.remove();content.style.height=`${height}px`;resize.observe(current);}
      back.querySelector('span').textContent=t.cancel;page.setAttribute('aria-label',t.title);
    }
    function restore(){
      active=false;resize.disconnect();tween?.kill();tween=null;section.hidden=true;page.classList.remove('cl-stepper-open');
      hub.hidden=saved.hub;guide.hidden=saved.guide;page.classList.toggle('cl-hub-open',saved.hubClass);back.querySelector('span').textContent=saved.back;page.setAttribute('aria-label',saved.label);page.scrollTop=saved.scroll;
    }
    function finish(){if(!active)return;const launch=complete;complete=null;seen=true;restore();launch?.();}
    previous.onclick=()=>{if(index>0){index--;render(true,-1);if(index===0)next.focus({preventScroll:true});}};
    next.onclick=()=>{if(index<3){index++;render(true,1);}else finish();};skip.onclick=finish;
    back.onclick=()=>{if(!active){nativeBack?.();return;}complete=null;restore();saved.focus?.focus({preventScroll:true});};
    page.addEventListener('close',()=>{if(active&&!page.open){complete=null;restore();}});
    language.onChange(()=>{if(active)render();updateReplay();});
    function updateReplay(){
      const enter=guide.querySelector('[data-cl-studio]');if(!enter)return;
      let button=guide.querySelector('.ct-replay');
      if(!button){button=document.createElement('button');button.type='button';button.className='ct-replay';button.onclick=()=>api.open(()=>enter.click(),{force:true});enter.before(button);}
      const label=texts().replay;if(button.textContent!==label)button.textContent=label;
    }
    // renderGuide replaces its native content; reconnect replay without cloning controls.
    new MutationObserver(updateReplay).observe(guide.querySelector('[data-cl-content]'),{childList:true});
    const api={
      open(launch,{force=false}={}){
        if(active)return true;if(seen&&!force)return false;
        saved={hub:hub.hidden,guide:guide.hidden,hubClass:page.classList.contains('cl-hub-open'),back:back.querySelector('span').textContent,label:page.getAttribute('aria-label'),scroll:page.scrollTop,focus:document.activeElement};
        complete=launch;active=true;index=0;hub.hidden=true;guide.hidden=true;page.classList.remove('cl-hub-open');page.classList.add('cl-stepper-open');section.hidden=false;render();page.scrollTop=0;next.focus({preventScroll:true});return true;
      },
      get active(){return active;},get step(){return index+1;}
    };
    window.CerebraStudioStepper=api;updateReplay();
  }
  setTimeout(boot,0);
})();
