/* F2 Hologram: a fresnel rim, a latitude/longitude grid that bends with the ripples, and a scan line. */
const HOLOGRAM = Effects.register({
  id: 'hologram', prefix: 'h_', title: 'Hologram',
  controls: [
    { key: 'amount',   label: 'Amount',     min: 0,     max: 1,   step: 0.01 },
    { key: 'rim',      label: 'Rim',        min: 0,     max: 6,   step: 0.01 },
    { key: 'power',    label: 'Rim power',  min: 1,     max: 16,  step: 0.1 },
    { key: 'grid',     label: 'Grid scale', min: 1,     max: 12,  step: 0.1 },
    { key: 'width',    label: 'Grid width', min: 0.002, max: 0.1, step: 0.001 },
    { key: 'scan',     label: 'Scan speed', min: 0,     max: 5,   step: 0.05 },
  ],
  defaults: { enabled: 1, amount: 0.35, rim: 2.88, power: 8, grid: 4, width: 0.021, scan: 1.8 },
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  attach(w) {
    w.U.uKyHolo = { value: new THREE.Vector4(0, 2.88, 8, 0) };   // amount, rim, power, scan phase
    w.U.uKyHoloG = { value: new THREE.Vector2(4, 0.021) };       // grid scale, width
    w.holoT = 0;
  },
  update(w, dt) {
    const T = w.tune;
    w.holoT += dt * T.h_scan * (this.reduced ? 0 : 1);
    w.U.uKyHolo.value.set(T.h_enabled ? T.h_amount : 0, T.h_rim, T.h_power, w.holoT);
    w.U.uKyHoloG.value.set(T.h_grid, T.h_width);
  },
  PARS: `
uniform vec4 uKyHolo;
uniform vec2 uKyHoloG;
float kyGridLine(float x, float w){ float d = abs(fract(x + 0.5) - 0.5); return 1.0 - smoothstep(w * 0.5, w * 1.5, d); }`,
  TAIL: `
  if (uKyHolo.x > 0.001) {
    vec3 hN = normalize(vKyN), hV = normalize(cameraPosition - vKyWP);
    float hRim = pow(1.0 - clamp(dot(hN, hV), 0.0, 1.0), uKyHolo.z) * uKyHolo.y;
    // Ripples push the grid around: the wave height bends latitude and longitude.
    float hBend = vRippleH * 0.35;
    float hLat = asin(clamp(vKyDir.y, -1.0, 1.0)) / 3.14159265 + hBend * 0.12;
    float hLon = atan(vKyDir.z, vKyDir.x) / 3.14159265 + hBend * 0.12;
    float hGrid = max(kyGridLine(hLat * uKyHoloG.x * 2.0, uKyHoloG.y * 2.0), kyGridLine(hLon * uKyHoloG.x * 2.0, uKyHoloG.y));
    float hS = fract(0.5 + 0.5 * vKyDir.y - uKyHolo.w * 0.25);
    float hScan = exp(-pow((hS - 0.5) * 38.0, 2.0)) + 0.25 * exp(-pow((hS - 0.5) * 6.0, 2.0));
    gl_FragColor.rgb += uKyAccent * uKyHolo.x * (hRim + hGrid * 0.9 + hScan * 0.7);
  }`,
});
