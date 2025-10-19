import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';
import { useWorkoutStats } from '../hooks/useWorkoutStats';
import { workoutProgram } from '../data/workoutProgram';
import { getDateStr } from '../utils/dateUtils';

const WorkoutContext = createContext();

// Hook personnalisé pour utiliser le contexte
const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

const WorkoutProvider = ({ children }) => {
  // État principal
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [weekVariant, setWeekVariant] = useState('A');
  const [statsPeriod, setStatsPeriod] = useState('week');
  const [isGymMode, setIsGymMode] = useState(false);
  
  // États pour les modifications non sauvegardées par section
  const [hasUnsavedExercises, setHasUnsavedExercises] = useState(false);
  const [hasUnsavedStretches, setHasUnsavedStretches] = useState(false);
  const [tempData, setTempData] = useState(null);
  
  // États des modales
  const [showSettings, setShowSettings] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [showAdvancedStatsModal, setShowAdvancedStatsModal] = useState(false);
  const [showSessionFeedback, setShowSessionFeedback] = useState(false);
  const [showExerciseVariations, setShowExerciseVariations] = useState(false);
  const [showProgramEditor, setShowProgramEditor] = useState(false);
  const [showTrainingCycles, setShowTrainingCycles] = useState(false);
  
  // États spécifiques
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [customPrograms, setCustomPrograms] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState(null);
  const [progressForm, setProgressForm] = useState({
    date: getDateStr(new Date()),
    weight: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      thighs: ''
    },
    notes: ''
  });

  // Références pour la sauvegarde automatique
  const debounceTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Hooks personnalisés
  const { data, updateData, loadFromDB } = useWorkoutData();
  
  // État pour les tableaux historiques
  const [workoutTables, setWorkoutTables] = useState([]);
  const [programHistory, setProgramHistory] = useState([]);
  
  // Enregistrer le callback pour triggerTableOnDataSave
  useEffect(() => {
    window.workoutContextCallback = triggerTableOnDataSave;
    return () => {
      delete window.workoutContextCallback;
    };
  }, [activeProgram, data, workoutTables]);

  // Fonction pour obtenir les données actuelles (temp ou réelles)
  const getCurrentData = () => {
    return hasUnsavedExercises || hasUnsavedStretches ? tempData : data;
  };

  // Fonction pour mettre à jour les données temporaires des exercices
  const updateTempExerciseData = (newData) => {
    setTempData(newData);
    setHasUnsavedExercises(true);
  };

  // Fonction pour mettre à jour les données temporaires des étirements
  const updateTempStretchData = (newData) => {
    setTempData(newData);
    setHasUnsavedStretches(true);
  };

  // Fonctions de sauvegarde et annulation pour exercices
  const saveExerciseChanges = async () => {
    await updateData(tempData);
    setHasUnsavedExercises(false);
    if (!hasUnsavedStretches) {
      setTempData(data);
    }
    // Déclencher la création d'un tableau si nécessaire (seulement si pas d'étirements en attente)
    if (!hasUnsavedStretches) {
      triggerTableOnDataSave();
    }
  };

  const discardExerciseChanges = () => {
    setHasUnsavedExercises(false);
    if (!hasUnsavedStretches) {
      setTempData(data);
    }
  };

  // Fonctions de sauvegarde et annulation pour étirements
  const saveStretchChanges = async () => {
    await updateData(tempData);
    setHasUnsavedStretches(false);
    if (!hasUnsavedExercises) {
      setTempData(data);
    }
    // Déclencher la création d'un tableau si nécessaire (seulement si pas d'exercices en attente)
    if (!hasUnsavedExercises) {
      triggerTableOnDataSave();
    }
  };

  const discardStretchChanges = () => {
    setHasUnsavedStretches(false);
    if (!hasUnsavedExercises) {
      setTempData(data);
    }
  };

  const workoutLogic = useWorkoutLogic(data, updateData, getCurrentData, updateTempExerciseData, updateTempStretchData);
  const workoutStats = useWorkoutStats(data);

  // Fonctions utilitaires
  const changeDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const addProgressPhoto = (photoData) => {
    const newPhoto = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...photoData
    };
    
    const newData = {
      ...data,
      progressPhotos: [...(data.progressPhotos || []), newPhoto]
    };
    updateData(newData);
  };

  const deleteProgressPhoto = (photoId) => {
    const newData = {
      ...data,
      progressPhotos: data.progressPhotos.filter(photo => photo.id !== photoId)
    };
    updateData(newData);
  };

  // Fonctions de gestion des programmes
  const createProgram = (programData) => {
    const newProgram = {
      id: Date.now(),
      ...programData,
      status: 'inactive',
      createdAt: new Date().toISOString(),
      startDate: null,
      endDate: null
    };
    setPrograms(prev => [...prev, newProgram]);
  };

  const activateProgram = (programId) => {
    // Désactiver le programme actuel s'il y en a un
    if (activeProgram) {
      setPrograms(prev => prev.map(p => 
        p.id === activeProgram.id 
          ? { ...p, status: 'completed', endDate: new Date().toISOString() }
          : p
      ));
    }
    
    // Activer le nouveau programme
    const programToActivate = programs.find(p => p.id === programId);
    if (programToActivate) {
      const updatedProgram = {
        ...programToActivate,
        status: 'active',
        startDate: new Date().toISOString()
      };
      setPrograms(prev => prev.map(p => 
        p.id === programId ? updatedProgram : p
      ));
      setActiveProgram(updatedProgram);
      
      // NE PLUS créer automatiquement un tableau lors de l'activation
      // Le tableau sera créé seulement lors de la première sauvegarde de données
    }
  };

  const deactivateProgram = () => {
    if (activeProgram) {
      setPrograms(prev => prev.map(p => 
        p.id === activeProgram.id 
          ? { ...p, status: 'completed', endDate: new Date().toISOString() }
          : p
      ));
      setActiveProgram(null);
    }
  };

  const deleteProgram = (programId) => {
    setPrograms(prev => prev.filter(p => p.id !== programId));
    if (activeProgram && activeProgram.id === programId) {
      setActiveProgram(null);
    }
  };

  const updateProgram = (updatedProgram) => {
    setPrograms(prev => prev.map(p => 
      p.id === updatedProgram.id ? updatedProgram : p
    ));
    if (activeProgram && activeProgram.id === updatedProgram.id) {
      setActiveProgram(updatedProgram);
    }
  };

  // Fonction pour créer un nouveau tableau historique
  const createWorkoutTable = (program, triggerType = 'program_change') => {
    const tableId = `table_${program.id}_${Date.now()}`;
    
    // Générer les dates pour les 7 derniers jours
    const generateDateRange = (days = 7) => {
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
      }
      return dates;
    };

    // Obtenir tous les exercices du programme
    const getAllProgramExercises = (programData = workoutProgram) => {
      const allExercises = [];
      const exerciseIds = new Set();
      
      // Fonction helper pour ajouter un exercice
      const addExercise = (exercise, day, variant = null) => {
        if (!exerciseIds.has(exercise.id)) {
          exerciseIds.add(exercise.id);
          allExercises.push({
            ...exercise,
            availableDays: [day],
            variant: variant // Marquer si c'est une variante (semaineA, semaineB, etc.)
          });
        } else {
          // Si l'exercice existe déjà, ajouter ce jour à ses jours disponibles
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
          // Ajouter les exercices de base
          if (workout.exercices) {
            workout.exercices.forEach(exercise => {
              addExercise(exercise, day);
            });
          }
          
          // Ajouter les exercices des variantes de salle (semaineA et semaineB)
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
    };

    const dates = generateDateRange(7);
    
    const newTable = {
      id: tableId,
      programId: program.id,
      programName: program.name,
      programData: workoutProgram, // Utiliser workoutProgram au lieu de program.data
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      dates: dates.map(date => getDateStr(date)),
      exercises: getAllProgramExercises(workoutProgram),
      triggerType, // 'program_change' ou 'data_save'
      isActive: true
    };

    // Désactiver tous les autres tableaux
    setWorkoutTables(prev => [
      newTable,
      ...prev.map(table => ({ ...table, isActive: false }))
    ]);

    // Ajouter à l'historique des programmes
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

    return newTable;
  };

  // Fonction pour réactiver un tableau existant
  const reactivateWorkoutTable = (programId) => {
    const existingTable = workoutTables.find(table => table.programId === programId);
    
    if (existingTable) {
      // Désactiver tous les tableaux et réactiver celui-ci
      setWorkoutTables(prev => prev.map(table => ({
        ...table,
        isActive: table.id === existingTable.id
      })));
      
      return existingTable;
    }
    
    return null;
  };

  // Fonction pour déclencher la création d'un tableau lors d'un enregistrement
  // Référence pour éviter les créations multiples
  const tableCreationTimeoutRef = useRef(null);

  const triggerTableOnDataSave = (data) => {
    console.log('🔍 triggerTableOnDataSave appelé');
    console.log('🔍 activeProgram:', activeProgram);
    console.log('🔍 data:', data);
    console.log('🔍 workoutTables:', workoutTables);
    
    if (!activeProgram) {
      console.log('❌ Pas de programme actif');
      return;
    }

    // Annuler le timeout précédent s'il existe pour éviter les créations multiples
    if (tableCreationTimeoutRef.current) {
      clearTimeout(tableCreationTimeoutRef.current);
    }

    // Délai pour regrouper les sauvegardes multiples (exercices + étirements)
    tableCreationTimeoutRef.current = setTimeout(() => {
      // Vérifier s'il y a des données pour aujourd'hui
      const today = getDateStr(new Date());
      const hasDataToday = Object.keys(data.checkedExercises || {}).some(key => key.startsWith(today)) ||
                          Object.keys(data.reps || {}).some(key => key.startsWith(today));

      console.log('🔍 today:', today);
      console.log('🔍 hasDataToday:', hasDataToday);
      console.log('🔍 checkedExercises keys:', Object.keys(data.checkedExercises || {}));
      console.log('🔍 reps keys:', Object.keys(data.reps || {}));
      console.log('📊 Toutes les données data:', Object.keys(data));
      console.log('📈 A des données sauvegardées:', Object.keys(data.checkedExercises || {}).length > 0 || Object.keys(data.reps || {}).length > 0);

      // NOUVELLE LOGIQUE : Créer un tableau seulement si :
      // 1. Il y a un programme actif ET
      // 2. Il y a des données sauvegardées ET
      // 3. Il n'y a pas déjà un tableau actif pour ce programme
      if (hasDataToday) {
        const activeTable = workoutTables.find(table => table.isActive && table.programId === activeProgram.id);
        console.log('🔍 activeTable trouvé:', activeTable);
        console.log('🔍 Tous les tableaux existants:', workoutTables.map(t => ({id: t.id, programId: t.programId, isActive: t.isActive})));
        
        if (!activeTable) {
          console.log('✅ Création du tableau pour:', activeProgram.name);
          // Créer le tableau seulement quand on sauvegarde des données avec un programme actif
          createWorkoutTable(activeProgram, 'data_save');
        } else {
          console.log('ℹ️ Tableau déjà actif pour ce programme');
        }
      } else {
        console.log('❌ Pas de données pour aujourd\'hui');
        console.log('❌ hasDataToday:', hasDataToday, 'activeProgram:', !!activeProgram);
      }
    }, 100); // Délai de 100ms pour regrouper les sauvegardes
  };

  // Fonction pour obtenir les statistiques d'un tableau
  const getTableStatistics = (tableId) => {
    const table = workoutTables.find(t => t.id === tableId);
    if (!table) return null;

    // Calculer les statistiques basées sur les données
    const tableStats = {
      totalReps: 0,
      completedExercises: 0,
      totalDays: 0,
      completionRate: 0
    };

    // Logique de calcul des statistiques
    // (sera implémentée selon les besoins spécifiques)

    return tableStats;
  };

  // Fonctions de sauvegarde automatique pour les états du contexte
  const openContextDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WorkoutTrackerContextDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('contextData')) {
          db.createObjectStore('contextData', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const saveContextToDB = async (contextData) => {
    try {
      const db = await openContextDB();
      const transaction = db.transaction(['contextData'], 'readwrite');
      const store = transaction.objectStore('contextData');
      store.put({ id: 'context', ...contextData });
      // console.log('✅ État du contexte sauvegardé automatiquement');
    } catch (error) {
      // console.error('❌ Erreur sauvegarde contexte:', error);
    }
  };

  // Charger le contexte depuis IndexedDB
  const loadContext = async () => {
    try {
      const savedContext = await loadFromDB();
      if (savedContext) {
        // Nettoyer les tables invalides lors du chargement
        const validTables = savedContext.workoutTables.filter(table => {
          const isValid = table && 
                         table.id && 
                         table.programName && 
                         table.exercises && 
                         Array.isArray(table.exercises) &&
                         table.dates && 
                         Array.isArray(table.dates);
          
          if (!isValid) {
            // console.warn('🧹 Table invalide supprimée lors du chargement:', table);
          }
          
          return isValid;
        });

        // console.log(`🧹 Nettoyage: ${savedContext.workoutTables.length - validTables.length} tables invalides supprimées`);
        setWorkoutTables(validTables);
      }
    } catch (error) {
      // console.error('❌ Erreur chargement contexte:', error);
      return null;
    }
  };

  // Fonction de sauvegarde automatique avec debounce pour le contexte
  const autoSaveContext = useCallback((contextData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveContextToDB(contextData);
    }, 2000); // 2 secondes pour les états du contexte
  }, []);

  const value = {
    // État
    currentDate,
    setCurrentDate,
    activeTab,
    setActiveTab,
    weekVariant,
    setWeekVariant,
    statsPeriod,
    setStatsPeriod,
    isGymMode,
    setIsGymMode,
    data,
    
    // État temporaire
    tempData,
    hasUnsavedExercises,
    hasUnsavedStretches,
    getCurrentData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    
    // Modales
    showSettings,
    setShowSettings,
    showPhotoModal,
    setShowPhotoModal,
    showProgressModal,
    setShowProgressModal,
    showChartsModal,
    setShowChartsModal,
    showHeatmapModal,
    setShowHeatmapModal,
    showAdvancedStatsModal,
    setShowAdvancedStatsModal,
    showSessionFeedback,
    setShowSessionFeedback,
    showExerciseVariations,
    setShowExerciseVariations,
    showProgramEditor,
    setShowProgramEditor,
    showTrainingCycles,
    setShowTrainingCycles,
    
    // États spécifiques
    selectedExercise,
    setSelectedExercise,
    sessionData,
    setSessionData,
    editingProgram,
    setEditingProgram,
    customPrograms,
    setCustomPrograms,
    programs,
    setPrograms,
    activeProgram,
    setActiveProgram,
    progressForm,
    setProgressForm,
    
    // Tableaux historiques
    workoutTables,
    setWorkoutTables,
    programHistory,
    setProgramHistory,
    
    // Logique métier
    ...workoutLogic,
    ...workoutStats,
    
    // Fonctions utilitaires
    changeDate,
    addProgressPhoto,
    deleteProgressPhoto,
    createProgram,
    activateProgram,
    deactivateProgram,
    deleteProgram,
    updateProgram,
    updateData,
    
    // Fonctions pour les tableaux historiques
    createWorkoutTable,
    reactivateWorkoutTable,
    triggerTableOnDataSave,
    getTableStatistics
  };

  // Chargement initial des données du contexte
  useEffect(() => {
    const loadInitialContextData = async () => {
      const savedContext = await loadFromDB();
      if (savedContext) {
        // Restaurer les programmes et l'état actif
        if (savedContext.programs) {
          setPrograms(savedContext.programs);
        }
        if (savedContext.activeProgram) {
          setActiveProgram(savedContext.activeProgram);
        }
        if (savedContext.workoutTables) {
          // Filtrer les tables pour ne garder que celles avec une structure valide
          const validTables = savedContext.workoutTables.filter(table => {
            const isValid = table && 
                           table.exercises && 
                           Array.isArray(table.exercises) && 
                           table.dates && 
                           Array.isArray(table.dates);
            
            if (!isValid) {
              console.warn('🧹 Table invalide supprimée lors du chargement:', table);
            }
            
            return isValid;
          });
          
          // console.log(`🧹 Nettoyage: ${savedContext.workoutTables.length - validTables.length} tables invalides supprimées`);
          setWorkoutTables(validTables);
        }
        if (savedContext.programHistory) {
          setProgramHistory(savedContext.programHistory);
        }
        // Restaurer d'autres états si nécessaire
        if (savedContext.weekVariant) {
          setWeekVariant(savedContext.weekVariant);
        }
        if (savedContext.isGymMode !== undefined) {
          setIsGymMode(savedContext.isGymMode);
        }
      }
      isInitialLoadRef.current = false;
    };

    loadInitialContextData();
  }, []);

  // Sauvegarde automatique des états du contexte
  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }

    const contextData = {
      programs,
      activeProgram,
      workoutTables,
      programHistory,
      weekVariant,
      isGymMode,
      // Ajouter d'autres états importants à sauvegarder
    };

    autoSaveContext(contextData);
  }, [programs, activeProgram, workoutTables, programHistory, weekVariant, isGymMode, autoSaveContext]);

  // Nettoyage du timer lors du démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

export { WorkoutContext, useWorkout, WorkoutProvider };