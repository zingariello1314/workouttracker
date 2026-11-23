const fs = require('fs');
const path = require('path');
const base = __dirname;
const audit = JSON.parse(
  fs.readFileSync(
    path.join(base, 'momentum-ANALYTICAL_AUDIT-p6-sovereign-v26-2026-11-22T16-17-05-902Z.json'),
    'utf8'
  )
);

const PARENT = 'parallel_traj|ex:1979012181+ex:703294235|span:recent30|sess:4|cal:1gjmgdz|2';
const CHILD_A = 'disc_structural_memory|ex:1979012181';
const CHILD_B = 'disc_structural_memory|ex:703294235';

const cards = Object.entries(audit.cardRegistry || {}).map(([k, v]) => ({ key: k, ...v }));
const byPeriod = {};
for (const c of cards) {
  const p = c.period || 'unscoped';
  byPeriod[p] = byPeriod[p] || { parents: [], children: [], allIds: new Set() };
  byPeriod[p].allIds.add(c.id);
  if (c.id === PARENT || String(c.id || '').includes('parallel_traj|ex:1979012181+ex:703294235')) {
    byPeriod[p].parents.push({
      id: c.id,
      role: c.role,
      disposition: c.disposition,
      parentId: c.parentId,
      collapsedInto: c.collapsedInto,
      meanReps: c.metrics?.meanReps,
      recentReps: c.metrics?.recentReps,
      trajectories: c.metrics?.trajectories || c.metrics?.composition?.trajectories,
      childIds: c.childIds
    });
  }
  if (
    String(c.id || '').startsWith(CHILD_A) ||
    String(c.id || '').startsWith(CHILD_B) ||
    String(c.id || '').includes('|ex:1979012181|') ||
    String(c.id || '').includes('|ex:703294235|')
  ) {
    if (/structural_memory/.test(String(c.id || '')) || /structural_memory/.test(String(c.kind || ''))) {
      byPeriod[p].children.push({
        id: c.id,
        role: c.role,
        disposition: c.disposition,
        parentId: c.parentId,
        hierarchyOk: c.hierarchyLink?.ok,
        hierarchyReason: c.hierarchyLink?.reason,
        recentReps: c.metrics?.recentReps,
        prevReps: c.metrics?.prevReps,
        windowMean: c.metrics?.windowMeanPerSession,
        totalReps: c.metrics?.totalReps,
        meanReps: c.metrics?.meanReps,
        bodySlice: String(c.body || '').slice(0, 180)
      });
    }
  }
}

const orphanChildren = cards.filter(
  (c) =>
    (c.role === 'priority' || c.role === 'reserve') &&
    c.parentId &&
    c.hierarchyLink?.ok === true &&
    !cards.some((p) => p.period === c.period && (p.id === c.parentId || p.publicationId === c.parentId))
);

const dispositions = audit.dispositionsByPeriod || {};
const parentDisps = {};
for (const [period, rows] of Object.entries(dispositions)) {
  const hits = (Array.isArray(rows) ? rows : rows?.items || []).filter(
    (d) =>
      String(d.id || '').includes('1979012181+ex:703294235') ||
      String(d.collapsedInto || '').includes('1979012181+ex:703294235')
  );
  if (hits.length) parentDisps[period] = hits.slice(0, 20);
}

const diag = audit.diagnostics || {};
const fusion = diag.unjustifiedFusions || diag.anomalies?.unjustifiedFusions || null;

const out = {
  cardCount: cards.length,
  claimCount: Object.keys(audit.claimRegistry || {}).length,
  factCount: Object.keys(audit.factRegistry || {}).length,
  candidateCount: Object.keys(audit.candidateRegistry || {}).length,
  periods: Object.keys(audit.periods || {}),
  periodMeta: Object.fromEntries(
    Object.entries(audit.periods || {}).map(([k, v]) => [
      k,
      {
        publicationAuthority: v.publicationAuthority,
        accessibleCount: v.accessibleCount,
        priorityCount: v.priorityCount,
        reserveCount: v.reserveCount,
        reconciledStrict: v.reconciledStrict
      }
    ])
  ),
  byPeriod: Object.fromEntries(
    Object.entries(byPeriod).map(([k, v]) => [
      k,
      {
        parentCount: v.parents.length,
        childCount: v.children.length,
        hasParentId: v.allIds.has(PARENT),
        parents: v.parents,
        children: v.children
      }
    ])
  ),
  orphanChildren: orphanChildren.map((c) => ({
    period: c.period,
    id: c.id,
    role: c.role,
    parentId: c.parentId,
    hierarchyOk: c.hierarchyLink?.ok,
    disposition: c.disposition
  })),
  parentDisps,
  diagnosticsKeys: Object.keys(diag),
  memoryEvidence: audit.memoryEvidence
    ? {
        keys: Object.keys(audit.memoryEvidence),
        summary: {
          publicationCount: audit.memoryEvidence.publicationCount,
          storeCount: audit.memoryEvidence.storePhenomena?.length ?? audit.memoryEvidence.storeCount,
          packCount: audit.memoryEvidence.packPhenomena?.length ?? audit.memoryEvidence.packCount,
          exposures: audit.memoryEvidence.exposureCount ?? audit.memoryEvidence.exposures?.length,
          anomalies: audit.memoryEvidence.anomalyCount
        },
        sample: JSON.stringify(audit.memoryEvidence).slice(0, 2500)
      }
    : null,
  fusionSample: fusion
};

fs.writeFileSync(path.join(base, '_orphan_report.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 16000));
