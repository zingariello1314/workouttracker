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

/**
 * Hook centralisé pour les données de la Sidebar Premium
 * 
 * @returns {Object} Données agrégées de tous les modules
 * @returns {Object} returns.metrics - Métriques vitales (XP, Niveau, Streak, Focus)
 * @returns {Array} returns.quests - Quêtes actives du jour
 * @returns {Object} returns.sport - Données sport et santé
 * @returns {Object} returns.finance - Données financières
 * @returns {Object} returns.nutrition - Données nutrition
 * @returns {Object} returns.learning - Données apprentissage
 * @returns {boolean} returns.isLoading - État de chargement
 * @returns {boolean} returns.isAuthenticated - État d'authentification
 */
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
  const { patrimoine, loading: syntheseLoading } = useSynthese();
  const { salaire, repartition, loading: planifLoading } = usePlanificateur();

  const [garminData, setGarminData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [booksData, setBooksData] = useState(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Charger données Garmin
  useEffect(() => {
    if (garminReady && isAuthenticated) {
      loadDataForTab('metrics', null, 'week')
        .then(data => setGarminData(data))
        .catch(err => {
          console.error('[useSidebarData] Erreur Garmin:', err);
          setGarminData(null);
        });
    }
  }, [garminReady, isAuthenticated, loadDataForTab]);

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

  // Charger données Books (localStorage)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('booksData');
      if (stored) {
        setBooksData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[useSidebarData] Erreur Books:', error);
      setBooksData(null);
    }
  }, []);

  // Calculer Streak (jours consécutifs avec succès >= 80%)
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

  // Calculer Focus (moyenne 7 derniers jours)
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
      xp: quest.xp || 0,
      difficulty: quest.difficulte || 1
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
      avgHeartRate: garminData?.dailyMetrics?.[today]?.restingHeartRate || 72,
      hasGarminData: garminData !== null
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
    ) || 0,
    hasData: patrimoine !== null || salaire !== null
  }), [patrimoine, salaire, repartition]);

  // Nutrition
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

  // Apprentissage (Books)
  const learning = useMemo(() => ({
    currentBooks: booksData?.currentBooks?.length || 0,
    todayPages: booksData?.todayPages || 0,
    todayMinutes: booksData?.todayMinutes || 0,
    dailyGoal: booksData?.dailyGoal || 30,
    hasData: booksData !== null
  }), [booksData]);

  // État de chargement global
  const isLoading = useMemo(() => {
    // Considérer comme chargé si au moins les données de base sont prêtes
    return !garminReady && !nutritionReady;
  }, [garminReady, nutritionReady]);

  return {
    metrics,
    quests,
    sport,
    finance,
    nutrition,
    learning,
    isLoading,
    isAuthenticated,
    today
  };
};

export default useSidebarData;
