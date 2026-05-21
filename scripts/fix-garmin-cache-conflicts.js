/**
 * Supprime les marqueurs de merge Git dans garmin-server/.cache/*.json
 */
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'garmin-server', '.cache');
const re =
  /<<<<<<< HEAD\r?\n\s*"_cached_at": [^\r\n]+\r?\n=======\r?\n\s*("_cached_at": [^\r\n]+\r?\n)>>>>>>>[^\r\n]+\r?\n/g;

let fixed = 0;
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  const filePath = path.join(dir, name);
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('<<<<<<<')) continue;
  const next = content.replace(re, '$1');
  if (next === content) {
    console.warn('Pas de remplacement:', filePath);
    continue;
  }
  fs.writeFileSync(filePath, next);
  fixed += 1;
  console.log('OK', name);
}
console.log(`Fichiers corrigés: ${fixed}`);
