/**
 * Composant BudgetExportImport - Interface utilisateur pour l'export/import Budget
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour l'export/import Budget
 * 
 * @module components/tabs/SettingsTab/components/BudgetExportImport
 */

import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';

/**
 * Composant pour gérer l'export/import Budget
 * 
 * @param {Object} props
 * @param {string} budgetExportStatus - Statut de l'export
 * @param {string} budgetImportStatus - Statut de l'import
 * @param {Function} handleExportBudgetData - Fonction pour exporter
 * @param {Function} handleImportBudgetData - Fonction pour importer
 * @returns {JSX.Element}
 */
const BudgetExportImport = ({
  budgetExportStatus,
  budgetImportStatus,
  handleExportBudgetData,
  handleImportBudgetData,
}) => {
  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <span className="mr-2">💰</span>
          Budget Personnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Gérez votre budget personnel : revenus, épargne, catégories, dépenses, dépenses planifiées et charges fixes. Exportez et importez toutes vos données budgétaires.
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Gestion complète de votre budget personnel (revenus, épargne, objectifs)</li>
              <li>• Suivi des dépenses par catégorie avec budgets mensuels</li>
              <li>• Gestion des dépenses planifiées et charges fixes récurrentes</li>
              <li>• Stockage dans IndexedDB (performance optimale)</li>
              <li>• Export/Import au format JSON versionné avec métadonnées</li>
              <li>• Intégration avec l'export global de l'application</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportBudgetData}
              disabled={budgetExportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {budgetImportStatus === 'loading' ? 'Import en cours...' : 'Importer le Budget'}
            </button>
          </div>

          {budgetExportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          {budgetExportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export
            </div>
          )}

          {budgetImportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Import réussi ! Les données ont été restaurées.
            </div>
          )}

          {budgetImportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
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
