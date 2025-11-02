/**
 * Hook usePhotoAutoSave - Centralisation logique sauvegarde photos
 * 
 * Élimine duplication code sauvegarde entre:
 * - capturePhoto (sauvegarde immédiate)
 * - handleClose (sauvegarde automatique fermeture)
 * - saveSession (sauvegarde manuelle)
 * 
 * Référence: ANALYSE_COMPLETE_ET_OPTIMISATIONS.md - Sprint 2 #1
 * 
 * @returns {Object} { savePhoto, savePhotos }
 */

import { useCallback } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useToast } from './useToast';
import logger from '../../../utils/logger';

const log = logger.hook('usePhotoAutoSave');

export const usePhotoAutoSave = () => {
  const { addProgressPhoto, data } = useWorkout();
  const { showSuccess, showError, showWarning } = useToast();

  /**
   * Vérifie si une photo existe déjà dans le contexte
   * @param {string} photoId - ID de la photo
   * @returns {boolean} true si photo existe
   */
  const photoExists = useCallback((photoId) => {
    if (!data?.progressPhotos || !photoId) return false;
    return data.progressPhotos.some(p => p.id === photoId);
  }, [data?.progressPhotos]);

  /**
   * Sauvegarde une photo unique avec retry et options
   * 
   * @param {Object} photo - Photo à sauvegarder (doit avoir id, photo/url, date, etc.)
   * @param {Object} options - Options de sauvegarde
   * @param {boolean} options.silent - Pas de toast si true (défaut: false)
   * @param {number} options.retry - Nombre de tentatives (défaut: 1)
   * @param {boolean} options.skipIfExists - Skip si photo existe déjà (défaut: false)
   * @returns {Promise<Object>} { success: boolean, skipped?: boolean, retries?: number, error?: Error }
   */
  const savePhoto = useCallback(async (photo, options = {}) => {
    const {
      silent = false,      // Pas de toast si silent=true
      retry = 1,          // Nombre de tentatives (0 = pas de retry, 1 = 1 retry)
      skipIfExists = false // Skip si photo existe déjà
    } = options;

    if (!photo || !photo.id) {
      log.warn('Tentative sauvegarde photo invalide', { photo });
      if (!silent) showError('Photo invalide');
      return { success: false, error: new Error('Photo invalide') };
    }

    try {
      // ✅ Vérifier si photo existe déjà (skipIfExists)
      if (skipIfExists && photoExists(photo.id)) {
        log.debug(`Photo ${photo.id} déjà sauvegardée, skip`, { photoId: photo.id });
        return { success: true, skipped: true };
      }

      // ✅ Sauvegarder avec retry
      let lastError;
      let attempts = 0;
      
      for (let i = 0; i <= retry; i++) {
        attempts = i + 1;
        try {
          log.debug(`Tentative sauvegarde photo ${photo.id} (${attempts}/${retry + 1})`, {
            photoId: photo.id,
            attempt: attempts,
            totalAttempts: retry + 1
          });

          await addProgressPhoto(photo);
          
          log.info(`Photo ${photo.id} sauvegardée avec succès`, {
            photoId: photo.id,
            attempts,
            retries: i
          });

          if (!silent && i === 0) {
            // Ne montrer succès que si première tentative (évite spam si retry)
            showSuccess('Photo sauvegardée');
          } else if (!silent && i > 0) {
            // Si retry réussi, montrer message différent
            showSuccess(`Photo sauvegardée (après ${i} tentative(s))`);
          }

          return { success: true, retries: i, attempts };
        } catch (error) {
          lastError = error;
          log.warn(`Erreur tentative ${attempts} sauvegarde photo ${photo.id}`, {
            photoId: photo.id,
            attempt: attempts,
            error: error.message
          });

          // Si ce n'est pas la dernière tentative, attendre avant retry
          if (i < retry) {
            const delayMs = 1000 * (i + 1); // Backoff exponentiel: 1s, 2s, 3s...
            log.debug(`Retry dans ${delayMs}ms...`, { photoId: photo.id, nextAttempt: i + 2 });
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      // Toutes les tentatives ont échoué
      throw lastError || new Error('Erreur inconnue lors de la sauvegarde');
    } catch (error) {
      log.error(`Erreur sauvegarde photo ${photo.id}`, {
        photoId: photo.id,
        error: error.message,
        stack: error.stack
      });

      if (!silent) {
        showError(`Erreur sauvegarde photo: ${error.message || 'Erreur inconnue'}`);
      }

      return { success: false, error, attempts };
    }
  }, [addProgressPhoto, photoExists, showSuccess, showError]);

  /**
   * Sauvegarde plusieurs photos (parallèle ou séquentiel)
   * 
   * @param {Array<Object>} photos - Tableau de photos à sauvegarder
   * @param {Object} options - Options de sauvegarde (hérite de savePhoto)
   * @param {boolean} options.parallel - Sauvegarde parallèle (max 3 simultanées) (défaut: false)
   * @param {boolean} options.stopOnError - Arrêter si erreur (défaut: false, continue même si erreur)
   * @returns {Promise<Object>} { saved: number, total: number, results?: Array, errors?: Array }
   */
  const savePhotos = useCallback(async (photos, options = {}) => {
    const {
      parallel = false,      // Parallélisation (max 3 simultanées)
      stopOnError = false,  // Arrêter si erreur
      ...photoOptions        // Options héritées de savePhoto (silent, retry, skipIfExists)
    } = options;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      log.warn('Tentative sauvegarde photos vide ou invalide', { photos });
      return { saved: 0, total: 0, results: [], errors: [] };
    }

    log.info(`Début sauvegarde batch: ${photos.length} photo(s)`, {
      count: photos.length,
      parallel,
      stopOnError
    });

    try {
      if (parallel) {
        // ✅ Parallélisation avec limite (max 3 simultanées)
        const BATCH_SIZE = 3;
        const results = [];
        const allErrors = [];

        // Traiter par lots de 3
        for (let i = 0; i < photos.length; i += BATCH_SIZE) {
          const batch = photos.slice(i, i + BATCH_SIZE);
          
          log.debug(`Traitement batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(photos.length / BATCH_SIZE)}`, {
            batchStart: i,
            batchSize: batch.length,
            totalPhotos: photos.length
          });

          // Sauvegarder batch en parallèle
          const batchResults = await Promise.allSettled(
            batch.map(photo => savePhoto(photo, { ...photoOptions, silent: true }))
          );

          // Analyser résultats
          batchResults.forEach((result, index) => {
            const photo = batch[index];
            if (result.status === 'fulfilled' && result.value.success) {
              results.push({ photo, result: result.value });
            } else {
              const error = result.status === 'rejected' 
                ? result.reason 
                : result.value.error || new Error('Erreur inconnue');
              
              allErrors.push({ photo, error });
              
              log.warn(`Erreur sauvegarde photo ${photo?.id} dans batch`, {
                photoId: photo?.id,
                error: error.message
              });

              // Si stopOnError, arrêter immédiatement
              if (stopOnError) {
                throw error;
              }
            }
          });

          // Si stopOnError et erreur, arrêter
          if (stopOnError && allErrors.length > 0) {
            break;
          }
        }

        const saved = results.length;
        const errors = allErrors;

        log.info(`Sauvegarde batch terminée: ${saved}/${photos.length} photo(s) sauvegardée(s)`, {
          saved,
          total: photos.length,
          errors: errors.length
        });

        // Afficher message global si au moins une photo sauvegardée
        if (saved > 0 && !photoOptions.silent) {
          if (errors.length === 0) {
            showSuccess(`${saved}/${photos.length} photo(s) sauvegardée(s) avec succès`);
          } else {
            showWarning(`${saved}/${photos.length} photo(s) sauvegardée(s), ${errors.length} erreur(s)`);
          }
        }

        return { saved, total: photos.length, results, errors };
      } else {
        // ✅ Séquentiel (une par une)
        let saved = 0;
        const results = [];
        const errors = [];

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          
          log.debug(`Sauvegarde séquentielle ${i + 1}/${photos.length}`, {
            photoId: photo.id,
            progress: `${i + 1}/${photos.length}`
          });

          const result = await savePhoto(photo, { ...photoOptions, silent: true });
          
          if (result.success) {
            saved++;
            results.push({ photo, result });
          } else {
            errors.push({ photo, error: result.error });
            
            log.warn(`Erreur sauvegarde séquentielle photo ${photo.id}`, {
              photoId: photo.id,
              error: result.error?.message
            });

            // Si stopOnError, arrêter immédiatement
            if (stopOnError) {
              break;
            }
          }
        }

        log.info(`Sauvegarde séquentielle terminée: ${saved}/${photos.length} photo(s) sauvegardée(s)`, {
          saved,
          total: photos.length,
          errors: errors.length
        });

        // Afficher message global si au moins une photo sauvegardée
        if (saved > 0 && !photoOptions.silent) {
          if (errors.length === 0) {
            showSuccess(`${saved}/${photos.length} photo(s) sauvegardée(s) avec succès`);
          } else {
            showWarning(`${saved}/${photos.length} photo(s) sauvegardée(s), ${errors.length} erreur(s)`);
          }
        }

        return { saved, total: photos.length, results, errors };
      }
    } catch (error) {
      log.error('Erreur sauvegarde batch photos', {
        error: error.message,
        total: photos.length
      });

      if (!photoOptions.silent) {
        showError(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
      }

      return { saved: 0, total: photos.length, results: [], errors: [{ error }] };
    }
  }, [savePhoto, showSuccess, showWarning, showError]);

  return { savePhoto, savePhotos, photoExists };
};

export default usePhotoAutoSave;

