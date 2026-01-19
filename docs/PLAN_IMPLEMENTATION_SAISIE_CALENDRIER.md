# Plan d'Implémentation - Saisie depuis le Calendrier

## 📋 Vue d'Ensemble

Ce plan détaille l'implémentation de la fonctionnalité permettant de saisir une séance directement depuis le calendrier en cliquant sur une case blanche, tout en préservant la possibilité de justifier une absence.

## 🎯 Objectifs Techniques

- **Réutiliser** au maximum le code existant (onglet "Saisie", modals, hooks)
- **Minimiser** les modifications sur les composants existants
- **Optimiser** les performances (mémorisation, lazy loading)
- **Maintenir** la compatibilité avec les données existantes
- **Tester** chaque étape avant de passer à la suivante

## 📦 Phase 1 : Préparation et Structure

### 1.1 Créer les Nouveaux Composants (Structure Vide)

**Fichiers à créer :**

1. `src/components/modals/CalendarWorkoutChoiceModal.jsx`
   - Structure de base avec props : `isOpen`, `onClose`, `date`, `onJustify`, `onEnterWorkout`
   - Affichage de la date formatée
   - Deux boutons : "Justifier l'absence" et "Saisir une séance"

2. `src/components/modals/CalendarWorkoutEntryModal.jsx`
   - Structure de base avec props : `isOpen`, `onClose`, `date`
   - État local pour : `selectedProgram`, `exercises`, `repsData`, `checkedExercises`
   - Layout de base avec sélecteur de programme et liste d'exercices

**Actions :**
- [ ] Créer les fichiers avec structure minimale
- [ ] Importer les dépendances de base (React, hooks, UI components)
- [ ] Tester que les modals s'ouvrent/ferment correctement

### 1.2 Analyser le Code Existant

**Fichiers à analyser en détail :**

1. `src/components/tabs/DataEntryTab.jsx`
   - Comprendre la logique de sélection de programme
   - Comprendre la gestion des exercices et reps
   - Identifier les fonctions réutilisables

2. `src/components/CalendarHeatmap.jsx`
   - Comprendre le handler `onClick` actuel
   - Identifier où intégrer la nouvelle modal de choix

3. `src/context/WorkoutContext.jsx`
   - Identifier les fonctions disponibles : `updateReps`, `toggleCheck`, `getTodayWorkout`
   - Comprendre la structure de `activeProgram`

**Actions :**
- [ ] Lire et annoter le code existant
- [ ] Identifier les fonctions à réutiliser
- [ ] Documenter les patterns existants

## 📦 Phase 2 : Modal de Choix

### 2.1 Implémenter `CalendarWorkoutChoiceModal`

**Fonctionnalités :**

1. **Affichage de la date**
   - Utiliser `useFormatters` pour formater la date
   - Format : "Jeudi 15 janvier 2026"

2. **Deux boutons d'action**
   - Bouton "Justifier l'absence" (rouge/orange)
   - Bouton "Saisir une séance" (vert/violet)
   - Gestion du clic avec callbacks

3. **Gestion du clavier**
   - Escape pour fermer
   - Tab pour navigation
   - Enter sur bouton pour action

**Code de base :**

```javascript
const CalendarWorkoutChoiceModal = ({ isOpen, onClose, date, onJustify, onEnterWorkout }) => {
  const { formatDate: formatLocaleDate } = useFormatters();
  const t = useTranslation();
  
  const formattedDate = useMemo(() => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return formatLocaleDate(dateObj, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [date, formatLocaleDate]);

  const handleJustify = useCallback(() => {
    onJustify();
    onClose();
  }, [onJustify, onClose]);

  const handleEnterWorkout = useCallback(() => {
    onEnterWorkout();
    onClose();
  }, [onEnterWorkout, onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('calendar.workoutChoice.title')}>
      {/* Contenu */}
    </Modal>
  );
};
```

**Actions :**
- [ ] Implémenter la structure de base
- [ ] Ajouter le formatage de date
- [ ] Implémenter les deux boutons
- [ ] Tester l'ouverture/fermeture
- [ ] Tester les callbacks

### 2.2 Intégrer dans `CalendarHeatmap`

**Modifications :**

1. **Ajouter état pour la modal de choix**
   ```javascript
   const [workoutChoiceModalDate, setWorkoutChoiceModalDate] = useState(null);
   ```

2. **Modifier le handler onClick des cases blanches**
   ```javascript
   onClick={() => {
     const dateStr = getDateStr(day.date);
     const hasJustification = !!day.intensity?.justification;
     const isWhiteDay = day.intensity.level === 0 && !hasJustification;
     
     if (isWhiteDay && isDayWithoutActivity(allData, dateStr)) {
       // Ouvrir modal de choix au lieu de justification directe
       setWorkoutChoiceModalDate(day.date);
     } else {
       setSelectedDate(day);
     }
   }}
   ```

3. **Gérer les callbacks de la modal de choix**
   ```javascript
   const handleJustifyFromChoice = useCallback((date) => {
     setJustificationModalDate(date);
   }, []);

   const handleEnterWorkoutFromChoice = useCallback((date) => {
     setWorkoutEntryModalDate(date);
   }, []);
   ```

**Actions :**
- [ ] Ajouter l'état `workoutChoiceModalDate`
- [ ] Modifier le handler `onClick`
- [ ] Ajouter la modal dans le JSX
- [ ] Tester que le clic ouvre la modal de choix
- [ ] Tester que les deux boutons fonctionnent

## 📦 Phase 3 : Modal de Saisie de Séance

### 3.1 Implémenter la Sélection de Programme

**Fonctionnalités :**

1. **Dropdown de sélection**
   - Liste des programmes disponibles (depuis `WorkoutContext`)
   - Programme actif sélectionné par défaut
   - Programme par défaut (workoutProgram) si admin et pas de programme actif

2. **Chargement des exercices**
   - Utiliser `getTodayWorkout(date, isGymMode)` pour obtenir les exercices
   - Gérer les variantes de semaine si applicable
   - Afficher les exercices une fois le programme sélectionné

**Code de base :**

```javascript
const CalendarWorkoutEntryModal = ({ isOpen, onClose, date }) => {
  const { 
    activeProgram, 
    programs,
    getTodayWorkout, 
    updateReps, 
    toggleCheck,
    getDateStr,
    getDayName
  } = useWorkout();
  
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [repsData, setRepsData] = useState({});
  const [checkedExercises, setCheckedExercises] = useState({});

  const dateStr = useMemo(() => getDateStr(date), [date, getDateStr]);
  const dayName = useMemo(() => getDayName(date), [date, getDayName]);

  // Initialiser avec le programme actif
  useEffect(() => {
    if (activeProgram) {
      setSelectedProgramId(activeProgram.id);
    }
  }, [activeProgram]);

  // Charger les exercices quand le programme change
  useEffect(() => {
    if (selectedProgramId && date) {
      const workout = getTodayWorkout(date, false);
      if (workout && workout.exercices) {
        setExercises(workout.exercices);
      }
    }
  }, [selectedProgramId, date, getTodayWorkout]);
  
  // ... reste de l'implémentation
};
```

**Actions :**
- [ ] Implémenter le dropdown de sélection
- [ ] Charger les exercices selon le programme
- [ ] Gérer le programme par défaut (si admin)
- [ ] Tester la sélection et le chargement

### 3.2 Implémenter l'Affichage et la Saisie des Exercices

**Fonctionnalités :**

1. **Liste des exercices**
   - Afficher chaque exercice avec checkbox
   - Champ de saisie pour les reps
   - Auto-remplissage des reps au focus (comme dans DataEntryTab)

2. **Gestion de l'état**
   - `checkedExercises` : objet `{ "date_exerciseId": true/false }`
   - `repsData` : objet `{ "exerciseId": "reps" }`
   - Synchronisation avec les données existantes

**Code de base :**

```javascript
// Gestion des reps
const handleRepsChange = useCallback((exerciseId, value) => {
  setRepsData(prev => ({
    ...prev,
    [exerciseId]: value
  }));
}, []);

// Gestion du coché/décoché
const handleToggleCheck = useCallback((exerciseId) => {
  const key = `${dateStr}_${exerciseId}`;
  setCheckedExercises(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
}, [dateStr]);

// Auto-remplissage au focus
const handleInputFocus = useCallback((exerciseId, exercise) => {
  const currentValue = repsData[exerciseId] || '';
  if (!currentValue && exercise.series) {
    const autoReps = calculateAutoReps(exercise.series);
    if (autoReps) {
      handleRepsChange(exerciseId, autoReps.toString());
    }
  }
}, [repsData, handleRepsChange]);
```

**Actions :**
- [ ] Implémenter l'affichage de la liste d'exercices
- [ ] Ajouter les checkboxes
- [ ] Ajouter les champs de saisie de reps
- [ ] Implémenter l'auto-remplissage
- [ ] Tester la saisie et le coché/décoché

### 3.3 Implémenter la Sauvegarde

**Fonctionnalités :**

1. **Validation**
   - Vérifier qu'au moins un exercice est coché
   - Valider les valeurs de reps (nombres positifs)
   - Afficher des erreurs si nécessaire

2. **Sauvegarde**
   - Appeler `updateReps()` pour chaque exercice avec reps
   - Appeler `toggleCheck()` pour chaque exercice coché
   - Utiliser la date sélectionnée (pas la date du jour)

3. **Feedback**
   - Afficher un message de succès
   - Fermer la modal
   - Le calendrier se mettra à jour automatiquement (réactivité du contexte)

**Code de base :**

```javascript
const handleSave = useCallback(() => {
  // Validation
  const hasCheckedExercise = Object.values(checkedExercises).some(v => v === true);
  if (!hasCheckedExercise) {
    showError(t('calendar.workoutEntry.validation.noExerciseChecked'));
    return;
  }

  // Sauvegarder les reps
  Object.entries(repsData).forEach(([exerciseId, reps]) => {
    if (reps && reps !== '') {
      const parsedReps = parseInt(reps);
      if (parsedReps >= 0 && parsedReps <= 999) {
        updateReps(parseInt(exerciseId), reps, date);
      }
    }
  });

  // Cocher les exercices
  Object.entries(checkedExercises).forEach(([key, isChecked]) => {
    if (isChecked) {
      const exerciseId = parseInt(key.split('_')[1]);
      const currentKey = `${dateStr}_${exerciseId}`;
      // Vérifier si pas déjà coché
      if (!currentData.checkedExercises[currentKey]) {
        toggleCheck(exerciseId, date);
      }
    }
  });

  showSuccess(t('calendar.workoutEntry.messages.saveSuccess'));
  onClose();
}, [checkedExercises, repsData, date, dateStr, updateReps, toggleCheck, currentData, showSuccess, showError, t, onClose]);
```

**Actions :**
- [ ] Implémenter la validation
- [ ] Implémenter la sauvegarde des reps
- [ ] Implémenter la sauvegarde des exercices cochés
- [ ] Ajouter les messages de feedback
- [ ] Tester la sauvegarde complète

### 3.4 Intégrer dans `CalendarHeatmap`

**Modifications :**

1. **Ajouter état pour la modal de saisie**
   ```javascript
   const [workoutEntryModalDate, setWorkoutEntryModalDate] = useState(null);
   ```

2. **Ajouter la modal dans le JSX**
   ```javascript
   <CalendarWorkoutEntryModal
     isOpen={!!workoutEntryModalDate}
     onClose={() => setWorkoutEntryModalDate(null)}
     date={workoutEntryModalDate}
   />
   ```

**Actions :**
- [ ] Ajouter l'état `workoutEntryModalDate`
- [ ] Ajouter la modal dans le JSX
- [ ] Connecter avec la modal de choix
- [ ] Tester le flux complet

## 📦 Phase 4 : Optimisations et Améliorations

### 4.1 Optimisations de Performance

**Actions :**
- [ ] Utiliser `useMemo` pour les calculs coûteux
- [ ] Utiliser `useCallback` pour tous les handlers
- [ ] Mémoriser les listes d'exercices
- [ ] Lazy loading si nécessaire

### 4.2 Améliorations UX

**Actions :**
- [ ] Ajouter des tooltips sur les exercices
- [ ] Améliorer le feedback visuel lors de la saisie
- [ ] Gérer les états de chargement
- [ ] Améliorer la gestion d'erreurs

### 4.3 Gestion des Cas Edge

**Cas à gérer :**
- Date future (avertissement mais autoriser)
- Date très ancienne (limite raisonnable)
- Programme supprimé entre-temps
- Exercice supprimé du programme

**Actions :**
- [ ] Ajouter des validations pour les dates
- [ ] Gérer les programmes/exercices supprimés
- [ ] Ajouter des messages d'avertissement si nécessaire

## 📦 Phase 5 : Tests et Validation

### 5.1 Tests Fonctionnels

**Scénarios à tester :**

1. **Clic sur case blanche**
   - [ ] Modal de choix s'affiche
   - [ ] Date correctement formatée
   - [ ] Deux boutons fonctionnels

2. **Choix "Justifier"**
   - [ ] Modal de justification s'ouvre
   - [ ] Fonctionnalité existante préservée

3. **Choix "Saisir une séance"**
   - [ ] Modal de saisie s'ouvre
   - [ ] Programme actif sélectionné par défaut
   - [ ] Exercices du jour affichés

4. **Saisie complète**
   - [ ] Sélection de programme fonctionne
   - [ ] Cocher/décocher fonctionne
   - [ ] Saisie de reps fonctionne
   - [ ] Auto-remplissage fonctionne
   - [ ] Sauvegarde fonctionne

5. **Vérification dans le calendrier**
   - [ ] Case se met à jour après sauvegarde
   - [ ] Clic sur case avec activité → récap s'affiche

6. **Rétroactivité**
   - [ ] Saisie pour date passée fonctionne
   - [ ] Date correctement enregistrée

### 5.2 Tests de Performance

**Actions :**
- [ ] Mesurer le temps d'ouverture des modals
- [ ] Vérifier qu'il n'y a pas de ralentissement du calendrier
- [ ] Tester avec beaucoup d'exercices

### 5.3 Tests de Compatibilité

**Actions :**
- [ ] Vérifier que les données existantes fonctionnent toujours
- [ ] Vérifier qu'aucune régression n'a été introduite
- [ ] Tester avec différents types de programmes

## 📦 Phase 6 : Documentation et Finalisation

### 6.1 Documentation

**Actions :**
- [ ] Documenter les nouveaux composants
- [ ] Ajouter des commentaires dans le code
- [ ] Mettre à jour la documentation utilisateur si nécessaire

### 6.2 Nettoyage

**Actions :**
- [ ] Supprimer le code commenté
- [ ] Vérifier qu'il n'y a pas de console.log
- [ ] Optimiser les imports

## 🔄 Ordre d'Implémentation Recommandé

1. **Phase 1** : Préparation (1-2h)
2. **Phase 2** : Modal de choix (2-3h)
3. **Phase 3.1-3.2** : Modal de saisie - structure et affichage (3-4h)
4. **Phase 3.3-3.4** : Modal de saisie - sauvegarde et intégration (2-3h)
5. **Phase 4** : Optimisations (2-3h)
6. **Phase 5** : Tests (2-3h)
7. **Phase 6** : Documentation (1h)

**Total estimé : 13-19 heures**

## ⚠️ Points de Vigilance

1. **Ne pas casser la fonctionnalité existante**
   - Tester après chaque modification
   - Vérifier que la justification fonctionne toujours

2. **Cohérence des données**
   - Utiliser le même format que l'onglet "Saisie"
   - Vérifier la compatibilité avec les données existantes

3. **Performance**
   - Ne pas recharger toutes les données à chaque ouverture
   - Utiliser la mémorisation judicieusement

4. **UX**
   - Interface claire et intuitive
   - Feedback utilisateur approprié
   - Gestion d'erreurs robuste

## ✅ Checklist Finale

- [ ] Modal de choix fonctionnelle
- [ ] Modal de saisie fonctionnelle
- [ ] Intégration dans CalendarHeatmap
- [ ] Sauvegarde correcte des données
- [ ] Mise à jour du calendrier après sauvegarde
- [ ] Fonctionnalité de justification préservée
- [ ] Rétroactivité fonctionnelle
- [ ] Performance optimale
- [ ] Tests passés
- [ ] Documentation à jour
- [ ] Aucune régression
