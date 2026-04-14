// Export/Import JSON pour QuietQuest
// Compatible avec IndexedDB et localStorage (fallback)
//
// Contenu d'un export complet (data.*) :
// - quests : toutes les quêtes (champs tels qu'en base : ordre, heureOverrides, prière, créneau, xp, etc.)
// - validations : historique des coches (queteId, date, xpGagne, heureValidation, …)
// - userData : niveau, XP courant, XP pour niveau suivant
// - dailyPerformances : totaux par jour (taux de réussite, XP du jour, …)
// - appState : filtres liste, tri, position prière (quietquest_app_state)

import {
  openQuietQuestDB,
  loadQuestsFromIndexedDB,
  loadValidationsFromIndexedDB,
  loadUserDataFromIndexedDB,
  loadDailyPerformancesFromIndexedDB,
  loadAppStateFromIndexedDB,
  saveQuestsToIndexedDB,
  saveValidationsToIndexedDB,
  saveUserDataToIndexedDB,
  saveDailyPerformancesToIndexedDB,
  saveAppStateToIndexedDB,
  clearQuietQuestStores,
} from './quietQuestIndexedDB';
import { STORAGE_KEYS, loadFromStorage, saveToStorage, defaultUserData } from '../hooks/useQuietQuestEngine';

const EXPORT_VERSION = '1.1';
const EXPORT_TYPE = 'QuietQuest Complete';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

/** Retire userId (clé interne IndexedDB) pour un JSON portable. */
const stripUserId = (record) => {
  if (!record || typeof record !== 'object') return record;
  const { userId: _uid, ...rest } = record;
  return rest;
};

/**
 * Normalise userData pour export / import (nombres valides, champs par défaut).
 */
export const normalizeQuietQuestUserData = (userData) => {
  const merged = {
    ...defaultUserData,
    ...(userData && typeof userData === 'object' ? userData : {}),
  };
  const level = Number.parseInt(String(merged.level), 10);
  const currentXP = Number(merged.currentXP);
  const xpForNextLevel = Number(merged.xpForNextLevel);
  return {
    ...merged,
    level: Number.isFinite(level) && level >= 1 ? level : 1,
    currentXP: Number.isFinite(currentXP) && currentXP >= 0 ? currentXP : 0,
    xpForNextLevel:
      Number.isFinite(xpForNextLevel) && xpForNextLevel >= 1
        ? xpForNextLevel
        : defaultUserData.xpForNextLevel,
  };
};

const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

/**
 * Valide la structure d'un export JSON
 */
export const validateQuietQuestExport = (jsonData) => {
  if (!jsonData || typeof jsonData !== 'object') return false;
  if (!jsonData.data || typeof jsonData.data !== 'object') return false;

  const { data } = jsonData;

  if (!Array.isArray(data.quests)) return false;
  if (!Array.isArray(data.validations)) return false;
  if (!data.userData || typeof data.userData !== 'object' || Array.isArray(data.userData)) return false;
  if (!Array.isArray(data.dailyPerformances)) return false;

  if ('appState' in data && data.appState != null && !isPlainObject(data.appState)) {
    return false;
  }

  if (data.quests.length > 0) {
    const firstQuest = data.quests[0];
    if (firstQuest == null || typeof firstQuest !== 'object') return false;
    if (firstQuest.id === '' || firstQuest.id == null) return false;
    if (!firstQuest.nom || !firstQuest.categorie) return false;
  }

  if (data.validations.length > 0) {
    const firstValidation = data.validations[0];
    if (firstValidation == null || typeof firstValidation !== 'object') return false;
    if (firstValidation.queteId === '' || firstValidation.queteId == null) return false;
    if (!firstValidation.date) return false;
  }

  const ud = normalizeQuietQuestUserData(data.userData);
  if (ud.level < 1 || ud.currentXP < 0) return false;

  return true;
};

/**
 * Prépare les données pour l'export (clone profond + sans userId + userData normalisé).
 */
export const prepareQuietQuestExport = (
  quests,
  validations,
  userData,
  dailyPerformances,
  appState = {}
) => {
  const safeQuests = Array.isArray(quests)
    ? quests.map((q) => stripUserId(deepClone(q)))
    : [];
  const safeValidations = Array.isArray(validations)
    ? validations.map((v) => stripUserId(deepClone(v)))
    : [];
  const safeDaily = Array.isArray(dailyPerformances)
    ? dailyPerformances.map((d) => stripUserId(deepClone(d)))
    : [];

  return {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    exportType: EXPORT_TYPE,
    data: {
      quests: safeQuests,
      validations: safeValidations,
      userData: normalizeQuietQuestUserData(userData),
      dailyPerformances: safeDaily,
      appState: isPlainObject(appState) ? deepClone(appState) : {},
    },
  };
};

/**
 * Calcule les métadonnées pour l'export
 */
const calculateExportMetadata = (quests, validations, userData, dailyPerformances) => {
  const dates = [
    ...validations.map((v) => v.date),
    ...dailyPerformances.map((d) => d.date),
  ].filter(Boolean);

  const sorted = [...dates].sort();
  const earliest = sorted.length > 0 ? sorted[0] : null;
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const jsonStr = JSON.stringify({ quests, validations, userData, dailyPerformances });
  const estimatedSizeKB = Math.round((jsonStr.length / 1024) * 100) / 100;

  return {
    totalQuests: quests.length,
    totalValidations: validations.length,
    dateRange: earliest && latest ? { earliest, latest } : null,
    userLevel: userData?.level || 1,
    totalXP: validations.reduce((sum, v) => sum + (v.xpGagne || 0), 0),
    estimatedSizeKB,
    schemaVersion: EXPORT_VERSION,
    includesAppState: true,
  };
};

/**
 * Exporte toutes les données QuietQuest
 */
export const exportQuietQuestData = async (options = {}) => {
  const {
    includeMetadata = true,
    compress = false,
    storageMode = 'auto', // 'indexeddb' | 'localstorage' | 'auto'
  } = options;

  let quests;
  let validations;
  let userData;
  let dailyPerformances;
  let appState;

  if (storageMode === 'auto') {
    const db = await openQuietQuestDB();
    if (db) {
      quests = await loadQuestsFromIndexedDB(db, 'main');
      validations = await loadValidationsFromIndexedDB(db, 'main');
      userData = await loadUserDataFromIndexedDB(db, 'main');
      dailyPerformances = await loadDailyPerformancesFromIndexedDB(db, 'main');
      appState = await loadAppStateFromIndexedDB(db, 'main');
    } else {
      quests = loadFromStorage(STORAGE_KEYS.quests, []);
      validations = loadFromStorage(STORAGE_KEYS.validations, []);
      userData = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
      dailyPerformances = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);
      appState = loadFromStorage(STORAGE_KEYS.appState, {});
    }
  } else if (storageMode === 'indexeddb') {
    const db = await openQuietQuestDB();
    if (!db) throw new Error('IndexedDB non disponible');
    quests = await loadQuestsFromIndexedDB(db, 'main');
    validations = await loadValidationsFromIndexedDB(db, 'main');
    userData = await loadUserDataFromIndexedDB(db, 'main');
    dailyPerformances = await loadDailyPerformancesFromIndexedDB(db, 'main');
    appState = await loadAppStateFromIndexedDB(db, 'main');
  } else {
    quests = loadFromStorage(STORAGE_KEYS.quests, []);
    validations = loadFromStorage(STORAGE_KEYS.validations, []);
    userData = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
    dailyPerformances = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);
    appState = loadFromStorage(STORAGE_KEYS.appState, {});
  }

  const resolvedUser = userData || defaultUserData;
  const resolvedApp = appState != null && isPlainObject(appState) ? appState : {};

  const exportData = prepareQuietQuestExport(
    quests,
    validations,
    resolvedUser,
    dailyPerformances,
    resolvedApp
  );

  if (includeMetadata) {
    exportData.metadata = calculateExportMetadata(
      quests,
      validations,
      normalizeQuietQuestUserData(resolvedUser),
      dailyPerformances
    );
  }

  if (compress) {
    console.warn('[quietQuestExportImport] Compression non implémentée pour l\'instant');
  }

  return exportData;
};

/**
 * Normalise le payload importé (sans userId ; userData + appState sûrs).
 */
const normalizeImportPayload = (data) => {
  const quests = Array.isArray(data.quests)
    ? data.quests.map((q) => stripUserId(deepClone(q)))
    : [];
  const validations = Array.isArray(data.validations)
    ? data.validations.map((v) => stripUserId(deepClone(v)))
    : [];
  const dailyPerformances = Array.isArray(data.dailyPerformances)
    ? data.dailyPerformances.map((d) => stripUserId(deepClone(d)))
    : [];
  const userData = normalizeQuietQuestUserData(data.userData);
  const appState =
    data.appState != null && isPlainObject(data.appState) ? deepClone(data.appState) : {};

  return { quests, validations, userData, dailyPerformances, appState };
};

/**
 * Importe des données QuietQuest
 */
export const importQuietQuestData = async (jsonData, options = {}) => {
  const {
    mode = 'replace',
    createBackup = true,
    validate = true,
  } = options;

  if (validate && !validateQuietQuestExport(jsonData)) {
    throw new Error('Format d\'export invalide. Vérifie que le fichier est un export QuietQuest valide.');
  }

  const { data } = jsonData;

  let backup = null;
  if (createBackup) {
    try {
      backup = await exportQuietQuestData({ includeMetadata: true, compress: false });
      console.log('[quietQuestExportImport] ✅ Backup créé avant import');
    } catch (error) {
      console.error('[quietQuestExportImport] ⚠️ Erreur création backup:', error);
    }
  }

  const normalized = normalizeImportPayload(data);

  try {
    const db = await openQuietQuestDB();

    if (db) {
      if (mode === 'replace') {
        await clearQuietQuestStores(db, 'main');
        await saveQuestsToIndexedDB(db, normalized.quests, 'main');
        await saveValidationsToIndexedDB(db, normalized.validations, 'main');
        await saveUserDataToIndexedDB(db, normalized.userData, 'main');
        await saveDailyPerformancesToIndexedDB(db, normalized.dailyPerformances, 'main');
        await saveAppStateToIndexedDB(db, normalized.appState, 'main');
      } else {
        throw new Error('Mode merge non implémenté. Utilisez mode "replace".');
      }
    } else {
      if (mode === 'replace') {
        saveToStorage(STORAGE_KEYS.quests, normalized.quests);
        saveToStorage(STORAGE_KEYS.validations, normalized.validations);
        saveToStorage(STORAGE_KEYS.userData, normalized.userData);
        saveToStorage(STORAGE_KEYS.dailyPerformances, normalized.dailyPerformances);
        saveToStorage(STORAGE_KEYS.appState, normalized.appState);
      } else {
        throw new Error('Mode merge non implémenté. Utilisez mode "replace".');
      }
    }

    console.log('[quietQuestExportImport] ✅ Import réussi');
    return { success: true, backup };
  } catch (error) {
    console.error('[quietQuestExportImport] ❌ Erreur import:', error);

    if (backup && createBackup) {
      try {
        console.log('[quietQuestExportImport] 🔄 Tentative de rollback...');
        await importQuietQuestData(backup, { mode: 'replace', createBackup: false, validate: false });
        console.log('[quietQuestExportImport] ✅ Rollback réussi');
      } catch (rollbackError) {
        console.error('[quietQuestExportImport] ❌ Erreur rollback:', rollbackError);
      }
    }

    throw error;
  }
};
