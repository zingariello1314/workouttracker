import React, { useCallback, useState } from 'react';
import {
  normalizeManualSleepByDate,
  normalizeManualSleepEntry,
  sleepDurationHoursFromTimes,
} from '../../utils/sport/manualSleepUtils';

/**
 * Correction manuelle des horaires de sommeil depuis le calendrier.
 * Neutralise les phases physiologiques estimées à l’enregistrement.
 */
export default function CalendarManualSleepEditor({
  dateStr,
  initialBedTime = '',
  initialWakeTime = '',
  initialSleepStart = '',
  initialSleepEnd = '',
  currentData,
  updateData,
  onClose,
  t,
}) {
  const tr = t || ((k, d) => d);
  const existing = normalizeManualSleepByDate(currentData?.manualSleepByDate)[dateStr];
  const [bedTime, setBedTime] = useState(existing?.bedTime || initialBedTime || '');
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime || initialWakeTime || '');
  const [sleepStart, setSleepStart] = useState(existing?.sleepStart || initialSleepStart || '');
  const [sleepEnd, setSleepEnd] = useState(existing?.sleepEnd || initialSleepEnd || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSave = useCallback(async () => {
    setError('');
    const entry = normalizeManualSleepEntry({
      bedTime: bedTime || null,
      wakeTime: wakeTime || null,
      sleepStart: sleepStart || null,
      sleepEnd: sleepEnd || null,
      durationHours: sleepDurationHoursFromTimes(bedTime || sleepStart, wakeTime || sleepEnd),
      updatedAt: new Date().toISOString(),
    });
    if (!entry) {
      setError(tr('calendar.heatmap.recapDetail.sleepEditInvalid', 'Indique au moins un horaire valide (HH:MM).'));
      return;
    }
    if (typeof updateData !== 'function') return;
    setSaving(true);
    try {
      const prev = normalizeManualSleepByDate(currentData?.manualSleepByDate);
      await updateData({
        ...currentData,
        manualSleepByDate: {
          ...prev,
          [dateStr]: entry,
        },
      });
      onClose?.();
    } catch {
      setError(tr('calendar.heatmap.recapDetail.sleepEditSaveError', 'Erreur de sauvegarde'));
    } finally {
      setSaving(false);
    }
  }, [bedTime, wakeTime, sleepStart, sleepEnd, dateStr, currentData, updateData, onClose, tr]);

  const onRemove = useCallback(async () => {
    if (typeof updateData !== 'function') return;
    setSaving(true);
    try {
      const prev = normalizeManualSleepByDate(currentData?.manualSleepByDate);
      const next = { ...prev };
      delete next[dateStr];
      await updateData({
        ...currentData,
        manualSleepByDate: next,
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  }, [dateStr, currentData, updateData, onClose]);

  const field = (label, value, setValue) => (
    <label className="block space-y-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-sm text-white"
      />
    </label>
  );

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-violet-900/50 bg-slate-950/80 p-3">
      <p className="text-xs text-slate-400">
        {tr(
          'calendar.heatmap.recapDetail.sleepEditHint',
          'Corrige les horaires. Les phases (profond, léger, REM) et autres estimations Garmin seront neutralisées pour ce jour.'
        )}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {field(tr('calendar.heatmap.recapDetail.bedTime', 'Coucher'), bedTime, setBedTime)}
        {field(tr('calendar.heatmap.recapDetail.wakeTime', 'Lever'), wakeTime, setWakeTime)}
        {field(
          tr('calendar.heatmap.recapDetail.sleepStart', 'Endormissement'),
          sleepStart,
          setSleepStart
        )}
        {field(tr('calendar.heatmap.recapDetail.sleepEnd', 'Fin du sommeil'), sleepEnd, setSleepEnd)}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
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
            {tr('common.delete', 'Supprimer le correctif')}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="text-xs text-slate-500 underline">
          {tr('common.cancel', 'Annuler')}
        </button>
      </div>
    </div>
  );
}
