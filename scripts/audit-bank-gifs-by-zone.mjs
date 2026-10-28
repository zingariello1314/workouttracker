/**
 * Audit banque Sport : GIF/cartes manquants zone par zone + GIF orphelins éventuels.
 * Usage: node scripts/audit-bank-gifs-by-zone.mjs
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'package.json'));

const { exerciseDatabase } = require(path.join(root, 'src/data/exerciseDatabase.js'));
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/bankMediaManifest.json'), 'utf8')
);

function isGifStandIn(video) {
  return (
    video?.sourceCollection === 'deuxieme dossier gif' ||
    String(video?.sourcePath || '').startsWith('deuxieme dossier gif/')
  );
}

function mediaForDbKey(dbKey) {
  return manifest.exercises?.[`db:${dbKey}`] || null;
}

function hasCard(media) {
  return Boolean(media?.card?.sourcePath);
}

function hasGif(media) {
  if (hasCard(media)) return true;
  return (media?.videos || []).some(isGifStandIn);
}

function hasRealVideo(media) {
  return (media?.videos || []).some((v) => !isGifStandIn(v));
}

const byZone = new Map();
const missingCard = [];
const missingGif = [];
const withGif = [];
const usedPaths = new Set();

for (const [dbKey, ex] of Object.entries(exerciseDatabase || {})) {
  const zone = ex?.muscleGroup || ex?.category || ex?.bodyZone || 'non classé';
  if (!byZone.has(zone)) {
    byZone.set(zone, {
      zone,
      total: 0,
      withCard: 0,
      withGif: 0,
      withVideo: 0,
      missingCard: [],
      missingGif: [],
    });
  }
  const row = byZone.get(zone);
  row.total += 1;
  const media = mediaForDbKey(dbKey);
  if (media?.card?.sourcePath) usedPaths.add(media.card.sourcePath);
  for (const v of media?.videos || []) {
    if (v?.sourcePath) usedPaths.add(v.sourcePath);
  }
  if (hasCard(media)) row.withCard += 1;
  else {
    row.missingCard.push(dbKey);
    missingCard.push({ zone, dbKey, name: ex?.name || dbKey });
  }
  if (hasGif(media)) {
    row.withGif += 1;
    withGif.push(dbKey);
  } else {
    row.missingGif.push(dbKey);
    missingGif.push({ zone, dbKey, name: ex?.name || dbKey });
  }
  if (hasRealVideo(media)) row.withVideo += 1;
}

const zones = [...byZone.values()].sort((a, b) => a.zone.localeCompare(b.zone, 'fr'));

let orphanGifs = [];
const inventoryPath = path.join(root, 'dossiergifs/audit/inventory.json');
if (fs.existsSync(inventoryPath)) {
  try {
    const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    const all = [];
    const walk = (node, prefix = '') => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.files)) {
        for (const f of node.files) {
          const rel = f.relativePath || f.sourcePath || f.path;
          if (rel && /\.(gif|webp|mp4|webm)$/i.test(rel)) all.push(rel.replace(/\\/g, '/'));
        }
      }
      for (const [k, v] of Object.entries(node)) {
        if (k === 'files') continue;
        if (v && typeof v === 'object') walk(v, prefix ? `${prefix}/${k}` : k);
      }
    };
    if (Array.isArray(inv)) {
      for (const rec of inv) {
        const rel = rec.relativePath || rec.sourcePath;
        if (rel) all.push(String(rel).replace(/\\/g, '/'));
      }
    } else if (inv.files || inv.gifs || inv.items) {
      const list = inv.files || inv.gifs || inv.items || [];
      for (const rec of list) {
        const rel = rec.relativePath || rec.sourcePath || rec;
        if (typeof rel === 'string') all.push(rel.replace(/\\/g, '/'));
      }
    } else {
      walk(inv);
    }
    orphanGifs = all.filter((p) => !usedPaths.has(p));
  } catch {
    orphanGifs = [];
  }
}

const lines = [];
lines.push('# Audit banque — GIF / cartes par zone');
lines.push('');
lines.push(`Généré le ${new Date().toISOString().slice(0, 10)}.`);
lines.push('');
lines.push('## Synthèse');
lines.push('');
lines.push(`- Exercices banque : **${Object.keys(exerciseDatabase).length}**`);
lines.push(`- Entrées manifest médias : **${Object.keys(manifest.exercises || {}).length}**`);
lines.push(`- Avec carte GIF : **${Object.keys(exerciseDatabase).length - missingCard.length}**`);
lines.push(`- Sans carte : **${missingCard.length}**`);
lines.push(`- Sans GIF (carte ni stand-in) : **${missingGif.length}**`);
if (orphanGifs.length) {
  lines.push(`- Fichiers inventaire non liés (approx.) : **${orphanGifs.length}**`);
}
lines.push('');
lines.push('## Zone par zone');
lines.push('');
lines.push('| Zone | Total | Carte | GIF | Vidéo | Sans carte | Sans GIF |');
lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const z of zones) {
  lines.push(
    `| ${z.zone} | ${z.total} | ${z.withCard} | ${z.withGif} | ${z.withVideo} | ${z.missingCard.length} | ${z.missingGif.length} |`
  );
}
lines.push('');
lines.push('## Détail — cartes manquantes (par zone)');
lines.push('');
for (const z of zones) {
  if (!z.missingCard.length) continue;
  lines.push(`### ${z.zone} (${z.missingCard.length})`);
  lines.push('');
  for (const key of z.missingCard.slice(0, 80)) {
    const name = exerciseDatabase[key]?.name || key;
    lines.push(`- \`${key}\` — ${name}`);
  }
  if (z.missingCard.length > 80) lines.push(`- … +${z.missingCard.length - 80} autres`);
  lines.push('');
}

if (orphanGifs.length) {
  lines.push('## GIF / médias inventaire non référencés (échantillon)');
  lines.push('');
  for (const p of orphanGifs.slice(0, 100)) lines.push(`- \`${p}\``);
  if (orphanGifs.length > 100) lines.push(`- … +${orphanGifs.length - 100} autres`);
  lines.push('');
}

const outDir = path.join(root, 'docs/sport');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'AUDIT_BANQUE_GIF_PAR_ZONE.md');
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');

const jsonOut = path.join(outDir, 'audit-banque-gif-par-zone.json');
fs.writeFileSync(
  jsonOut,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totals: {
        exercises: Object.keys(exerciseDatabase).length,
        manifest: Object.keys(manifest.exercises || {}).length,
        missingCard: missingCard.length,
        missingGif: missingGif.length,
        orphanSample: orphanGifs.length,
      },
      zones: zones.map((z) => ({
        zone: z.zone,
        total: z.total,
        withCard: z.withCard,
        withGif: z.withGif,
        withVideo: z.withVideo,
        missingCard: z.missingCard,
        missingGif: z.missingGif,
      })),
      orphanGifs: orphanGifs.slice(0, 500),
    },
    null,
    2
  ),
  'utf8'
);

console.log(`Wrote ${path.relative(root, outFile)}`);
console.log(`Wrote ${path.relative(root, jsonOut)}`);
console.log(
  `missingCard=${missingCard.length} missingGif=${missingGif.length} zones=${zones.length}`
);
