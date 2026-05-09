import { useState, useEffect, useRef, useMemo } from 'react';
import { debouncedBatchSave, forceSave, saveBatchToIndexedDB, cleanupDebounce } from '../utils/bannerSaveOptimizer';
import { rollbackToVersion, getVersionHistory } from '../utils/bannerVersioning';
import { validateImageIntegrity, validateImagesBatch, detectAndRepairCorruption } from '../utils/bannerIntegrity';
import logger from '../utils/logger';
import { useAuth } from '../context/AuthContext';

const log = logger.module('useHomepageImages');

export const useHomepageImages = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState('unknown');
  const backgroundImagesRef = useRef([]);
  const lastSaveTimeRef = useRef(0); // ✅ Phase 7: Protection contre sauvegardes trop rapprochées
  const shuffledImagesRef = useRef(null); // ✅ RANDOMISATION : Cache shuffle par session
  const scopeKey = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return 'guest';
    return `user-${currentUser.id}`;
  }, [currentUser?.id, isAuthenticated]);
  const scopedType = useMemo(() => `homepage_background_${scopeKey}`, [scopeKey]);
  const scopedFallbackKey = useMemo(() => `homepage_images_fallback_${scopeKey}`, [scopeKey]);
  const scopedEmergencyKey = useMemo(() => `homepage_images_emergency_${scopeKey}`, [scopeKey]);
  const scopedSyncEmergencyKey = useMemo(() => `homepage_images_sync_emergency_${scopeKey}`, [scopeKey]);
  const scopedMetadataKey = useMemo(() => `homepage_images_metadata_${scopeKey}`, [scopeKey]);

  // Incrémenté à chaque changement de périmètre (guest ↔ utilisateur ou rechargement explicite) pour ignorer les chargements asynchrones obsolètes
  const homepageImagesLoadGenerationRef = useRef(0);
  const beginNewImagesLoadGeneration = () => {
    homepageImagesLoadGenerationRef.current += 1;
    return homepageImagesLoadGenerationRef.current;
  };
  const imagesLoadStale = (generation) =>
    generation !== homepageImagesLoadGenerationRef.current;

  // Mettre à jour la ref quand backgroundImages change
  useEffect(() => {
    backgroundImagesRef.current = backgroundImages;
  }, [backgroundImages]);

  // ✅ RANDOMISATION : Fonction shuffle optimisée (Fisher-Yates)
  const shuffleArray = (array) => {
    if (!array || array.length <= 1) return array;
    const shuffled = [...array]; // Copie pour éviter mutation
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Validation stricte des données Base64
  const validateBase64Image = (base64) => {
    if (!base64 || typeof base64 !== 'string') {
      log.warn('❌ Image invalide: pas une chaîne de caractères');
      return false;
    }
    if (!base64.startsWith('data:image/')) {
      log.warn('❌ Image invalide: ne commence pas par data:image/');
      return false;
    }
    if (base64.length < 100) {
      log.warn('❌ Image invalide: trop petite pour être une image');
      return false;
    }
    if (base64.length > 50 * 1024 * 1024) { // 50MB max
      log.warn('❌ Image invalide: trop volumineuse (>50MB)');
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

      // ✅ Phase 3: Upgrade vers version 3 pour supporter thumbnails
      // Si base existe en v1 ou v2, onupgradeneeded sera appelé automatiquement
      const request = indexedDB.open('HomepageImagesDB', 3);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        log.debug(`🔄 Mise à jour IndexedDB de v${oldVersion} à v${db.version}...`);
        
        // Vérifier et créer l'object store 'images' si nécessaire
        let imageStore;
        if (!db.objectStoreNames.contains('images')) {
          log.debug('📦 Création de l\'object store "images"...');
          imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('type', 'type', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          log.debug('✅ Object store "images" créé avec ses index');
        } else {
          log.debug('✅ Object store "images" existe déjà');
          imageStore = event.target.transaction.objectStore('images');
          
          // ✅ Créer index manquants (upgrade depuis v1)
          try {
            const indexNames = imageStore.indexNames;
            if (!indexNames.contains('type')) {
              log.debug('📦 Création index "type" manquant...');
              imageStore.createIndex('type', 'type', { unique: false });
              log.debug('✅ Index "type" créé');
            } else {
              log.debug('✅ Index "type" existe déjà');
            }
            
            if (!indexNames.contains('timestamp')) {
              log.debug('📦 Création index "timestamp" manquant...');
              imageStore.createIndex('timestamp', 'timestamp', { unique: false });
              log.debug('✅ Index "timestamp" créé');
            } else {
              log.debug('✅ Index "timestamp" existe déjà');
            }
          } catch (indexError) {
            // Peut échouer si index existe déjà ou transaction fermée, c'est OK
            log.warn('⚠️ Erreur création index (peut être normal):', indexError.message);
          }
        }
        
        // ✅ Phase 3: Migration vers v3 (ajout support thumbnails)
        if (oldVersion < 3) {
          log.debug('🔄 Migration v2 → v3: Ajout support thumbnails...');
          // Les images existantes n'auront pas de thumbnail (null), c'est OK
          // La structure est rétrocompatible (thumbnail optionnel)
          log.debug('✅ Migration v3: Structure compatible (thumbnail optionnel)');
        }
        
        log.debug('✅ IndexedDB mis à jour pour les images');
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        log.debug(`✅ IndexedDB ouvert: ${db.name} v${db.version}`);
        
        // Vérifier que l'object store existe
        if (!db.objectStoreNames.contains('images')) {
          log.error('❌ Object store "images" manquant après ouverture');
          db.close();
          reject(new Error('Object store "images" manquant'));
          return;
        }
        
        resolve(db);
      };
      
      request.onerror = (event) => {
        log.error('❌ Erreur ouverture IndexedDB:', event.target.error);
        
        // En cas d'erreur (ex: VersionError si déjà ouverte ailleurs), fallback
        if (event.target.error.name === 'VersionError') {
          log.warn('⚠️ VersionError détectée, tentative réouverture...');
          // Essayer de réouvrir sans spécifier version
          const fallbackRequest = indexedDB.open('HomepageImagesDB');
          fallbackRequest.onsuccess = (e) => {
            const db = e.target.result;
            log.debug(`✅ IndexedDB réouvert: ${db.name} v${db.version}`);
            resolve(db);
          };
          fallbackRequest.onerror = () => reject(event.target.error);
        } else {
          reject(event.target.error);
        }
      };
      
      request.onblocked = () => {
        log.warn('⚠️ IndexedDB bloqué - fermez les autres onglets et rafraîchissez');
        // Attendre un peu puis réessayer
        setTimeout(() => {
          const retryRequest = indexedDB.open('HomepageImagesDB', 3);
          retryRequest.onsuccess = (e) => resolve(e.target.result);
          retryRequest.onerror = () => reject(new Error('IndexedDB bloqué'));
        }, 1000);
      };
    });
  };

  // ✅ Phase 6: Sauvegarde optimisée dans IndexedDB (batch write)
  // ✅ Phase 4: Avec versioning optionnel
  const saveImagesToIndexedDB = async (images, options = {}) => {
    try {
      log.debug('💾 Sauvegarde niveau 1: IndexedDB (batch optimisé)...', options);
      
      const db = await openDB();
      
      // ✅ Phase 6: Utiliser batch write optimisé (une transaction)
      // ✅ Phase 4: Passer options pour versioning
      const success = await saveBatchToIndexedDB(db, images, {
        enableVersioning: options.enableVersioning || false,
        action: options.action || 'upload',
        existingImages: options.existingImages || backgroundImagesRef.current,
        storageType: scopedType
      });
      
      if (success) {
        log.debug('✅ Sauvegarde batch IndexedDB réussie');
      }
      
      return success;
      
    } catch (error) {
      log.error('❌ Erreur sauvegarde IndexedDB', error);
      return false;
    }
  };

  // Sauvegarde dans localStorage (niveau 2)
  const saveImagesToLocalStorage = async (images) => {
    try {
      log.debug('💾 Sauvegarde niveau 2: localStorage...');
      
      const data = {
        images: images,
        timestamp: new Date().toISOString(),
        version: '2.0',
        storage: 'localStorage_fallback',
        quality: 'maximum'
      };
      
      localStorage.setItem(scopedFallbackKey, JSON.stringify(data));
      log.debug('✅ Sauvegarde localStorage réussie');
      return true;
      
    } catch (error) {
      log.error('❌ Erreur sauvegarde localStorage:', error);
      return false;
    }
  };

  // Sauvegarde dans sessionStorage (niveau 3)
  const saveImagesToSessionStorage = async (images) => {
    try {
      log.debug('💾 Sauvegarde niveau 3: sessionStorage...');
      
      const data = {
        images: images,
        timestamp: new Date().toISOString(),
        version: '2.0',
        storage: 'sessionStorage_emergency',
        quality: 'maximum'
      };
      
      sessionStorage.setItem(scopedEmergencyKey, JSON.stringify(data));
      log.debug('✅ Sauvegarde sessionStorage réussie');
      return true;
      
    } catch (error) {
      log.error('❌ Erreur sauvegarde sessionStorage:', error);
      return false;
    }
  };

  // Sauvegarde synchrone intelligente (métadonnées seulement si IndexedDB fonctionne)
  // ✅ Phase 6: Sauvegarde synchrone avec force save (bypass debounce)
  const saveImagesSync = async (images) => {
    try {
      // Force save : sauvegarder immédiatement (bypass debounce)
      await forceSave(images, async (imagesToSave) => {
        await executeSaveImagesRobust(imagesToSave);
      });
      log.debug('✅ Sauvegarde synchrone forcée');
    } catch (error) {
      log.error('❌ Erreur sauvegarde synchrone', error);
      // Fallback : sauvegarde localStorage directe
      try {
        const data = {
          images: images.slice(0, 3), // Limiter à 3 images max pour l'urgence
          timestamp: new Date().toISOString(),
          version: '3.0', // ✅ Phase 6: Version 3.0
          storage: 'sync_emergency_limited'
        };
        
        try {
          localStorage.setItem(scopedSyncEmergencyKey, JSON.stringify(data));
          log.debug('✅ Sauvegarde d\'urgence limitée effectuée');
        } catch (fallbackError) {
          log.error('❌ Erreur sauvegarde d\'urgence:', fallbackError);
        }
      } catch (fallbackError) {
        log.error('❌ Erreur fallback localStorage:', fallbackError);
      }
      
      return false;
    }
  };

  // Sauvegarde intelligente IndexedDB-first avec fallback léger
  // ✅ Phase 6: Fonction interne pour exécuter la sauvegarde effective
  // ✅ Phase 4: Avec support versioning optionnel
  const executeSaveImagesRobust = async (validImages, saveOptions = {}) => {
    try {
      // Sauvegarde niveau 1: IndexedDB (PRINCIPAL)
      // ✅ Phase 4: Passer options versioning
      const indexedDBSuccess = await saveImagesToIndexedDB(validImages, saveOptions);
      
      if (indexedDBSuccess) {
        // IndexedDB fonctionne → Sauvegarde légère des métadonnées seulement
        try {
          const metadata = {
            count: validImages.length,
            timestamp: new Date().toISOString(),
            version: '3.0', // ✅ Phase 6: Version 3.0
            storage: 'indexeddb_primary'
          };
          localStorage.setItem(scopedMetadataKey, JSON.stringify(metadata));
          log.debug('✅ Métadonnées sauvegardées dans localStorage');
        } catch (error) {
          log.warn('⚠️ Impossible de sauvegarder les métadonnées:', error);
        }
        
        setSystemHealth('excellent');
        // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT pour éviter race condition
        backgroundImagesRef.current = validImages;
        lastSaveTimeRef.current = Date.now(); // ✅ Phase 7: Enregistrer timestamp de sauvegarde
        setBackgroundImages(validImages);
        log.debug(`🎉 ${validImages.length} images sauvegardées dans IndexedDB avec succès`);
        return;
      }
      
      // IndexedDB échoué → Fallback localStorage (images complètes)
      log.debug('⚠️ IndexedDB échoué, fallback localStorage...');
      const localStorageSuccess = await saveImagesToLocalStorage(validImages);
      
      if (localStorageSuccess) {
        setSystemHealth('good');
        // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT pour éviter race condition
        backgroundImagesRef.current = validImages;
        lastSaveTimeRef.current = Date.now(); // ✅ Phase 7: Enregistrer timestamp de sauvegarde
        setBackgroundImages(validImages);
        log.debug(`🎉 ${validImages.length} images sauvegardées dans localStorage (fallback)`);
        return;
      }
      
      // localStorage échoué → Fallback sessionStorage (images complètes)
      log.debug('⚠️ localStorage échoué, fallback sessionStorage...');
      const sessionStorageSuccess = await saveImagesToSessionStorage(validImages);
      
      if (sessionStorageSuccess) {
        setSystemHealth('good');
        // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT pour éviter race condition
        backgroundImagesRef.current = validImages;
        lastSaveTimeRef.current = Date.now(); // ✅ Phase 7: Enregistrer timestamp de sauvegarde
        setBackgroundImages(validImages);
        log.debug(`🎉 ${validImages.length} images sauvegardées dans sessionStorage (fallback)`);
        return;
      }
      
      // Tous les systèmes ont échoué
      setSystemHealth('poor');
      throw new Error('Tous les systèmes de stockage ont échoué');
      
    } catch (error) {
      log.error('❌ Erreur sauvegarde robuste', error);
      setSystemHealth('poor');
      throw error;
    }
  };
  
  // ✅ Phase 6: Sauvegarde intelligente avec debouncing et batch write
  // ✅ Phase 4: Avec support versioning optionnel
  const saveImagesRobust = async (images, options = {}) => {
    const { 
      force = false,
      enableVersioning = false,
      action = 'upload'
    } = options;
    
    try {
      log.debug('💾 Sauvegarde intelligente IndexedDB-first...', { force, imageCount: images.length });
      
      // ✅ Phase 7: Valider images (support v2 string et v3 objet)
      const validImages = images.filter(img => {
        // Format v2 (string)
        if (typeof img === 'string') {
          return validateBase64Image(img);
        }
        // Format v3 (objet avec full)
        if (typeof img === 'object' && img !== null && img.full) {
          return validateBase64Image(img.full);
        }
        return false;
      });
      
      if (validImages.length !== images.length) {
        log.warn(`⚠️ ${images.length - validImages.length} images invalides supprimées`);
      }
      
      // ✅ Phase 7: Permettre tableau vide (pour supprimer toutes les images)
      if (validImages.length === 0 && images.length > 0) {
        // Si on avait des images mais qu'elles sont toutes invalides, c'est une erreur
        throw new Error('Aucune image valide à sauvegarder');
      }
      // Si images.length === 0, c'est OK (suppression de toutes les images)
      
      // ✅ Phase 6: Utiliser debounced batch save (sauf si force)
      // ✅ Phase 4: Passer options versioning
      if (!force) {
        await debouncedBatchSave(
          validImages, 
          (imgs) => executeSaveImagesRobust(imgs, { enableVersioning, action }),
          {
            delay: 30000, // 30s debounce
            maxDelay: 120000, // 2min max
            force: false
          }
        );
        return; // Sauvegarde programmée, sortir
      }
      
      // Force : sauvegarder immédiatement
      await executeSaveImagesRobust(validImages, { enableVersioning, action });
      
    } catch (error) {
      log.error('❌ Erreur sauvegarde intelligente', error);
      setSystemHealth('poor');
      throw error;
    }
  };

  // Chargement depuis IndexedDB (niveau 1)
  const loadImagesFromIndexedDB = async () => {
    try {
      log.debug('🔍 Chargement niveau 1: IndexedDB...');
      
      const db = await openDB();
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      
      // ✅ FIX: Vérifier si index existe, sinon utiliser fallback avec getAll()
      let images = [];
      
      try {
        // Essayer d'utiliser l'index si disponible
        const index = store.index('type');
        const request = index.getAll(IDBKeyRange.only(scopedType));
        
        images = await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const results = event.target.result;
            
            // ✅ OPTIMISATION : Déplacer TOUT le traitement hors du handler pour éviter violation performance
            // Le handler onsuccess doit être <50ms, donc on déplace le traitement vers setTimeout
            if (results && results.length > 0) {
              // ✅ SOLUTION 2 : Optimisation requestIdleCallback avec chunking
              // Diviser traitement en chunks pour éviter violations performance (>500ms)
              const processImagesChunked = async () => {
                // ✅ Phase 3: Charger images (format v3 avec thumbnail ou v2 string)
                const sortedImages = results
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map(item => {
                    // Format v3 : retourner objet { full, thumbnail }, Format v2 : retourner string
                    if (item.version === '3.0' && item.thumbnail) {
                      return {
                        full: item.data,
                        thumbnail: item.thumbnail,
                        format: item.format,
                        metadata: item.metadata
                      };
                    }
                    // Format v2 ou v3 sans thumbnail : retourner string (compatibilité)
                    return item.data;
                  })
                  .filter(img => {
                    // Valider : string Base64 ou objet avec full Base64
                    if (typeof img === 'string') {
                      return validateBase64Image(img);
                    }
                    return img && img.full && validateBase64Image(img.full);
                  });
                
                // ✅ Phase 5: Validation intégrité optionnelle avec chunking
                // Diviser en chunks de 5 images max pour éviter violations performance
                const CHUNK_SIZE = 5; // Traiter 5 images par chunk
                const CHUNK_TIME = 50; // Max 50ms par chunk
                const chunks = [];
                
                for (let i = 0; i < sortedImages.length; i += CHUNK_SIZE) {
                  chunks.push(sortedImages.slice(i, i + CHUNK_SIZE));
                }
                
                const processed = [];
                
                // Traiter chunks avec yielding entre chaque
                for (const chunk of chunks) {
                  const chunkStart = performance.now();
                  
                  // Traiter chunk (validation rapide sans checksum ni test load)
                  const chunkResults = await Promise.all(
                    chunk.map(async (img) => {
                      try {
                        const validation = await validateImageIntegrity(img, {
                          checkChecksum: false, // Skip checksum pour performance
                          testLoad: false // Skip test load pour performance (fait par navigateur)
                        });
                        return validation.valid ? img : null;
                      } catch (error) {
                        log.warn('⚠️ Erreur validation image (non bloquant)', error);
                        return img; // Fallback gracieux
                      }
                    })
                  );
                  
                  processed.push(...chunkResults.filter(img => img !== null));
                  
                  // ✅ OPTIMISATION : Yielding plus agressif pour éviter violations (>100ms)
                  // Yielding même si chunk < 50ms pour garantir <100ms total
                  const chunkTime = performance.now() - chunkStart;
                  await new Promise(resolve => {
                    if (window.requestIdleCallback) {
                      requestIdleCallback(() => resolve(), { timeout: 10 });
                    } else {
                      // Utiliser setTimeout avec délai minimal (0ms = prochain tick)
                      setTimeout(() => resolve(), 0);
                    }
                  });
                }
                
                if (processed.length < sortedImages.length) {
                  log.warn(`⚠️ ${sortedImages.length - processed.length} images invalides filtrées`);
                }
                
                log.debug(`✅ ${processed.length} images chargées depuis IndexedDB (avec index)`);
                resolve(processed);
              };
              
              // ✅ OPTIMISATION : Démarrer traitement chunké de manière non-bloquante
              // Utiliser setTimeout avec délai pour laisser le navigateur initialiser
              setTimeout(() => {
                if (window.requestIdleCallback) {
                  requestIdleCallback(processImagesChunked, { timeout: 1000 });
                } else {
                  processImagesChunked();
                }
              }, 0); // Déferrer même avec 0ms pour laisser navigateur initialiser
            } else {
              log.debug('📭 Aucune image trouvée dans IndexedDB');
              resolve([]);
            }
          };
          
          request.onerror = (event) => {
            log.error('❌ Erreur chargement IndexedDB avec index:', event.target.error);
            reject(event.target.error);
          };
        });
      } catch (indexError) {
        // ✅ FALLBACK: Index n'existe pas, utiliser getAll() et filtrer manuellement
        log.warn('⚠️ Index "type" non disponible, utilisation fallback getAll()');
        
        const request = store.getAll();
        
        images = await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            const allResults = event.target.result;
            
            // Filtrer manuellement par type
            const filteredResults = allResults.filter(item => item.type === scopedType);
            
            if (filteredResults.length > 0) {
              // ✅ Phase 3: Charger images (format v3 avec thumbnail ou v2 string)
              const sortedImages = filteredResults
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(item => {
                  // Format v3 : retourner objet { full, thumbnail }, Format v2 : retourner string
                  if (item.version === '3.0' && item.thumbnail) {
                    return {
                      full: item.data,
                      thumbnail: item.thumbnail,
                      format: item.format,
                      metadata: item.metadata
                    };
                  }
                  // Format v2 ou v3 sans thumbnail : retourner string (compatibilité)
                  return item.data;
                })
                .filter(img => {
                  // Valider : string Base64 ou objet avec full Base64
                  if (typeof img === 'string') {
                    return validateBase64Image(img);
                  }
                  return img && img.full && validateBase64Image(img.full);
                });
              
              // ✅ Phase 5: Validation intégrité optionnelle (non bloquant pour performance)
              // Note: Utiliser .then() car onsuccess n'est pas async
              Promise.all(
                sortedImages.map(async (img) => {
                  try {
                    const validation = await validateImageIntegrity(img, {
                      checkChecksum: false,
                      testLoad: false
                    });
                    
                    if (!validation.valid) {
                      log.warn('⚠️ Image invalide détectée', validation.error);
                      return null;
                    }
                    
                    return img;
                  } catch (error) {
                    log.warn('⚠️ Erreur validation image (non bloquant)', error);
                    return img;
                  }
                })
              ).then((validatedImages) => {
                const finalImages = validatedImages.filter(img => img !== null);
                
                if (finalImages.length < sortedImages.length) {
                  log.warn(`⚠️ ${sortedImages.length - finalImages.length} images invalides filtrées`);
                }
                
                log.debug(`✅ ${finalImages.length} images chargées depuis IndexedDB (fallback)`);
                resolve(finalImages);
              }).catch((error) => {
                log.warn('⚠️ Erreur validation batch (non bloquant), utiliser images non validées', error);
                // En cas d'erreur, utiliser images non validées (fallback gracieux)
                resolve(sortedImages);
              });
            } else {
              log.debug('📭 Aucune image trouvée dans IndexedDB');
              resolve([]);
            }
          };
          
          request.onerror = (event) => {
            log.error('❌ Erreur chargement IndexedDB (fallback):', event.target.error);
            reject(event.target.error);
          };
        });
      }
      
      return images;
      
    } catch (error) {
      log.error('❌ Erreur chargement IndexedDB:', error);
      return [];
    }
  };

  // Chargement depuis localStorage (niveau 2)
  const loadImagesFromLocalStorage = async () => {
    try {
      log.debug('🔍 Chargement niveau 2: localStorage...');
      
      const data = localStorage.getItem(scopedFallbackKey);
      if (!data) {
        log.debug('📭 Aucune donnée dans localStorage');
        return [];
      }
      
      const parsed = JSON.parse(data);
      if (parsed.images && Array.isArray(parsed.images)) {
        // ✅ Phase 7: Valider images (support v2 string et v3 objet)
        const validImages = parsed.images.filter(img => {
          if (typeof img === 'string') {
            return validateBase64Image(img);
          }
          if (typeof img === 'object' && img !== null && img.full) {
            return validateBase64Image(img.full);
          }
          return false;
        });
        log.debug(`✅ ${validImages.length} images chargées depuis localStorage`);
        return validImages;
      }
      
      return [];
      
    } catch (error) {
      log.error('❌ Erreur chargement localStorage:', error);
      return [];
    }
  };

  // Chargement depuis sessionStorage (niveau 3)
  const loadImagesFromSessionStorage = async () => {
    try {
      log.debug('🔍 Chargement niveau 3: sessionStorage...');
      
      const data = sessionStorage.getItem(scopedEmergencyKey);
      if (!data) {
        log.debug('📭 Aucune donnée dans sessionStorage');
        return [];
      }
      
      const parsed = JSON.parse(data);
      if (parsed.images && Array.isArray(parsed.images)) {
        // ✅ Phase 7: Valider images (support v2 string et v3 objet)
        const validImages = parsed.images.filter(img => {
          if (typeof img === 'string') {
            return validateBase64Image(img);
          }
          if (typeof img === 'object' && img !== null && img.full) {
            return validateBase64Image(img.full);
          }
          return false;
        });
        log.debug(`✅ ${validImages.length} images chargées depuis sessionStorage`);
        return validImages;
      }
      
      return [];
      
    } catch (error) {
      log.error('❌ Erreur chargement sessionStorage:', error);
      return [];
    }
  };

  // Chargement avec récupération automatique
  const loadImagesWithRecovery = async (generation) => {
    try {
      log.debug('🔍 Chargement avec récupération automatique...');
      setIsLoading(true);
      
      // 1. Essayer IndexedDB
      let images = await loadImagesFromIndexedDB();
      if (imagesLoadStale(generation)) {
        log.debug('⏭️ Chargement images annulé (périmètre ou utilisateur changé)');
        return;
      }
      if (images.length > 0) {
        log.debug('✅ Images récupérées depuis IndexedDB');
        setSystemHealth('excellent');
        
        // ✅ RANDOMISATION : Shuffle une seule fois par session (cache dans ref)
        if (!shuffledImagesRef.current || shuffledImagesRef.current.length !== images.length) {
          shuffledImagesRef.current = images.length > 1 ? shuffleArray(images) : images;
          log.debug(`🎲 Images mélangées (${shuffledImagesRef.current.length} images)`);
        }
        
        // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT lors du chargement
        backgroundImagesRef.current = shuffledImagesRef.current;
        setBackgroundImages(shuffledImagesRef.current);
        setIsLoading(false);
        return;
      }
      
      // 2. Essayer localStorage fallback
      images = await loadImagesFromLocalStorage();
      if (imagesLoadStale(generation)) return;
      if (images.length > 0) {
        log.debug('✅ Images récupérées depuis localStorage, migration vers IndexedDB...');
        
        // ✅ Phase 7: Valider images avant migration
        try {
          const validation = await validateImagesBatch(images, {
            checkChecksum: false, // Skip pour performance
            testLoad: false // Skip pour performance
          });
          
          if (validation.invalid.length > 0) {
            log.warn(`⚠️ ${validation.invalid.length} images invalides détectées, filtrage...`);
            images = validation.valid; // Utiliser seulement images valides
          }
        } catch (validationError) {
          log.warn('⚠️ Erreur validation avant migration (non bloquant)', validationError);
        }
        
        if (imagesLoadStale(generation)) return;
        if (images.length > 0) {
          setSystemHealth('good');
          
          // ✅ RANDOMISATION : Shuffle une seule fois par session (cache dans ref)
          if (!shuffledImagesRef.current || shuffledImagesRef.current.length !== images.length) {
            shuffledImagesRef.current = images.length > 1 ? shuffleArray(images) : images;
            log.debug(`🎲 Images mélangées depuis localStorage (${shuffledImagesRef.current.length} images)`);
          }
          
          // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT lors du chargement
          backgroundImagesRef.current = shuffledImagesRef.current;
          setBackgroundImages(shuffledImagesRef.current);
          
          // ✅ Phase 7: Migrer vers IndexedDB avec validation après migration
          setTimeout(async () => {
            try {
              if (imagesLoadStale(generation)) return;
              await saveImagesToIndexedDB(images);
              
              // ✅ Phase 7: Valider après migration
              const postMigrationImages = await loadImagesFromIndexedDB();
              if (imagesLoadStale(generation)) return;
              if (postMigrationImages.length === images.length) {
                log.debug('✅ Migration vers IndexedDB réussie et validée');
                setSystemHealth('excellent');
              } else {
                log.warn(`⚠️ Migration partielle: ${postMigrationImages.length}/${images.length} images migrées`);
                setSystemHealth('good');
              }
            } catch (error) {
              log.warn('⚠️ Migration vers IndexedDB échouée', error);
            }
          }, 1000);
        }
        
        setIsLoading(false);
        return;
      }
      
      if (imagesLoadStale(generation)) return;
      
      // 3. Essayer sessionStorage emergency
      images = await loadImagesFromSessionStorage();
      if (imagesLoadStale(generation)) return;
      if (images.length > 0) {
        log.debug('✅ Images récupérées depuis sessionStorage, migration vers IndexedDB...');
        
        // ✅ Phase 7: Valider images avant migration
        try {
          const validation = await validateImagesBatch(images, {
            checkChecksum: false,
            testLoad: false
          });
          
          if (validation.invalid.length > 0) {
            log.warn(`⚠️ ${validation.invalid.length} images invalides détectées, filtrage...`);
            images = validation.valid;
          }
        } catch (validationError) {
          log.warn('⚠️ Erreur validation avant migration (non bloquant)', validationError);
        }
        
        if (imagesLoadStale(generation)) return;
        if (images.length > 0) {
          setSystemHealth('good');
          
          // ✅ RANDOMISATION : Shuffle une seule fois par session (cache dans ref)
          if (!shuffledImagesRef.current || shuffledImagesRef.current.length !== images.length) {
            shuffledImagesRef.current = images.length > 1 ? shuffleArray(images) : images;
            log.debug(`🎲 Images mélangées depuis sessionStorage (${shuffledImagesRef.current.length} images)`);
          }
          
          // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT lors du chargement
          backgroundImagesRef.current = shuffledImagesRef.current;
          setBackgroundImages(shuffledImagesRef.current);
          
          // ✅ Phase 7: Migrer vers IndexedDB et localStorage avec validation
          setTimeout(async () => {
            try {
              if (imagesLoadStale(generation)) return;
              await saveImagesToIndexedDB(images);
              await saveImagesToLocalStorage(images);
              
              // ✅ Phase 7: Valider après migration
              const postMigrationImages = await loadImagesFromIndexedDB();
              if (imagesLoadStale(generation)) return;
              if (postMigrationImages.length === images.length) {
                log.debug('✅ Migration vers IndexedDB et localStorage réussie et validée');
                setSystemHealth('excellent');
              } else {
                log.warn(`⚠️ Migration partielle: ${postMigrationImages.length}/${images.length} images migrées`);
                setSystemHealth('good');
              }
            } catch (error) {
              log.warn('⚠️ Migration échouée', error);
            }
          }, 1000);
        }
        
        setIsLoading(false);
        return;
      }
      
      if (imagesLoadStale(generation)) return;
      
      // 4. Essayer les anciennes clés (migration)
      images = await migrateFromOldSystem();
      if (imagesLoadStale(generation)) return;
      if (images.length > 0) {
        log.debug('✅ Images récupérées depuis ancien système');
        
        // ✅ Phase 7: Valider images avant utilisation
        try {
          const validation = await validateImagesBatch(images, {
            checkChecksum: false,
            testLoad: false
          });
          
          if (validation.invalid.length > 0) {
            log.warn(`⚠️ ${validation.invalid.length} images invalides détectées, filtrage...`);
            images = validation.valid;
          }
        } catch (validationError) {
          log.warn('⚠️ Erreur validation après migration ancien système (non bloquant)', validationError);
        }
        
        if (imagesLoadStale(generation)) return;
        if (images.length > 0) {
          // ✅ RANDOMISATION : Shuffle une seule fois par session (cache dans ref)
          if (!shuffledImagesRef.current || shuffledImagesRef.current.length !== images.length) {
            shuffledImagesRef.current = images.length > 1 ? shuffleArray(images) : images;
            log.debug(`🎲 Images mélangées depuis ancien système (${shuffledImagesRef.current.length} images)`);
          }
          
          // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT lors du chargement
          backgroundImagesRef.current = shuffledImagesRef.current;
          setBackgroundImages(shuffledImagesRef.current);
          setSystemHealth('good');
        }
        
        setIsLoading(false);
        return;
      }
      
      // 5. Aucune image trouvée
      log.debug('📭 Aucune image trouvée dans tous les systèmes');
      if (!imagesLoadStale(generation)) {
        // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT
        backgroundImagesRef.current = [];
        setBackgroundImages([]);
        setSystemHealth('unknown');
      }
      setIsLoading(false);
      
    } catch (error) {
      log.error('❌ Erreur lors du chargement avec récupération:', error);
      if (!imagesLoadStale(generation)) {
        // ✅ Phase 7: Mettre à jour la ref IMMÉDIATEMENT
        backgroundImagesRef.current = [];
        setBackgroundImages([]);
        setSystemHealth('poor');
      }
      setIsLoading(false);
    }
  };

  // Migration depuis l'ancien système
  const migrateFromOldSystem = async () => {
    try {
      log.debug('🔄 Tentative de migration depuis l\'ancien système...');
      
      const oldKeys = [
        'homepage_images_primary',
        'homepage_images_backup',
        'homepage_images_session',
        scopedSyncEmergencyKey
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
                log.debug(`✅ Migration depuis ${key}: ${validImages.length} images`);
                
                // Sauvegarder dans le nouveau système
                await saveImagesRobust(validImages);
                
                // Nettoyer l'ancienne clé
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
                log.debug(`🗑️ Ancienne clé ${key} supprimée`);
                
                return validImages;
              }
            }
          }
        } catch (error) {
          log.warn(`⚠️ Erreur migration ${key}:`, error);
        }
      }
      
      log.debug('📭 Aucune donnée à migrer trouvée');
      return [];
      
    } catch (error) {
      log.error('❌ Erreur migration:', error);
      return [];
    }
  };

  // Monitoring de santé du système
  const checkSystemHealth = async () => {
    try {
      // ✅ FIX: Utiliser openDB() pour garantir version avec index
      const indexedDBWorking = await openDB().then((db) => {
        const hasImagesStore = db.objectStoreNames.contains('images');
        db.close();
        return hasImagesStore;
      }).catch(() => false);
      
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
      
      log.debug(`🏥 Santé du système: ${systemHealth}`);
      
    } catch (error) {
      log.error('❌ Erreur vérification santé:', error);
      setSystemHealth('poor');
    }
  };

  // Sauvegarde automatique périodique
  const startAutoSave = () => {
    const autoSaveInterval = setInterval(async () => {
      try {
        const currentImages = backgroundImagesRef.current;
        const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
        // ✅ Phase 7: Éviter sauvegarde si une sauvegarde vient d'être effectuée (< 5 secondes)
        if (currentImages.length > 0 && timeSinceLastSave > 5000) {
          // ✅ Phase 6: Sauvegarde automatique avec force (bypass debounce)
          await saveImagesRobust(currentImages, { force: true });
          log.debug('🔄 Sauvegarde automatique robuste effectuée');
        } else if (timeSinceLastSave <= 5000) {
          log.debug('⏭️ Sauvegarde récente, skip sauvegarde automatique périodique');
        }
      } catch (error) {
        log.error('❌ Erreur sauvegarde automatique', error);
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
        const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
        // ✅ Phase 7: Éviter sauvegarde si une sauvegarde vient d'être effectuée (< 2 secondes)
        if (currentImages.length > 0 && timeSinceLastSave > 2000) {
          saveImagesSync(currentImages);
          log.debug('🔄 Sauvegarde synchrone avant masquage effectuée');
        } else if (timeSinceLastSave <= 2000) {
          log.debug('⏭️ Sauvegarde récente, skip sauvegarde automatique');
        }
      }
    };

    const handlePageHide = () => {
      const currentImages = backgroundImagesRef.current;
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      // ✅ Phase 7: Éviter sauvegarde si une sauvegarde vient d'être effectuée (< 2 secondes)
      if (currentImages.length > 0 && timeSinceLastSave > 2000) {
        saveImagesSync(currentImages);
        log.debug('🔄 Sauvegarde synchrone avant fermeture effectuée');
      } else if (timeSinceLastSave <= 2000) {
        log.debug('⏭️ Sauvegarde récente, skip sauvegarde automatique');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // ✅ Phase 6: Cleanup debounce et sauvegarde forcée avant démontage
      cleanupDebounce();
      
      clearInterval(autoSaveInterval);
      clearInterval(healthCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      
      // Sauvegarder avant démontage (force save)
      const currentImages = backgroundImagesRef.current;
      const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
      const currentCount = currentImages.length;
      
      // ✅ Phase 7: Ne pas sauvegarder si ref vide (composant qui se démonte sans images chargées)
      if (currentCount === 0) {
        // C'est normal si la ref est vide lors du démontage (composant qui n'a pas chargé les images)
        // Pas besoin de sauvegarder ou d'afficher de warning
        return;
      }
      
      // ✅ Phase 7: Éviter sauvegarde si une sauvegarde vient d'être effectuée (< 2 secondes)
      if (timeSinceLastSave <= 2000) {
        log.debug('⏭️ Sauvegarde récente, skip sauvegarde avant démontage');
        return;
      }
      
      // ✅ Phase 7: Vérifier que le nombre d'images correspond (protection contre écrasement)
      let savedCount = 0;
      try {
        const metadata = JSON.parse(localStorage.getItem(scopedMetadataKey) || '{}');
        savedCount = metadata.count || 0;
      } catch (e) {
        // Ignorer erreur parsing
      }
      
      // Si le nombre correspond, sauvegarder
      if (currentCount === savedCount) {
        saveImagesSync(currentImages);
        log.debug('🔄 Sauvegarde synchrone avant démontage effectuée');
      } else {
        // ⚠️ Nombre incohérent : ne pas sauvegarder pour éviter écrasement
        // Mais seulement afficher warning si currentCount > 0 (sinon c'est normal)
        if (currentCount > 0) {
          log.warn(`⏭️ Nombre d'images incohérent (ref: ${currentCount}, sauvegardé: ${savedCount}), skip sauvegarde avant démontage`);
        }
      }
    };
  };

  // Recharge depuis le stockage (IndexedDB / fallbacks) pour le périmètre courant
  const reloadImagesFromStorage = async () => {
    const gen = beginNewImagesLoadGeneration();
    shuffledImagesRef.current = null;
    await loadImagesWithRecovery(gen);
    if (imagesLoadStale(gen)) return;
    await checkSystemHealth();
  };

  // Initialisation + rechargement quand l’utilisateur (ou invité) change
  useEffect(() => {
    const gen = beginNewImagesLoadGeneration();
    shuffledImagesRef.current = null;

    const initializeSystem = async () => {
      await loadImagesWithRecovery(gen);
      if (imagesLoadStale(gen)) return;
      await checkSystemHealth();
    };

    initializeSystem();

    const cleanup = startAutoSave();
    return () => {
      cleanup();
    };
  }, [scopedEmergencyKey, scopedFallbackKey, scopedMetadataKey, scopedSyncEmergencyKey, scopedType]);

  // ✅ Phase 7: Fonction pour mettre à jour la ref directement (pour éviter race condition)
  const updateImagesRef = (images) => {
    backgroundImagesRef.current = images;
    lastSaveTimeRef.current = Date.now();
  };

  return {
    backgroundImages,
    isLoading,
    systemHealth,
    saveImages: saveImagesRobust,
    loadImages: reloadImagesFromStorage,
    updateImagesRef, // ✅ Phase 7: Exposer fonction pour mettre à jour la ref
    checkSystemHealth
  };
};