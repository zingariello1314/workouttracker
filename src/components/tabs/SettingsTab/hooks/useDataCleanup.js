/**
 * Hook useDataCleanup - Nettoyage des données mockées
 * 
 * ✅ PHASE 4 : Extraction de la logique de nettoyage des données
 * 
 * Nettoie les données mockées (sessions d'endurance mockées)
 * 
 * @module components/tabs/SettingsTab/hooks/useDataCleanup
 */

import { useState, useCallback } from 'react';

/**
 * Hook pour gérer le nettoyage des données mockées
 * 
 * @param {Function} deleteMockEnduranceSessions - Fonction pour supprimer les sessions mockées
 * @param {Function} loadFromDB - Fonction pour charger les données depuis la DB
 * @param {Object} data - Données actuelles
 * @param {Function} t - Fonction de traduction
 * @returns {Object} { cleanupStatus, handleCleanupMockEndurance }
 */
export const useDataCleanup = (deleteMockEnduranceSessions, loadFromDB, data, t) => {
  const [cleanupStatus, setCleanupStatus] = useState(null); // 'success' | 'error' | 'loading' | 'none' | null

  const handleCleanupMockEndurance = useCallback(async () => {
    try {
      if (!window.confirm(
        '⚠️ Supprimer toutes les données mockées/fausses d\'endurance ?\n\n' +
        'Cela supprimera :\n' +
        '- Sessions avec durée suspecte (880 min, etc.)\n' +
        '- Sessions avec sauts suspectes (13200, etc.)\n' +
        '- Sessions natation avec distance suspecte (1.5m)\n' +
        '- Toutes les autres données mockées détectées\n\n' +
        'Cette action est irréversible. Une sauvegarde sera créée avant la suppression.'
      )) {
        return;
      }

      setCleanupStatus('loading');

      // Créer backup avant nettoyage
      const currentData = await loadFromDB();
      const backupData = currentData || data || {};
      localStorage.setItem('workoutData_preCleanup_backup', JSON.stringify({
        data: backupData,
        backupDate: new Date().toISOString()
      }));

      // Supprimer les sessions mockées
      const result = await deleteMockEnduranceSessions();

      if (result.deleted > 0) {
        setCleanupStatus('success');
        const detailsText = Object.entries(result.details)
          .filter(([_, count]) => count > 0)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        
        alert(`✅ ${result.deleted} session(s) mockée(s) supprimée(s) !\n\nDétails : ${detailsText}\n\nRechargez la page pour voir les changements.`);
        
        setTimeout(() => {
          setCleanupStatus(null);
          if (window.confirm(t('messages.importExport.reloadConfirm'))) {
            window.location.reload();
          }
        }, 3000);
      } else {
        setCleanupStatus('none');
        alert('ℹ️ Aucune session mockée trouvée. Vos données sont déjà propres.');
        setTimeout(() => setCleanupStatus(null), 3000);
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des sessions mockées:', error);
      setCleanupStatus('error');
      alert(`❌ ${t('messages.errors.cleanup', { error: error.message })}`);
      setTimeout(() => setCleanupStatus(null), 5000);
    }
  }, [deleteMockEnduranceSessions, loadFromDB, data, t]);

  return {
    cleanupStatus,
    handleCleanupMockEndurance,
  };
};

export default useDataCleanup;
