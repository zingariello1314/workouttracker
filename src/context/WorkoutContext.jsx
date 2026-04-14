import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkoutData } from '../hooks/useWorkoutData';
import { useWorkoutLogic } from '../hooks/useWorkoutLogic';
import { workoutProgram } from '../data/workoutProgram';
import { findExerciseInDatabase } from '../data/exerciseDatabase';
import { getDateStr, getDayName, getAutoWeekVariant } from '../utils/dateUtils';
// ✅ PHASE 4 : Import des utilitaires de l'historique
import { 
  getWorkoutHistoryFromData,
  getUniqueExercisesFromData,
  getTodayRepsFromData,
  getTodayExercisesFromData,
  getTodayWorkoutsFromData,
  getWeekWorkoutsFromData,
  getWeekRepsFromData,
  getMonthWorkoutsFromData,
  getMonthRepsFromData,
  getMonthUniqueExercisesFromData,
  getTotalRepsFromData,
} from './WorkoutContext/utils/workoutHistoryUtils';
import { isMockEnduranceSession } from '../utils/calendarUtils';
// ✅ PHASE 4 : Les utilitaires de justification sont maintenant dans useWorkoutJustifications
import { useAuth } from './AuthContext';
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';

// ✅ PHASE 4 : Hooks personnalisés extraits
import { useWorkoutExercises } from './WorkoutContext/hooks/useWorkoutExercises';
import { useWorkoutPrograms } from './WorkoutContext/hooks/useWorkoutPrograms';
import { useWorkoutExceptionalExercises } from './WorkoutContext/hooks/useWorkoutExceptionalExercises';
import { useWorkoutProgress } from './WorkoutContext/hooks/useWorkoutProgress';
import { useWorkoutJustifications } from './WorkoutContext/hooks/useWorkoutJustifications';
import { useWorkoutHistory } from './WorkoutContext/hooks/useWorkoutHistory';
import { useWorkoutContextStorage } from './WorkoutContext/hooks/useWorkoutContextStorage';
import { DEFAULT_PROGRESS_FORM } from './WorkoutContext/constants';
import { normalizeRepsValue } from './WorkoutContext/utils';
import { filterExercisesForSessionDate } from '../utils/programExerciseScheduling';
import { buildTemplateProgramsForFirstLaunch } from '../utils/programPersistenceUtils';

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
  const [activeTab, setActiveTabState] = useState('home');
  const [previousTab, setPreviousTab] = useState(null);
  const [weekVariant, setWeekVariant] = useState('A');
  const [statsPeriod, setStatsPeriod] = useState('week');
  const [isGymMode, setIsGymMode] = useState(false);
  /** Remplacement du jour pour afficher l'entraînement d'un autre jour (ex. faire lundi un vendredi). null = jour actuel. */
  const [workoutDayOverride, setWorkoutDayOverride] = useState(null);
  const lastDateStrRef = useRef(getDateStr(currentDate));

  // Réinitialiser l'override quand le jour calendrier change (ex. après minuit)
  useEffect(() => {
    const dateStr = getDateStr(currentDate);
    if (lastDateStrRef.current !== dateStr) {
      lastDateStrRef.current = dateStr;
      setWorkoutDayOverride(null);
    }
  }, [currentDate]);
  
  // Wrapper pour setActiveTab qui stocke la page précédente
  const setActiveTab = useCallback((newTab) => {
    if (activeTab !== newTab) {
      setPreviousTab(activeTab);
      setActiveTabState(newTab);
    }
  }, [activeTab]);
  
  // ✅ PHASE 4 : Utilisation du hook pour les exercices et étirements
  // Les états pour les modifications non sauvegardées sont maintenant gérés par le hook
  // On les initialise temporairement pour la compatibilité avec getCurrentData
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
  const [progressForm, setProgressForm] = useState(() => ({
    ...DEFAULT_PROGRESS_FORM,
    date: getDateStr(new Date()),
  }));

  // Références pour la sauvegarde automatique du contexte
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

  // ✅ PHASE 4 : Utilisation du hook pour la sauvegarde/chargement du contexte
  const {
    openContextDB,
    saveContextToDB,
    loadContext,
    autoSaveContext,
    flushAutoSave,
  } = useWorkoutContextStorage(
    setPrograms,
    setActiveProgram,
    setProgramHistory,
    setWeekVariant,
    setIsGymMode
  );

  const persistProgramsPartial = useCallback(
    (partial) => {
      return flushAutoSave({
        programs: partial.programs,
        activeProgram:
          partial.activeProgram !== undefined ? partial.activeProgram : activeProgram,
        programHistory,
        weekVariant,
        isGymMode,
      });
    },
    [flushAutoSave, activeProgram, programHistory, weekVariant, isGymMode]
  );

  // ✅ PHASE 4 : Fonction pour obtenir les données actuelles (temp ou réelles)
  // Cette fonction est utilisée par les hooks, donc on la garde ici
  const getCurrentData = useCallback(() => {
    return (hasUnsavedExercises || hasUnsavedStretches) && tempData ? tempData : data;
  }, [hasUnsavedExercises, hasUnsavedStretches, tempData, data]);

  // ✅ PHASE 4 : Utilisation du hook pour les exercices et étirements
  const {
    hasUnsavedExercises: hasUnsavedExercisesFromHook,
    hasUnsavedStretches: hasUnsavedStretchesFromHook,
    tempData: tempDataFromHook,
    updateTempExerciseData,
    updateTempStretchData,
    saveExerciseChanges,
    discardExerciseChanges,
    saveStretchChanges,
    discardStretchChanges,
    cancelExerciseChanges,
    cancelStretchChanges,
    resetDay,
  } = useWorkoutExercises(data, updateData, getCurrentData);

  // ✅ PHASE 4 : Synchroniser les états du hook avec les états locaux pour compatibilité
  useEffect(() => {
    setHasUnsavedExercises(hasUnsavedExercisesFromHook);
    setHasUnsavedStretches(hasUnsavedStretchesFromHook);
    setTempData(tempDataFromHook);
  }, [hasUnsavedExercisesFromHook, hasUnsavedStretchesFromHook, tempDataFromHook]);

  // ✅ PHASE 4 : Utilisation du hook pour les programmes
  const {
    addProgram,
    activateProgram,
    deactivateProgram,
    deleteProgram,
    updateProgram,
    calculateRealUsageDays,
  } = useWorkoutPrograms(
    programs,
    setPrograms,
    activeProgram,
    setActiveProgram,
    data,
    persistProgramsPartial
  );

  // ✅ PHASE 4 : Utilisation du hook pour les exercices exceptionnels
  const {
    addExceptionalExercise,
    removeExceptionalExercise,
  } = useWorkoutExceptionalExercises(getCurrentData, updateData);

  // ✅ PHASE 4 : Utilisation du hook pour les progressions
  const {
    addProgressEntry,
    updateProgressEntry,
    deleteProgressEntry,
    deleteProgressEntryField,
    addProgressPhoto,
    updateProgressPhoto,
    deleteProgressPhoto,
  } = useWorkoutProgress(getCurrentData, updateData);

  // ✅ PHASE 4 : Utilisation du hook pour les justifications
  const {
    setDayJustification,
    removeDayJustification,
    getDayJustification,
  } = useWorkoutJustifications(getCurrentData, updateData);

  // ✅ PHASE 4 : openContextDB, saveContextToDB, loadContext, autoSaveContext sont maintenant dans useWorkoutContextStorage

  // Hooks personnalisés pour la logique et les statistiques
  const workoutLogic = useWorkoutLogic(data, updateData, getCurrentData, updateTempExerciseData, updateTempStretchData);
  // CORRECTION: Utiliser toujours les données réelles (data) pour les statistiques et badges
  // Les données temporaires (tempData) ne doivent être utilisées que pour l'édition en cours
  // const workoutStats = useWorkoutStats(); // Commenté temporairement pour éviter l'erreur circulaire

  // Mapping pour stocker la correspondance entre IDs numériques et exercices du programme actif
  const exerciseIdMappingRef = useRef(new Map()); // Map<numericId, {name, originalId}>

  // Fonction utilitaire pour convertir un ID (string ou number) en ID numérique stable
  const convertToStableNumericId = useCallback((id, index = 0) => {
    if (typeof id === 'number') {
      return id;
    }
    if (typeof id === 'string') {
      // Créer un hash déterministe et stable de l'ID string
      // Utiliser un hash plus robuste pour éviter les collisions
      let hash = 0;
      const str = id.toString();
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir en entier 32 bits
      }
      // Ajouter un offset pour éviter les conflits avec les IDs du programme par défaut (< 1000)
      return Math.abs(hash) + 10000;
    }
    // Fallback : utiliser l'index + 10000
    return index + 10000;
  }, []);

  // Mettre à jour le mapping des IDs quand le programme actif change
  useEffect(() => {
    exerciseIdMappingRef.current.clear();
    
    if (activeProgram && activeProgram.schedule) {
      const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      
      dayNames.forEach(dayName => {
        const daySchedule = activeProgram.schedule[dayName];
        if (daySchedule && daySchedule.exercises) {
          daySchedule.exercises.forEach((ex, index) => {
            const numericId = convertToStableNumericId(ex.id, index);
            exerciseIdMappingRef.current.set(numericId, {
              name: ex.name,
              originalId: ex.id
            });
          });
        }
        if (daySchedule?.salleVariants) {
          ['semaineA', 'semaineB'].forEach((vk) => {
            const list = daySchedule.salleVariants[vk]?.exercises;
            if (Array.isArray(list)) {
              list.forEach((ex, index) => {
                const numericId = convertToStableNumericId(ex.id, index);
                exerciseIdMappingRef.current.set(numericId, {
                  name: ex.name,
                  originalId: ex.id
                });
              });
            }
          });
        }
      });
    }
  }, [activeProgram, convertToStableNumericId]);

  // Fonction pour récupérer le nom d'un exercice à partir de son ID
  // ⚠️ IMPORTANT : Définie avant useWorkoutHistory pour éviter l'erreur "Cannot access before initialization"
  const getExerciseNameById = useCallback((exerciseId) => {
    const searchId = typeof exerciseId === 'string' ? parseInt(exerciseId) : exerciseId;
    
    // ✅ PRIORITÉ 1 : Chercher dans le mapping du programme actif (plus rapide)
    const mappedExercise = exerciseIdMappingRef.current.get(searchId);
    if (mappedExercise) {
      return mappedExercise.name;
    }
    
    // ✅ PRIORITÉ 2 : Chercher dans le programme actif si disponible (fallback)
    if (activeProgram && activeProgram.schedule) {
      const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      
      for (const dayName of dayNames) {
        const daySchedule = activeProgram.schedule[dayName];
        const searchInList = (list) => {
          if (!Array.isArray(list)) return null;
          for (const ex of list) {
            const expectedNumericId = convertToStableNumericId(ex.id);
            if (expectedNumericId === searchId || ex.id === exerciseId || ex.id === searchId) {
              exerciseIdMappingRef.current.set(searchId, { name: ex.name, originalId: ex.id });
              return ex.name;
            }
          }
          return null;
        };
        if (daySchedule?.exercises) {
          const found = searchInList(daySchedule.exercises);
          if (found) return found;
        }
        if (daySchedule?.salleVariants) {
          for (const vk of ['semaineA', 'semaineB']) {
            const found = searchInList(daySchedule.salleVariants[vk]?.exercises);
            if (found) return found;
          }
        }
      }
    }
    
    // ✅ PRIORITÉ 2 : Chercher dans le programme par défaut (workoutProgram)
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
    
    // ✅ PRIORITÉ 3 : Chercher dans la base de données d'exercices
    try {
      const dbExercise = findExerciseInDatabase(`Exercice ${exerciseId}`);
      if (dbExercise) {
        return dbExercise.name;
      }
    } catch (e) {
      // Ignorer les erreurs
    }
    
    // Dernier fallback
    return `Exercice ${exerciseId}`;
  }, [activeProgram, convertToStableNumericId]);

  // ✅ PHASE 4 : Utilisation du hook pour l'historique (après getExerciseNameById)
  const {
    getWorkoutHistory,
  } = useWorkoutHistory(getCurrentData, getExerciseNameById);

  // Fonction wrapper pour getTodayWorkout qui utilise activeProgram si disponible
  const getTodayWorkoutWrapper = useCallback((currentDate, isGymMode = false) => {
    // Si un programme actif existe, utiliser son schedule
    if (activeProgram && activeProgram.schedule) {
      const dayName = workoutDayOverride || getDayName(currentDate);
      const daySchedule = activeProgram.schedule[dayName];
      const sessionDateStr = getDateStr(currentDate);
      
      if (daySchedule) {
        // ✅ FIX : Gérer les variations salle (maison/salle) si disponibles
        const currentWeekVariant = getAutoWeekVariant(currentDate);
        let exercisesToUse = daySchedule.exercises || [];
        let variantName = daySchedule.name || '';
        
        // Si mode salle et variantes disponibles, utiliser la variante appropriée
        if (isGymMode && daySchedule.salleVariants) {
          const weekVariantKey = currentWeekVariant === 'A' ? 'semaineA' : 'semaineB';
          const gymVariant = daySchedule.salleVariants[weekVariantKey];
          
          if (gymVariant && gymVariant.exercises) {
            exercisesToUse = gymVariant.exercises;
            variantName = gymVariant.name || variantName;
          }
        }

        // ✅ Retraits logiques : n'afficher l'exo que pour les dates de séance <= removedFromProgramAt
        exercisesToUse = filterExercisesForSessionDate(exercisesToUse, sessionDateStr);
        
        // Convertir le format du programme actif au format attendu
        // Générer des IDs numériques stables pour chaque exercice
        const exercises = exercisesToUse.map((ex, index) => {
          const numericId = convertToStableNumericId(ex.id, index);
          
          return {
            id: numericId,
            name: ex.name,
            series: ex.series,
            type: ex.type || 'standard',
            materiel: ex.materiel || 'poids du corps',
            notes: ex.notes || '',
            rest: ex.rest || 90,
            intensity: ex.intensity || 'moderate',
            // Stocker l'ID original pour référence (important pour getExerciseNameById)
            originalId: ex.id
          };
        });
        
        // Ne créer les étirements que s'il y en a vraiment
        const etirements = {};
        if (daySchedule.etirements) {
          if (daySchedule.etirements.matin?.instructions) {
            etirements.matin = daySchedule.etirements.matin.instructions;
          }
          if (daySchedule.etirements.midi?.instructions) {
            etirements.midi = daySchedule.etirements.midi.instructions;
          }
          if (daySchedule.etirements.soir?.instructions) {
            etirements.soir = daySchedule.etirements.soir.instructions;
          }
        }
        
        return {
          name: variantName,
          focus: daySchedule.focus || '',
          duree: daySchedule.duration || '',
          exercices: exercises,
          etirements: Object.keys(etirements).length > 0 ? etirements : undefined,
          isGymMode: isGymMode,
          weekVariant: currentWeekVariant
        };
      }
    }
    
    // Fallback vers la fonction originale de workoutLogic (avec jour override si besoin)
    if (workoutLogic && workoutLogic.getTodayWorkout) {
      const dayToUse = workoutDayOverride || getDayName(currentDate);
      const virtualDate = new Date(currentDate);
      const dayIndex = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].indexOf(dayToUse);
      if (dayIndex >= 0) {
        virtualDate.setDate(virtualDate.getDate() - virtualDate.getDay() + dayIndex);
        return workoutLogic.getTodayWorkout(virtualDate, isGymMode);
      }
      return workoutLogic.getTodayWorkout(currentDate, isGymMode);
    }
    
    // Dernier fallback
      return { 
        name: null,
        focus: null,
        exercices: [],
        etirements: undefined,
        isGymMode: false,
        weekVariant: getAutoWeekVariant(currentDate)
      };
  }, [activeProgram, workoutLogic, convertToStableNumericId, workoutDayOverride]);

  // ✅ PHASE 4 : addProgressEntry, updateProgressEntry, deleteProgressEntry, deleteProgressEntryField,
  // addProgressPhoto, updateProgressPhoto, deleteProgressPhoto sont maintenant dans useWorkoutProgress


  // ✅ PHASE 4 : Fonctions utilitaires de l'historique sont maintenant dans workoutHistoryUtils.js
  // getWorkoutHistoryFromData, getUniqueExercisesFromData, getTodayRepsFromData, etc.

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

  // ✅ PHASE 4 : addExceptionalExercise et removeExceptionalExercise sont maintenant dans useWorkoutExceptionalExercises
  // Les fonctions updateExceptionalExercise, suppressExerciseForToday, restoreExerciseForToday restent ici pour l'instant

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
  
  // ✅ PHASE 4 : setDayJustification, removeDayJustification, getDayJustification sont maintenant dans useWorkoutJustifications

  const contextValue = {
    // États principaux
    currentDate,
    setCurrentDate,
    activeTab,
    setActiveTab,
    previousTab,
    weekVariant,
    setWeekVariant,
    statsPeriod,
    setStatsPeriod,
    isGymMode,
    setIsGymMode,
    workoutDayOverride,
    setWorkoutDayOverride,
    
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
    calculateRealUsageDays,
    getExerciseNameById,
    
    // Programmes personnalisés
    customPrograms,
    setCustomPrograms,
    
    // Fonctions de données
    // Hooks personnalisés (spread seulement si défini)
    ...(workoutLogic || {}),
    // ✅ Surcharger getTodayWorkout pour utiliser activeProgram
    getTodayWorkout: getTodayWorkoutWrapper || (workoutLogic?.getTodayWorkout),
    
    // Fonctions de statistiques
    getWorkoutHistory,
    
    // ✅ NOUVEAU : Fonction pour supprimer les sessions mock d'endurance
    deleteMockEnduranceSessions,
    
    // ✅ NOUVEAU : Gestion des justifications des jours sans activité
    setDayJustification,
    removeDayJustification,
    getDayJustification,
    
    // ✅ Fonction pour sauvegarder les feedbacks de session
    saveSessionFeedback
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

  // Nouveau programme Musculation - Haut Pectoraux & Épaules
  const newMusculationProgram = {
    id: 'musculation-haut-pecs-epaules',
    name: "Programme Musculation - Haut Pectoraux & Épaules",
    description: "Programme d'entraînement axé sur le développement du haut des pectoraux, des épaules et des bras",
    duration: 4,
    goal: "Développement musculaire ciblé - Haut de pecs, épaules, dos, jambes",
    createdAt: new Date('2025-01-20').toISOString(),
    updatedAt: new Date('2025-01-20').toISOString(),
    status: 'inactive',
    schedule: {
      lundi: {
        name: "HAUT DES PECS + ÉPAULES (PRIORITÉ)",
        focus: "Haut de pecs + deltoïde latéral",
        duration: "60-75 min",
        notes: "",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: [
          { id: "pompes_declinees", name: "Pompes déclinées sur poignées", series: "4×8–15", reps: "", rest: 90, intensity: "heavy", notes: "tempo 4–1–1", materiel: "poignées", type: "standard" },
          { id: "developpe_sol_unilateral", name: "Développé au sol unilatéral (angle claviculaire)", series: "4×10–12", reps: "", rest: 90, intensity: "heavy", notes: "/ bras", materiel: "haltères", type: "standard" },
          { id: "ecartes_elastique", name: "Écartés élastique bas → haut", series: "4×15–25", reps: "", rest: 60, intensity: "moderate", notes: "pause 2s en haut", materiel: "élastique", type: "standard" },
          { id: "elevations_laterales_haltères", name: "Élévations latérales haltère strictes", series: "5×12–15", reps: "", rest: 45, intensity: "moderate", notes: "repos 45s", materiel: "haltères", type: "standard" },
          { id: "elevations_laterales_elastique", name: "Élévations latérales élastique (tension continue)", series: "3×20–25", reps: "", rest: 45, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "circuit_abdos_lundi", name: "Circuit abdos", series: "2 TOURS", reps: "", rest: 30, intensity: "moderate", notes: "", materiel: "poids du corps", type: "circuit" },
          { id: "finisher_pompes_lundi", name: "Finisher - 100 pompes", series: "5×20 ou 10×10", reps: "", rest: 60, intensity: "moderate", notes: "pas de corde ce jour-là", materiel: "poids du corps", type: "finisher" }
        ]
      },
      mardi: {
        name: "DOS LARGEUR + BICEPS",
        focus: "V-taper + bras pleins",
        duration: "60-75 min",
        notes: "",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: [
          { id: "tirage_elastique_bras_tendus", name: "Tirage élastique bras tendus", series: "4×15–20", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "tractions_australiennes", name: "Tractions australiennes (barres parallèles)", series: "4×8–12", reps: "", rest: 90, intensity: "heavy", notes: "", materiel: "barres parallèles", type: "standard" },
          { id: "rowing_elastique_lourd", name: "Rowing élastique lourd", series: "5×10–15", reps: "", rest: 90, intensity: "heavy", notes: "pause 2s", materiel: "élastique", type: "standard" },
          { id: "curl_incline_sol", name: "Curl incliné au sol (lent)", series: "4×10–12", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "haltères", type: "standard" },
          { id: "curl_marteau_elastique", name: "Curl marteau élastique", series: "3×12–15", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "circuit_abdos_mardi", name: "Circuit abdos", series: "1 TOUR", reps: "", rest: 30, intensity: "moderate", notes: "", materiel: "poids du corps", type: "circuit" },
          { id: "cardio_corde_mardi", name: "Corde à sauter", series: "8–10 min", reps: "", rest: 0, intensity: "moderate", notes: "rythme modéré - pas de pompes ce jour-là", materiel: "corde à sauter", type: "cardio" }
        ]
      },
      mercredi: {
        name: "JAMBES + ABDOS",
        focus: "Hormones + équilibre + gainage",
        duration: "60-75 min",
        notes: "",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: [
          { id: "squat_gobelet_lourd", name: "Squat gobelet lourd", series: "4×10–15", reps: "", rest: 90, intensity: "heavy", notes: "", materiel: "haltère", type: "standard" },
          { id: "fentes_arriere_longues", name: "Fentes arrière longues", series: "4×10–12", reps: "", rest: 90, intensity: "moderate", notes: "/ jambe", materiel: "poids du corps", type: "standard" },
          { id: "pont_fessier_charge", name: "Pont fessier au sol chargé", series: "4×15–20", reps: "", rest: 60, intensity: "moderate", notes: "pause 2s", materiel: "haltère", type: "standard" },
          { id: "mollets_debout_haltère", name: "Mollets debout haltère", series: "5×15–25", reps: "", rest: 45, intensity: "moderate", notes: "", materiel: "haltère", type: "standard" },
          { id: "circuit_abdos_mercredi", name: "Circuit abdos", series: "3 TOURS", reps: "", rest: 30, intensity: "moderate", notes: "jour principal abdos", materiel: "poids du corps", type: "circuit" },
          { id: "cardio_corde_mercredi", name: "Corde à sauter", series: "8 min", reps: "", rest: 0, intensity: "moderate", notes: "", materiel: "corde à sauter", type: "cardio" }
        ]
      },
      jeudi: {
        name: "REPOS TOTAL",
        focus: "Récupération",
        duration: "0 min",
        notes: "Récupération obligatoire",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "Marche légère / mobilité si envie" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: []
      },
      vendredi: {
        name: "ÉPAULES + BRAS (TRICEPS PRIORITÉ)",
        focus: "Largeur d'épaules + bras plus épais",
        duration: "60-75 min",
        notes: "",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: [
          { id: "elevations_laterales_mecaniques", name: "Élévations latérales mécaniques", series: "3 rounds", reps: "", rest: 60, intensity: "moderate", notes: "12 strictes → 10 partielles → 20 rapides", materiel: "haltères", type: "standard" },
          { id: "oiseau_elastique", name: "Oiseau élastique", series: "4×15–20", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "dips_barres_paralleles", name: "Dips aux barres parallèles (buste droit)", series: "4×8–12", reps: "", rest: 90, intensity: "heavy", notes: "", materiel: "barres parallèles", type: "standard" },
          { id: "extension_triceps_tete", name: "Extension triceps au-dessus de la tête (haltère)", series: "4×10–12", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "haltère", type: "standard" },
          { id: "curl_concentration", name: "Curl concentration", series: "3×12", reps: "", rest: 60, intensity: "moderate", notes: "/ bras", materiel: "haltère", type: "standard" },
          { id: "circuit_abdos_vendredi", name: "Circuit abdos", series: "1 TOUR", reps: "", rest: 30, intensity: "moderate", notes: "", materiel: "poids du corps", type: "circuit" },
          { id: "finisher_pompes_vendredi", name: "Finisher - 100 pompes", series: "100", reps: "", rest: 60, intensity: "moderate", notes: "pas de corde", materiel: "poids du corps", type: "finisher" }
        ]
      },
      samedi: {
        name: "DOS ÉPAISSEUR + LOMBAIRES",
        focus: "Dos dense et solide",
        duration: "60-75 min",
        notes: "",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: [
          { id: "rowing_elastique_prise_basse", name: "Rowing élastique prise basse", series: "5×8–12", reps: "", rest: 90, intensity: "heavy", notes: "", materiel: "élastique", type: "standard" },
          { id: "tirage_elastique_prise_neutre", name: "Tirage élastique prise neutre", series: "4×12–15", reps: "", rest: 60, intensity: "moderate", notes: "pause 2s", materiel: "élastique", type: "standard" },
          { id: "face_pull_elastique", name: "Face pull élastique", series: "4×15–20", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "extensions_lombaires_sol", name: "Extensions lombaires au sol", series: "3×15–20", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "poids du corps", type: "standard" },
          { id: "gainage_lateral_statique", name: "Gainage latéral statique", series: "3×40s", reps: "", rest: 60, intensity: "moderate", notes: "/ côté", materiel: "poids du corps", type: "standard" },
          { id: "cardio_corde_samedi", name: "Corde à sauter", series: "8–10 min", reps: "", rest: 0, intensity: "moderate", notes: "", materiel: "corde à sauter", type: "cardio" }
        ]
      },
      dimanche: {
        name: "PECS COMPLETS + RAPPELS",
        focus: "Volume pecs + rappel épaules / triceps",
        duration: "60-75 min",
        notes: "",
        etirements: {
          matin: { name: "Étirements matinaux", duration: "5-7 min", instructions: "" },
          midi: { name: "Pause active", duration: "4-6 min", instructions: "" },
          soir: { name: "Récupération", duration: "5-7 min", instructions: "" }
        },
        exercises: [
          { id: "pompes_lentes_poignees", name: "Pompes lentes sur poignées", series: "4×max propre", reps: "", rest: 90, intensity: "moderate", notes: "", materiel: "poignées", type: "standard" },
          { id: "developpe_haltère_sol", name: "Développé haltère au sol", series: "4×8–12", reps: "", rest: 90, intensity: "heavy", notes: "", materiel: "haltères", type: "standard" },
          { id: "ecartes_elastique_lents", name: "Écartés élastique lents", series: "3×20", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "elevations_laterales_legeres", name: "Élévations latérales légères", series: "3×25", reps: "", rest: 45, intensity: "light", notes: "", materiel: "haltères", type: "standard" },
          { id: "extension_triceps_elastique", name: "Extension triceps élastique", series: "3×15–20", reps: "", rest: 60, intensity: "moderate", notes: "", materiel: "élastique", type: "standard" },
          { id: "circuit_abdos_dimanche", name: "Circuit abdos", series: "2 TOURS", reps: "", rest: 30, intensity: "moderate", notes: "", materiel: "poids du corps", type: "circuit" },
          { id: "cardio_corde_dimanche", name: "Corde à sauter", series: "8 min", reps: "", rest: 0, intensity: "moderate", notes: "pas de 100 pompes (elles sont déjà incluses via l'entraînement)", materiel: "corde à sauter", type: "cardio" }
        ]
      }
    }
  };

  useEffect(() => {
    const initializeContext = async () => {
      try {
        const saved = await loadContext();
        const ph = saved?.programHistory ?? [];
        const wv = saved?.weekVariant ?? 'A';
        const gm = saved?.isGymMode ?? false;

        let programsSnapshot = Array.isArray(saved?.programs) ? [...saved.programs] : [];
        let activeSnapshot = saved?.activeProgram ?? null;
        let mutated = false;

        if (programsSnapshot.length === 0) {
          const { defaultProgram, optimizedProgram } = buildTemplateProgramsForFirstLaunch();
          programsSnapshot = [defaultProgram, optimizedProgram];
          activeSnapshot = defaultProgram;
          setPrograms(programsSnapshot);
          setActiveProgram(activeSnapshot);
          mutated = true;
        }

        const zingaUser =
          currentUser?.username === 'zingariello131' ||
          currentUser?.username === 'zingariello1314';
        if (zingaUser) {
          const exists = programsSnapshot.some(
            (p) => p.id === newMusculationProgram.id || p.name === newMusculationProgram.name
          );
          if (!exists) {
            programsSnapshot = [newMusculationProgram, ...programsSnapshot];
            setPrograms(programsSnapshot);
            mutated = true;
          }
        }

        if (mutated) {
          try {
            await flushAutoSave({
              programs: programsSnapshot,
              activeProgram: activeSnapshot,
              programHistory: ph,
              weekVariant: wv,
              isGymMode: gm,
            });
          } catch (persistErr) {
            console.error('❌ Erreur sauvegarde initiale des programmes:', persistErr);
          }
        }

        isInitialLoadRef.current = false;
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du contexte:', error);
        // Continuer même en cas d'erreur pour ne pas bloquer l'application
        isInitialLoadRef.current = false;
      }
    };
    
    if (isAuthenticated && currentUser) {
      initializeContext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isAuthenticated]); // Exécuter quand l'utilisateur change

  // S'assurer que contextValue est toujours défini avant de rendre
  if (!contextValue) {
    console.error('❌ Erreur: contextValue non défini dans WorkoutProvider');
    // Fournir un contexte minimal pour éviter le crash
    const fallbackValue = {
      data: {},
      updateData: async () => {},
      activeTab: 'home',
      setActiveTab: () => {},
      previousTab: null,
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