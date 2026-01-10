/**
 * Composant DataCleanupSection - Interface utilisateur pour le nettoyage des données
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour le nettoyage des données mockées
 * 
 * @module components/tabs/SettingsTab/components/DataCleanupSection
 */

import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';

/**
 * Composant pour gérer le nettoyage des données mockées
 * 
 * @param {Object} cleanupSettings - Données du hook useDataCleanup
 * @param {Function} updateData - Fonction pour mettre à jour les données
 * @param {Function} debugMockSessions - Fonction de debug (optionnelle)
 * @returns {JSX.Element}
 */
const DataCleanupSection = ({ cleanupSettings, updateData, debugMockSessions }) => {
  const { cleanupStatus, handleCleanupMockEndurance } = cleanupSettings;
  const t = useTranslation();

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <RotateCcw className="mr-2" size={20} />
          Nettoyage des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Supprimez toutes les données mockées/fausses détectées dans vos sessions d'endurance.
          </p>

          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-400 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-yellow-200">
                <strong>Attention :</strong> Cette fonction supprime toutes les données mockées/fausses d'endurance détectées automatiquement.
                <br />
                <br />
                <strong>Données supprimées :</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Sessions avec durée suspecte (880 min, 1200 min, etc.)</li>
                  <li>Sessions avec sauts suspectes (13200, 13000-13500, etc.)</li>
                  <li>Sessions natation avec distance suspecte (1.5m avec durée élevée)</li>
                  <li>Sessions avec dates futures</li>
                  <li>Toutes autres données mockées détectées</li>
                </ul>
                <br />
                Une sauvegarde automatique sera créée avant la suppression.
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {debugMockSessions && (
              <button
                type="button"
                onClick={debugMockSessions}
                className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1 flex items-center justify-center gap-2"
                title={t('settings.tooltips.cleanup.debugConsole')}
              >
                <AlertTriangle className="w-4 h-4" />
                Debug (Console)
              </button>
            )}
            
            <button
              type="button"
              onClick={handleCleanupMockEndurance}
              disabled={cleanupStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('settings.tooltips.cleanup.removeMocked')}
            >
              <AlertTriangle className="w-4 h-4" />
              {cleanupStatus === 'loading' ? 'Nettoyage...' : 'Supprimer mockées'}
            </button>
          </div>

          {cleanupStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Nettoyage réussi ! Les données mockées ont été supprimées.
            </div>
          )}

          {cleanupStatus === 'none' && (
            <div className="flex items-center text-blue-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Aucune donnée mockée trouvée. Vos données sont déjà propres.
            </div>
          )}

          {cleanupStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              {t('messages.errors.cleanupGeneric')}
            </div>
          )}

          {updateData && localStorage.getItem('workoutData_preCleanup_backup') && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const backup = localStorage.getItem('workoutData_preCleanup_backup');
                  if (backup) {
                    const parsedBackup = JSON.parse(backup);
                    await updateData(parsedBackup.data);
                    alert(`✅ ${t('messages.success.restoreBackup')}`);
                    window.location.reload();
                  }
                } catch (error) {
                  alert(`❌ ${t('messages.importExport.restoreError', { error: error.message })}`);
                }
              }}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurer la sauvegarde pré-nettoyage
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCleanupSection;
