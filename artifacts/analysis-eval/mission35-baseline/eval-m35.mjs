import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGameCCollective } from '../../../src/utils/sport/evaluation/gameCCollective.js';
import { normalizeTitleForCompare } from '../../../src/utils/sport/evaluation/domEightPeriodVerify.js';
import { composeCollectiveReturnReading } from '../../../src/utils/sport/phenomenonComposition.js';
import { claimFromDiscovery, exerciseScopedMetricId } from '../../../src/utils/sport/analyticalClaim.js';
import { validateCardClaimConsistency } from '../../../src/utils/sport/evaluation/claimAssertionIdentity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, 'zip');
const audit = JSON.parse(fs.readFileSync(path.join(base, 'ANALYTICAL_AUDIT.json'), 'utf8'));
const cards = Object.values(audit.cardRegistry || {});
const periods = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];
const periodPacks = periods.map((period) => {
  const list = cards.filter((c) => c.period === period);
  const ordered = list.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const pri = ordered.filter((c) => c.role === 'priority').slice(0, 11);
  const reserve = ordered.filter((c) => !pri.includes(c));
  return {
    period,
    insights: {
      shortTerm: pri.length ? pri : ordered.slice(0, 11),
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: reserve
    }
  };
});
const gameC = runGameCCollective({ periodPacks });
const out = {
  gameC: {
    pass: gameC.pass,
    textualDuplicatesAccessible: gameC.textualDuplicatesAccessible,
    exactDuplicatesAccessible: gameC.exactDuplicatesAccessible,
    unexplainedRegistryIds: gameC.unexplainedRegistryIds,
    perPeriod: (gameC.cases || []).map((c) => ({
      period: c.period,
      lost: c.unexplainedCount,
      published: c.publishedAccessible
    }))
  },
  dipsOk: validateCardClaimConsistency(
    {
      kind: 'disc_repertoire',
      title: 't',
      body: 'b',
      observedValues: [
        { id: exerciseScopedMetricId('monthReps', { id: 103, name: 'Dips' }), value: 192, unit: 'reps' },
        { id: exerciseScopedMetricId('monthReps', { id: 503, name: 'Dips' }), value: 144, unit: 'reps' }
      ],
      metrics: {
        observedValues: [
          { id: exerciseScopedMetricId('monthReps', { id: 103, name: 'Dips' }), value: 192, unit: 'reps' },
          { id: exerciseScopedMetricId('monthReps', { id: 503, name: 'Dips' }), value: 144, unit: 'reps' }
        ]
      }
    },
    claimFromDiscovery(
      {
        kind: 'disc_repertoire',
        title: 't',
        body: 'b',
        metrics: {
          observedValues: [
            { id: exerciseScopedMetricId('monthReps', { id: 103, name: 'Dips' }), value: 192, unit: 'reps' },
            { id: exerciseScopedMetricId('monthReps', { id: 503, name: 'Dips' }), value: 144, unit: 'reps' }
          ]
        }
      },
      { period: '3m' }
    )
  ).ok,
  domNorm:
    normalizeTitleForCompare(
      'Repère général: ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou '
    ) ===
    normalizeTitleForCompare(
      'Repère général: ce placement est très tardif par rapport à une plage classique de coucher (22 h 30–0 h 30) ou'
    ),
  collective: composeCollectiveReturnReading({
    namedMoves: [
      { name: 'Curl', exerciseId: 1, prevReps: 40, currentReps: 42, gapDays: 14 },
      { name: 'Pompes', exerciseId: 2, prevReps: 50, currentReps: 48, gapDays: 14 },
      { name: 'Squat', exerciseId: 3, prevReps: 30, currentReps: 30, gapDays: 14 }
    ],
    dates: ['2026-10-13'],
    confirmationDates: ['2026-10-20', '2026-11-17', '2026-11-24'],
    readingMode: 'confirmation',
    sessionFamilyLinked: true,
    windowStart: '2026-11-21',
    windowEnd: '2026-11-27'
  }).conclusion.slice(0, 280)
};
const live = JSON.parse(fs.readFileSync(path.join(base, 'replay/LIVE_INPUTS.json'), 'utf8'));
out.live = {
  digest: live.fingerprints?.digest,
  reproducibility: live.reproducibility,
  hasSchedule: Boolean(live.program?.schedule),
  programKeys: live.program ? Object.keys(live.program).slice(0, 20) : [],
  programsIndex: live.programsIndex,
  worker: live.parameters?.worker
};
fs.writeFileSync(path.join(__dirname, 'eval-m35-result.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
