import fs from 'fs';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { windowFor } from '../src/utils/sport/evaluation/incrementalP6Replay.js';
import { exerciseDatabase } from '../src/data/exerciseDatabase.js';

const raw = JSON.parse(
  fs.readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
);
const snap = raw.data;
const names = new Map();
for (const day of Object.values(raw?.sportExport?.dailyJournal || {})) {
  for (const ex of day.exercises || []) {
    const id = ex?.id ?? ex?.exerciseId;
    if (id != null && ex?.name) names.set(String(id), ex.name);
  }
}
for (const day of Object.values(snap?.programs?.['default-program']?.schedule || snap?.activeProgram?.schedule || {})) {
  for (const ex of day?.exercises || []) {
    const id = ex?.originalId ?? ex?.id ?? ex?.exerciseId;
    if (id != null && ex?.name) names.set(String(id), ex.name);
  }
}
const getName = (id) => names.get(String(id)) || exerciseDatabase?.[String(id)]?.name || '';
const program =
  snap.activeProgram ||
  snap.programs?.['default-program'] ||
  Object.values(snap.programs || {})[0];
const window = windowFor('7d', '2026-11-21');
const bundle = buildPeriodDiscoveryBundle({
  snapshot: snap,
  period: '7d',
  window,
  getExerciseNameById: getName,
  activeProgram: program
});
const coll = (bundle.all || []).find((d) => /collective_return/i.test(d.kind));
console.log('BODY', String(coll?.body || '').slice(0, 500));
console.log({
  window,
  title: coll?.title,
  muscleBit: String(coll?.body || '').match(/groupes musculaires[^.]+\./i)?.[0],
  named: (coll?.metrics?.namedMoves || []).length,
  confirm: coll?.metrics?.confirmationDates,
  families: coll?.metrics?.exploration?.families || coll?.metrics?.composition?.families,
  compositionFamilies: coll?.metrics?.composition,
  sourceEvents: coll?.claim?.proof?.sourceEvents
});
