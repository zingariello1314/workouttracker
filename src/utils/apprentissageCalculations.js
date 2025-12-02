/**
 * Fonctions de calcul synchrones (fallback si Web Worker indisponible)
 * Ces fonctions sont aussi utilisées dans le worker
 */

import { XP_CONFIG, SUBJECT_BADGES } from './apprentissageConstants';

/**
 * Calculer le niveau à partir de l'XP
 */
export const calculateLevel = (xp) => {
  let level = 1;
  while (XP_CONFIG.level_formula(level) <= xp) {
    level++;
  }
  return level - 1;
};

/**
 * Obtenir le badge pour un niveau donné
 */
export const getSubjectBadge = (level) => {
  const badgeLevels = Object.keys(SUBJECT_BADGES)
    .map(Number)
    .sort((a, b) => b - a);
  
  let result = SUBJECT_BADGES[1];
  for (const badgeLevel of badgeLevels) {
    if (level >= badgeLevel) {
      result = SUBJECT_BADGES[badgeLevel];
      break;
    }
  }
  return result;
};

/**
 * Calculer la progression complète d'une matière
 */
export const calculateSubjectProgression = (xp) => {
  const level = calculateLevel(xp);
  const nextLevelXP = XP_CONFIG.level_formula(level + 1);
  const currentLevelXP = level > 1 ? xp - XP_CONFIG.level_formula(level) : xp;
  const progress = nextLevelXP > 0 
    ? (currentLevelXP / (nextLevelXP - (level > 1 ? XP_CONFIG.level_formula(level) : 0))) * 100 
    : 0;

  return {
    level,
    xp,
    progress: Math.min(progress, 100),
    currentLevelXP,
    nextLevelXP,
    badge: getSubjectBadge(level),
  };
};

