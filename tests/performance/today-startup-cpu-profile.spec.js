import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * P0.9 — profil CPU CDP réel sur démarrage isolé (pas de user-data perso).
 * Échoue si samples vides. Documente les tops de stacks applicatives.
 */
test.describe('Démarrage — profil CPU CDP', () => {
  test('Profiler.samples non vide ; tops stacks documentés', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Profiler.enable');
    await client.send('Profiler.setSamplingInterval', { interval: 100 });
    await client.send('Profiler.start');

    const tNav0 = Date.now();
    await page.goto('/?todayDiag=1', { waitUntil: 'domcontentloaded' });
    // Fenêtre couvrant les LT démarrage observées (~7–30 s wall)
    await page.waitForTimeout(12000);
    const profile = await client.send('Profiler.stop');
    const wallMs = Date.now() - tNav0;

    const nodes = profile?.profile?.nodes || [];
    const samples = profile?.profile?.samples || [];
    const timeDeltas = profile?.profile?.timeDeltas || [];

    const idToNode = new Map(nodes.map((n) => [n.id, n]));
    const hitCount = new Map();
    for (const sampleId of samples) {
      hitCount.set(sampleId, (hitCount.get(sampleId) || 0) + 1);
    }

    const ranked = [...hitCount.entries()]
      .map(([id, count]) => {
        const node = idToNode.get(id);
        const fn = node?.callFrame?.functionName || '(anonymous)';
        const url = node?.callFrame?.url || '';
        const line = node?.callFrame?.lineNumber ?? -1;
        return { id, count, fn, url, line };
      })
      .sort((a, b) => b.count - a.count);

    const appStacks = ranked.filter(
      (r) =>
        r.url.includes('/src/') ||
        r.fn.includes('Recap') ||
        r.fn.includes('Calendar') ||
        r.fn.includes('Sidebar') ||
        r.fn.includes('Today') ||
        r.fn.includes('compute') ||
        r.fn.includes('Workout')
    );

    const outDir = join('diagnostics', `p0.9-startup-cpu-${Date.now()}`);
    mkdirSync(outDir, { recursive: true });
    const summary = {
      wallMs,
      sampleCount: samples.length,
      timeDeltaCount: timeDeltas.length,
      nodeCount: nodes.length,
      top20: ranked.slice(0, 20),
      topApp: appStacks.slice(0, 30),
      note: 'Profil isolé Playwright — non représentatif du dataset utilisateur réel. Sert à identifier les fonctions sources du démarrage synthétique.'
    };
    writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
    writeFileSync(join(outDir, 'profile-meta.json'), JSON.stringify({
      startTime: profile?.profile?.startTime,
      endTime: profile?.profile?.endTime,
      sampleCount: samples.length
    }, null, 2));

    expect(samples.length, 'Profiler.samples doit être non vide').toBeGreaterThan(0);
    expect(timeDeltas.length).toBeGreaterThan(0);
    expect(nodes.length).toBeGreaterThan(0);

    // Au moins une stack avec URL src/ OU un top générique React documenté
    const hasAnyNamed = ranked.some((r) => r.fn && r.fn !== '(anonymous)' && r.fn !== '');
    expect(hasAnyNamed).toBe(true);

    // Expose pour le reporter
    test.info().annotations.push({
      type: 'startup-cpu',
      description: `samples=${samples.length} topApp=${appStacks.slice(0, 5).map((a) => a.fn).join('|')} out=${outDir}`
    });
  });
});
