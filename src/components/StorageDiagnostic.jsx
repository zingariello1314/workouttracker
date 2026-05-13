import React, { useState, useEffect } from 'react';
import { settingsTheme as S } from './tabs/SettingsTab/settingsThemeClasses';
import { HOMEPAGE_IMAGES_DB_NAME, STORE_HOMEPAGE_IMAGES } from '../services/homepage/homepageImagesDbGateway.js';

const StorageDiagnostic = ({ onClose }) => {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const results = {
      localStorage: {},
      sessionStorage: {},
      indexedDB: null,
      memory: null,
      recommendations: []
    };

    const localStorageKeys = [
      'homepage_images_primary',
      'homepage_images_backup',
      'homepage_images_session',
      'workoutData_backup'
    ];

    localStorageKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          results.localStorage[key] = {
            exists: true,
            hasImages: parsed.images ? parsed.images.length : 0,
            timestamp: parsed.timestamp,
            version: parsed.version,
            compressed: parsed.compressed,
            size: data.length
          };
        } else {
          results.localStorage[key] = { exists: false };
        }
      } catch (error) {
        results.localStorage[key] = { exists: false, error: error.message };
      }
    });

    try {
      const sessionData = sessionStorage.getItem('homepage_images_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        results.sessionStorage = {
          exists: true,
          hasImages: parsed.images ? parsed.images.length : 0,
          timestamp: parsed.timestamp,
          size: sessionData.length
        };
      } else {
        results.sessionStorage = { exists: false };
      }
    } catch (error) {
      results.sessionStorage = { exists: false, error: error.message };
    }

    try {
      if (window.indexedDB) {
        const request = indexedDB.open(HOMEPAGE_IMAGES_DB_NAME);
        await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            try {
              const db = event.target.result;

              if (db && db.objectStoreNames.contains(STORE_HOMEPAGE_IMAGES)) {
                const transaction = db.transaction([STORE_HOMEPAGE_IMAGES], 'readonly');
                const store = transaction.objectStore(STORE_HOMEPAGE_IMAGES);
                const index = store.index('type');
                const countRequest = index.count(IDBKeyRange.only('homepage_background'));

                countRequest.onsuccess = () => {
                  results.indexedDB = {
                    available: true,
                    name: db.name,
                    version: db.version,
                    stores: Array.from(db.objectStoreNames),
                    imageCount: countRequest.result
                  };
                  resolve();
                };
                countRequest.onerror = () => {
                  results.indexedDB = {
                    available: true,
                    name: db.name,
                    version: db.version,
                    stores: Array.from(db.objectStoreNames),
                    imageCount: 0
                  };
                  resolve();
                };
              } else {
                results.indexedDB = {
                  available: true,
                  name: db ? db.name : HOMEPAGE_IMAGES_DB_NAME,
                  version: db ? db.version : 1,
                  stores: db ? Array.from(db.objectStoreNames) : [],
                  imageCount: 0
                };
                resolve();
              }
            } catch (error) {
              results.indexedDB = { available: false, error: error.message };
              resolve();
            }
          };
          request.onerror = () => {
            results.indexedDB = { available: false, error: 'Erreur d\'ouverture' };
            resolve();
          };
        });
      } else {
        results.indexedDB = { available: false, error: 'Non supporté' };
      }
    } catch (error) {
      results.indexedDB = { available: false, error: error.message };
    }

    if (performance.memory) {
      results.memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }

    const primaryImages = results.localStorage['homepage_images_primary'];
    const backupImages = results.localStorage['homepage_images_backup'];

    if (!primaryImages?.exists && !backupImages?.exists) {
      results.recommendations.push('Aucune image sauvegardée dans localStorage — problème de persistance');
    }

    if (results.sessionStorage.exists && !primaryImages?.exists) {
      results.recommendations.push('Images seulement dans sessionStorage — seront perdues au redémarrage');
    }

    if (results.memory && results.memory.used > results.memory.limit * 0.8) {
      results.recommendations.push('Mémoire utilisée élevée — risque de problèmes de performance');
    }

    if (primaryImages?.exists && primaryImages.hasImages > 0) {
      results.recommendations.push('Images correctement sauvegardées dans localStorage');
    }

    setDiagnosticResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const clearStorage = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer toutes les données de stockage ? Cette action est irréversible.')) {
      try {
        localStorage.removeItem('homepage_images_primary');
        localStorage.removeItem('homepage_images_backup');
        localStorage.removeItem('homepage_images_session');
        localStorage.removeItem('homepage_images_metadata');
        localStorage.removeItem('homepage_images_fallback');
        localStorage.removeItem('homepage_images_sync_emergency');

        sessionStorage.removeItem('homepage_images_session');
        sessionStorage.removeItem('homepage_images_emergency');

        if (window.indexedDB) {
          const deleteRequest = indexedDB.deleteDatabase(HOMEPAGE_IMAGES_DB_NAME);
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        }

        console.log('✅ Toutes les données supprimées');
        runDiagnostic();
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des données');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`${S.modalPanel} max-w-4xl`}>
        <div className={`${S.modalHeader} flex-wrap gap-3`}>
          <h2 className="text-2xl font-bold text-red-100">Diagnostic du stockage des images</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runDiagnostic}
              disabled={isRunning}
              className={`${S.btnSecondary} disabled:opacity-50`}
            >
              {isRunning ? 'Diagnostic...' : 'Relancer'}
            </button>
            <button
              type="button"
              onClick={clearStorage}
              className="rounded-lg border border-red-600/60 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-900/50"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-2 ${S.muted} hover:bg-red-950/40 hover:text-red-100`}
              aria-label="Fermer"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {diagnosticResults && (
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold text-red-100">localStorage</h3>
                <div className="space-y-2">
                  {Object.entries(diagnosticResults.localStorage).map(([key, data]) => (
                    <div key={key} className={`rounded p-3 ${S.insetSm}`}>
                      <div className="font-medium text-red-100">{key}</div>
                      {data.exists ? (
                        <div className={`text-sm ${S.muted}`}>
                          Images : {data.hasImages} |
                          Taille : {Math.round(data.size / 1024)} KB |
                          Timestamp : {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
                        </div>
                      ) : (
                        <div className="text-sm text-red-400">
                          Pas de données {data.error && `(${data.error})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-red-100">sessionStorage</h3>
                <div className={S.insetSm}>
                  {diagnosticResults.sessionStorage.exists ? (
                    <div className={`text-sm ${S.muted}`}>
                      Images : {diagnosticResults.sessionStorage.hasImages} |
                      Taille : {Math.round(diagnosticResults.sessionStorage.size / 1024)} KB
                    </div>
                  ) : (
                    <div className="text-sm text-red-400">
                      Pas de données {diagnosticResults.sessionStorage.error && `(${diagnosticResults.sessionStorage.error})`}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-red-100">IndexedDB</h3>
                <div className={S.insetSm}>
                  {diagnosticResults.indexedDB?.available ? (
                    <div className={`text-sm ${S.muted}`}>
                      Disponible |
                      Nom : {diagnosticResults.indexedDB.name} |
                      Version : {diagnosticResults.indexedDB.version} |
                      Images : {diagnosticResults.indexedDB.imageCount || 0} |
                      Stores : {diagnosticResults.indexedDB.stores.join(', ')}
                    </div>
                  ) : (
                    <div className="text-sm text-red-400">
                      Non disponible {diagnosticResults.indexedDB?.error && `(${diagnosticResults.indexedDB.error})`}
                    </div>
                  )}
                </div>
              </div>

              {diagnosticResults.memory && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-red-100">Mémoire</h3>
                  <div className={S.insetSm}>
                    <div className={`text-sm ${S.muted}`}>
                      Utilisée : {diagnosticResults.memory.used} MB / {diagnosticResults.memory.limit} MB
                      <div className="mt-2 h-2 w-full rounded-full bg-red-950/60">
                        <div
                          className="h-2 rounded-full bg-red-600"
                          style={{ width: `${(diagnosticResults.memory.used / diagnosticResults.memory.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-4 text-lg font-semibold text-red-100">Recommandations</h3>
                <div className="space-y-2">
                  {diagnosticResults.recommendations.map((rec, index) => (
                    <div key={index} className={`rounded p-3 text-sm ${S.insetSm}`}>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageDiagnostic;
