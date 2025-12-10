# Design Document - Modules Sidebar Historiques

## Overview

Ce document détaille l'architecture et l'implémentation de 11 nouveaux modules sidebar historiques qui s'intègrent parfaitement avec les modules existants. Le système offre une navigation ultra-précise, une synchronisation temps réel des données, et une expérience utilisateur fluide avec des fonctionnalités interactives avancées.

## Architecture

### Structure Générale

```
SidebarPremium
├── Module "Enregistrer Session" (NOUVEAU - Position 1)
├── Module Existant (Position 2)
├── Module "Progression Lecture" (NOUVEAU - Position 3)
├── Module Existant (Position 4)
├── Module "Métriques Garmin" (NOUVEAU - Position 5)
├── Module Existant (Position 6)
├── Module "Quêtes Interactives" (NOUVEAU - Position 7)
├── Module Existant (Position 8)
├── Module "Évolution Patrimoine" (NOUVEAU - Position 9)
├── Module Existant (Position 10)
├── Module "Liste Courses" (NOUVEAU - Position 11)
└── [Alternance continue...]
```

### Système de Navigation Précise

```typescript
interface NavigationTarget {
  tab: string;
  subtab?: string;
  moduleId: string;
  scrollBehavior: 'smooth' | 'instant';
  highlightDuration?: number;
}

interface DeepLinkService {
  navigateToModule(target: NavigationTarget): Promise<void>;
  scrollToElement(elementId: string): void;
  highlightModule(moduleId: string, duration: number): void;
  activateSubtab(tab: string, subtab: string): void;
}
```

## Components and Interfaces

### 1. Module Enregistrer Session (Position 1)

```typescript
interface SessionRecorderModule {
  // Actions rapides
  startSportSession(): void;
  startReadingSession(): void;
  startLearningSession(): void;
  
  // Timer de lecture
  readingTimer: {
    isActive: boolean;
    elapsed: number;
    controls: {
      play(): void;
      pause(): void;
      stop(): void;
    };
  };
  
  // Modal de fin de session
  sessionModal: {
    isOpen: boolean;
    bookSelection: Book[];
    pagesRead: number;
    onSave(bookId: string, pages: number): void;
  };
  
  // Menu apprentissage
  learningMenu: {
    isOpen: boolean;
    subjects: Subject[];
    duration: number;
    onSave(subjectId: string, duration: number): void;
  };
}
```

### 2. Module Progression Lecture (Position 3)

```typescript
interface ReadingProgressModule {
  period: '7d' | '30d' | '3m' | '6m' | '1y';
  metrics: {
    booksCompleted: number;
    totalPages: number;
    totalTime: number;
    averageSpeed: number; // pages/hour
  };
  trends: {
    booksCompletedTrend: 'up' | 'down' | 'stable';
    readingSpeedTrend: 'up' | 'down' | 'stable';
  };
  miniChart: ChartData;
  onNavigate(): void; // → Books Tab > Reading Progress Module
}
```

### 3. Module Métriques Garmin (Position 5)

```typescript
interface GarminMetricsModule {
  todayMetrics: {
    calories: {
      active: number;
      resting: number;
      total: number;
    };
    bodyBattery: number;
    steps: number;
    heartRate: {
      resting: number;
      max: number;
      average: number;
    };
    sleep?: {
      duration: number;
      quality: 'poor' | 'fair' | 'good' | 'excellent';
      deepSleep: number;
    };
  };
  lastSync: Date;
  onNavigate(): void; // → Sport Tab > Today Subtab > Garmin Module
}
```

### 4. Module Quêtes Interactives (Position 7)

```typescript
interface InteractiveQuestsModule {
  todayQuests: Quest[];
  xpBar: {
    currentXP: number;
    nextLevelXP: number;
    currentLevel: number;
    progress: number; // 0-100%
  };
  
  // Actions
  toggleQuest(questId: string): void;
  createQuest(): void; // → Quests Tab > Create Subtab
  
  // Statistiques configurables
  statistics: {
    completionRate: {
      value: number;
      period: '7d' | '30d' | '3m';
    };
    streakCount: {
      value: number;
      period: '7d' | '30d' | '3m';
    };
    totalXP: {
      value: number;
      period: '7d' | '30d' | '3m';
    };
  };
}
```

### 5. Module Évolution Patrimoine (Position 9)

```typescript
interface PatrimonyEvolutionModule {
  period: '30d' | '3m' | '6m' | '1y';
  metrics: {
    netWorthChange: {
      value: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
    averageSavings: number; // per month
    investmentPerformance: {
      value: number;
      percentage: number;
    };
    objectivesReached: number;
  };
  miniChart: ChartData;
  onNavigate(): void; // → Finance Tab > Patrimony Module
}
```

### 6. Module Liste Courses (Position 11)

```typescript
interface ShoppingListModule {
  currentList: {
    id: string;
    name: string;
    scheduledTime: Date;
    items: ShoppingItem[];
    isClosest: boolean;
  };
  nextLists: ShoppingList[];
  onNavigate(listId: string): void; // → Finance Tab > Smart Shopping Subtab > List Module
}
```

## Data Models

### Navigation State

```typescript
interface NavigationState {
  currentTab: string;
  currentSubtab?: string;
  targetModule?: string;
  isNavigating: boolean;
  scrollPosition: number;
}
```

### Module Configuration

```typescript
interface ModuleConfig {
  id: string;
  type: 'legacy' | 'historical';
  position: number;
  isVisible: boolean;
  refreshInterval: number;
  navigationTarget?: NavigationTarget;
}
```

### Data Synchronization

```typescript
interface SyncState {
  lastSync: Date;
  isLoading: boolean;
  error?: string;
  pendingUpdates: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Precision
*For any* sidebar module click, the navigation should land exactly on the target module with proper scroll positioning, regardless of the module's position on the page
**Validates: Requirements 1.1, 1.2, 2.4, 3.4, 4.4, 12.1, 12.2**

### Property 2: Timer State Consistency
*For any* reading timer operation (play/pause/stop), the timer state should remain consistent and the UI controls should reflect the current state accurately
**Validates: Requirements 1.3, 1.4**

### Property 3: Data Synchronization Integrity
*For any* data update in the sidebar modules, the corresponding main modules should reflect the same data within the synchronization window
**Validates: Requirements 1.5, 4.2, 12.5**

### Property 4: Period Calculation Accuracy
*For any* selected time period, the calculated metrics should accurately reflect the data within that specific timeframe
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Real-time Update Propagation
*For any* data change event, all affected modules should update their display within the specified refresh interval
**Validates: Requirements 3.5, 4.3**

### Property 6: Module Alternation Order
*For any* sidebar display, the modules should follow the strict alternation pattern: legacy → historical → legacy → historical
**Validates: Requirements 13.1, 13.2, 13.3**

### Property 7: Subtab Activation Accuracy
*For any* navigation event, the correct subtab should be automatically activated before scrolling to the target module
**Validates: Requirements 12.3**

### Property 8: Visual Highlight Behavior
*For any* successful navigation, the target module should be temporarily highlighted for the specified duration
**Validates: Requirements 12.4**

### Property 9: Performance Threshold Compliance
*For any* sidebar loading operation, the data should be loaded and displayed within 500ms
**Validates: Requirements 14.3**

### Property 10: Error State Graceful Handling
*For any* error condition, the system should maintain functionality and display appropriate error states without crashing
**Validates: Requirements 14.5**

### Property 11: Cache Utilization Efficiency
*For any* complex calculation, the system should utilize caching to avoid redundant computations
**Validates: Requirements 14.4**

### Property 12: Quest Interaction Synchronization
*For any* quest checkbox interaction in the sidebar, the state should immediately synchronize with the main quests module
**Validates: Requirements 4.1, 4.2**

### Property 13: Conditional Data Display
*For any* optional data (like sleep metrics), the display should only show the data when it's available and valid
**Validates: Requirements 3.2, 3.3**

### Property 14: Modal Workflow Completion
*For any* timer stop action, the mandatory modal should appear with all required fields and prevent session saving until completed
**Validates: Requirements 1.4, 1.5**

### Property 15: Shopping List Time Proximity
*For any* current time, the displayed shopping list should be the one closest to the current time slot
**Validates: Requirements 6.1, 6.2**

## Error Handling

### Navigation Errors
- **Module Not Found**: Fallback to tab root with user notification
- **Scroll Failure**: Retry with alternative scroll method
- **Subtab Activation Error**: Manual subtab selection prompt

### Data Synchronization Errors
- **Sync Timeout**: Display cached data with sync indicator
- **Network Failure**: Offline mode with retry mechanism
- **Data Corruption**: Fallback to last known good state

### Timer Errors
- **Timer Drift**: Auto-correction based on system time
- **State Inconsistency**: Reset timer with user confirmation
- **Storage Failure**: In-memory backup with retry

### Performance Errors
- **Slow Loading**: Progressive loading with skeleton UI
- **Memory Pressure**: Intelligent module unloading
- **Cache Overflow**: LRU cache eviction strategy

## Testing Strategy

### Unit Testing
- Component rendering with various data states
- Navigation function accuracy
- Timer state management
- Data calculation correctness
- Error boundary functionality

### Property-Based Testing
- Navigation precision across all modules
- Data synchronization consistency
- Performance threshold compliance
- Module alternation order verification
- Timer state transitions
- Cache efficiency validation

### Integration Testing
- End-to-end navigation workflows
- Cross-module data synchronization
- Real-time update propagation
- Error recovery scenarios
- Performance under load

### Performance Testing
- Load time measurements
- Memory usage monitoring
- Scroll performance optimization
- Real-time update latency
- Cache hit rate analysis