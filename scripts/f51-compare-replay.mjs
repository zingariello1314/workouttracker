/**
 * F5.1 — Compare packs et relations d’identité (7d/30d/3m/6m).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import {
  relateExerciseIdentities,
  IDENTITY_RELATION
} from '../src/utils/sport/recapEditorialIdentity.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const nameById = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
    'utf8'
  )
);
const getName = (id) => nameById[String(id)] || nameById[id] || '';

const windows = {
  '7d': { start: '2026-10-24', end: '2026-10-30' },
  '30d': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' },
  '6m': { start: '2026-05-01', end: '2026-10-30' }
};

const f5Brief = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/moteur analyse v1/fixtures/f5-replay-brief.json'),
    'utf8'
  )
);

const out = { generatedAt: new Date().toISOString(), note: 'F5.1 identity-safe selection', periods: {} };

for (const [period, window] of Object.entries(windows)) {
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31'
  });
  const selected = bundle.selected || [];
  const pairs = [];
  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const rel = relateExerciseIdentities(selected[i], selected[j]);
      if (rel.relation !== IDENTITY_RELATION.DISTINCT && rel.relation !== IDENTITY_RELATION.INDETERMINATE) {
        pairs.push({
          a: { kind: selected[i].kind, id: selected[i].metrics?.exerciseId, title: selected[i].title },
          b: { kind: selected[j].kind, id: selected[j].metrics?.exerciseId, title: selected[j].title },
          relation: rel.relation,
          proof: rel.proof
        });
      }
    }
  }
  const focusIds = selected
    .filter((d) => ['103', '503', '104', '504'].includes(String(d.metrics?.exerciseId)))
    .map((d) => ({
      kind: d.kind,
      exerciseId: d.metrics?.exerciseId,
      title: d.title,
      name: d.metrics?.name
    }));

  const before = f5Brief.periods?.[period];
  out.periods[period] = {
    selected: selected.length,
    selectedKinds: selected.map((d) => d.kind),
    titles: selected.map((d) => d.title),
    f5BeforeSelected: before?.selected ?? null,
    f5BeforeTitles: before?.titles ?? null,
    focusIdCards: focusIds,
    nonDistinctPairs: pairs,
    unresolvedNames: selected.filter((d) => /\bun mouvement\b/i.test(`${d.title} ${d.metrics?.name || ''}`))
      .length,
    nameRepairs: selected.filter((d) => d.metrics?.nameRepair).length,
    rejectedByReason: bundle.debug?.f5?.rejectedByReason || null
  };
}

// Audit fixture IDs
function auditPair(idA, idB, label) {
  const reps = snap.reps || {};
  const dates = (id) =>
    Object.keys(reps)
      .filter((k) => k.endsWith(`_${id}`))
      .map((k) => k.slice(0, 10));
  const a = new Set(dates(idA));
  const b = new Set(dates(idB));
  const overlap = [...a].filter((d) => b.has(d));
  return {
    label,
    idA,
    idB,
    nameA: nameById[idA],
    nameB: nameById[idB],
    sessionsA: a.size,
    sessionsB: b.size,
    dateOverlap: overlap.length,
    classification:
      overlap.length === 0 && nameById[idA] === nameById[idB]
        ? 'same_display_name_distinct_storage_no_proven_alias'
        : 'needs_manual_review',
    verdict: 'DO_NOT_MERGE_ON_NAME_ALONE'
  };
}

out.identityAudit = {
  dips: auditPair('103', '503', 'Dips'),
  pompesDeclinees: auditPair('104', '504', 'Pompes déclinées'),
  releves: auditPair('106', '505', 'Relevés de genoux à la barre')
};

const outDir = path.join(root, 'docs/analyses-documentation/moteur analyse v1/fixtures');
fs.writeFileSync(path.join(outDir, 'f51-replay-compare.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ audit: out.identityAudit, periods: Object.fromEntries(
  Object.entries(out.periods).map(([k, v]) => [k, {
    n: v.selected,
    f5n: v.f5BeforeSelected,
    focus: v.focusIdCards,
    homonymPairs: v.nonDistinctPairs.filter((p) => p.relation === 'sameDisplayName'),
    unresolved: v.unresolvedNames
  }])
) }, null, 2));
