/**
 * Composant DataCleanupSection - Nettoyage des données mockées
 *
 * @module components/tabs/SettingsTab/components/DataCleanupSection
 */

import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';
import { settingsTheme as S } from '../settingsThemeClasses';

const DataCleanupSection = ({ cleanupSettings, updateData, debugMockSessions }) => {
  const { cleanupStatus, handleCleanupMockEndurance } = cleanupSettings;
  const t = useTranslation();

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <RotateCcw className="mr-2 text-red-400" size={20} />
          Nettoyage des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Supprimez toutes les données mockées/fausses détectées dans vos sessions d'endurance.
          </p>

          <div className="rounded-lg border border-red-600/45 bg-red-950/35 p-4">
            <div className="flex items-start">
              <AlertTriangle className="mr-2 mt-0.5 text-red-400" size={16} />
              <div className="text-sm text-red-100/90">
                <strong>Attention :</strong> Cette fonction supprime toutes les données mockées/fausses d'endurance détectées automatiquement.
                <br />
                <br />
                <strong>Données supprimées :</strong>
                <ul className="mt-2 list-inside list-disc space-y-1">
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
                className={`${S.btnSecondary} flex-1`}
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
              className={`${S.btnPrimary} flex-1`}
              title={t('settings.tooltips.cleanup.removeMocked')}
            >
              <AlertTriangle className="w-4 h-4" />
              {cleanupStatus === 'loading' ? 'Nettoyage...' : 'Supprimer mockées'}
            </button>
          </div>

          {cleanupStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Nettoyage réussi ! Les données mockées ont été supprimées.
            </div>
          )}

          {cleanupStatus === 'none' && (
            <div className="flex items-center text-sm text-rose-300">
              <CheckCircle className="mr-2" size={16} />
              Aucune donnée mockée trouvée. Vos données sont déjà propres.
            </div>
          )}

          {cleanupStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
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
              className={`${S.btnSecondary} w-full`}
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
