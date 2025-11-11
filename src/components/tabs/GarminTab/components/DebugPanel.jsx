import React, { useEffect, useState, useId } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
const CacheDiagnostics = React.lazy(() => import('../DebugPanel/CacheDiagnostics'));
const NetworkDiagnostics = React.lazy(() => import('../DebugPanel/NetworkDiagnostics'));
const UIMetrics = React.lazy(() => import('../DebugPanel/UIMetrics'));
const ServerDiagnostics = React.lazy(() => import('../DebugPanel/ServerDiagnostics'));

export default function DebugPanel({
  onClose,
  cacheMeta,
  networkStats,
  uiMetrics,
  serverDebug,
  onRefresh
}) {
  const headingId = useId();
  const dialogRef = useFocusTrap({
    autoFocusSelector: '[data-autofocus="true"]',
    onEscape: onClose
  });

  const [networkSnapshot, setNetworkSnapshot] = useState(() => {
    if (networkStats) return networkStats;
    if (typeof window !== 'undefined' && window.__GARMIN_NETWORK_STATS__) {
      return { ...window.__GARMIN_NETWORK_STATS__ };
    }
    return null;
  });

  const [uiSnapshot, setUiSnapshot] = useState(() => {
    if (uiMetrics) return uiMetrics;
    if (typeof window !== 'undefined' && window.__GARMIN_UI_METRICS__) {
      return { ...window.__GARMIN_UI_METRICS__ };
    }
    return null;
  });

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
    const handleNetworkUpdate = (event) => {
      setNetworkSnapshot(
        event?.detail ||
          (typeof window !== 'undefined' && window.__GARMIN_NETWORK_STATS__
            ? { ...window.__GARMIN_NETWORK_STATS__ }
            : null)
      );
    };

    const handleUiUpdate = (event) => {
      setUiSnapshot(
        event?.detail ||
          (typeof window !== 'undefined' && window.__GARMIN_UI_METRICS__
            ? { ...window.__GARMIN_UI_METRICS__ }
            : null)
      );
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('garmin-network-update', handleNetworkUpdate);
      window.addEventListener('garmin-ui-metrics-update', handleUiUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('garmin-network-update', handleNetworkUpdate);
        window.removeEventListener('garmin-ui-metrics-update', handleUiUpdate);
      }
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
        tabIndex={-1}
      >
        <div className="flex items-center justify-between">
          <h2 id={headingId} className="text-2xl font-bold text-white">
            🔍 Panneau de Diagnostic Garmin
          </h2>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Rafraîchir
              </button>
            )}
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

        <React.Suspense fallback={<div className="text-slate-400 text-sm">Chargement des diagnostics…</div>}>
          <div className="space-y-6">
            <CacheDiagnostics meta={cacheMeta} onRefresh={onRefresh} />
            <NetworkDiagnostics networkStats={networkSnapshot} onRefresh={onRefresh} />
            <UIMetrics metrics={uiSnapshot} />
            {serverDebug && <ServerDiagnostics data={serverDebug} />}
          </div>
        </React.Suspense>
      </div>
    </div>
  );
}

