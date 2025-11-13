# 🏗️ ARCHITECTURE DE REFACTORING - ONGLET "AUJOURD'HUI"

## 📋 ANALYSE APPROFONDIE AVANT IMPLÉMENTATION

**Date :** 2025-01-03  
**Objectif :** Définir la meilleure architecture pour décomposer TodayTab.jsx (900 lignes) en composants modulaires, performants et maintenables.

---

## 🔍 ANALYSE DE L'EXISTANT

### Structure Actuelle de TodayTab.jsx

**Zones identifiées :**

1. **Logique métier (lignes 39-467)**
   - `getActiveChallenges()` : Filtrage des défis
   - `handleChallengeComplete()` : Validation de défi
   - `calculateAutoReps()` : Calcul automatique reps
   - `handleInputFocus()` : Auto-remplissage
   - `handleExerciseCheck()` : Toggle exercice + auto-reps
   - `updateLocalReps()` : Mise à jour reps locales
   - `toggleEtirement()` : Toggle étirements
   - `handleSaveExercises()` / `handleSaveStretches()` : Sauvegarde
   - `handleSessionFeedback()` : Calcul durée + préparation données

2. **Rendu conditionnel repos (lignes 469-504)**
   - Affichage jour de repos
   - Défis actifs même en repos

3. **Rendu principal (lignes 506-897)**
   - Header du workout (lignes 508-551)
   - Section exercices (lignes 553-707)
   - Section étirements (lignes 709-769)
   - Sessions d'endurance du jour (lignes 773-855)
   - Défis actifs (lignes 857-883)
   - Bouton feedback (lignes 885-895)

### Dependencies Identifiées

**Contexte :**
- `useWorkout()` : 37 propriétés/fonctions utilisées
- `workoutProgram` : Données statiques
- `getAutoWeekVariant` : Utilitaire date

**Composants UI existants :**
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`, `Input`, `Checkbox`
- `ChallengeCard`

**Système de toast :**
- ❌ **Aucun système global** - seulement `useToast` dans BodyTracking (local)
- ❌ `alert()` utilisé pour erreurs (lignes 313, 323)

---

## 🎯 ARCHITECTURE CIBLÉE

### Principe : Composition + Séparation des Responsabilités

```
TodayTab (Container - ~100 lignes)
├── WorkoutHeader (Affichage - ~50 lignes)
│   └── GymModeToggle (Affichage - ~30 lignes)
├── ExerciseSection (Container - ~80 lignes)
│   ├── ExerciseList (Affichage - ~60 lignes)
│   │   └── ExerciseItem (Affichage - ~40 lignes)
│   ├── ComplementaryActivity (Affichage - ~50 lignes)
│   └── SaveActions (Affichage - ~30 lignes)
├── StretchSection (Container - ~60 lignes)
│   ├── StretchList (Affichage - ~40 lignes)
│   └── SaveActions (Réutilisé)
├── EnduranceSessionsToday (Affichage - ~60 lignes)
├── ActiveChallenges (Affichage - ~40 lignes)
└── SessionFeedbackButton (Affichage - ~20 lignes)
```

### Hooks Personnalisés à Créer

1. **`useTodayWorkout()`**
   - Calcul workout du jour
   - Memoization `getAutoWeekVariant`
   - Gestion mode gym/salle

2. **`useExerciseTracking()`**
   - Gestion exercices (check, reps, auto-fill)
   - Gestion modifications temporaires
   - Sauvegarde/annulation

3. **`useStretchTracking()`**
   - Gestion étirements (check)
   - Gestion modifications temporaires
   - Sauvegarde/annulation

4. **`useActiveChallenges()`**
   - Filtrage défis actifs
   - Validation défi

5. **`useSessionDuration()`**
   - Calcul durée session
   - Préparation données feedback

### Utilitaires à Centraliser

1. **`utils/exerciseCalculations.js`**
   - `calculateAutoReps()` : Centraliser (actuellement dupliqué 4x)
   - `calculateSessionDuration()` : Extraire de TodayTab

2. **`utils/exerciseKeyGenerator.js`**
   - `generateExerciseKey()` : Génération clés cohérente
   - Support variantes semaine A/B

### Système de Toast Global

**Créer :** `components/ui/Toast/` système réutilisable
- `ToastProvider` : Context global
- `useToast` : Hook global
- `ToastContainer` : Affichage toasts
- Types : success, error, warning, info

---

## 📐 DÉCISIONS ARCHITECTURALES

### 1. STRATÉGIE DE DÉCOMPOSITION

**Approche choisie :** **Composition progressive**

**Raison :**
- Permet de refactorer progressivement
- Chaque composant reste testable isolément
- Pas de breaking change majeur

**Ordre d'implémentation :**
1. Créer système toast global (nécessaire pour feedback)
2. Extraire utilitaires (calculs, clés)
3. Créer hooks personnalisés
4. Extraire composants d'affichage
5. Refactorer TodayTab en container léger

### 2. GESTION D'ÉTAT

**Approche :** **Context + Hooks locaux**

**Raison :**
- État global reste dans WorkoutContext
- État local (UI) dans composants
- Hooks encapsulent logique métier

**Pattern :**
```javascript
// Hook encapsule logique
const useExerciseTracking = () => {
  const { data, updateTempExerciseData, getCurrentData } = useWorkout();
  
  const handleCheck = (exerciseId, date) => {
    // Logique encapsulée
  };
  
  return { handleCheck, ... };
};

// Composant utilise hook
const ExerciseItem = ({ exercise }) => {
  const { handleCheck } = useExerciseTracking();
  // ...
};
```

### 3. MEMOIZATION STRATÉGIE

**Mémoizer :**
- ✅ `getAutoWeekVariant(currentDate)` → `useMemo`
- ✅ `getTodayWorkout(currentDate, isGymMode)` → `useMemo`
- ✅ `getActiveChallenges()` → `useMemo`
- ✅ `calculateSessionDuration()` → `useMemo` ou `useCallback`
- ✅ `ExerciseItem` → `React.memo` (si props stables)

**Ne pas mémoizer :**
- ❌ `handleExerciseCheck` : Callback, pas calcul coûteux
- ❌ `updateLocalReps` : Callback, pas calcul coûteux

**Critère :** Mémoizer seulement si :
- Calcul coûteux (regex, boucles)
- Utilisé plusieurs fois dans le render
- Props/deps stables

### 4. PERFORMANCE

**Optimisations prévues :**
1. **React.memo** pour composants d'affichage purs
2. **useMemo** pour calculs dérivés
3. **useCallback** pour callbacks passés en props
4. **Lazy loading** optionnel (si bundle trop gros)

**Cible :** < 16ms pour render initial (60 FPS)

---

## 🎨 SYSTÈME DE TOAST

### Architecture

```
ToastProvider (Context)
├── useToast (Hook)
│   ├── showSuccess(message)
│   ├── showError(message, details?)
│   ├── showWarning(message)
│   └── showInfo(message)
└── ToastContainer (Component)
    └── Toast (Component individuel)
```

### Design

**Inspiration :** Système existant dans BodyTracking mais :
- ✅ Généralisé pour toute l'app
- ✅ Position fixe (top-right)
- ✅ Auto-dismiss (3-5s)
- ✅ Stacking (max 3 visibles)
- ✅ Animations fluides (fade in/out, slide)

### Implémentation

**Fichiers :**
- `src/components/ui/Toast/ToastProvider.jsx`
- `src/components/ui/Toast/useToast.jsx`
- `src/components/ui/Toast/ToastContainer.jsx`
- `src/components/ui/Toast/Toast.jsx`
- `src/components/ui/Toast/index.js` (barrel export)

**Intégration :**
- Provider au niveau App.jsx
- Hook utilisable partout
- Remplacement `alert()` par `showError()`

---

## 📦 STRUCTURE DES NOUVEAUX FICHIERS

### Composants

```
src/components/tabs/TodayTab/
├── TodayTab.jsx (Container principal)
├── components/
│   ├── WorkoutHeader.jsx
│   ├── GymModeToggle.jsx
│   ├── ExerciseSection.jsx
│   ├── ExerciseList.jsx
│   ├── ExerciseItem.jsx
│   ├── ComplementaryActivity.jsx
│   ├── StretchSection.jsx
│   ├── StretchList.jsx
│   ├── StretchItem.jsx
│   ├── EnduranceSessionsToday.jsx
│   ├── ActiveChallenges.jsx
│   ├── SessionFeedbackButton.jsx
│   └── SaveActions.jsx
└── RestDayView.jsx
```

### Hooks

```
src/components/tabs/TodayTab/hooks/
├── useTodayWorkout.js
├── useExerciseTracking.js
├── useStretchTracking.js
├── useActiveChallenges.js
└── useSessionDuration.js
```

### Utilitaires

```
src/utils/
├── exerciseCalculations.js (nouveau)
└── exerciseKeyGenerator.js (nouveau)
```

---

## ✅ CHECKLIST DE VALIDATION

### Fonctionnalités
- [ ] Tous les exercices s'affichent correctement
- [ ] Auto-remplissage fonctionne
- [ ] Mode gym/salle bascule correctement
- [ ] Sauvegarde/annulation fonctionne
- [ ] Feedback utilisateur (toast) fonctionne
- [ ] Défis actifs s'affichent
- [ ] Sessions endurance s'affichent
- [ ] Calcul durée session fonctionne

### Performance
- [ ] Render initial < 16ms
- [ ] Pas de re-render inutiles
- [ ] Memoization efficace

### Code Quality
- [ ] Aucune duplication
- [ ] Composants < 150 lignes
- [ ] TodayTab < 200 lignes
- [ ] Tests unitaires (si temps)

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1 : Fondations (Jour 1)
1. Créer système toast global
2. Centraliser `calculateAutoReps`
3. Créer `exerciseKeyGenerator`
4. Créer `useTodayWorkout` hook

### Phase 2 : Extraction Logique (Jour 2)
1. Créer `useExerciseTracking` hook
2. Créer `useStretchTracking` hook
3. Créer `useActiveChallenges` hook
4. Créer `useSessionDuration` hook

### Phase 3 : Composants Affichage (Jour 3)
1. Créer `WorkoutHeader` + `GymModeToggle`
2. Créer `ExerciseItem` + `ExerciseList`
3. Créer `ComplementaryActivity`
4. Créer `StretchItem` + `StretchList`
5. Créer `SaveActions` réutilisable

### Phase 4 : Assemblage (Jour 4)
1. Créer `ExerciseSection` container
2. Créer `StretchSection` container
3. Créer `EnduranceSessionsToday`
4. Créer `ActiveChallenges`
5. Refactorer `TodayTab` en container

### Phase 5 : Optimisation (Jour 5)
1. Ajouter memoization
2. Optimiser re-renders
3. Tests manuels complets
4. Documentation

---

## 📝 NOTES IMPORTANTES

### Rétrocompatibilité
- ✅ Aucune breaking change pour l'utilisateur
- ✅ API WorkoutContext inchangée
- ✅ Structure données inchangée

### Tests
- Tests manuels pour chaque composant
- Vérification edge cases (mode gym, variantes, etc.)
- Test performance (DevTools Profiler)

### Documentation
- JSDoc pour chaque hook
- Commentaires pour logique complexe
- README pour structure TodayTab

---

**Dernière mise à jour :** 2025-01-03  
**Statut :** Architecture définie, prêt pour implémentation Phase 1










