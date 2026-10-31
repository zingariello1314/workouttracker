/**
 * Validation E0 sur données IndexedDB réelles (export 2026-10-31).
 * Pas une simulation : fixture extraite de WorkoutTrackerDB/workouts/main.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';
import { resolveContentClass, CONTENT_CLASS } from '../recapDiscoveryContentClass';
import {
  buildMuscleAccountingLedger,
  reconcileAgainstDocumentedTotal
} from '../recapMuscleLedgerP32a';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');
const fixturePath = path.join(
  root,
  'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'
);
const nameMapPath = path.join(
  root,
  'docs/analyses-documentation/fixtures/exercise-name-map-main.json'
);

function loadFixture() {
  if (!fs.existsSync(fixturePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

function loadNames() {
  if (!fs.existsSync(nameMapPath)) return {};
  return JSON.parse(fs.readFileSync(nameMapPath, 'utf8'));
}

function summarizeBundle(bundle) {
  return {
    question: bundle.question,
    all: (bundle.all || []).map((d) => ({
      kind: d.kind,
      nature: d.nature,
      score: d.score,
      informativeValue: d.informativeValue,
      contentClass: resolveContentClass(d),
      title: d.title,
      body: d.body
    })),
    selected: (bundle.selected || []).map((d) => ({
      kind: d.kind,
      nature: d.nature,
      score: d.score,
      informativeValue: d.informativeValue,
      contentClass: resolveContentClass(d),
      title: d.title,
      body: d.body
    })),
    dropped: (bundle.dropped || []).map((d) => ({
      kind: d.kind,
      reason: d.reason,
      informativeValue: d.informativeValue,
      contentClass: resolveContentClass(d),
      title: d.title
    })),
    reliabilityNotes: bundle.reliabilityNotes || []
  };
}

describe('E0 validation réelle (IndexedDB main)', () => {
  const snapshot = loadFixture();
  const nameById = loadNames();
  const getName = (id) => nameById[String(id)] || nameById[id] || '';

  it('fixture réelle disponible', () => {
    expect(snapshot, 'Export IndexedDB manquant — rejouer extraction CDP').toBeTruthy();
    expect(snapshot._meta?.octCheckedRepsSumRaw).toBeGreaterThan(0);
  });

  it.each([
    {
      period: '7d',
      window: { start: '2026-10-24', end: '2026-10-30' },
      label: '7 jours'
    },
    {
      period: '30d',
      window: { start: '2026-10-01', end: '2026-10-30' },
      label: '30 jours'
    },
    {
      period: '3m',
      window: { start: '2026-08-01', end: '2026-10-30' },
      label: '3 mois'
    }
  ])('$label — plan_insufficient hors selected, notes éventuelles', ({ period, window }) => {
    if (!snapshot) return;
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window,
      period,
      getExerciseNameById: getName
    });
    const summary = summarizeBundle(bundle);

    // Persistance pour le livrable (artefact de run)
    const outDir = path.join(root, 'docs/analyses-documentation/fixtures');
    fs.writeFileSync(
      path.join(outDir, `e0-real-validation-${period}.json`),
      JSON.stringify(summary, null, 2)
    );

    expect(summary.selected.some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
    const insufAll = summary.all.find((d) => d.kind === 'disc_plan_data_insufficient');
    if (insufAll) {
      expect(insufAll.contentClass).toBe(CONTENT_CLASS.METHODOLOGY_LIMIT);
      expect(summary.reliabilityNotes.some((n) => n.kind === 'disc_plan_data_insufficient')).toBe(
        true
      );
      expect(
        summary.dropped.some(
          (d) => d.kind === 'disc_plan_data_insufficient' && d.reason === 'methodology_demoted'
        )
      ).toBe(true);
    }

    // Pas de tautologie reorient sur 30d
    if (period === '30d') {
      expect(summary.all.some((d) => d.kind === 'disc_muscle_reorient')).toBe(false);
    }

    // Composition : au plus une carte story
    const comp = summary.selected.filter((d) =>
      ['disc_muscle_now', 'disc_push_pull', 'disc_muscle_share_shift', 'disc_muscle_reorient'].includes(
        d.kind
      )
    );
    expect(comp.length).toBeLessThanOrEqual(1);
  });
});

describe('P3.2a golden ledger octobre 2026 (données réelles)', () => {
  const snapshot = loadFixture();
  const nameById = loadNames();
  const getName = (id) => nameById[String(id)] || nameById[id] || '';
  const DOCUMENTED_PIPELINE_TOTAL = 4016;

  it('produit un ledger conservateur + réconciliation vs 4016', () => {
    if (!snapshot) return;
    const window = { start: '2026-10-01', end: '2026-10-30' };
    const ledger = buildMuscleAccountingLedger({
      snapshot,
      window,
      getExerciseNameById: getName,
      nameById
    });
    expect(ledger.totals.conservationOk).toBe(true);
    expect(ledger.totals.R_mono + ledger.totals.R_multi + ledger.totals.R_non_attr).toBe(
      ledger.totals.R
    );
    expect(ledger.invariants.noSeventyFourTwentySix).toBe(true);
    expect(ledger.totals.isoSecondsSum).toBeGreaterThanOrEqual(0);

    const recon = reconcileAgainstDocumentedTotal(ledger, DOCUMENTED_PIPELINE_TOTAL);

    const out = {
      generatedAt: new Date().toISOString(),
      window,
      totals: ledger.totals,
      activity: ledger.activity,
      volumePrimary: ledger.volumePrimary,
      multiPrimaryTouch: ledger.multiPrimaryTouch,
      exposureDaysPrimary: ledger.exposureDaysPrimary,
      exposureDaysSecondary: ledger.exposureDaysSecondary,
      distinctExercisesPrimary: ledger.distinctExercisesPrimary,
      identityCounts: {
        certain: ledger.identityInventory.certain.length,
        probable: ledger.identityInventory.probable.length,
        unresolved: ledger.identityInventory.unresolved.length
      },
      identityUnresolvedSample: ledger.identityInventory.unresolved.slice(0, 20),
      identityProbableSample: ledger.identityInventory.probable.slice(0, 20),
      rawUniverse: ledger.rawUniverse,
      reconciliation: recon,
      gtg: {
        listed: ledger.totals.gtgRepsListed,
        alreadyInClassic: ledger.totals.gtgAlreadyInClassic,
        uniqueNotInClassic: ledger.totals.gtgUniqueNotInClassic
      },
      lineBucketCounts: ledger.lines.reduce((acc, l) => {
        acc[l.volumeBucket || l.unitClass] = (acc[l.volumeBucket || l.unitClass] || 0) + 1;
        return acc;
      }, {})
    };

    fs.writeFileSync(
      path.join(
        root,
        'docs/analyses-documentation/fixtures/p32a-golden-ledger-oct-2026.json'
      ),
      JSON.stringify(out, null, 2)
    );

    // Ne pas forcer l’égalité à 4016 — documenter
    expect(recon.ledgerR).toBe(ledger.totals.R);
    expect(typeof recon.deltaDocumentedMinusLedger).toBe('number');
  });
});
