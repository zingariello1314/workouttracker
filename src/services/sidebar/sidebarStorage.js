/**
 * Service de stockage pour la Sidebar Premium QuietQuest
 * Gère la persistance des préférences utilisateur dans IndexedDB
 */

const DB_NAME = 'QuietQuestDB';
const DB_VERSION = null; // Laisser IndexedDB gérer la version actuelle
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
 * États d’ouverture par défaut des modules sidebar (alternance historique).
 * Fusionnés avant les préférences stockées pour que les clés existent après rechargement (IndexedDB).
 */
const SIDEBAR_HISTORICAL_MODULE_EXPANDED_DEFAULTS = {
  'course-garmin-running': true,
  'sidebar-sport-planning': true,
  'sidebar-sport-calendar': true,
  'sidebar-daily-quests': true,
  'progression-lecture': false,
  'metriques-garmin': false,
  'sidebar-body-recap': true,
  'sidebar-finance-snapshot': true,
  'liste-courses': false,
  'session-lecture-active': false,
  'creativite-projets': false,
  'performance-globale': false,
  'apprentissage-express': false,
  'sidebar-reading-session': true,
  'sidebar-book-focus': true,
  'sidebar-books-recap': true,
};

/**
 * Initialise la base de données IndexedDB
 * @returns {Promise<IDBDatabase>} Instance de la base de données
 */
const upgradeSidebarDB = (nextVersion) =>
  new Promise((resolve, reject) => {
    const upgradeRequest = indexedDB.open(DB_NAME, nextVersion);

    upgradeRequest.onerror = () => {
      console.error('[SidebarStorage] Erreur lors de l\'upgrade DB:', upgradeRequest.error);
      reject(upgradeRequest.error);
    };

    upgradeRequest.onsuccess = () => {
      resolve(upgradeRequest.result);
    };

    upgradeRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log('[SidebarStorage] Object store créé:', STORE_NAME);
      }
    };
  });

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = DB_VERSION ? indexedDB.open(DB_NAME, DB_VERSION) : indexedDB.open(DB_NAME);

    request.onerror = () => {
      console.error('[SidebarStorage] Erreur lors de l\'ouverture de la base de données:', request.error);
      reject(request.error);
    };

    request.onsuccess = async () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const nextVersion = (db.version || 1) + 1;
        db.close();
        try {
          const upgraded = await upgradeSidebarDB(nextVersion);
          resolve(upgraded);
        } catch (error) {
          reject(error);
        }
        return;
      }
      resolve(db);
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
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.warn('[SidebarStorage] Store manquant, utilisation des valeurs par défaut');
      db.close();
      return { ...DEFAULT_PREFERENCES };
    }
    
    return new Promise((resolve) => {
      try {
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
          const fromStored = stored.expandedSections || {};
          const expandedSections = {
            ...DEFAULT_PREFERENCES.expandedSections,
            ...SIDEBAR_HISTORICAL_MODULE_EXPANDED_DEFAULTS,
            ...fromStored,
          };
          // Remplacement « enregistrer session » → planning sport (conserver ouvert/fermé)
          if (expandedSections['sidebar-sport-planning'] === undefined) {
            expandedSections['sidebar-sport-planning'] =
              fromStored['enregistrer-session'] !== undefined ? fromStored['enregistrer-session'] : true;
          }
          delete expandedSections['enregistrer-session'];

          // « Corps et charges » séparé de Course Garmin : reprendre l’ancien état si pas encore de clé dédiée
          if (!Object.prototype.hasOwnProperty.call(fromStored, 'sidebar-body-recap')) {
            if (Object.prototype.hasOwnProperty.call(fromStored, 'course-garmin-running')) {
              expandedSections['sidebar-body-recap'] = !!fromStored['course-garmin-running'];
            }
          }

          const merged = {
            ...DEFAULT_PREFERENCES,
            ...stored,
            expandedSections,
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
        
        transaction.onerror = () => {
          console.error('[SidebarStorage] Erreur de transaction:', transaction.error);
          db.close();
          resolve({ ...DEFAULT_PREFERENCES });
        };
      } catch (txError) {
        console.error('[SidebarStorage] Erreur lors de la création de la transaction:', txError);
        db.close();
        resolve({ ...DEFAULT_PREFERENCES });
      }
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
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.error('[SidebarStorage] Store manquant, impossible de sauvegarder');
      db.close();
      return false;
    }
    
    const toSave = {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    };
    
    return new Promise((resolve) => {
      try {
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
        
        transaction.onerror = () => {
          console.error('[SidebarStorage] Erreur de transaction:', transaction.error);
          db.close();
          resolve(false);
        };
      } catch (txError) {
        console.error('[SidebarStorage] Erreur lors de la création de la transaction:', txError);
        db.close();
        resolve(false);
      }
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
    
    // Vérifier que le store existe
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.close();
      return false;
    }
    
    return new Promise((resolve) => {
      try {
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
        
        transaction.onerror = () => {
          db.close();
          resolve(false);
        };
      } catch (txError) {
        db.close();
        resolve(false);
      }
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
