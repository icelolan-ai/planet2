/* Studio menu behaviour — keep floating controls exclusive and clear the canvas while drawing. */
(() => {
  function boot() {
    const app = window.__cerebra, s = app && app.studio;
    if (!s || !s.el || !s.drawPad || !s.setDrawing) { setTimeout(boot, 180); return; }
    if (s.__menuFixReady) return; s.__menuFixReady = true;

    const root = s.el;
    const assist = root.querySelector('.st-assist');
    const drawBtn = root.querySelector('[data-studio-draw]');
    const designBtn = root.querySelector('[data-studio-tools]');
    const compact = () => innerWidth <= 900 || matchMedia('(pointer: coarse)').matches;

    const touchStyle = document.createElement('style');
    touchStyle.textContent = `
      #studio [data-studio-tools].is-on{background:var(--ink)!important;color:var(--bg)!important;border-color:var(--ink)!important}
      @media (pointer:coarse), (max-width:760px){
        #studio [data-tray="layers"] .st-eye,
        #studio [data-tray="layers"] .st-gtog,
        #studio [data-tray="layers"] [data-sel-mode],
        #studio [data-tray="layers"] [data-lsel],
        #studio [data-tray="layers"] .st-panel-head button{
          width:40px!important;min-width:40px!important;height:40px!important;min-height:40px!important
        }
        #studio [data-tray="layers"] .st-lcheck{
          width:40px!important;min-width:40px!important;height:40px!important;min-height:40px!important
        }
        #studio [data-tray="layers"] .st-layer,
        #studio [data-tray="layers"] .st-ghead{min-height:44px!important}
      }
    `;
    document.head.append(touchStyle);

    const syncDesignState = () => {
      if (!designBtn || !s.panel) return;
      const open = !s.panel.hidden;
      designBtn.classList.toggle('is-on', open);
      designBtn.setAttribute('aria-expanded', String(open));
    };

    const collapseAssist = () => {
      if (!assist || !s.drawing) return;
      assist.dataset.autoCollapsed = 'true';
      assist.style.setProperty('display', 'none', 'important');
    };
    const revealAssist = () => {
      if (!assist) return;
      delete assist.dataset.autoCollapsed;
      assist.style.removeProperty('display');
    };
    const closeCtx = () => {
      if (!s.ctx || s.ctx.hidden) return;
      s.ctxOpen = false;
      s.ctx.hidden = true;
      s.updateRotHandle && s.updateRotHandle();
    };
    const closeLayerMenu = () => {
      if (!s.lmenu || s.lmenu.hidden) return;
      s.closeLayerMenu ? s.closeLayerMenu() : (s.lmenu.hidden = true);
    };
    const closeHelp = () => {
      if (s.helpOpen && s.helpOpen()) s.toggleHelp && s.toggleHelp(false);
    };
    const closeLibrary = () => {
      if (s.lib && !s.lib.hidden) s.libOpen && s.libOpen(false);
    };
    const closePanel = () => {
      if (s.panel && !s.panel.hidden && s.tools) s.tools(false);
      queueMicrotask(syncDesignState);
    };
    const closeLab = () => {
      const lab = root.querySelector('.st-s9-panel');
      if (lab && !lab.hidden) lab.hidden = true;
    };
    const closeSave = () => {
      root.querySelectorAll('.st-save').forEach(el => { if (!el.hidden) el.hidden = true; });
      root.querySelectorAll('[data-studio-export]').forEach(el => el.setAttribute('aria-expanded', 'false'));
    };
    let folding = false;
    const foldMobileTrays = keep => {
      if (!compact() || folding || !s.trays) return;
      folding = true;
      let changed = false;
      ['layers', 'panel'].forEach(name => {
        if (name === keep) return;
        const tray = s.trays[name];
        if (tray && !tray.hidden && !tray.classList.contains('is-folded')) {
          tray.classList.add('is-folded');
          changed = true;
        }
      });
      if (changed) queueMicrotask(() => s.layoutTrays && s.layoutTrays());
      folding = false;
    };

    const closeExtras = (keep = '') => {
      if (keep !== 'fly') s.closeFly && s.closeFly();
      if (keep !== 'dock') s.closeGrp && s.closeGrp();
      if (keep !== 'panel') closePanel();
      if (keep !== 'ctx') closeCtx();
      if (keep !== 'layer') closeLayerMenu();
      if (keep !== 'help') closeHelp();
      if (keep !== 'lib') closeLibrary();
      if (keep !== 'save') closeSave();
      if (keep !== 'lab') closeLab();
      if (keep !== 'assist') collapseAssist();
      if (keep !== 'layers') foldMobileTrays(keep === 'panel' ? 'panel' : '');
    };
    s.closeStudioMenus = closeExtras;
    s.collapseDrawMenus = () => { closeExtras(); collapseAssist(); };

    root.addEventListener('pointerdown', e => {
      const closest = e.target.closest && e.target.closest.bind(e.target);
      if (!closest) return;
      if (s.drawing && closest('.st-draw-pad')) {
        closeExtras();
        collapseAssist();
        return;
      }
      const t = closest('[data-flyout],[data-grp-btn],[data-studio-tools],.st-edit,.st-lmore,[data-studio-keys],[data-studio-lib],[data-studio-export]');
      if (!t) return;
      if (t.matches('[data-flyout]')) closeExtras('fly');
      else if (t.matches('[data-grp-btn]')) closeExtras('dock');
      else if (t.matches('[data-studio-tools]')) closeExtras('panel');
      else if (t.matches('.st-edit')) closeExtras('ctx');
      else if (t.matches('.st-lmore')) { closeExtras('layer'); foldMobileTrays('layers'); }
      else if (t.matches('[data-studio-keys]')) closeExtras('help');
      else if (t.matches('[data-studio-lib]')) closeExtras('lib');
      else if (t.matches('[data-studio-export]')) closeExtras('save');
    }, true);

    if (drawBtn) drawBtn.addEventListener('click', e => {
      if (!s.drawing || !assist || assist.dataset.autoCollapsed !== 'true') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      closeExtras('assist');
      revealAssist();
    }, true);

    const baseSetDrawing = s.setDrawing.bind(s);
    s.setDrawing = on => {
      revealAssist();
      return baseSetDrawing(on);
    };

    const baseOpenCtx = s.openCtxBar && s.openCtxBar.bind(s);
    if (baseOpenCtx) s.openCtxBar = (...a) => { closeExtras('ctx'); return baseOpenCtx(...a); };

    const baseLib = s.libOpen && s.libOpen.bind(s);
    if (baseLib) s.libOpen = on => { if (on) closeExtras('lib'); return baseLib(on); };

    const baseHelp = s.toggleHelp && s.toggleHelp.bind(s);
    if (baseHelp) s.toggleHelp = on => {
      const willOpen = on === undefined ? !(s.helpOpen && s.helpOpen()) : !!on;
      if (willOpen) closeExtras('help');
      return baseHelp(on);
    };

    const baseTools = s.tools && s.tools.bind(s);
    if (baseTools) s.tools = on => {
      if (on) { closeExtras('panel'); foldMobileTrays('panel'); }
      const out = baseTools(on);
      queueMicrotask(syncDesignState);
      return out;
    };
    syncDesignState();

    const watchCompactTrays = () => {
      const layers = s.trays && s.trays.layers;
      if (!layers || layers.__exclusiveWatch) return;
      layers.__exclusiveWatch = true;
      new MutationObserver(() => {
        if (!compact() || folding || layers.hidden || layers.classList.contains('is-folded')) return;
        closeExtras('layers');
      }).observe(layers, { attributes: true, attributeFilter: ['class', 'hidden'] });
    };
    watchCompactTrays();
    setTimeout(watchCompactTrays, 700);

    const watchLab = () => {
      const lab = root.querySelector('.st-s9-panel');
      if (!lab || lab.__exclusiveWatch) return;
      lab.__exclusiveWatch = true;
      new MutationObserver(() => { if (!lab.hidden) closeExtras('lab'); }).observe(lab, { attributes: true, attributeFilter: ['hidden'] });
    };
    watchLab();
    new MutationObserver(() => { watchLab(); watchCompactTrays(); }).observe(root, { childList: true, subtree: true });

    // Surface styles can replace/hide Cerebra's original core. When that is
    // actually true in the renderer, Shape/Colour/Core/Motion have no visible
    // effect, so remove those tabs instead of leaving dead controls on screen.
    const syncCoreTabs = () => {
      const tune = document.getElementById('tune'); if (!tune) return;
      const hide = s.subject < 0 && !!(s.coreFxHidden && s.coreFxHidden());
      let selectedHidden = false;
      ['shape','colour','core','motion'].forEach(k => {
        const b = tune.querySelector(`[data-tab="${k}"]`); if (!b) return;
        if (hide && b.getAttribute('aria-selected') === 'true') selectedHidden = true;
        b.hidden = hide;
        const p = tune.querySelector(`[data-pane="${k}"]`); if (p && hide) p.hidden = true;
      });
      if (hide && selectedHidden) {
        const surface = tune.querySelector('[data-tab="surface-deep"]');
        if (surface && !surface.hidden) surface.click();
      }
    };
    const baseAvail = s.updateAvail && s.updateAvail.bind(s);
    if (baseAvail) s.updateAvail = (...a) => { const out = baseAvail(...a); queueMicrotask(syncCoreTabs); return out; };
    setTimeout(syncCoreTabs, 1200);
  }
  setTimeout(boot, 0);
})();
