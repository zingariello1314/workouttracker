import React, { useMemo } from 'react';
import { buildCalendarGtgDayView } from '../../utils/calendarGtgDay';

/**
 * Module GTG du détail jour — à part de la liste « exercices réalisés ».
 */
export default function CalendarGtgDayModule({ workoutData, dateStr, profileQuestionnaire = null, t }) {
  const view = useMemo(
    () =>
      buildCalendarGtgDayView(workoutData, dateStr, {
        profileQuestionnaire,
        t
      }),
    [workoutData, dateStr, profileQuestionnaire, t]
  );

  if (!view) return null;

  const progress = Math.min(100, Math.max(0, view.progressPct || 0));

  return (
    <div className="rounded-xl border border-orange-500/45 bg-orange-950/20 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-medium text-orange-200">
          {t('calendar.heatmap.dayDetails.gtgTitle', 'Grease the Groove')}
        </h4>
        <span className="text-xs text-orange-100/80">
          {t('calendar.heatmap.dayDetails.gtgSummary', {
            doneSets: view.donePlannedMiniSets ?? view.doneMiniSets,
            plannedSets: view.plannedMiniSets,
            doneReps: view.doneReps,
            plannedReps: view.plannedReps,
            defaultValue: '{{doneSets}}/{{plannedSets}} mini-séries · {{doneReps}}/{{plannedReps}} reps'
          })}
          {view.adHocDoneMiniSets > 0
            ? ` · +${view.adHocDoneMiniSets} hors planning (${view.adHocDoneReps} reps)`
            : ''}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/50">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-2">
        {view.exercisePlans.map((ep) => (
          <div key={ep.exerciseId} className="rounded-lg bg-black/35 p-2">
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-orange-50">{ep.label}</span>
              <span className="text-xs text-orange-200/90">
                {t('calendar.heatmap.dayDetails.gtgExerciseLine', {
                  doneReps: ep.doneReps,
                  plannedReps: ep.plannedReps,
                  doneSets: ep.completedCount,
                  plannedSets: ep.totalCount,
                  defaultValue: '{{doneReps}}/{{plannedReps}} reps · {{doneSets}}/{{plannedSets}} créneaux'
                })}
              </span>
            </div>
            <ul className="space-y-1">
              {ep.slots.map((slot, slotIndex) => (
                <li
                  key={`${ep.exerciseId}-${slotIndex}`}
                  className={`flex items-center justify-between gap-2 text-xs ${
                    slot.done ? 'text-orange-100' : 'text-slate-500'
                  }`}
                >
                  <span className="font-mono">
                    {slot.time}
                    {slot.adHoc ? ' · hors planning' : ''}
                  </span>
                  <span>
                    {slot.reps} {t('calendar.heatmap.dayDetails.reps', 'reps')}
                    {' · '}
                    {slot.done
                      ? t('calendar.heatmap.dayDetails.gtgSlotDone', 'fait')
                      : t('calendar.heatmap.dayDetails.gtgSlotPlanned', 'prévu')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
