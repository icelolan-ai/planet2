/* Inner-particle history and colours for selected text ranges. */
(() => {
  function boot() {
    const s = window.__cerebra?.studio, tune = window.CerebraTune;
    if (!s || !tune?.applySwarm || !s.__deepSurfaceTune) { setTimeout(boot, 180); return; }
    if (s.__detailControlsReady) return; s.__detailControlsReady = true;
    const keys = ['swarm', 'swsize', 'swcolor', 'swblink', 'swrate'];
    const capture = () => { const v = tune.snapshot(); return v && Object.fromEntries(keys.map(k => [k, v[k]])); };
    const snapshot = s.snapshot.bind(s);
    s.snapshot = extra => { const d = JSON.parse(snapshot(extra)); d.innerParticles = capture(); return JSON.stringify(d); };
    s.hist = s.hist.map(text => { const d = JSON.parse(text); d.innerParticles = capture(); return JSON.stringify(d); });
    const restore = s.restore.bind(s);
    s.restore = text => { const d = JSON.parse(text), r = restore(text); if (d.innerParticles) tune.applySwarm(d.innerParticles); textRange = null; return r; };
    const selector = '[data-t-swarm],[data-t-swsize],[data-t-swcolor],[data-t-swblink],[data-t-swrate]';
    const panel = document.getElementById('tune'); let pending = null;
    panel.addEventListener('pointerdown', e => { if (s.active && (e.target.matches(selector) || e.target.closest('[data-t-swsw]') || e.target.matches('[data-t-reset]'))) s.flushCommit(); }, true);
    panel.addEventListener('input', e => { if (!s.active || !e.target.matches(selector)) return; if (pending && pending !== e.target) s.flushCommit(); pending = e.target; s.commitSoon(); });
    panel.addEventListener('change', e => { if (s.active && e.target.matches(selector)) { s.flushCommit(); pending = null; } });
    panel.addEventListener('click', e => { if (s.active && (e.target.closest('[data-t-swsw] button[data-c]') || e.target.matches('[data-t-reset]'))) s.commit(); });

    const input = s.ctx.querySelector('[data-ctx-content]'), picker = s.ctx.querySelector('[data-ctx-color]');
    let textRange = null;
    const valid = c => /^#[0-9a-f]{6}$/i.test(c);
    const colours = it => { const a = Array(it.content.length).fill(null); (it.textColors || []).forEach(r => { if (valid(r.color)) for (let n = Math.max(0, r.start); n < Math.min(a.length, r.end); n++) a[n] = r.color; }); return a; };
    const pack = a => { const r = []; a.forEach((color, i) => { if (!color) return; const last = r[r.length - 1]; if (last && last.end === i && last.color === color) last.end++; else r.push({ start: i, end: i + 1, color }); }); return r; };
    const render = it => {
      if (!it || it.kind !== 'text' || it.el.isContentEditable) return;
      it._coloredContent = it.content;
      const a = colours(it); if (!a.some(Boolean)) { it.el.textContent = it.content; return; }
      const f = document.createDocumentFragment(); let start = 0;
      while (start < a.length) { let end = start + 1; while (end < a.length && a[end] === a[start]) end++; const span = document.createElement('span'); span.textContent = it.content.slice(start, end); if (a[start]) { span.style.color = a[start]; span.style.webkitTextStrokeColor = a[start]; } f.append(span); start = end; }
      it.el.replaceChildren(f);
    };
    // Keep colours attached to unchanged text when typing, deleting or pasting.
    const remap = (it, before, after) => {
      const a = colours({ ...it, content: before }); let p = 0, q = 0;
      while (p < before.length && p < after.length && before[p] === after[p]) p++;
      while (q < before.length - p && q < after.length - p && before[before.length - 1 - q] === after[after.length - 1 - q]) q++;
      const inherited = a[p] || a[p - 1] || null;
      it.textColors = pack(a.slice(0, p).concat(Array(after.length - p - q).fill(inherited), q ? a.slice(before.length - q) : [])); it._coloredContent = after;
    };
    const place = s.place.bind(s); s.place = it => { const r = place(it); render(it); return r; };
    const addItem = s.addItem.bind(s); s.addItem = (kind, opts) => {
      const it = addItem(kind, opts); if (kind !== 'text') return it;
      it._coloredContent = it.content;
      it.el.addEventListener('input', () => { const before = it._coloredContent ?? it.content; remap(it, before, it.content); });
      it.el.addEventListener('blur', () => render(it)); render(it); return it;
    };
    s.items.filter(it => it.kind === 'text').forEach(it => { it._coloredContent = it.content; it.el.addEventListener('input', () => remap(it, it._coloredContent ?? it.content, it.content)); it.el.addEventListener('blur', () => render(it)); });
    const remember = () => {
      const it = s.sel; if (!it || it.kind !== 'text') { textRange = null; return; }
      if (document.activeElement === input) { textRange = input.selectionEnd > input.selectionStart ? { it, start: input.selectionStart, end: input.selectionEnd } : null; return; }
      const sel = getSelection(); if (!sel?.rangeCount) return; const r = sel.getRangeAt(0);
      if (!it.el.contains(r.startContainer) || !it.el.contains(r.endContainer)) return;
      const pre = r.cloneRange(); pre.selectNodeContents(it.el); pre.setEnd(r.startContainer, r.startOffset);
      textRange = r.collapsed ? null : { it, start: pre.toString().length, end: pre.toString().length + r.toString().length };
    };
    document.addEventListener('selectionchange', remember);
    picker.addEventListener('pointerdown', remember);
    input.oninput = e => { const it = s.sel; if (!it || it.kind !== 'text') return; const before = it.content; it.content = e.target.value; remap(it, before, it.content); it.edited = true; textRange = null; s.place(it); s.renderLayers(); s.commitSoon(); };
    picker.oninput = () => {
      const it = s.sel; if (!it || it.kind !== 'text') return;
      if (textRange?.it === it && textRange.end > textRange.start) { const a = colours(it); for (let n = textRange.start; n < Math.min(a.length, textRange.end); n++) a[n] = picker.value; it.textColors = pack(a); }
      else { it.color = picker.value; it.textColors = []; }
      it.edited = true; s.place(it); s.renderLayers(); s.commitSoon();
    };
    picker.addEventListener('change', () => s.flushCommit());
    const select = s.select.bind(s); s.select = it => { if (it !== s.sel) textRange = null; return select(it); };
    const hint = document.createElement('small'); hint.textContent = 'Highlight characters in Text, then choose a colour. Without a highlight, colour the whole layer.';
    hint.style.cssText = 'display:block;max-width:270px;font-size:10px;line-height:1.4;opacity:.75';
    const row = document.createElement('label'); row.className = 'st-fly-row'; row.innerHTML = '<span>Text colour</span>';
    const colour = picker.cloneNode(); colour.removeAttribute('data-ctx-color'); colour.removeAttribute('data-pk'); colour.setAttribute('aria-label', 'Highlighted text colour'); row.append(colour);
    const fly = s.el.querySelector('[data-fly="textdesign"]'); fly.prepend(row, hint);
    colour.addEventListener('pointerdown', remember); colour.addEventListener('input', () => { picker.value = colour.value; picker.dispatchEvent(new Event('input', { bubbles: true })); }); colour.addEventListener('change', () => s.flushCommit());
    let sampledRange = null;
    const startPick = s.startPick.bind(s); s.startPick = target => { sampledRange = target === picker || target === colour ? textRange : null; return startPick(target); };
    const setPicked = s.setPicked.bind(s); s.setPicked = (target, hex) => { if ((target === picker || target === colour) && sampledRange?.it === s.sel) textRange = sampledRange; const r = setPicked(target, hex); sampledRange = null; return r; };
    const syncText = s.syncText.bind(s); s.syncText = () => { const r = syncText(); if (s.sel?.kind === 'text') colour.value = picker.value = s.sel.color; return r; };
    s.drawColoredTextLine = (gx, el, raw, xx, yy, offset, sx, style, stroked) => {
      const it = s.items.find(i => i.el === el); if (!it?.textColors?.length) return false;
      const a = colours(it), upper = style.textTransform === 'uppercase', line = upper ? raw.toUpperCase() : raw;
      const width = gx.measureText(line).width, x0 = gx.textAlign === 'right' ? xx - width : gx.textAlign === 'center' ? xx - width / 2 : xx;
      gx.textAlign = 'left'; let start = 0;
      while (start < raw.length) { const c = a[offset + start] || it.color; let end = start + 1; while (end < raw.length && (a[offset + end] || it.color) === c) end++; const prefix = raw.slice(0, start), text = raw.slice(start, end), tx = x0 + gx.measureText(upper ? prefix.toUpperCase() : prefix).width;
        gx.fillStyle = c; if (stroked) { gx.strokeStyle = c; gx.lineWidth = parseFloat(style.webkitTextStrokeWidth) * sx; gx.lineJoin = 'round'; gx.strokeText(upper ? text.toUpperCase() : text, tx, yy); } else gx.fillText(upper ? text.toUpperCase() : text, tx, yy);
        if (/underline/.test(style.textDecorationLine || style.textDecoration)) gx.fillRect(tx, yy + parseFloat(style.fontSize) * sx * .98, gx.measureText(upper ? text.toUpperCase() : text).width, Math.max(1, parseFloat(style.fontSize) * sx * .06)); start = end;
      }
      return true;
    };
  }
  setTimeout(boot, 0);
})();
