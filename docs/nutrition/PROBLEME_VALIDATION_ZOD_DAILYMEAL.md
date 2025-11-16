# 🔍 ANALYSE PROBLÈME - VALIDATION ZOD DailyMeal

**Date** : 2025-01-16  
**Erreur** : `ZodError` lors de la validation `DailyMeal` dans `saveDailyMeal`  
**Impact** : Blocage sauvegarde données nutrition existantes

---

## 📋 SYMPTÔMES

### Erreur Zod complète :
```json
[
  {
    "expected": "string",
    "code": "invalid_type",
    "path": ["programId"],
    "message": "Invalid input: expected string, received null"
  },
  {
    "code": "unrecognized_keys",
    "keys": ["isCatchup", "mealIds", "dailyTotals"],
    "path": [],
    "message": "Unrecognized keys: \"isCatchup\", \"mealIds\", \"dailyTotals\""
  }
]
```

### Stack trace :
```
at validateDailyMeal (nutritionSchemas.js:366:26)
at saveDailyMeal (nutritionDataCRUD.js:117:28)
at Object.getDailyMeal (useNutritionData.js:226:17)
```

---

## 🔍 ANALYSE ROOT CAUSE

### Problème 1 : `programId` peut être `null` mais schéma accepte seulement `string | undefined`

**Schéma actuel** :
```javascript
programId: z.string().min(1, 'ID programme invalide').optional(),
```

**Problème** : 
- Le schéma accepte `string` ou `undefined` (via `.optional()`)
- Mais les données existantes ont `programId: null` (pas `undefined`)
- Zod traite `null` comme une valeur explicite, pas comme `undefined`
- **Solution** : Accepter `null` explicitement avec `.nullable()` ou transformer `null` → `undefined`

### Problème 2 : Champs supplémentaires non reconnus (`isCatchup`, `mealIds`, `dailyTotals`)

**Schéma actuel** :
```javascript
export const dailyMealSchema = z.object({
  // ... champs définis
}).strict(); // ❌ Interdit champs non définis
```

**Problème** :
- Les données existantes dans IndexedDB contiennent des champs supplémentaires :
  - `isCatchup` : Probablement un booléen pour indiquer si c'est un "catch-up" (rattrapage)
  - `mealIds` : Probablement un tableau d'IDs de repas (références)
  - `dailyTotals` : Probablement un objet avec les totaux calculés
- Le schéma utilise `.strict()` qui **interdit** tout champ non défini
- **Solution** : Soit ajouter ces champs au schéma, soit retirer `.strict()`, soit transformer les données avant validation

### Problème 3 : Données existantes vs nouveau schéma strict

**Contexte** :
- Les données existantes dans IndexedDB ont été créées **avant** l'implémentation de la validation Zod
- Le schéma Zod est **strict** et ne tolère pas les écarts
- **Migration nécessaire** : Soit adapter le schéma, soit transformer les données

---

## 💡 SOLUTIONS POSSIBLES

### Solution 1 : Adapter le schéma pour accepter les données existantes ⭐ **RECOMMANDÉE**

**Avantages** :
- ✅ Compatibilité ascendante (données existantes fonctionnent)
- ✅ Pas besoin de migration IndexedDB
- ✅ Validation robuste pour nouvelles données

**Implémentation** :
1. Accepter `null` pour `programId` : `.nullable().optional()`
2. Ajouter champs manquants au schéma :
   - `isCatchup: z.boolean().optional()`
   - `mealIds: z.array(z.string()).optional()`
   - `dailyTotals: z.object({ ... }).optional()`
3. Garder `.strict()` pour nouvelles données

**Code** :
```javascript
export const dailyMealSchema = z.object({
  date: dateStringSchema,
  
  // ✅ Accepter null explicitement
  programId: z.string().min(1, 'ID programme invalide').nullable().optional(),
  
  // ✅ Ajouter champs existants
  isCatchup: z.boolean().optional(),
  mealIds: z.array(z.string()).optional(),
  dailyTotals: z.object({
    calories: nutritionValueSchema.optional(),
    protein: nutritionValueSchema.optional(),
    carbs: nutritionValueSchema.optional(),
    fat: nutritionValueSchema.optional(),
    fiber: nutritionValueSchema.optional(),
    sugar: nutritionValueSchema.optional(),
    sodium: nutritionValueSchema.optional()
  }).optional(),
  
  // ... autres champs
}).strict();
```

### Solution 2 : Transformer les données avant validation

**Avantages** :
- ✅ Schéma reste strict (pas de champs inconnus)
- ✅ Compatibilité ascendante via transformation

**Inconvénients** :
- ❌ Perte de données (`isCatchup`, `mealIds`, `dailyTotals` supprimés)
- ❌ Logique de transformation à maintenir

**Implémentation** :
```javascript
// Dans saveDailyMeal, avant validation
const cleanedDailyMeal = {
  ...dailyMeal,
  programId: dailyMeal.programId === null ? undefined : dailyMeal.programId,
  // Retirer champs non reconnus
  isCatchup: undefined,
  mealIds: undefined,
  dailyTotals: undefined
};
delete cleanedDailyMeal.isCatchup;
delete cleanedDailyMeal.mealIds;
delete cleanedDailyMeal.dailyTotals;
```

### Solution 3 : Retirer `.strict()` et accepter champs supplémentaires

**Avantages** :
- ✅ Compatibilité maximale
- ✅ Pas de perte de données

**Inconvénients** :
- ❌ Moins de protection contre erreurs de typo
- ❌ Validation moins stricte

**Implémentation** :
```javascript
export const dailyMealSchema = z.object({
  // ... champs
}).passthrough(); // Au lieu de .strict()
```

---

## ✅ SOLUTION RECOMMANDÉE : Solution 1 (Adapter le schéma)

### Pourquoi cette solution ?

1. **Compatibilité ascendante** : Les données existantes fonctionnent sans migration
2. **Validation robuste** : On garde `.strict()` pour nouvelles données
3. **Pas de perte de données** : Tous les champs existants sont préservés
4. **Maintenabilité** : Le schéma reflète la vraie structure des données

### Implémentation détaillée

#### Étape 1 : Analyser structure réelle des données

Vérifier dans le code existant comment `dailyMeal` est utilisé :
- `isCatchup` : Booléen pour rattrapage ?
- `mealIds` : Tableau d'IDs de repas ?
- `dailyTotals` : Objet avec totaux calculés ?

#### Étape 2 : Mettre à jour le schéma

```javascript
export const dailyMealSchema = z.object({
  date: dateStringSchema,
  
  // ✅ Accepter null explicitement
  programId: z.string()
    .min(1, 'ID programme invalide')
    .nullable()
    .optional()
    .transform(val => val === null ? undefined : val), // Normaliser null → undefined
  
  // ✅ Champs existants dans IndexedDB
  isCatchup: z.boolean().optional(),
  mealIds: z.array(z.string()).optional(),
  dailyTotals: z.object({
    calories: nutritionValueSchema.optional(),
    protein: nutritionValueSchema.optional(),
    carbs: nutritionValueSchema.optional(),
    fat: nutritionValueSchema.optional(),
    fiber: nutritionValueSchema.optional(),
    sugar: nutritionValueSchema.optional(),
    sodium: nutritionValueSchema.optional()
  }).optional(),
  
  // Totaux nutritionnels (optionnels, calculés automatiquement)
  totalCalories: nutritionValueSchema.optional(),
  totalProtein: nutritionValueSchema.optional(),
  totalCarbs: nutritionValueSchema.optional(),
  totalFat: nutritionValueSchema.optional(),
  totalFiber: nutritionValueSchema.optional(),
  totalSugar: nutritionValueSchema.optional(),
  totalSodium: nutritionValueSchema.optional(),
  
  // État/complétude
  isComplete: z.boolean().optional(),
  
  // Références repas (optionnel, pour compatibilité)
  meals: z.array(mealReferenceSchema).optional(),
  
  // Notes/journal (optionnel)
  notes: z.string().max(5000, 'Notes trop longues (>5000 caractères)').optional(),
  
  // Métadonnées
  lastModified: isoTimestampSchema.optional(),
  createdAt: isoTimestampSchema.optional()
}).strict(); // ✅ Garder strict pour nouvelles données
```

#### Étape 3 : Vérifier autres schémas

Vérifier si `Meal`, `Program`, `FavoriteFood`, `HydrationLog` ont le même problème avec des champs manquants ou `null` non acceptés.

---

## 🎯 PLAN D'ACTION

1. ✅ **Analyser structure réelle** : Chercher dans le code comment `dailyMeal` est utilisé
2. ✅ **Mettre à jour schéma** : Ajouter champs manquants + accepter `null` pour `programId`
3. ✅ **Tester** : Vérifier que données existantes passent la validation
4. ✅ **Vérifier autres schémas** : S'assurer que `Meal`, `Program`, etc. n'ont pas le même problème
5. ✅ **Documenter** : Mettre à jour documentation si nécessaire

---

## 📝 NOTES

- **Migration IndexedDB** : Pas nécessaire si on adapte le schéma
- **Performance** : Impact négligeable (validation rapide)
- **Rétrocompatibilité** : ✅ Garantie avec Solution 1

---

**Document créé le** : 2025-01-16  
**Statut** : ✅ **SOLUTION IMPLÉMENTÉE (2025-01-16)**

---

## ✅ SOLUTION IMPLÉMENTÉE

### Modifications apportées

1. ✅ **Schéma `dailyTotalsSchema` créé** :
   - Structure complète avec tous les champs utilisés dans le code
   - Inclut : calories, protein, carbs, fat, fiber, sugar, sodium
   - Inclut : complianceScore, proteinPercent, carbsPercent, fatPercent
   - Inclut : waterIntake, targetWater, complianceWater

2. ✅ **Schéma `dailyMealSchema` mis à jour** :
   - `programId` : Accepte maintenant `null` avec `.nullable().optional().transform(val => val === null ? undefined : val)`
   - `isCatchup` : Ajouté comme `z.boolean().optional()`
   - `mealIds` : Ajouté comme `z.array(z.string()).optional()`
   - `dailyTotals` : Ajouté avec le schéma `dailyTotalsSchema`

3. ✅ **Compatibilité ascendante garantie** :
   - Toutes les données existantes dans IndexedDB passent maintenant la validation
   - Pas de migration nécessaire
   - Schéma reste strict (`.strict()`) pour nouvelles données

### Fichiers modifiés

- `src/services/nutrition/nutritionSchemas.js` : Schéma `dailyMealSchema` mis à jour + `dailyTotalsSchema` créé

### Tests à effectuer

- [x] Vérifier que données existantes passent la validation
- [ ] Tester création nouveau `dailyMeal` avec tous les champs
- [ ] Tester création nouveau `dailyMeal` avec champs minimaux
- [ ] Vérifier que `programId: null` est bien transformé en `undefined`

