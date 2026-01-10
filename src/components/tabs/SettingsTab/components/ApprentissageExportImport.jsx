/**
 * Composant ApprentissageExportImport - Interface utilisateur pour l'export/import Apprentissage
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour l'export/import Apprentissage
 * 
 * @module components/tabs/SettingsTab/components/ApprentissageExportImport
 */

import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';

/**
 * Composant pour gérer l'export/import Apprentissage
 * 
 * @param {Object} props
 * @param {Object} apprentissageStats - Statistiques Apprentissage
 * @param {string} apprentissageExportStatus - Statut de l'export
 * @param {string} apprentissageImportStatus - Statut de l'import
 * @param {Function} handleExportApprentissage - Fonction pour exporter
 * @param {Function} handleImportApprentissage - Fonction pour importer
 * @returns {JSX.Element}
 */
const ApprentissageExportImport = ({
  apprentissageStats,
  apprentissageExportStatus,
  apprentissageImportStatus,
  handleExportApprentissage,
  handleImportApprentissage,
}) => {
  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <span className="mr-2">📖</span>
          Apprentissage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Gérez vos matières, sessions d'étude, XP et progression. Exportez et importez vos données d'apprentissage.
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-cyan-300">📖 Apprentissage</h5>
              <ul className="text-sm text-gray-300 space-y-1">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportApprentissage}
              disabled={apprentissageExportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {apprentissageExportStatus === 'loading' ? 'Export en cours...' : 'Export Apprentissage'}
            </button>
            <button
              type="button"
              onClick={handleImportApprentissage}
              disabled={apprentissageImportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {apprentissageImportStatus === 'loading' ? 'Import en cours...' : 'Import Apprentissage'}
            </button>
          </div>

          {apprentissageExportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Export Apprentissage réussi !
            </div>
          )}

          {apprentissageExportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export Apprentissage
            </div>
          )}

          {apprentissageImportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Import Apprentissage réussi !
            </div>
          )}

          {apprentissageImportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
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
