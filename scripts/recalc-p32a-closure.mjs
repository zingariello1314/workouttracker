/**
 * Recalcule golden ledger + diagnostic identités sur l’export figé.
 * node scripts/recalc-p32a-closure.mjs
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// Vitest/babel path: use dynamic import of source via relative URL
const root = process.cwd();

async function main() {
  const {
    buildMuscleAccountingLedger,
    auditUnitAndDedupPipeline,
    buildDayEligibilityTable,
    reconcileAgainstDocumentedTotal
  } = await import('../src/utils/sport/recapMuscleLedgerP32a.js');
  const { createNameResolverFromMaps } = await import(
    '../src/utils/sport/resolveStorageExerciseIdentity.js'
  );

  const snap = JSON.parse(
    fs.readFileSync(
      path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
      'utf8'
    )
  );
  const nameById = JSON.parse(
    fs.readFileSync(
      path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
      'utf8'
    )
  );
  const getName = createNameResolverFromMaps(nameById);
  const window = { start: '2026-10-01', end: '2026-10-30' };

  const before = {
    R: 4331,
    R_mono: 1072,
    R_multi: 870,
    R_non_attr: 2389,
    certainIdentities: 21,
    probableIdentities: 26
  };

  const ledger = buildMuscleAccountingLedger({
    snapshot: snap,
    window,
    getExerciseNameById: getName,
    nameById
  });
  const pipeline = auditUnitAndDedupPipeline({
    snapshot: snap,
    window,
    getExerciseNameById: getName,
    nameById
  });
  const days = buildDayEligibilityTable({
    snapshot: snap,
    window,
    getExerciseNameById: getName,
    nameById
  });
  const recon = reconcileAgainstDocumentedTotal(ledger, 4016);

  const identityRows = [
    ...ledger.identityInventory.certain.map((x) => ({ ...x, identityConfidence: 'certain' })),
    ...ledger.identityInventory.probable.map((x) => ({ ...x, identityConfidence: 'probable' })),
    ...ledger.identityInventory.unresolved.map((x) => ({ ...x, identityConfidence: 'unresolved' }))
  ].sort((a, b) => (b.reps || 0) - (a.reps || 0));

  const out = {
    generatedAt: new Date().toISOString(),
    before,
    after: {
      R: ledger.totals.R,
      R_mono: ledger.totals.R_mono,
      R_multi: ledger.totals.R_multi,
      R_non_attr: ledger.totals.R_non_attr,
      conservationOk: ledger.totals.conservationOk,
      isoSecondsSum: ledger.totals.isoSecondsSum,
      coverage: ledger.coverage,
      identityCounts: {
        certain: ledger.identityInventory.certain.length,
        probable: ledger.identityInventory.probable.length,
        unresolved: ledger.identityInventory.unresolved.length
      },
      activity: ledger.activity,
      volumePrimary: ledger.volumePrimary,
      multiPrimaryTouch: ledger.multiPrimaryTouch
    },
    identityDiagnostic: identityRows,
    unitPipeline: pipeline,
    dayEligibility: days,
    reconciliationVs4016: recon
  };

  const dest = path.join(
    root,
    'docs/analyses-documentation/fixtures/p32a-closure-recalc-oct-2026.json'
  );
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(
    JSON.stringify(
      {
        dest,
        before,
        after: out.after,
        weightExclusive: ledger.activity.weightClassesExclusiveOk,
        pipelineInvariants: pipeline.invariants,
        dayCounts: days.counts
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
