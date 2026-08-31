import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { useWorkout } from '../../../context/WorkoutContext';
import {
  buildRecapPeriodCalendarAnalytics,
  formatRecapCalendarMetricValue,
  RECAP_CALENDAR_SPORT_METRIC_KEYS
} from '../../../utils/sport/recapCalendarPeriodAnalytics';
import { formatDate } from '../../../utils/dateUtils';

const METRIC_LABEL_KEYS = {
  totalReps: 'calendar.stats.monthReps',
  runningKm: 'calendar.stats.monthRunningKm',
  runningMinutes: 'calendar.stats.monthRunningTime',
  otherExerciseMinutes: 'calendar.stats.monthOtherExerciseTime',
  totalMinutes: 'calendar.stats.monthTotalTime',
  totalKg: 'calendar.stats.monthKgLifted',
  longestStreak: 'calendar.stats.monthLongestStreak',
  activeKcal: 'calendar.stats.monthActiveKcal',
  trainingDays: 'calendar.stats.monthTrainingDays'
};

function formatYmdFr(ymd) {
  if (!ymd) return '—';
  try {
    return formatDate(new Date(`${ymd}T12:00:00`));
  } catch {
    return ymd;
  }
}

function StatTile({ value, label }) {
  return (
    <div className="relative rounded-xl border border-violet-400/35 bg-violet-950/45 px-2 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:py-3">
      <div className="text-base font-bold tabular-nums text-white sm:text-lg">{value}</div>
      <div className="mt-0.5 text-[10px] font-medium leading-tight text-violet-200/75">{label}</div>
    </div>
  );
}

function SubHeading({ children }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-violet-200/95">
      <span className="h-1 w-1 rounded-full bg-violet-400" aria-hidden />
      {children}
    </h3>
  );
}

export default function RecapPeriodHighlightsPanel({
  period,
  periodWindow,
  garminData = null,
  recapState = null
}) {
  const t = useTranslation();
  const { getCurrentData, data, getExerciseNameById } = useWorkout();
  const [open, setOpen] = useState(false);

  const analytics = useMemo(() => {
    if (!open) return null;
    const snap = getCurrentData();
    if (!periodWindow?.start || !periodWindow?.end) return null;
    return buildRecapPeriodCalendarAnalytics({
      workoutData: snap,
      garminData,
      periodWindow,
      period,
      getExerciseNameById,
      recapState
    });
  }, [open, data, getCurrentData, garminData, period, periodWindow, recapState, getExerciseNameById]);

  const periodStats = analytics?.periodStats;
  const bestMonthsByMetric = analytics?.bestMonthsByMetric;
  const topExercises = analytics?.topExercises || [];
  const streakRange = analytics?.streakRange;
  const topMuscleGroups = analytics?.topMuscleGroups || [];
  const running = analytics?.running;

  const periodLabel = t(`recap.period.${period}`, period);
  const windowStart = analytics?.window?.start || periodWindow?.start;
  const windowEnd = analytics?.window?.end || periodWindow?.end;

  return (
    <section
      className={`relative mb-2 overflow-hidden rounded-2xl border border-violet-500/55 bg-gradient-to-br from-violet-950/90 via-[#120a1c] to-black shadow-[0_24px_64px_rgba(124,58,237,0.22),inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-violet-400/25 ${
        open ? 'px-4 py-5 sm:px-6 sm:py-6' : 'px-4 py-3 sm:px-5 sm:py-3.5'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl"
        aria-hidden
      />

      <header className={`relative ${open ? 'mb-5 border-b border-violet-500/25 pb-4' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start gap-3 rounded-xl text-left transition-colors hover:bg-violet-500/10"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/20 text-violet-100">
            <Sparkles size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-violet-100 sm:text-base">
              {t('recap.analyse.periodHighlights.title', 'Récap sur la période')}
            </h2>
            <p className="mt-1 text-[11px] leading-snug text-violet-200/70">
              {periodLabel}
              {windowStart && windowEnd
                ? ` · ${formatYmdFr(windowStart)} → ${formatYmdFr(windowEnd)}`
                : null}
            </p>
          </div>
          {open ? (
            <ChevronUp className="mt-1.5 h-5 w-5 shrink-0 text-violet-200/80" aria-hidden />
          ) : (
            <ChevronDown className="mt-1.5 h-5 w-5 shrink-0 text-violet-200/80" aria-hidden />
          )}
        </button>
      </header>

      {open && periodStats ? (
      <div className="relative space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {RECAP_CALENDAR_SPORT_METRIC_KEYS.map((metric) => (
            <StatTile
              key={metric}
              value={formatRecapCalendarMetricValue(metric, periodStats[metric])}
              label={t(METRIC_LABEL_KEYS[metric])}
            />
          ))}
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-black/35 px-3 py-3 sm:px-4">
          <SubHeading>{t('recap.analyse.bestMonths', 'Meilleurs mois (sur la période)')}</SubHeading>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RECAP_CALENDAR_SPORT_METRIC_KEYS.map((metric) => {
              const best = bestMonthsByMetric[metric];
              if (!best) return null;
              return (
                <li
                  key={metric}
                  className="rounded-lg border border-violet-500/20 bg-violet-950/30 px-3 py-2 text-[11px]"
                >
                  <span className="text-violet-300/60">{t(METRIC_LABEL_KEYS[metric])}</span>
                  <span className="mt-0.5 block font-semibold text-white">
                    {formatRecapCalendarMetricValue(metric, best.value)}
                    <span className="font-normal text-violet-200/65"> · {best.monthLabel}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {topExercises.length > 0 ? (
          <div className="rounded-xl border border-violet-500/20 bg-black/35 px-3 py-3 sm:px-4">
            <SubHeading>
              {t('recap.analyse.topExercises', 'Exercices les plus travaillés (reps)')}
            </SubHeading>
            <ol className="space-y-2 text-[11px] text-slate-100">
              {topExercises.map((ex, i) => (
                <li
                  key={String(ex.id)}
                  className="flex justify-between gap-3 rounded-lg bg-violet-950/25 px-2.5 py-1.5"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold text-violet-200/90">{i + 1}.</span>{' '}
                    {ex.name || t('recap.analyse.unnamedExercise', 'Mouvement non identifié')}
                  </span>
                  <span className="shrink-0 tabular-nums font-bold text-violet-100">
                    {ex.reps.toLocaleString('fr-FR')} reps
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {streakRange?.length > 0 ? (
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-950/25 px-3 py-2.5 text-[11px] text-emerald-50/95">
            <span className="font-semibold">
              {t('recap.analyse.bestStreak', 'Meilleure série')} : {streakRange.length} j.
            </span>
            {streakRange.startDate && streakRange.endDate ? (
              <span className="text-emerald-200/80">
                {' '}
                · {formatYmdFr(streakRange.startDate)} → {formatYmdFr(streakRange.endDate)}
              </span>
            ) : null}
          </div>
        ) : null}

        {topMuscleGroups.length > 0 ? (
          <div>
            <SubHeading>{t('recap.analyse.topMuscles', 'Zones les plus sollicitées')}</SubHeading>
            <ul className="flex flex-wrap gap-2">
              {topMuscleGroups.map(({ group, repShare, displayScore }) => (
                <li
                  key={group}
                  className="rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1 text-[10px] font-medium text-violet-50"
                >
                  {t(`recap.muscleGroup.${group}`, group)}
                  {repShare > 0 ? (
                    <span className="ml-1 tabular-nums text-violet-200/90">~{repShare} reps</span>
                  ) : displayScore > 0 ? (
                    <span className="ml-1 tabular-nums text-violet-200/90">
                      {Math.round(displayScore)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {running?.hasData ? (
          <div className="space-y-3 border-t border-violet-500/20 pt-4">
            <SubHeading>{t('recap.analyse.cardioBlock', 'Course & cardio')}</SubHeading>

            {running.bestSessions?.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[10px] text-violet-300/50">
                  {t('recap.analyse.bestRuns', 'Meilleures sorties (distance)')}
                </p>
                <ul className="space-y-1 text-[11px]">
                  {running.bestSessions.map((s) => (
                    <li key={`${s.date}-${s.km}`} className="flex justify-between gap-2 text-slate-200">
                      <span>
                        {s.km} km · {formatYmdFr(s.date)}
                      </span>
                      {s.pace ? <span className="text-violet-300/50">{s.pace}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {running.kindDistribution?.pctKm?.endurance != null &&
            (running.kindDistribution.kmByKind?.endurance ?? 0) +
              (running.kindDistribution.kmByKind?.speed ?? 0) +
              (running.kindDistribution.kmByKind?.interval ?? 0) >
              0 ? (
              <div>
                <p className="mb-1.5 text-[10px] text-violet-300/50">
                  {t('recap.analyse.runMix', 'Répartition des km par type')}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  {[
                    ['endurance', t('recap.analyse.runEndurance', 'Endurance')],
                    ['speed', t('recap.analyse.runSpeed', 'Vitesse')],
                    ['interval', t('recap.analyse.runInterval', 'Fractionné')]
                  ].map(([key, label]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-sky-700/40 bg-sky-950/30 px-2 py-1.5"
                    >
                      <div className="font-bold tabular-nums text-white">
                        {running.kindDistribution.pctKm[key]} %
                      </div>
                      <div className="text-sky-300/70">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {running.highlights?.bestDay?.km > 0 ? (
              <p className="text-[11px] text-violet-200/55">
                {t('recap.analyse.bestRunDay', 'Record jour')} : {running.highlights.bestDay.km} km ·{' '}
                {formatYmdFr(running.highlights.bestDay.date)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      ) : open ? (
        <p className="relative mt-1 text-[11px] text-violet-200/65">
          {t('recap.analyse.periodHighlights.empty', 'Pas assez de données sur cette période.')}
        </p>
      ) : null}
    </section>
  );
}
