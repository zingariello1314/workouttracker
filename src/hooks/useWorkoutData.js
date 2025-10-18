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

  // Référence pour le timer de debounce
  const debounceTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // IndexedDB functions
  const openDB = () => {
    return new Promise((resolve, reject) => {
      // Forcer une nouvelle version pour recréer la DB
      const request = indexedDB.open('WorkoutTrackerDB', 2);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Supprimer l'ancien store s'il existe
        if (db.objectStoreNames.contains('workoutData')) {
          db.deleteObjectStore('workoutData');
        }
        
        // Créer un nouveau store avec une configuration claire
        const store = db.createObjectStore('workoutData', { keyPath: 'id' });
        console.log('🔄 Base de données recréée avec succès');
      };
      
      request.onsuccess = () => {
        console.log('✅ Base de données ouverte avec succès');
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('❌ Erreur ouverture DB:', request.error);
        reject(request.error);
      };
    });
  };

  const saveToDB = async (newData) => {
    try {
      console.log('🔍 Tentative de sauvegarde:', newData);
      const db = await openDB();
      const transaction = db.transaction(['workoutData'], 'readwrite');
      const store = transaction.objectStore('workoutData');
      
      // Créer un objet complètement nouveau sans référence à newData
      const dataToSave = {
        id: 'main',
        checkedExercises: newData && newData.checkedExercises ? { ...newData.checkedExercises } : {},
        reps: newData && newData.reps ? { ...newData.reps } : {},
        checkedStretches: newData && newData.checkedStretches ? { ...newData.checkedStretches } : {},
        startDate: newData && newData.startDate ? newData.startDate : null,
        weekVariant: newData && newData.weekVariant ? newData.weekVariant : 'A',
        progressPhotos: newData && newData.progressPhotos ? [...newData.progressPhotos] : []
      };
      
      console.log('🔍 Données à sauvegarder:', dataToSave);
      console.log('🔍 Type de dataToSave.id:', typeof dataToSave.id);
      console.log('🔍 Valeur de dataToSave.id:', dataToSave.id);
      
      // Vérifier que l'objet a bien un id
      if (!dataToSave.id) {
        throw new Error('L\'objet à sauvegarder n\'a pas d\'id');
      }
      
      // Utiliser une transaction complète avec await
      const request = store.put(dataToSave);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('✅ Données sauvegardées avec succès dans IndexedDB');
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('❌ Erreur lors de la sauvegarde:', event.target.error);
          console.error('❌ Détails de l\'erreur:', event.target.error.message);
          console.error('❌ Données qui ont causé l\'erreur:', dataToSave);
          reject(event.target.error);
        };
        
        transaction.oncomplete = () => {
          console.log('✅ Transaction IndexedDB terminée');
        };
        
        transaction.onerror = (event) => {
          console.error('❌ Erreur de transaction:', event.target.error);
          reject(event.target.error);
        };
        
        transaction.onabort = (event) => {
          console.error('❌ Transaction annulée:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('❌ Erreur dans saveToDB:', error);
      throw error;
    }
  };

  // Fonction de sauvegarde automatique avec debounce
  const autoSave = useCallback((newData) => {
    // Annuler le timer précédent s'il existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Programmer une nouvelle sauvegarde après 1 seconde d'inactivité
    debounceTimerRef.current = setTimeout(() => {
      saveToDB(newData);
    }, 1000);
  }, []);

  const loadFromDB = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['workoutData'], 'readonly');
      const store = transaction.objectStore('workoutData');
      const request = store.get('main');
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.id) {
            // Supprimer l'id avant de retourner les données
            const { id, ...dataWithoutId } = result;
            resolve(dataWithoutId);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Erreur chargement:', error);
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
      console.error('❌ Erreur lors de la sauvegarde dans updateData:', error);
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