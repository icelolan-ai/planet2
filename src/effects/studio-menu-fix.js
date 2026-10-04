/* Studio menu behaviour — keep floating controls exclusive and clear the canvas while drawing. */
(() => {
  function boot() {
    const app = window.__cerebra, s = app && app.studio;
    if (!s || !s.el || !s.drawPad || !s.setDrawing) { setTimeout(boot, 180); return; }
    if (s.__menuFixReady) return; s.__menuFixReady = true;

    const root = s.el;
    const assist = root.querySelector('.st-assist');
    const drawBtn = root.querySelector('[data-studio-draw]');

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
    };
    const closeLab = () => {
      const lab = root.querySelector('.st-s9-panel');
      if (lab && !lab.hidden) lab.hidden = true;
    };
    const closeSave = () => {
      root.querySelectorAll('.st-save').forEach(el => { if (!el.hidden) el.hidden = true; });
      root.querySelectorAll('[data-studio-export]').forEach(el => el.setAttribute('aria-expanded', 'false'));
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
      else if (t.matches('.st-lmore')) closeExtras('layer');
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
    if (baseTools) s.tools = on => { if (on) closeExtras('panel'); return baseTools(on); };

    const watchLab = () => {
      const lab = root.querySelector('.st-s9-panel');
      if (!lab || lab.__exclusiveWatch) return;
      lab.__exclusiveWatch = true;
      new MutationObserver(() => { if (!lab.hidden) closeExtras('lab'); }).observe(lab, { attributes: true, attributeFilter: ['hidden'] });
    };
    watchLab();
    new MutationObserver(watchLab).observe(root, { childList: true, subtree: true });
  }
  setTimeout(boot, 0);
})();
