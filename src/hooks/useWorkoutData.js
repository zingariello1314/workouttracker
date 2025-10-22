import { useState, useEffect, useRef, useCallback } from 'react';

export const useWorkoutData = () => {
  const [data, setData] = useState({
    checkedExercises: {},
    reps: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: []
  });

  // Tous les useRef doivent être déclarés avant les useCallback et useEffect
  const debounceTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const dbConnectionRef = useRef(null);
  const dbConnectionPromiseRef = useRef(null);

  // IndexedDB functions avec gestion d'erreurs renforcée
  // Fonction pour ouvrir la base de données avec gestion d'erreur améliorée
  const openDB = () => {
    // Si on a déjà une connexion active, la retourner
    if (dbConnectionRef.current) {
      return Promise.resolve(dbConnectionRef.current);
    }

    // Si une connexion est en cours, attendre qu'elle se termine
    if (dbConnectionPromiseRef.current) {
      return dbConnectionPromiseRef.current;
    }

    // Créer une nouvelle connexion
    dbConnectionPromiseRef.current = new Promise((resolve, reject) => {
      try {
        // Vérifier si IndexedDB est disponible
        if (!window.indexedDB) {
          console.warn('⚠️ IndexedDB non disponible, utilisation du localStorage uniquement');
          resolve(null);
          return;
        }

        // Utiliser localStorage uniquement pour éviter les problèmes IndexedDB
        console.log('🔄 Utilisation de localStorage uniquement pour éviter les erreurs IndexedDB');
        dbConnectionRef.current = null;
        resolve(null);

      } catch (error) {
        console.error('❌ Erreur critique dans openDB:', error);
        console.log('🔄 Basculement vers localStorage uniquement');
        dbConnectionRef.current = null;
        resolve(null);
      }
    });

    return dbConnectionPromiseRef.current;
  };
  const saveToDB = async (newData) => {
    try {
      console.log('💾 Tentative de sauvegarde:', newData);
      
      // Validation stricte des données avant sauvegarde
      if (!newData || typeof newData !== 'object') {
        throw new Error('Données invalides pour la sauvegarde');
      }

      // Validation de l'intégrité des propriétés critiques
      const requiredProperties = ['checkedExercises', 'reps', 'checkedStretches'];
      for (const prop of requiredProperties) {
        if (newData[prop] && typeof newData[prop] !== 'object') {
          console.warn(`Propriété ${prop} corrompue, réinitialisation`);
          newData[prop] = {};
        }
      }

      // Validation et nettoyage des répétitions
      if (newData.reps) {
        const cleanReps = {};
        for (const [key, value] of Object.entries(newData.reps)) {
          if (value !== '' && value !== undefined && value !== null) {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 999) {
              cleanReps[key] = numValue.toString();
            } else {
              console.warn(`Valeur de répétition invalide supprimée: ${key} = ${value}`);
            }
          } else if (value === '') {
            cleanReps[key] = '';
          }
        }
        newData.reps = cleanReps;
      }

      // Validation des photos de progression
      if (newData.progressPhotos && !Array.isArray(newData.progressPhotos)) {
        console.warn('progressPhotos corrompu, réinitialisation');
        newData.progressPhotos = [];
      }

      // Validation de la variante de semaine
      if (newData.weekVariant && newData.weekVariant !== 'A' && newData.weekVariant !== 'B') {
        console.warn('weekVariant invalide, réinitialisation à A');
        newData.weekVariant = 'A';
      }
      
      const db = await openDB();
      
      // Si IndexedDB n'est pas disponible, utiliser localStorage uniquement
      if (!db) {
        console.log('🔄 Sauvegarde en localStorage uniquement');
        try {
          localStorage.setItem('workoutData_backup', JSON.stringify(newData));
          console.log('✅ Sauvegarde localStorage réussie');
          return;
        } catch (localStorageError) {
          console.error('❌ Échec de la sauvegarde localStorage:', localStorageError);
          throw new Error('Impossible de sauvegarder les données');
        }
      }
      
      const transaction = db.transaction(['workouts'], 'readwrite');
      const store = transaction.objectStore('workouts');
      
      // Créer un objet avec la nouvelle structure et validation finale
      const dataToSave = {
        id: 'main',
        checkedExercises: newData && newData.checkedExercises ? { ...newData.checkedExercises } : {},
        reps: newData && newData.reps ? { ...newData.reps } : {},
        checkedStretches: newData && newData.checkedStretches ? { ...newData.checkedStretches } : {},
        startDate: newData && newData.startDate ? newData.startDate : null,
        weekVariant: newData && newData.weekVariant ? newData.weekVariant : 'A',
        progressPhotos: newData && newData.progressPhotos ? [...newData.progressPhotos] : [],
        lastSaved: new Date().toISOString(),
        dataVersion: '1.0' // Ajout d'une version pour la compatibilité future
      };
      
      console.log('🔍 Données validées à sauvegarder:', dataToSave);
      
      const request = store.put(dataToSave);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('✅ Données sauvegardées avec succès dans IndexedDB');
          // Sauvegarder aussi en localStorage comme backup
          try {
            localStorage.setItem('workoutData_backup', JSON.stringify(newData));
            localStorage.setItem('workoutData_lastSaved', new Date().toISOString());
          } catch (e) {
            console.warn('⚠️ Impossible de sauvegarder en localStorage:', e);
          }
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('❌ Erreur lors de la sauvegarde IndexedDB:', request.error);
          // Fallback vers localStorage
          try {
            localStorage.setItem('workoutData_backup', JSON.stringify(newData));
            localStorage.setItem('workoutData_lastSaved', new Date().toISOString());
            console.log('✅ Sauvegarde de secours en localStorage réussie');
            resolve();
          } catch (localStorageError) {
            console.error('❌ Échec de la sauvegarde de secours:', localStorageError);
            reject(request.error);
          }
        };
      });
      
    } catch (error) {
      console.error('❌ Erreur dans saveToDB:', error);
      
      // Fallback vers localStorage en cas d'erreur critique
      try {
        localStorage.setItem('workoutData_backup', JSON.stringify(newData));
        localStorage.setItem('workoutData_lastSaved', new Date().toISOString());
        console.log('✅ Sauvegarde de secours en localStorage réussie');
      } catch (localStorageError) {
        console.error('❌ Échec de la sauvegarde de secours:', localStorageError);
        throw new Error('Impossible de sauvegarder les données - tous les systèmes de sauvegarde ont échoué');
      }
    }
  };

  // Fonction de sauvegarde automatique avec debounce optimisé
  const autoSave = useCallback((newData) => {
    // Annuler le timer précédent s'il existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Vérifier si les données ont réellement changé pour éviter les sauvegardes inutiles
    const currentDataString = JSON.stringify(data);
    const newDataString = JSON.stringify(newData);
    
    if (currentDataString === newDataString) {
      console.log('🔍 Données identiques - sauvegarde annulée');
      return;
    }

    // Programmer une nouvelle sauvegarde après 2 secondes d'inactivité (augmenté de 1 à 2 secondes)
    debounceTimerRef.current = setTimeout(() => {
      console.log('💾 Sauvegarde automatique déclenchée');
      saveToDB(newData);
    }, 2000); // Augmenté à 2 secondes pour réduire la fréquence
  }, [data]);

  const loadFromDB = async () => {
    try {
      const db = await openDB();
      
      // Si IndexedDB n'est pas disponible, utiliser localStorage uniquement
      if (!db) {
        console.log('🔄 Chargement depuis localStorage uniquement');
        try {
          const backupData = localStorage.getItem('workoutData_backup');
          if (backupData) {
            const parsedBackup = JSON.parse(backupData);
            console.log('✅ Données récupérées depuis localStorage');
            return parsedBackup;
          }
        } catch (backupError) {
          console.error('❌ Erreur lors de la récupération du backup:', backupError);
        }
        return null;
      }
      
      const transaction = db.transaction(['workouts'], 'readonly');
      const store = transaction.objectStore('workouts');
      const request = store.get('main');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          console.log('🔍 DEBUG: Données chargées depuis IndexedDB:', result);
          
          if (result) {
            // Validation des données chargées
            const validatedData = {
              checkedExercises: result.checkedExercises || {},
              reps: result.reps || {},
              checkedStretches: result.checkedStretches || {},
              startDate: result.startDate || null,
              weekVariant: result.weekVariant || 'A',
              progressPhotos: Array.isArray(result.progressPhotos) ? result.progressPhotos : []
            };
            
            console.log('🔍 DEBUG: checkedExercises:', validatedData.checkedExercises);
            console.log('🔍 DEBUG: reps:', validatedData.reps);
            console.log('🔍 DEBUG: Nombre de clés dans reps:', Object.keys(validatedData.reps).length);
            console.log('🔍 DEBUG: Nombre de clés dans checkedExercises:', Object.keys(validatedData.checkedExercises).length);
            
            resolve(validatedData);
          } else {
            // Pas de données en IndexedDB, essayer de récupérer depuis localStorage
            console.log('🔄 Aucune donnée en IndexedDB, vérification du localStorage de secours');
            try {
              const backupData = localStorage.getItem('workoutData_backup');
              if (backupData) {
                const parsedBackup = JSON.parse(backupData);
                console.log('✅ Données récupérées depuis localStorage de secours');
                resolve(parsedBackup);
              } else {
                resolve(null);
              }
            } catch (backupError) {
              console.error('❌ Erreur lors de la récupération du backup:', backupError);
              resolve(null);
            }
          }
        };
        
        request.onerror = (event) => {
          console.error('❌ Erreur lors du chargement:', event.target.error);
          
          // En cas d'erreur, essayer de récupérer depuis localStorage
          try {
            const backupData = localStorage.getItem('workoutData_backup');
            if (backupData) {
              const parsedBackup = JSON.parse(backupData);
              console.log('✅ Données récupérées depuis localStorage de secours après erreur');
              resolve(parsedBackup);
            } else {
              resolve(null);
            }
          } catch (backupError) {
            console.error('❌ Erreur lors de la récupération du backup après erreur:', backupError);
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('❌ Erreur dans loadFromDB:', error);
      
      // Fallback vers localStorage en cas d'erreur critique
      try {
        const backupData = localStorage.getItem('workoutData_backup');
        if (backupData) {
          const parsedBackup = JSON.parse(backupData);
          console.log('✅ Données récupérées depuis localStorage de secours après erreur critique');
          return parsedBackup;
        }
      } catch (backupError) {
        console.error('❌ Erreur lors de la récupération du backup après erreur critique:', backupError);
      }
      
      return null;
    }
  };

  const loadData = async () => {
    const savedData = await loadFromDB();
    if (savedData) {
      setData(savedData);
    }
    // Marquer que le chargement initial est terminé
    isInitialLoadRef.current = false;
  };

  const updateData = async (newData) => {
    setData(newData);
    
    try {
      // Sauvegarde manuelle immédiate (pour les boutons de sauvegarde existants)
      await saveToDB(newData);
      
      // Notifier le contexte que des données ont été sauvegardées SEULEMENT si la sauvegarde a réussi
      if (window.workoutContextCallback) {
        window.workoutContextCallback();
      }
    } catch (error) {
      // console.error('❌ Erreur lors de la sauvegarde dans updateData:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Effet pour la sauvegarde automatique à chaque changement de données
  useEffect(() => {
    // Ne pas sauvegarder automatiquement lors du chargement initial
    if (isInitialLoadRef.current) {
      return;
    }

    // Sauvegarder automatiquement avec debounce
    autoSave(data);
  }, [data, autoSave]);

  // Nettoyer le timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    data,
    updateData,
    saveToDB,
    loadFromDB
  };
};