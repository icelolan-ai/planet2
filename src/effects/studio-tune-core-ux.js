/* Studio Tune Core UX — Design chooses the surface/shape; Tune Core only edits deep detail. */
(() => {
  function boot() {
    const app = window.__cerebra, s = app && app.studio, tune = document.getElementById('tune');
    if (!s || !tune || !s.coreFxTarget || !s.__deepSurfaceTune) { setTimeout(boot, 180); return; }
    if (s.__tuneCoreUxReady) return; s.__tuneCoreUxReady = true;

    const toggle = document.querySelector('[data-tune-toggle]');
    const css = document.createElement('style');
    css.textContent = `
      /* Tune Core belongs to Studio only. */
      body:not(.studio-on) [data-tune-toggle],
      body:not(.studio-on) #tune{display:none!important}
      /* Save already exists in the Studio dock; do not duplicate it here. */
      #tune [data-tab="save"],#tune [data-pane="save"]{display:none!important}
      /* Design owns Surface Style + Base Shape selection. Tune Core is detail-only. */
      #tune .dst-grid{display:none!important}
      #tune .ss-tune-group [data-ss-tshape]{display:none!important}
      #tune .ss-tune-group label:has([data-ss-tshape]){display:none!important}
    `;
    document.head.append(css);

    const inStudio = () => !!(s.active && document.body.classList.contains('studio-on'));
    let syncing = false;

    const surfaceState = () => {
      const t = s.coreFxTarget && s.coreFxTarget(), v = t && t.tune;
      return { target: t, tune: v, style: v && (v.s_style || 'none'), shape: v && (v.s_shape || 'sphere') };
    };

    const sanitizeDetail = () => {
      const detailTab = tune.querySelector('[data-tab="surface-deep"]');
      const detailPane = tune.querySelector('[data-pane="surface-deep"]');
      if (!detailTab || !detailPane) return;
      detailTab.textContent = 'Detail';
      detailTab.setAttribute('aria-label', 'Deep tuning for the selected Design surface');
      const grid = detailPane.querySelector('.dst-grid'); if (grid) grid.hidden = true;
      const tg = detailPane.querySelector('.ss-tune-group');
      if (tg) {
        // This pane is observed below: replacing an unchanged text node would
        // retrigger the observer forever and starve rendering/input.
        const h = tg.querySelector('h4'); if (h && h.textContent !== 'Shape detail') h.textContent = 'Shape detail';
        const shapeSelect = tg.querySelector('[data-ss-tshape]');
        if (shapeSelect) { const row = shapeSelect.closest('label,.tune-row'); if (row) row.hidden = true; }
      }
      const { style } = surfaceState(), generated = !!style && style !== 'none';
      detailTab.hidden = !generated;
      if (!generated && detailTab.getAttribute('aria-selected') === 'true') {
        const fallback = tune.querySelector('[data-tab="shape"]:not([hidden]),[data-tab="core"]:not([hidden]),[data-tab="fx"]:not([hidden])');
        if (fallback) fallback.click();
      }
    };

    const removeDuplicateSave = () => {
      const tab = tune.querySelector('[data-tab="save"]'), pane = tune.querySelector('[data-pane="save"]');
      const wasSelected = !!(tab && tab.getAttribute('aria-selected') === 'true');
      if (tab) tab.remove();
      if (pane) pane.remove();
      if (wasSelected) {
        const { style } = surfaceState();
        const fallback = tune.querySelector(style && style !== 'none' ? '[data-tab="surface-deep"]' : '[data-tab="shape"]');
        if (fallback && !fallback.hidden) fallback.click();
      }
    };

    const scopeTuneCore = () => {
      if (syncing) return; syncing = true;
      const studio = inStudio();
      if (toggle) { toggle.hidden = !studio; toggle.setAttribute('aria-hidden', String(!studio)); }
      document.querySelectorAll('[data-fab-go="core"]').forEach(b => { b.hidden = !studio; });
      document.querySelectorAll('[data-at-tune]').forEach(b => {
        if (/core/i.test((b.textContent || '').trim())) b.hidden = !studio;
      });
      if (!studio && tune.dataset.open === 'true') {
        const close = tune.querySelector('[data-tune-close]');
        if (close) close.click(); else { tune.dataset.open = 'false'; if (toggle) toggle.setAttribute('aria-expanded', 'false'); }
      }
      syncing = false;
    };

    const sync = () => { removeDuplicateSave(); sanitizeDetail(); scopeTuneCore(); };
    sync();

    const baseSync = s.syncCoreFx && s.syncCoreFx.bind(s);
    if (baseSync) s.syncCoreFx = (...a) => { const r = baseSync(...a); queueMicrotask(sync); return r; };

    new MutationObserver(() => queueMicrotask(sync)).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(() => queueMicrotask(scopeTuneCore)).observe(tune, { attributes: true, attributeFilter: ['data-open'] });
    const detailPane = tune.querySelector('[data-pane="surface-deep"]');
    if (detailPane) new MutationObserver(() => queueMicrotask(sanitizeDetail)).observe(detailPane, { childList: true, subtree: true });

    const atelier = document.querySelector('.atelier');
    if (atelier) new MutationObserver(() => queueMicrotask(scopeTuneCore)).observe(atelier, { childList: true, subtree: true });
    setTimeout(sync, 400); setTimeout(sync, 1200);
  }
  setTimeout(boot, 0);
})();
