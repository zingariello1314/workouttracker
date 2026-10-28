import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useTranslation } from '../../../../utils/translations';
import {
  formatWeekNavLabel,
  jumpToSameWeekdayInWeek,
  shiftIsoWeek,
  startOfIsoWeek,
} from '../../../../utils/sport/todayWeekNav';

/**
 * Barre S40 · 5 oct. – 11 oct. — pleine largeur dans le bento (pas une colonne écrasée).
 */
export default function TodayWeekNavBar({ onBeforeNavigate } = {}) {
  const { currentDate, changeSessionCalendarDate, activeProgram, programs } = useWorkout();
  const t = useTranslation();

  const realToday = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);

  const meta = useMemo(() => formatWeekNavLabel(currentDate), [currentDate]);

  const programHint = useMemo(() => {
    const list = Array.isArray(programs) ? programs : [];
    if (activeProgram?.name) {
      return meta.isCurrentWeek
        ? activeProgram.name
        : t('today.weekNav.programAtWeek', '{{name}} (vue historique)', {
            name: activeProgram.name,
          });
    }
    const named = list.find((p) => p?.status === 'active' && p?.name);
    return named?.name || null;
  }, [activeProgram, programs, meta.isCurrentWeek, t]);

  const canGoNext = !meta.isCurrentWeek;

  const goWeek = (delta) => {
    if (typeof onBeforeNavigate === 'function' && !onBeforeNavigate()) return;
    const targetMonday = shiftIsoWeek(currentDate, delta);
    if (delta > 0) {
      const thisMonday = startOfIsoWeek(realToday);
      if (targetMonday > thisMonday) return;
    }
    const next = jumpToSameWeekdayInWeek(currentDate, targetMonday, realToday);
    changeSessionCalendarDate(next);
  };

  const goCurrentWeek = () => {
    if (typeof onBeforeNavigate === 'function' && !onBeforeNavigate()) return;
    changeSessionCalendarDate(new Date(realToday));
  };

  return (
    <div
      className="today-b-week flex min-w-0 items-center gap-3 rounded-xl border-2 border-[#0F4C5C]/45 bg-black/80 px-4 py-3"
      role="navigation"
      aria-label={t('today.weekNav.aria', 'Navigation hebdomadaire')}
    >
      <button
        type="button"
        onClick={() => goWeek(-1)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#0F4C5C]/50 bg-black text-teal-100 transition-colors hover:border-[#0F5C45]/55 hover:bg-[#0F5C45]/15"
        aria-label={t('today.weekNav.prev', 'Semaine précédente')}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="truncate text-sm font-semibold tracking-wide text-white sm:whitespace-nowrap sm:text-base">
          {meta.label}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 sm:justify-start">
          {programHint ? (
            <span className="max-w-full truncate text-[11px] text-teal-200/80">{programHint}</span>
          ) : null}
          {!meta.isCurrentWeek ? (
            <button
              type="button"
              onClick={goCurrentWeek}
              className="shrink-0 text-[11px] font-medium text-emerald-300/90 underline-offset-2 hover:underline"
            >
              {t('today.weekNav.backToCurrent', 'Semaine actuelle')}
            </button>
          ) : (
            <span className="shrink-0 text-[11px] text-emerald-400/85">
              {t('today.weekNav.current', 'Semaine en cours')}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => goWeek(1)}
        disabled={!canGoNext}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#0F4C5C]/50 bg-black text-teal-100 transition-colors hover:border-[#0F5C45]/55 hover:bg-[#0F5C45]/15 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-black"
        aria-label={t('today.weekNav.next', 'Semaine suivante')}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
