import { useState, useEffect } from 'react';

export const useHomepageImages = () => {
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Clés de stockage simplifiées et fiables
  const STORAGE_KEYS = {
    primary: 'homepage_images_primary',
    backup: 'homepage_images_backup',
    session: 'homepage_images_session'
  };

  // Fonction pour migrer les images depuis le système principal
  const migrateFromMainSystem = async () => {
    try {
      // Vérifier si les images existent dans le système principal (localStorage)
      const mainDataStr = localStorage.getItem('workoutData_backup');
      if (mainDataStr) {
        const mainData = JSON.parse(mainDataStr);
        if (mainData.homepageImages) {
          console.log('🔄 Migration des images depuis le système principal...');
          
          // Migrer les images de fond
          if (mainData.homepageImages.backgroundImages && mainData.homepageImages.backgroundImages.length > 0) {
            await saveImages('backgroundImages', mainData.homepageImages.backgroundImages);
            console.log(`✅ ${mainData.homepageImages.backgroundImages.length} images de fond migrées`);
          }
          
          return true;
        }
      }
      
      // Vérifier aussi dans IndexedDB principal
      const request = indexedDB.open('WorkoutTrackerDB', 1);
      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const db = event.target.result;
          if (db.objectStoreNames.contains('workouts')) {
            const transaction = db.transaction(['workouts'], 'readonly');
            const store = transaction.objectStore('workouts');
            const getRequest = store.get('main');
            
            getRequest.onsuccess = async () => {
              if (getRequest.result && getRequest.result.homepageImages) {
                console.log('🔄 Migration des images depuis IndexedDB principal...');
                
                // Migrer les images de fond
                if (getRequest.result.homepageImages.backgroundImages && getRequest.result.homepageImages.backgroundImages.length > 0) {
                  await saveImages('backgroundImages', getRequest.result.homepageImages.backgroundImages);
                  console.log(`✅ ${getRequest.result.homepageImages.backgroundImages.length} images de fond migrées`);
                }
                
                resolve(true);
              } else {
                resolve(false);
              }
            };
            
            getRequest.onerror = () => resolve(false);
          } else {
            resolve(false);
          }
        };
        
        request.onerror = () => resolve(false);
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return false;
    }
  };

  // Charger les images depuis tous les niveaux de sauvegarde
  const loadImages = async () => {
    try {
      console.log('🔍 Chargement des images depuis tous les niveaux...');
      
      // Essayer de charger depuis IndexedDB d'abord
      let imagesLoaded = await loadFromIndexedDB();
      
      // Si pas d'images dans IndexedDB, essayer localStorage
      if (!imagesLoaded) {
        console.log('📦 IndexedDB vide, tentative localStorage...');
        imagesLoaded = await loadFromLocalStorage();
      }
      
      // Si toujours pas d'images, essayer sessionStorage
      if (!imagesLoaded) {
        console.log('📦 localStorage vide, tentative sessionStorage...');
        imagesLoaded = await loadFromSessionStorage();
      }
      
      // Si toujours pas d'images, essayer la migration depuis le système principal
      if (!imagesLoaded) {
        console.log('📦 sessionStorage vide, tentative migration système principal...');
        const migrated = await migrateFromMainSystem();
        
        if (migrated) {
          // Recharger après migration
          await loadImages();
          return;
        }
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des images:', error);
      setIsLoading(false);
    }
  };

  // Charger depuis IndexedDB
  const loadFromIndexedDB = async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('HomepageImagesDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'type' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        
        // Charger les images de fond
        const backgroundRequest = store.get('backgroundImages');
        backgroundRequest.onsuccess = () => {
          if (backgroundRequest.result && backgroundRequest.result.images) {
            setBackgroundImages(backgroundRequest.result.images);
            console.log(`✅ IndexedDB: ${backgroundRequest.result.images.length} images de fond chargées`);
          }
          
          const hasImages = backgroundRequest.result && backgroundRequest.result.images && backgroundRequest.result.images.length > 0;
          resolve(hasImages);
        };
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Erreur lors du chargement');
        resolve(false);
      };
    });
  };

  // Charger depuis localStorage
  const loadFromLocalStorage = async () => {
    try {
      let hasImages = false;
      
      // Charger images de fond
      const backgroundData = localStorage.getItem('homepage_backgroundImages_backup');
      if (backgroundData) {
        const parsed = JSON.parse(backgroundData);
        if (parsed.images && parsed.images.length > 0) {
          setBackgroundImages(parsed.images);
          console.log(`✅ localStorage: ${parsed.images.length} images de fond chargées`);
          hasImages = true;
        }
      }
      
      return hasImages;
    } catch (error) {
      console.error('❌ localStorage: Erreur lors du chargement', error);
      return false;
    }
  };

  // Charger depuis sessionStorage
  const loadFromSessionStorage = async () => {
    try {
      let hasImages = false;
      
      // Charger images de fond
      const backgroundData = sessionStorage.getItem('homepage_backgroundImages_session');
      if (backgroundData) {
        const parsed = JSON.parse(backgroundData);
        if (parsed.images && parsed.images.length > 0) {
          setBackgroundImages(parsed.images);
          console.log(`✅ sessionStorage: ${parsed.images.length} images de fond chargées`);
          hasImages = true;
        }
      }
      
      return hasImages;
    } catch (error) {
      console.error('❌ sessionStorage: Erreur lors du chargement', error);
      return false;
    }
  };

  // Sauvegarder les images dans IndexedDB indépendant avec système multi-niveaux
  const saveImages = async (imageType, images) => {
    try {
      console.log(`💾 Sauvegarde ${imageType} - ${images.length} images`);
      
      // Validation des données avant sauvegarde
      const validatedImages = validateImageData(images);
      if (validatedImages.length !== images.length) {
        console.warn(`⚠️ ${images.length - validatedImages.length} images invalides supprimées avant sauvegarde`);
      }
      
      // Niveau 1: IndexedDB principal
      await saveToIndexedDB(imageType, validatedImages);
      
      // Niveau 2: localStorage de secours
      await saveToLocalStorage(imageType, validatedImages);
      
      // Niveau 3: sessionStorage pour la session courante
      await saveToSessionStorage(imageType, validatedImages);
      
      console.log(`✅ Sauvegarde ${imageType} réussie sur tous les niveaux`);
      
      // Mettre à jour l'état local
      if (imageType === 'backgroundImages') {
        setBackgroundImages(validatedImages);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des images:', error);
      throw error;
    }
  };

  // Sauvegarde dans IndexedDB
  const saveToIndexedDB = async (imageType, images) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HomepageImagesDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'type' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        const imageData = {
          type: imageType,
          images: images,
          lastUpdated: new Date().toISOString(),
          version: '2.0'
        };
        
        const putRequest = store.put(imageData);
        putRequest.onsuccess = () => {
          console.log(`✅ IndexedDB: ${imageType} sauvegardé`);
          resolve();
        };
        putRequest.onerror = () => {
          console.error(`❌ IndexedDB: Erreur sauvegarde ${imageType}`);
          reject(putRequest.error);
        };
      };
      
      request.onerror = () => {
        console.error('❌ IndexedDB: Impossible d\'ouvrir la base');
        reject(request.error);
      };
    });
  };

  // Sauvegarde dans localStorage
  const saveToLocalStorage = async (imageType, images) => {
    try {
      const key = `homepage_${imageType}_backup`;
      const data = {
        images: images,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ localStorage: ${imageType} sauvegardé`);
    } catch (error) {
      console.error(`❌ localStorage: Erreur sauvegarde ${imageType}`, error);
      throw error;
    }
  };

  // Sauvegarde dans sessionStorage
  const saveToSessionStorage = async (imageType, images) => {
    try {
      const key = `homepage_${imageType}_session`;
      const data = {
        images: images,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      };
      
      sessionStorage.setItem(key, JSON.stringify(data));
      console.log(`✅ sessionStorage: ${imageType} sauvegardé`);
    } catch (error) {
      console.error(`❌ sessionStorage: Erreur sauvegarde ${imageType}`, error);
      // Ne pas faire échouer la sauvegarde pour sessionStorage
    }
  };

  // Système de validation et de cohérence pour garantir la stabilité à long terme
  const validateImageData = (images) => {
    if (!Array.isArray(images)) {
      console.warn('⚠️ Images invalides: doit être un tableau');
      return [];
    }
    
    return images.filter(image => {
      if (typeof image !== 'string') {
        console.warn('⚠️ Image invalide: doit être une chaîne base64');
        return false;
      }
      
      if (!image.startsWith('data:image/')) {
        console.warn('⚠️ Image invalide: doit commencer par data:image/');
        return false;
      }
      
      return true;
    });
  };

  // Système de nettoyage automatique pour éviter l'accumulation de données corrompues
  const cleanupCorruptedData = async () => {
    try {
      console.log('🧹 Nettoyage des données corrompues...');
      
      // Nettoyer IndexedDB
      const request = indexedDB.open('HomepageImagesDB', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        // Vérifier et nettoyer les données
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          getAllRequest.result.forEach(item => {
            if (item.images) {
              const cleanedImages = validateImageData(item.images);
              if (cleanedImages.length !== item.images.length) {
                console.log(`🧹 Nettoyé ${item.images.length - cleanedImages.length} images corrompues pour ${item.type}`);
                store.put({
                  ...item,
                  images: cleanedImages,
                  lastCleaned: new Date().toISOString()
                });
              }
            }
          });
        };
      };
      
      // Nettoyer localStorage
      ['homepage_backgroundImages_backup'].forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.images) {
              const cleanedImages = validateImageData(parsed.images);
              if (cleanedImages.length !== parsed.images.length) {
                console.log(`🧹 Nettoyé ${parsed.images.length - cleanedImages.length} images corrompues dans localStorage`);
                localStorage.setItem(key, JSON.stringify({
                  ...parsed,
                  images: cleanedImages,
                  lastCleaned: new Date().toISOString()
                }));
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erreur nettoyage ${key}:`, error);
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  };

  // Sauvegarde automatique périodique pour garantir la persistance
  const startAutoSave = () => {
    // Sauvegarde automatique toutes les 5 minutes
    const autoSaveInterval = setInterval(async () => {
      try {
        if (backgroundImages.length > 0) {
          await saveToLocalStorage('backgroundImages', backgroundImages);
        }
        console.log('🔄 Sauvegarde automatique effectuée');
      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Sauvegarde avant fermeture de la page
    const handleBeforeUnload = async () => {
      try {
        if (backgroundImages.length > 0) {
          await saveToLocalStorage('backgroundImages', backgroundImages);
        }
        console.log('🔄 Sauvegarde avant fermeture effectuée');
      } catch (error) {
        console.error('❌ Erreur sauvegarde avant fermeture:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Nettoyer les listeners au démontage
    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  };

  useEffect(() => {
    const initializeSystem = async () => {
      // 1. Charger les images
      await loadImages();
      
      // 2. Nettoyer les données corrompues (une fois par session)
      const lastCleanup = sessionStorage.getItem('homepage_last_cleanup');
      const today = new Date().toDateString();
      if (lastCleanup !== today) {
        await cleanupCorruptedData();
        sessionStorage.setItem('homepage_last_cleanup', today);
      }
    };
    
    initializeSystem();
    
    // Démarrer la sauvegarde automatique
    const cleanup = startAutoSave();
    return cleanup;
  }, [backgroundImages]);

  return {
    backgroundImages,
    isLoading,
    saveImages,
    loadImages
  };
};
