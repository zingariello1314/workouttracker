import fs from 'fs';
const out = JSON.parse(fs.readFileSync('artifacts/analysis-eval/mission31-results/revalidate-compare.json', 'utf8'));
console.log('cleared', out.revalidation.cleared, 'hard', out.revalidation.stillHardFail);
console.log('mini ok', out.revalidation.miniAuditIntegrityOk);
console.log('mini div errors', out.revalidation.miniAuditDivergenceErrors);
// rebuild quick check
import { validateAnalyticalAudit } from '../../src/utils/sport/evaluation/buildAnalyticalAudit.js';
import { validateCardClaimConsistency } from '../../src/utils/sport/evaluation/claimAssertionIdentity.js';
const v29 = JSON.parse(
  fs.readFileSync(
    'artifacts/analysis-eval/mission31-baseline/momentum-ANALYTICAL_AUDIT-p6-sovereign-v29-2026-11-23T03-09-11-445Z.json',
    'utf8'
  )
);
const divs = v29.diagnostics.cardClaimDivergences;
const cardRegistry = {};
const claimRegistry = {};
for (const d of divs) {
  const card = v29.cardRegistry[d.cardKey];
  if (!card) continue;
  cardRegistry[d.cardKey] = card;
  if (d.claimId && v29.claimRegistry[d.claimId]) claimRegistry[d.claimId] = v29.claimRegistry[d.claimId];
}
const v = validateAnalyticalAudit({
  schema: 'momentum.analyticalAudit.v2',
  manifest: { edition: 'p6-sovereign-v30' },
  cardRegistry,
  claimRegistry,
  factRegistry: {}
});
console.log(
  JSON.stringify(
    {
      ok: v.integrityValidation.ok,
      errCount: v.integrityValidation.errors.length,
      sample: v.integrityValidation.errors.slice(0, 15),
      types: v.integrityValidation.errors.reduce((a, e) => {
        const t = String(e).split(':')[0];
        a[t] = (a[t] || 0) + 1;
        return a;
      }, {})
    },
    null,
    2
  )
);
const one = divs[0];
const c = validateCardClaimConsistency(v29.cardRegistry[one.cardKey], v29.claimRegistry[one.claimId]);
console.log('one check', { ok: c.ok, conflicts: c.conflicts, notes: c.notes });
