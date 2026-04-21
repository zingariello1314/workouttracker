import React from 'react';
import { Download, Upload, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';

const BooksExportImport = ({
  booksStats,
  booksExportStatus,
  booksImportStatus,
  handleExportBooksData,
  handleImportBooksData,
}) => {
  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <BookOpen className="mr-2 text-red-400" size={20} />
          Livres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Gérez vos livres, sessions de lecture et métadonnées. Exportez et importez vos données de bibliothèque.
          </p>

          <div className={S.inset}>
            <h4 className="mb-2 font-medium text-red-100">Fonctionnalités :</h4>
            <ul className="space-y-1 text-sm text-red-100/80">
              <li>• Gestion complète de votre bibliothèque personnelle</li>
              <li>• Suivi des sessions de lecture (durée, pages lues, notes)</li>
              <li>• Stockage des couvertures et PDFs dans IndexedDB</li>
              <li>• Export/Import au format JSON versionné</li>
              <li>• Intégration avec l'export global de l'application</li>
            </ul>
          </div>

          <div className={`${S.inset} space-y-3`}>
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-rose-200">Bibliothèque</h5>
              <ul className="space-y-1 text-sm text-red-100/80">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={handleExportBooksData}
              disabled={booksExportStatus === 'loading'}
              className={`${S.btnPrimary} w-full`}
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
              className={`${S.btnSecondary} w-full`}
            >
              <Upload className="w-4 h-4" />
              {booksImportStatus === 'loading' ? 'Import en cours...' : 'Importer les Livres'}
            </button>
          </div>

          {booksExportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Export réussi ! Le fichier a été téléchargé.
            </div>
          )}

          {booksExportStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de l'export
            </div>
          )}

          {booksImportStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Import réussi ! Les livres ont été restaurés.
            </div>
          )}

          {booksImportStatus === 'error' && (
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

export default BooksExportImport;
