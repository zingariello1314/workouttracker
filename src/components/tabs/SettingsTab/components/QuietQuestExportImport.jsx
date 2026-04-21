import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';

const QuietQuestExportImport = ({
  quietQuestStats,
  quietQuestExportStatus,
  quietQuestImportStatus,
  handleExportQuietQuest,
  handleImportQuietQuest,
}) => {
  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <span className="mr-2">⚡</span>
          QuietQuest - Quêtes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Gérez vos quêtes, validations, XP et performances quotidiennes. Exportez et importez vos données de quêtes.
          </p>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className={`${S.insetSm} text-center`}>
              <div className={S.mutedXs}>Quêtes</div>
              <div className="font-semibold text-rose-200">{quietQuestStats.questsCount}</div>
            </div>
            <div className={`${S.insetSm} text-center`}>
              <div className={S.mutedXs}>Validations</div>
              <div className="font-semibold text-rose-200">{quietQuestStats.validationsCount}</div>
            </div>
            <div className={`${S.insetSm} text-center`}>
              <div className={S.mutedXs}>Niveau</div>
              <div className="font-semibold text-rose-200">{quietQuestStats.userLevel}</div>
            </div>
          </div>

          <div className={S.inset}>
            <h4 className="mb-2 font-medium text-red-100">Fonctionnalités :</h4>
            <ul className="space-y-1 text-sm text-red-100/80">
              <li>• Gestion complète de vos quêtes (récurrentes et exceptionnelles)</li>
              <li>• Suivi des validations et calcul automatique de l'XP</li>
              <li>• Stockage dans IndexedDB (performance optimale)</li>
              <li>• Export/Import au format JSON versionné avec métadonnées</li>
              <li>• Backup automatique avant import</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={handleExportQuietQuest}
              disabled={quietQuestExportStatus === 'loading'}
              className={`${S.btnPrimary} w-full`}
            >
              <Download className="w-4 h-4" />
              {quietQuestExportStatus === 'loading' ? 'Export en cours...' : 'Exporter QuietQuest'}
            </button>

            <button
              type="button"
              onClick={handleImportQuietQuest}
              disabled={quietQuestImportStatus === 'loading'}
              className={`${S.btnSecondary} w-full`}
            >
              <Upload className="w-4 h-4" />
              {quietQuestImportStatus === 'loading' ? 'Import en cours...' : 'Importer QuietQuest'}
            </button>
          </div>

          {quietQuestExportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          {quietQuestExportStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export
            </div>
          )}

          {quietQuestImportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Import réussi ! Les données ont été restaurées.
            </div>
          )}

          {quietQuestImportStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'import
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuietQuestExportImport;
