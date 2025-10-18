export const calculateTotalReps = (exercises) => {
  return exercises.reduce((total, exercise) => total + (exercise.reps || 0), 0);
};

export const calculateWorkoutDuration = (exercises) => {
  // Estimation basée sur le nombre d'exercices et de répétitions
  const baseTimePerExercise = 2; // minutes
  const timePerRep = 0.1; // minutes
  
  return exercises.reduce((total, exercise) => {
    return total + baseTimePerExercise + (exercise.reps || 0) * timePerRep;
  }, 0);
};

export const getMuscleGroups = (exercises) => {
  const muscleGroups = new Set();
  exercises.forEach(exercise => {
    if (exercise.muscle) {
      muscleGroups.add(exercise.muscle);
    }
  });
  return Array.from(muscleGroups);
};

export const getExercisesByMuscleGroup = (exercises) => {
  const groups = {};
  exercises.forEach(exercise => {
    const muscle = exercise.muscle || 'Autre';
    if (!groups[muscle]) {
      groups[muscle] = [];
    }
    groups[muscle].push(exercise);
  });
  return groups;
};

export const calculateIntensity = (exercises, maxReps = 100) => {
  const totalReps = calculateTotalReps(exercises);
  const exerciseCount = exercises.length;
  
  // Formule d'intensité basée sur les répétitions et le nombre d'exercices
  const intensity = Math.min(10, Math.max(1, 
    (totalReps / maxReps) * 5 + (exerciseCount / 10) * 5
  ));
  
  return Math.round(intensity);
};

export const getWorkoutLevel = (totalReps) => {
  if (totalReps < 50) return { level: 'Débutant', color: 'green' };
  if (totalReps < 100) return { level: 'Intermédiaire', color: 'yellow' };
  if (totalReps < 200) return { level: 'Avancé', color: 'orange' };
  return { level: 'Expert', color: 'red' };
};

export const formatWorkoutSummary = (exercises) => {
  const totalReps = calculateTotalReps(exercises);
  const duration = calculateWorkoutDuration(exercises);
  const muscleGroups = getMuscleGroups(exercises);
  const intensity = calculateIntensity(exercises);
  
  return {
    totalReps,
    duration: Math.round(duration),
    muscleGroups,
    intensity,
    exerciseCount: exercises.length
  };
};

export const getExerciseVariations = (exerciseName) => {
  const variations = {
    'Pompes': [
      'Pompes classiques',
      'Pompes inclinées',
      'Pompes déclinées',
      'Pompes diamant',
      'Pompes larges'
    ],
    'Squats': [
      'Squats classiques',
      'Squats sumo',
      'Squats bulgares',
      'Squats sautés',
      'Squats pistolet'
    ],
    'Tractions': [
      'Tractions pronation',
      'Tractions supination',
      'Tractions neutres',
      'Tractions larges',
      'Tractions commando'
    ]
  };
  
  return variations[exerciseName] || [exerciseName];
};

export const estimateCalories = (exercises, userWeight = 70) => {
  // Estimation basée sur le MET (Metabolic Equivalent of Task)
  const metValue = 6; // Valeur MET pour l'entraînement de force
  const duration = calculateWorkoutDuration(exercises) / 60; // en heures
  
  return Math.round(metValue * userWeight * duration);
};

export const getProgressTrend = (workoutHistory, days = 7) => {
  if (workoutHistory.length < 2) return 'stable';
  
  const recent = workoutHistory.slice(0, days);
  const older = workoutHistory.slice(days, days * 2);
  
  if (recent.length === 0 || older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, w) => sum + w.totalReps, 0) / recent.length;
  const olderAvg = older.reduce((sum, w) => sum + w.totalReps, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 10) return 'improving';
  if (change < -10) return 'declining';
  return 'stable';
};