import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildExerciseBaseline,
  buildExerciseBaselines,
  computeSleepPerformanceAssociation,
  computeRestPerformanceAssociation,
  findComparableSessions,
  buildSessionCatalog,
  sleepContextForDate
} from '../recapPersonalBaselines';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';

function add(snapshot, date, exId, reps) {
  snapshot.reps[`${date}_${exId}`] = reps;
  snapshot.checkedExercises[`${date}_${exId}`] = true;
}

describe('recapPersonalBaselines', () => {
  it('sépare le niveau habituel du dernier résultat', () => {
    const sessions = [36, 36, 38, 34, 36, 37].map((reps, i) => ({
      date: DateHelper.addDays('2026-08-02', i * 4),
      reps
    }));
    sessions.push({ date: '2026-08-31', reps: 48 });
    const b = buildExerciseBaseline(sessions);
    expect(b.median).toBeGreaterThanOrEqual(35);
    expect(b.median).toBeLessThanOrEqual(38);
    expect(b.lastReps).toBe(48);
    expect(b.vsHabitPct).toBeGreaterThan(20);
    expect(b.established).toBe(true);
  });

  it('trouve des séances comparables par recouvrement d’exercices, pas par date', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    add(snapshot, '2026-07-10', 501, 36);
    add(snapshot, '2026-07-10', 502, 30);
    add(snapshot, '2026-07-24', 501, 40);
    add(snapshot, '2026-07-24', 502, 36);
    add(snapshot, '2026-08-07', 501, 42);
    add(snapshot, '2026-08-07', 502, 40);
    add(snapshot, '2026-08-30', 504, 200);
    add(snapshot, '2026-08-31', 501, 48);
    add(snapshot, '2026-08-31', 502, 48);
    const catalog = buildSessionCatalog({
      snapshot,
      endYmd: '2026-08-31',
      getExerciseNameById: (id) =>
        ({ 501: 'Dips parallèles', 502: 'Tractions australiennes', 504: 'Pompes' }[Number(id)])
    });
    const { peers } = findComparableSessions(catalog, '2026-08-31');
    expect(peers.length).toBeGreaterThanOrEqual(2);
    expect(peers.every((s) => s.date !== '2026-08-30')).toBe(true);
    expect(peers.some((s) => s.date === '2026-08-07')).toBe(true);
  });

  it('associe un repos ≥ 48 h à un volume de séance différent, sans causalité', () => {
    const catalog = [];
    for (let i = 0; i < 4; i += 1) {
      catalog.push({
        date: DateHelper.addDays('2026-07-01', i * 4),
        totalReps: 200
      });
      catalog.push({
        date: DateHelper.addDays('2026-07-02', i * 4),
        totalReps: 140
      });
    }
    const row = computeRestPerformanceAssociation(catalog);
    expect(row.restedN).toBeGreaterThanOrEqual(2);
    expect(row.denseN).toBeGreaterThanOrEqual(2);
    expect(row.deltaPct).toBeGreaterThan(10);
  });

  it('calcule une association sommeil → reps sans en faire une cause', () => {
    const catalog = [];
    for (let i = 0; i < 4; i += 1) {
      catalog.push({
        date: DateHelper.addDays('2026-07-01', i * 7),
        sleepHours: 6.1,
        exercises: [{ id: '501', name: 'Dips parallèles', reps: 30 }]
      });
      catalog.push({
        date: DateHelper.addDays('2026-07-04', i * 7),
        sleepHours: 8,
        exercises: [{ id: '501', name: 'Dips parallèles', reps: 40 }]
      });
    }
    const rows = computeSleepPerformanceAssociation(catalog);
    expect(rows[0].name).toMatch(/dips/i);
    expect(rows[0].deltaPct).toBeGreaterThan(20);
    expect(rows[0].longAvg).toBeGreaterThan(rows[0].shortAvg);
  });

  it('émet une découverte vs niveau habituel et une mémoire qui baisse le score', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    [36, 36, 38, 34, 36, 37].forEach((reps, i) => {
      add(snapshot, DateHelper.addDays('2026-08-01', i * 4), 501, reps);
    });
    add(snapshot, '2026-08-31', 501, 48);
    add(snapshot, '2026-08-31', 506, 40);
    const names = (id) => ({ 501: 'Dips parallèles', 506: 'Développé militaire' }[Number(id)] || `Ex ${id}`);
    const fresh = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      period: 'today',
      getExerciseNameById: names
    });
    const vs = fresh.all.find((d) => d.kind === 'disc_vs_habit');
    expect(vs).toBeTruthy();
    expect(vs.body).toMatch(/niveau habituel/i);
    expect(vs.body).toMatch(/%/);
    expect(vs.body).not.toMatch(/provoque/);

    const repeated = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      period: 'today',
      getExerciseNameById: names,
      insightHistory: {
        version: 1,
        entries: [
          { id: 'relation.reading.short.disc_vs_habit', theme: 'short.disc_vs_habit', seenAt: Date.now() - 86400000, count: 2 }
        ]
      }
    });
    const vs2 = repeated.all.find((d) => d.kind === 'disc_vs_habit');
    const picked2 = repeated.selected.find((d) => d.kind === 'disc_vs_habit');
    expect(vs2.score).toBeGreaterThan(picked2?.score || 0);
  });

  it('compare un mois au mois précédent, pas à un template générique', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 10; i += 1) {
      add(snapshot, DateHelper.addDays('2026-07-31', -i * 2), 504, 80);
    }
    for (let i = 0; i < 12; i += 1) {
      add(snapshot, DateHelper.addDays('2026-08-31', -i * 2), 504, 140);
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-02', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: () => 'Pompes endurance'
    });
    expect(bundle.question).toMatch(/évolue/i);
    const vol = bundle.all.find((d) => d.kind === 'disc_volume_shape');
    expect(vol).toBeTruthy();
    expect(vol.body).toMatch(/mois précédent|30 jours d'avant/i);
    expect(vol.body).toMatch(/%/);
  });

  it('construit les baselines depuis l’historique coché', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    [10, 11, 11, 12, 12, 16, 17, 18].forEach((reps, i) => {
      add(snapshot, DateHelper.addDays('2026-07-01', i * 7), 101, reps);
    });
    const rows = buildExerciseBaselines({
      snapshot,
      endYmd: '2026-08-31',
      getExerciseNameById: () => 'Tractions pronation'
    });
    expect(rows[0].name).toMatch(/tractions/i);
    expect(rows[0].vsInitialPct).toBeGreaterThan(15);
  });

  it('branche la nuit Garmin complète sur le catalogue, sans inventer de texte', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    add(snapshot, '2026-08-31', 501, 360);
    const garminData = {
      dailyMetrics: {
        '2026-08-31': {
          sleep: {
            duration: 7.77,
            deep: 1.03,
            rem: 1.52,
            light: 5.22,
            awake: 0.3,
            efficiency: 93,
            avgHR: 57
          },
          heartRate: { resting: 52 },
          bodyBattery: { start: 38, end: 92 }
        },
        '2026-08-30': { sleep: { duration: 8.0 } },
        '2026-08-29': { sleep: { duration: 7.9 } },
        '2026-08-28': { sleep: { duration: 8.1 } },
        '2026-08-27': { sleep: { duration: 7.8 } }
      }
    };
    const catalog = buildSessionCatalog({
      snapshot,
      endYmd: '2026-08-31',
      garminData,
      getExerciseNameById: () => 'Dips parallèles'
    });
    expect(catalog[0].night.remMin).toBeGreaterThan(80);
    expect(catalog[0].night.bodyBatteryCharged).toBe(54);
    expect(catalog[0].sleepHours).toBeCloseTo(7.77, 1);
    const ctx = sleepContextForDate(garminData, '2026-08-31', catalog);
    expect(ctx.night.deepMin).toBeGreaterThan(50);
    expect(ctx.recentNights.length).toBeGreaterThanOrEqual(4);
    expect(ctx.habitHours).toBeGreaterThan(7);
  });
});
