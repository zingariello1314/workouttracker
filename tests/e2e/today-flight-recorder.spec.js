import { expect, test } from '@playwright/test';

test('Flight Recorder V2 dans Chromium isolé', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const diag = await import('/src/dev/todayDiagnostics/todayDiag.js');
    diag.startTodayDiagCapture();
    const fastId = diag.beginTodayInteraction('check', 'Coche rapide', { inputAt: performance.now() });
    const fastSpan = diag.spanTodayDiag('calc', 'Recherche des données');
    fastSpan.end();
    diag.endTodayInteraction(fastId);

    const slowId = diag.beginTodayInteraction('check', 'Coche retardée', { inputAt: performance.now() });
    const slowSpan = diag.spanTodayDiag('calc', 'Recherche des données');
    slowSpan.end();
    diag.endTodayInteraction(slowId);
    const blockedAt = performance.now();
    while (performance.now() - blockedAt < 140) {
      /* tâche volontaire, aucune donnée sportive */
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const first = diag.beginTodayInteraction('weight', 'Charge A');
    const second = diag.beginTodayInteraction('reps', 'Répétition B');
    diag.endTodayInteraction(second);
    diag.endTodayInteraction(first);

    for (let i = 0; i < 16000; i += 1) {
      const span = diag.spanTodayDiag('state', 'Remplissage');
      span.end();
    }

    const analysis = diag.analyzeTodayDiag();
    const exported = await diag.buildFlightExport();
    const required = [
      'metadata', 'environment', 'instrumentationVersion', 'capabilities', 'captureConfig',
      'clockSynchronization', 'interactionTimeline', 'longTasks', 'unexplainedTimeIntervals',
      'summaryStatistics', 'droppedEvents', 'measurementLimitations', 'schemaDocumentation'
    ];
    const slow = analysis.interactions.find((row) => row.label === 'Coche retardée');
    const fast = analysis.interactions.find((row) => row.label === 'Coche rapide');
    return {
      fastProcessing: fast?.processingMs ?? null,
      slowProcessing: slow?.processingMs ?? null,
      slowFrame: slow?.untilNextFrameCallbackMs ?? null,
      slowTasks: slow?.longTaskIds?.length ?? 0,
      frameQuality: slow?.qualities?.untilNextFrameCallback ?? null,
      presentation: slow?.qualities?.presentation ?? null,
      both: analysis.interactions.filter((row) => row.label === 'Charge A' || row.label === 'Répétition B').length,
      dropped: analysis.snapshot.droppedEvents,
      startupKept: analysis.snapshot.events.some((event) => event.category === 'startup'),
      missingKeys: required.filter((key) => !(key in exported)),
      longTaskClock: (exported.longTasks.duringCapture[0] && typeof exported.longTasks.duringCapture[0].t === 'number') || exported.longTasks.duringCapture.length === 0
    };
  });

  expect(result.fastProcessing).toBeLessThan(50);
  expect(result.slowProcessing).toBeLessThan(50);
  expect(result.slowFrame).toBeGreaterThan(100);
  expect(result.frameQuality).toBe('approximation-not-presentation');
  expect(result.presentation).toBe('unavailable-from-page-unless-event-timing');
  expect(result.both).toBe(2);
  expect(result.dropped).toBeGreaterThan(0);
  expect(result.startupKept).toBe(true);
  expect(result.missingKeys).toEqual([]);
  expect(result.longTaskClock).toBe(true);
});
