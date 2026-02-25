# Analyse du Problème de Sauvegarde des Exercices

## Problème Observé

Quand l'utilisateur coche des exercices d'un programme personnalisé (non-actif) et les sauvegarde :
- ✅ La notification "Séance enregistrée avec succès" s'affiche
- ❌ Les statistiques restent à 0 (0 répétitions, 0 exercices)
- ❌ Le jour dans le calendrier reste blanc (0 en dessous)
- ❌ Les exercices ne sont pas affichés dans la vue détails

## Tentatives de Correction Effectuées

### Tentative 1 : Correction de la conversion des IDs
**Fichier modifié :** `src/components/CalendarHeatmap.jsx` (lignes ~2030-2064)

**Action :** Ajout de la conversion des IDs string en IDs numériques dans `availableVariants` pour les programmes personnalisés, en utilisant la même logique que dans `getIntensityForDate`.

**Résultat :** ❌ Aucun changement

**Analyse :** La conversion des IDs a été ajoutée, mais le problème persiste. Cela suggère que le problème n'est pas uniquement lié à la conversion des IDs.

### Tentative 2 : Utilisation de `getCurrentData()` dans `getIntensityForDate`
**Fichier modifié :** `src/components/CalendarHeatmap.jsx` (lignes ~355-625)

**Action :** Remplacement de `allData` par `currentData = getCurrentData()` dans `getIntensityForDate` pour utiliser les données fraîches à chaque appel.

**Résultat :** ❌ Aucun changement

**Analyse :** Même avec les données fraîches, les exercices ne sont pas détectés. Cela suggère que les données ne sont pas sauvegardées correctement ou avec les mauvaises clés.

### Tentative 3 : Amélioration de la logique de sauvegarde
**Fichier modifié :** `src/components/CalendarHeatmap.jsx` (lignes ~2147-2175)

**Action :** Amélioration de la logique pour gérer les exercices décochés et supprimer les données associées.

**Résultat :** ❌ Aucun changement

**Analyse :** La logique de sauvegarde semble correcte, mais les données ne sont toujours pas lues correctement.

## Analyse du Flux de Données

### 1. Chargement des Exercices dans le Formulaire

**Fichier :** `src/components/CalendarHeatmap.jsx`
**Lignes :** ~1995-2067

```javascript
// availableVariants est calculé avec les exercices du programme sélectionné
// Pour les programmes personnalisés, les IDs sont maintenant convertis
const availableVariants = (() => {
  // ... code pour charger les variantes
  // Conversion des IDs pour programmes personnalisés
  const convertExerciseId = (exId) => {
    if (typeof exId === 'string') {
      let hash = 0;
      for (let i = 0; i < exId.length; i++) {
        const char = exId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash) + 10000;
    }
    return exId;
  };
  // Les exercices sont convertis avec convertExerciseId
})();
```

**Problème potentiel :** Les exercices sont convertis, mais est-ce que `currentWorkout.exercices` utilise bien ces exercices convertis ?

### 2. Initialisation des Données (useEffect)

**Fichier :** `src/components/CalendarHeatmap.jsx`
**Lignes :** ~106-129

```javascript
useEffect(() => {
  if (panelMode === 'workout-entry' && workout && workout.exercices && panelDate) {
    const dateStr = getDateStr(panelDate);
    const allDataForEntry = getCurrentData();
    const initialReps = {};
    const initialChecked = {};
    
    const weekSuffix = selectedVariant === 'salle_semaineA' ? '_semaineA' : 
                       selectedVariant === 'salle_semaineB' ? '_semaineB' : '';
    
    workout.exercices.forEach(exercise => {
      const baseKey = `${dateStr}_${exercise.id}`;
      const key = weekSuffix ? `${baseKey}${weekSuffix}` : baseKey;
      
      initialReps[exercise.id] = allDataForEntry.reps[key] || allDataForEntry.reps[baseKey] || '';
      initialChecked[exercise.id] = allDataForEntry.checkedExercises[key] || allDataForEntry.checkedExercises[baseKey] || false;
    });
    
    setRepsData(initialReps);
    setCheckedExercises(initialChecked);
  }
}, [panelMode, workout, panelDate, selectedVariant, getCurrentData, getDateStr]);
```

**Problème potentiel :** 
- `workout.exercices` utilise-t-il les exercices avec les IDs convertis ?
- Les clés utilisées pour lire (`key`, `baseKey`) correspondent-elles aux clés utilisées pour sauvegarder ?

### 3. Sauvegarde des Données (handleSave)

**Fichier :** `src/components/CalendarHeatmap.jsx`
**Lignes :** ~2112-2200

```javascript
const handleSave = async () => {
  // ...
  const weekSuffix = effectiveVariant === 'salle_semaineA' ? '_semaineA' : 
                     effectiveVariant === 'salle_semaineB' ? '_semaineB' : '';
  
  // Sauvegarder les reps
  Object.entries(repsData).forEach(([exerciseId, reps]) => {
    if (reps && reps !== '') {
      const parsedReps = parseInt(reps);
      if (parsedReps >= 0 && parsedReps <= 999) {
        const key = weekSuffix ? `${saveDateStr}_${exerciseId}${weekSuffix}` : `${saveDateStr}_${exerciseId}`;
        updatedReps[key] = parsedReps;
      }
    }
  });
  
  // Sauvegarder les exercices cochés
  currentWorkout.exercices.forEach(exercise => {
    const exerciseId = exercise.id;
    const isChecked = checkedExercises[exerciseId] || false;
    const baseKey = `${saveDateStr}_${exercise.id}`;
    
    const possibleKeys = weekSuffix 
      ? [`${baseKey}${weekSuffix}`]
      : [baseKey, `${baseKey}_semaineA`, `${baseKey}_semaineB`];
    
    possibleKeys.forEach(key => {
      if (isChecked) {
        updatedCheckedExercises[key] = true;
      } else {
        delete updatedCheckedExercises[key];
        delete updatedReps[key];
      }
    });
  });
  
  await updateData({
    ...allDataForEntry,
    reps: updatedReps,
    checkedExercises: updatedCheckedExercises
  });
}
```

**Problèmes identifiés :**

1. **Incohérence dans la sauvegarde des reps :**
   - Pour les reps : on utilise `exerciseId` directement depuis `repsData` (qui utilise `exercise.id` comme clé)
   - Pour les checkedExercises : on utilise `exercise.id` depuis `currentWorkout.exercices`
   - Si `exercise.id` dans `currentWorkout` est différent de la clé dans `repsData`, les données ne correspondent pas

2. **Double logique de sauvegarde :**
   - On sauvegarde les reps avec `Object.entries(repsData)` qui utilise les clés de `repsData`
   - On sauvegarde les checkedExercises avec `currentWorkout.exercices.forEach` qui utilise `exercise.id`
   - Ces deux logiques peuvent utiliser des IDs différents !

3. **Gestion des variantes :**
   - Pour les reps : on utilise `weekSuffix` pour construire la clé
   - Pour les checkedExercises : on parcourt `possibleKeys` qui inclut toutes les variantes
   - Cela peut créer des incohérences

### 4. Lecture des Données (getIntensityForDate)

**Fichier :** `src/components/CalendarHeatmap.jsx`
**Lignes :** ~597-636

```javascript
exercisesList.forEach(exercise => {
  const baseKey = `${dateStr}_${exercise.id}`;
  
  // Chercher la clé avec les suffixes possibles
  let actualKey = baseKey;
  if (currentData?.reps?.[baseKey] !== undefined || currentData?.checkedExercises?.[baseKey] !== undefined) {
    actualKey = baseKey;
  } else {
    const possibleKeys = [`${baseKey}_semaineA`, `${baseKey}_semaineB`];
    for (const possibleKey of possibleKeys) {
      if (currentData?.reps?.[possibleKey] !== undefined || currentData?.checkedExercises?.[possibleKey] !== undefined) {
        actualKey = possibleKey;
        break;
      }
    }
  }
  
  const rawReps = currentData?.reps?.[actualKey] || 0;
  isCompleted = currentData?.checkedExercises?.[actualKey] || false;
  
  if (isCompleted && reps > 0) {
    completedExercises++;
    exercisesReps += reps;
    totalReps += reps;
  }
});
```

**Problème potentiel :**
- `exercise.id` dans `exercisesList` doit correspondre à l'ID utilisé lors de la sauvegarde
- Si les IDs ne correspondent pas, les données ne seront pas trouvées

## Problème Principal Identifié

**Le problème est une incohérence dans la façon dont les IDs sont utilisés entre :**

1. **Le formulaire (`repsData`, `checkedExercises`)** : Utilise `exercise.id` comme clé
2. **La sauvegarde (`handleSave`)** : Utilise `exerciseId` depuis `repsData` ET `exercise.id` depuis `currentWorkout.exercices`
3. **La lecture (`getIntensityForDate`)** : Utilise `exercise.id` depuis `exercisesList`

**Si `exercise.id` dans `currentWorkout` est différent de la clé dans `repsData`, les données ne seront pas sauvegardées correctement.**

## Solution Proposée

### Solution 1 : Unifier la logique de sauvegarde

**Problème :** La sauvegarde utilise deux sources différentes pour les IDs (`repsData` et `currentWorkout.exercices`).

**Solution :** Utiliser uniquement `currentWorkout.exercices` comme source de vérité pour les IDs, et s'assurer que `repsData` et `checkedExercises` utilisent les mêmes IDs.

**Modifications à apporter :**

1. **Dans `handleSave`, utiliser uniquement `currentWorkout.exercices` :**

```javascript
const handleSave = async () => {
  // ...
  
  // ✅ UNIFIER : Utiliser uniquement currentWorkout.exercices comme source de vérité
  currentWorkout.exercices.forEach(exercise => {
    const exerciseId = exercise.id; // ID converti si programme personnalisé
    const isChecked = checkedExercises[exerciseId] || false;
    const reps = repsData[exerciseId] || '';
    
    const baseKey = `${saveDateStr}_${exerciseId}`;
    const key = weekSuffix ? `${baseKey}${weekSuffix}` : baseKey;
    
    if (isChecked && reps && reps !== '') {
      const parsedReps = parseInt(reps);
      if (parsedReps >= 0 && parsedReps <= 999) {
        updatedReps[key] = parsedReps;
        updatedCheckedExercises[key] = true;
      }
    } else {
      // Si décoché ou pas de reps, supprimer les données
      delete updatedReps[key];
      delete updatedCheckedExercises[key];
      // Aussi supprimer les variantes possibles
      delete updatedReps[`${baseKey}_semaineA`];
      delete updatedReps[`${baseKey}_semaineB`];
      delete updatedCheckedExercises[`${baseKey}_semaineA`];
      delete updatedCheckedExercises[`${baseKey}_semaineB`];
    }
  });
  
  await updateData({
    ...allDataForEntry,
    reps: updatedReps,
    checkedExercises: updatedCheckedExercises
  });
}
```

2. **S'assurer que `currentWorkout` utilise bien les exercices avec IDs convertis :**

Vérifier que `currentWorkout.exercices` provient bien de `availableVariants` qui a les IDs convertis.

3. **Ajouter des logs de debug pour vérifier les IDs :**

```javascript
console.log('[DEBUG] Exercices dans currentWorkout:', currentWorkout.exercices.map(ex => ({ id: ex.id, name: ex.name })));
console.log('[DEBUG] Clés dans repsData:', Object.keys(repsData));
console.log('[DEBUG] Clés dans checkedExercises:', Object.keys(checkedExercises));
console.log('[DEBUG] Clés sauvegardées:', Object.keys(updatedReps), Object.keys(updatedCheckedExercises));
```

### Solution 2 : Vérifier que `currentWorkout` est bien mis à jour

**Problème :** `currentWorkout` est calculé dans le rendu mais peut ne pas être mis à jour correctement.

**Solution :** S'assurer que `setWorkout(currentWorkout)` est appelé correctement et que `workout` dans le `useEffect` utilise bien les exercices avec IDs convertis.

### Solution 3 : Vérifier la conversion des IDs dans `availableVariants`

**Problème :** La conversion des IDs peut ne pas être appliquée correctement à tous les niveaux.

**Solution :** Vérifier que la conversion est bien appliquée à :
- `daySchedule.exercises` (variante maison)
- `daySchedule.salleVariants.semaineA.exercises`
- `daySchedule.salleVariants.semaineB.exercises`

## Plan d'Action Recommandé

1. **Ajouter des logs de debug** pour voir exactement quels IDs sont utilisés à chaque étape
2. **Unifier la logique de sauvegarde** pour utiliser uniquement `currentWorkout.exercices`
3. **Vérifier que la conversion des IDs est bien appliquée** partout où nécessaire
4. **Tester avec un programme personnalisé** et vérifier les logs pour identifier où les IDs divergent

## Conclusion

Le problème principal est une **incohérence dans l'utilisation des IDs** entre le formulaire, la sauvegarde et la lecture. La solution est d'**unifier la logique** pour utiliser `currentWorkout.exercices` comme source unique de vérité pour les IDs, et de s'assurer que ces IDs sont bien convertis pour les programmes personnalisés.


