const fs = require('fs');
const path = require('path');
const base = __dirname;
const audit = JSON.parse(
  fs.readFileSync(
    path.join(base, 'momentum-ANALYTICAL_AUDIT-p6-sovereign-v27-2026-11-22T17-05-46-964Z.json'),
    'utf8'
  )
);

const PARENT_RECENT = 'parallel_traj|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz|2';
const PARENT_QUARTER = 'parallel_traj|ex:1979012181+ex:703294235|span:quarter|sess:8|cal:1aie1tq|2';

const cards = Object.entries(audit.cardRegistry || {}).map(([k, v]) => ({ key: k, ...v }));
const orphans = cards.filter(
  (c) =>
    (c.role === 'priority' || c.role === 'reserve') &&
    c.parentId &&
    c.hierarchyLink?.ok === true &&
    !cards.some((p) => p.period === c.period && (p.id === c.parentId || p.publicationId === c.parentId))
);

const disps = audit.dispositionsByPeriod?.['3m'] || [];
const list = Array.isArray(disps) ? disps : disps.items || [];
const parallel = list.filter((d) =>
  /1979012181|703294235|parallel_traj|structural_memory\|ex:(1979012181|703294235)/.test(
    `${d.id || ''} ${d.collapsedInto || ''} ${d.title || ''}`
  )
);

const parentCards = cards.filter(
  (c) => c.period === '3m' && /parallel_traj\|ex:1979012181/.test(c.id || '')
);
const childCards = cards.filter(
  (c) =>
    c.period === '3m' &&
    /structural_memory\|ex:(1979012181|703294235)/.test(c.id || '')
);

const integrity =
  audit.diagnostics?.integrityValidation ||
  audit.evaluations?.integrityValidation ||
  null;

const out = {
  orphanCount: orphans.length,
  orphans: orphans.map((c) => ({
    period: c.period,
    id: c.id,
    role: c.role,
    parentId: c.parentId,
    disposition: c.disposition,
    hierarchyOk: c.hierarchyLink?.ok,
    hierarchyReason: c.hierarchyLink?.reason
  })),
  parentCards: parentCards.map((c) => ({
    id: c.id,
    role: c.role,
    disposition: c.disposition,
    collapsedInto: c.collapsedInto,
    meanReps: c.metrics?.meanReps,
    volumeBasis: c.metrics?.volumeBasis,
    trajectories: c.metrics?.trajectories,
    observedValues: c.metrics?.observedValues,
    subjectKey: c.metrics?.subjectKey,
    body: String(c.body || '').slice(0, 350)
  })),
  childCards: childCards.map((c) => ({
    id: c.id,
    role: c.role,
    parentId: c.parentId,
    disposition: c.disposition,
    observedValues: c.metrics?.observedValues || c.claim?.proof?.observedValues,
    flat: {
      recentReps: c.metrics?.recentReps,
      prevReps: c.metrics?.prevReps,
      windowMeanPerSession: c.metrics?.windowMeanPerSession,
      totalReps: c.metrics?.totalReps
    },
    body: String(c.body || '').slice(0, 220)
  })),
  parallelDisps: parallel.map((d) => ({
    id: d.id,
    disposition: d.disposition,
    reason: d.reason,
    subjectKey: d.subjectKey,
    collapsedInto: d.collapsedInto,
    equivalence: d.equivalence,
    fusionLineage: d.fusionLineage,
    lineageSubject: d.fusionLineage?.sources?.[0]?.subjectKey || d.lineage?.subjectKey
  })),
  memoryEvidence: audit.memoryEvidence
    ? {
        keys: Object.keys(audit.memoryEvidence),
        publicationCount: audit.memoryEvidence.publicationCount,
        exposureCount: audit.memoryEvidence.exposureCount ?? audit.memoryEvidence.exposures?.length,
        sample: JSON.stringify(audit.memoryEvidence).slice(0, 2000)
      }
    : null,
  diagnosticsKeys: Object.keys(audit.diagnostics || {})
};

fs.writeFileSync(path.join(base, '_v27_orphan.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 14000));
