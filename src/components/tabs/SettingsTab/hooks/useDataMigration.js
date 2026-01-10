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
export const useDataMigration = (currentUser, linkAnonymousDataToUser) => {
  const [migrationStatus, setMigrationStatus] = useState(null); // 'idle' | 'loading' | 'success' | 'error'
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0, message: '' });

  const handleMigrateData = useCallback(async () => {
    if (!currentUser) return;
    if (!linkAnonymousDataToUser) {
      setMigrationStatus('error');
      setMigrationProgress({ current: 0, total: 0, message: 'Fonction de migration non disponible' });
      return;
    }

    setMigrationStatus('loading');
    setMigrationProgress({ current: 0, total: 5, message: 'Démarrage de la migration...' });
    
    const onProgress = (current, total, message) => {
      setMigrationProgress({ current, total, message });
    };
    
    try {
      const result = await linkAnonymousDataToUser(onProgress);
      if (result.success) {
        setMigrationStatus('success');
        const totalMigrated = 
          (result.migratedBooks || 0) + 
          (result.migratedNutrition || 0) + 
          (result.migratedBodyTracking || 0) + 
          (result.migratedGarmin || 0) + 
          (result.migratedPrograms || 0);
        setMigrationProgress({ 
          current: 5, 
          total: 5, 
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
    handleMigrateData,
  };
};

export default useDataMigration;
