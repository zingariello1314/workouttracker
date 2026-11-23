const fs = require('fs');
const path = require('path');
const base = __dirname;
const audit = JSON.parse(
  fs.readFileSync(
    path.join(base, 'momentum-ANALYTICAL_AUDIT-p6-sovereign-v26-2026-11-22T16-17-05-902Z.json'),
    'utf8'
  )
);

const period = '3m';
const disps = audit.dispositionsByPeriod?.[period] || [];
const list = Array.isArray(disps) ? disps : disps.items || [];
const parallel = list.filter(
  (d) =>
    /1979012181|703294235|parallel_traj|structural_memory/i.test(
      `${d.id || ''} ${d.collapsedInto || ''} ${d.title || ''} ${d.reason || ''}`
    )
);
const parentCard = Object.values(audit.cardRegistry || {}).filter(
  (c) => c.period === period && /parallel_traj\|ex:1979012181/.test(c.id || '')
);
const metrics = parentCard.map((c) => ({
  id: c.id,
  role: c.role,
  meanReps: c.metrics?.meanReps,
  trajectories: c.metrics?.trajectories,
  observedValues: c.metrics?.observedValues,
  body: String(c.body || '').slice(0, 300)
}));

// sample claim for structural memory
const childClaims = Object.values(audit.claimRegistry || {})
  .filter((c) => /1979012181|703294235/.test(JSON.stringify(c).slice(0, 400)))
  .slice(0, 4)
  .map((c) => ({
    id: c.id || c.claimId,
    observedValues: c.proof?.observedValues?.slice?.(0, 12),
    metrics: c.metrics || c.proof?.metricsUsed
  }));

const out = {
  parallelDisps: parallel.slice(0, 40),
  parentMetrics: metrics,
  childClaims,
  memoryEvidenceKeys: Object.keys(audit.memoryEvidence || {}),
  memoryEvidence: audit.memoryEvidence
};

fs.writeFileSync(path.join(base, '_3m_parent.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ parallelDisps: parallel.slice(0, 40), parentMetrics: metrics }, null, 2));
