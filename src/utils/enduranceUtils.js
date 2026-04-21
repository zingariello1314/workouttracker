/**
 * Utilitaires pour gérer les données d'endurance
 * Permet de différencier les reps (exercices de musculation) des jumps (corde à sauter)
 */

/**
 * Vérifie si un exercice est une session d'endurance (boxing, pushups, swimming, jumprope, running)
 * @param {Object} exercise - Objet exercice
 * @returns {boolean}
 */
export const isEnduranceExercise = (exercise) => {
  if (!exercise) return false;
  
  const exerciseId = exercise.exerciseId || exercise.id || '';
  const activityType = exercise.activityType;
  
  // Vérifier si c'est un exercice d'endurance
  if (exerciseId.toString().startsWith('endurance_')) return true;
  if (activityType && ['boxing', 'pushups', 'gainage', 'swimming', 'jumprope', 'running'].includes(activityType)) return true;
  
  // Vérifier dans le nom de l'exercice
  const exerciseName = (exercise.name || exercise.nom || '').toLowerCase();
  if (exerciseName.includes('endurance_') || exerciseName.includes('corde à sauter')) return true;
  
  return false;
};

/**
 * Vérifie si une session est une session de corde à sauter
 * @param {Object} session - Session d'entraînement
 * @returns {boolean}
 */
export const isJumpropeSession = (session) => {
  if (!session) return false;
  
  // Vérifier si c'est une session d'endurance jumprope
  if (session.exercises && Array.isArray(session.exercises)) {
    return session.exercises.some(ex => {
      const exerciseId = ex.exerciseId || ex.id || '';
      const activityType = ex.activityType;
      return exerciseId.toString().includes('endurance_jumprope') || 
             activityType === 'jumprope' ||
             (exerciseId.toString().includes('endurance_') && ex.jumps && ex.jumps > 0);
    });
  }
  
  return false;
};

/**
 * Calcule les répétitions totales d'une session en EXCLUANT les jumps de corde à sauter
 * @param {Object} session - Session d'entraînement
 * @returns {number} Total de reps (sans jumps)
 */
export const calculateValidReps = (session) => {
  if (!session || !session.exercises) return 0;
  
  return session.exercises.reduce((total, ex) => {
    // Exclure les exercices d'endurance jumprope
    const isJumprope = (ex.exerciseId || ex.id || '').toString().includes('endurance_jumprope') ||
                       ex.activityType === 'jumprope';
    
    if (isJumprope) {
      // Pour jumprope, ne pas compter les jumps comme reps
      return total;
    }
    
    // Pour les autres exercices, compter les reps normalement
    const reps = parseInt(ex.reps) || 0;
    return total + reps;
  }, 0);
};

/**
 * Vérifie si un exercice est de type jumprope
 * @param {Object} exercise - Objet exercice
 * @returns {boolean}
 */
export const isJumpropeExercise = (exercise) => {
  if (!exercise) return false;
  
  const exerciseId = (exercise.exerciseId || exercise.id || '').toString();
  const activityType = exercise.activityType;
  
  return exerciseId.includes('endurance_jumprope') || activityType === 'jumprope';
};

/**
 * Calcule le total de reps pour une liste de sessions en excluant les jumps
 * @param {Array} sessions - Liste de sessions
 * @returns {number} Total de reps (sans jumps)
 */
export const calculateTotalRepsExcludingJumps = (sessions) => {
  if (!Array.isArray(sessions)) return 0;
  
  return sessions.reduce((total, session) => {
    return total + calculateValidReps(session);
  }, 0);
};

