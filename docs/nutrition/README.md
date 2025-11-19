# 🥗 Onglet Nutrition - Documentation Complète

> **Système complet de suivi nutritionnel avec IA, gamification, et analyses avancées**  
> **Version** : 1.0  
> **Date** : 2025-01-16  
> **Note d'évaluation** : **81/100** ✅

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Architecture](#architecture)
4. [Installation & Configuration](#installation--configuration)
5. [Utilisation](#utilisation)
6. [API & Services](#api--services)
7. [Performance & Optimisations](#performance--optimisations)
8. [Tests](#tests)
9. [Contribution](#contribution)
10. [Ressources](#ressources)

---

## 🎯 Vue d'Ensemble

L'onglet Nutrition est un système complet de suivi nutritionnel intégré à l'application Workout Tracker. Il permet de :

- ✅ **Suivre quotidiennement** les repas, calories, macros et hydratation
- ✅ **Créer et suivre des programmes** nutritionnels personnalisés
- ✅ **Analyser les tendances** et corrélations avec les données Garmin
- ✅ **Recevoir des recommandations** intelligentes via système expert
- ✅ **Gamifier l'expérience** avec badges, XP et streaks
- ✅ **Scanner des codes-barres** pour recherche automatique d'aliments
- ✅ **Reconnaître des aliments** via photos (TensorFlow.js)
- ✅ **Partager avec un coach** via liens sécurisés
- ✅ **Prédire l'évolution** du poids via ML (TensorFlow.js)

### Technologies Clés

- **React** : Composants UI modulaires et performants
- **IndexedDB** : Stockage persistant côté client (11 stores)
- **Zod** : Validation type-safe à runtime
- **TensorFlow.js** : Reconnaissance d'images et prédictions ML
- **Web Workers** : Calculs lourds non-bloquants
- **Repository Pattern** : Abstraction de l'accès aux données
- **Observer Pattern** : Synchronisation automatique des données

---

## ✨ Fonctionnalités

### 📝 Journal Nutritionnel

- **Saisie de repas** : Ajout rapide avec recherche d'aliments (OpenFoodFacts, USDA)
- **Totaux journaliers** : Calories, protéines, glucides, lipides avec conformité programme
- **Suivi hydratation** : Tracker d'eau avec objectifs personnalisés
- **Historique** : Navigation par date avec préchargement intelligent

### 📊 Programmes Nutritionnels

- **Création de programmes** : Objectifs (bulk, cut, maintain, recomp) avec macros cibles
- **Suivi de conformité** : Score de conformité quotidien (≥80% = score 100)
- **Activation/désactivation** : Un seul programme actif à la fois
- **Historique** : Visualisation de l'évolution sur période

### 📈 Analyses Avancées

- **Conformité programme** : Évolution sur période avec graphiques
- **Bilan calorique** : Calories consommées vs dépensées (intégration Garmin)
- **Tendances** : Évolution macros, calories, hydratation
- **Corrélations** : Relations entre nutrition et performance (Garmin)
- **Chronobiologie** : Analyse du timing optimal des repas
- **Score santé globale** : Indicateur composite de santé nutritionnelle
- **Prédictions** : Prédiction poids via ML (TensorFlow.js)

### 🤖 Recommandations Intelligentes

- **Système expert** : Règles-based (0 MB, <1ms, 100% fiable)
- **Priorisation** : High / Medium / Low selon impact
- **Catégories** : Protéines, calories, hydratation, timing, macros, variété
- **Conseils personnalisés** : Basés sur données réelles et objectifs

### 🎮 Gamification

- **Badges** : 50+ badges (consistency, nutrition, progression, performance)
- **XP & Niveaux** : Système de progression avec formule exponentielle
- **Streaks** : Séries avec forgiveness (2 jours tolérés, anti-burnout)
- **Défis quotidiens** : Objectifs journaliers pour engagement

### 🔍 Recherche & Intégrations

- **OpenFoodFacts** : 350,000+ produits français (code-barres, recherche)
- **USDA** : 350,000+ aliments américains (rotation clés API)
- **Scanner code-barres** : Quagga2 avec fallback manuel
- **Reconnaissance photo** : TensorFlow.js MobileNet (détection aliments)
- **Saisie vocale** : Web Speech API avec parsing intelligent

### 🔗 Partage & Collaboration

- **Partage avec coach** : Liens sécurisés avec QR codes
- **Coach Dashboard** : Vue lecture seule pour coach
- **Photos de progression** : Avant/après avec slider temporel
- **Export/Import** : JSON compressé avec métadonnées complètes

---

## 🏗️ Architecture

### Structure Modulaire

```
src/
├── components/tabs/nutrition/
│   ├── components/          # Composants UI (25+ composants)
│   │   ├── NutritionJournal.jsx
│   │   ├── NutritionPrograms.jsx
│   │   ├── NutritionAnalyses.jsx
│   │   └── ...
│   └── NutritionTab.jsx      # Composant principal
├── hooks/
│   ├── useNutritionData.js          # Hook principal
│   ├── nutritionDataCRUD.js          # CRUD operations
│   ├── nutritionCalculations.js      # Calculs nutritionnels
│   └── ...
├── services/nutrition/
│   ├── repository/                  # Repository Pattern
│   │   ├── IndexedDBRepository.js
│   │   ├── repositoryFactory.js
│   │   └── repositoryObserver.js
│   ├── nutritionGamification.js     # Gamification
│   ├── nutritionExpertSystem.js     # Système expert
│   ├── nutritionSharing.js          # Partage coach
│   └── ...
├── config/
│   └── nutrition.config.js          # Configuration centralisée
└── constants/
    └── nutrition.constants.js        # Constantes
```

### Couches d'Architecture

```
┌─────────────────────────────────────────┐
│     UI Layer (React Components)        │
│  NutritionTab, NutritionJournal, etc.  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Hooks Layer (React Hooks)           │
│  useNutritionData, useRepositoryObserver│
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Services Layer (Business Logic)     │
│  Repository, Gamification, Expert, etc. │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Storage Layer (IndexedDB)           │
│  11 Stores: dailyMeals, meals, etc.     │
└─────────────────────────────────────────┘
```

### Diagrammes Architecture

Voir [DIAGRAMMES_ARCHITECTURE.md](./DIAGRAMMES_ARCHITECTURE.md) pour :
- Architecture globale
- Flux de données
- Repository Pattern
- Observer Pattern
- Cache multi-layer

---

## ⚙️ Installation & Configuration

### Prérequis

- Node.js 18+
- npm ou yarn
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

### Configuration

La configuration est centralisée dans `src/config/nutrition.config.js` :

```javascript
import { NutritionConfig } from '@/config/nutrition.config';

// Valeurs par défaut
NutritionConfig.defaults.targetCalories;  // 2500
NutritionConfig.defaults.targetProtein;   // 150g

// Feature flags
NutritionConfig.features.enableWebWorkers;      // true
NutritionConfig.features.enablePrefetching;     // true
NutritionConfig.features.enableCalculationCache; // true

// Performance
NutritionConfig.performance.debounceSave;       // 300ms
NutritionConfig.performance.prefetchDaysRange;   // 1 jour
```

### IndexedDB

L'onglet Nutrition utilise `WorkoutTrackerDB` (version 10) avec 11 stores :

- `nutrition_dailyMeals` : Totaux journaliers
- `nutrition_meals` : Repas individuels
- `nutrition_programs` : Programmes nutritionnels
- `nutrition_favoriteFoods` : Aliments favoris
- `nutrition_hydrationLog` : Logs hydratation
- `nutrition_gamification` : Badges, XP, streaks
- `nutrition_shareLinks` : Liens de partage
- `nutrition_progressPhotos` : Photos avant/après
- `nutrition_mlModels` : Modèles ML entraînés
- `nutrition_apiCache` : Cache API externes
- `nutrition_mealPhotos` : Photos de repas

---

## 📖 Utilisation

### Journal Nutritionnel

```jsx
import { NutritionJournal } from '@/components/tabs/nutrition/components/NutritionJournal';

<NutritionJournal
  selectedDate={date}
  onDateChange={setDate}
  nutritionData={nutritionData}
  garminData={garminData}
/>
```

### Hook Principal

```javascript
import { useNutritionData } from '@/hooks/useNutritionData';

const {
  dbReady,
  getDailyMeal,
  saveDailyMeal,
  saveMeal,
  getMealsByDate,
  calculateDailyTotals,
  // ... autres méthodes
} = useNutritionData();
```

### Repository Pattern

```javascript
import { getNutritionRepository } from '@/services/nutrition/repository';

const repo = await getNutritionRepository();

// Récupérer une entrée
const dailyMeal = await repo.get('nutrition_dailyMeals', '2025-01-16');

// Sauvegarder
await repo.save('nutrition_dailyMeals', {
  date: '2025-01-16',
  totalCalories: 2000
});

// Batch operations
await repo.batch([
  { type: 'save', store: 'nutrition_dailyMeals', data: dailyMeal },
  { type: 'save', store: 'nutrition_meals', data: meal }
]);
```

### Observer Pattern (Synchronisation Automatique)

```javascript
import { useRepositoryObserver } from '@/services/nutrition/repository';

// Synchronisation automatique : dailyMeal mis à jour automatiquement
const dailyMeal = useRepositoryObserver('dailyMeals', '2025-01-16');

// Pas besoin de useEffect : mise à jour automatique après save()
```

---

## 🔌 API & Services

### Services Principaux

#### Repository Pattern

- **IndexedDBRepository** : Implémentation principale (production)
- **LocalStorageRepository** : Fallback si IndexedDB indisponible
- **MemoryRepository** : Pour tests unitaires
- **RepositoryFactory** : Détection automatique + singleton
- **RepositoryObserver** : Synchronisation automatique des changements

#### Services Métier

- **nutritionGamification** : Badges, XP, streaks
- **nutritionExpertSystem** : Recommandations règles-based
- **nutritionSharing** : Partage coach avec encryption
- **nutritionPredictions** : Prédictions ML (TensorFlow.js)
- **nutritionChronobiology** : Analyse timing optimal
- **nutritionHealthScore** : Score santé globale

#### Intégrations API

- **openFoodFactsService** : API OpenFoodFacts (350,000+ produits)
- **usdaService** : API USDA (350,000+ aliments)
- **barcodeScanner** : Scanner code-barres (Quagga2)

### Documentation API

Voir [PHASE_12_2_DOCUMENTATION_MIGRATION.md](./PHASE_12_2_DOCUMENTATION_MIGRATION.md) pour :
- API Reference complète
- Guide d'utilisation
- Guide de migration
- Best practices

---

## ⚡ Performance & Optimisations

### Optimisations Implémentées

1. **Cache Multi-Layer**
   - L1 (Memory) : ~0ms, reset au rechargement
   - L2 (IndexedDB) : ~10ms, TTL 24h
   - L3 (API) : ~200ms, cache persistant

2. **Lazy Loading**
   - Sections chargées à la demande (React.lazy)
   - Modèles ML chargés uniquement au premier usage
   - Images compressées différées (Web Workers)

3. **Virtual Scrolling**
   - Grille badges virtualisée (>20 badges)
   - Réduction 85-90% éléments DOM

4. **Debouncing**
   - Sauvegardes : 300ms
   - Recherches : 300ms
   - Préchargement : 2s initial delay

5. **Web Workers**
   - Calculs lourds non-bloquants
   - Fallback automatique si non supporté

6. **Batch Operations**
   - Transactions atomiques (×10 plus rapide)
   - Limite : 1000 opérations par batch

7. **Observer Pattern**
   - Synchronisation automatique
   - Moins de re-renders (seulement si données changent)

### Métriques de Performance

- **Temps chargement initial** : ~40% amélioration (lazy loading)
- **Temps rendu badges** : 75-80% amélioration (virtual scrolling)
- **Réduction re-renders** : 50-80% (React.memo, Observer)
- **Économie requêtes IndexedDB** : 70-90% (cache)

---

## 🧪 Tests

### Tests Unitaires

- ✅ `nutritionCalculations.test.js` : 37 tests (calculs nutritionnels)
- ✅ `nutritionDataCRUD.test.js` : 32 tests (CRUD operations)
- ✅ `repositoryFactory.test.js` : Tests factory pattern
- ✅ `repositoryObserver.test.js` : Tests observer pattern
- ✅ `IndexedDBRepository.test.js` : Tests repository complet
- ✅ `repositoryIntegration.test.js` : Tests intégration Repository + Observer

### Tests d'Intégration

- ⏳ Flow complet sauvegarde (en attente)
- ⏳ Tests E2E (en attente)

### Exécution Tests

```bash
# Tous les tests nutrition
npm run test -- src/**/nutrition/**/*.test.js

# Tests spécifiques
npm run test -- src/hooks/__tests__/nutritionCalculations.test.js
```

---

## 🤝 Contribution

### Guide de Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour :
- Standards de code
- Processus de review
- Conventions de nommage
- Structure des commits

### Principes de Développement

1. **Performance First** : Chaque implémentation optimisée
2. **Type Safety** : Validation Zod partout
3. **Modularité** : Code modulaire et réutilisable
4. **Documentation** : Code auto-documenté (JSDoc)
5. **Tests** : Tests unitaires pour logique critique

---

## 📚 Ressources

### Documentation

- [ARCHITECTURE_NUTRITION.md](./ARCHITECTURE_NUTRITION.md) : Architecture détaillée
- [DIAGRAMMES_ARCHITECTURE.md](./DIAGRAMMES_ARCHITECTURE.md) : Diagrammes architecture
- [EVALUATION_CRITIQUE_NUTRITION.md](./EVALUATION_CRITIQUE_NUTRITION.md) : Évaluation complète
- [SUIVI_IMPLEMENTATION_AMELIORATIONS.md](./SUIVI_IMPLEMENTATION_AMELIORATIONS.md) : Suivi des améliorations
- [PHASE_12_2_DOCUMENTATION_MIGRATION.md](./PHASE_12_2_DOCUMENTATION_MIGRATION.md) : Guide Repository Pattern

### APIs Externes

- [OpenFoodFacts](https://world.openfoodfacts.org/) : Base de données produits alimentaires
- [USDA FoodData Central](https://fdc.nal.usda.gov/) : Base de données nutriments
- [TensorFlow.js](https://www.tensorflow.org/js) : ML dans le navigateur

### Outils

- [Quagga2](https://github.com/ericblade/quagga2) : Scanner code-barres
- [Recharts](https://recharts.org/) : Graphiques React
- [Zod](https://zod.dev/) : Validation type-safe

---

## 📊 Statistiques

- **Composants UI** : 25+
- **Hooks React** : 15+
- **Services** : 20+
- **Stores IndexedDB** : 11
- **Badges** : 50+
- **Tests unitaires** : 100+
- **Note d'évaluation** : **81/100** ✅

---

## 🎯 Roadmap

### Complété (Phases 0-12.3)

- ✅ Structure IndexedDB
- ✅ Composants UI
- ✅ Intégrations API
- ✅ Système expert
- ✅ Gamification
- ✅ Scanner code-barres
- ✅ Reconnaissance photo
- ✅ Partage coach
- ✅ Prédictions ML
- ✅ Repository Pattern
- ✅ Configuration centralisée

### En Cours

- 🚧 Phase 12.4 : Documentation complète (ce document)

### À Venir

- ⏳ Tests d'intégration complets
- ⏳ Tests E2E
- ⏳ Optimistic locking
- ⏳ Gestion offline/online avancée
- ⏳ Monitoring/analytics

---

**Dernière mise à jour** : 2025-01-16  
**Version** : 1.0  
**Mainteneurs** : Équipe Workout Tracker

