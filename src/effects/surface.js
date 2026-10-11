/* F5 Surface style: replaces or dresses the planet surface with geometry built from the sphere:
   dot grid (points on a Fibonacci sphere), spikes (lines along the normal), wire polyhedron, 3D plexus (k-nearest links).
   Built only when a style is chosen and rebuilt (once) when its settings change; density drops on phones. */
const SURFACE = Effects.register({
  id: 'surface', prefix: 's_', title: 'Surface style',
  controls: [
    { key: 'style',   label: 'Style', type: 'select', options: [['none', 'Original surface'], ['dotgrid', 'Dot grid'], ['halftone', 'Halftone dots'], ['spike', 'Spikes'], ['threads', 'Curly threads'], ['fur', 'Fur bristles'], ['wire', 'Wire polyhedron'], ['plexus3d', 'Plexus 3D'], ['contour', 'Contour rings'], ['meridian', 'Meridian lines'], ['cloud', 'Particle cloud'], ['shards', 'Crystal shards'], ['radial', 'Radial data spokes'], ['orrery', 'Orrery rings'], ['neural', 'Neural cells'], ['dataflow', 'Data flow arcs'], ['strands', 'Drifting strands']] },
    { key: 'density', label: 'Density',      min: 0.15, max: 1,   step: 0.01 },
    { key: 'colorA',  label: 'Colour A',     type: 'color' },
    { key: 'colorB',  label: 'Colour B',     type: 'color' },
    { key: 'colorC',  label: 'Colour C (spike tips)', type: 'color' },
    { key: 'disp',    label: 'Displacement', min: 0,    max: 1,   step: 0.01 },
    { key: 'size',    label: 'Size',         min: 0.3,  max: 3,   step: 0.01 },
    { key: 'spin',    label: 'Spin',         min: -2,   max: 2,   step: 0.01 },
    { key: 'shell',   label: 'Outer polyhedron (wire)', type: 'toggle' },
    // --- Transform & motion (every style)
    { key: 'bright',  label: 'Brightness',        min: 0.2, max: 2,   step: 0.01, group: 'move' },
    { key: 'scale',   label: 'Overall scale',     min: 0.5, max: 1.6, step: 0.01, group: 'move' },
    { key: 'tilt',    label: 'Tilt (forward / back)', min: -90, max: 90, step: 1, group: 'move' },
    { key: 'roll',    label: 'Roll (sideways)',   min: -90, max: 90,  step: 1, group: 'move' },
    { key: 'breath',  label: 'Breathing',         min: 0,   max: 1,   step: 0.01, group: 'move' },
    { key: 'bspeed',  label: 'Breathing speed',   min: 0.1, max: 3,   step: 0.01, group: 'move' },
    { key: 'pulse',   label: 'Pulse shimmer',     min: 0,   max: 1,   step: 0.01, group: 'move' },
    { key: 'seed',    label: 'Pattern seed (shuffle)', min: 1, max: 99, step: 1, group: 'move' },
    // --- Per-style options (shown only for the styles listed)
    { key: 'freq',    label: 'Noise scale',       min: 0.4, max: 4,   step: 0.01, styles: ['dotgrid', 'halftone', 'plexus3d', 'spike', 'contour', 'meridian', 'wire', 'shards'] },
    { key: 'grad',    label: 'Colour blend',      type: 'select', options: [['auto', 'Style default'], ['noise', 'By noise'], ['height', 'Pole to pole'], ['mix', 'Noise + height'], ['radial', 'By depth (cloud)']], styles: ['dotgrid', 'halftone', 'plexus3d', 'wire', 'cloud'] },
    { key: 'links',   label: 'Links per dot',     min: 1,   max: 6,   step: 1, styles: ['plexus3d'] },
    { key: 'len',     label: 'Length',            min: 0.3, max: 2.5, step: 0.01, styles: ['spike', 'threads', 'fur', 'shards'] },
    { key: 'curl',    label: 'Curl',              min: 0,   max: 2.5, step: 0.01, styles: ['threads', 'fur'] },
    { key: 'steps',   label: 'Smoothness (segments)', min: 8, max: 60, step: 1, styles: ['threads'] },
    { key: 'wide',    label: 'Crystal width',     min: 0.3, max: 3,   step: 0.01, styles: ['shards'] },
    { key: 'tipdots', label: 'Beads on the tips', type: 'toggle', styles: ['spike', 'threads', 'shards'] },
    { key: 'twist',   label: 'Twist',             min: 0,   max: 2.5, step: 0.01, styles: ['wire'] },
    { key: 'wdetail', label: 'Subdivision (0 = auto)', min: 0, max: 4, step: 1, styles: ['wire'] },
    { key: 'count',   label: 'Line count (0 = auto)', min: 0, max: 140, step: 1, styles: ['contour', 'meridian'] },
    { key: 'depth',   label: 'Cloud thickness',   min: 0.2, max: 2,   step: 0.01, styles: ['cloud'] },
    { key: 'hole',    label: 'Hollow centre',     min: 0.05, max: 0.95, step: 0.01, styles: ['cloud'] },
    { key: 'clump',   label: 'Clumping',          min: 0.4, max: 4,   step: 0.01, styles: ['cloud'] },
    { key: 'dsize',   label: 'Head / bead size (0 = none)', min: 0, max: 3, step: 0.01, styles: ['spike','threads','shards','radial','orrery','neural','dataflow','strands'] },
    { key: 'rrings',  label: 'Guide rings',       min: 0,   max: 12,  step: 1, styles: ['radial'] },
    { key: 'rvar',    label: 'Spoke length variety', min: 0, max: 2,  step: 0.01, styles: ['radial'] },
    { key: 'rgold',   label: 'Gold heads share',  min: 0,   max: 0.5, step: 0.01, styles: ['radial'] },
    { key: 'rn',      label: 'Spokes (0 = by density)', min: 0, max: 1500, step: 10, styles: ['radial'] },
    { key: 'orings',  label: 'Rings',             min: 0,   max: 12,  step: 1, styles: ['orrery'] },
    { key: 'oband',   label: 'Band thickness (rings)', min: 0, max: 16, step: 1, styles: ['orrery'] },
    { key: 'oarcs',   label: 'Bright arcs',       min: 0,   max: 24,  step: 1, styles: ['orrery'] },
    { key: 'ospokes', label: 'Spokes with discs', min: 0,   max: 40,  step: 1, styles: ['orrery'] },
    { key: 'obubble', label: 'Bubble outlines',   min: 0,   max: 1,   step: 0.01, styles: ['orrery'] },
    { key: 'nn',      label: 'Cells',             min: 2,   max: 40,  step: 1, styles: ['neural'] },
    { key: 'nweb',    label: 'Fibres per cell',   min: 2,   max: 80,  step: 1, styles: ['neural'] },
    { key: 'nlinks',  label: 'Links to neighbours', min: 0, max: 4,   step: 1, styles: ['neural'] },
    { key: 'nstr',    label: 'Strands per link',  min: 1,   max: 10,  step: 1, styles: ['neural'] },
    { key: 'nscatter', label: 'Scattered dots',   min: 0,   max: 250, step: 1, styles: ['neural'] },
    { key: 'dn',      label: 'Curves',            min: 30,  max: 1600, step: 10, styles: ['dataflow'] },
    { key: 'dbundle', label: 'Bundles around the ring', min: 3, max: 40, step: 1, styles: ['dataflow'] },
    { key: 'dbow',    label: 'Bow depth',         min: 0,   max: 1,   step: 0.01, styles: ['dataflow'] },
    { key: 'dbeads',  label: 'Beads share',       min: 0,   max: 1,   step: 0.01, styles: ['dataflow'] },
    { key: 'dtilt',   label: 'Ring tilt',         min: 0,   max: 1.57, step: 0.01, styles: ['dataflow'] },
    { key: 'tn',      label: 'Strands',           min: 30,  max: 1400, step: 10, styles: ['strands'] },
    { key: 'tlen',    label: 'Strand length',     min: 0.3, max: 2.5, step: 0.01, styles: ['strands'] },
    { key: 'tdrift',  label: 'Drift',             min: 0,   max: 3,   step: 0.01, styles: ['strands'] },
    { key: 'tpole',   label: 'Bend toward poles', min: 0,   max: 0.5, step: 0.01, styles: ['strands'] },
    { key: 'tbig',    label: 'Big beads share',   min: 0,   max: 0.4, step: 0.01, styles: ['strands'] },
  ],
  defaults: { enabled: 1, style: 'none', density: 0.55, colorA: '#7a5cff', colorB: '#38c8ff', colorC: '#ffe9a8', disp: 0.35, size: 1, spin: 0.15, shell: 1, hide: 1,
    bright: 1, scale: 1, tilt: 0, roll: 0, breath: 0, bspeed: 0.8, pulse: 0, seed: 7,
    freq: 1, grad: 'auto', links: 3, len: 1, curl: 1, steps: 34, wide: 1, tipdots: 0, twist: 1, wdetail: 0, count: 0, depth: 1, hole: 0.45, clump: 1.8, dsize: 1,
    rrings: 6, rvar: 1, rgold: 0.08, rn: 0, orings: 4, oband: 7, oarcs: 8, ospokes: 14, obubble: 1, nn: 12, nweb: 22, nlinks: 2, nstr: 4, nscatter: 50,
    dn: 400, dbundle: 14, dbow: 0.5, dbeads: 0.2, dtilt: 1.1, tn: 400, tlen: 1, tdrift: 1, tpole: 0.05, tbig: 0.05 },
  LIVE: ['enabled', 'hide', 'spin', 'bright', 'scale', 'tilt', 'roll', 'breath', 'bspeed', 'pulse'],   // these never need a rebuild
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  attach(w) {
    const g = new THREE.Group(); g.visible = false; w.spinG.add(g);
    g.rotation.order = 'ZXY'; w.surf = { g, key: '', dirty: true, objs: [], mats: [], geoms: [], spin: 0, t: 0, dm: [] };
  },
  apply(w, k) { if (w.surf) w.surf.dirty = true; },
  // Small seeded value noise on the CPU (the geometry is built once, not per frame).
  noise3(x, y, z) {
    const h = (i, j, l) => { const v = Math.sin(i * 127.1 + j * 311.7 + l * 74.7) * 43758.5453; return v - Math.floor(v); }, sm = t => t * t * (3 - 2 * t);
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz), L = (a, b, t) => a + (b - a) * t;
    return L(L(L(h(ix, iy, iz), h(ix + 1, iy, iz), fx), L(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy), L(L(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), L(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  },
  fbm(x, y, z) { return this.noise3(x, y, z) * 0.62 + this.noise3(x * 2.3 + 5, y * 2.3, z * 2.3) * 0.38; },
  clear(w) {
    const S = w.surf; S.objs.forEach(o => S.g.remove(o)); S.geoms.forEach(g => g.dispose()); S.mats.forEach(m => m.dispose()); S.objs = []; S.geoms = []; S.mats = []; S.dm = []; S.pm = null; S.lm = null; S.shell = null;
  },
  fib(n, R, fn) {   // Fibonacci sphere: fn(x, y, z, i) with a unit vector
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - y * y), a = i * ga; fn(Math.cos(a) * r, y, Math.sin(a) * r, i); }
  },
  build(w) {
    const T = w.tune, S = w.surf, style = T.s_style; this.clear(w);
    if (style === 'none') return;
    const ps = k => { const v = T['s_' + k]; return v == null ? this.defaults[k] : v; };   // a style option, falling back to its default
    const R = w.def.radius, coarse = matchMedia('(pointer:coarse)').matches || innerWidth < 760, dens = T.s_density * (coarse ? 0.45 : 1), disp = T.s_disp, size = T.s_size;
    const cA = new THREE.Color(T.s_colorA), cB = new THREE.Color(T.s_colorB), cC = new THREE.Color(T.s_colorC), tmp = new THREE.Color();
    const add = (obj, geom, mat) => { obj.frustumCulled = false; S.g.add(obj); S.objs.push(obj); S.geoms.push(geom); S.mats.push(mat); };
    const lineMat = () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const FQ = ps('freq'), fbm = (x, y, z, s) => this.fbm(x * s * FQ + 11, y * s * FQ + 3, z * s * FQ + 7);
    const uH = innerHeight * Math.min(2, devicePixelRatio || 1);
    let seed = Math.max(1, Math.round(ps('seed'))); const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // seeded: the same settings always build the same shape
    // Round heads / beads (soft discs with a bright core): collected as plain arrays, uploaded once.
    const DP = [], DC = [], DS = [], dsz = ps('dsize'), dot = (p, c, sz) => { if (dsz <= 0) return; DP.push(p[0], p[1], p[2]); DC.push(c.r, c.g, c.b); DS.push(sz * dsz); };
    const flushDots = () => {
      if (!DP.length) return;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DP), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(DC), 3)); g.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(DS), 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uOp: { value: 0 }, uSize: { value: R * 0.0075 }, uH: { value: uH } },
        vertexShader: 'attribute float aS; attribute vec3 color; uniform float uSize, uH; varying vec3 vC; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; vC = color; gl_PointSize = max(1.5, aS * uSize * projectionMatrix[1][1] * uH * 0.5 / -mv.z); }',
        fragmentShader: 'uniform float uOp; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(mix(vC, vec3(1.), smoothstep(0.3, 0.0, d) * 0.5), smoothstep(0.5, 0.32, d) * uOp); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      add(new THREE.Points(g, m), g, m); S.dm.push(m);
    };
    const gm = ps('grad'), gradT = (nv, y, rr0, dflt) => { const m = gm === 'auto' ? dflt : gm; return m === 'noise' ? nv : m === 'height' ? y * 0.5 + 0.5 : m === 'radial' ? rr0 : nv * 0.6 + (y * 0.5 + 0.5) * 0.4; };
    if (style === 'dotgrid' || style === 'plexus3d' || style === 'halftone') {
      const n = style === 'plexus3d' ? Math.round(120 + 620 * dens) : Math.round(1200 + 9000 * dens);
      const pos = new Float32Array(n * 3), t = new Float32Array(n), P = [];
      this.fib(n, R, (x, y, z, i) => {
        const nv = fbm(x, y, z, 2.2), rr = R * (1 + (nv - 0.5) * disp * 0.5);
        pos.set([x * rr, y * rr, z * rr], i * 3); t[i] = gradT(nv, y, nv, style === 'plexus3d' ? 'noise' : 'mix'); P.push([x * rr, y * rr, z * rr]);
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uA: { value: cA }, uB: { value: cB }, uOp: { value: 0 }, uSize: { value: size * (style === 'dotgrid' ? 1 : style === 'halftone' ? 1.5 : 1.6) * R * 0.012 }, uHT: { value: style === 'halftone' ? 1 : 0 }, uH: { value: innerHeight * Math.min(2, devicePixelRatio || 1) } },
        vertexShader: `attribute float aT; uniform float uSize, uH, uHT; varying float vT, vF;
          void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; vT = aT;
            vec3 n = normalize(normalMatrix * position); vF = 0.25 + 0.75 * smoothstep(-0.25, 0.7, dot(n, normalize(-mv.xyz)));
            float lam = mix(1.0, max(0.0, dot(n, normalize(vec3(0.45, 0.55, 0.7)))) * 1.9 + 0.12, uHT); gl_PointSize = max(uHT > 0.5 ? 0.0 : 1.0, uSize * lam * projectionMatrix[1][1] * uH * 0.5 / -mv.z * (0.55 + 0.45 * vF)); }`,
        fragmentShader: `uniform vec3 uA, uB; uniform float uOp; varying float vT, vF;
          void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = smoothstep(0.5, 0.15, d);
            gl_FragColor = vec4(mix(uA, uB, clamp(vT * 1.4, 0., 1.)), a * vF * uOp); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      add(new THREE.Points(g, m), g, m); S.pm = m;
      if (style === 'plexus3d') {
        const k = Math.round(ps('links')), segs = [], seen = new Set();
        for (let i = 0; i < n; i++) {
          const d = []; for (let j = 0; j < n; j++) if (j !== i) { const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], dz = P[i][2] - P[j][2]; d.push([dx * dx + dy * dy + dz * dz, j]); }
          d.sort((a, b) => a[0] - b[0]);
          for (let q = 0; q < k; q++) { const j = d[q][1], key = i < j ? i * 100000 + j : j * 100000 + i; if (!seen.has(key)) { seen.add(key); segs.push(i, j); } }
        }
        const lp = new Float32Array(segs.length * 3), lc = new Float32Array(segs.length * 3);
        segs.forEach((id, s) => { lp.set(P[id], s * 3); tmp.copy(cA).lerp(cB, t[id]); lc.set([tmp.r, tmp.g, tmp.b], s * 3); });
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
        const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
      }
    } else if (style === 'threads' || style === 'fur') {
      // Curly filaments leaving the surface (reference: tangled glowing threads from a core). Fur = short, dense, gently bent.
      const fur = style === 'fur', n = Math.round((fur ? 2500 : 220) + (fur ? 7000 : 1500) * dens), seg = fur ? 7 : Math.round(ps('steps')), curl = (0.12 + disp * (fur ? 0.5 : 1.15)) * ps('curl'), tipD = +ps('tipdots');
      const lp = new Float32Array(n * seg * 6), lc = new Float32Array(n * seg * 6);
      this.fib(n, R, (x, y, z, i) => {
        let px = x * R * 0.96, py = y * R * 0.96, pz = z * R * 0.96, dx = x, dy = y, dz = z;
        const L = R * (fur ? 0.12 + this.noise3(i * 0.37, 1, 2) * 0.26 : 0.35 + this.noise3(i * 0.21, 3, 5) * 1.0 + rnd() * 0.3) * size * ps('len'), st = L / seg;
        for (let s = 0; s < seg; s++) {
          const t0 = s / seg, t1 = (s + 1) / seg, qx = px, qy = py, qz = pz;
          dx += (this.noise3(px * 1.7 + 3, py * 1.7, pz * 1.7 + i * 0.01 + s * 0.13) - 0.5) * curl; dy += (this.noise3(px * 1.7, py * 1.7 + 9, pz * 1.7 + s * 0.11) - 0.5) * curl; dz += (this.noise3(px * 1.7 + 6, py * 1.7, pz * 1.7 + 4 + s * 0.09) - 0.5) * curl;
          const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl; px += dx * st; py += dy * st; pz += dz * st;
          const o = (i * seg + s) * 6; lp.set([qx, qy, qz, px, py, pz], o);
          tmp.copy(cA).lerp(cB, t0); if (t0 > 0.55) tmp.lerp(cC, (t0 - 0.55) * 2.2); lc.set([tmp.r, tmp.g, tmp.b], o);
          tmp.copy(cA).lerp(cB, t1); if (t1 > 0.55) tmp.lerp(cC, (t1 - 0.55) * 2.2); lc.set([tmp.r, tmp.g, tmp.b], o + 3);
        }
        if (tipD) dot([px, py, pz], cC, 1.4);
      });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (style === 'contour' || style === 'meridian') {
      // Latitude rings (contour) or longitude arcs through the poles (meridian), wobbled by noise for a terrain / flow-line look.
      const cnt = ps('count') > 0 ? Math.round(ps('count')) : Math.round(6 + 54 * dens), seg = 140, mer = style === 'meridian', lp = new Float32Array(cnt * seg * 6), lc = new Float32Array(cnt * seg * 6);
      for (let c = 0; c < cnt; c++) {
        const f = (c + 0.5) / cnt, pts = [];
        for (let s = 0; s <= seg; s++) {
          const u = s / seg;
          let x, y, z; if (mer) { const lon = f * Math.PI * 2, la = (u - 0.5) * Math.PI; x = Math.cos(la) * Math.cos(lon); y = Math.sin(la); z = Math.cos(la) * Math.sin(lon); } else { const la = (f - 0.5) * Math.PI, lo = u * Math.PI * 2; x = Math.cos(la) * Math.cos(lo); y = Math.sin(la); z = Math.cos(la) * Math.sin(lo); }
          const nv = fbm(x, y, z, 2.2), rr = R * (1 + (nv - 0.5) * disp * 0.55); pts.push([x * rr, y * rr, z * rr, nv]);
        }
        for (let s = 0; s < seg; s++) { const o = (c * seg + s) * 6; lp.set([pts[s][0], pts[s][1], pts[s][2], pts[s + 1][0], pts[s + 1][1], pts[s + 1][2]], o); tmp.copy(cA).lerp(cB, mer ? pts[s][3] : f); lc.set([tmp.r, tmp.g, tmp.b], o); tmp.copy(cA).lerp(cB, mer ? pts[s + 1][3] : f); lc.set([tmp.r, tmp.g, tmp.b], o + 3); }
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (style === 'cloud') {
      // Volumetric particle cloud: noise clumps the points inside a thick shell, soft glow sprites.
      const n = Math.round(1500 + 12000 * dens), pos = new Float32Array(n * 3), t = new Float32Array(n); let c = 0;
      for (let tries = 0; c < n && tries < n * 6; tries++) {
        const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, rr0 = Math.pow(rnd(), 0.6), x = Math.sqrt(1 - u * u) * Math.cos(th), y = u, z = Math.sqrt(1 - u * u) * Math.sin(th);
        const rad = R * (ps('hole') + rr0 * (0.7 + disp * 0.9) * ps('depth')), nv = fbm(x * rad / R, y * rad / R, z * rad / R, ps('clump') / FQ); if (rnd() > nv * 1.4) continue;
        pos.set([x * rad, y * rad, z * rad], c * 3); t[c] = gradT(nv, y, rr0, 'radial'); c++;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, c * 3), 3)); g.setAttribute('aT', new THREE.BufferAttribute(t.slice(0, c), 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uA: { value: cA }, uB: { value: cB }, uOp: { value: 0 }, uSize: { value: size * R * 0.011 }, uH: { value: uH } },
        vertexShader: `attribute float aT; uniform float uSize, uH; varying float vT; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; vT = aT; gl_PointSize = max(1.0, uSize * (0.6 + aT) * projectionMatrix[1][1] * uH * 0.5 / -mv.z); }`,
        fragmentShader: `uniform vec3 uA, uB; uniform float uOp; varying float vT; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(mix(uA, uB, vT), pow(smoothstep(0.5, 0.0, d), 1.6) * 0.55 * uOp); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      add(new THREE.Points(g, m), g, m); S.pm = m;
    } else if (style === 'shards') {
      // Low-poly crystals: tetrahedra standing on the surface along the normal; edges drawn base colour -> tip colour.
      const n = Math.round(60 + 520 * dens), lp = new Float32Array(n * 6 * 6), lc = new Float32Array(n * 6 * 6);
      this.fib(n, R, (x, y, z, i) => {
        const nv = fbm(x, y, z, 2.6), len = R * (0.1 + Math.pow(nv, 1.4) * 0.9 * (0.3 + disp)) * size * ps('len'), w0 = R * (0.05 + this.noise3(i * 0.7, 2, 1) * 0.07) * size * ps('wide');
        const up = Math.abs(y) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let ax = y * up[2] - z * up[1], ay = z * up[0] - x * up[2], az = x * up[1] - y * up[0]; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
        const bx = y * az - z * ay, by = z * ax - x * az, bz = x * ay - y * ax, c0 = R * 0.97;
        const B = [[x * c0 + ax * w0, y * c0 + ay * w0, z * c0 + az * w0], [x * c0 - ax * w0 * 0.5 + bx * w0 * 0.87, y * c0 - ay * w0 * 0.5 + by * w0 * 0.87, z * c0 - az * w0 * 0.5 + bz * w0 * 0.87], [x * c0 - ax * w0 * 0.5 - bx * w0 * 0.87, y * c0 - ay * w0 * 0.5 - by * w0 * 0.87, z * c0 - az * w0 * 0.5 - bz * w0 * 0.87]], T = [x * (c0 + len), y * (c0 + len), z * (c0 + len)];
        const edges = [[B[0], B[1]], [B[1], B[2]], [B[2], B[0]], [B[0], T], [B[1], T], [B[2], T]]; tmp.copy(cA).lerp(cB, nv); if (+ps('tipdots')) dot(T, cC, 1.4);
        edges.forEach(([p0, p1], e) => { const o = (i * 6 + e) * 6; lp.set([p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]], o); const tipTo = e >= 3; lc.set([tmp.r, tmp.g, tmp.b], o); if (tipTo) { const k2 = new THREE.Color().copy(tmp).lerp(cC, 0.85); lc.set([k2.r, k2.g, k2.b], o + 3); } else lc.set([tmp.r, tmp.g, tmp.b], o + 3); });
      });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (['radial', 'orrery', 'neural', 'dataflow', 'strands'].includes(style)) {
      // Data-poster looks (reference posters): lines + round heads, collected in plain arrays then uploaded once.
      const LP = [], LC = [], TAU = Math.PI * 2, dk = Math.max(0.15, dens / 0.55), mix = (a, b, t) => tmp.copy(a).lerp(b, Math.max(0, Math.min(1, t))).clone();
      const seg = (a, b, ca, cb) => { LP.push(a[0], a[1], a[2], b[0], b[1], b[2]); LC.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b); };
      const poly = (pts, ca, cb) => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], mix(ca, cb, i / (pts.length - 1)), mix(ca, cb, (i + 1) / (pts.length - 1))); };
      const bez = (a, c, b, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]]); } return o; };
      const unit = () => { const u = rnd() * 2 - 1, th = rnd() * TAU, r = Math.sqrt(1 - u * u); return [r * Math.cos(th), u, r * Math.sin(th)]; };
      const ring = (cx, cy, cz, r, ca, cb, tilt, n = 120, a0 = 0, a1 = TAU) => { const o = [], ct = Math.cos(tilt), st = Math.sin(tilt); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * r, z = Math.sin(a) * r; o.push([cx + x, cy + z * st, cz + z * ct]); } poly(o, ca, cb); };
      if (style === 'radial') {
        // Spokes of every length with a round head (pink / pale / a few gold), over faint concentric guide rings.
        const n = ps('rn') > 0 ? Math.round(ps('rn') * dk) : Math.round(90 + 520 * dens), nR = Math.round(ps('rrings')), gold = ps('rgold'), rv = ps('rvar');
        for (let q = 0; q < nR; q++) { const r = R * (1.25 + q * 0.28 * size), f = tmp.copy(cA).lerp(cB, nR > 1 ? q / (nR - 1) : 0).clone().multiplyScalar(0.35); ring(0, 0, 0, r, f, f, 0.0, 150); }
        this.fib(n, R, (x, y, z, i) => {
          const nv = fbm(x, y, z, 2.4), len = R * (0.12 + Math.max(0.02, 0.25 + (Math.pow(rnd(), 1.8) - 0.25) * rv) * 1.7 * (0.25 + disp) * (0.5 + nv)) * size, b = R * 1.02, r0 = rnd(), tip = r0 < gold ? cC : r0 < gold + 0.37 ? cB : cA;
          const e = [x * (b + len), y * (b + len), z * (b + len)], base = tmp.copy(tip).multiplyScalar(0.25).clone();
          seg([x * b, y * b, z * b], e, base, tip); dot(e, tip, r0 < gold ? 3.4 : 1.2 + rnd() * 1.6);
        });
      } else if (style === 'orrery') {
        // Concentric rings, a thick band, bright arcs, long spokes ending in discs and bubble outlines (monochrome-friendly).
        const tilt = 0.32, dim = tmp.copy(cA).multiplyScalar(0.55).clone(), nr = Math.round(ps('orings')), nb = Math.round(ps('oband'));
        for (let q = 0; q < nr; q++) ring(0, 0, 0, R * (1.2 + q * (1.15 / Math.max(1, nr - 1))) * size, dim, mix(cA, cB, nr > 1 ? q / (nr - 1) : 0), tilt, 160);
        for (let q = 0; q < nb; q++) ring(0, 0, 0, R * (1.5 + q * 0.04) * size, dim, cA, tilt, 160);
        for (let q = 0, arcs = Math.round(ps('oarcs')); q < arcs; q++) { const m = (1.15 + rnd() * 1.2) * size, a0 = rnd() * TAU, a1 = a0 + 0.5 + rnd() * 1.9; ring(0, 0, 0, R * m, cC, cC, tilt, 60, a0, a1); ring(0, 0, 0, R * (m + 0.012), cC, cC, tilt, 60, a0, a1); }
        const spokes = Math.round(ps('ospokes') * dk), ct = Math.cos(tilt), st = Math.sin(tilt), bub = ps('obubble') * 0.5;
        for (let q = 0; q < spokes; q++) {
          const a = rnd() * TAU, r1 = R * (0.9 + rnd() * 0.3), r2 = R * (1.5 + rnd() * 1.4 * (0.4 + disp)) * size, d = [Math.cos(a), Math.sin(a) * st, Math.sin(a) * ct], f = (r) => [d[0] * r, d[1] * r, d[2] * r];
          seg(f(r1), f(r2), mix(cA, cB, 0.2), cC); dot(f(r2), cC, 2.4 + rnd() * 1.4);
          for (let k = 0; k < 3; k++) { const r = r1 + (r2 - r1) * (0.2 + rnd() * 0.7), c = mix(cB, cA, rnd()); dot(f(r), c, 1.1 + rnd() * 1.4); if (rnd() < bub) { const rr = R * (0.06 + rnd() * 0.16); ring(f(r)[0], f(r)[1], f(r)[2], rr, c, c, tilt + 0.6, 28); } }
        }
      } else if (style === 'neural') {
        // Glowing cells joined by bundles of curved threads, each with a fine web of fibres and a ring or two.
        const nodes = [], cnt = Math.max(2, Math.round(ps('nn') * dk)), web = Math.round(ps('nweb') * dk), nl = Math.round(ps('nlinks')), ns = Math.max(1, Math.round(ps('nstr')));
        for (let q = 0; q < cnt; q++) { const u = unit(), rr = R * (0.55 + rnd() * 0.75 * (0.5 + disp)); nodes.push({ p: [u[0] * rr, u[1] * rr, u[2] * rr], c: q % 2 ? cB : cA, s: 3 + rnd() * 5 }); }
        nodes.forEach((nd, q) => {
          dot(nd.p, nd.c, nd.s * size * 1.4); dot(nd.p, cC, nd.s * size * 0.5);
          for (let k = 0; k < web; k++) { const u = unit(), l = R * (0.15 + rnd() * 0.5) * size, e = [nd.p[0] + u[0] * l, nd.p[1] + u[1] * l, nd.p[2] + u[2] * l], c = [(nd.p[0] + e[0]) / 2 + (rnd() - 0.5) * l, (nd.p[1] + e[1]) / 2 + (rnd() - 0.5) * l, (nd.p[2] + e[2]) / 2 + (rnd() - 0.5) * l]; poly(bez(nd.p, c, e, 10), nd.c, mix(nd.c, cB, 0.5)); if (rnd() < 0.4) dot(e, nd.c, 0.9 + rnd() * 0.9); }
          const near = nodes.map((o, j) => [Math.hypot(o.p[0] - nd.p[0], o.p[1] - nd.p[1], o.p[2] - nd.p[2]), j]).filter(x => x[1] > q).sort((a, b) => a[0] - b[0]).slice(0, nl);
          near.forEach(([d, j]) => { const o = nodes[j]; for (let k = 0; k < ns; k++) { const m = [(nd.p[0] + o.p[0]) / 2, (nd.p[1] + o.p[1]) / 2, (nd.p[2] + o.p[2]) / 2], l = Math.hypot(m[0], m[1], m[2]) || 1, push = R * (0.25 + k * 0.05), c = [m[0] / l * (l + push), m[1] / l * (l + push), m[2] / l * (l + push)]; poly(bez(nd.p, c, o.p, 18), nd.c, o.c); } });
        });
        for (let q = 0, sc = Math.round(ps('nscatter') * dk); q < sc; q++) { const u = unit(), rr = R * (0.5 + rnd() * 1.1); dot([u[0] * rr, u[1] * rr, u[2] * rr], rnd() < 0.5 ? cA : cB, 0.8 + rnd()); }
      } else if (style === 'dataflow') {
        // Curves bundled through the middle between points on a tilted ring (edge-bundling look), coloured A -> B around the ring, white beads on some.
        const n = Math.round(ps('dn') * dk), white = new THREE.Color(0xffffff), tilt = ps('dtilt'), ct = Math.cos(tilt), st = Math.sin(tilt), spread = 0.1 + disp * 0.5, nb = Math.max(1, Math.round(ps('dbundle'))), bow = ps('dbow'), beads = ps('dbeads');
        const pt = (a, la, k) => { const x = Math.cos(a) * Math.cos(la) * k, y = Math.sin(la) * k, z = Math.sin(a) * Math.cos(la) * k; return [x, y * ct - z * st, y * st + z * ct]; };
        for (let q = 0; q < n; q++) {
          const a0 = Math.floor(rnd() * nb) / nb * TAU + rnd() * 0.22, a1 = a0 + Math.PI * (0.25 + rnd() * 0.75), k = R * (1.04 + rnd() * 0.05) * size;
          const P0 = pt(a0, (rnd() - 0.5) * spread, k), P1 = pt(a1, (rnd() - 0.5) * spread, k), cl = (1 - bow) * (0.04 + rnd() * 0.32);
          const c = [(P0[0] + P1[0]) * cl, (P0[1] + P1[1]) * cl, (P0[2] + P1[2]) * cl], u = (Math.sin(a0) * 0.5 + 0.5), cc = mix(cA, cB, u), cd = mix(cA, cB, 1 - u);
          const pts = bez(P0, c, P1, 30); poly(pts, cc, cd); if (rnd() < beads) dot(pts[(rnd() * 10 | 0) + 2], rnd() < 0.6 ? white : cC, 0.9 + rnd() * 1.5);
        }
      } else {
        // strands: smooth long fibres drifting away from the surface, bending toward the poles, each with a round bead at the tip.
        const n = Math.round(ps('tn') * dk), steps = 30, drift = ps('tdrift'), pole = ps('tpole'), big = ps('tbig');
        this.fib(n, R, (x, y, z, i) => {
          let px = x * R * 1.01, py = y * R * 1.01, pz = z * R * 1.01, dx = x, dy = y, dz = z; const L = R * (0.5 + rnd() * 1.5) * size * ps('tlen'), st = L / steps, pts = [[px, py, pz]], sg = y >= 0 ? 1 : -1, cv = (0.12 + disp * 0.5) * drift;
          for (let k = 0; k < steps; k++) {
            const f = k / steps; dx += (this.noise3(px * 1.3 + 3, py * 1.3, pz * 1.3 + i * 0.01) - 0.5) * cv; dy += (this.noise3(px * 1.3, py * 1.3 + 9, pz * 1.3) - 0.5) * cv + sg * pole * f;
            dz += (this.noise3(px * 1.3 + 6, py * 1.3, pz * 1.3 + 4) - 0.5) * cv; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl; px += dx * st; py += dy * st; pz += dz * st; pts.push([px, py, pz]);
          }
          const c0 = mix(cA, cB, rnd()), isBig = rnd() < big; poly(pts, mix(c0, cA, 0.4).multiplyScalar(0.5), c0); dot(pts[steps], isBig ? cC : c0, isBig ? 4 : 1 + rnd() * 1.4);
        });
      }
      if (LP.length) { const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LP), 3)); lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(LC), 3)); const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm]; }
    } else if (style === 'spike') {
      const n = Math.round(500 + 3500 * dens), lp = new Float32Array(n * 6), lc = new Float32Array(n * 6);
      this.fib(n, R, (x, y, z, i) => {
        const nv = fbm(x, y, z, 3), len = R * (0.03 + Math.pow(nv, 1.6) * 0.5 * (0.2 + disp)) * size * ps('len'), b = R * 0.985;
        lp.set([x * b, y * b, z * b, x * (b + len), y * (b + len), z * (b + len)], i * 6); if (+ps('tipdots')) dot([x * (b + len), y * (b + len), z * (b + len)], cC, 1.4);
        tmp.copy(cA).lerp(cB, nv); lc.set([cA.r * 0.6, cA.g * 0.6, cA.b * 0.6], i * 6); tmp.lerp(cC, Math.min(1, len / (R * 0.3))); lc.set([tmp.r, tmp.g, tmp.b], i * 6 + 3);
      });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (style === 'wire') {
      const detail = ps('wdetail') > 0 ? Math.round(ps('wdetail')) : dens > 0.7 ? 4 : dens > 0.35 ? 3 : 2, ico = new THREE.IcosahedronGeometry(R, detail), p = ico.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / R, y = p.getY(i) / R, z = p.getZ(i) / R, nv = fbm(x, y, z, 2.4), tw = (nv - 0.5) * disp * 0.9 * ps('twist'), c = Math.cos(tw), s = Math.sin(tw), rr = 1 + (nv - 0.5) * disp * 0.45;
        p.setXYZ(i, (x * c + z * s) * R * rr, y * R * rr, (-x * s + z * c) * R * rr);
      }
      const wf = new THREE.WireframeGeometry(ico), n = wf.attributes.position.count, wc = new Float32Array(n * 3), wp = wf.attributes.position;
      for (let i = 0; i < n; i++) { tmp.copy(cA).lerp(cB, gradT(0.5, wp.getY(i) / R, 0.5, 'height')); wc.set([tmp.r, tmp.g, tmp.b], i * 3); }
      wf.setAttribute('color', new THREE.BufferAttribute(wc, 3)); ico.dispose();
      const lm = lineMat(); add(new THREE.LineSegments(wf, lm), wf, lm); S.lm = [lm];
      if (+T.s_shell) {
        const sg = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.2, 1)), sn = sg.attributes.position.count, sc = new Float32Array(sn * 3);
        for (let i = 0; i < sn; i++) sc.set([cC.r, cC.g, cC.b], i * 3);
        sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
        const sm = lineMat(); const so = new THREE.LineSegments(sg, sm); add(so, sg, sm); S.lm.push(sm); S.shell = so;
      }
    }
    flushDots();
  },
  update(w, dt) {
    const S = w.surf; if (!S) return; const T = w.tune, style = T.s_style, on = T.s_enabled && style !== 'none', P = k => { const v = T['s_' + k]; return v == null ? this.defaults[k] : v; };
    const key = this.controls.filter(c => !this.LIVE.includes(c.key)).map(c => T['s_' + c.key]).join('|');
    if (on && (S.dirty || key !== S.key)) { this.build(w); S.key = key; S.dirty = false; }
    if (!on && S.objs.length) { this.clear(w); S.key = ''; }
    if (w.model) w.model.visible = !on;
    S.g.visible = !!on && S.objs.length > 0; if (!S.g.visible) return;
    const calm = this.reduced ? 0 : 1; S.spin += dt * T.s_spin * 0.3 * calm; S.t += dt * calm; S.g.rotation.y = S.spin;
    S.g.rotation.x = P('tilt') * Math.PI / 180; S.g.rotation.z = P('roll') * Math.PI / 180;
    S.g.scale.setScalar(P('scale') * (1 + P('breath') * 0.09 * Math.sin(S.t * P('bspeed') * 2.2)));
    if (S.shell) S.shell.rotation.y = -S.spin * 1.6;
    const o = Math.max(0, Math.min(1, w.reveal == null ? 1 : w.reveal)), br = P('bright') * (1 - P('pulse') * 0.5 * (1 - Math.sin(S.t * 2.4 + 1.2)) * 0.5);
    if (S.pm) S.pm.uniforms.uOp.value = o * 0.95 * br;
    S.dm.forEach(m => { m.uniforms.uOp.value = Math.min(1, o * 0.95 * br); });
    if (S.lm) S.lm.forEach((m, i) => { m.opacity = Math.min(1, o * br * ({ plexus3d: 0.5, spike: 0.8, threads: 0.55, fur: 0.45, contour: 0.75, meridian: 0.75, shards: 0.8, radial: 0.7, orrery: 0.65, neural: 0.5, dataflow: 0.3, strands: 0.55 }[T.s_style] ?? (i ? 0.45 : 0.7))); });
  },
});
