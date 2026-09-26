/* Shared effects registry. Each effect keeps its per-world settings in the world's tune object under its own
   prefix (f_ for formation, h_ for hologram ...), so storage, reset and the Tune World panel treat them alike. */
const Effects = {
  list: [],
  register(fx) { this.list.push(fx); return fx; },
  byKey(k) { return this.list.find(fx => k.startsWith(fx.prefix)); },
  defaults() {
    const o = {};
    this.list.forEach(fx => Object.entries(fx.defaults).forEach(([k, v]) => { o[fx.prefix + k] = v; }));
    return o;
  },
  // Called from World: add uniforms before the shader compiles, route settings, advance per frame.
  attach(w) { this.list.forEach(fx => fx.attach && fx.attach(w)); },
  set(w, k, v) { const fx = this.byKey(k); if (!fx) return false; w.tune[k] = v; if (fx.apply) fx.apply(w, k.slice(fx.prefix.length), v); return true; },
  // GLSL spliced into the world surface shader: uniforms, code at the top of the main block, code at its end.
  glsl(part) { return this.list.map(fx => fx[part] || '').join('\n'); },
  update(w, dt, t) { this.list.forEach(fx => fx.update && fx.update(w, dt, t)); },
};
