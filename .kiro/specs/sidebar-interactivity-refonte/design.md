# Design Document - Sidebar Interactive & Cohérente

## 🎯 Vue d'Ensemble

Ce document décrit l'architecture technique pour transformer la sidebar QuietQuest de 20 modules (dont 14 inutiles) en 8 modules cohérents et 100% interactifs.

## 📐 Architecture Globale

### Composants Principaux

```
SidebarPremium (Composant principal)
├── Zone Fixe (non-scrollable)
│   ├── Horloge + Date
│   ├── ProfileCard3D
│   └── Statuts Système
│
└── Zone Scrollable
    ├── ActionsRapidesSection (nouveau)
    ├── AujourdhuiSection (nouveau)
    ├── ProgressionGlobaleSection (renommé)
    ├── QuestesJourSection (renommé)
    ├── ActivitePhysiqueSection (renommé)
    ├── LectureSection (renommé)
    ├── NutritionSection (nouveau)
    └── FinancesSection (amélioré)
```

### Hooks Principaux

```
useSidebarData (existant - à étendre)
├── useQuietQuestEngine() → XP, Niveau, Streak, Focus, Quêtes
├── useWorkout() → Entraînements
├── useGarminData() → Calories, Pas, BPM
├── useNutritionData() → Calories, Macros (à ajouter)
├── useSynthese() → Patrimoine, Investissements
├── usePlanificateur() → Budget, Épargne
└── localStorage → Livres

useNavigation (existant - à étendre)
├── Méthodes existantes
└── Nouvelles méthodes avec paramètres
```

## 🔧 Modifications Techniques

### 1. Extension de useNavigation

**Fichier:** `src/hooks/useNavigation.js`

**Ajouts nécessaires:**

```javascript
// Navigation avec paramètres contextuels
const navigation = {
  // Sport & Activité
  toSport: (params = {}) => {
    // params: { tab, filter, date, scrollTo }
    navigateWithParams('/sport', params);
  },
  
  // Garmin avec contexte
  toGarmin: (params = {}) => {
    // params: { tab, section, date }
    navigateWithParams('/garmin', params);
  },
  
  // Quêtes avec détail
  toQuests: (params = {}) => {
    // params: { section, questId, scrollTo, filter }
    navigateWithParams('/quests', params);
  },
  
  // Livres avec filtre
  toBooks: (params = {}) => {
    // params: { filter, tab, date, action }
    navigateWithParams('/books', params);
  },
  
  // Finance avec section
  toFinance: (params = {}) => {
    // params: { tab, section }
    navigateWithParams('/finance', params);
  },
  
  // Nutrition (nouveau)
  toNutrition: (params = {}) => {
    // params: { date, section }
    navigateWithParams('/nutrition', params);
  }
};

// Fonction helper pour navigation avec paramètres
const navigateWithParams = (path, params) => {
  // Construire l'URL avec query params
  const queryString = new URLSearchParams(params).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  
  // Naviguer
  navigate(fullPath);
  
  // Si scrollTo, attendre le render puis scroller
  if (params.scrollTo && params.questId) {
    setTimeout(() => {
      const element = document.getElementById(`quest-${params.questId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
};
```

### 2. Extension de useSidebarData

**Fichier:** `src/hooks/useSidebarData.js`

**Ajouts nécessaires:**

```javascript
// Ajouter données Nutrition
const { getDailyMeal, dbReady: nutritionReady } = useNutritionData();
const [nutritionData, setNutritionData] = useState(null);

// Charger données Nutrition
useEffect(() => {
  if (nutritionReady && isAuthenticated) {
    getDailyMeal(today, { recalculateTotals: false })
      .then(data => setNutritionData(data))
      .catch(err => {
        console.error('[useSidebarData] Erreur Nutrition:', err);
        setNutritionData(null);
      });
  }
}, [nutritionReady, isAuthenticated, getDailyMeal, today]);

// Calculer données Nutrition
const nutrition = useMemo(() => ({
  calories: nutritionData?.dailyTotals?.calories || 0,
  proteins: nutritionData?.dailyTotals?.proteines || 0,
  carbs: nutritionData?.dailyTotals?.glucides || 0,
  fats: nutritionData?.dailyTotals?.lipides || 0,
  water: nutritionData?.dailyTotals?.waterIntake || 0,
  compliance: nutritionData?.dailyTotals?.targetCalories 
    ? Math.round((nutritionData.dailyTotals.calories / nutritionData.dailyTotals.targetCalories) * 100)
    : 0,
  hasData: nutritionData !== null
}), [nutritionData]);

// Ajouter données "Aujourd'hui"
const today = useMemo(() => {
  const todayQuests = getQuestsForDate(today);
  const completedQuests = todayQuests.filter(q => isQuestCompletedOnDate(q.id, today));
  
  return {
    questsCompleted: completedQuests.length,
    questsTotal: todayQuests.length,
    workoutDone: sport.weeklyWorkouts > 0, // Simplification
    pagesRead: learning.todayPages,
    mealsLogged: nutritionData?.meals?.length || 0,
    mealsTarget: 3 // Configurable
  };
}, [getQuestsForDate, isQuestCompletedOnDate, sport, learning, nutritionData, today]);

// Retourner toutes les données
return {
  metrics,
  quests,
  sport,
  finance,
  nutrition, // Nouveau
  learning,
  today, // Nouveau
  isLoading,
  isAuthenticated,
  todayDate: today
};
```

### 3. Nouveaux Composants de Section

**Structure des composants:**

```javascript
// ActionsRapidesSection.jsx
const ActionsRapidesSection = memo(({ isExpanded, onToggle, navigation }) => {
  const handleFocusClick = () => {
    // Démarrer timer Pomodoro
    startPomodoroSession(25);
    navigation.toFocus();
  };
  
  const handleReadClick = () => {
    navigation.toBooks({ action: 'addPages' });
  };
  
  const handleSportClick = () => {
    navigation.toSport({ action: 'newWorkout' });
  };
  
  const handleQuestsClick = () => {
    navigation.toQuests({ filter: 'today' });
  };
  
  return (
    <section className="sidebar-section">
      {/* Grille 2x2 boutons principaux */}
      <div className="sidebar-actions-grid">
        <button onClick={handleFocusClick}>🎯 Focus 25min</button>
        <button onClick={handleReadClick}>📖 Lire +Pages</button>
        <button onClick={handleSportClick}>💪 Sport</button>
        <button onClick={handleQuestsClick}>✅ Quêtes</button>
      </div>
      
      {/* Ligne 1x4 boutons secondaires */}
      <div className="sidebar-actions-secondary">
        <button onClick={() => navigation.toFinance({ tab: 'planificateur', action: 'addRevenue' })}>
          💰 +Revenu
        </button>
        <button onClick={() => navigation.toFinance({ tab: 'planificateur', action: 'addExpense' })}>
          📊 +Dépense
        </button>
        <button onClick={() => navigation.toNutrition({ action: 'addMeal' })}>
          🍽️ +Repas
        </button>
        <button onClick={() => navigation.toSettings()}>
          ⚙️ Réglages
        </button>
      </div>
    </section>
  );
});

// AujourdhuiSection.jsx (nouveau)
const AujourdhuiSection = memo(({ isExpanded, onToggle, data, navigation }) => {
  return (
    <section className="sidebar-section">
      <header onClick={onToggle}>
        <h2>📅 Aujourd'hui</h2>
      </header>
      
      {isExpanded && (
        <div className="sidebar-data-grid">
          {/* Quêtes */}
          <div 
            className="sidebar-data-card clickable"
            onClick={() => navigation.toQuests({ filter: 'today' })}
            title="Voir les quêtes du jour"
          >
            <span>✅</span>
            <div>{data.questsCompleted}/{data.questsTotal}</div>
            <div>Quêtes</div>
          </div>
          
          {/* Sport */}
          <div 
            className="sidebar-data-card clickable"
            onClick={() => navigation.toSport({ tab: 'today' })}
            title="Voir l'activité du jour"
          >
            <span>💪</span>
            <div>{data.workoutDone ? 'Fait' : 'À faire'}</div>
            <div>Sport</div>
          </div>
          
          {/* Lecture */}
          <div 
            className="sidebar-data-card clickable"
            onClick={() => navigation.toBooks({ tab: 'stats', date: data.todayDate })}
            title="Voir les statistiques de lecture"
          >
            <span>📖</span>
            <div>{data.pagesRead} pages</div>
            <div>Lecture</div>
          </div>
          
          {/* Nutrition */}
          <div 
            className="sidebar-data-card clickable"
            onClick={() => navigation.toNutrition({ date: data.todayDate })}
            title="Voir les repas du jour"
          >
            <span>🍽️</span>
            <div>{data.mealsLogged}/{data.mealsTarget}</div>
            <div>Repas</div>
          </div>
        </div>
      )}
    </section>
  );
});

// NutritionSection.jsx (nouveau)
const NutritionSection = memo(({ isExpanded, onToggle, data, navigation, today }) => {
  const compliancePercentage = data.compliance;
  
  return (
    <section className="sidebar-section">
      <header onClick={onToggle}>
        <h2>🍽️ Nutrition</h2>
      </header>
      
      {isExpanded && (
        <div>
          <div className="sidebar-data-grid">
            {/* Calories */}
            <div 
              className="sidebar-data-card clickable"
              onClick={() => navigation.toNutrition({ date: today })}
              title="Voir le détail des repas"
            >
              <span>🔥</span>
              <div>{data.calories}</div>
              <div>Calories</div>
            </div>
            
            {/* Protéines */}
            <div 
              className="sidebar-data-card clickable"
              onClick={() => navigation.toNutrition({ date: today, section: 'macros' })}
              title="Voir la répartition des macros"
            >
              <span>🥩</span>
              <div>{data.proteins}g</div>
              <div>Protéines</div>
            </div>
            
            {/* Glucides */}
            <div 
              className="sidebar-data-card clickable"
              onClick={() => navigation.toNutrition({ date: today, section: 'macros' })}
              title="Voir la répartition des macros"
            >
              <span>🍞</span>
              <div>{data.carbs}g</div>
              <div>Glucides</div>
            </div>
            
            {/* Lipides */}
            <div 
              className="sidebar-data-card clickable"
              onClick={() => navigation.toNutrition({ date: today, section: 'macros' })}
              title="Voir la répartition des macros"
            >
              <span>🥑</span>
              <div>{data.fats}g</div>
              <div>Lipides</div>
            </div>
          </div>
          
          {/* Compliance */}
          {data.hasData && (
            <div 
              className="sidebar-info-box clickable"
              onClick={() => navigation.toNutrition({ tab: 'stats' })}
            >
              <div>Compliance: {compliancePercentage}%</div>
              <div className="sidebar-progress-mini">
                <div 
                  className="sidebar-progress-mini-bar" 
                  style={{ width: `${Math.min(compliancePercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});
```

## 🎨 Styles CSS

**Fichier:** `src/styles/sidebar-premium.css`

**Ajouts nécessaires:**

```css
/* Cartes cliquables */
.sidebar-data-card.clickable {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.sidebar-data-card.clickable:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 20px currentColor;
}

.sidebar-data-card.clickable:active {
  transform: translateY(-1px) scale(0.98);
}

/* Hint text qui apparaît au hover */
.sidebar-data-hint {
  font-size: 0.6rem;
  opacity: 0;
  transform: translateY(-5px);
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  text-align: center;
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
}

.sidebar-data-card.clickable:hover .sidebar-data-hint {
  opacity: 1;
  transform: translateY(0);
}

/* Flèche indicatrice */
.sidebar-data-card.clickable::after {
  content: '→';
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: currentColor;
}

.sidebar-data-card.clickable:hover::after {
  opacity: 0.6;
}

/* Info box cliquable */
.sidebar-info-box.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-info-box.clickable:hover {
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

/* Quête cliquable */
.sidebar-quest-item.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-quest-item.clickable:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.4),
    0 0 15px currentColor;
}

/* Badge complété */
.sidebar-quest-completed-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

/* Animation de transition */
@keyframes navigate-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.sidebar-data-card.navigating {
  animation: navigate-pulse 0.3s ease;
}
```

## 📊 Gestion d'État

### Context pour Actions Rapides

**Fichier:** `src/context/QuickActionsContext.jsx` (nouveau)

```javascript
import React, { createContext, useContext, useState, useCallback } from 'react';

const QuickActionsContext = createContext();

export const QuickActionsProvider = ({ children }) => {
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(0);
  
  const startPomodoroSession = useCallback((minutes) => {
    setPomodoroActive(true);
    setPomodoroTimeLeft(minutes * 60);
    
    // Démarrer le timer
    const interval = setInterval(() => {
      setPomodoroTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPomodoroActive(false);
          // Notification de fin
          showNotification('Session Pomodoro terminée !', 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const stopPomodoroSession = useCallback(() => {
    setPomodoroActive(false);
    setPomodoroTimeLeft(0);
  }, []);
  
  return (
    <QuickActionsContext.Provider value={{
      pomodoroActive,
      pomodoroTimeLeft,
      startPomodoroSession,
      stopPomodoroSession
    }}>
      {children}
    </QuickActionsContext.Provider>
  );
};

export const useQuickActions = () => {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error('useQuickActions must be used within QuickActionsProvider');
  }
  return context;
};
```

## 🔄 Synchronisation Temps Réel

### Event System

**Fichier:** `src/utils/sidebarEvents.js` (nouveau)

```javascript
// Event emitter pour synchronisation
class SidebarEventEmitter {
  constructor() {
    this.listeners = {};
  }
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Retourner fonction de cleanup
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const sidebarEvents = new SidebarEventEmitter();

// Events disponibles
export const SIDEBAR_EVENTS = {
  QUEST_COMPLETED: 'quest_completed',
  WORKOUT_ADDED: 'workout_added',
  PAGES_READ: 'pages_read',
  MEAL_LOGGED: 'meal_logged',
  EXPENSE_ADDED: 'expense_added',
  REVENUE_ADDED: 'revenue_added',
  DATA_UPDATED: 'data_updated'
};

// Hook pour écouter les events
export const useSidebarEvents = (event, callback) => {
  useEffect(() => {
    const unsubscribe = sidebarEvents.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
};
```

### Utilisation dans useSidebarData

```javascript
// Dans useSidebarData.js
import { useSidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';

export const useSidebarData = () => {
  // ... code existant ...
  
  // Écouter les events pour rafraîchir
  useSidebarEvents(SIDEBAR_EVENTS.QUEST_COMPLETED, () => {
    // Rafraîchir les quêtes
    refreshQuests();
  });
  
  useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_ADDED, () => {
    // Rafraîchir les données sport
    refreshSport();
  });
  
  useSidebarEvents(SIDEBAR_EVENTS.PAGES_READ, () => {
    // Rafraîchir les données livres
    refreshBooks();
  });
  
  useSidebarEvents(SIDEBAR_EVENTS.MEAL_LOGGED, () => {
    // Rafraîchir les données nutrition
    refreshNutrition();
  });
  
  // ... reste du code ...
};
```

## 🧪 Tests

### Tests de Navigation

**Fichier:** `src/components/sidebar/__tests__/SidebarNavigation.test.jsx` (nouveau)

```javascript
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SidebarPremium } from '../SidebarPremium';
import { useNavigation } from '../../../hooks/useNavigation';

jest.mock('../../../hooks/useNavigation');

describe('Sidebar Navigation', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    useNavigation.mockReturnValue({
      toSport: mockNavigate,
      toGarmin: mockNavigate,
      toQuests: mockNavigate,
      toBooks: mockNavigate,
      toFinance: mockNavigate,
      toNutrition: mockNavigate
    });
  });
  
  it('should navigate to sport history when clicking workouts', () => {
    const { getByText } = render(<SidebarPremium />);
    
    fireEvent.click(getByText('12 Entraînements'));
    
    expect(mockNavigate).toHaveBeenCalledWith({
      tab: 'history',
      filter: 'week'
    });
  });
  
  it('should navigate to garmin metrics when clicking steps', () => {
    const { getByText } = render(<SidebarPremium />);
    
    fireEvent.click(getByText('8,542 Pas'));
    
    expect(mockNavigate).toHaveBeenCalledWith({
      tab: 'metrics',
      section: 'steps',
      date: expect.any(String)
    });
  });
  
  it('should navigate to quest detail when clicking quest', () => {
    const { getByText } = render(<SidebarPremium />);
    
    fireEvent.click(getByText('Maîtriser JavaScript'));
    
    expect(mockNavigate).toHaveBeenCalledWith({
      questId: expect.any(String),
      scrollTo: true
    });
  });
});
```

### Tests de Cohérence des Données

**Fichier:** `src/components/sidebar/__tests__/SidebarDataConsistency.test.jsx` (nouveau)

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useSidebarData } from '../../../hooks/useSidebarData';
import { useWorkout } from '../../../context/WorkoutContext';

jest.mock('../../../context/WorkoutContext');

describe('Sidebar Data Consistency', () => {
  it('should display correct workout count', () => {
    const mockWorkouts = [
      { id: 1, date: '2025-12-09' },
      { id: 2, date: '2025-12-08' },
      { id: 3, date: '2025-12-07' }
    ];
    
    useWorkout.mockReturnValue({
      getWorkoutHistory: () => mockWorkouts
    });
    
    const { result } = renderHook(() => useSidebarData());
    
    expect(result.current.sport.weeklyWorkouts).toBe(3);
  });
  
  it('should calculate streak correctly', () => {
    const mockPerformances = [
      { date: '2025-12-09', successRate: 85 },
      { date: '2025-12-08', successRate: 90 },
      { date: '2025-12-07', successRate: 82 }
    ];
    
    // Mock useQuietQuestEngine
    const { result } = renderHook(() => useSidebarData());
    
    expect(result.current.metrics.streak).toBe(3);
  });
});
```

## 📱 Responsive Design

### Adaptations Mobile

**Breakpoints:**
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

**Comportements:**
- Desktop: Sidebar fixe à gauche
- Tablet: Sidebar overlay avec bouton toggle
- Mobile: Sidebar plein écran avec overlay

**CSS:**

```css
/* Mobile adaptations */
@media (max-width: 768px) {
  .sidebar-premium {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar-premium.mobile-open {
    transform: translateX(0);
  }
  
  .sidebar-data-grid {
    grid-template-columns: 1fr 1fr; /* 2 colonnes au lieu de 4 */
  }
  
  .sidebar-actions-grid {
    grid-template-columns: 1fr 1fr; /* Garder 2x2 */
  }
  
  .sidebar-actions-secondary {
    grid-template-columns: 1fr 1fr; /* 2x2 au lieu de 1x4 */
  }
}

/* Tablet adaptations */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar-premium {
    width: 280px; /* Légèrement plus étroit */
  }
  
  .sidebar-data-grid {
    grid-template-columns: 1fr 1fr; /* 2 colonnes */
  }
}
```

## 🔐 Accessibilité

### ARIA Labels

Tous les éléments cliquables doivent avoir:
- `role="button"` ou `role="link"`
- `aria-label` descriptif
- `tabIndex={0}` pour navigation clavier
- `onKeyDown` pour Enter/Space

**Exemple:**

```javascript
<div 
  className="sidebar-data-card clickable"
  onClick={() => navigation.toSport({ tab: 'history', filter: 'week' })}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigation.toSport({ tab: 'history', filter: 'week' });
    }
  }}
  role="button"
  tabIndex={0}
  aria-label="12 entraînements cette semaine. Cliquer pour voir l'historique"
  title="Voir l'historique des entraînements"
>
  <span className="sidebar-data-icon" aria-hidden="true">🏋️</span>
  <div className="sidebar-data-value">12</div>
  <div className="sidebar-data-label">Entraînements</div>
</div>
```

## 🚀 Performance

### Optimisations

1. **React.memo** sur tous les composants de section
2. **useMemo** pour calculs coûteux
3. **useCallback** pour fonctions stables
4. **Lazy loading** des sections non-visibles
5. **Throttling** des events de synchronisation

**Exemple de throttling:**

```javascript
// Throttle pour events de synchronisation
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return (...args) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime < delay) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastExecTime = currentTime;
        func(...args);
      }, delay);
    } else {
      lastExecTime = currentTime;
      func(...args);
    }
  };
};

// Utilisation
const throttledRefresh = useMemo(
  () => throttle(refreshData, 1000),
  [refreshData]
);

useSidebarEvents(SIDEBAR_EVENTS.DATA_UPDATED, throttledRefresh);
```

## 📋 Résumé des Fichiers à Modifier/Créer

### Fichiers à Modifier
1. `src/hooks/useNavigation.js` - Ajouter paramètres contextuels
2. `src/hooks/useSidebarData.js` - Ajouter nutrition et today
3. `src/components/sidebar/SidebarPremium.jsx` - Refactoriser sections
4. `src/styles/sidebar-premium.css` - Ajouter styles cliquables

### Fichiers à Créer
1. `src/components/sidebar/ActionsRapidesSection.jsx`
2. `src/components/sidebar/AujourdhuiSection.jsx`
3. `src/components/sidebar/ProgressionGlobaleSection.jsx`
4. `src/components/sidebar/QuestesJourSection.jsx`
5. `src/components/sidebar/ActivitePhysiqueSection.jsx`
6. `src/components/sidebar/LectureSection.jsx`
7. `src/components/sidebar/NutritionSection.jsx`
8. `src/components/sidebar/FinancesSection.jsx`
9. `src/context/QuickActionsContext.jsx`
10. `src/utils/sidebarEvents.js`
11. `src/components/sidebar/__tests__/SidebarNavigation.test.jsx`
12. `src/components/sidebar/__tests__/SidebarDataConsistency.test.jsx`

### Fichiers à Supprimer
1. Tous les composants de sections fantômes (14 fichiers)

## 🎯 Ordre d'Implémentation Recommandé

### Phase 1: Fondations (Priorité HAUTE)
1. Étendre useNavigation avec paramètres
2. Créer sidebarEvents.js
3. Créer QuickActionsContext
4. Ajouter styles CSS cliquables

### Phase 2: Sections Existantes (Priorité HAUTE)
1. Refactoriser ProgressionGlobaleSection (ex-Métriques)
2. Refactoriser QuestesJourSection (ex-Quêtes)
3. Refactoriser ActivitePhysiqueSection (ex-Sport)
4. Refactoriser LectureSection (ex-Livres)
5. Refactoriser FinancesSection

### Phase 3: Nouvelles Sections (Priorité MOYENNE)
1. Créer ActionsRapidesSection
2. Créer AujourdhuiSection
3. Créer NutritionSection

### Phase 4: Nettoyage (Priorité HAUTE)
1. Supprimer les 14 sections fantômes
2. Nettoyer useSidebarData
3. Nettoyer SidebarPremium.jsx

### Phase 5: Tests (Priorité MOYENNE)
1. Tests de navigation
2. Tests de cohérence
3. Tests d'accessibilité

### Phase 6: Polish (Priorité BASSE)
1. Animations
2. Tooltips
3. Responsive final
4. Documentation
