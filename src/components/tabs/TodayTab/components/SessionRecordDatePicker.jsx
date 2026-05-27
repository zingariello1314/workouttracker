import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { isSameDay } from '../../../../utils/dateUtils';
import { useTranslation } from '../../../../utils/translations';

/**
 * Navigation jour par jour pour l'enregistrement (reps, coches) — sans calendrier.
 * Ne modifie pas workoutDayOverride : on peut afficher le programme d'un autre jour
 * tout en enregistrant sur la date calendaire sélectionnée.
 */
export default function SessionRecordDatePicker() {
  const { currentDate, changeSessionCalendarDate } = useWorkout();
  const t = useTranslation();

  const realToday = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);

  const isViewingToday = isSameDay(currentDate, realToday);

  const dateLabel = isViewingToday
    ? t('today.workout.today', "Aujourd'hui")
    : currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const shiftDay = (delta) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    next.setHours(12, 0, 0, 0);
    if (next > realToday) return;
    changeSessionCalendarDate(next);
  };

  const goToToday = () => {
    changeSessionCalendarDate(new Date(realToday));
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-[#0F4C5C]/45 bg-black/80 px-4 py-3">
      <Calendar className="h-4 w-4 shrink-0 text-teal-400" />
      <button
        type="button"
        onClick={() => shiftDay(-1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0F4C5C]/50 bg-black text-teal-100 transition-colors hover:border-[#0F5C45]/55 hover:bg-[#0F5C45]/15"
        aria-label={t('today.recordDate.prevDay', 'Jour précédent')}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-medium text-white">{dateLabel}</p>
        {!isViewingToday && (
          <button
            type="button"
            onClick={goToToday}
            className="mt-1 text-xs font-medium text-emerald-300/90 underline-offset-2 hover:underline"
          >
            {t('today.recordDate.backToToday', "Revenir à aujourd'hui")}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => shiftDay(1)}
        disabled={isViewingToday}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0F4C5C]/50 bg-black text-teal-100 transition-colors hover:border-[#0F5C45]/55 hover:bg-[#0F5C45]/15 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-black"
        aria-label={t('today.recordDate.nextDay', 'Jour suivant')}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
