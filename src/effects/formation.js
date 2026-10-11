/* F1 Formation: the surface assembles from a noisy sweep with a bright accent edge.
   Plays on LAND ON, the first time a world is scrolled to, and as the loader hands over to the scene. */
const FORMATION = Effects.register({
  id: 'formation', prefix: 'f_', title: 'Formation',
  controls: [
    { key: 'edge',      label: 'Edge',        min: 0.005, max: 0.3, step: 0.001 },
    { key: 'scale',     label: 'Noise scale', min: 0.2,   max: 8,   step: 0.01 },
    { key: 'speed',     label: 'Noise speed', min: 0,     max: 1,   step: 0.01 },
    { key: 'amount',    label: 'Noise amount', min: 0,    max: 1,   step: 0.01 },
    { key: 'intensity', label: 'Intensity',   min: 0,     max: 4,   step: 0.05 },
    { key: 'duration',  label: 'Duration',    min: 0.4,   max: 5,   step: 0.05 },
  ],
  defaults: { enabled: 1, edge: 0.053, scale: 1.56, speed: 0.05, amount: 0.19, intensity: 1.2, duration: 1.8 },
  get reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; },
  attach(w) {
    w.U.uKyForm = { value: new THREE.Vector4(1, 0.053, 1.56, 0.19) };
    w.U.uKyFormI = { value: new THREE.Vector2(1.2, 0) };
    w.form = { t: 1, flow: 0 };
  },
  apply(w) {
    const T = w.tune;
    w.U.uKyForm.value.set(w.form.t, T.f_edge, T.f_scale, T.f_amount);
    w.U.uKyFormI.value.x = T.f_intensity;
  },
  play(w) {
    if (!w || !w.form) return;
    if (this.reduced || !w.tune.f_enabled) { w.form.t = 1; return; }
    w.form.t = 0;
  },
  update(w, dt) {
    const T = w.tune, F = w.form;
    // The preference may change after load. Atelier intentionally advances
    // worlds with dt=0 in reduced motion, so finish rather than freeze a cutout.
    if (this.reduced || !T.f_enabled) F.t = 1;
    if (F.t < 1) F.t = Math.min(1, F.t + dt / Math.max(0.1, T.f_duration));
    F.flow += dt * T.f_speed;
    const e = F.t < 1 ? 1 - Math.pow(1 - F.t, 2.2) : 1;
    w.U.uKyForm.value.set(e, T.f_edge, T.f_scale, T.f_amount);
    w.U.uKyFormI.value.set(T.f_intensity, F.flow);
  },
  // GLSL pieces spliced into the world surface shader.
  PARS: `
uniform vec4 uKyForm;   // x progress, y edge width, z noise scale, w noise amount
uniform vec2 uKyFormI;  // x edge intensity, y noise flow`,
  MAIN: `
  float kyFormEdge = 0.0;
  if (uKyForm.x < 0.999) {
    float fs = 0.5 + 0.5 * vKyDir.y;
    float fn = kyNoise(vKyDir * uKyForm.z * 4.0 + uKyFormI.y) * 0.7 + kyNoise(vKyDir * uKyForm.z * 11.0 - uKyFormI.y) * 0.3;
    float fd = mix(fs, fn, uKyForm.w);
    float th = uKyForm.x * (1.0 + uKyForm.y * 2.0) - uKyForm.y;
    if (fd > th) discard;
    kyFormEdge = 1.0 - smoothstep(0.0, uKyForm.y, th - fd);
  }`,
  TAIL: `
  gl_FragColor.rgb += uKyAccent * kyFormEdge * uKyFormI.x * 2.2;`,
});
