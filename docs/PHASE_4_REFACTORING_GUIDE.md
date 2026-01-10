# 🔧 PHASE 4 - GUIDE DE REFACTORING

**Date :** 2025-01-09  
**Objectif :** Refactoriser les fichiers longs, extraire la logique métier, créer des hooks personnalisés

---

## 📊 FICHIERS IDENTIFIÉS POUR REFACTORING

### 🔴 CRITIQUE (>2000 lignes)

1. **`src/context/WorkoutContext.jsx`** : **3062 lignes** ❌
   - **Problème :** God Object anti-pattern
   - **Impact :** Re-renders de toute l'app, impossible à maintenir
   - **Solution :** Découper en contextes spécialisés

2. **`src/components/tabs/BooksTab.jsx`** : **2347 lignes** ❌
   - **Problème :** Fichier monolithique
   - **Impact :** Maintenabilité difficile, tests impossibles
   - **Solution :** Découper en sous-composants et hooks

### 🟠 HAUTE PRIORITÉ (>1000 lignes)

3. **`src/components/tabs/QuestsTab.jsx`** : **1674 lignes** ⚠️
   - **Problème :** Trop de responsabilités
   - **Impact :** Maintenabilité moyenne
   - **Solution :** Extraire la logique métier

---

## 🎯 STRATÉGIE DE REFACTORING

### 1. WorkoutContext.jsx (3062 lignes)

**Structure cible :**
```
src/context/workout/
├── WorkoutDataContext.jsx      // Données brutes seulement
├── WorkoutActionsContext.jsx    // Actions (CRUD)
├── WorkoutCalculationsContext.jsx // Calculs et statistiques
├── WorkoutUIStateContext.jsx    // État UI (modales, etc.)
└── index.js                     // Export unifié
```

**Avantages :**
- ✅ Séparation des responsabilités
- ✅ Re-renders ciblés (seulement composants concernés)
- ✅ Code-splitting possible
- ✅ Tests unitaires facilités

---

### 2. BooksTab.jsx (2347 lignes)

**Structure cible :**
```
src/components/tabs/BooksTab/
├── BooksTab.jsx                 // Container principal (100 lignes)
├── components/
│   ├── BookLibrary.jsx          // Vue bibliothèque
│   ├── BookStatistics.jsx       // Vue statistiques
│   ├── BookForm.jsx             // Formulaire livre
│   ├── SessionForm.jsx          // Formulaire session
│   └── BookCard.jsx             // Carte livre
├── hooks/
│   ├── useBookFilters.js        // Logique filtres
│   ├── useBookActions.js        // Actions CRUD
│   ├── useBookStorage.js        // Gestion stockage
│   └── useBookCover.js          // Gestion couvertures
└── utils/
    ├── bookCalculations.js      // Calculs (progression, etc.)
    └── bookExportImport.js      // Export/Import
```

**Avantages :**
- ✅ Fichiers < 500 lignes
- ✅ Responsabilités claires
- ✅ Réutilisabilité
- ✅ Tests facilités

---

### 3. QuestsTab.jsx (1674 lignes)

**Structure cible :**
```
src/components/tabs/QuestsTab/
├── QuestsTab.jsx                // Container principal (150 lignes)
├── components/
│   ├── QuestsListView.jsx      // Liste quêtes
│   ├── QuestsFilters.jsx         // Filtres
│   ├── QuestForm.jsx             // Formulaire quête
│   └── QuestsActions.jsx        // Actions en lot
├── hooks/
│   ├── useQuestsFilters.js      // Logique filtres
│   ├── useQuestsActions.js      // Actions CRUD
│   └── useQuestsSort.js         // Logique tri
└── utils/
    └── questCalculations.js     // Calculs XP, etc.
```

**Avantages :**
- ✅ Fichiers < 400 lignes
- ✅ Logique métier extraite
- ✅ Composants réutilisables

---

## 📝 PATRONS DE REFACTORING

### Pattern 1 : Extraction de Hook Personnalisé

**Avant :**
```javascript
// Dans le composant (200 lignes)
const [filters, setFilters] = useState({...});
const [sort, setSort] = useState({...});
const filteredData = useMemo(() => {
  // 50 lignes de logique
}, [filters, sort]);
```

**Après :**
```javascript
// Hook personnalisé
const useDataFilters = (data) => {
  const [filters, setFilters] = useState({...});
  const [sort, setSort] = useState({...});
  const filteredData = useMemo(() => {
    // Logique extraite
  }, [data, filters, sort]);
  return { filters, setFilters, sort, setSort, filteredData };
};

// Dans le composant (10 lignes)
const { filters, setFilters, filteredData } = useDataFilters(data);
```

---

### Pattern 2 : Extraction de Composant

**Avant :**
```javascript
// Dans le composant (500 lignes)
return (
  <div>
    {/* 200 lignes de JSX */}
    <div className="filters">
      {/* 100 lignes */}
    </div>
    <div className="list">
      {/* 200 lignes */}
    </div>
  </div>
);
```

**Après :**
```javascript
// Composants séparés
const FiltersSection = ({ filters, onFilterChange }) => {
  // 100 lignes
};

const ListSection = ({ items, onItemClick }) => {
  // 200 lignes
};

// Dans le composant principal (50 lignes)
return (
  <div>
    <FiltersSection filters={filters} onFilterChange={setFilters} />
    <ListSection items={filteredData} onItemClick={handleClick} />
  </div>
);
```

---

### Pattern 3 : Extraction de Logique Métier

**Avant :**
```javascript
// Dans le composant
const calculateStats = (data) => {
  // 100 lignes de calculs
  const total = data.reduce(...);
  const average = total / data.length;
  // ...
  return { total, average, ... };
};
```

**Après :**
```javascript
// utils/calculations.js
export const calculateStats = (data) => {
  // 100 lignes de calculs
  return { total, average, ... };
};

// Dans le composant
import { calculateStats } from './utils/calculations';
const stats = useMemo(() => calculateStats(data), [data]);
```

---

## ✅ CHECKLIST DE REFACTORING

### Pour chaque fichier long :

- [ ] Identifier les responsabilités distinctes
- [ ] Extraire les hooks personnalisés
- [ ] Extraire les composants enfants
- [ ] Extraire la logique métier dans utils/
- [ ] Créer des fichiers de tests unitaires
- [ ] Documenter les nouvelles structures
- [ ] Vérifier que tout fonctionne
- [ ] Mettre à jour les imports

---

## 🎯 PRIORISATION

### Priorité 1 : WorkoutContext.jsx
- **Impact :** Critique (affecte toute l'app)
- **Effort :** 4-6h
- **Bénéfice :** Performance +50%, Maintenabilité +60%

### Priorité 2 : BooksTab.jsx
- **Impact :** Élevé (affecte l'onglet Livres)
- **Effort :** 3-4h
- **Bénéfice :** Maintenabilité +45%, Testabilité +70%

### Priorité 3 : QuestsTab.jsx
- **Impact :** Modéré (affecte l'onglet Quêtes)
- **Effort :** 2-3h
- **Bénéfice :** Maintenabilité +35%, Testabilité +50%

---

## 📚 RESSOURCES

- [React Patterns - Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Refactoring Guru - Extract Method](https://refactoring.guru/extract-method)
- [Clean Code - Single Responsibility](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

---

**Note :** Le refactoring doit être progressif et testé à chaque étape pour éviter les régressions.
