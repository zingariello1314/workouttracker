/**
 * Mission 19 — Rejeu pipeline complet 8 horizons (même chemin que l’app).
 * Usage:
 *   npx vite-node scripts/m19-replay-eight.mjs
 *   npx vite-node scripts/m19-replay-eight.mjs --backup path/to/backup.json --end 2026-11-21
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ANALYSIS_EDITION_PARTS,
  analysisEditionKey,
  analysisMissionLabel
} from '../src/utils/sport/analysisEdition.js';
import { snapshotFingerprint } from '../src/utils/sport/analysisEnvironmentDossier.js';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { windowFor } from '../src/utils/sport/evaluation/incrementalP6Replay.js';
import { reconcilePopulationTable } from '../src/utils/sport/canonicalAnalyticalPopulations.js';
import { exerciseDatabase } from '../src/data/exerciseDatabase.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PERIODS = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];

const DEFAULT_BACKUP = path.join(
  root,
  'artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json'
);

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function extractSnapshot(raw) {
  if (raw?.data?.reps || raw?.data?.checkedExercises) return raw.data;
  if (raw?.reps || raw?.checkedExercises) return raw;
  return raw;
}

function nameResolver(raw, snapshot) {
  const names = new Map();
  for (const day of Object.values(raw?.sportExport?.dailyJournal || {})) {
    for (const exercise of day.exercises || []) {
      const id = exercise?.id ?? exercise?.exerciseId;
      if (id != null && exercise?.name) names.set(String(id), exercise.name);
    }
  }
  // Mission 20 — enrichir depuis les prescriptions programme (ids numériques / dup / ex_).
  const programs = [];
  if (snapshot?.activeProgram) programs.push(snapshot.activeProgram);
  const bag = snapshot?.programs;
  if (Array.isArray(bag)) programs.push(...bag);
  else if (bag && typeof bag === 'object') programs.push(...Object.values(bag));
  for (const prog of programs) {
    for (const day of Object.values(prog?.schedule || {})) {
      for (const exercise of day?.exercises || []) {
        const id = exercise?.originalId ?? exercise?.storageId ?? exercise?.id ?? exercise?.exerciseId;
        if (id != null && exercise?.name) names.set(String(id), exercise.name);
      }
    }
  }
  return (id) => {
    const key = String(id);
    if (names.has(key)) return names.get(key);
    const db = exerciseDatabase?.[key];
    if (db?.name) return db.name;
    return '';
  };
}

function firstLastDates(snapshot) {
  const dates = Object.keys(snapshot?.reps || {})
    .map((k) => String(k).slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  return { first: dates[0] || '2025-01-01', last: dates[dates.length - 1] || null };
}

function slim(d) {
  const attrIds = (d.metrics?.observedValues || [])
    .filter((o) => /Share|Remainder|Reconciliation|recognized|unattributed|partition/i.test(o.id || ''))
    .map((o) => ({ id: o.id, value: o.value, unit: o.unit }));
  return {
    kind: d.kind,
    title: d.title,
    body: d.body || '',
    readingMode: d.metrics?.readingMode || null,
    thesis: d.metrics?.thesis || null,
    narrativeAuthority: d.metrics?.narrativeAuthority || d.drafting?.authority || null,
    episodeId: d.metrics?.episodeId || null,
    phenomenonId: d.metrics?.phenomenonId || d.phenomenonId || null,
    confirmationDates: d.metrics?.confirmationDates || null,
    dates: d.metrics?.dates || d.metrics?.returnDates || null,
    namedCount: (d.metrics?.namedMoves || []).length,
    episodeQual: d.metrics?.episodeQual || null,
    compositionSlice: (d.metrics?.composition?.conclusion || '').slice(0, 240) || null,
    observedCount: (d.metrics?.observedValues || []).length,
    sharedFactCount: (d.metrics?.sharedFacts || []).length,
    memory: d.metrics?.memory
      ? {
          state: d.metrics.memory.state,
          previousState: d.metrics.memory.previousState,
          transition: d.metrics.memory.transition,
          knownAt: d.metrics.memory.knownAt,
          knowledgeCutoff: d.metrics.memory.knowledgeCutoff,
          publicationDecision: d.metrics.memory.publicationDecision || null,
          exposureCounted: d.metrics.memory.exposureCounted === true
        }
      : null,
    attributionObserved: attrIds.length ? attrIds : null,
    contributionCount: (d.metrics?.contributionRegistry || []).length || null,
    conclusionScope: d.metrics?.conclusionScope || null,
    informativeValue: d.informativeValue ?? d.metrics?.informativeValue ?? null,
    p6Disposition: d.p6Disposition || null
  };
}

function bankFingerprint(db) {
  const keys = Object.keys(db || {}).sort();
  let h = 2166136261;
  for (const k of keys) {
    const name = String(db[k]?.name || '');
    const s = `${k}:${name}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return {
    source: 'src/data/exerciseDatabase.js',
    keyCount: keys.length,
    digest: (h >>> 0).toString(16)
  };
}

const backupPath = arg('backup', DEFAULT_BACKUP);
if (!fs.existsSync(backupPath)) {
  console.error('Backup introuvable:', backupPath);
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const snapshot = extractSnapshot(raw);
const { first, last } = firstLastDates(snapshot);
const end = arg('end', last || '2026-11-21');
const getName = nameResolver(raw, snapshot);
const program =
  snapshot?.activeProgram ||
  raw?.sportExport?.activeProgram ||
  (Array.isArray(snapshot?.programs)
    ? snapshot.programs.find((p) => p?.active) || snapshot.programs[0]
    : null) ||
  null;

const report = {
  schema: 'momentum.m21ReplayEight.v1',
  generatedAt: new Date().toISOString(),
  mission: analysisMissionLabel(),
  edition: ANALYSIS_EDITION_PARTS.editorial,
  editionKey: analysisEditionKey(),
  backupPath,
  end,
  firstDate: first,
  fingerprint: snapshotFingerprint(snapshot),
  environment: {
    exerciseBank: bankFingerprint(exerciseDatabase),
    nameResolver: 'journal+program+exerciseDatabase',
    matching: ANALYSIS_EDITION_PARTS.matching,
    populations: ANALYSIS_EDITION_PARTS.populations,
    facts: ANALYSIS_EDITION_PARTS.facts,
    memory: ANALYSIS_EDITION_PARTS.memory,
    gtg: ANALYSIS_EDITION_PARTS.gtg
  },
  sources: {
    hasReps: Boolean(snapshot?.reps),
    hasChecked: Boolean(snapshot?.checkedExercises),
    hasProgram: Boolean(program),
    hasJournal: Boolean(raw?.sportExport?.dailyJournal),
    nov11Targets: ['302', '304', '306', '307', '308'].filter(
      (id) => snapshot?.checkedExercises?.[`2026-11-11_${id}`]
    ).length,
    nov18Targets: ['302', '304', '306', '307', '308'].filter(
      (id) => snapshot?.checkedExercises?.[`2026-11-18_${id}`]
    ).length
  },
  populations30d: null,
  periods: {}
};

{
  const w30 = windowFor('30d', end, first);
  const span =
    Math.round((new Date(`${w30.end}T12:00:00`) - new Date(`${w30.start}T12:00:00`)) / 86400000) + 1;
  const prevEnd = (() => {
    const d = new Date(`${w30.start}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const prevStart = (() => {
    const d = new Date(`${prevEnd}T12:00:00`);
    d.setDate(d.getDate() - (span - 1));
    return d.toISOString().slice(0, 10);
  })();
  report.populations30d = reconcilePopulationTable(snapshot, w30, {
    start: prevStart,
    end: prevEnd
  });
}

for (const period of PERIODS) {
  const window = windowFor(period, end, first);
  const t0 = Date.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot,
    period,
    window,
    getExerciseNameById: getName,
    activeProgram: program
  });
  const ms = Date.now() - t0;
  const all = bundle.all || [];
  const selected = bundle.selected || [];
  const accessible = bundle.accessibleCatalog?.accessible || selected;
  const collectives = all.filter((d) => /disc_collective_return/i.test(d.kind || ''));
  const monthly = all.filter((d) => /program_family_volume/i.test(d.kind || ''));
  const variants = all.filter((d) => /disc_variant_mix_shift|variant_mix/i.test(d.kind || ''));
  const collectiveObs = collectives[0]?.observedCount ?? null;
  const confDates = collectives[0]?.confirmationDates || null;
  report.periods[period] = {
    window,
    ms,
    counts: {
      all: all.length,
      selected: selected.length,
      accessible: accessible.length,
      collective: collectives.length,
      monthlyFamily: monthly.length,
      variantMix: variants.length
    },
    reconciliationDelta: {
      selectedMinusAccessible: selected.length - accessible.length,
      allMinusSelected: all.length - selected.length
    },
    collectives: collectives.map(slim),
    monthlyFamily: monthly.map(slim),
    variants: variants.slice(0, 5).map(slim),
    priority: selected.map(slim)
  };
  console.log(
    `[${period}] all=${all.length} sel=${selected.length} collective=${collectives.length} monthly=${monthly.length} variants=${variants.length} (${ms}ms)`
  );
  if (collectives[0]) {
    console.log('  collective title:', collectives[0].title);
    console.log('  collective obs:', collectiveObs, 'confirm:', confDates);
    console.log('  collective body:', String(collectives[0].body || '').slice(0, 160));
  }
  if (monthly[0]) {
    console.log('  monthly title:', monthly[0].title);
  }
}

const outDir = path.join(root, 'artifacts/analysis-eval');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'mission22-replay-eight.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
// Alias de continuité
fs.writeFileSync(path.join(outDir, 'mission21-replay-eight.json'), JSON.stringify(report, null, 2), 'utf8');
fs.writeFileSync(path.join(outDir, 'mission19-replay-eight.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote', outPath);
console.log(report.edition, report.mission, 'fp', report.fingerprint?.digest || report.fingerprint);
