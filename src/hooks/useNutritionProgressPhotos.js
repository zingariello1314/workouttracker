/**
 * useNutritionProgressPhotos.js
 * 
 * Hook React pour la gestion des photos de progression nutrition (avant/après).
 * 
 * Fonctionnalités :
 * - État : photos, sequences, loading, error, dbReady
 * - Méthodes : addPhoto, deletePhoto, updatePhoto, deleteSequence, loadPhotos, loadSequences
 * - Compression automatique (multi-résolution)
 * - Format optimal (WebP si supporté, sinon JPEG)
 * - Gestion séquences avant/après (sequenceId)
 * 
 * Architecture :
 * - Service : `nutritionProgressPhotos.js` (CRUD IndexedDB)
 * - Compression : `processImageForStorage` (format optimal) ou `compressImageMultiResolution` (compression)
 * - Performance : traitement async, non-bloquant pour UI
 * 
 * @module hooks/useNutritionProgressPhotos
 * @see ../../../nouvelongletnutritionplan.md Section 6.2
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/Toast/ToastProvider';
import { openNutritionDB, isNutritionDBReady } from './nutritionDataUtils';
import {
  PROGRESS_PHOTO_TYPES,
  addProgressPhoto,
  getAllProgressPhotos,
  getProgressPhoto,
  getProgressPhotoSequences,
  updateProgressPhoto,
  deleteProgressPhoto,
  deleteProgressPhotoSequence
} from '../services/nutrition/nutritionProgressPhotos';
import logger from '../utils/logger';

const log = logger.module('useNutritionProgressPhotos');

/**
 * Hook pour la gestion des photos de progression nutrition
 * 
 * @param {Object} options - Options du hook
 * @param {boolean} options.autoLoad - Charger automatiquement les photos au démarrage (défaut: true)
 * @returns {Object} Interface du hook
 */
export const useNutritionProgressPhotos = (options = {}) => {
  const { autoLoad = true } = options;
  const { showSuccess, showError } = useToast();

  const [photos, setPhotos] = useState([]);
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbReady, setDbReady] = useState(false);

  // Initialisation IndexedDB
  useEffect(() => {
    isNutritionDBReady()
      .then((ready) => {
        setDbReady(ready);
        if (ready) {
          log.debug('[useNutritionProgressPhotos] IndexedDB prête');
        } else {
          log.warn('[useNutritionProgressPhotos] IndexedDB non disponible');
        }
      })
      .catch((err) => {
        log.error('[useNutritionProgressPhotos] Erreur vérification DB:', err);
        setDbReady(false);
      });
  }, []);

  // Chargement automatique des photos au démarrage
  useEffect(() => {
    if (autoLoad && dbReady) {
      loadPhotos();
      loadSequences();
    }
  }, [autoLoad, dbReady]);

  /**
   * Charge toutes les photos de progression
   * 
   * @param {Object} [filters] - Filtres optionnels
   * @returns {Promise<Array>} Liste photos
   */
  const loadPhotos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const loadedPhotos = await getAllProgressPhotos(filters);
      setPhotos(loadedPhotos);

      log.debug('[useNutritionProgressPhotos] Photos chargées', {
        total: loadedPhotos.length,
        filters
      });

      return loadedPhotos;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur chargement photos:', err);
      setError(err.message || 'Erreur chargement photos');
      showError('Erreur chargement photos de progression', err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Charge les séquences de photos avant/après
   * 
   * @returns {Promise<Array>} Liste séquences
   */
  const loadSequences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedSequences = await getProgressPhotoSequences();
      setSequences(loadedSequences);

      log.debug('[useNutritionProgressPhotos] Séquences chargées', {
        total: loadedSequences.length
      });

      return loadedSequences;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur chargement séquences:', err);
      setError(err.message || 'Erreur chargement séquences');
      showError('Erreur chargement séquences', err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Ajoute une photo de progression
   * 
   * @param {File} file - Fichier image à ajouter
   * @param {Object} photoData - Données photo
   * @param {string} photoData.type - Type photo (before/after)
   * @param {string} photoData.date - Date photo (YYYY-MM-DD)
   * @param {string} [photoData.sequenceId] - ID séquence (généré si absent)
   * @param {number} [photoData.weight] - Poids (kg) optionnel
   * @param {Object} [photoData.measurements] - Mesures optionnelles
   * @param {string} [photoData.notes] - Notes optionnelles
   * @param {Function} [onProgress] - Callback progression (0-100)
   * @returns {Promise<Object>} Photo ajoutée
   */
  const addPhoto = useCallback(async (file, photoData, onProgress = null) => {
    try {
      setLoading(true);
      setError(null);

      const addedPhoto = await addProgressPhoto(file, photoData, {
        onProgress: onProgress || ((progress, message) => {
          log.debug(`[useNutritionProgressPhotos] Progression: ${progress}% - ${message}`);
        })
      });

      // Recharger photos et séquences
      await Promise.all([loadPhotos(), loadSequences()]);

      showSuccess(`Photo ${photoData.type === PROGRESS_PHOTO_TYPES.BEFORE ? 'avant' : 'après'} ajoutée avec succès`);

      log.debug('[useNutritionProgressPhotos] Photo ajoutée', {
        id: addedPhoto.id,
        type: addedPhoto.type,
        date: addedPhoto.date
      });

      return addedPhoto;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur ajout photo:', err);
      setError(err.message || 'Erreur ajout photo');
      showError('Erreur ajout photo', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPhotos, loadSequences, showSuccess, showError]);

  /**
   * Met à jour une photo de progression
   * 
   * @param {string} id - ID photo à mettre à jour
   * @param {Object} updates - Champs à mettre à jour
   * @returns {Promise<Object>} Photo mise à jour
   */
  const updatePhoto = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      const updatedPhoto = await updateProgressPhoto(id, updates);

      // Recharger photos et séquences
      await Promise.all([loadPhotos(), loadSequences()]);

      showSuccess('Photo mise à jour avec succès');

      log.debug('[useNutritionProgressPhotos] Photo mise à jour', { id });

      return updatedPhoto;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur mise à jour photo:', err);
      setError(err.message || 'Erreur mise à jour photo');
      showError('Erreur mise à jour photo', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPhotos, loadSequences, showSuccess, showError]);

  /**
   * Supprime une photo de progression
   * 
   * @param {string} id - ID photo à supprimer
   * @returns {Promise<boolean>} true si succès
   */
  const deletePhoto = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await deleteProgressPhoto(id);

      // Recharger photos et séquences
      await Promise.all([loadPhotos(), loadSequences()]);

      showSuccess('Photo supprimée avec succès');

      log.debug('[useNutritionProgressPhotos] Photo supprimée', { id });

      return true;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur suppression photo:', err);
      setError(err.message || 'Erreur suppression photo');
      showError('Erreur suppression photo', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPhotos, loadSequences, showSuccess, showError]);

  /**
   * Supprime toutes les photos d'une séquence
   * 
   * @param {string} sequenceId - ID séquence à supprimer
   * @returns {Promise<number>} Nombre de photos supprimées
   */
  const deleteSequence = useCallback(async (sequenceId) => {
    try {
      setLoading(true);
      setError(null);

      const deletedCount = await deleteProgressPhotoSequence(sequenceId);

      // Recharger photos et séquences
      await Promise.all([loadPhotos(), loadSequences()]);

      showSuccess(`Séquence supprimée avec succès (${deletedCount} photo(s))`);

      log.debug('[useNutritionProgressPhotos] Séquence supprimée', {
        sequenceId,
        deletedCount
      });

      return deletedCount;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur suppression séquence:', err);
      setError(err.message || 'Erreur suppression séquence');
      showError('Erreur suppression séquence', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPhotos, loadSequences, showSuccess, showError]);

  /**
   * Récupère une photo par ID
   * 
   * @param {string} id - ID photo
   * @returns {Promise<Object|null>} Photo ou null
   */
  const getPhoto = useCallback(async (id) => {
    try {
      const photo = await getProgressPhoto(id);
      return photo;
    } catch (err) {
      log.error('[useNutritionProgressPhotos] Erreur récupération photo:', err);
      return null;
    }
  }, []);

  return {
    // État
    photos,
    sequences,
    loading,
    error,
    dbReady,

    // Méthodes
    addPhoto,
    updatePhoto,
    deletePhoto,
    deleteSequence,
    loadPhotos,
    loadSequences,
    getPhoto,

    // Constantes
    PROGRESS_PHOTO_TYPES
  };
};

export default useNutritionProgressPhotos;

