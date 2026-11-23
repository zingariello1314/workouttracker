const fs = require('fs');
const path = require('path');
const audit = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'momentum-ANALYTICAL_AUDIT-p6-sovereign-v28-2026-11-22T17-47-02-151Z.json'),
    'utf8'
  )
);

const cards = Object.values(audit.cardRegistry || {});
const parents = cards.filter(
  (c) =>
    c.period === '3m' &&
    /parallel_traj\|ex:1979012181\+ex:703294235/.test(c.id || '')
);
const children = cards.filter(
  (c) =>
    c.period === '3m' &&
    (/ex:1979012181|ex:703294235/.test(c.id || '')) &&
    /emergence|structural|parallel/.test(c.id || '')
);

const out = {
  integrity: audit.diagnostics?.integrityValidation || null,
  parents: parents.map((c) => ({
    id: c.id,
    role: c.role,
    body: String(c.body || '').slice(0, 450),
    trajectories: c.metrics?.trajectories,
    meanSessions: c.metrics?.meanSessions,
    sessionCount: c.metrics?.sessionCount,
    observedValues: c.metrics?.observedValues,
    volumeBasis: c.metrics?.volumeBasis
  })),
  children: children.slice(0, 12).map((c) => ({
    id: c.id,
    kind: c.kind,
    role: c.role,
    parentId: c.parentId,
    sessionCount: c.metrics?.sessionCount,
    dates: c.metrics?.dates,
    recentReps: c.metrics?.recentReps,
    sessions: c.metrics?.sessions,
    body: String(c.body || '').slice(0, 200)
  })),
  cardCount: cards.length,
  claimCount: Object.keys(audit.claimRegistry || {}).length,
  fingerprint: audit.manifest?.fingerprint || audit.snapshots?.fingerprint || null
};

fs.writeFileSync(path.join(__dirname, '_sessions_report.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 12000));
