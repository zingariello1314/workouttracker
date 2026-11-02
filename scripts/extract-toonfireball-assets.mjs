import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const src = fs.readFileSync(path.join(ROOT, 'src/components/originkit/ui/toonfireball-03.tsx'), 'utf8');
const names = [
  'TEX_PERLIN',
  'TEX_SPARK',
  'TEX_WATER',
  'QUAD_VERT',
  'BALL_VERT',
  'BALL_FRAG',
  'STEAM_VERT',
  'STEAM_FRAG',
  'FLAME_VERT',
  'FLAME_FRAG',
  'HIGHPASS_FRAG',
  'COMPOSITE_FRAG',
  'COPY_FRAG'
];

function extract(name) {
  const re = new RegExp(`const ${name}\\s*=\\s*([\`"'])`);
  const m = re.exec(src);
  if (!m) return null;
  const quote = m[1];
  let i = m.index + m[0].length;
  let out = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length) {
      out += ch + src[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) break;
    out += ch;
    i += 1;
  }
  return out;
}

const blurMatch = /const blurFrag\s*=\s*\(radius:\s*number\)\s*=>\s*`([\s\S]*?)`/.exec(src);
if (!blurMatch) {
  console.error('missing blurFrag');
  process.exit(1);
}

const out = [];
for (const name of names) {
  const value = extract(name);
  if (!value) {
    console.error('missing', name);
    process.exit(1);
  }
  out.push(`export const ${name} = ${JSON.stringify(value)};`);
}
out.push(`export const BLOOM_BLUR_TEMPLATE = ${JSON.stringify(blurMatch[1])};`);
out.push('export const BLOOM_KERNELS = [3, 5, 7, 9, 11];');
out.push('export const BLOOM_FACTORS = [1.0, 0.8, 0.6, 0.4, 0.2];');
out.push('export function blurFrag(radius) {');
out.push("  return BLOOM_BLUR_TEMPLATE.replace(/\\$\\{radius\\}/g, String(radius));");
out.push('}');

const dest = path.join(ROOT, 'src/backgrounds/engines/toonFireballAssets.js');
fs.writeFileSync(dest, `${out.join('\n')}\n`);
console.log('wrote', dest, fs.statSync(dest).size);
