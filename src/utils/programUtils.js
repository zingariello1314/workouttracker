// Utilitaires pour la gestion des programmes d'entraînement

import { 
  ExerciseCategories, 
  MuscleGroups, 
  Equipment, 
  Difficulty, 
  ExerciseTypes 
} from '../data/workoutProgramEnhanced';

/**
 * Convertit l'ancien format de programme vers le nouveau format enrichi
 */
export const convertLegacyProgram = (legacyProgram) => {
  const convertedProgram = {
    days: {}
  };
  
  Object.entries(legacyProgram).forEach(([day, dayData]) => {
    if (typeof dayData !== 'object') return;
    
    // Utiliser 'exercices' (français) ou 'exercises' (anglais)
    const exercisesList = dayData.exercices || dayData.exercises || [];
    
    convertedProgram.days[day] = {
      ...dayData,
      primaryMuscleGroups: inferPrimaryMuscleGroups(dayData.focus),
      secondaryMuscleGroups: inferSecondaryMuscleGroups(exercisesList),
      sessionType: inferSessionType(dayData.focus, exercisesList),
      estimatedDuration: parseDuration(dayData.duree),
      
      exercises: categorizeExercises(exercisesList),
      
      // Gérer les variantes salle si elles existent
      salleVariants: dayData.salleVariants ? Object.fromEntries(
        Object.entries(dayData.salleVariants).map(([variant, variantData]) => [
          variant,
          {
            ...variantData,
            exercises: categorizeExercises(variantData.exercices || variantData.exercises || [])
          }
        ])
      ) : undefined
    };
  });
  
  return convertedProgram;
};

/**
 * Infère les groupes musculaires principaux à partir du focus
 */
const inferPrimaryMuscleGroups = (focus) => {
  if (!focus) return [];
  
  const focusLower = focus.toLowerCase();
  const groups = [];
  
  if (focusLower.includes('dos')) groups.push(MuscleGroups.BACK);
  if (focusLower.includes('pectoraux') || focusLower.includes('pecs')) groups.push(MuscleGroups.CHEST);
  if (focusLower.includes('biceps')) groups.push(MuscleGroups.BICEPS);
  if (focusLower.includes('triceps')) groups.push(MuscleGroups.TRICEPS);
  if (focusLower.includes('épaules')) groups.push(MuscleGroups.SHOULDERS);
  if (focusLower.includes('core') || focusLower.includes('abdos')) groups.push(MuscleGroups.CORE);
  if (focusLower.includes('jambes')) {
    groups.push(MuscleGroups.QUADS, MuscleGroups.HAMSTRINGS, MuscleGroups.CALVES);
  }
  
  return groups;
};

/**
 * Infère les groupes musculaires secondaires à partir des exercices
 */
const inferSecondaryMuscleGroups = (exercises) => {
  if (!exercises || !Array.isArray(exercises)) return [];
  
  const groups = new Set();
  
  exercises.forEach(exercise => {
    const secondaryMuscles = inferSecondaryMuscles(exercise.name);
    secondaryMuscles.forEach(muscle => groups.add(muscle));
  });
  
  return Array.from(groups);
};

/**
 * Infère le type de session à partir du focus et des exercices
 */
const inferSessionType = (focus, exercises) => {
  if (!focus && (!exercises || !Array.isArray(exercises))) return ExerciseTypes.STRENGTH;
  
  const focusLower = focus ? focus.toLowerCase() : '';
  
  // Analyser le focus
  if (focusLower.includes('cardio')) return ExerciseTypes.CARDIO;
  if (focusLower.includes('core') || focusLower.includes('abdos')) return ExerciseTypes.CORE;
  if (focusLower.includes('étirement') || focusLower.includes('stretching')) return ExerciseTypes.FLEXIBILITY;
  
  // Analyser les exercices si pas de focus clair
  if (exercises && Array.isArray(exercises)) {
    const cardioCount = exercises.filter(ex => 
      ex.name.toLowerCase().includes('cardio') || 
      ex.name.toLowerCase().includes('course')
    ).length;
    
    if (cardioCount > exercises.length / 2) return ExerciseTypes.CARDIO;
  }
  
  return ExerciseTypes.STRENGTH;
};

/**
 * Parse la durée d'une session
 */
const parseDuration = (dureeStr) => {
  if (!dureeStr) return 60; // défaut 1h
  
  const match = dureeStr.match(/(\d+)(?:-(\d+))?\s*(?:h|min)?/);
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return Math.round((min + max) / 2);
  }
  
  return 60;
};

/**
 * Catégorise les exercices selon leur type
 */
export const categorizeExercises = (exercises) => {
  if (!exercises || !Array.isArray(exercises)) return [];
  
  return exercises.map(exercise => enrichExercise(exercise));
};

/**
 * Enrichit un exercice avec des métadonnées
 */
export const enrichExercise = (exercise) => {
  const name = exercise.name.toLowerCase();
  
  return {
    ...exercise,
    metadata: {
      category: inferExerciseCategory(name),
      primaryMuscleGroup: inferMuscleGroup(name),
      secondaryMuscles: inferSecondaryMuscles(name),
      equipment: inferEquipment(exercise.materiel || ''),
      difficulty: inferDifficulty(name, exercise.series),
      restTime: inferRestTime(exercise.series),
      technique: exercise.notes || ''
    }
  };
};

/**
 * Infère la catégorie d'un exercice
 */
const inferExerciseCategory = (name) => {
  const lowerName = name.toLowerCase();
  
  // Boxe - détection par contexte et mots-clés
  if (lowerName.includes('boxe') || lowerName.includes('boxing') || 
      lowerName.includes('shadow') || lowerName.includes('sac de frappe') ||
      lowerName.includes('uppercut') || lowerName.includes('jab') ||
      lowerName.includes('hook') || lowerName.includes('cross')) {
    return ExerciseCategories.BOXING;
  }
  
  // Natation - détection par contexte et mots-clés
  if (lowerName.includes('natation') || lowerName.includes('swimming') ||
      lowerName.includes('crawl') || lowerName.includes('brasse') ||
      lowerName.includes('dos crawlé') || lowerName.includes('papillon') ||
      lowerName.includes('nage') || lowerName.includes('piscine')) {
    return ExerciseCategories.SWIMMING;
  }
  
  // Mobilité et étirements
  if (lowerName.includes('étirement') || lowerName.includes('stretching') ||
      lowerName.includes('mobilité') || lowerName.includes('mobility') ||
      lowerName.includes('assouplissement') || lowerName.includes('yoga') ||
      lowerName.includes('wall slide') || lowerName.includes('cat cow') ||
      lowerName.includes('chat-vache') || lowerName.includes('sphinx')) {
    return ExerciseCategories.MOBILITY;
  }
  
  // Isométrique - exercices statiques
  if ((lowerName.includes('planche') && !lowerName.includes('pompe')) ||
      lowerName.includes('gainage') && lowerName.includes('statique') ||
      lowerName.includes('dead hang') || lowerName.includes('l-sit')) {
    return ExerciseCategories.ISOMETRIC;
  }
  
  // Cardio - exercices cardiovasculaires
  if (lowerName.includes('mountain climber') || lowerName.includes('burpee') ||
      lowerName.includes('jumping') || lowerName.includes('course') ||
      lowerName.includes('vélo') || lowerName.includes('rameur') ||
      lowerName.includes('cardio') || lowerName.includes('hiit')) {
    return ExerciseCategories.CARDIO;
  }
  
  // Core - exercices de gainage et abdominaux
  if (lowerName.includes('gainage') || lowerName.includes('vacuum') || 
      lowerName.includes('crunch') || lowerName.includes('planche') ||
      lowerName.includes('relevé') && lowerName.includes('genoux') ||
      lowerName.includes('abdos') || lowerName.includes('core') ||
      lowerName.includes('russian twist') || lowerName.includes('bicycle')) {
    return ExerciseCategories.CORE;
  }
  
  // Par défaut : force/musculation
  return ExerciseCategories.STRENGTH;
};

/**
 * Infère le groupe musculaire principal
 */
const inferMuscleGroup = (name) => {
  const lowerName = name.toLowerCase();
  
  // Dos et tractions
  if (lowerName.includes('traction') || lowerName.includes('rowing') || 
      lowerName.includes('tirage') || lowerName.includes('relevé de genoux')) {
    return MuscleGroups.BACK;
  }
  
  // Pectoraux et poussée
  if (lowerName.includes('pompe') || lowerName.includes('développé') || 
      lowerName.includes('push') || lowerName.includes('press')) {
    return MuscleGroups.CHEST;
  }
  
  // Biceps
  if (lowerName.includes('curl') || lowerName.includes('bicep')) {
    return MuscleGroups.BICEPS;
  }
  
  // Triceps et dips
  if (lowerName.includes('dips') || lowerName.includes('extension') || 
      lowerName.includes('tricep')) {
    return MuscleGroups.TRICEPS;
  }
  
  // Épaules
  if (lowerName.includes('élévation') || lowerName.includes('militaire') || 
      lowerName.includes('shoulder') || lowerName.includes('épaule')) {
    return MuscleGroups.SHOULDERS;
  }
  
  // Jambes
  if (lowerName.includes('squat') || lowerName.includes('fente') || 
      lowerName.includes('leg') || lowerName.includes('jambe') ||
      lowerName.includes('mollet') || lowerName.includes('quadricep') ||
      lowerName.includes('ischio') || lowerName.includes('fessier')) {
    return MuscleGroups.LEGS;
  }
  
  // Core et abdominaux
  if (lowerName.includes('gainage') || lowerName.includes('planche') || 
      lowerName.includes('crunch') || lowerName.includes('abdo') ||
      lowerName.includes('mountain climber') || lowerName.includes('vacuum') ||
      lowerName.includes('core') || lowerName.includes('relevé')) {
    return MuscleGroups.CORE;
  }
  
  // Cardio
  if (lowerName.includes('burpee') || lowerName.includes('jumping') ||
      lowerName.includes('sprint') || lowerName.includes('course')) {
    return MuscleGroups.FULL_BODY;
  }
  
  return MuscleGroups.FULL_BODY;
};

/**
 * Infère les muscles secondaires
 */
const inferSecondaryMuscles = (name) => {
  const secondary = [];
  
  if (name.includes('pompe')) {
    secondary.push(MuscleGroups.TRICEPS, MuscleGroups.SHOULDERS);
  }
  if (name.includes('traction')) {
    secondary.push(MuscleGroups.BICEPS);
  }
  if (name.includes('dips')) {
    secondary.push(MuscleGroups.CHEST, MuscleGroups.SHOULDERS);
  }
  
  return secondary;
};

/**
 * Infère l'équipement nécessaire
 */
const inferEquipment = (materielStr) => {
  if (!materielStr) return Equipment.BODYWEIGHT;
  
  const materiel = materielStr.toLowerCase();
  
  if (materiel.includes('barre')) return Equipment.BARBELL;
  if (materiel.includes('haltère')) return Equipment.DUMBBELL;
  if (materiel.includes('parallèles')) return Equipment.PARALLELS;
  if (materiel.includes('banc')) return Equipment.BENCH;
  if (materiel.includes('élastique')) return Equipment.ELASTIC;
  if (materiel.includes('gilet')) return Equipment.WEIGHTED_VEST;
  if (materiel.includes('poignées')) return Equipment.HANDLES;
  
  return Equipment.BODYWEIGHT;
};

/**
 * Infère la difficulté
 */
const inferDifficulty = (name, series) => {
  // Exercices avancés
  if (name.includes('traction') && !name.includes('australienne')) return Difficulty.ADVANCED;
  if (name.includes('muscle up')) return Difficulty.EXPERT;
  if (name.includes('pseudo-planche')) return Difficulty.ADVANCED;
  
  // Exercices intermédiaires
  if (name.includes('dips')) return Difficulty.INTERMEDIATE;
  if (name.includes('pompe') && name.includes('décliné')) return Difficulty.INTERMEDIATE;
  
  // Basé sur les séries
  if (series) {
    const repsMatch = series.match(/(\d+)/);
    if (repsMatch) {
      const reps = parseInt(repsMatch[1]);
      if (reps <= 5) return Difficulty.ADVANCED;
      if (reps <= 8) return Difficulty.INTERMEDIATE;
    }
  }
  
  return Difficulty.BEGINNER;
};

/**
 * Infère le temps de repos
 */
const inferRestTime = (series) => {
  // Temps de repos basé sur l'intensité
  if (series?.includes('×')) {
    const repsMatch = series.match(/×(\d+)/);
    if (repsMatch) {
      const reps = parseInt(repsMatch[1]);
      if (reps <= 5) return 180; // Force pure
      if (reps <= 8) return 120; // Force-endurance
      if (reps <= 12) return 90;  // Hypertrophie
      return 60; // Endurance
    }
  }
  
  return 90; // Défaut
};

/**
 * Filtre les exercices selon des critères
 */
const LEG_RECAP_SPLIT = new Set([MuscleGroups.QUADS, MuscleGroups.HAMSTRINGS, MuscleGroups.CALVES]);

function exerciseMatchesMuscleGroupFilter(exerciseGroup, selectedGroup) {
  if (!selectedGroup) return true;
  if (!exerciseGroup) return false;
  if (exerciseGroup === selectedGroup) return true;
  if (selectedGroup === MuscleGroups.LEGS && (exerciseGroup === MuscleGroups.LEGS || LEG_RECAP_SPLIT.has(exerciseGroup))) {
    return true;
  }
  if (LEG_RECAP_SPLIT.has(selectedGroup) && exerciseGroup === MuscleGroups.LEGS) {
    return true;
  }
  return false;
}

export const filterExercises = (exercises, filters) => {
  if (!Array.isArray(exercises)) return [];

  return exercises.filter(exercise => {
    // Filtre de recherche textuelle
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const exerciseName = (exercise.name || '').toLowerCase();
      const exerciseNotes = (exercise.notes || '').toLowerCase();
      const exerciseType = (exercise.type || '').toLowerCase();
      
      const matchesSearch = exerciseName.includes(searchTerm) || 
                           exerciseNotes.includes(searchTerm) || 
                           exerciseType.includes(searchTerm);
      
      if (!matchesSearch) return false;
    }
    
    // Autres filtres
    if (filters.category && exercise.category !== filters.category) return false;
    if (filters.muscleGroup && !exerciseMatchesMuscleGroupFilter(exercise.muscleGroup, filters.muscleGroup)) {
      return false;
    }
    if (filters.equipment && exercise.equipment !== filters.equipment) return false;
    if (filters.difficulty && exercise.difficulty !== filters.difficulty) return false;
    if (filters.maxDuration && exercise.estimatedDuration > filters.maxDuration) return false;
    
    return true;
  });
};

/**
 * Génère des suggestions d'exercices alternatifs
 */
export const getSuggestedAlternatives = (exercise, allExercises) => {
  if (!exercise || !Array.isArray(allExercises)) return [];
  
  return allExercises.filter(alt => 
    alt.id !== exercise.id &&
    alt.muscleGroup === exercise.muscleGroup &&
    Math.abs(alt.difficulty - exercise.difficulty) <= 1
  ).slice(0, 3);
};

/**
 * Calcule les statistiques d'un programme
 */
export const calculateProgramStats = (program) => {
  const stats = {
    totalDays: 0,
    totalExercises: 0,
    equipmentNeeded: new Set(),
    muscleGroupsCovered: new Set(),
    averageDifficulty: 0,
    estimatedWeeklyDuration: 0
  };
  
  Object.values(program).forEach(day => {
    if (typeof day !== 'object' || !day.exercices) return;
    
    stats.totalDays++;
    stats.estimatedWeeklyDuration += day.estimatedDuration || 0;
    
    if (day.primaryMuscleGroups) {
      day.primaryMuscleGroups.forEach(mg => stats.muscleGroupsCovered.add(mg));
    }
    
    // Compter les exercices et analyser l'équipement
    const dayExercises = extractAllExercises(day.exercices);
    stats.totalExercises += dayExercises.length;
    
    dayExercises.forEach(exercise => {
      if (exercise.equipment) stats.equipmentNeeded.add(exercise.equipment);
      if (exercise.difficulty) stats.averageDifficulty += exercise.difficulty;
    });
  });
  
  stats.averageDifficulty = stats.totalExercises > 0 ? 
    stats.averageDifficulty / stats.totalExercises : 0;
  
  return {
    ...stats,
    equipmentNeeded: Array.from(stats.equipmentNeeded),
    muscleGroupsCovered: Array.from(stats.muscleGroupsCovered)
  };
};

/**
 * Extrait tous les exercices d'une structure d'exercices
 */
const extractAllExercises = (exercicesStructure) => {
  const exercises = [];
  
  if (Array.isArray(exercicesStructure)) {
    return exercicesStructure;
  }
  
  Object.values(exercicesStructure).forEach(section => {
    if (Array.isArray(section)) {
      exercises.push(...section);
    } else if (section.exercises) {
      exercises.push(...section.exercises);
    }
  });
  
  return exercises;
};