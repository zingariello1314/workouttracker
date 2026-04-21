import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';

const ApprentissageExportImport = ({
  apprentissageStats,
  apprentissageExportStatus,
  apprentissageImportStatus,
  handleExportApprentissage,
  handleImportApprentissage,
}) => {
  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <span className="mr-2">📖</span>
          Apprentissage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Gérez vos matières, sessions d'étude, XP et progression. Exportez et importez vos données d'apprentissage.
          </p>

          <div className={`${S.inset} space-y-3`}>
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-rose-200">Apprentissage</h5>
              <ul className="space-y-1 text-sm text-red-100/80">
                <li>• Matières : {apprentissageStats.subjectsCount} matière{apprentissageStats.subjectsCount !== 1 ? 's' : ''}</li>
                <li>• Sessions : {apprentissageStats.sessionsCount} session{apprentissageStats.sessionsCount !== 1 ? 's' : ''}</li>
                <li>• Niveau global : {apprentissageStats.globalLevel}</li>
                <li>• XP total : {apprentissageStats.globalXP}</li>
                <li>• Temps d'étude : {Math.floor(apprentissageStats.totalStudyTime / 3600)}h</li>
                <li>• Progression et badges</li>
                <li>• Historique complet</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={handleExportApprentissage}
              disabled={apprentissageExportStatus === 'loading'}
              className={`${S.btnPrimary} w-full`}
            >
              <Download className="w-4 h-4" />
              {apprentissageExportStatus === 'loading' ? 'Export en cours...' : 'Export Apprentissage'}
            </button>
            <button
              type="button"
              onClick={handleImportApprentissage}
              disabled={apprentissageImportStatus === 'loading'}
              className={`${S.btnSecondary} w-full`}
            >
              <Upload className="w-4 h-4" />
              {apprentissageImportStatus === 'loading' ? 'Import en cours...' : 'Import Apprentissage'}
            </button>
          </div>

          {apprentissageExportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Export Apprentissage réussi !
            </div>
          )}

          {apprentissageExportStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export Apprentissage
            </div>
          )}

          {apprentissageImportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Import Apprentissage réussi !
            </div>
          )}

          {apprentissageImportStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'import Apprentissage
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprentissageExportImport;
