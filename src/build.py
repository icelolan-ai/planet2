import base64, json, html, os

ROOT = '/home/claude/ky'
NM = ROOT + '/node_modules'
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
esc = html.escape

worlds = json.load(open(ROOT + '/worlds.json'))
tpl = open(ROOT + '/template.html').read()

# Fonts, inlined (latin subset) so the page never needs a network.
faces = [
    ('Valorant', 400, 'normal', 'fonts/valorant.woff2'),
    ('Bebas Neue', 400, 'normal', '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2'),
    ('Barlow', 300, 'normal', '@fontsource/barlow/files/barlow-latin-300-normal.woff2'),
    ('Barlow', 400, 'normal', '@fontsource/barlow/files/barlow-latin-400-normal.woff2'),
    ('Barlow', 500, 'normal', '@fontsource/barlow/files/barlow-latin-500-normal.woff2'),
    ('Barlow Condensed', 400, 'normal', '@fontsource/barlow-condensed/files/barlow-condensed-latin-400-normal.woff2'),
    ('Barlow Condensed', 500, 'normal', '@fontsource/barlow-condensed/files/barlow-condensed-latin-500-normal.woff2'),
    ('Barlow Condensed', 600, 'normal', '@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2'),
    ('Geist Mono', 400, 'normal', '@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2'),
]
fonts = '\n'.join(
    f'@font-face{{font-family:"{f}";font-style:{st};font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b64((ROOT if p.startswith("fonts/") else NM) + "/" + p)}) format("woff2")}}'
    for f, w, st, p in faces)

n = len(worlds)
words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
sections, index, loader = [], [], []
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
    loader.append(f'<li style="--a:{w["accent"]}"><i></i>{esc(w["name"])}</li>')

data = [f'<script type="text/plain" id="draco-wrapper">{b64(NM + "/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js")}</script>',
        f'<script type="application/octet-stream" id="draco-wasm">{b64(NM + "/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm")}</script>']
for w in worlds:
    data.append(f'<script type="application/octet-stream" data-world="{w["id"]}">{b64(ROOT + "/glb/" + w["id"] + ".glb")}</script>')

vendor = open(ROOT + '/build/vendor.min.js').read()
assert '</script' not in vendor

js_worlds = json.dumps([{k: w[k] for k in ('id', 'name', 'kicker', 'accent', 'radius', 'orbit', 'incl', 'phase', 'tilt', 'spin', 'lede', 'body', 'exports')} for w in worlds], ensure_ascii=False)

out = (tpl.replace('/*__FONTS__*/', fonts)
          .replace('<!--__LOADER_WORLDS__-->', ''.join(loader))
          .replace('<!--__WORLD_INDEX__-->', ''.join(index))
          .replace('<!--__WORLD_SECTIONS__-->', '\n\n'.join(sections))
          .replace('<!--__DATA__-->', '\n'.join(data))
          .replace('/*__VENDOR__*/', vendor)
          .replace('/*__WORLDS__*/', js_worlds))
for m in ['__FONTS__', '__LOADER_WORLDS__', '__WORLD_INDEX__', '__WORLD_SECTIONS__', '__DATA__', '__VENDOR__', '__WORLDS__']:
    assert m not in out, m
os.makedirs(ROOT + '/dist', exist_ok=True)
open(ROOT + '/dist/index.html', 'w').write(out)
print('built', round(len(out.encode()) / 1e6, 2), 'MB')
