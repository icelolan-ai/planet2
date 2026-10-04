/* Legacy GitHub Pages compatibility bridge.
   Purpose: the old split deployment can source-load newer Studio modules while a full rebuilt bundle is pending.
   This file must do nothing inside a normal rebuilt app bundle. */
(() => {
  if (!window.__cerebraLegacyBridgeWanted || window.__cerebraCompatReady) return;
  window.__cerebraCompatReady = true;

  const load = (src, mark) => new Promise((ok, no) => {
    if (mark && document.querySelector(`script[${mark}]`)) { ok(); return; }
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    if (mark) el.setAttribute(mark, '1');
    el.onload = ok;
    el.onerror = no;
    document.body.appendChild(el);
  });

  (async () => {
    const app = window.__cerebra;
    const studio = app && app.studio;

    if (!(studio && studio.__menuFixReady)) {
      await load('src/effects/studio-menu-fix.js?v=20261004f', 'data-studio-menu-fix');
    }

    if (!(typeof SURFACE !== 'undefined' && SURFACE && SURFACE.__shapePatch)) {
      await load('src/effects/surface-shapes.js?v=20261004f', 'data-surface-shapes');
    }

    const s2 = window.__cerebra && window.__cerebra.studio;
    if (!(s2 && s2.__deepSurfaceTune)) {
      await load('src/effects/surface-tune-core.js?v=20261004f', 'data-deep-surface-tune');
    }

    if (!window.__cerebraS9) {
      await load('src/effects/s9-core.js?v=20261004f', 'data-s9-core');
    }
    if (!document.querySelector('.st-s9-panel')) {
      await load('src/effects/s9-ui.js?v=20261004f', 'data-s9-ui');
    }
  })().catch(e => console.error('Cerebra compatibility bridge failed', e));
})();
