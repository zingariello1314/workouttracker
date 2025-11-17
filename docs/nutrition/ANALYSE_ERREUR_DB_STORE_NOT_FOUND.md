# 🔍 ANALYSE ERREUR : DB_STORE_NOT_FOUND

**Date** : 2025-01-16  
**Erreur** : `DB_STORE_NOT_FOUND` - Store IndexedDB non trouvé  
**Impact** : Spam console, hooks Observer ne fonctionnent pas  
**Priorité** : 🔴 CRITIQUE

---

## 📊 PROBLÈME IDENTIFIÉ

### Symptômes
- Erreurs répétées dans la console : `[ERROR] [indexedDBRepository] Erreur getAll après retry: {name: 'NutritionError', code: 'DB_STORE_NOT_FOUND', message: 'Store IndexedDB non trouvé.'}`
- Erreur provient de `useRepositoryObserver.js:87` → `repository.getAll(store)`
- Le hook `useMealsByDate` appelle `useRepositoryObserver('meals', null, { subscribeToAll: true })`
- Le repository essaie d'accéder au store `'meals'` mais le store IndexedDB s'appelle `'nutrition_meals'`

### Cause Racine
**Mismatch entre noms de stores simplifiés et noms réels IndexedDB**

Les hooks Observer utilisent des noms simplifiés :
- `'meals'` 
- `'dailyMeals'`
- `'programs'`
- `'hydrationLog'`

Mais les stores IndexedDB ont des noms avec préfixe `nutrition_` :
- `'nutrition_meals'` (STORE_MEALS)
- `'nutrition_dailyMeals'` (STORE_DAILY_MEALS)
- `'nutrition_programs'` (STORE_PROGRAMS)
- `'nutrition_hydrationLog'` (STORE_HYDRATION_LOG)

---

## 🎯 SOLUTIONS POSSIBLES

### Solution 1 : Mapping Store Names (✅ RECOMMANDÉE)
**Principe** : Créer un mapping centralisé entre noms simplifiés et noms réels

**Avantages** :
- ✅ Séparation des préoccupations (abstraction)
- ✅ Facile à maintenir (un seul endroit à modifier)
- ✅ Performance optimale (lookup O(1))
- ✅ Compatible avec tous les stores existants et futurs
- ✅ Permet de changer les noms IndexedDB sans casser les hooks

**Implémentation** :
```javascript
// Dans useRepositoryObserver.js ou un fichier dédié
const STORE_NAME_MAP = {
  'dailyMeals': 'nutrition_dailyMeals',
  'meals': 'nutrition_meals',
  'programs': 'nutrition_programs',
  'favoriteFoods': 'nutrition_favoriteFoods',
  'hydrationLog': 'nutrition_hydrationLog',
  'active': 'nutrition_programs' // Pour useActiveProgram
};
```

### Solution 2 : Utiliser les constantes directement
**Principe** : Importer STORE_MEALS, STORE_DAILY_MEALS, etc. dans les hooks

**Inconvénients** :
- ❌ Couplage fort avec les constantes
- ❌ Difficile à maintenir si noms changent
- ❌ Moins abstrait

### Solution 3 : Normaliser les noms dans le Repository
**Principe** : Le Repository accepte noms simplifiés et les convertit

**Avantages** :
- ✅ Centralisé dans le Repository
- ✅ Tous les appels bénéficient automatiquement

**Inconvénients** :
- ❌ Logique métier dans le Repository (moins abstrait)
- ❌ Plus complexe à tester

---

## ✅ SOLUTION RETENUE : Solution 1 (Mapping Store Names)

### Pourquoi cette solution ?
1. **Performance** : Lookup O(1) avec Map/Object
2. **Maintenabilité** : Un seul endroit à modifier
3. **Abstraction** : Les hooks restent simples et lisibles
4. **Extensibilité** : Facile d'ajouter de nouveaux stores
5. **Cohérence** : Pattern similaire à d'autres abstractions du projet

### Implémentation

#### Étape 1 : Créer fichier de mapping
`src/services/nutrition/repository/storeNameMap.js`

#### Étape 2 : Utiliser le mapping dans useRepositoryObserver
Convertir le nom simplifié en nom réel avant d'appeler le repository

#### Étape 3 : Gérer le cas spécial `useActiveProgram`
Le hook `useActiveProgram` utilise `'programs'` mais filtre par `isActive === true`

---

## 🔧 IMPLÉMENTATION DÉTAILLÉE

### Fichier 1 : `storeNameMap.js`
```javascript
/**
 * Mapping entre noms de stores simplifiés (utilisés dans hooks) 
 * et noms réels IndexedDB
 */
export const STORE_NAME_MAP = {
  'dailyMeals': 'nutrition_dailyMeals',
  'meals': 'nutrition_meals',
  'programs': 'nutrition_programs',
  'favoriteFoods': 'nutrition_favoriteFoods',
  'hydrationLog': 'nutrition_hydrationLog',
  'mealPhotos': 'nutrition_mealPhotos',
  'apiCache': 'nutrition_apiCache',
  'gamification': 'nutrition_gamification',
  'shareLinks': 'nutrition_shareLinks',
  'progressPhotos': 'nutrition_progressPhotos',
  'mlModels': 'nutrition_mlModels'
};

/**
 * Convertit un nom de store simplifié en nom réel IndexedDB
 * 
 * @param {string} simplifiedName - Nom simplifié (ex: 'meals')
 * @returns {string} Nom réel IndexedDB (ex: 'nutrition_meals')
 */
export const getStoreName = (simplifiedName) => {
  if (!simplifiedName) {
    throw new Error('Store name cannot be empty');
  }
  
  const realName = STORE_NAME_MAP[simplifiedName];
  if (!realName) {
    throw new Error(`Unknown store name: ${simplifiedName}. Available: ${Object.keys(STORE_NAME_MAP).join(', ')}`);
  }
  
  return realName;
};
```

### Fichier 2 : Modifier `useRepositoryObserver.js`
```javascript
import { getStoreName } from '../services/nutrition/repository/storeNameMap';

// Dans loadInitialData :
const realStoreName = getStoreName(store);
const allData = await repository.getAll(realStoreName, ...);
```

---

## 📈 BÉNÉFICES ATTENDUS

1. **Correction immédiate** : Plus d'erreurs `DB_STORE_NOT_FOUND`
2. **Performance** : Lookup O(1), pas d'impact sur performance
3. **Maintenabilité** : Un seul endroit à modifier si noms changent
4. **Robustesse** : Validation explicite avec messages d'erreur clairs
5. **Extensibilité** : Facile d'ajouter de nouveaux stores

---

## 🧪 TESTS À EFFECTUER

1. ✅ Vérifier que `useDailyMeal` fonctionne sans erreur
2. ✅ Vérifier que `useMealsByDate` fonctionne sans erreur
3. ✅ Vérifier que `useActiveProgram` fonctionne sans erreur
4. ✅ Vérifier que `useHydrationLog` fonctionne sans erreur
5. ✅ Vérifier que les données se chargent correctement
6. ✅ Vérifier que l'Observer fonctionne (mise à jour automatique)

---

## 📝 NOTES IMPORTANTES

- Le mapping doit être cohérent avec `nutritionDataUtils.js`
- Si un nouveau store est ajouté, il faut l'ajouter au mapping
- Les noms simplifiés sont plus lisibles dans les hooks
- Le mapping permet de changer les noms IndexedDB sans casser les hooks

---

## ✅ VALIDATION

- [x] Analyse du problème
- [x] Identification de la cause racine
- [x] Proposition de solutions
- [x] Sélection de la solution optimale
- [x] Implémentation
  - [x] Création fichier `storeNameMap.js` avec mapping
  - [x] Modification `useRepositoryObserver.js` pour utiliser le mapping
  - [x] Correction `useActiveProgram` pour filtrer correctement
  - [x] Export du mapping dans `repository/index.js`
- [ ] Tests
- [ ] Validation en production

---

## 🔧 CORRECTIONS APPLIQUÉES

### Fichier 1 : `storeNameMap.js` ✅ CRÉÉ
- Mapping complet entre noms simplifiés et noms réels
- Fonction `getStoreName()` avec validation et messages d'erreur clairs
- Fonctions utilitaires `hasStoreName()` et `getAvailableStoreNames()`

### Fichier 2 : `useRepositoryObserver.js` ✅ MODIFIÉ
- Import de `getStoreName` depuis le repository
- Conversion nom simplifié → nom réel dans `loadInitialData()`
- Conversion nom simplifié → nom réel dans `subscriptionKey()`
- Cohérence avec les notifications du repository

### Fichier 3 : `useActiveProgram` ✅ CORRIGÉ
- Charge tous les programmes avec `subscribeToAll: true`
- Filtre en mémoire pour trouver `isActive === true`
- Retourne le premier programme actif ou `null`

### Fichier 4 : `repository/index.js` ✅ MODIFIÉ
- Export de `getStoreName`, `hasStoreName`, `getAvailableStoreNames`, `STORE_NAME_MAP`

---

## 📊 RÉSULTATS ATTENDUS

Après ces corrections :
- ✅ Plus d'erreurs `DB_STORE_NOT_FOUND` dans la console
- ✅ Les hooks Observer fonctionnent correctement
- ✅ Les données se chargent depuis IndexedDB
- ✅ L'Observer synchronise automatiquement les changements
- ✅ Performance optimale (lookup O(1) pour mapping)
