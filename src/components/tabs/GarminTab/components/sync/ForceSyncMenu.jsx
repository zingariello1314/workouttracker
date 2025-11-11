import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { Zap, Moon, CalendarRange, Bot } from 'lucide-react';
import {
  mapPresetToRequest,
  mapRangeToRequest,
  restoreLastRange
} from './forceSyncUtils';

const ForceRangeDialog = React.lazy(() => import('./ForceRangeDialog'));

const PRESET_OPTIONS = [
  { mode: 'today', label: 'Aujourd’hui', icon: Zap, description: 'Recalculer la journée courante' },
  { mode: 'yesterday', label: 'La veille', icon: Moon, description: 'Récupérer le sommeil et les données finales d’hier' },
  { mode: 'range', label: 'Plage personnalisée…', icon: CalendarRange, description: 'Sélectionner une période précise' }
];

/**
 * Menu de forçage de synchronisation.
 * TODO: intégrer l’option auto une fois le backend prêt.
 */
export default function ForceSyncMenu({
  onSync,
  loading = false,
  lastForcedRange = null,
  autoForceEnabled = false,
  onRequestAuto = null
}) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const restoredRangeRef = React.useRef(restoreLastRange() || lastForcedRange || null);
  const [customRange, setCustomRange] = useState(() => {
    const initial = restoredRangeRef.current;
    if (!initial) return null;
    return { start: initial.start, end: initial.end };
  });
  const [includeToday, setIncludeToday] = useState(() => {
    const initial = restoredRangeRef.current;
    return initial?.includeToday ?? false;
  });

  React.useEffect(() => {
    if (!lastForcedRange) {
      return;
    }
    restoredRangeRef.current = lastForcedRange;
    setCustomRange(lastForcedRange.start || lastForcedRange.end ? { start: lastForcedRange.start, end: lastForcedRange.end } : null);
    if (typeof lastForcedRange.includeToday === 'boolean') {
      setIncludeToday(lastForcedRange.includeToday);
    }
  }, [lastForcedRange]);

  const toggleMenu = useCallback(() => {
    if (loading) return;
    setOpen((prev) => !prev);
  }, [loading]);

  const closeMenu = useCallback(() => setOpen(false), []);

  const handlePreset = useCallback((mode) => {
    if (mode === 'range') {
      setDialogOpen(true);
      closeMenu();
      return;
    }

    const request = mapPresetToRequest(mode);
    onSync?.(request);
    closeMenu();
  }, [closeMenu, onSync]);

  const handleRangeConfirm = useCallback((range, withToday) => {
    const request = mapRangeToRequest(range, withToday);
    const effectiveRange = request.range || range;
    setCustomRange(effectiveRange ? { start: effectiveRange.start, end: effectiveRange.end } : null);
    setIncludeToday(withToday);
    onSync?.(request);
  }, [onSync]);

  const autoOption = useMemo(() => {
    if (!autoForceEnabled && !onRequestAuto) return null;
    return {
      mode: 'auto',
      label: 'Auto (détection intelligente)',
      icon: Bot,
      description: 'Recalcule automatiquement la dernière période manquante'
    };
  }, [autoForceEnabled, onRequestAuto]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        disabled={loading}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`px-4 py-2 rounded-md text-white font-medium text-sm flex items-center gap-1 ${
          loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
        }`}
        title="Forcer la synchronisation (options avancées)"
      >
        {loading ? 'Forçage…' : 'Forcer'}
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-20 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="py-1">
            {PRESET_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => handlePreset(option.mode)}
                  className="w-full flex items-start gap-3 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 mt-0.5 text-orange-400 shrink-0" />
                  <span className="flex-1">
                    <span className="block font-medium text-slate-100">{option.label}</span>
                    <span className="block text-xs text-slate-400">{option.description}</span>
                  </span>
                </button>
              );
            })}
            {autoOption && (() => {
              const AutoIcon = autoOption.icon;
              return (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    if (onRequestAuto) {
                      onRequestAuto();
                    } else {
                      onSync?.({ forceRefresh: true, skipDelay: true, mode: 'auto' });
                    }
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 border-t border-slate-800"
                >
                  <AutoIcon className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <span className="flex-1">
                    <span className="block font-medium text-slate-100">{autoOption.label}</span>
                    <span className="block text-xs text-slate-400">{autoOption.description}</span>
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {dialogOpen && (
          <ForceRangeDialog
            initialRange={customRange}
            includeToday={includeToday}
            onCancel={() => setDialogOpen(false)}
            onConfirm={(range, withToday) => {
              handleRangeConfirm(range, withToday);
              setDialogOpen(false);
            }}
            onIncludeTodayChange={setIncludeToday}
          />
        )}
      </Suspense>
    </div>
  );
}


