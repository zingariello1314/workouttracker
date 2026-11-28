/**
 * Rejeu déterministe du programme depuis LIVE_INPUTS (series présentes).
 * Compare plannedReps / familles au programme-structure exporté.
 */
import fs from 'fs';
import { buildProgramSessionGraph, extractSessionTemplates } from '../../../src/utils/sport/sessionStructureGraph.js';

const root = 'c:/Users/zinga/Desktop/momentum';
const live = JSON.parse(
  fs.readFileSync(`${root}/artifacts/analysis-eval/mission37-baseline/zip/replay/LIVE_INPUTS.json`, 'utf8')
);
const exported = JSON.parse(
  fs.readFileSync(
    `${root}/artifacts/analysis-eval/mission37-baseline/zip/program-understanding/program-structure.json`,
    'utf8'
  )
);

const program = live.program;
const graph = buildProgramSessionGraph(program);
const templates = extractSessionTemplates(program);

const plannedByDay = Object.fromEntries(
  templates.map((t) => [
    t.dayKey,
    {
      name: t.name,
      plannedReps: t.plannedReps,
      plannedSets: t.plannedSets,
      strengthExerciseCount: t.strengthExerciseCount,
      exerciseCount: t.exerciseCount
    }
  ])
);

const exportedDays = exported?.days || exported?.templates || exported?.schedule || null;
const comparisons = [];

// program-structure.json shapes vary — inspect keys
const exportShape = {
  topKeys: Object.keys(exported || {}),
  sample: null
};

if (Array.isArray(exported?.templates)) {
  for (const t of exported.templates) {
    const local = plannedByDay[t.dayKey] || plannedByDay[t.day] || null;
    comparisons.push({
      dayKey: t.dayKey || t.day,
      exportedPlannedReps: t.plannedReps ?? t.reps ?? null,
      replayPlannedReps: local?.plannedReps ?? null,
      match:
        local != null &&
        Number(local.plannedReps) === Number(t.plannedReps ?? t.reps)
    });
  }
} else if (exported?.byDay && typeof exported.byDay === 'object') {
  for (const [dayKey, row] of Object.entries(exported.byDay)) {
    const local = plannedByDay[dayKey];
    comparisons.push({
      dayKey,
      exportedPlannedReps: row.plannedReps ?? row.reps ?? null,
      replayPlannedReps: local?.plannedReps ?? null,
      match: local != null && Number(local.plannedReps) === Number(row.plannedReps ?? row.reps)
    });
  }
} else if (exported?.sessions && Array.isArray(exported.sessions)) {
  for (const s of exported.sessions) {
    const dayKey = s.dayKey || s.day;
    const local = plannedByDay[dayKey];
    comparisons.push({
      dayKey,
      exportedPlannedReps: s.plannedReps ?? s.totalPlannedReps ?? null,
      replayPlannedReps: local?.plannedReps ?? null,
      match:
        local != null &&
        Number(local.plannedReps) === Number(s.plannedReps ?? s.totalPlannedReps)
    });
  }
}

exportShape.sample = JSON.stringify(exported).slice(0, 800);

const familyCount = graph.families?.filter((f) => f.size >= 2).length ?? 0;
const seriesCoverage = (() => {
  let total = 0;
  let withSeries = 0;
  const schedule = program?.schedule || {};
  for (const day of Object.values(schedule)) {
    for (const ex of day.exercises || []) {
      total += 1;
      if (ex.series) withSeries += 1;
    }
  }
  return { total, withSeries };
})();

const report = {
  schema: 'momentum.mission37.independentProgramReplay.v1',
  ok: comparisons.length > 0 ? comparisons.every((c) => c.match) : null,
  seriesCoverage,
  graphAvailable: graph.available,
  templateCount: graph.templateCount,
  familyCountMulti: familyCount,
  plannedByDay,
  familyMembers: (graph.families || [])
    .filter((f) => f.size >= 2)
    .map((f) => ({ id: f.familyId, members: f.members, size: f.size })),
  comparisons,
  exportShape,
  reproducibility: live.reproducibility || null,
  fingerprints: live.fingerprints || null,
  limits: [
    comparisons.length === 0
      ? 'Format program-structure.json non aligné sur templates dayKey — comparaison plannedReps partielle'
      : null,
    'Rejeu 8 horizons complets (claims/mémoire) non exécuté ici — isolé au programme déterministe',
    'Mémoire éditoriale évolutive exclue volontairement'
  ].filter(Boolean)
};

fs.writeFileSync(
  `${root}/artifacts/analysis-eval/mission37-baseline/independent-program-replay.json`,
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify({
  ok: report.ok,
  seriesCoverage,
  templateCount: report.templateCount,
  familyCountMulti: report.familyCountMulti,
  comparisons: report.comparisons,
  plannedByDay,
  limits: report.limits
}, null, 2));
