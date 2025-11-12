/**
 * Gestion de l'historique des déclenchements AutoSync dans IndexedDB.
 * 
 * @module garminAutoSyncHistory
 */

import { openDB } from './garminDataUtils';

const STORE_AUTO_SYNC_HISTORY = 'autoSyncHistory';
import logger from '../utils/logger';

const log = logger.module('garminAutoSyncHistory');

export const AUTO_SYNC_HISTORY_LIMIT = 100; // Limite d'historique en mémoire

/**
 * Persiste un déclenchement AutoSync dans IndexedDB
 * 
 * @param {Object} entry - Entrée d'historique AutoSync
 * @returns {Promise<void>}
 */
export async function persistAutoSyncHistory(entry) {
  try {
    const db = await openDB();
    if (!db) {
      log.warn('[persistAutoSyncHistory] IndexedDB non disponible, utilisation localStorage');
      // Fallback localStorage
      const key = 'garmin_autosync_history';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(entry);
      const limited = existing.slice(0, AUTO_SYNC_HISTORY_LIMIT);
      localStorage.setItem(key, JSON.stringify(limited));
      return;
    }

    const tx = db.transaction([STORE_AUTO_SYNC_HISTORY], 'readwrite');
    const store = tx.objectStore(STORE_AUTO_SYNC_HISTORY);
    
    await store.add(entry);
    await tx.complete;
    
    // Nettoyer les anciennes entrées de manière asynchrone (non bloquant)
    // On fait ça dans un setTimeout pour ne pas bloquer l'ajout
    setTimeout(async () => {
      try {
        const cleanupDb = await openDB();
        if (!cleanupDb) return;
        
        const cleanupTx = cleanupDb.transaction([STORE_AUTO_SYNC_HISTORY], 'readwrite');
        const cleanupStore = cleanupTx.objectStore(STORE_AUTO_SYNC_HISTORY);
        
        let allEntries = [];
        
        try {
          // Vérifier que l'index existe
          if (cleanupStore.indexNames.contains('timestamp')) {
            const index = cleanupStore.index('timestamp');
            const result = await index.getAll();
            allEntries = Array.isArray(result) ? result : (result ? [result] : []);
          } else {
            // Fallback sur getAll() du store si l'index n'existe pas
            const result = await cleanupStore.getAll();
            allEntries = Array.isArray(result) ? result : (result ? [result] : []);
          }
        } catch (error) {
          log.warn('[persistAutoSyncHistory] Erreur lors du chargement pour nettoyage (non bloquant)', error);
          return;
        }
        
        // Si pas d'entrées, rien à nettoyer
        if (allEntries.length === 0) {
          return;
        }
        
        if (allEntries.length > AUTO_SYNC_HISTORY_LIMIT) {
          // Trier par timestamp (plus ancien en premier)
          const sorted = allEntries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          
          // Supprimer les plus anciennes
          const toDelete = sorted.slice(0, sorted.length - AUTO_SYNC_HISTORY_LIMIT);
          for (const entryToDelete of toDelete) {
            await cleanupStore.delete(entryToDelete.id);
          }
        }
        
        await cleanupTx.complete;
      } catch (error) {
        log.warn('[persistAutoSyncHistory] Erreur lors du nettoyage (non bloquant)', error);
      }
    }, 0);
  } catch (error) {
    log.error('[persistAutoSyncHistory] Erreur lors de la persistance', error);
    throw error;
  }
}

/**
 * Charge l'historique AutoSync depuis IndexedDB
 * 
 * @param {number} limit - Nombre maximum d'entrées à charger
 * @returns {Promise<Array>}
 */
export async function loadAutoSyncHistory(limit = AUTO_SYNC_HISTORY_LIMIT) {
  try {
    const db = await openDB();
    if (!db) {
      log.warn('[loadAutoSyncHistory] IndexedDB non disponible, utilisation localStorage');
      // Fallback localStorage
      const key = 'garmin_autosync_history';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      return existing.slice(0, limit);
    }

    const tx = db.transaction([STORE_AUTO_SYNC_HISTORY], 'readonly');
    const store = tx.objectStore(STORE_AUTO_SYNC_HISTORY);
    
    let allEntries = [];
    
    try {
      // Vérifier que l'index existe
      if (store.indexNames.contains('timestamp')) {
        const index = store.index('timestamp');
        const result = await index.getAll();
        // getAll() devrait toujours retourner un tableau, mais on vérifie
        allEntries = Array.isArray(result) ? result : (result ? [result] : []);
      } else {
        // Fallback sur getAll() du store si l'index n'existe pas
        const result = await store.getAll();
        allEntries = Array.isArray(result) ? result : (result ? [result] : []);
      }
    } catch (indexError) {
      // Si l'index échoue, essayer avec getAll() du store
      log.warn('[loadAutoSyncHistory] Erreur avec l\'index, fallback sur store.getAll()', indexError);
      try {
        const result = await store.getAll();
        allEntries = Array.isArray(result) ? result : (result ? [result] : []);
      } catch (storeError) {
        log.error('[loadAutoSyncHistory] Erreur avec store.getAll()', storeError);
        return [];
      }
    }
    
    // Trier par timestamp décroissant (plus récent en premier)
    const sorted = allEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return sorted.slice(0, limit);
  } catch (error) {
    log.error('[loadAutoSyncHistory] Erreur lors du chargement', error);
    return [];
  }
}

/**
 * Nettoie l'historique AutoSync (supprime les entrées > 90 jours)
 * 
 * @returns {Promise<number>} Nombre d'entrées supprimées
 */
export async function cleanupAutoSyncHistory() {
  try {
    const db = await openDB();
    if (!db) {
      return 0;
    }

    const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 jours
    const tx = db.transaction([STORE_AUTO_SYNC_HISTORY], 'readwrite');
    const store = tx.objectStore(STORE_AUTO_SYNC_HISTORY);
    const index = store.index('timestamp');
    
    const range = IDBKeyRange.upperBound(cutoffTime);
    const keys = await index.getAllKeys(range);
    
    for (const key of keys) {
      await store.delete(key);
    }
    
    await tx.complete;
    return keys.length;
  } catch (error) {
    log.error('[cleanupAutoSyncHistory] Erreur lors du nettoyage', error);
    return 0;
  }
}
