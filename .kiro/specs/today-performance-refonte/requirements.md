# Requirements - Today Performance Block Refonte

## Introduction

Ce document définit les exigences fonctionnelles pour la refonte complète du bloc "Performance Aujourd'hui" du dashboard QuietQuest. L'objectif est de transformer un composant basique en une interface riche et interactive qui permet aux utilisateurs de suivre, analyser et optimiser leurs performances sportives quotidiennes.

## Glossaire

- **System**: Le bloc TodayPerformanceBlock et ses composants associés
- **User**: L'utilisateur de l'application QuietQuest
- **Muscle Group**: Un groupe musculaire ciblé par les exercices (ex: Pectoraux, Biceps)
- **Mission**: Un objectif d'entraînement assigné à un jour spécifique
- **Performance Metric**: Une mesure quantifiable de performance (volume, intensité, etc.)
- **AI Recommendation**: Une suggestion générée par l'algorithme d'optimisation
- **Personal Record**: Le meilleur résultat historique pour un exercice donné
- **IndexedDB**: Base de données locale du navigateur pour la persistance

## Requirements

### Requirement 1: Affichage des Métriques de Base

**User Story**: En tant qu'utilisateur, je veux voir mes métriques de performance actuelles, afin de suivre ma progression en temps réel.

#### Acceptance Criteria

1. WHEN the user views the block THEN the System SHALL display the current date with day name and formatted date
2. WHEN performance data is available THEN the System SHALL display current volume as "current/target reps"
3. WHEN performance data is available THEN the System SHALL display variety progress as "current/target muscle groups"
4. WHEN performance data is available THEN the System SHALL display intensity level as a percentage
5. WHEN the user has an active session THEN the System SHALL display session duration in minutes

### Requirement 2: Sélection de Muscle Ciblé

**User Story**: En tant qu'utilisateur, je veux sélectionner le muscle que je cible aujourd'hui, afin de personnaliser mon entraînement.

#### Acceptance Criteria

1. WHEN the user clicks on the muscle selector THEN the System SHALL display a dropdown with available muscles
2. WHEN the user selects a muscle THEN the System SHALL update the "missing muscle" display
3. WHEN the user selects a muscle THEN the System SHALL save the selection to localStorage
4. WHEN the page reloads THEN the System SHALL restore the previously selected muscle
5. WHEN the user clicks outside the selector THEN the System SHALL close the dropdown

### Requirement 3: Gestion des Groupes Musculaires

**User Story**: En tant qu'utilisateur, je veux gérer mes groupes musculaires avec des images, afin de visualiser clairement mes objectifs.

#### Acceptance Criteria

1. WHEN the user views the volume section THEN the System SHALL display a grid of muscle groups with images
2. WHEN the user clicks on "Nouveau Muscle" THEN the System SHALL open a creation form
3. WHEN the user fills the form and submits THEN the System SHALL create a new muscle group entry
4. WHEN the user uploads an image THEN the System SHALL display a preview before saving
5. WHEN the user saves a muscle group THEN the System SHALL persist it to IndexedDB
6. WHEN a muscle group has progress THEN the System SHALL display "current/target reps"

### Requirement 4: Upload d'Images

**User Story**: En tant qu'utilisateur, je veux uploader des images pour mes groupes musculaires, afin de personnaliser visuellement mon suivi.

#### Acceptance Criteria

1. WHEN the user clicks the upload area THEN the System SHALL open a file picker
2. WHEN the user selects a file THEN the System SHALL validate it is an image (PNG, JPG, JPEG)
3. WHEN the image is valid THEN the System SHALL display a preview
4. WHEN the user clicks remove THEN the System SHALL clear the preview and file
5. WHEN the user saves THEN the System SHALL store the image data in IndexedDB

### Requirement 5: Records Hebdomadaires

**User Story**: En tant qu'utilisateur, je veux voir mes records battus cette semaine, afin de célébrer mes progrès.

#### Acceptance Criteria

1. WHEN the user has beaten records this week THEN the System SHALL display a celebration section
2. WHEN displaying records THEN the System SHALL show exercise name, current value, and delta
3. WHEN displaying records THEN the System SHALL show appropriate emojis per exercise type
4. WHEN displaying records THEN the System SHALL apply golden gradient background
5. WHEN displaying records THEN the System SHALL animate with confetti particles

### Requirement 6: Missions Hebdomadaires

**User Story**: En tant qu'utilisateur, je veux gérer mes missions hebdomadaires, afin de structurer mon entraînement.

#### Acceptance Criteria

1. WHEN the user views missions THEN the System SHALL display a grid with 7 days plus add card
2. WHEN the user clicks a mission checkbox THEN the System SHALL toggle its completion state
3. WHEN the user toggles a mission THEN the System SHALL save the state to localStorage
4. WHEN the user clicks "Ajouter une mission" THEN the System SHALL open the mission form
5. WHEN the user submits a new mission THEN the System SHALL add it to the appropriate day
6. WHEN a mission is completed THEN the System SHALL display a checkmark and XP earned

### Requirement 7: Ajout de Missions

**User Story**: En tant qu'utilisateur, je veux créer de nouvelles missions, afin de personnaliser mes objectifs.

#### Acceptance Criteria

1. WHEN the mission form opens THEN the System SHALL display fields for name, benefit, target, unit, date, and XP
2. WHEN the user selects a date THEN the System SHALL display the formatted day name
3. WHEN the user submits with empty fields THEN the System SHALL prevent submission and show validation
4. WHEN the user submits valid data THEN the System SHALL create the mission and save to localStorage
5. WHEN a mission is created THEN the System SHALL show a success notification

### Requirement 8: Graphique de Progression

**User Story**: En tant qu'utilisateur, je veux voir un graphique de ma progression sur 7 jours, afin de visualiser mes tendances.

#### Acceptance Criteria

1. WHEN the user views the chart THEN the System SHALL display 7 days of data with labels
2. WHEN the user hovers a data point THEN the System SHALL show a tooltip with details
3. WHEN displaying the chart THEN the System SHALL highlight today's data point
4. WHEN displaying the chart THEN the System SHALL show volume and intensity curves
5. WHEN displaying the chart THEN the System SHALL calculate and show average, trend, and best day

### Requirement 9: Comparaisons de Performance

**User Story**: En tant qu'utilisateur, je veux comparer mes performances avec hier, afin d'identifier mes progrès et axes d'amélioration.

#### Acceptance Criteria

1. WHEN the user views comparisons THEN the System SHALL display general metrics (volume, intensity, rest, duration)
2. WHEN the user views comparisons THEN the System SHALL display per-exercise comparisons
3. WHEN displaying a comparison THEN the System SHALL show current value, previous value, and percentage change
4. WHEN a metric improved THEN the System SHALL display green color and up arrow
5. WHEN a metric declined THEN the System SHALL display red color and down arrow
6. WHEN metrics are stable THEN the System SHALL display neutral color and horizontal arrow
7. WHEN displaying overall comparison THEN the System SHALL calculate and show summary badge

### Requirement 10: Accomplissements

**User Story**: En tant qu'utilisateur, je veux voir mes accomplissements du jour, afin de rester motivé.

#### Acceptance Criteria

1. WHEN the user views accomplishments THEN the System SHALL display all achievements with icons
2. WHEN displaying an achievement THEN the System SHALL show title, description, and reward
3. WHEN an achievement is new THEN the System SHALL display a "NEW!" badge
4. WHEN an achievement is completed THEN the System SHALL mark it with "ACCOMPLI" status
5. WHEN displaying the summary THEN the System SHALL show total bonus XP, current streak, and goals completed

### Requirement 11: Recommandations IA

**User Story**: En tant qu'utilisateur, je veux recevoir des recommandations IA personnalisées, afin d'optimiser mes entraînements.

#### Acceptance Criteria

1. WHEN the user views recommendations THEN the System SHALL display 5 recommendations with priorities
2. WHEN displaying a recommendation THEN the System SHALL show icon, title, description, category, and impact
3. WHEN the user clicks refresh on a recommendation THEN the System SHALL replace it with an alternative
4. WHEN refreshing THEN the System SHALL animate the transition smoothly
5. WHEN displaying the summary THEN the System SHALL show AI confidence percentage and next focus

### Requirement 12: Historique Personnel

**User Story**: En tant qu'utilisateur, je veux consulter mon historique personnel, afin d'analyser ma progression à long terme.

#### Acceptance Criteria

1. WHEN the user views history THEN the System SHALL display personal records for all exercises
2. WHEN a record is new THEN the System SHALL display a "NOUVEAU!" badge
3. WHEN displaying records THEN the System SHALL show value, unit, and date
4. WHEN displaying trends THEN the System SHALL show best streak, overall progress, and consistency
5. WHEN displaying progress percentage THEN the System SHALL apply appropriate color (green for positive, red for negative)

### Requirement 13: Graphiques Historiques

**User Story**: En tant qu'utilisateur, je veux voir des graphiques de mon historique, afin de visualiser mes tendances à long terme.

#### Acceptance Criteria

1. WHEN the user views history charts THEN the System SHALL display 3 chart types (volume, minutes, seconds)
2. WHEN the user selects a period THEN the System SHALL update charts with appropriate data
3. WHEN the user hovers a data point THEN the System SHALL show a tooltip with exact value
4. WHEN displaying charts THEN the System SHALL use real date-based data from the system
5. WHEN displaying charts THEN the System SHALL show appropriate labels per period (weeks, months, quarters)

### Requirement 14: Actions Rapides

**User Story**: En tant qu'utilisateur, je veux accéder rapidement aux actions principales, afin de gagner du temps.

#### Acceptance Criteria

1. WHEN the user views actions THEN the System SHALL display "SESSION TURBO" and "MES EXPLOITS" buttons
2. WHEN the user clicks "SESSION TURBO" THEN the System SHALL open the quick session modal
3. WHEN the user clicks "MES EXPLOITS" THEN the System SHALL open the detailed stats modal
4. WHEN displaying buttons THEN the System SHALL show icons and subtitles
5. WHEN hovering buttons THEN the System SHALL apply hover effects

### Requirement 15: Persistance des Données

**User Story**: En tant qu'utilisateur, je veux que mes données soient sauvegardées automatiquement, afin de ne jamais perdre ma progression.

#### Acceptance Criteria

1. WHEN the user creates a muscle group THEN the System SHALL save it to IndexedDB immediately
2. WHEN the user toggles a mission THEN the System SHALL save the state to localStorage immediately
3. WHEN the user adds a mission THEN the System SHALL save it to localStorage immediately
4. WHEN the user selects a target muscle THEN the System SHALL save it to localStorage immediately
5. WHEN the page reloads THEN the System SHALL restore all saved data correctly

### Requirement 16: Animations et Feedback

**User Story**: En tant qu'utilisateur, je veux des animations fluides et du feedback visuel, afin d'avoir une expérience agréable.

#### Acceptance Criteria

1. WHEN a progress bar updates THEN the System SHALL animate the transition smoothly
2. WHEN a record is beaten THEN the System SHALL display confetti animation
3. WHEN a form opens THEN the System SHALL fade in with smooth transition
4. WHEN hovering interactive elements THEN the System SHALL apply hover effects
5. WHEN an action succeeds THEN the System SHALL show a success notification

### Requirement 17: Responsive Design

**User Story**: En tant qu'utilisateur, je veux que le bloc s'adapte à différentes tailles d'écran, afin d'avoir une expérience optimale sur tous mes appareils.

#### Acceptance Criteria

1. WHEN viewed on desktop THEN the System SHALL display the full layout with all sections
2. WHEN viewed on tablet THEN the System SHALL adjust grid layouts appropriately
3. WHEN viewed on mobile THEN the System SHALL stack sections vertically
4. WHEN resizing the window THEN the System SHALL adapt layouts smoothly
5. WHEN displaying on small screens THEN the System SHALL maintain readability and usability

### Requirement 18: Gestion des Erreurs

**User Story**: En tant qu'utilisateur, je veux être informé clairement en cas d'erreur, afin de comprendre ce qui s'est passé.

#### Acceptance Criteria

1. WHEN data loading fails THEN the System SHALL display an error message with retry option
2. WHEN form validation fails THEN the System SHALL highlight invalid fields with messages
3. WHEN image upload fails THEN the System SHALL show an error notification
4. WHEN IndexedDB is unavailable THEN the System SHALL fallback to localStorage
5. WHEN an unexpected error occurs THEN the System SHALL log it and show a generic error message

### Requirement 19: Performance et Optimisation

**User Story**: En tant qu'utilisateur, je veux que le bloc se charge rapidement, afin de ne pas perdre de temps.

#### Acceptance Criteria

1. WHEN the block loads THEN the System SHALL display initial data within 500ms
2. WHEN calculating comparisons THEN the System SHALL use memoization to avoid recalculations
3. WHEN rendering charts THEN the System SHALL use canvas for optimal performance
4. WHEN updating data THEN the System SHALL batch updates to minimize re-renders
5. WHEN displaying images THEN the System SHALL lazy load them as needed

### Requirement 20: Accessibilité

**User Story**: En tant qu'utilisateur avec des besoins d'accessibilité, je veux pouvoir utiliser le bloc avec des technologies d'assistance, afin d'avoir une expérience équitable.

#### Acceptance Criteria

1. WHEN using keyboard navigation THEN the System SHALL allow access to all interactive elements
2. WHEN using a screen reader THEN the System SHALL provide appropriate ARIA labels
3. WHEN displaying colors THEN the System SHALL ensure sufficient contrast ratios
4. WHEN showing tooltips THEN the System SHALL make them accessible to screen readers
5. WHEN forms are displayed THEN the System SHALL associate labels with inputs correctly
