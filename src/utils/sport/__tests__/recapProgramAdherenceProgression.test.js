import { describe, expect, it } from 'vitest';
import {
  PLAN_KNOWLEDGE,
  PLAN_SOURCE,
  REALIZATION,
  RELIABILITY,
  buildDayPlanRealizationRow,
  buildPlanRealizationMatrix,
  classifyPlanMeta,
  exerciseMatchKey
} from '../recapProgramAdherenceProgression.js';
import {
  buildDayPlanSnapshotFromExercises,
  withDayPlanSnapshot
} from '../../calendarDayPlanSnapshot.js';

const D = '2026-10-10';

function snapPlan(exercises, { variant = null, programId = 'prog1' } = {}) {
  return buildDayPlanSnapshotFromExercises({
    dateStr: D,
    exercises,
    programId,
    variant
  });
}

function withSnap(data, exercises, opts) {
  return withDayPlanSnapshot(data, D, snapPlan(exercises, opts));
}

const EX_A = { id: 101, originalId: 'exo_a', name: 'A', series: '3×10' };
const EX_B = { id: 102, originalId: 'exo_b', name: 'B', series: '4×8' };
const EX_C = { id: 103, originalId: 'exo_c', name: 'C', series: '3×12' };

describe('recapProgramAdherenceProgression — P3.0 matrice', () => {
  it('snapshot complet : tous réalisés', () => {
    let data = {
      checkedExercises: {
        [`${D}_101`]: true,
        [`${D}_102`]: true,
        [`${D}_103`]: true
      },
      reps: {
        [`${D}_101`]: '30',
        [`${D}_102`]: '32',
        [`${D}_103`]: '36'
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A, EX_B, EX_C]);

    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.planSource).toBe(PLAN_SOURCE.SNAPSHOT);
    expect(row.reliability).toBe(RELIABILITY.HIGH);
    expect(row.planKnowledge).toBe(PLAN_KNOWLEDGE.KNOWN);
    expect(row.realizedExercises).toHaveLength(3);
    expect(row.notRealizedExercises).toHaveLength(0);
    expect(row.denominator.usableForAdherenceRate).toBe(true);
    expect(row.denominator.plannedCount).toBe(3);
    expect(row.denominator.realizedCount).toBe(3);
  });

  it('snapshot avec un exercice non réalisé (pas « oublié » auto)', () => {
    let data = {
      checkedExercises: { [`${D}_101`]: true, [`${D}_102`]: true },
      reps: { [`${D}_101`]: '30', [`${D}_102`]: '32' },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A, EX_B, EX_C]);

    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.notRealizedExercises).toHaveLength(1);
    expect(row.notRealizedExercises[0].name).toBe('C');
    expect(row.notRealizedExercises[0].status).toBe(REALIZATION.NOT_REALIZED);
    expect(row.notRealizedExercises[0].gapKind).toBe('unchecked');
    expect(row.gaps.some((g) => g.kind === 'forgotten')).toBe(false);
  });

  it('snapshot avec exécution partielle (sets structurés < prescrit)', () => {
    let data = {
      checkedExercises: { [`${D}_102`]: true },
      reps: { [`${D}_102`]: '16' },
      exerciseSetLogs: {
        [`${D}_102`]: {
          sets: [{ reps: 8 }, { reps: 8 }]
        }
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_B]); // 4×8 prescrit, 2 sets observés

    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.partiallyRealizedExercises).toHaveLength(1);
    expect(row.partiallyRealizedExercises[0].status).toBe(REALIZATION.PARTIALLY_REALIZED);
    expect(row.partiallyRealizedExercises[0].partialReason).toBe('sets_2_of_4');
    expect(row.denominator.partiallyRealizedCount).toBe(1);
  });

  it('snapshot avec exercice supplémentaire déclaré + hors-plan', () => {
    let data = {
      checkedExercises: {
        [`${D}_101`]: true,
        [`${D}_102`]: true,
        [`${D}_999`]: true
      },
      reps: {
        [`${D}_101`]: '30',
        [`${D}_102`]: '32',
        [`${D}_999`]: '20'
      },
      dailyVariations: {
        [D]: {
          suppressedExercises: [],
          additionalExercises: [
            { id: 888, name: 'Extra déclaré', series: '3×10', completed: true, isExceptional: true }
          ]
        }
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A, EX_B]);

    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.supplementalExercises.length).toBeGreaterThanOrEqual(2);
    expect(row.supplementalExercises.some((s) => s.gapKind === 'declared_additional')).toBe(true);
    expect(row.supplementalExercises.some((s) => s.gapKind === 'off_plan_touch')).toBe(true);
    expect(row.denominator.usableForAdherenceRate).toBe(true);
    expect(row.denominator.plannedCount).toBe(2);
  });

  it('jour reconstruit sans plan connu', () => {
    const data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: { [`${D}_101`]: '30' },
      calendarDayPlanSnapshots: {}
    };
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.planSource).toBe(PLAN_SOURCE.RECONSTRUCT);
    expect(row.reliability).toBe(RELIABILITY.REALIZED_ONLY);
    expect(row.planKnowledge).toBe(PLAN_KNOWLEDGE.UNKNOWN);
    expect(row.plannedExercises).toHaveLength(0);
    expect(row.realizedExercises.length).toBeGreaterThanOrEqual(1);
    expect(row.denominator.usableForAdherenceRate).toBe(false);
    expect(row.denominator.adherenceBucket).toBe('exclude:reconstruct');
    expect(row.missingDataFlags).toContain('plan_unknown_reconstruct_only');
  });

  it('jour live sans snapshot : jamais vérité historique', () => {
    const data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    const row = buildDayPlanRealizationRow({
      dateStr: D,
      workoutData: data,
      liveExercises: [EX_A, EX_B]
    });
    expect(row.planSource).toBe(PLAN_SOURCE.LIVE);
    expect(row.reliability).toBe(RELIABILITY.PROVISIONAL);
    expect(row.planKnowledge).toBe(PLAN_KNOWLEDGE.PROVISIONAL_LIVE);
    expect(row.plannedExercises.every((p) => p.status === REALIZATION.INDETERMINATE)).toBe(true);
    expect(row.denominator.usableForAdherenceRate).toBe(false);
    expect(row.missingDataFlags).toContain('plan_live_not_historical');
  });

  it('journée sans aucune activité', () => {
    const data = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data, liveExercises: [] });
    expect(row.planSource).toBe(PLAN_SOURCE.NONE);
    expect(row.reliability).toBe(RELIABILITY.NONE);
    expect(row.hasClassicActivity).toBe(false);
    expect(row.hasGtgActivity).toBe(false);
    expect(row.denominator.usableForAdherenceRate).toBe(false);
    expect(row.missingDataFlags).toContain('no_activity_no_snapshot');
  });

  it('exercice supprimé explicitement (suppressed)', () => {
    let data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: { [`${D}_101`]: '30' },
      dailyVariations: {
        [D]: {
          suppressedExercises: [102],
          additionalExercises: []
        }
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A, EX_B]);

    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.suppressedExercises).toHaveLength(1);
    expect(row.suppressedExercises[0].status).toBe(REALIZATION.SUPPRESSED);
    expect(row.denominator.primary).toBe('adjusted');
    expect(row.denominator.adjusted.plannedCount).toBe(1); // B exclu
    expect(row.denominator.initial.plannedCount).toBe(2); // A+B plan figé
    expect(row.denominator.plannedCount).toBe(1); // alias adjusted
    expect(row.denominator.suppressedCount).toBe(1);
    expect(row.suppressedExercises[0].name).toBe('B'); // visible historiquement
    expect(row.notRealizedExercises.some((e) => e.matchKey === 'exo_b' || e.id === 102)).toBe(false);
  });

  it('variante A/B : une seule réalisation comptée (pas de double)', () => {
    let data = {
      checkedExercises: {
        [`${D}_101_semaineA`]: true,
        [`${D}_101_semaineB`]: true
      },
      reps: {
        [`${D}_101_semaineA`]: '30',
        [`${D}_101_semaineB`]: '28'
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A], { variant: 'salle_semaineA' });

    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.variant).toBe('salle_semaineA');
    expect(row.plannedExercises).toHaveLength(1);
    expect(row.realizedExercises).toHaveLength(1);
    expect(row.denominator.plannedCount).toBe(1);
    expect(row.denominator.realizedCount).toBe(1);
  });

  it('GTG hors séance classique : canal séparé, pas dans le dénominateur plan', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      calendarDayPlanSnapshots: {},
      enduranceData: {
        gtg: {
          config: {
            selectedIds: ['pullups'],
            scheduleFrom: '08:00',
            scheduleTo: '20:00',
            intervalHours: 2
          },
          days: {
            [D]: {
              exercises: {
                pullups: {
                  slots: { '0': { done: true, updatedAt: '2026-10-10T10:00:00.000Z' } }
                }
              }
            }
          },
          workoutSync: {}
        }
      }
    };
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data, liveExercises: [] });
    expect(row.hasGtgActivity).toBe(true);
    expect(row.hasClassicActivity).toBe(false);
    expect(row.gtg.exerciseIds.map(String)).toContain('pullups');
    expect(row.denominator.usableForAdherenceRate).toBe(false);
    expect(row.plannedExercises).toHaveLength(0);
  });

  it('absence de double comptage sur matchKey originalId/id', () => {
    expect(exerciseMatchKey({ id: 101, originalId: 'exo_a' })).toBe('exo_a');
    let data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: { [`${D}_101`]: '30' },
      calendarDayPlanSnapshots: {}
    };
    // Même exo listé deux fois dans le snapshot (ne devrait pas arriver, mais défense)
    data = withSnap(data, [
      EX_A,
      { id: 101, originalId: 'exo_a', name: 'A dup', series: '3×10' }
    ]);
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.plannedExercises).toHaveLength(1);
    expect(row.realizedExercises).toHaveLength(1);
  });

  it('dénominateurs et états de fiabilité : matrice n’agrège pas les sources', () => {
    const snapDate = '2026-10-01';
    const reconDate = '2026-10-02';
    const liveDate = '2026-10-03';
    const emptyDate = '2026-10-04';

    let data = {
      checkedExercises: {
        [`${snapDate}_101`]: true,
        [`${reconDate}_101`]: true
      },
      reps: {
        [`${snapDate}_101`]: '30',
        [`${reconDate}_101`]: '20'
      },
      calendarDayPlanSnapshots: {}
    };
    data = withDayPlanSnapshot(
      data,
      snapDate,
      buildDayPlanSnapshotFromExercises({
        dateStr: snapDate,
        exercises: [EX_A, EX_B],
        programId: 'p'
      })
    );

    const matrix = buildPlanRealizationMatrix({
      workoutData: data,
      window: { start: snapDate, end: emptyDate },
      liveExercisesByDate: {
        [liveDate]: [EX_A]
      }
    });

    expect(matrix.byReliability.high).toContain(snapDate);
    expect(matrix.byReliability.realized_only).toContain(reconDate);
    expect(matrix.byReliability.provisional).toContain(liveDate);
    expect(matrix.byReliability.none).toContain(emptyDate);

    expect(matrix.adherenceSnapshotOnly.dayCount).toBe(1);
    expect(matrix.adherenceSnapshotOnly.plannedSlots).toBe(2);
    expect(matrix.adherenceSnapshotOnly.realizedSlots).toBe(1);
    expect(matrix.adherenceSnapshotOnly.notRealizedSlots).toBe(1);
    expect(matrix.adherenceSnapshotOnly.rateFull).toBe(0.5);
    expect(matrix.limits).toContain('live_days_excluded_from_adherence');
    expect(matrix.limits).toContain('reconstruct_days_exclude_skip_detection');

    const snapRow = matrix.days.find((d) => d.date === snapDate);
    const reconRow = matrix.days.find((d) => d.date === reconDate);
    expect(snapRow.denominator.usableForAdherenceRate).toBe(true);
    expect(reconRow.denominator.usableForAdherenceRate).toBe(false);
  });

  it('classifyPlanMeta couvre les quatre sources', () => {
    expect(classifyPlanMeta('snapshot', { hasPlanList: true, hasActivity: true })).toEqual({
      planSource: 'snapshot',
      reliability: 'high',
      planKnowledge: 'known'
    });
    expect(classifyPlanMeta('reconstruct', { hasPlanList: true, hasActivity: true }).reliability).toBe(
      'realized_only'
    );
    expect(classifyPlanMeta('live', { hasPlanList: true, hasActivity: false }).planKnowledge).toBe(
      'provisional_live'
    );
    expect(classifyPlanMeta('none', { hasPlanList: false, hasActivity: false }).reliability).toBe(
      'none'
    );
  });

  it('GTG + snapshot classique : GTG n’entre pas dans plannedCount', () => {
    let data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: { [`${D}_101`]: '30' },
      enduranceData: {
        gtg: {
          config: {
            selectedIds: ['pullups'],
            scheduleFrom: '08:00',
            scheduleTo: '20:00',
            intervalHours: 2
          },
          days: {
            [D]: {
              exercises: {
                pullups: {
                  slots: { '0': { done: true, updatedAt: '2026-10-10T08:00:00.000Z' } }
                }
              }
            }
          },
          workoutSync: {}
        }
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A, EX_B]);
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.hasGtgActivity).toBe(true);
    expect(row.hasClassicActivity).toBe(true);
    expect(row.denominator.plannedCount).toBe(2);
    expect(row.realizedExercises).toHaveLength(1);
    expect(row.notRealizedExercises).toHaveLength(1);
  });

  it('snapshot reconstruit persisté ≠ plan historique (fiabilité realized_only)', () => {
    const data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: { [`${D}_101`]: '30' },
      calendarDayPlanSnapshots: {
        [D]: {
          dateStr: D,
          capturedAt: '2026-10-28T12:00:00.000Z',
          programId: 'reconstructed',
          reconstructed: true,
          variant: null,
          exercises: [
            {
              storageId: '101',
              originalId: '101',
              name: 'A reconstruit',
              series: ''
            }
          ]
        }
      }
    };
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.planSource).toBe(PLAN_SOURCE.RECONSTRUCT);
    expect(row.reliability).toBe(RELIABILITY.REALIZED_ONLY);
    expect(row.denominator.usableForAdherenceRate).toBe(false);
    expect(row.plannedExercises).toHaveLength(0);
    expect(row.realizedExercises.length).toBeGreaterThanOrEqual(1);
  });

  it('coché sans reps/sets : realized + checkedOnly (pas not_realized)', () => {
    let data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: {},
      exerciseSetLogs: {},
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A]);
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.realizedExercises).toHaveLength(1);
    expect(row.realizedExercises[0].executionSignals.checkedOnly).toBe(true);
    expect(row.notRealizedExercises).toHaveLength(0);
  });

  it('reps sans coche : partially_realized (pas absence totale)', () => {
    let data = {
      checkedExercises: {},
      reps: { [`${D}_101`]: '24' },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A]);
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.partiallyRealizedExercises).toHaveLength(1);
    expect(row.partiallyRealizedExercises[0].gapKind).toBe('uncchecked_with_data');
    expect(row.notRealizedExercises).toHaveLength(0);
  });

  it('remplacement potentiel : signal unconfirmed, jamais affirmé', () => {
    let data = {
      checkedExercises: { [`${D}_101`]: true, [`${D}_999`]: true },
      reps: { [`${D}_101`]: '30', [`${D}_999`]: '10' },
      dailyVariations: {
        [D]: {
          suppressedExercises: [],
          additionalExercises: [{ id: 999, name: 'Remplaçant?', completed: true }]
        }
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A, EX_B]); // B non fait + supplémentaire
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.notRealizedExercises.some((e) => e.name === 'B')).toBe(true);
    expect(row.supplementalExercises.length).toBeGreaterThanOrEqual(1);
    expect(row.gaps.some((g) => g.kind === 'possible_replacement_unconfirmed')).toBe(true);
    expect(row.gaps.some((g) => g.kind === 'replaced')).toBe(false);
  });

  it('GTG + même id classique : overlap annoté via mapping pullups→101, dénominateur inchangé', () => {
    // EX_A.id = 101 ; GTG builtin pullups se résout aussi sur storage 101
    let data = {
      checkedExercises: { [`${D}_101`]: true },
      reps: { [`${D}_101`]: '30' },
      enduranceData: {
        gtg: {
          config: {
            selectedIds: ['pullups', 'dips'],
            scheduleFrom: '08:00',
            scheduleTo: '20:00',
            intervalHours: 2
          },
          days: {
            [D]: {
              exercises: {
                pullups: {
                  slots: { '0': { done: true, updatedAt: '2026-10-10T08:00:00.000Z' } }
                },
                dips: {
                  slots: { '0': { done: true, updatedAt: '2026-10-10T09:00:00.000Z' } }
                }
              }
            }
          },
          workoutSync: {}
        }
      },
      calendarDayPlanSnapshots: {}
    };
    data = withSnap(data, [EX_A]);
    const row = buildDayPlanRealizationRow({ dateStr: D, workoutData: data });
    expect(row.hasGtgActivity).toBe(true);
    expect(row.gtg.overlapWithClassicIds.map(String)).toContain('pullups');
    expect(row.gtg.exclusiveGtgIds.map(String)).toContain('dips');
    expect(row.denominator.adjusted.plannedCount).toBe(1);
    expect(row.realizedExercises).toHaveLength(1);
  });
});
