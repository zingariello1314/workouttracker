/**
 * Fonctions de calcul pour les statistiques QuietQuest
 * Toutes les fonctions sont pures et optimisées pour la performance
 */

import { getTodayDateStr, addDays, getDayOfWeekFromDateStr } from '../../../../hooks/useQuietQuestEngine';
import { getPeriodStartDate, getDayName } from './dateHelpers';

/**
 * Calcule le taux de complétion moyen pour une période
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @param {string} periodStartDate - Date de début de période
 * @returns {number} Taux de complétion moyen (0-100)
 */
export const calculateCompletionRate = (dailyPerformances, periodStartDate) => {
  const filtered = dailyPerformances.filter(p => p.date >= periodStartDate);
  if (filtered.length === 0) return 0;
  const totalRate = filtered.reduce((sum, p) => sum + (p.successRate || 0), 0);
  return Math.round(totalRate / filtered.length);
};

/**
 * Calcule le taux de complétion pour plusieurs périodes avec comparaison
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @returns {Array} Tableau avec taux pour chaque période
 */
export const calculateCompletionRateByPeriod = (dailyPerformances) => {
  const today = getTodayDateStr();
  const periods = [
    { key: 'week', label: 'Semaine', days: 7 },
    { key: 'month', label: 'Mois', days: 30 },
    { key: '6months', label: '6 mois', days: 180 },
    { key: 'year', label: 'Année', days: 365 },
  ];

  return periods.map(period => {
    const currentStart = addDays(today, -period.days);
    const previousStart = addDays(today, -period.days * 2);
    const previousEnd = addDays(today, -period.days);

    const currentPerfs = dailyPerformances.filter(p => p.date >= currentStart);
    const previousPerfs = dailyPerformances.filter(p => p.date >= previousStart && p.date < previousEnd);

    const currentRate = currentPerfs.length > 0
      ? Math.round(currentPerfs.reduce((sum, p) => sum + (p.successRate || 0), 0) / currentPerfs.length)
      : 0;
    
    const previousRate = previousPerfs.length > 0
      ? Math.round(previousPerfs.reduce((sum, p) => sum + (p.successRate || 0), 0) / previousPerfs.length)
      : 0;

    return {
      period: period.label,
      current: currentRate,
      previous: previousRate,
      variation: currentRate - previousRate,
      variationPercent: previousRate > 0 ? Math.round(((currentRate - previousRate) / previousRate) * 100) : 0,
    };
  });
};

/**
 * Calcule la moyenne de quêtes complétées sur N jours
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @param {number} days - Nombre de jours
 * @returns {number} Moyenne (2 décimales)
 */
export const calculateDailyAverage = (dailyPerformances, days) => {
  const today = getTodayDateStr();
  const startDate = addDays(today, -days);
  const filtered = dailyPerformances.filter(p => p.date >= startDate);
  if (filtered.length === 0) return 0;
  const total = filtered.reduce((sum, p) => sum + (p.completedQuests || 0), 0);
  return Math.round((total / filtered.length) * 100) / 100;
};

/**
 * Calcule les statistiques par catégorie
 * @param {Array} validations - Toutes les validations
 * @param {Array} allQuests - Toutes les quêtes
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @param {string} periodStartDate - Date de début de période
 * @returns {Array} Statistiques par catégorie
 */
export const calculateCategoryStats = (validations, allQuests, dailyPerformances, periodStartDate) => {
  const periodValidations = validations.filter(v => v.date >= periodStartDate);
  const categoryMap = new Map();

  const categories = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel', 'Repas', 'Projets', 'Hobby', 'Social', 'Finance', 'Créativité', 'Bien-être'];
  
  categories.forEach(category => {
    // Quêtes de cette catégorie
    const categoryQuests = allQuests.filter(q => q.categorie === category && q.active !== false);
    
    // Validations de cette catégorie
    const categoryValidations = periodValidations.filter(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      return quest && quest.categorie === category;
    });

    // Compter quêtes disponibles dans la période (approximation)
    const uniqueDates = new Set(periodValidations.map(v => v.date));
    const totalAvailable = categoryQuests.length * (uniqueDates.size > 0 ? uniqueDates.size : 1);

    // XP total gagné
    const xpTotal = categoryValidations.reduce((sum, v) => sum + (v.xpGagne || 0), 0);

    // Taux de réussite
    const completionRate = totalAvailable > 0 
      ? Math.round((categoryValidations.length / totalAvailable) * 100)
      : 0;

    categoryMap.set(category, {
      category,
      questsCount: categoryQuests.length,
      validationsCount: categoryValidations.length,
      xpTotal,
      completionRate,
    });
  });

  const stats = Array.from(categoryMap.values());
  
  // Calculer pourcentages pour le total
  const totalXP = stats.reduce((sum, s) => sum + s.xpTotal, 0);
  stats.forEach(stat => {
    stat.percentage = totalXP > 0 ? Math.round((stat.xpTotal / totalXP) * 100) : 0;
  });

  return stats;
};

/**
 * Calcule les statistiques par difficulté
 * @param {Array} validations - Toutes les validations
 * @param {Array} allQuests - Toutes les quêtes
 * @param {string} periodStartDate - Date de début de période
 * @returns {Array} Statistiques par difficulté
 */
export const calculateDifficultyStats = (validations, allQuests, periodStartDate) => {
  const periodValidations = validations.filter(v => v.date >= periodStartDate);
  const difficultyMap = new Map();

  [1, 2, 3, 4].forEach(difficulty => {
    const difficultyLabel = {
      1: 'Facile',
      2: 'Moyen',
      3: 'Difficile',
      4: 'Épique'
    }[difficulty];

    // Quêtes de cette difficulté
    const difficultyQuests = allQuests.filter(q => q.difficulte === difficulty && q.active !== false);
    
    // Validations de cette difficulté
    const difficultyValidations = periodValidations.filter(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      return quest && quest.difficulte === difficulty;
    });

    // XP total et moyen
    const xpTotal = difficultyValidations.reduce((sum, v) => sum + (v.xpGagne || 0), 0);
    const xpAverage = difficultyValidations.length > 0 
      ? Math.round(xpTotal / difficultyValidations.length)
      : 0;

    // Taux de réussite (approximation)
    const uniqueDates = new Set(periodValidations.map(v => v.date));
    const totalAvailable = difficultyQuests.length * (uniqueDates.size > 0 ? uniqueDates.size : 1);
    const completionRate = totalAvailable > 0 
      ? Math.round((difficultyValidations.length / totalAvailable) * 100)
      : 0;

    difficultyMap.set(difficulty, {
      difficulty,
      label: difficultyLabel,
      questsCount: difficultyQuests.length,
      validationsCount: difficultyValidations.length,
      xpTotal,
      xpAverage,
      completionRate,
    });
  });

  return Array.from(difficultyMap.values());
};

/**
 * Calcule les statistiques par quête
 * @param {Array} validations - Toutes les validations
 * @param {Array} allQuests - Toutes les quêtes
 * @param {string} periodStartDate - Date de début de période
 * @returns {Array} Statistiques par quête
 */
export const calculateQuestStats = (validations, allQuests, periodStartDate) => {
  const periodValidations = validations.filter(v => v.date >= periodStartDate);
  const questMap = new Map();

  allQuests.forEach(quest => {
    const questValidations = periodValidations.filter(v => v.queteId === quest.id);
    const validationsCount = questValidations.length;
    const xpTotal = questValidations.reduce((sum, v) => sum + (v.xpGagne || 0), 0);
    
    // Calculer taux de réussite (validations / jours disponibles dans la période)
    const uniqueDates = new Set(periodValidations.map(v => v.date));
    const daysInPeriod = uniqueDates.size > 0 ? uniqueDates.size : 1;
    const completionRate = daysInPeriod > 0 
      ? Math.round((validationsCount / daysInPeriod) * 100)
      : 0;

    questMap.set(quest.id, {
      id: quest.id,
      nom: quest.nom,
      categorie: quest.categorie,
      difficulte: quest.difficulte,
      validationsCount,
      xpTotal,
      completionRate,
      lastValidation: questValidations.length > 0
        ? questValidations[questValidations.length - 1].date
        : null,
    });
  });

  return Array.from(questMap.values());
};

/**
 * Génère les données pour le heatmap calendrier
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @param {string} selectedPeriod - Période sélectionnée
 * @returns {Array} Grille calendrier (semaines × jours)
 */
export const generateCalendarHeatmap = (dailyPerformances, selectedPeriod) => {
  const today = getTodayDateStr();
  const periodStartDate = selectedPeriod === 'all' 
    ? '2000-01-01' 
    : addDays(today, -parseInt(selectedPeriod));

  // Créer Map date -> completedQuests
  const dateMap = new Map();
  dailyPerformances
    .filter(p => p.date >= periodStartDate)
    .forEach(p => {
      dateMap.set(p.date, p.completedQuests || 0);
    });

  // Générer grille calendrier (12 semaines max pour lisibilité)
  const weeks = [];
  const startDate = new Date(periodStartDate);
  const endDate = new Date(today);
  
  // Ajuster au lundi de la semaine de début
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);

  let currentDate = new Date(startDate);
  let currentWeek = [];

  while (currentDate <= endDate && weeks.length < 12) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const completed = dateMap.get(dateStr) || 0;
    
    currentWeek.push({
      date: dateStr,
      completed,
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
    });

    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
};

/**
 * Calcule le streak actuel et le meilleur streak
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @param {string} periodStartDate - Date de début de période
 * @returns {Object} { currentStreak, bestStreak }
 */
export const calculateStreaks = (dailyPerformances, periodStartDate) => {
  const filtered = dailyPerformances
    .filter(p => p.date >= periodStartDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  let currentStreak = 0;
  let bestStreak = 0;
  let prevDate = null;

  for (const perf of filtered) {
    if (perf.successRate > 0) {
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const dPrev = new Date(prevDate);
        const dCur = new Date(perf.date);
        const diff = (dCur.getTime() - dPrev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      prevDate = perf.date;
    } else {
      currentStreak = 0;
      prevDate = perf.date;
    }
  }

  return { currentStreak, bestStreak };
};

/**
 * Calcule les statistiques par jour de la semaine
 * @param {Array} dailyPerformances - Performances quotidiennes
 * @param {string} periodStartDate - Date de début de période
 * @returns {Array} Statistiques par jour
 */
export const calculateDayOfWeekStats = (dailyPerformances, periodStartDate) => {
  const filtered = dailyPerformances.filter(p => p.date >= periodStartDate);
  const dayMap = new Map();

  filtered.forEach(perf => {
    if (perf.successRate > 0) {
      const dayOfWeek = getDayOfWeekFromDateStr(perf.date);
      const dayName = getDayName(dayOfWeek);
      
      if (!dayMap.has(dayOfWeek)) {
        dayMap.set(dayOfWeek, {
          dayOfWeek,
          dayName,
          totalQuests: 0,
          completedQuests: 0,
          daysCount: 0,
        });
      }
      
      const stats = dayMap.get(dayOfWeek);
      stats.totalQuests += perf.totalQuests || 0;
      stats.completedQuests += perf.completedQuests || 0;
      stats.daysCount += 1;
    }
  });

  // Calculer moyennes
  const result = Array.from(dayMap.values()).map(stats => ({
    ...stats,
    avgQuests: stats.daysCount > 0 ? Math.round((stats.completedQuests / stats.daysCount) * 100) / 100 : 0,
  }));

  return result.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
};

/**
 * Génère les insights automatiques
 * @param {Object} stats - Toutes les statistiques calculées
 * @returns {Array} Tableau d'insights
 */
export const generateInsights = (stats) => {
  const insights = [];

  // Insight 1 : Catégorie la plus productive
  if (stats.topCategory && stats.topCategory.validationsCount > 0) {
    insights.push({
      type: 'success',
      icon: '🏆',
      text: `Ta catégorie la plus productive est **${stats.topCategory.category}** avec ${stats.topCategory.validationsCount} validations (${stats.topCategory.percentage}% du total). Continue comme ça !`,
    });
  }

  // Insight 2 : Amélioration du taux de complétion
  if (stats.completionRateVariation !== undefined) {
    if (stats.completionRateVariation > 5) {
      insights.push({
        type: 'success',
        icon: '📈',
        text: `Excellent ! Ton taux de complétion a augmenté de **${stats.completionRateVariation}%** ce mois par rapport au mois dernier.`,
      });
    } else if (stats.completionRateVariation < -5) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        text: `Attention, ton taux de complétion a baissé de **${Math.abs(stats.completionRateVariation)}%** ce mois. Relance-toi !`,
      });
    }
  }

  // Insight 3 : Streak actuel
  if (stats.currentStreak >= 7) {
    insights.push({
      type: 'success',
      icon: '🔥',
      text: `Incroyable ! Tu es sur un streak de **${stats.currentStreak} jours** consécutifs. Ne lâche rien !`,
    });
  } else if (stats.currentStreak >= 3) {
    insights.push({
      type: 'info',
      icon: '💪',
      text: `Tu es sur un streak de **${stats.currentStreak} jours**. Continue !`,
    });
  }

  // Insight 4 : Quêtes jamais complétées
  if (stats.neverCompletedQuests && stats.neverCompletedQuests.length > 0) {
    insights.push({
      type: 'info',
      icon: '💡',
      text: `Tu as **${stats.neverCompletedQuests.length} quête${stats.neverCompletedQuests.length > 1 ? 's' : ''}** que tu n'as jamais complétée${stats.neverCompletedQuests.length > 1 ? 's' : ''}. Pourquoi ne pas essayer ?`,
    });
  }

  // Insight 5 : Jour le plus productif
  if (stats.mostProductiveDay && stats.mostProductiveDay.avgQuests > 0) {
    insights.push({
      type: 'info',
      icon: '📅',
      text: `Ton jour le plus productif est le **${stats.mostProductiveDay.dayName}** avec une moyenne de ${stats.mostProductiveDay.avgQuests.toFixed(1)} quêtes complétées.`,
    });
  }

  // Insight 6 : Difficulté préférée
  if (stats.preferredDifficulty && stats.preferredDifficulty.percentage > 30) {
    insights.push({
      type: 'info',
      icon: '🎯',
      text: `Tu complètes principalement des quêtes **${stats.preferredDifficulty.label}** (${stats.preferredDifficulty.percentage}% de tes validations).`,
    });
  }

  // Insight 7 : Catégorie à améliorer
  if (stats.bottomCategory && stats.bottomCategory.validationsCount === 0) {
    insights.push({
      type: 'warning',
      icon: '📉',
      text: `Tu n'as pas encore complété de quête dans la catégorie **${stats.bottomCategory.category}**. C'est le moment de s'y mettre !`,
    });
  }

  return insights;
};

