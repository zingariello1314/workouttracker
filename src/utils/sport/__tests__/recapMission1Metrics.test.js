import { describe, expect, it } from 'vitest';
import { buildRecapPeriodCalendarAnalytics } from '../recapCalendarPeriodAnalytics';
import { describeActivityDuration } from '../recapPeriodVoice';
import { earliestCoveredYmd, getRecapDateWindow, resolveRecapPeriodWindow } from '../recapMuscleLoadEngine';
import { calendarDayEvidence } from '../recapTemporalContracts';
import { countFrozenPlanDays } from '../recapCompletionTruth';
import { measureRecapWindow } from '../recapPeriodMeasure';
import { analysisEditionKey, cacheReuseDecision } from '../analysisEdition';
import { checkedVolumeFingerprint } from '../../../hooks/useRecapTabMetrics';
import {
  classifyDisappearedCards,
  phenomenonIdentity,
  snapshotWithIsolatedReps
} from '../analysisEnvironmentDossier';

function workoutWithChecks(dates) {
  const checkedExercises = {};
  dates.forEach((date) => {
    checkedExercises[`${date}_ex`] = true;
  });
  return { checkedExercises, reps: {} };
}

describe('série de jours — la tuile suit la fenêtre, pas le mois entier', () => {
  const workout = workoutWithChecks([
    '2026-11-01',
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-13',
    '2026-11-14'
  ]);

  it('une fenêtre du 12 au 18 novembre vaut 2 jours, pas les 5 du début de mois', () => {
    const analytics = buildRecapPeriodCalendarAnalytics({
      workoutData: workout,
      garminData: null,
      period: '7d',
      periodWindow: { start: '2026-11-12', end: '2026-11-18' },
      getExerciseNameById: () => '',
      phase: 'header'
    });
    expect(analytics.periodStats.longestStreak).toBe(2);
    expect(analytics.streakRange).toMatchObject({
      length: 2,
      startDate: '2026-11-13',
      endDate: '2026-11-14'
    });
  });

  it('un mois coupé par la fenêtre est marqué portion et ne compte pas les jours hors fenêtre', () => {
    const analytics = buildRecapPeriodCalendarAnalytics({
      workoutData: workout,
      garminData: null,
      period: '7d',
      periodWindow: { start: '2026-11-12', end: '2026-11-18' },
      getExerciseNameById: () => '',
      phase: 'full'
    });
    const november = analytics.months.find((row) => row.ym === '2026-11');
    expect(november.partial).toBe(true);
    expect(november.label).toContain('(portion)');
    expect(november.sportStats.longestStreak).toBe(2);
  });

  it('un mois entièrement couvert reste un mois complet', () => {
    const analytics = buildRecapPeriodCalendarAnalytics({
      workoutData: workout,
      garminData: null,
      period: '30d',
      periodWindow: { start: '2026-11-01', end: '2026-11-30' },
      getExerciseNameById: () => '',
      phase: 'full'
    });
    const november = analytics.months.find((row) => row.ym === '2026-11');
    expect(november.partial).toBe(false);
    expect(november.label).not.toContain('(portion)');
    expect(november.sportStats.longestStreak).toBe(5);
  });
});

describe('durées — deux populations, deux noms', () => {
  it('nomme le temps total et la part hors course quand ils divergent', () => {
    expect(
      describeActivityDuration({ minutes: 9, totalMinutes: 195, runningMinutes: 186 })
    ).toBe(
      "3 h 15 d'activité enregistrée, dont 9 min de séances hors course et 3 h 06 de course"
    );
  });

  it('nomme hors course quand la durée mesurée ne contient pas la course', () => {
    expect(describeActivityDuration({ minutes: 195, totalMinutes: 195, runningMinutes: 0 })).toBe(
      '3 h 15 de séances hors course enregistrées'
    );
  });
});

describe('Toujours — la fenêtre part de la première preuve', () => {
  it('laisse getRecapDateWindow(all) sans début inventé', () => {
    expect(getRecapDateWindow('all', new Date('2026-11-18T12:00:00')).start).toBeNull();
  });

  it('résout le début sur la preuve la plus ancienne, Garmin inclus', () => {
    const snapshot = {
      reps: { '2026-01-05::1': 10 },
      checkedExercises: { '2026-01-05_1': true },
      enduranceData: { sessions: { run: [{ date: '2025-06-02' }] } }
    };
    const garmin = { dailyMetrics: { '2024-11-19': { activeKcal: 10 } } };
    expect(earliestCoveredYmd(snapshot, garmin)).toBe('2024-11-19');
    const window = resolveRecapPeriodWindow('all', snapshot, garmin, new Date('2026-11-18T12:00:00'));
    expect(window.start).toBe('2024-11-19');
    expect(window.coverage).toBe('first-evidence');
    expect(window.end).toBe('2026-11-18');
  });

  it('ne fabrique pas de début s’il n’y a aucune preuve', () => {
    const window = resolveRecapPeriodWindow('all', {}, null, new Date('2026-11-18T12:00:00'));
    expect(window.start).toBeNull();
  });
});

describe('GTG synchronisé — hors du total classique', () => {
  it('retire du bandeau et de la mesure les reps déjà comptées comme GTG', () => {
    const workout = {
      reps: { '2026-11-13_101': 100 },
      checkedExercises: { '2026-11-13_101': true },
      enduranceData: {
        gtg: {
          config: { selectedIds: ['pullups'] },
          days: {},
          workoutSync: { '2026-11-13': { pullups: 40 } }
        }
      }
    };
    const analytics = buildRecapPeriodCalendarAnalytics({
      workoutData: workout,
      garminData: null,
      period: 'today',
      periodWindow: { start: '2026-11-13', end: '2026-11-13' },
      getExerciseNameById: () => 'Tractions',
      phase: 'header'
    });
    const measured = measureRecapWindow({
      snapshot: workout,
      window: { start: '2026-11-13', end: '2026-11-13' },
      getExerciseNameById: () => 'Tractions'
    });
    expect(analytics.periodStats.totalReps).toBe(60);
    expect(measured.totalReps).toBe(60);
    expect(measured.strengthReps).toBe(60);
  });
});

describe('programme historique — pas d’assiduité sans plan figé', () => {
  it('ne compte comme preuve que les snapshots avec exercices', () => {
    const snapshot = {
      calendarDayPlanSnapshots: {
        '2026-11-16': { exercises: [{ storageId: '101', name: 'Tractions' }] },
        '2026-11-17': { exercises: [] },
        '2026-10-01': { exercises: [{ storageId: '101', name: 'Tractions' }] }
      }
    };
    expect(countFrozenPlanDays(snapshot, { start: '2026-11-12', end: '2026-11-18' })).toBe(1);
  });
});

describe('journée calendaire — enregistré n’est pas absence de couverture', () => {
  it('distingue un jour vide d’un snapshot absent', () => {
    const snapshot = { reps: { '2026-11-16_101': 10 }, checkedExercises: {} };
    expect(calendarDayEvidence(snapshot, '2026-11-16')).toBe('recorded');
    expect(calendarDayEvidence(snapshot, '2026-11-18')).toBe('no-recording');
    expect(calendarDayEvidence(null, '2026-11-18')).toBe('coverage-unknown');
  });
});

describe('cache — l’édition et la période décident, sans effacer l’ancien', () => {
  it('restaure une édition exacte et refuse période, édition, donnée ou réponse plus vieille', () => {
    const edition = analysisEditionKey();
    const base = {
      storedEdition: edition,
      currentEdition: edition,
      storedPeriod: '7d',
      requestedPeriod: '7d',
      storedFingerprint: 'a',
      requestedFingerprint: 'a',
      storedAt: 20,
      incomingAt: 20
    };
    expect(cacheReuseDecision(base)).toEqual({ reuse: true, reason: 'exact_edition' });
    expect(cacheReuseDecision({ ...base, requestedPeriod: '30d' }).reason).toBe('period_mismatch');
    expect(cacheReuseDecision({ ...base, currentEdition: `${edition};temporal=next` }).reason).toBe(
      'edition_mismatch'
    );
    expect(cacheReuseDecision({ ...base, requestedFingerprint: 'b' }).reason).toBe('data_changed');
    expect(cacheReuseDecision({ ...base, incomingAt: 10 }).reason).toBe('stale_worker_response');
  });

  it('ignore une annotation sans effet sur les reps, les charges ou les séries', () => {
    const snapshot = { checkedExercises: { '2026-11-13_101': true }, reps: { '2026-11-13_101': 40 } };
    const annotated = { ...snapshot, uiHint: 'brouillon' };
    expect(checkedVolumeFingerprint(annotated)).toBe(checkedVolumeFingerprint(snapshot));
    expect(checkedVolumeFingerprint({ ...snapshot, reps: { '2026-11-13_101': 41 } })).not.toBe(
      checkedVolumeFingerprint(snapshot)
    );
  });
});

describe('identité de phénomène — le titre seul ne suffit pas', () => {
  it('sépare deux sujets qui porteraient le même titre', () => {
    const a = { kind: 'journey_abandoned', title: 'Sorti de la rotation', metrics: { exerciseId: '301' } };
    const b = { kind: 'journey_abandoned', title: 'Sorti de la rotation', metrics: { exerciseId: '104' } };
    expect(phenomenonIdentity(a)).not.toBe(phenomenonIdentity(b));
  });
});

describe('expérience isolée — classification sans toucher aux données', () => {
  it('ajoute 332 reps sur une copie et laisse l’original intact', () => {
    const snapshot = { reps: { '2026-11-16::a': 319 }, checkedExercises: { '2026-11-16_a': true } };
    const copy = snapshotWithIsolatedReps(snapshot, { date: '2026-11-17', reps: 332 });
    expect(snapshot.reps['2026-11-17::__mission1_isolated_reps__']).toBeUndefined();
    expect(copy.reps['2026-11-17::__mission1_isolated_reps__']).toBe(332);
    expect(copy.checkedExercises['2026-11-17___mission1_isolated_reps__']).toBe(true);
    expect(copy.reps['2026-11-16::a']).toBe(319);
  });

  it('situe la disparition à la dernière étape encore présente', () => {
    const before = [{ kind: 'disc_kcal_profile', title: 'Dépense' }];
    const after = {
      insights: { shortTerm: [], mediumTerm: [], longTerm: [] },
      diagnostic: {
        candidateStages: {
          produced: [{ kind: 'disc_kcal_profile', title: 'Dépense' }],
          afterDedup: [{ kind: 'disc_kcal_profile', title: 'Dépense' }],
          valid: [],
          shown: []
        }
      }
    };
    expect(classifyDisappearedCards(before, after)).toEqual([
      { kind: 'disc_kcal_profile', title: 'Dépense', lastStage: 'dropped_after_dedup' }
    ]);
  });
});
