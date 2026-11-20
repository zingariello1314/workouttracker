import { describe, expect, it } from 'vitest';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';
import { createSetShiftReader } from '../recapSetShift';
import { structuredBestSetReps } from '../exercisePerformanceUnit';
import { isRecordedSetFormat } from '../exerciseSetInference';
import { sameNameActiveDuringGap } from '../movementIdentity';
import { buildSessionWorkProfiles } from '../sessionWorkProfile';
import {
  DAY_STATUS,
  PLAN_PROVENANCE,
  SESSION_STATUS,
  assessPlannedVsPerformed
} from '../plannedVsPerformedAssessment';

describe('séries enregistrées', () => {
  it('ne publie pas une reconstruction égale comme un format effectué', () => {
    const log = {
      sets: [
        { reps: 18 },
        { reps: 18 }
      ],
      inference: { method: 'equal', confidence: 0.52 }
    };
    expect(isRecordedSetFormat(log)).toBe(false);
    const snapshot = {
      reps: { '2026-11-16_105': 36 },
      exerciseSetLogs: { '2026-11-16_105': log }
    };
    expect(createSetShiftReader(snapshot).forSession('105', '2026-11-16', 36)).toBe('');
    expect(structuredBestSetReps(snapshot, '2026-11-16', '105')).toBeNull();
  });

  it('conserve un journal sans inférence', () => {
    const snapshot = {
      reps: { '2026-11-16_105': 36 },
      exerciseSetLogs: { '2026-11-16_105': { sets: [{ reps: 18 }, { reps: 18 }] } }
    };
    expect(createSetShiftReader(snapshot).forSession('105', '2026-11-16', 36)).toMatch(/2 séries de 18/);
  });
});

describe('comparaison du 17 novembre', () => {
  it('ajoute les pompes complémentaires absentes des répétitions cochées', () => {
    const work = buildSessionWorkProfiles(
      {
        reps: { '2026-11-17_202': 232, '2026-11-16_106': 319 },
        checkedExercises: { '2026-11-17_202': true, '2026-11-16_106': true },
        enduranceData: {
          sessions: { pushups: [{ date: '2026-11-17', reps: 100, activityType: 'pushups' }] }
        }
      },
      { start: '2026-11-16', end: '2026-11-17' },
      null
    );
    const seventeenth = work.days.find((day) => day.date === '2026-11-17');
    expect(seventeenth.reps).toBe(332);
    expect(complementaryRepsOf(seventeenth)).toBe(100);
    expect(work.days.find((day) => day.date === '2026-11-16').reps).toBe(319);
  });
});

function complementaryRepsOf(day) {
  return (day.exercises || [])
    .filter((row) => row.id === 'complementary_endurance_pushups')
    .reduce((sum, row) => sum + row.reps, 0);
}

describe('identité de mouvement', () => {
  it('ne prend pas une autre ligne de même nom pour une interruption', () => {
    const active = sameNameActiveDuringGap(
      { id: '105', name: 'Pompes inclinées' },
      {
        '2026-11-10': [{ id: '900', name: 'Pompes inclinées', reps: 20 }]
      },
      '2026-11-01',
      '2026-11-16'
    );
    expect(active).toBe(true);
    expect(
      sameNameActiveDuringGap(
        { id: '105', name: 'Pompes inclinées' },
        { '2026-11-10': [{ id: '105', name: 'Pompes inclinées', reps: 20 }] },
        '2026-11-01',
        '2026-11-16'
      )
    ).toBe(false);
  });
});

describe('prévu contre réalisé', () => {
  it('décrit le haut du corps réalisé et les jambes absentes', () => {
    const result = assessPlannedVsPerformed({
      date: '2026-11-16',
      planProvenance: PLAN_PROVENANCE.HISTORICAL,
      dayStatus: DAY_STATUS.CLOSED,
      sessionStatus: SESSION_STATUS.FINISHED,
      planned: [
        { id: 'pecs', plannedReps: 120, muscleGroup: 'Pectoraux' },
        { id: 'biceps', plannedReps: 80, muscleGroup: 'Biceps' },
        { id: 'legs', plannedReps: 150, muscleGroup: 'Jambes' }
      ],
      performed: [
        { id: 'pecs', reps: 120 },
        { id: 'biceps', reps: 76 }
      ]
    });
    expect(result.plannedTotal).toBe(350);
    expect(result.performedTotal).toBe(196);
    expect(result.completionRatio).toBeCloseTo(0.56, 2);
    expect(result.conclusion).toMatch(/haut du corps/);
    expect(result.conclusion).toMatch(/jambes ne l'a pas été \(0\/150\)/);
    expect(result.conclusion).not.toMatch(/séance incomplète/i);
  });

  it('sépare un même volume d’un format différent', () => {
    const result = assessPlannedVsPerformed({
      planProvenance: PLAN_PROVENANCE.HISTORICAL,
      planned: [{ id: 'a', series: '4×5' }],
      performed: [{ id: 'a', reps: 20, setsRecorded: true, setCount: 2 }]
    });
    expect(result.matches[0].matchedReps).toBe(20);
    expect(result.matches[0].formatRespected).toBe(false);
    expect(result.matches[0].sameVolumeDifferentFormat).toBe(true);
  });

  it('ne laisse pas le surplus masquer une autre prescription omise', () => {
    const result = assessPlannedVsPerformed({
      planProvenance: PLAN_PROVENANCE.HISTORICAL,
      planned: [
        { id: 'a', plannedReps: 40 },
        { id: 'b', plannedReps: 30 }
      ],
      performed: [{ id: 'a', reps: 60 }]
    });
    expect(result.work.plannedMatchedReps).toBe(40);
    expect(result.work.additionalReps).toBe(20);
    expect(result.work.omittedPlannedReps).toBe(30);
  });

  it('n’appelle pas omis un exercice prévu plus tard dans une journée ouverte', () => {
    const result = assessPlannedVsPerformed({
      planProvenance: PLAN_PROVENANCE.HISTORICAL,
      dayStatus: DAY_STATUS.OPEN,
      sessionStatus: SESSION_STATUS.IN_PROGRESS,
      planned: [{ id: 'evening', plannedReps: 40 }],
      performed: []
    });
    expect(result.matches[0].status).toBe('not_yet_due');
    expect(result.work.omittedPlannedReps).toBe(0);
  });

  it('ne compte pas un report documenté comme une séance manquée', () => {
    const result = assessPlannedVsPerformed({
      planProvenance: PLAN_PROVENANCE.HISTORICAL,
      postponed: true,
      planned: [{ id: 'a', plannedReps: 40 }],
      performed: []
    });
    expect(result.matches[0].status).toBe('postponed');
    expect(result.work.omittedPlannedReps).toBe(0);
  });

  it('produit la carte dans le paquet du moteur quand le plan est historiquement prouvé', () => {
    const snapshot = {
      reps: {
        '2026-11-16_pecs': 120,
        '2026-11-16_biceps': 76
      },
      checkedExercises: {
        '2026-11-16_pecs': true,
        '2026-11-16_biceps': true
      },
      calendarDayPlanSnapshots: {
        '2026-11-16': {
          frozen: true,
          status: 'historical_frozen',
          planCompareEligible: true,
          exercises: [
            { storageId: 'pecs', plannedReps: 120, muscleGroup: 'Pectoraux' },
            { storageId: 'biceps', plannedReps: 80, muscleGroup: 'Biceps' },
            { storageId: 'legs', plannedReps: 150, muscleGroup: 'Jambes' }
          ]
        }
      }
    };
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      period: '7d',
      window: { start: '2026-11-10', end: '2026-11-16' },
      getExerciseNameById: () => null,
      today: '2026-11-17'
    });
    const card = (bundle.all || []).find((row) => row.kind === 'disc_program_practice');
    expect(card).toBeTruthy();
    expect(card.body).toMatch(/haut du corps/);
    expect(card.body).toMatch(/jambes/);
    expect(card.lineage.producer).toBe('plannedVsPerformedAssessment');
    expect(bundle.packRole).toBe('pipeline');
  });

  it('s’abstient quand seul le programme actuel est connu', () => {
    const result = assessPlannedVsPerformed({
      planProvenance: PLAN_PROVENANCE.CURRENT_ONLY,
      planned: [{ id: 'a', plannedReps: 40 }],
      performed: [{ id: 'a', reps: 40 }]
    });
    expect(result.abstained).toBe(true);
    expect(result.reason).toBe('current_program_not_applied_backward');
    expect(result.conclusion).toBeNull();
  });
});
