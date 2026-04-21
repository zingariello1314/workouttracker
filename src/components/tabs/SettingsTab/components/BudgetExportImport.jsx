import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';

const BudgetExportImport = ({
  budgetExportStatus,
  budgetImportStatus,
  handleExportBudgetData,
  handleImportBudgetData,
}) => {
  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <span className="mr-2">💰</span>
          Budget Personnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Gérez votre budget personnel : revenus, épargne, catégories, dépenses, dépenses planifiées et charges fixes. Exportez et importez toutes vos données budgétaires.
          </p>

          <div className={S.inset}>
            <h4 className="mb-2 font-medium text-red-100">Fonctionnalités :</h4>
            <ul className="space-y-1 text-sm text-red-100/80">
              <li>• Gestion complète de votre budget personnel (revenus, épargne, objectifs)</li>
              <li>• Suivi des dépenses par catégorie avec budgets mensuels</li>
              <li>• Gestion des dépenses planifiées et charges fixes récurrentes</li>
              <li>• Stockage dans IndexedDB (performance optimale)</li>
              <li>• Export/Import au format JSON versionné avec métadonnées</li>
              <li>• Intégration avec l'export global de l'application</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={handleExportBudgetData}
              disabled={budgetExportStatus === 'loading'}
              className={`${S.btnPrimary} w-full`}
            >
              <Download className="w-4 h-4" />
              {budgetExportStatus === 'loading' ? 'Export en cours...' : 'Exporter le Budget'}
            </button>

            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleImportBudgetData(event.target.result);
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              disabled={budgetImportStatus === 'loading'}
              className={`${S.btnSecondary} w-full`}
            >
              <Upload className="w-4 h-4" />
              {budgetImportStatus === 'loading' ? 'Import en cours...' : 'Importer le Budget'}
            </button>
          </div>

          {budgetExportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          {budgetExportStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export
            </div>
          )}

          {budgetImportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Import réussi ! Les données ont été restaurées.
            </div>
          )}

          {budgetImportStatus === 'error' && (
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

export default BudgetExportImport;
