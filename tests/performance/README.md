# Tests Performance - Onglet Garmin

> **Objectif** : Automatiser les tests de régression de performance pour garantir que les optimisations ne se dégradent pas.

---

## 📊 Métriques Testées

### 1. Time to Interactive (TTI)
- **Budget** : < 2.0s (P95)
- **Mesure** : Temps entre `fetchStart` et `domInteractive`
- **Impact** : Expérience utilisateur initiale

### 2. Chart Render
- **Budget** : < 200ms
- **Mesure** : Temps de rendu des graphiques Recharts
- **Impact** : Fluidité de l'onglet Charts

### 3. IndexedDB Write Batch
- **Budget** : < 50ms par opération (5000ms pour 100 opérations)
- **Mesure** : Temps d'écriture batch dans IndexedDB
- **Impact** : Performance de synchronisation

### 4. Sync Round-trip
- **Budget** : < 3s
- **Mesure** : Temps complet de synchronisation (bouton → succès)
- **Impact** : Expérience utilisateur lors de la sync

---

## 🚀 Utilisation

### Exécuter les tests

```bash
# Exécuter tous les tests performance
npm run test:perf

# Exécuter avec UI
npx playwright test tests/performance/regression.spec.js --ui

# Exécuter en mode debug
npx playwright test tests/performance/regression.spec.js --debug
```

### Créer une baseline

```bash
# Créer une baseline initiale
npm run perf:baseline

# La baseline est sauvegardée dans logs/garmin/perf-baseline.json
```

### Comparer avec la baseline

```bash
# Comparer les résultats avec la baseline
node scripts/perf/compare-baseline.js

# Ou avec un fichier de résultats spécifique
node scripts/perf/compare-baseline.js logs/garmin/perf-results.json
```

---

## 📋 Structure des Fichiers

```
tests/performance/
├── regression.spec.js    # Tests Playwright (4 tests)
├── helpers.js            # Helpers pour baseline
└── README.md            # Ce fichier

scripts/perf/
├── create-baseline.sh   # Script création baseline
└── compare-baseline.js  # Script comparaison

logs/garmin/
├── perf-baseline.json   # Baseline de référence
└── perf-results.json    # Résultats des tests
```

---

## 🔧 Configuration

### Baseline

La baseline est stockée dans `logs/garmin/perf-baseline.json` :

```json
{
  "tti": 2000,
  "chartRender": 200,
  "indexedDBWrite": 5000,
  "syncRoundTrip": 3000,
  "lastUpdated": "2024-12-20T10:00:00.000Z"
}
```

### Seuil de régression

Par défaut, une régression est détectée si la performance se dégrade de **>10%** par rapport à la baseline.

Ce seuil est configurable dans `tests/performance/helpers.js` :

```javascript
compareWithBaseline(value, baseline, threshold = 10) // 10% par défaut
```

---

## 🔄 CI/CD

Les tests performance sont exécutés automatiquement dans GitHub Actions :

- **Déclencheur** : Pull requests vers `main` ou `develop`
- **Workflow** : `.github/workflows/performance-tests.yml`
- **Actions** :
  1. Exécute les tests
  2. Compare avec la baseline
  3. Comment la PR avec les résultats
  4. Bloque le merge si régression >10%

---

## 📝 Ajouter un Nouveau Test

1. Ajouter le test dans `regression.spec.js` :

```javascript
test('Nouvelle métrique should be < Xms', async ({ page }) => {
  // Mesure
  const duration = await page.evaluate(() => {
    // Votre code de mesure
  });

  const baseline = await loadBaseline('nouvelleMetrique');
  
  expect(duration).toBeLessThan(X);
  
  if (baseline) {
    const comparison = compareWithBaseline(duration, baseline, 10);
    if (comparison.isRegression) {
      throw new Error(comparison.message);
    }
  }
});
```

2. Mettre à jour la baseline :

```bash
# Modifier scripts/perf/create-baseline.sh pour inclure la nouvelle métrique
npm run perf:baseline
```

---

## 🐛 Dépannage

### Les tests échouent systématiquement

1. Vérifier que l'application est démarrée : `npm run dev`
2. Vérifier que Playwright est installé : `npx playwright install`
3. Vérifier les budgets dans `PERFORMANCE_BUDGET.md`

### La baseline n'existe pas

```bash
# Créer une baseline avec valeurs par défaut
npm run perf:baseline
```

### Les résultats varient trop

- Augmenter le nombre de mesures (actuellement 5 pour P95)
- Vérifier que l'environnement est stable (pas d'autres processus)
- Utiliser un environnement CI pour des mesures reproductibles

---

## 📚 Références

- `PERFORMANCE_BUDGET.md` : Budgets de performance détaillés
- `TESTING_STRATEGY.md` : Stratégie de tests complète
- `VERIFICATION_METHODIQUE_PHASE_8.md` : Section 9.2 - Tests Performance

