/**
 * planet-ripple.js — click/tap ripples on a planet surface (Three.js r15x+ / tested r186)
 *
 * Inspired by the terrain ripple on mesh3d.gallery: tap the surface and a damped
 * wave travels outward, lifting the surface, drawing glowing contour lines and
 * kicking nearby particles. Drag across the planet to leave a trail.
 *
 * No imports — pass your THREE namespace in, so it works in a bundle or inline script.
 *
 *   const ripple = createPlanetRipple(THREE, {
 *     camera, domElement: renderer.domElement,
 *     target: planetMesh,          // mesh that receives clicks + displacement
 *     extras: [particlePoints],    // optional: other meshes/points around the same centre
 *   });
 *   // in your render loop:
 *   ripple.update(elapsedSeconds);
 *
 * Built-in materials (MeshStandard/Physical/Lambert/Phong/Basic, PointsMaterial) are
 * patched automatically. For your own ShaderMaterial see ripple.glsl + README notes
 * at the bottom of this file.
 */

export const RIPPLE_MAX = 8;

export const RIPPLE_DEFAULTS = {
  enabled: true,
  strength: 0.06,     // surface lift, in planet radii
  speed: 0.9,         // how fast the ring travels (radians / second)
  wavelength: 0.22,   // distance between crests (radians)
  decay: 1.4,         // fade over time
  spread: 2.4,        // fade with distance from the tap
  lines: 14,          // contour line density
  lineGlow: 1.4,      // brightness of the contour lines
  lineWidth: 1.2,     // contour line thickness (px)
  color: '#9dff3a',   // line + particle glow colour
  particleKick: 2.5,  // how hard particles are thrown (× strength)
  particleGlow: 1.8,  // point size boost while a wave passes
  trail: true,        // drag across the surface to leave ripples
  trailEvery: 0.07,   // seconds between trail ripples
  ambient: 0,         // auto ripples per second (0 = off)
};

/** Slider descriptors — map these onto your existing TUNE panel builder. */
export const RIPPLE_CONTROLS = [
  { key: 'strength',     label: 'Strength',       min: 0,    max: 0.2, step: 0.002 },
  { key: 'speed',        label: 'Speed',          min: 0.1,  max: 3,   step: 0.01 },
  { key: 'wavelength',   label: 'Wavelength',     min: 0.05, max: 0.8, step: 0.005 },
  { key: 'decay',        label: 'Decay',          min: 0.2,  max: 5,   step: 0.05 },
  { key: 'spread',       label: 'Spread',         min: 0,    max: 5,   step: 0.05 },
  { key: 'lines',        label: 'Contour lines',  min: 0,    max: 40,  step: 1 },
  { key: 'lineGlow',     label: 'Line glow',      min: 0,    max: 4,   step: 0.05 },
  { key: 'particleKick', label: 'Particle kick',  min: 0,    max: 8,   step: 0.1 },
  { key: 'particleGlow', label: 'Particle glow',  min: 0,    max: 5,   step: 0.1 },
  { key: 'ambient',      label: 'Ambient pings',  min: 0,    max: 3,   step: 0.05 },
];

export const RIPPLE_PRESETS = {
  Liquid:  { strength: 0.06, speed: 0.9, wavelength: 0.22, decay: 1.4, spread: 2.4, lines: 14, lineGlow: 1.4, particleKick: 2.5 },
  Seismic: { strength: 0.12, speed: 1.8, wavelength: 0.45, decay: 2.4, spread: 0.8, lines: 26, lineGlow: 2.2, particleKick: 5.0 },
  Pulse:   { strength: 0.02, speed: 0.6, wavelength: 0.10, decay: 0.8, spread: 2.5, lines: 6,  lineGlow: 2.8, particleKick: 1.2 },
  Calm:    { strength: 0.03, speed: 0.4, wavelength: 0.35, decay: 0.7, spread: 1.2, lines: 0,  lineGlow: 0,   particleKick: 1.0 },
};

/* ------------------------------------------------------------------ GLSL -- */

const GLSL_COMMON = /* glsl */ `
#define RIPPLE_MAX ${RIPPLE_MAX}
uniform vec3  uRippleDir[RIPPLE_MAX];   // tap direction, object space, unit length
uniform float uRippleT0[RIPPLE_MAX];    // start time
uniform float uRippleAmp[RIPPLE_MAX];   // per-ripple strength 0..1
uniform float uRippleTime;
uniform float uRippleStrength;
uniform float uRippleSpeed;
uniform float uRippleWavelength;
uniform float uRippleDecay;
uniform float uRippleSpread;
`;

const GLSL_VERTEX_FN = /* glsl */ `
varying float vRippleH;   // signed height (normalised)
varying float vRippleE;   // energy 0..1 (where a wave is passing)

// Returns height in radii; writes energy and a sideways push direction.
float planetRipple(vec3 dir, out float energy, out vec3 push) {
  float h = 0.0; energy = 0.0; push = vec3(0.0);
  float k = 6.2831853 / max(uRippleWavelength, 1e-3);
  for (int i = 0; i < RIPPLE_MAX; i++) {
    float amp = uRippleAmp[i];
    float age = uRippleTime - uRippleT0[i];
    if (amp <= 0.0 || age < 0.0) continue;
    vec3  o   = uRippleDir[i];
    float ang = acos(clamp(dot(dir, o), -1.0, 1.0));
    float front = age * uRippleSpeed;
    // only the area the wave has already reached moves; soft leading edge
    float reach = smoothstep(front + uRippleWavelength, front, ang);
    float env = amp * exp(-age * uRippleDecay) * exp(-ang * uRippleSpread) * reach;
    float w = cos((ang - front) * k);
    h += w * env;
    energy += env;
    vec3 t = dir - o * dot(dir, o);
    float tl = length(t);
    if (tl > 1e-4) push += (t / tl) * max(w, 0.0) * env;
  }
  energy = clamp(energy, 0.0, 1.0);
  return h;
}
`;

const GLSL_FRAG_HEAD = /* glsl */ `
varying float vRippleH;
varying float vRippleE;
uniform vec3  uRippleColor;
uniform float uRippleLines;
uniform float uRippleLineGlow;
uniform float uRippleLineWidth;
uniform float uRipplePointGlow;

float rippleContour() {
  if (uRippleLines <= 0.0) return 0.0;
  float v = vRippleH * uRippleLines;
  float d = 0.5 - abs(fract(v) - 0.5);          // distance to nearest integer level
  float w = fwidth(v) * uRippleLineWidth + 1e-4;
  return 1.0 - smoothstep(0.0, w, d);
}
`;

/** Pieces for hand-written ShaderMaterials (see notes at bottom). */
export const rippleGLSL = {
  vertexHead: GLSL_COMMON + GLSL_VERTEX_FN,
  fragmentHead: GLSL_FRAG_HEAD,
};

/* ---------------------------------------------------------------- factory -- */

export function createPlanetRipple(THREE, opts) {
  const {
    camera,
    domElement,
    target,
    extras = [],
    radius = null,          // planet radius in local units (auto from bounding sphere)
    params: initial = {},
    listen = true,          // attach pointer listeners
    onPing = null,          // callback(dirLocal, strength) — hook sound here
  } = opts;

  const params = { ...RIPPLE_DEFAULTS, ...initial };

  target.geometry.computeBoundingSphere?.();
  const R = radius ?? target.geometry.boundingSphere?.radius ?? 1;

  const dirs = Array.from({ length: RIPPLE_MAX }, () => new THREE.Vector3(0, 1, 0));
  const t0s = new Float32Array(RIPPLE_MAX).fill(-1e4);
  const amps = new Float32Array(RIPPLE_MAX);
  let slot = 0;
  let now = 0;

  const uniforms = {
    uRippleDir: { value: dirs },
    uRippleT0: { value: t0s },
    uRippleAmp: { value: amps },
    uRippleTime: { value: 0 },
    uRippleStrength: { value: params.strength },
    uRippleSpeed: { value: params.speed },
    uRippleWavelength: { value: params.wavelength },
    uRippleDecay: { value: params.decay },
    uRippleSpread: { value: params.spread },
    uRippleColor: { value: new THREE.Color(params.color) },
    uRippleLines: { value: params.lines },
    uRippleLineGlow: { value: params.lineGlow },
    uRippleLineWidth: { value: params.lineWidth },
    uRipplePointGlow: { value: params.particleGlow },
    uRippleKick: { value: params.particleKick },
    uRippleRadius: { value: R },
  };

  /* ---- material patching ---- */
  const patched = new WeakSet();

  function patchMaterial(mat, isPoints) {
    if (!mat || patched.has(mat)) return;
    if (mat.isShaderMaterial) {
      // Custom shaders: merge uniforms so the snippets in the notes just work.
      Object.assign(mat.uniforms, uniforms);
      patched.add(mat);
      return;
    }
    patched.add(mat);
    const prev = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, renderer) => {
      prev?.call(mat, shader, renderer);
      Object.assign(shader.uniforms, uniforms);

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${GLSL_COMMON}\n${GLSL_VERTEX_FN}\nuniform float uRippleKick;\nuniform float uRippleRadius;\nuniform float uRipplePointGlow;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          float rLen = length(position);
          vec3 rDir = position / max(rLen, 1e-5);
          float rE; vec3 rPush;
          float rH = planetRipple(rDir, rE, rPush);
          vRippleH = rH; vRippleE = rE;
          float lift = rH * uRippleStrength * uRippleRadius;
          ${isPoints
            ? `transformed += rDir * abs(lift) * uRippleKick + rPush * uRippleStrength * uRippleRadius * uRippleKick;`
            : `transformed += rDir * lift;`}
        }`);

      if (isPoints) {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <fog_vertex>',
          '#include <fog_vertex>\n  gl_PointSize *= 1.0 + vRippleE * uRipplePointGlow;'
        );
      }

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${GLSL_FRAG_HEAD}`)
        .replace('#include <opaque_fragment>', `#include <opaque_fragment>
        ${isPoints
          ? `gl_FragColor.rgb += uRippleColor * vRippleE * uRipplePointGlow * 0.6;`
          : `gl_FragColor.rgb += uRippleColor * rippleContour() * vRippleE * uRippleLineGlow
                               + uRippleColor * max(vRippleH, 0.0) * vRippleE * 0.25 * uRippleLineGlow;`}`);
    };
    mat.needsUpdate = true;
  }

  function attach(obj) {
    obj.traverse?.((o) => {
      if (!o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => patchMaterial(m, !!o.isPoints));
    });
  }
  attach(target);
  extras.forEach(attach);

  /* ---- params ---- */
  function set(next) {
    Object.assign(params, next);
    uniforms.uRippleStrength.value = params.enabled ? params.strength : 0;
    uniforms.uRippleSpeed.value = params.speed;
    uniforms.uRippleWavelength.value = params.wavelength;
    uniforms.uRippleDecay.value = params.decay;
    uniforms.uRippleSpread.value = params.spread;
    uniforms.uRippleLines.value = params.lines;
    uniforms.uRippleLineGlow.value = params.enabled ? params.lineGlow : 0;
    uniforms.uRippleLineWidth.value = params.lineWidth;
    uniforms.uRipplePointGlow.value = params.particleGlow;
    uniforms.uRippleKick.value = params.particleKick;
    uniforms.uRippleColor.value.set(params.color);
  }
  set({});

  /* ---- triggering ---- */
  function trigger(dirLocal, strength = 1) {
    if (!params.enabled) return;
    dirs[slot].copy(dirLocal).normalize();
    t0s[slot] = now;
    amps[slot] = strength;
    slot = (slot + 1) % RIPPLE_MAX;
    onPing?.(dirs[(slot + RIPPLE_MAX - 1) % RIPPLE_MAX], strength);
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmp = new THREE.Vector3();

  /** Ray-cast screen coords (client px) → trigger. Returns true if the planet was hit. */
  function pingAtClient(clientX, clientY, strength = 1) {
    const rect = domElement.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(target, false)[0];
    if (!hit) return false;
    tmp.copy(hit.point);
    target.worldToLocal(tmp);
    trigger(tmp, strength);
    return true;
  }

  let down = false, lastTrail = 0;
  const onDown = (e) => {
    if (!params.enabled) return;
    down = pingAtClient(e.clientX, e.clientY, 1);
    lastTrail = now;
  };
  const onMove = (e) => {
    if (!down || !params.trail) return;
    if (now - lastTrail < params.trailEvery) return;
    lastTrail = now;
    pingAtClient(e.clientX, e.clientY, 0.45);
  };
  const onUp = () => { down = false; };

  if (listen && domElement) {
    domElement.addEventListener('pointerdown', onDown, { capture: true });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  /* ---- per-frame ---- */
  let ambientAcc = 0;
  function update(elapsed) {
    const dt = Math.min(0.1, Math.max(0, elapsed - now));
    now = elapsed;
    uniforms.uRippleTime.value = now;
    // retire faded ripples so the shader loop can skip them
    const life = 6 / Math.max(params.decay, 0.05);
    for (let i = 0; i < RIPPLE_MAX; i++) if (amps[i] > 0 && now - t0s[i] > life) amps[i] = 0;
    if (params.ambient > 0 && params.enabled) {
      ambientAcc += dt * params.ambient;
      while (ambientAcc >= 1) {
        ambientAcc -= 1;
        tmp.randomDirection();
        trigger(tmp, 0.35 + Math.random() * 0.4);
      }
    }
  }

  function dispose() {
    domElement?.removeEventListener('pointerdown', onDown, { capture: true });
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  }

  return {
    params, uniforms, set, trigger, pingAtClient, update, attach, dispose,
    /** true while the pointer is dragging on the planet — use it to pause your own drag-rotate if you like */
    get isDragging() { return down; },
  };
}

/* ---------------------------------------------------------------------------
 * Using it with your own ShaderMaterial (Cerebra uses many):
 *
 * 1. Pass the mesh as target/extras — its uniforms get merged automatically.
 * 2. Vertex shader, top:            add  rippleGLSL.vertexHead + "uniform float uRippleRadius;"
 *    Vertex shader, where you have a local position `pos` (before modelViewMatrix):
 *        float rE; vec3 rPush;
 *        vec3 rDir = normalize(pos);
 *        float rH = planetRipple(rDir, rE, rPush);
 *        vRippleH = rH; vRippleE = rE;
 *        pos += rDir * rH * uRippleStrength * uRippleRadius;
 * 3. Fragment shader, top:          add  rippleGLSL.fragmentHead
 *    Fragment shader, at the end:
 *        gl_FragColor.rgb += uRippleColor * rippleContour() * vRippleE * uRippleLineGlow;
 * ------------------------------------------------------------------------- */