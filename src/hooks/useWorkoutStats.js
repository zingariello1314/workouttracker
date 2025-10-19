import { workoutProgram } from '../data/workoutProgram';
import { getDateStr } from '../utils/dateUtils';

export const useWorkoutStats = (data) => {

  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
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
    
    Object.entries(data.reps).forEach(([key, reps]) => {
      const [dateStr, exerciseId] = key.split('_');
      const date = new Date(dateStr);
      
      if (date >= startDate && date <= endDate) {
        const dayName = getDayName(date);
        const workout = workoutProgram[dayName];
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

  const getCurrentStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = getDateStr(checkDate);
      
      const hasWorkout = Object.keys(data.checkedExercises).some(key =>
        key.startsWith(dateStr) && data.checkedExercises[key]
      );
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const getLongestStreak = () => {
    let maxStreak = 0;
    let currentStreak = 0;
    const dates = [...new Set(Object.keys(data.checkedExercises).map(key => key.split('_')[0]))].sort();
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const hasWorkout = Object.keys(data.checkedExercises).some(key =>
        key.startsWith(dateStr) && data.checkedExercises[key]
      );
      
      if (hasWorkout) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  };

  const getWorkoutHistory = () => {
    if (!data || !data.reps || !data.checkedExercises) {
      return [];
    }

    // console.log('🔍 DEBUG getWorkoutHistory: data.reps:', data.reps);
    // console.log('🔍 DEBUG getWorkoutHistory: data.checkedExercises:', data.checkedExercises);
    // console.log('🔍 DEBUG getWorkoutHistory: Nombre de clés dans reps:', Object.keys(data.reps || {}).length);
    // console.log('🔍 DEBUG getWorkoutHistory: Nombre de clés dans checkedExercises:', Object.keys(data.checkedExercises || {}).length);
    
    const history = [];
    const processedDates = new Set();

    Object.entries(data.reps).forEach(([key, reps]) => {
      const [dateStr, exerciseId] = key.split('_');
      // console.log(`🔍 DEBUG getWorkoutHistory: Traitement clé ${key} -> date: ${dateStr}, exerciseId: ${exerciseId}`);
      
      if (!processedDates.has(dateStr)) {
        processedDates.add(dateStr);
        
        const date = new Date(dateStr);
        const dayName = getDayName(date);
        const workout = workoutProgram[dayName];
        
        // console.log(`🔍 DEBUG getWorkoutHistory: Date ${dateStr}, jour: ${dayName}, workout trouvé:`, !!workout);
        
        if (workout) {
          // Utiliser les variantes de salle si disponibles, sinon les exercices de base
          const exercisesList = workout.salleVariants?.semaineA?.exercices || workout.exercices;
          
          const exercises = exercisesList.map(exercise => {
            const exerciseKey = `${dateStr}_${exercise.id}`;
            const exerciseReps = parseInt(data.reps[exerciseKey]) || 0;
            const isCompleted = data.checkedExercises[exerciseKey] || false;
            
            // console.log(`🔍 DEBUG getWorkoutHistory: Exercice ${exercise.name} (${exerciseKey}) - reps: ${exerciseReps}, completed: ${isCompleted}`);
            
            return {
              ...exercise,
              reps: exerciseReps,
              completed: isCompleted
            };
          }).filter(ex => ex.completed);

          // console.log(`🔍 DEBUG getWorkoutHistory: Exercices complétés pour ${dateStr}:`, exercises.length);

          if (exercises.length > 0) {
            const sessionData = {
              date: dateStr,
              exercises,
              totalReps: exercises.reduce((sum, ex) => sum + ex.reps, 0)
            };
            // console.log(`🔍 DEBUG getWorkoutHistory: Session ajoutée:`, sessionData);
            history.push(sessionData);
          }
        }
      }
    });

    // console.log(`🔍 DEBUG getWorkoutHistory: Historique final (${history.length} sessions):`, history);
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return {
    getStats,
    getCurrentStreak,
    getLongestStreak,
    getWorkoutHistory,
    getDateRange
  };
};