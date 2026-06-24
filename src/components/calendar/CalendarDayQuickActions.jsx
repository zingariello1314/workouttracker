import React, { useMemo, useState } from 'react';
import { Activity, Footprints, Save } from 'lucide-react';
import Button from '../ui/Button';
import CalendarManualWalkEditor from './CalendarManualWalkEditor';
import CalendarSessionDateReassign from './CalendarSessionDateReassign';
import { collectEnduranceSessionsForCalendarDay } from '../../utils/calendarUtils';
import { mergedDailySteps, normalizeManualDailyWalkByDate } from '../../utils/sport/manualDailyWalkUtils';

/**
 * Actions rapides sous le détail jour : séance, pas manuels, réaffectation Garmin.
 */
export default function CalendarDayQuickActions({
  dateStr,
  selectedDate,
  intensity,
  workoutData,
  garminData,
  updateData,
  t,
  onOpenWorkoutEntry
}) {
  const tr = t || ((k, d) => d);
  const [showWalkEditor, setShowWalkEditor] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const manualEntry = normalizeManualDailyWalkByDate(
    workoutData?.enduranceData?.manualDailyWalkByDate
  )[dateStr];
  const garminSteps =
    garminData?.dailyMetrics?.[dateStr]?.steps != null &&
    Number.isFinite(Number(garminData.dailyMetrics[dateStr].steps))
      ? Math.round(Number(garminData.dailyMetrics[dateStr].steps))
      : 0;
  const mergedSteps = mergedDailySteps(garminSteps, manualEntry);

  const reassignableSessions = useMemo(() => {
    const { rows } = collectEnduranceSessionsForCalendarDay(workoutData, dateStr);
    return rows.filter(
      ({ activityType, session }) =>
        activityType === 'running' &&
        session &&
        (session.garminId != null || session.source === 'garmin')
    );
  }, [workoutData, dateStr]);

  const completedCount = intensity?.completedCount ?? 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h4 className="mb-1 flex items-center gap-2 font-medium text-emerald-300">
              <Activity className="h-5 w-5" />
              {completedCount === 0
                ? tr('calendar.heatmap.dayDetails.garminActivityDetected', 'Activité détectée')
                : tr('calendar.heatmap.dayDetails.modifyWorkout', 'Modifier ma séance')}
            </h4>
            <p className="text-sm text-slate-300">
              {completedCount === 0
                ? tr(
                    'calendar.heatmap.dayDetails.noExercisesButActivity',
                    "Aucun exercice saisi pour ce jour. Vous pouvez enregistrer ou compléter votre séance."
                  )
                : tr(
                    'calendar.heatmap.dayDetails.modifyWorkoutMessage',
                    'Vous pouvez modifier ou compléter votre séance enregistrée.'
                  )}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onOpenWorkoutEntry}
            icon={Save}
            className="shrink-0"
          >
            {completedCount === 0
              ? tr('calendar.heatmap.dayDetails.enterWorkout', 'Saisir ma séance')
              : tr('calendar.heatmap.dayDetails.modifyWorkout', 'Modifier ma séance')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-sky-500/35 bg-sky-950/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-sky-200">
            <Footprints className="h-4 w-4" />
            {tr('calendar.heatmap.recapDetail.editSteps', 'Compléter les pas')}
          </h4>
          {mergedSteps > 0 ? (
            <span className="text-xs tabular-nums text-sky-300/90">
              {mergedSteps.toLocaleString('fr-FR')} {tr('calendar.heatmap.tooltip.stepsShort', 'pas')}
            </span>
          ) : null}
        </div>
        {typeof updateData === 'function' ? (
          showWalkEditor ? (
            <CalendarManualWalkEditor
              dateStr={dateStr}
              garminSteps={garminSteps}
              currentData={workoutData}
              updateData={updateData}
              onClose={() => setShowWalkEditor(false)}
              t={tr}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowWalkEditor(true)}
              className="mt-2 text-xs text-sky-400 underline hover:text-sky-200"
            >
              {manualEntry?.steps
                ? tr('calendar.heatmap.recapDetail.editStepsExisting', 'Modifier les pas manuels')
                : tr('calendar.heatmap.recapDetail.editSteps', 'Compléter les pas')}
            </button>
          )
        ) : null}
      </div>

      {reassignableSessions.length > 0 && typeof updateData === 'function' ? (
        <div className="rounded-lg border border-amber-500/35 bg-amber-950/20 p-4">
          <button
            type="button"
            onClick={() => setShowReassign((v) => !v)}
            className="text-sm font-medium text-amber-200/95 underline hover:text-amber-100"
          >
            {tr(
              'calendar.heatmap.recapDetail.reassignGarminDate',
              "Modifier la date d'enregistrement Garmin"
            )}
            {reassignableSessions.length > 1 ? ` (${reassignableSessions.length})` : ''}
          </button>
          {showReassign ? (
            <div className="mt-3 space-y-3">
              {reassignableSessions.map(({ session }) => (
                <div key={String(session.id ?? session.garminId)}>
                  <p className="mb-1 text-xs text-slate-400">
                    {session.notes || session.type || 'Course'}{' '}
                    {session.distance ? `· ${session.distance} km` : ''}
                  </p>
                  <CalendarSessionDateReassign
                    session={session}
                    activityType="running"
                    workoutData={workoutData}
                    updateData={updateData}
                    t={tr}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
