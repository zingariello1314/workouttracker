import { useState, useEffect, useRef } from 'react';

export const useHomepageImages = () => {
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const backgroundImagesRef = useRef([]);

  // Mettre à jour la ref quand backgroundImages change
  useEffect(() => {
    backgroundImagesRef.current = backgroundImages;
  }, [backgroundImages]);

  // Fonction pour compresser les images avant sauvegarde
  const compressImage = (base64String, maxWidth = 1920, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en base64 avec compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => resolve(base64String); // En cas d'erreur, retourner l'original
      img.src = base64String;
    });
  };

  // Fonction pour nettoyer le localStorage
  const cleanupLocalStorage = () => {
    try {
      // Nettoyer les anciennes clés
      const keysToClean = [
        'homepage_backgroundImages_backup',
        'homepage_bannerImages_backup',
        'homepage_images_backup_old',
        'workoutData_backup'
      ];
      
      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`⚠️ Impossible de nettoyer ${key}:`, error);
        }
      });
      
      console.log('🧹 Nettoyage localStorage effectué');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage:', error);
    }
  };

  // Clés de stockage simplifiées et fiables
  const STORAGE_KEYS = {
    primary: 'homepage_images_primary',
    backup: 'homepage_images_backup',
    session: 'homepage_images_session'
  };

  // Système de sauvegarde simplifié et ultra-fiable
  const saveImagesSimple = async (images) => {
    try {
      // Compresser les images pour économiser l'espace
      console.log('🗜️ Compression des images...');
      const compressedImages = await Promise.all(
        images.map(img => compressImage(img, 1920, 0.8))
      );
      
      const imageData = {
        images: compressedImages,
        timestamp: new Date().toISOString(),
        version: '2.0',
        compressed: true
      };

      // Nettoyer le localStorage avant sauvegarde
      cleanupLocalStorage();

      // Sauvegarde principale (localStorage)
      try {
        localStorage.setItem(STORAGE_KEYS.primary, JSON.stringify(imageData));
      } catch (quotaError) {
        console.warn('⚠️ localStorage plein, nettoyage et retry...');
        cleanupLocalStorage();
        localStorage.setItem(STORAGE_KEYS.primary, JSON.stringify(imageData));
      }
      
      // Sauvegarde de secours (localStorage avec clé différente)
      try {
        localStorage.setItem(STORAGE_KEYS.backup, JSON.stringify(imageData));
      } catch (quotaError) {
        console.warn('⚠️ Sauvegarde de secours échouée:', quotaError);
      }
      
      // Sauvegarde de session (sessionStorage)
      try {
        sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(imageData));
      } catch (quotaError) {
        console.warn('⚠️ sessionStorage plein:', quotaError);
      }
      
      console.log(`✅ Images sauvegardées: ${compressedImages.length} images (compressées)`);
      setBackgroundImages(compressedImages);
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      // En cas d'erreur, essayer de sauvegarder seulement les métadonnées
      try {
        const minimalData = {
          images: [],
          timestamp: new Date().toISOString(),
          version: '2.0',
          error: 'Images trop volumineuses'
        };
        localStorage.setItem(STORAGE_KEYS.primary, JSON.stringify(minimalData));
        console.log('⚠️ Sauvegarde minimale effectuée');
      } catch (minimalError) {
        console.error('❌ Impossible de sauvegarder même les métadonnées:', minimalError);
      }
      
      throw error;
    }
  };

  // Charger les images depuis tous les niveaux de sauvegarde
  const loadImages = async () => {
    try {
      console.log('🔍 Chargement des images...');
      
      // Essayer de charger depuis localStorage principal
      let images = null;
      
      // 1. Essayer la sauvegarde principale
      try {
        const primaryData = localStorage.getItem(STORAGE_KEYS.primary);
        if (primaryData) {
          const parsed = JSON.parse(primaryData);
          if (parsed.images && parsed.images.length > 0) {
            images = parsed.images;
            console.log(`✅ Chargé depuis sauvegarde principale: ${images.length} images`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur sauvegarde principale:', error);
      }
      
      // 2. Si pas d'images, essayer la sauvegarde de secours
      if (!images) {
        try {
          const backupData = localStorage.getItem(STORAGE_KEYS.backup);
          if (backupData) {
            const parsed = JSON.parse(backupData);
            if (parsed.images && parsed.images.length > 0) {
              images = parsed.images;
              console.log(`✅ Chargé depuis sauvegarde de secours: ${images.length} images`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur sauvegarde de secours:', error);
        }
      }
      
      // 3. Si toujours pas d'images, essayer sessionStorage
      if (!images) {
        try {
          const sessionData = sessionStorage.getItem(STORAGE_KEYS.session);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            if (parsed.images && parsed.images.length > 0) {
              images = parsed.images;
              console.log(`✅ Chargé depuis sessionStorage: ${images.length} images`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur sessionStorage:', error);
        }
      }
      
      // 4. Si toujours pas d'images, essayer l'ancien système (migration unique)
      if (!images) {
        try {
          const oldData = localStorage.getItem('workoutData_backup');
          if (oldData) {
            const parsed = JSON.parse(oldData);
            if (parsed.homepageImages && parsed.homepageImages.backgroundImages) {
              images = parsed.homepageImages.backgroundImages;
              console.log(`✅ Migré depuis ancien système: ${images.length} images`);
              
              // Sauvegarder immédiatement dans le nouveau système
              await saveImagesSimple(images);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur migration ancien système:', error);
        }
      }
      
      // Mettre à jour l'état
      if (images) {
        setBackgroundImages(images);
        console.log(`🎉 ${images.length} images chargées avec succès`);
      } else {
        console.log('📭 Aucune image trouvée');
        setBackgroundImages([]);
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des images:', error);
      setIsLoading(false);
    }
  };

  // Sauvegarde automatique périodique pour garantir la persistance
  const startAutoSave = () => {
    // Sauvegarde automatique toutes les 5 minutes
    const autoSaveInterval = setInterval(async () => {
      try {
        // Récupérer les images actuelles depuis la ref
        const currentImages = backgroundImagesRef.current;
        if (currentImages.length > 0) {
          await saveImagesSimple(currentImages);
          console.log('🔄 Sauvegarde automatique effectuée');
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Sauvegarde avant fermeture de la page
    const handleBeforeUnload = async () => {
      try {
        // Récupérer les images actuelles depuis la ref
        const currentImages = backgroundImagesRef.current;
        if (currentImages.length > 0) {
          await saveImagesSimple(currentImages);
          console.log('🔄 Sauvegarde avant fermeture effectuée');
        }
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
      // Nettoyer le localStorage au démarrage
      cleanupLocalStorage();
      
      // Charger les images
      await loadImages();
    };
    
    initializeSystem();
    
    // Démarrer la sauvegarde automatique
    const cleanup = startAutoSave();
    return cleanup;
  }, []); // Supprimer la dépendance backgroundImages pour éviter le cycle infini

  return {
    backgroundImages,
    isLoading,
    saveImages: saveImagesSimple,
    loadImages
  };
};