/**
 * 🖼️ COMPOSANT EXPORT/IMPORT BANNIÈRES
 * 
 * Interface utilisateur pour exporter et importer les bannières.
 * Permet de sauvegarder et restaurer toutes les images de fond.
 * 
 * @module BannerExportImport
 */

import React, { useState, useRef } from 'react';
import { exportBanners, downloadBannerExport } from '../utils/bannerExport';
import { importBanners } from '../utils/bannerImport';
import { useHomepageImages } from '../hooks/useHomepageImages';
import logger from '../utils/logger';
import { useTranslation } from '../utils/translations';

const log = logger.component('BannerExportImport');

export default function BannerExportImport() {
  const t = useTranslation();
  const { backgroundImages, saveImages, loadImages, checkSystemHealth } = useHomepageImages();
  const [exportStatus, setExportStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [importStatus, setImportStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Gère l'export des bannières
   */
  const handleExport = async () => {
    try {
      setExportStatus('loading');
      log.debug('📤 Début export bannières...');

      // Exporter avec compression par défaut
      const exportData = await exportBanners({
        includeMetadata: true,
        compress: true,
        compressionLevel: 6
      });

      // Télécharger le fichier
      downloadBannerExport(exportData);

      setExportStatus('success');
      log.debug('✅ Export réussi');

      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);

    } catch (error) {
      log.error('❌ Erreur export', error);
      setExportStatus('error');
      setTimeout(() => {
        setExportStatus(null);
      }, 5000);
    }
  };

  /**
   * Gère l'import des bannières
   */
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Vérifier extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.json.gz')) {
      alert('❌ Format de fichier invalide. Veuillez sélectionner un fichier .json ou .json.gz');
      return;
    }

    try {
      setImportStatus('loading');
      setImportResult(null);
      log.debug('📥 Début import bannières...', { filename: file.name });

      // Importer avec fusion intelligente
      const result = await importBanners(file, {
        merge: true,
        skipDuplicates: true,
        verifyChecksum: true
      });

      setImportResult(result);
      setImportStatus('success');
      log.debug('✅ Import réussi', result);

      // ✅ Phase 7: Forcer rechargement des images après import
      await loadImages();
      await checkSystemHealth();

      // Réinitialiser le statut après 5 secondes
      setTimeout(() => {
        setImportStatus(null);
        setImportResult(null);
      }, 5000);

      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      log.error('❌ Erreur import', error);
      setImportStatus('error');
      alert(`❌ ${t('messages.importExport.importErrorWithDetail', { error: error.message })}`);
      
      setTimeout(() => {
        setImportStatus(null);
      }, 5000);

      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Ouvre le sélecteur de fichier pour l'import
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          📤 Export / Import Bannières
        </h3>
        <p className="text-slate-300 text-sm mb-4">
          Sauvegardez toutes vos bannières dans un fichier JSON pour les restaurer plus tard.
          Format compressé pour réduire la taille du fichier.
        </p>
      </div>

      {/* Section Export */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-semibold mb-1">📤 Exporter toutes les bannières</h4>
            <p className="text-slate-400 text-xs">
              {backgroundImages.length} image{backgroundImages.length > 1 ? 's' : ''} disponible{backgroundImages.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportStatus === 'loading' || backgroundImages.length === 0}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${exportStatus === 'loading' || backgroundImages.length === 0
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {exportStatus === 'loading' ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Export en cours...
              </span>
            ) : exportStatus === 'success' ? (
              <span className="flex items-center text-green-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Exporté !
              </span>
            ) : (
              '📥 Télécharger'
            )}
          </button>
        </div>

        {exportStatus === 'error' && (
          <div className="mt-2 text-red-400 text-sm flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('messages.importExport.exportError')}
          </div>
        )}

        {backgroundImages.length === 0 && (
          <div className="mt-2 text-yellow-400 text-sm">
            ⚠️ Aucune bannière à exporter
          </div>
        )}
      </div>

      {/* Section Import */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-semibold mb-1">📥 Importer des bannières</h4>
            <p className="text-slate-400 text-xs">
              Restaurez vos bannières depuis un fichier JSON exporté
            </p>
          </div>
          <button
            onClick={handleImportClick}
            disabled={importStatus === 'loading'}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${importStatus === 'loading'
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
            `}
          >
            {importStatus === 'loading' ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Import en cours...
              </span>
            ) : importStatus === 'success' ? (
              <span className="flex items-center text-green-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Importé !
              </span>
            ) : (
              '📂 Sélectionner fichier'
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.json.gz"
          onChange={handleImport}
          className="hidden"
        />

        {importStatus === 'error' && (
          <div className="mt-2 text-red-400 text-sm flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('messages.importExport.importError')}
          </div>
        )}

        {importResult && (
          <div className="mt-3 bg-green-900/20 border border-green-600/30 rounded p-3">
            <h5 className="text-green-400 font-semibold mb-2">✅ Import réussi</h5>
            <div className="text-green-200 text-sm space-y-1">
              <p>• <strong>{importResult.imported}</strong> image{importResult.imported > 1 ? 's' : ''} importée{importResult.imported > 1 ? 's' : ''}</p>
              {importResult.skipped > 0 && (
                <p>• <strong>{importResult.skipped}</strong> doublon{importResult.skipped > 1 ? 's' : ''} ignoré{importResult.skipped > 1 ? 's' : ''}</p>
              )}
              <p>• <strong>{importResult.total}</strong> image{importResult.total > 1 ? 's' : ''} au total</p>
              {importResult.existing > 0 && (
                <p>• <strong>{importResult.existing}</strong> image{importResult.existing > 1 ? 's' : ''} existante{importResult.existing > 1 ? 's' : ''} conservée{importResult.existing > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-slate-400 space-y-1">
          <p>• Format supporté : .json (non compressé) ou .json.gz (compressé)</p>
          <p>• Les doublons sont automatiquement détectés et ignorés</p>
          <p>• Les images existantes sont conservées (fusion intelligente)</p>
          <p>• L'intégrité du fichier est vérifiée (checksum SHA-256)</p>
        </div>
      </div>
    </div>
  );
}

