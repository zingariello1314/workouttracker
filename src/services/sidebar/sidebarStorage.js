/**
 * Service de stockage pour la Sidebar Premium QuietQuest
 * Gère la persistance des préférences utilisateur dans IndexedDB
 */

const DB_NAME = 'QuietQuestDB';
const DB_VERSION = 2; // Incrémenté pour créer le nouvel object store
const STORE_NAME = 'sidebarPreferences';
const PREFERENCES_KEY = 'preferences';

/**
 * Structure par défaut des préférences
 */
const DEFAULT_PREFERENCES = {
  expandedSections: {
    actions: true,
    metrics: true,
    quests: true,
    sport: false,
    learning: false,
    books: false,
    finance: false,
    journal: false,
    focusSession: false,
    achievements: false,
    focusRPG: false,
    dailyGoals: false,
    notifications: false,
    weather: false,
    motivation: false,
    rewards: false,
    history: false,
    quickSettings: false,
    aiPredictions: false,
    globalStats: false,
  },
  lastUpdated: null,
};

/**
 * Initialise la base de données IndexedDB
 * @returns {Promise<IDBDatabase>} Instance de la base de données
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[SidebarStorage] Erreur lors de l\'ouverture de la base de données:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Créer l'object store s'il n'existe pas
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log('[SidebarStorage] Object store créé:', STORE_NAME);
      }
    };
  });
};

/**
 * Récupère les préférences depuis IndexedDB
 * @returns {Promise<Object>} Préférences utilisateur
 */
export const getPreferences = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(PREFERENCES_KEY);

      request.onsuccess = () => {
        const stored = request.result;
        
        if (!stored) {
          resolve({ ...DEFAULT_PREFERENCES });
          return;
        }

        // Valider la structure des données
        if (!stored || typeof stored !== 'object') {
          console.warn('[SidebarStorage] Données corrompues, utilisation des valeurs par défaut');
          resolve({ ...DEFAULT_PREFERENCES });
          return;
        }

        // Fusionner avec les valeurs par défaut pour gérer les nouvelles sections
        const merged = {
          ...DEFAULT_PREFERENCES,
          ...stored,
          expandedSections: {
            ...DEFAULT_PREFERENCES.expandedSections,
            ...(stored.expandedSections || {}),
          },
        };
        
        resolve(merged);
      };

      request.onerror = () => {
        console.error('[SidebarStorage] Erreur lors de la lecture des préférences:', request.error);
        resolve({ ...DEFAULT_PREFERENCES });
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de l\'initialisation de la base de données:', error);
    return { ...DEFAULT_PREFERENCES };
  }
};

/**
 * Sauvegarde les préférences dans IndexedDB
 * @param {Object} preferences - Préférences à sauvegarder
 * @returns {Promise<boolean>} Succès de la sauvegarde
 */
export const savePreferences = async (preferences) => {
  try {
    const db = await initDB();
    
    const toSave = {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(toSave, PREFERENCES_KEY);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('[SidebarStorage] Erreur lors de la sauvegarde des préférences:', request.error);
        resolve(false);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de la sauvegarde des préférences:', error);
    return false;
  }
};

/**
 * Met à jour l'état d'une section spécifique
 * @param {string} sectionId - Identifiant de la section
 * @param {boolean} isExpanded - État d'expansion
 * @returns {Promise<boolean>} Succès de la mise à jour
 */
export const updateSectionState = async (sectionId, isExpanded) => {
  try {
    const preferences = await getPreferences();
    preferences.expandedSections[sectionId] = isExpanded;
    return await savePreferences(preferences);
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de la mise à jour de la section:', error);
    return false;
  }
};

/**
 * Récupère l'état d'une section spécifique
 * @param {string} sectionId - Identifiant de la section
 * @returns {Promise<boolean>} État d'expansion de la section
 */
export const getSectionState = async (sectionId) => {
  try {
    const preferences = await getPreferences();
    return preferences.expandedSections[sectionId] ?? false;
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de la récupération de l\'état de la section:', error);
    return false;
  }
};

/**
 * Réinitialise toutes les préférences aux valeurs par défaut
 * @returns {Promise<boolean>} Succès de la réinitialisation
 */
export const resetPreferences = async () => {
  try {
    return await savePreferences({ ...DEFAULT_PREFERENCES });
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de la réinitialisation des préférences:', error);
    return false;
  }
};

/**
 * Exporte les préférences au format JSON
 * @returns {Promise<string|null>} Préférences au format JSON
 */
export const exportPreferences = async () => {
  try {
    const preferences = await getPreferences();
    return JSON.stringify(preferences, null, 2);
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de l\'export des préférences:', error);
    return null;
  }
};

/**
 * Importe des préférences depuis un JSON
 * @param {string} jsonString - Préférences au format JSON
 * @returns {Promise<boolean>} Succès de l'import
 */
export const importPreferences = async (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Valider la structure
    if (!parsed || typeof parsed !== 'object' || !parsed.expandedSections) {
      console.error('[SidebarStorage] Format de données invalide');
      return false;
    }
    
    return await savePreferences(parsed);
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de l\'import des préférences:', error);
    return false;
  }
};

/**
 * Vérifie si les préférences existent dans IndexedDB
 * @returns {Promise<boolean>} True si des préférences existent
 */
export const hasStoredPreferences = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(PREFERENCES_KEY);

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };

      request.onerror = () => {
        console.error('[SidebarStorage] Erreur lors de la vérification des préférences:', request.error);
        resolve(false);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de la vérification des préférences:', error);
    return false;
  }
};

/**
 * Obtient la date de dernière mise à jour des préférences
 * @returns {Promise<Date|null>} Date de dernière mise à jour ou null
 */
export const getLastUpdated = async () => {
  try {
    const preferences = await getPreferences();
    return preferences.lastUpdated ? new Date(preferences.lastUpdated) : null;
  } catch (error) {
    console.error('[SidebarStorage] Erreur lors de la récupération de la date de mise à jour:', error);
    return null;
  }
};

export default {
  getPreferences,
  savePreferences,
  updateSectionState,
  getSectionState,
  resetPreferences,
  exportPreferences,
  importPreferences,
  hasStoredPreferences,
  getLastUpdated,
};
