import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { X } from 'lucide-react';
import { describeRange, estimateApiCalls, validateRange, storeLastRange } from './forceSyncUtils';
import { getTodayDateStr } from '../../../hooks/garminDateUtils';

const ForceRangeCalendar = React.lazy(() => import('./ForceRangeCalendar'));

export default function ForceRangeDialog({
  initialRange = null,
  includeToday = false,
  onIncludeTodayChange = () => {},
  onCancel,
  onConfirm,
  maxSpanDays = 30
}) {
  const today = useMemo(() => getTodayDateStr(), []);
  const [start, setStart] = useState(initialRange?.start || today);
  const [end, setEnd] = useState(initialRange?.end || today);
  const [withToday, setWithToday] = useState(includeToday);
  const [error, setError] = useState(null);
  const startRef = useRef(null);

  const rangeDescriptor = useMemo(() => {
    return describeRange({ start, end }, withToday, { maxSpanDays });
  }, [start, end, withToday, maxSpanDays]);

  const spanDays = rangeDescriptor?.spanDays ?? null;
  const estimatedCalls = spanDays ? estimateApiCalls(spanDays) : 0;

  const validationPreview = rangeDescriptor?.validation ?? { valid: false, error: null };

  useEffect(() => {
    setError(null);
  }, [start, end, withToday]);

  useEffect(() => {
    startRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    const effectiveEnd = withToday ? today : end;
    const { valid, error: rangeError } = validateRange(start, effectiveEnd, { maxSpanDays });
    if (!valid) {
      setError(rangeError);
      return;
    }
    storeLastRange({ start, end: effectiveEnd, includeToday: withToday });
    onConfirm({ start, end }, withToday);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-[90vw] max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">Recalculer une plage de dates</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-800 text-slate-400"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-70 animate-pulse">
                <div className="h-12 bg-slate-800 rounded" />
                <div className="h-12 bg-slate-800 rounded" />
              </div>
            }
          >
            <ForceRangeCalendar
              ref={startRef}
              start={start}
              end={end}
              max={today}
              onChangeStart={setStart}
              onChangeEnd={setEnd}
            />
          </Suspense>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={withToday}
              onChange={(event) => {
                setWithToday(event.target.checked);
                onIncludeTodayChange(event.target.checked);
              }}
            />
            Inclure aujourd’hui ({today})
          </label>
          {spanDays && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 space-y-1">
              <div>
                <span className="font-medium text-white">{spanDays}</span> jour(s) seront recalculés
                {withToday ? ' (fin = aujourd’hui)' : ''}.
              </div>
              <div className="text-xs text-slate-400" aria-live="polite">
                Estimation : ≈ <span className="text-orange-300 font-semibold">{estimatedCalls}</span> appels API
                (stats, steps, fréquence cardiaque, sommeil, body battery, stress, SpO₂, minutes intensives).
              </div>
            </div>
          )}
          {!error && validationPreview.error && (
            <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-600/40 px-3 py-2 rounded">
              {validationPreview.error}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-600/40 px-3 py-2 rounded">
              {error}
            </div>
          )}
          <p className="text-xs text-slate-400">
            La synchronisation forcée vide le cache pour la plage sélectionnée, puis relance l’ensemble du pipeline
            (backend + Python + export IndexedDB). Utilise cette option lorsqu’une journée n’a pas été synchronisée ou
            pour rafraîchir des données obsolètes.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium"
          >
            Recalculer
          </button>
        </div>
      </div>
    </div>
  );
}


