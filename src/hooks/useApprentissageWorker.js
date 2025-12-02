/**
 * Hook pour utiliser le Web Worker Apprentissage
 * Gère la communication avec le worker et le cache des résultats
 */

import { useRef, useCallback, useEffect } from 'react';

let workerInstance = null;
let messageIdCounter = 0;
const pendingRequests = new Map();

/**
 * Obtenir ou créer l'instance du worker
 */
const getWorker = () => {
  if (!workerInstance) {
    try {
      workerInstance = new Worker('/apprentissageWorker.js');
      
      // Écouter les messages du worker
      workerInstance.onmessage = (e) => {
        const { id, success, result, error } = e.data;
        const pending = pendingRequests.get(id);
        
        if (pending) {
          pendingRequests.delete(id);
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
        }
      };

      // Gérer les erreurs du worker
      workerInstance.onerror = (error) => {
        console.error('[ApprentissageWorker] Erreur worker:', error);
        // Rejeter toutes les requêtes en attente
        pendingRequests.forEach((pending) => {
          pending.reject(error);
        });
        pendingRequests.clear();
      };
    } catch (error) {
      console.warn('[ApprentissageWorker] Worker non disponible, fallback synchrone:', error);
      return null;
    }
  }
  
  return workerInstance;
};

/**
 * Envoyer un message au worker
 */
const sendToWorker = (type, data) => {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    
    // Fallback synchrone si worker indisponible
    if (!worker) {
      // Importer les fonctions de calcul synchrones dynamiquement
      import('../utils/apprentissageCalculations').then((calculations) => {
        try {
          let result;
          switch (type) {
            case 'CALCULATE_LEVEL':
              result = calculations.calculateLevel(data.xp);
              break;
            case 'CALCULATE_BADGE':
              result = calculations.getSubjectBadge(data.level);
              break;
            case 'CALCULATE_PROGRESSION':
              result = calculations.calculateSubjectProgression(data.xp);
              break;
            case 'CALCULATE_MULTIPLE_PROGRESSIONS':
              result = calculations.calculateMultipleProgressions(data.subjects);
              break;
            default:
              throw new Error(`Type inconnu: ${type}`);
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }).catch((error) => {
        reject(error);
      });
      return;
    }

    const id = ++messageIdCounter;
    pendingRequests.set(id, { resolve, reject });

    // Timeout après 5 secondes
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Timeout worker'));
      }
    }, 5000);

    worker.postMessage({ type, data, id });
  });
};

/**
 * Hook pour utiliser le worker
 */
export const useApprentissageWorker = () => {
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = getWorker();

    return () => {
      // Nettoyer à la destruction
      if (workerRef.current) {
        // Ne pas terminer le worker, il peut être réutilisé
        workerRef.current = null;
      }
    };
  }, []);

  const calculateLevel = useCallback(async (xp) => {
    return sendToWorker('CALCULATE_LEVEL', { xp });
  }, []);

  const calculateBadge = useCallback(async (level) => {
    return sendToWorker('CALCULATE_BADGE', { level });
  }, []);

  const calculateProgression = useCallback(async (xp) => {
    return sendToWorker('CALCULATE_PROGRESSION', { xp });
  }, []);

  const calculateMultipleProgressions = useCallback(async (subjects) => {
    return sendToWorker('CALCULATE_MULTIPLE_PROGRESSIONS', { subjects });
  }, []);

  return {
    calculateLevel,
    calculateBadge,
    calculateProgression,
    calculateMultipleProgressions,
    isAvailable: workerRef.current !== null,
  };
};

export default useApprentissageWorker;

