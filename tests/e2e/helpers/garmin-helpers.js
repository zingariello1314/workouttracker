/**
 * Helpers pour les tests E2E de l'onglet Garmin
 * 
 * Fonctions utilitaires pour :
 * - Navigation dans l'onglet Garmin
 * - Interactions avec les contrôles de sync
 * - Vérification des données IndexedDB
 * - Gestion des attentes
 * 
 * @module tests/e2e/helpers/garmin-helpers
 */

/**
 * Navigue vers l'onglet Garmin
 */
export async function navigateToGarminTab(page) {
  // Cliquer sur l'onglet Garmin dans la navigation
  await page.click('text=Garmin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Attendre que l'onglet soit chargé
  await page.waitForSelector('[data-testid="garmin-tab"], .garmin-tab, #garmin-tab', {
    timeout: 10000,
    state: 'visible'
  }).catch(() => {
    // Fallback : vérifier la présence d'éléments caractéristiques
    return page.waitForSelector('text=Synchroniser', { timeout: 10000 });
  });
}

/**
 * Attend que les données Garmin soient chargées
 */
export async function waitForGarminData(page, timeout = 30000) {
  // Attendre soit que des données soient affichées, soit le message "Aucune donnée"
  await Promise.race([
    page.waitForSelector('text=Aucune donnée Garmin', { timeout }),
    page.waitForSelector('[data-testid="garmin-dashboard"], .garmin-dashboard', { timeout }),
    page.waitForSelector('text=Dashboard', { timeout }),
  ]).catch(() => {
    // Timeout acceptable si l'application charge
  });
}

/**
 * Clique sur le bouton de synchronisation
 */
export async function clickSyncButton(page) {
  const syncButton = page.locator('button:has-text("Synchroniser"), button:has-text("Sync")').first();
  await syncButton.waitFor({ state: 'visible', timeout: 10000 });
  await syncButton.click();
}

/**
 * Attend que la synchronisation soit terminée
 */
export async function waitForSyncComplete(page, timeout = 60000) {
  // Attendre que le spinner de chargement disparaisse
  await page.waitForSelector('.spinner, [aria-busy="true"]', {
    state: 'hidden',
    timeout
  }).catch(() => {
    // Si pas de spinner, attendre un message de succès/erreur
    return page.waitForSelector('text=Synchronisation, text=succès, text=erreur', {
      timeout: 5000
    });
  });
}

/**
 * Ouvre le DebugPanel via le raccourci clavier
 */
export async function openDebugPanel(page) {
  await page.keyboard.press('Control+Shift+D');
  await page.waitForSelector('[role="dialog"]:has-text("Panneau de Diagnostic"), [role="dialog"]:has-text("Diagnostic")', {
    timeout: 5000
  });
}

/**
 * Ferme le DebugPanel
 */
export async function closeDebugPanel(page) {
  const closeButton = page.locator('button[aria-label*="Fermer"], button:has-text("×"), button:has-text("Fermer")').first();
  if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeButton.click();
  } else {
    // Fallback : Escape
    await page.keyboard.press('Escape');
  }
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
}

/**
 * Vérifie que le Toast est affiché avec un message spécifique
 */
export async function waitForToast(page, message, timeout = 5000) {
  await page.waitForSelector(`text=${message}`, { timeout, state: 'visible' });
}

/**
 * Nettoie IndexedDB avant un test
 */
export async function clearIndexedDB(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const deleteDB = indexedDB.deleteDatabase('GarminDataDB');
      deleteDB.onsuccess = () => {
        // Attendre un peu pour que la suppression soit complète
        setTimeout(resolve, 500);
      };
      deleteDB.onerror = () => resolve(); // Continuer même en cas d'erreur
      deleteDB.onblocked = () => resolve(); // Continuer si bloqué
    });
  });
}

/**
 * Vérifie que des données existent dans IndexedDB
 */
export async function checkIndexedDBData(page, storeName = 'dailyMetrics') {
  return await page.evaluate((store) => {
    return new Promise((resolve) => {
      const request = indexedDB.open('GarminDataDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([store], 'readonly');
        const objectStore = transaction.objectStore(store);
        const countRequest = objectStore.count();
        countRequest.onsuccess = () => {
          resolve(countRequest.result > 0);
        };
        countRequest.onerror = () => resolve(false);
      };
      request.onerror = () => resolve(false);
    });
  }, storeName);
}

/**
 * Force une synchronisation avec un range spécifique
 */
export async function forceSyncRange(page, startDate, endDate) {
  // Ouvrir le menu "Forcer"
  const forceButton = page.locator('button:has-text("Forcer"), button:has-text("Force")').first();
  await forceButton.click({ timeout: 5000 });
  
  // Attendre le menu ou dialog
  await page.waitForSelector('[role="menu"], [role="dialog"]', { timeout: 3000 });
  
  // Sélectionner "Période personnalisée" ou remplir les dates
  const customOption = page.locator('text=Période personnalisée, text=Custom range').first();
  if (await customOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await customOption.click();
  }
  
  // Remplir les dates si un formulaire est présent
  const startInput = page.locator('input[type="date"], input[name*="start"], input[placeholder*="début"]').first();
  const endInput = page.locator('input[type="date"], input[name*="end"], input[placeholder*="fin"]').first();
  
  if (await startInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startInput.fill(startDate);
    await endInput.fill(endDate);
    
    // Confirmer
    const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Sync"), button[type="submit"]').first();
    await confirmButton.click();
  }
}

/**
 * Exporte les données en JSON
 */
export async function exportGarminData(page) {
  const exportButton = page.locator('button:has-text("Exporter"), button:has-text("Export")').first();
  await exportButton.click({ timeout: 5000 });
  
  // Attendre le téléchargement (peut prendre du temps)
  await page.waitForTimeout(2000);
}

/**
 * Vérifie qu'un fichier a été téléchargé
 */
export async function waitForDownload(page, filenamePattern) {
  // Playwright gère les téléchargements automatiquement
  // Cette fonction peut être étendue pour vérifier le contenu
  return new Promise((resolve) => {
    page.on('download', (download) => {
      if (filenamePattern.test(download.suggestedFilename())) {
        resolve(download);
      }
    });
    setTimeout(() => resolve(null), 10000); // Timeout après 10s
  });
}

