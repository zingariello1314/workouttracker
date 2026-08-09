/**
 * Génère public/anatomy-previews/index.json (liste des .webp présents sur disque).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'public', 'anatomy-previews');
const out = path.join(dir, 'index.json');

const stems = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.slice(0, -5))
  .sort();

fs.writeFileSync(out, JSON.stringify({ version: 1, count: stems.length, stems }), 'utf8');
console.log(`Wrote ${stems.length} stems to ${out}`);
