"""Build the site from src/ into the repo root: a small index.html plus hashed, cacheable files in assets/.

    python3 src/build_web.py            # split build (what GitHub Pages serves)
    python3 src/build_web.py --inline   # the old single-file page, for comparison only (written to /tmp)

Inputs:
  src/template.html          markup, CSS and the app code
  src/worlds.json            world copy and parameters
  src/assets-src/            binaries that rarely change: vendor bundle, fonts, Draco decoder, world GLBs
The app script is minified with esbuild when it is available (npx esbuild), otherwise copied as is.
"""
import base64, hashlib, html, json, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(HERE, 'assets-src')
OUT = os.path.join(ROOT, 'assets')
INLINE = '--inline' in sys.argv
esc = html.escape

worlds = json.load(open(os.path.join(HERE, 'worlds.json'), encoding='utf-8'))
tpl = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()

FONTS = [  # family, weight, style, file
    ('Valorant', 400, 'normal', 'valorant-400'),
    ('Bebas Neue', 400, 'normal', 'bebas-neue-400'),
    ('Barlow', 300, 'normal', 'barlow-300'), ('Barlow', 400, 'normal', 'barlow-400'), ('Barlow', 500, 'normal', 'barlow-500'),
    ('Barlow Condensed', 400, 'normal', 'barlow-condensed-400'), ('Barlow Condensed', 500, 'normal', 'barlow-condensed-500'),
    ('Barlow Condensed', 600, 'normal', 'barlow-condensed-600'),
    ('Geist Mono', 400, 'normal', 'geist-mono-400'),
]

written = []


def emit(rel_dir, name, ext, data):
    """Write data to assets/<rel_dir>/<name>.<hash>.<ext> and return its URL relative to the site root."""
    h = hashlib.sha256(data).hexdigest()[:10]
    d = os.path.join(OUT, rel_dir)
    os.makedirs(d, exist_ok=True)
    fn = f'{name}.{h}.{ext}'
    open(os.path.join(d, fn), 'wb').write(data)
    url = '/'.join(p for p in ('assets', rel_dir, fn) if p)
    written.append((url, len(data)))
    return url


def read(*p):
    return open(os.path.join(SRC, *p), 'rb').read()


def minify_js(code):
    if os.environ.get('NO_MINIFY'):
        return code.encode()
    try:
        r = subprocess.run(['npx', '--yes', 'esbuild', '--minify', '--loader=js', '--legal-comments=none'],
                           input=code.encode(), capture_output=True, timeout=180)
        if r.returncode == 0 and r.stdout:
            return r.stdout
        print('esbuild failed, shipping unminified:', r.stderr.decode()[:300])
    except Exception as e:  # noqa: BLE001
        print('esbuild unavailable, shipping unminified:', e)
    return code.encode()


# ---------------------------------------------------------------- markup shared by both modes
n = len(worlds)
words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
sections, index, loader, rail = [], [], [], []
for i, w in enumerate(worlds):
    side = 'left' if i % 2 == 0 else 'right'
    num = f'{i + 1:02d}'
    slug = w['id'].lower().replace('_', '-')
    sections.append(f'''  <section class="sec world" id="world-{slug}" data-side="{side}" data-name="{esc(w['name'])}" data-depth="World {num} of {n:02d}" style="--a:{w['accent']}">
    <div class="sec-inner">
      <p class="layer-tag reveal" style="--d:0"><span>World <b>{num}</b> of {words[n - 1]}</span></p>
      <h2 class="title" data-split>{esc(w['name'])}</h2>
      <p class="w-kicker reveal" style="--d:2">{esc(w['kicker'])}</p>
      <p class="lede reveal" style="--d:3">{esc(w['lede'])}</p>
      <div class="w-meta reveal" style="--d:4" data-world-meta="{i}"></div>
      <button class="enter reveal" style="--d:5" type="button" data-open-world="{i}" data-cursor="Land"><span>Land on {esc(w['name'])}</span><i></i></button>
    </div>
  </section>''')
    index.append(f'<li style="--a:{w["accent"]}"><button type="button" data-open-world="{i}" data-cursor="Land"><span class="wi">{num}</span><span class="wn">{esc(w["name"])}</span><span class="wd"></span></button></li>')
    rail.append(f'<button type="button" class="w" data-target="{i + 4}" style="--a:{w["accent"]}" aria-label="Go to world {num}, {esc(w["name"])}"><span>{esc(w["name"])}</span><i></i></button>')
    loader.append(f'<li style="--a:{w["accent"]}"><i></i>{esc(w["name"])}</li>')

js_worlds = json.dumps([{k: w[k] for k in ('id', 'name', 'kicker', 'accent', 'radius', 'orbit', 'incl', 'phase', 'tilt', 'spin', 'lede', 'body', 'exports')} for w in worlds], ensure_ascii=False)
vendor = read('vendor.min.js').decode('utf-8')
assert '</script' not in vendor

# The app script is the inline <script> that holds the WORLDS placeholder.
i = tpl.index('/*__WORLDS__*/')
a = tpl.rindex('<script>', 0, i)
b = tpl.index('</script>', i) + len('</script>')

# Effects live in src/effects/. Keep dependency order explicit so adding/renaming
# a file cannot silently change runtime behaviour just because of alphabetic order.
fx_dir = os.path.join(HERE, 'effects')
fx_order = [
    'core.js',
    'surface.js',
    'surface-shapes.js',
    'surface-tune-core.js',
    'studio-tune-core-ux.js',
    'studio-detail-controls.js',
    'reference-design.js',
    'studio-dock-order.js',
    'camera.js',
    'fog.js',
    'formation.js',
    'hologram.js',
    'burst.js',
    'post-stack.js',
    'diagnostics.js',
    'studio-menu-fix.js',
    's7-brush.js',
    'nava-water.js',
    'water-collision.js',
    's9-core.js',
    's9-ui.js',
    'library-defaults.js',
    'runtime-compat.js',
]
fx_found = {f for f in os.listdir(fx_dir) if f.endswith('.js')}
fx_files = [f for f in fx_order if f in fx_found]
fx_files += sorted(fx_found - set(fx_files))
if not fx_files or fx_files[0] != 'core.js':
    raise RuntimeError('src/effects/core.js must be the first effect module')
effects_js = '\n'.join(open(os.path.join(fx_dir, f), encoding='utf-8').read() for f in fx_files)
app_src = tpl[a + len('<script>'):b - len('</script>')].replace('/*__WORLDS__*/', js_worlds).replace('/*__EFFECTS__*/', effects_js)

tpl = tpl.replace('/*__EFFECTS__*/', effects_js)
page = (tpl.replace('<!--__LOADER_WORLDS__-->', ''.join(loader)).replace('<!--__RAIL_WORLDS__-->', ''.join(rail))
           .replace('<!--__WORLD_INDEX__-->', ''.join(index))
           .replace('<!--__WORLD_SECTIONS__-->', '\n\n'.join(sections)))

if INLINE:
    b64 = lambda d: base64.b64encode(d).decode()
    fonts = '\n'.join(f'@font-face{{font-family:"{f}";font-style:{st};font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b64(read("fonts", fn + ".woff2"))}) format("woff2")}}' for f, w, st, fn in FONTS)
    data = [f'<script type="text/plain" id="draco-wrapper">{b64(read("draco", "draco_wasm_wrapper.js"))}</script>',
            f'<script type="application/octet-stream" id="draco-wasm">{b64(read("draco", "draco_decoder.wasm"))}</script>']
    data += [f'<script type="application/octet-stream" data-world="{w["id"]}">{b64(read("worlds", w["id"] + ".glb"))}</script>' for w in worlds]
    out = (page.replace('/*__FONTS__*/', fonts).replace('<!--__DATA__-->', '\n'.join(data))
               .replace('/*__VENDOR__*/', vendor).replace('/*__WORLDS__*/', js_worlds))
    open('/tmp/cerebra-inline.html', 'w', encoding='utf-8').write(out)
    print('inline build', round(len(out.encode()) / 1e6, 2), 'MB -> /tmp/cerebra-inline.html')
    sys.exit(0)

# ---------------------------------------------------------------- split build
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
fonts = '\n'.join(f'@font-face{{font-family:"{f}";font-style:{st};font-weight:{w};font-display:swap;src:url({emit("fonts", fn, "woff2", read("fonts", fn + ".woff2"))}) format("woff2")}}' for f, w, st, fn in FONTS)
manifest = {
    'draco': {'js': emit('draco', 'draco_wasm_wrapper', 'js', read('draco', 'draco_wasm_wrapper.js')),
              'wasm': emit('draco', 'draco_decoder', 'wasm', read('draco', 'draco_decoder.wasm'))},
    'worlds': {w['id']: emit('worlds', w['id'], 'glb', read('worlds', w['id'] + '.glb')) for w in worlds},
    'sizes': {},
}
for w in worlds:
    manifest['sizes'][w['id']] = os.path.getsize(os.path.join(SRC, 'worlds', w['id'] + '.glb'))
vendor_url = emit('', 'vendor', 'js', vendor.encode())
app_url = emit('', 'app', 'js', minify_js(app_src))
manifest['build'] = app_url   # lets the running page notice that a newer build has been published

# A tiny bootstrap fetches the two scripts with byte progress (the loader's first ~55% is the real download),
# then runs them in order. If streaming fails it falls back to plain script tags.
sizes = {u: n for u, n in written}
boot = ("<script>(()=>{const F=%s,T=F.reduce((a,f)=>a+f[1],0),B=0.55;let got=0;"
        "const num=document.querySelector('#loader [data-num]'),bar=document.querySelector('#loader [data-bar]');"
        "const show=()=>{const p=Math.min(B,got/T*B);window.__BOOT_P=p;if(num)num.textContent=String(Math.floor(p*100)).padStart(3,'0');if(bar)bar.style.transform='scaleX('+p.toFixed(4)+')'};"
        "const get=async u=>{const r=await fetch(u);if(!r.ok||!r.body)throw 0;const rd=r.body.getReader(),ps=[];for(;;){const{done,value}=await rd.read();if(done)break;ps.push(value);got+=value.length;show();}return new Blob(ps,{type:'text/javascript'})};"
        "const run=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=ok;s.onerror=no;document.body.appendChild(s)});"
        "Promise.all(F.map(f=>get(f[0]))).then(async bl=>{for(const b of bl)await run(URL.createObjectURL(b))})"
        ".catch(()=>{window.__BOOT_P=0;F.forEach(f=>run(f[0]))});})();</script>") % json.dumps([[vendor_url, sizes[vendor_url]], [app_url, sizes[app_url]]])
out = page.replace('/*__FONTS__*/', fonts)
out = out.replace('<!--__DATA__-->', '<script>window.__ASSETS = ' + json.dumps(manifest) + ';</script>')
vs = out.index('<script>/*__VENDOR__*/</script>')
ae = out.index('</script>', out.index('/*__WORLDS__*/')) + len('</script>')
out = out[:vs] + boot + out[ae:]
for m in ['__FONTS__', '__LOADER_WORLDS__', '__WORLD_INDEX__', '__WORLD_SECTIONS__', '__RAIL_WORLDS__', '__EFFECTS__', '__DATA__', '__VENDOR__', '__WORLDS__']:
    assert m not in out, m
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(out)
written.append(('index.html', len(out.encode())))
total = sum(s for _, s in written)
print(f'built index.html {len(out.encode()) / 1e3:.1f} kB, {len(written)} files, {total / 1e6:.2f} MB total')
for u, s in written:
    print(f'  {s / 1e3:9.1f} kB  {u}')
