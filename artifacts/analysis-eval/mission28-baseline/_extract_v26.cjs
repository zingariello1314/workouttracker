const fs = require('fs');
const path = require('path');

const base = __dirname;
const auditPath = path.join(
  base,
  'momentum-ANALYTICAL_AUDIT-p6-sovereign-v26-2026-11-22T16-17-05-902Z.json'
);
const a = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

const out = {
  topKeys: Object.keys(a),
  edition: a.edition || a.meta?.edition || a.fingerprint?.edition || a.run?.edition,
  integrityValidation: a.integrityValidation || null,
  schemaValidation: a.schemaValidation || null
};

const inv =
  a.integrityValidation?.issues ||
  a.integrityValidation?.violations ||
  a.integrityValidation?.invariants ||
  a.integrityIssues ||
  [];
out.integrityShape = {
  keys: a.integrityValidation ? Object.keys(a.integrityValidation) : null,
  issueCount: Array.isArray(inv) ? inv.length : null
};

function walk(node, pred, acc = [], depth = 0) {
  if (acc.length > 80 || depth > 12 || node == null) return acc;
  if (pred(node)) acc.push(node);
  if (Array.isArray(node)) {
    for (const x of node) walk(x, pred, acc, depth + 1);
  } else if (typeof node === 'object') {
    for (const k of Object.keys(node)) walk(node[k], pred, acc, depth + 1);
  }
  return acc;
}

const orphanHits = walk(a, (n) => {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
  const blob = `${n.type || ''} ${n.code || ''} ${n.kind || ''} ${n.reason || ''} ${n.id || ''}`;
  return /orphan_parent/i.test(blob);
});
out.orphanHits = orphanHits.slice(0, 20);

const fusionHits = walk(a, (n) => {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
  const blob = `${n.type || ''} ${n.code || ''} ${n.kind || ''} ${n.reason || ''} ${n.disposition || ''}`;
  return /unjustified|self_fusion|semantic_equivalent/i.test(blob) && /parallel|hyperext|1979012181|703294235/i.test(JSON.stringify(n).slice(0, 500));
});
out.fusionHitsSample = fusionHits.slice(0, 15);

const parallelMentions = walk(a, (n) => {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
  const id = String(n.id || n.occurrenceId || n.phenomenonId || n.conclusionKey || '');
  return /parallel_traj\|ex:1979012181\+ex:703294235/i.test(id);
});
out.parallelParentCards = parallelMentions.slice(0, 10).map((n) => ({
  id: n.id,
  occurrenceId: n.occurrenceId,
  phenomenonId: n.phenomenonId,
  conclusionKey: n.conclusionKey,
  title: n.title,
  disposition: n.disposition,
  kind: n.kind,
  meanReps: n.metrics?.meanReps ?? n.meanReps,
  recentReps: n.metrics?.recentReps,
  windowMeanPerSession: n.metrics?.windowMeanPerSession,
  children: n.children || n.childIds || n.hierarchy?.children
}));

const childMentions = walk(a, (n) => {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return false;
  const id = String(n.id || n.occurrenceId || n.phenomenonId || '');
  return /disc_structural_memory\|ex:(1979012181|703294235)/i.test(id);
});
out.childCards = childMentions.slice(0, 12).map((n) => ({
  id: n.id,
  phenomenonId: n.phenomenonId,
  parentId: n.parentId || n.hierarchy?.parentId || n.metrics?.parentId,
  title: n.title,
  disposition: n.disposition,
  recentReps: n.metrics?.recentReps,
  prevReps: n.metrics?.prevReps,
  windowMeanPerSession: n.metrics?.windowMeanPerSession,
  totalReps: n.metrics?.totalReps
}));

const mem = a.memory || a.analyticalMemory || a.memorySnapshot || a.packs?.[0]?.memory;
out.memoryKeys = mem && typeof mem === 'object' ? Object.keys(mem) : null;
out.memorySummary = mem
  ? {
      publicationCount: mem.publicationCount ?? mem.publications?.length,
      storePhenomena: mem.storePhenomena?.length ?? mem.phenomena?.length,
      packPhenomena: mem.packPhenomena?.length,
      exposures: mem.exposures?.length ?? mem.exposureCount
    }
  : null;

fs.writeFileSync(path.join(base, '_audit_summary.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 12000));
