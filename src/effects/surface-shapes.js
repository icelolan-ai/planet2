/* Surface base shapes — deform generated Surface Style geometry without adding another renderer. */
(() => {
  if (typeof SURFACE === 'undefined' || !SURFACE || SURFACE.__shapePatch) return;
  SURFACE.__shapePatch = true;

  const SHAPES = [
    ['sphere', 'Sphere'],
    ['football', 'Football / Rugby'],
    ['pentagon', 'Pentagon ball'],
    ['geodesic', 'Geodesic ball'],
    ['cube', 'Rounded cube'],
    ['diamond', 'Diamond'],
    ['torus', 'Torus / Ring'],
  ];
  const COMPAT = {
    orrery: new Set(['sphere', 'football']),
    dataflow: new Set(['sphere', 'football', 'torus']),
  };
  const compatible = (style, shape) => !(COMPAT[style] && !COMPAT[style].has(shape));

  const shapeControls = [
    { key: 'shape', label: 'Base shape', type: 'select', options: SHAPES },
    { key: 'shapeAmt', label: 'Shape strength', min: 0, max: 1, step: 0.01 },
    { key: 'shapeAspect', label: 'Football length', min: 0.85, max: 1.65, step: 0.01 },
    { key: 'shapeHole', label: 'Torus hole', min: 0.15, max: 0.75, step: 0.01 },
  ];
  const at = Math.max(1, SURFACE.controls.findIndex(c => c.key === 'density'));
  shapeControls.slice().reverse().forEach(c => { if (!SURFACE.controls.some(x => x.key === c.key)) SURFACE.controls.splice(at, 0, c); });
  Object.assign(SURFACE.defaults, { shape: 'sphere', shapeAmt: 1, shapeAspect: 1.25, shapeHole: 0.45 });

  const planes = geom => {
    // BoxGeometry is indexed. Read actual triangles, rather than treating its
    // vertex storage as consecutive faces (which produces near-zero planes).
    if (geom.index) { const triangles = geom.toNonIndexed(); geom.dispose(); geom = triangles; }
    const p = geom.attributes.position, out = [], A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), M = new THREE.Vector3();
    for (let i = 0; i + 2 < p.count; i += 3) {
      A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); C.fromBufferAttribute(p, i + 2);
      N.subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).normalize(); M.copy(A).add(B).add(C).multiplyScalar(1 / 3); if (N.dot(M) < 0) N.negate();
      const c = N.dot(A); if (c > 1e-5) out.push([N.x, N.y, N.z, c]);
    }
    geom.dispose(); return out;
  };
  const POLY = {
    pentagon: { p: planes(new THREE.DodecahedronGeometry(1, 0)), k: 1.09 },
    geodesic: { p: planes(new THREE.IcosahedronGeometry(1, 1)), k: 1.04 },
    cube: { p: planes(new THREE.BoxGeometry(1.5, 1.5, 1.5)), k: 1.08 },
    diamond: { p: planes(new THREE.OctahedronGeometry(1, 0)), k: 1.18 },
  };
  const rayRadius = (d, spec) => {
    let t = Infinity;
    for (const q of spec.p) { const den = q[0] * d.x + q[1] * d.y + q[2] * d.z; if (den > 1e-5) t = Math.min(t, q[3] / den); }
    return Number.isFinite(t) ? t * spec.k : 1;
  };

  const baseBuild = SURFACE.build.bind(SURFACE);
  SURFACE.build = function (w) {
    baseBuild(w);
    if (!w || !w.surf || !w.surf.geoms.length) return;
    const T = w.tune || {}, style = T.s_style || 'none'; let shape = T.s_shape || this.defaults.shape;
    if (style === 'none' || shape === 'sphere') return;
    if (!compatible(style, shape)) shape = 'sphere';
    if (shape === 'sphere') return;
    const warp = this.baseShapeWarp(w.tune, w.def.radius || 1);
    const seen = new Set();
    w.surf.geoms.forEach(g => {
      if (!g || seen.has(g) || !g.attributes || !g.attributes.position) return; seen.add(g); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const v = warp(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, v.x, v.y, v.z); }
      p.needsUpdate = true; g.computeBoundingSphere();
    });
  };

  SURFACE.baseShapeWarp = function(tune, R = 1) {
    const T = tune || {}, shape = compatible(T.s_style || "none",T.s_shape) && SHAPES.some(([k])=>k===T.s_shape) ? T.s_shape : "sphere", amt = Math.max(0, Math.min(1, +(T.s_shapeAmt ?? this.defaults.shapeAmt))), aspect = Math.max(.85, +(T.s_shapeAspect ?? this.defaults.shapeAspect)), hole = Math.max(.15, Math.min(.75, +(T.s_shapeHole ?? this.defaults.shapeHole)));
    const O = new THREE.Vector3(), D = new THREE.Vector3(), Q = new THREE.Vector3();
    return (x, y, z) => {
      O.set(x, y, z); const L = O.length(); if (L < 1e-6) return O; D.copy(O).multiplyScalar(1 / L); const rel = L / R;
      if (shape === 'sphere') return O;
      if (shape === 'football') {
        const sx = 1 / Math.sqrt(aspect); Q.set(D.x * sx, D.y * aspect, D.z * sx).multiplyScalar(R * rel);
      } else if (shape === 'torus') {
        const th = Math.atan2(D.z, D.x), ph = Math.asin(Math.max(-1, Math.min(1, D.y)));
        let major = .5 + hole * .42, minor = .52 - hole * .24, norm = 1 / (major + minor); major *= norm; minor *= norm;
        const rr = R * rel; Q.set((major + minor * Math.cos(ph)) * Math.cos(th) * rr, minor * Math.sin(ph) * rr, (major + minor * Math.cos(ph)) * Math.sin(th) * rr);
      } else {
        const spec = POLY[shape], pr = rayRadius(D, spec); Q.copy(D).multiplyScalar(R * rel * pr);
      }
      return O.lerp(Q, amt);
    };
  };

  // Apply the same radial base-shape deformation to the assembled original Core.
  // Clip-space reconstruction supports its existing point/line/mesh shaders without a second scene.
  const originalU = { uOriginalShape: {value:0}, uOriginalAmount:{value:0}, uOriginalAspect:{value:1.35}, uOriginalHole:{value:.45}, uOriginalPlanes:{value:Array.from({length:80},()=>new THREE.Vector4())}, uOriginalPlaneCount:{value:0}, uOriginalPolyScale:{value:1}, uOriginalToCore:{value:new THREE.Matrix4()}, uOriginalFromCore:{value:new THREE.Matrix4()} };
  SURFACE.resetOriginalShape = () => { originalU.uOriginalAmount.value = 0; };
  SURFACE.shapeOriginal = (studio, core, camera) => {
    const target=studio.coreFxTarget(), t=target?.tune || {}, shape=t.s_shape || 'sphere';
    const active = (!(t.s_enabled && (t.s_style || 'none') !== 'none')) && shape !== 'sphere';
    originalU.uOriginalAmount.value = active ? +(t.s_shapeAmt ?? 1) : 0;
    if (!active) return;
    originalU.uOriginalShape.value = shape === 'football' ? 1 : shape === 'torus' ? 2 : 3;
    originalU.uOriginalAspect.value = +(t.s_shapeAspect ?? 1.35); originalU.uOriginalHole.value = +(t.s_shapeHole ?? .45);
    const poly = POLY[shape]; originalU.uOriginalPlaneCount.value = poly ? poly.p.length : 0; originalU.uOriginalPolyScale.value = poly ? poly.k : 1;
    if (poly) poly.p.forEach((q,i)=>originalU.uOriginalPlanes.value[i].set(...q));
    const frame=studio.subject<0?core.group:target.spinG, objects=studio.subject<0?core.group:target.model;
    frame.updateWorldMatrix(true,false);
    originalU.uOriginalToCore.value.copy(frame.matrixWorld).invert().multiply(camera.matrixWorld).multiply(camera.projectionMatrixInverse);
    originalU.uOriginalFromCore.value.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(frame.matrixWorld);
    objects.traverse(o => {
      if (o.isSprite) return;
      for (const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) {
        if (m.__originalShape) continue; m.__originalShape = true;
        const compile = m.onBeforeCompile.bind(m), key = m.customProgramCacheKey.bind(m);
        m.customProgramCacheKey = () => key() + '|original-base-shape-v1';
        m.onBeforeCompile = (shader, renderer) => {
          compile(shader, renderer); Object.assign(shader.uniforms, originalU);
          shader.vertexShader = `uniform float uOriginalShape,uOriginalAmount,uOriginalAspect,uOriginalHole,uOriginalPolyScale;
            uniform int uOriginalPlaneCount; uniform vec4 uOriginalPlanes[80]; uniform mat4 uOriginalToCore,uOriginalFromCore;
            ` + shader.vertexShader.replace(/void\s+main\s*\(\s*\)/, 'void originalSurfaceMain()') + `
            void main(){ originalSurfaceMain(); if(uOriginalAmount>0.0){vec4 local=uOriginalToCore*gl_Position;vec3 p=local.xyz/local.w;float r=length(p);if(r>0.00001){vec3 d=p/r,q=p;
            if(uOriginalShape<1.5)q=p*vec3(inversesqrt(uOriginalAspect),uOriginalAspect,inversesqrt(uOriginalAspect));
            else if(uOriginalShape<2.5){float th=atan(d.z,d.x),ph=asin(clamp(d.y,-1.0,1.0)),major=.5+uOriginalHole*.42,minor=.52-uOriginalHole*.24,n=1.0/(major+minor);q=vec3((major+minor*cos(ph))*cos(th),minor*sin(ph),(major+minor*cos(ph))*sin(th))*r*n;}
            else{float hit=10000.0;for(int i=0;i<80;i++){if(i>=uOriginalPlaneCount)break;float den=dot(uOriginalPlanes[i].xyz,d);if(den>.00001)hit=min(hit,uOriginalPlanes[i].w/den);}q=d*r*hit*uOriginalPolyScale;}
            gl_Position=uOriginalFromCore*vec4(mix(p,q,uOriginalAmount),1.0);}}}`;
        }; m.needsUpdate = true;
      }
    });
  };

  function boot() {
    const app = window.__cerebra, s = app && app.studio, design = s && s.el && s.el.querySelector('[data-studio-corefx]');
    if (!s || !design || design.dataset.ready !== '1' || !s.coreFxSet) { setTimeout(boot, 180); return; }
    if (s.__surfaceShapeUI) return; s.__surfaceShapeUI = true;
    const css = document.createElement('style'); css.textContent = `
      #studio [data-studio-corefx] [data-cfx-rel].st-off{display:none!important}
      #studio .ss-shape{display:grid;gap:7px;margin:8px 0 11px;padding:9px;border:1px solid #ffffff15;border-radius:13px;background:#0002}
      #studio .ss-shape[hidden]{display:none!important}#studio .ss-shape>strong{font:600 10px var(--f-cond);letter-spacing:.12em;text-transform:uppercase;color:#d9ccff}
      #studio .ss-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 10px;align-items:center;font:11px var(--f-sans)}#studio .ss-row select,#studio .ss-row input[type=range]{grid-column:1/-1;width:100%}
      #tune .ss-tune-group{display:grid;gap:8px;margin:0 0 10px;padding:9px;border:1px solid #ffffff12;border-radius:13px;background:#00000016}#tune .ss-tune-group[hidden]{display:none!important}#tune .ss-tune-group>h4{margin:0;padding:0 0 6px;border-bottom:1px solid #ffffff12;font:600 10px var(--f-cond);letter-spacing:.13em;text-transform:uppercase;color:#d9ccff}
    `; document.head.append(css);
    const wrap = document.createElement('section'); wrap.className = 'ss-shape'; wrap.innerHTML = `<strong>Base shape</strong><label class="ss-row"><span>Shape</span><select data-ss-shape></select></label><label class="ss-row" data-ss-amt><span>Shape strength</span><b data-out></b><input type="range" min="0" max="1" step="0.01" data-ss="s_shapeAmt"></label><label class="ss-row" data-ss-aspect><span>Football length</span><b data-out></b><input type="range" min="0.85" max="1.65" step="0.01" data-ss="s_shapeAspect"></label><label class="ss-row" data-ss-hole><span>Torus hole</span><b data-out></b><input type="range" min="0.15" max="0.75" step="0.01" data-ss="s_shapeHole"></label>`;
    const chips = design.querySelector('.cfx-chips'); if (chips) chips.insertAdjacentElement('afterend', wrap); else design.prepend(wrap);
    const sel = wrap.querySelector('[data-ss-shape]');
    const set = (k, v) => { s.coreFxSet(k, v); sync(); };
    sel.addEventListener('change', () => set('s_shape', sel.value)); wrap.querySelectorAll('[data-ss]').forEach(el => el.addEventListener('input', () => set(el.dataset.ss, +el.value)));

    let tuneGroup = null;
    const ensureTune = () => {
      if (tuneGroup && tuneGroup.isConnected) return tuneGroup; const pane = document.querySelector('#tune [data-pane="surface-deep"]') || document.querySelector('#tune [data-pane="surface"]'); if (!pane) return null;
      tuneGroup = document.createElement('section'); tuneGroup.className = 'ss-tune-group'; tuneGroup.innerHTML = `<h4>Base shape</h4><label class="tune-row"><span>Shape</span><select data-ss-tshape></select></label><label class="tune-row" data-ss-tamt><span>Shape strength</span><input type="range" min="0" max="1" step="0.01" data-ss-t="s_shapeAmt"><b data-out></b></label><label class="tune-row" data-ss-taspect><span>Football length</span><input type="range" min="0.85" max="1.65" step="0.01" data-ss-t="s_shapeAspect"><b data-out></b></label><label class="tune-row" data-ss-thole><span>Torus hole</span><input type="range" min="0.15" max="0.75" step="0.01" data-ss-t="s_shapeHole"><b data-out></b></label>`;
      const first = pane.querySelector('[data-dst-commonwrap],[data-tcs-group]'); first ? first.before(tuneGroup) : pane.prepend(tuneGroup); const ts = tuneGroup.querySelector('[data-ss-tshape]'); ts.onchange = () => set('s_shape', ts.value); tuneGroup.querySelectorAll('[data-ss-t]').forEach(el => el.oninput = () => set(el.dataset.ssT, +el.value)); return tuneGroup;
    };
    const fill = (node, style, value) => { const allowed = SHAPES.filter(([k]) => compatible(style, k)); node.innerHTML = allowed.map(([k, n]) => `<option value="${k}">${n}</option>`).join(''); if (!allowed.some(([k]) => k === value)) value = 'sphere'; node.value = value; return value; };
    function sync() {
      const t = s.coreFxTarget && s.coreFxTarget(); if (!t || !t.tune) return; const v = t.tune, style = v.s_style || 'none'; let sh = v.s_shape || 'sphere';
      const ok = fill(sel, style, sh); if (ok !== sh) { s.coreFxSet('s_shape', ok); sh = ok; }
      wrap.hidden = false; wrap.querySelector('[data-ss-amt]').hidden = sh === 'sphere'; wrap.querySelector('[data-ss-aspect]').hidden = sh !== 'football'; wrap.querySelector('[data-ss-hole]').hidden = sh !== 'torus';
      wrap.querySelectorAll('[data-ss]').forEach(el => { const val = +(v[el.dataset.ss] ?? SURFACE.defaults[el.dataset.ss.slice(2)] ?? 0); el.value = val; const out = el.parentNode.querySelector('[data-out]'); if (out) out.textContent = val.toFixed(2); });
      const tg = ensureTune(); if (tg) { tg.hidden = style === 'none' || sh === 'sphere'; const ts = tg.querySelector('[data-ss-tshape]'); sh = fill(ts, style, sh); tg.querySelector('[data-ss-tamt]').hidden = sh === 'sphere'; tg.querySelector('[data-ss-taspect]').hidden = sh !== 'football'; tg.querySelector('[data-ss-thole]').hidden = sh !== 'torus'; tg.querySelectorAll('[data-ss-t]').forEach(el => { const val = +(v[el.dataset.ssT] ?? SURFACE.defaults[el.dataset.ssT.slice(2)] ?? 0); el.value = val; const out = el.parentNode.querySelector('[data-out]'); if (out) out.textContent = val.toFixed(2); }); }
    }
    const bs = s.syncCoreFx.bind(s); s.syncCoreFx = (...a) => { const r = bs(...a); queueMicrotask(sync); return r; };
    const observer = new MutationObserver(sync); observer.observe(design, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] }); sync(); setTimeout(sync, 400); setTimeout(sync, 1000);

    // Surface and Burst share the subject's tune object and Studio's undo stack.
    const tracked = k => k.startsWith('s_') || k.startsWith('b_');
    const capture = () => {
      const t = s.coreFxTarget();
      return t && { subject: s.subject, values: Object.fromEntries(Object.entries(t.tune).filter(([k]) => tracked(k))) };
    };
    const snapshot = s.snapshot.bind(s);
    s.snapshot = extra => {
      const state = JSON.parse(snapshot(extra)); state.surfaceTune = capture(); return JSON.stringify(state);
    };
    if (Array.isArray(s.hist)) s.hist = s.hist.map(text => {
      const state = JSON.parse(text); state.surfaceTune = capture(); return JSON.stringify(state);
    });
    let restoringSurface = false;
    const restore = s.restore.bind(s);
    s.restore = text => {
      const state = JSON.parse(text), surface = state.surfaceTune;
      restoringSurface = true;
      try {
        const result = restore(text);
        if (surface && surface.subject === s.subject && surface.values) {
          const values = Object.fromEntries(Object.entries(surface.values).filter(([k]) => tracked(k)));
          Object.entries(values).forEach(([k, v]) => s.coreFxSet(k, v));
        }
        return result;
      } finally { restoringSurface = false; }
    };
    const setFx = s.coreFxSet.bind(s);
    let pendingKey = null;
    s.coreFxSet = (k, v) => {
      const fx = Effects.byKey(k), control = fx && fx.controls.find(c => fx.prefix + c.key === k);
      const discrete = k === 's_shape' || control && ['toggle', 'select'].includes(control.type);
      if (!restoringSurface && tracked(k) && (discrete || pendingKey && pendingKey !== k)) s.flushCommit();
      const result = setFx(k, v);
      if (!restoringSurface && tracked(k) && s.active) {
        pendingKey = discrete ? null : k;
        if (discrete) s.commit(); else s.commitSoon();
      }
      return result;
    };
    const finish = e => {
      if (e.target.matches('[data-cfx],[data-dst],[data-ss],[data-ss-t]')) { s.flushCommit(); pendingKey = null; }
    };
    s.el.addEventListener('change', finish); document.getElementById('tune')?.addEventListener('change', finish);
    const resetFx = s.resetFx.bind(s);
    s.resetFx = (...args) => {
      if (!restoringSurface) s.flushCommit();
      const result = resetFx(...args);
      if (!restoringSurface && s.active) { pendingKey = null; s.commit(); }
      return result;
    };
  }
  setTimeout(boot, 0);
})();
