# Design Document - Synchronisation des Données Sidebar

## Overview

Ce document décrit l'architecture et la conception du système de synchronisation des données entre les modules de l'application et la sidebar premium. Le système repose sur trois piliers: (1) un hook de calcul des statistiques qui agrège les données brutes, (2) un système d'événements pour notifier les changements, et (3) un cache intelligent pour optimiser les performances.

## Architecture

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  BooksTab  │  WorkoutTab  │  NutritionTab  │  FinanceTab   │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
       │ emit events  │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              Sidebar Events System (sidebarEvents.js)       │
│  - BOOK_UPDATED, PAGES_READ, WORKOUT_ADDED, MEAL_LOGGED    │
└──────────────────────────────┬──────────────────────────────┘
                               │ listen
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    useSidebarData Hook                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Aggregation Layer                              │  │
│  │  - useBooksStatistics()                              │  │
│  │  - useWorkoutStatistics()                            │  │
│  │  - useNutritionStatistics()                          │  │
│  │  - useFinanceStatistics()                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cache Layer (localStorage + memory)                 │  │
│  │  - booksData, workoutData, nutritionData             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ provide data
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SidebarPremium Component                  │
│  - LectureSection                                            │
│  - ActivitePhysiqueSection                                   │
│  - NutritionSection                                          │
│  - FinancesSection                                           │
└─────────────────────────────────────────────────────────────┘
```

### Flux de Données

1. **Chargement Initial**
   - `useSidebarData` charge les données depuis IndexedDB/localStorage
   - Calcule les statistiques via les hooks spécialisés
   - Met en cache les résultats dans localStorage
   - Fournit les données aux composants de la sidebar

2. **Mise à Jour**
   - L'utilisateur effectue une action (ajoute un livre, une session, etc.)
   - Le module émet un événement sidebar
   - `useSidebarData` écoute l'événement et rafraîchit les données concernées
   - Le cache est invalidé et recalculé
   - Les composants de la sidebar se re-rendent avec les nouvelles données

3. **Optimisation**
   - Debouncing des événements (500ms) pour éviter les recalculs excessifs
   - Memoization des calculs coûteux
   - Chargement prioritaire depuis le cache pour un affichage instantané
   - Mise à jour asynchrone depuis la source de vérité

## Components and Interfaces

### 1. useBooksStatistics Hook

```typescript
interface BooksStatistics {
  currentBooks: number;        // Nombre de livres avec status 'in-progress'
  todayPages: number;          // Total pages lues aujourd'hui
  todayMinutes: number;        // Total minutes lues aujourd'hui
  dailyGoal: number;           // Objectif quotidien en minutes
  hasData: boolean;            // Indicateur de disponibilité des données
}

function useBooksStatistics(books: Book[], today: string): BooksStatistics
```

**Responsabilités:**
- Calculer le nombre de livres en cours
- Agréger les sessions de lecture du jour
- Récupérer l'objectif quotidien depuis les préférences utilisateur
- Mettre en cache les résultats dans localStorage

### 2. Sidebar Events System

```typescript
// Événements disponibles
const SIDEBAR_EVENTS = {
  // Livres
  BOOK_ADDED: 'sidebar:book:added',
  BOOK_UPDATED: 'sidebar:book:updated',
  BOOK_DELETED: 'sidebar:book:deleted',
  PAGES_READ: 'sidebar:book:pages-read',
  
  // Sport
  WORKOUT_ADDED: 'sidebar:workout:added',
  WORKOUT_UPDATED: 'sidebar:workout:updated',
  WORKOUT_DELETED: 'sidebar:workout:deleted',
  
  // Nutrition
  MEAL_LOGGED: 'sidebar:nutrition:meal-logged',
  MEAL_UPDATED: 'sidebar:nutrition:meal-updated',
  MEAL_DELETED: 'sidebar:nutrition:meal-deleted',
  
  // Quêtes
  QUEST_COMPLETED: 'sidebar:quest:completed',
  QUEST_UPDATED: 'sidebar:quest:updated',
  QUEST_CREATED: 'sidebar:quest:created',
  
  // Finances
  FINANCE_UPDATED: 'sidebar:finance:updated',
};

// API
function emitSidebarEvent(eventName: string, payload?: any): void
function useSidebarEvents(eventName: string, callback: (payload: any) => void): void
```

### 3. Cache Management

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

class SidebarCache {
  // Sauvegarder dans le cache
  set<T>(key: string, data: T): void;
  
  // Récupérer depuis le cache
  get<T>(key: string, maxAge?: number): T | null;
  
  // Invalider le cache
  invalidate(key: string): void;
  
  // Nettoyer les entrées expirées
  cleanup(): void;
}
```



## Data Models

### Book Model

```typescript
interface Book {
  id: string;
  title: string;
  author: string;
  year: number | string;
  genre: string;
  pages: number | string;
  status: 'in-progress' | 'completed' | 'to-read' | 'abandoned' | 'paused';
  shortSummary: string;
  longSummary: string;
  personalScore: number;
  hasCover: boolean;
  coverInline: string | null;  // dataURL pour persistance
  hasPdf: boolean;
  readingSessions: ReadingSession[];
  createdAt: string;           // ISO date
  userId?: string;             // Pour isolation multi-utilisateur
}

interface ReadingSession {
  id: string;
  date: string;                // ISO date (YYYY-MM-DD)
  durationMinutes: number;
  pagesRead: number;
  note: string;
}
```

### Sidebar Data Model

```typescript
interface SidebarData {
  metrics: {
    xp: number;
    level: number;
    streak: number;
    focus: number;
  };
  
  quests: Quest[];
  
  sport: {
    weeklyWorkouts: number;
    todayCalories: number;
    todaySteps: number;
    avgHeartRate: number;
    hasGarminData: boolean;
  };
  
  finance: {
    netWorth: number;
    monthlyBudget: number;
    monthlySavings: number;
    investments: number;
    hasData: boolean;
  };
  
  nutrition: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    water: number;
    compliance: number;
    hasData: boolean;
  };
  
  learning: {
    currentBooks: number;
    todayPages: number;
    todayMinutes: number;
    dailyGoal: number;
    hasData: boolean;
  };
  
  today: {
    questsCompleted: number;
    questsTotal: number;
    workoutDone: boolean;
    pagesRead: number;
    mealsLogged: number;
    mealsTarget: number;
  };
  
  isLoading: boolean;
  isAuthenticated: boolean;
  todayDate: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Current books count accuracy
*For any* set of books, the currentBooks count should equal the number of books with status 'in-progress'
**Validates: Requirements 1.1**

### Property 2: Today's pages calculation
*For any* set of books with reading sessions, todayPages should equal the sum of pagesRead from all sessions dated today
**Validates: Requirements 1.2**

### Property 3: Today's minutes calculation
*For any* set of books with reading sessions, todayMinutes should equal the sum of durationMinutes from all sessions dated today
**Validates: Requirements 1.3**

### Property 4: Statistics update on book addition
*For any* initial book list and new book, adding the book should increase currentBooks by 1 if the new book's status is 'in-progress', otherwise currentBooks should remain unchanged
**Validates: Requirements 2.1**

### Property 5: Statistics update on session addition
*For any* book and new reading session dated today, adding the session should increase todayPages by session.pagesRead and todayMinutes by session.durationMinutes
**Validates: Requirements 2.2**

### Property 6: Statistics update on status change
*For any* book, changing its status from 'in-progress' to another status should decrease currentBooks by 1, and changing from another status to 'in-progress' should increase currentBooks by 1
**Validates: Requirements 2.3**

### Property 7: Event emission on data change
*For any* book operation (add, update, delete), the system should emit the corresponding sidebar event (BOOK_ADDED, BOOK_UPDATED, BOOK_DELETED)
**Validates: Requirements 4.1, 4.2**

### Property 8: Debounced refresh
*For any* sequence of events occurring within 500ms, the system should trigger only one refresh after the last event
**Validates: Requirements 4.5**

### Property 9: Default values on missing data
*For any* module with no available data, the system should return a valid data structure with hasData set to false and all numeric fields set to 0
**Validates: Requirements 5.5, 7.1**

### Property 10: Cache invalidation
*For any* data update, the cached statistics should be recalculated and the old cache entry should be replaced with the new values
**Validates: Requirements 6.5**



## Error Handling

### Stratégies de Gestion des Erreurs

1. **IndexedDB Unavailable**
   - Fallback vers localStorage pour la lecture
   - Log warning dans la console
   - Continuer avec les données disponibles

2. **localStorage Full**
   - Log warning dans la console
   - Utiliser uniquement la mémoire (state React)
   - Afficher un message à l'utilisateur pour nettoyer le stockage

3. **Calculation Errors**
   - Wrapper tous les calculs dans try-catch
   - Retourner des valeurs par défaut sûres (0, false, [])
   - Logger l'erreur pour le débogage

4. **Event System Errors**
   - Isoler chaque listener dans son propre try-catch
   - Une erreur dans un listener ne doit pas bloquer les autres
   - Logger les erreurs pour investigation

5. **User Not Authenticated**
   - Retourner des structures vides pour tous les modules
   - Afficher des états vides dans la sidebar
   - Ne pas tenter de charger des données

### Error Boundaries

```typescript
// Wrapper pour les composants de la sidebar
class SidebarSectionErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('[SidebarSection] Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="sidebar-section-error">
          <span>⚠️</span>
          <span>Données temporairement indisponibles</span>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Tests

1. **useBooksStatistics Hook**
   - Test avec 0 livres → currentBooks = 0
   - Test avec 3 livres 'in-progress' → currentBooks = 3
   - Test avec sessions aujourd'hui → todayPages et todayMinutes corrects
   - Test avec sessions d'autres jours → todayPages et todayMinutes = 0

2. **Sidebar Events**
   - Test émission d'événement → listener reçoit le payload
   - Test multiple listeners → tous reçoivent l'événement
   - Test unsubscribe → listener ne reçoit plus d'événements

3. **Cache Management**
   - Test set/get → données récupérées correctement
   - Test expiration → données expirées retournent null
   - Test invalidation → données invalidées retournent null

### Integration Tests

1. **Book Addition Flow**
   - Ajouter un livre → événement émis → sidebar mise à jour
   - Vérifier que currentBooks augmente de 1

2. **Session Addition Flow**
   - Ajouter une session aujourd'hui → événement émis → sidebar mise à jour
   - Vérifier que todayPages et todayMinutes augmentent

3. **Multi-Module Sync**
   - Modifier plusieurs modules → tous les événements émis
   - Vérifier que chaque section de la sidebar se met à jour indépendamment

### Property-Based Tests

Les property-based tests seront implémentés en utilisant **fast-check** (bibliothèque PBT pour JavaScript/TypeScript). Chaque test exécutera un minimum de 100 itérations.

1. **Property 1: Current books count accuracy**
   - Générer des listes aléatoires de livres avec différents statuts
   - Vérifier que currentBooks = nombre de livres avec status 'in-progress'

2. **Property 2 & 3: Today's calculations**
   - Générer des livres avec sessions aléatoires (dates variées)
   - Vérifier que todayPages et todayMinutes correspondent aux sessions d'aujourd'hui

3. **Property 4-6: Statistics updates**
   - Générer des opérations aléatoires (add, update, delete)
   - Vérifier que les statistiques sont toujours cohérentes après chaque opération

4. **Property 8: Debounced refresh**
   - Générer des séquences d'événements avec timing aléatoire
   - Vérifier qu'un seul refresh est déclenché pour les événements groupés

### Visual Regression Tests

1. **Book Display Layout**
   - Capturer des screenshots des listes de livres (in-progress, completed, to-read)
   - Comparer avec les baselines pour détecter les régressions visuelles
   - Vérifier l'absence de chevauchements

## Performance Considerations

### Optimisations

1. **Memoization**
   - Utiliser `useMemo` pour les calculs coûteux
   - Utiliser `useCallback` pour les fonctions passées en props
   - Éviter les recalculs inutiles lors des re-renders

2. **Debouncing**
   - Grouper les événements rapides (500ms window)
   - Éviter les rafraîchissements excessifs
   - Utiliser `useDebounce` pour les inputs utilisateur

3. **Lazy Loading**
   - Charger les couvertures de livres par batch (8 à la fois)
   - Utiliser `IntersectionObserver` pour le chargement à la demande
   - Libérer les ObjectURLs non utilisés

4. **Cache Strategy**
   - Afficher immédiatement les données en cache
   - Rafraîchir en arrière-plan depuis la source
   - Invalider le cache uniquement quand nécessaire

### Performance Budget

- Calcul des statistiques: < 50ms
- Rafraîchissement de la sidebar: < 100ms
- Chargement initial: < 500ms
- Émission d'événement: < 10ms

## Implementation Notes

### Phase 1: Core Statistics (Priority: HIGH)
1. Créer `useBooksStatistics` hook
2. Intégrer dans `useSidebarData`
3. Mettre à jour le cache localStorage
4. Tester avec des données réelles

### Phase 2: Event System (Priority: HIGH)
1. Ajouter émission d'événements dans BooksTab
2. Ajouter listeners dans useSidebarData
3. Implémenter le debouncing
4. Tester la synchronisation

### Phase 3: Other Modules (Priority: MEDIUM)
1. Vérifier les statistiques Sport
2. Vérifier les statistiques Nutrition
3. Vérifier les statistiques Quêtes
4. Corriger les incohérences trouvées

### Phase 4: Testing & Polish (Priority: LOW)
1. Écrire les unit tests
2. Écrire les property-based tests
3. Écrire les integration tests
4. Optimiser les performances

### Phase 5: Documentation & Cleanup (Priority: LOW)
1. Documenter le système
2. Nettoyer le code legacy
3. Migration des données utilisateur

## Migration Strategy

### Étape 1: Backward Compatibility
- Garder l'ancien système en place
- Ajouter le nouveau système en parallèle
- Permettre la coexistence temporaire

### Étape 2: Gradual Rollout
- Activer le nouveau système pour le module Lecture
- Vérifier que tout fonctionne correctement
- Étendre aux autres modules un par un

### Étape 3: Cleanup
- Supprimer l'ancien code une fois le nouveau validé
- Nettoyer les anciens caches localStorage
- Mettre à jour la documentation

## Security Considerations

1. **User Data Isolation**
   - Filtrer les données par userId
   - Ne jamais exposer les données d'autres utilisateurs
   - Valider l'authentification avant de charger les données

2. **Input Validation**
   - Valider tous les inputs utilisateur
   - Sanitizer les données avant stockage
   - Éviter les injections XSS dans les résumés de livres

3. **Storage Limits**
   - Respecter les quotas localStorage (5-10MB)
   - Respecter les quotas IndexedDB (50MB+)
   - Gérer gracieusement les dépassements de quota
