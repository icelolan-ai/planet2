/* F6 Particle burst + ring: spiral light threads shooting out of the core (twist + curl noise, pulses travelling along them)
   and a soft-edged particle ring around the equator. Both are built only when switched on and rebuilt once when settings change. */
const BURST = Effects.register({
  id: 'burst', prefix: 'b_', title: 'Particle burst & ring',
  controls: [
    { key: 'burst',  label: 'Burst threads',   type: 'toggle' },
    { key: 'lines',  label: 'Threads',         min: 20,   max: 700, step: 1 },
    { key: 'len',    label: 'Reach',           min: 0.2,  max: 3,   step: 0.01 },
    { key: 'twist',  label: 'Twist',           min: -6,   max: 6,   step: 0.05 },
    { key: 'curl',   label: 'Curl noise',      min: 0,    max: 1,   step: 0.01 },
    { key: 'flow',   label: 'Pulse speed',     min: 0,    max: 3,   step: 0.01 },
    { key: 'ring',   label: 'Particle ring',   type: 'toggle' },
    { key: 'count',  label: 'Ring particles',  min: 400,  max: 9000, step: 50 },
    { key: 'rin',    label: 'Ring inner radius', min: 1.05, max: 3.5, step: 0.01 },
    { key: 'rwid',   label: 'Ring width',      min: 0.1,  max: 2.5, step: 0.01 },
    { key: 'soft',   label: 'Soft edge noise', min: 0,    max: 1,   step: 0.01 },
    { key: 'tilt',   label: 'Ring tilt',       min: 0,    max: 90,  step: 1 },
    { key: 'rspin',  label: 'Ring spin',       min: -2,   max: 2,   step: 0.01 },
    { key: 'size',   label: 'Particle size',   min: 0.3,  max: 3,   step: 0.01 },
    { key: 'colorA', label: 'Colour A',        type: 'color' },
    { key: 'colorB', label: 'Colour B',        type: 'color' },
  ],
  defaults: { enabled: 1, burst: 0, lines: 220, len: 1.3, twist: 2.2, curl: 0.35, flow: 0.7, ring: 0, count: 3600, rin: 1.55, rwid: 0.9, soft: 0.45, tilt: 20, rspin: 0.35, size: 1, colorA: '#ffb04a', colorB: '#ff4655' },
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  attach(w) {
    const gb = new THREE.Group(), gr = new THREE.Group(); gb.visible = gr.visible = false; w.spinG.add(gb); w.axis.add(gr);
    w.burst = { gb, gr, key: '', objs: [], geoms: [], mats: [], t: 0, bm: null, rm: null };
  },
  apply(w, k) { if (w.burst && !['flow', 'rspin', 'tilt'].includes(k)) w.burst.key = ''; },   // those three only drive uniforms
  // Seeded value noise on the CPU (geometry is built once).
  noise(x, y, z) {
    const h = (i, j, l) => { const v = Math.sin(i * 127.1 + j * 311.7 + l * 74.7) * 43758.5453; return v - Math.floor(v); }, sm = t => t * t * (3 - 2 * t), L = (a, b, t) => a + (b - a) * t;
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
    return L(L(L(h(ix, iy, iz), h(ix + 1, iy, iz), fx), L(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy), L(L(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), L(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  },
  clear(w) {
    const B = w.burst; B.objs.forEach(o => o.parent && o.parent.remove(o)); B.geoms.forEach(g => g.dispose()); B.mats.forEach(m => m.dispose()); B.objs = []; B.geoms = []; B.mats = []; B.bm = B.rm = null;
  },
  build(w) {
    const T = w.tune, B = w.burst; this.clear(w);
    const R = w.def.radius, coarse = matchMedia('(pointer:coarse)').matches || innerWidth < 760, k = coarse ? 0.5 : 1;
    const cA = new THREE.Color(T.b_colorA), cB = new THREE.Color(T.b_colorB), uH = innerHeight * Math.min(2, devicePixelRatio || 1), TAU = Math.PI * 2;
    let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    if (+T.b_burst) {
      const n = Math.round(T.b_lines * k), seg = 28, pos = new Float32Array(n * seg * 6), aT = new Float32Array(n * seg * 2), aS = new Float32Array(n * seg * 2);
      for (let i = 0; i < n; i++) {
        const y = 1 - (i + 0.5) / n * 2, rr = Math.sqrt(1 - y * y), lon0 = i * Math.PI * (3 - Math.sqrt(5)), sd = rnd(), tw = T.b_twist * (0.6 + rnd() * 0.8), pts = [];
        for (let s = 0; s <= seg; s++) {
          const t = s / seg, lon = lon0 + tw * t * 1.3, r = R * (0.92 + T.b_len * Math.pow(t, 0.85)), ct = Math.sqrt(Math.max(0, 1 - y * y));
          let x = Math.cos(lon) * ct, z = Math.sin(lon) * ct, yy = y;
          const cu = T.b_curl * t * 0.55;   // curl: noise swirls the thread sideways as it travels
          x += (this.noise(x * 2 + i * 0.07, yy * 2, t * 3) - 0.5) * cu; yy += (this.noise(x * 2, yy * 2 + 9, t * 3 + i * 0.05) - 0.5) * cu; z += (this.noise(z * 2 + 4, yy * 2, t * 3 + 7) - 0.5) * cu;
          const l = Math.hypot(x, yy, z) || 1; pts.push([x / l * r, yy / l * r, z / l * r, t]);
        }
        for (let s = 0; s < seg; s++) { const o = (i * seg + s) * 2; pos.set([pts[s][0], pts[s][1], pts[s][2], pts[s + 1][0], pts[s + 1][1], pts[s + 1][2]], o * 3); aT[o] = pts[s][3]; aT[o + 1] = pts[s + 1][3]; aS[o] = aS[o + 1] = sd; }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 1)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uA: { value: cA }, uB: { value: cB }, uTime: { value: 0 }, uFlow: { value: T.b_flow }, uOp: { value: 0 } },
        vertexShader: 'attribute float aT, aS; varying float vT, vS; void main(){ vT = aT; vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform vec3 uA, uB; uniform float uTime, uFlow, uOp; varying float vT, vS;
          void main(){ float p = fract(vS * 7.0 + vT * 1.6 - uTime * uFlow * 0.35); float pulse = 0.18 + 0.82 * pow(p, 4.0);
            float fade = smoothstep(0.0, 0.1, vT) * (1.0 - smoothstep(0.55, 1.0, vT));
            gl_FragColor = vec4(mix(uA, uB, vT) * (0.6 + 0.9 * pulse), fade * pulse * uOp); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const o = new THREE.LineSegments(g, m); o.frustumCulled = false; B.gb.add(o); B.objs.push(o); B.geoms.push(g); B.mats.push(m); B.bm = m;
    }
    if (+T.b_ring) {
      const n = Math.round(T.b_count * k), pos = new Float32Array(n * 3), aA = new Float32Array(n), aR = new Float32Array(n), aY = new Float32Array(n), aZ = new Float32Array(n), aC = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const u = Math.pow(rnd(), 0.8), edge = Math.pow(Math.abs(u - 0.5) * 2, 3), jitter = (this.noise(i * 0.31, u * 6, 1) - 0.5 + (rnd() - 0.5) * 0.6) * T.b_soft * T.b_rwid * 0.5 * (0.3 + edge);
        const rr = R * (T.b_rin + u * T.b_rwid + jitter);
        aA[i] = rnd() * TAU; aR[i] = rr; aY[i] = (rnd() - 0.5) * R * 0.05 * (0.4 + T.b_soft * 2 * edge) + (this.noise(i * 0.13, u * 4, 5) - 0.5) * R * 0.04; aZ[i] = (0.5 + rnd() * 1.1) * T.b_size; aC[i] = u;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 1)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
      g.setAttribute('aY', new THREE.BufferAttribute(aY, 1)); g.setAttribute('aZ', new THREE.BufferAttribute(aZ, 1)); g.setAttribute('aC', new THREE.BufferAttribute(aC, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uA: { value: cA }, uB: { value: cB }, uTime: { value: 0 }, uSpin: { value: T.b_rspin }, uOp: { value: 0 }, uR: { value: R }, uSz: { value: R * 0.011 }, uH: { value: uH } },
        vertexShader: `attribute float aA, aR, aY, aZ, aC; uniform float uTime, uSpin, uR, uSz, uH; varying float vC;
          void main(){ float a = aA + uTime * uSpin * 0.5 / pow(max(aR / uR, 1.0), 1.5); vec4 mv = modelViewMatrix * vec4(cos(a) * aR, aY, sin(a) * aR, 1.); gl_Position = projectionMatrix * mv; vC = aC;
            gl_PointSize = max(1.0, aZ * uSz * projectionMatrix[1][1] * uH * 0.5 / -mv.z); }`,
        fragmentShader: `uniform vec3 uA, uB; uniform float uOp; varying float vC;
          void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(mix(uA, uB, vC), smoothstep(0.5, 0.1, d) * uOp); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const o = new THREE.Points(g, m); o.frustumCulled = false; B.gr.add(o); B.objs.push(o); B.geoms.push(g); B.mats.push(m); B.rm = m;
    }
  },
  update(w, dt) {
    const B = w.burst; if (!B) return; const T = w.tune, on = T.b_enabled && (+T.b_burst || +T.b_ring);
    if (on && B.key === '') { this.build(w); B.key = 'built'; }
    if (!on && B.objs.length) { this.clear(w); B.key = ''; }
    B.gb.visible = B.gr.visible = !!on; if (!on) return;
    B.t += dt * (this.reduced ? 0.15 : 1);
    const o = Math.max(0, Math.min(1, w.reveal == null ? 1 : w.reveal));
    if (B.bm) { B.bm.uniforms.uTime.value = B.t; B.bm.uniforms.uFlow.value = T.b_flow; B.bm.uniforms.uOp.value = o * 0.9; }
    if (B.rm) { B.rm.uniforms.uTime.value = B.t; B.rm.uniforms.uSpin.value = T.b_rspin; B.rm.uniforms.uOp.value = o * 0.85; }
    B.gr.rotation.x = T.b_tilt * Math.PI / 180;
  },
});
