import { readFileSync } from 'fs';
import {
  measurePopulationWindow,
  POPULATION_ID
} from '../../src/utils/sport/canonicalAnalyticalPopulations.js';
import { decomposeMonthlyProgramChange } from '../../src/utils/sport/monthlyProgramComposition.js';
import { collectLifetimeRepHistory } from '../../src/utils/sport/athleteJourney.js';

const snap = JSON.parse(
  readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
).data;

const pack = measurePopulationWindow(snap, { start: '2026-09-23', end: '2026-10-22' });
const classic = pack.populations.find((p) => p.id === POPULATION_ID.CLASSIC_SESSION);
const gtg = pack.populations.find((p) => p.id === POPULATION_ID.GTG);
const inclusive = pack.populations.find((p) => p.id === POPULATION_ID.STRENGTH_INCLUSIVE);
console.log(
  JSON.stringify(
    {
      classic: classic?.value,
      gtg: gtg?.value,
      inclusive: inclusive?.value,
      classicDays: classic?.days,
      expectedClassic: 3881,
      classicOk: classic?.value === 3881
    },
    null,
    2
  )
);

const life = collectLifetimeRepHistory(snap, '2026-11-21');
const catalog = [];
life.forEach((sessions, date) => {
  const totalReps = sessions.reduce((s, x) => s + (x.reps || 0), 0);
  if (totalReps <= 0) return;
  catalog.push({
    date,
    totalReps,
    exercises: sessions.map((x) => ({
      id: x.id || x.exerciseId,
      name: x.name,
      reps: x.reps
    }))
  });
});
const decomp = decomposeMonthlyProgramChange({
  catalog,
  window: { start: '2026-10-23', end: '2026-11-21' },
  previousWindow: { start: '2026-09-23', end: '2026-10-22' },
  activeProgram: (snap.programs || [])[0] || null
});
const attr = decomp?.attribution || {};
const registry = decomp?.contributionRegistry || [];
const sumDrivers = registry.reduce((s, r) => s + (Number(r.volumeDelta) || 0), 0);
console.log(
  JSON.stringify(
    {
      ok: decomp?.ok,
      deltaVolume: decomp?.deltaVolume,
      sumDrivers,
      reconciliationGap: decomp?.reconciliationGap,
      recognizedVolumeShareRecent: attr.recognizedVolumeShareRecent,
      unattributedVolumeShareRecent: attr.unattributedVolumeShareRecent,
      partitionCoverageShareRecent: attr.partitionCoverageShareRecent,
      sessionRecognitionShareRecent: attr.sessionRecognitionShareRecent,
      historicalDocumentedShareRecent: attr.historicalDocumentedShareRecent,
      structuralRecognitionShareRecent: attr.structuralRecognitionShareRecent,
      probableKinShareRecent: attr.probableKinShareRecent,
      keys: Object.keys(attr),
      contributionCount: registry.length,
      top3: registry.slice(0, 3).map((c) => ({
        id: c.familyId,
        name: c.familyName,
        delta: c.volumeDelta
      })),
      proseRemainder: decomp?.proseRemainder,
      conclusionScope: decomp?.conclusionScope,
      coverageComparability: decomp?.coverageComparability
    },
    null,
    2
  )
);
