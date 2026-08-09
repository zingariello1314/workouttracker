/**
 * Estime le centre Y (hauteur) de chaque mesh du GLB pour valider le mapping anatomique.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buf = readFileSync(join(__dirname, '../public/models/ecorche-muscles-decoupes.glb'));

const jsonLen = buf.readUInt32LE(12);
const binStart = 20 + jsonLen + 8; // skip JSON chunk header
const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

const nodes = json.nodes || [];
const meshes = json.meshes || [];
const accessors = json.accessors || [];
const bufferViews = json.bufferViews || [];

function readAccessor(accessorIndex) {
  const acc = accessors[accessorIndex];
  const bv = bufferViews[acc.bufferView];
  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const count = acc.count;
  const componentType = acc.componentType;
  const type = acc.type;
  const elSize = type === 'VEC3' ? 3 : type === 'SCALAR' ? 1 : 0;
  if (!elSize) return null;

  const bytesPer = componentType === 5126 ? 4 : componentType === 5123 ? 2 : 0;
  const stride = bv.byteStride || elSize * bytesPer;
  const out = [];
  for (let i = 0; i < count; i++) {
    const base = binStart + byteOffset + i * stride;
    if (componentType === 5126) {
      out.push(buf.readFloatLE(base), buf.readFloatLE(base + 4), buf.readFloatLE(base + 8));
    }
  }
  return out;
}

function boundsForMesh(meshIndex) {
  const mesh = meshes[meshIndex];
  const posAcc = mesh.primitives?.[0]?.attributes?.POSITION;
  if (posAcc == null) return null;
  const flat = readAccessor(posAcc);
  if (!flat?.length) return null;
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < flat.length; i += 3) {
    const x = flat[i];
    const y = flat[i + 1];
    const z = flat[i + 2];
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  const cy = (minY + maxY) / 2;
  return { minY, maxY, cy, minX, maxX, minZ, maxZ };
}

const rows = [];
nodes.forEach((n, i) => {
  if (n.mesh == null) return;
  const b = boundsForMesh(n.mesh);
  if (!b) return;
  rows.push({ name: n.name || `node_${i}`, ...b, cz: (b.minZ + b.maxZ) / 2 });
});
const tib = rows.filter((r) => /tib|11|27|29|os|calves/i.test(r.name));
console.log('\nLeg / tib candidates (full Z range):');
tib.forEach((r) => {
  console.log(`${r.name}: z=[${r.minZ.toFixed(2)}, ${r.maxZ.toFixed(2)}] y=[${r.minY.toFixed(2)}, ${r.maxY.toFixed(2)}]`);
});
rows.sort((a, b) => {
  const az = (a.minZ + a.maxZ) / 2;
  const bz = (b.minZ + b.maxZ) / 2;
  return az - bz;
});
console.log('mesh (centerZ asc — pieds → tête si Z vertical):');
rows.forEach((r) => {
  const cx = (r.minX + r.maxX) / 2;
  const cz = (r.minZ + r.maxZ) / 2;
  console.log(
    `${r.name.padEnd(22)} cy=${r.cy.toFixed(3)} cx=${cx.toFixed(3)} cz=${cz.toFixed(3)}`
  );
});
