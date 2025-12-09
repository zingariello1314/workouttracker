/**
 * Service de stockage pour ProfileCard
 * Gère les avatars et paramètres utilisateur dans IndexedDB
 */

const DB_NAME = 'ProfileCardDB'; // Base de données séparée pour éviter les conflits
const STORE_NAME = 'profileCards';
const DB_VERSION = 1;

/**
 * Ouvre la connexion à IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[ProfileCardStorage] Erreur ouverture DB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      console.log(`[ProfileCardStorage] DB ouverte - Version: ${db.version}`);
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log(`[ProfileCardStorage] Upgrade DB de v${event.oldVersion} vers v${event.newVersion}`);

      // Créer le store s'il n'existe pas
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log(`[ProfileCardStorage] Création du store "${STORE_NAME}"`);
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'username' });
        objectStore.createIndex('username', 'username', { unique: true });
        objectStore.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
    
    request.onblocked = () => {
      console.warn('[ProfileCardStorage] Ouverture DB bloquée - ferme les autres onglets');
      reject(new Error('Database blocked'));
    };
  });
};

/**
 * Sauvegarde les données de profil pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {Object} profileData - Données du profil
 * @returns {Promise<void>}
 */
export const saveProfileData = async (username, profileData) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data = {
      username,
      ...profileData,
      lastModified: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la sauvegarde:', error);
    throw error;
  }
};

/**
 * Récupère les données de profil pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<Object|null>}
 */
export const getProfileData = async (username) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const data = await new Promise((resolve, reject) => {
      const request = store.get(username);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return data || null;
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la récupération:', error);
    return null;
  }
};

/**
 * Ajoute un nouvel avatar à la galerie
 * @param {string} username - Nom d'utilisateur
 * @param {string} avatarDataUrl - Data URL de l'image
 * @returns {Promise<number>} Index du nouvel avatar
 */
export const addAvatar = async (username, avatarDataUrl) => {
  try {
    const existingData = await getProfileData(username) || {};
    const avatars = existingData.avatars || [];
    
    // Ajouter le nouvel avatar
    avatars.push({
      id: Date.now(),
      dataUrl: avatarDataUrl,
      createdAt: new Date().toISOString()
    });
    
    // Si c'est le premier avatar, le définir comme actif
    const activeAvatarIndex = avatars.length === 1 ? 0 : (existingData.activeAvatarIndex ?? 0);
    
    await saveProfileData(username, {
      ...existingData,
      avatars,
      activeAvatarIndex,
      avatarUrl: avatars[activeAvatarIndex].dataUrl
    });
    
    return avatars.length - 1;
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de l\'ajout de l\'avatar:', error);
    throw error;
  }
};

/**
 * Supprime un avatar de la galerie
 * @param {string} username - Nom d'utilisateur
 * @param {number} index - Index de l'avatar à supprimer
 * @returns {Promise<void>}
 */
export const deleteAvatar = async (username, index) => {
  try {
    const existingData = await getProfileData(username) || {};
    const avatars = existingData.avatars || [];
    
    if (index < 0 || index >= avatars.length) {
      throw new Error('Index invalide');
    }
    
    // Supprimer l'avatar
    avatars.splice(index, 1);
    
    // Ajuster l'index actif si nécessaire
    let activeAvatarIndex = existingData.activeAvatarIndex ?? 0;
    if (activeAvatarIndex >= avatars.length) {
      activeAvatarIndex = Math.max(0, avatars.length - 1);
    }
    
    // Définir l'avatar actif ou null si aucun avatar
    const avatarUrl = avatars.length > 0 ? avatars[activeAvatarIndex].dataUrl : null;
    
    await saveProfileData(username, {
      ...existingData,
      avatars,
      activeAvatarIndex,
      avatarUrl
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la suppression de l\'avatar:', error);
    throw error;
  }
};

/**
 * Définit l'avatar actif
 * @param {string} username - Nom d'utilisateur
 * @param {number} index - Index de l'avatar à activer
 * @returns {Promise<void>}
 */
export const setActiveAvatar = async (username, index) => {
  try {
    const existingData = await getProfileData(username) || {};
    const avatars = existingData.avatars || [];
    
    if (index < 0 || index >= avatars.length) {
      throw new Error('Index invalide');
    }
    
    await saveProfileData(username, {
      ...existingData,
      activeAvatarIndex: index,
      avatarUrl: avatars[index].dataUrl
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la définition de l\'avatar actif:', error);
    throw error;
  }
};

/**
 * Sauvegarde un avatar pour un utilisateur (legacy - utilise addAvatar)
 * @param {string} username - Nom d'utilisateur
 * @param {string} avatarDataUrl - Data URL de l'image
 * @returns {Promise<void>}
 */
export const saveAvatar = async (username, avatarDataUrl) => {
  await addAvatar(username, avatarDataUrl);
};

/**
 * Sauvegarde le handle pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {string} handle - Handle (sans @)
 * @returns {Promise<void>}
 */
export const saveHandle = async (username, handle) => {
  try {
    const existingData = await getProfileData(username) || {};
    
    await saveProfileData(username, {
      ...existingData,
      handle: handle.replace('@', '')
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la sauvegarde du handle:', error);
    throw error;
  }
};

/**
 * Sauvegarde l'image centrale (iconUrl) pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {string} iconDataUrl - Data URL de l'image centrale
 * @returns {Promise<void>}
 */
export const saveCardIcon = async (username, iconDataUrl) => {
  try {
    const existingData = await getProfileData(username) || {};
    
    await saveProfileData(username, {
      ...existingData,
      cardIconUrl: iconDataUrl
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la sauvegarde de l\'icône de carte:', error);
    throw error;
  }
};

/**
 * Récupère l'image centrale pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<string|null>}
 */
export const getCardIcon = async (username) => {
  try {
    const data = await getProfileData(username);
    return data?.cardIconUrl || null;
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la récupération de l\'icône de carte:', error);
    return null;
  }
};

/**
 * Récupère l'avatar pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<string|null>}
 */
export const getAvatar = async (username) => {
  try {
    const data = await getProfileData(username);
    return data?.avatarUrl || null;
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la récupération de l\'avatar:', error);
    return null;
  }
};

/**
 * Récupère le handle pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<string|null>}
 */
export const getHandle = async (username) => {
  try {
    const data = await getProfileData(username);
    return data?.handle || null;
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la récupération du handle:', error);
    return null;
  }
};

/**
 * Supprime les données de profil pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<void>}
 */
export const deleteProfileData = async (username) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.delete(username);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la suppression:', error);
    throw error;
  }
};

/**
 * Convertit un fichier en Data URL
 * @param {File} file - Fichier image
 * @returns {Promise<string>}
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Détermine le titre basé sur le username
 * @param {string} username - Nom d'utilisateur
 * @returns {string}
 */
export const getUserTitle = (username) => {
  // Admin account gets "Développeur Premium"
  if (username === 'zingariello1314') {
    return 'Développeur Premium';
  }
  // All other accounts get "Utilisateur"
  return 'Utilisateur';
};

export default {
  saveProfileData,
  getProfileData,
  saveAvatar,
  addAvatar,
  deleteAvatar,
  setActiveAvatar,
  saveHandle,
  saveCardIcon,
  getAvatar,
  getHandle,
  getCardIcon,
  deleteProfileData,
  fileToDataUrl,
  getUserTitle
};
