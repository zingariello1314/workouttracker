/**
 * Modales de prévisualisation d'import (Body Tracking et import complet).
 */

import React from 'react';
import { X, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { settingsTheme as S } from '../settingsThemeClasses';

const overlayClass =
  'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm';

export const BodyTrackingImportPreviewModal = ({
  showImportPreview,
  previewData,
  importStatus,
  setShowImportPreview,
  confirmImport,
}) => {
  if (!showImportPreview || !previewData) return null;

  return (
    <div className={overlayClass}>
      <div className={`${S.modalPanel} max-w-2xl`}>
        <div className={S.modalHeader}>
          <h3 className="text-lg font-semibold text-red-100">Prévisualisation de l'import</h3>
          <button
            type="button"
            onClick={() => setShowImportPreview(false)}
            className={`${S.btnSm} p-2`}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className={S.inset}>
            <h4 className={`mb-3 font-medium text-red-100 ${S.body}`}>Statistiques des données :</h4>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="space-y-2">
                <h5 className="font-medium text-red-300">Entraînement</h5>
                <div className="space-y-1 pl-2">
                  <div className="flex justify-between">
                    <span className={S.muted}>Exercices :</span>
                    <span className="text-red-50">{previewData.stats?.exercises || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={S.muted}>Répétitions :</span>
                    <span className="text-red-50">{previewData.stats?.reps || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={S.muted}>Étirements :</span>
                    <span className="text-red-50">{previewData.stats?.stretches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={S.muted}>Historique reps :</span>
                    <span className="text-red-50">{previewData.stats?.historyReps || 0}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-red-300">Suivi corporel</h5>
                <div className="space-y-1 pl-2">
                  <div className="flex justify-between">
                    <span className={S.muted}>Photos :</span>
                    <span className="text-red-50">{previewData.stats?.photos || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={S.muted}>Entrées progression :</span>
                    <span className="text-red-50">{previewData.stats?.progressEntries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={S.muted}>Rappels :</span>
                    <span className="text-red-50">{previewData.stats?.reminders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={S.muted}>Historique programmes :</span>
                    <span className="text-red-50">{previewData.stats?.programHistory || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {previewData.warnings && previewData.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-3">
              <h4 className="mb-2 flex items-center font-medium text-amber-200">
                <AlertTriangle className="mr-2" size={16} />
                Avertissements
              </h4>
              <ul className="space-y-1 text-xs text-amber-100/90">
                {previewData.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {previewData.isExportFormat && (
            <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/25 p-3">
              <div className="flex items-center text-sm text-emerald-300">
                <CheckCircle className="mr-2" size={16} />
                Format d'export détecté — données validées
              </div>
            </div>
          )}

          <div className={`flex gap-3 border-t pt-4 ${S.divide}`}>
            <button
              type="button"
              onClick={() => setShowImportPreview(false)}
              className={`${S.btnSecondary} flex-1`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={importStatus === 'loading'}
              className={`${S.btnPrimary} flex-1 disabled:cursor-not-allowed`}
            >
              <Save className="h-4 w-4" />
              {importStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AllDataImportPreviewModal = ({
  showAllDataImportPreview,
  allDataPreviewData,
  allDataImportStatus,
  setShowAllDataImportPreview,
  confirmImportAllData,
}) => {
  if (!showAllDataImportPreview || !allDataPreviewData) return null;

  return (
    <div className={overlayClass}>
      <div className={`${S.modalPanel} max-w-3xl`}>
        <div className={S.modalHeader}>
          <h3 className="text-lg font-semibold text-red-100">Prévisualisation de l'import complet</h3>
          <button
            type="button"
            onClick={() => {
              setShowAllDataImportPreview(false);
            }}
            className={`${S.btnSm} p-2`}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className={S.inset}>
            <h4 className="mb-3 font-medium text-red-100">Statistiques des données à importer</h4>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className={S.muted}>Exercices :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.exercises || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Répétitions :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.reps || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Étirements :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.stretches || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Sessions endurance :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.enduranceSessions || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Photos :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.photos || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Entrées progression :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.progressEntries || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Historique reps :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.historyReps || 0}</span>
              </div>
              <div>
                <span className={S.muted}>Variations journalières :</span>
                <span className="ml-2 font-semibold text-red-50">{allDataPreviewData.stats?.dailyVariations || 0}</span>
              </div>
            </div>
          </div>

          {allDataPreviewData.booksPreview && allDataPreviewData.booksPreview.valid && (
            <div className="rounded-lg border border-red-800/40 bg-red-950/30 p-4">
              <h4 className="mb-2 flex items-center font-medium text-red-200">
                <CheckCircle className="mr-2" size={16} />
                Livres détectés
              </h4>
              <p className={`text-sm ${S.muted}`}>
                {allDataPreviewData.booksPreview.totalBooks} livre(s) seront importé(s) avec l'export complet.
              </p>
            </div>
          )}

          {allDataPreviewData.warnings && allDataPreviewData.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-4">
              <h4 className="mb-2 flex items-center font-medium text-amber-200">
                <AlertTriangle className="mr-2" size={16} />
                Avertissements
              </h4>
              <ul className="space-y-1 text-xs text-amber-100/90">
                {allDataPreviewData.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {allDataPreviewData.errors && allDataPreviewData.errors.length > 0 && (
            <div className="rounded-lg border border-red-700/50 bg-red-950/40 p-4">
              <h4 className="mb-2 flex items-center font-medium text-red-300">
                <AlertTriangle className="mr-2" size={16} />
                Erreurs
              </h4>
              <ul className="space-y-1 text-xs text-red-200/90">
                {allDataPreviewData.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={`flex gap-3 border-t pt-4 ${S.divide}`}>
            <button
              type="button"
              onClick={() => setShowAllDataImportPreview(false)}
              className={`${S.btnSecondary} flex-1`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmImportAllData}
              disabled={allDataImportStatus === 'loading'}
              className={`${S.btnPrimary} flex-1 disabled:cursor-not-allowed`}
            >
              <Save className="h-4 w-4" />
              {allDataImportStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import complet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
