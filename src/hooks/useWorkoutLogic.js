import { workoutProgram } from '../data/workoutProgram';
import { getDateStr, getDayName, getAutoWeekVariant } from '../utils/dateUtils';

export const useWorkoutLogic = (data, updateData, getCurrentData, updateTempExerciseData, updateTempStretchData) => {
  // Utiliser getCurrentData si disponible, sinon data
  const currentData = getCurrentData ? getCurrentData() : data;

  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  const getTodayWorkout = (currentDate, isGymMode = false) => {
    const dayName = getDayName(currentDate);
    const baseWorkout = workoutProgram[dayName] || { exercices: [], etirements: [] };
    
    // Calculer la variante de semaine automatiquement (toujours basée sur la date)
    const currentWeekVariant = getAutoWeekVariant(currentDate);
    
    // Si c'est samedi ou dimanche et qu'on est en mode salle, utiliser les variantes A/B
    if ((dayName === 'samedi' || dayName === 'dimanche') && isGymMode && baseWorkout.salleVariants) {
      const weekVariantKey = currentWeekVariant === 'A' ? 'semaineA' : 'semaineB';
      const gymVariant = baseWorkout.salleVariants[weekVariantKey];
      
      if (gymVariant) {
        return {
          ...baseWorkout,
          name: gymVariant.name,
          exercices: gymVariant.exercices,
          focus: gymVariant.name,
          isGymMode: true,
          weekVariant: currentWeekVariant
        };
      }
    }
    
    return {
      ...baseWorkout,
      isGymMode: false,
      weekVariant: currentWeekVariant
    };
  };

  // Fonction pour calculer les répétitions totales à partir du format "NxX-Y" ou "NxX"
  const calculateAverageReps = (seriesText) => {
    if (!seriesText) return null;
    
    // Rechercher le pattern "nombre×nombre-nombre" (ex: "4×10-12")
    const fullRangeMatch = seriesText.match(/(\d+)×(\d+)-(\d+)/);
    if (fullRangeMatch) {
      const series = parseInt(fullRangeMatch[1]);
      const minReps = parseInt(fullRangeMatch[2]);
      const maxReps = parseInt(fullRangeMatch[3]);
      const averageReps = (minReps + maxReps) / 2;
      
      // Retourner le total : nombre de séries × répétitions moyennes
      return Math.round(series * averageReps);
    }
    
    // Rechercher le pattern "nombre×nombre" (ex: "4×10")
    const seriesMatch = seriesText.match(/(\d+)×(\d+)/);
    if (seriesMatch) {
      const series = parseInt(seriesMatch[1]);
      const reps = parseInt(seriesMatch[2]);
      return series * reps;
    }
    
    // Rechercher le pattern "nombre-nombre" sans séries (ex: "10-12")
    const rangeMatch = seriesText.match(/(\d+)-(\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      const average = (min + max) / 2;
      
      return Math.round(average);
    }
    
    // Si pas de range trouvé, essayer de trouver un nombre simple
    const singleMatch = seriesText.match(/(\d+)/);
    if (singleMatch) {
      return parseInt(singleMatch[1]);
    }
    
    return null;
  };

  const toggleCheck = (exerciseId, date, autoReps = null) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    const isCurrentlyChecked = currentData.checkedExercises[key] || false;
    
    // Si on décoche, on supprime les reps
    if (isCurrentlyChecked) {
      const newData = {
        ...currentData,
        checkedExercises: {
          ...currentData.checkedExercises,
          [key]: false
        },
        reps: {
          ...currentData.reps,
          [key]: undefined
        }
      };
      updateTempExerciseData(newData);
      return;
    }
    
    // Si on coche et qu'il y a des reps automatiques
    if (autoReps) {
      const exerciseKey = `${dateStr}_${exerciseId}`;
      if (!currentData.reps[exerciseKey]) {
        const newData = {
          ...currentData,
          checkedExercises: {
            ...currentData.checkedExercises,
            [key]: true
          },
          reps: {
            ...currentData.reps,
            [key]: autoReps.toString()
          }
        };
        updateTempExerciseData(newData);
        return;
      }
    }
    
    // Comportement normal : juste cocher/décocher
    const newData = {
      ...currentData,
      checkedExercises: {
        ...currentData.checkedExercises,
        [key]: !isCurrentlyChecked
      }
    };
    updateTempExerciseData(newData);
  };

  const updateReps = (exerciseId, reps, date) => {
    try {
      // Validation des paramètres d'entrée
      if (!exerciseId || exerciseId < 0) {
        return;
      }
      
      if (!date) {
        return;
      }

      // Validation et nettoyage de la valeur des répétitions
      let cleanReps = reps;
      if (reps !== '' && reps !== undefined && reps !== null) {
        const numReps = parseInt(reps);
        if (isNaN(numReps) || numReps < 0 || numReps > 999) {
          cleanReps = '';
        } else {
          cleanReps = numReps.toString();
        }
      }

      const dateStr = getDateStr(date);
      const key = `${dateStr}_${exerciseId}`;
      
      // Vérification de l'intégrité des données actuelles
      if (!currentData || typeof currentData !== 'object') {
        return;
      }
      
      const newData = {
        ...currentData,
        reps: {
          ...currentData.reps,
          [key]: cleanReps
        }
      };
      
      updateTempExerciseData(newData);
    } catch (error) {
      console.error('Erreur dans updateReps:', error);
    }
  };

  const toggleEtirement = (type, date) => {
    try {
      // Validation des paramètres
      if (!type || typeof type !== 'string') {
        return;
      }
      
      if (!date) {
        return;
      }

      const dateStr = getDateStr(date);
      const key = `${dateStr}_${type}`;
      
      // Vérification de l'intégrité des données actuelles
      if (!currentData || typeof currentData !== 'object') {
        return;
      }
      
      const newData = {
        ...currentData,
        checkedStretches: {
          ...currentData.checkedStretches,
          [key]: !currentData.checkedStretches[key]
        }
      };
      
      updateTempStretchData(newData);
    } catch (error) {
      console.error('Erreur dans toggleEtirement:', error);
    }
  };

  const changeWeekVariant = (variant) => {
    try {
      // Validation de la variante
      if (!variant || (variant !== 'A' && variant !== 'B')) {
        return;
      }

      // Vérification de l'intégrité des données actuelles
      if (!currentData || typeof currentData !== 'object') {
        return;
      }

      const newData = {
        ...currentData,
        weekVariant: variant
      };
      
      updateData(newData);
    } catch (error) {
      console.error('Erreur dans changeWeekVariant:', error);
    }
  };

  const startProgram = () => {
    try {
      // Vérification de l'intégrité des données actuelles
      if (!currentData || typeof currentData !== 'object') {
        return;
      }

      const startDate = new Date().toISOString();
      const newData = {
        ...currentData,
        startDate,
        weekVariant: 'A'
      };
      
      updateData(newData);
    } catch (error) {
      console.error('Erreur dans startProgram:', error);
    }
  };

  const resetAll = () => {
    try {
      // Confirmation avant réinitialisation complète
      if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
        return;
      }

      const newData = {
        checkedExercises: {},
        reps: {},
        checkedStretches: {},
        startDate: null,
        weekVariant: 'A',
        progressPhotos: []
      };
      
      updateData(newData);
    } catch (error) {
      console.error('Erreur dans resetAll:', error);
    }
  };

  return {
    getDateStr,
    getDayName,
    getTodayWorkout,
    toggleCheck,
    updateReps,
    toggleEtirement,
    changeWeekVariant,
    startProgram,
    resetAll
  };
};