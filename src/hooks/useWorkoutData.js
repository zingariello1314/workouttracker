import { useState, useEffect, useRef, useCallback } from 'react';

// Données de test pour l'historique d'entraînement
const generateTestWorkoutData = () => {
  const testData = {
    checkedExercises: {},
    reps: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: []
  };

  // Générer des données pour les 30 derniers jours
  const today = new Date();
  
  // Pool d'exercices avec les vrais IDs du programme
  const exercisePool = [
    // Lundi - Dos/Biceps
    { id: 101, reps: () => Math.floor(Math.random() * 8) + 5 }, // Tractions
    { id: 102, reps: () => Math.floor(Math.random() * 12) + 8 }, // Tractions australiennes
    { id: 103, reps: () => Math.floor(Math.random() * 10) + 6 }, // Dips
    { id: 104, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes déclinées
    { id: 105, reps: () => Math.floor(Math.random() * 20) + 15 }, // Relevés de genoux
    
    // Mardi - Pectoraux/Triceps/Épaules
    { id: 201, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes lestées
    { id: 202, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes inclinées
    { id: 203, reps: () => Math.floor(Math.random() * 10) + 8 }, // Curl alterné
    { id: 204, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl marteau
    { id: 206, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes serrées diamant
    
    // Mercredi - Boxe
    { id: 301, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes déclinées
    { id: 302, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes pseudo-planche
    { id: 303, reps: () => Math.floor(Math.random() * 10) + 8 }, // Développé militaire
    { id: 304, reps: () => Math.floor(Math.random() * 15) + 10 }, // Élévations latérales
    { id: 307, reps: () => Math.floor(Math.random() * 12) + 8 }, // Extensions triceps
    
    // Vendredi - Salle
    { id: 501, reps: () => Math.floor(Math.random() * 5) + 3 }, // Tractions supination
    { id: 502, reps: () => Math.floor(Math.random() * 12) + 8 }, // Tractions australiennes
    { id: 503, reps: () => Math.floor(Math.random() * 8) + 5 }, // Dips parallèles
    { id: 504, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes déclinées
    { id: 505, reps: () => Math.floor(Math.random() * 20) + 15 }, // Relevés de genoux
    
    // Samedi - Variante
    { id: 601, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes inclinées tempo
    { id: 602, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes serrées tempo
    { id: 603, reps: () => Math.floor(Math.random() * 10) + 8 }, // Curl concentration
    { id: 604, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl marteau
    
    // Dimanche - Repos actif
    { id: 701, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes sur poignées
    { id: 702, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes pseudo-planche
    { id: 703, reps: () => Math.floor(Math.random() * 10) + 8 }, // Développé militaire
    
    // Variantes salle samedi
    { id: 631, reps: () => Math.floor(Math.random() * 10) + 6 }, // Développé incliné haltères
    { id: 632, reps: () => Math.floor(Math.random() * 10) + 6 }, // Développé incliné barre
    { id: 638, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl incliné haltères
    { id: 639, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl marteau
    
    // Variantes salle dimanche (jambes)
    { id: 731, reps: () => Math.floor(Math.random() * 10) + 6 }, // Squat
    { id: 732, reps: () => Math.floor(Math.random() * 12) + 8 }, // Presse à cuisses
    { id: 733, reps: () => Math.floor(Math.random() * 10) + 8 }, // Fentes marchées
    { id: 738, reps: () => Math.floor(Math.random() * 20) + 15 } // Mollets debout
  ];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Simuler quelques exercices complétés de manière aléatoire
    if (Math.random() > 0.25) { // 75% de chance d'avoir fait du sport ce jour-là
      // Sélectionner 3-6 exercices aléatoires du pool
      const numExercises = Math.floor(Math.random() * 4) + 3;
      const selectedExercises = [];
      
      // Mélanger le pool d'exercices et prendre les premiers
      const shuffledPool = [...exercisePool].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < numExercises && j < shuffledPool.length; j++) {
        const exercise = shuffledPool[j];
        const key = `${dateStr}_${exercise.id}`;
        testData.checkedExercises[key] = true;
        testData.reps[key] = exercise.reps();
        selectedExercises.push(exercise.id);
      }
    }
  }

  return testData;
};

export const useWorkoutData = () => {
  const [data, setData] = useState({
    checkedExercises: {},
    reps: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: [],
    sessionFeedbacks: {} // Nouveau: stockage des feedbacks de session par date
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
        dbConnectionRef.current = null;
        resolve(null);

      } catch (error) {
        console.error('❌ Erreur critique dans openDB:', error);
        dbConnectionRef.current = null;
        resolve(null);
      }
    });

    return dbConnectionPromiseRef.current;
  };
  const saveToDB = async (newData) => {
    try {
      
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
        try {
          localStorage.setItem('workoutData_backup', JSON.stringify(newData));
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
        sessionFeedbacks: newData && newData.sessionFeedbacks ? { ...newData.sessionFeedbacks } : {},
        lastSaved: new Date().toISOString(),
        dataVersion: '1.0' // Ajout d'une version pour la compatibilité future
      };
      
      const request = store.put(dataToSave);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
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

      return;
    }

    // Programmer une nouvelle sauvegarde après 2 secondes d'inactivité (augmenté de 1 à 2 secondes)
    debounceTimerRef.current = setTimeout(() => {
      saveToDB(newData);
    }, 2000); // Augmenté à 2 secondes pour réduire la fréquence
  }, [data]);

  const loadFromDB = async () => {
    try {
      const db = await openDB();
      
      // Si IndexedDB n'est pas disponible, utiliser localStorage uniquement
      if (!db) {
        try {
          const backupData = localStorage.getItem('workoutData_backup');
          if (backupData) {
            const parsedBackup = JSON.parse(backupData);
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
          
          if (result) {
            // Validation des données chargées
            const validatedData = {
              checkedExercises: result.checkedExercises || {},
              reps: result.reps || {},
              checkedStretches: result.checkedStretches || {},
              startDate: result.startDate || null,
              weekVariant: result.weekVariant || 'A',
              progressPhotos: Array.isArray(result.progressPhotos) ? result.progressPhotos : [],
              sessionFeedbacks: result.sessionFeedbacks || {}
            };
            
            resolve(validatedData);
          } else {
            // Pas de données en IndexedDB, essayer de récupérer depuis localStorage
            try {
              const backupData = localStorage.getItem('workoutData_backup');
              if (backupData) {
                const parsedBackup = JSON.parse(backupData);
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
    } else {
      // Si aucune donnée n'existe, charger les données de test
      console.log('🎯 Aucune donnée trouvée, chargement des données de test...');
      const testData = generateTestWorkoutData();
      setData(testData);
      // Sauvegarder les données de test
      await saveToDB(testData);
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

  // Fonction pour sauvegarder un feedback de session
  const saveSessionFeedback = useCallback((date, feedbackData) => {
    const newData = {
      ...data,
      sessionFeedbacks: {
        ...data.sessionFeedbacks,
        [date]: {
          ...feedbackData,
          timestamp: new Date().toISOString()
        }
      }
    };
    
    setData(newData);
    autoSave(newData);
  }, [data, autoSave]);

  return {
    data,
    updateData,
    saveToDB,
    loadFromDB,
    saveSessionFeedback
  };
};