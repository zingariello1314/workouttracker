/**
 * 📊 COMPOSANT INDICATEUR DE QUOTA
 * 
 * Affiche visuellement le quota de stockage disponible.
 * Barre de progression avec couleurs selon seuils.
 * 
 * @module QuotaIndicator
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  estimateAvailableQuota,
  formatBytes,
  formatQuotaPercentage
} from '../utils/quotaManager';
import logger from '../utils/logger';

const log = logger.component('QuotaIndicator');

/**
 * Intervalle de rafraîchissement automatique (ms)
 */
const REFRESH_INTERVAL = 30 * 1000; // 30 secondes

export default function QuotaIndicator({ 
  onWarning = null, 
  onCritical = null,
  showDetails = true,
  autoRefresh = true 
}) {
  const [quota, setQuota] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Charge le quota
   */
  const loadQuota = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const quotaData = await estimateAvailableQuota();
      setQuota(quotaData);

      // Déclencher callbacks si seuils dépassés
      if (quotaData.indexedDB.percentage > 90) {
        if (onCritical) {
          onCritical({
            level: 'CRITICAL',
            percentage: quotaData.indexedDB.percentage,
            message: `Quota IndexedDB critique (${quotaData.indexedDB.percentage.toFixed(1)}%)`,
            suggestion: 'Exportez vos bannières maintenant'
          });
        }
      } else if (quotaData.indexedDB.percentage > 80) {
        if (onWarning) {
          onWarning({
            level: 'WARNING',
            percentage: quotaData.indexedDB.percentage,
            message: `Quota IndexedDB élevé (${quotaData.indexedDB.percentage.toFixed(1)}%)`,
            suggestion: 'Pensez à exporter vos bannières'
          });
        }
      }

      log.debug('✅ Quota chargé', quotaData);
    } catch (err) {
      log.error('❌ Erreur chargement quota', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onWarning, onCritical]);

  // Chargement initial
  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  // Rafraîchissement automatique
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadQuota();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, loadQuota]);

  if (isLoading && !quota) {
    return (
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center text-slate-400 text-sm">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Calcul du quota...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
        <div className="flex items-center text-red-400 text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Erreur calcul quota: {error}
        </div>
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const indexedDBPercent = formatQuotaPercentage(quota.indexedDB.percentage);
  const localStoragePercent = formatQuotaPercentage(quota.localStorage.percentage);

  // Couleur barre de progression IndexedDB
  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="space-y-4">
      {/* IndexedDB Quota */}
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <h4 className="text-white font-semibold">IndexedDB (Stockage Principal)</h4>
          </div>
          <button
            onClick={loadQuota}
            className="text-blue-400 hover:text-blue-300 text-sm"
            title="Actualiser"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Barre de progression */}
        <div className="mb-2">
          <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressBarColor(quota.indexedDB.percentage)}`}
              style={{ width: `${Math.min(quota.indexedDB.percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Détails */}
        {showDetails && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Utilisation totale origine:</span>
              <span className={`font-medium ${indexedDBPercent.color}`}>
                {indexedDBPercent.value}% ({indexedDBPercent.label})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Bannières:</span>
              <span className="text-slate-300">
                {formatBytes(quota.indexedDB.bannerUsage)} 
                {quota.indexedDB.bannerPercentage > 0 && (
                  <span className="text-slate-400 ml-1">
                    ({quota.indexedDB.bannerPercentage.toFixed(2)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Disponible:</span>
              <span className="text-green-400 font-medium">
                {formatBytes(quota.indexedDB.available)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Total:</span>
              <span>{formatBytes(quota.indexedDB.total)}</span>
            </div>
          </div>
        )}

        {/* Avertissement si quota élevé */}
        {quota.indexedDB.percentage >= 90 && (
          <div className="mt-3 bg-red-900/20 border border-red-600/30 rounded p-2">
            <div className="flex items-start text-red-400 text-sm">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong>Quota critique !</strong> Exportez vos bannières maintenant pour éviter toute perte de données.
              </div>
            </div>
          </div>
        )}

        {quota.indexedDB.percentage >= 80 && quota.indexedDB.percentage < 90 && (
          <div className="mt-3 bg-yellow-900/20 border border-yellow-600/30 rounded p-2">
            <div className="flex items-start text-yellow-400 text-sm">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong>Quota élevé.</strong> Pensez à exporter vos bannières pour libérer de l'espace.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* localStorage Quota (moins important, affiché plus petit) */}
      {showDetails && (
        <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <h5 className="text-slate-300 text-sm font-medium">localStorage (Fallback)</h5>
            </div>
            <span className={`text-xs font-medium ${localStoragePercent.color}`}>
              {localStoragePercent.value}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressBarColor(quota.localStorage.percentage)}`}
              style={{ width: `${Math.min(quota.localStorage.percentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
            <span>Utilisé: {formatBytes(quota.localStorage.used)}</span>
            <span>Disponible: {formatBytes(quota.localStorage.available)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

