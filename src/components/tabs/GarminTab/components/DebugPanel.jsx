import React, { useState, useEffect } from 'react';
import { RefreshCw, X, AlertCircle, CheckCircle, Clock, Database, Server } from 'lucide-react';
import { CacheDiagnostics } from '../DebugPanel/CacheDiagnostics';

/**
 * ✅ PHASE 1 : Panneau de diagnostic pour comprendre le comportement de la synchronisation
 * 
 * Affiche :
 * - État du cache serveur et frontend
 * - Timestamps de dernière synchronisation
 * - Informations détaillées sur les requêtes
 */
export default function DebugPanel({ onClose, cacheMeta }) {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les données de debug depuis le serveur
      const response = await fetch('http://localhost:3031/api/garmin/debug');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDebugData(data);

      // Récupérer le timestamp de dernière sync depuis IndexedDB (si disponible)
      try {
        // Note: On accède directement à IndexedDB pour éviter les dépendances circulaires
        if (window.indexedDB) {
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('GarminDataDB', 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
              // Si upgrade nécessaire, créer les stores si absents
              const db = request.result;
              if (!db.objectStoreNames.contains('dailyMetrics')) {
                db.createObjectStore('dailyMetrics', { keyPath: 'date' });
              }
            };
          });
          
          if (db) {
            const tx = db.transaction(['dailyMetrics'], 'readonly');
            const store = tx.objectStore('dailyMetrics');
            const today = new Date().toISOString().split('T')[0];
            const request = store.get(today);
            const metric = await new Promise((resolve) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => resolve(null);
            });
            if (metric?.lastSynced) {
              setLastSyncTimestamp(metric.lastSynced);
            }
          }
        }
      } catch (e) {
        console.warn('[DebugPanel] Erreur récupération timestamp IndexedDB:', e);
      }
    } catch (e) {
      setError(e.message);
      console.error('[DebugPanel] Erreur récupération données debug:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(fetchDebugData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !debugData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <h2 className="text-xl font-bold text-white">Chargement des données de diagnostic...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">🔍 Panneau de Diagnostic Garmin</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDebugData}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-300">❌ Erreur: {error}</p>
          </div>
        )}

        <div className="mb-6">
          <CacheDiagnostics meta={cacheMeta} />
        </div>

        {debugData && (
          <div className="space-y-6">
            {/* Informations générales */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Informations Générales
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Timestamp serveur:</span>
                <p className="text-white font-mono text-xs mt-1">{debugData.timestamp}</p>
              </div>
              <div>
                <span className="text-slate-400">Mode Python:</span>
                <p className="text-white mt-1">
                  {debugData.server.usePython ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Activé
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <X className="w-4 h-4" /> Désactivé
                    </span>
                  )}
                </p>
              </div>
              {lastSyncTimestamp && (
                <div className="col-span-2">
                  <span className="text-slate-400">Dernière sync (IndexedDB):</span>
                  <p className="text-white font-mono text-xs mt-1">{lastSyncTimestamp}</p>
                </div>
              )}
            </div>
          </div>

            {/* Cache Serveur */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                Cache Serveur (TTL: {debugData.server.cache.ttlMinutes} min)
              </h3>
              <div className="mb-3">
                <span className="text-slate-400">Taille du cache:</span>
                <span className="text-white ml-2 font-semibold">{debugData.server.cache.size} entrée(s)</span>
              </div>
              {debugData.server.cache.entries.length > 0 ? (
                <div className="space-y-2">
                  {debugData.server.cache.entries.map((entry, idx) => (
                    <div key={idx} className="bg-slate-600/50 rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-mono text-xs break-all">{entry.key}</span>
                        {entry.expiresInSeconds > 0 ? (
                          <span className="text-green-400 text-xs">
                            Valide ({entry.expiresInSeconds}s restants)
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs">Expiré</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Timestamp:</span>
                          <p className="text-white font-mono">{entry.timestamp}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Âge:</span>
                          <p className="text-white">{entry.ageSeconds}s</p>
                        </div>
                        <div>
                          <span className="text-slate-400">LastSync:</span>
                          <p className="text-white font-mono text-xs">{entry.dataSummary.lastSync || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Données:</span>
                          <p className="text-white">
                            {entry.dataSummary.activitiesCount} activités, {entry.dataSummary.dailyMetricsCount} métriques
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Aucune entrée dans le cache</p>
              )}
            </div>

            {/* Dernier statut */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-400" />
                Dernier Statut de Synchronisation
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">OK:</span>
                  <span className={`ml-2 ${debugData.server.lastStatus.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {debugData.server.lastStatus.ok ? '✅ Oui' : '❌ Non'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Message:</span>
                  <p className="text-white mt-1">{debugData.server.lastStatus.message || 'N/A'}</p>
                </div>
                {debugData.server.lastStatus.lastSync && (
                  <div>
                    <span className="text-slate-400">LastSync:</span>
                    <p className="text-white font-mono text-xs mt-1">{debugData.server.lastStatus.lastSync}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Explications */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">💡 Explications</h3>
              <div className="space-y-2 text-sm text-blue-200">
                <p>• <strong>Cache serveur (5 min TTL)</strong>: Si une synchronisation est faite dans les 5 minutes, les données en cache sont retournées au lieu de faire une nouvelle requête à Garmin.</p>
                <p>• <strong>Cache frontend (60 sec TTL)</strong>: Si une synchronisation est faite dans les 60 secondes, les données en cache frontend sont utilisées sans même faire une requête au serveur.</p>
                <p>• <strong>Force Refresh</strong>: Utilisez le bouton "Synchroniser (forcer)" pour bypasser les caches et forcer une récupération complète des données.</p>
                <p>• <strong>Délai API Garmin</strong>: L'API Garmin peut avoir un délai de quelques minutes avant de rendre les nouvelles données disponibles.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

