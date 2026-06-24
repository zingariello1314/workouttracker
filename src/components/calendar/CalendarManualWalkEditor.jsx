import React, { useCallback, useState } from 'react';
import {
  MANUAL_WALK_MAX_STEPS_PER_DAY,
  MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY,
  normalizeManualDailyWalkByDate
} from '../../utils/sport/manualDailyWalkUtils';
import { persistEnduranceData } from '../../services/endurance/enduranceDataService';

/**
 * Saisie / édition pas manuels depuis le calendrier (modal léger).
 */
export default function CalendarManualWalkEditor({
  dateStr,
  garminSteps = 0,
  currentData,
  updateData,
  onClose,
  t
}) {
  const tr = t || ((k, d) => d);
  const existing = normalizeManualDailyWalkByDate(currentData?.enduranceData?.manualDailyWalkByDate)[dateStr];
  const [entryMode, setEntryMode] = useState(existing?.entryMode === 'supplement' ? 'supplement' : 'total');
  const [stepsDraft, setStepsDraft] = useState(existing?.steps ? String(existing.steps) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSave = useCallback(async () => {
    setError('');
    const steps = Math.round(Number(String(stepsDraft).replace(/\s/g, '').replace(',', '.')));
    if (!Number.isFinite(steps) || steps < 1) {
      setError(tr('endurance.manualDailyWalk.errorSteps', 'Nombre de pas invalide'));
      return;
    }
    const max = entryMode === 'supplement' ? MANUAL_WALK_MAX_SUPPLEMENT_STEPS_PER_DAY : MANUAL_WALK_MAX_STEPS_PER_DAY;
    if (steps > max) {
      setError(tr('endurance.manualDailyWalk.errorStepsMax', `Maximum ${max} pas`));
      return;
    }
    if (typeof updateData !== 'function') return;
    setSaving(true);
    try {
      const prev = normalizeManualDailyWalkByDate(currentData?.enduranceData?.manualDailyWalkByDate);
      const next = {
        ...prev,
        [dateStr]: {
          steps,
          entryMode,
          updatedAt: new Date().toISOString()
        }
      };
      await persistEnduranceData({ currentData, patch: { manualDailyWalkByDate: next }, updateData });
      onClose?.();
    } catch {
      setError(tr('endurance.manualDailyWalk.saveError', 'Erreur de sauvegarde'));
    } finally {
      setSaving(false);
    }
  }, [stepsDraft, entryMode, dateStr, currentData, updateData, onClose, tr]);

  const onRemove = useCallback(async () => {
    if (typeof updateData !== 'function') return;
    setSaving(true);
    try {
      const prev = normalizeManualDailyWalkByDate(currentData?.enduranceData?.manualDailyWalkByDate);
      const next = { ...prev };
      delete next[dateStr];
      await persistEnduranceData({ currentData, patch: { manualDailyWalkByDate: next }, updateData });
      onClose?.();
    } finally {
      setSaving(false);
    }
  }, [dateStr, currentData, updateData, onClose]);

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-sky-900/50 bg-slate-950/80 p-3">
      <p className="text-xs text-slate-400">
        {garminSteps > 0
          ? tr('calendar.heatmap.recapDetail.stepsGarminHint', { count: garminSteps, defaultValue: `${garminSteps.toLocaleString('fr-FR')} pas Garmin ce jour` })
          : tr('calendar.heatmap.recapDetail.stepsNoGarmin', 'Pas Garmin non disponibles ce jour')}
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setEntryMode('total')}
          className={`rounded-md px-2 py-1 border ${entryMode === 'total' ? 'border-sky-500 text-sky-300' : 'border-slate-700 text-slate-400'}`}
        >
          {tr('endurance.manualDailyWalk.modeTotal', 'Total estimé')}
        </button>
        <button
          type="button"
          onClick={() => setEntryMode('supplement')}
          className={`rounded-md px-2 py-1 border ${entryMode === 'supplement' ? 'border-sky-500 text-sky-300' : 'border-slate-700 text-slate-400'}`}
        >
          {tr('endurance.manualDailyWalk.modeSupplement', 'Complément après montre')}
        </button>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={stepsDraft}
        onChange={(e) => setStepsDraft(e.target.value)}
        placeholder={tr('endurance.manualDailyWalk.stepsPlaceholder', 'Nombre de pas')}
        className="w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-sm text-white"
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {tr('common.save', 'Enregistrer')}
        </button>
        {existing ? (
          <button
            type="button"
            disabled={saving}
            onClick={onRemove}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-300"
          >
            {tr('common.delete', 'Supprimer')}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="text-xs text-slate-500 underline">
          {tr('common.cancel', 'Annuler')}
        </button>
      </div>
    </div>
  );
}
