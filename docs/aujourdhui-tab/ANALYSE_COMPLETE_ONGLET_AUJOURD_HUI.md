# 📊 ANALYSE COMPLÈTE - ONGLET "AUJOURD'HUI"

## 🎯 RÔLE ET FONCTION PRINCIPALE

L'onglet "Aujourd'hui" est **le cœur opérationnel** de l'application de suivi d'entraînement. Il permet à l'utilisateur de :

1. **Visualiser** le programme d'entraînement du jour
2. **Suivre** la progression en temps réel (exercices, répétitions, étirements)
3. **Gérer** les activités complémentaires (boxe, natation, etc.)
4. **Valider** les défis actifs
5. **Enregistrer** un feedback de session
6. **Basculer** entre mode maison et salle pour certains jours (samedi/dimanche)

---

## 📁 ARCHITECTURE ET FICHIERS

### Fichier Principal

#### 1. `src/components/tabs/TodayTab.jsx` (900 lignes)
**Fichier central** qui orchestre toute la logique de l'onglet.

**Responsabilités :**
- Affichage du workout du jour
- Gestion des états locaux (exercices cochés, répétitions, étirements)
- Intégration avec le contexte global (`WorkoutContext`)
- Gestion des modifications non sauvegardées
- Affichage conditionnel selon le type de jour (repos vs entraînement)
- Calcul automatique des répétitions basées sur les séries
- Gestion des variantes de semaine (A/B) pour mode salle

**Composants importés :**
- `Card`, `CardHeader`, `CardTitle`, `CardContent` (UI)
- `Button`, `Input`, `Checkbox` (UI)
- `ChallengeCard` (défis)
- `SessionFeedback` (modal de feedback)

---

### Fichiers de Dépendances

#### 2. `src/context/WorkoutContext.jsx` (1284 lignes)
**Contexte global** qui fournit :
- `data` : Toutes les données d'entraînement (exercices, reps, étirements, défis, etc.)
- `updateData` : Fonction de sauvegarde
- `getTodayWorkout` : Fonction pour récupérer le workout du jour
- `getCurrentData` : Récupère les données actuelles (temp ou réelles)
- `hasUnsavedExercises` / `hasUnsavedStretches` : États de modifications non sauvegardées
- `saveExerciseChanges` / `saveStretchChanges` : Sauvegarde des modifications
- `discardExerciseChanges` / `discardStretchChanges` : Annulation des modifications
- `updateTempExerciseData` / `updateTempStretchData` : Mise à jour des données temporaires
- `isGymMode` / `setIsGymMode` : Mode salle/maison
- `setSessionData` / `setShowSessionFeedback` : Gestion du feedback de session

#### 3. `src/data/workoutProgram.js` (253 lignes)
**Base de données** du programme d'entraînement contenant :
- Structure complète par jour de la semaine (lundi à dimanche)
- Exercices avec séries, matériel, notes
- Étirements (matin, midi, soir)
- Activités complémentaires (boxe, natation)
- Variantes salle pour samedi/dimanche (semaineA/semaineB)

**Structure d'un jour :**
```javascript
{
  name: "Nom du workout",
  focus: "Focus musculaire",
  etirements: {
    matin: "...",
    midi: "...",
    soir: "..."
  },
  exercices: [
    { id: 101, name: "...", series: "4×10-12", materiel: "...", notes: "..." }
  ],
  duree: "45-55 min",
  complementaryActivity: {
    name: "Boxe",
    duration: 90,
    timeSlot: "19h30-21h",
    type: "cardio_technique",
    benefits: ["coordination", "cardio", "stress_relief"]
  },
  salleVariants: { // Uniquement samedi/dimanche
    semaineA: { ... },
    semaineB: { ... }
  }
}
```

#### 4. `src/hooks/useWorkoutLogic.js` (293 lignes)
**Hook de logique métier** fournissant :
- `getTodayWorkout(currentDate, isGymMode)` : Récupère le workout selon la date et le mode
- `toggleCheck(exerciseId, date, autoReps)` : Cocher/décocher un exercice
- `updateReps(exerciseId, reps, date)` : Mettre à jour les répétitions
- `calculateAverageReps(seriesText)` : Calcul automatique des reps depuis "4×10-12"
- `getAutoWeekVariant(date)` : Calcul automatique semaine A/B

#### 5. `src/utils/dateUtils.js` (97 lignes)
**Utilitaires de gestion de dates** :
- `getDateStr(date)` : Convertit en format "YYYY-MM-DD"
- `getDayName(date)` : Retourne le nom du jour en français
- `getAutoWeekVariant(date)` : Calcule automatiquement semaine A/B basée sur le numéro de semaine
- `getWeekNumber(date)` : Calcule le numéro de semaine ISO
- Autres fonctions utilitaires (formatDate, isToday, etc.)

#### 6. `src/components/ui/ChallengeCard.jsx` (198 lignes)
**Composant UI** pour afficher et valider les défis :
- Affichage des défis actifs (ponctuel, récurrent, période)
- Formulaire de validation avec champs adaptés (reps, durée, distance)
- Intégration avec `TodayTab` via callback `onComplete`

#### 7. `src/components/SessionFeedback.jsx` (355+ lignes)
**Modal de feedback** pour évaluer la session :
- 4 étapes de feedback (ressenti, énergie, conditions, objectifs)
- Évaluation par étoiles (1-10) pour multiple métriques
- Tags prédéfinis pour catégoriser la session
- Sauvegarde dans `data.sessionFeedback`

#### 8. Composants UI (`src/components/ui/`)
- `Card.jsx` : Composant de carte réutilisable
- `Button.jsx` : Bouton avec variants
- `Input.jsx` : Champ de saisie
- `Badge.jsx` : Badge pour affichage de tags

---

## 🔄 FLUX DE DONNÉES ET LOGIQUE

### 1. Chargement Initial

```
App.jsx
  └─> TodayTab.jsx
      └─> useWorkout() (WorkoutContext)
          ├─> getTodayWorkout(currentDate, isGymMode)
          │   └─> useWorkoutLogic.getTodayWorkout()
          │       └─> workoutProgram[dayName]
          ├─> data (depuis IndexedDB)
          └─> currentDate
```

### 2. Affichage du Workout

**Logique de sélection du workout :**
1. Calcul du nom du jour (`getDayName(currentDate)`)
2. Récupération du workout de base (`workoutProgram[dayName]`)
3. Vérification du mode salle pour samedi/dimanche
4. Si mode salle activé → utilisation de `salleVariants.semaineA` ou `salleVariants.semaineB`
5. Calcul automatique de la variante selon le numéro de semaine ISO

### 3. Gestion des Exercices

**Structure des clés de données :**
- Format standard : `YYYY-MM-DD_exerciseId`
- Format mode salle : `YYYY-MM-DD_exerciseId_semaineA` ou `_semaineB`
- Exemple : `2024-01-15_101` ou `2024-01-15_631_semaineA`

**Données stockées :**
- `data.checkedExercises[key]` : Boolean (exercice coché ou non)
- `data.reps[key]` : String (nombre de répétitions)

**Flux de modification :**
```
1. Clic sur checkbox → handleExerciseCheck()
2. Calcul auto des reps si vide → calculateAutoReps()
3. Mise à jour → updateTempExerciseData(newData)
4. État → hasUnsavedExercises = true
5. Affichage des boutons "Enregistrer" / "Annuler"
6. Sauvegarde → saveExerciseChanges() → updateData() → IndexedDB
```

**Auto-remplissage des répétitions :**
- Au focus du champ : `handleInputFocus()` calcule depuis `exercise.series`
- Format détecté : `4×10-12` → moyenne = 11 → total = 44 reps
- Format détecté : `3×12` → total = 36 reps

### 4. Gestion des Étirements

**Structure des clés :**
- Format : `YYYY-MM-DD_moment` (matin, midi, soir)
- Exemple : `2024-01-15_matin`

**Données stockées :**
- `data.checkedStretches[key]` : Boolean

**Flux similaire aux exercices** avec gestion séparée des modifications non sauvegardées.

### 5. Activités Complémentaires

**Structure :**
- Checkbox : `YYYY-MM-DD_complementary_activityName`
- Minutes : `YYYY-MM-DD_complementary_activityName_minutes`

**Exemple :**
- `2024-01-15_complementary_boxe` : Boolean
- `2024-01-15_complementary_boxe_minutes` : String

### 6. Sessions d'Endurance du Jour

**Affichage conditionnel :**
- Récupération depuis `data.enduranceData.sessions`
- Filtrage par date du jour (`dateStr`)
- Affichage des sessions de tous types d'activités (boxing, pushups, swimming, jumprope, running)

### 7. Défis Actifs

**Logique de filtrage :**
- `getActiveChallenges()` filtre les défis selon :
  - Type récurrent : affiché si non réalisé aujourd'hui (`lastCompletedDate !== todayStr`)
  - Type ponctuel : affiché si `targetDate >= maintenant`
  - Type période : affiché si `endDate >= maintenant`

**Validation d'un défi :**
- `handleChallengeComplete()` crée une session d'endurance
- Met à jour `enduranceData.sessions[activityType]`
- Met à jour `enduranceData.challenges[challengeId]` avec statut complété

### 8. Feedback de Session

**Calcul de la durée :**
- `calculateSessionDuration()` parcourt les exercices complétés
- Calcule le temps par exercice selon :
  - Type isométrique (planche, gainage) : temps en secondes/minutes
  - Type dynamique : (sets × reps × temps/rep) + temps de repos
- Durée par défaut : 3s/rep, repos 90s entre séries

**Données transmises à SessionFeedback :**
```javascript
{
  date: "2024-01-15",
  exercises: [...], // Exercices complétés
  totalReps: 450,
  estimatedDuration: 45,
  duration: 52 // Calculé réellement
}
```

---

## 🎨 INTERFACE UTILISATEUR

### Sections Affichées

1. **En-tête du Workout**
   - Nom du workout
   - Focus musculaire
   - Durée estimée
   - Toggle Maison/Salle (uniquement samedi/dimanche)
   - Indicateur de semaine (A/B)

2. **Section Exercices**
   - Liste des exercices avec :
     - Nom
     - Séries (ex: "4×10-12")
     - Matériel
     - Notes
   - Checkbox pour valider
   - Champ de saisie des répétitions (auto-remplissage)
   - Bouton variations (⚡)
   - Indicateur "✓ Fait" si coché
   - Boutons Enregistrer/Annuler si modifications non sauvegardées

3. **Activités Complémentaires**
   - Affichage spécial avec badge de type
   - Checkbox + champ minutes
   - Bénéfices affichés

4. **Section Étirements**
   - Étirements par moment (matin, midi, soir)
   - Description de chaque étirement
   - Checkbox pour valider
   - Boutons Enregistrer/Annuler si modifications

5. **Sessions d'Endurance du Jour**
   - Carte avec toutes les sessions d'endurance enregistrées aujourd'hui
   - Affichage des métriques (reps, durée, distance, sauts)

6. **Défis Actifs**
   - Cartes des défis avec :
     - Type (ponctuel, récurrent, période)
     - Objectif
     - Formulaire de validation

7. **Bouton Feedback de Session**
   - Ouvre la modal `SessionFeedback`
   - Calcul automatique de la durée réelle

### États Visuels

- **Exercice coché** : Fond vert clair, bordure verte, texte vert
- **Exercice non coché** : Fond gris foncé, bordure grise
- **Modifications non sauvegardées** : Indicateur jaune pulsant, boutons Enregistrer/Annuler
- **Jour de repos** : Message spécial avec emoji 🎉

---

## 🔧 GESTION DES MODIFICATIONS NON SAUVEGARDÉES

### Système de Données Temporaires

**Principe :**
- Les modifications sont stockées dans `tempData` (état local du contexte)
- Les données réelles restent dans `data` jusqu'à la sauvegarde
- `getCurrentData()` retourne `tempData` si modifications, sinon `data`

**Avantages :**
- Annulation possible des modifications
- Pas de corruption des données en cas d'erreur
- Indication visuelle claire des modifications non sauvegardées

**Flux :**
```
1. Modification → updateTempExerciseData(newData)
2. État → hasUnsavedExercises = true
3. Affichage → Boutons Enregistrer/Annuler
4. Sauvegarde → saveExerciseChanges() → updateData(tempData)
5. État → hasUnsavedExercises = false, tempData = null
```

---

## 📊 DONNÉES STOCKÉES

### Structure Principale (`data`)

```javascript
{
  // Exercices
  checkedExercises: {
    "2024-01-15_101": true,
    "2024-01-15_102": false,
    "2024-01-15_631_semaineA": true
  },
  reps: {
    "2024-01-15_101": "44",
    "2024-01-15_631_semaineA": "32"
  },
  
  // Étirements
  checkedStretches: {
    "2024-01-15_matin": true,
    "2024-01-15_midi": false,
    "2024-01-15_soir": true
  },
  
  // Endurance
  enduranceData: {
    sessions: {
      boxing: [{ id, date, time, duration, ... }],
      pushups: [...],
      swimming: [...]
    },
    challenges: [...]
  },
  
  // Autres
  progressPhotos: [...],
  progressEntries: [...],
  sessionFeedback: [...]
}
```

---

## 🔄 VARIANTES DE SEMAINE (A/B)

### Calcul Automatique

**Fonction :** `getAutoWeekVariant(date)`
- Basé sur le numéro de semaine ISO
- Semaine paire → 'A'
- Semaine impaire → 'B'

**Application :**
- Samedi et dimanche uniquement
- Mode salle activé
- Utilisation de `salleVariants.semaineA` ou `salleVariants.semaineB`

**Clés de données :**
- Exercices mode salle : `YYYY-MM-DD_exerciseId_semaineA` ou `_semaineB`

---

## 🎯 POINTS CLÉS DE FONCTIONNEMENT

1. **Séparation des responsabilités** :
   - `TodayTab` : Présentation et logique UI
   - `WorkoutContext` : État global et persistance
   - `useWorkoutLogic` : Logique métier pure
   - `workoutProgram` : Données statiques

2. **Gestion des modifications** :
   - Système de données temporaires pour éviter corruption
   - Sauvegarde explicite requise
   - Annulation possible

3. **Auto-remplissage intelligent** :
   - Calcul automatique des reps depuis les séries
   - Format supporté : `N×X-Y`, `N×X`, `X-Y`, `X`

4. **Flexibilité** :
   - Mode maison/salle pour certains jours
   - Variantes de semaine automatiques
   - Support des activités complémentaires

5. **Intégration** :
   - Défis depuis l'onglet Endurance
   - Sessions d'endurance du jour
   - Feedback de session avec calcul de durée

---

## 📈 STATISTIQUES DU CODE

- **Fichier principal** : `TodayTab.jsx` = 900 lignes
- **Dépendances** :
  - `WorkoutContext.jsx` = 1284 lignes
  - `workoutProgram.js` = 253 lignes
  - `useWorkoutLogic.js` = 293 lignes
  - `dateUtils.js` = 97 lignes
  - `ChallengeCard.jsx` = 198 lignes
  - `SessionFeedback.jsx` = 355+ lignes

**Total estimé : ~3186 lignes** pour l'écosystème complet de l'onglet

---

## 🎨 DESIGN PATTERNS UTILISÉS

1. **Context API** : État global partagé
2. **Custom Hooks** : Logique métier réutilisable
3. **Composition** : Composants UI modulaires
4. **Separation of Concerns** : Logique, présentation, données séparées
5. **Optimistic Updates** : Modifications en mémoire avant sauvegarde

---

## 🔍 POINTS D'ATTENTION

1. **Clés de données** : Formatage cohérent requis (`YYYY-MM-DD_exerciseId`)
2. **Validation** : Vérification des valeurs avant sauvegarde
3. **Performance** : Calculs automatiques à chaque rendu (pourrait être optimisé)
4. **Erreurs** : Gestion d'erreurs avec try/catch et messages utilisateur

---

## 📝 CONCLUSION

L'onglet "Aujourd'hui" est un système **complexe et bien structuré** qui :
- Centralise la logique de suivi quotidien
- Gère intelligemment les modifications temporaires
- S'intègre avec les autres modules (endurance, défis, feedback)
- Offre une expérience utilisateur fluide avec auto-remplissage et calculs automatiques

Le code est **modulaire**, **maintenable** et suit les bonnes pratiques React.

