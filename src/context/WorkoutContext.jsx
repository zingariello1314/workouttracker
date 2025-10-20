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
  
  // État pour l'historique des programmes
  const [programHistory, setProgramHistory] = useState([]);

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
  const saveExerciseChanges = () => {
    if (hasUnsavedExercises && tempData) {
      updateData(tempData);
      setHasUnsavedExercises(false);
      setTempData(null);
    }
  };

  const cancelExerciseChanges = () => {
    setHasUnsavedExercises(false);
    setTempData(null);
  };

  // Fonctions de sauvegarde et annulation pour étirements
  const saveStretchChanges = () => {
    if (hasUnsavedStretches && tempData) {
      updateData(tempData);
      setHasUnsavedStretches(false);
      setTempData(null);
    }
  };

  const cancelStretchChanges = () => {
    setHasUnsavedStretches(false);
    setTempData(null);
  };

  // Fonction pour réinitialiser les données d'une journée
  const resetDay = (dateStr) => {
    const currentData = getCurrentData();
    const newData = { ...currentData };
    
    // Réinitialiser les exercices cochés pour cette date
    Object.keys(newData.checkedExercises || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.checkedExercises[key];
      }
    });
    
    // Réinitialiser les répétitions pour cette date
    Object.keys(newData.reps || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.reps[key];
      }
    });
    
    // Réinitialiser les étirements pour cette date
    Object.keys(newData.checkedStretches || {}).forEach(key => {
      if (key.startsWith(dateStr)) {
        delete newData.checkedStretches[key];
      }
    });
    
    updateData(newData);
  };

  // Gestion des programmes
  const addProgram = (program) => {
    const newProgram = {
      ...program,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'inactive'
    };
    setPrograms(prev => [...prev, newProgram]);
    return newProgram;
  };

  const activateProgram = (programId) => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      // Désactiver l'ancien programme actif s'il y en a un
      if (activeProgram) {
        setPrograms(prev => prev.map(p => 
          p.id === activeProgram.id 
            ? { ...p, status: 'completed', endDate: new Date().toISOString() }
            : p
        ));
      }
      
      // Activer le nouveau programme
      const updatedProgram = {
        ...program,
        status: 'active',
        startDate: new Date().toISOString()
      };
      setPrograms(prev => prev.map(p => 
        p.id === programId ? updatedProgram : p
      ));
      setActiveProgram(updatedProgram);
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
    } catch (error) {
      console.error('❌ Erreur sauvegarde contexte:', error);
    }
  };

  // Charger le contexte depuis IndexedDB
  const loadContext = async () => {
    try {
      const savedContext = await loadFromDB();
      if (savedContext) {
        // Charger les programmes et l'état
        if (savedContext.programs) {
          setPrograms(savedContext.programs);
        }
        if (savedContext.activeProgram) {
          setActiveProgram(savedContext.activeProgram);
        }
        if (savedContext.programHistory) {
          setProgramHistory(savedContext.programHistory);
        }
        if (savedContext.weekVariant) {
          setWeekVariant(savedContext.weekVariant);
        }
        if (savedContext.isGymMode !== undefined) {
          setIsGymMode(savedContext.isGymMode);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement contexte:', error);
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
    }, 1000);
  }, []);

  // Hooks personnalisés pour la logique et les statistiques
  const workoutLogic = useWorkoutLogic(data, updateData);
  const workoutStats = useWorkoutStats(data);

  // Valeurs du contexte
  const contextValue = {
    // États principaux
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
    
    // Données et fonctions de données
    data,
    updateData,
    getCurrentData,
    resetDay,
    
    // Gestion des modifications temporaires
    hasUnsavedExercises,
    hasUnsavedStretches,
    tempData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    cancelExerciseChanges,
    saveStretchChanges,
    cancelStretchChanges,
    
    // États des modales
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
    progressForm,
    setProgressForm,
    
    // Gestion des programmes
    programs,
    setPrograms,
    activeProgram,
    setActiveProgram,
    programHistory,
    setProgramHistory,
    addProgram,
    activateProgram,
    deactivateProgram,
    deleteProgram,
    updateProgram,
    
    // Programmes personnalisés
    customPrograms,
    setCustomPrograms,
    
    // Hooks personnalisés
    ...workoutLogic,
    ...workoutStats
  };

  // Sauvegarde automatique du contexte
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      const contextData = {
        programs,
        activeProgram,
        programHistory,
        weekVariant,
        isGymMode
      };
      autoSaveContext(contextData);
    }
  }, [programs, activeProgram, programHistory, weekVariant, isGymMode, autoSaveContext]);

  // Initialisation avec le programme par défaut si aucun programme actif
  useEffect(() => {
    const initializeDefaultProgram = () => {
      // Si aucun programme actif et aucun programme dans la liste, créer le programme par défaut
      if (!activeProgram && programs.length === 0) {
        // Conversion du workoutProgram au format attendu par ProgramDetailView
        const convertedSchedule = {};
        
        Object.entries(workoutProgram).forEach(([day, dayData]) => {
          convertedSchedule[day] = {
            name: dayData.name,
            focus: dayData.focus,
            duration: dayData.duree || "Non spécifié",
            notes: dayData.notes || "",
            etirements: {
              matin: { 
                name: "Étirements matinaux", 
                duration: "5-7 min", 
                instructions: dayData.etirements?.matin || "" 
              },
              midi: { 
                name: "Pause active", 
                duration: "4-6 min", 
                instructions: dayData.etirements?.midi || "" 
              },
              soir: { 
                name: "Récupération", 
                duration: "3-5 min",
                instructions: dayData.etirements?.soir || "" 
              }
            },
            exercises: dayData.exercices?.map(exercise => ({
              id: exercise.id,
              name: exercise.name,
              series: exercise.series,
              reps: "",
              rest: exercise.type?.includes('circuit') ? 30 : (exercise.type?.includes('superset') ? 45 : 90),
              intensity: exercise.series?.includes('4×') ? "heavy" : (exercise.series?.includes('3×') ? "moderate" : "light"),
              notes: exercise.notes || "",
              materiel: exercise.materiel || "poids du corps",
              type: exercise.type || "standard"
            })) || [],
            // Ajout des variantes salle si elles existent
            salleVariants: dayData.salleVariants ? {
              semaineA: {
                name: dayData.salleVariants.semaineA.name,
                exercises: dayData.salleVariants.semaineA.exercices.map(ex => ({
                  id: ex.id,
                  name: ex.name,
                  series: ex.series,
                  reps: "",
                  rest: 90,
                  intensity: "moderate",
                  notes: ex.notes || "",
                  materiel: "salle de sport",
                  type: "standard"
                }))
              },
              semaineB: {
                name: dayData.salleVariants.semaineB.name,
                exercises: dayData.salleVariants.semaineB.exercices.map(ex => ({
                  id: ex.id,
                  name: ex.name,
                  series: ex.series,
                  reps: "",
                  rest: 90,
                  intensity: "moderate",
                  notes: ex.notes || "",
                  materiel: "salle de sport",
                  type: "standard"
                }))
              }
            } : undefined
          };
        });

        const defaultProgram = {
          id: 'default-program',
          name: "Programme Cycle 3+1",
          description: "Programme d'entraînement complet - Street Workout, Boxe, Natation et Musculation",
          duration: 12,
          goal: "Force, endurance et développement musculaire complet",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          startDate: new Date().toISOString(),
          schedule: convertedSchedule
        };
        
        setPrograms([defaultProgram]);
        setActiveProgram(defaultProgram);
      }
    };
    
    // Délai pour s'assurer que le contexte est bien chargé
    const timer = setTimeout(initializeDefaultProgram, 200);
    return () => clearTimeout(timer);
  }, [programs, activeProgram]);
  useEffect(() => {
    const initializeContext = async () => {
      await loadContext();
      isInitialLoadRef.current = false;
    };
    
    initializeContext();
  }, []);

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

export { WorkoutContext, useWorkout, WorkoutProvider };