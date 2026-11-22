import fs from 'fs';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { runExerciseFormatConsolidationShadow } from '../src/utils/sport/exerciseFormatConsolidation.js';
import { windowFor } from '../src/utils/sport/evaluation/incrementalP6Replay.js';

const TARGETS = ['302', '304', '306', '307', '308', '1599606959', '1735485569', '369862756', '1250363242'];
const raw = JSON.parse(
  fs.readFileSync(
    process.env.USERPROFILE + '/Downloads/momentum-sport-backup-2026-11-19.json',
    'utf8'
  )
);
const snapshot = raw.data;
const names = new Map();
for (const day of Object.values(raw.sportExport?.dailyJournal || {})) {
  for (const ex of day.exercises || []) {
    if (ex?.id && ex?.name) names.set(String(ex.id), ex.name);
  }
}
const getName = (id) => names.get(String(id)) || '';
const end = '2026-11-19';
const first = Object.keys(snapshot.reps)
  .map((k) => k.slice(0, 10))
  .filter((d) => /^\d{4}/.test(d))
  .sort()[0];
const window = windowFor('30d', end, first);

const shadow = runExerciseFormatConsolidationShadow({
  snapshot,
  window,
  period: '30d',
  getExerciseNameById: getName
});

const targetPhen = (shadow.phenomena || []).filter((p) => TARGETS.includes(String(p.exerciseId)));
console.log(
  'shadow targets',
  targetPhen.map((p) => ({
    id: p.exerciseId,
    name: p.exerciseName,
    publish: p.publish,
    reason: p.publishReason,
    gap: p.gap,
    mechanism: p.mechanism,
    dates: p.claimEvidenceDates,
    state: p.state
  }))
);
console.log(
  'abstentions targets',
  (shadow.abstentions || []).filter((a) => TARGETS.includes(String(a.exerciseId)))
);

const bundle = buildPeriodDiscoveryBundle({
  snapshot,
  period: '30d',
  window,
  getExerciseNameById: getName
});
const all = bundle.all || [];
console.log(
  'bundle target consol',
  all
    .filter((d) => TARGETS.includes(String(d.metrics?.exerciseId || '')))
    .map((d) => ({ kind: d.kind, id: d.metrics.exerciseId, ret: d.metrics.returnDate, gap: d.metrics.gapDays }))
);
console.log(
  'collective',
  all
    .filter((d) => /collective/i.test(d.kind || ''))
    .map((d) => ({
      title: d.title,
      cluster: d.metrics?.exploration?.episodeClusterDate,
      named: d.metrics?.namedMoves?.map((m) => m.name)
    }))
);

const returnLike = all.filter(
  (d) =>
    Number(d.metrics?.gapDays) >= 7 ||
    /return|format_consolidation|emergence/i.test(d.kind || '')
);
const byDate = {};
for (const d of returnLike) {
  const dt = d.metrics?.returnDate || d.metrics?.date || '?';
  byDate[dt] = (byDate[dt] || 0) + 1;
}
console.log('returnLike by date', byDate, 'n', returnLike.length);
