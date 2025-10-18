import { workoutProgram } from '../data/workoutProgram';

export const useWorkoutLogic = (data, updateData) => {
  const getDateStr = (date) => {
    return date.toISOString().split('T')[0];
  };

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

  const toggleCheck = (exerciseId, date) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    
    const newData = {
      ...data,
      checkedExercises: {
        ...data.checkedExercises,
        [key]: !data.checkedExercises[key]
      }
    };
    updateData(newData);
  };

  const updateReps = (exerciseId, reps, date) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${exerciseId}`;
    
    const newData = {
      ...data,
      reps: {
        ...data.reps,
        [key]: reps
      }
    };
    updateData(newData);
  };

  const toggleEtirement = (type, date) => {
    const dateStr = getDateStr(date);
    const key = `${dateStr}_${type}`;
    
    const newData = {
      ...data,
      checkedStretches: {
        ...data.checkedStretches,
        [key]: !data.checkedStretches[key]
      }
    };
    updateData(newData);
  };

  const changeWeekVariant = (variant) => {
    const newData = {
      ...data,
      weekVariant: variant
    };
    updateData(newData);
  };

  const startProgram = () => {
    const startDate = new Date().toISOString();
    const newData = {
      ...data,
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