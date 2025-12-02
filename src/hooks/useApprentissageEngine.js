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

// Clés de stockage
const STORAGE_KEYS = {
  SUBJECTS: 'apprentissage_subjects',
  PROGRESSION: 'apprentissage_progression',
  TIMER: 'apprentissage_timer',
  SESSIONS_HISTORY: 'apprentissage_sessions_history',
  PLANNER: 'apprentissage_planner',
};

// Configuration XP
const XP_CONFIG = {
  session_completed: 30,
  session_perfect: 45,
  base_xp_per_minute: 1.2,
  long_session_bonus: 1.4, // 45min+
  very_long_session_bonus: 1.8, // 90min+
  short_session_penalty: 0.8, // <15min
  early_morning_bonus: 1.2, // 5h-8h
  late_evening_bonus: 1.1, // 20h-23h
  weekend_bonus: 1.15,
  level_formula: (level) => Math.floor(Math.pow(level, 1.8) * 150),
  streak_multipliers: {
    3: 1.1,
    7: 1.2,
    14: 1.3,
    30: 1.5,
  },
};

// Badges par niveau
const SUBJECT_BADGES = {
  1: { icon: '🔰', name: 'Novice', color: '#6b7280' },
  3: { icon: '📖', name: 'Apprenti', color: '#3b82f6' },
  5: { icon: '🎒', name: 'Étudiant', color: '#10b981' },
  8: { icon: '📜', name: 'Érudit', color: '#8b5cf6' },
  12: { icon: '🎓', name: 'Expert', color: '#f59e0b' },
  20: { icon: '👑', name: 'Maître', color: '#ef4444' },
  30: { icon: '⚡', name: 'Légende', color: '#ffd700' },
  50: { icon: '🌟', name: 'Immortel', color: '#ff1493' },
};

// Badges contextuels
const CONTEXTUAL_BADGES = [
  { id: 'early_study', icon: '🐦', name: 'Lève-tôt', description: '10 sessions avant 7h', condition: 'early_study', threshold: 10 },
  { id: 'late_study', icon: '🦉', name: 'Hibou de Nuit', description: '10 sessions après 22h', condition: 'late_study', threshold: 10 },
  { id: 'weekend_study', icon: '⚔️', name: 'Guerrier du Weekend', description: '8 weekends d\'étude', condition: 'weekend_study', threshold: 8 },
  { id: 'daily_consistency', icon: '👑', name: 'Roi de la Régularité', description: '30 jours consécutifs', condition: 'daily_consistency', threshold: 30 },
  { id: 'quick_sessions', icon: '💨', name: 'Démon de Vitesse', description: '20 sessions rapides', condition: 'quick_sessions', threshold: 20 },
  { id: 'long_sessions', icon: '🏃‍♂️', name: 'Marathonien Mental', description: '5 sessions longues', condition: 'long_sessions', threshold: 5 },
  { id: 'perfect_sessions', icon: '💎', name: 'Perfectionniste', description: '25 sessions parfaites', condition: 'perfect_sessions', threshold: 25 },
  { id: 'subject_variety', icon: '🧠', name: 'Polymathe', description: '5 matières différentes', condition: 'subject_variety', threshold: 5 },
];

// Trophées
const TROPHIES_CONFIG = [
  { id: 'first_step', icon: '🌟', name: 'Premier Pas', description: 'Première session', type: 'progression', requirement: { type: 'sessions', value: 1 }, xp: 50 },
  { id: 'bronze_regularity', icon: '🥉', name: 'Régularité Bronze', description: '3 jours consécutifs', type: 'regularity', requirement: { type: 'streak', value: 3 }, xp: 100 },
  { id: 'silver_regularity', icon: '🥈', name: 'Régularité Argent', description: '7 jours consécutifs', type: 'regularity', requirement: { type: 'streak', value: 7 }, xp: 200 },
  { id: 'gold_regularity', icon: '🥇', name: 'Régularité Or', description: '30 jours consécutifs', type: 'regularity', requirement: { type: 'streak', value: 30 }, xp: 500 },
  { id: 'beginner_student', icon: '📚', name: 'Étudiant Débutant', description: '10 heures totales', type: 'progression', requirement: { type: 'totalTime', value: 36000 }, xp: 150 },
  { id: 'confirmed_student', icon: '🎓', name: 'Étudiant Confirmé', description: '50 heures totales', type: 'progression', requirement: { type: 'totalTime', value: 180000 }, xp: 300 },
  { id: 'master_student', icon: '👨‍🎓', name: 'Maître Étudiant', description: '100 heures totales', type: 'progression', requirement: { type: 'totalTime', value: 360000 }, xp: 500 },
  { id: 'specialist', icon: '⭐', name: 'Spécialiste', description: 'Niveau 10 dans une matière', type: 'specialization', requirement: { type: 'subjectLevel', value: 10 }, xp: 400 },
  { id: 'polymath', icon: '🧠', name: 'Polymathe', description: '5 matières différentes', type: 'specialization', requirement: { type: 'subjectCount', value: 5 }, xp: 300 },
  { id: 'night_owl', icon: '🦉', name: 'Hibou de Nuit', description: 'Étudier après 22h', type: 'special', requirement: { type: 'late_study', value: 1 }, xp: 100 },
  { id: 'early_bird', icon: '🐦', name: 'Lève-tôt', description: 'Étudier avant 7h', type: 'special', requirement: { type: 'early_study', value: 1 }, xp: 100 },
  { id: 'marathon_runner', icon: '🏃‍♂️', name: 'Marathonien', description: 'Session 3h', type: 'special', requirement: { type: 'long_session', value: 10800 }, xp: 200 },
  { id: 'perfectionist', icon: '💎', name: 'Perfectionniste', description: '20 sessions sans interruption', type: 'special', requirement: { type: 'perfect_sessions', value: 20 }, xp: 250 },
];

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

const calculateLevel = (xp) => {
  let level = 1;
  while (XP_CONFIG.level_formula(level) <= xp) {
    level++;
  }
  return level - 1;
};

const getSubjectBadge = (level) => {
  const badgeLevels = Object.keys(SUBJECT_BADGES)
    .map(Number)
    .sort((a, b) => b - a);
  
  for (const badgeLevel of badgeLevels) {
    if (level >= badgeLevel) {
      return SUBJECT_BADGES[badgeLevel];
    }
  }
  return SUBJECT_BADGES[1];
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

  // Ref pour débounce sauvegarde
  const saveDebounceRef = useRef(null);
  const userId = 'main'; // TODO: utiliser currentUser.id si authentifié

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
        console.error('[useApprentissageEngine] Erreur chargement:', error);
        // Fallback localStorage
        const loadedSubjects = loadFromStorage(STORAGE_KEYS.SUBJECTS, []);
        const loadedProgression = loadFromStorage(STORAGE_KEYS.PROGRESSION, progressionData);
        setSubjects(loadedSubjects);
        setProgressionData(loadedProgression);
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
    const newSubject = {
      id: Date.now().toString(),
      name: subjectData.name.trim(),
      files: subjectData.files || [],
      summary: subjectData.summary?.trim() || '',
      createdAt: Date.now(),
    };

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

  // Supprimer une matière
  const deleteSubject = useCallback((subjectId) => {
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
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject) {
        const { [subject.name]: removed, ...rest } = prev.subjects;
        const updated = { ...prev, subjects: rest };
        // Sauvegarder dans IndexedDB
        saveProgressionToIndexedDB(updated, userId).catch(() => {
          // Fallback localStorage
          saveToStorage(STORAGE_KEYS.PROGRESSION, updated);
        });
        return updated;
      }
      return prev;
    });
  }, [subjects]);

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
    if (actualWorkTime >= 5400) { // 90min+
      xp *= XP_CONFIG.very_long_session_bonus; // ×1.8
    } else if (actualWorkTime >= 2700) { // 45min+
      xp *= XP_CONFIG.long_session_bonus; // ×1.4
    } else if (actualWorkTime < 900) { // <15min
      xp *= XP_CONFIG.short_session_penalty; // ×0.8
    }

    return Math.max(xp, 8); // Minimum 8 XP
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
      if (hour >= 5 && hour < 8) {
        multiplier *= XP_CONFIG.early_morning_bonus;
        subjectData.earlyMorningSessions = (subjectData.earlyMorningSessions || 0) + 1;
      } else if (hour >= 20 && hour < 23) {
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
      if (actualWorkTime >= 5400) {
        subjectData.longSessions = (subjectData.longSessions || 0) + 1;
      } else if (actualWorkTime < 900) {
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

      const level = calculateLevel(subjectData.xp);
      const nextLevelXP = getXPForNextLevel(level);
      const currentLevelXP = getCurrentLevelXP(subjectData.xp, level);
      const progress = nextLevelXP > 0 ? (currentLevelXP / (nextLevelXP - (level > 1 ? XP_CONFIG.level_formula(level) : 0))) * 100 : 0;

      return {
        level,
        xp: subjectData.xp,
        progress: Math.min(progress, 100),
        currentLevelXP,
        nextLevelXP,
      };
    },
    [progressionData]
  );

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
    XP_CONFIG,
    SUBJECT_BADGES,
    CONTEXTUAL_BADGES,
    TROPHIES_CONFIG,
  };
};

export default useApprentissageEngine;

