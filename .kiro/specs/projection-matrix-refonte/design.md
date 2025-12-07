# Design Document - Projection Matrix Block Refonte

## Overview

Le bloc Projection Matrix refonte est un composant React complexe qui combine visualisation de données, simulation interactive et design futuriste. Il permet aux utilisateurs de visualiser leurs projections de progression, simuler différents scénarios et analyser leur activité historique à travers plusieurs graphiques interactifs.

## Architecture

### Structure des composants

```
ProjectionMatrixBlock (composant principal)
├── StatCards (4 cartes de statistiques principales)
├── EfficiencyCard (carte d'efficacité)
├── RealTimeSimulator (simulateur interactif)
│   ├── QuestCounters (compteurs de quêtes)
│   └── ProjectionStats (stats calculées)
├── AIControlPanel (panneau de contrôle des modes IA)
├── XPEvolutionChart (graphique Canvas XP 30 jours)
├── ActivitiesBarChart (graphique barres activités)
├── ActivityHeatmap (matrice d'activité 20 semaines)
└── VisualEffects (effets de glow et bordures)
```

### Flux de données

```
User Input (Quest Counters)
    ↓
State Update (dailyQuestsDone, weeklyQuestsDone)
    ↓
Projection Calculation (useEffect)
    ↓
Computed Values (xpPerDay, daysToNext, efficiency)
    ↓
UI Update (Stats, Charts)
```

## Components and Interfaces

### 1. ProjectionMatrixBlock (Main Component)

**Props:**
```typescript
interface ProjectionMatrixBlockProps {
  allData?: {
    quests?: QuestData;
    activities?: ActivityData;
    level?: number;
    xp?: number;
  };
}
```

**State:**
```typescript
interface ProjectionMatrixState {
  currentLevel: number;
  currentXP: number;
  questsCompleted: number;
  dailyQuestsDone: number;      // 0-5
  weeklyQuestsDone: number;      // 0-3
  selectedMode: 'secure' | 'optimistic' | 'extreme';
  projectionData: ProjectionData;
  activityData: ActivityHeatmapData;
}
```

### 2. RealTimeSimulator

**Props:**
```typescript
interface RealTimeSimulatorProps {
  dailyQuestsDone: number;
  weeklyQuestsDone: number;
  onToggleDaily: () => void;
  onToggleWeekly: () => void;
  projectionData: ProjectionData;
}
```

### 3. XPEvolutionChart

**Props:**
```typescript
interface XPEvolutionChartProps {
  data: number[];              // 30 jours de données XP
  labels: string[];            // Labels des axes
  width?: number;
  height?: number;
}
```

**Méthodes:**
- `drawChart()`: Dessine le graphique complet
- `drawGrid()`: Dessine la grille de fond
- `drawAxes()`: Dessine les axes X et Y
- `drawCurve()`: Dessine la courbe XP
- `drawPoints()`: Dessine les points de données

### 4. ActivitiesBarChart

**Props:**
```typescript
interface ActivitiesBarChartProps {
  activities: ActivityData[];
  width?: number;
  height?: number;
}

interface ActivityData {
  name: string;
  count: number;
  percentage: number;
  type: ActivityType;
  xp: number;
  streak: number;
}

type ActivityType = 'reading' | 'sport' | 'learning' | 'household' | 'health' | 'social';
```

### 5. ActivityHeatmap

**Props:**
```typescript
interface ActivityHeatmapProps {
  activityData: Record<string, number>;  // key: "week-day", value: intensity 0-1
  weeks: number;                          // 20
  onCellHover?: (week: number, day: number, intensity: number) => void;
}
```

## Data Models

### ProjectionData

```typescript
interface ProjectionData {
  xpPerDay: number;           // XP moyen par jour
  daysToNext: number;         // Jours jusqu'au prochain niveau
  nextLevelDate: string;      // Date estimée du prochain niveau
  projectedLevel: number;     // Niveau projeté dans 1 an
  efficiency: number;         // Efficacité en %
}
```

### QuestStats

```typescript
interface QuestStats {
  dailyCompleted: number;     // Quêtes journalières complétées
  weeklyCompleted: number;    // Quêtes hebdomadaires complétées
  monthlyCompleted: number;   // Quêtes mensuelles complétées
  totalXP: number;           // XP total des quêtes
  averageXP: number;         // XP moyen par quête
  bestDay: string;           // Meilleur jour de la semaine
  bestWeek: string;          // Meilleure semaine
}
```

### WeeklyActivity

```typescript
interface WeeklyActivity {
  name: string;              // Nom de l'activité
  count: number;             // Nombre d'occurrences
  percentage: number;        // Pourcentage du total
  type: ActivityType;        // Type d'activité
  xp: number;               // XP généré
  streak: number;           // Série actuelle
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Projection calculation consistency

*For any* valid quest counter values (dailyQuestsDone: 0-5, weeklyQuestsDone: 0-3), the calculated XP per day should equal (dailyQuestsDone × 50) + (weeklyQuestsDone × 150 / 7)

**Validates: Requirements 9.1**

### Property 2: Level progression calculation

*For any* current level and XP values, the XP needed for next level should equal (currentLevel × 200) - (currentXP % (currentLevel × 200))

**Validates: Requirements 9.2**

### Property 3: Efficiency bounds

*For any* calculated efficiency value, it should be between 0 and 100 inclusive

**Validates: Requirements 9.4**

### Property 4: Activity intensity levels

*For any* activity intensity value in the heatmap, it should be mapped to exactly one of 5 levels (0-4) based on thresholds: 0 (0-0.2), 1 (0.2-0.4), 2 (0.4-0.6), 3 (0.6-0.8), 4 (0.8-1.0)

**Validates: Requirements 6.2**

### Property 5: Quest counter cycling

*For any* quest counter (daily or weekly), clicking should cycle through valid values: daily (0→1→2→3→4→5→0), weekly (0→1→2→3→0)

**Validates: Requirements 2.1, 2.2**

### Property 6: Canvas cleanup

*For any* component unmount, all Canvas contexts should be properly released and event listeners removed

**Validates: Requirements 8.5**

### Property 7: Responsive layout adaptation

*For any* screen width, the layout should adapt: mobile (<768px) uses single column, tablet (768-1024px) uses 2 columns, desktop (>1024px) uses full grid

**Validates: Requirements 8.1, 8.2, 8.3**

## Error Handling

### Canvas Rendering Errors

```typescript
try {
  const canvas = canvasRef.current;
  if (!canvas) {
    console.warn('Canvas ref not available');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get 2D context');
    return;
  }
  
  // Drawing logic
} catch (error) {
  console.error('Canvas rendering error:', error);
  // Fallback to static display
}
```

### Data Validation

```typescript
const validateQuestCount = (count: number, max: number): number => {
  if (typeof count !== 'number' || isNaN(count)) {
    console.warn('Invalid quest count, defaulting to 0');
    return 0;
  }
  return Math.max(0, Math.min(max, Math.floor(count)));
};
```

### Missing Data Handling

```typescript
if (!allData || !allData.quests) {
  return (
    <div className="pm-loading">
      <div className="pm-spinner" />
      <p>Chargement des données de projection...</p>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

1. **Projection Calculations**
   - Test XP per day calculation with various quest counts
   - Test days to next level calculation
   - Test efficiency calculation and capping at 100%

2. **Quest Counter Logic**
   - Test daily quest counter cycling (0-5)
   - Test weekly quest counter cycling (0-3)
   - Test state updates trigger recalculation

3. **Activity Data Generation**
   - Test heatmap data structure
   - Test intensity level mapping
   - Test week number calculation

### Property-Based Tests

1. **Property Test: Projection Consistency**
   - Generate random quest counts (0-5 daily, 0-3 weekly)
   - Verify XP/day formula holds for all inputs
   - **Validates: Requirements 9.1**

2. **Property Test: Efficiency Bounds**
   - Generate random XP/day values
   - Verify efficiency is always 0-100%
   - **Validates: Requirements 9.4**

3. **Property Test: Heatmap Intensity Mapping**
   - Generate random intensity values (0-1)
   - Verify each maps to correct level (0-4)
   - **Validates: Requirements 6.2**

4. **Property Test: Quest Counter Cycling**
   - Generate random click sequences
   - Verify counters always stay in valid range
   - **Validates: Requirements 2.1, 2.2**

### Integration Tests

1. Test complete user flow: adjust quests → see updated projections
2. Test Canvas rendering on different screen sizes
3. Test mode switching updates calculations
4. Test heatmap tooltip interactions

### Visual Regression Tests

1. Capture screenshots of different states
2. Compare with baseline images
3. Detect unintended visual changes

## Performance Considerations

### Canvas Optimization

```typescript
// Use requestAnimationFrame for smooth animations
const animateChart = () => {
  if (!isAnimating) return;
  
  drawFrame();
  requestAnimationFrame(animateChart);
};

// Debounce resize events
const handleResize = useMemo(
  () => debounce(() => {
    redrawCharts();
  }, 250),
  []
);
```

### Memoization

```typescript
// Memoize expensive calculations
const projectionData = useMemo(() => {
  return calculateProjections(dailyQuestsDone, weeklyQuestsDone, currentLevel, currentXP);
}, [dailyQuestsDone, weeklyQuestsDone, currentLevel, currentXP]);

// Memoize activity data
const activityHeatmapData = useMemo(() => {
  return generateActivityData(20);
}, []);
```

### Lazy Loading

```typescript
// Lazy load chart components
const XPEvolutionChart = lazy(() => import('./charts/XPEvolutionChart'));
const ActivitiesBarChart = lazy(() => import('./charts/ActivitiesBarChart'));
```

## Styling Architecture

### CSS Structure

```
src/styles/
└── projection-matrix-block.css
    ├── Base styles
    ├── Layout (grid, flexbox)
    ├── Components (cards, buttons)
    ├── Charts (canvas containers)
    ├── Effects (glow, borders, animations)
    └── Responsive (media queries)
```

### Key CSS Classes

```css
/* Main container */
.projection-matrix-card { }

/* Visual effects */
.pm-background-glow { }
.pm-border-top { }
.pm-border-bottom { }
.pm-neural-status { }

/* Layout sections */
.pm-main-layout { }
.pm-top-row { }
.pm-second-row { }
.pm-third-row { }

/* Components */
.pm-stat-card { }
.pm-simulator { }
.pm-ai-control { }
.pm-xp-chart { }
.pm-activity-chart { }
```

### Animation Keyframes

```css
@keyframes borderGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

## Accessibility

### ARIA Labels

```jsx
<button
  onClick={toggleDaily}
  aria-label={`Quêtes journalières: ${dailyQuestsDone} sur 5`}
  aria-pressed={dailyQuestsDone > 0}
>
  {dailyQuestsDone}/5
</button>
```

### Keyboard Navigation

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    incrementDaily();
  } else if (e.key === 'ArrowDown') {
    decrementDaily();
  }
};
```

### Color Contrast

- Ensure all text has minimum 4.5:1 contrast ratio
- Use WCAG AA compliant color combinations
- Provide alternative visual indicators beyond color

## Future Enhancements

1. **Data Persistence**: Save user preferences and simulation states
2. **Export Functionality**: Export charts as images or PDF
3. **Comparison Mode**: Compare current projections with past periods
4. **Goal Setting**: Allow users to set custom goals and track progress
5. **Notifications**: Alert users when they're off track from projections
6. **Social Features**: Share achievements and projections
7. **Advanced Analytics**: ML-based predictions and anomaly detection
