import { expect, test } from '@playwright/test';

/**
 * P0.9 — signature post-save répétables (données isolées).
 * Simule publication agrégat + rebuild calendrier indexé pendant interactions.
 */
test.describe('Post-save cascade — interactions sous charge', () => {
  test('interactions pendant rebuild calendrier indexé restent traitées', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const { indexWorkoutStorageKeysByDate } = await import(
        '/src/utils/sport/workoutStorageKeysByDate.js'
      );
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
      for (let d = 1; d <= 90; d += 1) {
        const month = String(((d - 1) % 12) + 1).padStart(2, '0');
        const day = String(((d - 1) % 28) + 1).padStart(2, '0');
        const ymd = `2025-${month}-${day}`;
        for (let e = 1; e <= 20; e += 1) {
          const key = `${ymd}_${e}`;
          reps[key] = '12';
          checked[key] = true;
        }
      }
      let snapshot = {
        reps,
        checkedExercises: checked,
        exerciseWeights: {},
        exerciseIntensityCoeffs: {},
        enduranceData: { sessions: {}, challenges: [] }
      };

      diag.startTodayDiagCapture();
      const handlerEnd = performance.now();

      // « Persist » simulée puis rafale dérivés
      const rev1 = fingerprintWorkoutAnalytics(snapshot);
      const workerP = computeSportRecapAggregateOffMain({
        kind: 'muscle',
        revision: `${rev1}|post-save`,
        snapshot,
        period: '30d',
        getExerciseNameById: (id) => `E${id}`,
        referenceDate: new Date('2025-11-27')
      });

      // Mutation post-save (nouvelle révision)
      snapshot = {
        ...snapshot,
        reps: { ...reps, '2025-11-27_1': '15' },
        checkedExercises: { ...checked, '2025-11-27_1': true }
      };
      const rev2 = fingerprintWorkoutAnalytics(snapshot);
      const idx = indexWorkoutStorageKeysByDate(snapshot);

      const interactionResults = [];
      for (let i = 0; i < 8; i += 1) {
        const id = diag.beginTodayInteraction('check', `Post-save coche ${i}`, {
          inputAt: performance.now()
        });
        const t0 = performance.now();
        const applied = Boolean(idx.hasCheckedOnDate('2025-11-27'));
        snapshot.checkedExercises[`2025-11-27_probe_${i}`] = true;
        const processing = performance.now() - t0;
        diag.endTodayInteraction(id);
        interactionResults.push({ processing, applied });
        await yieldToMain();
      }

      const muscle = await workerP;
      const sinceHandler = performance.now() - handlerEnd;
      const analysis = diag.analyzeTodayDiag();
      const processings = interactionResults.map((r) => r.processing).sort((a, b) => a - b);
      const p95 = processings[Math.min(processings.length - 1, Math.ceil(processings.length * 0.95) - 1)];

      return {
        revChanged: rev2 !== rev1,
        musclePublished: Boolean(muscle.result?.repShareByGroup),
        muscleVia: muscle.via,
        allApplied: interactionResults.every((r) => r.applied),
        p95ProcessingMs: Math.round(p95 * 10) / 10,
        maxProcessingMs: Math.round(Math.max(...processings) * 10) / 10,
        interactionCount: analysis.interactions?.length ?? 0,
        sinceHandlerMs: Math.round(sinceHandler)
      };
    });

    expect(result.revChanged).toBe(true);
    expect(result.musclePublished).toBe(true);
    expect(result.allApplied).toBe(true);
    expect(result.p95ProcessingMs).toBeLessThan(100);
    expect(result.interactionCount).toBeGreaterThanOrEqual(8);
  });
});
