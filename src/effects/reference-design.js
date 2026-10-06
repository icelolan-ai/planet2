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
    refDial: def('Precision dial', [.5, .5], { rings: 3, thickness: 1, start: -90, sweep: 290, segments: 1, segmentGap: 8, ticks: 72, tickSize: .06, dots: 4, inner: .38 }, [range('segments', 'Ring segments', 1, 24), range('segmentGap', 'Segment gap / degrees', 0, 30), range('rings', 'Rings', 1, 12), range('thickness', 'Ring thickness', 1, 35), range('start', 'Arc start', -180, 180), range('sweep', 'Arc length', 10, 360), range('ticks', 'Scale ticks', 0, 160), range('tickSize', 'Tick length', .01, .16, .01), range('dots', 'Orbit markers', 0, 16), range('inner', 'Inner radius', .08, .85, .01)], (g, it, w, h, k, t) => {
      const p = it.p, r = Math.min(w, h) * .44, st = p.start * Math.PI / 180 + t * .12, sw = p.sweep * Math.PI / 180;
      for (let i = 0; i < p.rings; i++) { g.lineWidth = Math.min(r * .3, p.thickness * k); g.beginPath(); for (let j = 0; j < (p.segments || 1); j++) { const step = sw / (p.segments || 1), gap = p.segments > 1 ? Math.min(step * .8, (p.segmentGap || 0) * Math.PI / 180) : 0; g.moveTo(Math.cos(st + j * step) * r * (p.rings === 1 ? 1 : p.inner + (1 - p.inner) * i / (p.rings - 1)), Math.sin(st + j * step) * r * (p.rings === 1 ? 1 : p.inner + (1 - p.inner) * i / (p.rings - 1))); g.arc(0, 0, r * (p.rings === 1 ? 1 : p.inner + (1 - p.inner) * i / (p.rings - 1)), st + j * step, st + (j + 1) * step - gap); } g.stroke(); }
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
  // Shared procedural modes keep references editable and deterministic across export/restore.
  const networkCache = new WeakMap();
  Object.assign(tools, {
    refNetwork: def('Node network', [.7, .7], { count: 180, radius: .16, links: 3, pointSize: 2, layout: 'cluster', clusters: 5, depth: .45, drift: .04 }, [range('count', 'Nodes', 20, 500, 10), range('radius', 'Connection distance', .03, .4, .01), range('links', 'Links per node', 1, 8), range('pointSize', 'Node size', .5, 8, .5), select('layout', 'Layout', ['cluster', 'circle', 'sparse']), range('clusters', 'Clusters', 1, 12), range('depth', 'Depth fade', 0, 1, .05), range('drift', 'Motion drift', 0, .12, .01)], (g, it, w, h, k, t) => {
      const p = it.p, signature = [it.seed,p.count,p.radius,p.links,p.layout,p.clusters].join('|'); let data = networkCache.get(it);
      if (!data || data.signature !== signature) {
        const r = random(it.seed), nodes = Array.from({length:p.count}, (_, i) => { const a = r()*Math.PI*2, d = Math.sqrt(r())*.46, cluster = i%p.clusters, ca = cluster/p.clusters*Math.PI*2; let x=Math.cos(a)*d,y=Math.sin(a)*d;
          if(p.layout==='cluster'){x=Math.cos(ca)*.25+x*.42;y=Math.sin(ca)*.25+y*.42;} if(p.layout==='sparse'){x=(r()-.5)*.92;y=(r()-.5)*.92;} return {x,y,z:r(),phase:r()*6.28}; });
        const edges=[]; nodes.forEach((a,i)=>{const near=[];for(let j=i+1;j<nodes.length;j++){const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<p.radius)near.push({j,d});}near.sort((a,b)=>a.d-b.d);near.slice(0,p.links).forEach(b=>edges.push([i,b.j,b.d]));}); data={signature,nodes,edges}; networkCache.set(it,data);
      }
      const alpha=g.globalAlpha, points=data.nodes.map(n=>({...n,x:(n.x+Math.sin(t*.4+n.phase)*p.drift)*w,y:(n.y+Math.cos(t*.3+n.phase)*p.drift)*h}));
      g.strokeStyle=p.c2;for(const [i,j,d] of data.edges){g.globalAlpha=alpha*(.18+.55*(1-d/p.radius));line(g,[points[i].x,points[i].y],[points[j].x,points[j].y]);}
      g.fillStyle=it.fill;for(const n of points){g.globalAlpha=alpha*(1-p.depth*n.z*.85);dot(g,n.x,n.y,p.pointSize*k*(.5+n.z));}g.globalAlpha=alpha;
    }),
    refSurface: def('Particle surface', [.65, .8], { columns: 32, rows: 40, bend: .32, twist: 1.5, frequency: 3, pointSize: 1, scatter: .02, depth: .65, cage: false }, [range('columns', 'Columns', 8, 60),range('rows', 'Rows', 8, 60),range('bend', 'Wave amplitude', 0, .5, .01),range('twist', 'Twist', -5, 5, .1),range('frequency', 'Wave frequency', .5, 8, .1),range('pointSize', 'Particle size', .4, 5, .1),range('scatter', 'Scatter', 0, .15, .01),range('depth', 'Depth fade', 0, 1, .05),check('cage', 'Boundary frame')], (g,it,w,h,k,t)=>{
      const p=it.p,r=random(it.seed),alpha=g.globalAlpha;
      for(let j=0;j<p.rows;j++)for(let i=0;i<p.columns;i++){const u=i/Math.max(1,p.columns-1)-.5,v=j/Math.max(1,p.rows-1)-.5,a=v*p.twist*Math.PI+Math.sin(v*4+t)*.15,z=Math.sin(u*p.frequency*6.28+v*4-t)*p.bend,xx=(u*Math.cos(a)*.85+z*.35+(r()-.5)*p.scatter)*w,yy=(v*.85+u*Math.sin(a)*.2+(r()-.5)*p.scatter)*h;g.globalAlpha=alpha*(1-p.depth*(.5+z));g.fillStyle=z>0?p.c2:it.fill;dot(g,xx,yy,p.pointSize*k*(1+z));}g.globalAlpha=alpha;if(p.cage){g.strokeStyle=it.fill;g.strokeRect(-w*.46,-h*.46,w*.92,h*.92);}
    }),
    refCage: def('Wireframe cage', [.6,.7], { sides: 6, layers: 7, twist: 35, taper: .35, nodes: true }, [range('sides','Vertices',3,12),range('layers','Frame layers',2,16),range('twist','Twist / degrees',-180,180),range('taper','Taper',0,.8,.05),check('nodes','Vertex markers')], (g,it,w,h,k,t)=>{
      const p=it.p,frames=[];for(let j=0;j<p.layers;j++){const q=j/(p.layers-1),a=(q-.5)*p.twist*Math.PI/180+t*.1,rr=(1-p.taper*Math.sin(q*Math.PI))*.36;const pts=Array.from({length:p.sides},(_,i)=>{const z=i/p.sides*6.28+a;return [Math.cos(z)*w*rr,Math.sin(z)*h*rr*.42+(q-.5)*h*.48];});frames.push(pts);g.beginPath();pts.forEach((v,i)=>i?g.lineTo(...v):g.moveTo(...v));g.closePath();g.stroke();if(j)pts.forEach((v,i)=>line(g,frames[j-1][i],v));if(p.nodes){g.fillStyle=p.c2;pts.forEach(v=>dot(g,...v,2*k));}}
    }),
    refCollage: def('Geometric collage', [.7,.8], { pieces: 24, angle: -35, spread: .75, scale: .18, style: 'mixed', grain: 160, accentRatio: .2 }, [range('pieces','Pieces',3,80),range('angle','Composition angle',-180,180),range('spread','Spread',.1,1,.05),range('scale','Piece size',.04,.35,.01),select('style','Shapes',['mixed','blocks','stripes','triangles','hatch']),range('grain','Print flecks',0,1000,20),range('accentRatio','Accent proportion',0,1,.05)], (g,it,w,h,k)=>{
      const p=it.p,r=random(it.seed),alpha=g.globalAlpha;g.rotate(p.angle*Math.PI/180);const side=Math.min(w,h);
      for(let i=0;i<p.pieces;i++){const x=(r()-.5)*side*p.spread,y=(r()-.5)*side*p.spread,ww=side*p.scale*(.3+r()*1.5),hh=side*p.scale*(.15+r()),q=r(),mode=p.style==='mixed'?['blocks','stripes','triangles','hatch'][i%4]:p.style;g.save();g.translate(x,y);g.globalAlpha=alpha*(.25+q*.75);g.fillStyle=g.strokeStyle=r()<p.accentRatio?p.c2:it.fill;if(mode==='triangles'){g.beginPath();g.moveTo(-ww/2,hh/2);g.lineTo(ww/2,hh/2);g.lineTo(0,-hh/2);g.closePath();g.fill();}else if(mode==='hatch'){g.beginPath();g.rect(-ww/2,-hh/2,ww,hh);g.clip();for(let z=-ww-hh;z<ww+hh;z+=5*k)line(g,[z,-hh],[z+hh*2,hh]);}else if(mode==='stripes'){for(let j=0;j<4;j++)g.fillRect(-ww/2,-hh/2+j*hh/4,ww,Math.max(k,hh*.08));}else g.fillRect(-ww/2,-hh/2,ww,hh);g.restore();}
      g.fillStyle=it.fill;g.globalAlpha=alpha*.3;for(let i=0;i<p.grain;i++)dot(g,(r()-.5)*side,(r()-.5)*side,.3+r()*k);g.globalAlpha=alpha;
    }),
    refTotem: def('Geometric totem', [.4,.9], { levels: 5, spacing: .16, symmetry: true, size: .15, turn: 20, dust: 120 }, [range('levels','Levels',2,9),range('spacing','Level spacing',.06,.2,.01),check('symmetry','Symmetric accents'),range('size','Symbol size',.04,.2,.01),range('turn','Rotation per level',-90,90),range('dust','Dust points',0,500,20)], (g,it,w,h,k,t)=>{
      const p=it.p,r=random(it.seed);line(g,[0,-h*.46],[0,h*.46]);for(let i=0;i<p.levels;i++){const y=(i-(p.levels-1)/2)*h*Math.min(p.spacing,.82/(p.levels-1));g.save();g.translate(0,y);g.rotate((i*p.turn)*Math.PI/180+t*.04);const rr=Math.min(w,h)*p.size*(1+(i%2)*.4);if(i%3===0)dot(g,0,0,rr,true);else{poly(g,i%3===1?6:4,rr);g.stroke();}g.fillStyle=p.c2;dot(g,rr,0,2.5*k);if(p.symmetry)dot(g,-rr,0,2.5*k);line(g,[-w*.42,0],[w*.42,0]);g.restore();}const a=g.globalAlpha;g.globalAlpha=a*.25;for(let i=0;i<p.dust;i++)dot(g,(r()-.5)*w*.8,(r()-.5)*h*.85,r()*k+ .2);g.globalAlpha=a;
    }),
    refSurvey: def('Survey map', [.8,.9], { columns: 8, rows: 10, contours: 22, relief: .3, tiles: .22, mode: 'mosaic', grid: true, marks: 10, title: 'SECTOR / 01', caption: 'DECORATIVE MAP', textSize: 10 }, [select('mode','Map style',['mosaic','contour','starfield']),range('columns','Grid columns',2,20),range('rows','Grid rows',2,24),range('contours','Contour lines',4,60),range('relief','Contour variation',.02,.5,.01),range('tiles','Shaded tiles',0,1,.05),check('grid','Grid'),range('marks','Waypoints',0,40),{k:'title',label:'Title',t:'text'},{k:'caption',label:'Caption',t:'text'},range('textSize','Label size',7,24)], (g,it,w,h,k,t)=>{
      const p=it.p,r=random(it.seed),alpha=g.globalAlpha,dx=w*.9/p.columns,dy=h*.9/p.rows;
      if(p.mode==='mosaic'){for(let j=0;j<p.rows;j++)for(let i=0;i<p.columns;i++){if(r()<p.tiles){g.globalAlpha=alpha*(.06+r()*.24);g.fillStyle=p.c2;g.fillRect(-w*.45+i*dx,-h*.45+j*dy,dx,dy);}}}
      g.save();g.beginPath();g.rect(-w*.45,-h*.45,w*.9,h*.9);g.clip();g.strokeStyle=it.fill;g.globalAlpha=alpha*.35;
      if(p.mode!=='starfield')for(let j=0;j<p.contours;j++){g.beginPath();for(let i=0;i<=100;i++){const q=i/100,x=(q-.5)*w,y=((j/(p.contours-1)-.5)*.9+Math.sin(q*9+j*.16)*p.relief*.5+Math.sin(q*23+j*.08)*p.relief*.18)*h;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
      else{g.fillStyle=it.fill;for(let i=0;i<p.contours*15;i++)dot(g,(r()-.5)*w,(r()-.5)*h,(.3+r())*k);}g.restore();g.globalAlpha=alpha;
      if(p.grid){g.globalAlpha=alpha*.35;for(let i=0;i<=p.columns;i++)line(g,[-w*.45+i*dx,-h*.45],[-w*.45+i*dx,h*.45]);for(let j=0;j<=p.rows;j++)line(g,[-w*.45,-h*.45+j*dy],[w*.45,-h*.45+j*dy]);g.globalAlpha=alpha;}
      g.fillStyle=g.strokeStyle=p.c2;for(let i=0;i<p.marks;i++){const x=(r()-.5)*w*.8,y=(r()-.5)*h*.8;line(g,[x-4*k,y],[x+4*k,y]);line(g,[x,y-4*k],[x,y+4*k]);if(i%3===0)dot(g,x,y,8*k,true);}g.fillStyle=it.fill;g.textAlign='left';g.font=`${p.textSize*k}px "Geist Mono", monospace`;g.fillText(p.title,-w*.43,-h*.4,w*.8);g.fillText(p.caption,-w*.43,h*.42,w*.8);
    }),
    refHex: def('Hex cluster', [.75,.45], { columns: 6, rows: 3, radius: .11, density: .65, open: .18, nodes: true, variation: .25 }, [range('columns','Columns',1,12),range('rows','Rows',1,8),range('radius','Hexagon size',.03,.15,.01),range('density','Density',.1,1,.05),range('open','Open edges',0,.8,.05),check('nodes','Vertex dots'),range('variation','Size variation',0,.7,.05)], (g,it,w,h,k)=>{
      const p=it.p,r=random(it.seed),rr=Math.min(w*.9/(p.columns*1.5+.5),h*.9/(p.rows*1.74+.87),Math.min(w,h)*p.radius);for(let j=0;j<p.rows;j++)for(let i=0;i<p.columns;i++){if(r()>p.density)continue;const x=(i-(p.columns-1)/2)*rr*1.5,y=(j-(p.rows-1)/2+(i%2)*.5-.25)*rr*1.74,rad=rr*(1-r()*p.variation),pts=Array.from({length:6},(_,n)=>[x+Math.cos(n*Math.PI/3)*rad,y+Math.sin(n*Math.PI/3)*rad]);g.strokeStyle=i%3===0?p.c2:it.fill;for(let n=0;n<6;n++)if(r()>p.open)line(g,pts[n],pts[(n+1)%6]);if(p.nodes){g.fillStyle=it.fill;dot(g,...pts[Math.floor(r()*6)],2.5*k);}}
    }),
    refSystem: def('Celestial system', [.85,.65], { bodies: 7, spacing: .08, size: .045, ratio: 2.5, orbit: true, rings: true, labels: 'MERCURY,VENUS,EARTH,MARS,JUPITER,SATURN,NEPTUNE', textSize: 9, layout: 'atlas' }, [select('layout','Layout',['atlas','scale']),range('bodies','Bodies',2,12),range('spacing','Orbit spacing',.035,.1,.005),range('size','Body size',.015,.08,.005),range('ratio','Size contrast',1,6,.1),check('orbit','Orbit arcs'),check('rings','Ringed body'),{k:'labels',label:'Names / comma separated',t:'text'},range('textSize','Label size',7,22)], (g,it,w,h,k,t)=>{
      const p=it.p,labels=p.labels.split(',').map(v=>v.trim()),sunX=-w*.32;g.strokeStyle=it.fill;dot(g,sunX,0,Math.min(w,h)*p.size*p.ratio,true);
      for(let i=0;i<p.bodies;i++){const radius=w*(.12+i*Math.min(p.spacing,.72/Math.max(1,p.bodies-1))),x=p.layout==='scale'?(-.15+i*.8/Math.max(1,p.bodies-1))*w:sunX+radius,y=p.layout==='scale'?0:Math.sin(t*.04+i*.4)*h*.08,rr=Math.min(w,h)*p.size*(i===4?p.ratio: .45+(i%4)*.22);if(p.orbit&&p.layout==='atlas'){g.save();g.beginPath();g.rect(-w*.48,-h*.47,w*.96,h*.94);g.clip();g.globalAlpha*=.45;g.beginPath();g.ellipse(sunX,0,radius,Math.min(radius,h*.44),0,0,Math.PI*2);g.stroke();g.restore();}g.fillStyle=i===2?p.c2:it.fill;dot(g,x,y,rr,i!==2);if(p.rings&&i===5){g.beginPath();g.ellipse(x,y,rr*1.7,rr*.5,-.4,0,Math.PI*2);g.stroke();}g.fillStyle=it.fill;g.textAlign='center';g.font=`${p.textSize*k}px "Geist Mono", monospace`;g.fillText(labels[i]||`BODY ${i+1}`,x,y-rr-7*k,w*.13);}
    }),
  });
  const photoCache = new WeakMap();
  tools.refPhoto = def('Image mosaic', [.6,.6], { src: '', columns: 4, rows: 4, gutter: .008, density: 1, fit: 'cover', displacement: 0 }, [range('columns','Tile columns',1,12),range('rows','Tile rows',1,12),range('gutter','Tile gap',0,.06,.002),range('density','Visible tiles',.1,1,.05),select('fit','Image fitting',['cover','contain']),range('displacement','Fragment offsets',0,.12,.01)], (g,it,w,h,k)=>{
    const p=it.p; let cached=photoCache.get(it);
    if(p.src && (!cached || cached.src!==p.src)){const img=new Image();cached={src:p.src,img,loaded:false};photoCache.set(it,cached);img.onload=()=>{cached.loaded=true;const s=window.__cerebra?.studio;if(s?.items.includes(it))s.place(it);};img.src=p.src;}
    if(!p.src || !cached?.loaded){g.strokeRect(-w*.44,-h*.44,w*.88,h*.88);line(g,[-w*.44,-h*.44],[w*.44,h*.44]);line(g,[-w*.44,h*.44],[w*.44,-h*.44]);g.font=`${12*k}px monospace`;g.textAlign='center';g.fillText('ADD PHOTO',0,0,w*.8);return;}
    const img=cached.img,scale=(p.fit==='cover'?Math.max:Math.min)(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale,r=random(it.seed),dx=w/p.columns,dy=h/p.rows,gap=Math.min(w,h)*p.gutter;
    for(let j=0;j<p.rows;j++)for(let i=0;i<p.columns;i++){const visible=r(),ox=(r()-.5)*w*p.displacement,oy=(r()-.5)*h*p.displacement;if(visible>p.density)continue;g.save();g.translate(ox,oy);g.beginPath();g.rect(-w/2+i*dx+gap/2,-h/2+j*dy+gap/2,Math.max(.1,dx-gap),Math.max(.1,dy-gap));g.clip();g.drawImage(img,-iw/2,-ih/2,iw,ih);g.restore();}
  }, {anim:false});
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
  presets.push(
    {id:'neuralCore',name:'Neural Core',items:[K('refNetwork',.5,.46,.75,.75,{count:320,layout:'cluster',clusters:7}),K('refDial',.5,.46,.3,.3,{rings:2,ticks:0,sweep:360}),T('NEURAL / CORE',.5,.88,16)]},
    {id:'particleVortex',name:'Particle Vortex',items:[K('refCage',.5,.46,.65,.85,{sides:4,layers:9}),K('refSurface',.5,.46,.7,.85,{twist:2.8,bend:.4}),T('PARTICLE / SURFACE',.5,.91,14)]},
    {id:'wireframeRelic',name:'Wireframe Relic',items:[K('refCage',.5,.44,.62,.75,{sides:9,layers:5,twist:55}),K('refPhoto',.5,.44,.42,.55,{columns:1,rows:1,clip:'circle'}),K('refCollage',.5,.44,.42,.55,{pieces:12,style:'stripes',grain:0},{opacity:.35}),K('refScanner',.5,.44,.78,.8,{ring:false,title:'RELIC / STUDY',subtitle:'IMPORT AN IMAGE TO COMPLETE'})]},
    {id:'monochromeFragments',name:'Monochrome Fragments',items:[K('refCollage',.5,.45,.8,.95,{angle:0,pieces:38,style:'blocks',accentRatio:0}),K('refLines',.5,.45,.9,.4,{angle:0,mode:'parallel',count:3}),T('FRAGMENT / 01',.5,.91,16)]},
    {id:'diagonalBlueprint',name:'Diagonal Blueprint',items:[K('refCollage',.5,.46,.75,.9,{angle:-45,pieces:30,accentRatio:.1}),K('refPattern',.5,.46,.85,.9,{mode:'crosses',density:.15}),K('refLines',.5,.46,.9,.7,{angle:-45})]},
    {id:'geometricTotem',name:'Geometric Totem',items:[K('refTotem',.5,.48,.5,1.05),K('refTexture',.5,.48,.65,1.05,{mode:'dust',density:500,strength:.2}),T('STRUCTURE / 01',.5,.94,14)]},
    {id:'mapMosaic',name:'Map Mosaic',items:[K('refSurvey',.5,.46,.9,1.05,{mode:'mosaic',tiles:.4}),K('refPhoto',.5,.46,.7,.8,{columns:6,rows:8,density:.55}),T('MAPPING',.5,.06,22),K('refDial',.7,.72,.3,.3,{rings:1,ticks:0,dots:1,sweep:360,dash:'dotted'})]},
    {id:'surveyMap',name:'Survey Map',items:[K('refSurvey',.5,.46,.9,1.05,{mode:'contour',contours:38,title:'INTERZONE',caption:'SECTOR 7A / DECORATIVE STUDY'}),K('refScanner',.5,.46,.8,.95,{ring:false,title:'ORBITAL SURVEILLANCE',subtitle:'SCAN / 01'})]},
    {id:'printCollage',name:'Print Collage',items:[K('refCollage',.5,.46,.85,.85,{angle:0,style:'mixed',pieces:35,accentRatio:.3}),K('refTexture',.5,.46,.85,.9,{mode:'ink',density:900,strength:.3}),T('PRINT / FORM',.5,.89,16)]},
    {id:'networkMinimal',name:'Network Minimal',items:[K('refNetwork',.65,.46,.75,.95,{layout:'sparse',count:90,links:2,radius:.2,depth:.85}),T('CONNECTIONS',.28,.85,16)]},
    {id:'hexCluster',name:'Hex Cluster',items:[K('refHex',.5,.48,.9,.55,{columns:7,rows:3,density:.75}),T('HEX / STRUCTURE',.5,.82,16)]},
    {id:'galaxyNavigation',name:'Galaxy Navigation',items:[K('refSurvey',.5,.47,.95,.95,{mode:'starfield',contours:40,title:'GALAXY / NAVIGATION',caption:'RELATIVE SECTORS'}),K('refNetwork',.5,.47,.85,.85,{layout:'circle',count:90,links:1,radius:.13}),K('refRoute',.5,.47,.8,.5,{routeMode:'curve',tracks:1,bend:.25})]},
    {id:'trajectoryMap',name:'Trajectory Map',items:[K('refSystem',.5,.47,.9,.6,{bodies:5}),K('refRoute',.5,.47,.8,.8,{routeMode:'curve',tracks:5,bend:.35}),K('refScanner',.5,.47,.9,.85,{ring:false,title:'TRAJECTORY / STUDY',subtitle:'DECORATIVE PATHS'})]},
    {id:'solarAtlas',name:'Solar Atlas',items:[K('refSystem',.5,.47,.9,.8),K('arcText',.38,.47,.55,.55,{text:'CELESTIAL / ORBITAL SYSTEM',size:11}),T('SOLAR ATLAS',.5,.9,18)]},
    {id:'celestialScale',name:'Celestial Scale',items:[K('refSystem',.5,.47,.95,.7,{layout:'scale',size:.055,ratio:5,orbit:false}),K('refLines',.5,.47,.95,.35,{angle:0,mode:'parallel',count:2}),T('CELESTIAL / SCALE STUDY',.5,.84,15)]},
    {id:'hudReticle',name:'HUD Reticle',items:[K('refDial',.5,.46,.8,.8,{rings:5,segments:8,segmentGap:12,ticks:120,thickness:3}),K('refScanner',.5,.46,.48,.48,{ring:false,title:'TARGET / 01',subtitle:'RETICLE ONLINE',ticks:4}),K('refPattern',.5,.46,.22,.22,{mode:'frames',columns:2,rows:3,density:1,jitter:0}),T('RTCL / 01',.5,.93,16)]}
  );
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
      const r = sync(), it = s.sel;
      if(it?.kit==='refPhoto'){
        const row=document.createElement('label');row.className='st-fly-row';const name=document.createElement('span');name.textContent='Photo / map image';const input=document.createElement('input');input.type='file';input.accept='image/*';input.style.cssText='min-width:0;width:55%;max-width:190px;font-size:11px';input.dataset.refPhotoUpload='';row.append(name,input);s.el.querySelector('[data-kit-panel]').append(row);
        const status=document.createElement('p');status.className='st-fly-note';status.textContent='Choose a photo. Stored with this work; large images resize to 1600 px.';row.after(status);
        input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(file.size>20*1024*1024){status.textContent='Choose an image smaller than 20 MB.';return;}input.disabled=true;status.textContent='Loading image…';let bitmap;try{bitmap=await createImageBitmap(file);const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*ratio));c.height=Math.max(1,Math.round(bitmap.height*ratio));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);const src=c.toDataURL('image/webp', .88);if(!s.items.includes(it)){status.textContent='Layer removed. Add an Image mosaic layer to import again.';return;}s.flushCommit();it.p.src=src;s.place(it);s.commit();status.textContent='Image added. Tile rows, gaps and offsets are adjustable.';}catch(e){status.textContent='Could not open this image. Try PNG or JPEG.';}finally{bitmap?.close();input.disabled=false;input.value='';}};return r;
      }
      if (!['refRoute', 'refScanner'].includes(it?.kit)) return r;
      const f = s.el.querySelector('[data-kit-panel]');
      (it.kit === 'refScanner' ? ['anchorTarget'] : ['anchorA', 'anchorB']).forEach((field, n) => { const row = document.createElement('label'); row.className = 'st-fly-row'; const span = document.createElement('span'); span.textContent = field === 'anchorTarget' ? 'Follow layer' : n ? 'Link end to layer' : 'Link start to layer'; const input = document.createElement('select'); input.dataset.refAnchor = field; input.add(new Option('Unlinked', '')); if (field === 'anchorTarget') input.add(new Option('Cerebra / active planet', 'subject')); s.items.filter(v => v !== it && v.kind !== 'fx' && !['refRoute', 'refScanner'].includes(v.kit)).forEach(v => input.add(new Option(s.label(v), key(v)))); input.value = it.p[field] || ''; row.append(span, input); f.append(row); input.onchange = () => { s.flushCommit(); it.p[field] = input.value; if (it.kit === 'refRoute' && (!it.p.anchorA || !it.p.anchorB)) { delete it.p.ax; delete it.p.ay; delete it.p.bx; delete it.p.by; place(it); } anchors(); s.commit(); }; }); return r;
    };
    const panel = document.createElement('details'); panel.className = 'studio-sub'; panel.dataset.referencePresets = ''; panel.innerHTML = '<summary>Reference design presets · 36</summary><p class="studio-note ref-intro">Choose a study to add as an editable layer group.</p><p class="studio-note ref-note">Maps and paths are decorative. Import your own imagery for real maps or photographs.</p><label class="st-fly-row ref-collection"><span>Collection</span><select data-reference-collection><option value="new">New reference collection</option><option value="all">All presets</option><option value="geometry">Geometry &amp; print</option><option value="particles">Particles &amp; networks</option><option value="maps">Maps &amp; celestial</option><option value="classic">Original collection</option></select></label><div class="studio-preset-grid" data-reference-grid></div><div class="ref-colours"><label class="st-fly-row ref-colour"><span>Group ink</span><input type="color" value="#e8ecf5" data-reference-ink></label><label class="st-fly-row ref-colour"><span>Group accent</span><input type="color" value="#e1b878" data-reference-accent></label></div><div class="st-fly-shapes ref-actions"><button type="button" class="st-btn" data-reference-motion aria-pressed="false">Motion off</button><button type="button" class="st-btn" data-reference-shuffle>Shuffle pattern</button></div>';
    const style = document.createElement('style'); style.textContent = `
#studio [data-reference-presets] .ref-intro{font:13px/1.5 var(--f-sans);margin:0 0 8px;color:#c3cad5}
#studio [data-reference-presets] .ref-note{font:12px/1.5 var(--f-sans);color:#a9b4c8;margin:0 0 16px}
#studio [data-reference-presets] .ref-collection{display:grid;grid-template-columns:1fr;gap:8px;margin:0 0 16px;padding:0;font:12px var(--f-sans);color:#bfc7d4}
#studio [data-reference-presets] .ref-collection select{width:100%;min-width:0;min-height:46px;padding:10px 14px;border-radius:14px;border:1px solid #ffffff15;background:#20232b;color:#e8ecf5;font:14px var(--f-sans);box-shadow:inset 2px 3px 7px #0005}
#studio [data-reference-grid]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 18px}
#studio [data-reference-presets] [data-reference-preset]{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:10px;min-width:0;min-height:150px;padding:10px 10px 12px;border-radius:18px!important;background:linear-gradient(145deg,#31353c,#272b31)!important;color:#e6eaf0;font:600 12px/1.3 var(--f-sans);letter-spacing:.015em;text-transform:none;text-align:center;box-shadow:4px 5px 11px #0006,-3px -3px 8px #ffffff08!important;transition:background .2s,box-shadow .2s,transform .15s}
#studio [data-reference-presets] [data-reference-preset][hidden]{display:none}
#studio [data-reference-presets] [data-reference-preset]:hover{box-shadow:0 0 0 1px #ad85fa88,4px 5px 11px #0006!important}
#studio [data-reference-presets] [data-reference-preset]:active{transform:scale(.98)}
#studio [data-reference-presets] [data-reference-preset][aria-pressed=true]{background:var(--cyg)!important;color:#fff;box-shadow:0 0 0 1px #c5a4ff99,0 0 18px #8b5cf655!important}
#studio [data-reference-presets] :is(button,select,input):focus-visible{outline:2px solid #c5a4ff;outline-offset:3px}
#studio [data-reference-presets] canvas{display:block;width:100%;height:94px;object-fit:contain;pointer-events:none;background:#171a21;border-radius:11px}
#studio [data-reference-presets] .ref-preset-name{display:flex;align-items:center;justify-content:center;min-height:30px;overflow-wrap:anywhere}
#studio [data-reference-presets] .ref-colours{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}
#studio [data-reference-presets] .ref-colour{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0;padding:8px;border-radius:14px;background:#ffffff07;border:1px solid #ffffff10;font:12px var(--f-sans)}
#studio [data-reference-presets] .ref-colour>span{flex-basis:100%;color:#c3cad5}
#studio [data-reference-presets] .ref-colour input[type=color]{width:38px;height:44px;min-width:0;padding:3px;border-radius:10px}
#studio [data-reference-presets] .ref-colour .st-pk{width:44px;height:44px;margin:0;border-radius:10px}
#studio [data-reference-presets] .ref-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 8px}
#studio [data-reference-presets] .ref-actions .st-btn{min-width:0;width:100%;min-height:46px;padding:10px 8px;font:600 12px/1.3 var(--f-sans);letter-spacing:0;text-transform:none;border-radius:14px}
#studio [data-reference-presets] input[type=file]{max-width:100%}
`; document.head.append(style);
    const grid = panel.querySelector('[data-reference-grid]'); presets.forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.className = 'studio-preset'; b.dataset.referencePreset = d.id; b.setAttribute('aria-pressed', 'false');
      const c = document.createElement('canvas'); c.width = 180; c.height = 150; c.setAttribute('aria-hidden', 'true'); const g = c.getContext('2d');
      d.items.filter(i => i.kind === 'kit').forEach(i => { const item = { ...i, fill: '#e8ecf5', seed: 7, p: { ...KIT[i.kit].defaults, ...i.p } }; const w = i.w * 125, h = i.h * 125; KIT[i.kit].draw(g, item, i.x * 180 - w / 2, i.y * 150 - h / 2, w, h, .25); });
      const label = document.createElement('span'); label.className = 'ref-preset-name'; label.textContent = d.name; b.append(c, label); b.onclick = () => { grid.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); s.closeFly(); addPreset(d.id, { ink: panel.querySelector('[data-reference-ink]').value, accent: panel.querySelector('[data-reference-accent]').value }); }; grid.append(b); });
    const categories={particles:['neuralCore','particleVortex','networkMinimal'],geometry:['wireframeRelic','monochromeFragments','diagonalBlueprint','geometricTotem','printCollage','hexCluster','hudReticle'],maps:['mapMosaic','surveyMap','galaxyNavigation','trajectoryMap','solarAtlas','celestialScale']};
    const collection=panel.querySelector('[data-reference-collection]');function filterPresets(){const v=collection.value;grid.querySelectorAll('[data-reference-preset]').forEach((b,index)=>{b.hidden=v==='all'?false:v==='new'?index<20:v==='classic'?index>=20:!categories[v]?.includes(b.dataset.referencePreset);});}collection.onchange=filterPresets;filterPresets();
    panel.className = 'studio-section'; s.panel.querySelector('.studio-section').before(panel);
    panel.querySelectorAll('input[type=color]').forEach(e => { e.oninput = () => { const ink = panel.querySelector('[data-reference-ink]').value, accent = panel.querySelector('[data-reference-accent]').value; members().forEach(i => { if (i.kind === 'text') { i.color = ink; i.textColors = []; } else { i.fill = ink; if (i.p) i.p.c2 = accent; } s.place(i); }); s.commitSoon(); }; e.onchange = () => s.flushCommit(); });
    panel.querySelector('[data-reference-motion]').onclick = e => { const on = !members().some(i => i.mOn); motion(on); e.currentTarget.textContent = on ? 'Motion on' : 'Motion off'; e.currentTarget.setAttribute('aria-pressed', String(on)); };
    panel.querySelector('[data-reference-shuffle]').onclick = shuffle;
    s.referenceDesign = { tools: Object.keys(tools), presets: presets.map(d => ({ id: d.id, name: d.name })), addPreset, palette, motion, shuffle, anchors };
  }
  setTimeout(boot, 0);
})();
