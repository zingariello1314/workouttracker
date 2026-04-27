/**
 * Hook useDataMigration - Migration de données
 * 
 * ✅ PHASE 4 : Extraction de la logique de migration de données
 * 
 * Gère la migration des données anonymes vers un compte utilisateur
 * 
 * @module components/tabs/SettingsTab/hooks/useDataMigration
 */

import { useState, useCallback } from 'react';

/**
 * Hook pour gérer la migration de données
 * 
 * @param {Object} currentUser - Utilisateur actuel
 * @param {Function} linkAnonymousDataToUser - Fonction pour lier les données anonymes à un utilisateur
 * @returns {Object} { migrationStatus, migrationProgress, handleMigrateData }
 */
export const useDataMigration = (
  currentUser,
  linkAnonymousDataToUser,
  previewAnonymousMigration,
  rollbackAnonymousMigration
) => {
  const [migrationStatus, setMigrationStatus] = useState(null); // 'idle' | 'loading' | 'success' | 'error'
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0, message: '' });
  const [migrationPreview, setMigrationPreview] = useState(null);
  const [previewStatus, setPreviewStatus] = useState(null); // 'loading' | 'ready' | 'error' | null
  const [rollbackStatus, setRollbackStatus] = useState(null); // 'loading' | 'success' | 'error' | null

  const handlePreviewMigration = useCallback(async () => {
    if (!currentUser || !previewAnonymousMigration) return;
    setPreviewStatus('loading');
    try {
      const result = await previewAnonymousMigration();
      if (result?.success) {
        setMigrationPreview(result);
        setPreviewStatus('ready');
      } else {
        setPreviewStatus('error');
      }
    } catch {
      setPreviewStatus('error');
    }
  }, [currentUser, previewAnonymousMigration]);

  const handleRollbackMigration = useCallback(async () => {
    if (!currentUser || !rollbackAnonymousMigration) return;
    setRollbackStatus('loading');
    try {
      const result = await rollbackAnonymousMigration();
      setRollbackStatus(result?.success ? 'success' : 'error');
      setTimeout(() => setRollbackStatus(null), 5000);
    } catch {
      setRollbackStatus('error');
      setTimeout(() => setRollbackStatus(null), 5000);
    }
  }, [currentUser, rollbackAnonymousMigration]);

  const handleMigrateData = useCallback(async () => {
    if (!currentUser) return;
    if (!linkAnonymousDataToUser) {
      setMigrationStatus('error');
      setMigrationProgress({ current: 0, total: 0, message: 'Fonction de migration non disponible' });
      return;
    }

    setMigrationStatus('loading');
    setMigrationProgress({ current: 0, total: 9, message: 'Démarrage de la migration...' });
    
    const onProgress = (current, total, message) => {
      setMigrationProgress({ current, total, message });
    };
    
    try {
      const result = await linkAnonymousDataToUser(onProgress);
      if (result.success) {
        const totalSteps = result.totalSteps || 9;
        setMigrationStatus('success');
        const totalMigrated = 
          (result.migratedBooks || 0) + 
          (result.migratedNutrition || 0) + 
          (result.migratedBodyTracking || 0) + 
          (result.migratedGarmin || 0) + 
          (result.migratedPrograms || 0) +
          (result.migratedQuietQuest || 0) +
          (result.migratedApprentissage || 0) +
          (result.migratedFinance || 0) +
          (result.migratedGarminSettings || 0);
        setMigrationProgress({ 
          current: totalSteps, 
          total: totalSteps, 
          message: `Migration terminée : ${totalMigrated} entrées migrées au total` 
        });
      } else {
        setMigrationStatus('error');
        setMigrationProgress({ current: 0, total: 0, message: 'Erreur lors de la migration' });
      }
    } catch (error) {
      console.error('[SettingsTab] Erreur lors de la migration des données:', error);
      setMigrationStatus('error');
      setMigrationProgress({ current: 0, total: 0, message: 'Erreur lors de la migration' });
    } finally {
      setTimeout(() => {
        setMigrationStatus(null);
        setMigrationProgress({ current: 0, total: 0, message: '' });
      }, 5000);
    }
  }, [currentUser, linkAnonymousDataToUser]);

  return {
    migrationStatus,
    migrationProgress,
    migrationPreview,
    previewStatus,
    rollbackStatus,
    handleMigrateData,
    handlePreviewMigration,
    handleRollbackMigration,
  };
};

export default useDataMigration;
