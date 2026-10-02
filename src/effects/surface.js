/* F5 Surface style: replaces or dresses the planet surface with geometry built from the sphere:
   dot grid (points on a Fibonacci sphere), spikes (lines along the normal), wire polyhedron, 3D plexus (k-nearest links).
   Built only when a style is chosen and rebuilt (once) when its settings change; density drops on phones. */
const SURFACE = Effects.register({
  id: 'surface', prefix: 's_', title: 'Surface style',
  controls: [
    { key: 'style',   label: 'Style', type: 'select', options: [['none', 'Original surface'], ['dotgrid', 'Dot grid'], ['spike', 'Spikes'], ['wire', 'Wire polyhedron'], ['plexus3d', 'Plexus 3D']] },
    { key: 'density', label: 'Density',      min: 0.15, max: 1,   step: 0.01 },
    { key: 'colorA',  label: 'Colour A',     type: 'color' },
    { key: 'colorB',  label: 'Colour B',     type: 'color' },
    { key: 'colorC',  label: 'Colour C (spike tips)', type: 'color' },
    { key: 'disp',    label: 'Displacement', min: 0,    max: 1,   step: 0.01 },
    { key: 'size',    label: 'Size',         min: 0.3,  max: 3,   step: 0.01 },
    { key: 'spin',    label: 'Spin',         min: -2,   max: 2,   step: 0.01 },
    { key: 'shell',   label: 'Outer polyhedron (wire)', type: 'select', options: [['0', 'Off'], ['1', 'On']] },
    { key: 'hide',    label: 'Original surface', type: 'select', options: [['0', 'Keep'], ['1', 'Hide']] },
  ],
  defaults: { enabled: 1, style: 'none', density: 0.55, colorA: '#ff4655', colorB: '#35c9ff', colorC: '#ffe27a', disp: 0.35, size: 1, spin: 0.15, shell: 1, hide: 1 },
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
    if (style === 'dotgrid' || style === 'plexus3d') {
      const n = style === 'dotgrid' ? Math.round(1200 + 9000 * dens) : Math.round(120 + 620 * dens);
      const pos = new Float32Array(n * 3), t = new Float32Array(n), P = [];
      this.fib(n, R, (x, y, z, i) => {
        const nv = fbm(x, y, z, 2.2), rr = R * (1 + (nv - 0.5) * disp * 0.5);
        pos.set([x * rr, y * rr, z * rr], i * 3); t[i] = style === 'dotgrid' ? nv * 0.6 + (y * 0.5 + 0.5) * 0.4 : nv; P.push([x * rr, y * rr, z * rr]);
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uA: { value: cA }, uB: { value: cB }, uOp: { value: 0 }, uSize: { value: size * (style === 'dotgrid' ? 1 : 1.6) * R * 0.012 }, uH: { value: innerHeight * Math.min(2, devicePixelRatio || 1) } },
        vertexShader: `attribute float aT; uniform float uSize, uH; varying float vT, vF;
          void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; vT = aT;
            vec3 n = normalize(normalMatrix * position); vF = 0.25 + 0.75 * smoothstep(-0.25, 0.7, dot(n, normalize(-mv.xyz)));
            gl_PointSize = max(1.0, uSize * projectionMatrix[1][1] * uH * 0.5 / -mv.z * (0.55 + 0.45 * vF)); }`,
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
    if (S.lm) S.lm.forEach((m, i) => { m.opacity = o * (T.s_style === 'plexus3d' ? 0.5 : T.s_style === 'spike' ? 0.8 : i ? 0.45 : 0.7); });
  },
});
