import { workoutProgram } from '../data/workoutProgram';
import { getDateStr } from '../utils/dateUtils';

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
    
    // Si c'est samedi ou dimanche et qu'on est en mode salle, utiliser les variantes A/B
    if ((dayName === 'samedi' || dayName === 'dimanche') && isGymMode && baseWorkout.salleVariants) {
      const weekVariantKey = data.weekVariant === 'A' ? 'semaineA' : 'semaineB';
      const gymVariant = baseWorkout.salleVariants[weekVariantKey];
      
      if (gymVariant) {
        return {
          ...baseWorkout,
          name: gymVariant.name,
          exercices: gymVariant.exercices,
          focus: gymVariant.name,
          isGymMode: true,
          weekVariant: data.weekVariant
        };
      }
    }
    
    return {
      ...baseWorkout,
      isGymMode: false,
      weekVariant: data.weekVariant
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
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    
    const newData = {
      ...currentData,
      reps: {
        ...currentData.reps,
        [key]: reps
      }
    };
    updateTempExerciseData(newData);
  };

  const toggleEtirement = (type, date) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${type}`;
    
    const newData = {
      ...currentData,
      checkedStretches: {
        ...currentData.checkedStretches,
        [key]: !currentData.checkedStretches[key]
      }
    };
    updateTempStretchData(newData);
  };

  const changeWeekVariant = (variant) => {
    const newData = {
      ...currentData,
      weekVariant: variant
    };
    updateData(newData);
  };

  const startProgram = () => {
    const startDate = new Date().toISOString();
    const newData = {
      ...currentData,
      startDate,
      weekVariant: 'A'
    };
    updateData(newData);
  };

  const resetAll = () => {
    const newData = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {},
      startDate: null,
      weekVariant: 'A',
      progressPhotos: []
    };
    updateData(newData);
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