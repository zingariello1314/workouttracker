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
import { DateHelper } from '../../utils/dateHelper';
import { ALL_BADGES } from './badges';
import { NutritionConfig } from '../../config/nutrition.config';

const log = logger.module('nutritionGamification');

// ==================== CONSTANTES ====================

// Points XP selon actions
// ✅ PHASE 12.3 : Utiliser configuration centralisée
export const XP_REWARDS = {
  meal_logged: NutritionConfig.gamification.xpRewards.mealLogged,
  day_complete: NutritionConfig.gamification.xpRewards.dayComplete,
  program_compliant: NutritionConfig.gamification.xpRewards.programCompliant,
  badge_unlocked: NutritionConfig.gamification.xpRewards.badgeUnlocked,
  streak_milestone: NutritionConfig.gamification.xpRewards.streakMilestone
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
// ✅ Tous les badges sont maintenant définis dans badges/ (modularisé par difficulté)
// Import des 100 badges organisés par difficulté depuis badges/index.js
// Les anciens badges (CONSISTENCY_BADGES, NUTRITION_BADGES, PROGRESSION_BADGES) 
// sont conservés pour compatibilité mais ne sont plus utilisés
// Utiliser ALL_BADGES depuis badges/

// ==================== CALCUL STREAKS AVEC FORGIVENESS ====================

/**
 * Vérifie qu'un jour a des données nutritionnelles réelles (au moins un repas avec des aliments)
 * Nécessaire pour éviter que les streaks comptent des jours sans données réelles
 */
const hasRealNutritionData = (dayData) => {
  if (!dayData || !dayData.meals || dayData.meals.length === 0) return false;
  
  // Vérifier qu'au moins un repas a des aliments (foods)
  return dayData.meals.some(meal => {
    const foods = meal.foods || [];
    // Vérifier qu'il y a des aliments ET qu'ils ont des valeurs nutritionnelles
    return foods.length > 0 && foods.some(food => {
      // Vérifier qu'au moins un aliment a des calories ou des macros
      return (food.calories || 0) > 0 || 
             (food.protein || 0) > 0 || 
             (food.carbs || 0) > 0 || 
             (food.fat || 0) > 0;
    });
  });
};

/**
 * Calcule les streaks avec forgiveness (2 jours tolérés)
 * 
 * @param {Array<Object>} history - Historique dailyMeals [{date, hasMeals, meals}, ...]
 * @param {string} type - Type de streak ('nutrition' | 'workout')
 * @returns {Object} {current, actual, forgivenessUsed, maxReached, status}
 */
export const calculateStreakWithForgiveness = (history, type = 'nutrition') => {
  let streak = 0;
  let forgiveness = 2; // 2 jours manqués tolérés
  
  // ✅ OPTIMISATION 1.3 : Créer Map<date, dayData> pour accès O(1) au lieu de .find() O(n)
  const historyByDate = new Map();
  history.forEach(dayData => {
    if (dayData.date) {
      historyByDate.set(dayData.date, dayData);
    }
  });
  
  // ✅ OPTIMISATION 2.2 : Utiliser DateHelper pour garantir timezone locale
  const today = DateHelper.getTodayLocal();
  
  // Parcourir depuis aujourd'hui vers le passé
  for (let i = 0; i < 365; i++) {
    const checkDateStr = DateHelper.getDaysAgoLocal(i); // ✅ DateHelper garantit timezone locale
    
    // ✅ OPTIMISATION 1.3 : Accès O(1) au lieu de .find() O(n)
    const dayData = historyByDate.get(checkDateStr);
    
    // ✅ CORRECTION : Vérifier qu'il y a des données nutritionnelles réelles pour nutrition
    let hasData = false;
    if (type === 'nutrition') {
      hasData = dayData && hasRealNutritionData(dayData);
    } else if (type === 'workout') {
      hasData = dayData && (dayData.workouts?.length > 0 || dayData.hasWorkouts);
    } else {
      hasData = dayData && (
        hasRealNutritionData(dayData) || 
        (dayData.workouts?.length > 0 || dayData.hasWorkouts)
      );
    }
    
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
 * Supprime ou réinitialise une streak
 * 
 * @param {string} category - Catégorie de streak ('nutrition' | 'workout')
 * @returns {Promise<boolean>} true si succès
 */
export const resetStreak = async (category = 'nutrition') => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return false;
    }

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve) => {
      const request = store.delete(`streak_${category}`);
      request.onsuccess = () => {
        resolve(true);
      };
      request.onerror = () => {
        // Si la streak n'existe pas, ce n'est pas grave
        resolve(true);
      };
    });
  } catch (error) {
    log.error('Erreur resetStreak:', error);
    return false;
  }
};

/**
 * Supprime un achievement (badge débloqué)
 * 
 * @param {string} achievementId - ID du badge à supprimer
 * @returns {Promise<boolean>} true si succès
 */
export const deleteAchievement = async (achievementId) => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour deleteAchievement');
      return false;
    }

    const tx = db.transaction([STORE_GAMIFICATION], 'readwrite');
    const store = tx.objectStore(STORE_GAMIFICATION);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(achievementId);
      request.onsuccess = () => {
        // Log réduit pour éviter spam
        resolve(true);
      };
      request.onerror = () => {
        log.error('Erreur deleteAchievement:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Erreur deleteAchievement:', error);
    return false;
  }
};

/**
 * Revérifie les badges débloqués et supprime ceux qui ne remplissent plus les conditions
 * 
 * @param {Object} userData - Données utilisateur actuelles
 * @param {Array<Object>} unlockedBadges - Badges actuellement débloqués
 * @returns {Promise<Array<string>>} Liste des IDs des badges supprimés
 */
export const revalidateAchievements = async (userData, unlockedBadges = []) => {
  try {
    if (!unlockedBadges || unlockedBadges.length === 0) {
      return [];
    }

    const badgesToRemove = [];
    const badgeDefinitionsMap = new Map(ALL_BADGES.map(b => [b.id, b]));

    // Vérifier chaque badge débloqué
    for (const unlockedBadge of unlockedBadges) {
      const badgeDef = badgeDefinitionsMap.get(unlockedBadge.id);
      
      if (!badgeDef) {
        // Badge n'existe plus dans les définitions, supprimer
        badgesToRemove.push(unlockedBadge.id);
        continue;
      }

      // Revérifier la condition
      try {
        const stillValid = badgeDef.condition(userData);
        if (!stillValid) {
          // Badge ne remplit plus les conditions, supprimer
          badgesToRemove.push(unlockedBadge.id);
        }
      } catch (error) {
        log.warn(`Erreur revalidation badge ${unlockedBadge.id}:`, error);
        // En cas d'erreur, garder le badge (ne pas supprimer par sécurité)
      }
    }

    // Supprimer les badges invalides (sans logs pour éviter spam)
    if (badgesToRemove.length > 0) {
      await Promise.all(badgesToRemove.map(id => deleteAchievement(id)));
    }

    return badgesToRemove;
  } catch (error) {
    log.error('Erreur revalidateAchievements:', error);
    return [];
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

    // ✅ OPTIMISATION : Supprimer propriétés non-clonables (fonctions) avant sauvegarde IndexedDB
    // IndexedDB ne peut pas cloner des fonctions, il faut donc retirer `condition`
    const { condition, ...achievementWithoutFunctions } = achievement;

    const dataToSave = {
      ...achievementWithoutFunctions,
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
        // Log supprimé pour éviter spam
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
        // Log supprimé pour éviter spam
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
        // Log réduit pour éviter spam (seulement si changement significatif)
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
        // Log réduit pour éviter spam - seulement si important
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
    
    // Log réduit pour éviter spam - seulement en mode verbose si nécessaire
    
    return achievement;
  } catch (error) {
    log.error('Erreur unlockAchievement:', error);
    return null;
  }
};

