import { parseDurationToMinutes } from './calendarUtils';
import { isGarminWalkingLikeActivity, isGarminRunningLikeActivity } from './garminRunningLaps';

/**
 * Utilitaires pour l'intégration des données Garmin dans le calendrier
 * 
 * Principe : Les données Garmin sont des MESURES PRÉCISES pendant l'activité,
 * pas des activités supplémentaires. Elles servent à RECALIBRER et AMÉLIORER
 * la précision des métriques, pas à créer des doublons.
 */

/**
 * Obtient la meilleure distance de natation AVANT une date donnée
 * @param {Object} garminData - Données Garmin complètes
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {number} Meilleure distance en mètres
 */
export function getMeilleureDistanceNatation(garminData, date) {
  if (!garminData?.activities?.swimming) return 0;
  
  const dateObj = new Date(date);
  const natationsAvant = garminData.activities.swimming
    .filter(act => {
      const actDate = new Date(act.date);
      return actDate < dateObj;
    })
    .map(act => act.distance || act.totalDistance || 0);
  
  return natationsAvant.length > 0 ? Math.max(...natationsAvant) : 0;
}

/**
 * Obtient le meilleur nombre de sauts AVANT une date donnée
 * @param {Object} garminData - Données Garmin complètes
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {number} Meilleur nombre de sauts
 */
export function getMeilleurNombreSauts(garminData, date) {
  if (!garminData?.activities?.jumpRope) return 0;
  
  const dateObj = new Date(date);
  const sautsAvant = garminData.activities.jumpRope
    .filter(act => {
      const actDate = new Date(act.date);
      return actDate < dateObj;
    })
    .map(act => act.jumps || 0);
  
  return sautsAvant.length > 0 ? Math.max(...sautsAvant) : 0;
}

/**
 * Obtient la moyenne des calories actives sur les 7 derniers jours
 * @param {Object} garminData - Données Garmin complètes
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {number} Moyenne des calories actives sur 7 jours
 */
export function getMoyenneCalories7Jours(garminData, date) {
  if (!garminData?.dailyMetrics) return 0;
  
  const dateObj = new Date(date);
  const calories7Jours = [];
  
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(dateObj);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const calories = garminData.dailyMetrics[dateStr]?.calories?.active || 0;
    if (calories > 0) calories7Jours.push(calories);
  }
  
  return calories7Jours.length > 0 
    ? calories7Jours.reduce((sum, c) => sum + c, 0) / calories7Jours.length 
    : 0;
}

/**
 * Calcule l'intensité d'une journée en combinant les données workout et Garmin
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {Object} workoutIntensity - Intensité calculée par la logique workout actuelle
 * @param {Object} garminData - Données Garmin complètes
 * @returns {Object} Intensité ajustée avec multiplicateur et ajustements appliqués
 */
export function calculateDayIntensityWithGarmin(date, workoutIntensity, garminData) {
  if (!garminData || !workoutIntensity) {
    return {
      level: workoutIntensity?.level || 0,
      multiplier: 1.0,
      adjustments: {
        timeReal: null,
        swimmingRecord: null,
        jumpRopeRecord: null,
        caloriesActive: null
      }
    };
  }

  let intensityMultiplier = 1.0;
  const adjustments = {
    timeReal: null,
    swimmingRecord: null,
    jumpRopeRecord: null,
    caloriesActive: null
  };

  // ==========================================
  // 1. AJUSTEMENT TEMPS RÉEL vs PRÉVU
  // ==========================================
  const tempsPrévu = workoutIntensity.duration || 0;
  
  // Calculer le temps réel d'activité cardio Garmin pour cette date (durées en secondes côté Garmin)
  const activitésCardio = (garminData.activities?.cardio || []).filter((act) => act.date === date);
  const tempsRéel = activitésCardio.reduce((sum, act) => {
    if (act.duration != null) {
      return sum + parseDurationToMinutes(act.duration, 'garminCalendarUtils.timeReal.duration');
    }
    if (act.totalTime != null) {
      const n = Number(act.totalTime);
      return sum + (Number.isFinite(n) ? (n > 200 ? Math.round(n / 60) : n) : 0);
    }
    if (act.elapsedTime != null) {
      const n = Number(act.elapsedTime);
      return sum + (Number.isFinite(n) ? Math.round(n / 60) : 0);
    }
    return sum;
  }, 0);

  if (tempsRéel > 0 && tempsPrévu > 0) {
    const ratioTemps = tempsRéel / tempsPrévu;
    adjustments.timeReal = { prévu: tempsPrévu, réel: tempsRéel, ratio: ratioTemps };
    
    // Si temps réel > temps prévu (10% de dépassement), augmenter intensité
    if (ratioTemps > 1.1) {
      intensityMultiplier *= 1.2; // +20% si 10% de dépassement
    } else if (ratioTemps > 0.9 && ratioTemps <= 1.1) {
      // Normal, pas d'ajustement
    } else if (ratioTemps < 0.9) {
      intensityMultiplier *= 0.9; // -10% si moins que prévu
    }
  }

  // ==========================================
  // 2. BONUS RECORD NATATION
  // ==========================================
  const natationJour = (garminData.activities?.swimming || []).filter(act => act.date === date);
  
  if (natationJour.length > 0) {
    const distanceJour = natationJour.reduce((sum, act) => sum + (act.distance || act.totalDistance || 0), 0);
    const meilleureDistance = getMeilleureDistanceNatation(garminData, date);
    
    if (distanceJour > 0 && meilleureDistance >= 0) {
      adjustments.swimmingRecord = { distance: distanceJour, record: meilleureDistance };
      
      if (distanceJour > meilleureDistance && meilleureDistance > 0) {
        // Nouveau record ! Bonus significatif
        intensityMultiplier *= 1.3; // +30% pour record natation
      } else if (distanceJour > meilleureDistance * 0.8 && meilleureDistance > 0) {
        // Proche du record
        intensityMultiplier *= 1.1; // +10% si proche du record
      }
      // Si pas de record précédent (meilleureDistance === 0), pas de bonus
    }
  }

  // ==========================================
  // 3. BONUS RECORD CORDE À SAUTER
  // ==========================================
  const cordeJour = (garminData.activities?.jumpRope || []).filter(act => act.date === date);
  
  if (cordeJour.length > 0) {
    const sautsJour = cordeJour.reduce((sum, act) => sum + (act.jumps || 0), 0);
    const meilleurNombreSauts = getMeilleurNombreSauts(garminData, date);
    
    if (sautsJour > 0 && meilleurNombreSauts >= 0) {
      adjustments.jumpRopeRecord = { sauts: sautsJour, record: meilleurNombreSauts };
      
      if (sautsJour > meilleurNombreSauts && meilleurNombreSauts > 0) {
        // Nouveau record ! Bonus significatif
        intensityMultiplier *= 1.25; // +25% pour record sauts
      } else if (sautsJour > meilleurNombreSauts * 0.8 && meilleurNombreSauts > 0) {
        // Proche du record
        intensityMultiplier *= 1.1; // +10% si proche du record
      }
    }
  }

  // ==========================================
  // 4. AJUSTEMENT CALORIES ACTIVES (LÉGER)
  // ==========================================
  const caloriesJour = garminData.dailyMetrics?.[date]?.calories?.active || 0;
  const moyenne7Jours = getMoyenneCalories7Jours(garminData, date);
  
  if (caloriesJour > 0 && moyenne7Jours > 0) {
    const ratio = caloriesJour / moyenne7Jours;
    adjustments.caloriesActive = { calories: caloriesJour, moyenne: moyenne7Jours, ratio };
    
    if (ratio > 1.2) {
      // 20% au-dessus de la moyenne → léger bonus
      intensityMultiplier *= 1.05; // +5% si 20% au-dessus moyenne
    }
    // Pas de diminution si en dessous (peut être normal selon le type d'entraînement)
  }

  // ==========================================
  // LIMITES DE SÉCURITÉ
  // ==========================================
  // Ne jamais dépasser 1.5x l'intensité de base
  if (intensityMultiplier > 1.5) intensityMultiplier = 1.5;
  // Ne jamais descendre en dessous de 0.5x
  if (intensityMultiplier < 0.5) intensityMultiplier = 0.5;

  // Calculer le niveau d'intensité final
  // Le niveau reste entre 0 et 4, mais on peut ajuster légèrement si nécessaire
  let finalLevel = workoutIntensity.level || 0;
  
  // Si le multiplicateur est significatif, on peut ajuster le niveau
  // Mais de manière conservative pour ne pas casser la logique existante
  if (intensityMultiplier > 1.2 && finalLevel < 4) {
    // Si très bon multiplicateur et niveau pas max, on peut augmenter d'un niveau
    finalLevel = Math.min(finalLevel + 1, 4);
  } else if (intensityMultiplier < 0.8 && finalLevel > 0) {
    // Si multiplicateur faible, on peut diminuer d'un niveau
    finalLevel = Math.max(finalLevel - 1, 0);
  }

  return {
    level: finalLevel,
    multiplier: intensityMultiplier,
    adjustments,
    originalLevel: workoutIntensity.level || 0
  };
}

/**
 * Obtient les icônes d'activités Garmin pour une date donnée
 * @param {Object} garminData - Données Garmin complètes
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Array<{icon: string, label: string}>} Liste des icônes
 */
export function getGarminActivityIcons(garminData, date) {
  if (!garminData?.activities) return [];
  
  const icons = [];
  
  const hasSwimming = (garminData.activities.swimming || []).some(act => act.date === date);
  const hasJumpRope = (garminData.activities.jumpRope || []).some(act => act.date === date);
  const hasCardio = (garminData.activities.cardio || []).some(act => act.date === date);
  
  if (hasSwimming) icons.push({ icon: '🏊', label: 'Natation' });
  if (hasJumpRope) icons.push({ icon: '🪢', label: 'Corde à sauter' });
  if (hasCardio) icons.push({ icon: '❤️', label: 'Cardio' });
  
  return icons;
}

/**
 * Minutes d’activités cardio Garmin pour une date, ventilées marche / course / autre.
 * Sert à éviter qu’une longue marche (activeTime) soit traitée comme une séance intense.
 */
export function getGarminCardioMinutesByKindForDate(garminData, dateStr) {
  const cardio = (garminData?.activities?.cardio || []).filter((a) => a.date === dateStr);
  let walk = 0;
  let run = 0;
  let other = 0;
  for (const act of cardio) {
    let dur = 0;
    if (act.duration != null) {
      dur = parseDurationToMinutes(act.duration, 'garminCardio.duration');
    } else if (act.totalTime != null) {
      const n = Number(act.totalTime);
      dur = Number.isFinite(n) ? (n > 200 ? Math.round(n / 60) : n) : 0;
    } else if (act.elapsedTime != null) {
      const n = Number(act.elapsedTime);
      dur = Number.isFinite(n) ? Math.round(n / 60) : 0;
    }
    if (dur <= 0) continue;
    if (isGarminWalkingLikeActivity(act)) walk += dur;
    else if (isGarminRunningLikeActivity(act)) run += dur;
    else other += dur;
  }
  return { walk, run, other, total: walk + run + other };
}
