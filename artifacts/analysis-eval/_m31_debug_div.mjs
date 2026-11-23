import fs from 'fs';
const d = JSON.parse(
  fs.readFileSync(
    'artifacts/analysis-eval/mission31-baseline/momentum-ANALYTICAL_AUDIT-p6-sovereign-v29-2026-11-23T03-09-11-445Z.json',
    'utf8'
  )
);
const x = d.diagnostics.cardClaimDivergences[0];
console.log('div keys', Object.keys(x));
console.log(JSON.stringify(x, null, 2).slice(0, 1500));
const id = x.cardId || x.id;
const hits = Object.entries(d.cardRegistry).filter(
  ([k, c]) => k.includes(String(id || '').slice(0, 40)) || c.id === id
);
console.log('hits', hits.length, hits.slice(0, 2).map(([k, c]) => ({ k, id: c.id, claimId: c.claimId })));
console.log('error0', d.diagnostics.integrityValidation.errors[0]);
const errId = String(d.diagnostics.integrityValidation.errors[0]).replace('card_claim_divergence:', '');
const hit2 = Object.entries(d.cardRegistry).filter(([k, c]) => k.endsWith(errId) || c.id === errId || k === errId);
console.log('err hits', hit2.length, hit2.slice(0, 1).map(([k]) => k));
