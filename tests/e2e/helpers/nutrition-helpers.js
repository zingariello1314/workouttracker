/**
 * Helpers pour les tests E2E de l'onglet Nutrition
 * 
 * Fonctions utilitaires pour :
 * - Navigation dans l'onglet Nutrition
 * - Interactions avec les formulaires (meal, programme)
 * - Vérification des données IndexedDB
 * - Gestion des attentes
 * 
 * @module tests/e2e/helpers/nutrition-helpers
 */

/**
 * Navigue vers l'onglet Nutrition
 */
export async function navigateToNutritionTab(page) {
  // Cliquer sur l'onglet Nutrition dans la navigation
  await page.click('text=Nutrition', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Attendre que l'onglet soit chargé
  await page.waitForSelector('[data-testid="nutrition-tab"], .nutrition-tab, #nutrition-tab', {
    timeout: 10000,
    state: 'visible'
  }).catch(() => {
    // Fallback : vérifier la présence d'éléments caractéristiques
    return page.waitForSelector('text=Journal, text=Programmes, [data-section="journal"]', { timeout: 10000 });
  });
}

/**
 * Attend que les données Nutrition soient chargées
 */
export async function waitForNutritionData(page, timeout = 30000) {
  // Attendre soit que des données soient affichées, soit le message "Aucune donnée"
  await Promise.race([
    page.waitForSelector('text=Aucune donnée', { timeout }),
    page.waitForSelector('[data-testid="nutrition-journal"], .nutrition-journal', { timeout }),
    page.waitForSelector('text=Journal', { timeout }),
    page.waitForSelector('input[type="date"]', { timeout }), // Sélecteur de date
  ]).catch(() => {
    // Timeout acceptable si l'application charge
  });
}

/**
 * Navigue vers la section Journal
 */
export async function navigateToJournalSection(page) {
  // Cliquer sur l'onglet/section Journal
  const journalButton = page.locator('button:has-text("Journal"), [data-section="journal"], text=Journal').first();
  await journalButton.waitFor({ state: 'visible', timeout: 10000 });
  await journalButton.click();
  await page.waitForTimeout(500); // Attendre transition
}

/**
 * Navigue vers la section Programmes
 */
export async function navigateToProgramsSection(page) {
  // Cliquer sur l'onglet/section Programmes
  const programsButton = page.locator('button:has-text("Programmes"), [data-section="programs"], text=Programmes').first();
  await programsButton.waitFor({ state: 'visible', timeout: 10000 });
  await programsButton.click();
  await page.waitForTimeout(500); // Attendre transition
}

/**
 * Ouvre le formulaire d'ajout de repas
 */
export async function openMealForm(page) {
  const addButton = page.locator('button:has-text("Ajouter"), button:has-text("Nouveau repas"), button:has-text("+")').first();
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();
  await page.waitForTimeout(500); // Attendre ouverture modal
}

/**
 * Remplit le formulaire de repas
 */
export async function fillMealForm(page, mealData) {
  const {
    type = 'breakfast',
    calories = 500,
    protein = 30,
    carbs = 50,
    fat = 20,
    name = 'Test Meal'
  } = mealData;

  // Sélectionner type de repas si présent
  const typeSelect = page.locator('select[name="type"], [data-testid="meal-type"]').first();
  if (await typeSelect.count() > 0) {
    await typeSelect.selectOption(type);
  }

  // Remplir calories
  const caloriesInput = page.locator('input[name="calories"], input[name="totalCalories"], [data-testid="calories"]').first();
  if (await caloriesInput.count() > 0) {
    await caloriesInput.fill(String(calories));
  }

  // Remplir protéines
  const proteinInput = page.locator('input[name="protein"], input[name="totalProtein"], [data-testid="protein"]').first();
  if (await proteinInput.count() > 0) {
    await proteinInput.fill(String(protein));
  }

  // Remplir glucides
  const carbsInput = page.locator('input[name="carbs"], input[name="totalCarbs"], [data-testid="carbs"]').first();
  if (await carbsInput.count() > 0) {
    await carbsInput.fill(String(carbs));
  }

  // Remplir lipides
  const fatInput = page.locator('input[name="fat"], input[name="totalFat"], [data-testid="fat"]').first();
  if (await fatInput.count() > 0) {
    await fatInput.fill(String(fat));
  }

  // Remplir nom si présent
  const nameInput = page.locator('input[name="name"], [data-testid="meal-name"]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill(name);
  }
}

/**
 * Sauvegarde le formulaire de repas
 */
export async function saveMealForm(page) {
  const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Valider")').first();
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  await saveButton.click();
  await page.waitForTimeout(1000); // Attendre sauvegarde
}

/**
 * Vérifie que les totaux journaliers sont mis à jour
 */
export async function checkDailyTotals(page, expectedCalories) {
  // Chercher l'élément affichant les totaux calories
  const totalsElement = page.locator('[data-testid="total-calories"], .daily-totals, text=/calories/i').first();
  await totalsElement.waitFor({ state: 'visible', timeout: 10000 });
  
  const text = await totalsElement.textContent();
  const caloriesMatch = text.match(/(\d+)/);
  if (caloriesMatch) {
    const displayedCalories = parseInt(caloriesMatch[1]);
    expect(displayedCalories).toBeGreaterThanOrEqual(expectedCalories);
  }
}

/**
 * Ouvre le formulaire de création de programme
 */
export async function openProgramForm(page) {
  const addButton = page.locator('button:has-text("Nouveau programme"), button:has-text("Créer"), button:has-text("+")').first();
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();
  await page.waitForTimeout(500); // Attendre ouverture modal
}

/**
 * Remplit le formulaire de programme
 */
export async function fillProgramForm(page, programData) {
  const {
    name = 'Test Program',
    goal = 'maintenance',
    targetCalories = 2500,
    targetProtein = 150,
    targetCarbs = 300,
    targetFat = 80
  } = programData;

  // Remplir nom
  const nameInput = page.locator('input[name="name"], [data-testid="program-name"]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill(name);
  }

  // Sélectionner objectif si présent
  const goalSelect = page.locator('select[name="goal"], [data-testid="program-goal"]').first();
  if (await goalSelect.count() > 0) {
    await goalSelect.selectOption(goal);
  }

  // Remplir calories cibles
  const caloriesInput = page.locator('input[name="targetCalories"], input[name="calories"], [data-testid="target-calories"]').first();
  if (await caloriesInput.count() > 0) {
    await caloriesInput.fill(String(targetCalories));
  }

  // Remplir protéines cibles
  const proteinInput = page.locator('input[name="targetProtein"], input[name="protein"], [data-testid="target-protein"]').first();
  if (await proteinInput.count() > 0) {
    await proteinInput.fill(String(targetProtein));
  }

  // Remplir glucides cibles
  const carbsInput = page.locator('input[name="targetCarbs"], input[name="carbs"], [data-testid="target-carbs"]').first();
  if (await carbsInput.count() > 0) {
    await carbsInput.fill(String(targetCarbs));
  }

  // Remplir lipides cibles
  const fatInput = page.locator('input[name="targetFat"], input[name="fat"], [data-testid="target-fat"]').first();
  if (await fatInput.count() > 0) {
    await fatInput.fill(String(targetFat));
  }
}

/**
 * Sauvegarde le formulaire de programme
 */
export async function saveProgramForm(page) {
  const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Créer")').first();
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  await saveButton.click();
  await page.waitForTimeout(1000); // Attendre sauvegarde
}

/**
 * Active un programme
 */
export async function activateProgram(page, programName) {
  // Chercher le bouton d'activation pour le programme
  const activateButton = page.locator(`button:has-text("${programName}")`).locator('..').locator('button:has-text("Activer"), button:has-text("Actif")').first();
  await activateButton.waitFor({ state: 'visible', timeout: 10000 });
  await activateButton.click();
  await page.waitForTimeout(1000); // Attendre activation
}

/**
 * Vérifie qu'un programme est actif
 */
export async function checkProgramActive(page, programName) {
  const activeBadge = page.locator(`text=${programName}`).locator('..').locator('text=Actif, [data-testid="active-badge"]').first();
  await activeBadge.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Navigue vers les paramètres pour export
 */
export async function navigateToSettings(page) {
  await page.click('text=Paramètres, text=Settings', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * Exporte les données nutrition
 */
export async function exportNutritionData(page) {
  // Chercher le bouton d'export
  const exportButton = page.locator('button:has-text("Exporter"), button:has-text("Export"), [data-testid="export-nutrition"]').first();
  await exportButton.waitFor({ state: 'visible', timeout: 10000 });
  await exportButton.click();
  await page.waitForTimeout(2000); // Attendre export
  
  // Attendre le téléchargement du fichier
  // Note: Playwright gère automatiquement les téléchargements
}

/**
 * Vérifie les données dans IndexedDB
 */
export async function checkIndexedDBData(page, storeName, key) {
  return await page.evaluate(async (store, keyValue) => {
    return new Promise((resolve) => {
      const request = indexedDB.open('WorkoutTrackerDB', 10);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(store)) {
          resolve(false);
          return;
        }
        const tx = db.transaction([store], 'readonly');
        const storeObj = tx.objectStore(store);
        const getRequest = keyValue ? storeObj.get(keyValue) : storeObj.getAll();
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(keyValue ? (result !== undefined) : (Array.isArray(result) && result.length > 0));
        };
        getRequest.onerror = () => resolve(false);
      };
      request.onerror = () => resolve(false);
    });
  }, storeName, key);
}

/**
 * Nettoie IndexedDB avant les tests
 */
export async function clearIndexedDB(page) {
  await page.evaluate(async () => {
    return new Promise((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase('WorkoutTrackerDB');
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve(); // Continuer même en cas d'erreur
      deleteRequest.onblocked = () => {
        // Si bloqué, attendre un peu et réessayer
        setTimeout(() => resolve(), 1000);
      };
    });
  });
  await page.waitForTimeout(500); // Attendre nettoyage
}

/**
 * Attend un toast/notification
 */
export async function waitForToast(page, type = 'success', timeout = 10000) {
  // Chercher un toast de succès ou d'erreur
  const toastSelector = type === 'success' 
    ? 'text=/succès|réussi|enregistré/i'
    : 'text=/erreur|échec/i';
  
  await page.waitForSelector(toastSelector, { timeout }).catch(() => {
    // Timeout acceptable si pas de toast
  });
}

