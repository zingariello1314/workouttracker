/**
 * Hook useApprentissageEngine - Moteur centralisé pour l'onglet Apprentissage
 * Gère les matières, sessions, progression, XP, badges et trophées
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  openApprentissageDB,
  loadSubjectsFromIndexedDB,
  loadProgressionFromIndexedDB,
  loadSessionsHistoryFromIndexedDB,
  loadTimerFromIndexedDB,
  loadPlannerFromIndexedDB,
  saveSubjectsToIndexedDB,
  saveProgressionToIndexedDB,
  saveSessionsHistoryToIndexedDB,
  saveTimerToIndexedDB,
  savePlannerToIndexedDB,
} from '../utils/apprentissageIndexedDB';
import {
  XP_CONFIG,
  SUBJECT_BADGES,
  CONTEXTUAL_BADGES,
  TROPHIES_CONFIG,
  SESSION_DURATION_THRESHOLDS,
  TIME_BONUSES,
} from '../utils/apprentissageConstants';
import {
  levelCalculationCache,
  progressionCache,
  badgeCache,
  invalidateSubjectCache,
  clearAllCaches,
} from '../utils/apprentissageCache';
import { handleStorageError, handleValidationError, ERROR_TYPES, ERROR_SEVERITY } from '../utils/apprentissageErrorHandler';
import { DEBOUNCE_DELAYS } from '../utils/apprentissageConstants';
import { validateAndParse, SubjectSchema, validateFile } from '../utils/apprentissageValidation';
import { sanitizeSubject } from '../utils/apprentissageSanitization';
import { useApprentissageWorker } from './useApprentissageWorker';
import { useUndoRedo } from './useUndoRedo';

// Clés de stockage
const STORAGE_KEYS = {
  SUBJECTS: 'apprentissage_subjects',
  PROGRESSION: 'apprentissage_progression',
  TIMER: 'apprentissage_timer',
  SESSIONS_HISTORY: 'apprentissage_sessions_history',
  PLANNER: 'apprentissage_planner',
};

// Fonctions utilitaires
const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[Apprentissage] Error loading ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Apprentissage] Error saving ${key}:`, error);
  }
};

// Ces fonctions sont maintenant dans apprentissageCalculations.js
// On les garde ici pour compatibilité mais on peut utiliser le worker
import { calculateLevel as syncCalculateLevel, getSubjectBadge as syncGetSubjectBadge } from '../utils/apprentissageCalculations';

const calculateLevel = (xp) => {
  // Vérifier le cache d'abord
  const cached = levelCalculationCache.get(xp);
  if (cached !== null) {
    return cached;
  }

  // Utiliser la fonction synchrone (fallback si worker indisponible)
  const result = syncCalculateLevel(xp);

  // Mettre en cache
  levelCalculationCache.set(xp, result);
  return result;
};

const getSubjectBadge = (level) => {
  // Vérifier le cache d'abord
  const cached = badgeCache.get(level);
  if (cached !== null) {
    return cached;
  }

  // Utiliser la fonction synchrone (fallback si worker indisponible)
  const result = syncGetSubjectBadge(level);

  // Mettre en cache
  badgeCache.set(level, result);
  return result;
};

const getXPForNextLevel = (currentLevel) => {
  return XP_CONFIG.level_formula(currentLevel + 1);
};

const getCurrentLevelXP = (xp, currentLevel) => {
  const xpForCurrentLevel = currentLevel > 1 ? XP_CONFIG.level_formula(currentLevel) : 0;
  return xp - xpForCurrentLevel;
};

export const useApprentissageEngine = () => {
  // État des matières
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // État de progression
  const [progressionData, setProgressionData] = useState({
    subjects: {},
    globalLevel: 1,
    globalXP: 0,
    totalStudyTime: 0,
    unlockedBadges: [],
    unlockedTrophies: [],
    dailyStreak: 0,
    lastStudyDate: null,
    weeklyGoals: {},
    monthlyStats: {},
    progressionHistory: [],
  });

  // Refs pour débounce sauvegarde
  const saveDebounceRef = useRef(null);
  const timerSaveDebounceRef = useRef(null);
  const plannerSaveDebounceRef = useRef(null);
  const sessionsHistorySaveDebounceRef = useRef(null);
  const userId = 'main'; // TODO: utiliser currentUser.id si authentifié

  // Système undo/redo pour actions destructives
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    pushAction,
    clearHistory,
  } = useUndoRedo(
    // onUndo
    (action) => {
      if (action.type === 'DELETE_SUBJECT') {
        setSubjects((prev) => [...prev, action.data.subject]);
        saveSubjects([...subjects, action.data.subject]);
      }
    },
    // onRedo
    (action) => {
      if (action.type === 'DELETE_SUBJECT') {
        const updatedSubjects = subjects.filter((s) => s.id !== action.data.subjectId);
        setSubjects(updatedSubjects);
        saveSubjects(updatedSubjects);
      }
    }
  );

  // Migration automatique depuis localStorage vers IndexedDB
  const migrateFromLocalStorage = useCallback(async () => {
    const db = await openApprentissageDB();
    if (!db) return false;

    try {
      // Vérifier si IndexedDB est vide
      const indexedSubjects = await loadSubjectsFromIndexedDB(db, userId);
      const indexedProgression = await loadProgressionFromIndexedDB(db, userId);

      // Si IndexedDB vide mais localStorage contient des données, migrer
      if ((!indexedSubjects || indexedSubjects.length === 0) && (!indexedProgression || Object.keys(indexedProgression).length === 0)) {
        const localSubjects = loadFromStorage(STORAGE_KEYS.SUBJECTS, []);
        const localProgression = loadFromStorage(STORAGE_KEYS.PROGRESSION, null);
        const localSessions = loadFromStorage(STORAGE_KEYS.SESSIONS_HISTORY, []);
        const localTimer = loadFromStorage(STORAGE_KEYS.TIMER, null);
        const localPlanner = loadFromStorage(STORAGE_KEYS.PLANNER, null);

        if (localSubjects.length > 0 || localProgression) {
          console.log('[useApprentissageEngine] Migration localStorage → IndexedDB');
          
          if (localSubjects.length > 0) {
            await saveSubjectsToIndexedDB(db, localSubjects, userId);
          }
          if (localProgression) {
            await saveProgressionToIndexedDB(db, localProgression, userId);
          }
          if (localSessions.length > 0) {
            await saveSessionsHistoryToIndexedDB(db, localSessions, userId);
          }
          if (localTimer) {
            await saveTimerToIndexedDB(db, localTimer, userId);
          }
          if (localPlanner) {
            await savePlannerToIndexedDB(db, localPlanner, userId);
          }

          // Supprimer localStorage après migration réussie
          localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
          localStorage.removeItem(STORAGE_KEYS.PROGRESSION);
          localStorage.removeItem(STORAGE_KEYS.SESSIONS_HISTORY);
          localStorage.removeItem(STORAGE_KEYS.TIMER);
          localStorage.removeItem(STORAGE_KEYS.PLANNER);
          
          console.log('[useApprentissageEngine] ✅ Migration terminée');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[useApprentissageEngine] Erreur migration:', error);
      return false;
    }
  }, [userId]);

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Migration d'abord
        await migrateFromLocalStorage();

        // Charger depuis IndexedDB
        const db = await openApprentissageDB();
        if (db) {
          const loadedSubjects = await loadSubjectsFromIndexedDB(db, userId);
          const loadedProgression = await loadProgressionFromIndexedDB(db, userId);

          if (loadedSubjects) {
            setSubjects(loadedSubjects);
          } else {
            setSubjects(loadFromStorage(STORAGE_KEYS.SUBJECTS, []));
          }

          if (loadedProgression) {
            setProgressionData(loadedProgression);
          } else {
            const localProgression = loadFromStorage(STORAGE_KEYS.PROGRESSION, progressionData);
            setProgressionData(localProgression);
          }
        } else {
          // Fallback localStorage
          const loadedSubjects = loadFromStorage(STORAGE_KEYS.SUBJECTS, []);
          const loadedProgression = loadFromStorage(STORAGE_KEYS.PROGRESSION, progressionData);
          setSubjects(loadedSubjects);
          setProgressionData(loadedProgression);
        }
      } catch (error) {
        handleStorageError(error, { operation: 'loadData' }, {
          severity: ERROR_SEVERITY.HIGH,
          fallback: () => {
            const loadedSubjects = loadFromStorage(STORAGE_KEYS.SUBJECTS, []);
            const loadedProgression = loadFromStorage(STORAGE_KEYS.PROGRESSION, progressionData);
            setSubjects(loadedSubjects);
            setProgressionData(loadedProgression);
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Sauvegarder les matières (avec débounce)
  const saveSubjects = useCallback(async (subjectsToSave) => {
    const toSave = subjectsToSave || subjects;
    
    // Sauvegarder dans IndexedDB
    const db = await openApprentissageDB();
    if (db) {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
      saveDebounceRef.current = setTimeout(async () => {
        const saveDb = await openApprentissageDB();
        if (saveDb) {
          await saveSubjectsToIndexedDB(saveDb, toSave, userId);
        }
      }, 300);
    } else {
      // Fallback localStorage
      saveToStorage(STORAGE_KEYS.SUBJECTS, toSave);
    }
  }, [subjects, userId]);

  // Sauvegarder la progression (avec débounce)
  const saveProgression = useCallback(async (progressionToSave) => {
    const toSave = progressionToSave || progressionData;
    
    // Sauvegarder dans IndexedDB
    const db = await openApprentissageDB();
    if (db) {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
      saveDebounceRef.current = setTimeout(async () => {
        const saveDb = await openApprentissageDB();
        if (saveDb) {
          await saveProgressionToIndexedDB(saveDb, toSave, userId);
        }
      }, 300);
    } else {
      // Fallback localStorage
      saveToStorage(STORAGE_KEYS.PROGRESSION, toSave);
    }
  }, [progressionData, userId]);

  // Ajouter une matière
  const addSubject = useCallback((subjectData) => {
    // Sanitizer les données d'entrée
    const sanitizedData = sanitizeSubject({
      name: subjectData.name,
      files: subjectData.files || [],
      summary: subjectData.summary || '',
    });

    // Valider avec Zod
    const validation = validateAndParse(SubjectSchema, {
      id: Date.now().toString(),
      name: sanitizedData.name,
      files: sanitizedData.files,
      summary: sanitizedData.summary,
      createdAt: Date.now(),
    });

    if (!validation.success) {
      handleValidationError(
        new Error(validation.errors.map((e) => e.message).join(', ')),
        { operation: 'addSubject', data: subjectData }
      );
      throw new Error('Données de matière invalides');
    }

    const newSubject = validation.data;

    setSubjects((prev) => {
      const updated = [...prev, newSubject];
      // Sauvegarder dans IndexedDB
      saveSubjectsToIndexedDB(updated, userId).catch(() => {
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.SUBJECTS, updated);
      });
      return updated;
    });

    // Initialiser progression pour cette matière
    setProgressionData((prev) => {
      const updated = {
        ...prev,
        subjects: {
          ...prev.subjects,
          [newSubject.name]: {
            xp: 0,
            level: 1,
            sessions: 0,
            totalTime: 0,
            perfectSessions: 0,
            earlyMorningSessions: 0,
            lateEveningSessions: 0,
            weekendSessions: 0,
            longSessions: 0,
            quickSessions: 0,
            lastStudyDate: null,
            weeklyXP: [],
            monthlyXP: [],
          },
        },
      };
      // Sauvegarder dans IndexedDB
      saveProgressionToIndexedDB(updated, userId).catch(() => {
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.PROGRESSION, updated);
      });
      return updated;
    });

    return newSubject;
  }, []);

  // Supprimer une matière (avec undo/redo)
  const deleteSubject = useCallback((subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    // Sauvegarder l'action pour undo
    pushAction({
      type: 'DELETE_SUBJECT',
      data: {
        subjectId,
        subject: { ...subject }, // Copie pour undo
      },
      undoFn: (data) => {
        setSubjects((prev) => {
          const restored = [...prev, data.subject];
          // Sauvegarder dans IndexedDB
          saveSubjectsToIndexedDB(restored, userId).catch(() => {
            // Fallback localStorage
            saveToStorage(STORAGE_KEYS.SUBJECTS, restored);
          });
          return restored;
        });
      },
      redoFn: (data) => {
        setSubjects((prev) => {
          const updated = prev.filter((s) => s.id !== data.subjectId);
          // Sauvegarder dans IndexedDB
          saveSubjectsToIndexedDB(updated, userId).catch(() => {
            // Fallback localStorage
            saveToStorage(STORAGE_KEYS.SUBJECTS, updated);
          });
          return updated;
        });
      },
    });

    setSubjects((prev) => {
      const updated = prev.filter((s) => s.id !== subjectId);
      // Sauvegarder dans IndexedDB
      saveSubjectsToIndexedDB(updated, userId).catch(() => {
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.SUBJECTS, updated);
      });
      return updated;
    });

    // Supprimer progression
    setProgressionData((prev) => {
      const { [subject.name]: removed, ...rest } = prev.subjects || {};
      const updated = { ...prev, subjects: rest };
      // Sauvegarder dans IndexedDB
      saveProgressionToIndexedDB(updated, userId).catch(() => {
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.PROGRESSION, updated);
      });
      return updated;
    });
  }, [subjects, pushAction]);

  // Calculer XP de session
  const calculateSessionXP = useCallback((sessionData) => {
    let xp = XP_CONFIG.session_completed; // 30
    const minutes = Math.floor((sessionData.actualWorkTime || 0) / 60);
    xp += minutes * XP_CONFIG.base_xp_per_minute; // +1.2/min

    if (sessionData.completed && sessionData.pauseTime === 0) {
      xp += XP_CONFIG.session_perfect - XP_CONFIG.session_completed; // +15
    }

    // Multiplicateurs durée
    const actualWorkTime = sessionData.actualWorkTime || 0;
    if (actualWorkTime >= SESSION_DURATION_THRESHOLDS.VERY_LONG_SESSION) {
      xp *= XP_CONFIG.very_long_session_bonus; // ×1.8
    } else if (actualWorkTime >= SESSION_DURATION_THRESHOLDS.LONG_SESSION) {
      xp *= XP_CONFIG.long_session_bonus; // ×1.4
    } else if (actualWorkTime < SESSION_DURATION_THRESHOLDS.SHORT_SESSION) {
      xp *= XP_CONFIG.short_session_penalty; // ×0.8
    }

    return Math.max(xp, XP_CONFIG.min_xp); // Minimum XP
  }, []);

  // Ajouter XP avec multiplicateurs
  const addXP = useCallback((subjectName, baseXP, sessionData = null) => {
    setProgressionData((prev) => {
      const updated = { ...prev };
      
      // Initialiser matière si nécessaire
      if (!updated.subjects[subjectName]) {
        updated.subjects[subjectName] = {
          xp: 0,
          level: 1,
          sessions: 0,
          totalTime: 0,
          perfectSessions: 0,
          earlyMorningSessions: 0,
          lateEveningSessions: 0,
          weekendSessions: 0,
          longSessions: 0,
          quickSessions: 0,
          lastStudyDate: null,
          weeklyXP: [],
          monthlyXP: [],
        };
      }

      const subjectData = updated.subjects[subjectName];
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      // Calculer multiplicateurs
      let multiplier = 1.0;

      // Streak multiplier
      const streak = updated.dailyStreak || 0;
      if (streak >= 30) multiplier *= XP_CONFIG.streak_multipliers[30];
      else if (streak >= 14) multiplier *= XP_CONFIG.streak_multipliers[14];
      else if (streak >= 7) multiplier *= XP_CONFIG.streak_multipliers[7];
      else if (streak >= 3) multiplier *= XP_CONFIG.streak_multipliers[3];

      // Bonus horaires
      if (hour >= TIME_BONUSES.EARLY_MORNING_START && hour < TIME_BONUSES.EARLY_MORNING_END) {
        multiplier *= XP_CONFIG.early_morning_bonus;
        subjectData.earlyMorningSessions = (subjectData.earlyMorningSessions || 0) + 1;
      } else if (hour >= TIME_BONUSES.LATE_EVENING_START && hour < TIME_BONUSES.LATE_EVENING_END) {
        multiplier *= XP_CONFIG.late_evening_bonus;
        subjectData.lateEveningSessions = (subjectData.lateEveningSessions || 0) + 1;
      }

      // Bonus weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        multiplier *= XP_CONFIG.weekend_bonus;
        subjectData.weekendSessions = (subjectData.weekendSessions || 0) + 1;
      }

      // Catégoriser session
      const actualWorkTime = sessionData?.actualWorkTime || 0;
      if (actualWorkTime >= SESSION_DURATION_THRESHOLDS.VERY_LONG_SESSION) {
        subjectData.longSessions = (subjectData.longSessions || 0) + 1;
      } else if (actualWorkTime < SESSION_DURATION_THRESHOLDS.SHORT_SESSION) {
        subjectData.quickSessions = (subjectData.quickSessions || 0) + 1;
      }

      if (sessionData?.completed && sessionData?.pauseTime === 0) {
        subjectData.perfectSessions = (subjectData.perfectSessions || 0) + 1;
      }

      // Appliquer multiplicateur
      const finalXP = Math.floor(baseXP * multiplier);

      // Ajouter XP
      const oldLevel = calculateLevel(subjectData.xp);
      subjectData.xp += finalXP;
      subjectData.sessions = (subjectData.sessions || 0) + 1;
      subjectData.totalTime = (subjectData.totalTime || 0) + (sessionData?.actualWorkTime || 0);
      subjectData.lastStudyDate = now.toDateString();

      const newLevel = calculateLevel(subjectData.xp);
      subjectData.level = newLevel;

      // Vérifier level up
      if (newLevel > oldLevel) {
        // Level up!
        console.log(`Level up! ${subjectName}: ${oldLevel} → ${newLevel}`);
      }

      // Ajouter XP globale
      updated.globalXP = (updated.globalXP || 0) + finalXP;
      updated.globalLevel = calculateLevel(updated.globalXP);
      updated.totalStudyTime = (updated.totalStudyTime || 0) + (sessionData?.actualWorkTime || 0);

      // Mettre à jour streak
      const today = now.toDateString();
      if (updated.lastStudyDate !== today) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (updated.lastStudyDate === yesterday.toDateString()) {
          updated.dailyStreak = (updated.dailyStreak || 0) + 1;
        } else {
          updated.dailyStreak = 1;
        }
        updated.lastStudyDate = today;
      }

      // Vérifier badges et trophées
      checkBadgesAndTrophies(updated, subjectName, sessionData);

      // Sauvegarder dans IndexedDB
      saveProgressionToIndexedDB(updated, userId).catch(() => {
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.PROGRESSION, updated);
      });
      return updated;
    });
  }, []);

  // Vérifier badges et trophées
  const checkBadgesAndTrophies = useCallback((progressionData, subjectName, sessionData) => {
    const subjectData = progressionData.subjects[subjectName];
    if (!subjectData) return;

    // Vérifier badges contextuels
    CONTEXTUAL_BADGES.forEach((badge) => {
      if (progressionData.unlockedBadges.includes(badge.id)) return;

      let unlocked = false;
      switch (badge.condition) {
        case 'early_study':
          unlocked = (subjectData.earlyMorningSessions || 0) >= badge.threshold;
          break;
        case 'late_study':
          unlocked = (subjectData.lateEveningSessions || 0) >= badge.threshold;
          break;
        case 'weekend_study':
          unlocked = (subjectData.weekendSessions || 0) >= badge.threshold;
          break;
        case 'daily_consistency':
          unlocked = (progressionData.dailyStreak || 0) >= badge.threshold;
          break;
        case 'quick_sessions':
          unlocked = (subjectData.quickSessions || 0) >= badge.threshold;
          break;
        case 'long_sessions':
          unlocked = (subjectData.longSessions || 0) >= badge.threshold;
          break;
        case 'perfect_sessions':
          unlocked = (subjectData.perfectSessions || 0) >= badge.threshold;
          break;
        case 'subject_variety':
          unlocked = Object.keys(progressionData.subjects).length >= badge.threshold;
          break;
      }

      if (unlocked) {
        progressionData.unlockedBadges.push(badge.id);
      }
    });

    // Vérifier trophées
    TROPHIES_CONFIG.forEach((trophy) => {
      if (progressionData.unlockedTrophies.includes(trophy.id)) return;

      let unlocked = false;
      const req = trophy.requirement;
      switch (req.type) {
        case 'sessions':
          unlocked = progressionData.totalStudyTime > 0 && Object.values(progressionData.subjects).some(s => s.sessions >= req.value);
          break;
        case 'streak':
          unlocked = (progressionData.dailyStreak || 0) >= req.value;
          break;
        case 'totalTime':
          unlocked = (progressionData.totalStudyTime || 0) >= req.value;
          break;
        case 'subjectLevel':
          unlocked = Object.values(progressionData.subjects).some(s => s.level >= req.value);
          break;
        case 'subjectCount':
          unlocked = Object.keys(progressionData.subjects).length >= req.value;
          break;
        case 'late_study':
        case 'early_study':
          unlocked = Object.values(progressionData.subjects).some(s => 
            req.type === 'late_study' ? (s.lateEveningSessions || 0) >= req.value : (s.earlyMorningSessions || 0) >= req.value
          );
          break;
        case 'long_session':
          unlocked = Object.values(progressionData.subjects).some(s => s.longSessions >= 1);
          break;
        case 'perfect_sessions':
          unlocked = Object.values(progressionData.subjects).some(s => (s.perfectSessions || 0) >= req.value);
          break;
      }

      if (unlocked) {
        progressionData.unlockedTrophies.push(trophy.id);
        progressionData.globalXP = (progressionData.globalXP || 0) + trophy.xp;
        progressionData.globalLevel = calculateLevel(progressionData.globalXP);
      }
    });
  }, []);

  // Obtenir progression d'une matière
  const getSubjectProgression = useCallback(
    (subjectName) => {
      const subjectData = progressionData.subjects[subjectName];
      if (!subjectData) {
        return { level: 1, xp: 0, progress: 0, currentLevelXP: 0, nextLevelXP: 1000 };
      }

      // Vérifier le cache d'abord
      const cached = progressionCache.get(subjectName, subjectData.xp);
      if (cached !== null) {
        return cached;
      }

      // Calculer la progression
      const level = calculateLevel(subjectData.xp);
      const nextLevelXP = getXPForNextLevel(level);
      const currentLevelXP = getCurrentLevelXP(subjectData.xp, level);
      const progress = nextLevelXP > 0 ? (currentLevelXP / (nextLevelXP - (level > 1 ? XP_CONFIG.level_formula(level) : 0))) * 100 : 0;

      const result = {
        level,
        xp: subjectData.xp,
        progress: Math.min(progress, 100),
        currentLevelXP,
        nextLevelXP,
      };

      // Mettre en cache
      progressionCache.set(subjectName, subjectData.xp, result);
      return result;
    },
    [progressionData]
  );

  // Fonction de sauvegarde centralisée pour le timer
  const saveTimer = useCallback(async (timerData) => {
    if (timerSaveDebounceRef.current) {
      clearTimeout(timerSaveDebounceRef.current);
    }

    timerSaveDebounceRef.current = setTimeout(async () => {
      try {
        const db = await openApprentissageDB();
        if (db) {
          await saveTimerToIndexedDB(db, timerData, userId);
        } else {
          // Fallback localStorage
          saveToStorage(STORAGE_KEYS.TIMER, timerData);
        }
      } catch (error) {
        handleStorageError(error, { type: 'timer', data: timerData });
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.TIMER, timerData);
      }
    }, DEBOUNCE_DELAYS.SAVE);
  }, [userId]);

  // Fonction de sauvegarde centralisée pour le planificateur
  const savePlanner = useCallback(async (plannerData) => {
    if (plannerSaveDebounceRef.current) {
      clearTimeout(plannerSaveDebounceRef.current);
    }

    plannerSaveDebounceRef.current = setTimeout(async () => {
      try {
        const db = await openApprentissageDB();
        if (db) {
          await savePlannerToIndexedDB(db, plannerData, userId);
        } else {
          // Fallback localStorage
          saveToStorage(STORAGE_KEYS.PLANNER, plannerData);
        }
      } catch (error) {
        handleStorageError(error, { type: 'planner', data: plannerData });
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.PLANNER, plannerData);
      }
    }, DEBOUNCE_DELAYS.SAVE);
  }, [userId]);

  // Fonction de sauvegarde centralisée pour l'historique des sessions
  const saveSessionsHistory = useCallback(async (sessionsData) => {
    if (sessionsHistorySaveDebounceRef.current) {
      clearTimeout(sessionsHistorySaveDebounceRef.current);
    }

    sessionsHistorySaveDebounceRef.current = setTimeout(async () => {
      try {
        const db = await openApprentissageDB();
        if (db) {
          await saveSessionsHistoryToIndexedDB(db, sessionsData, userId);
        } else {
          // Fallback localStorage
          saveToStorage(STORAGE_KEYS.SESSIONS_HISTORY, sessionsData);
        }
      } catch (error) {
        handleStorageError(error, { type: 'sessions_history', data: sessionsData });
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.SESSIONS_HISTORY, sessionsData);
      }
    }, DEBOUNCE_DELAYS.SAVE);
  }, [userId]);

  return {
    // État
    subjects,
    isLoading,
    progressionData,

    // Actions
    addSubject,
    deleteSubject,
    saveSubjects,
    saveProgression,
    addXP,
    calculateSessionXP,

    // Utilitaires
    getSubjectProgression,
    getSubjectBadge,
    calculateLevel,
    getXPForNextLevel,
    getCurrentLevelXP,
    
    // Fonctions de sauvegarde centralisées
    saveTimer,
    savePlanner,
    saveSessionsHistory,
    
    // Exports des constantes (pour compatibilité)
    XP_CONFIG,
    SUBJECT_BADGES,
    CONTEXTUAL_BADGES,
    TROPHIES_CONFIG,
    
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    pushAction,
    clearHistory,
  };
};

export default useApprentissageEngine;

