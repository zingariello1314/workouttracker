import fs from 'fs';

const fp = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/period-bundle-fingerprint-after.json', 'utf8')
);

for (const [period, data] of Object.entries(fp)) {
  const kindsAll = {};
  const kindsSel = {};
  const familiesAll = {};
  const familiesSel = {};
  const reasons = {};
  const exerciseIds = new Set();
  data.candidates.forEach((d) => {
    kindsAll[d.kind] = (kindsAll[d.kind] || 0) + 1;
    familiesAll[d.family || '?'] = (familiesAll[d.family || '?'] || 0) + 1;
    if (d.metrics?.exerciseId) exerciseIds.add(String(d.metrics.exerciseId));
  });
  data.selected.forEach((d) => {
    kindsSel[d.kind] = (kindsSel[d.kind] || 0) + 1;
    familiesSel[d.family || '?'] = (familiesSel[d.family || '?'] || 0) + 1;
  });
  data.dropped.forEach((d) => {
    reasons[d.reason || '?'] = (reasons[d.reason || '?'] || 0) + 1;
  });
  const topDrop = Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
  const topKindsSel = Object.entries(kindsSel)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
  console.log(
    `\n${period} | cand ${data.candidateCount} → sel ${data.selectedCount} (${Math.round((100 * data.selectedCount) / Math.max(1, data.candidateCount))}%) | ${data.ms}ms | reps ${data.periodReps} | exIds-in-cand ${exerciseIds.size}`
  );
  console.log('  selected kinds:', topKindsSel || '(none)');
  console.log('  drop reasons:', topDrop || '(none)');
  console.log(
    '  unique kinds cand/sel:',
    Object.keys(kindsAll).length,
    '/',
    Object.keys(kindsSel).length,
    '| families cand/sel:',
    Object.keys(familiesAll).length,
    '/',
    Object.keys(familiesSel).length
  );
}
