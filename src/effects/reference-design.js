/* Editable procedural objects inspired by the reference boards, not raster copies. */
(() => {
  const range = (k, label, min, max, step = 1) => ({ k, label, t: 'range', min, max, step });
  const select = (k, label, opts) => ({ k, label, t: 'select', opts: opts.map(v => Array.isArray(v) ? v : [v, v]) });
  const check = (k, label) => ({ k, label, t: 'check' });
  const base = { lw: 1.2, c2: '#e1b878', dash: 'solid', clip: 'none', gap: 0, gapAngle: 0 };
  const common = [range('lw', 'Line width', .3, 12, .1), { k: 'c2', label: 'Accent colour', t: 'color' }, select('dash', 'Line style', ['solid', 'dashed', 'dotted']), select('clip', 'Clip artwork', ['none', 'circle', 'triangle']), range('gap', 'Cut-out band', 0, .35, .01), range('gapAngle', 'Cut-out angle', -180, 180)];
  function random(seed) { let n = (seed || 7) >>> 0; return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; }; }
  function line(g, a, b) { g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
  function dot(g, x, y, r, ring = false) { g.beginPath(); g.arc(x, y, Math.max(.1, r), 0, Math.PI * 2); ring ? g.stroke() : g.fill(); }
  function arrow(g, x, y, a, r) { g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .4) * r, y - Math.sin(a - .4) * r); g.moveTo(x, y); g.lineTo(x - Math.cos(a + .4) * r, y - Math.sin(a + .4) * r); g.stroke(); }
  function poly(g, n, outer, inner = outer, phase = -Math.PI / 2) { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = phase + i * Math.PI / n, r = i % 2 ? inner : outer; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
  function wrap(draw) {
    return (g, it, x, y, w, h, k) => {
      const p = it.p, M = kitM(it), t = M.a ? M.t : 0;
      g.save(); g.translate(x + w / 2, y + h / 2);
      // Both screen and export use the same vector clipping. No background-colour eraser.
      if (p.clip === 'circle') { g.beginPath(); g.ellipse(0, 0, w * .49, h * .49, 0, 0, Math.PI * 2); g.clip(); }
      if (p.clip === 'triangle') { g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.clip(); }
      if (p.gap > 0) {
        const a = p.gapAngle * Math.PI / 180, r = Math.hypot(w, h), band = Math.min(w, h) * p.gap / 2;
        g.rotate(a); g.beginPath(); g.rect(-r, -r, r * 2, r * 2); g.rect(-r, -band, r * 2, band * 2); g.clip('evenodd'); g.rotate(-a);
      }
      g.strokeStyle = g.fillStyle = it.fill; g.lineWidth = Math.max(.2, p.lw * k); g.lineCap = 'butt';
      g.setLineDash(p.dash === 'dashed' ? [5 * k, 4 * k] : p.dash === 'dotted' ? [k, 3 * k] : []);
      const fx = M.a && KIT_FX[it.mFx]; if (fx) fx(g, M, 0, 0, w, h);
      draw(g, it, w, h, k, t, M); g.restore();
    };
  }
  const def = (label, size, defaults, ui, draw, extra = {}) => ({ label, size, defaults: { ...base, ...defaults }, ui: [...ui, ...common], anim: true, draw: wrap(draw), ...extra });
  const tools = {
    refOrbit: def('Orbit builder', [.54, .54], { count: 3, squash: .48, tilt: -30, spread: 35, start: 0, sweep: 360, satellites: 3, dotSize: 3, axes: false, wire: true, wireLines: 8 }, [range('count', 'Orbits', 1, 16), range('squash', 'Ellipse ratio', .15, 1, .01), range('tilt', 'Tilt', -180, 180), range('spread', 'Tilt spacing', 0, 90), range('start', 'Arc start', -180, 180), range('sweep', 'Arc length', 10, 360), range('satellites', 'Satellites per orbit', 0, 12), range('dotSize', 'Satellite size', 1, 12, .5), check('axes', 'Cross axes'), check('wire', 'Wireframe core'), range('wireLines', 'Wireframe density', 3, 16)], (g, it, w, h, k, t) => {
      const p = it.p, r = Math.min(w, h) * .41, start = p.start * Math.PI / 180, sweep = p.sweep * Math.PI / 180;
      for (let i = 0; i < p.count; i++) {
        const rx = r * (1 - i * .035), ry = rx * p.squash, a = (p.tilt + i * p.spread) * Math.PI / 180;
        g.beginPath(); g.ellipse(0, 0, rx, ry, a, start, start + sweep); g.stroke();
        for (let j = 0; j < p.satellites; j++) { const q = start + ((j / p.satellites + i * .13 + t * .045 * (i % 2 ? -1 : 1)) % 1 + 1) % 1 * sweep, xx = Math.cos(q) * rx, yy = Math.sin(q) * ry; g.fillStyle = j % 2 ? it.fill : p.c2; dot(g, xx * Math.cos(a) - yy * Math.sin(a), xx * Math.sin(a) + yy * Math.cos(a), p.dotSize * k); }
      }
      if (p.axes) { line(g, [-w * .47, 0], [w * .47, 0]); line(g, [0, -h * .47], [0, h * .47]); arrow(g, w * .47, 0, 0, 7 * k); arrow(g, 0, -h * .47, -Math.PI / 2, 7 * k); }
      if (p.wire) { const rr = r * .28; for (let i = 1; i <= p.wireLines; i++) { const q = i / (p.wireLines + 1); g.beginPath(); g.ellipse(0, 0, Math.abs(Math.cos(q * Math.PI)) * rr + .1, rr, .25 + t * .05, 0, Math.PI * 2); g.stroke(); const yy = (q * 2 - 1) * rr; g.beginPath(); g.ellipse(0, yy, Math.sqrt(Math.max(0, rr * rr - yy * yy)), rr * .14, 0, 0, Math.PI * 2); g.stroke(); } }
    }),
    refDial: def('Precision dial', [.5, .5], { rings: 3, thickness: 1, start: -90, sweep: 290, ticks: 72, tickSize: .06, dots: 4, inner: .38 }, [range('rings', 'Rings', 1, 12), range('thickness', 'Ring thickness', 1, 35), range('start', 'Arc start', -180, 180), range('sweep', 'Arc length', 10, 360), range('ticks', 'Scale ticks', 0, 160), range('tickSize', 'Tick length', .01, .16, .01), range('dots', 'Orbit markers', 0, 16), range('inner', 'Inner radius', .08, .85, .01)], (g, it, w, h, k, t) => {
      const p = it.p, r = Math.min(w, h) * .44, st = p.start * Math.PI / 180 + t * .12, sw = p.sweep * Math.PI / 180;
      for (let i = 0; i < p.rings; i++) { g.lineWidth = Math.min(r * .3, p.thickness * k); g.beginPath(); g.arc(0, 0, r * (p.rings === 1 ? 1 : p.inner + (1 - p.inner) * i / (p.rings - 1)), st, st + sw); g.stroke(); }
      g.lineWidth = p.lw * k; for (let i = 0; i < p.ticks; i++) { const a = st + sw * i / Math.max(1, p.ticks - 1), r0 = r * (1 - p.tickSize * (i % 5 === 0 ? 1.6 : 1)); line(g, [Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * r * .98, Math.sin(a) * r * .98]); }
      g.fillStyle = p.c2; for (let i = 0; i < p.dots; i++) { const a = st + sw * (i + .5) / p.dots; dot(g, Math.cos(a) * r * .7, Math.sin(a) * r * .7, 3 * k, i % 2 === 0); }
    }),
    refLines: def('Technical lines', [.64, .3], { mode: 'axis', count: 3, spacing: .07, angle: -25, arrows: true, nodes: true, crossSize: .15 }, [select('mode', 'Construction', ['axis', 'parallel', 'elbow', 'dimension', 'tangent']), range('count', 'Parallel lines', 1, 20), range('spacing', 'Line spacing', .01, .2, .01), range('angle', 'Line angle', -80, 80), check('arrows', 'Arrowheads'), check('nodes', 'Endpoint circles'), range('crossSize', 'Cross-axis length', .02, .4, .01)], (g, it, w, h, k) => {
      const p = it.p; g.rotate(p.angle * Math.PI / 180); const span = Math.min(w * .42, h / Math.max(.2, Math.abs(Math.sin(p.angle * Math.PI / 180))) * .4), a = [-span, 0], b = [span, 0];
      if (p.mode === 'parallel') for (let i = 0; i < p.count; i++) { const y = (i - (p.count - 1) / 2) * Math.min(w, h) * p.spacing; line(g, [-span, y], [span, y]); }
      else if (p.mode === 'elbow') { g.beginPath(); g.moveTo(-span, h * .18); g.lineTo(-span * .3, h * .18); g.lineTo(span * .3, -h * .18); g.lineTo(span, -h * .18); g.stroke(); }
      else if (p.mode === 'tangent') { dot(g, -span * .6, 0, h * .14, true); dot(g, span * .6, 0, h * .3, true); line(g, [-span * .6, -h * .14], [span * .6, -h * .3]); line(g, [-span * .6, h * .14], [span * .6, h * .3]); }
      else { line(g, a, b); if (p.mode === 'axis') line(g, [0, -h * p.crossSize], [0, h * p.crossSize]); else { line(g, [-span, -h * .15], [-span, h * .15]); line(g, [span, -h * .15], [span, h * .15]); } }
      if (p.arrows) { arrow(g, ...a, Math.PI, 8 * k); arrow(g, ...b, 0, 8 * k); } if (p.nodes) { dot(g, ...a, 3 * k, true); dot(g, ...b, 3 * k, true); }
    }),
    refWave: def('Signal wave', [.7, .26], { cycles: 5, amplitude: .35, phase: 0, growth: 1, envelope: 'grow', axis: true, cone: true }, [range('cycles', 'Frequency / cycles', 1, 24, .25), range('amplitude', 'Amplitude', .01, .45, .01), range('phase', 'Phase', 0, 360), range('growth', 'Envelope strength', 0, 3, .1), select('envelope', 'Envelope', ['grow', 'fade', 'constant', 'pulse']), check('axis', 'Centre axis'), check('cone', 'Envelope guides')], (g, it, w, h, k, t) => {
      const p = it.p, amp = h * p.amplitude, envelope = q => p.envelope === 'grow' ? Math.pow(q, p.growth) : p.envelope === 'fade' ? Math.pow(1 - q, p.growth) : p.envelope === 'pulse' ? Math.pow(Math.sin(q * Math.PI), p.growth) : 1;
      if (p.axis) line(g, [-w * .46, 0], [w * .46, 0]); g.beginPath(); for (let i = 0; i <= 480; i++) { const q = i / 480, x = (q - .5) * w * .85, y = Math.sin(q * p.cycles * Math.PI * 2 + p.phase * Math.PI / 180 - t * 2) * amp * envelope(q); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      if (p.cone) { g.strokeStyle = p.c2; line(g, [-w * .425, -amp * envelope(0)], [w * .425, -amp * envelope(1)]); line(g, [-w * .425, amp * envelope(0)], [w * .425, amp * envelope(1)]); }
    }),
    refPattern: def('Pattern grid', [.48, .4], { mode: 'dots', columns: 12, rows: 10, size: 2, jitter: .1, density: .8, blink: .25, blinkRate: 1 }, [select('mode', 'Pattern', ['dots', 'squares', 'crosses', 'frames', 'stripes', 'circuit']), range('columns', 'Columns', 2, 40), range('rows', 'Rows', 2, 40), range('size', 'Point size', .5, 12, .5), range('jitter', 'Position scatter', 0, 1, .05), range('density', 'Density', .05, 1, .05), range('blink', 'Blink strength', 0, 1, .05), range('blinkRate', 'Blink frequency', .1, 8, .1)], (g, it, w, h, k, t, M) => {
      const p = it.p, r = random(it.seed), a0 = g.globalAlpha, dx = w * .9 / p.columns, dy = h * .9 / p.rows;
      for (let j = 0; j < p.rows; j++) for (let i = 0; i < p.columns; i++) { const hit = r(), q = r(), xx = (i + .5 - p.columns / 2) * dx + (r() - .5) * dx * p.jitter, yy = (j + .5 - p.rows / 2) * dy + (r() - .5) * dy * p.jitter; if (hit > p.density) continue;
        g.globalAlpha = a0 * (M.a ? 1 - p.blink * (.5 + .5 * Math.sin(t * p.blinkRate * Math.PI * 2 + q * 20)) : 1); g.strokeStyle = g.fillStyle = q > .82 ? p.c2 : it.fill; const s = p.size * k;
        if (p.mode === 'dots') dot(g, xx, yy, s); else if (p.mode === 'squares') g.fillRect(xx - s, yy - s, s * 2, s * 2); else if (p.mode === 'crosses') { line(g, [xx - s, yy], [xx + s, yy]); line(g, [xx, yy - s], [xx, yy + s]); }
        else if (p.mode === 'stripes') line(g, [xx - dx * .4, yy], [xx + dx * .4, yy]); else { g.strokeRect(xx - dx * .35, yy - dy * .35, dx * (.5 + q), dy * (.5 + q)); if (p.mode === 'circuit') { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + dx, yy); g.lineTo(xx + dx, yy + dy); g.stroke(); dot(g, xx, yy, s); } }
      } g.globalAlpha = a0;
    }),
    refSymbol: def('Mechanical symbols', [.36, .36], { mode: 'gear', teeth: 16, inner: .65, hub: .3, spokes: 8, filled: false }, [select('mode', 'Symbol', ['gear', 'star', 'triangle', 'sword', 'orbital']), range('teeth', 'Teeth / star points', 3, 48), range('inner', 'Inner radius', .1, .95, .01), range('hub', 'Hub radius', .05, .6, .01), range('spokes', 'Spokes', 0, 24), check('filled', 'Filled symbol')], (g, it, w, h, k, t) => {
      const p = it.p, r = Math.min(w, h) * .43; g.rotate(t * .15);
      if (p.mode === 'sword') { g.beginPath(); g.moveTo(0, -h * .45); g.lineTo(w * .045, -h * .34); g.lineTo(w * .045, h * .2); g.lineTo(-w * .045, h * .2); g.lineTo(-w * .045, -h * .34); g.closePath(); g.stroke(); line(g, [-w * .28, -h * .1], [w * .28, -h * .1]); line(g, [0, h * .2], [0, h * .4]); dot(g, 0, h * .42, w * .04, true); return; }
      if (p.mode === 'orbital') { g.beginPath(); g.arc(0, 0, r, .15, Math.PI - .15); g.stroke(); g.beginPath(); g.arc(0, 0, r, Math.PI + .15, Math.PI * 2 - .15); g.stroke(); line(g, [-r, -r], [r, r]); for (const q of [-1, 1]) { g.save(); g.rotate(Math.PI / 4 + (q === -1 ? Math.PI : 0)); g.translate(r, 0); g.beginPath(); g.moveTo(-r * .18, -r * .2); g.quadraticCurveTo(0, 0, r * .2, 0); g.quadraticCurveTo(0, 0, -r * .18, r * .2); g.quadraticCurveTo(-r * .06, 0, -r * .18, -r * .2); g.fill(); g.restore(); } return; }
      if (p.mode === 'gear') { g.beginPath(); for (let i = 0; i < p.teeth * 4; i++) { const a = i / (p.teeth * 4) * Math.PI * 2, rr = i % 4 < 2 ? r : r * p.inner; i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(rr, 0); } g.closePath(); }
      else poly(g, p.mode === 'triangle' ? 3 : p.teeth, r, p.mode === 'triangle' ? r : r * p.inner);
      if (p.filled) g.fill(); else g.stroke(); if (p.mode === 'gear') { dot(g, 0, 0, r * p.hub, true); for (let i = 0; i < p.spokes; i++) { const a = i / p.spokes * Math.PI * 2; line(g, [Math.cos(a) * r * p.hub, Math.sin(a) * r * p.hub], [Math.cos(a) * r * p.inner * .88, Math.sin(a) * r * p.inner * .88]); } }
    }),
    refScanner: def('Scanner frame', [.56, .56], { corners: .15, ticks: 12, ring: true, title: 'CEREBRA / SCAN', subtitle: 'SUBJECT 01 · LIVE', size: 12, anchorTarget: '' }, [range('corners', 'Corner length', .03, .35, .01), range('ticks', 'Edge ticks', 0, 32), check('ring', 'Scanner ring'), { k: 'title', label: 'Title', t: 'text' }, { k: 'subtitle', label: 'Subtitle', t: 'text' }, range('size', 'Text size', 7, 28)], (g, it, w, h, k, t) => {
      const p = it.p, bx = w * .44, by = h * .4, len = Math.min(w, h) * p.corners;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.beginPath(); g.moveTo(sx * (bx - len), sy * by); g.lineTo(sx * bx, sy * by); g.lineTo(sx * bx, sy * (by - len)); g.stroke(); }
      for (let i = 0; i < p.ticks; i++) { const y = -by + by * 2 * i / Math.max(1, p.ticks - 1); line(g, [-bx, y], [-bx + 4 * k, y]); line(g, [bx - 4 * k, y], [bx, y]); }
      if (p.ring) { g.strokeStyle = p.c2; g.beginPath(); g.arc(0, 0, Math.min(w, h) * .32, t * .2, t * .2 + Math.PI * 1.7); g.stroke(); }
      g.fillStyle = it.fill; g.font = `${p.size * k}px "Geist Mono", monospace`; g.textAlign = 'center'; g.fillText(p.title, 0, -by - 8 * k, w * .85); g.fillText(p.subtitle, 0, by + p.size * k * 1.3, w * .85);
    }),
    refRoute: def('Mission routes', [.54, .72], { tracks: 7, separation: .55, bend: .22, spread: .035, markers: 2, routeMode: 'transfer', anchorA: '', anchorB: '' }, [select('routeMode', 'Path type', ['transfer', 'curve', 'elbow']), range('tracks', 'Paths', 1, 16), range('separation', 'Endpoint separation', .15, .7, .01), range('bend', 'Curve bend', -.4, .4, .01), range('spread', 'Path spacing', .01, .07, .005), range('markers', 'Moving markers', 0, 6)], (g, it, w, h, k, t) => {
      const p = it.p, a = p.ax == null ? [0, h * p.separation / 2] : [(p.ax - .5) * w, (p.ay - .5) * h], b = p.bx == null ? [0, -h * p.separation / 2] : [(p.bx - .5) * w, (p.by - .5) * h];
      for (let i = 0; i < p.tracks; i++) { const d = (i - (p.tracks - 1) / 2) * Math.min(w, h) * p.spread, c1 = [a[0] + w * p.bend + d, a[1] - h * .25], c2 = [b[0] - w * p.bend + d, b[1] + h * .25];
        g.beginPath(); g.moveTo(...a); if (p.routeMode === 'elbow') { g.lineTo(a[0], b[1]); g.lineTo(...b); } else g.bezierCurveTo(...c1, ...c2, ...b); g.stroke();
        if (p.routeMode === 'transfer' && !p.anchorA && !p.anchorB) { dot(g, ...a, Math.min(w, h) * (.11 + i * p.spread * .5), true); dot(g, ...b, Math.min(w, h) * (.07 + i * p.spread * .5), true); }
        g.fillStyle = p.c2; for (let j = 0; j < p.markers; j++) { const q = ((j / p.markers + t * .08 + i * .07) % 1 + 1) % 1, z = 1 - q; let x, y; if (p.routeMode === 'elbow') { x = q < .5 ? a[0] : a[0] + (b[0] - a[0]) * (q * 2 - 1); y = q < .5 ? a[1] + (b[1] - a[1]) * q * 2 : b[1]; } else { x = z ** 3 * a[0] + 3 * z * z * q * c1[0] + 3 * z * q * q * c2[0] + q ** 3 * b[0]; y = z ** 3 * a[1] + 3 * z * z * q * c1[1] + 3 * z * q * q * c2[1] + q ** 3 * b[1]; } dot(g, x, y, 2.5 * k); }
      }
    }),
    refTexture: def('Paper & print', [.7, .7], { mode: 'paper', density: 450, strength: .12, fleck: 1, paper: '#eee9df', paperOn: false }, [select('mode', 'Print texture', ['paper', 'ink', 'dust', 'halftone']), range('density', 'Texture density', 50, 2000, 50), range('strength', 'Texture strength', .02, .6, .02), range('fleck', 'Fleck size', .3, 5, .1), { k: 'paper', t: 'color', label: 'Paper colour' }, check('paperOn', 'Paper backing')], (g, it, w, h, k) => {
      const p = it.p, r = random(it.seed), a = g.globalAlpha; if (p.paperOn) { g.fillStyle = p.paper; g.fillRect(-w / 2, -h / 2, w, h); } g.fillStyle = it.fill;
      for (let i = 0; i < p.density; i++) { const x = (r() - .5) * w, y = (r() - .5) * h, q = r(); g.globalAlpha = a * p.strength * (.3 + q); if (p.mode === 'halftone') { const n = Math.ceil(Math.sqrt(p.density)); dot(g, (i % n + .5) / n * w - w / 2, (Math.floor(i / n) + .5) / n * h - h / 2, p.fleck * k); } else if (p.mode === 'ink') g.fillRect(x, y, p.fleck * k * (1 + q * 5), p.fleck * k); else dot(g, x, y, p.fleck * k * (.3 + q)); } g.globalAlpha = a;
    }, { anim: false }),
    refOrbitalMap: def('Orbital diagram', [.52, .52], { rings: 5, arcs: 5, points: 8, eccentric: .25, axes: true }, [range('rings', 'Concentric rings', 1, 12), range('arcs', 'Intersecting arcs', 0, 16), range('points', 'Markers', 0, 24), range('eccentric', 'Off-centre amount', 0, .5, .01), check('axes', 'Construction axes')], (g, it, w, h, k, t) => {
      const p = it.p, r = Math.min(w, h) * .44, rand = random(it.seed); g.save(); dot(g, 0, 0, r, true); g.clip(); for (let i = 0; i < p.rings; i++) dot(g, 0, 0, r * (i + 1) / p.rings, true);
      for (let i = 0; i < p.arcs; i++) { const a = i / Math.max(1, p.arcs) * Math.PI * 2 + t * .04; dot(g, Math.cos(a) * r * p.eccentric * 3, Math.sin(a) * r * p.eccentric * 3, r * (.35 + rand() * .8), true); }
      if (p.axes) { line(g, [-r, 0], [r, 0]); line(g, [0, -r], [0, r]); line(g, [-r * .7, -r * .7], [r * .7, r * .7]); }
      g.fillStyle = p.c2; for (let i = 0; i < p.points; i++) { const a = rand() * Math.PI * 2 + t * (.03 + i * .005), rr = r * (.25 + rand() * .7); dot(g, Math.cos(a) * rr, Math.sin(a) * rr, 2.5 * k, i % 3 === 0); } g.restore();
    }),
  };
  // One layout = one editable layer group. Coordinates are relative to the composition.
  const K = (kit, x, y, w, h = w, p = {}, extra = {}) => ({ kind: 'kit', kit, x, y, w, h, p, ...extra });
  const T = (content, x, y, size = 20) => ({ kind: 'text', content, x, y, size, font: 'mono', align: 'c' });
  const presets = [
    { id: 'minimalOrbit', name: 'Minimal Orbit', items: [K('refDial', .55, .44, .48, .48, { rings: 1, thickness: 25, ticks: 0, dots: 0, sweep: 360 }), K('refOrbit', .38, .52, .32, .32, { count: 1, squash: 1, wire: false, satellites: 2 }), K('refLines', .5, .48, .75, .3, { mode: 'parallel', count: 4 })] },
    { id: 'orbitalDiagram', name: 'Orbital Diagram', items: [K('refOrbitalMap', .5, .45, .66), T('ORBITAL STUDY / 01', .5, .77, 16)] },
    { id: 'precisionDial', name: 'Precision Dial', items: [K('refDial', .5, .46, .66, .66, { ticks: 100 }), K('refLines', .5, .46, .62, .5, { mode: 'elbow', angle: 0 })] },
    { id: 'twinRings', name: 'Twin Rings', items: [K('refDial', .42, .46, .4, .4, { rings: 1, ticks: 0, sweep: 360, dots: 1 }), K('refDial', .59, .46, .29, .29, { rings: 2, ticks: 0, sweep: 360, dots: 0 }), K('refLines', .5, .46, .76, .22, { angle: 0, mode: 'parallel', count: 3 })] },
    { id: 'geometricEmblem', name: 'Geometric Emblem', items: [K('refSymbol', .5, .43, .6, .6, { mode: 'triangle', lw: 9 }), K('refDial', .5, .48, .5, .5, { rings: 1, ticks: 0, dots: 2, sweep: 340 }), K('refLines', .5, .48, .72, .4, { angle: 60 })] },
    { id: 'atomicCore', name: 'Atomic Core', items: [K('refOrbit', .5, .45, .66, .66, { axes: true }), T('CEREBRA / ATOMIC', .5, .8, 16)] },
    { id: 'orbitalMinimal', name: 'Orbital Minimal', items: [K('refOrbit', .5, .47, .6, .6, { count: 2, squash: 1, wire: false, satellites: 2 }), K('refPattern', .28, .22, .14, .14, { columns: 5, rows: 5 }), K('refLines', .5, .45, .75, .3, { angle: 90 })] },
    { id: 'orbitalTower', name: 'Orbital Tower', items: [K('refPattern', .5, .48, .65, 1.1, { mode: 'circuit', density: .18 }, { opacity: .2 }), ...[.2, .4, .62, .82].map((y, i) => K('refOrbit', .5, y, .24 + i % 2 * .16, .24 + i % 2 * .16, { wire: false, squash: .85, count: 3 }))] },
    { id: 'circuitField', name: 'Circuit Field', items: [K('refPattern', .5, .48, .85, 1.1, { mode: 'circuit', columns: 12, rows: 18, density: .45 }), K('refPattern', .5, .48, .85, 1.1, { mode: 'squares', columns: 20, rows: 26, density: .25, size: 1.5 })] },
    { id: 'mechanicalSigil', name: 'Mechanical Sigil', items: [K('refSymbol', .5, .36, .22, .58, { mode: 'sword' }), K('refSymbol', .5, .62, .32), K('refSymbol', .34, .67, .18, .18, { teeth: 12 }), K('refDial', .5, .62, .55, .55, { rings: 2, ticks: 48 }), K('refSymbol', .68, .35, .09, .09, { mode: 'star', teeth: 4, inner: .15 }), T('MECHANICAL / 01', .5, .9, 14)] },
    { id: 'celestialAtlas', name: 'Celestial Atlas', items: [K('refOrbitalMap', .4, .5, .7, .7, { eccentric: .4, arcs: 8 }), K('refOrbit', .7, .35, .25, .25, { count: 2, wire: false }), K('refScanner', .5, .49, .88, .82, { ring: false, title: 'CELESTIAL ATLAS', subtitle: 'RELATIVE ORBITS / STUDY 01' })] },
    { id: 'missionRoutes', name: 'Mission Routes', items: [K('refRoute', .5, .45, .58, 1, { tracks: 9 }), K('refOrbitalMap', .5, .7, .2), K('refOrbitalMap', .5, .2, .12), T('CEREBRA / MISSION PATHS', .5, .91, 16)] },
    { id: 'orbitalSymbol', name: 'Orbital Symbol', items: [K('refSymbol', .5, .47, .43, .43, { mode: 'orbital' })] },
    { id: 'orbitQuote', name: 'Orbit Quote', items: [K('refOrbit', .5, .42, .5, .5, { count: 3, wire: false, gap: .035, gapAngle: -45 }), K('refLines', .5, .42, .6, .35, { angle: -45, dash: 'dashed' }), T('A NEW PERSPECTIVE', .5, .74, 18)] },
    { id: 'signalWave', name: 'Signal Wave', items: [K('refWave', .5, .45, .8, .3), K('refDial', .78, .45, .16, .16, { rings: 1, ticks: 0, dots: 0, sweep: 360 }), T('FREQUENCY / FORM', .5, .7, 18)] },
    { id: 'vintageAstronomy', name: 'Vintage Astronomy', items: [K('refTexture', .5, .5, .95, 1.2, { mode: 'paper', density: 1800, strength: .15 }), K('refOrbit', .68, .26, .32, .32, { count: 2, squash: 1, wire: false, dash: 'dotted' }), K('refOrbit', .28, .76, .25, .25, { count: 1, squash: 1, wire: false }), K('refLines', .48, .5, .8, .6, { mode: 'tangent', angle: -60 }), T('PLATE / VII', .7, .55, 13)] },
    { id: 'technicalSketch', name: 'Technical Sketch', items: [K('refPattern', .5, .47, .7, .8, { mode: 'crosses', jitter: .8, density: .15 }), K('refDial', .5, .44, .5, .5, { rings: 5, ticks: 70 }), K('refLines', .5, .47, .9, .5, { mode: 'parallel', count: 8, angle: -45 })] },
    { id: 'planetScanner', name: 'Planet Scanner', items: [K('refScanner', .5, .43, .7, .7), K('widget', .5, .85, .55, .15, { mode: 'table', data: 'SUBJECT: CEREBRA\nSTATUS: OBSERVED\nSTUDY: 01', size: 11 })] },
    { id: 'eclipseEditorial', name: 'Eclipse Editorial', items: [K('refOrbitalMap', .3, .25, .42), K('refLines', .5, .53, .9, .6, { angle: -65 }), K('refWave', .6, .7, .4, .16, { envelope: 'constant', cycles: 3 }), T('ECLIPSE', .65, .4, 48), T('TIME / SPACE / FORM', .5, .88, 15)] },
    { id: 'celestialMap', name: 'Celestial Map', items: [K('refOrbit', .43, .52, .75, .75, { count: 6, squash: 1, wire: false, satellites: 1, spread: 0 }), K('refOrbit', .74, .31, .25, .25, { wire: false }), K('arcText', .45, .5, .72, .72, { text: 'CEREBRA · ORBITAL SYSTEM ·', size: 11 }), T('CELESTIAL / 01', .5, .91, 14)] },
  ];
  function boot() {
    const s = window.__cerebra?.studio;
    if (!s?.__detailControlsReady) { setTimeout(boot, 180); return; }
    if (s.referenceDesign) return;
    Object.assign(KIT, tools);
    const box = s.el.querySelector('[data-kit-types]');
    Object.entries(tools).forEach(([key, d]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-btn'; b.dataset.studioKit = key; const canvas = document.createElement('canvas'); canvas.width = canvas.height = 88; b.append(canvas, document.createTextNode(d.label)); d.draw(canvas.getContext('2d'), { p: d.defaults, fill: '#e8ecf5', seed: 7 }, 0, 0, 88, 88, .65); b.onclick = () => { s.closeFly(); s.addItem('kit', { kit: key, fill: s.decorFill, opacity: 1 }); }; box.append(b); });
    let latestGroup = null;
    function members() { const selected = new Set(s.items.filter(i => s.multi.has(i.id) && i.referencePreset).map(i => i.group)); const fallback = s.items.filter(i => i.referencePreset).at(-1)?.group; const id = s.sel?.group || (selected.size === 1 ? [...selected][0] : null) || (s.items.some(i => i.group === latestGroup) ? latestGroup : fallback); return s.items.filter(i => i.group === id && i.referencePreset); }
    function palette(ink, accent) { s.flushCommit(); members().forEach(i => { if (i.kind === 'text') { i.color = ink; i.textColors = []; } else { i.fill = ink; if (i.p) i.p.c2 = accent; } s.place(i); }); s.commit(); }
    function motion(on) { s.flushCommit(); members().filter(i => i.kind === 'kit' && KIT[i.kit].anim).forEach(i => { i.mOn = on; s.applyKitMotion(i); s.place(i); }); s.commit(); }
    function shuffle() { s.flushCommit(); members().forEach(i => { if (i.kind !== 'kit') return; i.seed = Math.random() * 1e9 | 0; s.place(i); }); s.commit(); }
    function addPreset(id, options = {}) {
      const d = presets.find(v => v.id === id); if (!d) return;
      s.flushCommit(); const group = { id: Date.now() + Math.floor(Math.random() * 1000), name: d.name, hide: false, collapsed: false }; s.groups.push(group); latestGroup = group.id;
      const ink = options.ink || '#e8ecf5', accent = options.accent || '#e1b878', U = s.U(), scale = Math.min(1, innerWidth * .9 / U, innerHeight * .85 / U);
      const made = d.items.map(o => s.addItem(o.kind, { ...o, p: o.p ? { ...o.p, c2: accent } : undefined, w: o.w && o.w * scale, h: o.h && o.h * scale, size: o.size ? Math.max(9, Math.round(o.size * scale)) : undefined, fill: ink, color: ink, group: group.id, referencePreset: id, seed: 7, mOn: !!options.motion, silent: true }));
      s.select(null); s.multi = new Set(made.map(i => i.id)); s.selMode = true; s.renderLayers(); s.updateMultiUI(); s.commit(); return made;
    }
    // Stable references survive snapshot IDs being regenerated by Undo/Redo/import.
    function key(it) { return it.referenceKey || (it.referenceKey = `ref-${Date.now()}-${it.id}-${Math.random().toString(36).slice(2, 7)}`); }
    const addItem = s.addItem.bind(s); s.addItem = (kind, options = {}) => { if (!s.restoring && options.referenceKey && s.items.some(i => i.referenceKey === options.referenceKey)) { options = { ...options }; delete options.referenceKey; } return addItem(kind, options); };
    let refreshing = false;
    function anchors() {
      if (refreshing || s.restoring) return; refreshing = true;
      try { s.items.filter(i => i.kit === 'refScanner' && i.p.anchorTarget).forEach(it => {
        const px = s.planetPx, target = it.p.anchorTarget === 'subject' && px ? { x: px.xf - (s.shift?.x || 0) / innerWidth, y: px.yf - (s.shift?.y || 0) / innerHeight, w: px.rf * innerWidth * 2 / s.U(), h: px.rf * innerWidth * 2 / s.U() } : s.items.find(i => i.referenceKey === it.p.anchorTarget); if (!target) return;
        const width = Math.max(.15, target.w * 1.25), height = Math.max(.15, target.h * 1.25); if (it.x === target.x && it.y === target.y && it.w === width && it.h === height) return;
        it.x = target.x; it.y = target.y; it.w = width; it.h = height; place(it);
      }); s.items.filter(i => i.kit === 'refRoute' && (i.p.anchorA || i.p.anchorB)).forEach(it => {
        const p = it.p, a = s.items.find(i => i.referenceKey === p.anchorA), b = s.items.find(i => i.referenceKey === p.anchorB);
        if (!a || !b) return;
        const W = innerWidth, H = innerHeight, U = s.U(), pad = Math.min(W, H) * .15, left = Math.min(a.x, b.x) * W - pad, top = Math.min(a.y, b.y) * H - pad, width = Math.max(pad * 2, Math.abs(a.x - b.x) * W + pad * 2), height = Math.max(pad * 2, Math.abs(a.y - b.y) * H + pad * 2);
        const cx = (left + width / 2) / W, cy = (top + height / 2) / H, ax = (a.x * W - left) / width, ay = (a.y * H - top) / height, bx = (b.x * W - left) / width, by = (b.y * H - top) / height;
        if (it.x === cx && it.y === cy && it.w === width / U && it.h === height / U && p.ax === ax && p.ay === ay && p.bx === bx && p.by === by) return;
        it.x = cx; it.y = cy; it.w = width / U; it.h = height / U; p.ax = ax; p.ay = ay; p.bx = bx; p.by = by; place(it);
      }); } finally { refreshing = false; }
    }
    const place = s.place.bind(s); s.place = it => { const r = place(it); anchors(); return r; };
    const restore = s.restore.bind(s); s.restore = json => { const r = restore(json); anchors(); return r; };
    const update = s.update.bind(s); s.update = dt => { const r = update(dt); if (s.items.some(i => i.kit === 'refScanner' && i.p.anchorTarget === 'subject')) anchors(); return r; };
    const sync = s.syncKit.bind(s); s.syncKit = () => {
      const r = sync(), it = s.sel; if (!['refRoute', 'refScanner'].includes(it?.kit)) return r;
      const f = s.el.querySelector('[data-kit-panel]');
      (it.kit === 'refScanner' ? ['anchorTarget'] : ['anchorA', 'anchorB']).forEach((field, n) => { const row = document.createElement('label'); row.className = 'st-fly-row'; const span = document.createElement('span'); span.textContent = field === 'anchorTarget' ? 'Follow layer' : n ? 'Link end to layer' : 'Link start to layer'; const input = document.createElement('select'); input.dataset.refAnchor = field; input.add(new Option('Unlinked', '')); if (field === 'anchorTarget') input.add(new Option('Cerebra / active planet', 'subject')); s.items.filter(v => v !== it && v.kind !== 'fx' && !['refRoute', 'refScanner'].includes(v.kit)).forEach(v => input.add(new Option(s.label(v), key(v)))); input.value = it.p[field] || ''; row.append(span, input); f.append(row); input.onchange = () => { s.flushCommit(); it.p[field] = input.value; if (it.kit === 'refRoute' && (!it.p.anchorA || !it.p.anchorB)) { delete it.p.ax; delete it.p.ay; delete it.p.bx; delete it.p.by; place(it); } anchors(); s.commit(); }; }); return r;
    };
    const panel = document.createElement('details'); panel.className = 'studio-sub'; panel.dataset.referencePresets = ''; panel.innerHTML = '<summary>Reference design presets</summary><p class="studio-note">Adds an editable group without replacing your work. Group colours and motion apply to the selected preset group, or the last group added.</p><div class="studio-preset-grid" data-reference-grid></div><label class="st-fly-row"><span>Group ink</span><input type="color" value="#e8ecf5" data-reference-ink></label><label class="st-fly-row"><span>Group accent</span><input type="color" value="#e1b878" data-reference-accent></label><div class="st-fly-shapes"><button type="button" class="st-btn" data-reference-motion>Motion off</button><button type="button" class="st-btn" data-reference-shuffle>Shuffle pattern</button></div>';
    const style = document.createElement('style'); style.textContent = '[data-reference-presets] [data-reference-preset]{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:104px;padding:8px;font-size:11px;line-height:1.3}[data-reference-presets] canvas{display:block;width:100%;height:64px;object-fit:contain;pointer-events:none}[data-reference-presets] .st-fly-row{padding:5px 0}'; document.head.append(style);
    const grid = panel.querySelector('[data-reference-grid]'); presets.forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.className = 'studio-preset'; b.dataset.referencePreset = d.id; b.style.cssText = '--p1:#090b10;--p2:#b7a47e';
      const c = document.createElement('canvas'); c.width = 180; c.height = 150; c.setAttribute('aria-hidden', 'true'); const g = c.getContext('2d');
      d.items.filter(i => i.kind === 'kit').forEach(i => { const item = { ...i, fill: '#e8ecf5', seed: 7, p: { ...KIT[i.kit].defaults, ...i.p } }; const w = i.w * 125, h = i.h * 125; KIT[i.kit].draw(g, item, i.x * 180 - w / 2, i.y * 150 - h / 2, w, h, .25); });
      b.append(c, document.createTextNode(d.name)); b.onclick = () => { s.closeFly(); addPreset(d.id, { ink: panel.querySelector('[data-reference-ink]').value, accent: panel.querySelector('[data-reference-accent]').value }); }; grid.append(b); });
    panel.className = 'studio-section'; s.panel.querySelector('.studio-section').before(panel);
    panel.querySelectorAll('input[type=color]').forEach(e => { e.oninput = () => { const ink = panel.querySelector('[data-reference-ink]').value, accent = panel.querySelector('[data-reference-accent]').value; members().forEach(i => { if (i.kind === 'text') { i.color = ink; i.textColors = []; } else { i.fill = ink; if (i.p) i.p.c2 = accent; } s.place(i); }); s.commitSoon(); }; e.onchange = () => s.flushCommit(); });
    panel.querySelector('[data-reference-motion]').onclick = e => { const on = !members().some(i => i.mOn); motion(on); e.currentTarget.textContent = on ? 'Motion on' : 'Motion off'; e.currentTarget.setAttribute('aria-pressed', String(on)); };
    panel.querySelector('[data-reference-shuffle]').onclick = shuffle;
    s.referenceDesign = { tools: Object.keys(tools), presets: presets.map(d => ({ id: d.id, name: d.name })), addPreset, palette, motion, shuffle, anchors };
  }
  setTimeout(boot, 0);
})();
