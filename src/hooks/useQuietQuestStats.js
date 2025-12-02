/**
 * Hook personnalisé pour calculer toutes les statistiques QuietQuest
 * Centralise tous les calculs et les memoize pour performance optimale
 */

import { useMemo } from 'react';
import { useQuietQuestEngine, getTodayDateStr, addDays } from './useQuietQuestEngine';
import { getPeriodStartDate } from '../components/quests/stats/utils/dateHelpers';
import {
  calculateCompletionRate,
  calculateCompletionRateByPeriod,
  calculateDailyAverage,
  calculateCategoryStats,
  calculateDifficultyStats,
  calculateQuestStats,
  generateCalendarHeatmap,
  calculateStreaks,
  calculateDayOfWeekStats,
  generateInsights,
} from '../components/quests/stats/utils/statsCalculations';

/**
 * Hook pour obtenir toutes les statistiques QuietQuest
 * @param {string} selectedPeriod - Période sélectionnée ('7d', '30d', '90d', '180d', '365d', 'all')
 * @returns {Object} Toutes les statistiques calculées
 */
export const useQuietQuestStats = (selectedPeriod = '30d') => {
  const {
    allQuests,
    validations,
    dailyPerformances,
    validationsByDate,
  } = useQuietQuestEngine();

  const periodStartDate = useMemo(() => {
    return getPeriodStartDate(selectedPeriod);
  }, [selectedPeriod]);

  // Calculer toutes les métriques en une fois (memoized)
  const stats = useMemo(() => {
    // Filtrer les données pour la période (optimisé avec early return si pas de données)
    const filteredPerformances = dailyPerformances.filter(p => p.date >= periodStartDate);
    const filteredValidations = validations.filter(v => v.date >= periodStartDate);
    
    // Si pas de données, retourner structure vide
    if (filteredPerformances.length === 0 && filteredValidations.length === 0) {
      return {
        completionRate: 0,
        completionRateByPeriod: [],
        dailyAverage: 0,
        weeklyAverage: 0,
        monthlyAverage: 0,
        totalXP: 0,
        currentStreak: 0,
        bestStreak: 0,
        categoryStats: [],
        topCategory: null,
        bottomCategory: null,
        difficultyStats: [],
        preferredDifficulty: null,
        questStats: [],
        topQuests: [],
        bottomQuests: [],
        neverCompletedQuests: [],
        calendarHeatmap: [],
        dayOfWeekStats: [],
        mostProductiveDay: null,
        insights: [],
        filteredPerformances: [],
        filteredValidations: [],
      };
    }

    // Taux de complétion
    const completionRate = calculateCompletionRate(dailyPerformances, periodStartDate);
    const completionRateByPeriod = calculateCompletionRateByPeriod(dailyPerformances);

    // Moyennes
    const dailyAverage = calculateDailyAverage(dailyPerformances, 7);
    const weeklyAverage = calculateDailyAverage(dailyPerformances, 30);
    const monthlyAverage = calculateDailyAverage(dailyPerformances, 90);

    // Catégories
    const categoryStats = calculateCategoryStats(
      validations,
      allQuests,
      dailyPerformances,
      periodStartDate
    );
    const sortedCategories = [...categoryStats].sort((a, b) => b.validationsCount - a.validationsCount);
    const topCategory = sortedCategories[0];
    const bottomCategory = sortedCategories[sortedCategories.length - 1];

    // Difficulté
    const difficultyStats = calculateDifficultyStats(validations, allQuests, periodStartDate);
    const sortedDifficulties = [...difficultyStats].sort((a, b) => b.validationsCount - a.validationsCount);
    const preferredDifficulty = sortedDifficulties[0];
    const totalValidations = difficultyStats.reduce((sum, d) => sum + d.validationsCount, 0);
    if (preferredDifficulty && totalValidations > 0) {
      preferredDifficulty.percentage = Math.round((preferredDifficulty.validationsCount / totalValidations) * 100);
    }

    // Quêtes
    const questStats = calculateQuestStats(validations, allQuests, periodStartDate);
    const sortedQuests = [...questStats].sort((a, b) => b.validationsCount - a.validationsCount);
    const topQuests = sortedQuests.slice(0, 10);
    const bottomQuests = sortedQuests.slice(-10).reverse();
    const neverCompletedQuests = questStats.filter(q => q.validationsCount === 0);

    // Calendrier
    const calendarHeatmap = generateCalendarHeatmap(dailyPerformances, selectedPeriod);

    // Streaks
    const { currentStreak, bestStreak } = calculateStreaks(dailyPerformances, periodStartDate);

    // Jour de la semaine
    const dayOfWeekStats = calculateDayOfWeekStats(dailyPerformances, periodStartDate);
    const mostProductiveDay = dayOfWeekStats.length > 0
      ? dayOfWeekStats.reduce((a, b) => a.avgQuests > b.avgQuests ? a : b)
      : null;

    // Variation du taux de complétion (comparaison mois actuel vs précédent)
    const today = getTodayDateStr();
    const currentMonthStart = addDays(today, -30);
    const previousMonthStart = addDays(today, -60);
    const previousMonthEnd = addDays(today, -30);
    const currentMonthRate = calculateCompletionRate(dailyPerformances, currentMonthStart);
    const previousMonthRate = calculateCompletionRate(
      dailyPerformances.filter(p => p.date >= previousMonthStart && p.date < previousMonthEnd),
      previousMonthStart
    );
    const completionRateVariation = currentMonthRate - previousMonthRate;

    // XP total
    const totalXP = filteredPerformances.reduce((sum, p) => sum + (p.xpTotal || 0), 0);

    // Générer insights
    const insights = generateInsights({
      topCategory,
      bottomCategory,
      completionRateVariation,
      currentStreak,
      neverCompletedQuests,
      mostProductiveDay,
      preferredDifficulty,
    });

    return {
      // Métriques de base
      completionRate,
      completionRateByPeriod,
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      totalXP,
      currentStreak,
      bestStreak,

      // Catégories
      categoryStats,
      topCategory,
      bottomCategory,

      // Difficulté
      difficultyStats,
      preferredDifficulty,

      // Quêtes
      questStats,
      topQuests,
      bottomQuests,
      neverCompletedQuests,

      // Calendrier
      calendarHeatmap,

      // Jour de la semaine
      dayOfWeekStats,
      mostProductiveDay,

      // Insights
      insights,

      // Données brutes filtrées (pour graphiques)
      filteredPerformances,
      filteredValidations,
    };
  }, [allQuests, validations, dailyPerformances, periodStartDate, selectedPeriod]);

  return stats;
};

