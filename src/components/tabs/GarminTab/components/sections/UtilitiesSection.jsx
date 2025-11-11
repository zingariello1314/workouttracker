import React from 'react';

const AutoSyncSettings = React.lazy(() => import('../AutoSyncSettings'));
const PDFExport = React.lazy(() => import('../PDFExport'));

const UtilitiesSection = ({
  syncNow,
  selectedDate,
  periodFilter,
  customStartDate,
  customEndDate,
  fallback = null
}) => {
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

  return (
    <div className="space-y-6">
      <React.Suspense fallback={resolvedFallback}>
        <AutoSyncSettings syncFunction={syncNow} />
      </React.Suspense>
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

