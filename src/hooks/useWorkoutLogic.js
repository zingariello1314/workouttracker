import { workoutProgram } from '../data/workoutProgram';
import { getDateStr, getDayName, getAutoWeekVariant } from '../utils/dateUtils';
import { calculateAutoReps } from '../utils/exerciseCalculations';
import { useAuth } from '../context/AuthContext';
import { isAdminUser } from '../utils/accessControl';

export const useWorkoutLogic = (data, updateData, getCurrentData, updateTempExerciseData, updateTempStretchData) => {
  // Utiliser getCurrentData si disponible, sinon data
  const currentData = getCurrentData ? getCurrentData() : data;

  const { currentUser } = useAuth();
  const isAdmin = isAdminUser(currentUser);

  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  const getTodayWorkout = (currentDate, isGymMode = false) => {
    // Pour tous les comptes qui ne sont pas ton admin, on ne doit pas exposer le programme intégré.
    if (!isAdmin) {
      const currentWeekVariant = getAutoWeekVariant(currentDate);
      return {
        name: null,
        focus: null,
        exercices: [],
        etirements: { matin: [], midi: [], soir: [] },
        isGymMode: false,
        weekVariant: currentWeekVariant
      };
    }

    const dayName = getDayName(currentDate);
    const baseWorkout = workoutProgram[dayName] || {
      exercices: [],
      etirements: { matin: [], midi: [], soir: [] }
    };
    
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

  // Alias pour compatibilité : calculateAverageReps utilise calculateAutoReps avec arrondi
  const calculateAverageReps = (seriesText) => {
    return calculateAutoReps(seriesText, { round: true });
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
        exerciseWeights: {},
        exerciseWeightPerArm: {},
        exerciseSetWeights: {},
        checkedStretches: {},
        startDate: null,
        weekVariant: 'A',
        progressPhotos: [],
        exerciseMaxRecords: [],
        exerciseMaxHistory: [],
        performanceRetestPlans: []
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
    resetAll,
    calculateAverageReps // Exporter pour compatibilité
  };
};