import { buildAnatomyPreviewManifest } from './anatomyPreviewManifest.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const index = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'public', 'anatomy-previews', 'index.json'), 'utf8')
);
const set = new Set(index.stems);
const m = buildAnatomyPreviewManifest();
const all = [...m.exercise, ...m.stretch];
let hit = 0;
let miss = 0;
for (const e of all) {
  if (set.has(e.stem)) hit += 1;
  else miss += 1;
}
console.log(JSON.stringify({ manifestEntries: all.length, hitIndex: hit, missIndex: miss }, null, 2));
