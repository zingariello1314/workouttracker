// Export/Import JSON pour QuietQuest
// Compatible avec IndexedDB et localStorage (fallback)

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

const EXPORT_VERSION = '1.0';
const EXPORT_TYPE = 'QuietQuest Complete';

/**
 * Valide la structure d'un export JSON
 */
export const validateQuietQuestExport = (jsonData) => {
  if (!jsonData || typeof jsonData !== 'object') return false;
  if (!jsonData.data || typeof jsonData.data !== 'object') return false;
  
  const { data } = jsonData;
  
  // Vérifier que les champs essentiels existent
  if (!Array.isArray(data.quests)) return false;
  if (!Array.isArray(data.validations)) return false;
  if (!data.userData || typeof data.userData !== 'object') return false;
  if (!Array.isArray(data.dailyPerformances)) return false;
  
  // Valider structure des quêtes
  if (data.quests.length > 0) {
    const firstQuest = data.quests[0];
    if (!firstQuest.id || !firstQuest.nom || !firstQuest.categorie) return false;
  }
  
  // Valider structure des validations
  if (data.validations.length > 0) {
    const firstValidation = data.validations[0];
    if (!firstValidation.queteId || !firstValidation.date) return false;
  }
  
  // Valider userData
  if (typeof data.userData.level !== 'number' || data.userData.level < 1) return false;
  if (typeof data.userData.currentXP !== 'number' || data.userData.currentXP < 0) return false;
  
  return true;
};

/**
 * Prépare les données pour l'export
 */
export const prepareQuietQuestExport = (
  quests,
  validations,
  userData,
  dailyPerformances,
  appState = {}
) => {
  return {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    exportType: EXPORT_TYPE,
    data: {
      quests: Array.isArray(quests) ? quests : [],
      validations: Array.isArray(validations) ? validations : [],
      userData: userData || defaultUserData,
      dailyPerformances: Array.isArray(dailyPerformances) ? dailyPerformances : [],
      appState: appState || {},
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
  
  const earliest = dates.length > 0 ? dates.sort()[0] : null;
  const latest = dates.length > 0 ? dates.sort().reverse()[0] : null;
  
  // Estimer la taille en KB
  const jsonStr = JSON.stringify({ quests, validations, userData, dailyPerformances });
  const estimatedSizeKB = Math.round((jsonStr.length / 1024) * 100) / 100;
  
  return {
    totalQuests: quests.length,
    totalValidations: validations.length,
    dateRange: earliest && latest ? { earliest, latest } : null,
    userLevel: userData?.level || 1,
    totalXP: validations.reduce((sum, v) => sum + (v.xpGagne || 0), 0),
    estimatedSizeKB,
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
  
  let quests, validations, userData, dailyPerformances, appState;
  
  // Détecter source de données
  if (storageMode === 'auto') {
    const db = await openQuietQuestDB();
    if (db) {
      // Mode IndexedDB
      quests = await loadQuestsFromIndexedDB(db, 'main');
      validations = await loadValidationsFromIndexedDB(db, 'main');
      userData = await loadUserDataFromIndexedDB(db, 'main');
      dailyPerformances = await loadDailyPerformancesFromIndexedDB(db, 'main');
      appState = await loadAppStateFromIndexedDB(db, 'main');
    } else {
      // Fallback localStorage
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
    // localStorage
    quests = loadFromStorage(STORAGE_KEYS.quests, []);
    validations = loadFromStorage(STORAGE_KEYS.validations, []);
    userData = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
    dailyPerformances = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);
    appState = loadFromStorage(STORAGE_KEYS.appState, {});
  }
  
  // Préparer export
  const exportData = prepareQuietQuestExport(
    quests,
    validations,
    userData,
    dailyPerformances,
    appState
  );
  
  // Ajouter métadonnées
  if (includeMetadata) {
    exportData.metadata = calculateExportMetadata(
      quests,
      validations,
      userData,
      dailyPerformances
    );
  }
  
  // Compression optionnelle (pour l'instant, on retourne tel quel)
  // TODO: Implémenter compression si nécessaire (comme Garmin/Nutrition)
  if (compress) {
    // Placeholder pour compression future
    console.warn('[quietQuestExportImport] Compression non implémentée pour l\'instant');
  }
  
  return exportData;
};

/**
 * Importe des données QuietQuest
 */
export const importQuietQuestData = async (jsonData, options = {}) => {
  const {
    mode = 'replace', // 'replace' | 'merge' (merge non implémenté pour l'instant)
    createBackup = true,
    validate = true,
  } = options;
  
  // Validation
  if (validate && !validateQuietQuestExport(jsonData)) {
    throw new Error('Format d\'export invalide. Vérifie que le fichier est un export QuietQuest valide.');
  }
  
  const { data } = jsonData;
  
  // Backup avant import
  let backup = null;
  if (createBackup) {
    try {
      backup = await exportQuietQuestData({ includeMetadata: true, compress: false });
      console.log('[quietQuestExportImport] ✅ Backup créé avant import');
    } catch (error) {
      console.error('[quietQuestExportImport] ⚠️ Erreur création backup:', error);
      // Continuer quand même
    }
  }
  
  try {
    const db = await openQuietQuestDB();
    
    if (db) {
      // Mode IndexedDB
      if (mode === 'replace') {
        // Vider stores puis importer
        await clearQuietQuestStores(db, 'main');
        await saveQuestsToIndexedDB(db, data.quests || [], 'main');
        await saveValidationsToIndexedDB(db, data.validations || [], 'main');
        await saveUserDataToIndexedDB(db, data.userData || defaultUserData, 'main');
        await saveDailyPerformancesToIndexedDB(db, data.dailyPerformances || [], 'main');
        if (data.appState) {
          await saveAppStateToIndexedDB(db, data.appState, 'main');
        }
      } else {
        // Mode merge (non implémenté pour l'instant)
        throw new Error('Mode merge non implémenté. Utilisez mode "replace".');
      }
    } else {
      // Fallback localStorage
      if (mode === 'replace') {
        saveToStorage(STORAGE_KEYS.quests, data.quests || []);
        saveToStorage(STORAGE_KEYS.validations, data.validations || []);
        saveToStorage(STORAGE_KEYS.userData, data.userData || defaultUserData);
        saveToStorage(STORAGE_KEYS.dailyPerformances, data.dailyPerformances || []);
        if (data.appState) {
          saveToStorage(STORAGE_KEYS.appState, data.appState);
        }
      } else {
        throw new Error('Mode merge non implémenté. Utilisez mode "replace".');
      }
    }
    
    console.log('[quietQuestExportImport] ✅ Import réussi');
    return { success: true, backup };
  } catch (error) {
    console.error('[quietQuestExportImport] ❌ Erreur import:', error);
    
    // Rollback si backup disponible
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

