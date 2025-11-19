# 📚 PHASE 12.2 : REPOSITORY PATTERN - DOCUMENTATION & GUIDE DE MIGRATION

**Date de création** : 2025-01-16  
**Statut** : ✅ **COMPLÉTÉ**  
**Objectif** : Documentation complète du Repository pattern et guide de migration pour développeurs

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)
4. [Guide d'utilisation](#guide-dutilisation)
5. [Guide de migration](#guide-de-migration)
6. [Best Practices](#best-practices)
7. [Exemples complets](#exemples-complets)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 VUE D'ENSEMBLE

### Qu'est-ce que le Repository Pattern ?

Le Repository Pattern est un pattern de conception qui abstrait l'accès aux données, permettant de :
- **Abstraire le storage** : IndexedDB, localStorage, API, etc.
- **Faciliter les tests** : Mock du repository pour tests unitaires
- **Centraliser la logique** : Cache, retry, validation, observer
- **Améliorer la maintenabilité** : Code modulaire et organisé

### Bénéfices

✅ **Abstraction complète** : Changement de storage transparent  
✅ **Testabilité** : Tests unitaires sans dépendance IndexedDB  
✅ **Performance** : Batch operations optimisées, cache intégré  
✅ **Synchronisation** : Pattern Observer pour mise à jour automatique  
✅ **Robustesse** : Retry automatique, gestion erreurs standardisée  
✅ **Validation** : Zod intégré pour type-safety à runtime

---

## 🏗️ ARCHITECTURE

### Structure modulaire

```
src/services/nutrition/repository/
├── index.js                          # Barrel exports + factory
├── NutritionRepository.js            # Interface abstraite
├── IndexedDBRepository.js            # Implémentation IndexedDB (production)
├── LocalStorageRepository.js         # Implémentation localStorage (fallback)
├── MemoryRepository.js               # Implémentation mémoire (tests)
├── repositoryObserver.js             # Pattern Observer
├── repositoryFactory.js              # Factory (singleton, détection auto)
└── storeNameMap.js                   # Mapping noms stores
```

### Hiérarchie des classes

```
NutritionRepository (interface abstraite)
    ├── IndexedDBRepository (implémentation principale)
    ├── LocalStorageRepository (fallback)
    └── MemoryRepository (tests)
```

### Flux de données

```
Composant React
    ↓
Hook (useNutritionData, useRepositoryObserver)
    ↓
Repository (IndexedDBRepository)
    ↓
IndexedDB / localStorage / Memory
```

### Pattern Observer intégré

```
Repository.save() → Observer.notify() → Composants abonnés → Re-render automatique
```

---

## 📖 API REFERENCE

### Factory

#### `getNutritionRepository(options?)`

Obtient l'instance singleton du repository (détection automatique).

```javascript
import { getNutritionRepository, RepositoryType } from '@/services/nutrition/repository';

// Utilisation normale (détection automatique)
const repo = await getNutritionRepository();

// Forcer un type spécifique (pour tests)
const repo = await getNutritionRepository({ forceType: RepositoryType.MEMORY });

// Recréer l'instance
const repo = await getNutritionRepository({ recreate: true });
```

**Options** :
- `forceType` : `RepositoryType.INDEXEDDB | LOCALSTORAGE | MEMORY` (pour tests)
- `recreate` : `boolean` (recréer l'instance même si existe déjà)

**Retour** : `Promise<NutritionRepository>`

---

### Repository (Interface commune)

#### `get(store, key, options?)`

Récupère une entrée par clé.

```javascript
const dailyMeal = await repository.get('nutrition_dailyMeals', '2025-01-16', {
  skipCache: false,  // Bypasser le cache
  quiet: false       // Réduire les logs
});
```

**Options** :
- `skipCache` : `boolean` (bypasser le cache, défaut: `false`)
- `quiet` : `boolean` (réduire les logs, défaut: `false`)
- `operationName` : `string` (nom de l'opération pour logging)

**Retour** : `Promise<any|null>`

---

#### `getAll(store, options?)`

Récupère toutes les entrées d'un store.

```javascript
const allPrograms = await repository.getAll('nutrition_programs', {
  filters: (program) => program.isActive === true,  // Filtre personnalisé
  skipCache: false,
  quiet: false
});
```

**Options** :
- `filters` : `Function` (filtre personnalisé `(item) => boolean`)
- `skipCache` : `boolean`
- `quiet` : `boolean`
- `operationName` : `string`

**Retour** : `Promise<Array>`

---

#### `save(store, data, options?)`

Sauvegarde ou met à jour une entrée.

```javascript
await repository.save('nutrition_dailyMeals', {
  date: '2025-01-16',
  totalCalories: 2000,
  totalProtein: 150
}, {
  validate: true,   // Valider avec Zod (défaut: true)
  quiet: false
});
```

**Options** :
- `validate` : `boolean` (valider avec Zod, défaut: `true`)
- `quiet` : `boolean`
- `operationName` : `string`

**Retour** : `Promise<boolean>`

**Effets** :
- ✅ Invalide le cache automatiquement
- ✅ Notifie l'observer (synchronisation automatique)
- ✅ Valide avec Zod si `validate: true`

---

#### `delete(store, key, options?)`

Supprime une entrée.

```javascript
await repository.delete('nutrition_dailyMeals', '2025-01-16', {
  quiet: false
});
```

**Retour** : `Promise<boolean>`

**Effets** :
- ✅ Invalide le cache automatiquement
- ✅ Notifie l'observer avec `null` (synchronisation automatique)

---

#### `query(store, indexName, range, options?)`

Requête avec index.

```javascript
// Requête par index simple
const meals = await repository.query(
  'nutrition_meals',
  'date',
  IDBKeyRange.only('2025-01-16'),
  { quiet: false }
);

// Requête avec range
const meals = await repository.query(
  'nutrition_meals',
  'date',
  IDBKeyRange.bound('2025-01-16', '2025-01-20', false, false),
  { quiet: false }
);

// Requête avec index composé
const meals = await repository.query(
  'nutrition_meals',
  'date_type',
  IDBKeyRange.only(['2025-01-16', 'breakfast']),
  { quiet: false }
);
```

**Retour** : `Promise<Array>`

---

#### `batch(operations, options?)`

Exécute plusieurs opérations dans une transaction atomique.

```javascript
const result = await repository.batch([
  { type: 'save', store: 'nutrition_dailyMeals', data: { date: '2025-01-16', totalCalories: 2000 } },
  { type: 'save', store: 'nutrition_meals', data: { id: 'meal-1', date: '2025-01-16', type: 'breakfast', foods: [...] } },
  { type: 'delete', store: 'nutrition_meals', key: 'old-meal-id' },
  { type: 'get', store: 'nutrition_dailyMeals', key: '2025-01-17' }
], {
  validate: true,   // Valider toutes les données avant batch
  quiet: false
});

// Résultat : { success: boolean, results: Array }
```

**Types d'opérations** :
- `save` : `{ type: 'save', store: string, data: Object }`
- `delete` : `{ type: 'delete', store: string, key: string|number }`
- `get` : `{ type: 'get', store: string, key: string|number }`

**Options** :
- `validate` : `boolean` (valider toutes les données avant batch, défaut: `true`)
- `quiet` : `boolean`
- `operationName` : `string`

**Retour** : `Promise<{ success: boolean, results: Array }>`

**Bénéfices** :
- ✅ **Transaction atomique** : Tout ou rien
- ✅ **Performance** : Une seule transaction IndexedDB au lieu de N
- ✅ **Validation groupée** : Toutes les données validées avant exécution

**Limite** : Maximum 1000 opérations par batch (éviter freeze UI)

---

### Observer Pattern

#### `getRepositoryObserver()`

Obtient l'instance singleton de l'observer.

```javascript
import { getRepositoryObserver } from '@/services/nutrition/repository';

const observer = getRepositoryObserver();
```

---

#### `observer.subscribe(key, callback)`

S'abonne aux changements pour une clé.

```javascript
// Clé spécifique
const unsubscribe = observer.subscribe('dailyMeals:2025-01-16', (dailyMeal) => {
  setDailyMeal(dailyMeal);  // Mise à jour automatique
});

// Wildcard store (tous les dailyMeals)
const unsubscribe = observer.subscribe('dailyMeals:*', (dailyMeal) => {
  console.log('DailyMeal modifié:', dailyMeal);
});

// Wildcard global (tous les changements)
const unsubscribe = observer.subscribe('*:*', (data) => {
  console.log('Changement détecté:', data);
});

// Plus tard, se désabonner
unsubscribe();
```

**Clés de subscription** :
- `store:key` : Exemple `dailyMeals:2025-01-16` (changement spécifique)
- `store:*` : Exemple `dailyMeals:*` (tous les changements dailyMeals)
- `*:*` : Tous les changements (utiliser avec précaution)

**Retour** : `Function` (fonction unsubscribe)

---

#### `observer.unsubscribe(key, callback?)`

Se désabonne d'une clé.

```javascript
// Désabonner callback spécifique
observer.unsubscribe('dailyMeals:2025-01-16', callback);

// Désabonner tous les callbacks pour une clé
observer.unsubscribe('dailyMeals:2025-01-16');
```

---

### Hooks React (Observer)

#### `useRepositoryObserver(store, key, options?)`

Hook React pour s'abonner aux changements d'une entrée spécifique.

```javascript
import { useRepositoryObserver } from '@/services/nutrition/repository';

function MyComponent() {
  const dailyMeal = useRepositoryObserver('dailyMeals', '2025-01-16', {
    initialValue: null
  });

  // dailyMeal est automatiquement mis à jour quand l'entrée change
  return <div>{dailyMeal?.totalCalories}</div>;
}
```

**Options** :
- `initialValue` : `any` (valeur initiale si entrée inexistante)

**Retour** : `any|null` (données ou null)

---

#### `useDailyMeal(date, options?)`

Hook spécialisé pour dailyMeal.

```javascript
import { useDailyMeal } from '@/services/nutrition/repository';

function MyComponent() {
  const dailyMeal = useDailyMeal('2025-01-16');

  return <div>{dailyMeal?.totalCalories}</div>;
}
```

**Hooks spécialisés disponibles** :
- `useDailyMeal(date, options?)`
- `useMealsByDate(date, options?)`
- `useMeal(mealId, options?)`
- `useActiveProgram(options?)`
- `useHydrationLog(date, options?)`

---

## 📘 GUIDE D'UTILISATION

### Utilisation basique

```javascript
import { getNutritionRepository } from '@/services/nutrition/repository';

// Obtenir le repository
const repo = await getNutritionRepository();

// Récupérer une entrée
const dailyMeal = await repo.get('nutrition_dailyMeals', '2025-01-16');

// Sauvegarder
await repo.save('nutrition_dailyMeals', {
  date: '2025-01-16',
  totalCalories: 2000
});

// Supprimer
await repo.delete('nutrition_dailyMeals', '2025-01-16');
```

### Utilisation avec Observer (synchronisation automatique)

```javascript
import { useRepositoryObserver } from '@/services/nutrition/repository';

function NutritionJournal() {
  const date = '2025-01-16';
  
  // ✅ Synchronisation automatique : dailyMeal mis à jour automatiquement
  const dailyMeal = useRepositoryObserver('dailyMeals', date);
  
  // ✅ Pas besoin de useEffect pour recharger après save()
  // Le repository notifie automatiquement l'observer
  const handleSave = async () => {
    await repo.save('nutrition_dailyMeals', {
      ...dailyMeal,
      totalCalories: 2500
    });
    // ✅ dailyMeal sera automatiquement mis à jour dans le composant
  };
  
  return <div>{dailyMeal?.totalCalories}</div>;
}
```

### Utilisation avec batch operations

```javascript
// ✅ Performance : Une seule transaction au lieu de 3
const result = await repo.batch([
  { type: 'save', store: 'nutrition_dailyMeals', data: dailyMeal1 },
  { type: 'save', store: 'nutrition_meals', data: meal1 },
  { type: 'save', store: 'nutrition_meals', data: meal2 }
]);

if (result.success) {
  console.log('Batch réussi:', result.results);
}
```

### Utilisation avec filtres

```javascript
// Récupérer tous les programmes actifs
const activePrograms = await repo.getAll('nutrition_programs', {
  filters: (program) => program.isActive === true
});

// Récupérer tous les meals d'un jour
const meals = await repo.getAll('nutrition_meals', {
  filters: (meal) => meal.date === '2025-01-16'
});
```

---

## 🔄 GUIDE DE MIGRATION

### Migration depuis `nutritionDataCRUD.js`

#### Avant (code existant)

```javascript
import { getDailyMeal, saveDailyMeal } from '@/hooks/nutritionDataCRUD';

// Récupération
const dailyMeal = await getDailyMeal('2025-01-16');

// Sauvegarde
await saveDailyMeal({
  date: '2025-01-16',
  totalCalories: 2000
});
```

#### Après (avec Repository)

```javascript
import { getNutritionRepository } from '@/services/nutrition/repository';

const repo = await getNutritionRepository();

// Récupération
const dailyMeal = await repo.get('nutrition_dailyMeals', '2025-01-16');

// Sauvegarde
await repo.save('nutrition_dailyMeals', {
  date: '2025-01-16',
  totalCalories: 2000
});
```

**Note** : Les fonctions `nutritionDataCRUD.js` utilisent déjà le Repository en interne (migration progressive), donc le code existant continue de fonctionner. La migration vers l'API Repository directe est optionnelle mais recommandée pour bénéficier des nouvelles fonctionnalités (Observer, batch, etc.).

---

### Migration composants React

#### Avant (avec `useNutritionData`)

```javascript
import { useNutritionData } from '@/hooks/useNutritionData';

function MyComponent() {
  const { getDailyMeal, saveDailyMeal, dbReady } = useNutritionData();
  const [dailyMeal, setDailyMeal] = useState(null);
  
  useEffect(() => {
    if (dbReady) {
      getDailyMeal('2025-01-16').then(setDailyMeal);
    }
  }, [dbReady, getDailyMeal]);
  
  const handleSave = async () => {
    await saveDailyMeal({ ...dailyMeal, totalCalories: 2500 });
    // ❌ Besoin de recharger manuellement
    getDailyMeal('2025-01-16').then(setDailyMeal);
  };
  
  return <div>{dailyMeal?.totalCalories}</div>;
}
```

#### Après (avec Repository + Observer)

```javascript
import { useRepositoryObserver, getNutritionRepository } from '@/services/nutrition/repository';

function MyComponent() {
  // ✅ Synchronisation automatique : pas besoin de useEffect
  const dailyMeal = useRepositoryObserver('dailyMeals', '2025-01-16');
  
  const handleSave = async () => {
    const repo = await getNutritionRepository();
    await repo.save('nutrition_dailyMeals', {
      ...dailyMeal,
      totalCalories: 2500
    });
    // ✅ Pas besoin de recharger : dailyMeal mis à jour automatiquement
  };
  
  return <div>{dailyMeal?.totalCalories}</div>;
}
```

**Bénéfices** :
- ✅ **Moins de code** : Pas besoin de `useState` + `useEffect`
- ✅ **Synchronisation automatique** : Mise à jour automatique après save/delete
- ✅ **Moins de re-renders** : Seulement quand les données changent réellement

---

### Migration batch operations

#### Avant (opérations séquentielles)

```javascript
// ❌ 3 transactions IndexedDB séparées
await saveDailyMeal(dailyMeal1);
await saveMeal(meal1);
await saveMeal(meal2);
```

#### Après (batch atomique)

```javascript
// ✅ 1 transaction IndexedDB atomique
const repo = await getNutritionRepository();
await repo.batch([
  { type: 'save', store: 'nutrition_dailyMeals', data: dailyMeal1 },
  { type: 'save', store: 'nutrition_meals', data: meal1 },
  { type: 'save', store: 'nutrition_meals', data: meal2 }
]);
```

**Bénéfices** :
- ✅ **Performance** : ×3-10 plus rapide (1 transaction vs N)
- ✅ **Atomicité** : Tout ou rien (rollback automatique si erreur)
- ✅ **Validation groupée** : Toutes les données validées avant exécution

---

## 💡 BEST PRACTICES

### 1. Utiliser les hooks Observer pour synchronisation automatique

✅ **Bon** :
```javascript
const dailyMeal = useRepositoryObserver('dailyMeals', date);
// Synchronisation automatique
```

❌ **Éviter** :
```javascript
const [dailyMeal, setDailyMeal] = useState(null);
useEffect(() => {
  getDailyMeal(date).then(setDailyMeal);
}, [date]);
// Rechargement manuel nécessaire
```

---

### 2. Utiliser batch operations pour plusieurs opérations

✅ **Bon** :
```javascript
await repo.batch([
  { type: 'save', store: 'nutrition_dailyMeals', data: dailyMeal },
  { type: 'save', store: 'nutrition_meals', data: meal1 },
  { type: 'save', store: 'nutrition_meals', data: meal2 }
]);
```

❌ **Éviter** :
```javascript
await repo.save('nutrition_dailyMeals', dailyMeal);
await repo.save('nutrition_meals', meal1);
await repo.save('nutrition_meals', meal2);
```

---

### 3. Utiliser les filtres pour requêtes optimisées

✅ **Bon** :
```javascript
const activePrograms = await repo.getAll('nutrition_programs', {
  filters: (program) => program.isActive === true
});
```

❌ **Éviter** :
```javascript
const allPrograms = await repo.getAll('nutrition_programs');
const activePrograms = allPrograms.filter(p => p.isActive === true);
```

---

### 4. Gérer les erreurs avec try-catch

✅ **Bon** :
```javascript
try {
  await repo.save('nutrition_dailyMeals', dailyMeal);
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

### 5. Utiliser `quiet: true` pour réduire les logs en production

✅ **Bon** :
```javascript
await repo.save('nutrition_dailyMeals', dailyMeal, { quiet: true });
```

---

## 📝 EXEMPLES COMPLETS

### Exemple 1 : Composant avec synchronisation automatique

```javascript
import { useDailyMeal, getNutritionRepository } from '@/services/nutrition/repository';

function DailyMealEditor({ date }) {
  // ✅ Synchronisation automatique
  const dailyMeal = useDailyMeal(date);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const repo = await getNutritionRepository();
      await repo.save('nutrition_dailyMeals', {
        ...dailyMeal,
        totalCalories: 2500
      });
      // ✅ Pas besoin de recharger : dailyMeal mis à jour automatiquement
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!dailyMeal) {
    return <div>Chargement...</div>;
  }
  
  return (
    <div>
      <p>Calories: {dailyMeal.totalCalories}</p>
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}
```

---

### Exemple 2 : Batch operations avec validation

```javascript
import { getNutritionRepository } from '@/services/nutrition/repository';

async function saveMealWithDailyMeal(meal, dailyMeal) {
  const repo = await getNutritionRepository();
  
  // ✅ Transaction atomique : tout ou rien
  const result = await repo.batch([
    { type: 'save', store: 'nutrition_meals', data: meal },
    { type: 'save', store: 'nutrition_dailyMeals', data: dailyMeal }
  ], {
    validate: true,  // Valider toutes les données avant batch
    operationName: 'saveMealWithDailyMeal'
  });
  
  if (!result.success) {
    throw new Error('Erreur batch operations');
  }
  
  return result;
}
```

---

### Exemple 3 : Requête avec index composé

```javascript
import { getNutritionRepository } from '@/services/nutrition/repository';

async function getBreakfastMeals(date) {
  const repo = await getNutritionRepository();
  
  // ✅ Utiliser index composé pour performance optimale
  const meals = await repo.query(
    'nutrition_meals',
    'date_type',
    IDBKeyRange.only([date, 'breakfast']),
    { quiet: true }
  );
  
  return meals;
}
```

---

### Exemple 4 : Observer avec wildcard

```javascript
import { getRepositoryObserver } from '@/services/nutrition/repository';
import { useEffect } from 'react';

function useAllDailyMealsListener(callback) {
  const observer = getRepositoryObserver();
  
  useEffect(() => {
    // ✅ S'abonner à tous les changements dailyMeals
    const unsubscribe = observer.subscribe('dailyMeals:*', (dailyMeal) => {
      callback(dailyMeal);
    });
    
    return unsubscribe;  // Cleanup automatique
  }, [callback]);
}
```

---

## 🔧 TROUBLESHOOTING

### Problème : Repository retourne `null` après `save()`

**Cause** : Cache non invalidé ou transaction non complète.

**Solution** :
```javascript
// ✅ Attendre que la transaction soit complète
await repo.save('nutrition_dailyMeals', dailyMeal);
await new Promise(resolve => setTimeout(resolve, 50));

// Ou utiliser skipCache
const saved = await repo.get('nutrition_dailyMeals', date, { skipCache: true });
```

---

### Problème : Observer ne notifie pas

**Cause** : Clé de subscription incorrecte ou observer non initialisé.

**Solution** :
```javascript
// ✅ Vérifier la clé de subscription
import { getStoreName } from '@/services/nutrition/repository';

const storeName = getStoreName('dailyMeals');  // 'dailyMeals' → 'nutrition_dailyMeals'
const key = `${storeName}:${date}`;
observer.subscribe(key, callback);
```

---

### Problème : Batch operations échoue

**Cause** : Validation Zod échoue ou batch trop volumineux.

**Solution** :
```javascript
// ✅ Désactiver validation si nécessaire (non recommandé)
await repo.batch(operations, { validate: false });

// ✅ Vérifier taille batch
if (operations.length > 1000) {
  // Diviser en plusieurs batches
}
```

---

### Problème : Performance dégradée

**Cause** : Trop d'opérations individuelles au lieu de batch.

**Solution** :
```javascript
// ❌ Éviter
for (const meal of meals) {
  await repo.save('nutrition_meals', meal);
}

// ✅ Utiliser batch
await repo.batch(
  meals.map(meal => ({ type: 'save', store: 'nutrition_meals', data: meal }))
);
```

---

## 📊 MAPPING STORES

### Noms simplifiés → Noms réels IndexedDB

```javascript
import { getStoreName } from '@/services/nutrition/repository';

getStoreName('dailyMeals')      // → 'nutrition_dailyMeals'
getStoreName('meals')            // → 'nutrition_meals'
getStoreName('programs')         // → 'nutrition_programs'
getStoreName('favoriteFoods')    // → 'nutrition_favoriteFoods'
getStoreName('hydrationLog')     // → 'nutrition_hydrationLog'
```

**Utilisation** :
```javascript
const storeName = getStoreName('dailyMeals');
await repo.get(storeName, key);
```

---

## ✅ CHECKLIST MIGRATION

- [ ] Remplacer appels `nutritionDataCRUD` par Repository direct
- [ ] Utiliser hooks Observer pour synchronisation automatique
- [ ] Remplacer opérations séquentielles par batch operations
- [ ] Utiliser filtres pour requêtes optimisées
- [ ] Gérer erreurs avec try-catch approprié
- [ ] Tester rétrocompatibilité
- [ ] Vérifier performance (pas de régression)

---

## 📚 RESSOURCES

- **Plan détaillé** : `docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md`
- **Tests** : `src/services/nutrition/repository/__tests__/`
- **Code source** : `src/services/nutrition/repository/`

---

**Dernière mise à jour** : 2025-01-16  
**Version** : 1.0

