import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, '../public/models/ecorche-muscles-decoupes.glb'));
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

function norm(n) {
  return String(n || '').trim().replace(/\./g, '_').replace(/\s+/g, '_');
}

const nodes = json.nodes || [];
const withMesh = nodes
  .map((n, i) => ({ i, name: n.name, mesh: n.mesh, children: n.children }))
  .filter((n) => n.mesh != null);

console.log('Meshes with names:');
withMesh.forEach((n) => console.log(`  ${JSON.stringify(n.name)} -> ${norm(n.name)}`));

const scenes = json.scenes?.[0]?.nodes || [];
function walk(idx, depth) {
  const n = nodes[idx];
  if (!n) return;
  const pad = '  '.repeat(depth);
  const tag = n.mesh != null ? '[MESH]' : '';
  console.log(`${pad}${idx}: ${JSON.stringify(n.name)} ${tag}`);
  (n.children || []).forEach((c) => walk(c, depth + 1));
}
console.log('\nScene tree:');
scenes.forEach((r) => walk(r, 0));
