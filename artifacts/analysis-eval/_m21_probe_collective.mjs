import { readFileSync } from 'fs';
import { buildPeriodDiscoveryBundle } from '../../src/utils/sport/recapPeriodDiscoveries.js';
import { exerciseDatabase } from '../../src/data/exerciseDatabase.js';
import { windowFor } from '../../src/utils/sport/evaluation/incrementalP6Replay.js';
import { insightRejectReason } from '../../src/utils/sport/recapInsightValidate.js';
import { editorialValidateDiscovery } from '../../src/utils/sport/recapEditorialPolish.js';

const raw = JSON.parse(
  readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
);
const snap = raw.data;
const getName = (id) => exerciseDatabase?.[String(id)]?.name || '';
const program = snap.activeProgram || (snap.programs || [])[0];
const window = windowFor('7d', '2026-11-21', '2025-01-01');
const bundle = buildPeriodDiscoveryBundle({
  snapshot: snap,
  period: '7d',
  window,
  getExerciseNameById: getName,
  activeProgram: program
});
const c = (bundle.all || []).find((d) => /collective_return/i.test(d.kind));
const blob = [c?.title, c?.body, c?.evidence].join('\n');
const hits = blob.match(/\b\d{9,}\b/g) || [];
console.log(
  JSON.stringify(
    {
      rejectInsight: insightRejectReason(c, { voiceKey: 'week' }),
      rejectEditorial: editorialValidateDiscovery(c, { voiceKey: 'week' }),
      hits,
      evidence: c?.evidence,
      bodySlice: String(c?.body || '').slice(0, 500),
      selectedHas: (bundle.selected || []).some((d) => /collective_return/i.test(d.kind)),
      memory: c?.metrics?.memory,
      phenomenonId: c?.metrics?.phenomenonId
    },
    null,
    2
  )
);
