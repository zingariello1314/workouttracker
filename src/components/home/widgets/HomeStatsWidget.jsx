import React, { useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { peekGarminAllDataCache, subscribeGarminAllDataCache } from '../../../hooks/garminDataLoad';
import { getDateStr } from '../../../utils/dateUtils';
import { computeCalendarMonthSportStats } from '../../../utils/calendarMonthSportStats';
import { HOME_METRIC_DEFS } from '../../../utils/homeAppearancePreference';
import HomeWidgetShell from '../HomeWidgetShell';

const TONE = {
  accent: null, // filled with prop
  green: '#34d399',
  gold: '#ffbf47'
};

function monthDays(year, monthIndex) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];
  for (let day = 1; day <= last; day += 1) {
    days.push({
      isCurrentMonth: true,
      date: new Date(year, monthIndex, day, 12, 0, 0, 0),
      intensity: {}
    });
  }
  return days;
}

function metricValue(id, stats, sleepAvg) {
  switch (id) {
    case 'reps':
      return (stats.totalReps || 0).toLocaleString('fr-FR');
    case 'kg':
      return (stats.totalKg || 0).toLocaleString('fr-FR');
    case 'days':
      return String(stats.trainingDays || 0);
    case 'steps':
      return (stats.totalSteps || 0).toLocaleString('fr-FR');
    case 'km':
      return String(stats.runningKm || 0);
    case 'sleep':
      return sleepAvg != null && sleepAvg > 0
        ? `${Number(sleepAvg).toFixed(1).replace('.', ',')} h`
        : '—';
    default:
      return '—';
  }
}

export default function HomeStatsWidget({ variant = 'grid', accent, metrics }) {
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();
  const [garminData, setGarminData] = useState(() => peekGarminAllDataCache());

  useEffect(() => subscribeGarminAllDataCache(setGarminData), []);

  const year = new Date().getFullYear();
  const monthIndex = new Date().getMonth();
  const days = useMemo(() => monthDays(year, monthIndex), [year, monthIndex]);

  const stats = useMemo(
    () => computeCalendarMonthSportStats(days, workoutData, garminData, getDateStr),
    [days, workoutData, garminData]
  );

  const sleepAvg = useMemo(() => {
    let sum = 0;
    let n = 0;
    days.forEach((d) => {
      const ds = getDateStr(d.date);
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
  }, [days, garminData]);

  const active = HOME_METRIC_DEFS.filter((m) => metrics?.[m.id] !== false);

  return (
    <HomeWidgetShell title="Stats chiffrées" accent={accent}>
      <div
        className={
          variant === 'row'
            ? 'flex flex-wrap gap-1.5'
            : 'grid grid-cols-2 gap-1.5 sm:grid-cols-3'
        }
      >
        {active.map((m) => {
          const color = m.tone === 'accent' ? accent : TONE[m.tone] || accent;
          return (
            <div
              key={m.id}
              className="rounded-lg border px-2 py-1.5"
              style={{
                borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                clipPath:
                  'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
              }}
            >
              <div className="text-[9px] uppercase tracking-wider text-white/50">{m.label}</div>
              <div className="text-sm font-semibold tabular-nums text-white">
                {metricValue(m.id, stats, sleepAvg)}
              </div>
            </div>
          );
        })}
      </div>
    </HomeWidgetShell>
  );
}
