/* F5 Surface style: replaces or dresses the planet surface with geometry built from the sphere:
   dot grid (points on a Fibonacci sphere), spikes (lines along the normal), wire polyhedron, 3D plexus (k-nearest links).
   Built only when a style is chosen and rebuilt (once) when its settings change; density drops on phones. */
const SURFACE = Effects.register({
  id: 'surface', prefix: 's_', title: 'Surface style',
  controls: [
    { key: 'style',   label: 'Style', type: 'select', options: [['none', 'Original surface'], ['dotgrid', 'Dot grid'], ['halftone', 'Halftone dots'], ['spike', 'Spikes'], ['threads', 'Curly threads'], ['fur', 'Fur bristles'], ['wire', 'Wire polyhedron'], ['plexus3d', 'Plexus 3D'], ['contour', 'Contour rings'], ['meridian', 'Meridian lines'], ['cloud', 'Particle cloud'], ['shards', 'Crystal shards']] },
    { key: 'density', label: 'Density',      min: 0.15, max: 1,   step: 0.01 },
    { key: 'colorA',  label: 'Colour A',     type: 'color' },
    { key: 'colorB',  label: 'Colour B',     type: 'color' },
    { key: 'colorC',  label: 'Colour C (spike tips)', type: 'color' },
    { key: 'disp',    label: 'Displacement', min: 0,    max: 1,   step: 0.01 },
    { key: 'size',    label: 'Size',         min: 0.3,  max: 3,   step: 0.01 },
    { key: 'spin',    label: 'Spin',         min: -2,   max: 2,   step: 0.01 },
    { key: 'shell',   label: 'Outer polyhedron (wire)', type: 'toggle' },
    { key: 'hide',    label: 'Hide original surface', type: 'toggle' },
  ],
  defaults: { enabled: 1, style: 'none', density: 0.55, colorA: '#7a5cff', colorB: '#38c8ff', colorC: '#ffe9a8', disp: 0.35, size: 1, spin: 0.15, shell: 1, hide: 1 },
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  attach(w) {
    const g = new THREE.Group(); g.visible = false; w.spinG.add(g);
    w.surf = { g, key: '', dirty: true, objs: [], mats: [], geoms: [], spin: 0 };
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
    const S = w.surf; S.objs.forEach(o => S.g.remove(o)); S.geoms.forEach(g => g.dispose()); S.mats.forEach(m => m.dispose()); S.objs = []; S.geoms = []; S.mats = [];
  },
  fib(n, R, fn) {   // Fibonacci sphere: fn(x, y, z, i) with a unit vector
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - y * y), a = i * ga; fn(Math.cos(a) * r, y, Math.sin(a) * r, i); }
  },
  build(w) {
    const T = w.tune, S = w.surf, style = T.s_style; this.clear(w);
    if (style === 'none') return;
    const R = w.def.radius, coarse = matchMedia('(pointer:coarse)').matches || innerWidth < 760, dens = T.s_density * (coarse ? 0.45 : 1), disp = T.s_disp, size = T.s_size;
    const cA = new THREE.Color(T.s_colorA), cB = new THREE.Color(T.s_colorB), cC = new THREE.Color(T.s_colorC), tmp = new THREE.Color();
    const add = (obj, geom, mat) => { obj.frustumCulled = false; S.g.add(obj); S.objs.push(obj); S.geoms.push(geom); S.mats.push(mat); };
    const lineMat = () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const fbm = (x, y, z, s) => this.fbm(x * s + 11, y * s + 3, z * s + 7);
    const uH = innerHeight * Math.min(2, devicePixelRatio || 1);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // seeded: the same settings always build the same shape
    if (style === 'dotgrid' || style === 'plexus3d' || style === 'halftone') {
      const n = style === 'plexus3d' ? Math.round(120 + 620 * dens) : Math.round(1200 + 9000 * dens);
      const pos = new Float32Array(n * 3), t = new Float32Array(n), P = [];
      this.fib(n, R, (x, y, z, i) => {
        const nv = fbm(x, y, z, 2.2), rr = R * (1 + (nv - 0.5) * disp * 0.5);
        pos.set([x * rr, y * rr, z * rr], i * 3); t[i] = style === 'plexus3d' ? nv : nv * 0.6 + (y * 0.5 + 0.5) * 0.4; P.push([x * rr, y * rr, z * rr]);
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
        const k = 3, segs = [], seen = new Set();
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
      const fur = style === 'fur', n = Math.round((fur ? 2500 : 220) + (fur ? 7000 : 1500) * dens), seg = fur ? 7 : 34, curl = 0.12 + disp * (fur ? 0.5 : 1.15);
      const lp = new Float32Array(n * seg * 6), lc = new Float32Array(n * seg * 6);
      this.fib(n, R, (x, y, z, i) => {
        let px = x * R * 0.96, py = y * R * 0.96, pz = z * R * 0.96, dx = x, dy = y, dz = z;
        const L = R * (fur ? 0.12 + this.noise3(i * 0.37, 1, 2) * 0.26 : 0.35 + this.noise3(i * 0.21, 3, 5) * 1.0 + rnd() * 0.3) * size, st = L / seg;
        for (let s = 0; s < seg; s++) {
          const t0 = s / seg, t1 = (s + 1) / seg, qx = px, qy = py, qz = pz;
          dx += (this.noise3(px * 1.7 + 3, py * 1.7, pz * 1.7 + i * 0.01 + s * 0.13) - 0.5) * curl; dy += (this.noise3(px * 1.7, py * 1.7 + 9, pz * 1.7 + s * 0.11) - 0.5) * curl; dz += (this.noise3(px * 1.7 + 6, py * 1.7, pz * 1.7 + 4 + s * 0.09) - 0.5) * curl;
          const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl; px += dx * st; py += dy * st; pz += dz * st;
          const o = (i * seg + s) * 6; lp.set([qx, qy, qz, px, py, pz], o);
          tmp.copy(cA).lerp(cB, t0); if (t0 > 0.55) tmp.lerp(cC, (t0 - 0.55) * 2.2); lc.set([tmp.r, tmp.g, tmp.b], o);
          tmp.copy(cA).lerp(cB, t1); if (t1 > 0.55) tmp.lerp(cC, (t1 - 0.55) * 2.2); lc.set([tmp.r, tmp.g, tmp.b], o + 3);
        }
      });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (style === 'contour' || style === 'meridian') {
      // Latitude rings (contour) or longitude arcs through the poles (meridian), wobbled by noise for a terrain / flow-line look.
      const cnt = Math.round(6 + 54 * dens), seg = 140, mer = style === 'meridian', lp = new Float32Array(cnt * seg * 6), lc = new Float32Array(cnt * seg * 6);
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
        const rad = R * (0.45 + rr0 * (0.7 + disp * 0.9)), nv = fbm(x * rad / R, y * rad / R, z * rad / R, 1.8); if (rnd() > nv * 1.4) continue;
        pos.set([x * rad, y * rad, z * rad], c * 3); t[c] = rr0; c++;
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
        const nv = fbm(x, y, z, 2.6), len = R * (0.1 + Math.pow(nv, 1.4) * 0.9 * (0.3 + disp)) * size, w0 = R * (0.05 + this.noise3(i * 0.7, 2, 1) * 0.07) * size;
        const up = Math.abs(y) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let ax = y * up[2] - z * up[1], ay = z * up[0] - x * up[2], az = x * up[1] - y * up[0]; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
        const bx = y * az - z * ay, by = z * ax - x * az, bz = x * ay - y * ax, c0 = R * 0.97;
        const B = [[x * c0 + ax * w0, y * c0 + ay * w0, z * c0 + az * w0], [x * c0 - ax * w0 * 0.5 + bx * w0 * 0.87, y * c0 - ay * w0 * 0.5 + by * w0 * 0.87, z * c0 - az * w0 * 0.5 + bz * w0 * 0.87], [x * c0 - ax * w0 * 0.5 - bx * w0 * 0.87, y * c0 - ay * w0 * 0.5 - by * w0 * 0.87, z * c0 - az * w0 * 0.5 - bz * w0 * 0.87]], T = [x * (c0 + len), y * (c0 + len), z * (c0 + len)];
        const edges = [[B[0], B[1]], [B[1], B[2]], [B[2], B[0]], [B[0], T], [B[1], T], [B[2], T]]; tmp.copy(cA).lerp(cB, nv);
        edges.forEach(([p0, p1], e) => { const o = (i * 6 + e) * 6; lp.set([p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]], o); const tipTo = e >= 3; lc.set([tmp.r, tmp.g, tmp.b], o); if (tipTo) { const k2 = new THREE.Color().copy(tmp).lerp(cC, 0.85); lc.set([k2.r, k2.g, k2.b], o + 3); } else lc.set([tmp.r, tmp.g, tmp.b], o + 3); });
      });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (style === 'spike') {
      const n = Math.round(500 + 3500 * dens), lp = new Float32Array(n * 6), lc = new Float32Array(n * 6);
      this.fib(n, R, (x, y, z, i) => {
        const nv = fbm(x, y, z, 3), len = R * (0.03 + Math.pow(nv, 1.6) * 0.5 * (0.2 + disp)) * size, b = R * 0.985;
        lp.set([x * b, y * b, z * b, x * (b + len), y * (b + len), z * (b + len)], i * 6);
        tmp.copy(cA).lerp(cB, nv); lc.set([cA.r * 0.6, cA.g * 0.6, cA.b * 0.6], i * 6); tmp.lerp(cC, Math.min(1, len / (R * 0.3))); lc.set([tmp.r, tmp.g, tmp.b], i * 6 + 3);
      });
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      const lm = lineMat(); add(new THREE.LineSegments(lg, lm), lg, lm); S.lm = [lm];
    } else if (style === 'wire') {
      const detail = dens > 0.7 ? 4 : dens > 0.35 ? 3 : 2, ico = new THREE.IcosahedronGeometry(R, detail), p = ico.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / R, y = p.getY(i) / R, z = p.getZ(i) / R, nv = fbm(x, y, z, 2.4), tw = (nv - 0.5) * disp * 0.9, c = Math.cos(tw), s = Math.sin(tw), rr = 1 + (nv - 0.5) * disp * 0.45;
        p.setXYZ(i, (x * c + z * s) * R * rr, y * R * rr, (-x * s + z * c) * R * rr);
      }
      const wf = new THREE.WireframeGeometry(ico), n = wf.attributes.position.count, wc = new Float32Array(n * 3), wp = wf.attributes.position;
      for (let i = 0; i < n; i++) { tmp.copy(cA).lerp(cB, (wp.getY(i) / R) * 0.5 + 0.5); wc.set([tmp.r, tmp.g, tmp.b], i * 3); }
      wf.setAttribute('color', new THREE.BufferAttribute(wc, 3)); ico.dispose();
      const lm = lineMat(); add(new THREE.LineSegments(wf, lm), wf, lm); S.lm = [lm];
      if (+T.s_shell) {
        const sg = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.2, 1)), sn = sg.attributes.position.count, sc = new Float32Array(sn * 3);
        for (let i = 0; i < sn; i++) sc.set([cC.r, cC.g, cC.b], i * 3);
        sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
        const sm = lineMat(); const so = new THREE.LineSegments(sg, sm); add(so, sg, sm); S.lm.push(sm); S.shell = so;
      }
    }
  },
  update(w, dt) {
    const S = w.surf; if (!S) return; const T = w.tune, style = T.s_style, on = T.s_enabled && style !== 'none';
    const key = [style, T.s_density, T.s_colorA, T.s_colorB, T.s_colorC, T.s_disp, T.s_size, T.s_shell].join('|');
    if (on && (S.dirty || key !== S.key)) { this.build(w); S.key = key; S.dirty = false; }
    if (!on && S.objs.length) { this.clear(w); S.key = ''; }
    if (w.model) w.model.visible = !(on && +T.s_hide);
    S.g.visible = !!on && S.objs.length > 0; if (!S.g.visible) return;
    S.spin += dt * T.s_spin * 0.3 * (this.reduced ? 0 : 1); S.g.rotation.y = S.spin;
    if (S.shell) S.shell.rotation.y = -S.spin * 1.6;
    const o = Math.max(0, Math.min(1, w.reveal == null ? 1 : w.reveal));
    if (S.pm) S.pm.uniforms.uOp.value = o * 0.95;
    if (S.lm) S.lm.forEach((m, i) => { m.opacity = o * ({ plexus3d: 0.5, spike: 0.8, threads: 0.55, fur: 0.45, contour: 0.75, meridian: 0.75, shards: 0.8 }[T.s_style] ?? (i ? 0.45 : 0.7)); });
  },
});
