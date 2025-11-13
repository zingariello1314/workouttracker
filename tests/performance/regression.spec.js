/**
 * Tests de régression de performance pour l'onglet Garmin
 * 
 * Vérifie que les métriques de performance respectent les budgets
 * et ne régressent pas par rapport à la baseline.
 * 
 * @see PERFORMANCE_BUDGET.md pour les budgets cibles
 */

import { test, expect } from '@playwright/test';
import { loadBaseline, calculatePercentile, compareWithBaseline } from './helpers';

test.describe('Performance Regression - Garmin Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Attendre que la page soit chargée
    await page.goto('/garmin');
    await page.waitForLoadState('networkidle');
  });

  test('TTI should be < 2.0s (P95)', async ({ page }) => {
    const metrics = [];

    // Mesurer 5 fois pour calculer P95
    for (let i = 0; i < 5; i++) {
      await page.reload({ waitUntil: 'networkidle' });

      const tti = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) {
          return null;
        }

        // Time to Interactive = domInteractive - fetchStart
        const fetchStart = navigation.fetchStart;
        const domInteractive = navigation.domInteractive;

        if (fetchStart && domInteractive) {
          return domInteractive - fetchStart;
        }

        // Fallback: utiliser domContentLoadedEventEnd si domInteractive n'est pas disponible
        const domContentLoaded = navigation.domContentLoadedEventEnd;
        if (fetchStart && domContentLoaded) {
          return domContentLoaded - fetchStart;
        }

        return null;
      });

      if (tti !== null && tti > 0) {
        metrics.push(tti);
      }
    }

    expect(metrics.length).toBeGreaterThan(0);

    const p95 = calculatePercentile(metrics, 95);
    const baseline = await loadBaseline('tti');

    // Assert < 2.0s (budget)
    expect(p95).toBeLessThan(2000);

    // Assert pas de régression >10% vs baseline
    if (baseline) {
      const comparison = compareWithBaseline(p95, baseline, 10);
      if (comparison.isRegression) {
        throw new Error(comparison.message);
      }
    }

    console.log(`[TTI] P95: ${p95.toFixed(0)}ms${baseline ? ` (baseline: ${baseline}ms)` : ' (no baseline)'}`);
  });

  test('Chart render should be < 200ms', async ({ page }) => {
    // Naviguer vers l'onglet Charts
    await page.click('text=Graphiques', { timeout: 5000 });
    await page.waitForTimeout(500); // Attendre que les charts se chargent

    const duration = await page.evaluate(() => {
      return new Promise((resolve) => {
        const start = performance.now();

        // Attendre que tous les charts soient rendus
        // On vérifie la présence d'éléments SVG (Recharts génère des SVG)
        const checkCharts = () => {
          const svgElements = document.querySelectorAll('svg');
          if (svgElements.length > 0) {
            // Attendre un frame pour s'assurer que le rendu est complet
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve(performance.now() - start);
              });
            });
          } else {
            // Retry après 50ms
            setTimeout(checkCharts, 50);
          }
        };

        checkCharts();
      });
    });

    const baseline = await loadBaseline('chartRender');

    // Assert < 200ms (budget)
    expect(duration).toBeLessThan(200);

    // Assert pas de régression >10% vs baseline
    if (baseline) {
      const comparison = compareWithBaseline(duration, baseline, 10);
      if (comparison.isRegression) {
        throw new Error(comparison.message);
      }
    }

    console.log(`[Chart Render] Duration: ${duration.toFixed(0)}ms${baseline ? ` (baseline: ${baseline}ms)` : ' (no baseline)'}`);
  });

  test('IndexedDB write batch should be < 50ms per operation', async ({ page }) => {
    // Attendre que la page soit stable avant de commencer
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Attendre un peu pour être sûr

    const duration = await page.evaluate(async () => {
      const start = performance.now();

      // Simuler 100 écritures batchées
      // Note: On utilise l'API IndexedDB directement pour le test
      return new Promise((resolve, reject) => {
        // Timeout de sécurité
        const timeout = setTimeout(() => {
          reject(new Error('IndexedDB test timeout after 30s'));
        }, 30000);

        try {
          const request = indexedDB.open('garmin-db', 1);

          request.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to open IndexedDB'));
          };

          request.onsuccess = () => {
            try {
              const db = request.result;
              
              // Vérifier que la base existe et a le store 'activities'
              if (!db.objectStoreNames.contains('activities')) {
                clearTimeout(timeout);
                // Si le store n'existe pas, créer une transaction simple pour mesurer
                const testTransaction = db.transaction(['dailyMetrics'], 'readwrite');
                const testStore = testTransaction.objectStore('dailyMetrics');
                
                let completed = 0;
                const total = 100;

                for (let i = 0; i < total; i++) {
                  const addRequest = testStore.add({
                    id: `test-${Date.now()}-${i}`,
                    date: new Date().toISOString(),
                    data: { test: true }
                  });

                  addRequest.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                      const end = performance.now();
                      clearTimeout(timeout);
                      // Nettoyer les données de test
                      const clearRequest = testStore.clear();
                      clearRequest.onsuccess = () => resolve(end - start);
                      clearRequest.onerror = () => resolve(end - start);
                    }
                  };

                  addRequest.onerror = () => {
                    completed++;
                    if (completed === total) {
                      clearTimeout(timeout);
                      resolve(performance.now() - start);
                    }
                  };
                }
                return;
              }

              const transaction = db.transaction(['activities'], 'readwrite');
              const store = transaction.objectStore('activities');

              let completed = 0;
              const total = 100;

              for (let i = 0; i < total; i++) {
                const addRequest = store.add({
                  id: `test-${Date.now()}-${i}`,
                  date: new Date().toISOString(),
                  data: { test: true }
                });

                addRequest.onsuccess = () => {
                  completed++;
                  if (completed === total) {
                    const end = performance.now();
                    clearTimeout(timeout);
                    // Nettoyer les données de test
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => resolve(end - start);
                    clearRequest.onerror = () => resolve(end - start);
                  }
                };

                addRequest.onerror = () => {
                  completed++;
                  if (completed === total) {
                    clearTimeout(timeout);
                    resolve(performance.now() - start);
                  }
                };
              }
            } catch (error) {
              clearTimeout(timeout);
              reject(error);
            }
          };
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });

    const baseline = await loadBaseline('indexedDBWrite');

    // Assert < 5000ms pour 100 opérations (50ms * 100)
    expect(duration).toBeLessThan(5000);

    // Assert pas de régression >10% vs baseline
    if (baseline) {
      const comparison = compareWithBaseline(duration, baseline, 10);
      if (comparison.isRegression) {
        throw new Error(comparison.message);
      }
    }

    console.log(`[IndexedDB Write] Duration: ${duration.toFixed(0)}ms for 100 operations${baseline ? ` (baseline: ${baseline}ms)` : ' (no baseline)'}`);
  });

  test('Sync round-trip should be < 3s', async ({ page }) => {
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Attendre un peu pour que tout soit rendu

    // Chercher le bouton avec plusieurs sélecteurs possibles
    let syncButton;
    try {
      syncButton = page.locator('button:has-text("Synchroniser")').first();
      await syncButton.waitFor({ timeout: 10000, state: 'visible' });
    } catch {
      try {
        syncButton = page.locator('button').filter({ hasText: /Synchroniser/i }).first();
        await syncButton.waitFor({ timeout: 5000, state: 'visible' });
      } catch {
        // Dernier recours : chercher par aria-label
        syncButton = page.locator('button[aria-label*="Synchroniser"]').first();
        await syncButton.waitFor({ timeout: 5000, state: 'visible' });
      }
    }

    const start = Date.now();

    // Cliquer sur le bouton
    await syncButton.click();

    // Attendre que la synchronisation se termine
    // On vérifie la disparition du spinner ou l'apparition d'un message de succès
    try {
      await page.waitForFunction(
        () => {
          const spinner = document.querySelector('[aria-busy="true"]');
          const loadingButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent?.includes('Synchronisation...')
          );
          const successMessage = document.querySelector('[role="status"]');
          const statusText = successMessage?.textContent || '';
          
          // La sync est terminée si :
          // 1. Pas de spinner actif
          // 2. Le bouton n'est plus en état "Synchronisation..."
          // 3. Un message de statut est présent (succès ou erreur)
          return !spinner && loadingButtons.length === 0 && (
            statusText.includes('réussi') || 
            statusText.includes('Disponible') || 
            statusText.includes('Erreur') ||
            statusText.includes('Statut:')
          );
        },
        { timeout: 30000 }
      );
    } catch {
      // Si le timeout est atteint, on continue quand même
    }

    const duration = Date.now() - start;

    const baseline = await loadBaseline('syncRoundTrip');

    // Assert < 3s (budget)
    expect(duration).toBeLessThan(3000);

    // Assert pas de régression >10% vs baseline
    if (baseline) {
      const comparison = compareWithBaseline(duration, baseline, 10);
      if (comparison.isRegression) {
        throw new Error(comparison.message);
      }
    }

    console.log(`[Sync Round-trip] Duration: ${duration.toFixed(0)}ms${baseline ? ` (baseline: ${baseline}ms)` : ' (no baseline)'}`);
  });
});

