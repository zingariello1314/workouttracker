/**
 * Utilitaires pour générer des clés de stabilité basées sur le contenu des données.
 * 
 * Permet de détecter les changements réels de contenu même si les références d'objets changent,
 * optimisant ainsi la mémoïsation React.
 * 
 * @module utils/dataStability
 */

/**
 * Génère une clé de stabilité pour un objet d'activités.
 * 
 * @param {Object} activities - Objet avec swimming, jumpRope, cardio
 * @returns {string} Clé de stabilité
 */
export const getActivitiesStabilityKey = (activities) => {
  if (!activities || typeof activities !== 'object') {
    return 'empty';
  }

  const swimming = activities.swimming || [];
  const jumpRope = activities.jumpRope || [];
  const cardio = activities.cardio || [];

  // Utiliser les IDs des 10 premiers + 10 derniers de chaque type pour détecter changements
  const getIds = (arr, max = 10) => {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    const first = arr.slice(0, max).map(a => a.id || `${a.date}_${a.time || ''}`).join('|');
    const last = arr.length > max 
      ? arr.slice(-max).map(a => a.id || `${a.date}_${a.time || ''}`).join('|')
      : '';
    return `${arr.length}_${first}${last ? `_${last}` : ''}`;
  };

  return `a:${getIds(swimming)}:${getIds(jumpRope)}:${getIds(cardio)}`;
};

/**
 * Génère une clé de stabilité pour un objet de métriques quotidiennes.
 * 
 * @param {Object} dailyMetrics - Objet avec métriques par date
 * @returns {string} Clé de stabilité
 */
export const getDailyMetricsStabilityKey = (dailyMetrics) => {
  if (!dailyMetrics || typeof dailyMetrics !== 'object') {
    return 'empty';
  }

  const dates = Object.keys(dailyMetrics).sort();
  if (dates.length === 0) {
    return 'empty';
  }

  // Utiliser les 10 premières + 10 dernières dates + longueur totale
  const firstDates = dates.slice(0, 10).join('|');
  const lastDates = dates.length > 10 ? dates.slice(-10).join('|') : '';
  
  // Ajouter un hash simple basé sur quelques valeurs clés pour détecter changements de contenu
  const sampleDates = dates.slice(0, 5).concat(dates.slice(-5));
  const sampleHash = sampleDates
    .map(date => {
      const metrics = dailyMetrics[date];
      if (!metrics) return '';
      // Utiliser quelques champs clés pour détecter changements
      return `${metrics.steps || 0}_${metrics.calories?.total || 0}_${metrics.heartRate?.resting || 0}`;
    })
    .join('|');

  return `m:${dates.length}_${firstDates}${lastDates ? `_${lastDates}` : ''}_${sampleHash}`;
};

/**
 * Génère une clé de stabilité pour l'objet garminData complet.
 * 
 * @param {Object} garminData - Objet avec activities et dailyMetrics
 * @returns {string} Clé de stabilité
 */
export const getGarminDataStabilityKey = (garminData) => {
  if (!garminData || typeof garminData !== 'object') {
    return 'empty';
  }

  const activitiesKey = getActivitiesStabilityKey(garminData.activities);
  const metricsKey = getDailyMetricsStabilityKey(garminData.dailyMetrics);

  return `${activitiesKey}:${metricsKey}`;
};

