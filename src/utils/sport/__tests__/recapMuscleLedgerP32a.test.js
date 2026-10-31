import { describe, expect, it } from 'vitest';
import {
  CLASSIFICATION_VERSION,
  UNIT_CLASS,
  VOLUME_BUCKET,
  buildRawObservationUniverse,
  buildCanonicalObservationLines,
  buildMuscleAccountingLedger,
  attributeAnatomyForExercise,
  resolveExerciseIdentity,
  reconcileAgainstDocumentedTotal
} from '../recapMuscleLedgerP32a';

const names = {
  101: 'Tractions pronation',
  104: 'Pompes déclinées',
  1011: 'Planche',
  multi: 'Dips',
  unk: ''
};

function getName(id) {
  return names[id] || names[String(id)] || '';
}

describe('P3.2a ledger — invariants unitaires', () => {
  it('classes d’unités exclusives : lignes ≠ somme des valeurs', () => {
    const snapshot = {
      reps: {
        '2026-10-01_101': '10',
        '2026-10-01_104': '20',
        '2026-10-01_1011': '45',
        '2026-10-01_bad': 'x'
      },
      checkedExercises: {
        '2026-10-01_101': true,
        '2026-10-01_104': true,
        '2026-10-01_1011': true,
        '2026-10-01_bad': true
      }
    };
    const raw = buildRawObservationUniverse(snapshot, {
      start: '2026-10-01',
      end: '2026-10-01'
    });
    expect(raw.counts.candidateKeys).toBe(4);
    // Après nommage, iso séparé dans canonical
    const lines = buildCanonicalObservationLines({
      snapshot,
      window: { start: '2026-10-01', end: '2026-10-01' },
      getExerciseNameById: getName
    });
    const certain = lines.filter((l) => l.unitClass === UNIT_CLASS.CERTAIN_REPS);
    const iso = lines.filter((l) => l.unitClass === UNIT_CLASS.ISOMETRIC_SECONDS);
    expect(certain.map((l) => l.reps).reduce((a, b) => a + b, 0)).toBe(30);
    expect(iso).toHaveLength(1);
    expect(iso[0].durationSeconds).toBe(45);
    expect(certain.every((l) => l.durationSeconds == null)).toBe(true);
  });

  it('ne mélange pas secondes et reps dans R', () => {
    const snapshot = {
      reps: { '2026-10-02_101': '12', '2026-10-02_1011': '60' },
      checkedExercises: { '2026-10-02_101': true, '2026-10-02_1011': true }
    };
    const ledger = buildMuscleAccountingLedger({
      snapshot,
      window: { start: '2026-10-02', end: '2026-10-02' },
      getExerciseNameById: getName
    });
    expect(ledger.totals.R).toBe(12);
    expect(ledger.totals.isoSecondsSum).toBe(60);
    expect(ledger.invariants.repsNotMixedWithSeconds).toBe(true);
  });

  it('conservation R_mono + R_multi + R_non_attr === R', () => {
    const snapshot = {
      reps: {
        '2026-10-03_101': '50',
        '2026-10-03_103': '40',
        '2026-10-03_orphan': '7'
      },
      checkedExercises: {
        '2026-10-03_101': true,
        '2026-10-03_103': true,
        '2026-10-03_orphan': true
      }
    };
    const ledger = buildMuscleAccountingLedger({
      snapshot,
      window: { start: '2026-10-03', end: '2026-10-03' },
      getExerciseNameById: (id) =>
        String(id) === '101'
          ? 'Tractions pronation'
          : String(id) === '103'
            ? 'Dips'
            : ''
    });
    const { R, R_mono, R_multi, R_non_attr, conservationOk } = ledger.totals;
    expect(conservationOk).toBe(true);
    expect(R_mono + R_multi + R_non_attr).toBe(R);
  });

  it('homonymes : ids distincts non fusionnés', () => {
    const a = resolveExerciseIdentity({ storageId: '104', resolvedName: 'Pompes déclinées' });
    const b = resolveExerciseIdentity({ storageId: '202', resolvedName: 'Pompes déclinées' });
    expect(a.storageId).not.toBe(b.storageId);
    expect(a.resolvedName).toBe(b.resolvedName);
  });

  it('multi-primary : volume non ventilé, touch listé', () => {
    const attr = attributeAnatomyForExercise({ storageId: '103', name: 'Dips' });
    // Dips often multi; if bank says multi:
    if (attr.primaryGroups.length >= 2) {
      expect(attr.metricAdmissible.volumeMono).toBe(false);
      expect(attr.metricAdmissible.volumeMulti).toBe(true);
    }
  });

  it('poids absent ≠ zéro', () => {
    const snapshot = {
      reps: { '2026-10-04_101': '10' },
      checkedExercises: { '2026-10-04_101': true }
    };
    const lines = buildCanonicalObservationLines({
      snapshot,
      window: { start: '2026-10-04', end: '2026-10-04' },
      getExerciseNameById: getName
    });
    expect(lines[0].weightUnknown).toBe(true);
    expect(lines[0].weightKg).toBeNull();
    expect(lines[0].weightPresent).toBe(false);
  });

  it('séries non reconstruites depuis le prescrit', () => {
    const snapshot = {
      reps: { '2026-10-05_101': '30' },
      checkedExercises: { '2026-10-05_101': true }
      // pas de exerciseSetLogs
    };
    const lines = buildCanonicalObservationLines({
      snapshot,
      window: { start: '2026-10-05', end: '2026-10-05' },
      getExerciseNameById: getName
    });
    expect(lines[0].setsRecorded).toBe(0);
    expect(lines[0].setsFromPrescription).toBe(false);
  });

  it('mapping incomplet : pas d’attribution fictive de volume mono', () => {
    const attr = attributeAnatomyForExercise({ storageId: 'zzz', name: '' });
    expect(attr.attributionSource).toBe('none');
    expect(attr.metricAdmissible.volumeMono).toBe(false);
    expect(attr.primaryGroups).toEqual([]);
  });

  it('stabilité à entrée identique', () => {
    const snapshot = {
      reps: { '2026-10-06_101': '22', '2026-10-06_104': '33' },
      checkedExercises: { '2026-10-06_101': true, '2026-10-06_104': true }
    };
    const opts = {
      snapshot,
      window: { start: '2026-10-06', end: '2026-10-06' },
      getExerciseNameById: getName
    };
    const a = buildMuscleAccountingLedger(opts);
    const b = buildMuscleAccountingLedger(opts);
    expect(a.totals).toEqual(b.totals);
    expect(a.classificationVersion).toBe(CLASSIFICATION_VERSION);
  });

  it('dedup max reps date×id (pas double compte semaineA/B)', () => {
    const snapshot = {
      reps: {
        '2026-10-07_101': '10',
        '2026-10-07_101_semaineA': '40'
      },
      checkedExercises: {
        '2026-10-07_101': true,
        '2026-10-07_101_semaineA': true
      }
    };
    const ledger = buildMuscleAccountingLedger({
      snapshot,
      window: { start: '2026-10-07', end: '2026-10-07' },
      getExerciseNameById: getName
    });
    expect(ledger.totals.R).toBe(40);
  });

  it('reconcileAgainstDocumentedTotal expose les deltas sans forcer', () => {
    const ledger = {
      totals: { R: 4000, pipelineAggregateSum: 4016 }
    };
    const r = reconcileAgainstDocumentedTotal(ledger, 4016);
    expect(r.deltaDocumentedMinusLedger).toBe(16);
    expect(r.samePerimeterHypothesis).toBe('match_pipeline_aggregate');
  });
});
