// Structure améliorée du programme d'entraînement avec catégorisation intelligente

// Énumérations pour la catégorisation
export const ExerciseCategories = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  CORE: 'core',
  ISOMETRIC: 'isometric',
  BOXING: 'boxing',
  SWIMMING: 'swimming',
  MOBILITY: 'mobility'
};

export const MuscleGroups = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  /** @deprecated Préférer QUADS / HAMSTRINGS / CALVES pour le Récap ; conservé pour filtres / legacy. */
  LEGS: 'legs',
  QUADS: 'quads',
  HAMSTRINGS: 'hamstrings',
  CALVES: 'calves',
  CORE: 'core',
  FULL_BODY: 'full_body'
};

export const Equipment = {
  BODYWEIGHT: 'bodyweight',
  BARBELL: 'barbell',
  DUMBBELL: 'dumbbell',
  PARALLELS: 'parallels',
  BENCH: 'bench',
  ELASTIC: 'elastic',
  WEIGHTED_VEST: 'weighted_vest',
  HANDLES: 'handles'
};

export const Difficulty = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4
};

export const ExerciseTypes = {
  REGULAR: 'regular',
  SUPERSET: 'superset',
  CIRCUIT: 'circuit',
  FINISHER: 'finisher',
  WARMUP: 'warmup',
  COOLDOWN: 'cooldown'
};

// Structure améliorée du programme
export const enhancedWorkoutProgram = {
  metadata: {
    name: "Programme Street Workout-Boxe Cycle 3+1",
    version: "2.0",
    author: "Système d'entraînement personnalisé",
    description: "Programme complet combinant street workout et boxe",
    duration: "4 semaines",
    level: Difficulty.INTERMEDIATE
  },

  lundi: {
    name: "Street Workout-Boxe",
    focus: "dos / core / contrôle",
    primaryMuscleGroups: [MuscleGroups.BACK, MuscleGroups.CORE],
    secondaryMuscleGroups: [MuscleGroups.BICEPS, MuscleGroups.SHOULDERS],
    sessionType: "strength_endurance",
    estimatedDuration: 60, // en minutes
    
    etirements: {
      categories: {
        mobility: {
          matin: {
            duration: 6,
            exercises: [
              {
                name: "Respiration nasale lente",
                duration: 1,
                position: "assis ou allongé",
                focus: "relaxation",
                instructions: "main sur ventre"
              },
              {
                name: "Auto-grandissement assis",
                duration: 1,
                focus: "posture",
                instructions: "aligner tête/colonne/bassin"
              },
              {
                name: "Mobilisation cervicale",
                duration: 2,
                focus: "neck_mobility",
                instructions: "flexion / extension / rotation douce"
              },
              {
                name: "Rotations d'épaules",
                duration: 2,
                focus: "shoulder_mobility",
                instructions: "bras pendants, debout"
              }
            ]
          },
          midi: {
            duration: 5,
            exercises: [
              {
                name: "Étirement passif psoas",
                duration: 2,
                focus: "hip_flexors",
                instructions: "fente jambe arrière posée, dos droit"
              },
              {
                name: "Étirement rotation thoracique",
                duration: 1,
                focus: "thoracic_spine",
                instructions: "couché, bras croisé à 90°"
              },
              {
                name: "Pendule d'épaule",
                duration: 2,
                focus: "shoulder_decompression",
                instructions: "buste penché, bras relâché"
              }
            ]
          },
          soir: {
            duration: 5,
            exercises: [
              {
                name: "Jambe à la paroi",
                duration: 3,
                focus: "hip_decompression",
                instructions: "décrocher le bassin"
              },
              {
                name: "Étirement fléchisseurs de hanche",
                duration: 1,
                focus: "hip_flexors",
                type: "passive"
              },
              {
                name: "Dead hang passif",
                duration: 1,
                focus: "spine_decompression",
                equipment: Equipment.BARBELL,
                optional: true,
                instructions: "au chambranle si accessible"
              }
            ]
          }
        }
      }
    },

    exercices: {
      warmup: [],
      
      main_workout: {
        pulling_strength: {
          category: ExerciseCategories.STRENGTH,
          muscleGroup: MuscleGroups.BACK,
          exercises: [
            {
              id: 101,
              name: "Tractions pronation",
              category: ExerciseCategories.STRENGTH,
              muscleGroup: MuscleGroups.BACK,
              secondaryMuscles: [MuscleGroups.BICEPS],
              equipment: Equipment.BARBELL,
              difficulty: Difficulty.ADVANCED,
              series: "4×4-6",
              restTime: 120,
              tempo: "2-0-1-1",
              notes: "Focus contrôle et amplitude complète"
            },
            {
              id: 102,
              name: "Tractions australiennes",
              category: ExerciseCategories.STRENGTH,
              muscleGroup: MuscleGroups.BACK,
              equipment: Equipment.BARBELL,
              difficulty: Difficulty.INTERMEDIATE,
              series: "4×10",
              restTime: 90,
              progression: "Augmenter l'inclinaison"
            }
          ]
        },

        pushing_strength: {
          category: ExerciseCategories.STRENGTH,
          muscleGroup: MuscleGroups.CHEST,
          exercises: [
            {
              id: 103,
              name: "Dips parallèles",
              category: ExerciseCategories.STRENGTH,
              muscleGroup: MuscleGroups.CHEST,
              secondaryMuscles: [MuscleGroups.TRICEPS, MuscleGroups.SHOULDERS],
              equipment: Equipment.PARALLELS,
              difficulty: Difficulty.ADVANCED,
              series: "4×12 (8 normales + 4 amplitude complète)",
              restTime: 120,
              technique: "Descente contrôlée, remontée explosive"
            },
            {
              id: 104,
              name: "Pompes inclinées pieds sur banc",
              category: ExerciseCategories.STRENGTH,
              muscleGroup: MuscleGroups.CHEST,
              equipment: Equipment.BENCH,
              difficulty: Difficulty.INTERMEDIATE,
              series: "3×12",
              restTime: 90,
              focus: "Haut des pectoraux"
            },
            {
              id: 105,
              name: "Pompes inclinées mains sur banc",
              category: ExerciseCategories.STRENGTH,
              muscleGroup: MuscleGroups.CHEST,
              equipment: Equipment.BENCH,
              difficulty: Difficulty.BEGINNER,
              series: "2×12",
              restTime: 60,
              progression: "Réduire l'inclinaison progressivement"
            }
          ]
        },

        core_circuit: {
          type: ExerciseTypes.CIRCUIT,
          category: ExerciseCategories.CORE,
          muscleGroup: MuscleGroups.CORE,
          rounds: 3,
          restBetweenRounds: 120,
          exercises: [
            {
              id: 106,
              name: "Relevés de genoux à la barre",
              equipment: Equipment.BARBELL,
              series: "2×20",
              restTime: 30
            },
            {
              id: 107,
              name: "Relevés de genoux aux parallèles",
              equipment: Equipment.PARALLELS,
              series: "2×20",
              restTime: 30
            },
            {
              id: 108,
              name: "Mountain climbers",
              category: ExerciseCategories.CARDIO,
              equipment: Equipment.BODYWEIGHT,
              series: "30 sec",
              restTime: 15
            },
            {
              id: 109,
              name: "Planche",
              category: ExerciseCategories.ISOMETRIC,
              equipment: Equipment.BODYWEIGHT,
              series: "1 min",
              restTime: 30
            },
            {
              id: 110,
              name: "Jambes tendues rétroversées",
              equipment: Equipment.BODYWEIGHT,
              series: "20×",
              restTime: 20
            },
            {
              id: 111,
              name: "Gainage latéral",
              category: ExerciseCategories.ISOMETRIC,
              equipment: Equipment.BODYWEIGHT,
              series: "30 sec chaque côté",
              restTime: 20
            },
            {
              id: 112,
              name: "Crunchs inversés",
              equipment: Equipment.BODYWEIGHT,
              series: "15×",
              restTime: 20
            },
            {
              id: 113,
              name: "Vacuum allongé",
              category: ExerciseCategories.CORE,
              equipment: Equipment.BODYWEIGHT,
              series: "5 cycles",
              technique: "Inspiration profonde puis expiration complète en rentrant le ventre"
            }
          ]
        }
      },

      cooldown: []
    },

    complementaryActivity: {
      name: "Boxe",
      duration: 90,
      timeSlot: "19h30-21h",
      type: "cardio_technique",
      benefits: ["coordination", "cardio", "stress_relief"]
    },

    nutritionTips: [
      "Hydratation importante avant et pendant la boxe",
      "Collation légère 1h avant l'entraînement"
    ],

    recoveryNotes: [
      "Étirements post-boxe recommandés",
      "Douche froide pour la récupération"
    ]
  },

  // Structure similaire pour les autres jours...
  // (Je vais continuer avec les autres jours si vous le souhaitez)
};

// Fonctions utilitaires pour la catégorisation
export const getExercisesByCategory = (day, category) => {
  const dayData = enhancedWorkoutProgram[day];
  if (!dayData || !dayData.exercices) return [];
  
  const allExercises = [];
  
  // Parcourir toutes les sections d'exercices
  Object.values(dayData.exercices).forEach(section => {
    if (Array.isArray(section)) {
      allExercises.push(...section);
    } else if (section.exercises) {
      allExercises.push(...section.exercises);
    }
  });
  
  return allExercises.filter(ex => ex.category === category);
};

export const getExercisesByMuscleGroup = (day, muscleGroup) => {
  const dayData = enhancedWorkoutProgram[day];
  if (!dayData || !dayData.exercices) return [];
  
  const allExercises = [];
  
  Object.values(dayData.exercices).forEach(section => {
    if (Array.isArray(section)) {
      allExercises.push(...section);
    } else if (section.exercises) {
      allExercises.push(...section.exercises);
    }
  });
  
  return allExercises.filter(ex => 
    ex.muscleGroup === muscleGroup || 
    (ex.secondaryMuscles && ex.secondaryMuscles.includes(muscleGroup))
  );
};

export const getExercisesByEquipment = (day, equipment) => {
  const dayData = enhancedWorkoutProgram[day];
  if (!dayData || !dayData.exercices) return [];
  
  const allExercises = [];
  
  Object.values(dayData.exercices).forEach(section => {
    if (Array.isArray(section)) {
      allExercises.push(...section);
    } else if (section.exercises) {
      allExercises.push(...section.exercises);
    }
  });
  
  return allExercises.filter(ex => ex.equipment === equipment);
};

export const getExercisesByDifficulty = (day, difficulty) => {
  const dayData = enhancedWorkoutProgram[day];
  if (!dayData || !dayData.exercices) return [];
  
  const allExercises = [];
  
  Object.values(dayData.exercices).forEach(section => {
    if (Array.isArray(section)) {
      allExercises.push(...section);
    } else if (section.exercises) {
      allExercises.push(...section.exercises);
    }
  });
  
  return allExercises.filter(ex => ex.difficulty === difficulty);
};

// Fonction pour obtenir un résumé de la session
export const getSessionSummary = (day) => {
  const dayData = enhancedWorkoutProgram[day];
  if (!dayData) return null;
  
  const allExercises = [];
  Object.values(dayData.exercices).forEach(section => {
    if (Array.isArray(section)) {
      allExercises.push(...section);
    } else if (section.exercises) {
      allExercises.push(...section.exercises);
    }
  });
  
  const equipmentNeeded = [...new Set(allExercises.map(ex => ex.equipment))];
  const muscleGroups = [...new Set([
    dayData.primaryMuscleGroups,
    dayData.secondaryMuscleGroups,
    ...allExercises.map(ex => ex.muscleGroup)
  ].flat())];
  
  return {
    totalExercises: allExercises.length,
    estimatedDuration: dayData.estimatedDuration,
    equipmentNeeded,
    muscleGroups,
    difficulty: Math.max(...allExercises.map(ex => ex.difficulty || 1)),
    hasComplementaryActivity: !!dayData.complementaryActivity
  };
};