/**
 * Reproduction du cas v27 : parent recent30 supprimé → enfants orphelins.
 * Doit échouer sur le comportement actuel si la réconciliation est cassée.
 */
import { insightsFromP6 } from '../../../src/utils/sport/p6Publication.js';
import { marginalValue } from '../../../src/utils/sport/collectiveSelection.js';
import { substantiveEquivalence, subjectKey } from '../../../src/utils/sport/discoveryIdentity.js';
import { relateClaims } from '../../../src/utils/sport/narrativeCoherenceEngine.js';

function claimFor(discovery, windowId) {
  return {
    id: `c:${discovery.id}`,
    statement: discovery.title,
    status: 'supported',
    subject: { key: discovery.metrics?.subjectKey || null, id: discovery.metrics?.subjectKey || null },
    subjectId: discovery.metrics?.subjectKey || null,
    scope: {
      start: discovery.metrics?.observationWindow?.start || '2026-10-01',
      end: discovery.metrics?.observationWindow?.end || '2026-11-20',
      windowId
    },
    proof: {
      observedValues: discovery.metrics?.observedValues || [{ id: 'meanReps', value: 48 }],
      sourceEvents: []
    }
  };
}

const recent = {
  kind: 'disc_composed_parallel_trajectories',
  title: 'Hyperextension : 2 trajectoires parallèles (~4 séances)',
  body: 'recent30 body',
  nature: 'trajectory',
  family: 'repertoire',
  informativeValue: 55,
  id: 'parallel_traj|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz|2',
  occurrenceId: 'parallel_traj|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz|2',
  phenomenonId: 'parallel|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz',
  metrics: {
    subjectKey: 'parallel:ex:1979012181+ex:703294235',
    parallelSubjects: ['ex:1979012181', 'ex:703294235'],
    analyticalAspect: 'span:recent30|sess:4|cal:1gjmgdz',
    phenomenonKey: 'parallel|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz',
    name: 'Hyperextension',
    observationWindow: { start: '2026-10-26', end: '2026-11-20', spanDays: 25 },
    meanReps: 48,
    volumeBasis: 'per_session_mean',
    observedValues: [{ id: 'meanReps', value: 48, unit: 'reps' }],
    occurrenceId: 'parallel_traj|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz|2'
  },
  p6Disposition: 'exact_duplicate_suppressed',
  collapsedInto: 'parallel_traj|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq|2'
};
recent.claim = claimFor(recent, '2026-10-26_2026-11-20');

const quarter = {
  kind: 'disc_composed_parallel_trajectories',
  title: 'Hyperextension : 2 trajectoires parallèles (~8 séances)',
  body: 'quarter body',
  nature: 'trajectory',
  family: 'repertoire',
  informativeValue: 80,
  id: 'parallel_traj|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq|2',
  occurrenceId: 'parallel_traj|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq|2',
  phenomenonId: 'parallel|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq',
  metrics: {
    subjectKey: 'parallel:ex:1979012181+ex:703294235',
    parallelSubjects: ['ex:1979012181', 'ex:703294235'],
    analyticalAspect: 'span:quarter|sess:8|cal:1aie1tq',
    phenomenonKey: 'parallel|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq',
    name: 'Hyperextension',
    observationWindow: { start: '2026-09-28', end: '2026-11-20', spanDays: 53 },
    meanReps: 48,
    volumeBasis: 'per_session_mean',
    observedValues: [{ id: 'meanReps', value: 48, unit: 'reps' }],
    occurrenceId: 'parallel_traj|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq|2'
  },
  p6Disposition: 'consolidated',
  childIds: [
    'disc_emergence|ex:1979012181|fact:emergence|1979012181|aspect:default',
    'disc_emergence|ex:703294235|fact:emergence|703294235|aspect:default'
  ]
};
quarter.claim = claimFor(quarter, '2026-09-28_2026-11-20');

const childA = {
  kind: 'disc_structural_memory',
  title: 'Hyperextension: 4 séances sur ces 30 jours',
  body: '192 vs 96',
  nature: 'trajectory',
  family: 'structural_memory',
  informativeValue: 28,
  id: 'disc_structural_memory|ex:1979012181|dates:2026-10-30,2026-11-06,2026-11-13,2026-11-20|aspect:default',
  occurrenceId: 'disc_structural_memory|ex:1979012181|dates:2026-10-30,2026-11-06,2026-11-13,2026-11-20|aspect:default',
  p6Disposition: 'deepening_of_collective',
  collapsedInto: recent.id,
  hierarchyLink: {
    ok: true,
    reason: 'verified_parallel_storage_trajectories',
    proof: { parentId: recent.id, childSubject: 'ex:1979012181', parallelSubjects: ['ex:1979012181', 'ex:703294235'] }
  },
  metrics: {
    exerciseId: '1979012181',
    name: 'Hyperextension',
    observedValues: [{ id: 'windowMeanPerSession', value: 48 }]
  }
};
childA.claim = {
  id: 'ca',
  statement: childA.title,
  status: 'supported',
  subject: { key: 'ex:1979012181' },
  scope: { start: '2026-10-26', end: '2026-11-20', windowId: 'cA' },
  proof: { observedValues: childA.metrics.observedValues, sourceEvents: [] }
};

const childB = {
  ...childA,
  id: 'disc_structural_memory|ex:703294235|dates:2026-10-26,2026-11-02,2026-11-09,2026-11-16|aspect:default',
  occurrenceId: 'disc_structural_memory|ex:703294235|dates:2026-10-26,2026-11-02,2026-11-09,2026-11-16|aspect:default',
  metrics: { ...childA.metrics, exerciseId: '703294235' },
  hierarchyLink: {
    ok: true,
    reason: 'verified_parallel_storage_trajectories',
    proof: { parentId: recent.id, childSubject: 'ex:703294235', parallelSubjects: ['ex:1979012181', 'ex:703294235'] }
  }
};
childB.claim = {
  id: 'cb',
  statement: childB.title,
  status: 'supported',
  subject: { key: 'ex:703294235' },
  scope: { start: '2026-10-26', end: '2026-11-20', windowId: 'cB' },
  proof: { observedValues: [{ id: 'windowMeanPerSession', value: 48 }], sourceEvents: [] }
};

console.log('subjectKey recent', subjectKey(recent));
console.log('subjectKey quarter', subjectKey(quarter));
console.log('substantive', substantiveEquivalence(recent, quarter));
console.log('relateClaims', relateClaims(recent.claim, quarter.claim));
console.log(
  'marginal',
  marginalValue({ discovery: recent, claim: recent.claim }, [{ discovery: quarter, claim: quarter.claim }])
);

const p6 = {
  counters: { reconciled: true },
  priority: [quarter],
  reserve: [childA, childB],
  sources: [recent],
  blocked: []
};

const out = insightsFromP6(p6, { period: '3m' });
const published = [
  ...(out.shortTerm || []),
  ...(out.mediumTerm || []),
  ...(out.longTerm || []),
  ...(out.accessibleReserve || [])
];
const kids = published.filter((c) => /structural_memory/.test(c.id));
const parents = published.filter((c) => /parallel_traj/.test(c.id));
const detach = (out.publicationDispositions || []).filter((d) => d.disposition === 'parent_detached');
console.log(
  JSON.stringify(
    {
      authority: out.publicationAuthority,
      parentIdsPublished: parents.map((p) => p.id),
      kids: kids.map((k) => ({
        id: k.id,
        parentId: k.parentId,
        collapsedInto: k.collapsedInto,
        hierarchyOk: k.hierarchyLink?.ok,
        hierarchyReason: k.hierarchyLink?.reason,
        disposition: k.disposition
      })),
      detachDisps: detach.map((d) => ({ id: d.id, reason: d.reason, collapsedInto: d.collapsedInto })),
      orphans: kids.filter(
        (k) =>
          k.parentId &&
          k.hierarchyLink?.ok &&
          !published.some((p) => p.id === k.parentId)
      ).map((k) => k.id)
    },
    null,
    2
  )
);
