import React from 'react';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

const AutoSyncSettings = React.lazy(() => import('../AutoSyncSettings'));
const PDFExport = React.lazy(() => import('../PDFExport'));
const AutoSyncHistoryView = React.lazy(() => import('../AutoSyncHistoryView'));

const UtilitiesSection = ({
  syncNow,
  selectedDate,
  periodFilter,
  customStartDate,
  customEndDate,
  autoSyncHistory,
  autoSyncStats,
  fallback = null
}) => {
  useUIMetricsTelemetry('UtilitiesSection');

  const resolvedFallback = fallback || (
    <div
      className="rounded-lg border border-slate-700 bg-slate-800/60 flex items-center justify-center text-slate-300 text-sm"
      style={{ minHeight: '160px' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></span>
        <span>Chargement…</span>
      </div>
    </div>
  );

  const handleRefreshHistory = React.useCallback(() => {
    // Recharger l'historique depuis le scheduler
    // Note: L'état est géré par GarminTabContainer via les listeners
    // Cette fonction déclenchera un rechargement côté container
    window.dispatchEvent(new CustomEvent('garmin-autosync-refresh'));
  }, []);

  return (
    <div className="space-y-6">
      <React.Suspense fallback={resolvedFallback}>
        <AutoSyncSettings syncFunction={syncNow} />
      </React.Suspense>
      {/* ✅ Tâche 13 : Historique visuel AutoSync */}
      {autoSyncHistory && (
        <React.Suspense fallback={resolvedFallback}>
          <AutoSyncHistoryView
            history={autoSyncHistory}
            stats={autoSyncStats}
            onRefresh={handleRefreshHistory}
          />
        </React.Suspense>
      )}
      <React.Suspense fallback={resolvedFallback}>
        <PDFExport
          selectedDate={selectedDate}
          periodFilter={periodFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      </React.Suspense>
    </div>
  );
};

export default UtilitiesSection;

