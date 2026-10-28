import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  assertDiscoveryPeriodScope,
  buildPeriodActivityContext,
  filterDiscoveriesByPeriodScope,
  filterRunDaysToWindow,
  withDiscoveryScope
} from '../recapDiscoveryPeriodScope';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';

function addCheck(snapshot, date, exId, reps) {
  snapshot.reps[`${date}_${exId}`] = String(reps);
  snapshot.checkedExercises[`${date}_${exId}`] = true;
}

function runAct(date, km = 5, minutes = 30) {
  return {
    date,
    activityType: 'running',
    activityName: 'Course',
    distance: km * 1000,
    duration: minutes * 60
  };
}

function sleepNight(date, hours = 7.8) {
  return {
    date,
    sleep: {
      sleepTimeSeconds: Math.round(hours * 3600),
      deepSleepSeconds: 3600,
      lightSleepSeconds: 7200,
      remSleepSeconds: 3600
    }
  };
}

describe('recapDiscoveryPeriodScope — 22.I', () => {
  it('filterRunDaysToWindow ignore les sorties hors fenêtre', () => {
    const days = [
      { date: '2026-10-01', km: 5 },
      { date: '2026-10-05', km: 6 },
      { date: '2026-09-20', km: 8 }
    ];
    expect(
      filterRunDaysToWindow(days, { start: '2026-10-01', end: '2026-10-07' }).map((d) => d.date)
    ).toEqual(['2026-10-01', '2026-10-05']);
  });

  it('0 course / 7j → disc_sleep_cardio et disc_cardio_strength rejetés', () => {
    const end = '2026-10-07';
    const start = '2026-10-01';
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 5; i += 1) {
      const d = DateHelper.addDays(start, i);
      addCheck(snapshot, d, 101, 120);
      addCheck(snapshot, d, 102, 80);
    }
    // Courses uniquement hors fenêtre
    const garminData = {
      activities: {
        cardio: [
          runAct('2026-09-10', 8, 45),
          runAct('2026-09-12', 7, 40),
          runAct('2026-09-14', 9, 50),
          runAct('2026-09-16', 6, 35),
          runAct('2026-09-18', 10, 55),
          runAct('2026-09-20', 8, 42)
        ]
      },
      dailyMetrics: {}
    };
    for (let i = 0; i < 20; i += 1) {
      const d = DateHelper.addDays('2026-09-01', i);
      garminData.dailyMetrics[d] = sleepNight(d, i % 2 === 0 ? 8.1 : 6.4);
    }
    for (let i = 0; i < 7; i += 1) {
      const d = DateHelper.addDays(start, i);
      garminData.dailyMetrics[d] = sleepNight(d, 7.6);
    }

    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start, end },
      period: '7d',
      getExerciseNameById: (id) => (String(id) === '101' ? 'Pompes' : 'Tractions'),
      garminData
    });

    const kinds = new Set((bundle.selected || []).map((d) => d.kind));
    const allKinds = new Set((bundle.all || []).map((d) => d.kind));
    expect(kinds.has('disc_sleep_cardio')).toBe(false);
    expect(allKinds.has('disc_sleep_cardio')).toBe(false);
    expect(kinds.has('disc_cardio_strength')).toBe(false);
    expect(bundle.debug?.runDaysInWindow).toBe(0);
  });

  it('1 sortie sans multi-groupes : pas de sleep_cardio (échantillon insuffisant)', () => {
    const end = '2026-10-07';
    const start = '2026-10-01';
    const snapshot = { reps: {}, checkedExercises: {} };
    addCheck(snapshot, '2026-10-03', 101, 200);
    addCheck(snapshot, '2026-10-05', 102, 180);

    const garminData = {
      activities: { cardio: [runAct('2026-10-04', 5, 28)] },
      dailyMetrics: {
        '2026-10-03': sleepNight('2026-10-03', 8),
        '2026-10-04': sleepNight('2026-10-04', 7.8),
        '2026-10-05': sleepNight('2026-10-05', 6.5)
      }
    };

    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start, end },
      period: '7d',
      getExerciseNameById: () => 'Pompes',
      garminData
    });

    expect((bundle.all || []).some((d) => d.kind === 'disc_sleep_cardio')).toBe(false);
    expect(bundle.debug?.runDaysInWindow).toBe(1);
  });

  it('multi-activités dans la fenêtre : running + strength → scope ok', () => {
    const activityCtx = buildPeriodActivityContext({
      window: { start: '2026-10-01', end: '2026-10-07' },
      runDaysInWindow: 3,
      runningKm: 12,
      strengthReps: 500,
      trainingDays: 4,
      nightsInWindow: 6
    });
    expect(activityCtx.has.running).toBe(true);
    expect(activityCtx.has.strength).toBe(true);
    expect(activityCtx.has.sleep).toBe(true);

    const cardio = withDiscoveryScope({
      kind: 'disc_cardio_strength',
      nature: 'trajectory',
      title: 'Course et renforcement',
      body: '3 km et 500 reps'
    });
    expect(assertDiscoveryPeriodScope(cardio, activityCtx).ok).toBe(true);

    const sleepCardio = withDiscoveryScope({
      kind: 'disc_sleep_cardio',
      nature: 'trajectory',
      title: 'Sorties',
      body: 'km × sommeil'
    });
    expect(assertDiscoveryPeriodScope(sleepCardio, activityCtx).ok).toBe(true);
  });

  it('données manquantes : absence de carte plutôt que remplissage', () => {
    const activityCtx = buildPeriodActivityContext({
      window: { start: '2026-10-01', end: '2026-10-07' },
      runDaysInWindow: 0,
      runningKm: 0,
      strengthReps: 0,
      trainingDays: 0,
      nightsInWindow: 0
    });
    const { kept, dropped } = filterDiscoveriesByPeriodScope(
      [
        {
          kind: 'disc_sleep_cardio',
          nature: 'trajectory',
          title: 'Tes sorties',
          body: 'Après les nuits…'
        },
        {
          kind: 'disc_sleep_night',
          nature: 'now',
          title: 'Nuit',
          body: 'Sommeil'
        }
      ],
      activityCtx
    );
    expect(kept).toHaveLength(0);
    expect(dropped.map((d) => d.reason).sort()).toEqual([
      'no_running_in_window',
      'no_sleep_in_window'
    ]);
  });

  it('mode historical_explicit laisse passer sans activité fenêtre', () => {
    const activityCtx = buildPeriodActivityContext({
      runDaysInWindow: 0,
      nightsInWindow: 0,
      strengthReps: 0
    });
    const hist = withDiscoveryScope({
      kind: 'disc_sleep_volume',
      nature: 'trajectory',
      title: 'Volume × sommeil',
      body: 'Historique'
    });
    expect(hist.scope.mode).toBe('historical_explicit');
    expect(assertDiscoveryPeriodScope(hist, activityCtx).ok).toBe(true);
  });
});
