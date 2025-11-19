# 🤝 Guide de Contribution - Onglet Nutrition

> **Standards de développement pour maintenir la qualité et la cohérence du code**

---

## 📋 Table des Matières

1. [Standards de Code](#standards-de-code)
2. [Structure des Fichiers](#structure-des-fichiers)
3. [Conventions de Nommage](#conventions-de-nommage)
4. [Processus de Review](#processus-de-review)
5. [Tests](#tests)
6. [Documentation](#documentation)

---

## 💻 Standards de Code

### Principes Fondamentaux

1. **Performance First** : Chaque implémentation doit être optimisée
2. **Type Safety** : Validation Zod partout (runtime type checking)
3. **Modularité** : Code modulaire et réutilisable
4. **Documentation** : Code auto-documenté (JSDoc)
5. **Tests** : Tests unitaires pour logique critique

### React

```jsx
// ✅ BON : Composant mémorisé avec React.memo
const MyComponent = React.memo(({ data }) => {
  // ...
});

// ✅ BON : useCallback pour handlers
const handleSave = useCallback(async () => {
  // ...
}, [dependencies]);

// ✅ BON : useMemo pour calculs coûteux
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### Validation Zod

```javascript
// ✅ BON : Validation avec Zod
import { z } from 'zod';

const dailyMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalCalories: z.number().min(0).max(50000),
  totalProtein: z.number().min(0).max(2000)
});

// Validation
const validated = dailyMealSchema.parse(data);
```

### Gestion d'Erreurs

```javascript
// ✅ BON : Erreurs standardisées
import { NutritionError, NutritionErrorCodes } from '@/utils/nutritionErrors';

try {
  // ...
} catch (error) {
  if (error instanceof QuotaExceededError) {
    // Gérer quota dépassé
  } else if (error instanceof NutritionError) {
    // Gérer erreur nutrition
  } else {
    // Gérer erreur inconnue
  }
}
```

---

## 📁 Structure des Fichiers

### Organisation

```
src/
├── components/tabs/nutrition/
│   ├── components/          # Composants UI
│   └── NutritionTab.jsx      # Composant principal
├── hooks/
│   ├── useNutritionData.js   # Hook principal
│   └── nutritionDataCRUD.js  # CRUD operations
├── services/nutrition/
│   ├── repository/           # Repository Pattern
│   └── *.js                  # Services métier
├── config/
│   └── nutrition.config.js   # Configuration centralisée
└── constants/
    └── nutrition.constants.js # Constantes
```

### Naming Conventions

- **Composants** : `PascalCase` (ex: `NutritionJournal.jsx`)
- **Hooks** : `camelCase` avec préfixe `use` (ex: `useNutritionData.js`)
- **Services** : `camelCase` (ex: `nutritionGamification.js`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `MAX_BATCH_SIZE`)
- **Fichiers tests** : `*.test.js` ou `*.test.jsx`

---

## 🏷️ Conventions de Nommage

### Variables

```javascript
// ✅ BON : camelCase pour variables
const dailyMeal = await getDailyMeal(date);
const totalCalories = calculateTotals(meals);

// ❌ ÉVITER : snake_case
const daily_meal = await getDailyMeal(date);
```

### Fonctions

```javascript
// ✅ BON : camelCase pour fonctions
const calculateDailyTotals = (meals) => {
  // ...
};

// ✅ BON : Verbe d'action clair
const saveDailyMeal = async (dailyMeal) => {
  // ...
};
```

### Classes

```javascript
// ✅ BON : PascalCase pour classes
class NutritionRepository {
  // ...
}
```

### Constantes

```javascript
// ✅ BON : UPPER_SNAKE_CASE pour constantes
const MAX_BATCH_SIZE = 1000;
const DEFAULT_TARGET_CALORIES = 2500;
```

---

## 🔍 Processus de Review

### Checklist Avant PR

- [ ] Code suit les standards (ESLint, Prettier)
- [ ] Tests unitaires ajoutés/modifiés
- [ ] Tests passent (`npm run test`)
- [ ] Documentation JSDoc ajoutée
- [ ] Validation Zod ajoutée si nouvelles données
- [ ] Configuration centralisée utilisée (pas de valeurs hardcodées)
- [ ] Performance vérifiée (pas de régression)
- [ ] Export JSON vérifié si nouvelles données

### Review Criteria

1. **Performance** : Pas de régression, optimisations vérifiées
2. **Type Safety** : Validation Zod présente
3. **Modularité** : Code réutilisable et modulaire
4. **Documentation** : JSDoc complet
5. **Tests** : Couverture adéquate

---

## 🧪 Tests

### Structure Tests

```javascript
// ✅ BON : Structure test standard
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateDailyTotals } from '@/hooks/nutritionCalculations';

describe('calculateDailyTotals', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('devrait calculer les totaux correctement', () => {
    const meals = [
      { calories: 500, protein: 30, carbs: 50, fat: 20 },
      { calories: 300, protein: 20, carbs: 30, fat: 10 }
    ];
    
    const result = calculateDailyTotals(meals);
    
    expect(result.calories).toBe(800);
    expect(result.protein).toBe(50);
  });
});
```

### Coverage Minimum

- **Logique critique** : 100% coverage
- **Services métier** : 80%+ coverage
- **Composants UI** : Tests d'intégration principaux

---

## 📚 Documentation

### JSDoc

```javascript
/**
 * Calcule les totaux nutritionnels journaliers
 * 
 * @param {Array<Object>} meals - Tableau de repas
 * @param {Object} program - Programme nutritionnel actif (optionnel)
 * @returns {Object} Totaux calculés (calories, protein, carbs, fat, etc.)
 * 
 * @example
 * const totals = calculateDailyTotals([
 *   { calories: 500, protein: 30, carbs: 50, fat: 20 }
 * ]);
 */
export const calculateDailyTotals = (meals, program) => {
  // ...
};
```

### README

- Mettre à jour `README.md` si nouvelles fonctionnalités
- Ajouter exemples d'utilisation
- Documenter breaking changes

---

## 🎯 Exemples

### Nouveau Service

```javascript
// ✅ BON : Structure service standard
import logger from '@/utils/logger';
import { NutritionConfig } from '@/config/nutrition.config';

const log = logger.module('myNewService');

/**
 * Nouveau service pour fonctionnalité X
 * 
 * @module services/nutrition/myNewService
 */
export const myNewFunction = async (data) => {
  try {
    // Validation
    const validated = mySchema.parse(data);
    
    // Logique métier
    const result = await processData(validated);
    
    return result;
  } catch (error) {
    log.error('[myNewFunction] Erreur:', error);
    throw error;
  }
};
```

### Nouveau Composant

```jsx
// ✅ BON : Composant optimisé
import React, { useMemo, useCallback } from 'react';
import { useNutritionData } from '@/hooks/useNutritionData';

/**
 * Nouveau composant pour fonctionnalité X
 * 
 * @module components/tabs/nutrition/components/MyNewComponent
 */
const MyNewComponent = React.memo(({ data }) => {
  const { saveData } = useNutritionData();
  
  // Calculs mémorisés
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // Handlers mémorisés
  const handleSave = useCallback(async () => {
    await saveData(processedData);
  }, [processedData, saveData]);
  
  return (
    <div>
      {/* UI */}
    </div>
  );
});

export default MyNewComponent;
```

---

## ✅ Checklist Contribution

Avant de soumettre une PR :

- [ ] Code suit les standards (ESLint, Prettier)
- [ ] Tests unitaires ajoutés/modifiés
- [ ] Tests passent (`npm run test`)
- [ ] Documentation JSDoc ajoutée
- [ ] Validation Zod ajoutée si nouvelles données
- [ ] Configuration centralisée utilisée
- [ ] Performance vérifiée
- [ ] Export JSON vérifié si nouvelles données
- [ ] README mis à jour si nouvelles fonctionnalités

---

**Dernière mise à jour** : 2025-01-16  
**Version** : 1.0

