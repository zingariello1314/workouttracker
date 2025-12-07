/**
 * Migration des images muscles de localStorage vers IndexedDB
 * À exécuter une seule fois pour migrer les données existantes
 */

const DB_NAME = 'MuscleImagesDB';
const DB_VERSION = 1;
const STORE_NAME = 'muscleImages';

export const migrateMuscleImagesToIndexedDB = async () => {
  try {
    // Vérifier s'il y a des données dans localStorage
    const oldData = localStorage.getItem('muscleImages');
    if (!oldData) {
      console.log('✅ Aucune donnée à migrer depuis localStorage');
      return { success: true, migrated: 0 };
    }

    const muscleImages = JSON.parse(oldData);
    const muscleIds = Object.keys(muscleImages);

    if (muscleIds.length === 0) {
      console.log('✅ Aucune image à migrer');
      localStorage.removeItem('muscleImages');
      return { success: true, migrated: 0 };
    }

    console.log(`🔄 Migration de ${muscleIds.length} images muscles vers IndexedDB...`);

    // Ouvrir IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'muscleId' });
        }
      };
    });

    // Migrer chaque image
    let migrated = 0;
    for (const muscleId of muscleIds) {
      try {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put({
            muscleId,
            imageData: muscleImages[muscleId],
            timestamp: Date.now(),
            migrated: true
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        migrated++;
        console.log(`✅ Image ${muscleId} migrée`);
      } catch (error) {
        console.error(`❌ Erreur migration ${muscleId}:`, error);
      }
    }

    // Supprimer les anciennes données de localStorage
    localStorage.removeItem('muscleImages');
    console.log(`✅ Migration terminée: ${migrated}/${muscleIds.length} images migrées`);
    console.log('✅ localStorage nettoyé');

    return { success: true, migrated };
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour nettoyer localStorage si nécessaire
export const cleanupMuscleImagesLocalStorage = () => {
  try {
    const oldData = localStorage.getItem('muscleImages');
    if (oldData) {
      const size = new Blob([oldData]).size;
      console.log(`🧹 Nettoyage localStorage: ${(size / 1024).toFixed(2)} KB`);
      localStorage.removeItem('muscleImages');
      console.log('✅ localStorage nettoyé');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erreur nettoyage localStorage:', error);
    return false;
  }
};
