import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

/**
 * Navigateur isolé. Le contexte Playwright n'utilise pas le profil Chrome personnel.
 * Les données écrites portent la clé e3-browser-synthetic.
 */
test('IndexedDB synthétique et écran d’accueil sans profil personnel', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4000);
  const text = await page.locator('body').innerText();
  writeFileSync('diagnostics/e3-browser-observation.json', JSON.stringify({
    url: page.url(),
    hasLogin: /connexion|se connecter|mot de passe/i.test(text),
    hasToday: /aujourd/i.test(text),
    hasGtg: /gtg|grease the groove/i.test(text),
    hasPushup: /pompe/i.test(text),
    excerpt: text.slice(0, 1200)
  }, null, 2));

  const roundtrip = await page.evaluate(async () => {
    const { createWorkoutRepository } = await import('/src/services/workout/createWorkoutRepository.js');
    const repo = createWorkoutRepository('local');
    const key = 'e3-browser-synthetic';
    await repo.saveRawWorkoutRow(key, {
      id: key,
      checkedExercises: {},
      reps: {},
      checkedStretches: {},
      enduranceData: {
        sessions: { pushups: [{ id: 'pu_browser', reps: 10 }] },
        challenges: [],
        gtg: { days: { '2026-06-01': { adHoc: [{ id: 'ah_browser', reps: 3 }] } } }
      },
      saveOperationId: 'op-browser-1'
    });
    const read = await repo.loadRawWorkoutRow(key);
    return {
      operationId: read?.saveOperationId || null,
      passage: read?.enduranceData?.gtg?.days?.['2026-06-01']?.adHoc?.[0]?.id || null,
      pushup: read?.enduranceData?.sessions?.pushups?.[0]?.id || null
    };
  });

  expect(roundtrip).toEqual({
    operationId: 'op-browser-1',
    passage: 'ah_browser',
    pushup: 'pu_browser'
  });

  await page.reload();
  await page.waitForTimeout(2000);
  const afterReload = await page.evaluate(async () => {
    const { createWorkoutRepository } = await import('/src/services/workout/createWorkoutRepository.js');
    const repo = createWorkoutRepository('local');
    const read = await repo.loadRawWorkoutRow('e3-browser-synthetic');
    return read?.enduranceData?.gtg?.days?.['2026-06-01']?.adHoc?.[0]?.id || null;
  });
  expect(afterReload).toBe('ah_browser');

  await test.info().attach('ecran.txt', {
    body: Buffer.from(text.slice(0, 1500)),
    contentType: 'text/plain'
  });
});
