/**
 * Composant ExportImportSection - Section principale Export/Import
 * 
 * ✅ PHASE 4 : Extraction de l'UI principale pour Export/Import
 * 
 * Regroupe toutes les sections d'export/import : Sport complet, Body Tracking, Garmin, Nutrition, etc.
 * 
 * @module components/tabs/SettingsTab/components/ExportImportSection
 */

import React from 'react';
import { Download, Upload, FileText, BookOpen, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';
import { settingsTheme as S } from '../settingsThemeClasses';
import { SportExportPreviewContent } from './SportExportPreviewContent';

/**
 * Section Export - Tous les exports
 * 
 * @param {Object} props
 * @param {Object} data - Données actuelles
 * @param {Object} stats - Statistiques (QuietQuest, Books, Apprentissage)
 * @param {Object} exportSettings - Données du hook useSettingsExport
 * @returns {JSX.Element}
 */
export const ExportSection = ({
  data,
  stats,
  exportSettings,
  sportPreview = null,
  sportPreviewLoading = false,
  garminSummary = null,
  garminDailyIndex = null,
  nutritionSummary = null
}) => {
  const t = useTranslation();
  const {
    exportStatus,
    garminExportStatus,
    nutritionExportStatus,
    booksExportStatus,
    quietQuestExportStatus,
    apprentissageExportStatus,
    exportBodyTrackingData,
    exportAllData,
    handleExportGarminData,
    handleExportNutritionData,
    handleExportBooksData,
    handleExportQuietQuest,
    handleExportApprentissage,
  } = exportSettings;

  const { quietQuestStats, booksStats, apprentissageStats } = stats;

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Download className="mr-2" size={20} />
          Export des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${S.body}`}>
            Exportez toutes vos données d'entraînement au format JSON pour créer une sauvegarde complète.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne Sport */}
            <div className="space-y-4">
              <h4 className="flex items-center text-lg font-semibold text-red-50">
                <span className="mr-2">🏋️</span>
                Sport
              </h4>
              <SportExportPreviewContent
                preview={sportPreview}
                loading={sportPreviewLoading}
                garminSummary={garminSummary}
                garminDailyIndex={garminDailyIndex}
                nutritionSummary={nutritionSummary}
                data={data}
              />

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={exportAllData}
                  disabled={exportStatus === 'loading'}
                  className={`${S.btnPrimary} w-full`}
                >
                  <Download className="w-4 h-4" />
                  {exportStatus === 'loading' ? 'Export en cours...' : 'Export Complet Sport'}
                </button>
                
                <button
                  type="button"
                  onClick={exportBodyTrackingData}
                  disabled={exportStatus === 'loading'}
                  className={`${S.btnPrimary} w-full`}
                >
                  <FileText className="w-4 h-4" />
                  {exportStatus === 'loading' ? 'Export en cours...' : 'Export Suivi Corporel'}
                </button>
                
                <button
                  type="button"
                  onClick={handleExportGarminData}
                  disabled={garminExportStatus === 'loading'}
                  className={`${S.btnSecondary} w-full`}
                >
                  <Download className="w-4 h-4" />
                  {garminExportStatus === 'loading' ? 'Export en cours...' : 'Export Garmin'}
                </button>
                
                <button
                  type="button"
                  onClick={handleExportNutritionData}
                  disabled={nutritionExportStatus === 'loading'}
                  className={`${S.btnPrimary} w-full`}
                >
                  <Download className="w-4 h-4" />
                  {nutritionExportStatus === 'loading' ? 'Export en cours...' : 'Export Nutrition'}
                </button>
              </div>
            </div>

            {/* Colonne Quêtes et Livres */}
            <div className="space-y-4">
              {/* Section Quêtes */}
              <div className="space-y-4">
                <h4 className="flex items-center text-lg font-semibold text-red-50">
                  <span className="mr-2">⚡</span>
                  Quêtes
                </h4>
                <div className={`${S.inset} space-y-3`}>
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-rose-300">⚡ QuietQuest</h5>
                    <ul className="space-y-1 text-sm text-red-100/80">
                      <li>• Quêtes : {quietQuestStats.questsCount} quête{quietQuestStats.questsCount !== 1 ? 's' : ''}</li>
                      <li>• Validations : {quietQuestStats.validationsCount} validation{quietQuestStats.validationsCount !== 1 ? 's' : ''}</li>
                      <li>• Niveau utilisateur : {quietQuestStats.userLevel}</li>
                      <li>• Performances quotidiennes</li>
                      <li>• XP et progression</li>
                      <li>• Métadonnées complètes</li>
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleExportQuietQuest}
                    disabled={quietQuestExportStatus === 'loading'}
                    className={`${S.btnPrimary} w-full`}
                  >
                    <Download className="w-4 h-4" />
                    {quietQuestExportStatus === 'loading' ? 'Export en cours...' : 'Export QuietQuest'}
                  </button>
                </div>
              </div>

              {/* Section Livres */}
              <div className={`space-y-4 border-t pt-4 ${S.divide}`}>
                <h4 className="flex items-center text-lg font-semibold text-red-50">
                  <BookOpen className="mr-2" size={20} />
                  Livres
                </h4>
                <div className={`${S.inset} space-y-3`}>
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-red-200">📚 Bibliothèque</h5>
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
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleExportBooksData}
                    disabled={booksExportStatus === 'loading'}
                    className={`${S.btnSecondary} w-full`}
                  >
                    <Download className="w-4 h-4" />
                    {booksExportStatus === 'loading' ? 'Export en cours...' : 'Export Livres'}
                  </button>
                </div>
              </div>

              {/* Section Apprentissage */}
              <div className={`space-y-4 border-t pt-4 ${S.divide}`}>
                <h4 className="flex items-center text-lg font-semibold text-red-50">
                  <span className="mr-2">📖</span>
                  Apprentissage
                </h4>
                <div className={`${S.inset} space-y-3`}>
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-rose-200">📖 Apprentissage</h5>
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
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleExportApprentissage}
                    disabled={apprentissageExportStatus === 'loading'}
                    className={`${S.btnPrimary} w-full`}
                  >
                    <Download className="w-4 h-4" />
                    {apprentissageExportStatus === 'loading' ? 'Export en cours...' : 'Export Apprentissage'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages de statut */}
          <div className="space-y-2">
            {exportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.exportError')}
              </div>
            )}

            {garminExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.importExport.garminExportSuccess')}
              </div>
            )}

            {garminExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.garminExportError')}
              </div>
            )}

            {nutritionExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                {t('messages.importExport.nutritionExportSuccess')}
              </div>
            )}

            {nutritionExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                {t('messages.importExport.nutritionExportError')}
              </div>
            )}

            {quietQuestExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export QuietQuest réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {quietQuestExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export QuietQuest
              </div>
            )}

            {booksExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export Livres réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {booksExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export Livres
              </div>
            )}

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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Section Import - Tous les imports
 * 
 * @param {Object} props
 * @param {Object} allDataImportSettings - Données du hook useAllDataExportImport
 * @param {Object} importSettings - Données du hook useSettingsImport
 * @param {Function} restorePreImportBackup - Fonction pour restaurer le backup
 * @returns {JSX.Element}
 */
export const ImportSection = ({ allDataImportSettings, importSettings, restorePreImportBackup }) => {
  const t = useTranslation();
  const {
    importStatus,
    importData,
    setImportData,
    fileInputRef,
    previewImport,
    previewImportAllData,
    handleFileImport,
  } = allDataImportSettings;

  const {
    garminImportStatus,
    handleImportGarminData,
  } = importSettings;

  const {
    allDataImportStatus,
  } = allDataImportSettings;

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Upload className="mr-2" size={20} />
          Import des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-red-600/50 bg-red-950/35 p-4">
            <div className="flex items-start">
              <AlertTriangle className="mr-2 mt-0.5 text-red-400" size={16} />
              <div className="text-sm text-red-100/90">
                <strong>Attention :</strong> L'import remplacera toutes vos données actuelles. 
                Une sauvegarde automatique sera créée avant l'import.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className={`mb-2 block ${S.label}`}>
                Importer depuis un fichier :
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="block w-full cursor-pointer text-sm text-red-100/80 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-red-900/70 file:px-4 file:py-2 file:text-sm file:font-medium file:text-red-50 hover:file:bg-red-800/80"
              />
            </div>

            <div className={`text-center ${S.muted}`}>ou</div>

            <div>
              <label className={`mb-2 block ${S.label}`}>
                Coller les données JSON :
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={t('settings.tooltips.import.placeholder')}
                className={`${S.input} h-32 resize-none`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={previewImport}
              disabled={!importData.trim() || importStatus === 'loading'}
              className={`${S.btnSecondary} flex-1`}
              title={t('settings.tooltips.import.previewBodyTracking')}
            >
              <FileText className="w-4 h-4" />
              Prévisualiser (Body Tracking)
            </button>
            
            <button
              type="button"
              onClick={previewImportAllData}
              disabled={!importData.trim() || allDataImportStatus === 'loading'}
              className={`${S.btnPrimary} flex-1`}
              title={t('settings.tooltips.import.previewComplete')}
            >
              <FileText className="w-4 h-4" />
              {allDataImportStatus === 'loading' ? 'Prévisualisation...' : 'Prévisualiser (Complet)'}
            </button>
            
            <button
              type="button"
              onClick={() => handleImportGarminData(importData)}
              disabled={!importData.trim() || garminImportStatus === 'loading'}
              className={`${S.btnSecondary} flex items-center justify-center gap-2`}
              title={t('settings.tooltips.import.importGarmin')}
            >
              <Upload className="w-4 h-4" />
              {garminImportStatus === 'loading' ? 'Import...' : 'Import Garmin'}
            </button>
            
            {restorePreImportBackup && localStorage.getItem('workoutData_preImport_backup') && (
              <button
                type="button"
                onClick={restorePreImportBackup}
                className={`${S.btnPrimary} flex items-center justify-center gap-2`}
              >
                <RotateCcw className="w-4 h-4" />
                Restaurer
              </button>
            )}
          </div>

          {importStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              {t('messages.importExport.invalidJson')}
            </div>
          )}

          {importStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              {t('messages.success.imported')}
            </div>
          )}

          {importStatus === 'restored' && (
            <div className="flex items-center text-sm text-rose-300">
              <CheckCircle className="mr-2" size={16} />
              {t('messages.success.restoreBackup')}
            </div>
          )}

          {garminImportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              {t('messages.importExport.garminSuccess')}
            </div>
          )}

          {garminImportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              {t('messages.importExport.garminError')}
            </div>
          )}

          {allDataImportStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              {t('messages.importExport.fullSuccess')}
            </div>
          )}

          {allDataImportStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              {t('messages.importExport.fullError')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
