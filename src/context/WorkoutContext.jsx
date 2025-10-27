import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';
import { workoutProgram } from '../data/workoutProgram';
import { findExerciseInDatabase } from '../data/exerciseDatabase';
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

  // Références pour la sauvegarde automatique du contexte
  const debounceTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Hooks personnalisés
  const { data, updateData, loadFromDB, saveToDB, saveSessionFeedback } = useWorkoutData();
  
  // État pour l'historique des programmes
  const [programHistory, setProgramHistory] = useState([]);

  // Fonction de sauvegarde automatique avec debounce pour le contexte (déplacée ici)
  const autoSaveContext = useCallback((contextData) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      saveContextToDB(contextData);
    }, 1000);
  }, []);

  // Fonction pour obtenir les données actuelles (temp ou réelles)
  const getCurrentData = () => {
    return (hasUnsavedExercises || hasUnsavedStretches) && tempData ? tempData : data;
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
    if (hasUnsavedExercises && tempData) {
      try {
        // Validation des données avant sauvegarde
        if (!tempData || typeof tempData !== 'object') {
          throw new Error('Données temporaires invalides pour les exercices');
        }

        // Vérifier l'intégrité des données d'exercices
        const { checkedExercises, reps } = tempData;
        if (checkedExercises && typeof checkedExercises !== 'object') {
          throw new Error('Format invalide pour checkedExercises');
        }
        if (reps && typeof reps !== 'object') {
          throw new Error('Format invalide pour reps');
        }

        // Validation des valeurs de répétitions
        if (reps) {
          for (const [key, value] of Object.entries(reps)) {
            if (value !== '' && value !== undefined && value !== null) {
              const numValue = parseInt(value);
              if (isNaN(numValue) || numValue < 0 || numValue > 999) {
                console.warn(`Valeur de répétition invalide pour ${key}: ${value}`);
                // Nettoyer la valeur invalide
                tempData.reps[key] = '';
              }
            }
          }
        }

        await updateData(tempData);
        setHasUnsavedExercises(false);
        setTempData(null);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des exercices:', error);
        throw error; // Propager l'erreur pour que l'UI puisse la gérer
      }
    }
  };

  const discardExerciseChanges = () => {
    try {
      setHasUnsavedExercises(false);
      setTempData(null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des exercices:', error);
    }
  };

  // Fonctions de sauvegarde et annulation pour étirements
  const saveStretchChanges = async () => {
    if (hasUnsavedStretches && tempData) {
      try {
        // Validation des données avant sauvegarde
        if (!tempData || typeof tempData !== 'object') {
          throw new Error('Données temporaires invalides pour les étirements');
        }

        // Vérifier l'intégrité des données d'étirements
        const { checkedStretches } = tempData;
        if (checkedStretches && typeof checkedStretches !== 'object') {
          throw new Error('Format invalide pour checkedStretches');
        }

        // Validation des clés d'étirements
        if (checkedStretches) {
          for (const [key, value] of Object.entries(checkedStretches)) {
            if (typeof value !== 'boolean' && value !== undefined && value !== null) {
              console.warn(`Valeur d'étirement invalide pour ${key}: ${value}`);
              // Convertir en booléen
              tempData.checkedStretches[key] = Boolean(value);
            }
          }
        }

        await updateData(tempData);
        setHasUnsavedStretches(false);
        setTempData(null);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des étirements:', error);
        throw error; // Propager l'erreur pour que l'UI puisse la gérer
      }
    }
  };

  const discardStretchChanges = () => {
    try {
      setHasUnsavedStretches(false);
      setTempData(null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des étirements:', error);
    }
  };

  const cancelExerciseChanges = () => {
    setHasUnsavedExercises(false);
    setTempData(null);
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
      // Vérifier le support d'IndexedDB
      if (!window.indexedDB) {
        console.error('❌ IndexedDB non supporté');
        reject(new Error('IndexedDB non supporté'));
        return;
      }

      const request = indexedDB.open('WorkoutTrackerContextDB', 1);
      
      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('contextData')) {
            const store = db.createObjectStore('contextData', { keyPath: 'id' });
          }
        } catch (error) {
          console.error('❌ Erreur lors de la création de l\'object store:', error);
          reject(error);
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        // Vérifier la structure de la base de données
        if (!db.objectStoreNames.contains('contextData')) {
          console.error('❌ Object store contextData manquant');
          reject(new Error('Structure de base de données invalide'));
          return;
        }
        
        resolve(db);
      };
      
      request.onerror = (event) => {
        console.error('❌ Erreur ouverture WorkoutTrackerContextDB:', event.target.error);
        reject(event.target.error);
      };

      request.onblocked = (event) => {
        console.warn('⚠️ Ouverture de WorkoutTrackerContextDB bloquée');
        reject(new Error('Base de données bloquée'));
      };
    });
  };

  const saveContextToDB = async (contextData) => {
    const maxRetries = 3;
    
    for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
      try {
        // Validation des données avant sauvegarde
        if (!contextData || typeof contextData !== 'object') {
          throw new Error('Données de contexte invalides');
        }

        const dataToSave = {
          id: 'context',
          ...contextData,
          lastSaved: new Date().toISOString()
        };


        
        const db = await openContextDB();
        const transaction = db.transaction(['contextData'], 'readwrite');
        const store = transaction.objectStore('contextData');
        
        return new Promise((resolve, reject) => {
          const request = store.put(dataToSave);
          
          request.onsuccess = () => {
            
            // Sauvegarde de secours en localStorage
            try {
              localStorage.setItem('workoutContext_backup', JSON.stringify(dataToSave));
            } catch (localStorageError) {
              console.warn('⚠️ Impossible de sauvegarder le contexte en localStorage:', localStorageError);
            }
            
            resolve();
          };
          
          request.onerror = (event) => {
            console.error(`❌ Erreur sauvegarde contexte (tentative ${retryCount}):`, event.target.error);
            reject(event.target.error);
          };
          
          transaction.oncomplete = () => {
          };
          
          transaction.onerror = (event) => {
            console.error(`❌ Erreur transaction contexte (tentative ${retryCount}):`, event.target.error);
            reject(event.target.error);
          };
        });
        
      } catch (error) {
        console.error(`❌ Erreur lors de la tentative ${retryCount} de sauvegarde du contexte:`, error);
        
        if (retryCount === maxRetries) {
          // Dernière tentative échouée - essayer de sauvegarder en localStorage comme fallback
          try {
            localStorage.setItem('workoutContext_backup', JSON.stringify({
              id: 'context',
              ...contextData,
              lastSaved: new Date().toISOString()
            }));
          } catch (localStorageError) {
            console.error('❌ Échec de la sauvegarde de secours du contexte:', localStorageError);
          }
          throw error;
        }
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
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

  // Hooks personnalisés pour la logique et les statistiques
  const workoutLogic = useWorkoutLogic(data, updateData);
  // CORRECTION: Utiliser toujours les données réelles (data) pour les statistiques et badges
  // Les données temporaires (tempData) ne doivent être utilisées que pour l'édition en cours
  // const workoutStats = useWorkoutStats(); // Commenté temporairement pour éviter l'erreur circulaire
  
  // Fonction getWorkoutHistory directement dans le contexte pour éviter la dépendance circulaire
  // Fonction pour récupérer le nom d'un exercice à partir de son ID
  const getExerciseNameById = (exerciseId) => {
    // Chercher dans tous les jours du programme
    for (const day of Object.values(workoutProgram)) {
      if (day.exercices) {
        const exercise = day.exercices.find(ex => ex.id === parseInt(exerciseId));
        if (exercise) {
          return exercise.name;
        }
      }
      
      // Chercher dans les variantes salle
      if (day.salleVariants) {
        for (const variant of Object.values(day.salleVariants)) {
          if (variant.exercices) {
            const exercise = variant.exercices.find(ex => ex.id === parseInt(exerciseId));
            if (exercise) {
              return exercise.name;
            }
          }
        }
      }
    }
    
    // Si pas trouvé dans le programme, essayer dans la base de données d'exercices
    // (au cas où l'exercice aurait été ajouté manuellement)
    return `Exercice ${exerciseId}`;
  };

  const getWorkoutHistory = () => {
    console.log('DEBUG: getWorkoutHistory called');
    const currentData = getCurrentData();
    console.log('DEBUG: currentData:', currentData);
    console.log('DEBUG: currentData.reps:', currentData?.reps);
    console.log('DEBUG: currentData.checkedExercises:', currentData?.checkedExercises);
    console.log('DEBUG: currentData.checkedStretches:', currentData?.checkedStretches);
    
    if (!currentData || !currentData.reps || !currentData.checkedExercises) {
      console.log('DEBUG: No data found, returning empty array');
      return [];
    }

    const history = [];
    
    // Grouper les données par date
    const dataByDate = {};
    
    // Traiter les exercices
    Object.keys(currentData.reps).forEach(key => {
      const reps = parseInt(currentData.reps[key]) || 0;
      console.log(`DEBUG: Processing key: ${key} reps: ${reps}`);
      
      if (reps > 0) {
        // Extraire la date de la clé (format: YYYY-MM-DD_exerciseId_variant)
        const parts = key.split('_');
        if (parts.length >= 2) {
          const dateStr = parts[0];
          const exerciseId = parts[1];
          const variant = parts[2] || '';
          
          if (!dataByDate[dateStr]) {
            dataByDate[dateStr] = { exercises: {}, stretches: {} };
          }
          
          dataByDate[dateStr].exercises[key] = {
            exerciseId: exerciseId,
            reps: reps,
            completed: currentData.checkedExercises[key] || false,
            variant: variant
          };
        }
      }
    });

    // Traiter les étirements
    if (currentData.checkedStretches) {
      Object.keys(currentData.checkedStretches).forEach(key => {
        if (currentData.checkedStretches[key]) {
          const parts = key.split('_');
          if (parts.length >= 2) {
            const dateStr = parts[0];
            const stretchType = parts[1];
            
            if (!dataByDate[dateStr]) {
              dataByDate[dateStr] = { exercises: {}, stretches: {} };
            }
            
            dataByDate[dateStr].stretches[key] = {
              stretchType: stretchType,
              completed: true
            };
          }
        }
      });
    }
    
    // Traiter chaque date
    Object.keys(dataByDate).forEach(dateStr => {
      const date = new Date(dateStr);
      const dayName = workoutLogic.getDayName(date);
      
      console.log(`DEBUG: Processing date: ${dateStr} dayName: ${dayName}`);
      
      const dateData = dataByDate[dateStr];
      const exercises = [];
      const stretches = [];
      
      // Créer les exercices à partir des données réelles
      Object.keys(dateData.exercises || {}).forEach(key => {
        const exerciseData = dateData.exercises[key];
        const exerciseName = getExerciseNameById(exerciseData.exerciseId);
        
        exercises.push({
          id: exerciseData.exerciseId,
          name: exerciseName,
          reps: exerciseData.reps,
          completed: exerciseData.completed
        });
      });

      // Créer les étirements à partir des données réelles
      Object.keys(dateData.stretches || {}).forEach(key => {
        const stretchData = dateData.stretches[key];
        
        stretches.push({
          type: stretchData.stretchType,
          completed: stretchData.completed
        });
      });

      const totalReps = exercises.reduce((sum, ex) => sum + ex.reps, 0);
      const completedExercises = exercises.filter(ex => ex.completed).length;
      const completedStretches = stretches.filter(stretch => stretch.completed).length;

      if (totalReps > 0 || completedExercises > 0 || completedStretches > 0) {
        const sessionData = {
          date: dateStr,
          dayName: dayName,
          exercises: exercises,
          stretches: stretches,
          totalReps: totalReps,
          completedExercises: completedExercises,
          completedStretches: completedStretches,
          totalExercises: exercises.length,
          totalStretches: stretches.length
        };
        
        console.log(`DEBUG: Adding session data for ${dateStr}:`, sessionData);
        history.push(sessionData);
      }
    });

    console.log('DEBUG: Final history result:', history);
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Fonction pour ajouter une entrée de progression (métriques, impédancemétrie, etc.)
  const addProgressEntry = async (entryData) => {
    try {
      if (!entryData || !entryData.type) {
        throw new Error('Données d\'entrée de progression invalides');
      }

      const newEntry = {
        id: `entry_${Date.now()}`,
        date: new Date().toISOString(),
        timestamp: entryData.timestamp || Date.now(),
        type: entryData.type,
        ...entryData
      };

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      
      const updatedData = {
        ...currentData,
        progressEntries: [...progressEntries, newEntry]
      };

      await updateData(updatedData);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'entrée de progression:', error);
      throw error;
    }
  };

  // Fonction pour ajouter une photo de progression
  const addProgressPhoto = async (photoData) => {
    try {
      if (!photoData || !photoData.weight || !photoData.notes) {
        throw new Error('Données de photo de progression invalides');
      }

      const newPhoto = {
        id: `photo_${Date.now()}`,
        date: new Date().toISOString(),
        weight: parseFloat(photoData.weight),
        notes: photoData.notes,
        photo: photoData.photo || null,
        measurements: photoData.measurements || {}
      };

      const currentData = getCurrentData();
      const updatedData = {
        ...currentData,
        progressPhotos: [...(currentData.progressPhotos || []), newPhoto]
      };

      await updateData(updatedData);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la photo de progression:', error);
      throw error;
    }
  };

  // Fonction pour supprimer une photo de progression
  const deleteProgressPhoto = async (photoIndex) => {
    try {
      if (typeof photoIndex !== 'number' || photoIndex < 0) {
        throw new Error('Index de photo invalide');
      }

      const currentData = getCurrentData();
      const progressPhotos = currentData.progressPhotos || [];
      
      if (photoIndex >= progressPhotos.length) {
        throw new Error('Photo non trouvée');
      }

      const updatedPhotos = progressPhotos.filter((_, index) => index !== photoIndex);
      const updatedData = {
        ...currentData,
        progressPhotos: updatedPhotos
      };

      await updateData(updatedData);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la photo de progression:', error);
      throw error;
    }
  };

  // Fonctions utilitaires pour calculer les données des défis
  const getWorkoutHistoryFromData = (data) => {
    if (!data || !data.checkedExercises) return [];
    
    const sessions = {};
    Object.entries(data.checkedExercises).forEach(([key, isChecked]) => {
      if (isChecked) {
        const [dateStr, exerciseId] = key.split('_');
        if (!sessions[dateStr]) {
          sessions[dateStr] = {
            date: dateStr,
            exercises: [],
            totalReps: 0
          };
        }
        
        const reps = parseInt(data.reps?.[key] || 0);
        sessions[dateStr].exercises.push({
          id: exerciseId,
          reps: reps
        });
        sessions[dateStr].totalReps += reps;
      }
    });
    
    return Object.values(sessions).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getUniqueExercisesFromData = (data) => {
    const uniqueExercises = new Set();
    Object.keys(data.checkedExercises || {}).forEach(key => {
      if (data.checkedExercises[key]) {
        const exerciseId = key.split('_')[1];
        uniqueExercises.add(exerciseId);
      }
    });
    return uniqueExercises;
  };

  const getTodayRepsFromData = (data, date = new Date()) => {
    const dateStr = date.toISOString().split('T')[0];
    let totalReps = 0;
    
    Object.entries(data.reps || {}).forEach(([key, reps]) => {
      if (key.startsWith(dateStr) && data.checkedExercises?.[key]) {
        totalReps += parseInt(reps) || 0;
      }
    });
    
    return totalReps;
  };

  const getTodayExercisesFromData = (data, date = new Date()) => {
    const dateStr = date.toISOString().split('T')[0];
    const exercises = [];
    
    Object.keys(data.checkedExercises || {}).forEach(key => {
      if (key.startsWith(dateStr) && data.checkedExercises[key]) {
        const exerciseId = key.split('_')[1];
        exercises.push(exerciseId);
      }
    });
    
    return exercises;
  };

  const getTodayWorkoutsFromData = (data, date = new Date()) => {
    const dateStr = date.toISOString().split('T')[0];
    const hasWorkout = Object.keys(data.checkedExercises || {}).some(key =>
      key.startsWith(dateStr) && data.checkedExercises[key]
    );
    return hasWorkout ? [dateStr] : [];
  };

  const getWeekWorkoutsFromData = (data) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const workoutHistory = getWorkoutHistoryFromData(data);
    return workoutHistory.filter(session => new Date(session.date) >= weekAgo);
  };

  const getWeekRepsFromData = (data) => {
    const weekWorkouts = getWeekWorkoutsFromData(data);
    return weekWorkouts.reduce((sum, session) => sum + session.totalReps, 0);
  };

  const getMonthWorkoutsFromData = (data) => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const workoutHistory = getWorkoutHistoryFromData(data);
    return workoutHistory.filter(session => new Date(session.date) >= monthAgo);
  };

  const getMonthRepsFromData = (data) => {
    const monthWorkouts = getMonthWorkoutsFromData(data);
    return monthWorkouts.reduce((sum, session) => sum + session.totalReps, 0);
  };

  const getMonthUniqueExercisesFromData = (data) => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];
    
    const uniqueExercises = new Set();
    Object.keys(data.checkedExercises || {}).forEach(key => {
      if (data.checkedExercises[key]) {
        const dateStr = key.split('_')[0];
        if (dateStr >= monthAgoStr) {
          const exerciseId = key.split('_')[1];
          uniqueExercises.add(exerciseId);
        }
      }
    });
    return uniqueExercises;
  };

  const getTotalRepsFromData = (data) => {
    const workoutHistory = getWorkoutHistoryFromData(data);
    return workoutHistory.reduce((sum, session) => sum + session.totalReps, 0);
  };

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
    loadFromDB,
    saveToDB,
    getCurrentData,
    resetDay,
    
    // Gestion des modifications temporaires
    hasUnsavedExercises,
    hasUnsavedStretches,
    tempData,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    cancelExerciseChanges,
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
    showAdvancedStats: showAdvancedStatsModal,
    setShowAdvancedStats: setShowAdvancedStatsModal,
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
    
    // Fonctions de photos de progression
    addProgressEntry,
    addProgressPhoto,
    deleteProgressPhoto,
    
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
    
    // Fonctions de données
    // Hooks personnalisés
    ...workoutLogic,
    
    // Fonctions de statistiques
    getWorkoutHistory
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