/**
 * nutritionGamification.js
 * 
 * Service de gamification pour la nutrition :
 * - Système de badges (achievements)
 * - XP & Niveaux
 * - Streaks avec forgiveness (anti-burnout)
 * 
 * Philosophie : Engagement durable, focus santé vs métriques externes
 * - Streak forgiveness (2 jours tolérés)
 * - Limite affichage 30j (anti-anxiété)
 * - Badges progression vs perfectionnisme
 * - Option désactiver gamification
 * 
 * @module services/nutrition/nutritionGamification
 * @see ../../../../nouvelongletnutritionplan.md Section 4
 */

import logger from '../../utils/logger';
import { openNutritionDB, STORE_GAMIFICATION } from '../../hooks/nutritionDataUtils';

const log = logger.module('nutritionGamification');

// ==================== CONSTANTES ====================

// Points XP selon actions
export const XP_REWARDS = {
  meal_logged: 5,        // Repas saisi
  day_complete: 20,      // Jour complet (tous repas)
  program_compliant: 15, // Respect programme (≥80%)
  badge_unlocked: 50,    // Badge débloqué (base, variable selon rareté)
  streak_milestone: 100  // Palier série (7j, 30j, 100j)
};

// Formule XP par niveau (exponentielle)
export const getXPForLevel = (level) => {
  if (level === 1) return 0;
  if (level === 2) return 100;
  
  // Formule: 100 * 2^(level-2) (arrondi)
  return Math.round(100 * Math.pow(2, level - 2));
};

// Raretés badges
export const BADGE_RARITY = {
  common: { multiplier: 1, color: 'slate' },
  rare: { multiplier: 2, color: 'blue' },
  epic: { multiplier: 3, color: 'purple' },
  legendary: { multiplier: 5, color: 'gold' }
};

// ==================== DÉFINITIONS BADGES ====================

/**
 * Badges Consistance (Consistency)
 */
export const CONSISTENCY_BADGES = [
  {
    id: 'badge_7day_streak',
    name: 'Série 7 jours',
    description: '7 jours consécutifs sans oublier de saisir nutrition',
    category: 'consistency',
    icon: '🔥',
    rarity: 'common',
    points: 50,
    condition: (userData) => {
      return userData.streaks?.nutrition?.current >= 7;
    }
  },
  {
    id: 'badge_30day_streak',
    name: 'Série 30 jours',
    description: '30 jours consécutifs sans oublier',
    category: 'consistency',
    icon: '🔥🔥',
    rarity: 'rare',
    points: 200,
    condition: (userData) => {
      return userData.streaks?.nutrition?.current >= 30;
    }
  },
  {
    id: 'badge_100day_streak',
    name: 'Série 100 jours',
    description: '100 jours consécutifs - Maître de la régularité !',
    category: 'consistency',
    icon: '🔥🔥🔥',
    rarity: 'epic',
    points: 500,
    condition: (userData) => {
      return userData.streaks?.nutrition?.current >= 100;
    }
  }
];

/**
 * Badges Performance Nutrition
 */
export const NUTRITION_BADGES = [
  {
    id: 'badge_protein_master',
    name: 'Maître Protéines',
    description: 'Atteindre objectif protéines 30 jours consécutifs',
    category: 'nutrition',
    icon: '💪',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 30) {
        return false;
      }
      const last30Days = userData.nutritionHistory.slice(-30);
      return last30Days.every(day => {
        const protein = day.dailyTotals?.protein || 0;
        const targetProtein = day.dailyTotals?.targetProtein || 150;
        return protein >= targetProtein * 0.95;
      });
    }
  },
  {
    id: 'badge_program_100',
    name: 'Programme 100%',
    description: 'Respecter programme nutrition 1 semaine complète (≥80% conformité)',
    category: 'nutrition',
    icon: '🎯',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) {
        return false;
      }
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const compliance = day.complianceScore || day.dailyTotals?.complianceScore || 0;
        return compliance >= 80;
      });
    }
  },
  {
    id: 'badge_surplus_controlled',
    name: 'Surplus Contrôlé',
    description: 'Rester en surplus sans dépasser +500 kcal pendant 7 jours',
    category: 'nutrition',
    icon: '⚡',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) {
        return false;
      }
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const calories = day.dailyTotals?.calories || 0;
        const targetCalories = day.dailyTotals?.targetCalories || 2000;
        const balance = calories - targetCalories;
        return balance > 0 && balance <= 500;
      });
    }
  },
  {
    id: 'badge_variety_master',
    name: 'Maître de la Variété',
    description: '15 aliments différents sur 7 jours',
    category: 'nutrition',
    icon: '🍎',
    rarity: 'common',
    points: 75,
    condition: (userData) => {
      if (!userData.uniqueFoodsLast7Days) return false;
      return userData.uniqueFoodsLast7Days >= 15;
    }
  },
  {
    id: 'badge_hydration_king',
    name: 'Roi de l\'Hydratation',
    description: 'Atteindre objectif hydratation 7 jours consécutifs',
    category: 'nutrition',
    icon: '💧',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) {
        return false;
      }
      const last7Days = userData.nutritionHistory.slice(-7);
      return last7Days.every(day => {
        const water = day.dailyTotals?.waterIntake || 0;
        const targetWater = day.dailyTotals?.targetWater || 2500;
        return water >= targetWater * 0.9; // 90% de la cible
      });
    }
  }
];

/**
 * Badges Progression
 */
export const PROGRESSION_BADGES = [
  {
    id: 'badge_improvement_20pct',
    name: 'Progression Mensuelle',
    description: 'Amélioration 20% conformité ce mois vs mois précédent',
    category: 'progression',
    icon: '📈',
    rarity: 'common',
    points: 100,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 60) {
        return false;
      }
      const currentMonth = userData.nutritionHistory.slice(-30);
      const previousMonth = userData.nutritionHistory.slice(-60, -30);
      
      const currentAvg = currentMonth.reduce((sum, day) => 
        sum + (day.complianceScore || day.dailyTotals?.complianceScore || 0), 0
      ) / currentMonth.length;
      
      const previousAvg = previousMonth.reduce((sum, day) => 
        sum + (day.complianceScore || day.dailyTotals?.complianceScore || 0), 0
      ) / previousMonth.length;
      
      if (previousAvg === 0) return false;
      return ((currentAvg - previousAvg) / previousAvg) * 100 >= 20;
    }
  },
  {
    id: 'badge_balance_master',
    name: 'Équilibre Nutritionnel',
    description: 'Respecter macros équilibrés (pas juste calories)',
    category: 'progression',
    icon: '⚖️',
    rarity: 'rare',
    points: 150,
    condition: (userData) => {
      if (!userData.nutritionHistory || userData.nutritionHistory.length < 7) {
        return false;
      }
      const last7Days = userData.nutritionHistory.slice(-7);
      const avgMacros = {
        protein: last7Days.reduce((sum, day) => sum + (day.dailyTotals?.protein || 0), 0) / 7,
        carbs: last7Days.reduce((sum, day) => sum + (day.dailyTotals?.carbs || 0), 0) / 7,
        fat: last7Days.reduce((sum, day) => sum + (day.dailyTotals?.fat || 0), 0) / 7
      };
      
      // Calculer écart-type des macros (normalisé)
      const total = avgMacros.protein + avgMacros.carbs + avgMacros.fat;
      if (total === 0) return false;
      
      const proteinPercent = (avgMacros.protein / total) * 100;
      const carbsPercent = (avgMacros.carbs / total) * 100;
      const fatPercent = (avgMacros.fat / total) * 100;
      
      // Équilibre idéal : 30% protéines, 40% glucides, 30% lipides
      const ideal = { protein: 30, carbs: 40, fat: 30 };
      const deviation = Math.abs(proteinPercent - ideal.protein) + 
                       Math.abs(carbsPercent - ideal.carbs) + 
                       Math.abs(fatPercent - ideal.fat);
      
      return deviation < 20; // Écart total < 20%
    }
  }
];

// Tous les badges
export const ALL_BADGES = [
  ...CONSISTENCY_BADGES,
  ...NUTRITION_BADGES,
  ...PROGRESSION_BADGES
];

// ==================== CALCUL STREAKS AVEC FORGIVENESS ====================

/**
 * Calcule les streaks avec forgiveness (2 jours tolérés)
 * 
 * @param {Array<Object>} history - Historique dailyMeals [{date, hasMeals}, ...]
 * @param {string} type - Type de streak ('nutrition' | 'workout')
 * @returns {Object} {current, actual, forgivenessUsed, maxReached, status}
 */
export const calculateStreakWithForgiveness = (history, type = 'nutrition') => {
  let streak = 0;
  let forgiveness = 2; // 2 jours manqués tolérés
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parcourir depuis aujourd'hui vers le passé
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    // Vérifier si jour a des données
    const dayData = history.find(d => d.date === dateStr);
    const hasData = dayData && (
      type === 'nutrition' ? (dayData.meals?.length > 0 || dayData.hasMeals) : 
      type === 'workout' ? (dayData.workouts?.length > 0 || dayData.hasWorkouts) :
      ((dayData.meals?.length > 0 || dayData.hasMeals) || (dayData.workouts?.length > 0 || dayData.hasWorkouts))
    );
    
    if (hasData) {
      streak++;
      forgiveness = 2; // Reset forgiveness (jour validé)
    } else {
      if (forgiveness > 0) {
        forgiveness--;
        // Continuer série (jour pardonné)
        streak++;
      } else {
        break; // Fin série (plus de forgiveness)
      }
    }
  }
  
  // Limiter streak affichée à 30j max (éviter anxiété)
  const displayedStreak = Math.min(streak, 30);
  
  return {
    current: displayedStreak,
    actual: streak, // Streak réelle (pour calculs internes)
    forgivenessUsed: 2 - forgiveness, // Jours pardonnes utilisés
    maxReached: streak >= 30, // Badge "entretien" si >= 30j
    status: streak >= 30 ? 'maintenance' : 'active'
  };
};

// ==================== VÉRIFICATION BADGES ====================

/**
 * Vérifie quels badges peuvent être débloqués
 * 
 * @param {Object} userData - Données utilisateur (nutritionHistory, streaks, etc.)
 * @param {Array<Object>} unlockedBadges - Badges déjà débloqués
 * @returns {Array<Object>} Nouveaux badges à débloqués
 */
export const checkAchievements = (userData, unlockedBadges = []) => {
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));
  
  const newBadges = ALL_BADGES.filter(badge => {
    // Ignorer si déjà débloqué
    if (unlockedIds.has(badge.id)) {
      return false;
    }
    
    // Vérifier condition
    try {
      return badge.condition(userData);
    } catch (error) {
      log.warn(`Erreur condition badge ${badge.id}:`, error);
      return false;
    }
  });
  
  return newBadges;
};

// ==================== GESTION XP & NIVEAUX ====================

/**
 * Ajoute de l'XP et vérifie level up
 * 
 * @param {number} points - Points XP à ajouter
 * @param {string} reason - Raison (pour historique)
 * @param {Object} currentState - État actuel {currentXP, level}
 * @returns {Promise<Object>} Nouvel état {newXP, newLevel, leveledUp}
 */
export const addExperience = async (points, reason, currentState) => {
  try {
    const { currentXP = 0, level = 1 } = currentState;
    const newXP = currentXP + points;
    const xpForNextLevel = getXPForLevel(level + 1);
    
    let newLevel = level;
    let leveledUp = false;
    
    // Vérifier level up
    if (newXP >= xpForNextLevel) {
      newLevel = level + 1;
      leveledUp = true;
      
      // Log level up
      await logLevelUp(newLevel);
    }
    
    // Mettre à jour XP
    await updateExperience(newXP, newLevel);
    
    // Log historique XP
    await logXPGain(points, reason);
    
    return {
      newXP,
      newLevel,
      leveledUp,
      xpForNextLevel: getXPForLevel(newLevel + 1),
      xpProgress: newLevel > level ? 0 : newXP - getXPForLevel(level),
      xpNeeded: newLevel > level ? getXPForLevel(newLevel + 1) : xpForNextLevel - newXP
    };
  } catch (error) {
    log.error('Erreur addExperience:', error);
    return currentState;
  }
};

// ==================== CRUD INDEXEDDB ====================

/**
 * Récupère toutes les données de gamification
 * 
 * @returns {Promise<Object>} {achievements, experience, streaks}
 */
export const getGamificationData = async () => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour getGamificationData');
      return {
        achievements: [],
        experience: { currentXP: 0, level: 1, history: [] },
        streaks: { nutrition: { current: 0, actual: 0 } }
      };
    }

    const tx = db.transaction([STORE_GAMIFICATION], 'readonly');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const allData = request.result || [];
        
        // Séparer par type
        const achievements = allData.filter(d => d.type === 'achievement');
        const experience = allData.find(d => d.type === 'experience') || {
          type: 'experience',
          id: 'experience_main',
          currentXP: 0,
          level: 1,
          history: []
        };
        const streaks = allData.filter(d => d.type === 'streak');
        
        resolve({
          achievements,
          experience,
          streaks: {
            nutrition: streaks.find(s => s.category === 'nutrition') || {
              type: 'streak',
              id: 'streak_nutrition',
              category: 'nutrition',
              current: 0,
              actual: 0,
              forgivenessUsed: 0,
              maxReached: false,
              status: 'active'
            }
          }
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur getGamificationData:', error);
    return {
      achievements: [],
      experience: { currentXP: 0, level: 1, history: [] },
      streaks: { nutrition: { current: 0, actual: 0 } }
    };
  }
};

/**
 * Sauvegarde un achievement (badge débloqué)
 * 
 * @param {Object} achievement - Badge débloqué
 * @returns {Promise<boolean>} true si succès
 */
export const saveAchievement = async (achievement) => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour saveAchievement');
      return false;
    }

    const dataToSave = {
      ...achievement,
      type: 'achievement',
      id: achievement.id || `achievement_${Date.now()}`,
      unlockedDate: achievement.unlockedDate || new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => {
        log.debug(`Achievement sauvegardé: ${dataToSave.id}`);
        resolve(true);
      };
      request.onerror = () => {
        log.error('Erreur saveAchievement:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Erreur saveAchievement:', error);
    return false;
  }
};

/**
 * Met à jour l'XP et le niveau
 * 
 * @param {number} xp - Nouveau XP total
 * @param {number} level - Nouveau niveau
 * @returns {Promise<boolean>} true si succès
 */
export const updateExperience = async (xp, level) => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour updateExperience');
      return false;
    }

    const dataToSave = {
      type: 'experience',
      id: 'experience_main',
      currentXP: xp,
      level: level,
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => {
        log.debug(`Experience mise à jour: Level ${level}, XP ${xp}`);
        resolve(true);
      };
      request.onerror = () => {
        log.error('Erreur updateExperience:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Erreur updateExperience:', error);
    return false;
  }
};

/**
 * Met à jour les streaks
 * 
 * @param {Object} streakData - Données streak
 * @returns {Promise<boolean>} true si succès
 */
export const updateStreak = async (streakData) => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour updateStreak');
      return false;
    }

    const dataToSave = {
      ...streakData,
      type: 'streak',
      id: streakData.id || `streak_${streakData.category}`,
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => {
        log.debug(`Streak mise à jour: ${streakData.category} = ${streakData.current}`);
        resolve(true);
      };
      request.onerror = () => {
        log.error('Erreur updateStreak:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Erreur updateStreak:', error);
    return false;
  }
};

/**
 * Log historique XP
 * 
 * @param {number} points - Points gagnés
 * @param {string} reason - Raison
 * @returns {Promise<boolean>} true si succès
 */
const logXPGain = async (points, reason) => {
  try {
    const db = await openNutritionDB();
    if (!db) return false;

    const logEntry = {
      type: 'xp_log',
      id: `xp_log_${Date.now()}`,
      points,
      reason,
      timestamp: new Date().toISOString()
    };

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve) => {
      const request = store.add(logEntry);
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        log.warn('Erreur logXPGain (non critique):', request.error);
        resolve(false); // Non critique, ne pas bloquer
      };
    });
  } catch (error) {
    log.warn('Erreur logXPGain (non critique):', error);
    return false;
  }
};

/**
 * Log level up
 * 
 * @param {number} level - Nouveau niveau
 * @returns {Promise<boolean>} true si succès
 */
const logLevelUp = async (level) => {
  try {
    const db = await openNutritionDB();
    if (!db) return false;

    const logEntry = {
      type: 'level_up',
      id: `level_up_${Date.now()}`,
      level,
      timestamp: new Date().toISOString()
    };

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve) => {
      const request = store.add(logEntry);
      request.onsuccess = () => {
        log.info(`🎉 Level Up ! Niveau ${level}`);
        resolve(true);
      };
      request.onerror = () => {
        log.warn('Erreur logLevelUp (non critique):', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    log.warn('Erreur logLevelUp (non critique):', error);
    return false;
  }
};

// ==================== DÉBLOCAGE BADGE ====================

/**
 * Débloque un badge et ajoute XP
 * 
 * @param {Object} badge - Badge à débloquer
 * @param {Object} userData - Données utilisateur (pour currentValue)
 * @returns {Promise<Object>} Achievement débloqué
 */
export const unlockAchievement = async (badge, userData) => {
  try {
    // Calculer points avec multiplicateur rareté
    const rarityMultiplier = BADGE_RARITY[badge.rarity]?.multiplier || 1;
    const points = badge.points * rarityMultiplier;
    
    // Créer achievement
    const achievement = {
      ...badge,
      type: 'achievement',
      unlockedDate: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    
    // Sauvegarder badge
    await saveAchievement(achievement);
    
    // Ajouter XP
    const currentGamification = await getGamificationData();
    await addExperience(
      points,
      `Badge débloqué: ${badge.name}`,
      currentGamification.experience
    );
    
    log.info(`🏆 Badge débloqué: ${badge.name} (+${points} XP)`);
    
    return achievement;
  } catch (error) {
    log.error('Erreur unlockAchievement:', error);
    return null;
  }
};

