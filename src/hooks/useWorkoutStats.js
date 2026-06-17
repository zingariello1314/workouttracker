import { useWorkout } from '../context/WorkoutContext';
import { workoutProgram } from '../data/workoutProgram';
import { getDateStr } from '../utils/dateUtils';
import { resolveExerciseIntensityCoeff } from '../utils/trainingLoadUtils';
import {
  calculateCurrentTrainingStreak,
  calculateLongestTrainingStreak,
} from '../utils/trainingStreakUtils';

export const useWorkoutStats = () => {
  const { getCurrentProgram, getDayName, getDateStr, getCurrentData, activeProgram } = useWorkout();

  // Fonction pour obtenir le programme à utiliser (actif ou par défaut)
  const getProgram = () => {
    if (activeProgram && activeProgram.schedule) {
      // Convertir le format du programme actif vers le format attendu
      const convertedProgram = {};
      Object.entries(activeProgram.schedule).forEach(([day, dayData]) => {
        convertedProgram[day.toLowerCase()] = {
          exercices: dayData.exercises || [],
          salleVariants: dayData.salleVariants ? {
            semaineA: { exercices: dayData.salleVariants.semaineA?.exercises || [] },
            semaineB: { exercices: dayData.salleVariants.semaineB?.exercises || [] }
          } : undefined
        };
      });
      return convertedProgram;
    }
    return workoutProgram;
  };

  const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate: now };
  };

  const getStats = (period) => {
    const { startDate, endDate } = getDateRange(period);
    const stats = {};
    const currentData = getCurrentData();
    
    Object.entries(currentData.reps).forEach(([key, reps]) => {
      const [dateStr, exerciseId] = key.split('_');
      const date = new Date(dateStr);
      
      if (date >= startDate && date <= endDate) {
        const dayName = getDayName(date);
        const currentProgram = getProgram();
        const workout = currentProgram[dayName];
        if (workout) {
          const exercise = workout.exercices.find(ex => ex.id.toString() === exerciseId);
          if (exercise) {
            const exerciseName = exercise.nom;
            if (!stats[exerciseName]) {
              stats[exerciseName] = {
                totalReps: 0,
                sessions: 0,
                bestSession: 0,
                dates: []
              };
            }
            
            const repsNum = parseInt(reps) || 0;
            const stat = stats[exerciseName];
            stat.totalReps += repsNum;
            stat.sessions += 1;
            stat.bestSession = Math.max(stat.bestSession, repsNum);
            stat.dates.push(dateStr);
          }
        }
      }
    });

    const sortedStats = Object.entries(stats)
      .sort(([,a], [,b]) => b.totalReps - a.totalReps)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return sortedStats;
  };

  const getCurrentStreak = () => calculateCurrentTrainingStreak(getCurrentData());

  const getLongestStreak = () => calculateLongestTrainingStreak(getCurrentData());

  const getWorkoutHistory = () => {
    const currentData = getCurrentData();
    if (!currentData || !currentData.reps || !currentData.checkedExercises) {
      return [];
    }

    const history = [];
    const processedDates = new Set();

    Object.entries(currentData.reps).forEach(([key, reps]) => {
      const [dateStr, exerciseId] = key.split('_');
      
      if (!processedDates.has(dateStr)) {
        processedDates.add(dateStr);
        
        const date = new Date(dateStr);
        const dayName = getDayName(date);
        const currentProgram = getProgram();
        const workout = currentProgram[dayName];
        
        if (workout) {
          // Utiliser les variantes de salle si disponibles, sinon les exercices de base
          const exercisesList = workout.salleVariants?.semaineA?.exercices || workout.exercices;
          
          const exercises = exercisesList.map(exercise => {
            // Chercher la clé avec les différents suffixes possibles
            let exerciseKey = `${dateStr}_${exercise.id}`;
            let exerciseReps = 0;
            let isCompleted = false;
            let hasUserInput = false; // ← NOUVEAU: Vérifier si l'utilisateur a vraiment saisi quelque chose
            
            // Vérifier d'abord la clé de base
            if (currentData.reps[exerciseKey] !== undefined && currentData.reps[exerciseKey] !== null && currentData.reps[exerciseKey] !== '') {
              exerciseReps = parseInt(currentData.reps[exerciseKey]) || 0;
              isCompleted = currentData.checkedExercises[exerciseKey] || false;
              hasUserInput = true;
            } else {
              // Si pas trouvé, essayer avec les suffixes de variantes
              const keysToTry = [
                `${dateStr}_${exercise.id}_semaineA`,
                `${dateStr}_${exercise.id}_semaineB`
              ];
              
              for (const keyToTry of keysToTry) {
                if (currentData.reps[keyToTry] !== undefined && currentData.reps[keyToTry] !== null && currentData.reps[keyToTry] !== '') {
                  exerciseKey = keyToTry;
                  exerciseReps = parseInt(currentData.reps[keyToTry]) || 0;
                  isCompleted = currentData.checkedExercises[keyToTry] || false;
                  hasUserInput = true;
                  break;
                }
              }
            }
            
            return {
              ...exercise,
              reps: exerciseReps,
              completed: isCompleted,
              hasUserInput // ← NOUVEAU: Marquer si l'utilisateur a saisi des données
            };
          }).filter(ex => ex.hasUserInput && ex.reps > 0); // ← CORRECTION FINALE: Ne garder que les exercices avec saisie utilisateur ET répétitions > 0

          // Ajouter les activités complémentaires si elles sont cochées
          if (workout.complementaryActivity) {
            const complementaryKey = `${dateStr}_complementary_${workout.complementaryActivity.name.toLowerCase()}`;
            const isComplementaryCompleted = currentData.checkedExercises[complementaryKey] || false;
            
            if (isComplementaryCompleted) {
              exercises.push({
                id: `complementary_${workout.complementaryActivity.name.toLowerCase()}`,
                nom: workout.complementaryActivity.name,
                name: workout.complementaryActivity.name,
                type: workout.complementaryActivity.type,
                reps: parseInt(workout.complementaryActivity.duration) || 0, // Utiliser la durée comme "reps"
                completed: true,
                isComplementary: true,
                duration: workout.complementaryActivity.duration,
                intensity: workout.complementaryActivity.intensity
              });
            }
          }

          if (exercises.length > 0) {
            // Calculer la durée réelle de la session
            const calculateSessionDuration = () => {
              let totalDurationMinutes = 0;
              
              exercises.forEach(exercise => {
                const baseKey = `${dateStr}_${exercise.id}`;
                
                // Utiliser la même logique de recherche de clé que pour les répétitions
                let actualKey = baseKey;
                
                // Vérifier d'abord la clé de base
                if (currentData?.checkedExercises?.[baseKey] !== undefined) {
                  actualKey = baseKey;
                } else {
                  // Chercher avec les suffixes
                  const possibleKeys = [
                    `${baseKey}_semaineA`,
                    `${baseKey}_semaineB`
                  ];
                  
                  for (const possibleKey of possibleKeys) {
                    if (currentData?.checkedExercises?.[possibleKey] !== undefined) {
                      actualKey = possibleKey;
                      break;
                    }
                  }
                }
                
                const isCompleted = currentData?.checkedExercises?.[actualKey];
                if (!isCompleted) return;
                
                let exerciseDuration = 0;
                
                // Calculer la durée selon le type d'exercice
                if (exercise.isIsometric) {
                  // Pour les exercices isométriques (planches, etc.)
                  const timeMatch = exercise.time?.match(/(\d+)\s*(min|sec)/);
                  if (timeMatch) {
                    const timeValue = parseInt(timeMatch[1]);
                    const timeUnit = timeMatch[2];
                    exerciseDuration = timeUnit === 'min' ? timeValue * 60 : timeValue;
                  } else {
                    exerciseDuration = exercise.reps; // Pour les planches en secondes
                  }
                } else {
                  // Pour les exercices dynamiques
                  const sets = exercise.sets || 1;
                  const avgReps = exercise.reps;
                  const timePerRep = exercise.timePerRep || 2; // 2 secondes par défaut
                  const restTime = exercise.restTime || 30; // 30 secondes de repos par défaut
                  
                  exerciseDuration = sets * avgReps * timePerRep; // en secondes
                  
                  // Ajouter le temps de repos entre les séries
                  exerciseDuration += (sets - 1) * restTime;
                }
                
                totalDurationMinutes += exerciseDuration / 60; // convertir en minutes
                
                // Ajouter du temps pour les étirements si présents
                if (exercise.stretches) {
                  const stretchTimeMatch = exercise.stretches.match(/(\d+)\s*min/);
                  if (stretchTimeMatch) {
                    totalDurationMinutes += parseInt(stretchTimeMatch[1]) / 60;
                  }
                }
                
                // Ajouter du temps pour l'échauffement si présent
                if (exercise.warmup) {
                  const warmupTimeMatch = exercise.warmup.match(/(\d+)\s*min/);
                  if (warmupTimeMatch) {
                    totalDurationMinutes += parseInt(warmupTimeMatch[1]);
                  }
                }
              });
              
              return Math.round(totalDurationMinutes);
            };

            const userCoeffs = currentData.exerciseIntensityCoeffs || {};
            const totalRepsSession = exercises.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0);
            const totalLoadSession = exercises.reduce((sum, ex) => {
              const r = parseInt(ex.reps, 10) || 0;
              if (r <= 0) return sum;
              const c = resolveExerciseIntensityCoeff(
                {
                  id: ex.id,
                  name: ex.name || ex.nom,
                  nom: ex.nom || ex.name,
                  series: ex.series,
                  type: ex.type
                },
                userCoeffs
              );
              return sum + r * c;
            }, 0);

            const sessionData = {
              date: dateStr,
              exercises,
              totalReps: totalRepsSession,
              totalLoad: totalLoadSession,
              duration: calculateSessionDuration() // Ajouter la durée calculée
            };
            history.push(sessionData);
          }
        }
      }
    });

    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // ✅ NOUVEAU : Fonction pour obtenir les statistiques de justifications
  const getJustificationStats = (period = 'all') => {
    const currentData = getCurrentData();
    const justifications = currentData?.dayJustifications || {};
    
    // Filtrer par période si nécessaire
    let filteredJustifications = justifications;
    if (period !== 'all') {
      const { startDate } = getDateRange(period);
      filteredJustifications = {};
      Object.entries(justifications).forEach(([dateStr, justification]) => {
        const date = new Date(dateStr);
        if (date >= startDate) {
          filteredJustifications[dateStr] = justification;
        }
      });
    }
    
    // Calculer les statistiques
    const total = Object.keys(filteredJustifications).length;
    const byReason = {};
    const dates = [];
    
    Object.entries(filteredJustifications).forEach(([dateStr, justification]) => {
      const reason = justification?.reason || 'autre';
      byReason[reason] = (byReason[reason] || 0) + 1;
      dates.push(dateStr);
    });
    
    return {
      total,
      byReason,
      dates: dates.sort(),
      period
    };
  };

  return {
    getStats,
    getCurrentStreak,
    getLongestStreak,
    getWorkoutHistory,
    getDateRange,
    getJustificationStats // ✅ NOUVEAU : Statistiques de justifications
  };
};