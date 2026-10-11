/* Reorder only the commands inside the horizontal Studio toolbar. */
(() => {
  function boot() {
    const s = window.__cerebra?.studio, dock = s?.el.querySelector('.st-dock');
    if (!dock || !dock.querySelector('[data-s9-entry]')) { setTimeout(boot, 180); return; }
    if (s.__dockOrderReady) return; s.__dockOrderReady = true;
    const key = 'cerebra-studio-dock-order-v1', defaults = ['tune', 'effect', 'design', 'lab', 'view', 'save', 'setting', 'reset', 'zoom'];
    const selectors = ['[data-studio-tune]', '[data-grp="fx"]', '[data-studio-tools]', '[data-s9-entry]', '[data-grp="view"]', '[data-grp="save"]', '[data-grp="settings"]', '[data-studio-reset-all]', '[data-grp="zoom"]'];
    const nodes = Object.fromEntries(defaults.map((k, i) => [k, dock.querySelector(selectors[i])]));
    let order = defaults.slice(); try { const a = JSON.parse(localStorage.getItem(key)); if (Array.isArray(a)) order = [...new Set(a.filter(k => defaults.includes(k))), ...defaults.filter(k => !a.includes(k))]; } catch (e) {}
    // Migrate saved orders so Zoom starts immediately after Reset.
    order = order.filter(k => k !== 'zoom'); order.splice(order.indexOf('reset') + 1, 0, 'zoom');
    const visible = () => [...dock.children].filter(el => el.dataset.dockKey && !el.hidden && el.getClientRects().length);
    const apply = () => {
      const more = dock.querySelector(':scope > [data-grp="more"]');
      order.forEach(k => { const n = nodes[k]; if (n?.parentNode === dock) dock.insertBefore(n, more); });
      s.layoutTrays();
    };
    const save = () => { try { localStorage.setItem(key, JSON.stringify(order)); } catch (e) {} };
    defaults.forEach(k => { const n = nodes[k]; n.dataset.dockKey = k; const b = n.matches('button') ? n : n.querySelector(':scope > button'); b.title = 'Drag within this toolbar to reorder. Alt + Left/Right also moves this menu.'; });
    const css = document.createElement('style'); css.textContent = '.st-dock.is-h>[data-dock-key],.st-dock.is-h>[data-dock-key]>button{touch-action:none}.st-dock [data-dock-key].is-reordering{opacity:.55;outline:2px solid #c9a8ff;outline-offset:2px}.st-dock.is-reordering{cursor:grabbing}'; document.head.append(css);
    let drag = null, suppressUntil = 0;
    const inside = e => { const r = dock.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 12 && e.clientY <= r.bottom + 12; };
    dock.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !dock.classList.contains('is-h') || e.target.closest('.st-sub')) return;
      const item = e.target.closest('[data-dock-key]'); if (!item || item.parentNode !== dock) return;
      drag = { id: e.pointerId, item, x: e.clientX, y: e.clientY, start: order.slice(), moved: false };
    }, true);
    const move = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      if (!drag.moved) { drag.moved = true; s.closeGrp?.(); dock.setPointerCapture(e.pointerId); drag.item.classList.add('is-reordering'); dock.classList.add('is-reordering'); }
      e.preventDefault(); if (!inside(e)) return;
      const list = visible(), other = list.filter(n => n !== drag.item); if (!other.length) return;
      const target = list.reduce((best, n) => { const r = n.getBoundingClientRect(); return Math.abs(r.x + r.width / 2 - e.clientX) < best.d ? { n, d: Math.abs(r.x + r.width / 2 - e.clientX) } : best; }, { n: null, d: Infinity }).n;
      if (target === drag.item) return;
      const a = order.indexOf(drag.item.dataset.dockKey), b = order.indexOf(target.dataset.dockKey);
      if (a !== b) { const k = order.splice(a, 1)[0]; order.splice(b, 0, k); apply(); }
    };
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (d.moved) { if (e.type === 'pointercancel' || !inside(e)) { order = d.start; apply(); } else save(); suppressUntil = performance.now() + 500; d.item.classList.remove('is-reordering'); dock.classList.remove('is-reordering'); e.preventDefault(); }
      if (dock.hasPointerCapture(e.pointerId)) dock.releasePointerCapture(e.pointerId);
    };
    window.addEventListener('pointermove', move, { capture: true, passive: false }); window.addEventListener('pointerup', end, true); window.addEventListener('pointercancel', end, true);
    dock.addEventListener('lostpointercapture', e => { if (e.target === dock && drag) end({ pointerId: e.pointerId, type: 'pointercancel', preventDefault() {} }); });
    dock.addEventListener('click', e => { if (performance.now() < suppressUntil) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    dock.addEventListener('keydown', e => {
      if (!e.altKey || !['ArrowLeft', 'ArrowRight'].includes(e.key) || !dock.classList.contains('is-h') || e.target.closest('.st-sub')) return;
      const n = e.target.closest('[data-dock-key]'), list = visible(), i = list.indexOf(n), next = list[i + (e.key === 'ArrowLeft' ? -1 : 1)]; if (!next) return;
      e.preventDefault(); const a = order.indexOf(n.dataset.dockKey), b = order.indexOf(next.dataset.dockKey); [order[a], order[b]] = [order[b], order[a]]; apply(); save(); e.target.focus();
    });
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'st-btn'; reset.textContent = 'Reset toolbar order'; reset.dataset.dockOrderReset = '';
    reset.onclick = () => { order = defaults.slice(); try { localStorage.removeItem(key); } catch (e) {} apply(); s.closeGrp?.(); };
    nodes.setting.querySelector('.st-sub').append(reset);
    matchMedia('(max-width:600px)').addEventListener('change', () => queueMicrotask(apply)); apply();
  }
  setTimeout(boot, 0);
})();
