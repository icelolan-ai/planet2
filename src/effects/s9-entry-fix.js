/* S9 Lab entry point — attach a visible Lab button to the current Studio toolbar.
   S9 UI originally targeted a legacy `.st-rail` container that no longer exists. */
(() => {
  function boot() {
    const app = window.__cerebra, s = app && app.studio, api = window.__cerebraS9;
    if (!s || !s.el || !api || !api.uiReady) { setTimeout(boot, 180); return; }
    if (s.__s9EntryReady) return;

    const panel = s.el.querySelector('.st-s9-panel');
    if (!panel) { setTimeout(boot, 180); return; }

    let button = s.el.querySelector('[data-s9-entry]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'st-btn st-s9-entry';
      button.dataset.s9Entry = '1';
      button.setAttribute('aria-label', 'Open Water Lab');
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<span aria-hidden="true">✦</span><span class="st-label">Lab</span>';

      const draw = s.el.querySelector('[data-studio-draw]');
      const tools = s.el.querySelector('[data-studio-tools]');
      const design = s.el.querySelector('[data-studio-design]');
      const anchor = design || tools || draw;
      if (anchor && anchor.parentNode) anchor.insertAdjacentElement('afterend', button);
      else s.el.append(button);
    }

    const syncButton = () => button.setAttribute('aria-expanded', String(!panel.hidden));
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const open = panel.hidden;
      if (open && s.closeStudioMenus) s.closeStudioMenus('lab');
      panel.hidden = !open;
      if (open && api.onSync) api.onSync();
      syncButton();
    });

    const close = panel.querySelector('[data-s9-close]');
    close && close.addEventListener('click', () => queueMicrotask(syncButton));
    new MutationObserver(syncButton).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    syncButton();
    s.__s9EntryReady = true;
  }
  setTimeout(boot, 0);
})();
