import React, { useMemo, useState } from 'react';
import { Activity, Footprints, Save } from 'lucide-react';
import Button from '../ui/Button';
import CalendarManualWalkEditor from './CalendarManualWalkEditor';
import CalendarSessionDateReassign from './CalendarSessionDateReassign';
import { collectEnduranceSessionsForCalendarDay } from '../../utils/calendarUtils';
import {
  formatStepsProvenance,
  normalizeManualDailyWalkByDate,
  resolveDailySteps
} from '../../utils/sport/manualDailyWalkUtils';

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
  onOpenWorkoutEntry,
  onJustifyAbsence = null
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
  const resolvedSteps = resolveDailySteps(garminSteps, manualEntry);
  const stepsProvenance = formatStepsProvenance(resolvedSteps, tr);

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
  const showJustify = typeof onJustifyAbsence === 'function';

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h4 className="mb-1 flex items-center gap-2 font-medium text-emerald-300">
              <Activity className="h-5 w-5" />
              {completedCount === 0
                ? tr(
                    'calendar.heatmap.dayDetails.noWorkoutLogged',
                    'Aucune séance enregistrée'
                  )
                : tr('calendar.heatmap.dayDetails.modifyWorkout', 'Modifier ma séance')}
            </h4>
            <p className="text-sm text-slate-300">
              {completedCount === 0
                ? tr(
                    'calendar.heatmap.dayDetails.noWorkoutLoggedHint',
                    'Tu peux saisir ta séance ou justifier une absence pour ce jour.'
                  )
                : tr(
                    'calendar.heatmap.dayDetails.modifyWorkoutMessage',
                    'Vous pouvez modifier ou compléter votre séance enregistrée.'
                  )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button
              variant="primary"
              size="md"
              onClick={onOpenWorkoutEntry}
              icon={Save}
              className="w-full sm:w-auto"
            >
              {completedCount === 0
                ? tr('calendar.heatmap.dayDetails.enterWorkout', 'Saisir ma séance')
                : tr('calendar.heatmap.dayDetails.modifyWorkout', 'Modifier ma séance')}
            </Button>
            {showJustify ? (
              <Button
                variant="secondary"
                size="md"
                onClick={onJustifyAbsence}
                className="w-full border-red-500/40 bg-red-950/30 text-red-100 hover:bg-red-900/40 sm:w-auto"
              >
                {tr('calendar.workoutChoice.justify', "Justifier l'absence")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
