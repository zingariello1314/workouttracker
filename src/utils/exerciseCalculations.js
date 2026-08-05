/**
 * 🧮 CALCULS D'EXERCICES
 * 
 * Utilitaires centralisés pour les calculs liés aux exercices.
 * Évite la duplication de code et assure la cohérence.
 * 
 * @module exerciseCalculations
 */

/**
 * Normalise le texte de série pour le parsing (tirets unicode, x → ×, notes entre parenthèses).
 * @param {string} seriesText
 * @returns {string}
 */
export function normalizeSeriesForParsing(seriesText) {
  if (!seriesText || typeof seriesText !== 'string') return '';
  return seriesText
    .replace(/\([^)]*\)/g, '')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/(\d)\s*[xX]\s*(\d)/g, '$1×$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** IDs des programmes embarqués Cycle 3+1. */
export const CYCLE_31_PROGRAM_IDS = new Set(['default-program', 'optimized-program']);

export function isCycle31EmbeddedProgram(programId) {
  return CYCLE_31_PROGRAM_IDS.has(String(programId || ''));
}

/**
 * Valeur à préremplir dans le champ Aujourd'hui (reps, sec ou min selon l'exercice).
 * Couvre les formats du programme Cycle 3+1 : 4×10-12, 30 sec, 1 min, 3×30 sec, 20×, 5 cycles, etc.
 *
 * @param {Object} exercise — { series, name?, type? }
 * @param {{ round?: boolean }} [options]
 * @returns {number|null}
 */
export function resolvePrescriptionAutofillValue(exercise, options = {}) {
  const { round = true } = options;
  const rawSeries = exercise?.series;
  if (!rawSeries || typeof rawSeries !== 'string') return null;
  if (/\bmax\b/i.test(rawSeries)) return null;

  const series = normalizeSeriesForParsing(rawSeries);
  const unitInfo = detectExerciseUnit({ ...exercise, series: rawSeries });

  if (unitInfo?.isTimeBased) {
    const setsTimeMatch = series.match(/(\d+)\s*×\s*(\d+)\s*(sec|min)/i);
    if (setsTimeMatch) {
      const sets = parseInt(setsTimeMatch[1], 10);
      const per = parseInt(setsTimeMatch[2], 10);
      return sets * per;
    }

    const loneSec = series.match(/(\d+)\s*sec/i);
    if (loneSec) return parseInt(loneSec[1], 10);

    const loneMin = series.match(/(\d+)\s*min/i);
    if (loneMin) return parseInt(loneMin[1], 10);

    return null;
  }

  const cyclesMatch = series.match(/(\d+)\s*cycles?/i);
  if (cyclesMatch) return parseInt(cyclesMatch[1], 10);

  const trailingMatch = series.match(/^(\d+)\s*×\s*$/);
  if (trailingMatch) return parseInt(trailingMatch[1], 10);

  const cleaned = series
    .replace(/\s*par\s+bras/gi, '')
    .replace(/\s*chaque\s+c[ôo]t[ée]/gi, '')
    .trim();

  const fullRangeMatch = cleaned.match(/(\d+)\s*×\s*(\d+)\s*-\s*(\d+)/);
  if (fullRangeMatch) {
    const sets = parseInt(fullRangeMatch[1], 10);
    const minReps = parseInt(fullRangeMatch[2], 10);
    const maxReps = parseInt(fullRangeMatch[3], 10);
    const total = sets * ((minReps + maxReps) / 2);
    return round ? Math.round(total) : total;
  }

  const seriesMatch = cleaned.match(/(\d+)\s*×\s*(\d+)/);
  if (seriesMatch) {
    return parseInt(seriesMatch[1], 10) * parseInt(seriesMatch[2], 10);
  }

  const rangeMatch = cleaned.match(/^(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const avg = (parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2;
    return round ? Math.round(avg) : avg;
  }

  const singleMatch = cleaned.match(/^(\d+)/);
  if (singleMatch) return parseInt(singleMatch[1], 10);

  return null;
}

/**
 * Calcule automatiquement le nombre total de répétitions à partir d'une série.
 * 
 * Formats supportés :
 * - "4×10-12" → 4 séries × moyenne(10,12) = 44 reps
 * - "4×10" → 4 séries × 10 = 40 reps
 * - "10-12" → moyenne(10,12) = 11 reps (si pas de séries)
 * - "10" → 10 reps (nombre simple)
 * 
 * @param {string} seriesText - Texte de la série (ex: "4×10-12", "3×12", "10-12")
 * @param {Object} options - Options de calcul
 * @param {boolean} options.round - Arrondir le résultat (défaut: false pour garder précision)
 * @returns {number|null} - Nombre total de répétitions calculé, ou null si format invalide
 * 
 * @example
 * calculateAutoReps("4×10-12") // 44
 * calculateAutoReps("3×12") // 36
 * calculateAutoReps("10-12", { round: true }) // 11
 */
export const calculateAutoReps = (seriesText, options = {}) => {
  const { round = false } = options;

  if (!seriesText || typeof seriesText !== 'string') {
    return null;
  }

  const normalized = normalizeSeriesForParsing(seriesText);
  const unitInfo = detectExerciseUnit({ series: seriesText });
  if (unitInfo?.isTimeBased) {
    return resolvePrescriptionAutofillValue({ series: seriesText }, { round });
  }

  // Pattern 1: "4×10-12" (séries × range)
  const fullRangeMatch = normalized.match(/(\d+)\s*×\s*(\d+)\s*-\s*(\d+)/);
  if (fullRangeMatch) {
    const sets = parseInt(fullRangeMatch[1], 10);
    const minReps = parseInt(fullRangeMatch[2], 10);
    const maxReps = parseInt(fullRangeMatch[3], 10);
    const avgReps = (minReps + maxReps) / 2;
    const total = sets * avgReps;
    return round ? Math.round(total) : total;
  }

  // Pattern 2: "4×10" (séries × reps fixes)
  const seriesMatch = normalized.match(/(\d+)\s*×\s*(\d+)/);
  if (seriesMatch) {
    const sets = parseInt(seriesMatch[1], 10);
    const reps = parseInt(seriesMatch[2], 10);
    return sets * reps;
  }

  // Pattern trailing: "20×"
  const trailingMatch = normalized.match(/^(\d+)\s*×\s*$/);
  if (trailingMatch) {
    return parseInt(trailingMatch[1], 10);
  }

  // Pattern 3: "10-12" (range sans séries)
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    const average = (min + max) / 2;
    return round ? Math.round(average) : average;
  }

  // Pattern 4: "10" (nombre simple)
  const singleMatch = normalized.match(/^(\d+)/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }

  return null;
};

/** Série du type « 3×10 » ou « 3×10-12 » sans unité de temps. */
function isRepBasedSeries(series) {
  if (!series || typeof series !== 'string') return false;
  const trimmed = series.trim();
  if (/\b(sec|min)\b/i.test(trimmed)) return false;
  return /^\d+\s*[×x]\s*\d+(?:\s*-\s*\d+)?\s*$/.test(trimmed);
}

/** Holds longs saisis en minutes (wall sit, chaise murale…). */
function exerciseNameUsesMinutesByDefault(name) {
  const n = String(name || '').toLowerCase();
  if (!n) return false;
  return /wall\s*sit|chaise\s*(murale|au mur)|chair\s*hold|isometric\s*(wall\s*)?squat/.test(n);
}

/**
 * Gainage / planche statique — exclut les variantes dynamiques (ex. pompes pseudo-planche).
 */
export function isIsometricExerciseByName(name) {
  const n = String(name || '').toLowerCase();
  if (!n) return false;
  if (/pompe|push-up|push up|pushup/.test(n)) return false;
  if (exerciseNameUsesMinutesByDefault(n)) return true;
  if (n.includes('statique') || n.includes('isométri') || n.includes('gainage')) return true;
  if (n.includes('planche')) return true;
  return false;
}

/**
 * Libellé d’affichage calendrier / récap pour une valeur enregistrée (reps, sec ou min).
 *
 * @param {Object} exercise — { name?, series?, type? }
 * @param {string|number|null|undefined} rawValue — valeur stockée dans reps[key]
 * @returns {{ value: number, unit: 'reps'|'sec'|'min', label: string, displayText: string, isTimeBased: boolean }}
 */
export function formatCalendarExerciseRecordedValue(exercise, rawValue) {
  const value = Math.max(0, Math.floor(Number(rawValue) || 0));
  const unitInfo = detectExerciseUnit(exercise) || { unit: 'reps', isTimeBased: false };
  let unit = unitInfo.unit === 'min' || unitInfo.unit === 'sec' ? unitInfo.unit : 'reps';
  let isTimeBased = unitInfo.isTimeBased === true;

  if (unit === 'sec' && exerciseNameUsesMinutesByDefault(exercise?.name)) {
    unit = 'min';
  }

  if (value <= 0) {
    return { value: 0, unit, label: unit, displayText: '', isTimeBased };
  }

  return {
    value,
    unit,
    label: unit,
    displayText: `${value} ${unit}`,
    isTimeBased
  };
}

/**
 * Calcule la durée d'une session d'entraînement basée sur les exercices complétés.
 * 
 * Prend en compte :
 * - Exercices isométriques (planche, gainage) : temps en secondes/minutes
 * - Exercices dynamiques : (sets × reps × temps/rep) + temps de repos
 * 
 * @param {Array} exercises - Liste des exercices complétés avec leurs séries
 * @param {Object} options - Options de calcul
 * @param {number} options.timePerRep - Temps par répétition en secondes (défaut: 3)
 * @param {number} options.restBetweenSets - Temps de repos entre séries en secondes (défaut: 90)
 * @returns {number} - Durée totale en minutes (arrondie)
 * 
 * @example
 * const exercises = [
 *   { name: "Pompes", series: "4×10-12", rest: 90 },
 *   { name: "Planche", series: "1 min" }
 * ];
 * calculateSessionDuration(exercises) // ~10 minutes
 */
export const calculateSessionDuration = (exercises = [], options = {}) => {
  const { timePerRep = 3, restBetweenSets = 90 } = options;
  
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return 0;
  }
  
  let totalDurationSeconds = 0;
  
  exercises.forEach(exercise => {
    if (!exercise.series) return;
    
    let exerciseDuration = 0;
    
    // Extraire séries et répétitions
    const seriesMatch = exercise.series.match(/(\d+)×(\d+)(?:-(\d+))?/);
    
    if (seriesMatch) {
      const sets = parseInt(seriesMatch[1], 10);
      const minReps = parseInt(seriesMatch[2], 10);
      const maxReps = seriesMatch[3] ? parseInt(seriesMatch[3], 10) : minReps;
      const avgReps = (minReps + maxReps) / 2;
      
      // Détecter exercices isométriques
      const isIsometric = isIsometricExerciseByName(exercise.name) && !isRepBasedSeries(exercise.series);
      
      if (isIsometric) {
        // Exercices isométriques : temps en secondes/minutes directement
        if (exercise.series.includes('sec') || exercise.series.includes('min')) {
          const timeMatch = exercise.series.match(/(\d+)\s*(sec|min)/);
          if (timeMatch) {
            const timeValue = parseInt(timeMatch[1], 10);
            const timeUnit = timeMatch[2];
            exerciseDuration = timeUnit === 'min' ? timeValue * 60 : timeValue;
          }
        } else {
          // Pour les planches sans unité, utiliser avgReps comme secondes
          exerciseDuration = avgReps;
        }
      } else {
        // Exercices dynamiques
        exerciseDuration = sets * avgReps * timePerRep;
        
        // Ajouter temps de repos entre séries
        const restTime = exercise.rest || restBetweenSets;
        exerciseDuration += (sets - 1) * restTime;
      }
    } else if (exercise.series.includes('sec')) {
      // Exercices en secondes (circuits, etc.)
      const timeMatch = exercise.series.match(/(\d+)\s*sec/);
      if (timeMatch) {
        exerciseDuration = parseInt(timeMatch[1], 10);
      }
    } else if (exercise.series.includes('min')) {
      // Exercices en minutes
      const timeMatch = exercise.series.match(/(\d+)\s*min/);
      if (timeMatch) {
        exerciseDuration = parseInt(timeMatch[1], 10) * 60;
      }
    }
    
    totalDurationSeconds += exerciseDuration;
  });
  
  // Convertir en minutes et arrondir
  return Math.round(totalDurationSeconds / 60);
};

/**
 * Parse une série de texte pour extraire les composants.
 * 
 * @param {string} seriesText - Texte de la série
 * @returns {Object|null} - { sets, minReps, maxReps, avgReps } ou null
 */
export const parseSeries = (seriesText) => {
  if (!seriesText || typeof seriesText !== 'string') {
    return null;
  }

  const normalized = normalizeSeriesForParsing(seriesText);
  const match = normalized.match(/(\d+)\s*×\s*(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) {
    return null;
  }

  const sets = parseInt(match[1], 10);
  const minReps = parseInt(match[2], 10);
  const maxReps = match[3] ? parseInt(match[3], 10) : minReps;
  const avgReps = (minReps + maxReps) / 2;

  return { sets, minReps, maxReps, avgReps };
};

/**
 * 🔴 FIX : Détecte si un exercice est basé sur le temps (secondes/minutes) plutôt que sur les répétitions.
 * 
 * Vérifie si la série ou le nom de l'exercice contient des indications de temps.
 * 
 * @param {Object} exercise - Objet exercice avec `series` et optionnel `name`
 * @returns {Object|null} - { unit: 'sec'|'min'|'reps', isTimeBased: boolean } ou null
 * 
 * @example
 * detectExerciseUnit({ series: "3x30 sec", name: "Planche bras tendus" }) 
 * // { unit: 'sec', isTimeBased: true }
 * detectExerciseUnit({ series: "4x10-12", name: "Pompes" }) 
 * // { unit: 'reps', isTimeBased: false }
 */
export const detectExerciseUnit = (exercise) => {
  if (!exercise) return null;
  
  const series = exercise.series || '';
  const name = (exercise.name || '').toLowerCase();
  
  // 🔴 FIX : Détecter unité dans la série avec patterns plus robustes
  // Pattern 1: "3x30 sec", "3×30 sec", "3x30sec", "3×30sec" (séries × temps en secondes)
  // Supporte aussi "3x 30 sec", "3× 30 sec", etc.
  // Note: Le caractère × (multiplication Unicode U+00D7) est utilisé dans workoutProgram.js
  // IMPORTANT: Le caractère × (×) est différent de x (x) - utiliser [×x] pour les deux
  const secPattern = series.match(/(\d+)\s*[×x]\s*(\d+)\s*sec/i) || 
                     series.match(/(\d+)\s*[×x](\d+)\s*sec/i) ||
                     series.match(/(\d+)[×x]\s*(\d+)\s*sec/i) ||
                     series.match(/(\d+)[×x](\d+)\s*sec/i) ||
                     series.match(/(\d+)\s*sec/i);
  
  // Pattern 2: "3x30 min", "3×30 min" (séries × temps en minutes)
  const minPattern = series.match(/(\d+)\s*[×x]\s*(\d+)\s*min/i) || 
                     series.match(/(\d+)\s*[×x](\d+)\s*min/i) ||
                     series.match(/(\d+)[×x]\s*(\d+)\s*min/i) ||
                     series.match(/(\d+)[×x](\d+)\s*min/i) ||
                     series.match(/(\d+)\s*min/i);
  
  // Pattern 3: Vérifier si la série contient "sec" ou "min" (même sans pattern spécifique)
  // Utiliser \b pour word boundary pour éviter de matcher "secondes" ou "minutes"
  const hasSec = /\bsec\b/i.test(series);
  const hasMin = /\bmin\b/i.test(series);
  
  // Priorité 1: Pattern explicite avec séries × temps
  if (secPattern) {
    return { unit: 'sec', isTimeBased: true };
  }
  
  if (minPattern) {
    return { unit: 'min', isTimeBased: true };
  }
  
  // Priorité 2: Série contient "sec" ou "min" (fallback si pattern n'a pas match)
  if (hasSec) {
    return { unit: 'sec', isTimeBased: true };
  }
  
  if (hasMin) {
    return { unit: 'min', isTimeBased: true };
  }

  if (isRepBasedSeries(series)) {
    return { unit: 'reps', isTimeBased: false };
  }

  if (exerciseNameUsesMinutesByDefault(name)) {
    return { unit: 'min', isTimeBased: true };
  }
  
  // Exercice isométrique (planche, gainage) → secondes par défaut
  if (isIsometricExerciseByName(name)) {
    return { unit: 'sec', isTimeBased: true };
  }

  return { unit: 'reps', isTimeBased: false };
};


