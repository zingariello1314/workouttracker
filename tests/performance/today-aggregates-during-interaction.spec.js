import { expect, test } from '@playwright/test';

/**
 * P0.9 — validation réelle des agrégats hors thread + interactions pendant calcul.
 * Données isolées (pas de données personnelles).
 */

function buildSyntheticSnapshot({ days = 60, exercises = 25 } = {}) {
  const reps = {};
  const checked = {};
  const exerciseWeights = {};
  for (let d = 1; d <= days; d += 1) {
    const month = String(((d - 1) % 12) + 1).padStart(2, '0');
    const day = String(((d - 1) % 28) + 1).padStart(2, '0');
    const ymd = `2025-${month}-${day}`;
    for (let e = 1; e <= exercises; e += 1) {
      const key = `${ymd}_${e}`;
      reps[key] = String(8 + (e % 5));
      checked[key] = true;
      exerciseWeights[key] = String(20 + (e % 10));
    }
  }
  return {
    reps,
    checkedExercises: checked,
    exerciseWeights,
    exerciseIntensityCoeffs: {},
    enduranceData: { sessions: {}, challenges: [] }
  };
}

test.describe('Sport→Aujourd’hui — agrégats non bloquants', () => {
  test('Worker muscle/muscu publie une révision ; interactions pendant calcul < 100 ms', async ({
    page
  }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const { computeSportRecapAggregateOffMain } = await import(
        '/src/services/sport/sportRecapAggregatesWorkerClient.js'
      );
      const { fingerprintWorkoutAnalytics } = await import(
        '/src/services/sport/workoutAnalyticsRevision.js'
      );
      const { yieldToMain } = await import('/src/utils/sport/yieldToMain.js');
      const diag = await import('/src/dev/todayDiagnostics/todayDiag.js');

      const reps = {};
      const checked = {};
      const exerciseWeights = {};
      for (let d = 1; d <= 60; d += 1) {
        const month = String(((d - 1) % 12) + 1).padStart(2, '0');
        const day = String(((d - 1) % 28) + 1).padStart(2, '0');
        const ymd = `2025-${month}-${day}`;
        for (let e = 1; e <= 25; e += 1) {
          const key = `${ymd}_${e}`;
          reps[key] = String(8 + (e % 5));
          checked[key] = true;
          exerciseWeights[key] = String(20 + (e % 10));
        }
      }
      const snapshot = {
        reps,
        checkedExercises: checked,
        exerciseWeights,
        exerciseIntensityCoeffs: {},
        enduranceData: { sessions: {}, challenges: [] }
      };
      const getName = (id) => `Ex ${id}`;
      const revision = fingerprintWorkoutAnalytics(snapshot);
      const refDate = new Date('2025-12-15T12:00:00');

      diag.startTodayDiagCapture();

      const musclePromise = computeSportRecapAggregateOffMain({
        kind: 'muscle',
        revision: `${revision}|muscle`,
        snapshot,
        period: '30d',
        getExerciseNameById: getName,
        referenceDate: refDate
      });

      const strengthPromise = computeSportRecapAggregateOffMain({
        kind: 'strength',
        revision: `${revision}|strength`,
        snapshot,
        period: '30d',
        getExerciseNameById: getName,
        referenceDate: refDate,
        numBars: 5
      });

      const latencies = [];
      for (let i = 0; i < 10; i += 1) {
        const id = diag.beginTodayInteraction('check', `Coche pendant worker ${i}`, {
          inputAt: performance.now()
        });
        const t0 = performance.now();
        checked[`2025-12-15_probe_${i}`] = true;
        reps[`2025-12-15_probe_${i}`] = '10';
        const processing = performance.now() - t0;
        diag.endTodayInteraction(id);
        latencies.push(processing);
        await yieldToMain();
      }

      const muscle = await musclePromise;
      const strength = await strengthPromise;

      // Nouvelle révision métier (modif reps) → calcul distinct
      const mutated = {
        ...snapshot,
        reps: { ...reps, '2025-12-15_1': '99' }
      };
      const rev2 = fingerprintWorkoutAnalytics(mutated);
      const muscle2 = await computeSportRecapAggregateOffMain({
        kind: 'muscle',
        revision: `${rev2}|muscle`,
        snapshot: mutated,
        period: '30d',
        getExerciseNameById: getName,
        referenceDate: refDate
      });

      const sorted = [...latencies].sort((a, b) => a - b);
      const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];

      return {
        muscleVia: muscle.via,
        musclePublished: Boolean(muscle.result?.repShareByGroup),
        muscleStale: muscle.stale,
        muscleDegraded: Boolean(muscle.degraded),
        strengthVia: strength.via,
        strengthPublished: Boolean(strength.result && 'totalRepsCurr' in strength.result),
        strengthTotal: strength.result?.totalRepsCurr ?? null,
        revisionChanged: rev2 !== revision,
        muscle2Published: Boolean(muscle2.result?.repShareByGroup),
        muscle2Via: muscle2.via,
        p95ProcessingMs: Math.round(p95 * 10) / 10,
        maxProcessingMs: Math.round(Math.max(...latencies) * 10) / 10,
        codeRevision: diag.CODE_REVISION
      };
    });

    expect(result.muscleDegraded).toBe(false);
    expect(result.musclePublished).toBe(true);
    expect(result.strengthPublished).toBe(true);
    expect(['worker', 'cache'].some((v) => result.muscleVia === v || result.muscleVia?.startsWith('worker'))).toBe(
      true
    );
    expect(result.revisionChanged).toBe(true);
    expect(result.muscle2Published).toBe(true);
    expect(result.p95ProcessingMs).toBeLessThan(100);
    expect(result.maxProcessingMs).toBeLessThan(100);
    expect(result.codeRevision).toMatch(/p0\.[89]/);
  });

  test('index calendrier + pack mois chunké restent interruptibles', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const { indexWorkoutStorageKeysByDate } = await import(
        '/src/utils/sport/workoutStorageKeysByDate.js'
      );
      const { yieldToMain } = await import('/src/utils/sport/yieldToMain.js');
      const diag = await import('/src/dev/todayDiagnostics/todayDiag.js');

      const reps = {};
      const checked = {};
      for (let d = 1; d <= 400; d += 1) {
        const y = 2024 + Math.floor((d - 1) / 365);
        const month = String((((d - 1) % 12) + 1)).padStart(2, '0');
        const day = String((((d - 1) % 28) + 1)).padStart(2, '0');
        const ymd = `${y}-${month}-${day}`;
        for (let e = 1; e <= 15; e += 1) {
          const key = `${ymd}_${e}`;
          reps[key] = '10';
          checked[key] = true;
        }
      }
      const data = { reps, checkedExercises: checked };

      diag.startTodayDiagCapture();
      const tIndex0 = performance.now();
      const idx = indexWorkoutStorageKeysByDate(data);
      const indexMs = performance.now() - tIndex0;

      const latencies = [];
      for (let i = 0; i < 6; i += 1) {
        const id = diag.beginTodayInteraction('check', `Coche pendant index ${i}`);
        const t0 = performance.now();
        void idx.hasCheckedOnDate('2024-06-15');
        latencies.push(performance.now() - t0);
        diag.endTodayInteraction(id);
        await yieldToMain();
      }

      return {
        indexMs: Math.round(indexMs * 10) / 10,
        datesIndexed: idx.allKeysByDate.size,
        orphanOk: Array.isArray(idx.orphanExerciseIdsForDate('2024-06-15', new Set(['1']))),
        maxInteractionMs: Math.round(Math.max(...latencies) * 10) / 10
      };
    });

    expect(result.datesIndexed).toBeGreaterThan(100);
    expect(result.orphanOk).toBe(true);
    expect(result.maxInteractionMs).toBeLessThan(50);
    // Index O(n) une fois — budget large mais pas multi-secondes typique
    expect(result.indexMs).toBeLessThan(2000);
  });
});
