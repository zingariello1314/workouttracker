import fs from 'fs';
import { extractSessionTemplates } from '../src/utils/sport/sessionStructureGraph.js';
import { matchSessionToProgramSlot } from '../src/utils/sport/sessionSlotMatching.js';
import { buildSessionCatalog } from '../src/utils/sport/recapPersonalBaselines.js';
import { decomposeMonthlyProgramChange } from '../src/utils/sport/monthlyProgramComposition.js';

const raw = JSON.parse(
  fs.readFileSync('artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json', 'utf8')
);
const snap = raw.data;
const names = new Map();
for (const day of Object.values(raw?.sportExport?.dailyJournal || {})) {
  for (const exercise of day.exercises || []) {
    const id = exercise?.id ?? exercise?.exerciseId;
    if (id != null && exercise?.name) names.set(String(id), exercise.name);
  }
}
// Also from program
const programs = snap.programs || {};
const program =
  snap.activeProgram ||
  (snap.activeProgramId && programs[snap.activeProgramId]) ||
  Object.values(programs).find((p) => p?.status === 'active') ||
  Object.values(programs)[0];
console.log('program', program?.name, 'id', program?.id);
const tpls = extractSessionTemplates(program);
console.log(
  'templates',
  tpls.map((t) => ({
    day: t.dayKey,
    name: t.name,
    keys: t.exerciseKeys?.slice(0, 4),
    ids: (t.exercises || []).slice(0, 3).map((e) => e.id || e.exerciseId || e.originalId)
  }))
);

const getName = (id) => names.get(String(id)) || '';
const cat = buildSessionCatalog({ snapshot: snap, getExerciseNameById: getName, endYmd: '2026-11-21' });
const sample = cat.filter((s) => s.date >= '2026-11-01').slice(0, 5);
for (const s of sample) {
  const enriched = {
    ...s,
    exercises: (s.exercises || []).map((e) => ({
      ...e,
      name: e.name || getName(e.id) || ''
    }))
  };
  const m = matchSessionToProgramSlot(enriched, program, { allowProbable: true });
  console.log(s.date, 'reps', s.totalReps, 'ex', enriched.exercises.slice(0, 3).map((e) => `${e.id}:${e.name}`), {
    status: m.status,
    overlap: m.primary?.overlap || m.candidates?.[0]?.overlap,
    slot: m.primary?.sessionName || m.candidates?.[0]?.sessionName,
    axis: m.primary?.matchAxis
  });
}

const decomp = decomposeMonthlyProgramChange({
  catalog: cat,
  window: { start: '2026-10-23', end: '2026-11-21' },
  previousWindow: { start: '2026-09-23', end: '2026-10-22' },
  activeProgram: program,
  getExerciseNameById: getName
});
console.log({
  templatesUsed: decomp.templatesUsed,
  familyClusters: decomp.familyClusters,
  attribution: decomp.attribution,
  contributions: decomp.contributions.slice(0, 6).map((c) => ({
    id: c.familyId,
    name: c.familyName,
    delta: c.volumeDelta,
    freq: c.freqEffect,
    content: c.contentEffect,
    days: `${c.previousDays}->${c.recentDays}`
  })),
  titleDirection: decomp.direction
});
