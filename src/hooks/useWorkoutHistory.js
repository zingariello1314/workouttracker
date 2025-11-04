import { useState, useEffect, useCallback } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { workoutProgram } from '../data/workoutProgram';
import { calculateAutoReps } from '../utils/exerciseCalculations';

/**
 * Hook personnalisé pour gérer l'historique des séances d'entraînement
 * Gère la création, la mise à jour et l'affichage des tableaux de saisies passées
 */
export const useWorkoutHistory = () => {
  const { data, activeProgram, programHistory, setProgramHistory, updateData } = useWorkout();
  const [workoutTables, setWorkoutTables] = useState([]);

  // Fonction pour obtenir tous les exercices d'un programme
  const getAllProgramExercises = useCallback((programData = workoutProgram) => {
    const allExercises = [];
    const exerciseIds = new Set();
    
    const addExercise = (exercise, day, variant = null) => {
      if (!exerciseIds.has(exercise.id)) {
        exerciseIds.add(exercise.id);
        allExercises.push({
          ...exercise,
          availableDays: [day],
          variant: variant
        });
      } else {
        const existingExercise = allExercises.find(ex => ex.id === exercise.id);
        if (existingExercise && !existingExercise.availableDays.includes(day)) {
          existingExercise.availableDays.push(day);
        }
      }
    };
    
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    days.forEach(day => {
      const workout = programData[day];
      if (workout) {
        // Exercices de base
        if (workout.exercices) {
          workout.exercices.forEach(exercise => {
            addExercise(exercise, day);
          });
        }
        
        // Exercices des variantes de salle
        if (workout.salleVariants) {
          if (workout.salleVariants.semaineA && workout.salleVariants.semaineA.exercices) {
            workout.salleVariants.semaineA.exercices.forEach(exercise => {
              addExercise(exercise, day, 'semaineA');
            });
          }
          
          if (workout.salleVariants.semaineB && workout.salleVariants.semaineB.exercices) {
            workout.salleVariants.semaineB.exercices.forEach(exercise => {
              addExercise(exercise, day, 'semaineB');
            });
          }
        }
      }
    });
    
    return allExercises;
  }, []);

  // Note: calculateAutoReps est maintenant importé depuis utils/exerciseCalculations

  // Fonction pour créer un nouveau tableau d'historique
  const createWorkoutTable = useCallback((program, triggerType = 'program_change') => {
    const tableId = `table_${program.id}_${Date.now()}`;
    
    const newTable = {
      id: tableId,
      programId: program.id,
      programName: program.name,
      programData: workoutProgram,
      startDate: new Date().toISOString(),
      endDate: null,
      createdAt: new Date().toISOString(),
      exercises: getAllProgramExercises(workoutProgram),
      triggerType,
      isActive: true,
      status: 'active'
    };

    // Désactiver tous les autres tableaux
    setWorkoutTables(prev => [
      newTable,
      ...prev.map(table => ({ ...table, isActive: false, status: 'completed' }))
    ]);

    // Ajouter à l'historique des programmes si setProgramHistory existe
    if (setProgramHistory) {
      setProgramHistory(prev => [
        {
          programId: program.id,
          programName: program.name,
          tableId: tableId,
          startDate: new Date().toISOString(),
          triggerType
        },
        ...prev
      ]);
    }

    return newTable;
  }, [getAllProgramExercises, setProgramHistory]);

  // Fonction pour clôturer un tableau
  const closeWorkoutTable = useCallback((tableId) => {
    setWorkoutTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, isActive: false, status: 'completed', endDate: new Date().toISOString() }
        : table
    ));
  }, []);

  // Fonction pour vérifier si un tableau doit être créé
  const shouldCreateTable = useCallback(() => {
    if (!activeProgram) return false;
    
    // Vérifier s'il y a déjà un tableau actif pour ce programme
    const activeTable = workoutTables.find(table => 
      table.isActive && table.programId === activeProgram.id
    );
    
    // Toujours créer un tableau s'il n'y en a pas d'actif pour ce programme
    return !activeTable;
  }, [activeProgram, workoutTables]);

  // Fonction pour déclencher la création d'un tableau lors de la sauvegarde
  const triggerTableCreation = useCallback(() => {
    if (shouldCreateTable() && activeProgram) {
      createWorkoutTable(activeProgram, 'data_save');
    }
  }, [shouldCreateTable, activeProgram, createWorkoutTable]);

  // Fonction pour mettre à jour les répétitions dans l'historique
  const updateHistoryReps = useCallback((tableId, exerciseId, value) => {
    const key = `history_${tableId}_${exerciseId}`;
    const newData = {
      ...data,
      historyReps: {
        ...data.historyReps,
        [key]: value
      }
    };
    updateData(newData);
  }, [data, updateData]);

  // Fonction pour obtenir les répétitions d'un exercice dans l'historique
  const getHistoryReps = useCallback((tableId, exerciseId) => {
    const key = `history_${tableId}_${exerciseId}`;
    return data.historyReps?.[key] || '';
  }, [data.historyReps]);

  // Fonction pour nettoyer les tableaux orphelins
  const cleanupOrphanTables = useCallback(() => {
    setWorkoutTables(prev => {
      const cleanedTables = prev.map(table => {
        // Si le tableau est actif mais n'a pas de programme actif correspondant
        if (table.isActive && (!activeProgram || activeProgram.id !== table.programId)) {
          return {
            ...table,
            isActive: false,
            status: 'completed',
            endDate: new Date().toISOString()
          };
        }
        return table;
      });
      
      // Retourner seulement si des changements ont été effectués
      const hasChanges = cleanedTables.some((table, index) => 
        table.isActive !== prev[index].isActive || 
        table.status !== prev[index].status
      );
      
      return hasChanges ? cleanedTables : prev;
    });
  }, [activeProgram]);
  const getVisibleTables = useCallback(() => {
    // Filtrer les tableaux orphelins (sans programme actif correspondant)
    const validTables = workoutTables.filter(table => {
      // Si le tableau est actif, vérifier qu'il y a bien un programme actif correspondant
      if (table.isActive) {
        const hasMatchingActiveProgram = activeProgram && activeProgram.id === table.programId;
        if (!hasMatchingActiveProgram) {
  
          return false; // Exclure les tableaux orphelins
        }
      }
      return true;
    });
    
    return validTables.filter(table => {
      // Un tableau est visible s'il a au moins un exercice avec des données OU s'il est actif
      return table.isActive || table.exercises.some(exercise => {
        const historyValue = getHistoryReps(table.id, exercise.id);
        return historyValue && historyValue.trim() !== '';
      });
    });
  }, [workoutTables, getHistoryReps, activeProgram]);

  // Effet pour nettoyer les tableaux orphelins au démarrage
  useEffect(() => {
    // Nettoyer les tableaux orphelins au chargement initial
    const timer = setTimeout(() => {
      cleanupOrphanTables();
    }, 100); // Petit délai pour s'assurer que activeProgram est bien initialisé
    
    return () => clearTimeout(timer);
  }, []); // Exécuter une seule fois au montage
  useEffect(() => {
    // Nettoyer d'abord les tableaux orphelins
    cleanupOrphanTables();
    
    if (activeProgram) {
      // Vérifier s'il y a déjà un tableau actif pour ce programme
      const activeTable = workoutTables.find(table => 
        table.isActive && table.programId === activeProgram.id
      );
      
      if (!activeTable) {
        createWorkoutTable(activeProgram, 'program_change');
      }
    }
  }, [activeProgram, workoutTables, createWorkoutTable, cleanupOrphanTables]);

  // Effet pour surveiller les données et créer des tableaux si nécessaire
  useEffect(() => {
    const hasNewData = Object.keys(data.checkedExercises || {}).length > 0;
    
    if (hasNewData && shouldCreateTable()) {
      triggerTableCreation();
    }
  }, [data.checkedExercises, shouldCreateTable, triggerTableCreation]);

  // S'enregistrer pour les callbacks de sauvegarde
  useEffect(() => {
    const handleDataSaved = () => {
      
      if (shouldCreateTable() && activeProgram) {
        createWorkoutTable(activeProgram, 'data_save');
      }
    };
    
    // Enregistrer le callback
    window.workoutContextCallback = handleDataSaved;
    
    // Nettoyer lors du démontage
    return () => {
      if (window.workoutContextCallback === handleDataSaved) {
        window.workoutContextCallback = null;
      }
    };
  }, [activeProgram, shouldCreateTable, createWorkoutTable]);

  return {
    workoutTables,
    setWorkoutTables,
    createWorkoutTable,
    closeWorkoutTable,
    updateHistoryReps,
    getHistoryReps,
    calculateAutoReps,
    getVisibleTables,
    cleanupOrphanTables,
    triggerTableCreation,
    shouldCreateTable
  };
};