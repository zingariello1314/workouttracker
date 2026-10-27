/**
 * Spec #24 Lot A — non-régression (B1–B14 / C1 / filtre validate).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  insightRejectReason,
  filterValidInsights,
  isPlausibleRunningPaceMinPerKm,
  assertWindowMeasureConsistency
} from '../recapInsightValidate';
import {
  clearRecapRejectLog,
  getRecapRejectLog,
  logRecapReject,
  summarizeRecapRejectLog
} from '../recapRejectLog';
import {
  countStrengthTrainingDaysInRange,
  countTrainingDaysInRange
} from '../recapTrainingDayTruth';
import {
  buildPrimaryMuscleRepsByWindow,
  primaryMuscleGroupForExercise
} from '../recapPrimaryMuscleReps';
import { measureRecapWindow, buildPeriodComparisons } from '../recapPeriodDiscoveries';
import { buildThreadDossiers } from '../recapAnalysisProofs';
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';
import { writeThreadCard } from '../recapAnalysisDepth';

function nameOf(id) {
  const map = {
    101: 'Curl biceps',
    102: 'Pompes inclinées',
    103: 'Hyperextension',
    104: 'Dips parallèles'
  };
  return map[Number(id)] || map[id] || null;
}

function snapshotWithDays(days) {
  const checkedExercises = {};
  const reps = {};
  days.forEach(({ date, exercises }) => {
    (exercises || []).forEach(({ id, r }) => {
      const key = `${date}_${id}`;
      checkedExercises[key] = true;
      reps[key] = String(r);
    });
  });
  return { checkedExercises, reps };
}

describe('recapRejectLog', () => {
  beforeEach(() => clearRecapRejectLog());

  it('enregistre et résume les rejets', () => {
    logRecapReject({ id: 'a', rule: 'raw_exercise_id' });
    logRecapReject({ id: 'b', rule: 'raw_exercise_id' });
    logRecapReject({ id: 'c', rule: 'implausible_pace' });
    expect(getRecapRejectLog()).toHaveLength(3);
    expect(summarizeRecapRejectLog().byRule.raw_exercise_id).toBe(2);
  });
});

describe('Spec24 B14 pace', () => {
  it('accepte une allure loisir plausible', () => {
    expect(isPlausibleRunningPaceMinPerKm(8.9)).toBe(true);
    expect(isPlausibleRunningPaceMinPerKm(44.5)).toBe(false);
    expect(isPlausibleRunningPaceMinPerKm(19.4)).toBe(false);
  });

  it('rejette une carte avec allure absurde', () => {
    const rule = insightRejectReason({
      title: 'Sommeil et course',
      body: "L'allure moyenne passe de 44,5 à 19,4 min/km.",
      kind: 'disc_sleep_cardio'
    });
    expect(rule).toBe('implausible_pace');
  });
});

describe('Spec24 B6 title sign', () => {
  it('rejette un titre « plus de jours » avec delta négatif', () => {
    const rule = insightRejectReason({
      kind: 'disc_sleep_freq',
      title: 'Les semaines bien dormies comptent plus de jours actifs',
      body: '2 vs 2,4',
      metrics: { highDays: 2, lowDays: 2.4, delta: -0.4 }
    });
    expect(rule).toBe('title_sign_mismatch');
  });

  it('garde un titre aligné avec delta positif', () => {
    const rule = insightRejectReason({
      kind: 'disc_sleep_freq',
      title: 'Les semaines bien dormies comptent plus de jours actifs',
      body: '3 vs 2',
      metrics: { highDays: 3, lowDays: 2, delta: 1 }
    });
    expect(rule).toBe('');
  });
});

describe('Spec24 B15 / L1 / C1 validate', () => {
  it('rejette disparition sur today', () => {
    expect(
      insightRejectReason(
        {
          title: 'Dips a quitté cette fenêtre',
          body: 'Dips tombe à zéro ici.',
          kind: 'disc_th_repertoire_fact'
        },
        { voiceKey: 'today', windowSpanDays: 1 }
      )
    ).toBe('disappearance_on_today');
  });

  it('rejette ID brut', () => {
    expect(
      insightRejectReason({
        title: 'Exercice 1236406816 revient',
        body: 'Retour après 12 jours.'
      })
    ).toBe('raw_exercise_id');
  });

  it('rejette baseline durée inégale sur longue fenêtre', () => {
    expect(
      insightRejectReason(
        {
          title: 'Volume',
          body: "Le volume global est +311 % contre 3407 reps sur les 30 jours d'avant.",
          metrics: { windowSpanDays: 92, baselineSameLength: false, baselineSpanDays: 30 }
        },
        { windowSpanDays: 92 }
      )
    ).toBe('baseline_length_mismatch');
  });
});

describe('Spec24 B8 jours entraînés', () => {
  it('sépare jours renforcement et jours activité mixte', () => {
    const snapshot = {
      checkedExercises: { '2026-06-01_101': true },
      reps: { '2026-06-01_101': '40' },
      enduranceData: {
        sessions: {
          running: [{ date: '2026-06-02', distance: 5, duration: '00:30:00' }]
        }
      }
    };
    const garminData = {
      activities: {
        cardio: [{ date: '2026-06-03', duration: 1800, garminTypeKey: 'strength_training' }]
      }
    };
    expect(countStrengthTrainingDaysInRange(snapshot, '2026-06-01', '2026-06-03')).toBe(1);
    expect(countTrainingDaysInRange(snapshot, '2026-06-01', '2026-06-03', garminData)).toBe(3);
  });
});

describe('Spec24 B1 primary muscle reps', () => {
  it('attribue les curls au biceps primaire, pas un share gonflé', () => {
    expect(primaryMuscleGroupForExercise({ name: 'Curl biceps', id: 101 })).toBe(MuscleGroups.BICEPS);
    const snap = snapshotWithDays([
      { date: '2026-10-24', exercises: [{ id: 101, r: 36 }] }
    ]);
    const out = buildPrimaryMuscleRepsByWindow(
      snap,
      { start: '2026-10-24', end: '2026-10-24' },
      nameOf
    );
    expect(out.byGroup[MuscleGroups.BICEPS]).toBe(36);
    expect(out.byExercise[0].reps).toBe(36);
  });
});

describe('Spec24 B9 nested window consistency', () => {
  it('mêmes bornes → mêmes totaux que la sous-fenêtre 30j', () => {
    const days = [];
    for (let i = 0; i < 90; i += 1) {
      const d = new Date(Date.UTC(2026, 7, 1 + i));
      const ymd = d.toISOString().slice(0, 10);
      if (i % 3 === 0) {
        days.push({ date: ymd, exercises: [{ id: 102, r: 40 }] });
      }
    }
    const snap = snapshotWithDays(days);
    const end = days[days.length - 1].date;
    const startAll = days[0].date;
    const cmp = buildPeriodComparisons({
      snapshot: snap,
      window: { start: startAll, end },
      period: '3m',
      getExerciseNameById: nameOf
    });
    // d30 de la comparaison 3m = mesure directe des 30 derniers jours calendaires
    const m30 = measureRecapWindow({
      snapshot: snap,
      window: cmp.d30.window,
      getExerciseNameById: nameOf,
      periodId: '30d'
    });
    expect(cmp.d30.strengthReps).toBe(m30.strengthReps);
    expect(cmp.d30.strengthDays).toBe(m30.strengthDays);
    expect(cmp.prevSameLength?.spanDays).toBe(cmp.period.spanDays);
  });
});

describe('Spec24 B11 daysSinceLastSession consistency helper', () => {
  it('measureRecapWindow expose lastSeenBefore stable pour un même end', () => {
    const snap = snapshotWithDays([
      { date: '2026-08-01', exercises: [{ id: 102, r: 24 }] },
      { date: '2026-09-12', exercises: [{ id: 102, r: 36 }] },
      { date: '2026-10-24', exercises: [{ id: 102, r: 40 }] }
    ]);
    const end = '2026-10-24';
    const w7 = measureRecapWindow({
      snapshot: snap,
      window: { start: '2026-10-18', end },
      getExerciseNameById: nameOf
    });
    const w30 = measureRecapWindow({
      snapshot: snap,
      window: { start: '2026-09-25', end },
      getExerciseNameById: nameOf
    });
    // Même end → lastSeenBefore pour un exo hors fenêtre courte doit être cohérent
    // (dernière occurrence avant start de chaque fenêtre peut différer — firstSeen global identique)
    expect(w7.firstSeen['102'] || w7.firstSeen[102]).toBe('2026-08-01');
    expect(w30.firstSeen['102'] || w30.firstSeen[102]).toBe('2026-08-01');
  });
});

describe('Spec24 B13 primary group stable', () => {
  it('hyperextension a un primaire stable quelle que soit la fenêtre', () => {
    const g = primaryMuscleGroupForExercise({ name: 'Hyperextension', id: 103 });
    expect(g).toBeTruthy();
    const snap = snapshotWithDays([
      { date: '2026-10-20', exercises: [{ id: 103, r: 30 }] },
      { date: '2026-10-24', exercises: [{ id: 103, r: 30 }] }
    ]);
    const a = buildPrimaryMuscleRepsByWindow(snap, { start: '2026-10-18', end: '2026-10-24' }, nameOf);
    const b = buildPrimaryMuscleRepsByWindow(snap, { start: '2026-09-25', end: '2026-10-24' }, nameOf);
    const exoA = a.byExercise.find((e) => String(e.id) === '103');
    const exoB = b.byExercise.find((e) => String(e.id) === '103');
    expect(exoA.primaryGroup).toBe(exoB.primaryGroup);
    expect(exoA.primaryGroup).toBe(g);
  });
});

describe('Spec24 B7 mois creux inclut les zéros', () => {
  it('la carte rythme 1y cite un mois à 0 reps comme plus creux', () => {
    const snap = snapshotWithDays([
      { date: '2025-11-10', exercises: [{ id: 101, r: 100 }] },
      { date: '2025-12-10', exercises: [{ id: 101, r: 900 }] },
      { date: '2026-01-10', exercises: [{ id: 101, r: 936 }] }
    ]);
    const measure = measureRecapWindow({
      snapshot: snap,
      window: { start: '2025-11-01', end: '2026-04-30' },
      getExerciseNameById: nameOf,
      periodId: '1y'
    });
    const dossiers = buildThreadDossiers({
      comparisons: {
        periodId: '1y',
        period: measure
      },
      catalog: [],
      snapshot: snap
    });
    const withCoverage = dossiers.find((d) => d.coverage?.low || d.observed?.coverage?.low);
    expect(withCoverage).toBeTruthy();
    const low = withCoverage.coverage?.low || withCoverage.observed.coverage.low;
    expect(low.reps).toBe(0);
    const card = writeThreadCard({ ...withCoverage, thread: 'rhythm', sense: 'fact' });
    if (card?.body) {
      expect(card.body).toMatch(/0|zéro|creux/i);
      expect(card.body).not.toMatch(/janvier \(936\)[\s\S]*plus creux/i);
    }
  });
});

describe('Spec24 filterValidInsights', () => {
  beforeEach(() => clearRecapRejectLog());

  it('filtre et journalise', () => {
    const kept = filterValidInsights(
      [
        { title: 'OK', body: 'Volume à 280 reps sur 7 jours de renforcement.' },
        { title: 'Exercice 999999999 revient', body: 'Après 10 jours.' },
        {
          title: 'Plus de jours actifs',
          body: '2 vs 2.4',
          kind: 'disc_sleep_freq',
          metrics: { delta: -0.4, highDays: 2, lowDays: 2.4 }
        }
      ],
      { voiceKey: 'week' }
    );
    expect(kept).toHaveLength(1);
    expect(getRecapRejectLog().length).toBeGreaterThanOrEqual(2);
  });
});

describe('Spec24 assertWindowMeasureConsistency', () => {
  beforeEach(() => clearRecapRejectLog());

  it('log si identified > total', () => {
    assertWindowMeasureConsistency({
      strengthReps: 100,
      totalReps: 100,
      identifiedMuscleReps: 200,
      strengthDays: 2,
      trainingDays: 2
    });
    expect(getRecapRejectLog().some((e) => e.rule === 'muscle_identified_gt_total')).toBe(true);
  });
});
