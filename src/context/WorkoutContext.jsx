import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';
import { workoutProgram } from '../data/workoutProgram';
import { findExerciseInDatabase } from '../data/exerciseDatabase';
import { getDateStr, getDayName } from '../utils/dateUtils';
import { isMockEnduranceSession } from '../utils/calendarUtils';
import { 
  createJustification, 
  updateJustification,
  isValidJustificationDate,
  isValidJustificationReason,
  isValidJustificationNote,
  getDayJustification as getDayJustificationUtil
} from '../utils/dayJustificationUtils';
import { useAuth } from './AuthContext';
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';

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
  const [activeTab, setActiveTab] = useState('home');
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

  // Authentification : déterminer l'utilisateur courant et l'admin
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314';
  const storageKey = useMemo(() => {
    if (isAdmin) return 'main'; // ✅ Les anciennes données "globales" deviennent les données admin
    if (currentUser?.id) return `user-${currentUser.id}`;
    return 'anonymous';
  }, [isAdmin, currentUser?.id]);

  // Hooks personnalisés (données d'entraînement, scindées par utilisateur)
  // 🔒 Important :
  // - plus aucune donnée mockée / de test.
  // - lorsque l'utilisateur est déconnecté, les données sont éphémères (pas de lecture/écriture IndexedDB).
  const { data, updateData, loadFromDB, saveToDB, saveSessionFeedback } = useWorkoutData({
    storageKey,
    generateTestData: false,
    ephemeral: !isAuthenticated
  });
  
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
        
        // Émettre événement pour synchronisation sidebar
        sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { 
          date: getDateStr(new Date()),
          type: 'exercises'
        });
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
        
        // Émettre événement pour synchronisation sidebar
        sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { 
          date: getDateStr(new Date()),
          type: 'stretches'
        });
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
    const currentData = getCurrentData();
    
    if (!currentData) {
      return [];
    }

    const history = [];
    
    // ✅ Grouper les données par date (structure enrichie pour variations)
    const dataByDate = {};
    
    // ✅ ============================================
    // PHASE 1 : TRAITER LES EXERCICES NORMAUX (code existant préservé)
    // ============================================
    try {
      if (currentData.reps) {
        // ✅ CORRECTION CRITIQUE : Fonction de normalisation pour éviter les chaînes concaténées
        const normalizeRepsValue = (value) => {
          if (value == null) return 0;
          if (typeof value === 'number') {
            return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, Math.floor(value));
          }
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return 0;
            // ✅ Utiliser parseFloat pour gérer les décimales, puis Math.floor pour entier
            const parsed = parseFloat(trimmed);
            return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, Math.floor(parsed));
          }
          return 0;
        };
        
        Object.keys(currentData.reps).forEach(key => {
          // ✅ CORRECTION : Utiliser normalizeRepsValue au lieu de parseInt simple
          const reps = normalizeRepsValue(currentData.reps[key]);
          
          if (reps > 0) {
            // Extraire la date de la clé (format: YYYY-MM-DD_exerciseId_variant)
            const parts = key.split('_');
            if (parts.length >= 2) {
              const dateStr = parts[0];
              const exerciseId = parts[1];
              const variant = parts[2] || '';
              
              // ✅ Ignorer les clés non-numériques (endurance, complementary, etc.)
              if (!/^\d+$/.test(exerciseId)) {
                return; // ne pas compter dans l'historique des exercices
              }
              
              if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: null };
              }
              
              dataByDate[dateStr].exercises[key] = {
                exerciseId: exerciseId,
                reps: reps, // ✅ CORRECTION : Déjà normalisé
                completed: currentData.checkedExercises?.[key] || false,
                variant: variant
              };
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur Phase 1 (Exercices normaux):', error);
      // Continuer même en cas d'erreur (fallback gracieux)
    }
    
    // ✅ ============================================
    // PHASE 2 : TRAITER LES DAILY VARIATIONS (NOUVEAU)
    // ============================================
    try {
      Object.entries(currentData.dailyVariations || {}).forEach(([dateStr, variation]) => {
        // ✅ Validation stricte de la variation
        if (!variation || typeof variation !== 'object') {
          console.warn(`⚠️ Variation invalide pour ${dateStr}:`, variation);
          return;
        }
        
        // ✅ Initialiser dataByDate si pas déjà fait
        if (!dataByDate[dateStr]) {
          dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: variation };
        } else {
          dataByDate[dateStr].variations = variation;
        }
        
        // ✅ Traiter les exercices exceptionnels (SEULEMENT complétés)
        const additionalExercises = Array.isArray(variation.additionalExercises) 
          ? variation.additionalExercises 
          : [];
        
        additionalExercises.forEach(ex => {
          // ✅ Validation stricte de l'exercice exceptionnel
          if (!ex || typeof ex !== 'object' || !ex.id) {
            console.warn(`⚠️ Exercice exceptionnel invalide pour ${dateStr}:`, ex);
            return;
          }
          
          // ✅ SEULEMENT les exercices complétés vont dans l'historique
          if (ex.completed === true) {
            const exerciseKey = `exceptional_${ex.id}`;
            
            // ✅ Priorité données réelles : actualReps > totalReps > repsPerSeries
            let reps = 0;
            let actualReps = null;
            let totalReps = null;
            
            if (ex.type === 'reps') {
              // Priorité 1 : actualReps (données réelles)
              if (Array.isArray(ex.actualReps) && ex.actualReps.length > 0) {
                actualReps = ex.actualReps;
                totalReps = ex.actualReps.reduce((sum, r) => sum + (typeof r === 'number' ? r : 0), 0);
                reps = totalReps;
              }
              // Priorité 2 : totalReps (calculé)
              else if (ex.totalReps && typeof ex.totalReps === 'number' && ex.totalReps > 0) {
                totalReps = ex.totalReps;
                reps = totalReps;
              }
              // Priorité 3 : repsPerSeries (planifiées)
              else if (Array.isArray(ex.repsPerSeries) && ex.repsPerSeries.length > 0) {
                actualReps = ex.repsPerSeries;
                totalReps = ex.repsPerSeries.reduce((sum, r) => sum + (typeof r === 'number' ? r : 0), 0);
                reps = totalReps;
              }
            }
            
            // ✅ Durée pour type 'duration'
            let duration = null;
            if (ex.type === 'duration') {
              // Priorité : actualDuration > duration
              duration = ex.actualDuration || ex.duration || null;
            }
            
            dataByDate[dateStr].exercises[exerciseKey] = {
              exerciseId: ex.id, // ID complet pour référence
              name: ex.name || 'Exercice exceptionnel', // Nom directement disponible
              reps: reps,
              duration: duration,
              completed: true,
              isExceptional: true, // ✅ Flag pour distinction
              type: ex.type,
              actualReps: actualReps, // Détails par série si disponible
              totalReps: totalReps, // Total calculé
              materiel: ex.materiel,
              notes: ex.notes
            };
          }
        });
      });
    } catch (error) {
      console.error('❌ Erreur Phase 2 (DailyVariations):', error);
      // Continuer même en cas d'erreur (fallback gracieux)
    }
    
    // ✅ ============================================
    // PHASE 3 : TRAITER LES ÉTIREMENTS (code existant préservé)
    // ============================================
    try {
      if (currentData.checkedStretches) {
        Object.keys(currentData.checkedStretches).forEach(key => {
          if (currentData.checkedStretches[key]) {
            const parts = key.split('_');
            if (parts.length >= 2) {
              const dateStr = parts[0];
              const stretchType = parts[1];
              
              if (!dataByDate[dateStr]) {
                dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: null };
              }
              
              dataByDate[dateStr].stretches[key] = {
                stretchType: stretchType,
                completed: true
              };
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur Phase 3 (Étirements):', error);
      // Continuer même en cas d'erreur (fallback gracieux)
    }
    
    // ✅ ============================================
    // PHASE 4 : TRAITER LES SESSIONS D'ENDURANCE (code existant préservé)
    // ============================================
    try {
      const enduranceData = currentData?.enduranceData || {};
      const enduranceSessions = enduranceData.sessions || {};
      
      Object.entries(enduranceSessions).forEach(([activityType, sessions]) => {
        if (Array.isArray(sessions)) {
          sessions.forEach(session => {
            if (session.date) {
              // Convertir la date au format YYYY-MM-DD si nécessaire
              let dateStr = session.date;
              if (session.date.includes('T')) {
                dateStr = session.date.split('T')[0];
              }
              
              // Vérifier que c'est une date valide
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (!dataByDate[dateStr]) {
                  dataByDate[dateStr] = { exercises: {}, stretches: {}, variations: null };
                }
                
                // Ajouter la session d'endurance comme exercice
                // CORRECTION CRITIQUE: Ne PAS compter les jumps comme reps pour jumprope
                // Les jumps sont une métrique séparée, pas des répétitions d'exercice
                const enduranceKey = `${dateStr}_endurance_${activityType}_${session.id || Date.now()}`;
                dataByDate[dateStr].exercises[enduranceKey] = {
                  exerciseId: `endurance_${activityType}`,
                  reps: activityType === 'jumprope' ? 0 : (session.reps || session.count || 0), // Exclure jumps des reps
                  jumps: activityType === 'jumprope' ? (session.jumps || 0) : undefined, // Garder jumps séparément
                  completed: true,
                  variant: '',
                  activityType: activityType,
                  duration: session.duration || 0,
                  distance: session.distance || 0,
                  notes: session.notes || ''
                };
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Erreur Phase 4 (Endurance):', error);
      // Continuer même en cas d'erreur (fallback gracieux)
    }
    
    // ✅ ============================================
    // PHASE 5 : FUSION INTELLIGENTE AVEC MÉTADONNÉES ENRICHIES
    // ============================================
    try {
      Object.keys(dataByDate).forEach(dateStr => {
        const date = new Date(dateStr);
        const dayName = getDayName(date);
        
        const dateData = dataByDate[dateStr];
        const variation = dateData.variations;
        const exercises = [];
        const stretches = [];
        
        // ✅ Créer les exercices depuis les données normales ET exceptionnelles
        Object.keys(dateData.exercises || {}).forEach(key => {
          const exerciseData = dateData.exercises[key];
          
          // ✅ Si exercice exceptionnel, utiliser les données complètes
          if (exerciseData.isExceptional) {
            // ✅ CORRECTION : Normaliser reps et totalReps pour éviter les chaînes
            const normalizeRepsValue = (value) => {
              if (value == null) return 0;
              if (typeof value === 'number') {
                return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, Math.floor(value));
              }
              if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '') return 0;
                const parsed = parseFloat(trimmed);
                return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, Math.floor(parsed));
              }
              return 0;
            };
            
            exercises.push({
              id: exerciseData.exerciseId,
              name: exerciseData.name || 'Exercice exceptionnel',
              reps: normalizeRepsValue(exerciseData.reps), // ✅ CORRECTION : Normaliser
              duration: exerciseData.duration || null,
              completed: true,
              isExceptional: true, // ✅ Flag pour distinction
              type: exerciseData.type,
              actualReps: exerciseData.actualReps, // Détails par série si disponible
              totalReps: normalizeRepsValue(exerciseData.totalReps), // ✅ CORRECTION : Normaliser
              materiel: exerciseData.materiel,
              notes: exerciseData.notes
            });
          } else {
            // ✅ Exercice normal (programme ou endurance)
            const exerciseName = getExerciseNameById(exerciseData.exerciseId);
            
            // ✅ CORRECTION : Normaliser reps pour éviter les chaînes
            const normalizeRepsValue = (value) => {
              if (value == null) return 0;
              if (typeof value === 'number') {
                return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, Math.floor(value));
              }
              if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '') return 0;
                const parsed = parseFloat(trimmed);
                return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, Math.floor(parsed));
              }
              return 0;
            };
            
            exercises.push({
              id: exerciseData.exerciseId,
              name: exerciseName,
              reps: normalizeRepsValue(exerciseData.reps), // ✅ CORRECTION : Normaliser
              completed: exerciseData.completed || false,
              variant: exerciseData.variant || '',
              // ✅ Données spécifiques endurance si présentes
              ...(exerciseData.activityType && {
                activityType: exerciseData.activityType,
                jumps: exerciseData.jumps,
                duration: exerciseData.duration,
                distance: exerciseData.distance,
                notes: exerciseData.notes
              })
            });
          }
        });

        // ✅ Créer les étirements à partir des données réelles
        Object.keys(dateData.stretches || {}).forEach(key => {
          const stretchData = dateData.stretches[key];
          
          stretches.push({
            type: stretchData.stretchType,
            completed: stretchData.completed
          });
        });

        // ✅ Ajouter les exercices supprimés comme entrées spéciales (pour traçabilité)
        if (variation && Array.isArray(variation.suppressedExercises) && variation.suppressedExercises.length > 0) {
          variation.suppressedExercises.forEach(exId => {
            // ✅ Validation ID
            if (typeof exId !== 'number' || isNaN(exId) || exId <= 0) {
              console.warn(`⚠️ ID d'exercice supprimé invalide: ${exId}`);
              return;
            }
            
            const exerciseName = getExerciseNameById(exId.toString());
            exercises.push({
              id: exId.toString(),
              name: exerciseName,
              reps: 0,
              completed: false,
              isSuppressed: true, // ✅ Flag pour distinction
              suppressionReason: variation.reason || null
            });
          });
        }

        // ✅ CORRECTION CRITIQUE : Calculer totalReps avec normalisation des types
        // Le problème : ex.reps peut être une chaîne, causant une concaténation au lieu d'une addition
        // Solution : Normaliser chaque valeur en nombre avant l'addition
        const normalizeRepsValue = (value) => {
          if (value == null) return 0;
          if (typeof value === 'number') {
            return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, Math.floor(value));
          }
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return 0;
            const parsed = parseFloat(trimmed);
            return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, Math.floor(parsed));
          }
          return 0;
        };
        
        const totalReps = exercises
          .filter(ex => !ex.isSuppressed && ex.completed) // ✅ Exclure supprimés et non-complétés
          .reduce((sum, ex) => {
            // ✅ CORRECTION : Normaliser ex.reps avant l'addition pour éviter concaténation
            const normalizedReps = normalizeRepsValue(ex.reps);
            return sum + normalizedReps;
          }, 0);
        
        const completedExercises = exercises.filter(ex => ex.completed).length;
        const completedStretches = stretches.filter(stretch => stretch.completed).length;

        // ✅ PHASE 1.1 : Récupérer intensity depuis sessionFeedbacks
        // Le feedback est stocké dans currentData.sessionFeedbacks[dateStr] avec difficulte (1-10)
        const sessionFeedback = currentData.sessionFeedbacks?.[dateStr];
        const intensity = sessionFeedback?.difficulte || null; // null si pas de feedback, sera géré par AdvancedStats avec valeur par défaut 5

        // ✅ PHASE 1.1 : Calculer duration (en minutes)
        // Priorité 1 : Somme des durées des exercices (si disponibles)
        // Priorité 2 : Estimation basée sur le nombre d'exercices (5 min par exercice)
        // Priorité 3 : Durée par défaut de 30 minutes
        let duration = null;
        
        // Essayer de calculer depuis les durées des exercices
        const totalDurationFromExercises = exercises
          .filter(ex => ex.completed && ex.duration != null)
          .reduce((sum, ex) => {
            // Normaliser la durée (peut être en secondes ou minutes)
            const exDuration = normalizeRepsValue(ex.duration);
            // Si la durée est < 60, considérer que c'est en minutes, sinon convertir secondes → minutes
            return sum + (exDuration < 60 ? exDuration : Math.round(exDuration / 60));
          }, 0);
        
        if (totalDurationFromExercises > 0) {
          duration = totalDurationFromExercises;
        } else if (completedExercises > 0) {
          // Estimation : 5 minutes par exercice complété
          duration = completedExercises * 5;
        } else {
          // Valeur par défaut si aucune activité
          duration = null; // Sera géré par AdvancedStats avec valeur par défaut 30
        }

        // ✅ Inclure dans l'historique si au moins une activité
        if (totalReps > 0 || completedExercises > 0 || completedStretches > 0 || exercises.length > 0) {
          const sessionData = {
            date: dateStr,
            dayName: dayName,
            exercises: exercises,
            stretches: stretches,
            totalReps: totalReps,
            completedExercises: completedExercises,
            completedStretches: completedStretches,
            totalExercises: exercises.length,
            totalStretches: stretches.length,
            // ✅ PHASE 1.1 : Ajouter intensity et duration pour AdvancedStats
            intensity: intensity, // null si pas de feedback, AdvancedStats utilisera 5 par défaut
            duration: duration, // null si pas calculable, AdvancedStats utilisera 30 par défaut
            // ✅ Métadonnées enrichies pour analytics
            hasVariations: !!variation,
            suppressedCount: variation && Array.isArray(variation.suppressedExercises) 
              ? variation.suppressedExercises.length 
              : 0,
            exceptionalCount: variation && Array.isArray(variation.additionalExercises)
              ? variation.additionalExercises.filter(ex => ex && ex.completed === true).length
              : 0,
            variationReason: variation?.reason || null,
            // ✅ PHASE 1.1 : Ajouter référence au feedback complet si disponible
            feedback: sessionFeedback || null
          };
          
          history.push(sessionData);
        }
      });
    } catch (error) {
      console.error('❌ Erreur Phase 5 (Fusion):', error);
      // Continuer même en cas d'erreur (fallback gracieux)
    }

    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Fonction pour ajouter une entrée de progression (métriques, impédancemétrie, etc.)
  const addProgressEntry = async (entryData) => {
    try {
      if (!entryData || !entryData.type) {
        throw new Error('Données d\'entrée de progression invalides');
      }

      // 🔧 Validation renforcée des données
      // Utiliser la date fournie ou la date actuelle
      const entryDate = entryData.date 
        ? new Date(entryData.date).toISOString()
        : new Date().toISOString();
      
      const entryDateKey = entryDate.split('T')[0]; // YYYY-MM-DD pour comparaison

      const validatedEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: entryDate,
        timestamp: entryData.timestamp || new Date(entryDate).getTime(),
        type: entryData.type,
        ...entryData,
        // Métadonnées de sauvegarde
        savedAt: Date.now(),
        version: '1.0'
      };

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      
      // 🔍 DÉDUPLICATION INTELLIGENTE
      // Vérifier si une entrée existe déjà pour la même date (jour) ET le même type
      const existingEntryIndex = progressEntries.findIndex(entry => {
        const existingDate = entry.date 
          ? new Date(entry.date).toISOString().split('T')[0]
          : entry.timestamp 
            ? new Date(entry.timestamp).toISOString().split('T')[0]
            : null;
        
        // Comparer date (même jour) et type
        return existingDate === entryDateKey && entry.type === entryData.type;
      });

      let updatedEntries;
      let action = 'added'; // 'added', 'replaced', 'merged'
      
      if (existingEntryIndex !== -1) {
        const existingEntry = progressEntries[existingEntryIndex];
        
        // STRATÉGIE: Remplacement par défaut si doublon détecté
        // La nouvelle entrée remplace l'ancienne (stratégie la plus sûre pour éviter doublons)
        // On garde l'ID existant pour cohérence, mais on met à jour toutes les données
        
        // Option: Vérifier si la nouvelle entrée est plus récente (basé sur savedAt)
        const isNewer = validatedEntry.savedAt > (existingEntry.savedAt || 0);
        
        if (isNewer) {
          // Remplacement: garder l'ID existant mais mettre à jour toutes les données
          updatedEntries = [...progressEntries];
          updatedEntries[existingEntryIndex] = {
            ...validatedEntry,
            id: existingEntry.id, // Garder l'ID existant pour cohérence
            // Conserver certaines métadonnées si pertinentes
            savedAt: validatedEntry.savedAt
          };
          action = 'replaced';
          
          console.log(`🔄 Entrée remplacée (même date/type): ${existingEntry.type} du ${entryDateKey} (ID: ${existingEntry.id})`);
        } else {
          // L'ancienne entrée est plus récente, on la garde
          // Mais on met à jour seulement les champs non définis dans l'existante
          // MERGE: Fusionner les données intelligemment
          const mergedEntry = {
            ...existingEntry,
            // Mettre à jour seulement les champs qui sont définis dans validatedEntry
            // mais qui sont null/undefined dans existingEntry
            ...Object.keys(validatedEntry).reduce((acc, key) => {
              // Ne pas overwrite les métadonnées système (id, savedAt, version)
              if (['id', 'savedAt', 'version'].includes(key)) {
                acc[key] = existingEntry[key];
              } 
              // Si la valeur existante est null/undefined et la nouvelle a une valeur, utiliser la nouvelle
              else if ((existingEntry[key] == null || existingEntry[key] === '') && validatedEntry[key] != null && validatedEntry[key] !== '') {
                acc[key] = validatedEntry[key];
              }
              // Sinon garder l'existante
              else {
                acc[key] = existingEntry[key];
              }
              return acc;
            }, {}),
            // Mettre à jour savedAt pour indiquer dernière modification
            savedAt: Date.now()
          };
          
          updatedEntries = [...progressEntries];
          updatedEntries[existingEntryIndex] = mergedEntry;
          action = 'merged';
          
          console.log(`🔀 Entrée fusionnée (données existantes plus récentes): ${existingEntry.type} du ${entryDateKey} (ID: ${existingEntry.id})`);
        }
      } else {
        // Aucun doublon, ajouter normalement
        updatedEntries = [...progressEntries, validatedEntry];
        action = 'added';
      }
      
      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        // Marquer la dernière mise à jour du suivi corporel
        bodyTrackingLastUpdated: new Date().toISOString()
      };
      
      // Note: Cleanup automatique désactivé - système de notification activé à la place

      await updateData(updatedData);
      
      const actionMessage = {
        added: '✅ Entrée de progression ajoutée avec succès',
        replaced: '🔄 Entrée de progression remplacée (doublon détecté et remplacé)',
        merged: '🔀 Entrée de progression fusionnée avec données existantes'
      };
      
      console.log(`${actionMessage[action]}: ${validatedEntry.type} (Date: ${entryDateKey})`);
      
      // Retourner l'entrée finale (celle qui a été ajoutée/remplacée/fusionnée)
      const finalEntry = existingEntryIndex !== -1 
        ? updatedEntries[existingEntryIndex] 
        : updatedEntries[updatedEntries.length - 1];
      
      return { 
        success: true, 
        entry: finalEntry,
        action: action // Informer l'appelant de l'action effectuée ('added', 'replaced', 'merged')
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'entrée de progression:', error);
      throw error;
    }
  };

  // Fonction pour mettre à jour une entrée de progression
  const updateProgressEntry = async (entryId, updates) => {
    try {
      if (!entryId) {
        throw new Error('ID d\'entrée de progression invalide');
      }

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      const entryIndex = progressEntries.findIndex(entry => entry.id === entryId);

      if (entryIndex === -1) {
        throw new Error('Entrée de progression non trouvée');
      }

      const existingEntry = progressEntries[entryIndex];
      const updatedEntry = {
        ...existingEntry,
        ...updates,
        // Mettre à jour la date si elle est fournie
        date: updates.date ? new Date(updates.date).toISOString() : existingEntry.date,
        timestamp: updates.date ? new Date(updates.date).getTime() : (updates.timestamp || existingEntry.timestamp),
        // Métadonnées de sauvegarde
        savedAt: Date.now()
      };

      const updatedEntries = [...progressEntries];
      updatedEntries[entryIndex] = updatedEntry;

      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      console.log(`✅ Entrée de progression mise à jour: ${entryId}`);
      return { success: true, entry: updatedEntry };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'entrée de progression:', error);
      throw error;
    }
  };

  // Fonction pour supprimer une entrée de progression
  const deleteProgressEntry = async (entryId) => {
    try {
      if (!entryId) {
        throw new Error('ID d\'entrée de progression invalide');
      }

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      const entryIndex = progressEntries.findIndex(entry => entry.id === entryId);

      if (entryIndex === -1) {
        throw new Error('Entrée de progression non trouvée');
      }

      const updatedEntries = progressEntries.filter((_, index) => index !== entryIndex);
      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      console.log(`✅ Entrée de progression supprimée: ${entryId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'entrée de progression:', error);
      throw error;
    }
  };

  // Fonction pour supprimer un champ spécifique d'une entrée
  const deleteProgressEntryField = async (entryId, fieldName) => {
    try {
      if (!entryId || !fieldName) {
        throw new Error('ID d\'entrée ou nom de champ invalide');
      }

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      const entryIndex = progressEntries.findIndex(entry => entry.id === entryId);

      if (entryIndex === -1) {
        throw new Error('Entrée de progression non trouvée');
      }

      const existingEntry = progressEntries[entryIndex];
      const updatedEntry = {
        ...existingEntry,
        [fieldName]: null, // Supprimer le champ en le mettant à null
        savedAt: Date.now()
      };

      const updatedEntries = [...progressEntries];
      updatedEntries[entryIndex] = updatedEntry;

      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      console.log(`✅ Champ ${fieldName} supprimé de l'entrée: ${entryId}`);
      return { success: true, entry: updatedEntry };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du champ:', error);
      throw error;
    }
  };

  // Fonction pour ajouter une photo de progression
  const addProgressPhoto = async (photoData) => {
    try {
      // ✅ NORMALISATION: Importer utilitaire normalisation
      const { validateAndNormalizePhotoData } = await import('../components/BodyTracking/utils/photoNormalizer');
      
      // ✅ Validation et normalisation (garantit structure cohérente avec uniquement `url`)
      const normalizedPhotoData = validateAndNormalizePhotoData(photoData);

      // 🔧 Validation renforcée des données photo (structure normalisée)
      // ✅ PHASE 1.5 : Préserver structure multi-résolution si présente
      const validatedPhoto = {
        id: normalizedPhotoData.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: normalizedPhotoData.date || new Date().toISOString(),
        weight: normalizedPhotoData.weight ? parseFloat(normalizedPhotoData.weight) : null,
        notes: normalizedPhotoData.notes || '',
        url: normalizedPhotoData.url, // ✅ Fallback si resolutions n'existe pas
        measurements: normalizedPhotoData.measurements || {},
        angle: normalizedPhotoData.angle || 'front',
        tags: normalizedPhotoData.tags || ['progress'],
        // ✅ PHASE 1.5 : Préserver structure multi-résolution (thumbnail/preview/full)
        ...(normalizedPhotoData.resolutions && typeof normalizedPhotoData.resolutions === 'object'
          ? { resolutions: normalizedPhotoData.resolutions }
          : {}),
        // Métadonnées de sauvegarde
        savedAt: Date.now(),
        version: '2.0', // Version incrémentée pour marquer normalisation
        filename: normalizedPhotoData.filename || 'progress_photo.jpg',
        type: normalizedPhotoData.type || 'photo',
        // ✅ PHASE 1.5 : Préserver métadonnées compression si présentes
        ...(normalizedPhotoData.compression ? { compression: normalizedPhotoData.compression } : {})
      };

      const currentData = getCurrentData();
      const updatedData = {
        ...currentData,
        progressPhotos: [...(currentData.progressPhotos || []), validatedPhoto],
        // Marquer la dernière mise à jour du suivi corporel
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      return { success: true, photo: validatedPhoto };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la photo de progression:', error);
      throw error;
    }
  };

  // ✅ PHASE 1.3 : Fonction pour mettre à jour une photo de progression
  /**
   * Met à jour une photo de progression existante par son ID
   * 
   * @param {string} photoId - ID unique de la photo à mettre à jour
   * @param {Object} updates - Objet contenant les champs à mettre à jour
   * @param {Object} updates.analysis - Résultats d'analyse IA (optionnel)
   * @param {string} updates.notes - Notes de la photo (optionnel)
   * @param {number} updates.weight - Poids (optionnel)
   * @param {string} updates.angle - Angle de la photo (optionnel)
   * @param {Array} updates.tags - Tags de la photo (optionnel)
   * @param {Object} updates.measurements - Mensurations (optionnel)
   * @param {Object} updates.resolutions - Structure multi-résolution (optionnel, préservée si non fournie)
   * 
   * @returns {Promise<Object>} Photo mise à jour
   * 
   * **Important** :
   * - Préserve la structure multi-résolution existante si non fournie dans updates
   * - Fusionne intelligemment les updates (deep merge pour objets imbriqués)
   * - Sauvegarde automatiquement dans IndexedDB
   * - Compatible avec export JSON (structure analysis incluse)
   */
  const updateProgressPhoto = async (photoId, updates) => {
    try {
      if (!photoId || typeof photoId !== 'string') {
        throw new Error('ID de photo invalide');
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Updates invalides');
      }

      const currentData = getCurrentData();
      const progressPhotos = currentData.progressPhotos || [];
      
      // ✅ Trouver photo par ID (pas index)
      const photoIndex = progressPhotos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) {
        throw new Error(`Photo avec ID "${photoId}" non trouvée`);
      }

      const existingPhoto = progressPhotos[photoIndex];

      // ✅ Fusion intelligente : préserver structure multi-résolution et autres métadonnées
      const updatedPhoto = {
        ...existingPhoto,
        ...updates,
        // ✅ Préserver structure multi-résolution si non fournie dans updates
        resolutions: updates.resolutions !== undefined 
          ? updates.resolutions 
          : existingPhoto.resolutions,
        // ✅ Fusion profonde pour analysis (préserver métadonnées existantes)
        analysis: updates.analysis 
          ? {
              ...existingPhoto.analysis,
              ...updates.analysis,
              // Préserver analyzedAt si déjà présent, sinon utiliser maintenant
              analyzedAt: updates.analysis.analyzedAt || existingPhoto.analysis?.analyzedAt || new Date().toISOString()
            }
          : existingPhoto.analysis,
        // ✅ Préserver url si resolutions existe (fallback)
        url: updates.url !== undefined 
          ? updates.url 
          : (existingPhoto.url || (existingPhoto.resolutions?.preview?.data || existingPhoto.resolutions?.full?.data)),
        // ✅ Métadonnées de mise à jour
        updatedAt: Date.now(),
        version: existingPhoto.version || '2.0'
      };

      // ✅ Remplacer photo dans le tableau
      const updatedPhotos = [...progressPhotos];
      updatedPhotos[photoIndex] = updatedPhoto;

      const updatedData = {
        ...currentData,
        progressPhotos: updatedPhotos,
        // Marquer la dernière mise à jour du suivi corporel
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      return { success: true, photo: updatedPhoto };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la photo de progression:', error);
      throw error;
    }
  };

  // ✅ PHASE 1.4 : Fonction pour supprimer une photo de progression par ID
  /**
   * Supprime une photo de progression par son ID unique
   * 
   * @param {string} photoId - ID unique de la photo à supprimer
   * @returns {Promise<Object>} { success: boolean }
   * 
   * **Important** :
   * - Utilise ID (pas index) pour cohérence avec reste du système
   * - Compatible avec pagination/virtualisation (ID stable)
   * - Supprime de IndexedDB via updateData
   */
  const deleteProgressPhoto = async (photoId) => {
    try {
      if (!photoId || typeof photoId !== 'string') {
        throw new Error('ID de photo invalide');
      }

      const currentData = getCurrentData();
      const progressPhotos = currentData.progressPhotos || [];
      
      // ✅ Recherche par ID (pas index)
      const photoIndex = progressPhotos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) {
        throw new Error(`Photo avec ID "${photoId}" non trouvée`);
      }

      // ✅ Supprimer photo du tableau
      const updatedPhotos = progressPhotos.filter(photo => photo.id !== photoId);
      
      const updatedData = {
        ...currentData,
        progressPhotos: updatedPhotos,
        // Marquer la dernière mise à jour du suivi corporel
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la photo de progression:', error);
      throw error;
    }
  };

  // Fonctions homepageImages supprimées - maintenant gérées par useHomepageImages indépendant

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

  // ✅ ============================================
  // PHASE 1.2 : ACTIONS CONTEXT - DAILY VARIATIONS
  // ============================================
  // Fonctions pour gérer les variations journalières (suppression, ajout, modification d'exercices)
  // Toutes ces fonctions sauvegardent immédiatement (pas de système temp pour variations)

  /**
   * Supprime un exercice du programme pour aujourd'hui uniquement
   * @param {number} exerciseId - ID de l'exercice à supprimer
   * @param {string} [reason] - Raison optionnelle de la suppression
   * @returns {Promise<{success: boolean, variation: object}>}
   */
  const suppressExerciseForToday = async (exerciseId, reason) => {
    try {
      // ✅ Validation stricte de l'entrée
      if (typeof exerciseId !== 'number' || isNaN(exerciseId) || exerciseId <= 0) {
        throw new Error('ID d\'exercice invalide');
      }

      const dateStr = getDateStr(new Date());
      const currentData = getCurrentData();
      
      // ✅ Vérifier que l'exercice existe dans le programme
      const exerciseExists = Object.values(workoutProgram).some(day => {
        if (day.exercices) {
          return day.exercices.some(ex => ex.id === exerciseId);
        }
        if (day.salleVariants) {
          return Object.values(day.salleVariants).some(variant =>
            variant.exercices && variant.exercices.some(ex => ex.id === exerciseId)
          );
        }
        return false;
      });

      if (!exerciseExists) {
        throw new Error(`Exercice ${exerciseId} non trouvé dans le programme`);
      }

      // ✅ Récupérer ou créer la variation pour aujourd'hui
      const existingVariation = currentData.dailyVariations?.[dateStr];
      const suppressedExercises = existingVariation?.suppressedExercises || [];

      // ✅ Vérifier si déjà supprimé (idempotence)
      if (suppressedExercises.includes(exerciseId)) {
        console.log(`⚠️ Exercice ${exerciseId} déjà supprimé pour aujourd'hui`);
        return {
          success: true,
          variation: existingVariation,
          message: 'Exercice déjà supprimé'
        };
      }

      // ✅ Créer ou mettre à jour la variation
      const updatedVariation = {
        date: dateStr,
        suppressedExercises: [...suppressedExercises, exerciseId],
        additionalExercises: existingVariation?.additionalExercises || [],
        reason: reason || existingVariation?.reason,
        createdAt: existingVariation?.createdAt || new Date(),
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation?.modificationCount || 0) + 1,
        version: '1.0',
        schemaVersion: 1,
        lastExceptionalIdCounter: existingVariation?.lastExceptionalIdCounter || 0
      };

      // ✅ Sauvegarder immédiatement (action critique)
      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          [dateStr]: updatedVariation
        }
      };

      await updateData(updatedData);

      console.log(`✅ Exercice ${exerciseId} supprimé pour aujourd'hui`);
      return {
        success: true,
        variation: updatedVariation,
        message: 'Exercice supprimé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice:', error);
      throw error;
    }
  };

  /**
   * Restaure un exercice supprimé pour aujourd'hui
   * @param {number} exerciseId - ID de l'exercice à restaurer
   * @returns {Promise<{success: boolean, variation: object}>}
   */
  const restoreExerciseForToday = async (exerciseId) => {
    try {
      // ✅ Validation stricte de l'entrée
      if (typeof exerciseId !== 'number' || isNaN(exerciseId) || exerciseId <= 0) {
        throw new Error('ID d\'exercice invalide');
      }

      const dateStr = getDateStr(new Date());
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      // ✅ Vérifier si variation existe
      if (!existingVariation) {
        throw new Error('Aucune variation trouvée pour aujourd\'hui');
      }

      const suppressedExercises = existingVariation.suppressedExercises || [];

      // ✅ Vérifier si exercice est bien supprimé
      if (!suppressedExercises.includes(exerciseId)) {
        console.log(`⚠️ Exercice ${exerciseId} n'est pas supprimé pour aujourd'hui`);
        return {
          success: true,
          variation: existingVariation,
          message: 'Exercice déjà présent'
        };
      }

      // ✅ Retirer l'exercice de la liste des supprimés
      const updatedSuppressedExercises = suppressedExercises.filter(id => id !== exerciseId);

      // ✅ Mettre à jour la variation
      const updatedVariation = {
        ...existingVariation,
        suppressedExercises: updatedSuppressedExercises,
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation.modificationCount || 0) + 1
      };

      // ✅ Si plus aucune variation, supprimer l'entrée
      const hasOtherVariations = updatedSuppressedExercises.length > 0 || 
                                 (existingVariation.additionalExercises?.length || 0) > 0;

      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          ...(hasOtherVariations ? { [dateStr]: updatedVariation } : {})
        }
      };

      // ✅ Si pas d'autres variations, supprimer complètement l'entrée
      if (!hasOtherVariations) {
        delete updatedData.dailyVariations[dateStr];
      }

      // ✅ Sauvegarder immédiatement (action critique)
      await updateData(updatedData);
      
      // Émettre événement pour synchronisation sidebar
      sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { 
        exerciseId,
        date: dateStr,
        action: 'restored'
      });

      console.log(`✅ Exercice ${exerciseId} restauré pour aujourd'hui`);
      return {
        success: true,
        variation: hasOtherVariations ? updatedVariation : null,
        message: 'Exercice restauré avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la restauration de l\'exercice:', error);
      throw error;
    }
  };

  /**
   * Génère un ID unique pour un exercice exceptionnel
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @param {object} variation - Variation existante (optionnelle)
   * @returns {string} ID unique au format exceptional_YYYY-MM-DD_NNNN
   */
  const generateExceptionalExerciseId = (dateStr, variation) => {
    // ✅ Stratégie incrémentale : Compteur par date (plus simple, prévisible, garanti unique)
    const currentCounter = variation?.lastExceptionalIdCounter || 0;
    const newCounter = currentCounter + 1;

    // ✅ Validation : Si compteur dépasse 9999, utiliser stratégie hybride
    if (newCounter > 9999) {
      console.warn('⚠️ Compteur dépasse 9999, passage en mode hybride');
      const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres
      return `exceptional_${dateStr}_${String(newCounter).padStart(4, '0')}_${timestamp}`;
    }

    return `exceptional_${dateStr}_${String(newCounter).padStart(4, '0')}`;
  };

  /**
   * Ajoute un exercice exceptionnel pour aujourd'hui
   * @param {object} exercise - Données de l'exercice exceptionnel
   * @param {string} exercise.name - Nom de l'exercice (requis, 2-100 chars)
   * @param {'reps'|'duration'} exercise.type - Type d'exercice (requis)
   * @param {number} [exercise.series] - Nombre de séries (requis si type === 'reps', 1-50)
   * @param {number[]} [exercise.repsPerSeries] - Reps par série (requis si type === 'reps')
   * @param {number} [exercise.duration] - Durée en secondes (requis si type === 'duration', > 0)
   * @param {string} [exercise.materiel] - Matériel utilisé
   * @param {string} [exercise.notes] - Notes personnelles
   * @param {string} [reason] - Raison de l'ajout
   * @returns {Promise<{success: boolean, exerciseId: string, exercise: object}>}
   */
  const addExceptionalExercise = async (exercise, reason) => {
    try {
      // ✅ Validation stricte de l'entrée
      if (!exercise || typeof exercise !== 'object') {
        throw new Error('Données d\'exercice invalides');
      }

      // ✅ Validation nom (2-100 chars)
      if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim().length < 2) {
        throw new Error('Le nom de l\'exercice doit contenir au moins 2 caractères');
      }
      if (exercise.name.trim().length > 100) {
        throw new Error('Le nom de l\'exercice ne peut pas dépasser 100 caractères');
      }

      // ✅ Validation type (reps ou duration)
      if (!exercise.type || !['reps', 'duration'].includes(exercise.type)) {
        throw new Error('Le type d\'exercice doit être "reps" ou "duration"');
      }

      // ✅ Validation selon le type
      if (exercise.type === 'reps') {
        if (!exercise.series || typeof exercise.series !== 'number' || exercise.series < 1 || exercise.series > 50) {
          throw new Error('Le nombre de séries doit être entre 1 et 50');
        }
        if (!exercise.repsPerSeries || !Array.isArray(exercise.repsPerSeries) || exercise.repsPerSeries.length === 0) {
          throw new Error('Au moins une série doit avoir des répétitions');
        }
        if (exercise.repsPerSeries.length !== exercise.series) {
          throw new Error(`Le nombre de séries (${exercise.series}) ne correspond pas au nombre de valeurs de répétitions (${exercise.repsPerSeries.length})`);
        }
        if (exercise.repsPerSeries.some(r => typeof r !== 'number' || r <= 0 || r > 1000)) {
          throw new Error('Toutes les répétitions doivent être positives et inférieures à 1000');
        }
      } else if (exercise.type === 'duration') {
        if (!exercise.duration || typeof exercise.duration !== 'number' || exercise.duration <= 0) {
          throw new Error('La durée doit être positive');
        }
        if (exercise.duration > 7200) {
          throw new Error('La durée ne peut pas dépasser 7200 secondes (2 heures)');
        }
      }

      const dateStr = getDateStr(new Date());
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      // ✅ Générer ID unique
      const exerciseId = generateExceptionalExerciseId(dateStr, existingVariation);
      const newCounter = (existingVariation?.lastExceptionalIdCounter || 0) + 1;

      // ✅ Créer l'exercice exceptionnel
      const newExercise = {
        id: exerciseId,
        name: exercise.name.trim(),
        type: exercise.type,
        series: exercise.type === 'reps' ? exercise.series : undefined,
        repsPerSeries: exercise.type === 'reps' ? [...exercise.repsPerSeries] : undefined,
        duration: exercise.type === 'duration' ? exercise.duration : undefined,
        materiel: exercise.materiel?.trim() || undefined,
        notes: exercise.notes?.trim() || undefined,
        isExceptional: true,
        completed: false,
        addedAt: new Date(),
        modificationCount: 0,
        lastModifiedAt: new Date(),
        version: '1.0',
        schemaVersion: 1
      };

      // ✅ Créer ou mettre à jour la variation
      const updatedVariation = {
        date: dateStr,
        suppressedExercises: existingVariation?.suppressedExercises || [],
        additionalExercises: [...(existingVariation?.additionalExercises || []), newExercise],
        reason: reason || existingVariation?.reason,
        createdAt: existingVariation?.createdAt || new Date(),
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation?.modificationCount || 0) + 1,
        lastExceptionalIdCounter: newCounter,
        version: '1.0',
        schemaVersion: 1
      };

      // ✅ Sauvegarder immédiatement (action critique)
      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          [dateStr]: updatedVariation
        }
      };

      await updateData(updatedData);
      
      // Émettre événement pour synchronisation sidebar
      sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_ADDED, { 
        exerciseId,
        date: dateStr,
        exerciseName: exercise.name
      });

      console.log(`✅ Exercice exceptionnel "${exercise.name}" ajouté avec ID: ${exerciseId}`);
      return {
        success: true,
        exerciseId: exerciseId,
        exercise: newExercise,
        message: 'Exercice exceptionnel ajouté avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'exercice exceptionnel:', error);
      throw error;
    }
  };

  /**
   * Supprime un exercice exceptionnel pour aujourd'hui
   * @param {string} exerciseId - ID de l'exercice exceptionnel à supprimer
   * @returns {Promise<{success: boolean}>}
   */
  const removeExceptionalExercise = async (exerciseId) => {
    try {
      // ✅ Validation stricte de l'entrée
      if (!exerciseId || typeof exerciseId !== 'string' || !exerciseId.startsWith('exceptional_')) {
        throw new Error('ID d\'exercice exceptionnel invalide');
      }

      const dateStr = getDateStr(new Date());
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      // ✅ Vérifier si variation existe
      if (!existingVariation) {
        throw new Error('Aucune variation trouvée pour aujourd\'hui');
      }

      const additionalExercises = existingVariation.additionalExercises || [];
      const exerciseIndex = additionalExercises.findIndex(ex => ex.id === exerciseId);

      // ✅ Vérifier si exercice existe
      if (exerciseIndex === -1) {
        throw new Error(`Exercice exceptionnel ${exerciseId} non trouvé`);
      }

      // ✅ Retirer l'exercice de la liste
      const updatedAdditionalExercises = additionalExercises.filter(ex => ex.id !== exerciseId);

      // ✅ Mettre à jour la variation
      const updatedVariation = {
        ...existingVariation,
        additionalExercises: updatedAdditionalExercises,
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation.modificationCount || 0) + 1
      };

      // ✅ Si plus aucune variation, supprimer l'entrée
      const hasOtherVariations = (existingVariation.suppressedExercises?.length || 0) > 0 || 
                                 updatedAdditionalExercises.length > 0;

      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          ...(hasOtherVariations ? { [dateStr]: updatedVariation } : {})
        }
      };

      // ✅ Si pas d'autres variations, supprimer complètement l'entrée
      if (!hasOtherVariations) {
        delete updatedData.dailyVariations[dateStr];
      }

      // ✅ Sauvegarder immédiatement (action critique)
      await updateData(updatedData);
      
      // Émettre événement pour synchronisation sidebar
      sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_DELETED, { 
        exerciseId,
        date: dateStr
      });

      console.log(`✅ Exercice exceptionnel ${exerciseId} supprimé`);
      return {
        success: true,
        message: 'Exercice exceptionnel supprimé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'exercice exceptionnel:', error);
      throw error;
    }
  };

  // ✅ Debounce pour modifications fréquentes (updateExceptionalExercise)
  const updateExceptionalExerciseDebounceRef = useRef(null);
  const pendingUpdateRef = useRef(null);

  /**
   * Met à jour un exercice exceptionnel (avec debounce pour modifications fréquentes)
   * @param {string} exerciseId - ID de l'exercice exceptionnel
   * @param {object} updates - Mises à jour à appliquer
   * @returns {Promise<{success: boolean, exercise: object}>}
   */
  const updateExceptionalExercise = async (exerciseId, updates) => {
    try {
      // ✅ Validation stricte de l'entrée
      if (!exerciseId || typeof exerciseId !== 'string' || !exerciseId.startsWith('exceptional_')) {
        throw new Error('ID d\'exercice exceptionnel invalide');
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Mises à jour invalides');
      }

      const dateStr = getDateStr(new Date());
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      // ✅ Vérifier si variation existe
      if (!existingVariation) {
        throw new Error('Aucune variation trouvée pour aujourd\'hui');
      }

      const additionalExercises = existingVariation.additionalExercises || [];
      const exerciseIndex = additionalExercises.findIndex(ex => ex.id === exerciseId);

      // ✅ Vérifier si exercice existe
      if (exerciseIndex === -1) {
        throw new Error(`Exercice exceptionnel ${exerciseId} non trouvé`);
      }

      const existingExercise = additionalExercises[exerciseIndex];

      // ✅ Validation des mises à jour selon le type
      if (updates.type && !['reps', 'duration'].includes(updates.type)) {
        throw new Error('Le type doit être "reps" ou "duration"');
      }

      if (updates.name !== undefined) {
        if (typeof updates.name !== 'string' || updates.name.trim().length < 2) {
          throw new Error('Le nom doit contenir au moins 2 caractères');
        }
        if (updates.name.trim().length > 100) {
          throw new Error('Le nom ne peut pas dépasser 100 caractères');
        }
      }

      // ✅ Appliquer les mises à jour
      const updatedExercise = {
        ...existingExercise,
        ...updates,
        name: updates.name !== undefined ? updates.name.trim() : existingExercise.name,
        notes: updates.notes !== undefined ? (updates.notes?.trim() || undefined) : existingExercise.notes,
        materiel: updates.materiel !== undefined ? (updates.materiel?.trim() || undefined) : existingExercise.materiel,
        lastModifiedAt: new Date(),
        modificationCount: (existingExercise.modificationCount || 0) + 1
      };

      // ✅ Mettre à jour la liste des exercices
      const updatedAdditionalExercises = [...additionalExercises];
      updatedAdditionalExercises[exerciseIndex] = updatedExercise;

      // ✅ Mettre à jour la variation
      const updatedVariation = {
        ...existingVariation,
        additionalExercises: updatedAdditionalExercises,
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation.modificationCount || 0) + 1
      };

      // ✅ Stocker la mise à jour en attente
      pendingUpdateRef.current = {
        dateStr,
        variation: updatedVariation,
        exercise: updatedExercise
      };

      // ✅ Debounce : Annuler le timer précédent
      if (updateExceptionalExerciseDebounceRef.current) {
        clearTimeout(updateExceptionalExerciseDebounceRef.current);
      }

      // ✅ Sauvegarder après 800ms de debounce
      return new Promise((resolve, reject) => {
        updateExceptionalExerciseDebounceRef.current = setTimeout(async () => {
          try {
            const pending = pendingUpdateRef.current;
            if (!pending) {
              resolve({ success: true, exercise: updatedExercise });
              return;
            }

            const currentDataForSave = getCurrentData();
            const updatedData = {
              ...currentDataForSave,
              dailyVariations: {
                ...(currentDataForSave.dailyVariations || {}),
                [pending.dateStr]: pending.variation
              }
            };

            await updateData(updatedData);
            pendingUpdateRef.current = null;

            console.log(`✅ Exercice exceptionnel ${exerciseId} mis à jour`);
            resolve({
              success: true,
              exercise: pending.exercise,
              message: 'Exercice exceptionnel mis à jour avec succès'
            });
          } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de la mise à jour:', error);
            pendingUpdateRef.current = null;
            reject(error);
          }
        }, 800); // 800ms debounce
      });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'exercice exceptionnel:', error);
      throw error;
    }
  };

  /**
   * Marque un exercice exceptionnel comme complété
   * @param {string} exerciseId - ID de l'exercice exceptionnel
   * @param {number[]} [actualReps] - Reps réellement effectuées (si type === 'reps')
   * @param {number} [actualDuration] - Durée réelle en secondes (si type === 'duration')
   * @returns {Promise<{success: boolean, exercise: object}>}
   */
  const markExceptionalExerciseComplete = async (exerciseId, actualReps, actualDuration) => {
    try {
      // ✅ Validation stricte de l'entrée
      if (!exerciseId || typeof exerciseId !== 'string' || !exerciseId.startsWith('exceptional_')) {
        throw new Error('ID d\'exercice exceptionnel invalide');
      }

      const dateStr = getDateStr(new Date());
      const currentData = getCurrentData();
      const existingVariation = currentData.dailyVariations?.[dateStr];

      // ✅ Vérifier si variation existe
      if (!existingVariation) {
        throw new Error('Aucune variation trouvée pour aujourd\'hui');
      }

      const additionalExercises = existingVariation.additionalExercises || [];
      const exerciseIndex = additionalExercises.findIndex(ex => ex.id === exerciseId);

      // ✅ Vérifier si exercice existe
      if (exerciseIndex === -1) {
        throw new Error(`Exercice exceptionnel ${exerciseId} non trouvé`);
      }

      const existingExercise = additionalExercises[exerciseIndex];

      // ✅ Logique intelligente selon le type
      const updatedExercise = {
        ...existingExercise,
        completed: true,
        completedAt: new Date(),
        lastModifiedAt: new Date(),
        modificationCount: (existingExercise.modificationCount || 0) + 1
      };

      if (existingExercise.type === 'reps') {
        // ✅ Si actualReps fourni, utiliser (priorité)
        // Sinon, utiliser repsPerSeries planifiées
        const repsToUse = actualReps || existingExercise.repsPerSeries || [];
        
        // ✅ Validation : s'assurer que toutes les valeurs sont valides
        const validatedReps = repsToUse.filter(r => typeof r === 'number' && r > 0 && r < 10000);
        
        if (validatedReps.length === 0) {
          console.warn('⚠️ Aucune rep valide fournie, utilisation reps planifiées');
          updatedExercise.actualReps = existingExercise.repsPerSeries || [];
        } else {
          updatedExercise.actualReps = validatedReps;
        }
        
        updatedExercise.totalReps = updatedExercise.actualReps.reduce((sum, r) => sum + r, 0);
        
        // ✅ Validation : si actualReps différentes de planifiées, logger pour analytics
        if (actualReps && existingExercise.repsPerSeries && 
            actualReps.length === existingExercise.repsPerSeries.length) {
          const plannedTotal = existingExercise.repsPerSeries.reduce((sum, r) => sum + r, 0);
          const actualTotal = updatedExercise.totalReps;
          const diff = actualTotal - plannedTotal;
          const diffPercent = plannedTotal > 0 ? (diff / plannedTotal * 100) : 0;
          
          if (Math.abs(diff) > 5 || Math.abs(diffPercent) > 20) {
            console.log(`📊 Exercice "${existingExercise.name}" : ${actualTotal} reps effectuées vs ${plannedTotal} planifiées (diff: ${diff > 0 ? '+' : ''}${diff}, ${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}%)`);
            
            // ✅ Enregistrer dans métadonnées pour analytics
            updatedExercise.performance = {
              ...existingExercise.performance,
              deviationFromPlanned: diff,
              deviationPercent: diffPercent
            };
          }
        }
      } else if (existingExercise.type === 'duration') {
        // ✅ Si actualDuration fourni, utiliser (priorité)
        // Sinon, utiliser duration planifiée
        const durationToUse = actualDuration || existingExercise.duration;
        
        if (!durationToUse || durationToUse <= 0) {
          console.warn('⚠️ Durée invalide, utilisation durée planifiée');
          updatedExercise.actualDuration = existingExercise.duration || 0;
        } else {
          updatedExercise.actualDuration = durationToUse;
        }
        
        // ✅ Validation : si actualDuration très différente de planifiée, logger
        if (actualDuration && existingExercise.duration) {
          const diff = Math.abs(actualDuration - existingExercise.duration);
          const diffPercent = (diff / existingExercise.duration) * 100;
          
          if (diffPercent > 20) {
            const minutes = Math.floor(actualDuration / 60);
            const seconds = actualDuration % 60;
            const plannedMinutes = Math.floor(existingExercise.duration / 60);
            const plannedSeconds = existingExercise.duration % 60;
            
            console.log(`⏱️ Exercice "${existingExercise.name}" : ${minutes}min ${seconds}s effectuées vs ${plannedMinutes}min ${plannedSeconds}s planifiées (${diffPercent.toFixed(0)}% différence)`);
            
            // ✅ Enregistrer dans métadonnées pour analytics
            updatedExercise.performance = {
              ...existingExercise.performance,
              deviationFromPlanned: diff,
              deviationPercent: diffPercent
            };
          }
        }
      }

      // ✅ Mettre à jour la liste des exercices
      const updatedAdditionalExercises = [...additionalExercises];
      updatedAdditionalExercises[exerciseIndex] = updatedExercise;

      // ✅ Mettre à jour la variation
      const updatedVariation = {
        ...existingVariation,
        additionalExercises: updatedAdditionalExercises,
        lastModifiedAt: new Date(),
        modificationCount: (existingVariation.modificationCount || 0) + 1
      };

      // ✅ Sauvegarder immédiatement (action critique)
      const updatedData = {
        ...currentData,
        dailyVariations: {
          ...(currentData.dailyVariations || {}),
          [dateStr]: updatedVariation
        }
      };

      await updateData(updatedData);

      console.log(`✅ Exercice exceptionnel "${existingExercise.name}" marqué comme complété`);
      return {
        success: true,
        exercise: updatedExercise,
        message: 'Exercice exceptionnel marqué comme complété'
      };
    } catch (error) {
      console.error('❌ Erreur lors de la complétion de l\'exercice exceptionnel:', error);
      throw error;
    }
  };

  // ✅ ============================================
  // FIN PHASE 1.2 : ACTIONS CONTEXT - DAILY VARIATIONS
  // ============================================

  /**
   * ✅ NOUVEAU : Supprime toutes les sessions mock d'endurance de workoutData
   * Identifie et supprime les sessions avec des valeurs suspectes ou impossibles
   * @returns {Promise<{deleted: number, details: object}>} Nombre de sessions supprimées
   */
  const deleteMockEnduranceSessions = useCallback(async () => {
    try {
      const currentData = getCurrentData();
      const enduranceData = currentData?.enduranceData || {};
      const sessions = enduranceData.sessions || {};
      
      let totalDeleted = 0;
      const details = {
        boxing: 0,
        pushups: 0,
        swimming: 0,
        jumprope: 0,
        running: 0
      };
      
      // ✅ PHASE 1 : Utiliser la fonction centralisée depuis calendarUtils
      // isMockSession remplacé par isMockEnduranceSession (importée)
      
      // Filtrer les sessions mock pour chaque type d'activité
      const cleanedSessions = {};
      
      Object.entries(sessions).forEach(([activityType, activitySessions]) => {
        if (Array.isArray(activitySessions)) {
          const validSessions = activitySessions.filter(session => {
            // ✅ PHASE 1 : Utiliser la fonction centralisée
            const isMock = isMockEnduranceSession(session);
            if (isMock) {
              details[activityType] = (details[activityType] || 0) + 1;
              totalDeleted++;
            }
            return !isMock;
          });
          cleanedSessions[activityType] = validSessions;
        } else {
          cleanedSessions[activityType] = activitySessions;
        }
      });
      
      // Sauvegarder les sessions nettoyées
      const updatedData = {
        ...currentData,
        enduranceData: {
          ...enduranceData,
          sessions: cleanedSessions,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await updateData(updatedData);
      
      console.log(`[WorkoutContext] ✅ Supprimé ${totalDeleted} sessions mock d'endurance:`, details);
      
      return {
        deleted: totalDeleted,
        details
      };
    } catch (error) {
      console.error('[WorkoutContext] ❌ Erreur lors de la suppression des sessions mock:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  // ✅ NOUVEAU : Fonctions de gestion des justifications des jours sans activité
  // Pattern identique aux autres fonctions de gestion (useCallback pour performance)
  
  /**
   * Crée ou met à jour une justification pour un jour
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @param {string} reason - Raison de justification (maladie, flemme, pas_le_temps, autre)
   * @param {string} note - Note optionnelle (max 200 caractères)
   * @returns {Promise<{success: boolean}>}
   */
  const setDayJustification = useCallback(async (dateStr, reason, note = '') => {
    try {
      // Validation de la date
      if (!isValidJustificationDate(dateStr)) {
        throw new Error('Impossible de justifier une date future');
      }
      
      // Validation de la raison
      if (!isValidJustificationReason(reason)) {
        throw new Error(`Raison invalide: ${reason}`);
      }
      
      // Validation de la note
      if (!isValidJustificationNote(note)) {
        throw new Error(`Note trop longue (max 200 caractères)`);
      }
      
      const currentData = getCurrentData();
      const existingJustification = currentData.dayJustifications?.[dateStr];
      
      // Créer ou mettre à jour la justification
      const justification = existingJustification
        ? updateJustification(existingJustification, reason, note)
        : createJustification(reason, note);
      
      // Mettre à jour les données
      await updateData({
        ...currentData,
        dayJustifications: {
          ...(currentData.dayJustifications || {}),
          [dateStr]: justification
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('[WorkoutContext] ❌ Erreur lors de la sauvegarde de justification:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  /**
   * Supprime une justification pour un jour
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @returns {Promise<{success: boolean}>}
   */
  const removeDayJustification = useCallback(async (dateStr) => {
    try {
      const currentData = getCurrentData();
      const dayJustifications = currentData.dayJustifications || {};
      
      // Vérifier si la justification existe
      if (!dayJustifications[dateStr]) {
        return { success: false, message: 'Aucune justification trouvée pour cette date' };
      }
      
      // Supprimer la justification
      const { [dateStr]: removed, ...rest } = dayJustifications;
      
      await updateData({
        ...currentData,
        dayJustifications: rest
      });
      
      return { success: true };
    } catch (error) {
      console.error('[WorkoutContext] ❌ Erreur lors de la suppression de justification:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  /**
   * Récupère la justification d'un jour
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @returns {Object|null} Justification ou null si absente
   */
  const getDayJustification = useCallback((dateStr) => {
    const currentData = getCurrentData();
    return getDayJustificationUtil(currentData, dateStr);
  }, [getCurrentData]);

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
    updateProgressEntry,
    deleteProgressEntry,
    deleteProgressEntryField,
    addProgressPhoto,
    updateProgressPhoto, // ✅ PHASE 1.3 : Mise à jour photo par ID
    deleteProgressPhoto,
    
    // Fonctions homepageImages supprimées - maintenant gérées par useHomepageImages indépendant
    
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
    // Hooks personnalisés (spread seulement si défini)
    ...(workoutLogic || {}),
    
    // Fonctions de statistiques
    getWorkoutHistory,
    
    // ✅ NOUVEAU : Fonction pour supprimer les sessions mock d'endurance
    deleteMockEnduranceSessions,
    
    // ✅ NOUVEAU : Gestion des justifications des jours sans activité
    setDayJustification,
    removeDayJustification,
    getDayJustification
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

  // ✅ NORMALISATION: Migration automatique photos existantes (convertir photo → url)
  useEffect(() => {
    const migratePhotos = async () => {
      if (!data?.progressPhotos || data.progressPhotos.length === 0) {
        return;
      }

      // Vérifier si migration nécessaire
      const needsMigration = data.progressPhotos.some(photo => 
        photo.photo && (!photo.url || photo.version !== '2.0')
      );

      if (!needsMigration) {
        return; // Déjà normalisé
      }

      try {
        const { migratePhotoEntries } = await import('../components/BodyTracking/utils/photoNormalizer');
        const migratedPhotos = migratePhotoEntries(data.progressPhotos);

        // Si photos migrées, sauvegarder
        if (migratedPhotos.length !== data.progressPhotos.length || 
            migratedPhotos.some((p, i) => p !== data.progressPhotos[i])) {
          const updatedData = {
            ...data,
            progressPhotos: migratedPhotos
          };
          await updateData(updatedData);
          console.log('✅ Migration photos: structure normalisée (photo → url)');
        }
      } catch (error) {
        console.error('❌ Erreur migration photos:', error);
      }
    };

    migratePhotos();
  }, [data?.progressPhotos, updateData]);

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
      try {
        await loadContext();
        isInitialLoadRef.current = false;
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du contexte:', error);
        // Continuer même en cas d'erreur pour ne pas bloquer l'application
        isInitialLoadRef.current = false;
      }
    };
    
    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter une seule fois au montage

  // S'assurer que contextValue est toujours défini avant de rendre
  if (!contextValue) {
    console.error('❌ Erreur: contextValue non défini dans WorkoutProvider');
    // Fournir un contexte minimal pour éviter le crash
    const fallbackValue = {
      data: {},
      updateData: async () => {},
      activeTab: 'home',
      setActiveTab: () => {},
      // ... autres valeurs minimales si nécessaire
    };
    return (
      <WorkoutContext.Provider value={fallbackValue}>
        {children}
      </WorkoutContext.Provider>
    );
  }

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

export { WorkoutContext, useWorkout, WorkoutProvider };