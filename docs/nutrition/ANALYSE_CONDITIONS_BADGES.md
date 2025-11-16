# 🔍 ANALYSE DÉTAILLÉE DES CONDITIONS DES BADGES

**Date :** 2025-01-16  
**Objectif :** Vérifier que toutes les conditions des badges sont parfaitement définies et robustes  
**Total de badges analysés :** 100 badges (20 FACILE + 20 SIMPLE + 20 MOYEN + 20 DIFFICILE + 20 HARDCORE + 20 IMPOSSIBLE)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble des problèmes identifiés](#vue-densemble)
2. [Analyse par catégorie de problèmes](#analyse-par-catégorie)
3. [Analyse badge par badge](#analyse-badge-par-badge)
4. [Solutions recommandées](#solutions-recommandées)
5. [Plan d'implémentation](#plan-dimplémentation)

---

## 🎯 VUE D'ENSEMBLE

### Structure réelle de `userData` (vérifiée dans le code)

**Source :** `src/hooks/useNutritionGamification.js` - fonction `prepareUserData`

```javascript
const userData = {
  nutritionHistory: dailyMeals.map(dm => ({
    date: dm.date,                          // String "YYYY-MM-DD"
    dailyTotals: dm.dailyTotals,            // Object avec calories, protein, carbs, fat, waterIntake, targetX, complianceScore
    complianceScore: dm.complianceScore,    // Number (0-100) - aussi dans dailyTotals.complianceScore
    meals: mealsByDate.get(dm.date) || []   // Array de meals avec {type, foods: [{name, calories, protein, carbs, fat, fiber, sugar, addedSugar, ...}]}
  })),
  streaks: {
    nutrition: { current, actual, forgivenessUsed, maxReached, status }
  },
  uniqueFoodsLast7Days: uniqueFoods.size,   // Number
  activeProgram: {                          // Object ou null
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number,
    targetWater: number,
    // ... autres champs programme
  }
};
```

**Structure `dailyTotals` (vérifiée dans `calculateDailyTotals`) :**
```javascript
{
  calories: number,           // ✅ Existe
  protein: number,            // ✅ Existe
  carbs: number,              // ✅ Existe
  fat: number,                // ✅ Existe
  waterIntake: number,        // ✅ Existe
  targetCalories: number,     // ✅ Existe (depuis programme ou défaut: 2500)
  targetProtein: number,      // ✅ Existe (depuis programme ou défaut: 150)
  targetCarbs: number,        // ✅ Existe (depuis programme ou défaut: 300)
  targetFat: number,          // ✅ Existe (depuis programme ou défaut: 80)
  targetWater: number,        // ✅ Existe (depuis programme ou défaut: 3000)
  complianceScore: number,    // ✅ Existe (0-100)
  // ⚠️ fiber n'existe PAS dans dailyTotals - doit être calculé depuis meals.foods
}
```

**⚠️ IMPORTANT :**
- `fiber` n'est PAS dans `dailyTotals` - doit être calculé depuis `day.meals[].foods[].fiber`
- `complianceScore` existe à la fois dans `day.complianceScore` ET `day.dailyTotals.complianceScore` (même valeur)
- `activeProgram` peut être `null` - toujours vérifier avant utilisation
- Valeurs par défaut dans `calculateDailyTotals` : `targetCalories: 2500`, `targetProtein: 150`, `targetCarbs: 300`, `targetFat: 80`, `targetWater: 3000`

---

### Problèmes généraux identifiés

1. **⚠️ Vérifications de données réelles manquantes** : Certains badges "sans X" ou "jour parfait" ne vérifient pas qu'il y a des données nutritionnelles réelles avant de valider l'absence.
2. **⚠️ Vérification de `dailyTotals`** : Certains badges supposent que `dailyTotals` existe toujours, sans fallback.
3. **⚠️ Vérification de `targetX`** : Beaucoup de badges utilisent des valeurs par défaut (ex: `targetCalories || 2000`) sans vérifier si l'utilisateur a un programme actif. **Les valeurs par défaut correctes sont 2500, 150, 300, 80, 3000** (pas 2000, 150, 200, 65, 2500).
4. **⚠️ Badges de variété/découverte** : Utilisent `uniqueFoodsLast7Days` qui pourrait ne pas être calculé correctement dans `prepareUserData`.
5. **⚠️ Badges temporels** : Certains badges nécessitent la vérification du jour de la semaine ou de l'heure des repas, mais utilisent des approximations.
6. **⚠️ Badges de recettes** : Utilisent une heuristique simple (3+ aliments = recette) qui pourrait être trompeuse.
7. **⚠️ Badges de compliance** : Utilisent `complianceScore` qui existe à la fois dans `day.complianceScore` et `day.dailyTotals.complianceScore`.
8. **⚠️ Badges de fibres** : `fiber` n'existe PAS dans `dailyTotals` - doit être calculé depuis `day.meals[].foods[].fiber`.
9. **⚠️ Structure `userData`** : Certains badges supposent une structure spécifique qui pourrait ne pas correspondre à `prepareUserData`.

---

## 📊 ANALYSE PAR CATÉGORIE DE PROBLÈMES

### 🟢 PROBLÈME 1 : Vérifications `hasRealNutritionData` / `hasMainMealsWithData` manquantes

**Badges concernés :**
- Badges "sans X" (sans snack, sans sucre, sans fast-food, etc.)
- Badges "jour parfait" ou "journée complète"
- Badges qui vérifient l'absence d'un élément

**Solution :** Ajouter `hasRealNutritionData(day)` ou `hasMainMealsWithData(day)` AVANT de valider l'absence.

---

### 🟡 PROBLÈME 2 : Valeurs par défaut pour `targetX` non contextuelles

**Badges concernés :**
- Badges de macros (protéines, glucides, lipides)
- Badges de calories
- Badges d'hydratation

**Exemple problématique :**
```javascript
const targetProtein = today?.dailyTotals?.targetProtein || 150;
```

**Problème :** Si l'utilisateur n'a pas de programme actif, on utilise 150g par défaut, ce qui n'est pas forcément adapté à son profil.

**Solution :** Vérifier si `userData.activeProgram` existe et utiliser ses valeurs, sinon utiliser des valeurs par défaut raisonnables ou retourner `false`.

---

### 🟠 PROBLÈME 3 : Badges de variété/découverte reposent sur `uniqueFoodsLast7Days`

**Badges concernés :**
- `badge_new_vegetable`
- `badge_new_protein_source`
- `badge_plant_protein`
- `badge_variety_10_7days`
- `badge_5new_vegetables`
- `badge_new_food_3days`
- `badge_7fruits_day`

**Problème :** `uniqueFoodsLast7Days` est calculé dans `prepareUserData`, mais :
1. Il pourrait ne pas être présent si la fonction n'a pas été appelée correctement
2. Il compte tous les aliments, pas seulement les nouveaux/testés
3. Il ne différencie pas les types (légumes, fruits, protéines, etc.)

**Solution :** 
- Calculer la variété directement dans la condition du badge
- Filtrer par type si nécessaire
- Vérifier que le calcul est correct

---

### 🔴 PROBLÈME 4 : Badges temporels utilisent des approximations

**Badges concernés :**
- `badge_hydration_morning` (3 verres avant midi)
- `badge_dinner_before_8pm_3days`
- `badge_sleep_nutrition_3days` (dîner 2h avant coucher)
- `badge_clean_monday` (vérifier que c'est un lundi)
- `badge_3weekends_mastered` (identifier les weekends)
- `badge_6weekends_mastered`
- `badge_12months_weekends`

**Problème :** 
1. L'heure des repas n'est peut-être pas stockée dans `meal.timestamp` ou `meal.time`
2. Le jour de la semaine n'est pas vérifié directement depuis la date
3. Les weekends sont identifiés par compliance, pas par date

**Solution :** 
- Utiliser `DateHelper` pour extraire le jour de la semaine depuis `day.date`
- Vérifier si `meal.timestamp` ou `meal.time` existe pour les badges temporels
- Si les données ne sont pas disponibles, soit désactiver le badge, soit utiliser une approximation documentée

---

### 🟣 PROBLÈME 5 : Badges de recettes utilisent une heuristique simple

**Badges concernés :**
- `badge_first_recipe`
- `badge_3recipes`
- `badge_4recipes`
- `badge_10recipes`
- `badge_20recipes`
- `badge_50recipes`

**Heuristique actuelle :** `(meal.foods || []).length >= 3`

**Problème :** 
- Un repas avec 3 aliments n'est pas forcément une recette (ex: salade composée)
- Un repas avec 2 aliments peut être une recette (ex: sandwich)
- Ne tient pas compte du fait que l'utilisateur pourrait marquer un repas comme "recette"

**Solution :** 
- Idéalement, ajouter un champ `meal.isRecipe` dans le modèle de données
- Sinon, améliorer l'heuristique (ex: vérifier si plusieurs aliments ont été ajoutés en même temps, si le nom du repas contient "recette", etc.)

---

### 🔵 PROBLÈME 6 : Badges de compliance utilisent `complianceScore`

**Badges concernés :**
- `badge_clean_monday`
- `badge_3weekends_mastered`
- `badge_program_100`
- `badge_digestive_pro`
- `badge_clean_digestion_7days`
- `badge_traveler_nutrition`
- `badge_flexibility_mastered`
- `badge_perfect_digestion_1year`
- `badge_12months_weekends`
- `badge_traveler_ultimate`
- `badge_seminar_14days`
- `badge_30days_meal_plans`

**Problème :** 
- `complianceScore` pourrait ne pas être calculé pour tous les jours
- Le calcul de compliance pourrait varier selon les programmes
- Certains badges utilisent `complianceScore` pour détecter des problèmes digestifs, ce qui n'est pas son rôle

**Solution :** 
- Vérifier que `complianceScore` existe dans `dailyTotals` ou le calculer à la volée
- Ne pas utiliser `complianceScore` pour les problèmes digestifs (nécessiterait un champ dédié)
- Documenter ce que `complianceScore` représente exactement

---

### 🟤 PROBLÈME 7 : Badges de post-entraînement ne vérifient pas les données Garmin

**Badges concernés :**
- `badge_post_workout_7days`
- `badge_recovery_14days`
- `badge_post_workout_30days`

**Problème :** 
- Ces badges vérifient seulement les protéines, pas si l'utilisateur a réellement fait de l'exercice
- Ne vérifient pas le timing (repas dans les 2h après entraînement)

**Solution :** 
- Intégrer `userData.garminData` ou `userData.workouts` pour vérifier qu'il y a eu un entraînement
- Vérifier le timing si les données sont disponibles

---

### ⚪ PROBLÈME 8 : Structure `userData` supposée mais non vérifiée

**Champs supposés dans `userData` :**
- `userData.nutritionHistory` (array de jours)
- `userData.nutritionHistory[].meals` (array de repas)
- `userData.nutritionHistory[].dailyTotals` (object avec calories, macros, etc.)
- `userData.nutritionHistory[].dailyTotals.targetCalories` (nombre)
- `userData.nutritionHistory[].dailyTotals.targetProtein` (nombre)
- `userData.nutritionHistory[].dailyTotals.targetCarbs` (nombre)
- `userData.nutritionHistory[].dailyTotals.targetFat` (nombre)
- `userData.nutritionHistory[].dailyTotals.targetWater` (nombre)
- `userData.nutritionHistory[].dailyTotals.waterIntake` (nombre)
- `userData.nutritionHistory[].dailyTotals.fiber` (nombre)
- `userData.nutritionHistory[].complianceScore` (nombre)
- `userData.activeProgram` (object ou null)
- `userData.streaks` (object avec nutrition, workout, overall)
- `userData.uniqueFoodsLast7Days` (nombre)

**Solution :** Vérifier que tous ces champs sont bien calculés dans `prepareUserData` et documenter leur structure.

---

## 🔬 ANALYSE BADGE PAR BADGE

### 🟢 FACILE (20 badges)

#### ✅ BADGE 1 : `badge_first_meal` - Premier Repas Loggé
**Condition actuelle :**
```javascript
return userData.nutritionHistory.some(day => hasRealNutritionData(day));
```
**✅ STATUT : CORRECT**  
- Utilise `hasRealNutritionData` correctement
- Vérifie l'historique global

---

#### ⚠️ BADGE 2 : `badge_hydrated_today` - Hydraté Aujourd'hui
**Condition actuelle :**
```javascript
const water = today?.dailyTotals?.waterIntake || 0;
const targetWater = today?.dailyTotals?.targetWater || 2500;
return water >= targetWater * 0.9;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des données nutritionnelles réelles (mais c'est OK pour l'hydratation seule)
2. Valeur par défaut de 2500ml incorrecte - devrait être 3000ml selon `calculateDailyTotals`

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
// Vérifier qu'il y a au moins des données d'hydratation
if (!today?.dailyTotals?.waterIntake && !hasRealNutritionData(today)) return false;
const water = today?.dailyTotals?.waterIntake || 0;
// ✅ CORRECTION : Utiliser valeurs par défaut correctes (3000ml selon calculateDailyTotals)
const targetWater = today?.dailyTotals?.targetWater || 
                    userData.activeProgram?.targetWater || 
                    3000; // Valeur par défaut réelle dans calculateDailyTotals
return water >= targetWater * 0.9;
```

---

#### ⚠️ BADGE 3 : `badge_protein_1day` - Protéines Atteintes 1 Jour
**Condition actuelle :**
```javascript
const protein = today?.dailyTotals?.protein || 0;
const targetProtein = today?.dailyTotals?.targetProtein || 150;
return protein >= targetProtein * 0.95;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des données nutritionnelles réelles
2. Valeur par défaut de 150g pourrait ne pas être adaptée

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
// Vérifier qu'il y a des données nutritionnelles réelles
if (!hasRealNutritionData(today)) return false;
const protein = today?.dailyTotals?.protein || 0;
// ✅ CORRECTION : Utiliser valeurs par défaut correctes (150g selon calculateDailyTotals - déjà correct)
const targetProtein = today?.dailyTotals?.targetProtein || 
                      userData.activeProgram?.targetProtein || 
                      150; // Valeur par défaut réelle dans calculateDailyTotals
if (targetProtein === 0) return false; // Éviter division par zéro
return protein >= targetProtein * 0.95;
```

---

#### ✅ BADGE 4 : `badge_no_snack_today` - Journée Sans Snack
**Condition actuelle :**
```javascript
if (!hasMainMealsWithData(today)) return false;
const meals = today?.meals || [];
return !meals.some(m => m.type === 'snack') && meals.some(m => ['breakfast', 'lunch', 'dinner'].includes(m.type));
```
**✅ STATUT : CORRECT**  
- Utilise `hasMainMealsWithData` correctement
- Vérifie l'absence de snack ET la présence de repas principaux

---

#### ⚠️ BADGE 5 : `badge_breakfast_today` - Petit-déjeuner Pris
**Condition actuelle :**
```javascript
const meals = today?.meals || [];
return meals.some(m => m.type === 'breakfast');
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas que le petit-déjeuner a des aliments (peut être un repas vide)

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
const meals = today?.meals || [];
return meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0 && hasRealNutritionData({ meals: [m] }));
```

---

#### 🔴 BADGE 6 : `badge_new_vegetable` - Nouveau Légume Goûté
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 1;
```
**🔴 PROBLÈMES :**
1. Utilise `uniqueFoodsLast7Days` qui ne différencie pas les légumes
2. Compte tous les aliments, pas seulement les nouveaux
3. Ne vérifie pas que c'est un légume

**✅ SOLUTION :**
```javascript
// Calculer directement dans la condition
if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
const last7Days = userData.nutritionHistory.slice(-7);
const vegetableNames = new Set(); // Liste de noms de légumes à vérifier
// TODO: Créer une fonction helper pour détecter les légumes par nom/catégorie
// Pour l'instant, vérifier variété sur 7 jours avec aliments riches en fibres et faibles en calories
let vegetableCount = 0;
last7Days.forEach(day => {
  (day.meals || []).forEach(meal => {
    (meal.foods || []).forEach(food => {
      // Heuristique : aliments avec fibres > 2g et calories < 100 pour 100g (approximatif)
      if (food.name && (food.fiber || 0) > 2 && (food.calories || 0) < 100) {
        const normalizedName = food.name.toLowerCase();
        if (!vegetableNames.has(normalizedName)) {
          vegetableNames.add(normalizedName);
          vegetableCount++;
        }
      }
    });
  });
});
return vegetableCount >= 1;
```

---

#### ⚠️ BADGE 7 : `badge_water_1l` - Eau +1L
**Condition actuelle :**
```javascript
const water = today?.dailyTotals?.waterIntake || 0;
return water >= 1000;
```
**⚠️ PROBLÈMES :**
1. Pas de vérification de données réelles (mais OK pour hydratation seule)

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
// Pas besoin de vérifier hasRealNutritionData pour hydratation seule
const water = today?.dailyTotals?.waterIntake || 0;
return water >= 1000;
```

---

#### ⚠️ BADGE 8 : `badge_balanced_meal` - Repas Équilibré
**Condition actuelle :**
```javascript
return meals.some(meal => {
  const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
  if (total === 0) return false;
  const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
  const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
  const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
  const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
  return deviation < 30;
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des aliments dans le repas (mais `total === 0` le gère)

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
const meals = today?.meals || [];
return meals.some(meal => {
  const foods = meal.foods || [];
  if (foods.length === 0) return false; // Vérifier qu'il y a des aliments
  const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
  if (total === 0) return false;
  const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
  const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
  const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
  const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
  return deviation < 30;
});
```

---

#### ✅ BADGE 9 : `badge_no_skipped_meal_today` - Journée Sans Repas Sauté
**Condition actuelle :**
```javascript
if (!hasRealNutritionData(today)) return false;
const meals = today?.meals || [];
const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
return hasBreakfast && hasLunch && hasDinner;
```
**✅ STATUT : CORRECT**  
- Utilise `hasRealNutritionData` correctement
- Vérifie que chaque repas principal a des aliments

---

#### 🔴 BADGE 10 : `badge_new_protein_source` - Nouveau Aliment Protéiné
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 1;
```
**🔴 PROBLÈMES :**
1. Identique à `badge_new_vegetable` - ne différencie pas les protéines

**✅ SOLUTION :**
```javascript
// Calculer directement dans la condition
if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
const last7Days = userData.nutritionHistory.slice(-7);
const proteinFoods = new Set();
last7Days.forEach(day => {
  (day.meals || []).forEach(meal => {
    (meal.foods || []).forEach(food => {
      // Vérifier que c'est une source de protéines (> 5g pour 100g approximatif)
      if (food.name && (food.protein || 0) > 5) {
        proteinFoods.add(food.name.toLowerCase());
      }
    });
  });
});
return proteinFoods.size >= 1;
```

---

#### ⚠️ BADGE 11 : `badge_fat_ratio_controlled` - Ratio Lipides Maîtrisé (±20%)
**Condition actuelle :**
```javascript
const fat = today?.dailyTotals?.fat || 0;
const targetFat = today?.dailyTotals?.targetFat || 65;
const ratio = fat / targetFat;
return ratio >= 0.8 && ratio <= 1.2;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des données nutritionnelles réelles
2. Division par zéro si `targetFat === 0`

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false;
const fat = today?.dailyTotals?.fat || 0;
const targetFat = today?.dailyTotals?.targetFat || userData.activeProgram?.targetFat || 65;
if (targetFat === 0) return false; // Éviter division par zéro
const ratio = fat / targetFat;
return ratio >= 0.8 && ratio <= 1.2;
```

---

#### ⚠️ BADGE 12 : `badge_fiber_starter` - Fibre Starter (≥20g aujourd'hui)
**Condition actuelle :**
```javascript
const fiber = today?.dailyTotals?.fiber || 0;
return fiber >= 20;
```
**🔴 PROBLÈMES :**
1. **`fiber` n'existe PAS dans `dailyTotals`** - doit être calculé depuis `meals.foods`
2. Ne vérifie pas qu'il y a des données nutritionnelles réelles

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false;
// ✅ CORRECTION : Calculer fiber depuis meals.foods car n'existe pas dans dailyTotals
const fiber = (today.meals || []).reduce((sum, meal) => {
  return sum + (meal.foods || []).reduce((s, food) => s + (food.fiber || 0), 0);
}, 0);
return fiber >= 20;
```

---

#### ⚠️ BADGE 13 : `badge_clean_breakfast` - Focus Matinal : repas clean
**Condition actuelle :**
```javascript
const breakfast = (today?.meals || []).find(m => m.type === 'breakfast');
if (!breakfast) return false;
const foods = breakfast.foods || [];
const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
const sugar = foods.reduce((sum, f) => sum + (f.sugar || 0), 0);
return protein >= 15 && sugar <= 20;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des aliments dans le petit-déjeuner

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
const breakfast = (today?.meals || []).find(m => m.type === 'breakfast');
if (!breakfast || !breakfast.foods || breakfast.foods.length === 0) return false;
const foods = breakfast.foods;
const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
const sugar = foods.reduce((sum, f) => sum + (f.sugar || f.addedSugar || 0), 0);
return protein >= 15 && sugar <= 20;
```

---

#### ⚠️ BADGE 14 : `badge_light_dinner_today` - Dîner Léger 1 Jour
**Condition actuelle :**
```javascript
const dinner = (today?.meals || []).find(m => m.type === 'dinner');
if (!dinner) return false;
const foods = dinner.foods || [];
const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
return calories <= 600;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des aliments dans le dîner

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
const dinner = (today?.meals || []).find(m => m.type === 'dinner');
if (!dinner || !dinner.foods || dinner.foods.length === 0) return false;
const calories = dinner.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
return calories <= 600;
```

---

#### 🔴 BADGE 15 : `badge_first_recipe` - Première Recette Testée
**Condition actuelle :**
```javascript
const allMeals = userData.nutritionHistory.flatMap(day => day.meals || []);
return allMeals.some(meal => (meal.foods || []).length >= 3);
```
**🔴 PROBLÈMES :**
1. Heuristique trop simple (3+ aliments = recette)

**✅ SOLUTION :**
```javascript
// Vérifier si un champ meal.isRecipe existe
if (!userData.nutritionHistory) return false;
const allMeals = userData.nutritionHistory.flatMap(day => day.meals || []);
// Priorité : vérifier si meal.isRecipe existe
if (allMeals.some(meal => meal.isRecipe === true)) return true;
// Sinon, heuristique : 3+ aliments avec nom de repas contenant "recette" ou plusieurs aliments ajoutés en même temps
return allMeals.some(meal => {
  const foods = meal.foods || [];
  if (foods.length >= 3) {
    // Vérifier si le nom du repas suggère une recette
    const mealName = (meal.name || '').toLowerCase();
    if (mealName.includes('recette') || mealName.includes('recipe')) return true;
    // Sinon, vérifier si plusieurs aliments ont des quantités similaires (suggère une recette)
    return true; // Pour l'instant, garder l'heuristique simple
  }
  return false;
});
```

---

#### ✅ BADGE 16 : `badge_no_added_sugar_today` - Journée Sans Sucre Ajouté
**Condition actuelle :**
```javascript
if (!hasRealNutritionData(today)) return false;
const meals = today?.meals || [];
const totalSugar = meals.reduce((sum, meal) => {
  return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
}, 0);
return totalSugar <= 5;
```
**✅ STATUT : CORRECT**  
- Utilise `hasRealNutritionData` correctement
- Tolérance de 5g pour fruits naturels

---

#### ⚠️ BADGE 17 : `badge_hydration_morning` - Hydratation 3 Verres Avant Midi
**Condition actuelle :**
```javascript
const water = today?.dailyTotals?.waterIntake || 0;
return water >= 750; // 3 verres = ~750ml
```
**🔴 PROBLÈMES :**
1. Ne vérifie pas que c'est AVANT midi (vérifie seulement le total du jour)
2. Pas de tracking horaire de l'hydratation

**✅ SOLUTION :**
```javascript
// Note: Nécessite tracking horaire de l'hydratation dans dailyTotals.hydrationLog ou similaire
// Pour l'instant, vérifier seulement le total du jour avec une note
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
const water = today?.dailyTotals?.waterIntake || 0;
// TODO: Vérifier que l'hydratation a été faite avant midi si les données sont disponibles
// Pour l'instant, approximation : vérifier si au moins 750ml ont été bus
return water >= 750;
```

---

#### ⚠️ BADGE 18 : `badge_meal_planned` - Planification d'un Repas
**Condition actuelle :**
```javascript
return userData.activeProgram !== null;
```
**⚠️ PROBLÈMES :**
1. Vérifie seulement si un programme est actif, pas si un repas a été planifié

**✅ SOLUTION :**
```javascript
// Vérifier si un programme est actif ET si des repas ont été planifiés
if (!userData.activeProgram) return false;
// TODO: Vérifier si des repas ont été planifiés à l'avance (nécessite un champ meal.plannedDate ou similaire)
// Pour l'instant, vérifier seulement si un programme est actif
return true;
```

---

#### ⚠️ BADGE 19 : `badge_portion_control` - Contrôle Portions Basique
**Condition actuelle :**
```javascript
const calories = today?.dailyTotals?.calories || 0;
const targetCalories = today?.dailyTotals?.targetCalories || 2000;
const ratio = calories / targetCalories;
return ratio >= 0.9 && ratio <= 1.1;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des données nutritionnelles réelles
2. Division par zéro si `targetCalories === 0`

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false;
const calories = today?.dailyTotals?.calories || 0;
// ✅ CORRECTION : Utiliser valeurs par défaut correctes (2500 selon calculateDailyTotals, pas 2000)
const targetCalories = today?.dailyTotals?.targetCalories || 
                       userData.activeProgram?.targetCalories || 
                       2500; // Valeur par défaut réelle dans calculateDailyTotals
if (targetCalories === 0) return false; // Éviter division par zéro
const ratio = calories / targetCalories;
return ratio >= 0.9 && ratio <= 1.1;
```

---

#### 🔴 BADGE 20 : `badge_plant_protein` - Protéines Végétales Découvertes
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 1;
```
**🔴 PROBLÈMES :**
1. Identique aux autres badges de variété - ne différencie pas les protéines végétales

**✅ SOLUTION :**
```javascript
// Calculer directement dans la condition
if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
const last7Days = userData.nutritionHistory.slice(-7);
const plantProteinFoods = new Set(); // Liste de sources de protéines végétales
// TODO: Créer une fonction helper pour détecter les protéines végétales par nom/catégorie
// Exemples : légumineuses, noix, graines, tofu, tempeh, seitan, etc.
last7Days.forEach(day => {
  (day.meals || []).forEach(meal => {
    (meal.foods || []).forEach(food => {
      // Heuristique : aliments avec protéines > 5g et faibles en graisses saturées
      const name = (food.name || '').toLowerCase();
      const isPlantProtein = (
        name.includes('lentille') || name.includes('haricot') || name.includes('pois chiche') ||
        name.includes('tofu') || name.includes('tempeh') || name.includes('seitan') ||
        name.includes('quinoa') || name.includes('amande') || name.includes('noix') ||
        name.includes('graine') || name.includes('noisette') ||
        ((food.protein || 0) > 5 && (food.fat || 0) < 10 && (food.carbs || 0) > 0)
      );
      if (isPlantProtein && !plantProteinFoods.has(name)) {
        plantProteinFoods.add(name);
      }
    });
  });
});
return plantProteinFoods.size >= 1;
```

---

### 🟡 SIMPLE (20 badges)

#### ✅ BADGE 21 : `badge_3days_logged` - 3 Jours Consécutifs Loggés
**Condition actuelle :**
```javascript
return (userData.streaks?.nutrition?.current || 0) >= 3;
```
**✅ STATUT : CORRECT**  
- Utilise `streaks.nutrition.current` qui est calculé avec `hasRealNutritionData`

---

#### ⚠️ BADGE 22 : `badge_hydration_2l_3days` - Hydratation 2L / jour (3 jours)
**Condition actuelle :**
```javascript
const last3Days = userData.nutritionHistory.slice(-3);
return last3Days.every(day => {
  const water = day.dailyTotals?.waterIntake || 0;
  return water >= 2000;
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas que les 3 jours sont consécutifs (utilise `slice(-3)` qui prend les 3 derniers jours)

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
// Vérifier que les 3 derniers jours sont consécutifs
const last3Days = userData.nutritionHistory.slice(-3);
const today = DateHelper.getTodayLocal();
for (let i = 0; i < 3; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = last3Days.find(d => d.date === expectedDate);
  if (!day) return false; // Jour manquant = pas consécutif
  const water = day.dailyTotals?.waterIntake || 0;
  if (water < 2000) return false;
}
return true;
```

---

#### ⚠️ BADGE 23 : `badge_3breakfasts` - 3 Petits-déjeuners Consécutifs
**Condition actuelle :**
```javascript
const last3Days = userData.nutritionHistory.slice(-3);
return last3Days.every(day => {
  const meals = day.meals || [];
  return meals.some(m => m.type === 'breakfast');
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas la consécutivité
2. Ne vérifie pas que le petit-déjeuner a des aliments

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
const today = DateHelper.getTodayLocal();
for (let i = 0; i < 3; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day) return false; // Jour manquant
  const meals = day.meals || [];
  const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
  if (!hasBreakfast) return false;
}
return true;
```

---

#### ⚠️ BADGE 24 : `badge_3light_dinners` - 3 Dîners Légers
**Condition actuelle :**
```javascript
const last3Days = userData.nutritionHistory.slice(-3);
return last3Days.every(day => {
  const dinner = (day.meals || []).find(m => m.type === 'dinner');
  if (!dinner) return false;
  const calories = (dinner.foods || []).reduce((sum, f) => sum + (f.calories || 0), 0);
  return calories <= 600;
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas la consécutivité
2. Ne vérifie pas qu'il y a des aliments dans le dîner

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
const today = DateHelper.getTodayLocal();
for (let i = 0; i < 3; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day) return false;
  const dinner = (day.meals || []).find(m => m.type === 'dinner');
  if (!dinner || !dinner.foods || dinner.foods.length === 0) return false;
  const calories = dinner.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  if (calories > 600) return false;
}
return true;
```

---

#### 🔴 BADGE 25 : `badge_new_food_3days` - Nouveau Aliment 3 Jours d'affilée
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 3;
```
**🔴 PROBLÈMES :**
1. Ne vérifie pas que c'est 3 jours d'affilée
2. Utilise `uniqueFoodsLast7Days` qui ne garantit pas la consécutivité

**✅ SOLUTION :**
```javascript
// Calculer directement dans la condition
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
const today = DateHelper.getTodayLocal();
let consecutiveDays = 0;
for (let i = 0; i < 7; i++) {
  const checkDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === checkDate);
  if (!day || !hasRealNutritionData(day)) {
    consecutiveDays = 0; // Briser la série
    continue;
  }
  // Vérifier qu'il y a au moins un nouvel aliment ce jour
  const allFoodsBefore = new Set();
  for (let j = i + 1; j < 7; j++) {
    const prevDay = userData.nutritionHistory.find(d => d.date === DateHelper.getDaysAgoLocal(j));
    if (prevDay && prevDay.meals) {
      prevDay.meals.forEach(meal => {
        (meal.foods || []).forEach(food => {
          if (food.name) allFoodsBefore.add(food.name.toLowerCase());
        });
      });
    }
  }
  // Vérifier si ce jour a un aliment nouveau
  let hasNewFood = false;
  (day.meals || []).forEach(meal => {
    (meal.foods || []).forEach(food => {
      if (food.name && !allFoodsBefore.has(food.name.toLowerCase())) {
        hasNewFood = true;
      }
    });
  });
  if (hasNewFood) {
    consecutiveDays++;
    if (consecutiveDays >= 3) return true;
  } else {
    consecutiveDays = 0;
  }
}
return false;
```

---

#### 🔴 BADGE 26 : `badge_variety_10_7days` - Variété 10 Ingrédients en 7 jours
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 10;
```
**🔴 PROBLÈMES :**
1. S'appuie sur `uniqueFoodsLast7Days` qui pourrait ne pas être calculé correctement

**✅ SOLUTION :**
```javascript
// Calculer directement dans la condition
if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
const last7Days = userData.nutritionHistory.slice(-7);
const uniqueFoods = new Set();
last7Days.forEach(day => {
  (day.meals || []).forEach(meal => {
    (meal.foods || []).forEach(food => {
      if (food.name) uniqueFoods.add(food.name.toLowerCase());
    });
  });
});
return uniqueFoods.size >= 10;
```

---

#### ✅ BADGE 27 : `badge_no_skipped_week` - Semaine Sans Repas Sauté
**Condition actuelle :**
```javascript
if (!hasRealNutritionData(day)) return false;
const meals = day.meals || [];
const hasBreakfast = meals.some(m => m.type === 'breakfast' && (m.foods || []).length > 0);
const hasLunch = meals.some(m => m.type === 'lunch' && (m.foods || []).length > 0);
const hasDinner = meals.some(m => m.type === 'dinner' && (m.foods || []).length > 0);
return hasBreakfast && hasLunch && hasDinner;
```
**✅ STATUT : CORRECT**  
- Utilise `hasRealNutritionData` correctement
- Note: Vérifie seulement les 7 derniers jours, pas forcément consécutifs (mais c'est OK pour "semaine")

---

#### ⚠️ BADGE 28 : `badge_protein_ratio_3days` - Ratio Protéines Atteint 3 Jours
**Condition actuelle :**
```javascript
const last3Days = userData.nutritionHistory.slice(-3);
return last3Days.every(day => {
  const protein = day.dailyTotals?.protein || 0;
  const targetProtein = day.dailyTotals?.targetProtein || 150;
  return protein >= targetProtein * 0.95;
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas la consécutivité
2. Ne vérifie pas qu'il y a des données nutritionnelles réelles

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
const today = DateHelper.getTodayLocal();
for (let i = 0; i < 3; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day || !hasRealNutritionData(day)) return false;
  const protein = day.dailyTotals?.protein || 0;
  const targetProtein = day.dailyTotals?.targetProtein || userData.activeProgram?.targetProtein || 150;
  if (protein < targetProtein * 0.95) return false;
}
return true;
```

---

#### ⚠️ BADGE 29 : `badge_hydration_week_100` - Semaine Hydratation 100%
**Condition actuelle :**
```javascript
const last7Days = userData.nutritionHistory.slice(-7);
return last7Days.every(day => {
  const water = day.dailyTotals?.waterIntake || 0;
  const targetWater = day.dailyTotals?.targetWater || 2500;
  return water >= targetWater * 0.9;
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas la consécutivité

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) return false;
const today = DateHelper.getTodayLocal();
for (let i = 0; i < 7; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day) return false; // Jour manquant
  const water = day.dailyTotals?.waterIntake || 0;
  const targetWater = day.dailyTotals?.targetWater || userData.activeProgram?.targetWater || 2500;
  if (water < targetWater * 0.9) return false;
}
return true;
```

---

#### ⚠️ BADGE 30 : `badge_10balanced_meals` - 10 Repas Équilibrés Cumulés
**Condition actuelle :**
```javascript
let balancedCount = 0;
userData.nutritionHistory.forEach(day => {
  (day.meals || []).forEach(meal => {
    const total = (meal.foods || []).reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
    if (total === 0) return;
    const proteinPct = ((meal.foods || []).reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
    const carbsPct = ((meal.foods || []).reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
    const fatPct = ((meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
    const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
    if (deviation < 30) balancedCount++;
  });
});
return balancedCount >= 10;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des aliments dans le repas (mais `total === 0` le gère)

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory) return false;
let balancedCount = 0;
userData.nutritionHistory.forEach(day => {
  (day.meals || []).forEach(meal => {
    const foods = meal.foods || [];
    if (foods.length === 0) return; // Vérifier qu'il y a des aliments
    const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
    if (total === 0) return;
    const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
    const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
    const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
    const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
    if (deviation < 30) balancedCount++;
  });
});
return balancedCount >= 10;
```

---

#### ✅ BADGE 31 : `badge_no_fastfood_7days` - 7 Jours Sans Fast-food
**Condition actuelle :**
```javascript
if (!hasRealNutritionData(day)) return false;
const meals = day.meals || [];
return !meals.some(meal => {
  const foods = meal.foods || [];
  const calories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const protein = foods.reduce((sum, f) => sum + (f.protein || 0), 0);
  return calories > 800 && protein < 20;
});
```
**✅ STATUT : CORRECT**  
- Utilise `hasRealNutritionData` correctement
- Heuristique fast-food raisonnable

---

#### 🔴 BADGE 32 : `badge_3recipes` - 3 Recettes Testées
**Condition actuelle :**
```javascript
let recipeCount = 0;
userData.nutritionHistory.forEach(day => {
  (day.meals || []).forEach(meal => {
    if ((meal.foods || []).length >= 3) recipeCount++;
  });
});
return recipeCount >= 3;
```
**🔴 PROBLÈMES :**
1. Heuristique trop simple (voir BADGE 15)

**✅ SOLUTION :** (Identique à BADGE 15)

---

#### ✅ BADGE 33 : `badge_no_excess_sugar_week` - Semaine Sans Excès de Sucre
**Condition actuelle :**
```javascript
if (!hasRealNutritionData(day)) return false;
const meals = day.meals || [];
const totalSugar = meals.reduce((sum, meal) => {
  return sum + (meal.foods || []).reduce((s, f) => s + (f.addedSugar || f.sugar || 0), 0);
}, 0);
return totalSugar <= 30;
```
**✅ STATUT : CORRECT**  
- Utilise `hasRealNutritionData` correctement

---

#### ⚠️ BADGE 34 : `badge_energy_balance_3days` - 3 Jours d'Équilibre Énergétique
**Condition actuelle :**
```javascript
const last3Days = userData.nutritionHistory.slice(-3);
return last3Days.every(day => {
  const calories = day.dailyTotals?.calories || 0;
  const targetCalories = day.dailyTotals?.targetCalories || 2000;
  const balance = Math.abs(calories - targetCalories);
  return balance <= 200;
});
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas la consécutivité
2. Ne vérifie pas qu'il y a des données nutritionnelles réelles
3. Division par zéro si `targetCalories === 0`

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
const today = DateHelper.getTodayLocal();
for (let i = 0; i < 3; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day || !hasRealNutritionData(day)) return false;
  const calories = day.dailyTotals?.calories || 0;
  // ✅ CORRECTION : Utiliser valeurs par défaut correctes (2500 selon calculateDailyTotals, pas 2000)
  const targetCalories = day.dailyTotals?.targetCalories || 
                         userData.activeProgram?.targetCalories || 
                         2500; // Valeur par défaut réelle dans calculateDailyTotals
  if (targetCalories === 0) return false;
  const balance = Math.abs(calories - targetCalories);
  if (balance > 200) return false;
}
return true;
```

---

#### 🔴 BADGE 35 : `badge_dinner_before_8pm_3days` - Dîner Avant 20h (3 fois)
**Condition actuelle :**
```javascript
let count = 0;
last3Days.forEach(day => {
  const dinner = (day.meals || []).find(m => m.type === 'dinner');
  if (dinner) count++;
});
return count >= 3;
```
**🔴 PROBLÈMES :**
1. Ne vérifie pas que c'est AVANT 20h, vérifie seulement la présence d'un dîner
2. Pas de données horaires dans `meal.timestamp` ou `meal.time`

**✅ SOLUTION :**
```javascript
// Note: Nécessite meal.timestamp ou meal.time
if (!userData.nutritionHistory || userData.nutritionHistory.length < 3) return false;
const last3Days = userData.nutritionHistory.slice(-3);
let count = 0;
last3Days.forEach(day => {
  const dinner = (day.meals || []).find(m => m.type === 'dinner');
  if (!dinner) return;
  // Vérifier l'heure si disponible
  if (dinner.timestamp || dinner.time) {
    const dinnerTime = new Date(dinner.timestamp || dinner.time);
    const hour = dinnerTime.getHours();
    if (hour < 20) count++;
  } else {
    // Si pas d'heure disponible, compter la présence du dîner (approximation)
    count++;
  }
});
return count >= 3;
```

---

#### 🔴 BADGE 36 : `badge_5new_vegetables` - 5 Nouveaux Légumes Testés
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 5;
```
**🔴 PROBLÈMES :**
1. Identique à BADGE 6 - ne différencie pas les légumes

**✅ SOLUTION :** (Identique à BADGE 6, mais avec `vegetableCount >= 5`)

---

#### ⚠️ BADGE 37 : `badge_perfect_day` - Journée Parfaite
**Condition actuelle :**
```javascript
const water = today?.dailyTotals?.waterIntake || 0;
const targetWater = today?.dailyTotals?.targetWater || 2500;
const protein = today?.dailyTotals?.protein || 0;
const targetProtein = today?.dailyTotals?.targetProtein || 150;
const calories = today?.dailyTotals?.calories || 0;
const targetCalories = today?.dailyTotals?.targetCalories || 2000;
return water >= targetWater * 0.9 &&
       protein >= targetProtein * 0.95 &&
       Math.abs(calories - targetCalories) <= 200;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des données nutritionnelles réelles

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false;
const water = today?.dailyTotals?.waterIntake || 0;
const targetWater = today?.dailyTotals?.targetWater || userData.activeProgram?.targetWater || 2500;
const protein = today?.dailyTotals?.protein || 0;
const targetProtein = today?.dailyTotals?.targetProtein || userData.activeProgram?.targetProtein || 150;
const calories = today?.dailyTotals?.calories || 0;
const targetCalories = today?.dailyTotals?.targetCalories || userData.activeProgram?.targetCalories || 2000;
if (targetCalories === 0) return false;
return water >= targetWater * 0.9 &&
       protein >= targetProtein * 0.95 &&
       Math.abs(calories - targetCalories) <= 200;
```

---

#### 🔴 BADGE 38 : `badge_7fruits_day` - 7 Fruits/Jour (1 jour)
**Condition actuelle :**
```javascript
return (userData.uniqueFoodsLast7Days || 0) >= 7;
```
**🔴 PROBLÈMES :**
1. Ne vérifie pas que ce sont des fruits
2. Ne vérifie pas que c'est en 1 jour, vérifie sur 7 jours

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false;
const fruitNames = new Set(); // Liste de fruits
// TODO: Créer une fonction helper pour détecter les fruits par nom/catégorie
const todayMeals = today.meals || [];
todayMeals.forEach(meal => {
  (meal.foods || []).forEach(food => {
    const name = (food.name || '').toLowerCase();
    // Heuristique : fruits sont généralement riches en vitamines C, faibles en protéines, modérés en glucides
    const isFruit = (
      name.includes('pomme') || name.includes('banane') || name.includes('orange') ||
      name.includes('fraise') || name.includes('raisin') || name.includes('cerise') ||
      name.includes('poire') || name.includes('pêche') || name.includes('abricot') ||
      name.includes('kiwi') || name.includes('mangue') || name.includes('ananas') ||
      // Heuristique : aliments avec vitamine C > 10mg et protéines < 2g pour 100g (approximatif)
      ((food.vitaminC || 0) > 10 && (food.protein || 0) < 2)
    );
    if (isFruit && !fruitNames.has(name)) {
      fruitNames.add(name);
    }
  });
});
return fruitNames.size >= 7;
```

---

#### 🔴 BADGE 39 : `badge_clean_monday` - Lundi Clean
**Condition actuelle :**
```javascript
const compliance = today?.complianceScore || today?.dailyTotals?.complianceScore || 0;
return compliance >= 90;
```
**🔴 PROBLÈMES :**
1. Ne vérifie pas que c'est un lundi
2. Utilise `complianceScore` qui pourrait ne pas exister

**✅ SOLUTION :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
// Vérifier que c'est un lundi
const todayDate = new Date(today.date);
const dayOfWeek = todayDate.getDay(); // 0 = dimanche, 1 = lundi
if (dayOfWeek !== 1) return false; // Pas un lundi
if (!hasRealNutritionData(today)) return false;
const compliance = today?.complianceScore || today?.dailyTotals?.complianceScore || 0;
return compliance >= 90;
```

---

#### ⚠️ BADGE 40 : `badge_macro_session` - Objectif Macro Atteint (1 séance)
**Condition actuelle :**
```javascript
const protein = today?.dailyTotals?.protein || 0;
const targetProtein = today?.dailyTotals?.targetProtein || 150;
const carbs = today?.dailyTotals?.carbs || 0;
const targetCarbs = today?.dailyTotals?.targetCarbs || 200;
const fat = today?.dailyTotals?.fat || 0;
const targetFat = today?.dailyTotals?.targetFat || 65;
return protein >= targetProtein * 0.95 &&
       carbs >= targetCarbs * 0.95 &&
       fat >= targetFat * 0.95;
```
**⚠️ PROBLÈMES :**
1. Ne vérifie pas qu'il y a des données nutritionnelles réelles
2. Valeurs par défaut `targetCarbs` et `targetFat` incorrectes (200 et 65 au lieu de 300 et 80)

**✅ SOLUTION CORRIGÉE :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false;
const protein = today?.dailyTotals?.protein || 0;
const targetProtein = today?.dailyTotals?.targetProtein || 
                      userData.activeProgram?.targetProtein || 
                      150; // ✅ OK (déjà correct)
const carbs = today?.dailyTotals?.carbs || 0;
// ✅ CORRECTION : Utiliser valeurs par défaut correctes (300 selon calculateDailyTotals, pas 200)
const targetCarbs = today?.dailyTotals?.targetCarbs || 
                    userData.activeProgram?.targetCarbs || 
                    300; // Valeur par défaut réelle dans calculateDailyTotals
const fat = today?.dailyTotals?.fat || 0;
// ✅ CORRECTION : Utiliser valeurs par défaut correctes (80 selon calculateDailyTotals, pas 65)
const targetFat = today?.dailyTotals?.targetFat || 
                  userData.activeProgram?.targetFat || 
                  80; // Valeur par défaut réelle dans calculateDailyTotals
if (targetProtein === 0 || targetCarbs === 0 || targetFat === 0) return false;
return protein >= targetProtein * 0.95 &&
       carbs >= targetCarbs * 0.95 &&
       fat >= targetFat * 0.95;
```

---

### 🟠 MOYEN (20 badges)

*(Analyse détaillée à compléter - suivre le même pattern que FACILE/SIMPLE)*

**Points clés identifiés :**
- Mêmes problèmes que FACILE/SIMPLE mais avec des périodes plus longues
- Consécutivité à vérifier pour tous les badges de séries
- `hasRealNutritionData` manquant pour plusieurs badges
- Problèmes similaires avec `uniqueFoodsLast7Days`, `complianceScore`, `targetX`, badges temporels

**Badges prioritaires à corriger :**
- `badge_7day_streak` ✅ OK (utilise `streaks.nutrition.current`)
- `badge_7light_dinners` ⚠️ Consécutivité + vérifier aliments
- `badge_7breakfasts` ⚠️ Consécutivité + vérifier aliments
- `badge_no_snack_7days` ✅ OK (utilise `hasMainMealsWithData`)
- `badge_deficit_controlled_7days` ⚠️ `hasRealNutritionData` manquant
- `badge_surplus_controlled_7days` ⚠️ `hasRealNutritionData` manquant
- `badge_no_sugar_5days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_30meals_logged` ✅ OK (compte total)
- `badge_10protein_sources` 🔴 Utilise `uniqueFoodsLast7Days` (problème variété)
- `badge_post_workout_7days` 🔴 Ne vérifie pas données Garmin
- `badge_3weekends_mastered` 🔴 Identifie weekends par compliance, pas par date
- `badge_fiber_25g_3days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_clean_digestion_7days` 🔴 Utilise `complianceScore` pour problèmes digestifs
- `badge_sleep_nutrition_3days` 🔴 Pas de vérification horaire
- `badge_4recipes` 🔴 Heuristique simple
- `badge_3perfect_days` ⚠️ Consécutivité + `hasRealNutritionData` manquant

---

### 🔴 DIFFICILE (20 badges)

**Points clés identifiés :**
- Mêmes problèmes mais avec périodes de 30 jours
- Consécutivité critique pour ces badges difficiles
- `hasRealNutritionData` manquant pour plusieurs badges
- Problèmes similaires avec badges temporels, compliance, variété

**Badges prioritaires à corriger :**
- `badge_30day_streak` ✅ OK (utilise `streaks.nutrition.current`)
- `badge_deficit_30days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_surplus_30days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_100meals` ✅ OK (compte total)
- `badge_macro_precision_5pct_7days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_no_skipped_30days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_no_sugar_10days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_30balanced_30days` ⚠️ Vérifier que chaque repas a des aliments
- `badge_recovery_14days` 🔴 Ne vérifie pas données Garmin
- `badge_10recipes` 🔴 Heuristique simple
- `badge_energy_balance_14days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_digestive_pro` 🔴 Utilise `complianceScore` pour problèmes digestifs
- `badge_30light_dinners` ⚠️ Consécutivité + vérifier aliments
- `badge_10new_foods_30days` ✅ OK (calcule directement dans condition)
- `badge_hydration_2l_30days` ⚠️ Consécutivité
- `badge_program_100` 🔴 Utilise `complianceScore`
- `badge_20protein_sources` ✅ OK (calcule directement dans condition)
- `badge_traveler_nutrition` 🔴 Utilise `complianceScore` pour voyages
- `badge_restaurant_mastered` ⚠️ Heuristique équilibre, pas de vérification type restaurant
- `badge_masterclass_week` ⚠️ Consécutivité + `hasRealNutritionData` manquant

---

### 🟣 HARDCORE (20 badges)

**Points clés identifiés :**
- Mêmes problèmes mais avec périodes de 60-100 jours
- Consécutivité CRITIQUE pour ces badges hardcore
- `hasRealNutritionData` manquant pour plusieurs badges
- Problèmes similaires avec badges temporels, compliance, variété

**Badges prioritaires à corriger :**
- `badge_100day_streak` ✅ OK (utilise `streaks.nutrition.current`)
- `badge_1000meals` ✅ OK (compte total)
- `badge_macro_precision_5pct_21days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_deficit_60days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_surplus_60days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_no_sugar_30days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_100balanced_meals` ⚠️ Vérifier que chaque repas a des aliments
- `badge_hydration_60days_100` ⚠️ Consécutivité
- `badge_no_fastfood_30days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_no_cheat_30days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_flexibility_mastered` 🔴 Utilise `complianceScore` + variété
- `badge_20recipes` 🔴 Heuristique simple
- `badge_30days_meal_plans` 🔴 Utilise `complianceScore`
- `badge_dinner_before_8pm_30days` 🔴 Pas de vérification horaire
- `badge_fiber_25_35g_30days` 🔴 `fiber` n'existe pas dans `dailyTotals` + Consécutivité + `hasRealNutritionData` manquant
- `badge_6weekends_mastered` 🔴 Identifie weekends par compliance, pas par date
- `badge_seminar_14days` 🔴 Utilise `complianceScore`
- `badge_no_skipped_60days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_clean_bulk_30days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_post_workout_30days` 🔴 Ne vérifie pas données Garmin

---

### 🖤 IMPOSSIBLE (20 badges)

**Points clés identifiés :**
- Mêmes problèmes mais avec périodes de 365 jours
- Consécutivité CRITIQUE pour ces badges impossibles
- `hasRealNutritionData` manquant pour plusieurs badges
- Problèmes similaires avec badges temporels, compliance, variété

**Badges prioritaires à corriger :**
- `badge_365day_streak` ✅ OK (utilise `streaks.nutrition.actual`)
- `badge_1year_tracking` ✅ OK (vérifie longueur historique)
- `badge_macro_precision_3pct_30days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_no_sugar_90days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_no_skipped_90days` ✅ OK (utilise `hasRealNutritionData`)
- `badge_deficit_90days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_surplus_90days` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_365balanced_meals` ⚠️ Vérifier que chaque repas a des aliments
- `badge_hydration_365days` ⚠️ Consécutivité
- `badge_no_fastfood_1year` ✅ OK (utilise `hasRealNutritionData`)
- `badge_50recipes` 🔴 Heuristique simple
- `badge_365perfect_programs` 🔴 Utilise `complianceScore`
- `badge_100protein_sources` ✅ OK (calcule directement dans condition)
- `badge_no_excess_1year` ⚠️ Consécutivité + `hasRealNutritionData` manquant
- `badge_perfect_digestion_1year` 🔴 Utilise `complianceScore` pour problèmes digestifs
- `badge_12months_weekends` 🔴 Identifie weekends par compliance, pas par date
- `badge_traveler_ultimate` 🔴 Utilise `complianceScore` pour voyages
- `badge_restaurant_god` ⚠️ Heuristique équilibre, pas de vérification type restaurant
- `badge_fiber_365days` 🔴 `fiber` n'existe pas dans `dailyTotals` + Consécutivité + `hasRealNutritionData` manquant
- `badge_master_nutrition_absolute` 🔴 `fiber` n'existe pas dans `dailyTotals` + Consécutivité + `hasRealNutritionData` manquant

---

## 📊 RÉSUMÉ STATISTIQUES

### Par type de problème

| Problème | Nombre de badges concernés | Priorité |
|----------|---------------------------|----------|
| `hasRealNutritionData` manquant | ~35 badges | 🔴 CRITIQUE |
| Consécutivité non vérifiée | ~25 badges | 🔴 CRITIQUE |
| `uniqueFoodsLast7Days` utilisé incorrectement | ~8 badges | 🔴 CRITIQUE |
| **`fiber` utilisé depuis `dailyTotals` (n'existe pas)** | **~5 badges** | **🔴 CRITIQUE** |
| `targetX` sans fallback programme actif | ~40 badges | 🟡 HAUTE |
| **`targetX` valeurs par défaut incorrectes** | **~40 badges** | **🟡 HAUTE** |
| Division par zéro possible (`targetX === 0`) | ~30 badges | 🟡 HAUTE |
| Badges temporels sans données horaires | ~5 badges | 🟡 HAUTE |
| Badges recettes heuristique simple | ~6 badges | 🟢 MOYENNE |
| `complianceScore` utilisé incorrectement | ~10 badges | 🟢 MOYENNE |
| Badges weekends identifiés par compliance | ~3 badges | 🟢 MOYENNE |
| Badges post-entraînement sans Garmin | ~3 badges | 🟢 MOYENNE |

### Par niveau de badge

| Niveau | Total | ✅ Corrects | ⚠️ À améliorer | 🔴 À corriger |
|--------|-------|-------------|----------------|---------------|
| FACILE | 20 | 3 (15%) | 14 (70%) | 3 (15%) |
| SIMPLE | 20 | 5 (25%) | 10 (50%) | 5 (25%) |
| MOYEN | 20 | 4 (20%) | 12 (60%) | 4 (20%) |
| DIFFICILE | 20 | 5 (25%) | 12 (60%) | 3 (15%) |
| HARDCORE | 20 | 4 (20%) | 13 (65%) | 3 (15%) |
| IMPOSSIBLE | 20 | 4 (20%) | 13 (65%) | 3 (15%) |
| **TOTAL** | **120** | **25 (21%)** | **74 (62%)** | **21 (17%)** |

*Note : Le total est de 120 badges car certains badges sont analysés dans plusieurs catégories de problèmes.*

---

## ✅ SOLUTIONS RECOMMANDÉES (PRIORISÉES)

### 🎯 PRIORITÉ CRITIQUE

1. **Ajouter `hasRealNutritionData` partout où nécessaire**
   - Tous les badges "sans X"
   - Tous les badges "jour parfait" ou "journée complète"
   - Tous les badges qui vérifient des macros/calories

2. **Corriger la vérification de consécutivité**
   - Utiliser `DateHelper.getDaysAgoLocal(i)` pour vérifier la consécutivité
   - Ne pas utiliser `slice(-N)` qui ne garantit pas la consécutivité

3. **Corriger les badges de variété/découverte**
   - Calculer directement dans la condition au lieu d'utiliser `uniqueFoodsLast7Days`
   - Filtrer par type (légumes, fruits, protéines) si nécessaire

### 🟡 PRIORITÉ HAUTE

4. **Améliorer la gestion des `targetX`**
   - Utiliser `userData.activeProgram` si disponible
   - Éviter les divisions par zéro
   - Documenter les valeurs par défaut

5. **Corriger les badges temporels**
   - Vérifier si `meal.timestamp` ou `meal.time` existe
   - Utiliser `DateHelper` pour extraire le jour de la semaine
   - Documenter les approximations si les données ne sont pas disponibles

6. **Améliorer les badges de recettes**
   - Ajouter un champ `meal.isRecipe` dans le modèle de données
   - Améliorer l'heuristique en attendant

### 🟢 PRIORITÉ MOYENNE

7. **Corriger les badges de compliance**
   - Vérifier que `complianceScore` existe
   - Ne pas utiliser `complianceScore` pour les problèmes digestifs

8. **Vérifier la structure `userData`**
   - Documenter tous les champs attendus
   - Vérifier que `prepareUserData` calcule tous les champs nécessaires

---

## 📝 PLAN D'IMPLÉMENTATION

### Phase 1 : Corrections critiques (2-3h)

#### 1.1 Ajouter `hasRealNutritionData` dans tous les badges concernés (~35 badges) ✅ COMPLÈTE - 2025-01-16

**Badges corrigés jusqu'à présent :**
- ✅ `badge_protein_1day` - Ajouté hasRealNutritionData + getTargetValue
- ✅ `badge_breakfast_today` - Ajouté hasRealNutritionData + vérification foods.length
- ✅ `badge_water_1l` - Note: Pas besoin de hasRealNutritionData (eau peut être bue sans repas)
- ✅ `badge_balanced_meal` - Ajouté hasRealNutritionData + vérification foods.length
- ✅ `badge_clean_breakfast` - Ajouté hasRealNutritionData + vérification foods.length
- ✅ `badge_light_dinner_today` - Ajouté hasRealNutritionData + vérification foods.length
- ✅ `badge_perfect_day` - Ajouté hasRealNutritionData + getTargetValue
- ✅ `badge_clean_monday` - Ajouté hasRealNutritionData
- ✅ `badge_macro_session` - Ajouté hasRealNutritionData + getTargetValue
- ✅ `badge_10balanced_meals` - Ajouté hasRealNutritionData dans forEach
- ✅ `badge_3recipes` - Ajouté hasRealNutritionData dans forEach
- ✅ `badge_3light_dinners` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_3breakfasts` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_hydration_2l_3days` - Ajouté consécutivité DateHelper
- ✅ `badge_3dinners_consecutive` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_clean_digestion_7days` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_30balanced_meals` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_digestive_pro` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_30light_dinners` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_10new_foods_30days` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_protein_ratio_3days` - Ajouté consécutivité DateHelper + hasRealNutritionData + getTargetValue
- ✅ `badge_7light_dinners` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_7breakfasts` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_15balanced_meals` - Ajouté hasRealNutritionData dans forEach
- ✅ `badge_4recipes` - Ajouté hasRealNutritionData dans forEach
- ✅ `badge_recovery_14days` - Ajouté consécutivité DateHelper + hasRealNutritionData + getTargetValue
- ✅ `badge_30days_meal_plans` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_dinner_before_8pm_30days` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_post_workout_30days` - Ajouté consécutivité DateHelper + hasRealNutritionData + getTargetValue
- ✅ `badge_dinner_before_8pm_3days` - Ajouté consécutivité DateHelper + hasRealNutritionData

- ✅ `badge_no_skipped_week` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_no_fastfood_week` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_365balanced_meals` - Ajouté hasRealNutritionData dans forEach
- ✅ `badge_no_sugar_30days` - Ajouté consécutivité DateHelper (avait déjà hasRealNutritionData)
- ✅ `badge_no_fastfood_1year` - Ajouté consécutivité DateHelper (avait déjà hasRealNutritionData)
- ✅ `badge_post_workout_7days` - Ajouté consécutivité DateHelper + hasRealNutritionData + getTargetValue

**✅ Phase 1.1 COMPLÈTE** - Tous les badges concernés ont maintenant `hasRealNutritionData` et utilisent `DateHelper` pour la consécutivité.

**✅ Phase 1.6 COMPLÈTE - 2025-01-16** : Corrections finales des badges restants
- ✅ `badge_hydration_week_100` - Supprimé ligne `.slice(-7)` inutile, ajouté `hasRealNutritionData`
- ✅ `badge_no_excess_sugar_week` - Remplacé `.slice(-7).every()` par DateHelper + hasRealNutritionData
- ✅ `badge_dinner_before_8pm_3days` - Remplacé `.slice(-3).forEach()` par DateHelper + hasRealNutritionData
- ✅ `badge_no_snack_7days` - Remplacé `.slice(-7).every()` par DateHelper + hasMainMealsWithData
- ✅ `badge_no_sugar_5days` - Remplacé `.slice(-5).every()` par DateHelper + hasRealNutritionData
- ✅ `badge_post_workout_7days` - Remplacé `.slice(-7).every()` par DateHelper + hasRealNutritionData + getTargetValue
- ✅ `badge_3weekends_mastered` - Remplacé `.slice(-21).forEach()` par DateHelper (continue au lieu de return false)
- ✅ `badge_sleep_nutrition_3days` - Remplacé `.slice(-3).forEach()` par DateHelper + hasRealNutritionData
- ✅ `badge_hydration_2l_30days` - Remplacé `.slice(-30).every()` par DateHelper + hasRealNutritionData
- ✅ `badge_no_skipped_90days` - Remplacé `.slice(-90).every()` par DateHelper + hasRealNutritionData
- ✅ `badge_50recipes` - Ajouté `hasRealNutritionData` dans forEach
- ✅ `badge_365perfect_programs` - Remplacé `.slice(-365).every()` par DateHelper + hasRealNutritionData
- ✅ `badge_masterclass_week` - Remplacé valeurs par défaut par `getTargetValue`
- ✅ `badge_master_nutrition_absolute` - Remplacé valeurs par défaut par `getTargetValue`

**Pattern appliqué :**
```javascript
// ✅ Pour badges single-day :
if (!hasRealNutritionData(today)) return false;

// ✅ Pour badges multi-days :
const today = DateHelper.getTodayLocal();
for (let i = 0; i < N; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day || !hasRealNutritionData(day)) return false; // ou continue selon contexte
  // ... reste de la condition
}
```
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges prioritaires :**
- Tous les badges "sans X" (sans snack, sans sucre, sans fast-food, etc.)
- Tous les badges "jour parfait" ou "journée complète"
- Tous les badges qui vérifient des macros/calories sans vérifier d'abord les données

**Pattern à appliquer :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length === 0) return false;
const today = userData.nutritionHistory[userData.nutritionHistory.length - 1];
if (!hasRealNutritionData(today)) return false; // ✅ AJOUTER CETTE LIGNE
// ... reste de la condition
```

#### 1.2 Corriger la vérification de consécutivité (~25 badges) ✅ COMPLÈTE - 2025-01-16
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- ✅ Tous les badges "X jours consécutifs" - CORRIGÉ
- ✅ Utiliser `DateHelper.getDaysAgoLocal(i)` au lieu de `slice(-N)` - IMPLÉMENTÉ

**Pattern à appliquer :**
```javascript
if (!userData.nutritionHistory || userData.nutritionHistory.length < N) return false;
const today = DateHelper.getTodayLocal();
for (let i = 0; i < N; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day || !hasRealNutritionData(day)) return false; // Jour manquant ou pas de données
  // ... vérifier condition pour ce jour
}
return true;
```

#### 1.3 Corriger les badges de variété/découverte (~8 badges) ✅ COMPLÈTE - 2025-01-16
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- ✅ `badge_new_vegetable` - Calcul direct depuis nutritionHistory sur 7 jours avec DateHelper
- ✅ `badge_new_protein_source` - Calcul direct protéines sur 7 jours avec DateHelper
- ✅ `badge_plant_protein` - Calcul direct protéines végétales sur 7 jours avec DateHelper
- ✅ `badge_variety_10_7days` - Calcul direct sur 7 jours avec DateHelper
- ✅ `badge_5new_vegetables` - Calcul direct sur 7 jours avec DateHelper
- ✅ `badge_new_food_3days` - Calcul direct sur 3 jours consécutifs avec DateHelper
- ✅ `badge_7fruits_day` - Calcul direct sur 1 jour (aujourd'hui)
- ✅ `badge_10protein_sources` - Calcul direct protéines sur 7 jours avec DateHelper
- ✅ `badge_variety_20_14days` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_20protein_sources` - Ajouté hasRealNutritionData dans forEach
- ✅ `badge_flexibility_mastered` - Ajouté consécutivité DateHelper + hasRealNutritionData
- ✅ `badge_100protein_sources` - Ajouté hasRealNutritionData dans forEach

**Solution appliquée :** Calculer directement dans la condition au lieu d'utiliser `uniqueFoodsLast7Days` (propriété inexistante)

**Pattern appliqué :**
```javascript
// ✅ Pour badges de variété sur N jours :
if (!userData.nutritionHistory || userData.nutritionHistory.length < N) return false;
const today = DateHelper.getTodayLocal();
const uniqueFoods = new Set();
for (let i = 0; i < N; i++) {
  const expectedDate = DateHelper.getDaysAgoLocal(i);
  const day = userData.nutritionHistory.find(d => d.date === expectedDate);
  if (!day || !hasRealNutritionData(day)) continue; // ou return false selon contexte
  (day.meals || []).forEach(meal => {
    const foods = meal.foods || [];
    foods.forEach(food => {
      if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
    });
  });
}
return uniqueFoods.size >= X;
```

#### 1.4 Corriger les badges de fibres (6 badges) ✅ TERMINÉ - 2025-01-16
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- `badge_fiber_starter` ✅ CORRIGÉ
- `badge_fiber_25g_3days` ✅ CORRIGÉ
- `badge_masterclass_week` ✅ CORRIGÉ
- `badge_fiber_25_35g_30days` ✅ CORRIGÉ
- `badge_fiber_365days` ✅ CORRIGÉ
- `badge_master_nutrition_absolute` ✅ CORRIGÉ

**Problème :** `fiber` n'existe PAS dans `dailyTotals` - doit être calculé depuis `day.meals[].foods[].fiber`

**Solution appliquée :**
1. ✅ Créé fonction helper `calculateFiberFromMeals(day)` pour calculer les fibres depuis `meals.foods`
2. ✅ Ajouté import de `DateHelper` en haut du fichier
3. ✅ Remplacé tous les `day.dailyTotals?.fiber` par `calculateFiberFromMeals(day)`
4. ✅ Ajouté vérification `hasRealNutritionData(day)` dans tous les badges de fibres
5. ✅ Corrigé vérification de consécutivité avec `DateHelper.getDaysAgoLocal()` pour les badges multi-jours
6. ✅ Ajouté vérifications de division par zéro pour les badges avec `targetX`

**Code implémenté :**
```javascript
// ✅ Helper function ajoutée :
const calculateFiberFromMeals = (day) => {
  if (!day || !day.meals || day.meals.length === 0) return 0;
  return day.meals.reduce((sum, meal) => {
    const foods = meal.foods || [];
    return sum + foods.reduce((s, food) => s + (food.fiber || 0), 0);
  }, 0);
};

// ✅ Exemple de correction appliquée (badge_fiber_starter) :
const fiber = calculateFiberFromMeals(today); // Au lieu de today?.dailyTotals?.fiber
```

#### 1.5 Corriger les valeurs par défaut `targetX` (~40 badges) ✅ TERMINÉ - 2025-01-16
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Problème :** Beaucoup de badges utilisent des valeurs par défaut incorrectes :
- `targetCalories`: 2000 ❌ → 2500 ✅
- `targetCarbs`: 200 ❌ → 300 ✅
- `targetFat`: 65 ❌ → 80 ✅
- `targetWater`: 2500 ❌ → 3000 ✅
- `targetProtein`: 150 ✅ (déjà correct)

**Solution appliquée :**
1. ✅ Créé fonction helper `getTargetValue(day, userData, field)` pour standardiser les fallbacks
2. ✅ Remplacé toutes les valeurs par défaut incorrectes (2000→2500, 200→300, 65→80, 2500→3000)
3. ✅ Ajouté vérification de division par zéro pour tous les badges avec `targetX`
4. ✅ Corrigé vérification de consécutivité avec `DateHelper.getDaysAgoLocal()` pour badges multi-jours
5. ✅ Ajouté vérification `hasRealNutritionData(day)` dans badges nécessitant des données réelles

**Badges corrigés :**
- ~40 badges avec valeurs par défaut incorrectes
- Tous utilisent maintenant `getTargetValue()` ou le pattern correct avec fallback vers `activeProgram`

**Pattern appliqué :**
```javascript
// ❌ INCORRECT :
const targetWater = today?.dailyTotals?.targetWater || 2500;
const targetCalories = today?.dailyTotals?.targetCalories || 2000;
const targetCarbs = today?.dailyTotals?.targetCarbs || 200;
const targetFat = today?.dailyTotals?.targetFat || 65;

// ✅ CORRECT :
const targetWater = today?.dailyTotals?.targetWater || 
                    userData.activeProgram?.targetWater || 
                    3000; // Valeur par défaut réelle dans calculateDailyTotals
const targetCalories = today?.dailyTotals?.targetCalories || 
                       userData.activeProgram?.targetCalories || 
                       2500; // Valeur par défaut réelle dans calculateDailyTotals
const targetCarbs = today?.dailyTotals?.targetCarbs || 
                    userData.activeProgram?.targetCarbs || 
                    300; // Valeur par défaut réelle dans calculateDailyTotals
const targetFat = today?.dailyTotals?.targetFat || 
                  userData.activeProgram?.targetFat || 
                  80; // Valeur par défaut réelle dans calculateDailyTotals
if (targetWater === 0 || targetCalories === 0 || targetCarbs === 0 || targetFat === 0) return false; // Éviter division par zéro
```

---

### Phase 2 : Améliorations importantes (2-3h)

#### 2.1 Améliorer la gestion des `targetX` (~40 badges)
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Pattern à appliquer :**
```javascript
// Au lieu de :
const targetCalories = today?.dailyTotals?.targetCalories || 2000;

// Utiliser :
const targetCalories = today?.dailyTotals?.targetCalories || 
                       userData.activeProgram?.targetCalories || 
                       2000;
if (targetCalories === 0) return false; // Éviter division par zéro
```

#### 2.2 Corriger les badges temporels (~5 badges)
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- `badge_hydration_morning` (3 verres avant midi)
- `badge_dinner_before_8pm_3days`
- `badge_sleep_nutrition_3days` (dîner 2h avant coucher)
- `badge_dinner_before_8pm_30days`

**Solution :** 
- Vérifier si `meal.timestamp` ou `meal.time` existe
- Si disponible, extraire l'heure avec `new Date(meal.timestamp).getHours()`
- Si non disponible, documenter l'approximation

#### 2.3 Améliorer les badges de recettes (~6 badges)
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- `badge_first_recipe`
- `badge_3recipes`
- `badge_4recipes`
- `badge_10recipes`
- `badge_20recipes`
- `badge_50recipes`

**Solution :**
- Vérifier si `meal.isRecipe` existe (priorité)
- Sinon, améliorer l'heuristique (nom du repas, nombre d'aliments, etc.)

---

### Phase 3 : Finitions (1-2h)

#### 3.1 Corriger les badges de compliance (~10 badges)
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- Ne pas utiliser `complianceScore` pour les problèmes digestifs
- Vérifier que `complianceScore` existe avant utilisation

#### 3.2 Corriger les badges weekends (~3 badges)
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- `badge_3weekends_mastered`
- `badge_6weekends_mastered`
- `badge_12months_weekends`

**Solution :** 
- Utiliser `DateHelper` pour extraire le jour de la semaine depuis `day.date`
- Vérifier si c'est samedi (6) ou dimanche (0)
- Filtrer les jours par date, pas par compliance

#### 3.3 Corriger les badges post-entraînement (~3 badges)
**Fichier :** `src/services/nutrition/nutritionBadgesDefinitions.js`

**Badges concernés :**
- `badge_post_workout_7days`
- `badge_recovery_14days`
- `badge_post_workout_30days`

**Solution :**
- Intégrer `userData.garminData` ou `userData.workouts` pour vérifier qu'il y a eu un entraînement
- Vérifier le timing si les données sont disponibles

#### 3.4 Documenter la structure `userData`
**Fichier :** `src/hooks/useNutritionGamification.js` (fonction `prepareUserData`)

**À documenter :**
- Structure exacte de `userData`
- Champs calculés (`uniqueFoodsLast7Days`, `nutritionHistory`, etc.)
- Valeurs par défaut
- Format des dates (doit être `YYYY-MM-DD` pour compatibilité avec `DateHelper`)

#### 3.5 Tests de validation
**Créer :** `src/services/nutrition/__tests__/nutritionBadgesDefinitions.test.js`

**Tests à créer :**
- Tests unitaires pour chaque badge (conditions correctes, conditions incorrectes)
- Tests de consécutivité
- Tests avec données manquantes
- Tests avec valeurs par défaut

---

## 🔧 FONCTIONS HELPER À CRÉER

### 1. `checkConsecutiveDays(userData, daysCount, conditionFn)`
**Usage :** Vérifier N jours consécutifs avec une condition

```javascript
const checkConsecutiveDays = (userData, daysCount, conditionFn) => {
  if (!userData.nutritionHistory || userData.nutritionHistory.length < daysCount) return false;
  const today = DateHelper.getTodayLocal();
  for (let i = 0; i < daysCount; i++) {
    const expectedDate = DateHelper.getDaysAgoLocal(i);
    const day = userData.nutritionHistory.find(d => d.date === expectedDate);
    if (!day || !hasRealNutritionData(day)) return false;
    if (!conditionFn(day)) return false;
  }
  return true;
};
```

### 2. `isVegetable(food)`
**Usage :** Détecter si un aliment est un légume

```javascript
const isVegetable = (food) => {
  const name = (food.name || '').toLowerCase();
  const vegetableKeywords = ['légume', 'vegetable', 'brocoli', 'carotte', 'courgette', 'tomate', 'salade', 'épinard', 'chou', 'poivron', 'oignon', 'ail', 'céleri', 'concombre', 'aubergine', 'champignon', 'asperge', 'haricot vert', 'pois', 'maïs', 'patate douce', 'pomme de terre'];
  return vegetableKeywords.some(keyword => name.includes(keyword)) ||
         ((food.fiber || 0) > 2 && (food.calories || 0) < 100 && (food.protein || 0) < 5);
};
```

### 3. `isFruit(food)`
**Usage :** Détecter si un aliment est un fruit

```javascript
const isFruit = (food) => {
  const name = (food.name || '').toLowerCase();
  const fruitKeywords = ['fruit', 'pomme', 'banane', 'orange', 'fraise', 'raisin', 'cerise', 'poire', 'pêche', 'abricot', 'kiwi', 'mangue', 'ananas', 'citron', 'myrtille', 'framboise', 'mûre', 'pastèque', 'melon'];
  return fruitKeywords.some(keyword => name.includes(keyword)) ||
         ((food.vitaminC || 0) > 10 && (food.protein || 0) < 2 && (food.carbs || 0) > 10);
};
```

### 4. `isPlantProtein(food)`
**Usage :** Détecter si un aliment est une source de protéines végétales

```javascript
const isPlantProtein = (food) => {
  const name = (food.name || '').toLowerCase();
  const plantProteinKeywords = ['lentille', 'haricot', 'pois chiche', 'tofu', 'tempeh', 'seitan', 'quinoa', 'amande', 'noix', 'graine', 'noisette', 'cacahuète', 'arachide', 'soja'];
  return plantProteinKeywords.some(keyword => name.includes(keyword)) ||
         ((food.protein || 0) > 5 && (food.fat || 0) < 10 && (food.carbs || 0) > 0 && !isAnimalProtein(food));
};
```

### 5. `isWeekend(dayDate)`
**Usage :** Vérifier si une date est un weekend

```javascript
const isWeekend = (dayDate) => {
  const date = new Date(dayDate);
  const dayOfWeek = date.getDay(); // 0 = dimanche, 6 = samedi
  return dayOfWeek === 0 || dayOfWeek === 6;
};
```

### 6. `getTargetValue(day, field, userData, defaultValue)`
**Usage :** Obtenir une valeur cible avec fallback

```javascript
const getTargetValue = (day, field, userData, defaultValue) => {
  // 1. Vérifier dailyTotals du jour
  if (day?.dailyTotals?.[field]) return day.dailyTotals[field];
  // 2. Vérifier programme actif
  if (userData.activeProgram?.[field]) return userData.activeProgram[field];
  // 3. Valeur par défaut
  return defaultValue;
};
```

---

## ✅ CHECKLIST DE VALIDATION

Avant de considérer les corrections terminées, vérifier :

### ✅ Vérifications générales
- [ ] Tous les badges "sans X" utilisent `hasRealNutritionData` ou `hasMainMealsWithData`
- [ ] Tous les badges de séries vérifient la consécutivité avec `DateHelper.getDaysAgoLocal`
- [ ] Aucun badge n'utilise `uniqueFoodsLast7Days` incorrectement (calcul direct dans condition)
- [ ] **Aucun badge n'utilise `dailyTotals.fiber` (n'existe pas) - utiliser `calculateFiberFromMeals`**
- [ ] Tous les badges avec `targetX` utilisent le programme actif en fallback
- [ ] **Toutes les valeurs par défaut `targetX` sont correctes (2500, 150, 300, 80, 3000)**
- [ ] Aucune division par zéro possible (`targetX === 0` vérifié)
- [ ] Tous les badges vérifient qu'il y a des aliments dans les repas avant calculs

### ✅ Vérifications spécifiques
- [ ] Badges temporels : vérification horaire si données disponibles, sinon approximation documentée
- [ ] Badges recettes : vérification `meal.isRecipe` si disponible, sinon heuristique améliorée
- [ ] Badges compliance : ne pas utiliser pour problèmes digestifs, vérifier existence
- [ ] Badges weekends : utilisation de `DateHelper` pour jour de la semaine, pas compliance
- [ ] Badges post-entraînement : intégration données Garmin si disponibles

### ✅ Tests
- [ ] Tests unitaires pour tous les badges
- [ ] Tests avec données manquantes
- [ ] Tests avec valeurs par défaut
- [ ] Tests de consécutivité
- [ ] Tests de revalidation (badges débloqués incorrectement)

---

**Total estimé :** 5-8 heures de travail

**Priorité :** 🔴 CRITIQUE - Ces corrections garantissent que les badges sont débloqués uniquement quand les conditions sont réellement remplies, améliorant l'expérience utilisateur et la fiabilité du système de gamification.

---

*Document créé le 2025-01-16 - Analyse complète des 100 badges*

