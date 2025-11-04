/**
 * 🧮 CALCULS D'EXERCICES
 * 
 * Utilitaires centralisés pour les calculs liés aux exercices.
 * Évite la duplication de code et assure la cohérence.
 * 
 * @module exerciseCalculations
 */

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
  
  // Pattern 1: "4×10-12" (séries × range)
  const fullRangeMatch = seriesText.match(/(\d+)×(\d+)-(\d+)/);
  if (fullRangeMatch) {
    const sets = parseInt(fullRangeMatch[1], 10);
    const minReps = parseInt(fullRangeMatch[2], 10);
    const maxReps = parseInt(fullRangeMatch[3], 10);
    const avgReps = (minReps + maxReps) / 2;
    const total = sets * avgReps;
    return round ? Math.round(total) : total;
  }
  
  // Pattern 2: "4×10" (séries × reps fixes)
  const seriesMatch = seriesText.match(/(\d+)×(\d+)/);
  if (seriesMatch) {
    const sets = parseInt(seriesMatch[1], 10);
    const reps = parseInt(seriesMatch[2], 10);
    return sets * reps;
  }
  
  // Pattern 3: "10-12" (range sans séries - pour compatibilité)
  const rangeMatch = seriesText.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    const average = (min + max) / 2;
    return round ? Math.round(average) : average;
  }
  
  // Pattern 4: "10" (nombre simple - pour compatibilité)
  const singleMatch = seriesText.match(/(\d+)/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }
  
  return null;
};

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
      const isIsometric = exercise.name?.toLowerCase().includes('planche') || 
                         exercise.name?.toLowerCase().includes('gainage');
      
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
  
  const match = seriesText.match(/(\d+)×(\d+)(?:-(\d+))?/);
  if (!match) {
    return null;
  }
  
  const sets = parseInt(match[1], 10);
  const minReps = parseInt(match[2], 10);
  const maxReps = match[3] ? parseInt(match[3], 10) : minReps;
  const avgReps = (minReps + maxReps) / 2;
  
  return { sets, minReps, maxReps, avgReps };
};

