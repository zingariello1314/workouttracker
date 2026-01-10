/**
 * Composant ExportImportSection - Section principale Export/Import
 * 
 * ✅ PHASE 4 : Extraction de l'UI principale pour Export/Import
 * 
 * Regroupe toutes les sections d'export/import : Sport complet, Body Tracking, Garmin, Nutrition, etc.
 * 
 * @module components/tabs/SettingsTab/components/ExportImportSection
 */

import React, { useRef } from 'react';
import { Download, Upload, FileText, BookOpen, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';

/**
 * Section Export - Tous les exports
 * 
 * @param {Object} props
 * @param {Object} data - Données actuelles
 * @param {Object} stats - Statistiques (QuietQuest, Books, Apprentissage)
 * @param {Object} exportSettings - Données du hook useSettingsExport
 * @returns {JSX.Element}
 */
export const ExportSection = ({ data, stats, exportSettings }) => {
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
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Download className="mr-2" size={20} />
          Export des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Exportez toutes vos données d'entraînement au format JSON pour créer une sauvegarde complète.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne Sport */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg flex items-center">
                <span className="mr-2">🏋️</span>
                Sport
              </h4>
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-blue-300">🏋️ Entraînement</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Exercices cochés : {Object.keys(data.checkedExercises || {}).length} entrées</li>
                    <li>• Répétitions : {Object.keys(data.reps || {}).length} entrées</li>
                    <li>• Étirements : {Object.keys(data.checkedStretches || {}).length} entrées</li>
                    <li>• Historique répétitions : {Object.keys(data.historyReps || {}).length} entrées</li>
                  </ul>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-green-300">📊 Suivi Corporel</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Photos de progression : {(data.progressPhotos || []).length} photos</li>
                    <li>• Entrées de progression : {(data.progressEntries || []).length} entrées</li>
                    <li>• Rappels configurés : {(data.bodyTrackingReminders || []).length} rappels</li>
                    <li>• Photos avec poids : {(data.progressPhotos || []).filter(p => p.weight).length}</li>
                    <li>• Photos avec notes : {(data.progressPhotos || []).filter(p => p.notes).length}</li>
                    <li>• Photos avec mesures : {(data.progressPhotos || []).filter(p => p.measurements && Object.keys(p.measurements).length > 0).length}</li>
                    <li>• Dernière mise à jour : {data.bodyTrackingLastUpdated ? new Date(data.bodyTrackingLastUpdated).toLocaleDateString('fr-FR') : 'Jamais'}</li>
                  </ul>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-orange-300">🏃 Endurance</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Sessions boxe : {(data.enduranceData?.sessions?.boxing || data.enduranceData?.boxingSessions || []).length} sessions</li>
                    <li>• Sessions pompes : {(data.enduranceData?.sessions?.pushups || data.enduranceData?.pushupSessions || []).length} sessions</li>
                    <li>• Sessions natation : {(data.enduranceData?.sessions?.swimming || data.enduranceData?.swimmingSessions || []).length} sessions</li>
                    <li>• Sessions corde à sauter : {(data.enduranceData?.sessions?.jumprope || data.enduranceData?.jumpropeSessions || []).length} sessions</li>
                    <li>• Sessions course : {(data.enduranceData?.sessions?.running || data.enduranceData?.runningSessions || []).length} sessions</li>
                    <li>• Défis actifs : {(data.enduranceData?.challenges || []).length} défis</li>
                  </ul>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-purple-300">⌚ Garmin</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Données synchronisées Garmin</li>
                    <li>• Activités et statistiques</li>
                  </ul>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-orange-300">🍎 Nutrition</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Repas et calories</li>
                    <li>• Suivi nutritionnel complet</li>
                  </ul>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-600">
                  <h5 className="text-sm font-medium text-purple-300">⚙️ Configuration</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Date de début : {data.startDate ? new Date(data.startDate).toLocaleDateString('fr-FR') : 'Non définie'}</li>
                    <li>• Variante de semaine : {data.weekVariant || 'A'}</li>
                    <li>• Historique programmes : {(data.programHistory || []).length} entrées</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={exportAllData}
                  disabled={exportStatus === 'loading'}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {exportStatus === 'loading' ? 'Export en cours...' : 'Export Complet Sport'}
                </button>
                
                <button
                  type="button"
                  onClick={exportBodyTrackingData}
                  disabled={exportStatus === 'loading'}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  {exportStatus === 'loading' ? 'Export en cours...' : 'Export Suivi Corporel'}
                </button>
                
                <button
                  type="button"
                  onClick={handleExportGarminData}
                  disabled={garminExportStatus === 'loading'}
                  className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {garminExportStatus === 'loading' ? 'Export en cours...' : 'Export Garmin'}
                </button>
                
                <button
                  type="button"
                  onClick={handleExportNutritionData}
                  disabled={nutritionExportStatus === 'loading'}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h4 className="font-semibold text-white text-lg flex items-center">
                  <span className="mr-2">⚡</span>
                  Quêtes
                </h4>
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-emerald-300">⚡ QuietQuest</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
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
                    className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {quietQuestExportStatus === 'loading' ? 'Export en cours...' : 'Export QuietQuest'}
                  </button>
                </div>
              </div>

              {/* Section Livres */}
              <div className="space-y-4 pt-4 border-t border-slate-600">
                <h4 className="font-semibold text-white text-lg flex items-center">
                  <BookOpen className="mr-2" size={20} />
                  Livres
                </h4>
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
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleExportBooksData}
                    disabled={booksExportStatus === 'loading'}
                    className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {booksExportStatus === 'loading' ? 'Export en cours...' : 'Export Livres'}
                  </button>
                </div>
              </div>

              {/* Section Apprentissage */}
              <div className="space-y-4 pt-4 border-t border-slate-600">
                <h4 className="font-semibold text-white text-lg flex items-center">
                  <span className="mr-2">📖</span>
                  Apprentissage
                </h4>
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
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={handleExportApprentissage}
                    disabled={apprentissageExportStatus === 'loading'}
                    className="gradient-button-premium gradient-button-premium-md rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Upload className="mr-2" size={20} />
          Import des données
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-400 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-yellow-200">
                <strong>Attention :</strong> L'import remplacera toutes vos données actuelles. 
                Une sauvegarde automatique sera créée avant l'import.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Importer depuis un fichier :
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
              />
            </div>

            <div className="text-center text-gray-400">ou</div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Coller les données JSON :
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={t('settings.tooltips.import.placeholder')}
                className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={previewImport}
              disabled={!importData.trim() || importStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('settings.tooltips.import.previewBodyTracking')}
            >
              <FileText className="w-4 h-4" />
              Prévisualiser (Body Tracking)
            </button>
            
            <button
              type="button"
              onClick={previewImportAllData}
              disabled={!importData.trim() || allDataImportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('settings.tooltips.import.previewComplete')}
            >
              <FileText className="w-4 h-4" />
              {allDataImportStatus === 'loading' ? 'Prévisualisation...' : 'Prévisualiser (Complet)'}
            </button>
            
            <button
              type="button"
              onClick={() => handleImportGarminData(importData)}
              disabled={!importData.trim() || garminImportStatus === 'loading'}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('settings.tooltips.import.importGarmin')}
            >
              <Upload className="w-4 h-4" />
              {garminImportStatus === 'loading' ? 'Import...' : 'Import Garmin'}
            </button>
            
            {restorePreImportBackup && localStorage.getItem('workoutData_preImport_backup') && (
              <button
                type="button"
                onClick={restorePreImportBackup}
                className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center justify-center gap-2"
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
            <div className="flex items-center text-blue-400 text-sm">
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
