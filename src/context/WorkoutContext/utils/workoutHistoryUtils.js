/**
 * Utilitaires pour l'historique des entraînements
 * 
 * ✅ PHASE 4 : Extraction des fonctions utilitaires de l'historique
 * 
 * @module context/WorkoutContext/utils/workoutHistoryUtils
 */

/**
 * Obtient l'historique des entraînements depuis les données brutes
 * @param {Object} data - Données brutes
 * @returns {Array} Historique des sessions
 */
export const getWorkoutHistoryFromData = (data) => {
  if (!data || !data.checkedExercises) return [];
  
  const sessions = {};
  Object.entries(data.checkedExercises).forEach(([key, isChecked]) => {
    if (isChecked) {
      const [dateStr, exerciseId] = key.split('_');
      if (!sessions[dateStr]) {
        sessions[dateStr] = {
          date: dateStr,
          exercises: [],
          totalReps: 0
        };
      }
      
      const reps = parseInt(data.reps?.[key] || 0);
      sessions[dateStr].exercises.push({
        id: exerciseId,
        reps: reps
      });
      sessions[dateStr].totalReps += reps;
    }
  });
  
  return Object.values(sessions).sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Obtient les exercices uniques depuis les données
 * @param {Object} data - Données brutes
 * @returns {Set} Ensemble d'exercices uniques
 */
export const getUniqueExercisesFromData = (data) => {
  const uniqueExercises = new Set();
  Object.keys(data.checkedExercises || {}).forEach(key => {
    if (data.checkedExercises[key]) {
      const exerciseId = key.split('_')[1];
      uniqueExercises.add(exerciseId);
    }
  });
  return uniqueExercises;
};

/**
 * Obtient les répétitions d'aujourd'hui depuis les données
 * @param {Object} data - Données brutes
 * @param {Date} date - Date (par défaut aujourd'hui)
 * @returns {number} Total des répétitions
 */
export const getTodayRepsFromData = (data, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];
  let totalReps = 0;
  
  Object.entries(data.reps || {}).forEach(([key, reps]) => {
    if (key.startsWith(dateStr) && data.checkedExercises?.[key]) {
      totalReps += parseInt(reps) || 0;
    }
  });
  
  return totalReps;
};

/**
 * Obtient les exercices d'aujourd'hui depuis les données
 * @param {Object} data - Données brutes
 * @param {Date} date - Date (par défaut aujourd'hui)
 * @returns {Array} Liste des IDs d'exercices
 */
export const getTodayExercisesFromData = (data, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];
  const exercises = [];
  
  Object.keys(data.checkedExercises || {}).forEach(key => {
    if (key.startsWith(dateStr) && data.checkedExercises[key]) {
      const exerciseId = key.split('_')[1];
      exercises.push(exerciseId);
    }
  });
  
  return exercises;
};

/**
 * Obtient les entraînements d'aujourd'hui depuis les données
 * @param {Object} data - Données brutes
 * @param {Date} date - Date (par défaut aujourd'hui)
 * @returns {Array} Liste des dates d'entraînement
 */
export const getTodayWorkoutsFromData = (data, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];
  const hasWorkout = Object.keys(data.checkedExercises || {}).some(key =>
    key.startsWith(dateStr) && data.checkedExercises[key]
  );
  return hasWorkout ? [dateStr] : [];
};

/**
 * Obtient les entraînements de la semaine depuis les données
 * @param {Object} data - Données brutes
 * @returns {Array} Liste des sessions de la semaine
 */
export const getWeekWorkoutsFromData = (data) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const workoutHistory = getWorkoutHistoryFromData(data);
  return workoutHistory.filter(session => new Date(session.date) >= weekAgo);
};

/**
 * Obtient les répétitions de la semaine depuis les données
 * @param {Object} data - Données brutes
 * @returns {number} Total des répétitions de la semaine
 */
export const getWeekRepsFromData = (data) => {
  const weekWorkouts = getWeekWorkoutsFromData(data);
  return weekWorkouts.reduce((sum, session) => sum + session.totalReps, 0);
};

/**
 * Obtient les entraînements du mois depuis les données
 * @param {Object} data - Données brutes
 * @returns {Array} Liste des sessions du mois
 */
export const getMonthWorkoutsFromData = (data) => {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const workoutHistory = getWorkoutHistoryFromData(data);
  return workoutHistory.filter(session => new Date(session.date) >= monthAgo);
};

/**
 * Obtient les répétitions du mois depuis les données
 * @param {Object} data - Données brutes
 * @returns {number} Total des répétitions du mois
 */
export const getMonthRepsFromData = (data) => {
  const monthWorkouts = getMonthWorkoutsFromData(data);
  return monthWorkouts.reduce((sum, session) => sum + session.totalReps, 0);
};

/**
 * Obtient les exercices uniques du mois depuis les données
 * @param {Object} data - Données brutes
 * @returns {Set} Ensemble d'exercices uniques du mois
 */
export const getMonthUniqueExercisesFromData = (data) => {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().split('T')[0];
  
  const uniqueExercises = new Set();
  Object.keys(data.checkedExercises || {}).forEach(key => {
    if (data.checkedExercises[key]) {
      const dateStr = key.split('_')[0];
      if (dateStr >= monthAgoStr) {
        const exerciseId = key.split('_')[1];
        uniqueExercises.add(exerciseId);
      }
    }
  });
  return uniqueExercises;
};

/**
 * Obtient le total des répétitions depuis les données
 * @param {Object} data - Données brutes
 * @returns {number} Total des répétitions
 */
export const getTotalRepsFromData = (data) => {
  const workoutHistory = getWorkoutHistoryFromData(data);
  return workoutHistory.reduce((sum, session) => sum + session.totalReps, 0);
};
