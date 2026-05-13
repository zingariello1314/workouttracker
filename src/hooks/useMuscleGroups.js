import { useState, useEffect, useCallback } from 'react';
import { XP_DB_NAME, applyQuietQuestMetaDbUpgrade } from '../services/xp/xpDbGateway.js';
import { STORE_QQ_MUSCLE_GROUPS } from '../services/xp/quietQuestHookStores.js';

/**
 * Custom hook for managing muscle groups
 * Handles CRUD operations with IndexedDB
 */
const useMuscleGroups = () => {
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize IndexedDB
  const initDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(XP_DB_NAME);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        applyQuietQuestMetaDbUpgrade(event);
      };
    });
  }, []);

  // Fetch all muscle groups
  const fetchMuscleGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const db = await initDB();
      const transaction = db.transaction([STORE_QQ_MUSCLE_GROUPS], 'readonly');
      const store = transaction.objectStore(STORE_QQ_MUSCLE_GROUPS);
      const request = store.getAll();

      request.onsuccess = () => {
        setMuscleGroups(request.result || []);
        setLoading(false);
      };

      request.onerror = () => {
        setError('Erreur lors du chargement des groupes musculaires');
        setLoading(false);
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [initDB]);

  // Create new muscle group
  const createMuscleGroup = useCallback(async (data) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_QQ_MUSCLE_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORE_QQ_MUSCLE_GROUPS);

      const newGroup = {
        id: `muscle_${Date.now()}`,
        name: data.name,
        current: data.current || 0,
        target: data.target,
        imageData: data.imageData || null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const request = store.add(newGroup);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          fetchMuscleGroups();
          resolve(newGroup);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [initDB, fetchMuscleGroups]);

  // Update muscle group
  const updateMuscleGroup = useCallback(async (id, updates) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_QQ_MUSCLE_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORE_QQ_MUSCLE_GROUPS);

      const getRequest = store.get(id);

      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
          const group = getRequest.result;
          if (!group) {
            reject(new Error('Groupe musculaire non trouvé'));
            return;
          }

          const updatedGroup = {
            ...group,
            ...updates,
            updatedAt: Date.now()
          };

          const putRequest = store.put(updatedGroup);

          putRequest.onsuccess = () => {
            fetchMuscleGroups();
            resolve(updatedGroup);
          };
          putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [initDB, fetchMuscleGroups]);

  // Delete muscle group
  const deleteMuscleGroup = useCallback(async (id) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_QQ_MUSCLE_GROUPS], 'readwrite');
      const store = transaction.objectStore(STORE_QQ_MUSCLE_GROUPS);

      const request = store.delete(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          fetchMuscleGroups();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [initDB, fetchMuscleGroups]);

  // Load data on mount
  useEffect(() => {
    fetchMuscleGroups();
  }, [fetchMuscleGroups]);

  return {
    muscleGroups,
    loading,
    error,
    createMuscleGroup,
    updateMuscleGroup,
    deleteMuscleGroup,
    refresh: fetchMuscleGroups
  };
};

export default useMuscleGroups;
