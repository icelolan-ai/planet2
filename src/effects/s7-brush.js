/* S7 — Tentacle / Branch brushes + symmetry for Studio drawings.
   Loaded with the other effect modules, then patched onto CoreStudio after app startup. */
(() => {
  const savePrefs = s => { try { localStorage.setItem('cerebra-studio-pencil', JSON.stringify(s.drawSet)); } catch (_) {} };
  const thin = pts => {
    if (pts.length <= 120) return pts;
    const step = (pts.length - 1) / 119;
    return Array.from({ length: 120 }, (_, i) => pts[Math.min(pts.length - 1, Math.round(i * step))]);
  };
  const pathD = pts => pts.length ? `M${pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}` : '';
  const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  function boot() {
    const s = window.__cerebra && window.__cerebra.studio;
    if (!s || !s.drawPad || !s.addStrokeAbs || !s.writeStrokes) { setTimeout(boot, 180); return; }
    if (s.__s7Ready) return; s.__s7Ready = true;

    Object.assign(s.drawSet, {
      symMode: s.drawSet.symMode || 'off',
      symN: Math.max(2, Math.min(12, +(s.drawSet.symN || 6))),
      tFlow: +(s.drawSet.tFlow ?? .55),
      bCount: Math.max(2, Math.min(10, +(s.drawSet.bCount || 5)))
    });

    const style = document.createElement('style');
    style.textContent = `
      #studio .st-s7-row{display:flex;align-items:center;gap:8px;min-width:0;padding:7px 0 1px;border-top:1px solid #ffffff18}
      #studio .st-s7-lab{font:600 9px var(--f-cond);letter-spacing:.08em;text-transform:uppercase;color:#aeb5c2;white-space:nowrap}
      #studio .st-s7-row .st-assist-seg{min-width:0;overflow-x:auto;scrollbar-width:none}
      #studio .st-s7-row .st-assist-seg::-webkit-scrollbar{display:none}
      #studio .st-s7-row button{min-height:36px;white-space:nowrap}
      #studio .st-s7-n{display:flex;align-items:center;gap:5px;color:#ccd2dc;font:10px var(--f-cond);white-space:nowrap}
      #studio .st-s7-n input{width:64px}
      @media(max-width:760px){#studio .st-s7-row{gap:6px}.st-s7-lab{display:none!important}#studio .st-s7-row button{min-height:40px}}
    `;
    document.head.append(style);

    const bar = s.el.querySelector('.st-assist');
    const tools = bar && bar.querySelector('.st-assist-seg[aria-label="Tool"]');
    if (!bar || !tools) return;
    [['tentacle', 'Tentacle'], ['branch', 'Branch']].forEach(([k, label]) => {
      if (tools.querySelector(`[data-atool="${k}"]`)) return;
      const b = document.createElement('button'); b.type = 'button'; b.dataset.atool = k; b.textContent = label;
      b.addEventListener('click', () => s.setDrawTool && s.setDrawTool(k)); tools.append(b);
    });

    const row = document.createElement('div'); row.className = 'st-s7-row';
    row.innerHTML = '<span class="st-s7-lab">Symmetry</span><div class="st-assist-seg" role="group" aria-label="Symmetry"><button type="button" data-sym="off">Off</button><button type="button" data-sym="v">Mirror V</button><button type="button" data-sym="h">Mirror H</button><button type="button" data-sym="radial">Radial</button></div><label class="st-s7-n">N <input type="range" min="2" max="12" step="1" data-sym-n><b data-sym-out></b></label>';
    bar.append(row);
    const syncSym = () => {
      row.querySelectorAll('[data-sym]').forEach(b => b.classList.toggle('is-on', b.dataset.sym === s.drawSet.symMode));
      const n = row.querySelector('[data-sym-n]'); n.value = s.drawSet.symN; row.querySelector('[data-sym-out]').textContent = s.drawSet.symN;
      row.querySelector('.st-s7-n').hidden = s.drawSet.symMode !== 'radial';
    };
    row.querySelectorAll('[data-sym]').forEach(b => b.addEventListener('click', () => { s.drawSet.symMode = b.dataset.sym; savePrefs(s); syncSym(); }));
    row.querySelector('[data-sym-n]').addEventListener('input', e => { s.drawSet.symN = +e.target.value; savePrefs(s); syncSym(); });
    syncSym();

    const center = () => { const r = s.drawPad.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const transformPts = (P, mode, n) => {
      if (mode === 'off') return [P];
      const [cx, cy] = center();
      if (mode === 'v') return [P, P.map(([x, y]) => [2 * cx - x, y])];
      if (mode === 'h') return [P, P.map(([x, y]) => [x, 2 * cy - y])];
      const out = [];
      for (let k = 0; k < n; k++) {
        const a = k * Math.PI * 2 / n, ca = Math.cos(a), sa = Math.sin(a);
        out.push(P.map(([x, y]) => { const dx = x - cx, dy = y - cy; return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca]; }));
      }
      return out;
    };

    const addBatch = entries => {
      const t = s.items.find(i => i.kind === 'stroke' && i.drawCur && !i.locked && !i.rot);
      let all = t ? s.strokesAbs(t) : [], lines = t ? t.strokes.filter(o => o.type === 'line').length : 0;
      const clip = !!(t && t.alphaLock && t.strokes.length), mode = s.drawSet.symMode || 'off', n = s.drawSet.symN || 6;
      for (const { sk, pts } of entries) {
        const copies = transformPts(thin(pts), mode, n);
        for (const abs of copies) {
          if (sk.type === 'line' && lines >= 200) break;
          all.push({ ...(clip ? { ...sk, clip: true } : sk), abs });
          if (sk.type === 'line') lines++;
        }
      }
      if (!entries.length) return false;
      s.writeStrokes(t, all); return true;
    };

    const baseAdd = s.addStrokeAbs.bind(s);
    s.addStrokeAbs = (sk, P) => (s.drawSet.symMode && s.drawSet.symMode !== 'off') ? addBatch([{ sk, pts: P }]) : baseAdd(sk, P);

    let drag = null;
    const preview = P => {
      s.ink.setAttribute('stroke', s.drawSet.color); s.ink.setAttribute('stroke-width', s.drawSet.size); s.ink.setAttribute('opacity', s.drawSet.opacity);
      s.ink.setAttribute('stroke-dasharray', s.dashArr({ lineW: s.drawSet.size, dash: s.drawSet.dash }).join(' '));
      s.ink.setAttribute('d', pathD(P));
    };
    const tentacle = raw => {
      if (raw.length < 2) return raw;
      const out = [], flow = Math.max(.05, Math.min(1, s.drawSet.tFlow || .55));
      for (let i = 0; i < raw.length; i++) {
        const a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const amp = Math.min(18, s.drawSet.size * 1.4 + 5) * flow * Math.sin(i * .72);
        out.push([raw[i][0] - dy / L * amp, raw[i][1] + dx / L * amp]);
      }
      return thin(out);
    };
    const branchStrokes = raw => {
      const trunk = thin(raw), out = [{ sk: { color: s.drawSet.color, size: s.drawSet.size, opacity: s.drawSet.opacity, dash: s.drawSet.dash }, pts: trunk }];
      if (trunk.length < 5) return out;
      const rand = seeded(((performance.now() * 1000) | 0) >>> 0), count = Math.min(s.drawSet.bCount || 5, Math.floor(trunk.length / 3));
      for (let j = 1; j <= count; j++) {
        const i = Math.min(trunk.length - 2, Math.max(1, Math.round(j * (trunk.length - 1) / (count + 1))));
        const p = trunk[i], a = trunk[i - 1], b = trunk[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const side = j % 2 ? 1 : -1, len = 22 + rand() * 34, nx = -dy / L * side, ny = dx / L * side;
        const q = [];
        for (let k = 0; k < 7; k++) { const u = k / 6, bend = (rand() - .5) * 8 * u; q.push([p[0] + nx * len * u + dx / L * len * .28 * u + nx * bend, p[1] + ny * len * u + dy / L * len * .28 * u + ny * bend]); }
        out.push({ sk: { color: s.drawSet.color, size: Math.max(1, s.drawSet.size * .62), opacity: s.drawSet.opacity, dash: s.drawSet.dash }, pts: q });
      }
      return out;
    };

    const onDown = e => {
      if (s.maskEdit || e.button !== 0 || (s.drawTool !== 'tentacle' && s.drawTool !== 'branch')) return;
      e.preventDefault(); e.stopImmediatePropagation(); s.closeFly(); s.drawPad.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, tool: s.drawTool, raw: [[e.clientX, e.clientY]] }; preview(drag.raw);
    };
    const onMove = e => {
      if (!drag || drag.id !== e.pointerId) return;
      e.preventDefault(); e.stopImmediatePropagation(); const p = [e.clientX, e.clientY], a = drag.raw[drag.raw.length - 1];
      if (Math.hypot(p[0] - a[0], p[1] - a[1]) >= 3) drag.raw.push(p);
      preview(drag.tool === 'tentacle' ? tentacle(drag.raw) : drag.raw);
    };
    const onEnd = e => {
      if (!drag || drag.id !== e.pointerId) return;
      e.preventDefault(); e.stopImmediatePropagation(); const d = drag; drag = null; s.ink.setAttribute('d', '');
      if (e.type === 'pointercancel' || d.raw.length < 2) return;
      if (d.tool === 'tentacle') addBatch([{ sk: { color: s.drawSet.color, size: s.drawSet.size, opacity: s.drawSet.opacity, dash: s.drawSet.dash }, pts: tentacle(d.raw) }]);
      else addBatch(branchStrokes(d.raw));
    };
    s.drawPad.addEventListener('pointerdown', onDown, true);
    s.drawPad.addEventListener('pointermove', onMove, true);
    s.drawPad.addEventListener('pointerup', onEnd, true);
    s.drawPad.addEventListener('pointercancel', onEnd, true);
  }
  setTimeout(boot, 0);

  // Compatibility for the current split deployment: once the existing S7 loader has
  // finished, bring in S9 source modules directly. A normal build already embeds them,
  // so the presence of __cerebraS9 makes this a no-op there.
  setTimeout(() => {
    if (window.__cerebraS9 || window.__cerebraS9Loading) return;
    window.__cerebraS9Loading = true;
    const load = src => new Promise((ok, no) => {
      const el = document.createElement('script'); el.src = src; el.async = false; el.onload = ok; el.onerror = no; document.body.appendChild(el);
    });
    (async () => {
      await load('src/effects/studio-menu-fix.js?v=8aa3e378');
      await load('src/effects/s9-core.js?v=78da5a51');
      await load('src/effects/s9-ui.js?v=bb877382');
    })().catch(e => console.error('Cerebra S9 loader', e)).finally(() => { window.__cerebraS9Loading = false; });
  }, 600);
})();
