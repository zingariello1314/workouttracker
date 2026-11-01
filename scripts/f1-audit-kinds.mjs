/**
 * F1 — Audit non invasif : inventaire kinds + replay fixture 7j/30j/3m.
 * Usage: npx vite-node scripts/f1-audit-kinds.mjs
 * Ne modifie aucun comportement produit.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { resolveContentClass } from '../src/utils/sport/recapDiscoveryContentClass.js';
import { natureForKind } from '../src/utils/sport/recapInsightNature.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sportDir = path.join(root, 'src/utils/sport');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '__tests__' || ent.name === 'node_modules') continue;
      walk(p, acc);
    } else if (/\.(js|jsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const kindRe = /['"`](disc_[a-z0-9_]+)['"`]/g;
const files = walk(sportDir);
const byKind = new Map();

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  const rel = path.relative(root, file).replace(/\\/g, '/');
  while ((m = kindRe.exec(text))) {
    const k = m[1];
    if (!byKind.has(k)) byKind.set(k, { kind: k, files: new Set(), natures: new Set() });
    byKind.get(k).files.add(rel);
  }
}

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const nameById = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
    'utf8'
  )
);
const getName = (id) => nameById[String(id)] || nameById[id] || '';

const windows = {
  '7d': { start: '2026-10-24', end: '2026-10-30' },
  '30d': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

const replays = {};
for (const [period, window] of Object.entries(windows)) {
  const t0 = performance.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31'
  });
  const ms = Math.round(performance.now() - t0);
  const slim = (d) => ({
    kind: d.kind,
    nature: d.nature || natureForKind(d.kind),
    family: d.family,
    contentClass: resolveContentClass(d),
    score: d.score,
    title: d.title,
    body: String(d.body || '').slice(0, 280),
    informativeValue: d.metrics?.informativeValue ?? d.weights?.informativeValue,
    proofLevel: d.metrics?.proofLevel,
    metricsKeys: Object.keys(d.metrics || {}).slice(0, 24),
    evidenceKeys: Object.keys(d.evidence || {}).slice(0, 24)
  });
  replays[period] = {
    ms,
    window,
    poolSize: (bundle.all || []).length,
    selectedSize: (bundle.selected || []).length,
    droppedSize: (bundle.dropped || []).length,
    reliabilityNotes: (bundle.reliabilityNotes || []).length,
    selected: (bundle.selected || []).map(slim),
    dropped: (bundle.dropped || [])
      .slice(0, 40)
      .map((d) => ({
        kind: d.kind,
        reason: d.reason,
        title: d.title
      })),
    poolKinds: [...new Set((bundle.all || []).map((d) => d.kind))].sort(),
    selectedKinds: (bundle.selected || []).map((d) => d.kind)
  };
  for (const d of bundle.all || []) {
    if (!byKind.has(d.kind)) {
      byKind.set(d.kind, { kind: d.kind, files: new Set(['(runtime-only)']), natures: new Set() });
    }
    byKind.get(d.kind).natures.add(d.nature || natureForKind(d.kind) || '?');
    byKind.get(d.kind).seenInReplay = true;
    byKind.get(d.kind).contentClass = resolveContentClass(d);
    byKind.get(d.kind).family = d.family || byKind.get(d.kind).family;
  }
}

const register = [...byKind.values()]
  .map((r) => ({
    kind: r.kind,
    family: r.family || null,
    natureHint: natureForKind(r.kind) || [...r.natures][0] || null,
    contentClass: r.contentClass || null,
    seenInFixtureReplay: Boolean(r.seenInReplay),
    files: [...r.files].sort()
  }))
  .sort((a, b) => a.kind.localeCompare(b.kind));

const out = {
  generatedAt: new Date().toISOString(),
  source: 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json',
  kindCountInSourceScan: register.length,
  kindsSeenInReplay: register.filter((r) => r.seenInFixtureReplay).length,
  kindsSourceOnly: register.filter((r) => !r.seenInFixtureReplay).map((r) => r.kind),
  register,
  replays
};

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f1-audit-kinds-replay.json'
);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(
  JSON.stringify(
    {
      kindCount: register.length,
      seenInReplay: out.kindsSeenInReplay,
      sourceOnly: out.kindsSourceOnly.length,
      replayMs: Object.fromEntries(
        Object.entries(replays).map(([k, v]) => [k, { ms: v.ms, pool: v.poolSize, sel: v.selectedSize }])
      ),
      wrote: dest
    },
    null,
    2
  )
);
