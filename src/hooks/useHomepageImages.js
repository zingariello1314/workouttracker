import { useState, useEffect, useRef } from 'react';

export const useHomepageImages = () => {
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState('unknown');
  const backgroundImagesRef = useRef([]);

  // Mettre à jour la ref quand backgroundImages change
  useEffect(() => {
    backgroundImagesRef.current = backgroundImages;
  }, [backgroundImages]);

  // Validation stricte des données Base64
  const validateBase64Image = (base64) => {
    if (!base64 || typeof base64 !== 'string') {
      console.warn('❌ Image invalide: pas une chaîne de caractères');
      return false;
    }
    if (!base64.startsWith('data:image/')) {
      console.warn('❌ Image invalide: ne commence pas par data:image/');
      return false;
    }
    if (base64.length < 100) {
      console.warn('❌ Image invalide: trop petite pour être une image');
      return false;
    }
    if (base64.length > 50 * 1024 * 1024) { // 50MB max
      console.warn('❌ Image invalide: trop volumineuse (>50MB)');
      return false;
    }
    return true;
  };

  // Ouvrir IndexedDB de manière robuste avec réparation automatique
  const openDB = () => {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB non supporté'));
        return;
      }

      const request = indexedDB.open('HomepageImagesDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔄 Mise à jour IndexedDB en cours...');
        
        // Vérifier et créer l'object store 'images' si nécessaire
        if (!db.objectStoreNames.contains('images')) {
          console.log('📦 Création de l\'object store "images"...');
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('type', 'type', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ Object store "images" créé avec ses index');
        } else {
          console.log('✅ Object store "images" existe déjà');
        }
        
        console.log('✅ IndexedDB mis à jour pour les images');
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log(`✅ IndexedDB ouvert: ${db.name} v${db.version}`);
        
        // Vérifier que l'object store existe
        if (!db.objectStoreNames.contains('images')) {
          console.error('❌ Object store "images" manquant après ouverture');
          db.close();
          reject(new Error('Object store "images" manquant'));
          return;
        }
        
        resolve(db);
      };
      
      request.onerror = (event) => {
        console.error('❌ Erreur ouverture IndexedDB:', event.target.error);
        reject(event.target.error);
      };
      
      request.onblocked = () => {
        console.warn('⚠️ IndexedDB bloqué - fermez les autres onglets');
        reject(new Error('IndexedDB bloqué'));
      };
    });
  };

  // Sauvegarde dans IndexedDB (niveau 1)
  const saveImagesToIndexedDB = async (images) => {
    try {
      console.log('💾 Sauvegarde niveau 1: IndexedDB...');
      
      const db = await openDB();
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      // Supprimer les anciennes images de fond
      const deleteRequest = store.index('type').openCursor(IDBKeyRange.only('homepage_background'));
      
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          } else {
            resolve();
          }
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
      
      // Sauvegarder les nouvelles images
      const savePromises = images.map((image, index) => {
        const imageData = {
          id: `homepage_bg_${Date.now()}_${index}`,
          type: 'homepage_background',
          data: image,
          timestamp: new Date().toISOString(),
          quality: 'maximum',
          compressed: false,
          version: '2.0'
        };
        
        return new Promise((resolve, reject) => {
          const request = store.add(imageData);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      
      await Promise.all(savePromises);
      console.log('✅ Sauvegarde IndexedDB réussie');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde IndexedDB:', error);
      return false;
    }
  };

  // Sauvegarde dans localStorage (niveau 2)
  const saveImagesToLocalStorage = async (images) => {
    try {
      console.log('💾 Sauvegarde niveau 2: localStorage...');
      
      const data = {
        images: images,
        timestamp: new Date().toISOString(),
        version: '2.0',
        storage: 'localStorage_fallback',
        quality: 'maximum'
      };
      
      localStorage.setItem('homepage_images_fallback', JSON.stringify(data));
      console.log('✅ Sauvegarde localStorage réussie');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde localStorage:', error);
      return false;
    }
  };

  // Sauvegarde dans sessionStorage (niveau 3)
  const saveImagesToSessionStorage = async (images) => {
    try {
      console.log('💾 Sauvegarde niveau 3: sessionStorage...');
      
      const data = {
        images: images,
        timestamp: new Date().toISOString(),
        version: '2.0',
        storage: 'sessionStorage_emergency',
        quality: 'maximum'
      };
      
      sessionStorage.setItem('homepage_images_emergency', JSON.stringify(data));
      console.log('✅ Sauvegarde sessionStorage réussie');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde sessionStorage:', error);
      return false;
    }
  };

  // Sauvegarde synchrone intelligente (métadonnées seulement si IndexedDB fonctionne)
  const saveImagesSync = (images) => {
    try {
      // Essayer d'abord IndexedDB
      const request = indexedDB.open('HomepageImagesDB', 1);
      request.onsuccess = () => {
        const db = request.result;
        if (db.objectStoreNames.contains('images')) {
          // IndexedDB fonctionne → Sauvegarde légère des métadonnées
          const metadata = {
            count: images.length,
            timestamp: new Date().toISOString(),
            version: '2.0',
            storage: 'indexeddb_sync'
          };
          try {
            localStorage.setItem('homepage_images_sync_metadata', JSON.stringify(metadata));
            console.log('✅ Métadonnées de synchronisation sauvegardées');
          } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder les métadonnées de sync:', error);
          }
          db.close();
          return;
        }
        db.close();
      };
      
      request.onerror = () => {
        // IndexedDB échoué → Sauvegarde complète d'urgence
        const data = {
          images: images.slice(0, 3), // Limiter à 3 images max pour l'urgence
          timestamp: new Date().toISOString(),
          version: '2.0',
          storage: 'sync_emergency_limited'
        };
        
        try {
          localStorage.setItem('homepage_images_sync_emergency', JSON.stringify(data));
          console.log('✅ Sauvegarde d\'urgence limitée effectuée');
        } catch (error) {
          console.error('❌ Erreur sauvegarde d\'urgence:', error);
        }
      };
      
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde synchrone:', error);
      return false;
    }
  };

  // Sauvegarde intelligente IndexedDB-first avec fallback léger
  const saveImagesRobust = async (images) => {
    try {
      console.log('💾 Sauvegarde intelligente IndexedDB-first...');
      
      // Valider toutes les images
      const validImages = images.filter(validateBase64Image);
      if (validImages.length !== images.length) {
        console.warn(`⚠️ ${images.length - validImages.length} images invalides supprimées`);
      }
      
      if (validImages.length === 0) {
        throw new Error('Aucune image valide à sauvegarder');
      }
      
      // Sauvegarde niveau 1: IndexedDB (PRINCIPAL)
      const indexedDBSuccess = await saveImagesToIndexedDB(validImages);
      
      if (indexedDBSuccess) {
        // IndexedDB fonctionne → Sauvegarde légère des métadonnées seulement
        try {
          const metadata = {
            count: validImages.length,
            timestamp: new Date().toISOString(),
            version: '2.0',
            storage: 'indexeddb_primary'
          };
          localStorage.setItem('homepage_images_metadata', JSON.stringify(metadata));
          console.log('✅ Métadonnées sauvegardées dans localStorage');
        } catch (error) {
          console.warn('⚠️ Impossible de sauvegarder les métadonnées:', error);
        }
        
        setSystemHealth('excellent');
        setBackgroundImages(validImages);
        console.log(`🎉 ${validImages.length} images sauvegardées dans IndexedDB avec succès`);
        return;
      }
      
      // IndexedDB échoué → Fallback localStorage (images complètes)
      console.log('⚠️ IndexedDB échoué, fallback localStorage...');
      const localStorageSuccess = await saveImagesToLocalStorage(validImages);
      
      if (localStorageSuccess) {
        setSystemHealth('good');
        setBackgroundImages(validImages);
        console.log(`🎉 ${validImages.length} images sauvegardées dans localStorage (fallback)`);
        return;
      }
      
      // localStorage échoué → Fallback sessionStorage (images complètes)
      console.log('⚠️ localStorage échoué, fallback sessionStorage...');
      const sessionStorageSuccess = await saveImagesToSessionStorage(validImages);
      
      if (sessionStorageSuccess) {
        setSystemHealth('good');
        setBackgroundImages(validImages);
        console.log(`🎉 ${validImages.length} images sauvegardées dans sessionStorage (fallback)`);
        return;
      }
      
      // Tous les systèmes ont échoué
      setSystemHealth('poor');
      throw new Error('Tous les systèmes de stockage ont échoué');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde robuste:', error);
      setSystemHealth('poor');
      throw error;
    }
  };

  // Chargement depuis IndexedDB (niveau 1)
  const loadImagesFromIndexedDB = async () => {
    try {
      console.log('🔍 Chargement niveau 1: IndexedDB...');
      
      const db = await openDB();
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const index = store.index('type');
      
      const request = index.getAll(IDBKeyRange.only('homepage_background'));
      
      const images = await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const results = event.target.result;
          
          if (results && results.length > 0) {
            const sortedImages = results
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map(item => item.data)
              .filter(validateBase64Image);
            
            console.log(`✅ ${sortedImages.length} images chargées depuis IndexedDB`);
            resolve(sortedImages);
          } else {
            console.log('📭 Aucune image trouvée dans IndexedDB');
            resolve([]);
          }
        };
        
        request.onerror = (event) => {
          console.error('❌ Erreur chargement IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
      
      return images;
      
    } catch (error) {
      console.error('❌ Erreur chargement IndexedDB:', error);
      return [];
    }
  };

  // Chargement depuis localStorage (niveau 2)
  const loadImagesFromLocalStorage = async () => {
    try {
      console.log('🔍 Chargement niveau 2: localStorage...');
      
      const data = localStorage.getItem('homepage_images_fallback');
      if (!data) {
        console.log('📭 Aucune donnée dans localStorage');
        return [];
      }
      
      const parsed = JSON.parse(data);
      if (parsed.images && Array.isArray(parsed.images)) {
        const validImages = parsed.images.filter(validateBase64Image);
        console.log(`✅ ${validImages.length} images chargées depuis localStorage`);
        return validImages;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erreur chargement localStorage:', error);
      return [];
    }
  };

  // Chargement depuis sessionStorage (niveau 3)
  const loadImagesFromSessionStorage = async () => {
    try {
      console.log('🔍 Chargement niveau 3: sessionStorage...');
      
      const data = sessionStorage.getItem('homepage_images_emergency');
      if (!data) {
        console.log('📭 Aucune donnée dans sessionStorage');
        return [];
      }
      
      const parsed = JSON.parse(data);
      if (parsed.images && Array.isArray(parsed.images)) {
        const validImages = parsed.images.filter(validateBase64Image);
        console.log(`✅ ${validImages.length} images chargées depuis sessionStorage`);
        return validImages;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erreur chargement sessionStorage:', error);
      return [];
    }
  };

  // Chargement avec récupération automatique
  const loadImagesWithRecovery = async () => {
    try {
      console.log('🔍 Chargement avec récupération automatique...');
      setIsLoading(true);
      
      // 1. Essayer IndexedDB
      let images = await loadImagesFromIndexedDB();
      if (images.length > 0) {
        console.log('✅ Images récupérées depuis IndexedDB');
        setSystemHealth('excellent');
        setBackgroundImages(images);
        setIsLoading(false);
        return;
      }
      
      // 2. Essayer localStorage fallback
      images = await loadImagesFromLocalStorage();
      if (images.length > 0) {
        console.log('✅ Images récupérées depuis localStorage, migration vers IndexedDB...');
        setSystemHealth('good');
        setBackgroundImages(images);
        
        // Migrer vers IndexedDB en arrière-plan
        setTimeout(async () => {
          try {
            await saveImagesToIndexedDB(images);
            console.log('✅ Migration vers IndexedDB réussie');
            setSystemHealth('excellent');
          } catch (error) {
            console.warn('⚠️ Migration vers IndexedDB échouée:', error);
          }
        }, 1000);
        
        setIsLoading(false);
        return;
      }
      
      // 3. Essayer sessionStorage emergency
      images = await loadImagesFromSessionStorage();
      if (images.length > 0) {
        console.log('✅ Images récupérées depuis sessionStorage, migration vers IndexedDB...');
        setSystemHealth('good');
        setBackgroundImages(images);
        
        // Migrer vers IndexedDB en arrière-plan
        setTimeout(async () => {
          try {
            await saveImagesToIndexedDB(images);
            await saveImagesToLocalStorage(images);
            console.log('✅ Migration vers IndexedDB et localStorage réussie');
            setSystemHealth('excellent');
          } catch (error) {
            console.warn('⚠️ Migration échouée:', error);
          }
        }, 1000);
        
        setIsLoading(false);
        return;
      }
      
      // 4. Essayer les anciennes clés (migration)
      images = await migrateFromOldSystem();
      if (images.length > 0) {
        console.log('✅ Images récupérées depuis ancien système');
        setBackgroundImages(images);
        setIsLoading(false);
        return;
      }
      
      // 5. Aucune image trouvée
      console.log('📭 Aucune image trouvée dans tous les systèmes');
      setBackgroundImages([]);
      setSystemHealth('unknown');
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement avec récupération:', error);
      setBackgroundImages([]);
      setSystemHealth('poor');
      setIsLoading(false);
    }
  };

  // Migration depuis l'ancien système
  const migrateFromOldSystem = async () => {
    try {
      console.log('🔄 Tentative de migration depuis l\'ancien système...');
      
      const oldKeys = [
        'homepage_images_primary',
        'homepage_images_backup',
        'homepage_images_session',
        'homepage_images_sync_emergency'
      ];
      
      for (const key of oldKeys) {
        try {
          const data = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            
            let images = [];
            if (parsed.images && Array.isArray(parsed.images)) {
              images = parsed.images;
            } else if (parsed.homepageImages?.backgroundImages) {
              images = parsed.homepageImages.backgroundImages;
            } else if (parsed.backgroundImages) {
              images = parsed.backgroundImages;
            }
            
            if (images.length > 0) {
              const validImages = images.filter(validateBase64Image);
              if (validImages.length > 0) {
                console.log(`✅ Migration depuis ${key}: ${validImages.length} images`);
                
                // Sauvegarder dans le nouveau système
                await saveImagesRobust(validImages);
                
                // Nettoyer l'ancienne clé
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
                console.log(`🗑️ Ancienne clé ${key} supprimée`);
                
                return validImages;
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erreur migration ${key}:`, error);
        }
      }
      
      console.log('📭 Aucune donnée à migrer trouvée');
      return [];
      
    } catch (error) {
      console.error('❌ Erreur migration:', error);
      return [];
    }
  };

  // Monitoring de santé du système
  const checkSystemHealth = async () => {
    try {
      // Test simple d'ouverture des bases sans sauvegarde
      const indexedDBWorking = await new Promise((resolve) => {
        const request = indexedDB.open('HomepageImagesDB', 1);
        request.onsuccess = () => {
          const db = request.result;
          const hasImagesStore = db.objectStoreNames.contains('images');
          db.close();
          resolve(hasImagesStore);
        };
        request.onerror = () => resolve(false);
      });
      
      const localStorageWorking = (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })();
      
      const sessionStorageWorking = (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })();
      
      if (indexedDBWorking && localStorageWorking && sessionStorageWorking) {
        setSystemHealth('excellent');
      } else if (localStorageWorking || sessionStorageWorking) {
        setSystemHealth('good');
      } else {
        setSystemHealth('poor');
      }
      
      console.log(`🏥 Santé du système: ${systemHealth}`);
      
    } catch (error) {
      console.error('❌ Erreur vérification santé:', error);
      setSystemHealth('poor');
    }
  };

  // Sauvegarde automatique périodique
  const startAutoSave = () => {
    const autoSaveInterval = setInterval(async () => {
      try {
        const currentImages = backgroundImagesRef.current;
        if (currentImages.length > 0) {
          await saveImagesRobust(currentImages);
          console.log('🔄 Sauvegarde automatique robuste effectuée');
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    // Vérification de santé périodique
    const healthCheckInterval = setInterval(async () => {
      await checkSystemHealth();
    }, 30 * 60 * 1000); // 30 minutes

    // Sauvegarde synchrone avant fermeture
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentImages = backgroundImagesRef.current;
        if (currentImages.length > 0) {
          saveImagesSync(currentImages);
          console.log('🔄 Sauvegarde synchrone avant masquage effectuée');
        }
      }
    };

    const handlePageHide = () => {
      const currentImages = backgroundImagesRef.current;
      if (currentImages.length > 0) {
        saveImagesSync(currentImages);
        console.log('🔄 Sauvegarde synchrone avant fermeture effectuée');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(autoSaveInterval);
      clearInterval(healthCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  };

  // Initialisation du système
  useEffect(() => {
    const initializeSystem = async () => {
      await loadImagesWithRecovery();
      await checkSystemHealth();
    };
    
    initializeSystem();
    
    // Démarrer la sauvegarde automatique
    const cleanup = startAutoSave();
    return cleanup;
  }, []);

  return {
    backgroundImages,
    isLoading,
    systemHealth,
    saveImages: saveImagesRobust,
    loadImages: loadImagesWithRecovery,
    checkSystemHealth
  };
};