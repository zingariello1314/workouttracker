# 🧪 GUIDE DES TESTS - Garmin Integration

## 🔴 FIX #40: Documentation complète des tests

---

## 📋 **TESTS PYTHON (Parsers)**

### Structure
```
garmin-server/tests/
├── __init__.py
├── test_validators.py              # 4 classes de tests
├── test_activity_parser.py         # 4 classes de tests
├── test_daily_metrics_parser.py    # 5 classes de tests
├── pytest.ini                      # Configuration
└── README.md
```

### Exécution

**Avec pytest (recommandé) :**
```bash
cd garmin-server
pytest tests/ -v
```

**Avec unittest :**
```bash
cd garmin-server
python -m unittest discover tests
```

**Test individuel :**
```bash
python tests/test_validators.py
python tests/test_activity_parser.py
python tests/test_daily_metrics_parser.py
```

### Couverture

✅ **Validation** (4 classes de tests)
- Heart rate (valide, hors limites, logique)
- Distance/steps (ratio, extrêmes)
- Swimming (cohérence)
- Calories (cohérence)

✅ **Parser Activités** (4 classes de tests)
- Classification (swimming, jumpRope, cardio)
- Parsing métriques communes
- Parsing natation
- Parsing corde à sauter

✅ **Parser Métriques** (5 classes de tests)
- Steps (valides, zéro, manquants)
- Distance (valides, zéro, manquants)
- Calories (totales, actives, repos)
- Heart rate (depuis stats, hr_day, time series)
- Intensity minutes

---

## 📋 **TESTS REACT (Hooks)**

### Structure
```
src/components/tabs/GarminTab/hooks/__tests__/
├── useAdvancedFilters.test.js      # Tests filtrage
├── useGarminData.test.js           # Tests IndexedDB
├── useAutoSync.test.js             # Tests sync auto
└── runAllTests.js                  # Runner principal
```

### Exécution

**Dans la console du navigateur :**
```javascript
// Importer le module
import { runAllGarminTests } from './src/components/tabs/GarminTab/hooks/__tests__/runAllTests.js';

// Exécuter tous les tests
runAllGarminTests();
```

**Ou directement dans la console :**
```javascript
// Les fonctions sont exposées globalement
testUseAdvancedFilters();
testUseGarminData();
testUseAutoSync();
runAllGarminTests();
```

### Tests disponibles

✅ **useAdvancedFilters** (4 tests)
- Filtrage par type
- Filtrage par distance
- Recherche par nom
- Recherche par métriques

✅ **useGarminData** (3 tests)
- Structure de données
- Normalisation de dates
- Calcul de plage de dates

✅ **useAutoSync** (3 tests)
- Calcul sync quotidien
- Calcul sync hebdomadaire
- Sauvegarde/Chargement settings

---

## 🔧 **INSTALLATION FRAMEWORK COMPLET (Optionnel)**

Pour une suite de tests complète avec Jest ou Vitest :

### Option 1: Vitest (Recommandé pour Vite)

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

**vite.config.js :**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js'
  }
});
```

**package.json :**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Option 2: Jest

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

**jest.config.js :**
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

---

## 📊 **RÉSULTATS ACTUELS**

### Tests Python
- ✅ **13 classes de tests** créées
- ✅ **~50+ tests individuels**
- ✅ Couverture : Parsers critiques

### Tests React
- ✅ **3 suites de tests** créées
- ✅ **10+ tests individuels**
- ✅ Tests fonctionnels (pas de framework requis)

---

## 🎯 **PROCHAINES ÉTAPES**

1. **Installer framework de tests** (Vitest recommandé)
2. **Migrer les tests manuels vers framework**
3. **Ajouter tests d'intégration**
4. **Setup CI/CD avec tests automatiques**

---

**Note :** Les tests actuels sont fonctionnels et peuvent être exécutés manuellement. L'installation d'un framework complet est optionnelle mais recommandée pour une suite de tests professionnelle.

