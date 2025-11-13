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
    const duration = await page.evaluate(async () => {
      const start = performance.now();

      // Simuler 100 écritures batchées
      // Note: On utilise l'API IndexedDB directement pour le test
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('garmin-db', 1);

        request.onerror = () => reject(new Error('Failed to open IndexedDB'));
        request.onsuccess = () => {
          const db = request.result;
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
                // Nettoyer les données de test
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => {
                  resolve(end - start);
                };
                clearRequest.onerror = () => {
                  resolve(end - start); // Résoudre quand même
                };
              }
            };

            addRequest.onerror = () => {
              completed++;
              if (completed === total) {
                resolve(performance.now() - start);
              }
            };
          }
        };
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
    // Attendre que la page soit prête
    await page.waitForSelector('button:has-text("Synchroniser")', { timeout: 5000 });

    const duration = await page.evaluate(async () => {
      const start = performance.now();

      // Déclencher une synchronisation
      const syncButton = document.querySelector('button:has-text("Synchroniser")');
      if (!syncButton) {
        throw new Error('Sync button not found');
      }

      syncButton.click();

      // Attendre que la synchronisation se termine
      // On vérifie la disparition du spinner ou l'apparition d'un message de succès
      return new Promise((resolve) => {
        const checkComplete = () => {
          const spinner = document.querySelector('[aria-busy="true"]');
          const successMessage = document.querySelector('[role="status"]:has-text("réussi")');

          if (!spinner && successMessage) {
            resolve(performance.now() - start);
          } else {
            setTimeout(checkComplete, 100);
          }
        };

        // Timeout après 10s
        setTimeout(() => {
          resolve(performance.now() - start);
        }, 10000);

        checkComplete();
      });
    });

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

