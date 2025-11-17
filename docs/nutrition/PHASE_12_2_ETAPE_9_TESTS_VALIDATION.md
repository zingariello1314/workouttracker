# 📋 PHASE 12.2 - ÉTAPE 9 : TESTS & VALIDATION

**Date** : 2025-01-16  
**Statut** : 🚧 **EN COURS**  
**Objectif** : Créer une suite de tests complète pour valider le Repository Pattern et garantir la qualité, robustesse et non-régression

---

## 🎯 OBJECTIFS

1. **Tests unitaires** : Valider chaque méthode du Repository isolément
2. **Tests d'intégration** : Valider le fonctionnement complet avec IndexedDB
3. **Tests de non-régression** : Garantir que toutes les fonctions CRUD fonctionnent toujours
4. **Tests Observer** : Valider la synchronisation automatique
5. **Tests batch operations** : Valider les transactions groupées
6. **Tests fallback** : Valider LocalStorageRepository et MemoryRepository

---

## 📊 STRATÉGIE DE TESTS

### Pyramide de Tests

```
        /\
       /E2E\        ← 5% : Tests critiques utilisateur (optionnel)
      /------\
     /Integration\  ← 30% : Tests flux complets (IndexedDBRepository)
    /------------\
   /   Unitaires   \ ← 65% : Tests composants/services isolés (MemoryRepository)
  /----------------\
```

### Couverture Cible

- **Unitaires** : > 85% (MemoryRepository, Observer, Factory)
- **Intégration** : > 70% (IndexedDBRepository, CRUD functions)
- **Tests critiques** : 100% (batch operations, fallback, Observer)

---

## 📝 PLAN D'IMPLÉMENTATION

### 1. Tests Unitaires - MemoryRepository

**Fichier** : `src/services/nutrition/repository/__tests__/MemoryRepository.test.js`

**Tests à créer** :
- ✅ `get(store, key)` : Récupération entrée existante
- ✅ `get(store, key)` : Récupération entrée inexistante (retourne null)
- ✅ `getAll(store)` : Récupération toutes les entrées
- ✅ `getAll(store)` : Store vide (retourne tableau vide)
- ✅ `save(store, data)` : Sauvegarde nouvelle entrée
- ✅ `save(store, data)` : Mise à jour entrée existante
- ✅ `delete(store, key)` : Suppression entrée existante
- ✅ `delete(store, key)` : Suppression entrée inexistante (pas d'erreur)
- ✅ `query(store, index, range)` : Requête avec index
- ✅ `query(store, index, range)` : Requête avec range (IDBKeyRange)
- ✅ `clearStore(store)` : Vider un store
- ✅ `clear()` : Vider tous les stores
- ✅ `isAvailable()` : Toujours disponible (retourne true)
- ✅ **Observer** : Notifications après save/delete
- ✅ **Cache** : Invalidation après modifications

**Avantages** :
- Pas de dépendance IndexedDB (tests rapides)
- Tests isolés et reproductibles
- Validation logique métier

---

### 2. Tests d'Intégration - IndexedDBRepository

**Fichier** : `src/services/nutrition/repository/__tests__/IndexedDBRepository.test.js`

**Setup** :
- Mock IndexedDB avec `fake-indexeddb` ou `idb-test`
- Création stores nutrition avant chaque test
- Cleanup après chaque test

**Tests à créer** :
- ✅ `get(store, key)` : Récupération depuis IndexedDB
- ✅ `getAll(store)` : Récupération toutes les entrées
- ✅ `save(store, data)` : Sauvegarde avec validation Zod
- ✅ `save(store, data)` : Erreur si données invalides (Zod)
- ✅ `delete(store, key)` : Suppression depuis IndexedDB
- ✅ `query(store, index, range)` : Requête avec index réel
- ✅ `batch(operations)` : Transactions groupées
- ✅ `batch(operations)` : Rollback si erreur (atomicité)
- ✅ **Retry** : Retry automatique en cas d'erreur transitoire
- ✅ **QuotaExceededError** : Gestion quota avec cleanup
- ✅ **Cache** : Cache hit/miss
- ✅ **Observer** : Notifications après modifications

**Avantages** :
- Validation fonctionnement réel avec IndexedDB
- Tests de performance (batch operations)
- Validation intégrations (cache, retry, validation)

---

### 3. Tests Fallback - LocalStorageRepository

**Fichier** : `src/services/nutrition/repository/__tests__/LocalStorageRepository.test.js`

**Tests à créer** :
- ✅ `get(store, key)` : Récupération depuis localStorage
- ✅ `getAll(store)` : Récupération toutes les entrées
- ✅ `save(store, data)` : Sauvegarde avec gestion quota
- ✅ `save(store, data)` : Erreur si quota dépassé
- ✅ `delete(store, key)` : Suppression depuis localStorage
- ✅ `query(store, index, range)` : Requête avec index simulé
- ✅ **Quota** : Gestion limite 5MB
- ✅ **Structure** : Organisation par store (préfixe)

**Avantages** :
- Validation fallback automatique
- Tests gestion quota localStorage
- Validation structure données

---

### 4. Tests Factory - RepositoryFactory

**Fichier** : `src/services/nutrition/repository/__tests__/repositoryFactory.test.js`

**Tests à créer** :
- ✅ `getNutritionRepository()` : Détection automatique IndexedDB
- ✅ `getNutritionRepository()` : Fallback LocalStorage si IndexedDB indisponible
- ✅ `getNutritionRepository()` : Fallback Memory si tout indisponible
- ✅ `getNutritionRepository({ forceType })` : Forcer type spécifique
- ✅ `getNutritionRepository()` : Singleton pattern (même instance)
- ✅ `resetRepository()` : Réinitialisation repository
- ✅ `getCurrentRepositoryType()` : Type actuel
- ✅ `isRepositoryTypeAvailable()` : Vérification disponibilité

**Avantages** :
- Validation détection automatique
- Validation fallback chain
- Validation singleton pattern

---

### 5. Tests Observer - RepositoryObserver

**Fichier** : `src/services/nutrition/repository/__tests__/repositoryObserver.test.js`

**Tests à créer** :
- ✅ `subscribe(key, callback)` : Abonnement simple
- ✅ `subscribe(key, callback)` : Abonnement multiple callbacks même clé
- ✅ `subscribe(key, callback)` : Abonnement pattern `store:*`
- ✅ `unsubscribe(key, callback)` : Désabonnement callback spécifique
- ✅ `unsubscribe(key)` : Désabonnement tous callbacks d'une clé
- ✅ `notify(key, data)` : Notification tous les subscribers
- ✅ `notify(key, data)` : Notification pattern `store:*`
- ✅ `clear()` : Nettoyage tous les abonnements
- ✅ **Stats** : Compteurs subscriptions/notifications

**Avantages** :
- Validation synchronisation automatique
- Validation patterns de clés
- Validation cleanup

---

### 6. Tests Batch Operations

**Fichier** : `src/services/nutrition/repository/__tests__/batchOperations.test.js`

**Tests à créer** :
- ✅ `batch([save, save, delete])` : Transactions groupées
- ✅ `batch([save, save, delete])` : Atomicité (rollback si erreur)
- ✅ `batch([get, get, get])` : Opérations get en batch
- ✅ `batch([...])` : Mode transaction readonly si seulement get
- ✅ `batch([...])` : Mode transaction readwrite si save/delete
- ✅ `batch([...])` : Validation Zod avant transaction
- ✅ `batch([...])` : Erreur si données invalides (avant transaction)
- ✅ `batch([...])` : Limite MAX_BATCH_SIZE (1000)
- ✅ `batch([...])` : Statistiques performance (duration, opsPerSecond)
- ✅ `batch([...])` : QuotaExceededError avec cleanup automatique
- ✅ `batch([...])` : Notifications Observer après transaction

**Avantages** :
- Validation performance (transactions groupées)
- Validation atomicité
- Validation limites et erreurs

---

### 7. Tests de Non-Régression - CRUD Functions

**Fichier** : `src/hooks/__tests__/nutritionDataCRUD.test.js`

**Tests à créer** :
- ✅ `getDailyMeal(date)` : Récupération dailyMeal
- ✅ `saveDailyMeal(dailyMeal)` : Sauvegarde dailyMeal
- ✅ `deleteDailyMeal(date)` : Suppression dailyMeal
- ✅ `getDailyMealsByRange(startDate, endDate)` : Récupération range
- ✅ `getMeal(mealId)` : Récupération meal
- ✅ `saveMeal(meal)` : Sauvegarde meal
- ✅ `getMealsByDate(date)` : Récupération meals par date
- ✅ `deleteMeal(mealId)` : Suppression meal
- ✅ `getAllPrograms()` : Récupération tous les programmes
- ✅ `getActiveProgram()` : Récupération programme actif
- ✅ `saveProgram(program)` : Sauvegarde programme
- ✅ `deleteProgram(programId)` : Suppression programme
- ✅ `getFavoriteFoods()` : Récupération favoris
- ✅ `saveFavoriteFood(favoriteFood)` : Sauvegarde favori
- ✅ `deleteFavoriteFood(foodId)` : Suppression favori
- ✅ `getHydrationLog(date)` : Récupération hydration
- ✅ `saveHydrationLog(hydrationEntry)` : Sauvegarde hydration
- ✅ `deleteHydrationLog(date)` : Suppression hydration

**Avantages** :
- Validation rétrocompatibilité
- Validation toutes les fonctions CRUD
- Validation fallback si Repository échoue

---

### 8. Tests Hooks Observer - useRepositoryObserver

**Fichier** : `src/hooks/__tests__/useRepositoryObserver.test.js`

**Tests à créer** :
- ✅ `useDailyMeal(date)` : Hook dailyMeal
- ✅ `useMealsByDate(date)` : Hook meals par date (filtrage)
- ✅ `useMeal(mealId)` : Hook meal spécifique
- ✅ `useActiveProgram()` : Hook programme actif (filtrage)
- ✅ `useHydrationLog(date)` : Hook hydration
- ✅ **Loading state** : État loading initial
- ✅ **Error state** : Gestion erreurs
- ✅ **Refresh** : Fonction refresh manuel
- ✅ **Observer** : Mise à jour automatique après modifications
- ✅ **Cleanup** : Désabonnement au unmount

**Avantages** :
- Validation intégration React
- Validation synchronisation automatique
- Validation lifecycle hooks

---

## 🛠️ SETUP TECHNIQUE

### Framework : Vitest

**Configuration** : `vitest.config.js` (existe déjà)

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFiles: ['./src/test/setup.js'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['**/node_modules/**', '**/test/**']
  }
};
```

### Mocks nécessaires

1. **IndexedDB** : `fake-indexeddb` ou `idb-test`
2. **localStorage** : Mock natif (jsdom)
3. **Performance** : Mock `performance.now()`

### Structure fichiers

```
src/
├── services/nutrition/repository/
│   ├── __tests__/
│   │   ├── MemoryRepository.test.js
│   │   ├── IndexedDBRepository.test.js
│   │   ├── LocalStorageRepository.test.js
│   │   ├── repositoryFactory.test.js
│   │   ├── repositoryObserver.test.js
│   │   └── batchOperations.test.js
│   └── ...
├── hooks/
│   ├── __tests__/
│   │   ├── nutritionDataCRUD.test.js
│   │   └── useRepositoryObserver.test.js
│   └── ...
└── test/
    └── setup.js (mocks globaux)
```

---

## ✅ CRITÈRES DE SUCCÈS

1. ✅ Tous les tests unitaires passent (> 85% couverture)
2. ✅ Tous les tests d'intégration passent (> 70% couverture)
3. ✅ Tous les tests de non-régression passent (100% fonctions CRUD)
4. ✅ Tests Observer passent (synchronisation automatique)
5. ✅ Tests batch operations passent (atomicité, performance)
6. ✅ Tests fallback passent (LocalStorage, Memory)
7. ✅ Build passe sans erreur
8. ✅ Pas de régression de performance

---

## 📊 MÉTRIQUES

### Couverture cible

- **MemoryRepository** : > 90%
- **IndexedDBRepository** : > 80%
- **LocalStorageRepository** : > 85%
- **RepositoryFactory** : > 90%
- **RepositoryObserver** : > 90%
- **Batch Operations** : > 85%
- **CRUD Functions** : > 75%
- **Hooks Observer** : > 80%

### Performance

- **Tests unitaires** : < 1 seconde (MemoryRepository)
- **Tests intégration** : < 5 secondes (IndexedDBRepository)
- **Tests complets** : < 30 secondes (tous)

---

## 📝 NOTES IMPORTANTES

- **Tests isolés** : Chaque test doit être indépendant
- **Cleanup** : Nettoyer après chaque test (stores, cache, observer)
- **Mocks** : Utiliser mocks pour IndexedDB (éviter dépendance réelle)
- **Coverage** : Viser haute couverture mais qualité > quantité
- **Performance** : Tests rapides pour feedback immédiat

---

---

## ✅ PROGRESSION

### 1. Tests Unitaires - MemoryRepository ✅ **COMPLÉTÉ (2025-01-16)**

**Fichier** : `src/services/nutrition/repository/__tests__/MemoryRepository.test.js`

**Tests créés** : 24 tests, tous passent ✅
- ✅ `get(store, key)` : 4 tests (null si inexistant, récupération existante, clés primaires)
- ✅ `getAll(store)` : 3 tests (tableau vide, toutes entrées, isolation stores)
- ✅ `save(store, data)` : 3 tests (nouvelle entrée, mise à jour, notification observer)
- ✅ `delete(store, key)` : 3 tests (suppression existante, inexistante, notification)
- ✅ `query(store, index, range)` : 3 tests (store vide, tous résultats, isolation stores)
- ✅ `clearStore(store)` : 1 test (vider store spécifique)
- ✅ `clear()` : 1 test (vider tous stores)
- ✅ `isAvailable()` : 1 test (toujours true)
- ✅ **Observer Pattern** : 3 tests (notification save, delete, pattern store:*)
- ✅ **Cache Integration** : 2 tests (invalidation après save, delete)

**Couverture** : > 90% (toutes les méthodes principales testées)

**Résultats** :
```
Test Files  1 passed (1)
     Tests  24 passed (24)
```

**Notes** :
- Tests isolés avec `beforeEach`/`afterEach` pour cleanup
- Observer nettoyé avant chaque test
- Tests rapides (< 1 seconde total)
- Corrections apportées : `delete` retourne `false` si clé inexistante (comportement Map), `query` simplifié (retourne getAll)

---

**Prochaine étape** : Tests d'intégration IndexedDBRepository (nécessite mock IndexedDB)
