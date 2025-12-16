# Design Document - Sous-onglet Statistiques de Lecture

## Overview

Le sous-onglet Statistiques de Lecture est une interface complète d'analyse des habitudes de lecture qui s'intègre dans l'onglet Livres existant. Il transforme les données brutes des sessions de lecture en insights visuels et métriques actionables pour aider l'utilisateur à comprendre et améliorer ses habitudes de lecture.

Le système utilise les données existantes (livres, sessions de lecture, genres) pour générer des visualisations interactives, des prédictions et des recommandations personnalisées.

## Architecture

### Structure des Composants

```
BooksTab/
├── SubTabs/
│   ├── LibrarySubTab (existant)
│   └── StatisticsSubTab (nouveau)
│       ├── StatisticsDashboard
│       ├── ChartsContainer
│       │   ├── PagesPerDayChart
│       │   ├── ReadingSpeedChart
│       │   ├── HeatmapCalendar
│       │   ├── GenreDistributionChart
│       │   └── GoalsProgressChart
│       ├── MetricsPanel
│       ├── TimeFilters
│       ├── ComparisonMode
│       └── ExportTools
```

### Architecture des Données

```
ReadingStatistics/
├── DataProcessors/
│   ├── SessionAggregator
│   ├── MetricsCalculator
│   ├── TrendAnalyzer
│   └── PredictionEngine
├── ChartServices/
│   ├── ChartDataTransformer
│   ├── InteractivityHandler
│   └── ExportService
└── Storage/
    ├── StatisticsCache
    └── UserPreferences
```

## Components and Interfaces

### StatisticsSubTab Component

**Props:**
- `books: Book[]` - Liste des livres avec sessions
- `selectedPeriod: TimePeriod` - Période sélectionnée
- `onPeriodChange: (period: TimePeriod) => void`

**State:**
- `activeChart: ChartType` - Graphique actuellement affiché
- `comparisonMode: boolean` - Mode comparaison activé
- `filters: FilterState` - Filtres actifs (genre, statut, etc.)

### PagesPerDayChart Component

**Props:**
- `sessions: ReadingSession[]` - Sessions filtrées
- `period: TimePeriod` - Période d'affichage
- `onPointClick: (date: string, sessions: ReadingSession[]) => void`

**Features:**
- Graphique en ligne interactif avec Recharts
- Zoom et pan sur les données
- Tooltips détaillés avec contexte
- Agrégation automatique par jour

### HeatmapCalendar Component

**Props:**
- `sessions: ReadingSession[]` - Sessions de l'année
- `year: number` - Année affichée
- `onDayClick: (date: string) => void`

**Features:**
- Grille 365 jours avec intensité colorée
- Calcul automatique des streaks
- Navigation entre années
- Légende d'intensité

### MetricsCalculator Service

**Interface:**
```typescript
interface ReadingMetrics {
  totalPages: number;
  totalTime: number; // minutes
  averageSpeed: number; // pages/hour
  sessionsCount: number;
  booksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionDuration: number;
  readingFrequency: number; // sessions/week
}
```

**Methods:**
- `calculateMetrics(sessions: ReadingSession[], period: TimePeriod): ReadingMetrics`
- `calculateSpeedByGenre(sessions: ReadingSession[], books: Book[]): GenreSpeed[]`
- `calculateStreaks(sessions: ReadingSession[]): StreakData`
- `predictCompletionTime(book: Book, userSpeed: number): number`

## Data Models

### ReadingSession (existant, étendu)
```typescript
interface ReadingSession {
  id: string;
  bookId: string;
  date: string; // ISO date
  durationMinutes: number;
  pagesRead: number;
  note?: string;
  // Nouveaux champs calculés
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  readingSpeed?: number; // pages/hour pour cette session
}
```

### StatisticsData
```typescript
interface StatisticsData {
  metrics: ReadingMetrics;
  chartData: {
    pagesPerDay: DailyData[];
    speedEvolution: SpeedData[];
    genreDistribution: GenreData[];
    heatmapData: HeatmapData[];
    goalsProgress: GoalData[];
  };
  insights: ReadingInsight[];
  predictions: ReadingPrediction[];
}
```

### TimePeriod
```typescript
type TimePeriod = '7d' | '1m' | '3m' | '6m' | '1y' | 'all';

interface PeriodConfig {
  label: string;
  days: number;
  granularity: 'day' | 'week' | 'month';
}
```

### ReadingGoal
```typescript
interface ReadingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number; // pages ou minutes
  unit: 'pages' | 'minutes';
  startDate: string;
  endDate?: string;
  isActive: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard Display Consistency
*For any* set of reading data, when the statistics dashboard is displayed, all metric components should render without errors and show consistent values across all visualizations
**Validates: Requirements 1.1**

### Property 2: Period Filter Consistency  
*For any* time period selection, all charts and metrics should update to show data only within that period, and the total values should match across all components
**Validates: Requirements 1.2, 2.2, 3.2**

### Property 3: Data Aggregation Accuracy
*For any* day with multiple reading sessions, the total pages displayed should equal the sum of all session pages for that day
**Validates: Requirements 2.4**

### Property 4: Reading Speed Calculation
*For any* set of reading sessions with valid duration and pages, the calculated reading speed should equal total pages divided by total hours
**Validates: Requirements 3.1**

### Property 5: Genre Filtering Consistency
*For any* genre filter selection, all displayed statistics should only include data from books of that genre
**Validates: Requirements 3.3, 5.2**

### Property 6: Heatmap Intensity Mapping
*For any* calendar heatmap, the color intensity of each day should correctly represent the relative reading activity for that day
**Validates: Requirements 4.1**

### Property 7: Streak Calculation Accuracy
*For any* sequence of reading sessions, the calculated streak should represent the actual number of consecutive days with reading activity
**Validates: Requirements 4.5**

### Property 8: Genre Distribution Accuracy
*For any* set of books and sessions, the percentage distribution by genre should sum to 100% and accurately reflect the time spent on each genre
**Validates: Requirements 5.1**

### Property 9: Goal Progress Calculation
*For any* reading goal and current progress, the displayed percentage should accurately reflect actual progress toward the goal
**Validates: Requirements 6.2, 6.5**

### Property 10: Time Aggregation Consistency
*For any* period, the total reading time displayed should equal the sum of all session durations within that period
**Validates: Requirements 7.1**

### Property 11: Completion Time Prediction
*For any* book in progress with user reading speed data, the predicted completion time should be based on remaining pages divided by average reading speed
**Validates: Requirements 8.1**

### Property 12: Pattern Recognition Accuracy
*For any* set of reading sessions, identified patterns (best times, days) should be based on actual frequency and duration data
**Validates: Requirements 8.3**

### Property 13: Period Comparison Calculation
*For any* two selected periods, the calculated differences and percentages should accurately reflect the change between the periods
**Validates: Requirements 9.2**

### Property 14: Filter State Persistence
*For any* applied filters or preferences, they should be maintained across page refreshes and component re-renders
**Validates: Requirements 10.3, 10.5**

### Property 15: Export Data Integrity
*For any* exported statistics, the data should match exactly what is displayed in the interface
**Validates: Requirements 7.5**

## Error Handling

### Data Validation
- Validation des sessions avec dates invalides ou données manquantes
- Gestion des livres sans genre ou métadonnées incomplètes
- Fallbacks pour les calculs avec données insuffisantes

### Chart Error Boundaries
- Error boundaries React pour chaque composant de graphique
- Messages d'erreur utilisateur-friendly
- Fallbacks vers des vues simplifiées en cas d'erreur

### Performance Safeguards
- Limitation du nombre de points de données affichés
- Pagination ou virtualisation pour les grandes datasets
- Debouncing des interactions utilisateur

### Cache Management
- Cache intelligent des calculs coûteux
- Invalidation automatique lors de changements de données
- Gestion des erreurs de cache avec fallback vers recalcul

## Testing Strategy

### Unit Testing
- Tests des fonctions de calcul de métriques avec différents jeux de données
- Tests des transformateurs de données pour les graphiques
- Tests des utilitaires de date et de période
- Tests des composants de filtrage

### Property-Based Testing
- Tests avec génération aléatoire de sessions de lecture
- Validation des propriétés mathématiques (sommes, moyennes, pourcentages)
- Tests de cohérence entre différentes vues des mêmes données
- Tests de robustesse avec données edge-case

### Integration Testing
- Tests d'interaction entre filtres et graphiques
- Tests de navigation entre différentes vues
- Tests de persistance des préférences utilisateur
- Tests de performance avec grandes datasets

### Visual Testing
- Tests de régression visuelle des graphiques
- Tests de responsivité sur différentes tailles d'écran
- Tests d'accessibilité des visualisations
- Tests d'interaction utilisateur (hover, click, zoom)

La stratégie de test utilise **Vitest** pour les tests unitaires et property-based, **React Testing Library** pour les tests de composants, et **Playwright** pour les tests d'intégration. Chaque test property-based est configuré pour exécuter un minimum de 100 itérations pour assurer une couverture robuste.