/**
 * Composant QuietQuestExportImport - Interface utilisateur pour l'export/import QuietQuest
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour l'export/import QuietQuest
 * 
 * @module components/tabs/SettingsTab/components/QuietQuestExportImport
 */

import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';

/**
 * Composant pour gérer l'export/import QuietQuest
 * 
 * @param {Object} props
 * @param {Object} quietQuestStats - Statistiques QuietQuest
 * @param {string} quietQuestExportStatus - Statut de l'export
 * @param {string} quietQuestImportStatus - Statut de l'import
 * @param {Function} handleExportQuietQuest - Fonction pour exporter
 * @param {Function} handleImportQuietQuest - Fonction pour importer
 * @returns {JSX.Element}
 */
const QuietQuestExportImport = ({
  quietQuestStats,
  quietQuestExportStatus,
  quietQuestImportStatus,
  handleExportQuietQuest,
  handleImportQuietQuest,
}) => {
  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <span className="mr-2">⚡</span>
          QuietQuest - Quêtes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Gérez vos quêtes, validations, XP et performances quotidiennes. Exportez et importez vos données de quêtes.
          </p>
          
          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-slate-400 text-xs">Quêtes</div>
              <div className="text-emerald-300 font-semibold">{quietQuestStats.questsCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-slate-400 text-xs">Validations</div>
              <div className="text-emerald-300 font-semibold">{quietQuestStats.validationsCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-slate-400 text-xs">Niveau</div>
              <div className="text-emerald-300 font-semibold">{quietQuestStats.userLevel}</div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Gestion complète de vos quêtes (récurrentes et exceptionnelles)</li>
              <li>• Suivi des validations et calcul automatique de l'XP</li>
              <li>• Stockage dans IndexedDB (performance optimale)</li>
              <li>• Export/Import au format JSON versionné avec métadonnées</li>
              <li>• Backup automatique avant import</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportQuietQuest}
              disabled={quietQuestExportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {quietQuestExportStatus === 'loading' ? 'Export en cours...' : 'Exporter QuietQuest'}
            </button>
            
            <button
              type="button"
              onClick={handleImportQuietQuest}
              disabled={quietQuestImportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {quietQuestImportStatus === 'loading' ? 'Import en cours...' : 'Importer QuietQuest'}
            </button>
          </div>

          {quietQuestExportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          {quietQuestExportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export
            </div>
          )}

          {quietQuestImportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Import réussi ! Les données ont été restaurées.
            </div>
          )}

          {quietQuestImportStatus === 'error' && (
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

export default QuietQuestExportImport;
