# Guide d'Intégration des Données Réelles - Sidebar Premium

## Date: 8 Décembre 2025

## Vue d'ensemble

Ce guide détaille comment connecter chaque section de la Sidebar Premium aux sources de données réelles de l'application QuietQuest. Il identifie les modules disponibles, les données manquantes, et propose une stratégie d'implémentation progressive.

## Table des Matières

1. [Architecture des Données](#architecture-des-données)
2. [Sections Implémentables Immédiatement](#sections-implémentables-immédiatement)
3. [Sections Nécessitant des Développements](#sections-nécessitant-des-développements)
4. [Plan d'Implémentation](#plan-dimplémentation)
5. [Exemples de Code](#exemples-de-code)

---

## Architecture des Données

### Contexts Disponibles

```javascript
// 1. WorkoutContext - Données d'entraînement
import { useWorkout } from '../context/WorkoutContext';
// Fournit: data, activeProgram, currentDate, checkedExercises, reps, etc.

// 2. AuthContext - Authentification
import { useAuth } from '../context/AuthContext';
// Fournit: currentUser, isAuthenticated, login, logout

// 3. LanguageContext - Internationalisation
import { useLanguage } from '../context/LanguageContext';
// Fournit: language, setLanguage, t (traduction)
```

### Hooks de Données Principaux

```javascript
// Sport & Entraînement
import { useWorkoutData } from '../hooks/useWorkoutData';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { useGarminData } from '../hooks/useGarminData';

// Quêtes & Gamification
import { useQuietQuestEngine } from '../hooks/useQuietQuestEngine';

// Nutrition
import { useNutritionData } from '../hooks/useNutritionData';

// Livres
import { useBooksData } from '../hooks/useBooksData';

// Finance
import { usePlanificateur } from '../hooks/usePlanificateur';
import { useSynthese } from '../hooks/useSynthese';
import { useSmartShopping } from '../hooks/useSmartShopping';
```

---

## Sections Implémentables Immédiatement

### ✅ 1. Métriques Vitales

**Source de données:** `useQuietQuestEngine` + `useWorkoutStats`

**Données disponibles:**
- XP Total: `userData.currentXP`
- Niveau: `userData.level`
- Streak: Calculé depuis `dailyPerformances`
- Focus: Calculé depuis taux de complétion des quêtes

**Implémentation:**
```javascript
const { userData, dailyPerformances } = useQuietQuestEngine();
const { getWorkoutHistory } = useWorkout();

// XP Total
const totalXP = userData.currentXP || 0;

// Niveau
const level = userData.level || 1;

// Streak (jours consécutifs)
const calculateStreak = () => {
  const sorted = dailyPerformances
    .filter(d => d.successRate >= 80)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = today;
  
  for (const perf of sorted) {
    if (perf.date === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
};

// Focus (pourcentage moyen de complétion)
const calculateFocus = () => {
  const recent = dailyPerformances.slice(-7);
  if (recent.length === 0) return 0;
  const avg = recent.reduce((sum, d) => sum + d.successRate, 0) / recent.length;
  return Math.round(avg);
};
```



### ✅ 2. Quêtes Actives

**Source de données:** `useQuietQuestEngine`

**Données disponibles:**
- Liste des quêtes du jour
- État de complétion
- Progression en pourcentage
- XP par quête

**Implémentation:**
```javascript
const { 
  getQuestsForDate, 
  isQuestCompletedOnDate,
  toggleQuestValidation 
} = useQuietQuestEngine();

const today = new Date().toISOString().slice(0, 10);
const todayQuests = getQuestsForDate(today);

const questsData = todayQuests.map(quest => ({
  id: quest.id,
  title: quest.nom,
  icon: quest.icone || '🎯',
  completed: isQuestCompletedOnDate(quest.id, today),
  xp: quest.xp || 0,
  difficulty: quest.difficulte || 1,
  duration: quest.duree || 60,
  // Progression: 0% ou 100% (binaire pour l'instant)
  progress: isQuestCompletedOnDate(quest.id, today) ? 100 : 0
}));
```

### ✅ 3. Sport & Santé

**Source de données:** `useWorkoutStats` + `useGarminData`

**Données disponibles:**
- Entraînements cette semaine
- Calories brûlées (Garmin)
- Pas aujourd'hui (Garmin)
- Fréquence cardiaque (Garmin)

**Implémentation:**
```javascript
const { getWorkoutHistory } = useWorkout();
const { loadDataForTab, dbReady } = useGarminData();

// Entraînements cette semaine
const getWeeklyWorkouts = () => {
  const history = getWorkoutHistory();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  
  return history.filter(w => w.date >= weekAgoStr).length;
};

// Données Garmin (si disponibles)
const [garminData, setGarminData] = useState(null);

useEffect(() => {
  if (dbReady) {
    loadDataForTab('metrics', null, 'week')
      .then(data => setGarminData(data))
      .catch(err => console.error('Erreur Garmin:', err));
  }
}, [dbReady]);

// Calories brûlées aujourd'hui
const todayCalories = garminData?.dailyMetrics?.[today]?.totalCaloriesBurned || 0;

// Pas aujourd'hui
const todaySteps = garminData?.dailyMetrics?.[today]?.steps || 0;

// Fréquence cardiaque moyenne
const avgHeartRate = garminData?.dailyMetrics?.[today]?.restingHeartRate || 72;
```

### ✅ 4. Apprentissage

**Source de données:** `useBooksData` (si disponible) ou localStorage

**Données disponibles:**
- Livres en cours
- Pages lues aujourd'hui
- Temps de lecture
- Objectif quotidien

**Implémentation:**
```javascript
// Vérifier si le module Books existe
const getBooksData = () => {
  try {
    const booksData = localStorage.getItem('booksData');
    if (booksData) {
      const parsed = JSON.parse(booksData);
      return {
        currentBooks: parsed.currentBooks || [],
        todayPages: parsed.todayPages || 0,
        todayMinutes: parsed.todayMinutes || 0,
        dailyGoal: parsed.dailyGoal || 30
      };
    }
  } catch (error) {
    console.error('Erreur lecture books:', error);
  }
  return {
    currentBooks: [],
    todayPages: 0,
    todayMinutes: 0,
    dailyGoal: 30
  };
};
```

### ✅ 5. Finances

**Source de données:** `useSynthese` + `usePlanificateur`

**Données disponibles:**
- Patrimoine net
- Budget mensuel
- Épargne
- Investissements

**Implémentation:**
```javascript
const { patrimoine, loading: syntheseLoading } = useSynthese();
const { salaire, repartition, loading: planifLoading } = usePlanificateur();

// Patrimoine net total
const netWorth = patrimoine?.total || 0;

// Budget mensuel disponible
const monthlyBudget = salaire?.montantNet || 0;

// Épargne mensuelle
const monthlySavings = repartition?.epargne?.montant || 0;

// Investissements totaux
const totalInvestments = patrimoine?.investissements?.reduce(
  (sum, inv) => sum + (inv.valeurActuelle || 0), 
  0
) || 0;
```



### ✅ 6. Nutrition (Journal & Repas)

**Source de données:** `useNutritionData`

**Données disponibles:**
- Calories consommées
- Macros (protéines, glucides, lipides)
- Repas du jour
- Conformité au programme

**Implémentation:**
```javascript
const { getDailyMeal, dbReady } = useNutritionData();
const [nutritionData, setNutritionData] = useState(null);

useEffect(() => {
  if (dbReady) {
    const today = new Date().toISOString().slice(0, 10);
    getDailyMeal(today, { recalculateTotals: false })
      .then(data => setNutritionData(data))
      .catch(err => console.error('Erreur nutrition:', err));
  }
}, [dbReady]);

// Calories consommées
const caloriesConsumed = nutritionData?.dailyTotals?.calories || 0;

// Protéines
const proteins = nutritionData?.dailyTotals?.proteines || 0;

// Glucides
const carbs = nutritionData?.dailyTotals?.glucides || 0;

// Lipides
const fats = nutritionData?.dailyTotals?.lipides || 0;

// Conformité (%)
const compliance = nutritionData?.dailyTotals?.complianceCalories 
  ? Math.round((nutritionData.dailyTotals.calories / nutritionData.dailyTotals.targetCalories) * 100)
  : 0;
```

---

## Sections Nécessitant des Développements

### ⚠️ 7. Focus RPG

**Statut:** Module non implémenté

**Données nécessaires:**
- Personnage RPG (avatar, classe, équipement)
- Barres XP et Énergie
- Compétences débloquées
- Quêtes RPG spécifiques

**Solution temporaire:**
```javascript
// Utiliser les données QuietQuest comme base
const rpgData = {
  character: {
    name: currentUser?.username || 'Aventurier',
    level: userData.level || 1,
    class: 'Développeur' // Fixe pour l'instant
  },
  xp: {
    current: userData.currentXP || 0,
    max: userData.xpForNextLevel || 2500,
    percentage: Math.round((userData.currentXP / userData.xpForNextLevel) * 100)
  },
  energy: {
    current: calculateFocus(), // Réutiliser le calcul de focus
    max: 100,
    percentage: calculateFocus()
  }
};
```

### ⚠️ 8. Films & Séries

**Statut:** Module non implémenté

**Données nécessaires:**
- Liste des films vus
- Films en cours
- Séries suivies
- Temps de visionnage

**Solution temporaire:**
```javascript
// Placeholder avec localStorage
const getMoviesData = () => {
  try {
    const moviesData = localStorage.getItem('moviesData');
    if (moviesData) {
      return JSON.parse(moviesData);
    }
  } catch (error) {
    console.error('Erreur movies:', error);
  }
  return {
    watched: [],
    inProgress: [],
    series: [],
    totalHours: 0
  };
};
```

### ⚠️ 9. Météo

**Statut:** API externe nécessaire

**Données nécessaires:**
- Température actuelle
- Conditions météo
- Prévisions 5 jours
- Localisation

**Solution:**
```javascript
// Utiliser OpenWeatherMap API (gratuit)
const [weather, setWeather] = useState(null);

useEffect(() => {
  const fetchWeather = async () => {
    try {
      // Récupérer localisation depuis localStorage ou navigateur
      const location = localStorage.getItem('userLocation') || 'Paris';
      const apiKey = process.env.VITE_OPENWEATHER_API_KEY;
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=fr`
      );
      const data = await response.json();
      
      setWeather({
        temp: Math.round(data.main.temp),
        condition: data.weather[0].description,
        icon: data.weather[0].icon,
        location: data.name
      });
    } catch (error) {
      console.error('Erreur météo:', error);
      // Fallback
      setWeather({
        temp: 20,
        condition: 'Données indisponibles',
        icon: '01d',
        location: 'Paris'
      });
    }
  };
  
  fetchWeather();
  // Rafraîchir toutes les 30 minutes
  const interval = setInterval(fetchWeather, 30 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### ⚠️ 10. Notifications

**Statut:** Système de notifications à implémenter

**Données nécessaires:**
- Notifications non lues
- Types (info, warning, success, error)
- Timestamps
- Actions associées

**Solution:**
```javascript
// Service de notifications simple
const notificationsService = {
  notifications: [],
  
  add(notification) {
    this.notifications.unshift({
      id: Date.now(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    });
    // Limiter à 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    // Sauvegarder
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  },
  
  getUnread() {
    return this.notifications.filter(n => !n.read);
  },
  
  markAsRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
  },
  
  load() {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  }
};

// Charger au démarrage
notificationsService.load();
```



---

## Plan d'Implémentation

### Phase 1: Données Essentielles (Priorité Haute) ✅

**Objectif:** Connecter les sections avec données déjà disponibles

**Sections:**
1. ✅ Métriques Vitales (XP, Niveau, Streak, Focus)
2. ✅ Quêtes Actives
3. ✅ Sport & Santé
4. ✅ Finances

**Durée estimée:** 2-3 heures

**Fichiers à modifier:**
- `src/components/sidebar/SidebarPremium.jsx`
- Créer: `src/hooks/useSidebarData.js` (hook centralisé)

### Phase 2: Données Secondaires (Priorité Moyenne) ⚠️

**Objectif:** Connecter les sections avec données partiellement disponibles

**Sections:**
1. ⚠️ Apprentissage (Books)
2. ⚠️ Nutrition (Journal)
3. ⚠️ Historique (Workout History)

**Durée estimée:** 2-3 heures

**Fichiers à modifier:**
- `src/hooks/useSidebarData.js`
- Ajouter fallbacks pour données manquantes

### Phase 3: Données Externes (Priorité Basse) 🔄

**Objectif:** Implémenter les fonctionnalités nécessitant APIs externes

**Sections:**
1. 🔄 Météo (OpenWeatherMap API)
2. 🔄 Notifications (Service custom)
3. 🔄 Motivation (Citations aléatoires)

**Durée estimée:** 3-4 heures

**Fichiers à créer:**
- `src/services/weather/weatherService.js`
- `src/services/notifications/notificationsService.js`
- `src/services/motivation/motivationService.js`

### Phase 4: Modules Futurs (À Développer) 🚧

**Objectif:** Planifier les modules non encore implémentés

**Sections:**
1. 🚧 Focus RPG (Système de gamification avancé)
2. 🚧 Films & Séries (Tracking média)
3. 🚧 Récompenses (Système de points)
4. 🚧 Prédictions IA (Machine Learning)

**Durée estimée:** À définir selon priorités

**Note:** Ces sections afficheront des placeholders en attendant

---

## Exemples de Code

### Hook Centralisé: `useSidebarData.js`

```javascript
/**
 * Hook centralisé pour toutes les données de la Sidebar Premium
 * Agrège les données de tous les modules de l'application
 */
import { useState, useEffect, useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useQuietQuestEngine } from './useQuietQuestEngine';
import { useGarminData } from './useGarminData';
import { useNutritionData } from './useNutritionData';
import { useSynthese } from './useSynthese';
import { usePlanificateur } from './usePlanificateur';

export const useSidebarData = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { getWorkoutHistory, data: workoutData } = useWorkout();
  const { 
    userData, 
    dailyPerformances, 
    getQuestsForDate,
    isQuestCompletedOnDate 
  } = useQuietQuestEngine();
  const { loadDataForTab, dbReady: garminReady } = useGarminData();
  const { getDailyMeal, dbReady: nutritionReady } = useNutritionData();
  const { patrimoine } = useSynthese();
  const { salaire, repartition } = usePlanificateur();

  const [garminData, setGarminData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Charger données Garmin
  useEffect(() => {
    if (garminReady && isAuthenticated) {
      loadDataForTab('metrics', null, 'week')
        .then(data => setGarminData(data))
        .catch(err => console.error('[SidebarData] Erreur Garmin:', err));
    }
  }, [garminReady, isAuthenticated, loadDataForTab]);

  // Charger données Nutrition
  useEffect(() => {
    if (nutritionReady && isAuthenticated) {
      getDailyMeal(today, { recalculateTotals: false })
        .then(data => setNutritionData(data))
        .catch(err => console.error('[SidebarData] Erreur Nutrition:', err));
    }
  }, [nutritionReady, isAuthenticated, getDailyMeal, today]);

  // Calculer Streak
  const streak = useMemo(() => {
    const sorted = dailyPerformances
      .filter(d => d.successRate >= 80)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    let count = 0;
    let checkDate = today;
    
    for (const perf of sorted) {
      if (perf.date === checkDate) {
        count++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
      } else {
        break;
      }
    }
    return count;
  }, [dailyPerformances, today]);

  // Calculer Focus
  const focus = useMemo(() => {
    const recent = dailyPerformances.slice(-7);
    if (recent.length === 0) return 0;
    const avg = recent.reduce((sum, d) => sum + d.successRate, 0) / recent.length;
    return Math.round(avg);
  }, [dailyPerformances]);

  // Métriques Vitales
  const metrics = useMemo(() => ({
    xp: userData.currentXP || 0,
    level: userData.level || 1,
    streak,
    focus
  }), [userData, streak, focus]);

  // Quêtes du jour
  const quests = useMemo(() => {
    const todayQuests = getQuestsForDate(today);
    return todayQuests.map(quest => ({
      id: quest.id,
      title: quest.nom,
      icon: quest.icone || '🎯',
      completed: isQuestCompletedOnDate(quest.id, today),
      progress: isQuestCompletedOnDate(quest.id, today) ? 100 : 0,
      xp: quest.xp || 0
    }));
  }, [getQuestsForDate, isQuestCompletedOnDate, today]);

  // Sport & Santé
  const sport = useMemo(() => {
    const history = getWorkoutHistory();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    
    return {
      weeklyWorkouts: history.filter(w => w.date >= weekAgoStr).length,
      todayCalories: garminData?.dailyMetrics?.[today]?.totalCaloriesBurned || 0,
      todaySteps: garminData?.dailyMetrics?.[today]?.steps || 0,
      avgHeartRate: garminData?.dailyMetrics?.[today]?.restingHeartRate || 72
    };
  }, [getWorkoutHistory, garminData, today]);

  // Finances
  const finance = useMemo(() => ({
    netWorth: patrimoine?.total || 0,
    monthlyBudget: salaire?.montantNet || 0,
    monthlySavings: repartition?.epargne?.montant || 0,
    investments: patrimoine?.investissements?.reduce(
      (sum, inv) => sum + (inv.valeurActuelle || 0), 
      0
    ) || 0
  }), [patrimoine, salaire, repartition]);

  // Nutrition
  const nutrition = useMemo(() => ({
    calories: nutritionData?.dailyTotals?.calories || 0,
    proteins: nutritionData?.dailyTotals?.proteines || 0,
    carbs: nutritionData?.dailyTotals?.glucides || 0,
    fats: nutritionData?.dailyTotals?.lipides || 0,
    compliance: nutritionData?.dailyTotals?.targetCalories 
      ? Math.round((nutritionData.dailyTotals.calories / nutritionData.dailyTotals.targetCalories) * 100)
      : 0
  }), [nutritionData]);

  return {
    metrics,
    quests,
    sport,
    finance,
    nutrition,
    isLoading: !garminReady || !nutritionReady,
    isAuthenticated
  };
};
```



### Intégration dans SidebarPremium.jsx

```javascript
import { useSidebarData } from '../../hooks/useSidebarData';

const SidebarPremium = memo(() => {
  const {
    currentTime,
    expandedSections,
    systemStatus,
    isMobileOpen,
    toggleSection,
    // ... autres fonctions sidebar
  } = useSidebar();

  // ✅ NOUVEAU: Hook de données centralisé
  const {
    metrics,
    quests,
    sport,
    finance,
    nutrition,
    isLoading,
    isAuthenticated
  } = useSidebarData();

  // Afficher loading si données pas prêtes
  if (isLoading) {
    return (
      <aside className="sidebar-premium">
        <div className="sidebar-loading">
          Chargement des données...
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile toggle et overlay */}
      <button className="sidebar-mobile-toggle" onClick={toggleMobileSidebar}>
        {isMobileOpen ? '✕' : '☰'}
      </button>
      <div className="sidebar-mobile-overlay" onClick={closeMobileSidebar} />

      <aside className="sidebar-premium">
        {/* Zone Fixe - Horloge */}
        <div className="sidebar-clock-section">
          <div className="sidebar-time-display">{getFormattedTime()}</div>
          <div className="sidebar-date-display">{getFormattedDate('fr')}</div>
          <ProfileCard3D />
          <SystemStatus status={systemStatus} />
        </div>

        {/* Zone Scrollable */}
        <div className="sidebar-content">
          {/* Section Métriques Vitales - DONNÉES RÉELLES */}
          <section className="sidebar-section">
            <header className="sidebar-section-header" onClick={() => toggleSection('metrics')}>
              <h2 className="sidebar-section-title">
                <span className="sidebar-section-icon">📊</span>
                Métriques Vitales
              </h2>
              <span className="sidebar-section-toggle">
                {isSectionExpanded('metrics') ? '▲' : '▼'}
              </span>
            </header>
            
            {isSectionExpanded('metrics') && (
              <div className="sidebar-section-content">
                <div className="sidebar-metrics-grid">
                  {/* XP - Données réelles */}
                  <div className="sidebar-metric-card xp">
                    <span className="sidebar-metric-icon">⭐</span>
                    <div className="sidebar-metric-value">
                      {metrics.xp.toLocaleString()}
                    </div>
                    <div className="sidebar-metric-label">XP Total</div>
                  </div>
                  
                  {/* Niveau - Données réelles */}
                  <div className="sidebar-metric-card level">
                    <span className="sidebar-metric-icon">🎖️</span>
                    <div className="sidebar-metric-value">{metrics.level}</div>
                    <div className="sidebar-metric-label">Niveau</div>
                  </div>
                  
                  {/* Streak - Données réelles */}
                  <div className="sidebar-metric-card streak">
                    <span className="sidebar-metric-icon">🔥</span>
                    <div className="sidebar-metric-value">{metrics.streak}</div>
                    <div className="sidebar-metric-label">Jours</div>
                  </div>
                  
                  {/* Focus - Données réelles */}
                  <div className="sidebar-metric-card focus">
                    <span className="sidebar-metric-icon">⚡</span>
                    <div className="sidebar-metric-value">{metrics.focus}%</div>
                    <div className="sidebar-metric-label">Focus</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section Quêtes Actives - DONNÉES RÉELLES */}
          <section className="sidebar-section">
            <header className="sidebar-section-header" onClick={() => toggleSection('quests')}>
              <h2 className="sidebar-section-title">
                <span className="sidebar-section-icon">🎯</span>
                Quêtes Actives
                {quests.length > 0 && (
                  <span className="sidebar-section-badge">{quests.length}</span>
                )}
              </h2>
              <span className="sidebar-section-toggle">
                {isSectionExpanded('quests') ? '▲' : '▼'}
              </span>
            </header>
            
            {isSectionExpanded('quests') && (
              <div className="sidebar-section-content">
                {quests.length === 0 ? (
                  <div className="sidebar-info-box">
                    <div className="sidebar-info-content">
                      <span className="sidebar-info-icon">✨</span>
                      <span>Aucune quête active aujourd'hui</span>
                    </div>
                  </div>
                ) : (
                  quests.map(quest => (
                    <div key={quest.id} className="sidebar-quest-item">
                      <div className="sidebar-quest-header">
                        <span className="sidebar-quest-icon">{quest.icon}</span>
                        <div className="sidebar-quest-title">{quest.title}</div>
                        <div className="sidebar-quest-percentage">{quest.progress}%</div>
                      </div>
                      <div className="sidebar-quest-progress">
                        <div 
                          className="sidebar-quest-progress-bar" 
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Section Sport & Santé - DONNÉES RÉELLES */}
          <SportSection 
            isExpanded={isSectionExpanded('sport')}
            onToggle={() => toggleSection('sport')}
            data={sport}
          />

          {/* Section Finances - DONNÉES RÉELLES */}
          <FinanceSection 
            isExpanded={isSectionExpanded('finance')}
            onToggle={() => toggleSection('finance')}
            data={finance}
          />

          {/* Section Nutrition - DONNÉES RÉELLES */}
          <NutritionSection 
            isExpanded={isSectionExpanded('nutrition')}
            onToggle={() => toggleSection('nutrition')}
            data={nutrition}
          />

          {/* Autres sections... */}
        </div>
      </aside>
    </>
  );
});
```

### Composant SportSection avec Données Réelles

```javascript
const SportSection = memo(({ isExpanded, onToggle, data }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">💪</span>
          Sport & Santé
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </header>
      
      {isExpanded && (
        <div className="sidebar-section-content">
          <div className="sidebar-data-grid">
            {/* Entraînements - Données réelles */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">🏋️</span>
              <div className="sidebar-data-value">{data.weeklyWorkouts}</div>
              <div className="sidebar-data-label">Entraînements</div>
            </div>
            
            {/* Calories - Données réelles Garmin */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">🔥</span>
              <div className="sidebar-data-value">
                {data.todayCalories.toLocaleString()}
              </div>
              <div className="sidebar-data-label">Calories</div>
            </div>
            
            {/* Pas - Données réelles Garmin */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">👟</span>
              <div className="sidebar-data-value">
                {data.todaySteps.toLocaleString()}
              </div>
              <div className="sidebar-data-label">Pas</div>
            </div>
            
            {/* Fréquence cardiaque - Données réelles Garmin */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">❤️</span>
              <div className="sidebar-data-value">{data.avgHeartRate}</div>
              <div className="sidebar-data-label">BPM</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
```

---

## Gestion des Données Manquantes

### Stratégie de Fallback

```javascript
// Fonction utilitaire pour gérer les données manquantes
const withFallback = (value, fallback, formatter = (v) => v) => {
  if (value === null || value === undefined || value === 0) {
    return fallback;
  }
  return formatter(value);
};

// Exemples d'utilisation
const displayXP = withFallback(
  metrics.xp, 
  '0', 
  (v) => v.toLocaleString()
);

const displayCalories = withFallback(
  sport.todayCalories,
  'N/A',
  (v) => v.toLocaleString()
);

const displayNetWorth = withFallback(
  finance.netWorth,
  'Non configuré',
  (v) => `${(v / 1000).toFixed(1)}k €`
);
```

### Indicateurs de Statut

```javascript
// Afficher un indicateur si données non disponibles
const DataStatusIndicator = ({ isAvailable, moduleName }) => {
  if (isAvailable) return null;
  
  return (
    <div className="sidebar-info-box warning">
      <div className="sidebar-info-content">
        <span className="sidebar-info-icon">⚠️</span>
        <span>Module {moduleName} non configuré</span>
      </div>
    </div>
  );
};

// Utilisation
<DataStatusIndicator 
  isAvailable={garminData !== null} 
  moduleName="Garmin" 
/>
```

---

## Checklist d'Implémentation

### Phase 1: Préparation ✅
- [x] Analyser les sources de données disponibles
- [x] Identifier les modules manquants
- [x] Créer le guide d'intégration
- [ ] Créer le hook `useSidebarData.js`

### Phase 2: Implémentation Core 🔄
- [ ] Connecter Métriques Vitales
- [ ] Connecter Quêtes Actives
- [ ] Connecter Sport & Santé
- [ ] Connecter Finances
- [ ] Ajouter gestion des erreurs
- [ ] Ajouter fallbacks pour données manquantes

### Phase 3: Implémentation Secondaire ⏳
- [ ] Connecter Nutrition
- [ ] Connecter Apprentissage (Books)
- [ ] Connecter Historique
- [ ] Implémenter service Météo
- [ ] Implémenter service Notifications

### Phase 4: Optimisation 🎯
- [ ] Ajouter cache pour réduire re-renders
- [ ] Optimiser chargement des données
- [ ] Ajouter loading states
- [ ] Tester performances
- [ ] Documenter l'API

---

## Notes Importantes

### Performance

1. **Memoization:** Utiliser `useMemo` pour les calculs coûteux
2. **Debouncing:** Éviter les mises à jour trop fréquentes
3. **Lazy Loading:** Charger les données seulement quand la section est ouverte
4. **Cache:** Réutiliser les données déjà chargées

### Sécurité

1. **Authentification:** Vérifier `isAuthenticated` avant de charger les données
2. **Permissions:** Respecter les permissions utilisateur (admin vs user)
3. **Données sensibles:** Ne pas afficher de données financières si non autorisé

### Maintenance

1. **Documentation:** Documenter chaque source de données
2. **Tests:** Ajouter des tests pour les calculs critiques
3. **Logs:** Logger les erreurs de chargement
4. **Monitoring:** Surveiller les performances

---

## Conclusion

Ce guide fournit une feuille de route complète pour l'intégration des données réelles dans la Sidebar Premium. L'approche progressive permet de:

1. ✅ **Démarrer rapidement** avec les données déjà disponibles
2. ⚠️ **Gérer les manques** avec des fallbacks élégants
3. 🔄 **Planifier l'avenir** avec une architecture extensible
4. 🎯 **Maintenir la qualité** avec des bonnes pratiques

**Prochaine étape:** Créer le hook `useSidebarData.js` et commencer l'implémentation Phase 1.

