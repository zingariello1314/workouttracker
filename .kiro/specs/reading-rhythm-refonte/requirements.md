# Requirements Document - Refonte ReadingRhythmBlock

## Introduction

Ce document définit les exigences pour la refonte complète du composant ReadingRhythmBlock. L'objectif est de transformer un bloc simple de suivi de lecture en un système ultra-détaillé avec 16 modules avancés incluant l'intelligence prédictive, l'analyse motivationnelle, le suivi émotionnel, et l'optimisation stratégique de lecture.

## Glossary

- **ReadingRhythmBlock**: Composant React affichant le système de suivi de rythme de lecture
- **Streak**: Série de jours consécutifs avec lecture
- **Tier**: Palier de progression basé sur le streak (0-3)
- **Session**: Période de lecture chronométrée
- **Emotional State**: État émotionnel pré/post lecture
- **Heatmap**: Carte de chaleur des créneaux optimaux de lecture
- **ROI**: Return on Investment - retour sur investissement de lecture
- **Prediction Engine**: Moteur de prédictions pour estimer la fin de lecture
- **Motivation Score**: Score composite de motivation basé sur 4 composantes

## Requirements

### Requirement 1: Core Reading Tracking

**User Story:** En tant qu'utilisateur, je veux suivre mon rythme de lecture quotidien, afin de maintenir une habitude régulière et visualiser ma progression.

#### Acceptance Criteria

1. WHEN the system displays the streak, THE ReadingRhythmBlock SHALL show the current number of consecutive reading days
2. WHEN the user has read today, THE ReadingRhythmBlock SHALL display today's reading minutes
3. WHEN calculating weekly statistics, THE ReadingRhythmBlock SHALL compute total weekly minutes, average session, and minimum session
4. WHEN displaying the daily goal, THE ReadingRhythmBlock SHALL show progress percentage and completion status
5. WHEN the user starts a reading session, THE ReadingRhythmBlock SHALL activate a timer that increments every second

### Requirement 2: Visual Streak Representation

**User Story:** En tant qu'utilisateur, je veux voir une représentation visuelle impressionnante de mon streak, afin de me sentir motivé et fier de ma progression.

#### Acceptance Criteria

1. WHEN displaying the streak circle, THE ReadingRhythmBlock SHALL render an SVG with multiple concentric circles
2. WHEN the tier is 1 or higher, THE ReadingRhythmBlock SHALL display additional decorative circles with animations
3. WHEN the tier is 2 or higher, THE ReadingRhythmBlock SHALL add purple tier circles with counter-rotation
4. WHEN calculating tier progress, THE ReadingRhythmBlock SHALL show the progress within the current 7-day tier
5. WHEN the streak increases, THE ReadingRhythmBlock SHALL animate the progress circle smoothly

### Requirement 3: Predictive Intelligence

**User Story:** En tant qu'utilisateur, je veux des prédictions sur quand je finirai mon livre, afin de planifier ma lecture et optimiser mon rythme.

#### Acceptance Criteria

1. WHEN calculating book completion, THE ReadingRhythmBlock SHALL estimate remaining time based on current reading speed
2. WHEN displaying scenarios, THE ReadingRhythmBlock SHALL show conservative, current, and intensive completion dates
3. WHEN suggesting optimizations, THE ReadingRhythmBlock SHALL identify acceleration factors (time slots, weather, weekend)
4. WHEN generating AI recommendations, THE ReadingRhythmBlock SHALL provide 3 actionable insights for optimization
5. WHEN the user's reading speed changes, THE ReadingRhythmBlock SHALL recalculate all predictions dynamically

### Requirement 4: Motivation System

**User Story:** En tant qu'utilisateur, je veux comprendre ma motivation à lire, afin d'identifier les leviers qui m'aident à maintenir mon habitude.

#### Acceptance Criteria

1. WHEN calculating motivation score, THE ReadingRhythmBlock SHALL compute a composite score from 4 components (Élan, Plaisir, Confiance, Curiosité)
2. WHEN displaying motivation levers, THE ReadingRhythmBlock SHALL show active motivational factors with progress bars
3. WHEN comparing temporal data, THE ReadingRhythmBlock SHALL display year-over-year reading comparisons
4. WHEN generating motivation predictions, THE ReadingRhythmBlock SHALL provide 3 motivational insights
5. WHEN the motivation score changes, THE ReadingRhythmBlock SHALL update the visual representation in real-time

### Requirement 5: Reading Intelligence

**User Story:** En tant qu'utilisateur, je veux identifier mes créneaux optimaux de lecture, afin de maximiser ma concentration et mon plaisir.

#### Acceptance Criteria

1. WHEN displaying the heatmap, THE ReadingRhythmBlock SHALL show 8 time slots with intensity levels
2. WHEN analyzing patterns, THE ReadingRhythmBlock SHALL identify the optimal reading zone (e.g., 19h-21h)
3. WHEN considering weather factors, THE ReadingRhythmBlock SHALL display impact of rain, sun, and clouds on reading
4. WHEN analyzing weekly cycles, THE ReadingRhythmBlock SHALL show performance scores for each day of the week
5. WHEN generating recommendations, THE ReadingRhythmBlock SHALL provide personalized AI suggestions based on patterns

### Requirement 6: Weekly Analysis

**User Story:** En tant qu'utilisateur, je veux analyser mes 7 derniers jours de lecture, afin de comprendre mes patterns et identifier les opportunités d'amélioration.

#### Acceptance Criteria

1. WHEN displaying the 7-day overview, THE ReadingRhythmBlock SHALL show total minutes, best day, and regularity score
2. WHEN rendering the timeline, THE ReadingRhythmBlock SHALL display each day with badge, minutes, pages, and performance level
3. WHEN calculating performance levels, THE ReadingRhythmBlock SHALL categorize days as excellent, good, or correct
4. WHEN generating weekly insights, THE ReadingRhythmBlock SHALL identify patterns like perfect series or consistent progression
5. WHEN a day has no reading, THE ReadingRhythmBlock SHALL display it with appropriate visual indicators

### Requirement 7: Energy Flow Visualization

**User Story:** En tant qu'utilisateur, je veux visualiser mon flux énergétique de lecture sur 30 jours, afin de comprendre mes cycles naturels de motivation.

#### Acceptance Criteria

1. WHEN displaying the energy flow, THE ReadingRhythmBlock SHALL render a sinusoidal SVG curve representing motivation over 30 days
2. WHEN identifying phases, THE ReadingRhythmBlock SHALL label productive and quiet phases
3. WHEN showing counter-currents, THE ReadingRhythmBlock SHALL display stress, fatigue, and distraction factors
4. WHEN the curve animates, THE ReadingRhythmBlock SHALL use smooth transitions
5. WHEN the user hovers over the curve, THE ReadingRhythmBlock SHALL show detailed information for that period

### Requirement 8: Personalized Reading DNA

**User Story:** En tant qu'utilisateur, je veux voir mon ADN de lecture personnalisé, afin de comprendre mon profil unique de lecteur.

#### Acceptance Criteria

1. WHEN displaying the genome, THE ReadingRhythmBlock SHALL render an animated DNA helix SVG
2. WHEN showing metrics, THE ReadingRhythmBlock SHALL display speed, endurance, and favorite genre
3. WHEN detecting evolution, THE ReadingRhythmBlock SHALL identify mutations in reading behavior
4. WHEN analyzing behavioral heritage, THE ReadingRhythmBlock SHALL categorize patterns as primary, secondary, tertiary, or emergent
5. WHEN patterns change, THE ReadingRhythmBlock SHALL update the DNA visualization dynamically

### Requirement 9: Emotional State Tracking

**User Story:** En tant qu'utilisateur, je veux enregistrer mes émotions avant et après la lecture, afin de découvrir quelles conditions favorisent les meilleures sessions.

#### Acceptance Criteria

1. WHEN starting a session, THE ReadingRhythmBlock SHALL display 10 pre-reading emotions for selection
2. WHEN ending a session, THE ReadingRhythmBlock SHALL display 10 post-reading emotions for selection
3. WHEN recording emotions, THE ReadingRhythmBlock SHALL save the session data to localStorage
4. WHEN analyzing correlations, THE ReadingRhythmBlock SHALL identify winning combos and combos to avoid
5. WHEN displaying session history, THE ReadingRhythmBlock SHALL show all sessions from the current day

### Requirement 10: Strategic Reading Analysis

**User Story:** En tant qu'utilisateur, je veux analyser le ROI de ma lecture, afin de m'assurer que je lis de manière stratégique et efficace.

#### Acceptance Criteria

1. WHEN calculating ROI, THE ReadingRhythmBlock SHALL display time invested, concepts learned, practical applications, and strategic efficiency
2. WHEN analyzing abandonment, THE ReadingRhythmBlock SHALL show completion rate and top 3 causes of abandonment
3. WHEN displaying objectives, THE ReadingRhythmBlock SHALL show distribution across learning, pleasure, development, and research
4. WHEN suggesting optimization, THE ReadingRhythmBlock SHALL provide a 3-step strategy
5. WHEN ROI metrics change, THE ReadingRhythmBlock SHALL recalculate all derived statistics

### Requirement 11: Reading Balance

**User Story:** En tant qu'utilisateur, je veux maintenir un équilibre entre différents genres de lecture, afin d'avoir une alimentation intellectuelle diversifiée.

#### Acceptance Criteria

1. WHEN displaying genre distribution, THE ReadingRhythmBlock SHALL show 5 genres with percentage bars
2. WHEN calculating balance score, THE ReadingRhythmBlock SHALL compute a score based on genre variance
3. WHEN identifying imbalances, THE ReadingRhythmBlock SHALL highlight 2 zones of concern
4. WHEN suggesting rebalancing, THE ReadingRhythmBlock SHALL provide a 3-step plan
5. WHEN the balance score is excellent, THE ReadingRhythmBlock SHALL display a congratulatory badge

### Requirement 12: Milestone Tracking

**User Story:** En tant qu'utilisateur, je veux voir mon prochain jalon, afin de rester motivé à maintenir mon streak.

#### Acceptance Criteria

1. WHEN displaying the next milestone, THE ReadingRhythmBlock SHALL show days remaining to the next tier
2. WHEN calculating progress, THE ReadingRhythmBlock SHALL display current progress within the 7-day tier cycle
3. WHEN showing the badge name, THE ReadingRhythmBlock SHALL display the name of the badge to unlock
4. WHEN the milestone is reached, THE ReadingRhythmBlock SHALL celebrate with visual effects
5. WHEN multiple tiers exist, THE ReadingRhythmBlock SHALL show the appropriate tier information

### Requirement 13: Countdown Timer

**User Story:** En tant qu'utilisateur, je veux voir le temps restant jusqu'à minuit, afin de savoir combien de temps j'ai pour atteindre mon objectif quotidien.

#### Acceptance Criteria

1. WHEN displaying the countdown, THE ReadingRhythmBlock SHALL show hours, minutes, and seconds until midnight
2. WHEN the countdown updates, THE ReadingRhythmBlock SHALL refresh every second
3. WHEN displaying day progress, THE ReadingRhythmBlock SHALL show a progress bar representing the percentage of the day elapsed
4. WHEN midnight is reached, THE ReadingRhythmBlock SHALL reset the countdown to 24 hours
5. WHEN the user is in a different timezone, THE ReadingRhythmBlock SHALL calculate midnight based on local time

### Requirement 14: Session Timer

**User Story:** En tant qu'utilisateur, je veux chronométrer mes sessions de lecture, afin de suivre précisément mon temps de lecture quotidien.

#### Acceptance Criteria

1. WHEN the user clicks play, THE ReadingRhythmBlock SHALL start incrementing the session timer
2. WHEN the user clicks pause, THE ReadingRhythmBlock SHALL stop the timer without resetting it
3. WHEN displaying the timer, THE ReadingRhythmBlock SHALL format time as MM:SS
4. WHEN the daily goal is reached, THE ReadingRhythmBlock SHALL display an achievement badge
5. WHEN the session ends, THE ReadingRhythmBlock SHALL add the session time to today's total

### Requirement 15: Data Persistence

**User Story:** En tant qu'utilisateur, je veux que mes données de lecture soient sauvegardées, afin de ne pas perdre mon historique.

#### Acceptance Criteria

1. WHEN emotional sessions are recorded, THE ReadingRhythmBlock SHALL save them to localStorage
2. WHEN the component loads, THE ReadingRhythmBlock SHALL retrieve saved emotional sessions from localStorage
3. WHEN localStorage quota is exceeded, THE ReadingRhythmBlock SHALL handle the error gracefully
4. WHEN loading saved data, THE ReadingRhythmBlock SHALL validate the data structure before using it
5. WHEN old sessions accumulate, THE ReadingRhythmBlock SHALL clean up sessions older than 30 days

### Requirement 16: Responsive Design

**User Story:** En tant qu'utilisateur, je veux que le bloc s'affiche correctement sur tous mes appareils, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. WHEN displayed on mobile (< 768px), THE ReadingRhythmBlock SHALL adjust grid layouts to single column
2. WHEN displayed on tablet (768px - 1200px), THE ReadingRhythmBlock SHALL use 2-column grids where appropriate
3. WHEN displayed on desktop (> 1200px), THE ReadingRhythmBlock SHALL use full 3-column grids
4. WHEN the viewport changes, THE ReadingRhythmBlock SHALL adapt layouts smoothly
5. WHEN touch interactions are available, THE ReadingRhythmBlock SHALL optimize button sizes for touch targets
