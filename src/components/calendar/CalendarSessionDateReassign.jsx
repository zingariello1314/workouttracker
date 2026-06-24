import React, { useCallback, useMemo, useState } from 'react';
import {
  buildAggregateClearSessionLogicalDate,
  buildAggregateWithGarminDateOverride,
  buildAggregateWithSessionLogicalDate,
  buildAggregateWithoutGarminDateOverride,
  describeSessionCalendarDates
} from '../../services/sport/GarminDateOverrideService';

/**
 * Réaffectation d'une séance à un autre jour calendrier (date logique).
 */
export default function CalendarSessionDateReassign({
  session,
  activityType = 'running',
  workoutData,
  updateData,
  t
}) {
  const tr = t || ((k, d) => d);
  const dates = useMemo(() => describeSessionCalendarDates(session, workoutData), [session, workoutData]);
  const [draftDate, setDraftDate] = useState(dates.logicalDate || dates.recordedDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSave = useCallback(async () => {
    if (!draftDate || typeof updateData !== 'function') return;
    setSaving(true);
    setError('');
    try {
      let next = workoutData;
      const gid = session?.garminId ?? session?.id;
      if (session?.garminId != null || session?.source === 'garmin') {
        next = buildAggregateWithGarminDateOverride(next, { garminId: gid, logicalDate: draftDate });
      }
      next = buildAggregateWithSessionLogicalDate(next, {
        sessionId: session?.id ?? gid,
        activityType,
        logicalDate: draftDate
      });
      await updateData(next);
    } catch (e) {
      setError(tr('calendar.heatmap.recapDetail.reassignError', 'Impossible de réaffecter la séance'));
    } finally {
      setSaving(false);
    }
  }, [draftDate, session, activityType, workoutData, updateData, tr]);

  const onReset = useCallback(async () => {
    if (typeof updateData !== 'function') return;
    setSaving(true);
    try {
      let next = workoutData;
      const gid = session?.garminId ?? session?.id;
      if (gid != null) {
        next = buildAggregateWithoutGarminDateOverride(next, gid);
      }
      next = buildAggregateClearSessionLogicalDate(next, {
        sessionId: session?.id ?? gid,
        activityType
      });
      await updateData(next);
      setDraftDate(dates.recordedDate || '');
    } finally {
      setSaving(false);
    }
  }, [session, activityType, workoutData, updateData, dates.recordedDate]);

  if (!session) return null;

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
      <p className="text-xs font-medium text-amber-200/90">
        {tr('calendar.heatmap.recapDetail.calendarDate', 'Jour compté dans le calendrier')}
      </p>
      {dates.isReassigned ? (
        <p className="text-[11px] text-slate-400">
          {tr('calendar.heatmap.recapDetail.recordedVsLogical', {
            recorded: dates.recordedDate,
            logical: dates.logicalDate,
            defaultValue: `Enregistré ${dates.recordedDate} · Compté ${dates.logicalDate}`
          })}
        </p>
      ) : (
        <p className="text-[11px] text-slate-500">
          {tr('calendar.heatmap.recapDetail.recordedDate', {
            date: dates.recordedDate,
            defaultValue: `Enregistré le ${dates.recordedDate}`
          })}
        </p>
      )}
      <input
        type="date"
        value={draftDate}
        onChange={(e) => setDraftDate(e.target.value)}
        className="rounded-md border border-slate-700 bg-black px-2 py-1.5 text-sm text-white"
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !draftDate}
          onClick={onSave}
          className="rounded-md bg-amber-700/80 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {tr('calendar.heatmap.recapDetail.reassignSave', 'Associer à ce jour')}
        </button>
        {dates.isReassigned ? (
          <button
            type="button"
            disabled={saving}
            onClick={onReset}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-300"
          >
            {tr('calendar.heatmap.recapDetail.reassignReset', 'Réinitialiser')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
