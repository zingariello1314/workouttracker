import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), 'zip');
const audit = JSON.parse(fs.readFileSync(path.join(base, 'ANALYTICAL_AUDIT.json'), 'utf8'));
const cards = Object.values(audit.cardRegistry);
let streakVis = 0;
let streakEv = 0;
let snapVis = 0;
let snapEv = 0;
const samples = [];
for (const c of cards) {
  const vis = `${c.title || ''} ${c.body || ''}`;
  const ev = String(c.evidence || '');
  if (/\bstreak\b/i.test(vis)) {
    streakVis += 1;
    if (samples.length < 4) samples.push({ f: 'streak', where: 'visible', t: c.title });
  } else if (/\bstreak\b/i.test(ev)) streakEv += 1;
  if (/\bsnapshots?\b/i.test(vis)) {
    snapVis += 1;
    if (samples.length < 8) samples.push({ f: 'snapshots', where: 'visible', t: c.title, snip: vis.slice(0, 140) });
  } else if (/\bsnapshots?\b/i.test(ev)) snapEv += 1;
}
const w7 = cards.filter((c) => c.period === '7d' && c.role === 'priority');
console.log(
  JSON.stringify(
    {
      streakVis,
      streakEv,
      snapVis,
      snapEv,
      samples,
      priorities7d: w7.map((c) => ({ k: c.kind, t: c.title }))
    },
    null,
    2
  )
);
