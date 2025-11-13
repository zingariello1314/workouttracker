/**
 * Utilitaires pour le traitement des activités Garmin
 * 
 * @module activityUtils
 */

/**
 * Compte le total d'activités depuis un objet activitiesByType
 * 
 * @param {Object} activities - Objet contenant les activités groupées par type
 * @param {Array} activities.swimming - Liste des activités de natation
 * @param {Array} activities.jumpRope - Liste des activités de corde à sauter
 * @param {Array} activities.cardio - Liste des activités cardio
 * @returns {number} Nombre total d'activités
 */
export const countTotalActivities = (activities = {}) => {
  if (!activities || typeof activities !== 'object') {
    return 0;
  }

  const swimmingCount = Array.isArray(activities.swimming) ? activities.swimming.length : 0;
  const jumpRopeCount = Array.isArray(activities.jumpRope) ? activities.jumpRope.length : 0;
  const cardioCount = Array.isArray(activities.cardio) ? activities.cardio.length : 0;

  return swimmingCount + jumpRopeCount + cardioCount;
};

/**
 * Seuil pour utiliser le worker (activités)
 */
export const WORKER_ACTIVITY_THRESHOLD = 1000;

/**
 * Détermine si le worker doit être utilisé pour le traitement
 * 
 * @param {Object} activities - Objet contenant les activités
 * @returns {boolean} true si le worker doit être utilisé
 */
export const shouldUseWorker = (activities = {}) => {
  return countTotalActivities(activities) >= WORKER_ACTIVITY_THRESHOLD;
};



