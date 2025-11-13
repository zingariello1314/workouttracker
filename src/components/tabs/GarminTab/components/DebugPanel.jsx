import React, { useEffect, useState, useId, useCallback } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
import { collectDiagnosticsSnapshot } from '../utils/diagnosticsCollector';
import TelemetryCoordinator from '../utils/TelemetryCoordinator';
import { useToast } from './Toast';
import { isBrowser, getWindow } from '../../../../utils/isBrowser';
const CacheDiagnostics = React.lazy(() => import('../DebugPanel/CacheDiagnostics'));
const NetworkDiagnostics = React.lazy(() => import('../DebugPanel/NetworkDiagnostics'));
const UIMetrics = React.lazy(() => import('../DebugPanel/UIMetrics'));
const ServerDiagnostics = React.lazy(() => import('../DebugPanel/ServerDiagnostics'));
const ObservabilityDiagnostics = React.lazy(() => import('../DebugPanel/ObservabilityDiagnostics'));
const ServerMetricsDashboard = React.lazy(() => import('../DebugPanel/ServerMetricsDashboard'));
const PerformanceView = React.lazy(() => import('../DebugPanel/PerformanceView'));

const sanitizeTelemetryStore = (store) => {
  if (!store) {
    return null;
  }
  return {
    sessionId: store.sessionId ?? null,
    schemaVersion: store.schemaVersion ?? null,
    lastUpdate: store.lastUpdate ?? null,
    lastPush: store.lastPush ?? null,
    lastPushStatus: store.lastPushStatus ?? null,
    lastPushError: store.lastPushError ?? null,
    pendingPush: Boolean(store.pendingPush),
    history: Array.isArray(store.history)
      ? store.history.slice(0, 10).map((entry) => ({
          generatedAt: entry?.generatedAt ?? null,
          reason: entry?.reason ?? null
        }))
      : []
  };
};

export default function DebugPanel({
  onClose,
  cacheMeta,
  networkStats,
  uiMetrics,
  serverDebug,
  onRefresh
}) {
  const headingId = useId();
  const liveRegionId = useId();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [liveMessage, setLiveMessage] = React.useState('');
  const { showToast, ToastContainer } = useToast();
  const dialogRef = useFocusTrap({
    autoFocusSelector: '[data-autofocus="true"]',
    onEscape: onClose,
    returnFocus: true
  });

  const [networkSnapshot, setNetworkSnapshot] = useState(() => {
    if (networkStats) return networkStats;
    // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
    const win = getWindow();
    if (isBrowser() && win.__GARMIN_NETWORK_STATS__) {
      return { ...win.__GARMIN_NETWORK_STATS__ };
    }
    return null;
  });

  const [uiSnapshot, setUiSnapshot] = useState(() => {
    if (uiMetrics) return uiMetrics;
    // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
    const win = getWindow();
    if (isBrowser() && win.__GARMIN_UI_METRICS__) {
      return { ...win.__GARMIN_UI_METRICS__ };
    }
    return null;
  });

  const handleRefreshDiagnostics = useCallback(
    async (origin = 'panel-refresh') => {
      if (!onRefresh) {
        return;
      }
      setIsRefreshing(true);
      try {
        await onRefresh();
        setLiveMessage(
          origin === 'keyboard'
            ? 'Diagnostic rafraîchi (raccourci clavier).'
            : 'Diagnostic rafraîchi.'
        );
      } catch (error) {
        setLiveMessage(
          error?.message
            ? `Échec du rafraîchissement: ${error.message}`
            : 'Échec du rafraîchissement des diagnostics.'
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [onRefresh]
  );

  const refreshFromHeader = useCallback(
    () => handleRefreshDiagnostics('panel-button'),
    [handleRefreshDiagnostics]
  );

  const refreshFromNetwork = useCallback(
    () => handleRefreshDiagnostics('network-panel'),
    [handleRefreshDiagnostics]
  );

  const refreshFromCache = useCallback(
    () => handleRefreshDiagnostics('cache-panel'),
    [handleRefreshDiagnostics]
  );

  const refreshFromServer = useCallback(
    () => handleRefreshDiagnostics('server-debug'),
    [handleRefreshDiagnostics]
  );

  useEffect(() => {
    if (networkStats) {
      setNetworkSnapshot(networkStats);
    }
  }, [networkStats]);

  useEffect(() => {
    if (uiMetrics) {
      setUiSnapshot(uiMetrics);
    }
  }, [uiMetrics]);

  useEffect(() => {
    if (!isRefreshing && serverDebug) {
      setLiveMessage('Diagnostic serveur mis à jour.');
    }
  }, [serverDebug, isRefreshing]);

  useEffect(() => {
    if (!isRefreshing && (networkStats || uiMetrics)) {
      setLiveMessage('Instantané réseau/UI mis à jour.');
    }
  }, [networkStats, uiMetrics, isRefreshing]);

  useEffect(() => {
    TelemetryCoordinator.configureAutoPush({
      enableAutoPush: true,
      autoPushIntervalMs: 60000
    });
    return () => {
      TelemetryCoordinator.configureAutoPush({ enableAutoPush: false });
    };
  }, []);

  /**
   * Construit le payload de diagnostic complet
   */
  const buildDiagnosticsPayload = useCallback(() => {
    const payload = collectDiagnosticsSnapshot({
      cacheMeta,
      networkStats: networkSnapshot,
      uiMetrics: uiSnapshot,
      serverDebug,
      options: {
        includeServer: Boolean(serverDebug),
        historyLimit: 20,
        renderHistoryLimit: 20
      }
    });

    // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
    const win = getWindow();
    const telemetryStore =
      isBrowser() && win.__GARMIN_OBSERVABILITY__
        ? sanitizeTelemetryStore(win.__GARMIN_OBSERVABILITY__)
        : null;

    const telemetrySnapshot =
      TelemetryCoordinator?.getSnapshot?.() || null;

    return {
      ...payload,
      telemetry: {
        snapshot: telemetrySnapshot
          ? JSON.parse(JSON.stringify(telemetrySnapshot))
          : null,
        store: telemetryStore
      }
    };
  }, [cacheMeta, networkSnapshot, serverDebug, uiSnapshot]);

  /**
   * Copie le diagnostic JSON dans le presse-papier
   */
  const handleCopyDiagnostics = useCallback(async () => {
    try {
      const enrichedPayload = buildDiagnosticsPayload();
      const jsonString = JSON.stringify(enrichedPayload, null, 2);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
        setLiveMessage('Diagnostic copié dans le presse-papier.');
        showToast('✅ Diagnostic copié dans le presse-papier.', 'success', 3000);
      } else {
        // Fallback pour navigateurs sans Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = jsonString;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setLiveMessage('Diagnostic copié dans le presse-papier (méthode fallback).');
        showToast('✅ Diagnostic copié dans le presse-papier.', 'success', 3000);
      }
    } catch (error) {
      console.error('[DebugPanel] Copy diagnostics failed:', error);
      showToast('❌ Impossible de copier le diagnostic. Consulte la console pour plus de détails.', 'error', 5000);
      setLiveMessage('Échec de la copie du diagnostic.');
    }
  }, [buildDiagnosticsPayload, showToast]);

  /**
   * Exporte le diagnostic en fichier JSON
   */
  const handleExportDiagnostics = useCallback(() => {
    try {
      const enrichedPayload = buildDiagnosticsPayload();
      const blob = new Blob([JSON.stringify(enrichedPayload, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `garmin-diagnostics-${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setLiveMessage('Diagnostic exporté au format JSON.');
      showToast('✅ Diagnostic exporté au format JSON.', 'success', 3000);
    } catch (error) {
      console.error('[DebugPanel] Export diagnostics failed:', error);
      showToast('❌ Impossible de générer le fichier de diagnostic. Consulte la console pour plus de détails.', 'error', 5000);
      setLiveMessage('Échec de l\'export du diagnostic.');
    }
  }, [buildDiagnosticsPayload, showToast]);

  useEffect(() => {
    // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
    if (!isBrowser()) {
      return;
    }
    
    const win = getWindow();
    const handleNetworkUpdate = (event) => {
      setNetworkSnapshot(
        event?.detail ||
          (win.__GARMIN_NETWORK_STATS__
            ? { ...win.__GARMIN_NETWORK_STATS__ }
            : null)
      );
    };

    const handleUiUpdate = (event) => {
      setUiSnapshot(
        event?.detail ||
          (win.__GARMIN_UI_METRICS__
            ? { ...win.__GARMIN_UI_METRICS__ }
            : null)
      );
    };

    win.addEventListener('garmin-network-update', handleNetworkUpdate);
    win.addEventListener('garmin-ui-metrics-update', handleUiUpdate);

    return () => {
      win.removeEventListener('garmin-network-update', handleNetworkUpdate);
      win.removeEventListener('garmin-ui-metrics-update', handleUiUpdate);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div
        ref={dialogRef}
        className="bg-slate-800/95 rounded-lg p-6 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto space-y-6 focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-busy={isRefreshing}
        tabIndex={-1}
      >
        <div
          id={liveRegionId}
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isRefreshing ? 'Mise à jour du diagnostic…' : liveMessage}
        </div>
        <div className="flex items-center justify-between">
          <h2 id={headingId} className="text-2xl font-bold text-white">
            🔍 Panneau de Diagnostic Garmin
          </h2>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={refreshFromHeader}
                disabled={isRefreshing}
                className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRefreshing ? 'Rafraîchissement…' : 'Rafraîchir'}
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyDiagnostics}
              className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
              title="Copier le diagnostic JSON dans le presse-papier"
            >
              📋 Copier JSON
            </button>
            <button
              type="button"
              onClick={handleExportDiagnostics}
              className="px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
              title="Télécharger le diagnostic JSON"
            >
              💾 Export JSON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-200"
              title="Fermer"
              data-autofocus="true"
            >
              <span className="sr-only">Fermer</span>
              ×
            </button>
          </div>
        </div>

        <React.Suspense fallback={
          <div 
            className="text-slate-400 text-sm p-4 rounded-lg border border-slate-700 bg-slate-800/60 flex items-center gap-3"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span 
              className="h-4 w-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>Chargement des diagnostics…</span>
          </div>
        }>
          <div className="space-y-6">
            <CacheDiagnostics
              meta={cacheMeta}
              onRefresh={refreshFromCache}
              serverDebug={serverDebug}
              isRefreshing={isRefreshing}
            />
            <NetworkDiagnostics
              networkStats={networkSnapshot}
              onRefresh={refreshFromNetwork}
              onFetchServerDebug={refreshFromServer}
              serverDebug={serverDebug}
              isRefreshing={isRefreshing}
              degradedMetrics={cacheMeta ? {
                isDegraded: Boolean(cacheMeta.degraded),
                degradedReason: cacheMeta.degradedReason || null,
                currentCooldown: cacheMeta.cooldownMs || cacheMeta.currentCooldown || 0,
                nextRetry: cacheMeta.nextRetry || null,
                nextRetryTimestamp: cacheMeta.nextRetryTimestamp || null,
                circuitState: cacheMeta.circuit || null,
                failureCount: cacheMeta.failureCount || null,
                sessionId: cacheMeta.sessionId || null
              } : null}
            />
            <UIMetrics metrics={uiSnapshot} />
            <PerformanceView 
              uiMetrics={uiSnapshot}
              networkStats={networkSnapshot}
              cacheMeta={cacheMeta}
            />
            <ObservabilityDiagnostics />
            <ServerMetricsDashboard />
            {serverDebug && <ServerDiagnostics data={serverDebug} />}
          </div>
        </React.Suspense>
        <ToastContainer />
      </div>
    </div>
  );
}

