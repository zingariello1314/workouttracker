import { shouldExcludeStoredGarminRunningSession } from './garminRunningLaps';

/**
 * Utilitaires pour l'onglet Calendrier
 * 
 * Ce module centralise toutes les fonctions utilitaires utilisées dans les composants
 * du calendrier pour garantir la cohérence et éviter la duplication de code.
 * 
 * @module calendarUtils
 */

/**
 * Parse une durée selon son format (string "HH:MM:SS", nombre, etc.) en minutes
 * 
 * Logique intelligente basée sur l'analyse des données réelles :
 * - Format "HH:MM:SS" ou "MM:SS" → parse et convertit en minutes
 * - Valeurs >= 1000 → toujours en secondes (1000 min = 16h40, trop long)
 * - Valeurs 200-1000 → probablement en secondes (200 min = 3h20, rare)
 * - Valeurs 60-200 → ambigu :
 *   - Si arrondi (multiple de 5 ou 10) ET <= 120 → probablement minutes
 *   - Sinon → probablement secondes
 * - Valeurs < 60 → garder tel quel (différence négligeable)
 * 
 * @param {any} duration - Durée à parser (string "HH:MM:SS", nombre, etc.)
 * @param {string} context - Contexte pour logs de debug (optionnel)
 * @returns {number} Durée en minutes (arrondie)
 * 
 * @example
 * parseDurationToMinutes("01:30:00") // → 90
 * parseDurationToMinutes(623)        // → 10 (623 secondes)
 * parseDurationToMinutes(90)          // → 90 (90 minutes, arrondi)
 * parseDurationToMinutes(117)         // → 2 (117 secondes, pas arrondi)
 */
export function parseDurationToMinutes(duration, context = '') {
  if (duration === null || duration === undefined || duration === '') {
    return 0;
  }

  // Format string "HH:MM:SS" ou "MM:SS"
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      // HH:MM:SS
      const minutes = parts[0] * 60 + parts[1] + parts[2] / 60;
      if (context) {
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
      // console.log(`🔍 [parseDurationToMinutes] ${context} - duration="${duration}" (HH:MM:SS) → ${minutes.toFixed(2)} min`);
      }
      return Math.round(minutes);
    } else if (parts.length === 2) {
      // MM:SS
      const minutes = parts[0] + parts[1] / 60;
      if (context) {
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
      // console.log(`🔍 [parseDurationToMinutes] ${context} - duration="${duration}" (MM:SS) → ${minutes.toFixed(2)} min`);
      }
      return Math.round(minutes);
    }
  }

  // Convertir en nombre
  const numValue = typeof duration === 'number' ? duration : parseInt(duration) || 0;
  
  if (numValue === 0) {
    return 0;
  }

  // Logique intelligente pour déterminer l'unité
  if (numValue >= 1000) {
    // Toujours en secondes (1000+ min = 16h40+, trop long pour une activité normale)
    const minutes = Math.round(numValue / 60);
    if (context) {
      // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
      // console.log(`🔍 [parseDurationToMinutes] ${context} - duration=${numValue} (secondes, >=1000) → ${minutes} min`);
    }
    return minutes;
  } else if (numValue >= 200 && numValue < 1000) {
    // Probablement en secondes (200-1000 min = 3h20-16h40, possible mais rare)
    const minutes = Math.round(numValue / 60);
    if (context) {
      // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
      // console.log(`🔍 [parseDurationToMinutes] ${context} - duration=${numValue} (secondes, 200-1000) → ${minutes} min`);
    }
    return minutes;
  } else if (numValue >= 60 && numValue < 200) {
    // Ambigu : peut être minutes ou secondes (60-200 min = 1h-3h20, valeurs raisonnables)
    // Par défaut, on assume secondes (Garmin utilise souvent secondes pour `duration`)
    // MAIS si la valeur est un multiple de 5 ou 10 ET <= 120, c'est probablement des minutes
    const isRounded = (numValue % 5 === 0 || numValue % 10 === 0) && numValue <= 120;
    if (isRounded) {
      // Valeur arrondie <= 2h → probablement en minutes (60, 90, 120 min sont courants)
      if (context) {
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
        // console.log(`🔍 [parseDurationToMinutes] ${context} - duration=${numValue} (minutes, arrondi <=120) → ${numValue} min`);
      }
      return numValue;
    } else {
      // Sinon, probablement en secondes
      const minutes = Math.round(numValue / 60);
      if (context) {
        // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
        // console.log(`🔍 [parseDurationToMinutes] ${context} - duration=${numValue} (secondes, 60-200) → ${minutes} min`);
      }
      return minutes;
    }
  } else {
    // < 60 : garder tel quel (peut être minutes ou secondes, différence négligeable)
    if (context) {
      // ✅ LOGS DÉSACTIVÉS pour réduire le bruit (33k messages) - Réactiver uniquement pour debug ciblé
      // console.log(`🔍 [parseDurationToMinutes] ${context} - duration=${numValue} (minutes/secondes, <60) → ${numValue} min`);
    }
    return numValue;
  }
}

/**
 * Détecte si le libellé d’un exercice correspond à une variante de pompes
 * (programme street / base locale), pour cumuler les reps dans le calendrier.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isPushupExerciseName(name) {
  const raw = String(name || '');
  const n = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!n) return false;
  if (n.includes('pomp')) return true;
  if (n.includes('pushup')) return true;
  if (n.includes('push-up') || n.includes('push up')) return true;
  if (/(^|[^a-z])push[- ]?ups?([^a-z]|$)/.test(n)) return true;
  if (n.includes('diamond') && (n.includes('pomp') || n.includes('push'))) return true;
  return false;
}

/**
 * Normalise une date string pour la comparaison
 * 
 * Gère différents formats :
 * - "YYYY-MM-DD" → retourne tel quel
 * - "YYYY-MM-DDTHH:mm:ss" → extrait la partie date
 * - Date object → convertit en "YYYY-MM-DD"
 * 
 * @param {string|Date} dateInput - Date à normaliser
 * @returns {string} Date normalisée (YYYY-MM-DD) ou null si invalide
 * 
 * @example
 * normalizeDateString("2025-11-04T12:30:00") // → "2025-11-04"
 * normalizeDateString("2025-11-04")          // → "2025-11-04"
 * normalizeDateString(new Date())            // → "2025-11-04"
 */
export function normalizeDateString(dateInput) {
  if (!dateInput) {
    return null;
  }

  // Si c'est déjà une string "YYYY-MM-DD"
  if (typeof dateInput === 'string') {
    // Si contient 'T', extraire la partie date
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    // Format Garmin courant : « 2026-06-05 20:22:00 »
    if (dateInput.includes(' ')) {
      const dayPart = dateInput.split(/\s+/)[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) {
        return dayPart;
      }
    }
    // Si c'est déjà au format "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    // Sinon, essayer de parser
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }

  // Si c'est un Date object
  if (dateInput instanceof Date) {
    if (!isNaN(dateInput.getTime())) {
      return dateInput.toISOString().split('T')[0];
    }
  }

  return null;
}

/** Date YYYY-MM-DD d’une activité Garmin (gère « 2026-06-05 20:22:00 »). */
export function garminActivityMatchesCalendarDate(activity, dateStr) {
  if (!activity || !dateStr) return false;
  return normalizeDateString(activity.date) === dateStr;
}

/**
 * Valide une durée et retourne un objet avec le résultat de validation
 * 
 * Vérifications effectuées :
 * - Durée négative ou nulle (si strict = true)
 * - Durée suspecte (> 24h = 1440 min)
 * 
 * @param {number} durationMinutes - Durée en minutes à valider
 * @param {string} context - Contexte pour les logs (optionnel)
 * @param {boolean} strict - Si true, rejette les valeurs nulles/négatives (défaut: false)
 * @returns {{isValid: boolean, warnings: string[], clampedValue: number}} Résultat de validation
 * 
 * @example
 * validateDuration(1500, 'Cardio') // → {isValid: false, warnings: ['Durée > 24h'], clampedValue: 1440}
 * validateDuration(60, 'Swimming') // → {isValid: true, warnings: [], clampedValue: 60}
 * validateDuration(-5, 'Test', true) // → {isValid: false, warnings: ['Durée négative'], clampedValue: 0}
 */
export function validateDuration(durationMinutes, context = '', strict = false) {
  const warnings = [];
  let clampedValue = durationMinutes;
  
  // Validation : Valeur nulle ou négative
  if (strict && (durationMinutes === null || durationMinutes === undefined || durationMinutes < 0)) {
    warnings.push(`Durée invalide (nulle ou négative): ${durationMinutes}`);
    clampedValue = 0;
    if (context) {
      console.warn(`⚠️ [validateDuration] ${context} - Durée invalide: ${durationMinutes} min`);
    }
    return { isValid: false, warnings, clampedValue };
  }
  
  // Validation : Durée suspecte (> 24h = 1440 min)
  if (durationMinutes > 1440) {
    warnings.push(`Durée suspecte (> 24h): ${durationMinutes} min`);
    clampedValue = Math.min(durationMinutes, 1440);
    if (context) {
      console.warn(`⚠️ [validateDuration] ${context} - Durée suspecte: ${durationMinutes} min (> 24h). Valeur clampée à 1440 min.`);
    }
    return { isValid: false, warnings, clampedValue };
  }
  
  return { isValid: true, warnings, clampedValue };
}

/**
 * Valide une date et retourne un objet avec le résultat de validation
 * 
 * Vérifications effectuées :
 * - Date future (après aujourd'hui)
 * - Date invalide (null, undefined, ou impossible à parser)
 * 
 * @param {string|Date} dateInput - Date à valider
 * @param {string} context - Contexte pour les logs (optionnel)
 * @returns {{isValid: boolean, isFuture: boolean, warnings: string[], normalizedDate: string|null}} Résultat de validation
 * 
 * @example
 * validateDate('2025-12-01', 'Endurance') // → {isValid: false, isFuture: true, warnings: ['Date future'], normalizedDate: '2025-12-01'}
 * validateDate('2025-11-04', 'Endurance') // → {isValid: true, isFuture: false, warnings: [], normalizedDate: '2025-11-04'}
 */
export function validateDate(dateInput, context = '') {
  const warnings = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Normaliser la date
  const normalizedDate = normalizeDateString(dateInput);
  
  if (!normalizedDate) {
    warnings.push(`Date invalide: ${dateInput}`);
    if (context) {
      console.warn(`⚠️ [validateDate] ${context} - Date invalide: ${dateInput}`);
    }
    return { isValid: false, isFuture: false, warnings, normalizedDate: null };
  }
  
  // Vérifier si la date est future
  const dateObj = new Date(normalizedDate);
  dateObj.setHours(0, 0, 0, 0);
  
  if (dateObj > today) {
    warnings.push(`Date future: ${normalizedDate}`);
    if (context) {
      console.warn(`⚠️ [validateDate] ${context} - Date future détectée: ${normalizedDate} (aujourd'hui: ${today.toISOString().split('T')[0]})`);
    }
    return { isValid: false, isFuture: true, warnings, normalizedDate };
  }
  
  return { isValid: true, isFuture: false, warnings, normalizedDate };
}

/**
 * Valide une valeur numérique et retourne un objet avec le résultat de validation
 * 
 * Vérifications effectuées :
 * - Valeur nulle ou undefined
 * - Valeur négative (si strict = true)
 * - Valeur NaN
 * 
 * @param {any} value - Valeur à valider
 * @param {string} context - Contexte pour les logs (optionnel)
 * @param {boolean} strict - Si true, rejette les valeurs nulles/négatives (défaut: false)
 * @returns {{isValid: boolean, warnings: string[], normalizedValue: number}} Résultat de validation
 * 
 * @example
 * validateNumericValue(null, 'Reps') // → {isValid: false, warnings: ['Valeur nulle'], normalizedValue: 0}
 * validateNumericValue(-5, 'Reps', true) // → {isValid: false, warnings: ['Valeur négative'], normalizedValue: 0}
 * validateNumericValue(100, 'Reps') // → {isValid: true, warnings: [], normalizedValue: 100}
 */
export function validateNumericValue(value, context = '', strict = false) {
  const warnings = [];
  let normalizedValue = 0;
  
  // Conversion en nombre
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  
  // Validation : Valeur nulle ou undefined
  if (value === null || value === undefined || value === '') {
    if (strict) {
      warnings.push(`Valeur nulle ou undefined: ${value}`);
      if (context) {
        console.warn(`⚠️ [validateNumericValue] ${context} - Valeur nulle ou undefined: ${value}`);
      }
      return { isValid: false, warnings, normalizedValue: 0 };
    }
    return { isValid: true, warnings, normalizedValue: 0 };
  }
  
  // Validation : NaN
  if (isNaN(numValue)) {
    warnings.push(`Valeur NaN: ${value}`);
    if (context) {
      console.warn(`⚠️ [validateNumericValue] ${context} - Valeur NaN: ${value}`);
    }
    return { isValid: false, warnings, normalizedValue: 0 };
  }
  
  // Validation : Valeur négative (si strict)
  if (strict && numValue < 0) {
    warnings.push(`Valeur négative: ${numValue}`);
    if (context) {
      console.warn(`⚠️ [validateNumericValue] ${context} - Valeur négative: ${numValue}`);
    }
    return { isValid: false, warnings, normalizedValue: 0 };
  }
  
  normalizedValue = numValue;
  return { isValid: true, warnings, normalizedValue };
}

/**
 * Détecte si une session d'endurance est une session mock (données erronées)
 * 
 * Patterns détectés :
 * 1. Durée excessive (>= 1440 min = 24h, ou valeurs suspectes : 3600, 1200, 800-900 min)
 * 2. Distance très faible (1.5m) avec durée élevée (> 60 min) - typique natation mock
 * 3. Corde à sauter mock (1200 sauts + 1200 min, ou 13200 sauts, ou 13000-13500)
 * 4. Valeurs "trop rondes" suspectes (multiples de 100/1000 pour jumps ET duration)
 * 5. Date future
 * 6. Sessions Garmin sans garminId avec valeurs suspectes
 * 7. Valeurs impossibles (durée > 24h, sauts > 10000 en < 8h)
 * 
 * @param {Object} session - Session d'endurance à vérifier
 * @returns {boolean} true si la session est mock, false sinon
 * 
 * @example
 * isMockEnduranceSession({ duration: 880, jumps: 0 })           // → true (durée suspecte)
 * isMockEnduranceSession({ duration: 60, distance: 1.5 })        // → true (natation mock)
 * isMockEnduranceSession({ jumps: 13200, duration: 60 })         // → true (corde mock)
 * isMockEnduranceSession({ duration: 45, jumps: 500, date: "2025-12-01" }) // → true (date future)
 */
export function isMockEnduranceSession(session) {
  if (!session || typeof session !== 'object') {
    return false;
  }

  // Normaliser la durée en minutes (utiliser parseDurationToMinutes pour cohérence)
  const durationMinutes = parseDurationToMinutes(session.duration, 'isMockEnduranceSession');
  const distance = parseFloat(session.distance) || 0;
  const jumps = parseInt(session.jumps) || 0;
  const reps = parseInt(session.reps || session.count) || 0;

  // Pattern 1 : Durée excessive (>= 1440 min = 24h, ou valeurs suspectes)
  // ✅ AMÉLIORATION : Détecter aussi valeurs "trop rondes" suspectes (multiples de 20/50/100)
  // et valeurs impossibles pour une session réelle
  if (durationMinutes >= 1440 || durationMinutes === 3600 || durationMinutes === 1200 || 
      (durationMinutes >= 800 && durationMinutes <= 900) || // Plage 880 min
      (durationMinutes >= 200 && durationMinutes <= 300 && durationMinutes % 20 === 0)) { // Plage 200-300 min (ex: 220 min) - valeurs rondes suspectes
    return true;
  }
  
  // ✅ AMÉLIORATION : Détecter durées "trop rondes" combinées avec sauts élevés
  // (ex: 220 min = 3h40, valeur très suspecte si combinée avec 13200 sauts)
  if (durationMinutes > 0 && (durationMinutes % 10 === 0 || durationMinutes % 20 === 0) && durationMinutes >= 100) {
    // Si la durée est un multiple de 10/20 et >= 100 min, vérifier si combinée avec valeurs suspectes
    if (jumps >= 10000 || jumps === 13200 || (jumps >= 13000 && jumps <= 13500)) {
      return true; // Durée ronde + sauts suspects = très probablement mock
    }
  }

  const hasCredibleGarminLink =
    session.garminId != null ||
    session.__fromGarminBridge === true ||
    String(session.source || '').toLowerCase() === 'garmin';
  const isRunningLikeSession =
    /run|course|jog/i.test(String(session.type || '')) ||
    String(session.activityType || '').toLowerCase() === 'running' ||
    (hasCredibleGarminLink && distance >= 0.75);

  // Pattern 2 : Distance très faible (mètres) avec durée élevée — natation mock, pas la course en km
  if (
    !isRunningLikeSession &&
    (distance === 1.5 || (distance > 0 && distance < 1)) &&
    durationMinutes > 30
  ) {
    return true;
  }

  // Pattern 3 : Corde à sauter mock (valeurs suspectes)
  // ✅ AMÉLIORATION : Détecter aussi valeurs très élevées de sauts (> 10000) avec durée suspecte
  // ✅ FIX : Vérifier aussi dans count/reps si jumps n'est pas présent
  const sessionJumps = jumps || parseInt(session.count) || parseInt(session.reps) || 0;
  
  if ((sessionJumps === 1200 && durationMinutes === 1200) || 
      sessionJumps === 13200 || 
      (sessionJumps >= 13000 && sessionJumps <= 13500) || // Plage autour de 13200
      (sessionJumps > 10000 && durationMinutes < 120)) { // Plus de 10000 sauts en moins de 2h
    return true;
  }
  
  // ✅ AMÉLIORATION : Détecter 13200 sauts même si durée normale (valeur très suspecte)
  if (sessionJumps === 13200 || (sessionJumps >= 13200 && sessionJumps <= 13250)) {
    return true; // 13200 sauts est toujours suspect, peu importe la durée
  }

  // Pattern 4 : Sessions avec des valeurs "trop rondes" suspectes
  // ✅ FIX : Utiliser sessionJumps au lieu de jumps
  if (sessionJumps > 0 && (sessionJumps % 1000 === 0 || sessionJumps % 100 === 0) && sessionJumps > 1000) {
    if (durationMinutes > 0 && (durationMinutes % 100 === 0 || durationMinutes % 1000 === 0 || durationMinutes % 20 === 0)) {
      return true; // Trop suspect si les deux sont des multiples ronds
    }
  }
  
  // ✅ AMÉLIORATION : Détecter combinaisons suspectes de sauts élevés + durée ronde
  // Exemple : 13200 sauts + 220 min = très suspect
  if (sessionJumps >= 10000 && durationMinutes >= 200 && durationMinutes % 20 === 0) {
    return true; // Sauts élevés + durée ronde = mock probable
  }

  // Pattern 5 : Date future (sauf séances Garmin identifiées — sync légitime)
  if (session.date && !hasCredibleGarminLink) {
    const normalizedDate = normalizeDateString(session.date);
    if (normalizedDate) {
      try {
        const sessionDate = new Date(normalizedDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (sessionDate > today) {
          return true;
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
  }

  // Pattern 6 : Pas de garminId ET source = 'garmin' avec valeurs suspectes
  if (session.source === 'garmin' && !session.garminId) {
    if (durationMinutes >= 1440 || durationMinutes === 3600 || durationMinutes === 1200 || 
        (durationMinutes >= 800 && durationMinutes <= 900) ||
        (durationMinutes >= 200 && durationMinutes <= 300 && durationMinutes % 20 === 0)) {
      return true;
    }
    if (distance === 1.5 && durationMinutes > 60) {
      return true;
    }
    if (sessionJumps === 1200 || sessionJumps === 13200 || (sessionJumps >= 13000 && sessionJumps <= 13500)) {
      return true;
    }
  }

  // Pattern 7 : Sessions avec des valeurs impossibles (durée > 24h, sauts > 10000/jour)
  // ✅ FIX : Utiliser sessionJumps au lieu de jumps
  if (durationMinutes > 1440) return true;
  if (sessionJumps > 10000 && durationMinutes < 480) return true; // Plus de 10000 sauts en moins de 8h

  // ✅ AMÉLIORATION : Détecter sessions natation avec distance très faible (< 10m) et durée > 20 min
  // (souvent des données mockées de test)
  if (session.activityType === 'swimming' || session.type === 'swimming') {
    if (distance > 0 && distance < 10 && durationMinutes > 20) {
      return true;
    }
  }

  // ✅ AMÉLIORATION : Détecter sessions avec valeurs "trop rondes" suspectes pour natation
  // (ex: distance exactement 1.5m, 2m, 3m, etc. avec durée très élevée)
  if (distance > 0 && distance < 10 && (distance === 1.5 || distance === 2 || distance === 3 || distance === 5)) {
    if (durationMinutes > 60) {
      return true;
    }
  }

  return false;
}

/**
 * Calcule le niveau d'intensité basé sur des seuils dynamiques
 * 
 * Niveaux d'intensité :
 * - 0 : Pas d'exercice (repos)
 * - 1 : Léger (vert) - <= seuil minimum
 * - 2 : Modéré (jaune) - <= 33% du range
 * - 3 : Intense (orange) - <= 66% du range
 * - 4 : Extrême (rouge) - > 66% du range
 * 
 * @param {number} totalReps - Total des répétitions
 * @param {number[]} thresholds - Seuils dynamiques [0, min, 33%, 66%, max]
 * @returns {number} Niveau d'intensité (0-4)
 * 
 * @example
 * const thresholds = [0, 50, 100, 150, 200];
 * calculateIntensityLevel(0, thresholds)   // → 0 (pas d'exercice)
 * calculateIntensityLevel(50, thresholds)  // → 1 (léger)
 * calculateIntensityLevel(100, thresholds)  // → 2 (modéré)
 * calculateIntensityLevel(150, thresholds) // → 3 (intense)
 * calculateIntensityLevel(200, thresholds) // → 4 (extrême)
 */
export function calculateIntensityLevel(totalReps, thresholds) {
  if (!thresholds || !Array.isArray(thresholds) || thresholds.length < 5) {
    console.warn('[calculateIntensityLevel] Seuils invalides, retour 0');
    return 0;
  }

  if (totalReps === 0) return 0;
  if (totalReps <= thresholds[1]) return 1; // Léger (vert)
  if (totalReps <= thresholds[2]) return 2; // Modéré (jaune)
  if (totalReps <= thresholds[3]) return 3; // Intense (orange)
  return 4; // Extrême (rouge)
}

/**
 * Calcule le niveau d'intensité basé sur la durée (temps)
 * 
 * Utilise les mêmes niveaux que calculateIntensityLevel mais basé sur la durée
 * 
 * @param {number} duration - Durée en minutes
 * @param {number[]} thresholds - Seuils dynamiques pour la durée [min, 25%, 50%, 75%]
 * @returns {number} Niveau d'intensité (0-4)
 * 
 * @example
 * const thresholds = [30, 60, 90, 120];
 * calculateTimeIntensityLevel(0, thresholds)   // → 0 (pas d'exercice)
 * calculateTimeIntensityLevel(30, thresholds)  // → 1 (léger)
 * calculateTimeIntensityLevel(60, thresholds)  // → 2 (modéré)
 * calculateTimeIntensityLevel(90, thresholds)  // → 3 (intense)
 * calculateTimeIntensityLevel(120, thresholds) // → 4 (extrême)
 */
export function calculateTimeIntensityLevel(duration, thresholds) {
  if (!thresholds || !Array.isArray(thresholds) || thresholds.length < 4) {
    console.warn('[calculateTimeIntensityLevel] Seuils invalides, retour 0');
    return 0;
  }

  if (duration === 0) return 0;
  if (duration <= thresholds[1]) return 1; // Léger (vert)
  if (duration <= thresholds[2]) return 2; // Modéré (jaune)
  if (duration <= thresholds[3]) return 3; // Intense (orange)
  return 4; // Extrême (rouge)
}

/**
 * Sessions d'endurance (enduranceData.sessions) pour une date calendrier YYYY-MM-DD.
 * Utilisé par le panneau « détail jour » pour lister les séances (course, natation, etc.).
 *
 * @param {object|null} allData
 * @param {string} dateStr
 * @returns {{ rows: Array<{ activityType: string, session: object }>, runningDistanceKm: number, swimmingDistanceM: number }}
 */
export function collectEnduranceSessionsForCalendarDay(allData, dateStr) {
  const sessionsMap = allData?.enduranceData?.sessions || {};
  const rows = [];
  let runningDistanceKm = 0;
  let swimmingDistanceM = 0;

  Object.entries(sessionsMap).forEach(([activityType, sessions]) => {
    if (!Array.isArray(sessions)) return;
    sessions.forEach((session) => {
      if (isMockEnduranceSession(session)) return;
      if (activityType === 'running' && shouldExcludeStoredGarminRunningSession(session)) return;
      const dv = validateDate(session.date, `collectEnduranceSessionsForCalendarDay.${activityType}`);
      if (!dv.normalizedDate || dv.normalizedDate !== dateStr) return;

      rows.push({ activityType, session });

      if (activityType === 'running') {
        const km = parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
        if (km > 0) runningDistanceKm += km;
      }

      if (activityType === 'swimming') {
        if (Array.isArray(session.laps) && session.laps.length > 0) {
          session.laps.forEach((lap) => {
            const m = parseFloat(String(lap?.distance ?? '').replace(',', '.')) || 0;
            if (m > 0) swimmingDistanceM += m;
          });
        } else {
          const m = parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
          if (m > 0) swimmingDistanceM += m;
        }
      }
    });
  });

  rows.sort((a, b) => {
    const ta = String(a.session?.time || '00:00:00');
    const tb = String(b.session?.time || '00:00:00');
    const c = ta.localeCompare(tb);
    if (c !== 0) return c;
    return String(a.session?.id ?? '').localeCompare(String(b.session?.id ?? ''));
  });

  return {
    rows,
    runningDistanceKm: Math.round(runningDistanceKm * 10) / 10,
    swimmingDistanceM: Math.round(swimmingDistanceM * 10) / 10
  };
}

