/**
 * Vue Performance pour le DebugPanel.
 * 
 * Affiche les métriques de performance de l'onglet Garmin :
 * - Temps de rendu des composants
 * - Temps de synchronisation
 * - Utilisation mémoire (si disponible)
 * - Métriques réseau
 * 
 * @module PerformanceView
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Formate une durée en millisecondes en format lisible
 */
const formatDuration = (ms) => {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) {
    return 'N/A';
  }
  
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Formate un nombre avec séparateurs
 */
const formatNumber = (num) => {
  if (num === null || num === undefined || !Number.isFinite(num)) {
    return 'N/A';
  }
  return num.toLocaleString('fr-FR');
};

/**
 * Composant PerformanceView
 */
export default function PerformanceView({ uiMetrics, networkStats, cacheMeta }) {
  // Calculer les métriques de performance depuis uiMetrics
  const performanceMetrics = useMemo(() => {
    if (!uiMetrics) {
      return null;
    }

    const {
      lastSyncDuration,
      lastRenderDuration,
      renderCount,
      renderHistory = [],
      components = {}
    } = uiMetrics;

    // Calculer la moyenne des temps de rendu
    const renderDurations = renderHistory
      .filter(entry => entry?.duration && Number.isFinite(entry.duration))
      .map(entry => entry.duration);
    
    const avgRenderDuration = renderDurations.length > 0
      ? renderDurations.reduce((sum, d) => sum + d, 0) / renderDurations.length
      : null;

    const maxRenderDuration = renderDurations.length > 0
      ? Math.max(...renderDurations)
      : null;

    const minRenderDuration = renderDurations.length > 0
      ? Math.min(...renderDurations)
      : null;

    // Analyser les composants les plus lents
    const componentMetrics = Object.entries(components)
      .map(([name, data]) => ({
        name,
        renderCount: data?.renderCount || 0,
        avgDuration: data?.avgDuration || null,
        totalDuration: data?.totalDuration || null
      }))
      .filter(comp => comp.renderCount > 0)
      .sort((a, b) => (b.avgDuration || 0) - (a.avgDuration || 0))
      .slice(0, 5); // Top 5

    return {
      sync: {
        lastDuration: lastSyncDuration,
        formatted: formatDuration(lastSyncDuration)
      },
      render: {
        lastDuration: lastRenderDuration,
        avgDuration: avgRenderDuration,
        maxDuration: maxRenderDuration,
        minDuration: minRenderDuration,
        count: renderCount,
        formatted: {
          last: formatDuration(lastRenderDuration),
          avg: formatDuration(avgRenderDuration),
          max: formatDuration(maxRenderDuration),
          min: formatDuration(minRenderDuration)
        }
      },
      components: componentMetrics
    };
  }, [uiMetrics]);

  // Calculer les métriques réseau depuis networkStats
  const networkMetrics = useMemo(() => {
    if (!networkStats) {
      return null;
    }

    const {
      totalRequests = 0,
      successfulRequests = 0,
      failedRequests = 0,
      totalBytes = 0,
      avgResponseTime = null,
      minResponseTime = null,
      maxResponseTime = null
    } = networkStats;

    const successRate = totalRequests > 0
      ? ((successfulRequests / totalRequests) * 100).toFixed(1)
      : null;

    return {
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: failedRequests,
        successRate: successRate ? `${successRate}%` : 'N/A'
      },
      bytes: {
        total: totalBytes,
        formatted: totalBytes > 0 ? formatBytes(totalBytes) : 'N/A'
      },
      responseTime: {
        avg: avgResponseTime,
        min: minResponseTime,
        max: maxResponseTime,
        formatted: {
          avg: formatDuration(avgResponseTime),
          min: formatDuration(minResponseTime),
          max: formatDuration(maxResponseTime)
        }
      }
    };
  }, [networkStats]);

  // Formater les bytes
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  if (!performanceMetrics && !networkMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">📊 Performance</h3>
        <p className="text-slate-400 text-sm">Aucune métrique de performance disponible.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Performance</h3>
      
      <div className="space-y-4">
        {/* Métriques de synchronisation */}
        {performanceMetrics?.sync && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Synchronisation</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">Dernière durée:</div>
              <div className="text-white font-mono">{performanceMetrics.sync.formatted}</div>
            </div>
          </div>
        )}

        {/* Métriques de rendu */}
        {performanceMetrics?.render && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Rendu</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">Dernier rendu:</div>
              <div className="text-white font-mono">{performanceMetrics.render.formatted.last}</div>
              <div className="text-slate-400">Moyenne:</div>
              <div className="text-white font-mono">{performanceMetrics.render.formatted.avg}</div>
              <div className="text-slate-400">Min:</div>
              <div className="text-white font-mono">{performanceMetrics.render.formatted.min}</div>
              <div className="text-slate-400">Max:</div>
              <div className="text-white font-mono">{performanceMetrics.render.formatted.max}</div>
              <div className="text-slate-400">Nombre de rendus:</div>
              <div className="text-white font-mono">{formatNumber(performanceMetrics.render.count)}</div>
            </div>
          </div>
        )}

        {/* Top composants les plus lents */}
        {performanceMetrics?.components && performanceMetrics.components.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Top 5 composants (durée moyenne)</h4>
            <div className="space-y-1">
              {performanceMetrics.components.map((comp, index) => (
                <div key={comp.name} className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate">{index + 1}. {comp.name}</span>
                  <span className="text-white font-mono ml-2">
                    {formatDuration(comp.avgDuration)} ({formatNumber(comp.renderCount)} rendus)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métriques réseau */}
        {networkMetrics && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Réseau</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">Requêtes totales:</div>
              <div className="text-white font-mono">{formatNumber(networkMetrics.requests.total)}</div>
              <div className="text-slate-400">Réussies:</div>
              <div className="text-green-400 font-mono">{formatNumber(networkMetrics.requests.successful)}</div>
              <div className="text-slate-400">Échouées:</div>
              <div className="text-red-400 font-mono">{formatNumber(networkMetrics.requests.failed)}</div>
              <div className="text-slate-400">Taux de succès:</div>
              <div className="text-white font-mono">{networkMetrics.requests.successRate}</div>
              <div className="text-slate-400">Données transférées:</div>
              <div className="text-white font-mono">{networkMetrics.bytes.formatted}</div>
              <div className="text-slate-400">Temps réponse (moy):</div>
              <div className="text-white font-mono">{networkMetrics.responseTime.formatted.avg}</div>
            </div>
          </div>
        )}

        {/* Métriques cache (si disponibles) */}
        {cacheMeta && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Cache</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {cacheMeta.source && (
                <>
                  <div className="text-slate-400">Source:</div>
                  <div className="text-white font-mono">{cacheMeta.source}</div>
                </>
              )}
              {cacheMeta.degraded && (
                <>
                  <div className="text-slate-400">Mode dégradé:</div>
                  <div className="text-yellow-400 font-mono">Actif</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

PerformanceView.propTypes = {
  uiMetrics: PropTypes.object,
  networkStats: PropTypes.object,
  cacheMeta: PropTypes.object
};


