import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { textureCompress, simplify, weld, draco, dedup, prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import { MeshoptSimplifier } from 'meshoptimizer';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const S = process.env.PLANETS || new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'); // the planet folder
const jobs = [
  ['Aqua_Foam', 'Aqua_Foam/Aqua_Foam_lo.glb', 512, +process.argv[2] || 0.45],
  ['Inferno', 'Inferno/Inferno_lo.glb', 512, 0],
  ['Terra_Nova', 'Terra_Nova/Terra_Nova_lo.glb', 512, 0],
  ['Arcanum', 'Arcanum/Arcanum_2k.glb', 2048, 0],
  ['Emerald_Tide', 'Emerald_Tide/Emerald_Tide_2k.glb', 2048, 0],
  ['Nebula_Planet', 'Nebula_Planet/Nebula_Planet_2k.glb', 2048, 0],
  ['Tempest', 'Tempest/Tempest_2k.glb', 2048, 0],
];
for (const [name, file, size, ratio] of jobs) {
  const doc = await io.read(S + file);
  const tx = [dedup(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size, size], quality: size > 1000 ? 84 : 80 })];
  if (ratio) tx.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.0008, lockBorder: true }));
  tx.push(prune(), draco({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }));
  await doc.transform(...tx);
  let v = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) v += p.getAttribute('POSITION').getCount();
  await io.write(`glb/${name}.glb`, doc);
  const { size: bytes } = await import('fs').then(fs => fs.statSync(`glb/${name}.glb`));
  console.log(name, 'verts', v, (bytes / 1e6).toFixed(2), 'MB');
}
