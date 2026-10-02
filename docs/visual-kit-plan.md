# Visual Kit roadmap (34 ข้อจากภาพอ้างอิง 30 ภาพ)

แผนนี้ออกแบบให้โมเดลที่ทำงานต่อ (เช่น Sonnet) หยิบไปทำทีละ Phase ได้โดยไม่ต้องย้อนอ่านบทสนทนา
ทุก Phase = 1 branch + 1 PR + merge + ตรวจเว็บจริง ตาม `CLAUDE.md`

## กติกาที่ใช้ทุก Phase

1. แก้เฉพาะ `src/template.html`, `src/effects/*.js`, `src/worlds.json` แล้วรัน `python3 src/build_web.py` ห้ามแก้ `index.html` / `assets/` เอง
2. Branch ชื่อ `kit-pN-<slug>` จาก `origin/main` ล่าสุด
3. ก่อน commit: build ผ่าน, เปิด `python3 -m http.server 8765` แล้วรันสคริปต์ Playwright (Chromium `/opt/pw-browsers/chromium`) ที่ viewport 1440x900 และ 390x844 (mobile, `hasTouch`) ตรวจ: ไม่มี console error, ฟีเจอร์ใหม่ปรากฏ, Save PNG (`composePoster`) มีของใหม่ด้วย
4. สกรีนช็อตเก็บใน scratchpad / `/tmp` ห้ามอยู่ใน repo
5. ของใหม่ทุกชิ้นต้อง: อยู่ใน snapshot/undo, Reset ล้างได้, ใช้กับ Focus (`itemBlurPx`) ได้, render ซ้ำใน `composePoster` ได้ตรงกับจอ
6. Performance: มือถือ/iPad ต้องมีตัวเลือก Density และค่าเริ่มต้นต่ำ; จำนวนเส้น/จุดสูงสุดต่อ item กำหนดเป็นค่าคงที่ (`KIT_MAX`)
7. ห้ามคัดลอกภาพ โลโก้ หรือข้อความของผู้ออกแบบต้นฉบับ (Colorpong, Goodsart, NOVA ฯลฯ) ใช้แค่แนวทาง
8. ตอบผู้ใช้เป็นภาษาไทย บอกตรง ๆ ว่าทดสอบบน emulator เท่านั้น

## จุดยึดในโค้ด (ณ ตอนเขียนแผน)

| ส่วน | ที่อยู่ |
|---|---|
| Studio class | `class CoreStudio` ~บรรทัด 7747 |
| วาง item บนจอ | `place(it)` ~8451 (text = DOM, shape = SVG ผ่าน `drawShapeSvg`) |
| path ของ shape | `shapeD(kind,w,h,it)` ~8541 |
| แผง Layers | `renderLayers()` ~8905 |
| Export | `composePoster(scale)` ~9218 |
| ดาว | `class PlanetBody` ~4455, ShaderMaterial helpers ~3786–4140 |
| Effect registry | `src/effects/core.js` (prefix ต่อ effect, ค่าเก็บใน `world.tune`) |
| Post | `src/effects/post-stack.js` |

บรรทัดจะเลื่อน ให้ `grep` ชื่อ method ก่อนทุกครั้ง

## สถาปัตยกรรมกลาง (ทำใน Phase 1 ครั้งเดียว ใช้ต่อทุก Phase)

**Studio item kind ใหม่: `kit`**
```js
{ kind:'kit', type:'rings', x, y, w, h, rot, alpha, blend, locked, focusMode,
  p:{ /* พารามิเตอร์เฉพาะ type */ }, seed: 12345 }
```
- Registry `KIT = { rings:{label, icon, defaults, draw(ctx, it, w, h, rnd), ui:[...] }, ... }`
- `draw()` วาดลง Canvas 2D เท่านั้น ใช้ฟังก์ชันเดียวกันทั้งจอ (canvas ใน element ของ item) และ `composePoster` → จอกับไฟล์ตรงกันเสมอ
- สุ่มด้วย `rnd = mulberry32(it.seed)` ให้ผลคงที่ทุกครั้งที่ redraw/undo; ปุ่ม "Shuffle" เปลี่ยน seed
- `ui` เป็นรายการ control (`slider|color|select|toggle|text`) → สร้างเมนู Design ของ item อัตโนมัติ ใช้ class/style slider เดิม (fill ตามค่า)
- Library: หมวดใหม่ "Kit" แสดง thumbnail ที่วาดจาก `draw()` จริง
- Layer menu ⋯: Copy, Blend, Focus effect ใช้ได้เหมือน shape เดิม

**Scene style ใหม่ของดาว: `surface`**
- เพิ่มใน `src/effects/` เป็น effect ใหม่ (prefix `s_`) ตามแบบ `formation.js`/`hologram.js` เพื่อให้ Tune/Reset/storage ทำงานอัตโนมัติ
- แต่ละ style = overlay `THREE.Points` / `LineSegments` / ShaderMaterial รอบ mesh ดาว ไม่แทนที่ GLB เดิม (ปิดได้ = กลับเป็นดาวเดิม)

**Preset**: JSON `{ scene:{tune...}, items:[...], bg:{...} }` โหลดผ่าน path เดียวกับ snapshot/restore

## Phase และลำดับงาน

แต่ละแถว = 1 PR. ตัวเลขใน [ ] คือข้อในรายการ 34 ข้อ

### Phase 1 — Kit engine + Rings (ฐานของทุกอย่าง) [1]
- สร้าง kind `kit`, registry, Design panel อัตโนมัติ, Library หมวด Kit, export, snapshot, focus
- types: `rings` (จำนวนวง, ระยะห่าง, ความหนา, เส้นประ, arc เริ่ม/จบ), `radial` (จำนวนเส้น, ความยาวสุ่ม, จุดปลาย, สีจุด 3 สี), `arc` (accent arc หนา)
- ผ่านเมื่อ: วาง rings ได้, ปรับค่าเห็นผลทันที, Save PNG มี rings คม, undo/redo ได้

### Phase 2 — Text on path + ป้ายรอบวง [3][25]
- text item ได้ option `path: none|circle` + radius, start angle, flip, spacing
- kit type `labelRing`: รายการข้อความ (textarea บรรทัดละป้าย) เรียงรอบวงแบบรัศมีหรือโค้ง, ขีดสเกลคั่น
- render ผ่าน Canvas ทั้งจอและ export (ห้ามพึ่ง SVG textPath อย่างเดียว เพราะ export ต้องตรง)

### Phase 3 — Scale / dot rings / radial bar [7][8]
- `scaleRing` (ขีดสเกลแบบไม้บรรทัด, ขีดใหญ่ทุก N), `dotRing` (วงจุดไล่ขนาดหลายชั้น halftone), `radialBars` (แท่งตามมุม, ค่าสุ่มหรือพิมพ์ตัวเลข, 2 วงสี)

### Phase 4 — HUD kit [2][28]
- type `hud` + `glyph` ชุดสัญลักษณ์: corner brackets, dot matrix, hatch, plus/minus, target reticle, diamond row, warning, star4, bar gradient, angle bracket line
- เส้นบาง 1px, สีเดียว + สี accent

### Phase 5 — Typography display [34]
- text option: outline (stroke-only), ตัวเลขใหญ่ล้นขอบ, ตัวบางกว้าง (เพิ่ม font ที่ไลเซนส์เปิด เช่น จาก Google Fonts ถ้าไฟล์อยู่ใน `src/fonts`), vertical text, label chip (กรอบสีพื้นหลังแบบป้ายแดง)

### Phase 6 — Frosted label + Dashboard widgets [32][33]
- kit `glassLabel`: กล่องแก้วเบลอพื้นหลัง (จอ: `backdrop-filter`; export: blur สำเนา canvas ใต้กล่อง) + corner bracket + เส้นชี้ไปจุด
- kit `widget`: stat (ตัวเลข+label), property table, mini bar chart, radar, timeline — ข้อมูลพิมพ์เองในเมนู

### Phase 7 — Textures [12][29]
- พื้นหลัง overlay: paper grain, crumpled paper, scratches, vignette (สร้างแบบ procedural ใน canvas ไม่ใช้ภาพมีลิขสิทธิ์), ความแรง + blend

### Phase 8 — Network line engine (2D) [11][14][16][17][18][19][21][24]
- โมดูลกลาง `lines2d`: สร้าง node + เส้นโค้ง (quadratic/bezier), bundling ง่าย (ดึงจุดควบคุมเข้าหาแกน), ไล่สีตามเส้น, glow (วาด 2 รอบ: เบลอ+คม หรือ `globalCompositeOperation='lighter'`)
- kit types: `hubNetwork` (ฮับ+กิ่ง ภาพ 18), `cellCluster` (ภาพ 16/17), `plexus2d` (จุดเชื่อมระยะใกล้), `chord` (จุดบนวง → ป้ายหมวด ภาพ 24), `bundle` (โหมด fan / twin-fan / converge ภาพ 9,19,20,21), `neural` (กิ่งแตกแขนงด้วย random walk ภาพ 14/15)
- Density limit: desktop ≤ 3000 เส้น, mobile ≤ 800; วาดลง offscreen canvas ครั้งเดียว แล้ว redraw เฉพาะเมื่อพารามิเตอร์เปลี่ยน

### Phase 9 — Flow / spiral / circular flow (2D) [6][10][22][23][27]
- `flowField` (เส้นไหลตาม noise field, จำกัดในวงกลมได้ → Cosmos-like), `circularFlow` (ไล่สีตามมุม), `spiral` (ก้นหอยหลายเส้น + เส้นเน้นสี)
- ใช้ `lines2d` จาก Phase 8

### Phase 10 — Orbit pattern generator [5]
- ใน Build the orbit: ปุ่ม Pattern สร้างวงรีเอียง N วง (มุม, สี 2 สี, glow) เป็น overlay 3D (`THREE.Line` + additive) เก็บใน tune

### Phase 11 — Planet surface styles (3D) [13][15][30][31]
- effect ใหม่ `src/effects/surface.js` prefix `s_`, เลือก style: `none | dotgrid | spike | wire | plexus3d`
  - dotgrid: Points บน fibonacci sphere + noise displacement, ขนาดตามความลึก, ไล่ 2 สี
  - spike: Points/instanced lines ยื่นตาม normal ความยาวจาก noise, ไล่สี 3 สี
  - wire: icosphere wireframe + noise บิด + polyhedron ครอบ (option) + fragment ที่ขอบ
  - plexus3d: จุดบนผิว + LineSegments เชื่อม k-nearest (คำนวณครั้งเดียวตอนเปลี่ยนค่า)
- Tune: style, density, color A/B, displacement, spin, hide original surface (toggle)
- ผ่านเมื่อ: FPS desktop emulator ไม่ตกจากเดิมเกิน ~20%, mobile density ต่ำโดยอัตโนมัติ

### Phase 12 — Particle burst / particle ring (3D) [9][26]
- ขยาย effect formation หรือ effect ใหม่: `burst` (เส้นเกลียวจาก core, curl noise), `ring` (วงแหวนอนุภาค noise ขอบฟุ้ง)

### Phase 13 — Style presets + Poster templates [4][6][20][26-layout]
- Scene preset: Mono Poster, Gold HUD, Glow Orbit, Neon Cell, Astrolabe, Data Flow
- Poster template: Editorial calendar (ภาพ 1), Cyclical (ภาพ 5), Physics series (ภาพ 8), Dashboard (ภาพ 29/30), Cropped radial (ภาพ 25)
- template = items ของ Phase 1–9 + scene preset; เลือกแล้ว undo กลับได้

### Phase 14 — GPU path (รอผู้ใช้ยืนยันเรื่อง WebGPU) [10][22][27 แบบหนาแน่น]
- ย้ายการวาด `lines2d` ความหนาแน่นสูงไป WebGL2/WebGPU instanced lines; คง Canvas 2D เป็น fallback
- **ห้ามเริ่มจนกว่าผู้ใช้สั่ง** (ผู้ใช้จะส่งผล `chrome://gpu` มาก่อน)

## ตารางสรุปข้อ → Phase

| ข้อ | เรื่อง | Phase |
|---|---|---|
| 1 | rings / ring band / arc / radial | 1 |
| 2, 28 | HUD kit | 4 |
| 3, 25 | text on path, ป้ายรอบวง | 2 |
| 4, 26 | poster template, crop layout | 13 |
| 5 | orbit pattern | 10 |
| 6, 20 | style preset, neon | 13 (+ flow ใน 9) |
| 7 | dot halftone / scale ring | 3 |
| 8 | radial bar | 3 |
| 9, 27 | particle ring / burst | 12 |
| 10, 19, 21, 22 | bundling, circular flow | 8–9 (+14) |
| 11, 14, 16, 17, 18 | network / neural / hub / cell | 8 |
| 12, 29 | textures | 7 |
| 13, 30 | wireframe shell | 11 |
| 15 | dot-grid planet | 11 |
| 23 | spiral | 9 |
| 24 | chord | 8 |
| 31 | spike planet | 11 |
| 32, 33 | glass label, widgets | 6 |
| 34 | typography | 5 |

## รายงานผู้ใช้หลังแต่ละ Phase (ภาษาไทย)
- PR # ที่ merge, ไฟล์ app hash ที่ขึ้นเว็บแล้ว
- อะไรใช้ได้ (อธิบายจากมุมผู้ใช้: อยู่เมนูไหน กดอะไร)
- ทดสอบอย่างไร (emulator desktop + mobile เท่านั้น ยังไม่ได้ลองบน iPad จริง)
- ข้อจำกัดที่รู้ และ Phase ถัดไปคืออะไร
