import React, { useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { peekGarminAllDataCache, subscribeGarminAllDataCache } from '../../../hooks/garminDataLoad';
import { getDateStr, getDayName } from '../../../utils/dateUtils';
import { dayCountsAsCalendarTrainingDay } from '../../../utils/sport/recapTrainingDayTruth';
import { countRunSessionsForDate } from '../../../utils/calendarPhysicalSessionStripes';
import { computeCalendarMonthSportStats } from '../../../utils/calendarMonthSportStats';
import { getEffectiveRestDayForDate } from '../../../utils/restDayUtils';
import { HOME_METRIC_DEFS } from '../../../utils/homeAppearancePreference';
import HomeWidgetShell from '../HomeWidgetShell';

const SESSION = '#9d1b24';
const REST = '#69c97a';
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function monthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  /** Lundi = 0 … Dimanche = 6 */
  const startPad = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(new Date(year, monthIndex, day, 12, 0, 0, 0));
  }
  return cells;
}

function dayKind(date, workoutData, garminData, program) {
  const dateStr = getDateStr(date);
  const today = getDateStr(new Date());
  if (dateStr > today) return 'future';
  const runs = countRunSessionsForDate(workoutData, garminData, dateStr);
  if (runs > 0) return 'run';
  if (dayCountsAsCalendarTrainingDay(workoutData, dateStr, garminData)) return 'session';
  if (program) {
    const dayName = getDayName(date);
    const rest = getEffectiveRestDayForDate({ program, data: workoutData, date });
    if (rest && dayName === rest) return 'rest';
  }
  return 'empty';
}

function cellStyle(kind, accent, isToday) {
  const base = {
    boxShadow: isToday ? `inset 0 0 0 1.5px ${accent}` : undefined
  };
  if (kind === 'session') return { ...base, background: SESSION };
  if (kind === 'rest') return { ...base, background: REST };
  if (kind === 'run') {
    return {
      ...base,
      backgroundImage:
        'repeating-linear-gradient(-45deg, #1d4ed8 0 3px, #2563eb 3px 6px)'
    };
  }
  if (kind === 'future') return { ...base, background: 'transparent' };
  return { ...base, background: 'rgba(255,255,255,0.06)' };
}

function formatMetric(id, stats, highlights) {
  switch (id) {
    case 'reps':
      return { label: 'Reps', value: (stats.totalReps || 0).toLocaleString('fr-FR') };
    case 'kg':
      return { label: 'Kg', value: (stats.totalKg || 0).toLocaleString('fr-FR') };
    case 'days':
      return { label: 'Jours', value: String(stats.trainingDays || 0) };
    case 'steps':
      return { label: 'Pas', value: (stats.totalSteps || 0).toLocaleString('fr-FR') };
    case 'km':
      return { label: 'Km', value: String(stats.runningKm || 0) };
    case 'sleep': {
      const h = highlights?.avgSleepHours;
      return {
        label: 'Sommeil',
        value: h != null && h > 0 ? `${Number(h).toFixed(1).replace('.', ',')} h` : '—'
      };
    }
    default:
      return null;
  }
}

export default function HomeMonthWidget({ variant = 'calendar', accent, metrics }) {
  const { getCurrentData, activeProgram } = useWorkout();
  const workoutData = getCurrentData();
  const [garminData, setGarminData] = useState(() => peekGarminAllDataCache());

  useEffect(() => subscribeGarminAllDataCache(setGarminData), []);

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const todayStr = getDateStr(now);

  const cells = useMemo(() => monthGrid(year, monthIndex), [year, monthIndex]);

  const monthDays = useMemo(
    () =>
      cells
        .filter(Boolean)
        .map((date) => ({ isCurrentMonth: true, date, intensity: {} })),
    [cells]
  );

  const stats = useMemo(
    () => computeCalendarMonthSportStats(monthDays, workoutData, garminData, getDateStr),
    [monthDays, workoutData, garminData]
  );

  const sleepAvg = useMemo(() => {
    const days = monthDays.map((d) => getDateStr(d.date));
    let sum = 0;
    let n = 0;
    days.forEach((ds) => {
      const row = garminData?.daily?.[ds] || garminData?.dailies?.[ds];
      const hrs =
        Number(row?.sleepHours) ||
        (Number(row?.sleepTimeSeconds) ? Number(row.sleepTimeSeconds) / 3600 : 0) ||
        (Number(row?.sleep?.durationInSeconds)
          ? Number(row.sleep.durationInSeconds) / 3600
          : 0);
      if (hrs > 0) {
        sum += hrs;
        n += 1;
      }
    });
    return n > 0 ? sum / n : null;
  }, [monthDays, garminData]);

  const mergedHighlights = { avgSleepHours: sleepAvg };
  const infoLine = `${stats.trainingDays || 0} jours entraînés · ${stats.runningSessionCount || 0} sorties course`;

  if (variant === 'minimal') {
    return (
      <HomeWidgetShell title="Mois en cours" accent={accent}>
        <div className="flex flex-wrap gap-1">
          {cells.filter(Boolean).map((date) => {
            const kind = dayKind(date, workoutData, garminData, activeProgram);
            const ds = getDateStr(date);
            return (
              <span
                key={ds}
                className="h-2.5 w-2.5 rounded-[2px]"
                style={cellStyle(kind, accent, ds === todayStr)}
                title={ds}
              />
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-white/70">{infoLine}</p>
      </HomeWidgetShell>
    );
  }

  const activeMetrics = HOME_METRIC_DEFS.filter((m) => metrics?.[m.id] !== false).slice(0, 6);

  return (
    <HomeWidgetShell title="Mois en cours" accent={accent}>
      <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[9px] uppercase tracking-wider text-white/40">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <span key={`pad-${idx}`} className="aspect-square" />;
          const ds = getDateStr(date);
          const kind = dayKind(date, workoutData, garminData, activeProgram);
          return (
            <span
              key={ds}
              className="flex aspect-square items-center justify-center rounded-[3px] text-[10px] tabular-nums text-white/90"
              style={cellStyle(kind, accent, ds === todayStr)}
            >
              {date.getDate()}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-white/50">
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-[1px]" style={{ background: SESSION }} /> Séance
        </span>
        <span className="inline-flex items-center gap-1">
          <i
            className="inline-block h-2 w-2 rounded-[1px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, #1d4ed8 0 2px, #2563eb 2px 4px)'
            }}
          />{' '}
          Course
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-2 w-2 rounded-[1px]" style={{ background: REST }} /> Repos
        </span>
      </div>
      <p className="mt-2 text-[11px] text-white/70">{infoLine}</p>
      {activeMetrics.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activeMetrics.map((m) => {
            const row = formatMetric(m.id, stats, mergedHighlights);
            if (!row) return null;
            return (
              <span
                key={m.id}
                className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-white/80"
              >
                <span className="text-white/45">{row.label} </span>
                <span className="tabular-nums font-medium">{row.value}</span>
              </span>
            );
          })}
        </div>
      ) : null}
    </HomeWidgetShell>
  );
}
