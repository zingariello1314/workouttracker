import fs from 'fs';

const before = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/period-bundle-fingerprint-before.json', 'utf8')
);
const after = JSON.parse(
  fs.readFileSync('docs/analyses-documentation/fixtures/period-bundle-fingerprint-after.json', 'utf8')
);

function stripTiming(fp) {
  const { ms, ...rest } = fp;
  return rest;
}

let diffs = 0;
for (const period of Object.keys(before)) {
  const b = JSON.stringify(stripTiming(before[period]));
  const a = JSON.stringify(stripTiming(after[period]));
  const same = b === a;
  console.log(
    `${period}: ${same ? 'IDENTICAL' : 'DIFF'} | before ${before[period].ms}ms after ${after[period].ms}ms | cand ${before[period].candidateCount}/${after[period].candidateCount} sel ${before[period].selectedCount}/${after[period].selectedCount}`
  );
  if (!same) {
    diffs += 1;
    // Find first differing selected kinds
    const bk = before[period].selected.map((d) => d.kind).join(',');
    const ak = after[period].selected.map((d) => d.kind).join(',');
    if (bk !== ak) console.log('  selected kinds differ');
    const bc = before[period].candidates.map((d) => `${d.kind}|${d.score}|${d.title}`).join('\n');
    const ac = after[period].candidates.map((d) => `${d.kind}|${d.score}|${d.title}`).join('\n');
    if (bc !== ac) {
      const bl = bc.split('\n');
      const al = ac.split('\n');
      for (let i = 0; i < Math.max(bl.length, al.length); i += 1) {
        if (bl[i] !== al[i]) {
          console.log('  first cand diff @', i);
          console.log('   before:', bl[i]);
          console.log('   after :', al[i]);
          break;
        }
      }
    }
  }
}
console.log(diffs === 0 ? '\nALL PERIODS BEHAVIOR-EQUIVALENT (ignoring timing)' : `\n${diffs} period(s) differ`);
