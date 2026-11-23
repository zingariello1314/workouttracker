/**
 * Mission 22 — Parité rejeu vs résolveur enrichi (même ancre, même backup).
 */
import { readFileSync, writeFileSync } from 'fs';
import { decomposeMonthlyProgramChange } from '../../src/utils/sport/monthlyProgramComposition.js';
import { buildSessionCatalog } from '../../src/utils/sport/recapPersonalBaselines.js';
import { exerciseDatabase } from '../../src/data/exerciseDatabase.js';
import { resolveStorageExerciseIdentity } from '../../src/utils/sport/resolveStorageExerciseIdentity.js';

const snap = JSON.parse(
  readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
).data;
const raw = JSON.parse(
  readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
);

function resolverBasic() {
  const names = new Map();
  for (const day of Object.values(raw?.sportExport?.dailyJournal || {})) {
    for (const exercise of day.exercises || []) {
      const id = exercise?.id ?? exercise?.exerciseId;
      if (id != null && exercise?.name) names.set(String(id), exercise.name);
    }
  }
  return (id) => {
    const key = String(id);
    if (names.has(key)) return names.get(key);
    return exerciseDatabase?.[key]?.name || '';
  };
}

function resolverEnriched() {
  const basic = resolverBasic();
  return (id) => {
    const fromBasic = basic(id);
    if (fromBasic && !/^\d+$/.test(fromBasic)) return fromBasic;
    try {
      const idn = resolveStorageExerciseIdentity(id, {
        snapshot: snap,
        getExerciseNameById: basic
      });
      return idn?.resolvedName || fromBasic || '';
    } catch {
      return fromBasic || '';
    }
  };
}

function run(label, getName, end = '2026-11-21') {
  const catalog = buildSessionCatalog({
    snapshot: snap,
    getExerciseNameById: getName,
    endYmd: end
  });
  const program =
    snap.activeProgram ||
    (Array.isArray(snap.programs) ? snap.programs.find((p) => p?.active) || snap.programs[0] : null);
  const window = { start: '2026-10-23', end };
  const previousWindow = { start: '2026-09-23', end: '2026-10-22' };
  const decomp = decomposeMonthlyProgramChange({
    catalog,
    window,
    previousWindow,
    activeProgram: program,
    getExerciseNameById: getName
  });
  return {
    label,
    end,
    deltaVolume: decomp.deltaVolume,
    recentVolume: decomp.recent?.volume,
    previousVolume: decomp.previous?.volume,
    attribution: decomp.attribution,
    reconciliationGap: decomp.reconciliationGap,
    top: (decomp.contributionRegistry || []).slice(0, 6).map((c) => ({
      familyId: c.familyId,
      familyName: c.familyName,
      volumeDelta: c.volumeDelta,
      freqEffect: c.freqEffect,
      contentEffect: c.contentEffect,
      levelHint: c.evolution
    })),
    levelCounts: decomp.attribution?.recentLevelCounts || null
  };
}

const report = {
  schema: 'momentum.m22AttributionParity.v1',
  generatedAt: new Date().toISOString(),
  anchorNote: 'Backup 21 nov — comparer aussi ancre 22 nov si export utilisateur différent',
  runs: [
    run('resolver_basic_journal_db', resolverBasic(), '2026-11-21'),
    run('resolver_enriched_identity', resolverEnriched(), '2026-11-21'),
    run('resolver_enriched_identity_end22', resolverEnriched(), '2026-11-22')
  ]
};

writeFileSync(
  'artifacts/analysis-eval/mission22-attribution-parity.json',
  JSON.stringify(report, null, 2),
  'utf8'
);
console.log(JSON.stringify(report, null, 2));
