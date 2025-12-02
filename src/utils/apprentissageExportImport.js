/**
 * Export/Import JSON pour l'onglet Apprentissage
 * Compatible avec le système IndexedDB
 */

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
  clearApprentissageStores,
} from './apprentissageIndexedDB';

// Clés localStorage (fallback)
const STORAGE_KEYS = {
  SUBJECTS: 'apprentissage_subjects',
  PROGRESSION: 'apprentissage_progression',
  SESSIONS_HISTORY: 'apprentissage_sessions_history',
  TIMER: 'apprentissage_timer',
  PLANNER: 'apprentissage_planner',
};

// Fonctions utilitaires localStorage
const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[apprentissageExportImport] Error loading ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[apprentissageExportImport] Error saving ${key}:`, error);
    return false;
  }
};

/**
 * Valide les données d'export Apprentissage
 */
export const validateApprentissageExport = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Données invalides ou manquantes');
    return { valid: false, errors };
  }

  // Vérifier version
  if (!data.version) {
    errors.push('Version manquante');
  }

  // Vérifier subjects
  if (data.subjects && !Array.isArray(data.subjects)) {
    errors.push('subjects doit être un tableau');
  }

  // Vérifier progression
  if (data.progression && typeof data.progression !== 'object') {
    errors.push('progression doit être un objet');
  }

  // Vérifier sessionsHistory
  if (data.sessionsHistory && !Array.isArray(data.sessionsHistory)) {
    errors.push('sessionsHistory doit être un tableau');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Prépare les données Apprentissage pour l'export
 */
export const prepareApprentissageExportData = async (userId = 'main') => {
  try {
    const db = await openApprentissageDB();

    let subjects = [];
    let progression = null;
    let sessionsHistory = [];
    let timer = null;
    let planner = null;

    if (db) {
      // Charger depuis IndexedDB
      subjects = (await loadSubjectsFromIndexedDB(db, userId)) || [];
      progression = await loadProgressionFromIndexedDB(db, userId);
      sessionsHistory = (await loadSessionsHistoryFromIndexedDB(db, userId)) || [];
      timer = await loadTimerFromIndexedDB(db, userId);
      planner = await loadPlannerFromIndexedDB(db, userId);
    } else {
      // Fallback localStorage
      subjects = loadFromStorage(STORAGE_KEYS.SUBJECTS, []);
      progression = loadFromStorage(STORAGE_KEYS.PROGRESSION, null);
      sessionsHistory = loadFromStorage(STORAGE_KEYS.SESSIONS_HISTORY, []);
      timer = loadFromStorage(STORAGE_KEYS.TIMER, null);
      planner = loadFromStorage(STORAGE_KEYS.PLANNER, null);
    }

    // Si progression est null, créer structure par défaut
    if (!progression) {
      progression = {
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
      };
    }

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      module: 'apprentissage',
      subjects,
      progression,
      sessionsHistory,
      timer,
      planner,
      summary: {
        subjectsCount: subjects.length,
        sessionsCount: sessionsHistory.length,
        totalStudyTime: progression.totalStudyTime || 0,
        globalLevel: progression.globalLevel || 1,
        globalXP: progression.globalXP || 0,
      },
    };
  } catch (error) {
    console.error('[apprentissageExportImport] Erreur préparation export:', error);
    throw error;
  }
};

/**
 * Exporte les données Apprentissage en JSON
 */
export const exportApprentissageData = async (userId = 'main') => {
  try {
    const data = await prepareApprentissageExportData(userId);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apprentissage_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, data };
  } catch (error) {
    console.error('[apprentissageExportImport] Erreur export:', error);
    throw error;
  }
};

/**
 * Importe des données Apprentissage
 */
export const importApprentissageData = async (jsonData, options = {}) => {
  const {
    mode = 'replace', // 'replace' | 'merge'
    createBackup = true,
    validate = true,
    userId = 'main',
  } = options;

  let data;
  let backup = null;

  try {
    // Parser JSON
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }

    // Validation
    if (validate) {
      const validation = validateApprentissageExport(data);
      if (!validation.valid) {
        throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
      }
    }

    // Backup si demandé
    if (createBackup) {
      try {
        backup = await prepareApprentissageExportData(userId);
        console.log('[apprentissageExportImport] Backup créé');
      } catch (backupError) {
        console.warn('[apprentissageExportImport] Échec backup:', backupError);
        // Continuer quand même
      }
    }

    const db = await openApprentissageDB();

    if (db) {
      // Mode IndexedDB
      if (mode === 'replace') {
        // Vider stores puis importer
        await clearApprentissageStores(db, userId);
        await saveSubjectsToIndexedDB(db, data.subjects || [], userId);
        await saveProgressionToIndexedDB(db, data.progression || {}, userId);
        await saveSessionsHistoryToIndexedDB(db, data.sessionsHistory || [], userId);
        if (data.timer) {
          await saveTimerToIndexedDB(db, data.timer, userId);
        }
        if (data.planner) {
          await savePlannerToIndexedDB(db, data.planner, userId);
        }
      } else {
        // Mode merge (non implémenté pour l'instant)
        throw new Error('Mode merge non implémenté. Utilisez mode "replace".');
      }
    } else {
      // Fallback localStorage
      if (mode === 'replace') {
        saveToStorage(STORAGE_KEYS.SUBJECTS, data.subjects || []);
        saveToStorage(STORAGE_KEYS.PROGRESSION, data.progression || {});
        saveToStorage(STORAGE_KEYS.SESSIONS_HISTORY, data.sessionsHistory || []);
        if (data.timer) {
          saveToStorage(STORAGE_KEYS.TIMER, data.timer);
        }
        if (data.planner) {
          saveToStorage(STORAGE_KEYS.PLANNER, data.planner);
        }
      } else {
        throw new Error('Mode merge non implémenté. Utilisez mode "replace".');
      }
    }

    console.log('[apprentissageExportImport] ✅ Import réussi');
    return { success: true, backup };
  } catch (error) {
    console.error('[apprentissageExportImport] ❌ Erreur import:', error);
    throw error;
  }
};

/**
 * Obtient un aperçu des données à importer
 */
export const previewApprentissageImport = (jsonData) => {
  try {
    let data;
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }

    const validation = validateApprentissageExport(data);
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors,
      };
    }

    return {
      valid: true,
      subjects: data.subjects?.length || 0,
      sessions: data.sessionsHistory?.length || 0,
      globalLevel: data.progression?.globalLevel || 1,
      globalXP: data.progression?.globalXP || 0,
      totalStudyTime: data.progression?.totalStudyTime || 0,
      summary: data.summary,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message || 'Erreur de parsing'],
    };
  }
};

