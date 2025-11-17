# 🔍 ANALYSE VALIDATION CALCULS NUTRITION

**Date** : 2025-01-16  
**Fichier analysé** : `src/hooks/nutritionCalculations.js`  
**Objectif** : Identifier tous les problèmes de validation, edge cases, et améliorer la robustesse des calculs

---

## 📋 PROBLÈMES IDENTIFIÉS

### Problème 1 : Pas de validation des inputs

**Code actuel** :
```javascript
export const calculateDailyTotals = (meals = [], program = null) => {
  // ❌ PROBLÈME : Pas de validation que meals est un array
  // ❌ PROBLÈME : Pas de validation que chaque meal a la structure attendue
  meals.forEach(meal => {
    totalCalories += meal.totalCalories || 0; // ❌ Si meal.totalCalories = NaN, additionne NaN
  });
}
```

**Risques** :
- Si `meals` n'est pas un array → `TypeError: meals.forEach is not a function`
- Si `meal.totalCalories` est `NaN` → Résultat final `NaN`
- Si `meal.totalCalories` est `Infinity` → Résultat final `Infinity`
- Si `meal.totalCalories` est négatif → Résultat incorrect (devrait être positif)

**🔥 SOLUTION OPTIMALE** :
```javascript
import { z } from 'zod';

// Schéma pour validation meal dans calculs
const mealForCalculationSchema = z.object({
  totalCalories: z.number().nonnegative().finite().default(0),
  totalProtein: z.number().nonnegative().finite().default(0),
  totalCarbs: z.number().nonnegative().finite().default(0),
  totalFat: z.number().nonnegative().finite().default(0),
  waterIntake: z.number().nonnegative().finite().optional()
}).passthrough(); // Accepter autres champs

export const calculateDailyTotals = (meals = [], program = null) => {
  // ✅ Validation inputs
  if (!Array.isArray(meals)) {
    throw new NutritionError(
      NutritionErrorCodes.VALIDATION_INVALID_DATA,
      'meals doit être un tableau',
      { meals }
    );
  }
  
  // ✅ Validation et normalisation chaque meal
  const validatedMeals = meals.map((meal, index) => {
    try {
      return mealForCalculationSchema.parse(meal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          `Meal invalide à l'index ${index}`,
          { meal, index, errors: error.errors }
        );
      }
      throw error;
    }
  });
  
  // Utiliser validatedMeals au lieu de meals
  validatedMeals.forEach(meal => {
    totalCalories += meal.totalCalories; // ✅ Garanti non-négatif, fini
  });
}
```

---

### Problème 2 : Division par zéro potentielle

**Code actuel** :
```javascript
const proteinPercent = totalMacroCalories > 0 
  ? Math.round((proteinCalories / totalMacroCalories) * 100) 
  : 0; // ✅ Protégé ici
```

**Mais ailleurs** :
```javascript
// ❌ PROBLÈME : Division par n sans vérification
means.calories /= n; // Si n = 0 (impossible mais pas vérifié)
Math.sqrt(variances.calories / n); // Si n = 0 → Infinity
```

**Risques** :
- Si `n = 0` (array vide) → Division par zéro → `Infinity`
- Si `variances.calories / n` est négatif (impossible mathématiquement mais possible avec erreurs) → `NaN`

**🔥 SOLUTION OPTIMALE** :
```javascript
const calculateVariability = (dailyMeals) => {
  if (!Array.isArray(dailyMeals) || dailyMeals.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  
  const n = dailyMeals.length;
  
  // ✅ Protection explicite
  if (n === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  
  // Calculer moyennes avec validation
  const means = dailyMeals.reduce((acc, dm) => {
    const dt = dm.dailyTotals || {};
    acc.calories += Math.max(0, dt.calories || 0); // ✅ Forcer non-négatif
    acc.protein += Math.max(0, dt.protein || 0);
    acc.carbs += Math.max(0, dt.carbs || 0);
    acc.fat += Math.max(0, dt.fat || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  // ✅ Division protégée
  means.calories = n > 0 ? means.calories / n : 0;
  means.protein = n > 0 ? means.protein / n : 0;
  means.carbs = n > 0 ? means.carbs / n : 0;
  means.fat = n > 0 ? means.fat / n : 0;
  
  // Calculer variance avec validation
  const variances = dailyMeals.reduce((acc, dm) => {
    const dt = dm.dailyTotals || {};
    const calories = Math.max(0, dt.calories || 0);
    const protein = Math.max(0, dt.protein || 0);
    const carbs = Math.max(0, dt.carbs || 0);
    const fat = Math.max(0, dt.fat || 0);
    
    acc.calories += Math.pow(calories - means.calories, 2);
    acc.protein += Math.pow(protein - means.protein, 2);
    acc.carbs += Math.pow(carbs - means.carbs, 2);
    acc.fat += Math.pow(fat - means.fat, 2);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  // ✅ Écart-type avec validation (sqrt ne peut pas être négatif mathématiquement)
  const stdDevCalories = n > 0 ? Math.sqrt(Math.max(0, variances.calories / n)) : 0;
  const stdDevProtein = n > 0 ? Math.sqrt(Math.max(0, variances.protein / n)) : 0;
  const stdDevCarbs = n > 0 ? Math.sqrt(Math.max(0, variances.carbs / n)) : 0;
  const stdDevFat = n > 0 ? Math.sqrt(Math.max(0, variances.fat / n)) : 0;
  
  // ✅ Vérifier NaN/Infinity
  return {
    calories: isFinite(stdDevCalories) ? Math.round(stdDevCalories) : 0,
    protein: isFinite(stdDevProtein) ? Math.round(stdDevProtein * 10) / 10 : 0,
    carbs: isFinite(stdDevCarbs) ? Math.round(stdDevCarbs * 10) / 10 : 0,
    fat: isFinite(stdDevFat) ? Math.round(stdDevFat * 10) / 10 : 0
  };
};
```

---

### Problème 3 : Valeurs NaN/Infinity non gérées

**Code actuel** :
```javascript
const ratio = actual / target; // ❌ Si target = 0 → Infinity
// ❌ Si actual ou target = NaN → ratio = NaN
```

**Risques** :
- `NaN` propagé dans tous les calculs → Résultat final `NaN`
- `Infinity` propagé → Résultat final `Infinity`
- Affichage UI avec `NaN` ou `Infinity` → Mauvaise UX

**🔥 SOLUTION OPTIMALE** :
```javascript
const calculateComplianceScore = (macros) => {
  // ✅ Validation inputs
  if (!macros || typeof macros !== 'object') {
    return 0;
  }
  
  const weights = {
    calories: 0.4,
    protein: 0.3,
    carbs: 0.15,
    fat: 0.15
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(macros).forEach(([key, { actual, target }]) => {
    // ✅ Validation valeurs
    const actualValue = typeof actual === 'number' && isFinite(actual) ? Math.max(0, actual) : 0;
    const targetValue = typeof target === 'number' && isFinite(target) && target > 0 ? target : 0;
    
    if (targetValue > 0) {
      const weight = weights[key] || 0.25;
      const ratio = actualValue / targetValue; // ✅ Garanti fini et positif
      
      // ✅ Validation ratio
      if (!isFinite(ratio) || ratio < 0) {
        return; // Skip ce macro si ratio invalide
      }
      
      // Score basé sur proximité de la cible
      let score = 100;
      if (ratio < 0.8) {
        score = 100 * ratio / 0.8; // ✅ Garanti fini (ratio >= 0)
      } else if (ratio > 1.2) {
        score = 100 * (1.2 / ratio); // ✅ Garanti fini (ratio > 0)
      }
      
      // ✅ Validation score final
      if (isFinite(score) && score >= 0 && score <= 100) {
        totalScore += score * weight;
        totalWeight += weight;
      }
    }
  });

  // ✅ Protection division par zéro + validation résultat
  if (totalWeight > 0) {
    const finalScore = totalScore / totalWeight;
    return isFinite(finalScore) && finalScore >= 0 && finalScore <= 100
      ? Math.round(finalScore)
      : 0;
  }
  
  return 0;
};
```

---

### Problème 4 : Pas de validation des targets du programme

**Code actuel** :
```javascript
const targetCalories = program?.targetCalories || 2500;
// ❌ PROBLÈME : Si targetCalories = 0, utilise 0 (devrait être > 0)
// ❌ PROBLÈME : Si targetCalories = NaN, utilise NaN
// ❌ PROBLÈME : Si targetCalories = Infinity, utilise Infinity
```

**Risques** :
- Targets invalides → Calculs incorrects
- Division par zéro si target = 0
- Propagation NaN/Infinity

**🔥 SOLUTION OPTIMALE** :
```javascript
// Helper pour valider et normaliser target
const getValidTarget = (value, defaultValue, min = 0, max = 100000) => {
  if (typeof value !== 'number' || !isFinite(value) || value <= min || value > max) {
    return defaultValue;
  }
  return value;
};

// Dans calculateDailyTotals :
const targetCalories = getValidTarget(program?.targetCalories, 2500, 500, 10000);
const targetProtein = getValidTarget(program?.targetProtein, 150, 10, 500);
const targetCarbs = getValidTarget(program?.targetCarbs, 300, 10, 1000);
const targetFat = getValidTarget(program?.targetFat, 80, 10, 500);
const targetWater = getValidTarget(program?.targetWater, 3000, 500, 20000);
```

---

### Problème 5 : Pas de validation des dates

**Code actuel** :
```javascript
export const getNutritionStats = (dailyMeals = [], startDate, endDate) => {
  // ❌ PROBLÈME : Pas de validation format dates
  const filtered = dailyMeals.filter(dm => 
    dm.date >= startDate && dm.date <= endDate // ❌ Comparaison string non validée
  );
}
```

**Risques** :
- Dates invalides → Filtrage incorrect
- Comparaison string non fiable (ex: "2025-1-1" vs "2025-01-01")

**🔥 SOLUTION OPTIMALE** :
```javascript
import { DateHelper } from '../utils/dateHelper';

export const getNutritionStats = (dailyMeals = [], startDate, endDate) => {
  // ✅ Validation inputs
  if (!Array.isArray(dailyMeals)) {
    throw new NutritionError(
      NutritionErrorCodes.VALIDATION_INVALID_DATA,
      'dailyMeals doit être un tableau',
      { dailyMeals }
    );
  }
  
  // ✅ Validation dates avec DateHelper
  if (!DateHelper.isValidDateString(startDate)) {
    throw new NutritionError(
      NutritionErrorCodes.VALIDATION_INVALID_DATA,
      'startDate invalide',
      { startDate }
    );
  }
  
  if (!DateHelper.isValidDateString(endDate)) {
    throw new NutritionError(
      NutritionErrorCodes.VALIDATION_INVALID_DATA,
      'endDate invalide',
      { endDate }
    );
  }
  
  // ✅ Normaliser dates pour comparaison fiable
  const normalizedStartDate = DateHelper.normalizeDate(startDate);
  const normalizedEndDate = DateHelper.normalizeDate(endDate);
  
  // Filtrer avec dates normalisées
  const filtered = dailyMeals.filter(dm => {
    if (!dm || !dm.date) return false;
    const normalizedDate = DateHelper.normalizeDate(dm.date);
    return normalizedDate >= normalizedStartDate && normalizedDate <= normalizedEndDate;
  });
}
```

---

### Problème 6 : Pas de gestion d'erreurs standardisée

**Code actuel** :
```javascript
// ❌ PROBLÈME : Pas de try/catch, pas de NutritionError
export const calculateDailyTotals = (meals = [], program = null) => {
  // Si erreur → crash silencieux ou erreur non gérée
}
```

**Risques** :
- Erreurs non capturées → Crash application
- Pas de logs pour debugging
- Pas de messages d'erreur utilisateur

**🔥 SOLUTION OPTIMALE** :
```javascript
import { NutritionError, NutritionErrorCodes } from '../utils/nutritionErrors';
import logger from '../utils/logger';

const log = logger.module('nutritionCalculations');

export const calculateDailyTotals = (meals = [], program = null) => {
  try {
    // ✅ Validation inputs
    // ... validation code ...
    
    // ✅ Calculs avec validation
    // ... calculs protégés ...
    
    // ✅ Validation résultat final
    const result = {
      calories: Math.round(totalCalories),
      // ...
    };
    
    // ✅ Vérifier que tous les champs sont valides
    if (!isFinite(result.calories) || result.calories < 0) {
      throw new NutritionError(
        NutritionErrorCodes.CALCULATION_ERROR,
        'Résultat calcul calories invalide',
        { result }
      );
    }
    
    return result;
  } catch (error) {
    if (error instanceof NutritionError) {
      log.error('[calculateDailyTotals] Erreur calcul:', error.toJSON());
      throw error; // Propager
    }
    
    // Wrapper erreurs inconnues
    log.error('[calculateDailyTotals] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.UNKNOWN_ERROR,
      'Erreur lors du calcul des totaux journaliers',
      { originalError: error.message },
      error
    );
  }
};
```

---

## ✅ PLAN D'ACTION

### Phase 10.5 : Validation robuste des calculs nutrition

1. ✅ **Créer schémas Zod pour inputs calculs** :
   - `mealForCalculationSchema` : Validation meal dans calculs
   - `programForCalculationSchema` : Validation programme dans calculs
   - `dateRangeSchema` : Validation plages de dates

2. ✅ **Ajouter validation boundaries** :
   - Vérification NaN/Infinity partout
   - Vérification valeurs négatives
   - Protection division par zéro
   - Validation plages de valeurs (min/max)

3. ✅ **Améliorer gestion erreurs** :
   - Utiliser `NutritionError` standardisé
   - Logs détaillés pour debugging
   - Messages d'erreur descriptifs

4. ✅ **Ajouter helpers de validation** :
   - `getValidTarget()` : Normaliser targets
   - `validateAndNormalizeNumber()` : Valider nombres
   - `safeDivision()` : Division protégée
   - `safeSqrt()` : Sqrt protégé

5. ✅ **Valider résultats finaux** :
   - Vérifier que tous les champs sont finis
   - Vérifier plages de valeurs
   - Vérifier cohérence (ex: pourcentages = 100%)

---

## 📊 BÉNÉFICES ATTENDUS

- ✅ Robustesse accrue (gestion tous edge cases)
- ✅ Protection contre NaN/Infinity
- ✅ Validation inputs (meilleure détection erreurs)
- ✅ Messages d'erreur descriptifs (meilleure UX)
- ✅ Type-safety avec Zod (détection erreurs à l'exécution)

---

**Document créé le** : 2025-01-16  
**Statut** : En attente implémentation Phase 10.5


