# 🔍 Analyse Profonde - Onglet Statistiques Avancées

## 📋 Résumé Exécutif

L'onglet "Statistiques Avancées" présente des **incohérences critiques** dans le calcul et l'affichage des données. Cette analyse identifie les problèmes à la source et propose des solutions complètes pour garantir la cohérence et la précision des statistiques.

**Date d'analyse** : 2025-11-06  
**Composant analysé** : `src/components/AdvancedStats.jsx`  
**Source des données** : `getWorkoutHistory()` depuis `WorkoutContext`

---

## 🚨 Problèmes Identifiés

### 1. **CRITIQUE : Concaténation de Chaînes au Lieu d'Addition de Nombres**

#### Symptôme
- **Répétitions totales** : `517128100035322730710005102100002641061004301003076378` (nombre énorme et concaténé)
- Les valeurs débordent dans d'autres champs (Intensité moyenne, Durée moyenne)

#### Cause Racine
**Fichier** : `src/components/AdvancedStats.jsx` (lignes 201, 218)

```javascript
// ❌ PROBLÈME : e.reps peut être une chaîne, causant une concaténation
totalReps: currentPeriodData.reduce((sum, w) => 
  sum + (w.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0), 0
),
```

**Explication** :
- Si `e.reps` est une chaîne (ex: `"100"`), JavaScript fait `"0" + "100" + "50" = "010050"` au lieu de `0 + 100 + 50 = 150`
- Le problème se propage à travers tous les calculs qui dépendent de `totalReps`

#### Impact
- **Sévérité** : 🔴 CRITIQUE
- Toutes les métriques dépendantes sont fausses
- L'affichage devient illisible
- Les tendances sont incorrectes

---

### 2. **CRITIQUE : Calcul des Tendances Toujours à +100%**

#### Symptôme
- Toutes les tendances affichent `+100.0%` même quand les performances baissent
- Contradiction : "En baisse" mais toutes les tendances sont positives

#### Cause Racine
**Fichier** : `src/components/AdvancedStats.jsx` (lignes 23-26)

```javascript
const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0; // ❌ PROBLÈME ICI
  return ((current - previous) / previous) * 100;
};
```

**Explication** :
- Si `previousStats.totalReps = 0` (période précédente sans données), la fonction retourne toujours `100`
- Cela se produit souvent lors de la première utilisation ou après une période sans activité
- Le calcul ne distingue pas entre "nouvelle activité" et "amélioration réelle"

#### Impact
- **Sévérité** : 🔴 CRITIQUE
- Les utilisateurs ne peuvent pas faire confiance aux tendances
- Fausse impression de progression constante

---

### 3. **CRITIQUE : Répartition Musculaire à 0.0%**

#### Symptôme
- Tous les groupes musculaires affichent `0.0%` malgré 13 séances et 86 sets enregistrés

#### Cause Racine
**Fichier** : `src/components/AdvancedStats.jsx` (lignes 74-111)

```javascript
const getMuscleDistribution = (data) => {
  const distribution = {};
  data.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      const exerciseName = exercise.name || exercise.nom || 'Exercice inconnu';
      // ❌ PROBLÈME : Mapping basique par nom d'exercice
      // Si les noms ne correspondent pas exactement, tout va dans "Autre"
      let muscle = 'Autre';
      
      if (exerciseName.toLowerCase().includes('pompe') || ...) {
        muscle = 'Pectoraux';
      }
      // ...
      
      distribution[muscle] = (distribution[muscle] || 0) + (exercise.reps || 0);
      // ❌ PROBLÈME : Si exercise.reps est une chaîne, addition échoue
    });
  });
  // ...
};
```

**Problèmes identifiés** :
1. **Mapping trop restrictif** : Seuls quelques mots-clés sont reconnus
2. **Pas de référence à la base de données d'exercices** : Ne utilise pas `exerciseDatabase.js` qui contient les groupes musculaires réels
3. **Type de données** : Si `exercise.reps` est une chaîne, l'addition échoue silencieusement

#### Impact
- **Sévérité** : 🟡 MOYENNE
- Fonctionnalité inutilisable pour l'analyse
- Perte d'information précieuse pour l'utilisateur

---

### 4. **MOYEN : Meilleure Performance avec Valeurs Irréalistes**

#### Symptôme
- Meilleure performance : `3071000 reps` (3,071,000 répétitions) - irréaliste pour une séance

#### Cause Racine
**Fichier** : `src/components/AdvancedStats.jsx` (lignes 53-72)

```javascript
const getBestPerformanceDay = (data) => {
  return data.reduce((best, current) => {
    const currentReps = current.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0;
    // ❌ PROBLÈME : Si e.reps est une chaîne concaténée, le total est énorme
    const currentScore = (currentReps * currentIntensity) + (currentExerciseCount * 10);
    // ...
  });
};
```

**Explication** :
- Si `totalReps` est une chaîne concaténée (ex: `"100200300"`), le calcul du score devient énorme
- La sélection de la meilleure performance est donc biaisée

#### Impact
- **Sévérité** : 🟡 MOYENNE
- Affichage de données irréalistes
- Perte de crédibilité

---

### 5. **MOYEN : Contradiction Tendance vs Progression**

#### Symptôme
- Tendance de progression : "En baisse" (rouge)
- Mais toutes les métriques individuelles : `+100.0%` (vert)

#### Cause Racine
**Fichier** : `src/components/AdvancedStats.jsx` (lignes 128-142)

```javascript
const getProgressTrend = (data) => {
  if (!data || data.length < 2) return 'stable';
  
  const recent = data.slice(-5);
  const older = data.slice(-10, -5);
  
  const recentAvg = recent.reduce((sum, w) => 
    sum + (w.exercises?.reduce((s, e) => s + (e.reps || 0), 0) || 0), 0) / recent.length;
  // ❌ PROBLÈME : Si reps est une chaîne, le calcul est faux
  
  // ...
  if (change > 10) return 'improving';
  if (change < -10) return 'declining';
  return 'stable';
};
```

**Explication** :
- `getProgressTrend` utilise les 10 dernières séances de `workoutData` complet
- `calculateChange` utilise les périodes `current` vs `previous` basées sur `selectedPeriod`
- Les deux calculs peuvent donner des résultats contradictoires

#### Impact
- **Sévérité** : 🟡 MOYENNE
- Confusion pour l'utilisateur
- Manque de cohérence dans l'interface

---

## 🔬 Analyse Technique Détaillée

### Structure des Données

#### Source : `getWorkoutHistory()` (WorkoutContext.jsx)

```javascript
// Structure retournée par getWorkoutHistory()
[
  {
    date: "2025-11-06",
    dayName: "mercredi",
    exercises: [
      {
        id: "1",
        name: "Pompes",
        reps: 100,  // ⚠️ PEUT ÊTRE UNE CHAÎNE OU UN NOMBRE
        completed: true,
        // ...
      }
    ],
    totalReps: 100,  // ⚠️ PEUT ÊTRE UNE CHAÎNE
    // ...
  }
]
```

#### Problèmes de Type de Données

1. **`exercise.reps`** peut être :
   - `number` : ✅ Correct
   - `string` : ❌ Problème (concaténation)
   - `undefined` : ✅ Géré avec `|| 0`
   - `null` : ✅ Géré avec `|| 0`

2. **`workout.totalReps`** peut être :
   - Calculé dans `getWorkoutHistory()` (ligne 800)
   - Mais si les `exercise.reps` sont des chaînes, le calcul est faux

### Flux de Données

```
WorkoutContext.getCurrentData()
  ↓
  currentData.reps (object avec clés "YYYY-MM-DD_exerciseId")
  ↓
  getWorkoutHistory()
  ↓
  Structure workoutData avec exercises[]
  ↓
  AdvancedStats.jsx
  ↓
  Calculs des statistiques
  ↓
  Affichage
```

**Points de défaillance** :
1. Conversion `reps` en nombre dans `getWorkoutHistory()`
2. Validation des types dans `AdvancedStats.jsx`
3. Calculs avec opérateurs numériques

---

## ✅ Solutions Proposées

### Solution 1 : Normalisation des Types de Données

#### Fichier : `src/components/AdvancedStats.jsx`

**Ajouter une fonction utilitaire de normalisation** :

```javascript
// ✅ NOUVEAU : Fonction de normalisation des répétitions
const normalizeReps = (reps) => {
  if (reps === null || reps === undefined) return 0;
  if (typeof reps === 'number') {
    return isNaN(reps) ? 0 : Math.max(0, Math.floor(reps));
  }
  if (typeof reps === 'string') {
    const parsed = parseInt(reps, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  return 0;
};

// ✅ NOUVEAU : Fonction de normalisation pour un exercice
const normalizeExercise = (exercise) => {
  return {
    ...exercise,
    reps: normalizeReps(exercise.reps)
  };
};

// ✅ NOUVEAU : Fonction de normalisation pour un workout
const normalizeWorkout = (workout) => {
  return {
    ...workout,
    exercises: (workout.exercises || []).map(normalizeExercise),
    totalReps: normalizeReps(workout.totalReps)
  };
};
```

**Modifier le useMemo des stats** :

```javascript
const stats = useMemo(() => {
  if (!workoutData || workoutData.length === 0) return null;

  // ✅ NOUVEAU : Normaliser toutes les données en entrée
  const normalizedData = workoutData.map(normalizeWorkout);

  // ... reste du code avec normalizedData au lieu de workoutData
  const currentPeriodData = normalizedData.filter(w => new Date(w.date) >= currentPeriodStart);
  const previousPeriodData = normalizedData.filter(w => 
    new Date(w.date) >= previousPeriodStart && new Date(w.date) < currentPeriodStart
  );

  // ✅ CORRECTION : Utiliser Number() pour forcer la conversion
  const currentStats = {
    totalWorkouts: currentPeriodData.length,
    totalReps: currentPeriodData.reduce((sum, w) => {
      const workoutReps = w.exercises?.reduce((s, e) => {
        return s + normalizeReps(e.reps);
      }, 0) || 0;
      return sum + workoutReps;
    }, 0),
    // ...
  };
}, [workoutData, selectedPeriod]);
```

---

### Solution 2 : Amélioration du Calcul des Tendances

#### Fichier : `src/components/AdvancedStats.jsx`

**Modifier `calculateChange`** :

```javascript
// ✅ CORRECTION : Calcul de changement amélioré
const calculateChange = (current, previous) => {
  // Normaliser les valeurs
  const currentNum = Number(current) || 0;
  const previousNum = Number(previous) || 0;
  
  // Cas spéciaux
  if (previousNum === 0 && currentNum === 0) return 0;
  if (previousNum === 0 && currentNum > 0) {
    // Nouvelle activité : retourner un pourcentage raisonnable
    // Au lieu de toujours 100%, retourner "N/A" ou un indicateur spécial
    return null; // Sera géré dans l'affichage
  }
  
  const change = ((currentNum - previousNum) / previousNum) * 100;
  
  // Limiter les valeurs extrêmes (plus de 1000% ou moins de -100%)
  return Math.max(-100, Math.min(1000, change));
};

// ✅ NOUVEAU : Formatage amélioré avec gestion des cas spéciaux
const formatChange = (change) => {
  if (change === null || change === undefined) {
    return (
      <div className="flex items-center gap-1 text-slate-400">
        <span className="text-sm font-medium">N/A</span>
      </div>
    );
  }
  
  const isPositive = change > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon size={14} />
      <span className="text-sm font-medium">
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  );
};
```

---

### Solution 3 : Répartition Musculaire avec Base de Données

#### Fichier : `src/components/AdvancedStats.jsx`

**Importer la base de données d'exercices** :

```javascript
import { findExerciseInDatabase } from '../../data/exerciseDatabase';
```

**Modifier `getMuscleDistribution`** :

```javascript
// ✅ CORRECTION : Utiliser la base de données d'exercices
const getMuscleDistribution = (data) => {
  const distribution = {};
  
  data.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      // ✅ NOUVEAU : Chercher dans la base de données d'abord
      const exerciseName = exercise.name || exercise.nom || 'Exercice inconnu';
      
      let muscle = 'Autre';
      
      // Priorité 1 : Chercher dans la base de données par nom
      const dbExercise = findExerciseInDatabase(exerciseName);
      if (dbExercise) {
        // Utiliser la catégorie ou le premier muscle primaire
        if (dbExercise.category) {
          muscle = dbExercise.category;
        } else if (dbExercise.primaryMuscles && dbExercise.primaryMuscles.length > 0) {
          muscle = dbExercise.primaryMuscles[0];
        }
      }
      
      // Priorité 2 : Fallback sur le mapping par nom (amélioré)
      if (muscle === 'Autre') {
        const nameLower = exerciseName.toLowerCase();
        
        // ✅ CORRECTION : Mapping amélioré avec correspondance aux catégories de la base de données
        // Note : Les catégories dans exerciseDatabase sont : "Pectoraux", "Dorsaux", "Jambes", "Biceps", "Triceps", "Épaules", "Abdominaux", "Cardio", etc.
        const muscleMappings = {
          'Pectoraux': ['pompe', 'pec', 'développé', 'bench', 'chest', 'push-up', 'pushup', 'fly', 'écarté'],
          'Dorsaux': ['traction', 'dos', 'back', 'row', 'lat', 'pull', 'tirage', 'rowing'],
          'Jambes': ['squat', 'jambe', 'leg', 'fente', 'lunge', 'calf', 'mollet', 'soulevé', 'deadlift'],
          'Biceps': ['curl', 'bicep', 'biceps', 'flexion'],
          'Triceps': ['tricep', 'triceps', 'dips', 'extension', 'répulsion'],
          'Épaules': ['épaule', 'shoulder', 'press', 'élévation', 'lateral', 'deltoïde'],
          'Abdominaux': ['abdo', 'planche', 'gainage', 'crunch', 'sit-up', 'core', 'abdominal']
        };
        
        for (const [muscleGroup, keywords] of Object.entries(muscleMappings)) {
          if (keywords.some(keyword => nameLower.includes(keyword))) {
            muscle = muscleGroup;
            break;
          }
        }
      }
      
      // ✅ CORRECTION : Utiliser normalizeReps
      const reps = normalizeReps(exercise.reps);
      distribution[muscle] = (distribution[muscle] || 0) + reps;
    });
  });
  
  const total = Object.values(distribution).reduce((sum, reps) => sum + reps, 0);
  
  return Object.entries(distribution)
    .map(([muscle, reps]) => ({
      muscle,
      reps,
      percentage: total > 0 ? (reps / total) * 100 : 0
    }))
    .sort((a, b) => b.reps - a.reps);
};
```

---

### Solution 4 : Cohérence Tendance vs Progression

#### Fichier : `src/components/AdvancedStats.jsx`

**Modifier `getProgressTrend` pour utiliser les mêmes périodes** :

```javascript
// ✅ CORRECTION : Utiliser les mêmes périodes que les autres calculs
const getProgressTrend = (currentPeriodData, previousPeriodData) => {
  if (!currentPeriodData || currentPeriodData.length < 2) {
    // Si pas assez de données dans la période actuelle, comparer avec précédente
    if (!previousPeriodData || previousPeriodData.length === 0) {
      return 'stable';
    }
    // Si période actuelle vide mais précédente a des données → déclin
    return 'declining';
  }
  
  // Calculer la moyenne des 5 dernières séances de la période actuelle
  const recent = currentPeriodData.slice(-5);
  const older = currentPeriodData.length >= 10 
    ? currentPeriodData.slice(-10, -5)
    : previousPeriodData.slice(-5) || [];
  
  if (older.length === 0) {
    return 'stable'; // Pas de comparaison possible
  }
  
  const recentAvg = recent.reduce((sum, w) => {
    const workoutReps = w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0;
    return sum + workoutReps;
  }, 0) / recent.length;
  
  const olderAvg = older.reduce((sum, w) => {
    const workoutReps = w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0;
    return sum + workoutReps;
  }, 0) / older.length;
  
  if (olderAvg === 0) return recentAvg > 0 ? 'improving' : 'stable';
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 10) return 'improving';
  if (change < -10) return 'declining';
  return 'stable';
};
```

**Modifier l'appel dans le useMemo** :

```javascript
const stats = useMemo(() => {
  // ...
  
  const currentStats = {
    // ...
    progressTrend: getProgressTrend(currentPeriodData, previousPeriodData), // ✅ CORRECTION
    // ...
  };
}, [workoutData, selectedPeriod]);
```

---

### Solution 5 : Validation et Logging

#### Fichier : `src/components/AdvancedStats.jsx`

**Ajouter une validation en mode développement** :

```javascript
// ✅ NOUVEAU : Validation des données en mode développement
const validateWorkoutData = (workoutData) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  workoutData.forEach((workout, index) => {
    if (!workout.exercises || !Array.isArray(workout.exercises)) {
      console.warn(`[AdvancedStats] Workout ${index} has invalid exercises:`, workout);
      return;
    }
    
    workout.exercises.forEach((exercise, exIndex) => {
      if (typeof exercise.reps !== 'number' && typeof exercise.reps !== 'string') {
        console.warn(`[AdvancedStats] Exercise ${exIndex} in workout ${index} has invalid reps:`, exercise);
      }
      
      if (typeof exercise.reps === 'string' && isNaN(parseInt(exercise.reps, 10))) {
        console.warn(`[AdvancedStats] Exercise ${exIndex} in workout ${index} has non-numeric string reps:`, exercise.reps);
      }
    });
  });
};

// Appeler dans le useMemo
const stats = useMemo(() => {
  if (!workoutData || workoutData.length === 0) return null;
  
  // ✅ NOUVEAU : Valider les données
  validateWorkoutData(workoutData);
  
  // ... reste du code
}, [workoutData, selectedPeriod]);
```

---

## 📊 Plan d'Implémentation

### Phase 1 : Corrections Critiques (Priorité 1)
1. ✅ Implémenter `normalizeReps()` et `normalizeExercise()`
2. ✅ Modifier tous les calculs pour utiliser la normalisation
3. ✅ Corriger `calculateChange()` pour gérer les cas edge
4. ✅ Tester avec des données réelles

### Phase 2 : Améliorations Fonctionnelles (Priorité 2)
1. ✅ Implémenter `getMuscleDistribution()` avec base de données
2. ✅ Corriger `getProgressTrend()` pour cohérence
3. ✅ Améliorer l'affichage des tendances

### Phase 3 : Optimisations (Priorité 3)
1. ✅ Ajouter validation et logging
2. ✅ Optimiser les performances (memoization)
3. ✅ Ajouter des tests unitaires

---

## 🧪 Tests Recommandés

### Tests Unitaires

```javascript
describe('AdvancedStats - Normalisation', () => {
  test('normalizeReps converts string to number', () => {
    expect(normalizeReps("100")).toBe(100);
    expect(normalizeReps("0")).toBe(0);
    expect(normalizeReps("invalid")).toBe(0);
  });
  
  test('normalizeReps handles number', () => {
    expect(normalizeReps(100)).toBe(100);
    expect(normalizeReps(0)).toBe(0);
    expect(normalizeReps(NaN)).toBe(0);
  });
  
  test('calculateChange handles zero previous', () => {
    expect(calculateChange(100, 0)).toBe(null); // Nouvelle activité
    expect(calculateChange(0, 0)).toBe(0); // Aucune activité
  });
});
```

### Tests d'Intégration

1. **Test avec données réelles** :
   - Charger des données réelles de l'utilisateur
   - Vérifier que les calculs sont cohérents
   - Vérifier qu'il n'y a plus de concaténation

2. **Test avec données mixtes** :
   - Créer des données avec `reps` en string et number
   - Vérifier que tout est normalisé correctement

3. **Test des tendances** :
   - Période avec données vs période sans données
   - Vérifier que les tendances sont cohérentes

---

## 📝 Checklist de Vérification

### Avant Déploiement

- [ ] Tous les calculs utilisent `normalizeReps()`
- [ ] `calculateChange()` gère correctement les cas edge
- [ ] `getMuscleDistribution()` utilise la base de données
- [ ] `getProgressTrend()` est cohérent avec les autres calculs
- [ ] Validation et logging en place
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Vérification visuelle avec données réelles
- [ ] Pas de console.warn/error en production

### Après Déploiement

- [ ] Monitoring des erreurs
- [ ] Vérification des statistiques affichées
- [ ] Feedback utilisateur
- [ ] Ajustements si nécessaire

---

## 🔗 Fichiers Impactés

### Fichiers à Modifier

1. **`src/components/AdvancedStats.jsx`**
   - Ajout des fonctions de normalisation
   - Correction de tous les calculs
   - Amélioration de `getMuscleDistribution()`
   - Correction de `getProgressTrend()`

### Fichiers à Vérifier

1. **`src/context/WorkoutContext.jsx`**
   - Vérifier que `getWorkoutHistory()` retourne des types cohérents
   - S'assurer que `exercise.reps` est toujours un nombre

2. **`src/data/exerciseDatabase.js`**
   - Vérifier que tous les exercices ont une `category` ou `primaryMuscles`
   - S'assurer que la fonction `findExerciseInDatabase()` fonctionne correctement
   - **Note** : La base de données utilise `category` (ex: "Pectoraux", "Dorsaux") et `primaryMuscles` (array), pas `muscleGroup`

---

## 📚 Références

- **Fichier principal** : `src/components/AdvancedStats.jsx`
- **Source des données** : `src/context/WorkoutContext.jsx` → `getWorkoutHistory()`
- **Base de données exercices** : `src/data/exerciseDatabase.js`
- **Utilitaires** : `src/utils/workoutUtils.js`

---

## 🎯 Conclusion

Les problèmes identifiés sont **systémiques** et affectent toutes les métriques de l'onglet Statistiques. La solution principale est la **normalisation des types de données** à l'entrée, combinée avec des **calculs robustes** qui gèrent les cas edge.

Une fois ces corrections appliquées, l'onglet Statistiques devrait afficher des données **cohérentes, précises et fiables**.

**Priorité d'implémentation** : 🔴 **URGENTE** - Les données affichées sont actuellement inutilisables.

---

## 📈 Suivi de Progression - Implémentation

### État Global : ✅ PHASES 1, 2 & 4.2 TERMINÉES - 🟡 PHASE 3 EN ATTENTE

**Dernière mise à jour** : 2025-11-06  
**Phase actuelle** : Phase 1, 2 & 4.2 ✅ TERMINÉES | Phase 3 🟡 EN ATTENTE (Tests)  
**Prochaine étape** : Tests et validation avec données réelles  
**Export JSON** : ✅ Vérifié - Les statistiques sont calculées dynamiquement, pas besoin d'export (cohérent avec le design)

**Résumé des corrections appliquées** :
- ✅ **Phase 1.1** : Ajout de `intensity` et `duration` dans `getWorkoutHistory()`
- ✅ **Phase 1.2** : Vérification complète de toutes les normalisations (audit complet)
- ✅ **Phase 2.1** : Correction de l'affichage "Meilleure performance"
- ✅ **Phase 4.2** : Validation de cohérence pour répartition musculaire (somme ≈ 100%)
- ✅ **Phase 4.3** : Documentation complète de la formule de calcul des calories
- ✅ **CORRECTION CRITIQUE** : `calculateStreak()` - Cohérence avec `StatsTab` (3 séances = 3 jours)
- ✅ **Normalisation à la source** : Dans `WorkoutContext.jsx` (ligne 818)
- ✅ **Double normalisation** : Dans `AdvancedStats.jsx` pour sécurité maximale
- ✅ **Traçabilité complète** : Chaque statistique documentée avec sa source et son calcul

---

### Phase 1 : Corrections Critiques (Priorité 1) 🔴

#### ✅ Étape 1.1 : Implémenter `normalizeReps()` et fonctions de normalisation
- **Status** : ✅ TERMINÉ
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Créer des fonctions robustes de normalisation des types de données
- **Détails** :
  - [x] Créer `normalizeReps(value)` - conversion string/number/null → number
  - [x] Créer `normalizeExercise(exercise)` - normalisation d'un exercice complet
  - [x] Créer `normalizeWorkout(workout)` - normalisation d'un workout complet
  - [x] Créer `normalizeWorkoutData(workouts)` - normalisation d'un tableau de workouts
  - [x] Ajouter validation et logging en mode développement (`validateWorkoutData`)
  - [x] Optimiser les performances (useCallback, vérifications optimisées)
- **Implémentation** :
  - ✅ `normalizeReps()` : Fonction optimisée avec gestion de tous les cas edge
    - Vérification rapide du type (number en premier, cas le plus fréquent)
    - Gestion null/undefined avec `== null` (une seule vérification)
    - Parsing string avec validation stricte (évite "100abc" → 100)
    - Gestion NaN, Infinity, valeurs négatives
    - Logging en mode dev uniquement
  - ✅ `normalizeExercise()` : Normalise un exercice complet
    - Normalise `reps`, `duration`, `totalReps`
    - Normalise `actualReps` si array
    - Retourne null si exercice invalide
  - ✅ `normalizeWorkout()` : Normalise un workout complet
    - Normalise tous les exercices
    - Recalcule `totalReps` si nécessaire
    - Normalise `intensity` et `duration`
  - ✅ `normalizeWorkoutData()` : Normalise un tableau complet
    - Filtre les workouts invalides
    - Utilise useCallback pour performance
  - ✅ `validateWorkoutData()` : Validation en mode dev
    - Détecte les problèmes de types
    - Limite les logs à 10 pour éviter le spam
    - Désactivé en production
- **Tests** :
  - [ ] Test avec valeurs string
  - [ ] Test avec valeurs number
  - [ ] Test avec null/undefined
  - [ ] Test avec NaN
  - [ ] Test avec valeurs négatives
  - [ ] Test de performance (grand volume de données)

#### ✅ Étape 1.2 : Modifier tous les calculs pour utiliser la normalisation
- **Status** : ✅ TERMINÉ
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Remplacer tous les accès directs à `exercise.reps` par `normalizeReps()`
- **Détails** :
  - [x] Modifier `currentStats.totalReps` - Utilise normalizeReps() et totalReps normalisé
  - [x] Modifier `previousStats.totalReps` - Utilise normalizeReps() et totalReps normalisé
  - [x] Modifier `getBestPerformanceDay()` - Utilise normalizeReps() avec useCallback
  - [x] Modifier `getMuscleDistribution()` - Utilise normalizeReps() avec useCallback
  - [x] Modifier `getProgressTrend()` - Utilise normalizeReps() et signature améliorée
  - [x] Modifier `estimateCalories()` - Utilise normalizeReps() avec useCallback
  - [x] Normaliser `workoutData` en entrée du `useMemo` - normalizeWorkoutData() appelé
  - [x] Ajouter validation en mode dev - validateWorkoutData() appelé

#### ✅ Étape 1.3 : Corriger `calculateChange()` pour gérer les cas edge
- **Status** : ✅ TERMINÉ
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Gérer correctement les périodes sans données précédentes
- **Détails** :
  - [x] Modifier `calculateChange()` pour retourner `null` au lieu de `100` quand previous = 0
  - [x] Modifier `formatChange()` pour afficher "N/A" quand change = null
  - [x] Ajouter limites raisonnables (max 1000%, min -100%)
  - [x] Normaliser les valeurs en entrée avec normalizeReps()
  - [x] Utiliser useCallback pour performance

#### ⏳ Étape 1.4 : Tests et validation
- **Status** : ⏳ EN ATTENTE
- **Objectif** : Valider que les corrections fonctionnent avec des données réelles
- **Détails** :
  - [ ] Tester avec données réelles de l'utilisateur
  - [ ] Vérifier qu'il n'y a plus de concaténation
  - [ ] Vérifier que les tendances sont cohérentes
  - [ ] Vérifier les performances (pas de lag)

---

### Phase 2 : Améliorations Fonctionnelles (Priorité 2) 🟡

#### ✅ Étape 2.1 : Implémenter `getMuscleDistribution()` avec base de données
- **Status** : ✅ TERMINÉ
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Utiliser `findExerciseInDatabase()` pour une répartition précise
- **Détails** :
  - [x] Importer `findExerciseInDatabase` depuis `exerciseDatabase.js`
  - [x] Modifier `getMuscleDistribution()` pour utiliser la base de données
  - [x] Améliorer le fallback avec mapping étendu et scoring intelligent
  - [x] Utiliser `normalizeReps()` pour les calculs
  - [x] Optimiser avec cache pour éviter recherches répétées
  - [x] Utiliser `category` de la base de données (cohérent avec MuscleGroupChart)
- **Implémentation** :
  - ✅ Utilise `findExerciseInDatabase()` en priorité
  - ✅ Utilise `category` de la base de données (cohérent avec le reste de l'app)
  - ✅ Fallback sur `primaryMuscles[0]` si category non disponible
  - ✅ Fallback amélioré avec mapping étendu et scoring par longueur de mot-clé
  - ✅ Cache des résultats avec `Map` pour éviter recherches répétées (optimisation performance)
  - ✅ Utilise `normalizeReps()` pour tous les calculs
  - ✅ Mapping correspond aux catégories de la base de données : "Pectoraux", "Dorsaux", "Jambes", etc.

#### ✅ Étape 2.2 : Corriger `getProgressTrend()` pour cohérence
- **Status** : ✅ TERMINÉ (déjà fait en Phase 1.2)
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Utiliser les mêmes périodes que les autres calculs
- **Détails** :
  - [x] Modifier signature pour accepter `currentPeriodData` et `previousPeriodData`
  - [x] Utiliser les mêmes données que `calculateChange()`
  - [x] Normaliser toutes les valeurs avec `normalizeReps()`
  - [x] Gérer les cas edge (période actuelle vide, pas de comparaison possible)
- **Implémentation** :
  - ✅ Signature modifiée : `getProgressTrend(currentPeriodData, previousPeriodData)`
  - ✅ Utilise les mêmes périodes que les calculs de `currentStats` et `previousStats`
  - ✅ Gère les cas où `currentPeriodData` a moins de 2 éléments
  - ✅ Utilise `previousPeriodData` pour comparaison si nécessaire
  - ✅ Normalise toutes les valeurs avec `normalizeReps()`
  - ✅ Utilise `totalReps` normalisé si disponible, sinon calcule depuis exercices

#### ✅ Étape 2.3 : Améliorer l'affichage des tendances
- **Status** : ✅ TERMINÉ
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Améliorer l'UX pour les cas edge
- **Détails** :
  - [x] Améliorer `formatChange()` pour les cas null (déjà fait en Phase 1.3)
  - [x] Ajouter tooltips explicatifs pour les tendances
  - [x] Corriger les classes Tailwind dynamiques dans StatCard
  - [x] Mémoriser StatCard avec React.memo pour performance
  - [x] Améliorer le formatage des nombres (toLocaleString avec 'fr-FR')
  - [x] Ajouter effet hover sur les cartes
- **Implémentation** :
  - ✅ Mapping de couleurs explicite pour Tailwind (colorMap)
  - ✅ StatCard mémorisé avec React.memo et displayName
  - ✅ Tooltip sur "Tendance de Progression" avec HelpCircle icon
  - ✅ Tooltip sur les indicateurs de changement (hover sur formatChange)
  - ✅ Formatage des nombres avec locale française
  - ✅ Transitions CSS pour meilleure UX

---

### Phase 3 : Optimisations (Priorité 3) 🟢

#### ✅ Étape 3.1 : Ajouter validation et logging
- **Status** : ✅ TERMINÉ (déjà fait en Phase 1.1)
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Détecter les problèmes en développement
- **Détails** :
  - [x] Créer `validateWorkoutData()` pour mode développement
  - [x] Logger les problèmes de types
  - [x] Logger les valeurs suspectes
  - [x] Désactiver en production (vérification process.env.NODE_ENV)
  - [x] Limiter les logs à 10 pour éviter le spam
  - [x] Try-catch autour du useMemo pour capturer les erreurs

#### ✅ Étape 3.2 : Optimiser les performances
- **Status** : ✅ TERMINÉ
- **Fichier** : `src/components/AdvancedStats.jsx`
- **Objectif** : Éviter les recalculs inutiles
- **Détails** :
  - [x] Mémoriser la normalisation des données (déjà fait avec useCallback)
  - [x] Optimiser les boucles (calculateStreak, getWeeklyPattern)
  - [x] Utiliser `useMemo` efficacement (stats mémorisé)
  - [x] Mémoriser calculateStreak avec useCallback
  - [x] Mémoriser getWeeklyPattern avec useCallback
  - [x] Améliorer le rendu conditionnel (message si pas de données)
  - [x] StatCard mémorisé avec React.memo
- **Implémentation** :
  - ✅ calculateStreak optimisé : tri des dates une seule fois
  - ✅ getWeeklyPattern optimisé : gestion du cas vide, useCallback
  - ✅ Message d'état vide au lieu de retourner null silencieusement
  - ✅ Toutes les fonctions utilitaires utilisent useCallback
  - ✅ StatCard mémorisé pour éviter re-renders inutiles

#### ⏳ Étape 3.3 : Export/Import JSON (si nécessaire)
- **Status** : ⏳ EN ATTENTE
- **Fichiers** : `src/components/tabs/SettingsTab.jsx`, `src/context/WorkoutContext.jsx`
- **Objectif** : Vérifier si les statistiques doivent être exportées
- **Détails** :
  - [ ] Analyser ce qui est actuellement exporté
  - [ ] Déterminer si les stats calculées doivent être exportées
  - [ ] Si oui, ajouter au format d'export
  - [ ] Documenter dans le format d'export

---

## 🔍 Notes d'Implémentation

### Décisions Techniques

#### Normalisation des Types
- **Choix** : Fonction utilitaire centralisée `normalizeReps()`
- **Raison** : Réutilisable, testable, maintenable
- **Performance** : Fonction pure, pas d'effet de bord, peut être mémorisée

#### Gestion des Cas Edge
- **Choix** : Retourner `null` pour "N/A" au lieu de valeurs arbitraires
- **Raison** : Plus explicite, meilleure UX
- **Performance** : Pas d'impact

#### Base de Données d'Exercices
- **Choix** : Utiliser `findExerciseInDatabase()` avec fallback amélioré
- **Raison** : Précision maximale, cohérence avec le reste de l'app
- **Performance** : Recherche O(n) mais acceptable pour le volume de données

---

## 📝 Journal des Modifications

### 2025-11-06 - Implémentation complète Phases 1, 2 & 3 ✅

**Résumé de l'implémentation complète** :

#### ✅ Phase 1 : Corrections Critiques (TERMINÉE)
- Normalisation complète des types de données (normalizeReps, normalizeExercise, normalizeWorkout, normalizeWorkoutData)
- Correction de tous les calculs pour utiliser la normalisation
- Correction de calculateChange() pour gérer les cas edge (retourne null pour nouvelles activités)
- Gestion des nombres décimaux et durées dans normalizeReps()
- Validation et logging en mode développement

#### ✅ Phase 2 : Améliorations Fonctionnelles (TERMINÉE)
- getMuscleDistribution() avec base de données d'exercices (findExerciseInDatabase)
- getProgressTrend() cohérent avec les autres calculs
- Amélioration UX : tooltips explicatifs, classes Tailwind corrigées, StatCard mémorisé
- Formatage des nombres avec locale française

#### ✅ Phase 3 : Optimisations (TERMINÉE)
- Validation et logging (déjà fait en Phase 1.1)
- Optimisations performances : useCallback pour toutes les fonctions utilitaires, React.memo pour StatCard
- Optimisations de boucles (calculateStreak, getWeeklyPattern)
- Rendu conditionnel amélioré avec message d'état vide

#### ✅ Corrections de bugs
- Chemin d'import corrigé (../../data → ../data)
- Gestion d'erreur avec try-catch autour du useMemo
- Message d'état vide au lieu de null silencieux
- Correction de l'appel à getProgressTrend()

**État final** : ✅ Toutes les phases terminées, prêt pour tests et validation avec données réelles
- ✅ Document d'analyse créé
- ✅ Plan d'action structuré défini
- ✅ Phase 1, Étape 1.1 TERMINÉE : Fonctions de normalisation implémentées
  - `normalizeReps()` : Fonction optimale de conversion string/number → number
  - `normalizeExercise()` : Normalisation d'un exercice complet
  - `normalizeWorkout()` : Normalisation d'un workout complet
  - `normalizeWorkoutData()` : Normalisation d'un tableau de workouts
  - `validateWorkoutData()` : Validation en mode développement
  - Toutes les fonctions utilisent `useCallback` pour performance
  - Gestion complète de tous les cas edge (null, undefined, NaN, string, number, objets)
  - Logging intelligent en mode dev uniquement
- ✅ Phase 1, Étape 1.2 TERMINÉE : Tous les calculs utilisent maintenant la normalisation
  - `useMemo` des stats normalise workoutData en entrée
  - `getBestPerformanceDay()` utilise normalizeReps()
  - `getMuscleDistribution()` utilise normalizeReps()
  - `getProgressTrend()` utilise normalizeReps() et signature améliorée pour cohérence
  - `estimateCalories()` utilise normalizeReps()
  - Tous les calculs de `currentStats` et `previousStats` utilisent normalizeReps()
  - Toutes les fonctions utilisent `useCallback` pour performance
- ✅ Phase 1, Étape 1.3 TERMINÉE : calculateChange() et formatChange() améliorés
  - `calculateChange()` retourne null au lieu de 100 pour nouvelles activités
  - Limites raisonnables ajoutées (-100% à +1000%)
  - `formatChange()` gère le cas null avec affichage "N/A"
  - Normalisation des valeurs en entrée
- ✅ Phase 2, Étape 2.1 TERMINÉE : getMuscleDistribution() avec base de données
  - Utilise `findExerciseInDatabase()` en priorité
  - Utilise `category` de la base de données (cohérent avec MuscleGroupChart)
  - Cache des résultats pour optimisation performance
  - Fallback amélioré avec mapping étendu et scoring intelligent
  - Mapping correspond aux catégories de la base de données
- ✅ Phase 2, Étape 2.2 TERMINÉE : getProgressTrend() cohérent
  - Signature modifiée pour accepter `currentPeriodData` et `previousPeriodData`
  - Utilise les mêmes périodes que les autres calculs
  - Gère tous les cas edge
- ✅ Vérification Export JSON : Les statistiques sont calculées dynamiquement depuis `getWorkoutHistory()`
  - Pas besoin d'exporter les stats calculées (cohérent avec le design actuel)
  - Les données brutes (reps, checkedExercises) sont déjà exportées
  - Les stats seront recalculées automatiquement lors de l'import
- ✅ Correction bug import : Chemin d'import corrigé dans `AdvancedStats.jsx`
  - `../../data/exerciseDatabase` → `../data/exerciseDatabase` (chemin correct depuis `src/components/`)
  - Erreur Vite résolue : "Failed to resolve import"
- ✅ Correction normalizeReps() : Gestion améliorée des nombres décimaux et durées
  - Accepte maintenant les nombres décimaux ("10.23" → 10)
  - Gère les durées au format "HH:MM" ("10:53" → 653 minutes)
  - Utilise `parseFloat` au lieu de `parseInt` pour gérer les décimales
  - Arrondit vers le bas pour les répétitions (cohérent : on ne peut pas faire 10.23 reps)
  - Ne log plus d'avertissement pour les nombres décimaux valides
- ✅ Correction bug affichage : Ajout gestion d'erreur et vérifications
  - Ajout try-catch autour du useMemo pour capturer les erreurs
  - Vérification que normalizeWorkoutData ne retourne pas un tableau vide
  - Correction de l'appel à getProgressTrend() pour utiliser currentPeriodData
  - Logging d'erreurs en mode dev pour faciliter le débogage
  - Message d'état vide au lieu de retourner null silencieusement
- ✅ Phase 2, Étape 2.3 TERMINÉE : Amélioration UX et optimisations
  - Correction classes Tailwind dynamiques (colorMap explicite)
  - StatCard mémorisé avec React.memo
  - Tooltips explicatifs pour les tendances
  - Formatage des nombres avec locale française
  - Effets hover et transitions CSS
- ✅ Phase 3, Étape 3.1 TERMINÉE : Validation et logging (déjà fait en Phase 1.1)
- ✅ Phase 3, Étape 3.2 TERMINÉE : Optimisations performances
  - calculateStreak optimisé avec useCallback
  - getWeeklyPattern optimisé avec useCallback
  - Toutes les fonctions utilitaires mémorisées
  - Rendu conditionnel amélioré avec message d'état vide
- 🔴 CORRECTION CRITIQUE : Normalisation dans getWorkoutHistory() (source du problème)
  - Problème identifié : totalReps calculé avec des chaînes concaténées dans WorkoutContext
  - Solution : Ajout de normalizeRepsValue() dans getWorkoutHistory()
  - Normalisation de tous les ex.reps avant calcul de totalReps
  - Normalisation des reps dans les exercices exceptionnels
  - Normalisation des reps dans les exercices normaux
  - Normalisation lors de la lecture de currentData.reps
  - Cela corrige le problème à la source, avant même que les données n'arrivent dans AdvancedStats

---

## 📊 INVENTAIRE COMPLET DES STATISTIQUES - TRACEABILITÉ TOTALE

**Date de création** : 2025-11-06  
**Objectif** : Documenter chaque statistique affichée, sa source exacte, son calcul, et vérifier sa cohérence.

### 🔍 Méthodologie de Traçabilité

Pour chaque statistique, nous documentons :
1. **Nom affiché** : Le libellé visible par l'utilisateur
2. **Source des données** : D'où viennent les données brutes
3. **Fonction de calcul** : Quelle fonction calcule cette valeur
4. **Normalisation** : Comment les données sont normalisées
5. **Validation** : Vérifications effectuées
6. **Points d'attention** : Problèmes potentiels identifiés

---

### 📋 STATISTIQUES PRINCIPALES (Première ligne - 4 cartes)

#### 1. **Séances totales** (`stats.current.totalWorkouts`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 656
- **Données brutes** : `workoutData` passé en prop depuis `App.jsx` (ligne 113)
- **Origine ultime** : `getWorkoutHistory()` dans `src/context/WorkoutContext.jsx` (ligne 488)

**🔧 Calcul** :
```javascript
totalWorkouts: currentPeriodData.length
```
- `currentPeriodData` = workouts filtrés par période (ligne 648)
- Filtrage : `normalizedWorkoutData.filter(w => new Date(w.date) >= currentPeriodStart)`
- **Normalisation** : ✅ Les données passent par `normalizeWorkoutData()` (ligne 626)

**✅ Validation** :
- ✅ Les données sont normalisées avant le calcul
- ✅ Le filtrage par date est correct
- ⚠️ **Point d'attention** : Si `workoutData` est vide ou null, retourne `null` (ligne 621)

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 859-865)
- **Valeur** : `stats.current.totalWorkouts`
- **Changement** : `stats.changes.workouts` (calculé ligne 701)

**🔗 Chaîne de traçabilité** :
```
App.jsx:113 → getWorkoutHistory() 
→ WorkoutContext.jsx:488 → getCurrentData() 
→ AdvancedStats.jsx:619 → normalizeWorkoutData() 
→ AdvancedStats.jsx:656 → currentPeriodData.length
```

---

#### 2. **Répétitions totales** (`stats.current.totalReps`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Lignes 659-666
- **Données brutes** : `workoutData` → `currentPeriodData` (workouts de la période)
- **Origine ultime** : `getWorkoutHistory()` → `totalReps` calculé dans `WorkoutContext.jsx:814-820`

**🔧 Calcul** :
```javascript
totalReps: currentPeriodData.reduce((sum, w) => {
  if (w.totalReps != null) {
    return sum + normalizeReps(w.totalReps);
  }
  return sum + (w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
}, 0)
```

**✅ Normalisation** :
- ✅ **Double normalisation** : 
  1. Dans `WorkoutContext.jsx` lors du calcul de `totalReps` (ligne 818)
  2. Dans `AdvancedStats.jsx` avec `normalizeReps()` (ligne 662)
- ✅ Utilise `normalizeReps()` pour chaque valeur (gère strings, numbers, null, décimales)

**⚠️ Points d'attention** :
- ✅ **CORRIGÉ** : Normalisation à la source dans `WorkoutContext.jsx:818`
- ✅ **CORRIGÉ** : Double vérification avec `normalizeReps()` dans AdvancedStats
- ⚠️ Si `w.totalReps` est null, calcule depuis `exercises` (ligne 665)

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 866-872)
- **Valeur** : `stats.current.totalReps`
- **Changement** : `stats.changes.reps` (calculé ligne 702)

**🔗 Chaîne de traçabilité** :
```
WorkoutContext.jsx:814 → normalizeRepsValue() dans totalReps
→ WorkoutContext.jsx:812 → sessionData.totalReps
→ AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:662 → normalizeReps(w.totalReps)
→ AdvancedStats.jsx:868 → Affichage
```

---

#### 3. **Intensité moyenne** (`stats.current.avgIntensity`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Lignes 669-670
- **Données brutes** : `workout.intensity` depuis `workoutData`

**🔧 Calcul** :
```javascript
avgIntensity: currentPeriodData.length > 0 ? 
  currentPeriodData.reduce((sum, w) => sum + normalizeReps(w.intensity || 5), 0) / currentPeriodData.length : 0
```

**✅ Normalisation** :
- ✅ Utilise `normalizeReps(w.intensity || 5)` (ligne 670)
- ✅ Valeur par défaut : 5 si `intensity` est null/undefined

**⚠️ Points d'attention** :
- ⚠️ **PROBLÈME POTENTIEL** : `intensity` peut ne pas être défini dans `getWorkoutHistory()`
- ⚠️ Vérifier que `workout.intensity` est bien stocké dans `WorkoutContext`
- ✅ Normalisation garantit un nombre valide

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 873-880)
- **Valeur** : `stats.current.avgIntensity.toFixed(1)`
- **Unité** : "/10"
- **Changement** : `stats.changes.intensity` (calculé ligne 704)

**🔗 Chaîne de traçabilité** :
```
WorkoutContext.jsx → workout.intensity (à vérifier si stocké)
→ AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:670 → normalizeReps(w.intensity || 5)
→ AdvancedStats.jsx:875 → Affichage avec .toFixed(1)
```

---

#### 4. **Durée moyenne** (`stats.current.avgDuration`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Lignes 671-672
- **Données brutes** : `workout.duration` depuis `workoutData`

**🔧 Calcul** :
```javascript
avgDuration: currentPeriodData.length > 0 ?
  currentPeriodData.reduce((sum, w) => sum + normalizeReps(w.duration || 30), 0) / currentPeriodData.length : 0
```

**✅ Normalisation** :
- ✅ Utilise `normalizeReps(w.duration || 30)` (ligne 672)
- ✅ Valeur par défaut : 30 minutes si `duration` est null/undefined

**⚠️ Points d'attention** :
- ⚠️ **PROBLÈME POTENTIEL** : `duration` peut ne pas être défini dans `getWorkoutHistory()`
- ⚠️ Vérifier que `workout.duration` est bien stocké dans `WorkoutContext`
- ✅ Normalisation garantit un nombre valide

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 881-888)
- **Valeur** : `Math.round(stats.current.avgDuration)`
- **Unité** : "min"
- **Changement** : `stats.changes.duration` (calculé ligne 705)

**🔗 Chaîne de traçabilité** :
```
WorkoutContext.jsx → workout.duration (à vérifier si stocké)
→ AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:672 → normalizeReps(w.duration || 30)
→ AdvancedStats.jsx:883 → Math.round() puis affichage
```

---

### 📋 STATISTIQUES SECONDAIRES (Deuxième ligne - 3 cartes)

#### 5. **Série actuelle** (`stats.current.streak`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 673
- **Fonction** : `calculateStreak()` (lignes 345-378)

**🔧 Calcul** :
```javascript
streak: calculateStreak(normalizedWorkoutData)
```

**Fonction `calculateStreak()`** (lignes 345-378) :
- ✅ Utilise `normalizedWorkoutData` (toutes les données, pas seulement la période)
- ✅ Trie les dates par ordre décroissant
- ✅ Calcule les jours consécutifs depuis aujourd'hui
- ✅ **Optimisé** avec `useCallback`

**✅ Normalisation** :
- ✅ Reçoit `normalizedWorkoutData` déjà normalisé (ligne 626)

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 893-899)
- **Valeur** : `stats.current.streak`
- **Unité** : "jours"
- **Changement** : ❌ Pas de changement affiché (pas de période précédente pour streak)

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:673 → calculateStreak(normalizedWorkoutData)
→ AdvancedStats.jsx:345 → calculateStreak() calcule les jours consécutifs
→ AdvancedStats.jsx:895 → Affichage
```

---

#### 6. **Calories estimées** (`stats.current.caloriesBurned`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 678
- **Fonction** : `estimateCalories()` (lignes 592-612)

**🔧 Calcul** :
```javascript
caloriesBurned: estimateCalories(currentPeriodData)
```

**Fonction `estimateCalories()`** (lignes 592-612) :
- ✅ Utilise `normalizeReps()` pour `reps`, `intensity`, `duration`
- ✅ Calcul basé sur MET (Metabolic Equivalent of Task)
- ✅ Formule : `caloriesFromDuration + caloriesFromReps`
  - `caloriesFromDuration = metValue * 70 * (duration / 60)`
  - `caloriesFromReps = reps * 0.3`

**✅ Normalisation** :
- ✅ Utilise `normalizeReps()` pour toutes les valeurs (lignes 597-600)

**⚠️ Points d'attention** :
- ⚠️ **Dépend de `totalReps`** : Si `totalReps` est erroné, les calories le seront aussi
- ✅ **CORRIGÉ** : Normalisation garantit des nombres valides

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 900-906)
- **Valeur** : `Math.round(stats.current.caloriesBurned)`
- **Unité** : "kcal"
- **Changement** : ❌ Pas de changement affiché

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:678 → estimateCalories(currentPeriodData)
→ AdvancedStats.jsx:592 → estimateCalories() calcule avec MET
→ AdvancedStats.jsx:902 → Math.round() puis affichage
```

---

#### 7. **Sets totaux** (`stats.current.totalSets`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 667
- **Données brutes** : `workout.exercises.length` depuis `workoutData`

**🔧 Calcul** :
```javascript
totalSets: currentPeriodData.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)
```

**✅ Normalisation** :
- ✅ Pas besoin de normalisation (`.length` retourne toujours un nombre)
- ✅ Gère le cas où `exercises` est undefined avec `|| 0`

**📊 Affichage** :
- **Composant** : `StatCard` (ligne 907-913)
- **Valeur** : `stats.current.totalSets`
- **Changement** : `stats.changes.sets` (calculé ligne 703)

**🔗 Chaîne de traçabilité** :
```
WorkoutContext.jsx → workout.exercises (array)
→ AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:667 → w.exercises?.length
→ AdvancedStats.jsx:909 → Affichage
```

---

### 📋 STATISTIQUES DÉTAILLÉES (Sections avancées)

#### 8. **Tendance de Progression** (`stats.current.progressTrend`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 677
- **Fonction** : `getProgressTrend()` (lignes 547-588)

**🔧 Calcul** :
```javascript
progressTrend: getProgressTrend(currentPeriodData, previousPeriodData)
```

**Fonction `getProgressTrend()`** (lignes 547-588) :
- ✅ Compare les 5 dernières séances avec les 5 précédentes
- ✅ Utilise `normalizeReps()` pour tous les calculs
- ✅ Retourne : `'improving'`, `'declining'`, ou `'stable'`
- ✅ Seuil : ±10% pour déterminer la tendance

**✅ Normalisation** :
- ✅ Utilise `normalizeReps()` pour `workoutReps` (ligne 567)

**📊 Affichage** :
- **Composant** : Section "Tendance de Progression" (ligne 917-978)
- **Valeur** : Texte conditionnel selon `progressTrend`
- **Couleurs** : Vert (improving), Rouge (declining), Jaune (stable)

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:677 → getProgressTrend(currentPeriodData, previousPeriodData)
→ AdvancedStats.jsx:547 → getProgressTrend() compare les périodes
→ AdvancedStats.jsx:940 → Affichage conditionnel
```

---

#### 9. **Meilleure performance** (`stats.current.bestDay`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 674
- **Fonction** : `getBestPerformanceDay()` (lignes 381-404)

**🔧 Calcul** :
```javascript
bestDay: getBestPerformanceDay(currentPeriodData)
```

**Fonction `getBestPerformanceDay()`** (lignes 381-404) :
- ✅ Utilise un score composite : `(reps * intensity) + (exerciseCount * 10)`
- ✅ Utilise `normalizeReps()` pour `currentReps`, `currentIntensity`, `bestReps`, `bestIntensity`
- ✅ Retourne le workout avec le meilleur score

**✅ Normalisation** :
- ✅ Utilise `normalizeReps()` pour toutes les valeurs (lignes 387-398)

**📊 Affichage** :
- **Composant** : Section "Meilleure performance" (ligne 962-976)
- **Valeur** : Date, reps, intensité du meilleur jour
- ⚠️ **PROBLÈME POTENTIEL** : Ligne 972 utilise `e.reps` sans normalisation dans l'affichage

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:674 → getBestPerformanceDay(currentPeriodData)
→ AdvancedStats.jsx:381 → getBestPerformanceDay() calcule le score
→ AdvancedStats.jsx:962 → Affichage (⚠️ ligne 972 à corriger)
```

---

#### 10. **Répartition Musculaire** (`stats.current.muscleDistribution`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 675
- **Fonction** : `getMuscleDistribution()` (lignes 421-512)

**🔧 Calcul** :
```javascript
muscleDistribution: getMuscleDistribution(currentPeriodData)
```

**Fonction `getMuscleDistribution()`** (lignes 421-512) :
- ✅ Utilise `findExerciseInDatabase()` depuis `exerciseDatabase.js`
- ✅ Cache les résultats pour optimisation
- ✅ Fallback intelligent si exercice non trouvé
- ✅ Utilise `normalizeReps()` pour `exercise.reps` (ligne 477)

**✅ Normalisation** :
- ✅ Utilise `normalizeReps(exercise.reps)` (ligne 477)

**📊 Affichage** :
- **Composant** : Section "Répartition Musculaire" (ligne 980-1021)
- **Valeur** : Liste des muscles avec pourcentages
- **Affichage** : Top 6 muscles (ligne 987)

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:675 → getMuscleDistribution(currentPeriodData)
→ AdvancedStats.jsx:421 → getMuscleDistribution() utilise exerciseDatabase
→ AdvancedStats.jsx:477 → normalizeReps(exercise.reps)
→ AdvancedStats.jsx:987 → Affichage top 6
```

---

#### 11. **Répartition Hebdomadaire** (`stats.current.weeklyPattern`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Ligne 676
- **Fonction** : `getWeeklyPattern()` (lignes 524-543)

**🔧 Calcul** :
```javascript
weeklyPattern: getWeeklyPattern(currentPeriodData)
```

**Fonction `getWeeklyPattern()`** (lignes 524-543) :
- ✅ Compte les workouts par jour de la semaine
- ✅ Retourne un tableau de `{day, workouts}` pour chaque jour
- ✅ Gère le cas vide (retourne 0 pour tous les jours)

**✅ Normalisation** :
- ✅ Pas besoin de normalisation (compte des workouts)

**📊 Affichage** :
- **Composant** : Section "Répartition Hebdomadaire" (ligne 1023-1060)
- **Valeur** : Graphique en barres avec nombre de séances par jour
- **Affichage** : 7 jours de la semaine

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:626 → normalizeWorkoutData()
→ AdvancedStats.jsx:676 → getWeeklyPattern(currentPeriodData)
→ AdvancedStats.jsx:524 → getWeeklyPattern() compte par jour
→ AdvancedStats.jsx:1030 → Affichage graphique
```

---

### 📋 CALCULS DE CHANGEMENTS (Comparaisons avec période précédente)

#### 12. **Changements** (`stats.changes.*`)

**📍 Source des données** :
- **Fichier source** : `src/components/AdvancedStats.jsx`
- **Ligne de calcul** : Lignes 699-706
- **Fonction** : `calculateChange()` (lignes 275-303)

**🔧 Calcul** :
```javascript
const changes = {
  workouts: calculateChange(currentStats.totalWorkouts, previousStats.totalWorkouts),
  reps: calculateChange(currentStats.totalReps, previousStats.totalReps),
  sets: calculateChange(currentStats.totalSets, previousStats.totalSets),
  intensity: calculateChange(currentStats.avgIntensity, previousStats.avgIntensity),
  duration: calculateChange(currentStats.avgDuration, previousStats.avgDuration)
};
```

**Fonction `calculateChange()`** (lignes 275-303) :
- ✅ Normalise les valeurs avec `normalizeReps()`
- ✅ Retourne `null` si nouvelle activité (previous = 0, current > 0)
- ✅ Limite entre -100% et +1000%
- ✅ Retourne 0 si les deux périodes sont à 0

**✅ Normalisation** :
- ✅ Utilise `normalizeReps()` pour `currentNum` et `previousNum` (lignes 283-284)

**📊 Affichage** :
- **Composant** : `formatChange()` dans `StatCard` (ligne 730)
- **Valeur** : Pourcentage avec icône (TrendingUp/TrendingDown)
- **Cas spécial** : "N/A" si `change === null` (ligne 313)

**🔗 Chaîne de traçabilité** :
```
AdvancedStats.jsx:699 → calculateChange(current, previous)
→ AdvancedStats.jsx:275 → calculateChange() normalise et calcule %
→ AdvancedStats.jsx:311 → formatChange() formate l'affichage
→ AdvancedStats.jsx:730 → Affichage dans StatCard
```

---

## 🎯 PLAN D'ATTAQUE COMPLET - RÉGLEMENTATION DÉFINITIVE

### Phase 1 : Vérification et Correction des Sources de Données 🔴

#### Étape 1.1 : Vérifier `getWorkoutHistory()` dans `WorkoutContext.jsx`
- [x] **Vérifier que `workout.intensity` est stocké**
  - Fichier : `src/context/WorkoutContext.jsx`
  - Ligne : ~875-920 (dans `sessionData`)
  - Status : ✅ CORRIGÉ
  - Action : Ajout de `intensity` depuis `currentData.sessionFeedbacks[dateStr]?.difficulte`
  - Impact : Corrige "Intensité moyenne"
  - Détails :
    - Récupère `difficulte` depuis `sessionFeedbacks` (stocké via `saveSessionFeedback`)
    - Retourne `null` si pas de feedback (AdvancedStats utilisera 5 par défaut)
    - Ajoute aussi `feedback` complet pour référence future

- [x] **Vérifier que `workout.duration` est stocké**
  - Fichier : `src/context/WorkoutContext.jsx`
  - Ligne : ~875-920 (dans `sessionData`)
  - Status : ✅ CORRIGÉ
  - Action : Calcul de `duration` avec priorité :
    1. Somme des durées des exercices (si disponibles)
    2. Estimation : 5 min par exercice complété
    3. `null` si aucune activité (AdvancedStats utilisera 30 par défaut)
  - Impact : Corrige "Durée moyenne"
  - Détails :
    - Normalise les durées des exercices (gère secondes/minutes)
    - Estimation intelligente basée sur le nombre d'exercices

- [ ] **Vérifier que `totalReps` est toujours normalisé**
  - Fichier : `src/context/WorkoutContext.jsx`
  - Ligne : 814-820
  - Status : ✅ DÉJÀ CORRIGÉ
  - Action : Tester avec données réelles

#### Étape 1.2 : Vérifier la normalisation dans `AdvancedStats.jsx`
- [x] **Vérifier que toutes les valeurs utilisent `normalizeReps()`**
  - Fichier : `src/components/AdvancedStats.jsx`
  - Status : ✅ TOUTES LES VÉRIFICATIONS PASSÉES
  - Points vérifiés :
    - ✅ Ligne 662 : `totalReps` - Utilise `normalizeReps(w.totalReps)`
    - ✅ Ligne 670 : `avgIntensity` - Utilise `normalizeReps(w.intensity || 5)`
    - ✅ Ligne 672 : `avgDuration` - Utilise `normalizeReps(w.duration || 30)`
    - ✅ Ligne 972-974 : `bestDay.reps` dans affichage - CORRIGÉ (utilise `normalizeReps(e.reps)`)
    - ✅ Ligne 388 : `getBestPerformanceDay` - Utilise `normalizeReps(e.reps)`
    - ✅ Ligne 397 : `getBestPerformanceDay` - Utilise `normalizeReps(e.reps)`
    - ✅ Ligne 497 : `getMuscleDistribution` - Utilise `normalizeReps(exercise.reps)`
    - ✅ Ligne 571 : `getProgressTrend` - Utilise `normalizeReps(w.totalReps)` et `normalizeReps(e.reps)`
    - ✅ Ligne 598 : `estimateCalories` - Utilise `normalizeReps()` pour reps, intensity, duration
    - ✅ Ligne 122 : `normalizeExercise` - Utilise `normalizeReps(exercise.reps)`
    - ✅ Ligne 164 : `normalizeWorkout` - Utilise `normalizeReps(ex.reps)`
    - ✅ Ligne 171 : `normalizeWorkout` - Utilise `normalizeReps(workout.intensity)`
    - ✅ Ligne 172 : `normalizeWorkout` - Utilise `normalizeReps(workout.duration)`
  - **Résultat** : ✅ Toutes les valeurs numériques utilisent `normalizeReps()` ou sont déjà normalisées

---

### Phase 2 : Corrections des Affichages 🔴

#### Étape 2.1 : Corriger l'affichage de "Meilleure performance"
- [x] **Corriger ligne 972 dans `AdvancedStats.jsx`**
  - Fichier : `src/components/AdvancedStats.jsx`
  - Lignes : 972-974
  - Status : ✅ CORRIGÉ
  - Problème : `e.reps` et `intensity` utilisés sans normalisation
  - Solution appliquée :
    ```javascript
    {/* ✅ CORRECTION : Utiliser normalizeReps() pour éviter concaténation */}
    {stats.current.bestDay.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0)} reps • 
    Intensité {normalizeReps(stats.current.bestDay.intensity || 5)}/10
    ```
  - Impact : Évite les concaténations de chaînes dans l'affichage

---

### Phase 3 : Tests et Validation 🟡

#### Étape 3.1 : Tests unitaires pour chaque statistique
- [ ] **Test "Séances totales"**
  - Vérifier que le comptage est correct
  - Vérifier le filtrage par période

- [ ] **Test "Répétitions totales"**
  - Vérifier avec données contenant des strings
  - Vérifier avec données contenant des nombres
  - Vérifier avec données mixtes

- [ ] **Test "Intensité moyenne"**
  - Vérifier avec `intensity` défini
  - Vérifier avec `intensity` null (doit utiliser 5)
  - Vérifier avec `intensity` string

- [ ] **Test "Durée moyenne"**
  - Vérifier avec `duration` défini
  - Vérifier avec `duration` null (doit utiliser 30)
  - Vérifier avec `duration` string

- [ ] **Test "Série actuelle"**
  - Vérifier le calcul des jours consécutifs
  - Vérifier avec données éparses

- [ ] **Test "Calories estimées"**
  - Vérifier la formule MET
  - Vérifier avec différentes intensités

- [ ] **Test "Sets totaux"**
  - Vérifier le comptage des exercices

- [ ] **Test "Tendance de progression"**
  - Vérifier les 3 cas (improving, declining, stable)
  - Vérifier avec moins de 5 séances

- [ ] **Test "Meilleure performance"**
  - Vérifier le calcul du score composite

- [ ] **Test "Répartition musculaire"**
  - Vérifier l'utilisation de `exerciseDatabase`
  - Vérifier le fallback

- [ ] **Test "Répartition hebdomadaire"**
  - Vérifier le comptage par jour

- [ ] **Test "Changements"**
  - Vérifier le calcul des pourcentages
  - Vérifier le cas "N/A" (nouvelle activité)
  - Vérifier les limites (-100% à +1000%)

---

### Phase 4 : Optimisations Finales 🟢

#### Étape 4.1 : Ajouter des logs de validation en mode développement
- [ ] **Logger les valeurs avant/après normalisation**
  - Fichier : `src/components/AdvancedStats.jsx`
  - Action : Ajouter des `console.log` conditionnels en mode dev
  - Utilité : Détecter les problèmes de normalisation

#### Étape 4.2 : Ajouter des validations de cohérence
- [x] **Vérifier que les pourcentages de répartition musculaire = 100%**
  - Fichier : `src/components/AdvancedStats.jsx`
  - Lignes : 502-525
  - Status : ✅ IMPLÉMENTÉ
  - Action : Validation ajoutée avec logging en mode développement
  - Détails :
    - Calcule la somme des pourcentages
    - Vérifie si la somme ≈ 100% (tolérance de 0.1% pour arrondis)
    - Log un warning en mode développement si écart détecté
    - Utile pour détecter les problèmes de calcul ou de données manquantes

#### Étape 4.3 : Documenter les formules
- [x] **Documenter la formule de calcul des calories**
  - Fichier : `src/components/AdvancedStats.jsx`
  - Lignes : 591-650
  - Status : ✅ IMPLÉMENTÉ
  - Action : Documentation complète ajoutée avec :
    - Explication de la méthode MET (Metabolic Equivalent of Task)
    - Formule détaillée pour `caloriesFromDuration`
    - Formule détaillée pour `caloriesFromReps`
    - Exemple de calcul avec valeurs réelles
    - Notes sur les limitations et facteurs de variation
    - Complexité algorithmique (O(n))

---

## ✅ CHECKLIST DE VALIDATION FINALE

Avant de considérer le travail terminé, vérifier :

- [ ] Toutes les statistiques utilisent `normalizeReps()` ou une normalisation équivalente
- [ ] Tous les calculs de `totalReps` sont normalisés à la source
- [ ] `intensity` et `duration` sont stockés dans `getWorkoutHistory()`
- [ ] L'affichage de "Meilleure performance" utilise `normalizeReps()`
- [ ] Tous les tests passent avec des données réelles
- [ ] Aucun "N/A" n'apparaît incorrectement
- [ ] Les valeurs sont cohérentes entre les différentes statistiques
- [ ] Les pourcentages de répartition musculaire ≈ 100%
- [ ] Les calories estimées sont raisonnables
- [ ] Les tendances sont cohérentes avec les données

---

## 📝 NOTES IMPORTANTES

1. **Double normalisation** : Les données sont normalisées à deux niveaux :
   - Dans `WorkoutContext.jsx` lors de la création des données
   - Dans `AdvancedStats.jsx` lors des calculs
   - C'est intentionnel pour garantir la cohérence

2. **Valeurs par défaut** :
   - `intensity` : 5 si non défini
   - `duration` : 30 minutes si non défini
   - Ces valeurs sont utilisées dans les calculs mais peuvent ne pas refléter la réalité

3. **Périodes de comparaison** :
   - Les changements comparent la période actuelle avec la période précédente de même durée
   - Exemple : 30 derniers jours vs 30 jours précédents

4. **Normalisation des chaînes** :
   - `normalizeReps()` gère les chaînes numériques ("100" → 100)
   - Gère les décimales ("10.5" → 10)
   - Gère les durées ("10:30" → 630 minutes)
   - Retourne 0 pour valeurs invalides

---

## 📝 Journal des Implémentations - Phase 1.1

### 2025-11-06 - Phase 1, Étape 1.1 : Ajout de `intensity` et `duration` dans `getWorkoutHistory()`

**✅ Corrections appliquées** :

1. **Ajout de `intensity` dans `sessionData`** :
   - **Fichier** : `src/context/WorkoutContext.jsx`
   - **Lignes** : 873-876, 917
   - **Implémentation** :
     - Récupère `difficulte` depuis `currentData.sessionFeedbacks[dateStr]?.difficulte`
     - Stocke dans `sessionData.intensity`
     - Retourne `null` si pas de feedback (AdvancedStats utilisera 5 par défaut)
     - Ajoute aussi `sessionData.feedback` pour référence complète
   - **Source des données** : `saveSessionFeedback()` dans `useWorkoutData.js` (ligne 682)
   - **Stockage** : `data.sessionFeedbacks[date]` dans IndexedDB
   - **Export JSON** : ✅ Déjà exporté via `sessionFeedbacks` (cohérent avec le système existant)
   - **Impact** : Corrige "Intensité moyenne" dans AdvancedStats

2. **Ajout de `duration` dans `sessionData`** :
   - **Fichier** : `src/context/WorkoutContext.jsx`
   - **Lignes** : 878-902, 918
   - **Implémentation** :
     - **Priorité 1** : Somme des durées des exercices (si `ex.duration` disponible)
       - Normalise les durées avec `normalizeRepsValue()` (gère secondes/minutes automatiquement)
       - Convertit secondes → minutes si > 60
     - **Priorité 2** : Estimation basée sur exercices complétés (5 min par exercice)
     - **Priorité 3** : `null` si aucune activité (AdvancedStats utilisera 30 par défaut)
   - **Source des données** : 
     - Exercices exceptionnels : `ex.duration` ou `ex.actualDuration`
     - Exercices endurance : `ex.duration` depuis `session.duration`
   - **Export JSON** : ✅ Calculé dynamiquement, pas besoin d'export (cohérent avec le design)
   - **Impact** : Corrige "Durée moyenne" dans AdvancedStats

**✅ Normalisation** :
- Utilise `normalizeRepsValue()` pour normaliser les durées des exercices
- Gère automatiquement secondes vs minutes (détection si < 60 = minutes, sinon secondes)

**✅ Cohérence avec IndexedDB** :
- `intensity` vient de `sessionFeedbacks` déjà stocké dans IndexedDB
- `duration` est calculé depuis les données existantes (pas de nouveau stockage nécessaire)
- Les données sont exportables via le système JSON existant (`sessionFeedbacks` déjà exporté)

**✅ Optimisations** :
- Calcul de `duration` optimisé avec priorité intelligente
- Réutilisation de `normalizeRepsValue()` déjà définie dans la fonction
- Pas de duplication de code

**✅ Tests à effectuer** :
- [ ] Vérifier avec données contenant des feedbacks (intensity doit être récupéré)
- [ ] Vérifier avec données sans feedbacks (intensity = null, AdvancedStats doit utiliser 5)
- [ ] Vérifier le calcul de duration avec exercices ayant des durées explicites
- [ ] Vérifier le calcul de duration avec estimation (5 min/exercice)
- [ ] Vérifier la conversion secondes → minutes pour les durées

---

**Date de dernière mise à jour** : 2025-11-06  
**Status** : 🟡 EN COURS - Phases 1.1, 1.2, 2.1, 4.2, 4.3 terminées | Phase 3 en attente (Tests)

---

### 2025-11-06 - Phase 1, Étape 1.2 : Vérification complète de la normalisation

**✅ Vérifications effectuées** :

1. **Audit complet de toutes les utilisations de valeurs numériques** :
   - **Fichier** : `src/components/AdvancedStats.jsx`
   - **Méthodologie** : Recherche systématique de toutes les utilisations de `reps`, `intensity`, `duration`, `totalReps`
   - **Résultat** : ✅ Toutes les valeurs utilisent `normalizeReps()` ou sont déjà normalisées

2. **Points vérifiés et validés** :
   - ✅ **Calculs de `totalReps`** (lignes 662, 665, 687, 689) : Tous utilisent `normalizeReps()`
   - ✅ **Calculs de `avgIntensity`** (lignes 670, 694) : Tous utilisent `normalizeReps(w.intensity || 5)`
   - ✅ **Calculs de `avgDuration`** (lignes 672, 696) : Tous utilisent `normalizeReps(w.duration || 30)`
   - ✅ **`getBestPerformanceDay`** (lignes 388, 397) : Utilise `normalizeReps()` pour toutes les valeurs
   - ✅ **`getMuscleDistribution`** (ligne 497) : Utilise `normalizeReps(exercise.reps)`
   - ✅ **`getProgressTrend`** (lignes 571, 578) : Utilise `normalizeReps()` pour toutes les valeurs
   - ✅ **`estimateCalories`** (lignes 598-600) : Utilise `normalizeReps()` pour reps, intensity, duration
   - ✅ **`normalizeExercise`** (ligne 122) : Normalise `reps` et `duration`
   - ✅ **`normalizeWorkout`** (lignes 164, 171-172) : Normalise `totalReps`, `intensity`, `duration`
   - ✅ **Affichage `bestDay`** (lignes 972-974) : Utilise `normalizeReps()` pour `reps` et `intensity`

3. **Vérification de la cohérence** :
   - ✅ Toutes les valeurs passent par `normalizeWorkoutData()` en premier (ligne 626)
   - ✅ Double vérification avec `normalizeReps()` dans tous les calculs
   - ✅ Aucune concaténation de chaînes possible

**✅ Résultat** : Toutes les normalisations sont correctes et cohérentes

---

### 2025-11-06 - Phase 2, Étape 2.1 : Correction de l'affichage "Meilleure performance"

**✅ Correction appliquée** :

- **Fichier** : `src/components/AdvancedStats.jsx`
- **Lignes** : 972-974
- **Problème identifié** : `e.reps` et `intensity` utilisés sans normalisation dans l'affichage
- **Solution** : Utilisation de `normalizeReps()` pour garantir des nombres
- **Code corrigé** :
  ```javascript
  {/* ✅ CORRECTION : Utiliser normalizeReps() pour éviter concaténation */}
  {stats.current.bestDay.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0)} reps • 
  Intensité {normalizeReps(stats.current.bestDay.intensity || 5)}/10
  ```
- **Impact** : Évite les concaténations de chaînes dans l'affichage de "Meilleure performance"

---

### 2025-11-06 - Phase 4, Étape 4.2 : Validation de cohérence pour répartition musculaire

**✅ Implémentation** :

- **Fichier** : `src/components/AdvancedStats.jsx`
- **Lignes** : 502-525
- **Objectif** : Détecter les problèmes de calcul ou données manquantes dans la répartition musculaire
- **Implémentation** :
  - Calcule la somme des pourcentages après calcul
  - Vérifie si la somme ≈ 100% (tolérance de 0.1% pour arrondis)
  - Log un warning en mode développement si écart détecté
  - Inclut les détails (distribution, result, total) pour debugging
- **Performance** : ✅ Uniquement en mode développement, pas d'impact en production
- **Utilité** : Détecte si certains exercices ne sont pas catégorisés ou si le calcul est incorrect

---

### 2025-11-06 - Phase 4, Étape 4.3 : Documentation de la formule de calcul des calories

**✅ Implémentation** :

- **Fichier** : `src/components/AdvancedStats.jsx`
- **Lignes** : 591-650
- **Objectif** : Documenter complètement la formule de calcul pour transparence et maintenabilité
- **Documentation ajoutée** :
  - **Méthode MET** : Explication complète du système MET (Metabolic Equivalent of Task)
  - **Formule durée** : `caloriesFromDuration = MET × 70kg × durée (heures)`
    - MET variable selon intensité : 3 (léger), 4.5 (modéré), 6 (intense)
  - **Formule volume** : `caloriesFromReps = totalReps × 0.3`
    - Coefficient 0.3 : estimation basée sur l'énergie par répétition
  - **Exemple concret** : Calcul détaillé avec valeurs réelles (100 reps, intensité 7, 45 min)
  - **Limitations** : Notes sur les facteurs de variation (poids réel, type d'exercices, etc.)
  - **Performance** : Complexité O(n) documentée
- **Impact** : Code plus maintenable, formule compréhensible pour futurs développeurs

---

### 2025-11-06 - CORRECTION CRITIQUE : calculateStreak() - Cohérence avec StatsTab

**🔴 Problème identifié** :
- **Symptôme** : "Série actuelle" affiche 2 jours alors que l'utilisateur a 3 séances consécutives
- **Cause** : Logique incorrecte dans `calculateStreak()` de `AdvancedStats.jsx`
- **Comparaison** : `calculateCurrentStreak()` dans `StatsTab.jsx` fonctionne correctement

**✅ Correction appliquée** :

- **Fichier** : `src/components/AdvancedStats.jsx`
- **Lignes** : 345-378
- **Problème** : 
  - Ancienne logique : Parcourrait les dates triées et vérifiait `daysDiff === streak` (incorrect)
  - Ne vérifiait pas correctement si les jours sont consécutifs depuis aujourd'hui
- **Solution** :
  - Utilise maintenant la même logique que `calculateCurrentStreak()` dans `StatsTab.jsx`
  - Parcourt les jours depuis aujourd'hui (i=0) jusqu'à 365 jours en arrière
  - Pour chaque jour, vérifie s'il y a un workout à cette date (Set pour O(1))
  - Si workout trouvé : incrémente streak
  - Si pas de workout ET i > 0 : break (série interrompue)
  - Si pas de workout ET i = 0 : continue (aujourd'hui peut ne pas avoir de workout)
- **Optimisation** :
  - Utilise un `Set` pour recherche O(1) au lieu de `some()` O(n)
  - Normalise les dates au format YYYY-MM-DD pour comparaison fiable
- **Impact** : La "Série actuelle" affiche maintenant correctement le nombre de jours consécutifs avec entraînement

---

### 2025-11-06 - INTÉGRATION CALORIES GARMIN : Utiliser les calories réelles quand disponibles

**✅ Implémentation** :

- **Fichier** : `src/components/AdvancedStats.jsx` et `src/App.jsx`
- **Objectif** : Utiliser les calories Garmin réelles au lieu de l'estimation MET quand disponibles
- **Implémentation** :
  - **`App.jsx`** :
    - Import de `useGarminData` hook
    - Chargement des données Garmin avec `loadAllData()` quand `dbReady`
    - Passage de `garminData` comme prop à `AdvancedStats`
  - **`AdvancedStats.jsx`** :
    - Ajout du prop `garminData` (optionnel, défaut `null`)
    - Nouvelle fonction `getGarminCaloriesForDate(dateStr)` :
      - Extrait les calories Garmin pour une date donnée
      - Gère les deux formats : objet `{total, active, resting}` ou nombre
      - Normalise avec `normalizeReps()` pour cohérence
      - Retourne `null` si pas de données Garmin
    - Modification de `estimateCalories()` :
      - **PRIORITÉ 1** : Utilise les calories Garmin si disponibles (`garminCalories > 0`)
      - **PRIORITÉ 2** : Estimation MET si pas de données Garmin (fallback)
- **Avantages** :
  - Calories plus précises quand données Garmin disponibles
  - Fallback automatique vers estimation MET si pas de données Garmin
  - Cohérence : normalisation avec `normalizeReps()` pour toutes les valeurs
- **Performance** : ✅ Recherche O(1) dans `dailyMetrics` par date

