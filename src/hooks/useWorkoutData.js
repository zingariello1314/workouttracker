import { useState, useEffect } from 'react';

export const useWorkoutData = () => {
  const [data, setData] = useState({
    checkedExercises: {},
    reps: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: []
  });

  // IndexedDB functions
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WorkoutTrackerDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('workoutData')) {
          db.createObjectStore('workoutData');
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const saveToDB = async (newData) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['workoutData'], 'readwrite');
      const store = transaction.objectStore('workoutData');
      store.put(newData, 'main');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const loadFromDB = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['workoutData'], 'readonly');
      const store = transaction.objectStore('workoutData');
      const request = store.get('main');
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result || null);
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
  };

  const updateData = (newData) => {
    setData(newData);
    saveToDB(newData);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    updateData,
    saveToDB,
    loadFromDB
  };
};