/**
 * Hook centralisé pour toutes les données de la Sidebar Premium
 * Agrège les données de tous les modules de l'application
 * 
 * @module hooks/useSidebarData
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useQuietQuestEngine } from './useQuietQuestEngine';
import { useGarminData } from './useGarminData';
import { useNutritionData } from './useNutritionData';
import { useSynthese } from './useSynthese';
import { usePlanificateur } from './usePlanificateur';
import { useBooksStorage } from './useBooksStorage';
import { useBooksStatistics } from './useBooksStatistics';
import { useSmartShopping } from './useSmartShopping';
import { useSidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';
import { useDebouncedCallback } from './useDebouncedCallback';
import { measureAsync, measureSync, SIDEBAR_OPERATIONS } from '../utils/performanceMonitor';
import garminEnhancedDataService from '../services/garmin/garminEnhancedDataService';

/**
 * Hook centralisé pour les données de la Sidebar Premium
 * 
 * @returns {Object} Données agrégées de tous les modules
 * @returns {Object} returns.metrics - Métriques vitales (XP, Niveau, Streak, Focus)
 * @returns {Array} returns.quests - Quêtes actives du jour
 * @returns {Object} returns.sport - Données sport et santé
 * @returns {Object} returns.finance - Données financières
 * @returns {Object} returns.nutrition - Données nutrition
 * @returns {Object} returns.learning - Données apprentissage (livres)
 * @returns {Object} returns.today - Agrégation des activités du jour (quêtes, sport, lecture, repas)
 * @returns {boolean} returns.isLoading - État de chargement
 * @returns {boolean} returns.isAuthenticated - État d'authentification
 * @returns {string} returns.todayDate - Date du jour au format ISO (YYYY-MM-DD)
 */
export const useSidebarData = () => {
  const { isAuthenticated } = useAuth();
  const { getWorkoutHistory } = useWorkout();
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
  const { books } = useBooksStorage();
  const { listes: shoppingLists, loading: shoppingLoading, error: shoppingError } = useSmartShopping();

  const [garminData, setGarminData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  
  // Triggers pour forcer le rafraîchissement des données
  const [refreshTriggers, setRefreshTriggers] = useState({
    quests: 0,
    workout: 0,
    books: 0,
    nutrition: 0,
    finance: 0,
    shopping: 0
  });

  // Date du jour - dynamique (mise à jour automatique après minuit)
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date().toISOString().slice(0, 10);
      setToday((prev) => (prev === current ? prev : current));
    }, 60 * 1000); // vérifie chaque minute

    return () => clearInterval(interval);
  }, []);

  // Charger données Garmin avec gestion d'erreur robuste et monitoring de performance
  useEffect(() => {
    if (!garminReady || !isAuthenticated) return;
    
    const loadGarminData = async () => {
      try {
        // Charger les données de base depuis l'API existante
        const baseData = await measureAsync(SIDEBAR_OPERATIONS.GARMIN_DATA_LOAD, async () => {
          return await loadDataForTab('metrics', null, 'week');
        });
        
        // Enrichir avec les données pour les graphiques
        const enhancedData = garminEnhancedDataService.getEnhancedData();
        
        // Fusionner les données de base avec les données enrichies
        const mergedData = {
          ...baseData,
          ...enhancedData,
          // Préserver les données de base si elles existent
          dailyMetrics: baseData?.dailyMetrics || {},
          sport: {
            ...enhancedData.sport,
            // Fusionner avec les données existantes si présentes
            ...(baseData?.sport || {})
          }
        };
        
        setGarminData(mergedData);
        
        console.log('[useSidebarData] Données Garmin enrichies chargées:', {
          hasHeartRateZones: !!mergedData.heartRateZones?.length,
          hasSleepPhases: !!mergedData.sleepPhases?.length,
          hasStressLevels: !!mergedData.stressLevels?.length,
          baseDataKeys: Object.keys(baseData || {}),
          enhancedDataKeys: Object.keys(enhancedData || {})
        });
        
      } catch (err) {
        console.error('[useSidebarData] Erreur chargement Garmin:', err);
        // En cas d'erreur, utiliser au moins les données enrichies
        try {
          const fallbackData = garminEnhancedDataService.getEnhancedData();
          setGarminData(fallbackData);
          console.log('[useSidebarData] Utilisation des données Garmin de fallback');
        } catch (fallbackErr) {
          console.error('[useSidebarData] Erreur fallback Garmin:', fallbackErr);
          setGarminData(null);
        }
      }
    };
    
    loadGarminData();
  }, [garminReady, isAuthenticated, loadDataForTab]);

  // Charger données Nutrition avec gestion d'erreur robuste et monitoring de performance
  useEffect(() => {
    if (!nutritionReady || !isAuthenticated) return;
    
    const loadNutritionData = async () => {
      try {
        const data = await measureAsync(SIDEBAR_OPERATIONS.NUTRITION_DATA_LOAD, async () => {
          return await getDailyMeal(today, { recalculateTotals: false });
        });
        setNutritionData(data);
      } catch (err) {
        console.error('[useSidebarData] Erreur chargement Nutrition:', err);
        // Retourner null pour indiquer l'absence de données
        setNutritionData(null);
      }
    };
    
    loadNutritionData();
  }, [nutritionReady, isAuthenticated, getDailyMeal, today, refreshTriggers.nutrition]);

  // Calculer les statistiques de lecture avec useBooksStatistics
  const booksStatistics = useBooksStatistics(books);

  // Fonctions de rafraîchissement de base (non débouncées)
  const refreshQuestsImmediate = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, quests: prev.quests + 1 }));
  }, []);

  const refreshWorkoutImmediate = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, workout: prev.workout + 1 }));
  }, []);

  const refreshBooksImmediate = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, books: prev.books + 1 }));
  }, []);

  const refreshNutritionImmediate = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, nutrition: prev.nutrition + 1 }));
  }, []);

  const refreshFinanceImmediate = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, finance: prev.finance + 1 }));
  }, []);

  const refreshShoppingImmediate = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, shopping: prev.shopping + 1 }));
  }, []);

  // Fonctions de rafraîchissement débouncées (500ms) pour éviter les rafraîchissements excessifs
  const { debouncedCallback: refreshQuests } = useDebouncedCallback(
    refreshQuestsImmediate,
    500,
    [refreshQuestsImmediate]
  );

  const { debouncedCallback: refreshWorkout } = useDebouncedCallback(
    refreshWorkoutImmediate,
    500,
    [refreshWorkoutImmediate]
  );

  const { debouncedCallback: refreshBooks } = useDebouncedCallback(
    refreshBooksImmediate,
    500,
    [refreshBooksImmediate]
  );

  const { debouncedCallback: refreshNutrition } = useDebouncedCallback(
    refreshNutritionImmediate,
    500,
    [refreshNutritionImmediate]
  );

  const { debouncedCallback: refreshFinance } = useDebouncedCallback(
    refreshFinanceImmediate,
    500,
    [refreshFinanceImmediate]
  );

  const { debouncedCallback: refreshShopping } = useDebouncedCallback(
    refreshShoppingImmediate,
    500,
    [refreshShoppingImmediate]
  );

  // Écouter les événements pour rafraîchir automatiquement
  useSidebarEvents(SIDEBAR_EVENTS.QUEST_COMPLETED, refreshQuests);
  useSidebarEvents(SIDEBAR_EVENTS.QUEST_UPDATED, refreshQuests);
  useSidebarEvents(SIDEBAR_EVENTS.QUEST_CREATED, refreshQuests);
  
  useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_ADDED, refreshWorkout);
  useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_UPDATED, refreshWorkout);
  useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_DELETED, refreshWorkout);
  
  useSidebarEvents(SIDEBAR_EVENTS.PAGES_READ, refreshBooks);
  useSidebarEvents(SIDEBAR_EVENTS.BOOK_ADDED, refreshBooks);
  useSidebarEvents(SIDEBAR_EVENTS.BOOK_UPDATED, refreshBooks);
  
  useSidebarEvents(SIDEBAR_EVENTS.MEAL_LOGGED, refreshNutrition);
  useSidebarEvents(SIDEBAR_EVENTS.MEAL_UPDATED, refreshNutrition);
  useSidebarEvents(SIDEBAR_EVENTS.MEAL_DELETED, refreshNutrition);
  
  useSidebarEvents(SIDEBAR_EVENTS.FINANCE_UPDATED, refreshFinance);
  
  // Écouter les événements Smart Shopping
  useSidebarEvents('SHOPPING_LIST_CREATED', refreshShopping);
  useSidebarEvents('SHOPPING_LIST_UPDATED', refreshShopping);
  useSidebarEvents('SHOPPING_LIST_DELETED', refreshShopping);

  // Calculer Streak (jours consécutifs avec succès >= 80%) - Optimisé avec gestion d'erreur
  const streak = useMemo(() => {
    try {
      if (!dailyPerformances || dailyPerformances.length === 0) return 0;
      
      const sorted = dailyPerformances
        .filter(d => d && d.successRate >= 80)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      if (sorted.length === 0) return 0;
      
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
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul streak:', error);
      return 0;
    }
  }, [dailyPerformances, today]);

  // Calculer Focus (moyenne 7 derniers jours) - Optimisé avec gestion d'erreur
  const focus = useMemo(() => {
    try {
      if (!dailyPerformances || dailyPerformances.length === 0) return 0;
      
      const recent = dailyPerformances.slice(-7);
      if (recent.length === 0) return 0;
      
      const avg = recent.reduce((sum, d) => sum + (d?.successRate || 0), 0) / recent.length;
      return Math.round(avg);
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul focus:', error);
      return 0;
    }
  }, [dailyPerformances]);

  // Métriques Vitales - Optimisé avec valeurs par défaut robustes
  const metrics = useMemo(() => ({
    xp: userData?.currentXP ?? 0,
    level: userData?.level ?? 1,
    streak: streak ?? 0,
    focus: focus ?? 0
  }), [userData, streak, focus]);

  // Quêtes du jour - Optimisé avec gestion d'erreur
  const quests = useMemo(() => {
    try {
      if (!getQuestsForDate || !isQuestCompletedOnDate) return [];
      
      const todayQuests = getQuestsForDate(today);
      if (!todayQuests || todayQuests.length === 0) return [];
      
      return todayQuests.map(quest => {
        try {
          const completed = isQuestCompletedOnDate(quest.id, today);
          return {
            id: quest.id,
            title: quest.nom || 'Quête sans nom',
            icon: quest.icone || '🎯',
            completed,
            progress: completed ? 100 : 0,
            xp: quest.xp || 0,
            difficulty: quest.difficulte || 1
          };
        } catch (error) {
          console.error('[useSidebarData] Erreur traitement quête:', quest.id, error);
          return null;
        }
      }).filter(Boolean); // Filtrer les quêtes null
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul quêtes:', error);
      return [];
    }
  }, [getQuestsForDate, isQuestCompletedOnDate, today, refreshTriggers.quests]);

  // Sport & Santé - Optimisé avec gestion d'erreur
  const sport = useMemo(() => {
    try {
      if (!getWorkoutHistory) {
        return {
          weeklyWorkouts: 0,
          todayCalories: 0,
          todaySteps: 0,
          avgHeartRate: 72,
          hasGarminData: false
        };
      }
      
      const history = getWorkoutHistory();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      
      const weeklyWorkouts = history ? history.filter(w => w && w.date >= weekAgoStr).length : 0;
      const todayMetrics = garminData?.dailyMetrics?.[today];
      
      return {
        weeklyWorkouts,
        todayCalories: todayMetrics?.totalCaloriesBurned || garminData?.sport?.todayMetrics?.calories?.total || 0,
        todaySteps: todayMetrics?.steps || garminData?.sport?.todayMetrics?.steps || 0,
        avgHeartRate: todayMetrics?.restingHeartRate || garminData?.sport?.todayMetrics?.heartRate?.resting || 72,
        hasGarminData: garminData !== null,
        stepsGoal: garminData?.stepsGoal ?? 8500,
        caloriesGoal: garminData?.caloriesGoal ?? 1650,
        // Passer les métriques complètes pour les modules historiques
        todayMetrics: todayMetrics || garminData?.sport?.todayMetrics || null,
        // IMPORTANT: Passer toutes les données Garmin enrichies pour les graphiques
        garminData: garminData || null,
        // Données spécifiques pour les graphiques Garmin
        heartRateZones: garminData?.heartRateZones || null,
        sleepPhases: garminData?.sleepPhases || null,
        stressLevels: garminData?.stressLevels || null,
        maxHeartRate: garminData?.maxHeartRate || 190,
        userAge: garminData?.userAge || 30,
        sleepObjective: garminData?.sleepObjective || 480
      };
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul sport:', error);
      return {
        weeklyWorkouts: 0,
        todayCalories: 0,
        todaySteps: 0,
        avgHeartRate: 72,
        hasGarminData: false
      };
    }
  }, [getWorkoutHistory, garminData, today, refreshTriggers.workout]);

  // Finances - Optimisé avec gestion d'erreur
  const finance = useMemo(() => {
    try {
      const netWorth = patrimoine?.total?.valorise || 0;
      const monthlyBudget = salaire?.netMensuel || 0;
      const monthlySavings = repartition?.epargne || 0;
      
      // Investments = Or + Bourse (cash is liquidity, not investment)
      const investments = 
        (patrimoine?.or?.valorisation || 0) +
        (patrimoine?.bourse?.valorisation || 0);
      
      return {
        netWorth,
        monthlyBudget,
        monthlySavings,
        investments,
        hasData: patrimoine !== null || salaire !== null
      };
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul finances:', error);
      return {
        netWorth: 0,
        monthlyBudget: 0,
        monthlySavings: 0,
        investments: 0,
        hasData: false
      };
    }
  }, [patrimoine, salaire, repartition]);

  // Nutrition - Optimisé avec gestion d'erreur
  const nutrition = useMemo(() => {
    try {
      const dailyTotals = nutritionData?.dailyTotals;
      
      if (!dailyTotals) {
        return {
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          water: 0,
          compliance: 0,
          hasData: false
        };
      }
      
      const calories = dailyTotals.calories || 0;
      const targetCalories = dailyTotals.targetCalories || 0;
      const compliance = targetCalories > 0 
        ? Math.round((calories / targetCalories) * 100)
        : 0;
      
      return {
        calories,
        proteins: dailyTotals.proteines || 0,
        carbs: dailyTotals.glucides || 0,
        fats: dailyTotals.lipides || 0,
        water: dailyTotals.waterIntake || 0,
        compliance,
        hasData: true
      };
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul nutrition:', error);
      return {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        water: 0,
        compliance: 0,
        hasData: false
      };
    }
  }, [nutritionData]);

  // Apprentissage (Books) - Utilise useBooksStatistics avec gestion d'erreur
  const learning = useMemo(() => {
    try {
      // Dernier livre en cours (le plus récemment actif : dernière session de lecture)
      const inProgress = (books || []).filter(book => book && book.status === 'in-progress');
      const currentBook = (() => {
        if (!inProgress.length) return null;
        if (inProgress.length === 1) return inProgress[0];
        const withLastSession = inProgress.map(book => {
          const sessions = Array.isArray(book.readingSessions) ? book.readingSessions : [];
          const lastDate = sessions.length
            ? sessions.reduce((max, s) => {
                const d = s?.date ? new Date(s.date).getTime() : 0;
                return d > max ? d : max;
              }, 0)
            : 0;
          return { book, lastDate };
        });
        withLastSession.sort((a, b) => b.lastDate - a.lastDate);
        return withLastSession[0]?.book || inProgress[inProgress.length - 1];
      })();

      // Calculer la progression du livre actuel
      let bookProgress = null;
      if (currentBook) {
        const totalPages = currentBook.totalPages || currentBook.pages || 0;
        const currentPage = currentBook.currentPage || 0;
        const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
        
        bookProgress = {
          id: currentBook.id,
          title: currentBook.title,
          author: currentBook.author,
          totalPages,
          currentPage,
          progress
        };
      }

      // Calculer les statistiques de la semaine
      const weeklyStats = {
        sessionsCount: 0,
        totalPages: 0
      };

      if (books && Array.isArray(books)) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        books.forEach(book => {
          if (book.readingSessions && Array.isArray(book.readingSessions)) {
            const weekSessions = book.readingSessions.filter(session => {
              if (!session.date) return false;
              const sessionDate = new Date(session.date);
              return sessionDate >= oneWeekAgo;
            });
            
            weeklyStats.sessionsCount += weekSessions.length;
            weeklyStats.totalPages += weekSessions.reduce((sum, session) => {
              return sum + (Number(session.pagesRead) || 0);
            }, 0);
          }
        });
      }

      return {
        currentBooks: booksStatistics.currentBooks || 0,
        todayPages: booksStatistics.todayPages || 0,
        todayMinutes: booksStatistics.todayMinutes || 0,
        dailyGoal: booksStatistics.dailyGoal || 30,
        hasData: booksStatistics.hasData || false,
        // Ajouter les livres pour les modules historiques
        books: books || [],
        subjects: [
          'mathematics',
          'programming', 
          'languages',
          'science',
          'history',
          'philosophy',
          'other'
        ],
        // Données pour ActiveReadingSessionModule
        activeReadingSession: {
          currentBook: bookProgress,
          dailyGoals: {
            pages: 20, // Objectif par défaut, peut être configuré
            minutes: booksStatistics.dailyGoal || 30
          },
          todayProgress: {
            pages: booksStatistics.todayPages || 0,
            minutes: booksStatistics.todayMinutes || 0
          },
          weeklyStats,
          sessionTimer: null, // Sera mis à jour par les événements
          hasData: booksStatistics.hasData || false
        }
      };
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul learning:', error);
      return {
        currentBooks: 0,
        todayPages: 0,
        todayMinutes: 0,
        dailyGoal: 30,
        hasData: false,
        books: [],
        subjects: [],
        activeReadingSession: {
          currentBook: null,
          dailyGoals: { pages: 20, minutes: 30 },
          todayProgress: { pages: 0, minutes: 0 },
          weeklyStats: { sessionsCount: 0, totalPages: 0 },
          sessionTimer: null,
          hasData: false
        }
      };
    }
  }, [booksStatistics, books]);

  // Smart Shopping - Optimisé avec gestion d'erreur
  const shopping = useMemo(() => {
    try {
      if (shoppingLoading) {
        return {
          loading: true,
          error: null,
          shoppingLists: [],
          hasData: false
        };
      }

      if (shoppingError) {
        return {
          loading: false,
          error: shoppingError,
          shoppingLists: [],
          hasData: false
        };
      }

      return {
        loading: false,
        error: null,
        shoppingLists: shoppingLists || [],
        hasData: shoppingLists && shoppingLists.length > 0
      };
    } catch (error) {
      console.error('[useSidebarData] Erreur calcul shopping:', error);
      return {
        loading: false,
        error: error.message,
        shoppingLists: [],
        hasData: false
      };
    }
  }, [shoppingLists, shoppingLoading, shoppingError, refreshTriggers.shopping]);

  // Données "Aujourd'hui" - Agrégation des activités du jour - Optimisé
  const todayData = useMemo(() => {
    // Quêtes du jour
    let questsCompleted = 0;
    let questsTotal = 0;
    
    if (getQuestsForDate && isQuestCompletedOnDate) {
      const todayQuests = getQuestsForDate(today);
      if (todayQuests && todayQuests.length > 0) {
        questsTotal = todayQuests.length;
        questsCompleted = todayQuests.filter(q => isQuestCompletedOnDate(q.id, today)).length;
      }
    }
    
    // Entraînement du jour
    let workoutDone = false;
    if (getWorkoutHistory) {
      const history = getWorkoutHistory();
      workoutDone = history ? history.some(w => w.date === today) : false;
    }
    
    // Pages lues
    const pagesRead = learning.todayPages || 0;
    
    // Repas loggés
    const mealsLogged = nutritionData?.meals?.length || 0;
    
    return {
      questsCompleted,
      questsTotal,
      workoutDone,
      pagesRead,
      mealsLogged,
      mealsTarget: 3 // Configurable - 3 repas par jour par défaut
    };
  }, [
    getQuestsForDate, 
    isQuestCompletedOnDate, 
    getWorkoutHistory, 
    learning.todayPages, 
    nutritionData, 
    today, 
    refreshTriggers.quests, 
    refreshTriggers.workout, 
    refreshTriggers.books
  ]);

  // État de chargement global - Optimisé
  const isLoading = useMemo(() => {
    // Considérer comme chargé si au moins les données de base sont prêtes
    // On attend que Garmin OU Nutrition soit prêt (pas les deux obligatoirement)
    return !garminReady && !nutritionReady;
  }, [garminReady, nutritionReady]);

  // Log de débogage pour tracer les données
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useSidebarData] État des données:', {
        isAuthenticated,
        isLoading,
        metrics,
        questsCount: quests.length,
        sport,
        finance,
        nutrition,
        learning,
        today: todayData
      });
    }
  }, [isAuthenticated, isLoading, metrics, quests, sport, finance, nutrition, learning, todayData]);

  // Retourner toutes les données agrégées avec valeurs par défaut robustes
  return {
    metrics: metrics ?? { xp: 0, level: 1, streak: 0, focus: 0 },
    quests: quests ?? [],
    sport: sport ?? { weeklyWorkouts: 0, todayCalories: 0, todaySteps: 0, avgHeartRate: 72, hasGarminData: false },
    finance: finance ?? { netWorth: 0, monthlyBudget: 0, monthlySavings: 0, investments: 0, hasData: false },
    nutrition: nutrition ?? { calories: 0, proteins: 0, carbs: 0, fats: 0, water: 0, compliance: 0, hasData: false },
    learning: learning ?? { currentBooks: 0, todayPages: 0, todayMinutes: 0, dailyGoal: 30, hasData: false },
    shopping: shopping ?? { loading: false, error: null, shoppingLists: [], hasData: false },
    today: todayData ?? { questsCompleted: 0, questsTotal: 0, workoutDone: false, pagesRead: 0, mealsLogged: 0, mealsTarget: 3 },
    isLoading,
    isAuthenticated,
    todayDate: today
  };
};

export default useSidebarData;
