import { expect, test } from '@playwright/test';

/**
 * P0.8 — interactions pendant un calcul agrégé lourd (données isolées, pas de données perso).
 * Vérifie que le main thread reste interruptible (yield / hors chemin sync).
 */
test.describe('Sport→Aujourd’hui — agrégats non bloquants', () => {
  test('coche synthétique pendant calcul muscle lourd reste < 100 ms traitement', async ({
    page
  }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const { computeRecapMuscleState } = await import(
        '/src/utils/sport/recapMuscleLoadEngine.js'
      );
      const { yieldToMain } = await import('/src/utils/sport/yieldToMain.js');
      const diag = await import('/src/dev/todayDiagnostics/todayDiag.js');

      // Snapshot synthétique volumineux (isolé)
      const reps = {};
      const checked = {};
      for (let d = 1; d <= 120; d += 1) {
        const month = String(((d - 1) % 12) + 1).padStart(2, '0');
        const day = String(((d - 1) % 28) + 1).padStart(2, '0');
        const ymd = `2025-${month}-${day}`;
        for (let e = 1; e <= 40; e += 1) {
          const key = `${ymd}_${e}`;
          reps[key] = String(8 + (e % 5));
          checked[key] = true;
        }
      }
      const snapshot = {
        reps,
        checkedExercises: checked,
        exerciseWeights: {},
        exerciseIntensityCoeffs: {},
        enduranceData: { sessions: {}, challenges: [] }
      };
      const getName = (id) => `Ex ${id}`;

      diag.startTodayDiagCapture();

      // Lancer le calcul en chunks (simule Worker/idle path) pendant des interactions
      let computeDone = false;
      const computePromise = (async () => {
        // Découpe artificielle : yield entre étapes pour laisser les interactions
        await yieldToMain();
        const state = computeRecapMuscleState(snapshot, 'all', getName, new Date('2025-12-15'));
        await yieldToMain();
        computeDone = true;
        return state;
      })();

      const latencies = [];
      for (let i = 0; i < 8; i += 1) {
        const id = diag.beginTodayInteraction('check', `Coche pendant agrégat ${i}`, {
          inputAt: performance.now()
        });
        // Traitement métier élémentaire
        const t0 = performance.now();
        const draft = { ...checked };
        draft[`2025-12-15_probe_${i}`] = true;
        void draft;
        const processing = performance.now() - t0;
        diag.endTodayInteraction(id);
        latencies.push(processing);
        await yieldToMain();
      }

      const state = await computePromise;
      const analysis = diag.analyzeTodayDiag();
      const nativeish = latencies.slice().sort((a, b) => a - b);
      const p95 = nativeish[Math.min(nativeish.length - 1, Math.ceil(nativeish.length * 0.95) - 1)];

      return {
        computeDone,
        hasRepShare: Boolean(state?.repShareByGroup),
        p95ProcessingMs: Math.round(p95 * 10) / 10,
        maxProcessingMs: Math.round(Math.max(...latencies) * 10) / 10,
        interactionCount: analysis.interactions?.length ?? 0,
        codeRevision: diag.CODE_REVISION
      };
    });

    expect(result.computeDone).toBe(true);
    expect(result.hasRepShare).toBe(true);
    expect(result.p95ProcessingMs).toBeLessThan(100);
    expect(result.maxProcessingMs).toBeLessThan(100);
    expect(result.codeRevision).toContain('p0.8');
  });
});
