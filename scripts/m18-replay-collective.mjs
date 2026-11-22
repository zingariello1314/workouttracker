/**
 * Mission 18 — Rejeu moteur réel (lecture seule) sur backup sport 19 nov.
 * Horizons ciblés : 7d + 30d (coût limité).
 *
 * Usage:
 *   npx vite-node scripts/m18-replay-collective.mjs
 *   npx vite-node scripts/m18-replay-collective.mjs --end 2026-11-19
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analysisEditionKey, analysisMissionLabel, ANALYSIS_EDITION_PARTS } from '../src/utils/sport/analysisEdition.js';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { windowFor, addDays } from '../src/utils/sport/evaluation/incrementalP6Replay.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_IDS = new Set([
  '302',
  '304',
  '306',
  '307',
  '308',
  '1599606959',
  '1735485569',
  '369862756',
  '1250363242'
]);

const BACKUPS = [
  path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-zinga-Desktop-momentum/attachments/2154474a-0603-44f8-8ebb-a86ce443fdec/momentum-sport-backup-2026-11-19.json'
  ),
  path.join(process.env.USERPROFILE || '', 'Downloads/momentum-sport-backup-2026-11-19.json')
];

function resolveBackup() {
  for (const p of BACKUPS) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function extractSnapshot(raw) {
  // Format backup Momentum : payload analytique = backup.data (reps, checkedExercises, …)
  if (raw?.data?.reps || raw?.data?.checkedExercises) return raw.data;
  if (raw?.reps || raw?.checkedExercises) return raw;
  if (raw?.snapshot) return raw.snapshot;
  return raw;
}

function firstSessionDate(snapshot) {
  const dates = Object.keys(snapshot?.reps || {})
    .map((key) => String(key).slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return dates[0] || '2025-01-01';
}

function latestSessionDate(snapshot) {
  const dates = Object.keys(snapshot?.reps || {})
    .map((key) => String(key).slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return dates[dates.length - 1] || null;
}

function nameResolverFromBackup(raw) {
  const names = new Map();
  for (const day of Object.values(raw?.sportExport?.dailyJournal || {})) {
    for (const exercise of day.exercises || []) {
      const id = exercise?.id ?? exercise?.exerciseId;
      if (id != null && exercise?.name) names.set(String(id), exercise.name);
    }
  }
  return (id) => names.get(String(id)) || '';
}

function slimCard(d) {
  return {
    kind: d.kind,
    title: d.title,
    body: (d.body || '').slice(0, 400),
    disposition: d.p6Disposition || d.lineage?.selection || null,
    readingMode: d.metrics?.readingMode || null,
    dates: d.metrics?.dates || d.metrics?.returnDates || null,
    confirmationDates: d.metrics?.confirmationDates || null,
    named: (d.metrics?.namedMoves || []).map((m) => m.name || m.exerciseId).slice(0, 12),
    episodeClusterDate: d.metrics?.exploration?.episodeClusterDate || null,
    evidenceLevel: d.metrics?.exploration?.episodeEvidenceLevel || null,
    informativeValue: d.informativeValue ?? d.metrics?.informativeValue ?? null
  };
}

const backupPath = resolveBackup();
if (!backupPath) {
  console.error('Backup 19 nov introuvable. Cherché :', BACKUPS);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const snapshot = extractSnapshot(raw);
const firstDate = firstSessionDate(snapshot);
const latestInBackup = latestSessionDate(snapshot);
const endArg =
  process.argv.find((a) => a.startsWith('--end='))?.slice(6) || latestInBackup || '2026-11-19';
const getExerciseNameById = nameResolverFromBackup(raw);
const program =
  snapshot?.activeProgram ||
  raw?.sportExport?.activeProgram ||
  (Array.isArray(snapshot?.programs) ? snapshot.programs.find((p) => p?.active) || snapshot.programs[0] : null) ||
  null;

const periods = ['7d', '30d'];
const report = {
  generatedAt: new Date().toISOString(),
  mission: analysisMissionLabel(),
  edition: ANALYSIS_EDITION_PARTS.editorial,
  editionKey: analysisEditionKey(),
  backup: backupPath,
  end: endArg,
  firstDate,
  latestSessionInBackup: latestInBackup,
  coverageNote:
    latestInBackup && latestInBackup < '2026-11-18'
      ? 'La sauvegarde du 19 nov. s’arrête avant le 18 nov. : confirmation du 18 absente. Pour le mode confirmation 7j, exporter un backup sport ≥ 2026-11-21 depuis l’app (pas seulement l’audit JSON).'
      : null,
  periods: {}
};

for (const period of periods) {
  const window = windowFor(period, endArg, firstDate);
  const t0 = Date.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot,
    period,
    window,
    getExerciseNameById,
    activeProgram: program
  });
  const ms = Date.now() - t0;
  const all = bundle.all || [];
  const selected = bundle.selected || [];
  const accessible = bundle.accessibleCatalog?.accessible || [];
  const collectives = all.filter((d) => /disc_collective_return/i.test(d.kind || ''));
  const targetConsol = all.filter(
    (d) =>
      /format_consolidation/i.test(d.kind || '') &&
      TARGET_IDS.has(String(d.metrics?.exerciseId || ''))
  );
  report.periods[period] = {
    window,
    ms,
    counts: {
      all: all.length,
      selected: selected.length,
      accessible: accessible.length,
      collectiveInAll: collectives.length,
      collectiveInSelected: selected.filter((d) => /disc_collective_return/i.test(d.kind || '')).length,
      collectiveInAccessible: accessible.filter((d) => /disc_collective_return/i.test(d.kind || '')).length,
      targetConsolidations: targetConsol.length
    },
    collectives: collectives.map(slimCard),
    targetConsolidations: targetConsol.map((d) => ({
      id: d.metrics?.exerciseId,
      name: d.metrics?.exerciseName || d.metrics?.name,
      returnDate: d.metrics?.returnDate,
      gapDays: d.metrics?.gapDays,
      mechanism: d.metrics?.mechanism,
      dates: d.metrics?.dates
    })),
    selectedTitles: selected.map((d) => d.title).slice(0, 14)
  };
  console.log(
    `[${period}] all=${all.length} collective=${collectives.length} selected_collective=${report.periods[period].counts.collectiveInSelected} (${ms}ms)`
  );
  if (collectives[0]) {
    console.log('  title:', collectives[0].title);
    console.log('  body:', String(collectives[0].body || '').slice(0, 220));
  }
}

const outDir = path.join(root, 'artifacts/analysis-eval');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'mission18-replay-7d-30d.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote', outPath);
console.log('Edition', report.edition, report.mission);
