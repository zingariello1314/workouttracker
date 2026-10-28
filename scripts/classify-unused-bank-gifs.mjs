/**
 * Inventaire GIF banque : utilisés vs inutilisés, classification par destination.
 * Usage: node scripts/classify-unused-bank-gifs.mjs
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(path.join(root, 'package.json'));

const { exerciseDatabase } = require(path.join(root, 'src/data/exerciseDatabase.js'));
const { stretchDatabase } = require(path.join(root, 'src/data/stretchDatabase.js'));
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/bankMediaManifest.json'), 'utf8')
);

const ZONE_MAP = {
  pectorals: 'Pectoraux',
  chest: 'Pectoraux',
  shoulders: 'Épaules',
  delts: 'Épaules',
  back: 'Dorsaux',
  lats: 'Dorsaux',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  abs: 'Abdominaux',
  core: 'Abdominaux',
  quads: 'Quadriceps',
  quadriceps: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  glutes: 'Fessiers',
  calves: 'Mollets',
  cardio: 'Activités Complémentaires',
  legs: 'Quadriceps',
};

function walkGifs(absDir, relBase, acc = []) {
  if (!fs.existsSync(absDir)) return acc;
  for (const name of fs.readdirSync(absDir)) {
    const abs = path.join(absDir, name);
    const rel = `${relBase}/${name}`.replace(/\\/g, '/');
    const st = fs.statSync(abs);
    if (st.isDirectory()) walkGifs(abs, rel, acc);
    else if (/\.gif$/i.test(name)) acc.push(rel);
  }
  return acc;
}

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugTokens(fileRel) {
  const base = path.basename(fileRel, path.extname(fileRel));
  return norm(base.replace(/-/g, ' ')).split(/\s+/).filter(Boolean);
}

function collectUsedPaths() {
  const used = new Set();
  const add = (p) => {
    if (p) used.add(String(p).replace(/\\/g, '/'));
  };
  for (const bucket of [manifest.exercises, manifest.stretches, manifest.pathologies]) {
    if (!bucket || typeof bucket !== 'object') continue;
    for (const entry of Object.values(bucket)) {
      add(entry?.card?.sourcePath);
      add(entry?.gif?.sourcePath);
      for (const v of entry?.videos || []) add(v?.sourcePath);
    }
  }
  return used;
}

function buildExerciseIndex() {
  const byNormName = new Map();
  const byTokens = [];
  for (const [key, ex] of Object.entries(exerciseDatabase || {})) {
    const names = [key, ex.name, ...(ex.variations || [])].filter(Boolean);
    for (const n of names) {
      const nn = norm(n);
      if (!byNormName.has(nn)) byNormName.set(nn, key);
    }
    byTokens.push({
      key,
      zone: ex.category || '?',
      tokens: new Set(norm([ex.name, key, ...(ex.variations || [])].join(' ')).split(/\s+/)),
    });
  }
  return { byNormName, byTokens };
}

function buildStretchIndex() {
  const byNormName = new Map();
  for (const [key, st] of Object.entries(stretchDatabase || {})) {
    for (const n of [key, st.name, ...(st.variations || [])].filter(Boolean)) {
      const nn = norm(n);
      if (!byNormName.has(nn)) byNormName.set(nn, key);
    }
  }
  return { byNormName };
}

function scoreTokenOverlap(a, b) {
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  const denom = Math.max(a.length, 1);
  return hit / denom;
}

function classifyGif(rel, used, exIndex, stretchIndex) {
  if (used.has(rel)) {
    return { disposition: 'already_linked', zoneHint: null, matchKey: null };
  }

  const folder = rel.split('/')[1] || '';
  const zoneHint = ZONE_MAP[folder.toLowerCase()] || folder || null;
  const tokens = slugTokens(rel);
  const slugNorm = tokens.join(' ');

  if (exIndex.byNormName.has(slugNorm)) {
    return {
      disposition: 'link_existing_exercise',
      zoneHint,
      matchKey: exIndex.byNormName.get(slugNorm),
      confidence: 'exact_name',
    };
  }

  // fuzzy against exercise names
  let best = null;
  for (const row of exIndex.byTokens) {
    const score = scoreTokenOverlap(tokens, row.tokens);
    if (score < 0.6) continue;
    if (!best || score > best.score) best = { ...row, score };
  }
  if (best && best.score >= 0.75) {
    return {
      disposition: 'link_existing_exercise',
      zoneHint: best.zone || zoneHint,
      matchKey: best.key,
      confidence: best.score >= 0.9 ? 'high' : 'probable',
      score: best.score,
    };
  }

  if (stretchIndex.byNormName.has(slugNorm)) {
    return {
      disposition: 'link_existing_stretch',
      zoneHint,
      matchKey: stretchIndex.byNormName.get(slugNorm),
      confidence: 'exact_name',
    };
  }

  const stretchHit = [...stretchIndex.byNormName.keys()].find((k) => {
    const kt = k.split(/\s+/);
    return scoreTokenOverlap(tokens, new Set(kt)) >= 0.8;
  });
  if (stretchHit) {
    return {
      disposition: 'link_existing_stretch',
      zoneHint,
      matchKey: stretchIndex.byNormName.get(stretchHit),
      confidence: 'probable',
    };
  }

  const pathLower = rel.toLowerCase();
  if (/rehab|patholog|injury|tendin|scolios|hernie/.test(pathLower + ' ' + slugNorm)) {
    return { disposition: 'pathology_candidate', zoneHint, matchKey: null };
  }
  if (/stretch|mobility|yoga|foam.?roll|mobilisation/.test(pathLower + ' ' + slugNorm)) {
    return { disposition: 'new_stretch_card', zoneHint, matchKey: null };
  }

  return {
    disposition: 'new_exercise_card',
    zoneHint,
    matchKey: null,
    proposedName: tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' '),
  };
}

function main() {
  const used = collectUsedPaths();
  const exIndex = buildExerciseIndex();
  const stretchIndex = buildStretchIndex();

  const collections = [
    'troisieme dossier gif',
    'quatrieme dossier gif',
    'gifs',
    'lesderniersgifs',
  ];

  const allUnused = [];
  const byCollection = {};
  const byDisposition = {};
  const byZoneNew = {};
  const linkExisting = [];

  for (const col of collections) {
    const abs = path.join(root, 'dossiergifs', col);
    const gifs = walkGifs(abs, col);
    byCollection[col] = { total: gifs.length, unused: 0, used: 0 };
    for (const rel of gifs) {
      const c = classifyGif(rel, used, exIndex, stretchIndex);
      if (c.disposition === 'already_linked') {
        byCollection[col].used += 1;
        continue;
      }
      byCollection[col].unused += 1;
      allUnused.push({ sourcePath: rel, ...c });
      byDisposition[c.disposition] = (byDisposition[c.disposition] || 0) + 1;
      if (c.disposition === 'link_existing_exercise' || c.disposition === 'link_existing_stretch') {
        linkExisting.push({ sourcePath: rel, ...c });
      }
      if (c.disposition === 'new_exercise_card' || c.disposition === 'new_stretch_card') {
        const z = c.zoneHint || 'autres';
        if (!byZoneNew[z]) byZoneNew[z] = [];
        byZoneNew[z].push({ sourcePath: rel, proposedName: c.proposedName || null });
      }
    }
  }

  // Missing cards from bank (exercises without GIF)
  const missingCard = [];
  for (const [dbKey, ex] of Object.entries(exerciseDatabase || {})) {
    const media = manifest.exercises?.[`db:${dbKey}`];
    if (!media?.card?.sourcePath) {
      missingCard.push({
        dbKey,
        name: ex.name || dbKey,
        zone: ex.category || '?',
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    note:
      'quatrieme dossier gif = ids opaques (souvent doublons binaires de troisieme). Prioriser troisieme pour les noms exploitables.',
    bank: {
      exercises: Object.keys(exerciseDatabase || {}).length,
      stretches: Object.keys(stretchDatabase || {}).length,
      manifestExercises: Object.keys(manifest.exercises || {}).length,
      manifestStretches: Object.keys(manifest.stretches || {}).length,
      exercisesMissingCard: missingCard.length,
    },
    collections: byCollection,
    unusedTotals: {
      all: allUnused.length,
      byDisposition,
    },
    linkExistingSample: linkExisting.slice(0, 80),
    linkExistingCount: linkExisting.length,
    newCardsByZone: Object.fromEntries(
      Object.entries(byZoneNew)
        .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
        .map(([z, list]) => [z, { count: list.length, sample: list.slice(0, 40) }])
    ),
    missingCardByZone: missingCard.reduce((acc, row) => {
      (acc[row.zone] ||= []).push(row);
      return acc;
    }, {}),
    pectorauxPlan: {
      missingCards: missingCard.filter((r) => r.zone === 'Pectoraux'),
      unusedTroisiemePectorals: allUnused.filter(
        (u) =>
          u.sourcePath.startsWith('troisieme dossier gif/pectorals/') &&
          u.disposition !== 'already_linked'
      ),
    },
  };

  const outJson = path.join(root, 'docs/sport/audit-gif-inutilises-classification.json');
  const outMd = path.join(root, 'docs/sport/AUDIT_GIF_INUTILISES.md');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

  const md = [];
  md.push('# Audit GIF inutilisés — classification');
  md.push('');
  md.push(`Généré le ${report.generatedAt.slice(0, 10)}.`);
  md.push('');
  md.push('## Synthèse banque');
  md.push('');
  md.push(`- Exercices : **${report.bank.exercises}**`);
  md.push(`- Étirements : **${report.bank.stretches}**`);
  md.push(`- Manifest exercices : **${report.bank.manifestExercises}**`);
  md.push(`- Cartes sans GIF : **${report.bank.exercisesMissingCard}**`);
  md.push('');
  md.push('## Collections');
  md.push('');
  md.push('| Collection | Total GIF | Liés | Inutilisés |');
  md.push('| --- | ---: | ---: | ---: |');
  for (const [col, row] of Object.entries(byCollection)) {
    md.push(`| ${col} | ${row.total} | ${row.used} | ${row.unused} |`);
  }
  md.push('');
  md.push('> `quatrieme dossier gif` : noms non exploitables (ids) — souvent doublons de `troisieme`.');
  md.push('');
  md.push('## Disposition des inutilisés');
  md.push('');
  for (const [k, v] of Object.entries(byDisposition).sort((a, b) => b[1] - a[1])) {
    md.push(`- **${k}** : ${v}`);
  }
  md.push('');
  md.push(`Liens possibles vers fiches existantes : **${linkExisting.length}**`);
  md.push('');
  md.push('## Nouvelles cartes proposées (par zone)');
  md.push('');
  for (const [z, info] of Object.entries(report.newCardsByZone)) {
    md.push(`### ${z} (${info.count})`);
    md.push('');
    for (const row of info.sample.slice(0, 15)) {
      md.push(`- \`${row.sourcePath}\`${row.proposedName ? ` — ${row.proposedName}` : ''}`);
    }
    if (info.count > 15) md.push(`- … +${info.count - 15}`);
    md.push('');
  }
  md.push('## Cartes banque sans GIF (à lier en priorité)');
  md.push('');
  for (const [z, list] of Object.entries(report.missingCardByZone).sort((a, b) =>
    a[0].localeCompare(b[0], 'fr')
  )) {
    md.push(`### ${z} (${list.length})`);
    for (const row of list) md.push(`- \`${row.dbKey}\` — ${row.name}`);
    md.push('');
  }

  fs.writeFileSync(outMd, md.join('\n'));
  console.log(`Wrote ${path.relative(root, outMd)}`);
  console.log(`Wrote ${path.relative(root, outJson)}`);
  console.log(
    JSON.stringify(
      {
        unused: allUnused.length,
        byDisposition,
        linkExisting: linkExisting.length,
        missingCard: missingCard.length,
      },
      null,
      2
    )
  );
}

main();
