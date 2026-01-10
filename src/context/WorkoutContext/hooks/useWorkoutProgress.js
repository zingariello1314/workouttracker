/**
 * Hook pour la gestion des progressions (entrées et photos)
 * 
 * ✅ PHASE 4 : Extraction de la logique des progressions
 * 
 * @module context/WorkoutContext/hooks/useWorkoutProgress
 */

import { useCallback } from 'react';

/**
 * Hook pour gérer les progressions (entrées et photos)
 * 
 * @param {Function} getCurrentData - Fonction pour obtenir les données actuelles
 * @param {Function} updateData - Fonction pour mettre à jour les données
 * @returns {Object} { addProgressEntry, updateProgressEntry, deleteProgressEntry, deleteProgressEntryField, addProgressPhoto, updateProgressPhoto, deleteProgressPhoto }
 */
export const useWorkoutProgress = (getCurrentData, updateData) => {
  const addProgressEntry = useCallback(async (entryData) => {
    try {
      if (!entryData || !entryData.type) {
        throw new Error('Données d\'entrée de progression invalides');
      }

      const entryDate = entryData.date 
        ? new Date(entryData.date).toISOString()
        : new Date().toISOString();
      
      const entryDateKey = entryDate.split('T')[0];

      const validatedEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: entryDate,
        timestamp: entryData.timestamp || new Date(entryDate).getTime(),
        type: entryData.type,
        ...entryData,
        savedAt: Date.now(),
        version: '1.0'
      };

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      
      const existingEntryIndex = progressEntries.findIndex(entry => {
        const existingDate = entry.date 
          ? new Date(entry.date).toISOString().split('T')[0]
          : entry.timestamp 
            ? new Date(entry.timestamp).toISOString().split('T')[0]
            : null;
        
        return existingDate === entryDateKey && entry.type === entryData.type;
      });

      let updatedEntries;
      let action = 'added';
      
      if (existingEntryIndex !== -1) {
        const existingEntry = progressEntries[existingEntryIndex];
        const isNewer = validatedEntry.savedAt > (existingEntry.savedAt || 0);
        
        if (isNewer) {
          updatedEntries = [...progressEntries];
          updatedEntries[existingEntryIndex] = {
            ...validatedEntry,
            id: existingEntry.id,
            savedAt: validatedEntry.savedAt
          };
          action = 'replaced';
        } else {
          const mergedEntry = {
            ...existingEntry,
            ...Object.keys(validatedEntry).reduce((acc, key) => {
              if (['id', 'savedAt', 'version'].includes(key)) {
                acc[key] = existingEntry[key];
              } else if ((existingEntry[key] == null || existingEntry[key] === '') && validatedEntry[key] != null && validatedEntry[key] !== '') {
                acc[key] = validatedEntry[key];
              } else {
                acc[key] = existingEntry[key];
              }
              return acc;
            }, {}),
            savedAt: Date.now()
          };
          
          updatedEntries = [...progressEntries];
          updatedEntries[existingEntryIndex] = mergedEntry;
          action = 'merged';
        }
      } else {
        updatedEntries = [...progressEntries, validatedEntry];
        action = 'added';
      }
      
      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      const finalEntry = existingEntryIndex !== -1 
        ? updatedEntries[existingEntryIndex] 
        : updatedEntries[updatedEntries.length - 1];
      
      return { 
        success: true, 
        entry: finalEntry,
        action
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'entrée de progression:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const updateProgressEntry = useCallback(async (entryId, updates) => {
    try {
      if (!entryId) {
        throw new Error('ID d\'entrée de progression invalide');
      }

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      const entryIndex = progressEntries.findIndex(entry => entry.id === entryId);

      if (entryIndex === -1) {
        throw new Error('Entrée de progression non trouvée');
      }

      const existingEntry = progressEntries[entryIndex];
      const updatedEntry = {
        ...existingEntry,
        ...updates,
        date: updates.date ? new Date(updates.date).toISOString() : existingEntry.date,
        timestamp: updates.date ? new Date(updates.date).getTime() : (updates.timestamp || existingEntry.timestamp),
        savedAt: Date.now()
      };

      const updatedEntries = [...progressEntries];
      updatedEntries[entryIndex] = updatedEntry;

      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      console.log(`✅ Entrée de progression mise à jour: ${entryId}`);
      return { success: true, entry: updatedEntry };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'entrée de progression:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const deleteProgressEntry = useCallback(async (entryId) => {
    try {
      if (!entryId) {
        throw new Error('ID d\'entrée de progression invalide');
      }

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      const entryIndex = progressEntries.findIndex(entry => entry.id === entryId);

      if (entryIndex === -1) {
        throw new Error('Entrée de progression non trouvée');
      }

      const updatedEntries = progressEntries.filter((_, index) => index !== entryIndex);
      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      console.log(`✅ Entrée de progression supprimée: ${entryId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'entrée de progression:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const deleteProgressEntryField = useCallback(async (entryId, fieldName) => {
    try {
      if (!entryId || !fieldName) {
        throw new Error('ID d\'entrée ou nom de champ invalide');
      }

      const currentData = getCurrentData();
      const progressEntries = currentData.progressEntries || [];
      const entryIndex = progressEntries.findIndex(entry => entry.id === entryId);

      if (entryIndex === -1) {
        throw new Error('Entrée de progression non trouvée');
      }

      const existingEntry = progressEntries[entryIndex];
      const updatedEntry = {
        ...existingEntry,
        [fieldName]: null,
        savedAt: Date.now()
      };

      const updatedEntries = [...progressEntries];
      updatedEntries[entryIndex] = updatedEntry;

      const updatedData = {
        ...currentData,
        progressEntries: updatedEntries,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      console.log(`✅ Champ ${fieldName} supprimé de l'entrée: ${entryId}`);
      return { success: true, entry: updatedEntry };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du champ:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const addProgressPhoto = useCallback(async (photoData) => {
    try {
      const { validateAndNormalizePhotoData } = await import('../../../components/BodyTracking/utils/photoNormalizer');
      
      const normalizedPhotoData = validateAndNormalizePhotoData(photoData);

      const validatedPhoto = {
        id: normalizedPhotoData.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: normalizedPhotoData.date || new Date().toISOString(),
        weight: normalizedPhotoData.weight ? parseFloat(normalizedPhotoData.weight) : null,
        notes: normalizedPhotoData.notes || '',
        url: normalizedPhotoData.url,
        measurements: normalizedPhotoData.measurements || {},
        angle: normalizedPhotoData.angle || 'front',
        tags: normalizedPhotoData.tags || ['progress'],
        ...(normalizedPhotoData.resolutions && typeof normalizedPhotoData.resolutions === 'object'
          ? { resolutions: normalizedPhotoData.resolutions }
          : {}),
        savedAt: Date.now(),
        version: '2.0',
        filename: normalizedPhotoData.filename || 'progress_photo.jpg',
        type: normalizedPhotoData.type || 'photo',
        ...(normalizedPhotoData.compression ? { compression: normalizedPhotoData.compression } : {})
      };

      const currentData = getCurrentData();
      const updatedData = {
        ...currentData,
        progressPhotos: [...(currentData.progressPhotos || []), validatedPhoto],
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      return { success: true, photo: validatedPhoto };
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la photo de progression:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const updateProgressPhoto = useCallback(async (photoId, updates) => {
    try {
      if (!photoId || typeof photoId !== 'string') {
        throw new Error('ID de photo invalide');
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Updates invalides');
      }

      const currentData = getCurrentData();
      const progressPhotos = currentData.progressPhotos || [];
      
      const photoIndex = progressPhotos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) {
        throw new Error(`Photo avec ID "${photoId}" non trouvée`);
      }

      const existingPhoto = progressPhotos[photoIndex];

      const updatedPhoto = {
        ...existingPhoto,
        ...updates,
        resolutions: updates.resolutions !== undefined 
          ? updates.resolutions 
          : existingPhoto.resolutions,
        analysis: updates.analysis 
          ? {
              ...existingPhoto.analysis,
              ...updates.analysis,
              analyzedAt: updates.analysis.analyzedAt || existingPhoto.analysis?.analyzedAt || new Date().toISOString()
            }
          : existingPhoto.analysis,
        url: updates.url !== undefined 
          ? updates.url 
          : (existingPhoto.url || (existingPhoto.resolutions?.preview?.data || existingPhoto.resolutions?.full?.data)),
        updatedAt: Date.now(),
        version: existingPhoto.version || '2.0'
      };

      const updatedPhotos = [...progressPhotos];
      updatedPhotos[photoIndex] = updatedPhoto;

      const updatedData = {
        ...currentData,
        progressPhotos: updatedPhotos,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      return { success: true, photo: updatedPhoto };
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la photo de progression:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  const deleteProgressPhoto = useCallback(async (photoId) => {
    try {
      if (!photoId || typeof photoId !== 'string') {
        throw new Error('ID de photo invalide');
      }

      const currentData = getCurrentData();
      const progressPhotos = currentData.progressPhotos || [];
      
      const photoIndex = progressPhotos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) {
        throw new Error(`Photo avec ID "${photoId}" non trouvée`);
      }

      const updatedPhotos = progressPhotos.filter(photo => photo.id !== photoId);
      
      const updatedData = {
        ...currentData,
        progressPhotos: updatedPhotos,
        bodyTrackingLastUpdated: new Date().toISOString()
      };

      await updateData(updatedData);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la photo de progression:', error);
      throw error;
    }
  }, [getCurrentData, updateData]);

  return {
    addProgressEntry,
    updateProgressEntry,
    deleteProgressEntry,
    deleteProgressEntryField,
    addProgressPhoto,
    updateProgressPhoto,
    deleteProgressPhoto,
  };
};
