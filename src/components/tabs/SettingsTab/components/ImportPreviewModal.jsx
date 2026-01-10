/**
 * Composant ImportPreviewModal - Modal de prévisualisation pour les imports
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour les modals de prévisualisation
 * 
 * @module components/tabs/SettingsTab/components/ImportPreviewModal
 */

import React from 'react';
import { X, Save, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Modal de prévisualisation pour l'import Body Tracking uniquement
 * 
 * @param {Object} props
 * @param {boolean} showImportPreview - Afficher la modal
 * @param {Object} previewData - Données de prévisualisation
 * @param {string} importStatus - Statut de l'import
 * @param {Function} setShowImportPreview - Fonction pour fermer la modal
 * @param {Function} confirmImport - Fonction pour confirmer l'import
 * @returns {JSX.Element | null}
 */
export const BodyTrackingImportPreviewModal = ({
  showImportPreview,
  previewData,
  importStatus,
  setShowImportPreview,
  confirmImport,
}) => {
  if (!showImportPreview || !previewData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Prévisualisation de l'import</h3>
            <button
              type="button"
              onClick={() => setShowImportPreview(false)}
              className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Statistiques des données :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <h5 className="text-blue-300 font-medium">🏋️ Entraînement</h5>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exercices :</span>
                      <span className="text-white">{previewData.stats?.exercises || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Répétitions :</span>
                      <span className="text-white">{previewData.stats?.reps || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Étirements :</span>
                      <span className="text-white">{previewData.stats?.stretches || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Historique reps :</span>
                      <span className="text-white">{previewData.stats?.historyReps || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-green-300 font-medium">📊 Suivi Corporel</h5>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Photos :</span>
                      <span className="text-white">{previewData.stats?.photos || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entrées progression :</span>
                      <span className="text-white">{previewData.stats?.progressEntries || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rappels :</span>
                      <span className="text-white">{previewData.stats?.reminders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Historique programmes :</span>
                      <span className="text-white">{previewData.stats?.programHistory || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <h4 className="text-yellow-300 font-medium mb-2 flex items-center">
                  <AlertTriangle className="mr-2" size={16} />
                  Avertissements
                </h4>
                <ul className="text-xs text-yellow-200 space-y-1">
                  {previewData.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {previewData.isExportFormat && (
              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="mr-2" size={16} />
                  Format d'export détecté - Données validées
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowImportPreview(false)}
                className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={importStatus === 'loading'}
                className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {importStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal de prévisualisation pour l'import COMPLET (toutes les données)
 * 
 * @param {Object} props
 * @param {boolean} showAllDataImportPreview - Afficher la modal
 * @param {Object} allDataPreviewData - Données de prévisualisation
 * @param {string} allDataImportStatus - Statut de l'import
 * @param {Function} setShowAllDataImportPreview - Fonction pour fermer la modal
 * @param {Function} confirmImportAllData - Fonction pour confirmer l'import
 * @returns {JSX.Element | null}
 */
export const AllDataImportPreviewModal = ({
  showAllDataImportPreview,
  allDataPreviewData,
  allDataImportStatus,
  setShowAllDataImportPreview,
  confirmImportAllData,
}) => {
  if (!showAllDataImportPreview || !allDataPreviewData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Prévisualisation de l'import complet</h3>
            <button
              type="button"
              onClick={() => {
                setShowAllDataImportPreview(false);
              }}
              className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Statistiques */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Statistiques des données à importer</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Exercices :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.exercises || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Répétitions :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.reps || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Étirements :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.stretches || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Sessions endurance :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.enduranceSessions || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Photos :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.photos || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Entrées progression :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.progressEntries || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Historique reps :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.historyReps || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Variations journalières :</span>
                  <span className="text-white ml-2 font-semibold">{allDataPreviewData.stats?.dailyVariations || 0}</span>
                </div>
              </div>
            </div>

            {/* Prévisualisation des livres si présents */}
            {allDataPreviewData.booksPreview && allDataPreviewData.booksPreview.valid && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                  <CheckCircle className="mr-2" size={16} />
                  Livres détectés
                </h4>
                <p className="text-sm text-gray-300">
                  {allDataPreviewData.booksPreview.totalBooks} livre(s) seront importé(s) avec l'export complet.
                </p>
              </div>
            )}

            {/* Warnings */}
            {allDataPreviewData.warnings && allDataPreviewData.warnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                <h4 className="text-yellow-300 font-medium mb-2 flex items-center">
                  <AlertTriangle className="mr-2" size={16} />
                  Avertissements
                </h4>
                <ul className="text-xs text-yellow-200 space-y-1">
                  {allDataPreviewData.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors */}
            {allDataPreviewData.errors && allDataPreviewData.errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <h4 className="text-red-300 font-medium mb-2 flex items-center">
                  <AlertTriangle className="mr-2" size={16} />
                  Erreurs
                </h4>
                <ul className="text-xs text-red-200 space-y-1">
                  {allDataPreviewData.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowAllDataImportPreview(false)}
                className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmImportAllData}
                disabled={allDataImportStatus === 'loading'}
                className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {allDataImportStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import complet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
