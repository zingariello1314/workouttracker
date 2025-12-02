/**
 * Web Worker pour calculs lourds du module Apprentissage
 * Déporte les calculs de niveau, XP, badges et trophées hors du thread principal
 */

// Configuration XP (doit correspondre à apprentissageConstants.js)
const XP_CONFIG = {
  level_formula: (level) => Math.floor(Math.pow(level, 1.8) * 150),
};

// Badges par niveau
const SUBJECT_BADGES = {
  1: { icon: '🔰', name: 'Novice', color: '#6b7280' },
  3: { icon: '📖', name: 'Apprenti', color: '#3b82f6' },
  5: { icon: '🎒', name: 'Étudiant', color: '#10b981' },
  8: { icon: '📜', name: 'Érudit', color: '#8b5cf6' },
  12: { icon: '🎓', name: 'Expert', color: '#f59e0b' },
  20: { icon: '👑', name: 'Maître', color: '#ef4444' },
  30: { icon: '⚡', name: 'Légende', color: '#ffd700' },
  50: { icon: '🌟', name: 'Immortel', color: '#ff1493' },
};

/**
 * Calculer le niveau à partir de l'XP
 */
const calculateLevel = (xp) => {
  let level = 1;
  while (XP_CONFIG.level_formula(level) <= xp) {
    level++;
  }
  return level - 1;
};

/**
 * Obtenir le badge pour un niveau donné
 */
const getSubjectBadge = (level) => {
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
const calculateSubjectProgression = (xp) => {
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

/**
 * Calculer les progressions pour plusieurs matières
 */
const calculateMultipleProgressions = (subjectsData) => {
  return subjectsData.map(({ name, xp }) => ({
    name,
    progression: calculateSubjectProgression(xp),
  }));
};

/**
 * Écouter les messages du thread principal
 */
self.onmessage = function (e) {
  const { type, data, id } = e.data;

  try {
    let result;

    switch (type) {
      case 'CALCULATE_LEVEL':
        result = calculateLevel(data.xp);
        break;

      case 'CALCULATE_BADGE':
        result = getSubjectBadge(data.level);
        break;

      case 'CALCULATE_PROGRESSION':
        result = calculateSubjectProgression(data.xp);
        break;

      case 'CALCULATE_MULTIPLE_PROGRESSIONS':
        result = calculateMultipleProgressions(data.subjects);
        break;

      default:
        throw new Error(`Type de calcul inconnu: ${type}`);
    }

    // Envoyer le résultat
    self.postMessage({
      id,
      success: true,
      result,
    });
  } catch (error) {
    // Envoyer l'erreur
    self.postMessage({
      id,
      success: false,
      error: error.message,
    });
  }
};

