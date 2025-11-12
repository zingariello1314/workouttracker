/**
 * Web Worker pour traitements lourds de synchronisation Garmin.
 * 
 * Délègue les calculs intensifs au thread de travail pour ne pas bloquer
 * le main thread de l'application.
 * 
 * Traitements supportés :
 * - Enrichissement d'activités massives (calculs de statistiques)
 * - Construction de heatmap d'activités
 * - Agrégations de données temporelles
 * - Calculs de corrélations
 * 
 * @module syncWorker
 */

/**
 * Normalise une valeur d'activité (distance, durée, etc.)
 */
function normalizeActivityValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  return 0;
}

/**
 * Construit une heatmap d'activités par date
 * 
 * @param {Object} activities - Activités groupées par type
 * @param {Array<string>} filteredDates - Dates à inclure
 * @returns {Object} Heatmap par date et par semaine
 */
function buildActivityHeatmap(activities = {}, filteredDates = []) {
  const resultByDate = {};

  const ensureDayEntry = (date) => {
    if (!resultByDate[date]) {
      resultByDate[date] = {
        date,
        total: 0,
        swimming: 0,
        jumpRope: 0,
        cardio: 0,
        distance: 0,
        duration: 0
      };
    }
    return resultByDate[date];
  };

  const incrementDay = (date, field, activity) => {
    const entry = ensureDayEntry(date);
    entry.total += 1;
    entry[field] += 1;
    entry.distance += normalizeActivityValue(activity?.distance);
    entry.duration += normalizeActivityValue(activity?.duration);
  };

  ['swimming', 'jumpRope', 'cardio'].forEach((type) => {
    const acts = activities?.[type] || [];
    acts.forEach((activity) => {
      const date = activity?.date;
      if (!date || !filteredDates.includes(date)) return;
      const field = type === 'swimming' ? 'swimming' : type === 'jumpRope' ? 'jumpRope' : 'cardio';
      incrementDay(date, field, activity);
    });
  });

  const weeklyData = {};

  filteredDates.forEach((date) => {
    const current = new Date(date);
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - current.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekKey,
        days: {},
        total: 0,
        swimming: 0,
        jumpRope: 0,
        cardio: 0,
        distance: 0,
        duration: 0
      };
    }

    const dayEntry = resultByDate[date];
    if (dayEntry) {
      weeklyData[weekKey].days[date] = { ...dayEntry };
      weeklyData[weekKey].total += dayEntry.total;
      weeklyData[weekKey].swimming += dayEntry.swimming;
      weeklyData[weekKey].jumpRope += dayEntry.jumpRope;
      weeklyData[weekKey].cardio += dayEntry.cardio;
      weeklyData[weekKey].distance += dayEntry.distance;
      weeklyData[weekKey].duration += dayEntry.duration;
    }
  });

  return {
    byDate: resultByDate,
    byWeek: weeklyData
  };
}

/**
 * Enrichit une activité avec des statistiques calculées
 * 
 * @param {Object} activity - Activité à enrichir
 * @returns {Object} Activité enrichie
 */
function enrichActivity(activity) {
  if (!activity || typeof activity !== 'object') {
    return activity;
  }

  const enriched = { ...activity };

  // Calculer la vitesse moyenne si distance et durée disponibles
  if (enriched.distance && enriched.duration && enriched.duration > 0) {
    enriched.avgSpeed = enriched.distance / enriched.duration; // km/h si distance en km et durée en heures
  }

  // Calculer le rythme (minutes par km) pour la course
  if (enriched.distance && enriched.distance > 0 && enriched.duration) {
    const hours = enriched.duration / 3600; // Convertir secondes en heures
    if (hours > 0) {
      const kmPerHour = enriched.distance / hours;
      enriched.pace = 60 / kmPerHour; // Minutes par km
    }
  }

  // Calculer les calories par minute si disponibles
  if (enriched.calories && enriched.duration && enriched.duration > 0) {
    const minutes = enriched.duration / 60;
    enriched.caloriesPerMinute = enriched.calories / minutes;
  }

  return enriched;
}

/**
 * Enrichit un tableau d'activités avec des statistiques
 * 
 * @param {Array} activities - Activités à enrichir
 * @returns {Array} Activités enrichies
 */
function enrichActivities(activities = []) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return activities;
  }

  return activities.map(activity => enrichActivity(activity));
}

/**
 * Calcule des statistiques agrégées sur un ensemble d'activités
 * 
 * @param {Object} activities - Activités groupées par type
 * @returns {Object} Statistiques agrégées
 */
function computeActivityStats(activities = {}) {
  const stats = {
    total: 0,
    byType: {
      swimming: 0,
      jumpRope: 0,
      cardio: 0
    },
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    avgDistance: 0,
    avgDuration: 0,
    avgCalories: 0
  };

  ['swimming', 'jumpRope', 'cardio'].forEach((type) => {
    const acts = activities[type] || [];
    acts.forEach((activity) => {
      stats.total += 1;
      stats.byType[type] += 1;
      stats.totalDistance += normalizeActivityValue(activity?.distance);
      stats.totalDuration += normalizeActivityValue(activity?.duration);
      stats.totalCalories += normalizeActivityValue(activity?.calories);
    });
  });

  if (stats.total > 0) {
    stats.avgDistance = stats.totalDistance / stats.total;
    stats.avgDuration = stats.totalDuration / stats.total;
    stats.avgCalories = stats.totalCalories / stats.total;
  }

  return stats;
}

/**
 * Gestionnaire de messages du Worker
 */
self.addEventListener('message', (event) => {
  const { type, payload, requestId } = event.data;

  try {
    let result = null;

    switch (type) {
      case 'BUILD_ACTIVITY_HEATMAP': {
        const { activities, filteredDates } = payload;
        result = buildActivityHeatmap(activities, filteredDates);
        break;
      }

      case 'ENRICH_ACTIVITIES': {
        const { activities } = payload;
        result = enrichActivities(activities);
        break;
      }

      case 'COMPUTE_ACTIVITY_STATS': {
        const { activities } = payload;
        result = computeActivityStats(activities);
        break;
      }

      case 'BATCH_ENRICH': {
        // Traitement par batch pour éviter de bloquer le worker
        const { activities, batchSize = 100 } = payload;
        const enriched = [];
        
        for (let i = 0; i < activities.length; i += batchSize) {
          const batch = activities.slice(i, i + batchSize);
          const enrichedBatch = enrichActivities(batch);
          enriched.push(...enrichedBatch);
          
          // Envoyer un progress update
          self.postMessage({
            type: 'PROGRESS',
            requestId,
            progress: {
              processed: Math.min(i + batchSize, activities.length),
              total: activities.length,
              percentage: Math.round(((i + batchSize) / activities.length) * 100)
            }
          });
        }
        
        result = enriched;
        break;
      }

      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }

    // Envoyer le résultat
    self.postMessage({
      type: 'SUCCESS',
      requestId,
      result
    });

  } catch (error) {
    // Envoyer l'erreur
    self.postMessage({
      type: 'ERROR',
      requestId,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// Message de démarrage
self.postMessage({ type: 'WORKER_READY' });


