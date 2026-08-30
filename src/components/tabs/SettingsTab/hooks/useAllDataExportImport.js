/**
 * Hook useAllDataExportImport - Import/Export complet de toutes les données
 * 
 * ✅ PHASE 4 : Extraction de la logique d'import/export complet
 * 
 * Gère l'import/export de toutes les données : Body Tracking, toutes les données d'entraînement, Livres
 * 
 * @module components/tabs/SettingsTab/hooks/useAllDataExportImport
 */

import { useState, useRef, useCallback } from 'react';
import { 
  processImportData,
  validateBodyTrackingData 
} from '../../../BodyTracking/utils/exportImport';
import { 
  processBooksImportData 
} from '../../../../utils/booksExportImport';
import { 
  saveBooksToIndexedDB 
} from '../../../../utils/booksIndexedDB';
import {
  extractSportProgramContextFromImport,
  loadSportProgramContext,
  mergeProfileQuestionnaire,
  mergeSportProgramContext,
  mergeWorkoutMapFields,
  persistSportProgramContext
} from '../utils/sportExportBundle';
import { mergeGtgData } from '../../../../services/endurance/gtgDataMerge';

/**
 * Hook pour gérer l'import/export complet de toutes les données
 * 
 * @param {Object} data - Données actuelles
 * @param {Function} loadFromDB - Fonction pour charger depuis la DB
 * @param {Function} updateData - Fonction pour mettre à jour les données
 * @param {Function} validateAllWorkoutData - Fonction de validation (depuis useDataValidation)
 * @returns {Object} États et handlers pour l'import/export complet
 */
export const useAllDataExportImport = (
  data,
  loadFromDB,
  updateData,
  validateAllWorkoutData,
  { storageKey = 'anonymous', updateProfile = null, currentUser = null, importGarminData = null, onApplyProgramContext = null } = {}
) => {
  // États pour Body Tracking uniquement
  const [importStatus, setImportStatus] = useState(null);
  const [importData, setImportData] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // États pour import complet (toutes les données)
  const [allDataImportStatus, setAllDataImportStatus] = useState(null);
  const [showAllDataImportPreview, setShowAllDataImportPreview] = useState(false);
  const [allDataPreviewData, setAllDataPreviewData] = useState(null);

  const fileInputRef = useRef(null);

  // Handler pour charger un fichier
  const handleFileImport = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImportData(e.target.result);
    };
    reader.readAsText(file);
  }, []);

  // Prévisualisation de l'import Body Tracking uniquement
  const previewImport = useCallback(() => {
    try {
      const result = processImportData(importData, {
        validateData: true,
        validateVersion: true,
        createBackup: false
      });
      
      if (!result.valid) {
        setImportStatus('error');
        console.error('Erreurs de validation:', result.errors);
        return;
      }
      
      let dataToImport = result.data;
      
      if (dataToImport.exportType === 'Body Tracking Data') {
        dataToImport = {
          progressPhotos: dataToImport.progressPhotos || [],
          progressEntries: dataToImport.progressEntries || [],
          bodyTrackingReminders: dataToImport.bodyTrackingReminders || [],
          bodyTrackingLastUpdated: dataToImport.metadata?.lastUpdate || new Date().toISOString(),
          bodyTrackingPrefs: dataToImport.bodyTrackingPrefs || {}
        };
      } else if (dataToImport.data) {
        const fullData = dataToImport.data;
        dataToImport = {
          progressPhotos: fullData.progressPhotos || [],
          progressEntries: fullData.progressEntries || [],
          bodyTrackingReminders: fullData.bodyTrackingReminders || [],
          bodyTrackingLastUpdated: fullData.bodyTrackingLastUpdated || null,
          bodyTrackingPrefs: fullData.bodyTrackingPrefs || {}
        };
      }
      
      setPreviewData({
        data: dataToImport,
        stats: result.stats,
        warnings: result.warnings,
        isExportFormat: result.data.exportType === 'Body Tracking Data' || !!result.data.data
      });
      setShowImportPreview(true);
      setImportStatus('preview');
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error);
      setImportStatus('error');
    }
  }, [importData]);

  // Confirmer l'import Body Tracking uniquement
  const confirmImport = useCallback(async () => {
    try {
      setImportStatus('loading');
      
      const currentData = await loadFromDB();
      const backupData = currentData || data || {};
      localStorage.setItem('workoutData_preImport_backup', JSON.stringify({
        data: backupData,
        backupDate: new Date().toISOString()
      }));

      const validation = validateBodyTrackingData(previewData.data);
      
      if (!validation.valid) {
        setImportStatus('error');
        console.error('Validation échouée avant import:', validation.errors);
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }
      
      const existingData = backupData;
      const importedData = previewData.data;
      
      const mergedData = {
        ...existingData,
        progressPhotos: [
          ...(existingData.progressPhotos || []).filter(existingPhoto => {
            const existingDate = existingPhoto.date || existingPhoto.timestamp;
            return !(importedData.progressPhotos || []).some(importedPhoto => {
              const importedDate = importedPhoto.date || importedPhoto.timestamp;
              return existingDate === importedDate;
            });
          }),
          ...(importedData.progressPhotos || [])
        ],
        progressEntries: [
          ...(existingData.progressEntries || []).filter(existingEntry => {
            const existingKey = `${existingEntry.date || existingEntry.timestamp}_${existingEntry.type}`;
            return !(importedData.progressEntries || []).some(importedEntry => {
              const importedKey = `${importedEntry.date || importedEntry.timestamp}_${importedEntry.type}`;
              return existingKey === importedKey;
            });
          }),
          ...(importedData.progressEntries || [])
        ],
        bodyTrackingReminders: importedData.bodyTrackingReminders || existingData.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: new Date().toISOString(),
        bodyTrackingPrefs: importedData.bodyTrackingPrefs || existingData.bodyTrackingPrefs || {}
      };

      await updateData(mergedData);
      
      setImportStatus('success');
      setShowImportPreview(false);
      setImportData('');
      setPreviewData(null);
      
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
  }, [previewData, data, loadFromDB, updateData]);

  // Prévisualisation de l'import COMPLET (toutes les données d'entraînement)
  const previewImportAllData = useCallback(() => {
    try {
      if (!importData.trim()) {
        setAllDataImportStatus('error');
        return;
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(importData);
      } catch (parseError) {
        setAllDataImportStatus('error');
        console.error('Erreur de parsing JSON:', parseError);
        return;
      }
      
      const validation = validateAllWorkoutData(parsedData);
      if (!validation.isValid) {
        setAllDataPreviewData({
          data: null,
          rawExport: parsedData,
          stats: validation.stats,
          warnings: validation.warnings,
          errors: validation.errors,
          isExportFormat: !!parsedData.data || !!parsedData.metadata,
          booksPreview: null
        });
        setShowAllDataImportPreview(true);
        setAllDataImportStatus('preview');
        return;
      }

      // Prévisualisation des données Livres (si présentes dans l'export global)
      let booksPreview = null;
      let booksWarnings = [];
      try {
        const rawBooksExport =
          (parsedData.data && parsedData.data.booksData) || parsedData.booksData || null;

        if (rawBooksExport) {
          const booksResult = processBooksImportData(rawBooksExport);

          if (!booksResult.valid) {
            booksWarnings.push(
              `Livres: ${booksResult.errors?.[0] || 'Erreur de validation des données Livres'}`
            );
          } else {
            booksPreview = {
              valid: true,
              totalBooks: (booksResult.books || []).length,
              metadata: booksResult.metadata || null,
              books: booksResult.books || []
            };
          }
        }
      } catch (booksError) {
        console.warn('⚠️ Erreur lors de la prévisualisation des données Livres:', booksError);
        booksWarnings.push('Livres: erreur lors de la lecture des données (voir console).');
      }

      const combinedWarnings = [...validation.warnings, ...booksWarnings];

      setAllDataPreviewData({
        data: validation.data,
        rawExport: parsedData,
        stats: validation.stats,
        warnings: combinedWarnings,
        errors: validation.errors,
        isExportFormat: !!parsedData.data || !!parsedData.metadata,
        booksPreview
      });
      
      setShowAllDataImportPreview(true);
      setAllDataImportStatus('preview');
    } catch (error) {
      console.error('Erreur lors de la prévisualisation complète:', error);
      setAllDataImportStatus('error');
    }
  }, [importData, validateAllWorkoutData]);

  // Helper pour fusionner sessions sans doublons
  const mergeSessionsWithoutDuplicates = (existingSessions, importedSessions) => {
    if (!Array.isArray(existingSessions)) existingSessions = [];
    if (!Array.isArray(importedSessions)) importedSessions = [];
    
    const existingIds = new Set(existingSessions.map(s => String(s.id)));
    const existingDateTimes = new Map();
    existingSessions.forEach(s => {
      const key = `${s.date || ''}_${s.time || ''}`;
      if (key && key !== '_') {
        existingDateTimes.set(key, true);
      }
    });
    
    const newSessions = importedSessions.filter(imported => {
      const importedId = String(imported.id);
      const importedDateTime = `${imported.date || ''}_${imported.time || ''}`;
      
      if (importedId && existingIds.has(importedId)) {
        console.log(`⚠️ [Settings] Session avec ID dupliqué ignorée: ${importedId} (${imported.date} ${imported.time})`);
        return false;
      }
      
      if (importedDateTime && importedDateTime !== '_' && existingDateTimes.has(importedDateTime)) {
        console.log(`⚠️ [Settings] Session avec date/heure dupliquée ignorée: ${importedDateTime}`);
        return false;
      }
      
      return true;
    });
    
    return [...existingSessions, ...newSessions];
  };

  // Confirmer l'import COMPLET (toutes les données d'entraînement)
  const confirmImportAllData = useCallback(async () => {
    try {
      setAllDataImportStatus('loading');
      
      const currentData = await loadFromDB();
      const backupData = currentData || data || {};
      const existingProgramCtx = await loadSportProgramContext(storageKey);
      
      localStorage.setItem('workoutData_preImport_backup', JSON.stringify({
        data: backupData,
        programContext: existingProgramCtx,
        backupDate: new Date().toISOString()
      }));
      
      const importedData = allDataPreviewData.data;
      const mapMerged = mergeWorkoutMapFields(backupData, importedData);

      const backupEd = backupData.enduranceData || {};
      const importedEd = importedData.enduranceData || {};
      const backupSessions = backupEd.sessions || {};
      const importedSessions = importedEd.sessions || {};
      const sessionTypeKeys = new Set([
        ...Object.keys(backupSessions),
        ...Object.keys(importedSessions),
        'boxing',
        'pushups',
        'gainage',
        'swimming',
        'jumprope',
        'running'
      ]);
      const mergedSessions = {};
      sessionTypeKeys.forEach((type) => {
        const legacyBackup = backupEd[`${type}Sessions`];
        const legacyImported = importedEd[`${type}Sessions`];
        mergedSessions[type] = mergeSessionsWithoutDuplicates(
          backupSessions[type] || (Array.isArray(legacyBackup) ? legacyBackup : []) || [],
          importedSessions[type] || (Array.isArray(legacyImported) ? legacyImported : []) || []
        );
      });

      // Fusion intelligente : Fusionner avec données existantes
      const mergedData = {
        ...backupData,
        ...mapMerged,
        enduranceData: {
          ...backupEd,
          ...importedEd,
          sessions: mergedSessions,
          challenges: (() => {
            const existingChallenges = backupEd.challenges || [];
            const importedChallenges = importedEd.challenges || [];
            
            const existingChallengeIds = new Set(existingChallenges.map(c => String(c.id)));
            const existingChallengeKeys = new Map();
            existingChallenges.forEach(c => {
              const key = `${c.name || ''}_${c.activityType || ''}_${c.startDate || c.targetDate || ''}`;
              if (key && key !== '__') {
                existingChallengeKeys.set(key, true);
              }
            });
            
            const newChallenges = importedChallenges.filter(c => {
              const id = String(c.id);
              const key = `${c.name || ''}_${c.activityType || ''}_${c.startDate || c.targetDate || ''}`;
              
              if (id && id !== 'undefined' && existingChallengeIds.has(id)) {
                console.log(`⚠️ [Settings] Défi avec ID dupliqué ignoré: ${id} (${c.name})`);
                return false;
              }
              
              if (key && key !== '__' && existingChallengeKeys.has(key)) {
                console.log(`⚠️ [Settings] Défi avec nom/type/date dupliqués ignoré: ${key}`);
                return false;
              }
              
              return true;
            });
            
            return [...existingChallenges, ...newChallenges];
          })(),
          gtg: mergeGtgData(backupEd.gtg, importedEd.gtg)
        },
        progressPhotos: [
          ...(backupData.progressPhotos || []).filter(existingPhoto => {
            const existingDate = existingPhoto.date || existingPhoto.timestamp;
            return !(importedData.progressPhotos || []).some(importedPhoto => {
              const importedDate = importedPhoto.date || importedPhoto.timestamp;
              return existingDate === importedDate;
            });
          }),
          ...(importedData.progressPhotos || [])
        ],
        progressEntries: [
          ...(backupData.progressEntries || []).filter(existingEntry => {
            const existingKey = `${existingEntry.date || existingEntry.timestamp}_${existingEntry.type}`;
            return !(importedData.progressEntries || []).some(importedEntry => {
              const importedKey = `${importedEntry.date || importedEntry.timestamp}_${importedEntry.type}`;
              return existingKey === importedKey;
            });
          }),
          ...(importedData.progressEntries || [])
        ],
        programHistory: [
          ...(backupData.programHistory || []),
          ...(importedData.programHistory || []).filter(imported => {
            return !(backupData.programHistory || []).some(existing => 
              existing.id === imported.id || 
              (existing.startDate === imported.startDate && existing.endDate === imported.endDate)
            );
          })
        ],
        exerciseMaxRecords: [
          ...(backupData.exerciseMaxRecords || []),
          ...(importedData.exerciseMaxRecords || [])
        ],
        exerciseMaxHistory: [
          ...(backupData.exerciseMaxHistory || []),
          ...(importedData.exerciseMaxHistory || [])
        ],
        performanceRetestPlans: [
          ...(backupData.performanceRetestPlans || []),
          ...(importedData.performanceRetestPlans || [])
        ],
        pyramidSessionLog: [
          ...(backupData.pyramidSessionLog || []),
          ...(importedData.pyramidSessionLog || [])
        ],
        startDate: importedData.startDate || backupData.startDate || null,
        weekVariant: importedData.weekVariant || backupData.weekVariant || 'A',
        dailyVariationsVersion: importedData.dailyVariationsVersion || backupData.dailyVariationsVersion || '1.0',
        dayJustificationsVersion: importedData.dayJustificationsVersion || backupData.dayJustificationsVersion || '1.0',
        circuitDefinitionsVersion: importedData.circuitDefinitionsVersion || backupData.circuitDefinitionsVersion || '1.0',
        bodyTrackingReminders: importedData.bodyTrackingReminders || backupData.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: new Date().toISOString(),
        bodyTrackingPrefs: importedData.bodyTrackingPrefs || backupData.bodyTrackingPrefs || {}
      };

      // Nettoyer les IDs dupliqués dans les sessions après fusion
      const cleanDuplicateSessionIds = (sessions) => {
        const cleaned = {};
        let hasChanges = false;
        
        Object.entries(sessions).forEach(([activityType, activitySessions]) => {
          if (!Array.isArray(activitySessions)) {
            cleaned[activityType] = activitySessions;
            return;
          }
          
          const idMap = new Map();
          const duplicateIds = new Set();
          
          activitySessions.forEach((session, idx) => {
            const id = String(session.id);
            if (idMap.has(id)) {
              duplicateIds.add(id);
              idMap.get(id).push(idx);
            } else {
              idMap.set(id, [idx]);
            }
          });
          
          if (duplicateIds.size > 0) {
            console.log(`⚠️ [Settings] ${duplicateIds.size} ID(s) dupliqué(s) détecté(s) après fusion pour ${activityType}:`, Array.from(duplicateIds));
            
            cleaned[activityType] = activitySessions.map((session, idx) => {
              const id = String(session.id);
              if (duplicateIds.has(id)) {
                const occurrences = idMap.get(id);
                const isFirst = occurrences[0] === idx;
                if (!isFirst) {
                  hasChanges = true;
                  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idx}-${activityType}-import`;
                  console.log(`  🔄 [Settings] Régénération ID pour ${activityType}[${idx}]: ${id} → ${newId}`);
                  return {
                    ...session,
                    id: newId
                  };
                }
              }
              return session;
            });
          } else {
            cleaned[activityType] = activitySessions;
          }
        });
        
        return { cleaned, hasChanges };
      };
      
      // Nettoyer les sessions d'endurance après fusion
      if (mergedData.enduranceData?.sessions) {
        const { cleaned, hasChanges } = cleanDuplicateSessionIds(mergedData.enduranceData.sessions);
        if (hasChanges) {
          console.log('✅ [Settings] Nettoyage des IDs dupliqués effectué après fusion (sessions)');
          mergedData.enduranceData.sessions = cleaned;
        }
      }
      
      // Nettoyer aussi les défis dupliqués après fusion
      if (mergedData.enduranceData?.challenges) {
        const challengeIdMap = new Map();
        const duplicateChallengeIds = new Set();
        
        mergedData.enduranceData.challenges.forEach((challenge, idx) => {
          const id = String(challenge.id);
          if (challengeIdMap.has(id)) {
            duplicateChallengeIds.add(id);
            challengeIdMap.get(id).push(idx);
          } else {
            challengeIdMap.set(id, [idx]);
          }
        });
        
        if (duplicateChallengeIds.size > 0) {
          console.log(`⚠️ [Settings] ${duplicateChallengeIds.size} ID(s) dupliqué(s) détecté(s) après fusion pour les défis:`, Array.from(duplicateChallengeIds));
          
          mergedData.enduranceData.challenges = mergedData.enduranceData.challenges.map((challenge, idx) => {
            const id = String(challenge.id);
            if (duplicateChallengeIds.has(id)) {
              const occurrences = challengeIdMap.get(id);
              const isFirst = occurrences[0] === idx;
              if (!isFirst) {
                const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idx}-challenge-import`;
                console.log(`  🔄 [Settings] Régénération ID pour challenge[${idx}]: ${id} → ${newId}`);
                return {
                  ...challenge,
                  id: newId
                };
              }
            }
            return challenge;
          });
          
          console.log('✅ [Settings] Nettoyage des IDs dupliqués effectué après fusion (défis)');
        }
      }
      
      // Sauvegarder les données fusionnées et nettoyées
      await updateData(mergedData);

      const programCtx = extractSportProgramContextFromImport(importedData);
      if (programCtx) {
        const existingCtx = await loadSportProgramContext(storageKey);
        const mergedCtx = mergeSportProgramContext(existingCtx, programCtx);
        await persistSportProgramContext(storageKey, mergedCtx);
        onApplyProgramContext?.(mergedCtx);
      }

      const questionnaire = importedData.profileQuestionnaire
        ?? importedData.userProfileSnapshot?.profileQuestionnaire;
      if (questionnaire && updateProfile && currentUser?.id) {
        try {
          const mergedQuestionnaire = mergeProfileQuestionnaire(
            currentUser.profileQuestionnaire,
            questionnaire
          );
          await updateProfile(currentUser.id, {
            profileQuestionnaire: mergedQuestionnaire
          });
        } catch (profileErr) {
          console.warn('[Settings] Import questionnaire profil ignoré:', profileErr);
        }
      }

      // Importer Garmin si présent dans l'export
      const garminPayload =
        allDataPreviewData?.rawExport?.data?.garminData
        || allDataPreviewData?.rawExport?.garminData;
      if (garminPayload && importGarminData) {
        try {
          await importGarminData(garminPayload);
          console.log('[Settings] ✅ Import Garmin réussi depuis export complet');
        } catch (garminErr) {
          console.warn('[Settings] Import Garmin depuis export complet ignoré:', garminErr);
        }
      }

      // Importer les livres si présents dans l'export
      const booksPreview = allDataPreviewData?.booksPreview;
      if (booksPreview && booksPreview.valid && Array.isArray(booksPreview.books)) {
        const booksToSave = booksPreview.books;
        try {
          const indexedOk = await saveBooksToIndexedDB(booksToSave);
          if (indexedOk) {
            console.log(`[Settings] ✅ Import Livres réussi (${booksToSave.length} livres restaurés dans IndexedDB depuis l'export global)`);
          } else {
            console.warn(`[Settings] ⚠️ Échec sauvegarde IndexedDB pour ${booksToSave.length} livres`);
          }
        } catch (booksError) {
          console.error('❌ Erreur lors de la sauvegarde des Livres en IndexedDB:', booksError);
        }
      }

      // Forcer rechargement depuis IndexedDB
      const reloadedData = await loadFromDB();
      if (reloadedData) {
        console.log('[Settings] ✅ Import complet réussi, données rechargées depuis IndexedDB');
      }
      
      setAllDataImportStatus('success');
      setShowAllDataImportPreview(false);
      setImportData('');
      setAllDataPreviewData(null);
      
      setTimeout(() => {
        setAllDataImportStatus(null);
        if (window.confirm('Import réussi ! Voulez-vous recharger la page pour voir les changements ?')) {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'import complet:', error);
      setAllDataImportStatus('error');
      setTimeout(() => setAllDataImportStatus(null), 5000);
    }
  }, [allDataPreviewData, data, loadFromDB, updateData, storageKey, updateProfile, currentUser, importGarminData, onApplyProgramContext]);

  // Restaurer le backup pré-import
  const restorePreImportBackup = useCallback(async () => {
    try {
      const backup = localStorage.getItem('workoutData_preImport_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        await updateData(parsedBackup.data);
        if (parsedBackup.programContext) {
          await persistSportProgramContext(storageKey, parsedBackup.programContext);
          onApplyProgramContext?.(parsedBackup.programContext);
        }
        setImportStatus('restored');
        setTimeout(() => setImportStatus(null), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la restauration du backup:', error);
    }
  }, [updateData, storageKey, onApplyProgramContext]);

  return {
    // États Body Tracking
    importStatus,
    importData,
    setImportData,
    showImportPreview,
    setShowImportPreview,
    previewData,
    
    // États Import complet
    allDataImportStatus,
    showAllDataImportPreview,
    setShowAllDataImportPreview,
    allDataPreviewData,
    
    // Refs
    fileInputRef,
    
    // Handlers
    handleFileImport,
    previewImport,
    confirmImport,
    previewImportAllData,
    confirmImportAllData,
    restorePreImportBackup,
  };
};

export default useAllDataExportImport;
