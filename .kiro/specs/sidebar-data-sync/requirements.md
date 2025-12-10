# Requirements Document - Synchronisation des Données Sidebar

## Introduction

La sidebar premium affiche des statistiques en temps réel pour différents modules de l'application (Lecture, Sport, Nutrition, etc.). Actuellement, le module Lecture affiche des valeurs incorrectes (0 livres en cours, 0 pages lues, 0 minutes) alors que des données existent dans l'application. Le même problème affecte potentiellement d'autres modules. Ce document définit les exigences pour corriger et améliorer la synchronisation des données entre les modules et la sidebar.

## Glossary

- **Sidebar**: Barre latérale premium affichant les statistiques et métriques de l'utilisateur
- **Module**: Section fonctionnelle de l'application (Livres, Sport, Nutrition, Finances, etc.)
- **useSidebarData**: Hook React centralisé qui agrège les données de tous les modules pour la sidebar
- **localStorage**: Stockage local du navigateur utilisé comme cache pour certaines données
- **IndexedDB**: Base de données locale du navigateur utilisée pour le stockage principal des livres
- **Session de lecture**: Enregistrement d'une période de lecture avec durée, pages lues et date
- **Événement sidebar**: Signal émis par un module pour notifier la sidebar d'un changement de données

## Requirements

### Requirement 1: Calcul des Statistiques de Lecture

**User Story:** En tant qu'utilisateur, je veux voir mes statistiques de lecture actuelles dans la sidebar, afin de suivre ma progression quotidienne sans ouvrir l'onglet Livres.

#### Acceptance Criteria

1. WHEN the system loads book data THEN it SHALL calculate the number of books with status 'in-progress'
2. WHEN the system loads book data THEN it SHALL calculate the total pages read today from all reading sessions
3. WHEN the system loads book data THEN it SHALL calculate the total minutes read today from all reading sessions
4. WHEN the system loads book data THEN it SHALL retrieve the user's daily reading goal in minutes
5. WHEN book data changes THEN the system SHALL recalculate all reading statistics immediately

### Requirement 2: Synchronisation des Données de Lecture

**User Story:** En tant qu'utilisateur, je veux que mes statistiques de lecture se mettent à jour automatiquement quand j'ajoute un livre ou une session, afin que la sidebar reflète toujours l'état actuel.

#### Acceptance Criteria

1. WHEN a user adds a new book THEN the system SHALL update the currentBooks count in the sidebar
2. WHEN a user adds a reading session THEN the system SHALL update todayPages and todayMinutes if the session is for today
3. WHEN a user changes a book's status THEN the system SHALL recalculate the currentBooks count
4. WHEN a user modifies their daily reading goal THEN the system SHALL update the dailyGoal value in the sidebar
5. WHEN book data is loaded from IndexedDB THEN the system SHALL compute and cache the statistics for the sidebar

### Requirement 3: Vérification des Autres Modules

**User Story:** En tant qu'utilisateur, je veux que tous les modules de la sidebar affichent des données correctes, afin d'avoir une vue d'ensemble fiable de mes activités.

#### Acceptance Criteria

1. WHEN the system loads workout data THEN it SHALL correctly count today's workout sessions
2. WHEN the system loads nutrition data THEN it SHALL correctly count today's logged meals
3. WHEN the system loads quest data THEN it SHALL correctly count today's completed quests
4. WHEN the system loads finance data THEN it SHALL correctly calculate the current net worth
5. WHEN any module data changes THEN the system SHALL emit a sidebar event to trigger a refresh

### Requirement 4: Gestion des Événements Sidebar

**User Story:** En tant que développeur, je veux un système d'événements robuste pour synchroniser les données, afin que les modules puissent notifier la sidebar des changements sans couplage fort.

#### Acceptance Criteria

1. WHEN a book is added, updated, or deleted THEN the system SHALL emit a BOOK_UPDATED event
2. WHEN a reading session is added THEN the system SHALL emit a PAGES_READ event
3. WHEN a workout is logged THEN the system SHALL emit a WORKOUT_ADDED event
4. WHEN the sidebar receives an event THEN it SHALL refresh only the affected module's data
5. WHEN multiple events occur rapidly THEN the system SHALL debounce the refresh to avoid performance issues

### Requirement 5: Structure de Données Cohérente

**User Story:** En tant que développeur, je veux une structure de données claire et documentée pour chaque module, afin de faciliter la maintenance et l'ajout de nouvelles fonctionnalités.

#### Acceptance Criteria

1. WHEN the system provides learning data THEN it SHALL include currentBooks, todayPages, todayMinutes, dailyGoal, and hasData fields
2. WHEN the system provides sport data THEN it SHALL include weeklyWorkouts, todayCalories, todaySteps, avgHeartRate, and hasGarminData fields
3. WHEN the system provides nutrition data THEN it SHALL include calories, proteins, carbs, fats, water, compliance, and hasData fields
4. WHEN the system provides finance data THEN it SHALL include netWorth, monthlyBudget, monthlySavings, investments, and hasData fields
5. WHEN any module has no data THEN the system SHALL return default values with hasData set to false

### Requirement 6: Performance et Optimisation

**User Story:** En tant qu'utilisateur, je veux que la sidebar se charge rapidement et ne ralentisse pas l'application, afin d'avoir une expérience fluide.

#### Acceptance Criteria

1. WHEN the sidebar calculates statistics THEN it SHALL use memoization to avoid unnecessary recalculations
2. WHEN the sidebar receives multiple events THEN it SHALL debounce updates with a maximum delay of 500ms
3. WHEN the sidebar loads data THEN it SHALL prioritize synchronous sources (localStorage) over asynchronous sources (IndexedDB)
4. WHEN the sidebar displays data THEN it SHALL show cached values immediately and update asynchronously if needed
5. WHEN the system detects stale cached data THEN it SHALL refresh from the source and update the cache

### Requirement 7: Gestion des Erreurs et Fallbacks

**User Story:** En tant qu'utilisateur, je veux que la sidebar continue de fonctionner même si certaines données ne sont pas disponibles, afin de ne pas perdre l'accès aux autres informations.

#### Acceptance Criteria

1. WHEN a module fails to load data THEN the system SHALL display default values instead of crashing
2. WHEN IndexedDB is unavailable THEN the system SHALL fall back to localStorage for reading data
3. WHEN localStorage is full THEN the system SHALL log a warning and continue with in-memory data only
4. WHEN a data calculation fails THEN the system SHALL log the error and return safe default values
5. WHEN the user is not authenticated THEN the system SHALL display empty states for all modules

### Requirement 8: Tests et Validation

**User Story:** En tant que développeur, je veux des tests automatisés pour la synchronisation des données, afin de détecter rapidement les régressions.

#### Acceptance Criteria

1. WHEN the system calculates reading statistics THEN unit tests SHALL verify the correctness of currentBooks, todayPages, and todayMinutes
2. WHEN the system emits sidebar events THEN integration tests SHALL verify that the sidebar receives and processes them correctly
3. WHEN the system handles missing data THEN tests SHALL verify that default values are returned
4. WHEN the system loads data from multiple sources THEN tests SHALL verify the correct priority order
5. WHEN the system updates cached data THEN tests SHALL verify that the cache is invalidated correctly
