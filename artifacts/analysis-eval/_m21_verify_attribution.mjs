import { readFileSync, writeFileSync } from 'fs';
import {
  measurePopulationWindow,
  POPULATION_ID
} from '../../src/utils/sport/canonicalAnalyticalPopulations.js';
import { decomposeMonthlyProgramChange } from '../../src/utils/sport/monthlyProgramComposition.js';
import { buildSessionCatalog } from '../../src/utils/sport/recapPersonalBaselines.js';
import { exerciseDatabase } from '../../src/data/exerciseDatabase.js';
import { discoveryFromMonthlyComposition } from '../../src/utils/sport/monthlyProgramComposition.js';
import { buildMigratedAnalyticalFacts } from '../../src/utils/sport/analyticalFacts.js';

const snap = JSON.parse(
  readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
).data;

const getName = (id) => exerciseDatabase?.[String(id)]?.name || String(id);
const catalog = buildSessionCatalog({
  snapshot: snap,
  getExerciseNameById: getName,
  endYmd: '2026-11-21'
});
const program =
  snap.activeProgram ||
  (Array.isArray(snap.programs) ? snap.programs.find((p) => p?.active) || snap.programs[0] : null);

const window = { start: '2026-10-23', end: '2026-11-21' };
const previousWindow = { start: '2026-09-23', end: '2026-10-22' };
const decomp = decomposeMonthlyProgramChange({
  catalog,
  window,
  previousWindow,
  activeProgram: program,
  getExerciseNameById: getName
});
const facts = buildMigratedAnalyticalFacts({
  window,
  previousWindow,
  classicVolume: decomp.recent?.volume,
  previousClassicVolume: decomp.previous?.volume,
  classicDays: decomp.recent?.trainingDays,
  previousClassicDays: decomp.previous?.trainingDays,
  decomp
});
const card = discoveryFromMonthlyComposition(decomp, { voiceKey: 'month', sharedFacts: facts });
const pops = measurePopulationWindow(snap, previousWindow);
const classic = pops.populations.find((p) => p.id === POPULATION_ID.CLASSIC_SESSION);
const gtg = pops.populations.find((p) => p.id === POPULATION_ID.GTG_SYNC_DEDUCTION);
const inclusive = pops.populations.find((p) => p.id === POPULATION_ID.STRENGTH_INCLUSIVE);

const sumRegistry = (decomp.contributionRegistry || []).reduce(
  (s, c) => s + (Number(c.volumeDelta) || 0),
  0
);
const out = {
  populationsPrev30: {
    classic: classic?.value,
    gtgDeduction: gtg?.value,
    inclusive: inclusive?.value,
    classicOk: classic?.value === 3881
  },
  attribution: decomp.attribution,
  deltaVolume: decomp.deltaVolume,
  reconciliationGap: decomp.reconciliationGap,
  sumContributionRegistry: sumRegistry,
  reconciled: sumRegistry === decomp.deltaVolume,
  proseRemainder: decomp.proseRemainder,
  driversVolumeSum: decomp.driversVolumeSum,
  coverageComparability: decomp.coverageComparability,
  conclusionScope: decomp.conclusionScope,
  contributionCount: (decomp.contributionRegistry || []).length,
  topContributions: (decomp.contributionRegistry || []).slice(0, 6).map((c) => ({
    familyId: c.familyId,
    familyName: c.familyName,
    volumeDelta: c.volumeDelta,
    freqEffect: c.freqEffect,
    contentEffect: c.contentEffect,
    residual: c.residual,
    recentDays: c.recentDays,
    previousDays: c.previousDays
  })),
  cardObserved: (card?.metrics?.observedValues || []).map((o) => ({
    id: o.id,
    value: o.value
  })),
  sharedFactCount: (card?.metrics?.sharedFacts || []).length,
  phenomenonId: card?.metrics?.phenomenonId || null
};

writeFileSync(
  'artifacts/analysis-eval/mission21-attribution-proof.json',
  JSON.stringify(out, null, 2),
  'utf8'
);
console.log(JSON.stringify(out, null, 2));
