/**
 * Utilitaires pour la synchronisation automatique entre l'onglet Programme et l'onglet Exercices
 */

import { findExerciseInDatabase, getAllCategories } from '../data/exerciseDatabase.js';
import { parseSeriesString, formatSeriesInfo } from './seriesParser.js';
import { createFallbackExercise } from './exerciseFallback.js';
import { workoutProgram } from '../data/workoutProgram.js';

/**
 * Extrait tous les exercices uniques depuis un programme
 * @param {Object} program - Programme au format legacy ou enrichi
 * @returns {Array} Liste des exercices uniques avec métadonnées
 */
export const extractUniqueExercises = (program) => {
  if (!program) return [];
  
  const exercises = new Map(); // Utiliser Map pour éviter les doublons par ID
  
  // Traiter directement le programme sans conversion
  Object.values(program).forEach(day => {
    if (!day || typeof day !== 'object') return;
    
    // Exercices principaux
    if (day.exercices && Array.isArray(day.exercices)) {
      day.exercices.forEach(exercise => {
        if (exercise.id && !exercises.has(exercise.id)) {
          exercises.set(exercise.id, {
            ...exercise,
            sourceDay: day.name,
            sourceFocus: day.focus
          });
        }
      });
    }
    
    // Variantes salle
    if (day.salleVariants) {
      Object.entries(day.salleVariants).forEach(([variantKey, variant]) => {
        if (variant.exercices && Array.isArray(variant.exercices)) {
          variant.exercices.forEach(exercise => {
            if (exercise.id && !exercises.has(exercise.id)) {
              exercises.set(exercise.id, {
                ...exercise,
                sourceDay: day.name,
                sourceFocus: day.focus,
                sourceVariant: variantKey
              });
            }
          });
        }
      });
    }
  });
  
  return Array.from(exercises.values());
};

/**
 * Fusionne les exercices de plusieurs programmes
 * @param {Array} programs - Liste des programmes
 * @returns {Array} Liste des exercices uniques fusionnés
 */
export const mergeExercisesFromPrograms = (programs) => {
  if (!Array.isArray(programs)) return [];
  
  const allExercises = new Map();
  
  programs.forEach(program => {
    const programExercises = extractUniqueExercises(program.schedule || program);
    
    programExercises.forEach(exercise => {
      const exerciseId = exercise.id;
      
      if (!allExercises.has(exerciseId)) {
        allExercises.set(exerciseId, {
          ...exercise,
          sourcePrograms: [program.name || 'Programme sans nom']
        });
      } else {
        // Ajouter le programme source si pas déjà présent
        const existing = allExercises.get(exerciseId);
        if (!existing.sourcePrograms.includes(program.name || 'Programme sans nom')) {
          existing.sourcePrograms.push(program.name || 'Programme sans nom');
        }
      }
    });
  });
  
  return Array.from(allExercises.values());
};

/**
 * Convertit un programme du format de l'onglet Programme vers le format legacy
 * @param {Object} programData - Données du programme depuis l'onglet Programme
 * @returns {Object} Programme au format legacy
 */
export const convertProgramToLegacy = (programData) => {
  if (!programData || !programData.schedule) return {};
  
  const legacyProgram = {};
  
  Object.entries(programData.schedule).forEach(([day, dayData]) => {
    legacyProgram[day] = {
      name: dayData.name,
      focus: dayData.focus,
      duree: dayData.duration,
      notes: dayData.notes,
      exercices: dayData.exercises || [],
      etirements: dayData.etirements,
      salleVariants: dayData.salleVariants
    };
  });
  
  return legacyProgram;
};

/**
 * Synchronise automatiquement les exercices depuis l'onglet Programme
 * @param {Object} contextData - Données du contexte (programmes, programme actif)
 * @param {string} sourceType - Type de source ('active', 'all', 'default')
 * @returns {Object} Données synchronisées avec statistiques
 */
export const syncExercisesFromPrograms = (contextData, sourceType = 'default') => {
  const { programs = [], activeProgram } = contextData;
  let sourceExercises = [];
  let sourceInfo = {};
  
  switch (sourceType) {
    case 'active':
      if (activeProgram) {
        // Convertir le programme actif au format legacy pour extractUniqueExercises
        let programToExtract = activeProgram;
        
        if (activeProgram.schedule) {
          // Nouveau format - convertir vers le format legacy
          programToExtract = {};
          Object.entries(activeProgram.schedule).forEach(([day, dayData]) => {
            programToExtract[day] = {
              name: dayData.name,
              focus: dayData.focus,
              duree: dayData.duration,
              notes: dayData.notes,
              exercices: dayData.exercises || [], // exercises -> exercices
              etirements: dayData.etirements,
              salleVariants: dayData.salleVariants ? {
                semaineA: { 
                  exercices: dayData.salleVariants.semaineA?.exercises || [] 
                },
                semaineB: { 
                  exercices: dayData.salleVariants.semaineB?.exercises || [] 
                }
              } : undefined
            };
          });
        }
        
        sourceExercises = extractUniqueExercises(programToExtract);
        sourceInfo = {
          type: 'Programme actif',
          name: activeProgram.name,
          count: 1
        };
      }
      break;
      
    case 'all':
      sourceExercises = mergeExercisesFromPrograms(programs);
      sourceInfo = {
        type: 'Tous les programmes',
        name: `${programs.length} programmes`,
        count: programs.length
      };
      break;
      
    default:
      // Utiliser le programme par défaut (workoutProgram)
      sourceExercises = extractUniqueExercises(workoutProgram);
      sourceInfo = {
        type: 'Programme par défaut',
        name: 'Programme intégré',
        count: 1
      };
  }
  
  return {
    exercises: sourceExercises,
    sourceInfo,
    syncTimestamp: new Date().toISOString(),
    totalExercises: sourceExercises.length
  };
};

/**
 * Applique une catégorisation automatique intelligente à un exercice
 * @param {Object} exercise - Exercice à catégoriser
 * @returns {Object} Exercice enrichi avec catégorisation automatique
 */
export const autoCategorizeSyncedExercise = (exercise) => {
  if (!exercise || !exercise.name) return exercise;
  
  // Rechercher l'exercice dans la base de données
  const dbExercise = findExerciseInDatabase(exercise.name);
  
  // Parser les informations de séries
  const parsedSeries = parseSeriesString(exercise.series);
  
  // Valeurs par défaut
  let category = 'Autre';
  let muscleGroup = 'Non spécifié';
  let equipment = 'Non spécifié';
  let primaryMuscles = [];
  let secondaryMuscles = [];
  let description = '';
  
  if (dbExercise) {
    // Utiliser les données de la base de données
    category = dbExercise.category;
    primaryMuscles = dbExercise.primaryMuscles || [];
    secondaryMuscles = dbExercise.secondaryMuscles || [];
    equipment = dbExercise.equipment;
    description = dbExercise.description;
    
    // Définir le groupe musculaire principal
    if (primaryMuscles.length > 0) {
      muscleGroup = primaryMuscles[0];
    }
  } else {
    // Utiliser le système de fallback avancé
    const fallbackExercise = createFallbackExercise(exercise.name);
    
    category = fallbackExercise.category;
    primaryMuscles = fallbackExercise.primaryMuscles || [];
    secondaryMuscles = fallbackExercise.secondaryMuscles || [];
    equipment = fallbackExercise.equipment;
    description = fallbackExercise.description;
    
    // Définir le groupe musculaire principal
    if (primaryMuscles.length > 0) {
      muscleGroup = primaryMuscles[0];
    } else {
      muscleGroup = category;
    }
  }
  
  return {
    ...exercise,
    // Informations de catégorisation
    category,
    muscleGroup,
    primaryMuscles,
    secondaryMuscles,
    equipment,
    description,
    
    // Informations de séries parsées
    parsedSeries,
    formattedSeries: formatSeriesInfo(parsedSeries),
    totalRepsEstimate: parsedSeries.sets && parsedSeries.reps.length > 0 
      ? (parsedSeries.sets * (parsedSeries.reps.reduce((a, b) => a + b, 0) / parsedSeries.reps.length))
      : null,
    
    // Métadonnées
    autoCategorizationApplied: true,
    categorizationTimestamp: new Date().toISOString(),
    databaseMatch: !!dbExercise,
    categorizationSource: dbExercise ? 'database' : 'fallback'
  };
};

/**
 * Détecte les changements dans les programmes et retourne les exercices mis à jour
 * @param {Object} previousData - Données précédentes
 * @param {Object} currentData - Données actuelles
 * @returns {Object} Informations sur les changements détectés
 */
export const detectProgramChanges = (previousData, currentData) => {
  if (!previousData || !currentData) {
    return {
      hasChanges: true,
      changeType: 'initial_load',
      timestamp: new Date().toISOString()
    };
  }
  
  const prevExercises = previousData.exercises || [];
  const currentExercises = currentData.exercises || [];
  
  // Vérifier si le nombre d'exercices a changé
  if (prevExercises.length !== currentExercises.length) {
    return {
      hasChanges: true,
      changeType: 'exercise_count_changed',
      previousCount: prevExercises.length,
      currentCount: currentExercises.length,
      timestamp: new Date().toISOString()
    };
  }
  
  // Vérifier si les exercices ont changé (comparaison basique par nom)
  const prevNames = prevExercises.map(ex => ex.name).sort();
  const currentNames = currentExercises.map(ex => ex.name).sort();
  
  const namesChanged = JSON.stringify(prevNames) !== JSON.stringify(currentNames);
  
  if (namesChanged) {
    return {
      hasChanges: true,
      changeType: 'exercises_modified',
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    hasChanges: false,
    timestamp: new Date().toISOString()
  };
};

/**
 * Applique la catégorisation automatique à une liste d'exercices
 * @param {Array} exercises - Liste des exercices à catégoriser
 * @returns {Array} Exercices avec catégorisation automatique appliquée
 */
export const applyCategorization = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  
  return exercises.map(exercise => autoCategorizeSyncedExercise(exercise));
};

/**
 * Met à jour la fonction syncExercisesFromPrograms pour inclure la catégorisation automatique
 */
export const syncExercisesFromProgramsWithCategorization = (contextData, sourceType = 'default') => {
  const syncResult = syncExercisesFromPrograms(contextData, sourceType);
  
  if (syncResult.exercises && syncResult.exercises.length > 0) {
    syncResult.exercises = applyCategorization(syncResult.exercises);
    syncResult.categorizationApplied = true;
    syncResult.categorizationTimestamp = new Date().toISOString();
  }
  
  return syncResult;
};