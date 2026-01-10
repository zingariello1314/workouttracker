/**
 * Composant BooksExportImport - Interface utilisateur pour l'export/import Livres
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour l'export/import Livres
 * 
 * @module components/tabs/SettingsTab/components/BooksExportImport
 */

import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';

/**
 * Composant pour gérer l'export/import Livres
 * 
 * @param {Object} props
 * @param {Object} booksStats - Statistiques Livres
 * @param {string} booksExportStatus - Statut de l'export
 * @param {string} booksImportStatus - Statut de l'import
 * @param {Function} handleExportBooksData - Fonction pour exporter
 * @param {Function} handleImportBooksData - Fonction pour importer
 * @returns {JSX.Element}
 */
const BooksExportImport = ({
  booksStats,
  booksExportStatus,
  booksImportStatus,
  handleExportBooksData,
  handleImportBooksData,
}) => {
  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <BookOpen className="mr-2" size={20} />
          Livres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Gérez vos livres, sessions de lecture et métadonnées. Exportez et importez vos données de bibliothèque.
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Gestion complète de votre bibliothèque personnelle</li>
              <li>• Suivi des sessions de lecture (durée, pages lues, notes)</li>
              <li>• Stockage des couvertures et PDFs dans IndexedDB</li>
              <li>• Export/Import au format JSON versionné</li>
              <li>• Intégration avec l'export global de l'application</li>
            </ul>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-indigo-300">📚 Bibliothèque</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Livres : {booksStats.totalBooks} livre{booksStats.totalBooks !== 1 ? 's' : ''}</li>
                <li>• Sessions de lecture : {booksStats.totalSessions} session{booksStats.totalSessions !== 1 ? 's' : ''}</li>
                <li>• En cours : {booksStats.inProgress} livre{booksStats.inProgress !== 1 ? 's' : ''}</li>
                <li>• Terminés : {booksStats.completed} livre{booksStats.completed !== 1 ? 's' : ''}</li>
                <li>• Couvertures et PDFs</li>
                <li>• Métadonnées complètes</li>
                <li>• Historique de lecture</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportBooksData}
              disabled={booksExportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {booksExportStatus === 'loading' ? 'Export en cours...' : 'Exporter les Livres'}
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
                    handleImportBooksData(event.target.result);
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
              disabled={booksImportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {booksImportStatus === 'loading' ? 'Import en cours...' : 'Importer les Livres'}
            </button>
          </div>

          {booksExportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          {booksExportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export
            </div>
          )}

          {booksImportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Import réussi ! Les livres ont été restaurés.
            </div>
          )}

          {booksImportStatus === 'error' && (
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

export default BooksExportImport;
