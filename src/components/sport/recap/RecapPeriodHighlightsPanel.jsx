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

function StatTile({ value, label, color }) {
  return (
    <div className="kk" style={{ '--c': color }}>
      <i>{label}</i>
      <b>{value}</b>
    </div>
  );
}

function DayDetail({ day, onClose }) {
  return (
    <article className="dy-open">
      <header>
        <div>
          <i>{day.now ? `${day.label} · aujourd'hui` : day.label}</i>
          <b>{formatYmdFr(day.ymd)}</b>
        </div>
        <strong>{day.reps > 0 ? `${day.reps.toLocaleString('fr-FR')} reps` : 'Aucune séance'}</strong>
        <button type="button" onClick={onClose}>
          Fermer
        </button>
      </header>
      {day.items?.length ? (
        <ul>
          {day.items.map((item) => (
            <li key={item.id}>
              <span>{item.name || 'Mouvement'}</span>
              <b>{item.reps.toLocaleString('fr-FR')}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p>Rien de coché ce jour.</p>
      )}
    </article>
  );
}

function SubHeading({ children }) {
  return (
    <h3 className="rb-subh">{children}</h3>
  );
}

const HEADER_METRIC_KEYS = ['totalReps', 'trainingDays', 'totalMinutes', 'totalKg', 'activeKcal'];

function weekDensity(count) {
  if (count <= 8) return 'd1';
  if (count <= 16) return 'd2';
  if (count <= 45) return 'd3';
  return 'd4';
}

export default function RecapPeriodHighlightsPanel({
  period,
  periodWindow,
  garminData = null,
  recapState = null,
  part = 'head',
  analytics: analyticsProp = null
}) {
  const t = useTranslation();
  const { getCurrentData, data, getExerciseNameById } = useWorkout();
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState(null);

  const analytics = useMemo(() => {
    if (analyticsProp) return analyticsProp;
    if (part === 'head' && !open) return null;
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
  }, [
    analyticsProp,
    open,
    part,
    data,
    getCurrentData,
    garminData,
    period,
    periodWindow,
    recapState,
    getExerciseNameById
  ]);

  const periodStats = analytics?.periodStats;
  const bestMonthsByMetric = analytics?.bestMonthsByMetric;
  const topExercises = analytics?.topExercises || [];
  const streakRange = analytics?.streakRange;
  const topMuscleGroups = analytics?.topMuscleGroups || [];
  const running = analytics?.running;
  const weekStrip = analytics?.weekStrip || [];

  const periodLabel = t(`recap.period.${period}`, period);
  const windowStart = analytics?.window?.start || periodWindow?.start;
  const windowEnd = analytics?.window?.end || periodWindow?.end;
  const tailMetricKeys = RECAP_CALENDAR_SPORT_METRIC_KEYS.filter(
    (metric) => !HEADER_METRIC_KEYS.includes(metric)
  );

  if (part === 'tail') {
    if (!periodStats) return null;
    return (
      <section id="stats-periode" className="rec-more">
        <div className="sh">
          <h2>{t('recap.analyse.periodStats', 'Statistiques de la période')}</h2>
        </div>
        <div className="kr">
          {tailMetricKeys.map((metric, index) => (
            <StatTile
              key={metric}
              color={['var(--a5)', 'var(--a2)', 'var(--a3)', 'var(--a1)'][index % 4]}
              value={formatRecapCalendarMetricValue(metric, periodStats[metric])}
              label={t(METRIC_LABEL_KEYS[metric])}
            />
          ))}
        </div>
        <div className="rb-block">
          <SubHeading>{t('recap.analyse.bestMonths', 'Meilleurs mois (sur la période)')}</SubHeading>
          <ul className="rb-rows">
            {RECAP_CALENDAR_SPORT_METRIC_KEYS.map((metric) => {
              const best = bestMonthsByMetric[metric];
              if (!best) return null;
              return (
                <li key={metric}>
                  <span>{t(METRIC_LABEL_KEYS[metric])}</span>
                  <b>
                    {formatRecapCalendarMetricValue(metric, best.value)}
                    <span> · {best.monthLabel}</span>
                  </b>
                </li>
              );
            })}
          </ul>
        </div>
        {topExercises.length > 0 ? (
          <div className="rb-block">
            <SubHeading>{t('recap.analyse.topExercises', 'Exercices les plus travaillés (reps)')}</SubHeading>
            <ol className="rb-rows">
              {topExercises.map((ex, i) => (
                <li key={String(ex.id)}>
                  <span>
                    {i + 1}. {ex.name || t('recap.analyse.unnamedExercise', 'Mouvement non identifié')}
                  </span>
                  <b>{ex.reps.toLocaleString('fr-FR')} reps</b>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {streakRange?.length > 0 ? (
          <div className="rb-note">
            <b>
              {t('recap.analyse.bestStreak', 'Meilleure série')} : {streakRange.length} j.
            </b>
            {streakRange.startDate && streakRange.endDate ? (
              <span>
                {' '}
                · {formatYmdFr(streakRange.startDate)} → {formatYmdFr(streakRange.endDate)}
              </span>
            ) : null}
          </div>
        ) : null}
        {topMuscleGroups.length > 0 ? (
          <div>
            <SubHeading>{t('recap.analyse.topMuscles', 'Zones les plus sollicitées')}</SubHeading>
            <ul className="rb-pills">
              {topMuscleGroups.map(({ group, repShare, displayScore }) => (
                <li key={group}>
                  {t(`recap.muscleGroup.${group}`, group)}
                  {repShare > 0 ? <span>~{repShare} reps</span> : displayScore > 0 ? <span>{Math.round(displayScore)}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {running?.hasData ? (
          <div className="rb-block">
            <SubHeading>{t('recap.analyse.cardioBlock', 'Course & cardio')}</SubHeading>
            {running.bestSessions?.length > 0 ? (
              <div>
                <p className="rb-kicker2">{t('recap.analyse.bestRuns', 'Meilleures sorties (distance)')}</p>
                <ul className="rb-rows">
                  {running.bestSessions.map((s) => (
                    <li key={`${s.date}-${s.km}`}>
                      <span>
                        {s.km} km · {formatYmdFr(s.date)}
                      </span>
                      {s.pace ? <b>{s.pace}</b> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section id="recap" className={`rec ${open ? 'is-open' : ''}`}>
      <header>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rec-sum"
        >
          <span className="min-w-0 flex-1">
            <small>
              <Sparkles size={14} aria-hidden />
              {t('recap.nav.analyse', 'Analyse')}
            </small>
            <h2>{t('recap.analyse.periodHighlights.title', 'Récap sur la période')}</h2>
            <div className="dt">
              {periodLabel}
              {windowStart && windowEnd
                ? ` · ${formatYmdFr(windowStart)} → ${formatYmdFr(windowEnd)}`
                : null}
            </div>
          </span>
          <span className="chev" aria-hidden>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>
      </header>

      {open && periodStats ? (
      <>
      <div className="rec-body">
        {weekStrip.length > 0 ? (
          <>
            <div className={`wk ${weekDensity(weekStrip.length)}`}>
              {weekStrip.map((day) => (
                <button
                  key={day.ymd}
                  type="button"
                  className={`dy${day.on ? ' on' : ''}${day.now ? ' now' : ''}${picked === day.ymd ? ' pick' : ''}`}
                  aria-pressed={picked === day.ymd}
                  onClick={() => setPicked((current) => (current === day.ymd ? null : day.ymd))}
                >
                  <i>{day.label}</i>
                  <b>{day.day}</b>
                  <span>{day.reps > 0 ? day.reps.toLocaleString('fr-FR') : '—'}</span>
                </button>
              ))}
            </div>
            {weekStrip.some((day) => day.ymd === picked) ? (
              <DayDetail
                day={weekStrip.find((day) => day.ymd === picked)}
                onClose={() => setPicked(null)}
              />
            ) : null}
          </>
        ) : null}
        <div className="kr">
          {HEADER_METRIC_KEYS.map((metric, index) => (
            <StatTile
              key={metric}
              color={['var(--d)', 'var(--a1)', 'var(--a2)', 'var(--a3)', 'var(--a4)', 'var(--a5)'][index % 6]}
              value={formatRecapCalendarMetricValue(metric, periodStats[metric])}
              label={t(METRIC_LABEL_KEYS[metric])}
            />
          ))}
        </div>
      </div>
      </>
      ) : open ? (
        <p className="emp">
          {t('recap.analyse.periodHighlights.empty', 'Pas assez de données sur cette période.')}
        </p>
      ) : null}
    </section>
  );
}
