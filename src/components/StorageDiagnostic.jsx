import React, { useState, useEffect } from 'react';
import Button from './ui/Button';

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

    // Vérifier localStorage
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

    // Vérifier sessionStorage
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

    // Vérifier IndexedDB pour les images
    try {
      if (window.indexedDB) {
        const request = indexedDB.open('HomepageImagesDB', 1);
        await new Promise((resolve, reject) => {
          request.onsuccess = (event) => {
            try {
              const db = event.target.result;
              
              if (db && db.objectStoreNames.contains('images')) {
                const transaction = db.transaction(['images'], 'readonly');
                const store = transaction.objectStore('images');
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
                  name: db ? db.name : 'HomepageImagesDB',
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

    // Vérifier la mémoire
    if (performance.memory) {
      results.memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }

    // Générer des recommandations
    const primaryImages = results.localStorage['homepage_images_primary'];
    const backupImages = results.localStorage['homepage_images_backup'];
    
    if (!primaryImages?.exists && !backupImages?.exists) {
      results.recommendations.push('❌ Aucune image sauvegardée dans localStorage - problème de persistance');
    }
    
    if (results.sessionStorage.exists && !primaryImages?.exists) {
      results.recommendations.push('⚠️ Images seulement dans sessionStorage - seront perdues au redémarrage');
    }
    
    if (results.memory && results.memory.used > results.memory.limit * 0.8) {
      results.recommendations.push('⚠️ Mémoire utilisée élevée - risque de problèmes de performance');
    }

    if (primaryImages?.exists && primaryImages.hasImages > 0) {
      results.recommendations.push('✅ Images correctement sauvegardées dans localStorage');
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
        // Effacer localStorage
        localStorage.removeItem('homepage_images_primary');
        localStorage.removeItem('homepage_images_backup');
        localStorage.removeItem('homepage_images_session');
        localStorage.removeItem('homepage_images_metadata');
        localStorage.removeItem('homepage_images_fallback');
        localStorage.removeItem('homepage_images_sync_emergency');
        
        // Effacer sessionStorage
        sessionStorage.removeItem('homepage_images_session');
        sessionStorage.removeItem('homepage_images_emergency');
        
        // Effacer IndexedDB
        if (window.indexedDB) {
          const deleteRequest = indexedDB.deleteDatabase('HomepageImagesDB');
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Diagnostic du Stockage des Images</h2>
          <div className="flex items-center space-x-4">
            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Diagnostic...' : '🔄 Relancer'}
            </Button>
            <Button
              onClick={clearStorage}
              className="bg-red-600 hover:bg-red-700"
            >
              🗑️ Effacer
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {diagnosticResults && (
            <>
              {/* localStorage */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">📦 localStorage</h3>
                <div className="space-y-2">
                  {Object.entries(diagnosticResults.localStorage).map(([key, data]) => (
                    <div key={key} className="bg-slate-700/50 rounded p-3">
                      <div className="font-medium text-white">{key}</div>
                      {data.exists ? (
                        <div className="text-sm text-slate-300">
                          ✅ Images: {data.hasImages} | 
                          Taille: {Math.round(data.size / 1024)} KB | 
                          Timestamp: {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
                        </div>
                      ) : (
                        <div className="text-sm text-red-400">
                          ❌ Pas de données {data.error && `(${data.error})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* sessionStorage */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">🔄 sessionStorage</h3>
                <div className="bg-slate-700/50 rounded p-3">
                  {diagnosticResults.sessionStorage.exists ? (
                    <div className="text-sm text-slate-300">
                      ✅ Images: {diagnosticResults.sessionStorage.hasImages} | 
                      Taille: {Math.round(diagnosticResults.sessionStorage.size / 1024)} KB
                    </div>
                  ) : (
                    <div className="text-sm text-red-400">
                      ❌ Pas de données {diagnosticResults.sessionStorage.error && `(${diagnosticResults.sessionStorage.error})`}
                    </div>
                  )}
                </div>
              </div>

              {/* IndexedDB */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">🗄️ IndexedDB</h3>
                <div className="bg-slate-700/50 rounded p-3">
                  {diagnosticResults.indexedDB?.available ? (
                    <div className="text-sm text-slate-300">
                      ✅ Disponible | 
                      Nom: {diagnosticResults.indexedDB.name} | 
                      Version: {diagnosticResults.indexedDB.version} |
                      Images: {diagnosticResults.indexedDB.imageCount || 0} |
                      Stores: {diagnosticResults.indexedDB.stores.join(', ')}
                    </div>
                  ) : (
                    <div className="text-sm text-red-400">
                      ❌ Non disponible {diagnosticResults.indexedDB?.error && `(${diagnosticResults.indexedDB.error})`}
                    </div>
                  )}
                </div>
              </div>

              {/* Mémoire */}
              {diagnosticResults.memory && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">💾 Mémoire</h3>
                  <div className="bg-slate-700/50 rounded p-3">
                    <div className="text-sm text-slate-300">
                      Utilisée: {diagnosticResults.memory.used} MB / {diagnosticResults.memory.limit} MB
                      <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(diagnosticResults.memory.used / diagnosticResults.memory.limit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommandations */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">💡 Recommandations</h3>
                <div className="space-y-2">
                  {diagnosticResults.recommendations.map((rec, index) => (
                    <div key={index} className="bg-slate-700/50 rounded p-3 text-sm">
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
