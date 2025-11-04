# 🎯 PLAN PHASE 4 - REFACTORING TODAYTAB EN CONTAINER LÉGER

## 📋 OBJECTIF

Transformer `TodayTab.jsx` (actuellement ~912 lignes) en un container léger (~200-300 lignes) qui orchestre tous les composants et hooks créés dans les phases précédentes, **SANS introduire d'erreurs**.

---

## 🔍 ANALYSE DE L'EXISTANT

### Structure Actuelle de TodayTab.jsx

**Lignes 1-50 : Imports et hooks**
- Imports React, composants UI, contexte, utilitaires
- `useWorkout()` avec ~37 propriétés/fonctions
- `useToast()` pour feedback utilisateur
- Fonctions locales nombreuses

**Lignes 50-470 : Logique métier** ⚠️ **À REMPLACER**
- `getActiveChallenges()` → ✅ Remplacé par `useActiveChallenges` hook
- `handleChallengeComplete()` → ✅ À garder mais simplifier
- `calculateAutoReps()` → ✅ Déjà centralisé dans `utils/exerciseCalculations.js`
- `handleInputFocus()` → ✅ Déjà dans `ExerciseItem` component
- `handleExerciseCheck()` → ✅ Remplacé par `useExerciseTracking` hook
- `updateLocalReps()` → ✅ Remplacé par `useExerciseTracking` hook
- `toggleEtirement()` → ✅ Remplacé par `useStretchTracking` hook
- `handleSaveExercises()` / `handleSaveStretches()` → ✅ À garder mais simplifier
- `handleSessionFeedback()` → ✅ À garder mais simplifier (utiliser `useSessionDuration`)

**Lignes 470-515 : Rendu jour de repos** ⚠️ **À REMPLACER**
- ✅ Remplacé par `RestDayView` component

**Lignes 515-720 : Rendu principal** ⚠️ **À REMPLACER**
- Header workout (lignes 520-563) → ✅ Remplacé par `WorkoutHeader` + `GymModeToggle`
- Section exercices (lignes 565-719) → ✅ Remplacé par `ExerciseList` + `SaveActions`
- Section étirements (lignes 721-781) → ✅ Remplacé par `StretchSection`
- Sessions endurance (lignes 785-867) → ✅ Remplacé par `EnduranceSessionsToday`
- Défis actifs (lignes 869-895) → ✅ Remplacé par `ActiveChallenges`
- Bouton feedback (lignes 897-907) → ✅ À garder mais simplifier

---

## ⚠️ RISQUES IDENTIFIÉS ET SOLUTIONS

### 🚨 RISQUE 1 : Erreurs d'import de hooks

**Problème potentiel :**
- Les hooks sont dans `./hooks/` mais les imports peuvent échouer
- Pattern d'import incohérent peut causer des erreurs Vite/esbuild
- Espaces dans le chemin "workout tracker" peuvent causer des problèmes

**Solution :**
1. ✅ **Vérifier le pattern d'import utilisé dans les composants existants**
   - `ExerciseItem.jsx` : `import { useExerciseTracking } from '../hooks/useExerciseTracking';`
   - `ActiveChallenges.jsx` : `import { useActiveChallenges } from '../hooks/useActiveChallenges';`
   - **Pattern correct** : Import direct depuis le fichier avec chemin relatif

2. ✅ **Utiliser le même pattern pour tous les hooks**
   ```javascript
   // ✅ CORRECT (pattern utilisé partout)
   import { useTodayWorkout } from './hooks/useTodayWorkout';
   import { useExerciseTracking } from './hooks/useExerciseTracking';
   import { useStretchTracking } from './hooks/useStretchTracking';
   import { useActiveChallenges } from './hooks/useActiveChallenges';
   import { useSessionDuration } from './hooks/useSessionDuration';
   
   // ❌ ÉVITER (barrel export peut causer des problèmes)
   import { useTodayWorkout } from './hooks';
   ```

3. ✅ **Vérifier les exports dans chaque hook**
   - Chaque hook doit exporter avec `export const` ou `export default`
   - Vérifier que les exports correspondent aux imports

### 🚨 RISQUE 2 : Dépendances manquantes dans les composants

**Problème potentiel :**
- Les composants utilisent des hooks qui nécessitent des props/contextes
- Oubli de passer des props nécessaires aux composants enfants

**Solution :**
1. ✅ **Créer un mapping props → composants**
   - Lister toutes les props nécessaires pour chaque composant
   - Vérifier que toutes sont disponibles dans TodayTab

2. ✅ **Vérifier les dépendances de chaque hook**
   - `useTodayWorkout` : Nécessite `useWorkout()` context
   - `useExerciseTracking` : Nécessite `useWorkout()` + `useTodayWorkout()`
   - `useStretchTracking` : Nécessite `useWorkout()`
   - `useActiveChallenges` : Nécessite `useWorkout()`
   - `useSessionDuration` : Nécessite `useWorkout()` + `useTodayWorkout()`

### 🚨 RISQUE 3 : Perte de fonctionnalités

**Problème potentiel :**
- Certaines fonctions locales peuvent avoir une logique unique
- Les handlers peuvent nécessiter des données spécifiques

**Solution :**
1. ✅ **Audit complet des handlers**
   - Comparer chaque handler avec l'implémentation dans les hooks/composants
   - Vérifier que toute la logique est préservée

2. ✅ **Créer des handlers de transition**
   - Si une fonctionnalité n'est pas encore dans un hook, créer un handler local temporaire
   - Documenter les handlers à migrer plus tard

### 🚨 RISQUE 4 : Erreurs de props/types

**Problème potentiel :**
- Props manquantes ou incorrectes passées aux composants
- Types de données incorrects

**Solution :**
1. ✅ **Vérifier chaque prop passée**
   - Créer une checklist pour chaque composant
   - Vérifier les types attendus vs types fournis

2. ✅ **Tester progressivement**
   - Intégrer un composant à la fois
   - Tester après chaque intégration

---

## 📐 ARCHITECTURE CIBLE

### Structure Finale de TodayTab.jsx

```javascript
// ===== IMPORTS =====
// React + hooks
// Contexte (useWorkout, useToast)
// Hooks personnalisés (useTodayWorkout, useExerciseTracking, etc.)
// Composants UI (Card, Button, etc.)
// Composants modulaires (WorkoutHeader, ExerciseList, etc.)
// Utilitaires (getDateStr, etc.)

// ===== COMPOSANT PRINCIPAL =====
const TodayTab = () => {
  // 1. Hooks context
  const { ... } = useWorkout();
  const { ... } = useToast();
  
  // 2. Hooks personnalisés
  const { workout, dateStr, weekVariant, hasGymVariants } = useTodayWorkout({ date: currentDate, isGymMode });
  const activeChallenges = useActiveChallenges({ date: currentDate });
  const sessionDuration = useSessionDuration({ date: currentDate, isGymMode });
  
  // 3. Handlers simplifiés
  const handleChallengeComplete = useCallback(...);
  const handleSessionFeedback = useCallback(...);
  const handleSaveExercises = useCallback(...);
  const handleSaveStretches = useCallback(...);
  
  // 4. Rendu conditionnel jour de repos
  if (!workout.exercices || workout.exercices.length === 0) {
    return <RestDayView activeChallenges={activeChallenges} onChallengeComplete={handleChallengeComplete} />;
  }
  
  // 5. Rendu principal
  return (
    <div>
      <WorkoutHeader ... />
      <ExerciseSection ... />
      <StretchSection ... />
      <EnduranceSessionsToday date={currentDate} />
      <ActiveChallenges date={currentDate} onChallengeComplete={handleChallengeComplete} />
      <SessionFeedbackButton ... />
    </div>
  );
};
```

---

## 🎯 PLAN D'EXÉCUTION ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Préparation et Vérification (15 min)

**Actions :**
1. ✅ Vérifier que tous les composants sont créés et fonctionnels
2. ✅ Vérifier que tous les hooks sont créés et fonctionnels
3. ✅ Créer une sauvegarde de `TodayTab.jsx` actuel
4. ✅ Vérifier les patterns d'import dans les composants existants

**Checklist :**
- [ ] Tous les composants dans `components/` existent
- [ ] Tous les hooks dans `hooks/` existent
- [ ] Backup de `TodayTab.jsx` créé
- [ ] Pattern d'import identifié et documenté

### ÉTAPE 2 : Nettoyage des Imports (5 min)

**Actions :**
1. ✅ Supprimer les imports inutiles (composants/fonctions déplacés)
2. ✅ Ajouter les imports des nouveaux composants
3. ✅ Ajouter les imports des hooks personnalisés
4. ✅ Vérifier que tous les imports sont corrects

**Imports à supprimer :**
- `calculateAutoReps` (déjà dans ExerciseItem)
- `getAutoWeekVariant` (déjà dans useTodayWorkout)
- Composants UI utilisés uniquement dans les composants modulaires

**Imports à ajouter :**
```javascript
// Hooks personnalisés
import { useTodayWorkout } from './hooks/useTodayWorkout';
import { useExerciseTracking } from './hooks/useExerciseTracking';
import { useStretchTracking } from './hooks/useStretchTracking';
import { useActiveChallenges } from './hooks/useActiveChallenges';
import { useSessionDuration } from './hooks/useSessionDuration';

// Composants modulaires
import WorkoutHeader from './components/WorkoutHeader';
import ExerciseList from './components/ExerciseList';
import SaveActions from './components/SaveActions';
import StretchSection from './components/StretchSection';
import RestDayView from './components/RestDayView';
import ActiveChallenges from './components/ActiveChallenges';
import EnduranceSessionsToday from './components/EnduranceSessionsToday';
```

### ÉTAPE 3 : Remplacement Logique Métier par Hooks (20 min)

**Actions :**
1. ✅ Remplacer `getActiveChallenges()` par `useActiveChallenges()`
2. ✅ Supprimer `calculateAutoReps()` (déjà dans utils)
3. ✅ Supprimer `handleInputFocus()` (déjà dans ExerciseItem)
4. ✅ Supprimer `handleExerciseCheck()` (déjà dans useExerciseTracking)
5. ✅ Supprimer `updateLocalReps()` (déjà dans useExerciseTracking)
6. ✅ Supprimer `toggleEtirement()` (déjà dans useStretchTracking)

**Code à supprimer :**
```javascript
// ❌ SUPPRIMER (lignes ~43-67)
const getActiveChallenges = () => { ... };

// ❌ SUPPRIMER (lignes ~170-188)
const handleInputFocus = (exerciseId, exercise) => { ... };

// ❌ SUPPRIMER (lignes ~190-256)
const handleExerciseCheck = (exerciseId, date) => { ... };

// ❌ SUPPRIMER (lignes ~258-281)
const updateLocalReps = (exerciseId, reps, date) => { ... };

// ❌ SUPPRIMER (lignes ~284-297)
const toggleEtirement = (type, date) => { ... };
```

**Code à ajouter :**
```javascript
// ✅ AJOUTER au début du composant
const { workout, dateStr, dayName, weekVariant, hasGymVariants } = useTodayWorkout({
  date: currentDate,
  isGymMode
});

const activeChallenges = useActiveChallenges({ date: currentDate });
const sessionDuration = useSessionDuration({ date: currentDate, isGymMode });
```

### ÉTAPE 4 : Simplification Handlers (15 min)

**Actions :**
1. ✅ Simplifier `handleChallengeComplete` (utiliser activeChallenges du hook)
2. ✅ Simplifier `handleSessionFeedback` (utiliser sessionDuration du hook)
3. ✅ Simplifier `handleSaveExercises` (garder la logique mais simplifier)
4. ✅ Simplifier `handleSaveStretches` (garder la logique mais simplifier)

**Code à modifier :**
```javascript
// ✅ SIMPLIFIER (lignes ~70-150)
const handleChallengeComplete = useCallback(async (challengeId, completionData) => {
  // Utiliser activeChallenges du hook au lieu de getActiveChallenges()
  const challenge = activeChallenges.find(c => c.id === challengeId);
  // ... reste de la logique
}, [activeChallenges, ...]);

// ✅ SIMPLIFIER (lignes ~359-471)
const handleSessionFeedback = useCallback(() => {
  // Utiliser sessionDuration du hook au lieu de calculateSessionDuration()
  const duration = sessionDuration;
  // ... reste de la logique
}, [sessionDuration, ...]);
```

### ÉTAPE 5 : Remplacement Rendu Jour de Repos (5 min)

**Actions :**
1. ✅ Remplacer le bloc if (!workout.exercices) par `<RestDayView />`

**Code à remplacer :**
```javascript
// ❌ SUPPRIMER (lignes ~481-515)
if (!workout.exercices || workout.exercices.length === 0) {
  const activeChallenges = getActiveChallenges();
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* ... tout le JSX ... */}
    </div>
  );
}

// ✅ REMPLACER PAR
if (!workout.exercices || workout.exercices.length === 0) {
  return (
    <RestDayView
      activeChallenges={activeChallenges}
      onChallengeComplete={handleChallengeComplete}
    />
  );
}
```

### ÉTAPE 6 : Remplacement Header Workout (10 min)

**Actions :**
1. ✅ Remplacer le bloc header par `<WorkoutHeader />`

**Code à remplacer :**
```javascript
// ❌ SUPPRIMER (lignes ~520-563)
<div className={`p-6 rounded-lg ...`}>
  <h2>{workout.name}</h2>
  {/* ... */}
</div>

// ✅ REMPLACER PAR
<WorkoutHeader
  workout={workout}
  hasGymVariants={hasGymVariants}
  isGymMode={isGymMode}
  setIsGymMode={setIsGymMode}
  weekVariant={weekVariant}
  showWeekVariant={data.weekVariant ? true : false}
/>
```

### ÉTAPE 7 : Remplacement Section Exercices (15 min)

**Actions :**
1. ✅ Remplacer la section exercices par `<ExerciseList />` + `<SaveActions />`

**Code à remplacer :**
```javascript
// ❌ SUPPRIMER (lignes ~565-719)
<div className="bg-slate-800/80 ...">
  <h3>Exercices</h3>
  <div className="space-y-3">
    {workout.exercices.map((exercise) => (
      // ... tout le JSX ...
    ))}
  </div>
  {/* Boutons sauvegarde */}
</div>

// ✅ REMPLACER PAR
<div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
    Exercices
  </h3>
  <ExerciseList
    exercises={workout.exercices}
    complementaryActivity={workout.complementaryActivity}
    date={currentDate}
    isGymMode={isGymMode}
    onShowVariations={(exercise) => {
      setSelectedExercise(exercise);
      setShowExerciseVariations(true);
    }}
  />
  <SaveActions
    hasUnsavedChanges={hasUnsavedExercises}
    onSave={handleSaveExercises}
    onDiscard={handleDiscardExercises}
  />
</div>
```

### ÉTAPE 8 : Remplacement Section Étirements (5 min)

**Actions :**
1. ✅ Remplacer la section étirements par `<StretchSection />`

**Code à remplacer :**
```javascript
// ❌ SUPPRIMER (lignes ~721-781)
{workout.etirements && (
  <div className="bg-slate-800/80 ...">
    {/* ... tout le JSX ... */}
  </div>
)}

// ✅ REMPLACER PAR
<StretchSection
  stretches={workout.etirements}
  date={currentDate}
  hasUnsavedChanges={hasUnsavedStretches}
  onSave={handleSaveStretches}
  onDiscard={handleDiscardStretches}
/>
```

### ÉTAPE 9 : Remplacement Sessions Endurance (5 min)

**Actions :**
1. ✅ Remplacer le bloc sessions endurance par `<EnduranceSessionsToday />`

**Code à remplacer :**
```javascript
// ❌ SUPPRIMER (lignes ~785-867)
{(() => {
  const enduranceData = data?.enduranceData || {};
  // ... tout le code ...
})()}

// ✅ REMPLACER PAR
<EnduranceSessionsToday date={currentDate} />
```

### ÉTAPE 10 : Remplacement Défis Actifs (5 min)

**Actions :**
1. ✅ Remplacer le bloc défis actifs par `<ActiveChallenges />`

**Code à remplacer :**
```javascript
// ❌ SUPPRIMER (lignes ~869-895)
{(() => {
  const activeChallenges = getActiveChallenges();
  // ... tout le JSX ...
})()}

// ✅ REMPLACER PAR
<ActiveChallenges
  date={currentDate}
  onChallengeComplete={handleChallengeComplete}
/>
```

### ÉTAPE 11 : Simplification Bouton Feedback (5 min)

**Actions :**
1. ✅ Simplifier le bouton feedback (utiliser sessionDuration du hook)

**Code à modifier :**
```javascript
// ✅ GARDER mais simplifier handleSessionFeedback
// Utiliser sessionDuration du hook au lieu de calculateSessionDuration()
```

### ÉTAPE 12 : Nettoyage Final (10 min)

**Actions :**
1. ✅ Supprimer toutes les fonctions locales inutilisées
2. ✅ Supprimer tous les imports inutilisés
3. ✅ Vérifier la cohérence du code
4. ✅ Ajouter useCallback sur tous les handlers

**Vérifications :**
- [ ] Aucune fonction locale inutilisée
- [ ] Aucun import inutilisé
- [ ] Tous les handlers sont useCallback
- [ ] Code formaté et lisible

---

## ✅ CHECKLIST DE VALIDATION

### Avant de Commencer
- [ ] Backup de `TodayTab.jsx` créé
- [ ] Tous les composants testés individuellement
- [ ] Tous les hooks testés individuellement
- [ ] Pattern d'import identifié

### Après Chaque Étape
- [ ] Linter passe sans erreurs
- [ ] Application compile sans erreurs
- [ ] Fonctionnalité testée manuellement

### Après Refactoring Complet
- [ ] TodayTab.jsx < 300 lignes
- [ ] Aucune duplication de code
- [ ] Tous les composants utilisés correctement
- [ ] Tous les hooks utilisés correctement
- [ ] Performance préservée (pas de régression)
- [ ] Fonctionnalités préservées (test manuel complet)

---

## 🧪 TESTS À EFFECTUER

### Tests Fonctionnels
1. ✅ **Jour de repos** : Affiche RestDayView avec défis actifs
2. ✅ **Mode gym** : Toggle fonctionne, variante semaine affichée
3. ✅ **Exercices** : Check/uncheck fonctionne, auto-reps fonctionne
4. ✅ **Étirements** : Check/uncheck fonctionne
5. ✅ **Sauvegarde** : Boutons Enregistrer/Annuler fonctionnent
6. ✅ **Défis** : Affichage et validation fonctionnent
7. ✅ **Sessions endurance** : Affichage correct
8. ✅ **Feedback session** : Bouton et modal fonctionnent

### Tests de Performance
1. ✅ Render initial < 16ms
2. ✅ Pas de re-renders inutiles
3. ✅ Memoization fonctionne

### Tests de Compatibilité
1. ✅ Tous les navigateurs supportés
2. ✅ Mobile responsive
3. ✅ Accessibilité (ARIA)

---

## 📝 NOTES IMPORTANTES

### Ordre d'Exécution
**NE PAS** faire toutes les modifications en une fois. Procéder étape par étape :
1. Faire une étape
2. Tester
3. Vérifier linter
4. Passer à l'étape suivante

### Gestion des Erreurs
Si une erreur survient :
1. Revenir à l'état précédent (git ou backup)
2. Identifier la cause
3. Corriger
4. Reprendre

### Pattern d'Import
**TOUJOURS** utiliser le pattern direct :
```javascript
// ✅ CORRECT
import { useTodayWorkout } from './hooks/useTodayWorkout';

// ❌ ÉVITER
import { useTodayWorkout } from './hooks';
```

### Dépendances des Hooks
Vérifier que tous les hooks ont accès aux dépendances nécessaires :
- `useWorkout()` context
- `currentDate`
- `isGymMode`
- `data`

---

## 🎯 RÉSULTAT ATTENDU

### Avant
- ~912 lignes
- Logique métier mélangée avec UI
- Duplication de code
- Difficile à maintenir

### Après
- ~200-300 lignes
- Container léger orchestrant composants
- Code modulaire et maintenable
- Performance optimisée

---

**Dernière mise à jour :** 2025-01-04  
**Statut :** Planification complète, prêt pour exécution

