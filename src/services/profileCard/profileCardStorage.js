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
 * Ajoute une nouvelle image de fond à la galerie
 * @param {string} username - Nom d'utilisateur
 * @param {string} cardIconDataUrl - Data URL de l'image
 * @returns {Promise<number>} Index de la nouvelle image
 */
export const addCardIcon = async (username, cardIconDataUrl) => {
  try {
    const existingData = await getProfileData(username) || {};
    const cardIcons = existingData.cardIcons || [];
    
    // Ajouter la nouvelle image
    cardIcons.push({
      id: Date.now(),
      dataUrl: cardIconDataUrl,
      createdAt: new Date().toISOString()
    });
    
    // Si c'est la première image, la définir comme active
    const activeCardIconIndex = cardIcons.length === 1 ? 0 : (existingData.activeCardIconIndex ?? 0);
    
    await saveProfileData(username, {
      ...existingData,
      cardIcons,
      activeCardIconIndex,
      cardIconUrl: cardIcons[activeCardIconIndex].dataUrl
    });
    
    return cardIcons.length - 1;
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de l\'ajout de l\'image de carte:', error);
    throw error;
  }
};

/**
 * Supprime une image de fond de la galerie
 * @param {string} username - Nom d'utilisateur
 * @param {number} index - Index de l'image à supprimer
 * @returns {Promise<void>}
 */
export const deleteCardIcon = async (username, index) => {
  try {
    const existingData = await getProfileData(username) || {};
    const cardIcons = existingData.cardIcons || [];
    
    if (index < 0 || index >= cardIcons.length) {
      throw new Error('Index invalide');
    }
    
    // Supprimer l'image
    cardIcons.splice(index, 1);
    
    // Ajuster l'index actif si nécessaire
    let activeCardIconIndex = existingData.activeCardIconIndex ?? 0;
    if (activeCardIconIndex >= cardIcons.length) {
      activeCardIconIndex = Math.max(0, cardIcons.length - 1);
    }
    
    // Définir l'image active ou null si aucune image
    const cardIconUrl = cardIcons.length > 0 ? cardIcons[activeCardIconIndex].dataUrl : null;
    
    await saveProfileData(username, {
      ...existingData,
      cardIcons,
      activeCardIconIndex,
      cardIconUrl
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la suppression de l\'image de carte:', error);
    throw error;
  }
};

/**
 * Définit l'image de fond active
 * @param {string} username - Nom d'utilisateur
 * @param {number} index - Index de l'image à activer
 * @returns {Promise<void>}
 */
export const setActiveCardIcon = async (username, index) => {
  try {
    const existingData = await getProfileData(username) || {};
    const cardIcons = existingData.cardIcons || [];
    
    if (index < 0 || index >= cardIcons.length) {
      throw new Error('Index invalide');
    }
    
    await saveProfileData(username, {
      ...existingData,
      activeCardIconIndex: index,
      cardIconUrl: cardIcons[index].dataUrl
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la définition de l\'image de carte active:', error);
    throw error;
  }
};

/**
 * Sauvegarde l'image centrale (iconUrl) pour un utilisateur (legacy - utilise addCardIcon)
 * @param {string} username - Nom d'utilisateur
 * @param {string} iconDataUrl - Data URL de l'image centrale
 * @returns {Promise<void>}
 */
export const saveCardIcon = async (username, iconDataUrl) => {
  await addCardIcon(username, iconDataUrl);
};

/**
 * Récupère l'image centrale pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<string|null>}
 */
export const getCardIcon = async (username) => {
  try {
    const data = await getProfileData(username);
    const cardIconUrl = data?.cardIconUrl;
    
    // Ne jamais retourner le logo - seulement les data URLs valides
    if (!cardIconUrl || cardIconUrl === '/logo.png' || !cardIconUrl.startsWith('data:image/')) {
      return null;
    }
    
    return cardIconUrl;
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
    const avatarUrl = data?.avatarUrl;
    
    // Ne jamais retourner le logo - seulement les data URLs valides
    if (!avatarUrl || avatarUrl === '/logo.png' || !avatarUrl.startsWith('data:image/')) {
      return null;
    }
    
    return avatarUrl;
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
 * Optimise et normalise une image avant stockage
 * Redimensionne l'image et la convertit en JPEG pour garantir la compatibilité
 * @param {File} file - Fichier image
 * @param {number} maxWidth - Largeur maximale (défaut: 800px)
 * @param {number} maxHeight - Hauteur maximale (défaut: 800px)
 * @param {number} quality - Qualité JPEG (0-1, défaut: 0.9)
 * @returns {Promise<string>} Data URL optimisée en JPEG
 */
export const optimizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Améliorer la qualité du redimensionnement
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Data URL JPEG pour garantir la compatibilité
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        console.log(`[optimizeImage] Image optimisée: ${file.name} (${img.width}x${img.height} → ${width}x${height})`);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        console.error('[optimizeImage] Erreur lors du chargement de l\'image');
        reject(new Error('Erreur lors du chargement de l\'image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      console.error('[optimizeImage] Erreur lors de la lecture du fichier');
      reject(reader.error);
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Récupère les paramètres de rotation pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @returns {Promise<Object>} Paramètres de rotation
 */
export const getRotationSettings = async (username) => {
  try {
    const data = await getProfileData(username);
    return data?.rotationSettings || {
      cardIcon: {
        rotationEnabled: false,
        rotationMode: 'none', // 'tab-change' | 'timer' | 'both' | 'none'
        timerInterval: 60, // en secondes
        changeOnTabSwitch: false,
        changeOnSubTabSwitch: false
      },
      avatar: {
        rotationEnabled: false,
        rotationMode: 'none',
        timerInterval: 120, // en secondes
        changeOnTabSwitch: false,
        changeOnSubTabSwitch: false
      }
    };
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la récupération des paramètres de rotation:', error);
    return null;
  }
};

/**
 * Sauvegarde les paramètres de rotation pour un utilisateur
 * @param {string} username - Nom d'utilisateur
 * @param {Object} rotationSettings - Paramètres de rotation
 * @returns {Promise<void>}
 */
export const saveRotationSettings = async (username, rotationSettings) => {
  try {
    const existingData = await getProfileData(username) || {};
    
    await saveProfileData(username, {
      ...existingData,
      rotationSettings
    });
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la sauvegarde des paramètres de rotation:', error);
    throw error;
  }
};

/**
 * Passe à l'image suivante dans la rotation (cyclique)
 * @param {string} username - Nom d'utilisateur
 * @param {string} type - Type d'image ('cardIcon' ou 'avatar')
 * @returns {Promise<number>} Nouvel index actif
 */
export const rotateToNextImage = async (username, type) => {
  try {
    const existingData = await getProfileData(username) || {};
    
    if (type === 'cardIcon') {
      const cardIcons = existingData.cardIcons || [];
      if (cardIcons.length === 0) return 0;
      
      const currentIndex = existingData.activeCardIconIndex ?? 0;
      const nextIndex = (currentIndex + 1) % cardIcons.length;
      
      await setActiveCardIcon(username, nextIndex);
      return nextIndex;
    } else if (type === 'avatar') {
      const avatars = existingData.avatars || [];
      if (avatars.length === 0) return 0;
      
      const currentIndex = existingData.activeAvatarIndex ?? 0;
      const nextIndex = (currentIndex + 1) % avatars.length;
      
      await setActiveAvatar(username, nextIndex);
      return nextIndex;
    }
    
    throw new Error('Type invalide. Utilisez "cardIcon" ou "avatar"');
  } catch (error) {
    console.error('[ProfileCardStorage] Erreur lors de la rotation:', error);
    throw error;
  }
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
  addCardIcon,
  deleteCardIcon,
  setActiveCardIcon,
  getAvatar,
  getHandle,
  getCardIcon,
  deleteProfileData,
  fileToDataUrl,
  optimizeImage,
  getUserTitle,
  getRotationSettings,
  saveRotationSettings,
  rotateToNextImage
};
