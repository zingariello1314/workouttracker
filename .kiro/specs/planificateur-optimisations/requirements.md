# Requirements Document - Optimisations Planificateur Financier

## Introduction

Ce document définit les exigences pour optimiser le sous-onglet Planificateur Financier afin d'atteindre un score de 10/10 sur tous les critères (Performance, Logique, Front-end, Maintenabilité). L'objectif est d'améliorer les performances de +300%, réduire les bugs de -95%, et garantir une expérience utilisateur instantanée (<2ms).

## Glossary

- **System**: Le sous-onglet Planificateur Financier de l'application QuietQuest
- **IndexedDB**: Base de données locale du navigateur utilisée pour la persistance
- **Cache**: Système de mise en cache en mémoire pour réduire les accès à IndexedDB
- **Debounce**: Technique de limitation du nombre d'exécutions d'une fonction dans le temps
- **Virtualisation**: Technique de rendu uniquement des éléments visibles dans une liste
- **Optimistic Update**: Mise à jour immédiate de l'UI avant confirmation serveur
- **Batch Operation**: Opération groupée sur plusieurs éléments en une seule transaction
- **GPU Acceleration**: Utilisation du processeur graphique pour les animations
- **ARIA**: Accessible Rich Internet Applications - standards d'accessibilité web
- **WCAG 2.1 AA**: Web Content Accessibility Guidelines niveau AA
- **Zod**: Bibliothèque de validation de schémas TypeScript
- **date-fns**: Bibliothèque de manipulation de dates
- **Framer Motion**: Bibliothèque d'animations React
- **react-window**: Bibliothèque de virtualisation de listes React

## Requirements

### Requirement 1: Utilitaires Partagés

**User Story:** As a developer, I want centralized utility functions, so that code duplication is eliminated and maintenance is simplified.

#### Acceptance Criteria

1. WHEN the System creates utility functions THEN the System SHALL export formatCurrency as a singleton formatter
2. WHEN the System creates utility functions THEN the System SHALL export formatDate as a singleton formatter
3. WHEN the System creates utility functions THEN the System SHALL export REPARTITION_ITEMS as a constant array
4. WHEN the System creates utility functions THEN the System SHALL export STATUT_COLORS as a constant object
5. WHEN the System creates utility functions THEN the System SHALL export PRIORITE_COLORS as a constant object
6. WHEN the System creates utility functions THEN the System SHALL export debounce as a reusable function
7. WHEN the System creates utility functions THEN the System SHALL export throttle as a reusable function

### Requirement 2: Cache IndexedDB

**User Story:** As a user, I want instant data access, so that the interface responds immediately without lag.

#### Acceptance Criteria

1. WHEN the System initializes storage THEN the System SHALL create a Map-based cache with 5-second expiry
2. WHEN the System reads data from IndexedDB THEN the System SHALL check cache first before database access
3. WHEN the System writes data to IndexedDB THEN the System SHALL invalidate relevant cache entries
4. WHEN the System retrieves cached data THEN the System SHALL verify cache timestamp is within expiry window
5. WHEN cache entry expires THEN the System SHALL remove the entry and fetch fresh data from IndexedDB

### Requirement 3: Debounced Updates

**User Story:** As a user, I want smooth slider interactions, so that rapid changes don't cause performance issues.

#### Acceptance Criteria

1. WHEN a user modifies a slider value THEN the System SHALL update the UI immediately
2. WHEN a user modifies a slider value THEN the System SHALL wait 500ms before persisting to IndexedDB
3. WHEN a user makes multiple rapid changes THEN the System SHALL cancel pending saves and restart the timer
4. WHEN the debounce timer completes THEN the System SHALL save the final value to IndexedDB
5. WHEN a save operation fails THEN the System SHALL display an error message to the user

### Requirement 4: Optimized Animations

**User Story:** As a user, I want smooth animations that don't drain battery, so that the app feels responsive on all devices.

#### Acceptance Criteria

1. WHEN the System renders animations THEN the System SHALL use GPU acceleration with willChange transform
2. WHEN the System displays infinite animations THEN the System SHALL limit repetitions to 3 iterations maximum
3. WHEN the System animates elements THEN the System SHALL reduce animation amplitude by 20%
4. WHEN the System animates elements THEN the System SHALL increase animation duration to reduce CPU usage
5. WHEN the System detects mobile device THEN the System SHALL further reduce animation complexity

### Requirement 5: Validation avec Zod

**User Story:** As a developer, I want automatic data validation, so that corrupted data never enters the database.

#### Acceptance Criteria

1. WHEN the System saves salaire data THEN the System SHALL validate against salaireSchema before persistence
2. WHEN the System saves repartition data THEN the System SHALL validate against repartitionSchema before persistence
3. WHEN the System saves achat loisir data THEN the System SHALL validate against achatLoisirSchema before persistence
4. WHEN validation fails THEN the System SHALL throw an error with detailed validation messages
5. WHEN validation succeeds THEN the System SHALL persist the validated data to IndexedDB

### Requirement 6: Optimized Date Calculations

**User Story:** As a user, I want accurate date calculations, so that budget projections are reliable.

#### Acceptance Criteria

1. WHEN the System calculates month differences THEN the System SHALL use date-fns differenceInMonths function
2. WHEN the System parses date strings THEN the System SHALL use date-fns parseISO function
3. WHEN the System performs date operations THEN the System SHALL handle timezone differences correctly
4. WHEN the System calculates faisabilité THEN the System SHALL use optimized date functions for 40% performance improvement
5. WHEN date calculations fail THEN the System SHALL fallback to safe default values

### Requirement 7: Virtualisation des Listes

**User Story:** As a user, I want smooth scrolling through long lists, so that the interface remains responsive with hundreds of items.

#### Acceptance Criteria

1. WHEN the System renders a list with more than 20 items THEN the System SHALL use react-window FixedSizeList
2. WHEN the System virtualizes a list THEN the System SHALL render only visible items plus buffer
3. WHEN a user scrolls the list THEN the System SHALL maintain 60fps scroll performance
4. WHEN the System virtualizes timeline THEN the System SHALL limit visible months to 12 maximum
5. WHEN the System virtualizes grid THEN the System SHALL calculate dynamic item heights

### Requirement 8: Optimistic Updates

**User Story:** As a user, I want instant feedback on my actions, so that the interface feels responsive even with slow network.

#### Acceptance Criteria

1. WHEN a user updates salaire THEN the System SHALL update UI immediately before database confirmation
2. WHEN a user updates repartition THEN the System SHALL update UI immediately before database confirmation
3. WHEN a database save fails THEN the System SHALL rollback UI to previous state automatically
4. WHEN a database save succeeds THEN the System SHALL confirm UI state with server data
5. WHEN a rollback occurs THEN the System SHALL display an error notification to the user

### Requirement 9: Batch Operations

**User Story:** As a developer, I want efficient bulk operations, so that multiple items can be saved or deleted in one transaction.

#### Acceptance Criteria

1. WHEN the System saves multiple achats THEN the System SHALL use a single IndexedDB transaction
2. WHEN the System deletes multiple achats THEN the System SHALL use a single IndexedDB transaction
3. WHEN a batch operation completes THEN the System SHALL invalidate cache once for all items
4. WHEN a batch operation fails THEN the System SHALL rollback the entire transaction atomically
5. WHEN the System performs batch operations THEN the System SHALL achieve 500% performance improvement over individual operations

### Requirement 10: Error Boundaries

**User Story:** As a user, I want graceful error handling, so that one component error doesn't crash the entire application.

#### Acceptance Criteria

1. WHEN a component throws an error THEN the System SHALL catch it with an Error Boundary
2. WHEN an Error Boundary catches an error THEN the System SHALL display a fallback UI
3. WHEN an Error Boundary catches an error THEN the System SHALL log the error details
4. WHEN an Error Boundary catches an error THEN the System SHALL allow the rest of the application to continue functioning
5. WHEN a user encounters an error THEN the System SHALL provide a button to retry the failed operation

### Requirement 11: Accessibilité ARIA

**User Story:** As a user with disabilities, I want full keyboard and screen reader support, so that I can use the application independently.

#### Acceptance Criteria

1. WHEN the System renders interactive elements THEN the System SHALL include appropriate ARIA labels
2. WHEN the System renders buttons THEN the System SHALL include aria-label and aria-describedby attributes
3. WHEN the System renders form inputs THEN the System SHALL associate labels with aria-labelledby
4. WHEN the System renders dynamic content THEN the System SHALL use aria-live regions for updates
5. WHEN the System renders icons THEN the System SHALL include aria-hidden true and text alternatives

### Requirement 12: Nettoyage des Imports

**User Story:** As a developer, I want clean code without unused imports, so that bundle size is minimized and code is maintainable.

#### Acceptance Criteria

1. WHEN the System compiles code THEN the System SHALL not include unused React imports
2. WHEN the System compiles code THEN the System SHALL not include unused component imports
3. WHEN the System compiles code THEN the System SHALL not include unused icon imports
4. WHEN the System compiles code THEN the System SHALL not include unused state variables
5. WHEN the System compiles code THEN the System SHALL achieve 8KB bundle size reduction

### Requirement 13: Service Worker Cache

**User Story:** As a user, I want offline support, so that I can access my financial data without internet connection.

#### Acceptance Criteria

1. WHEN the System installs Service Worker THEN the System SHALL cache static assets
2. WHEN a user requests a cached resource THEN the System SHALL serve from cache first
3. WHEN a user requests an uncached resource THEN the System SHALL fetch from network and cache
4. WHEN the System updates THEN the System SHALL invalidate old cache and create new version
5. WHEN a user is offline THEN the System SHALL serve all cached resources successfully

### Requirement 14: Code Splitting Avancé

**User Story:** As a user, I want fast initial load times, so that the application is ready to use quickly.

#### Acceptance Criteria

1. WHEN the System loads initially THEN the System SHALL lazy load non-critical components
2. WHEN a user hovers over a navigation item THEN the System SHALL preload the corresponding component
3. WHEN the System bundles code THEN the System SHALL create separate chunks for each major section
4. WHEN the System loads a component THEN the System SHALL use React.lazy with Suspense
5. WHEN the System optimizes bundles THEN the System SHALL achieve 40% reduction in initial bundle size

### Requirement 15: Compression des Données

**User Story:** As a user, I want efficient storage usage, so that I can store more historical data without hitting browser limits.

#### Acceptance Criteria

1. WHEN the System saves historique data larger than 1KB THEN the System SHALL compress using pako
2. WHEN the System reads compressed historique THEN the System SHALL decompress automatically
3. WHEN the System compresses data THEN the System SHALL mark entries with compressed flag
4. WHEN the System stores compressed data THEN the System SHALL achieve 60% storage reduction
5. WHEN compression fails THEN the System SHALL fallback to uncompressed storage
