# Amélioration de la Saisie depuis le Calendrier

## 📋 Description de la Demande

### Contexte Actuel

Actuellement, dans l'onglet **Calendrier** de la section **Sport** :

1. **Jour avec activité enregistrée** : 
   - Clic sur la case → Affiche un récap détaillé (comme dans le screen 2)
   - Affiche les statistiques d'entraînement, données Garmin Connect, et liste des exercices réalisés

2. **Jour sans activité (case blanche)** :
   - Clic sur la case → Ouvre la modal de justification d'absence
   - Permet de justifier pourquoi il n'y a pas eu de séance (maladie, flemme, pas le temps, autre)

### Demande d'Amélioration

L'utilisateur souhaite pouvoir **saisir une séance directement depuis le calendrier** en cliquant sur une case blanche, même si la date est passée depuis plusieurs jours.

#### Fonctionnalités Requises

1. **Double Option au Clic sur Case Blanche** :
   - Option 1 : **Justifier l'absence** (fonctionnalité existante)
   - Option 2 : **Saisir une séance** (nouvelle fonctionnalité)

2. **Modal de Saisie de Séance depuis Calendrier** :
   - **Sélection du programme** : Choisir parmi les programmes disponibles (comme dans l'onglet "Saisie")
   - **Affichage des exercices** : Une fois le programme choisi, afficher les exercices du jour correspondant à la date sélectionnée
   - **Cocher les exercices** : Possibilité de cocher/décocher les exercices réalisés (en lien avec le programme choisi)
   - **Saisie des répétitions** : Pour chaque exercice, pouvoir entrer le nombre de reps (comme dans l'onglet "Saisie")
   - **Sauvegarde** : Enregistrer la séance avec la date sélectionnée (même si elle est dans le passé)

3. **Préservation de la Fonctionnalité Existante** :
   - Garder la possibilité de justifier une absence
   - Les jours avec activité continuent d'afficher le récap
   - Les jours justifiés continuent d'afficher leur justification

## 🎯 Objectifs

- **Rétroactivité** : Permettre de saisir des séances pour des dates passées
- **Cohérence** : Utiliser la même logique que l'onglet "Saisie" pour la sélection de programme et la saisie des exercices
- **Performance** : Ne pas impacter les performances du calendrier
- **UX** : Interface intuitive avec choix clair entre "Justifier" et "Saisir une séance"

## 🔄 Flux Utilisateur

### Scénario 1 : Saisir une Séance depuis le Calendrier

1. Utilisateur ouvre l'onglet **Calendrier** dans la section **Sport**
2. Utilisateur clique sur une **case blanche** (jour sans activité)
3. Une **modal de choix** s'affiche avec deux options :
   - 🔴 **Justifier l'absence** (bouton rouge/orange)
   - 💪 **Saisir une séance** (bouton vert/violet)
4. Utilisateur clique sur **"Saisir une séance"**
5. Une **modal de saisie** s'ouvre avec :
   - **Date affichée** : Format lisible (ex: "Jeudi 15 janvier 2026")
   - **Sélecteur de programme** : Dropdown pour choisir le programme (par défaut : programme actif si disponible)
   - **Liste des exercices** : Une fois le programme choisi, afficher les exercices du jour correspondant
   - **Checkboxes** : Pour chaque exercice, possibilité de cocher/décocher
   - **Champs de saisie** : Pour chaque exercice, champ pour entrer le nombre de reps
   - **Boutons** : "Annuler" et "Sauvegarder"
6. Utilisateur :
   - Sélectionne le programme
   - Coche les exercices réalisés
   - Entre les répétitions pour chaque exercice
7. Utilisateur clique sur **"Sauvegarder"**
8. La séance est enregistrée avec la date sélectionnée
9. La case du calendrier se met à jour pour refléter l'activité (couleur, nombre de reps)

### Scénario 2 : Justifier une Absence (Existant)

1. Utilisateur clique sur une case blanche
2. Modal de choix s'affiche
3. Utilisateur clique sur **"Justifier l'absence"**
4. Modal de justification existante s'ouvre (comportement actuel)

### Scénario 3 : Voir le Récap d'une Séance (Existant)

1. Utilisateur clique sur une case avec activité
2. Le récap détaillé s'affiche (comportement actuel inchangé)

## 🏗️ Architecture Technique

### Composants à Créer

1. **`CalendarWorkoutChoiceModal.jsx`**
   - Modal de choix entre "Justifier" et "Saisir une séance"
   - Affiche la date sélectionnée
   - Deux boutons d'action

2. **`CalendarWorkoutEntryModal.jsx`**
   - Modal de saisie de séance depuis le calendrier
   - Intègre la logique de sélection de programme
   - Affiche les exercices du jour sélectionné
   - Gère la saisie des reps et le coché/décoché
   - Sauvegarde avec la date sélectionnée

### Composants à Modifier

1. **`CalendarHeatmap.jsx`**
   - Modifier le handler `onClick` des cases blanches
   - Au lieu d'ouvrir directement `JustificationModal`, ouvrir `CalendarWorkoutChoiceModal`
   - Gérer l'état des modals (choix → saisie ou justification)

2. **`JustificationModal.jsx`**
   - Aucune modification nécessaire (réutilisable tel quel)

### Hooks/Context à Utiliser

- **`useWorkout()`** : Pour accéder aux données et fonctions de mise à jour
- **`getTodayWorkout(date)`** : Pour obtenir les exercices d'un jour donné
- **`updateReps()`** : Pour sauvegarder les répétitions
- **`toggleCheck()`** : Pour cocher/décocher les exercices
- **`activeProgram`** : Pour le programme actif par défaut

### Utilitaires à Réutiliser

- **`getDateStr()`** : Pour formater les dates
- **`getDayName()`** : Pour obtenir le nom du jour
- **`calculateAutoReps()`** : Pour l'auto-remplissage des reps
- **`workoutProgram`** : Programme par défaut (si admin)

## 📝 Structure des Données

### Format de Sauvegarde

La séance saisie depuis le calendrier doit être sauvegardée dans le même format que les séances saisies depuis l'onglet "Saisie" :

```javascript
{
  reps: {
    "2026-01-15_123": "30",  // date_exerciseId: reps
    "2026-01-15_124": "45"
  },
  checkedExercises: {
    "2026-01-15_123": true,
    "2026-01-15_124": true
  }
}
```

### Cohérence avec l'Onglet "Saisie"

- Utiliser les mêmes clés de données (`reps`, `checkedExercises`)
- Utiliser le même format de date (`YYYY-MM-DD`)
- Utiliser les mêmes IDs d'exercices

## ⚠️ Points d'Attention

### 1. Gestion des Programmes

- Si aucun programme actif : Proposer le programme par défaut (si admin) ou liste des programmes disponibles
- Si programme actif : L'utiliser par défaut mais permettre de changer
- Gérer les variantes de semaine (Semaine A/B) si applicable

### 2. Validation

- Vérifier que la date sélectionnée est valide
- Vérifier que le programme sélectionné existe
- Valider les valeurs de reps (nombres positifs, limites raisonnables)
- Empêcher la sauvegarde si aucun exercice n'est coché

### 3. Performance

- Ne pas recharger toutes les données du calendrier à chaque ouverture de modal
- Utiliser `useMemo` et `useCallback` pour optimiser les rendus
- Lazy loading des exercices si nécessaire

### 4. UX/UI

- Modal de choix claire et intuitive
- Feedback visuel lors de la sauvegarde
- Gestion des erreurs avec messages clairs
- Support du clavier (Tab, Enter, Escape)

### 5. Compatibilité

- Ne pas casser la fonctionnalité existante de justification
- Maintenir la compatibilité avec les données existantes
- Gérer les cas edge (date future, date très ancienne, etc.)

## 🎨 Design de l'Interface

### Modal de Choix (`CalendarWorkoutChoiceModal`)

```
┌─────────────────────────────────────────┐
│  Saisie pour le [Date formatée]        │
│                                         │
│  Que souhaitez-vous faire ?            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🔴 Justifier l'absence          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  💪 Saisir une séance            │   │
│  └─────────────────────────────────┘   │
│                                         │
│              [Annuler]                  │
└─────────────────────────────────────────┘
```

### Modal de Saisie (`CalendarWorkoutEntryModal`)

```
┌─────────────────────────────────────────┐
│  Saisie de séance - [Date formatée]     │
│                                         │
│  Programme : [Dropdown programmes]      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ☑ Exercice 1                   │   │
│  │     Reps: [____]                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  ☐ Exercice 2                   │   │
│  │     Reps: [____]                 │   │
│  └─────────────────────────────────┘   │
│  ...                                    │
│                                         │
│  [Annuler]        [Sauvegarder]         │
└─────────────────────────────────────────┘
```

## ✅ Critères de Réussite

1. ✅ Clic sur case blanche → Modal de choix s'affiche
2. ✅ Choix "Saisir une séance" → Modal de saisie s'ouvre
3. ✅ Sélection de programme → Exercices du jour s'affichent
4. ✅ Cocher/décocher exercices → État sauvegardé
5. ✅ Saisie de reps → Valeurs sauvegardées
6. ✅ Sauvegarde → Case calendrier se met à jour
7. ✅ Choix "Justifier" → Modal de justification existante s'ouvre
8. ✅ Rétroactivité → Possibilité de saisir pour dates passées
9. ✅ Performance → Pas de ralentissement du calendrier
10. ✅ Compatibilité → Aucune régression sur fonctionnalités existantes
