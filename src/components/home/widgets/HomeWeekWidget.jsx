import React, { useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { peekGarminAllDataCache, subscribeGarminAllDataCache } from '../../../hooks/garminDataLoad';
import { getDateStr } from '../../../utils/dateUtils';
import { dayCountsAsCalendarTrainingDay } from '../../../utils/sport/recapTrainingDayTruth';
import HomeWidgetShell from '../HomeWidgetShell';

const LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function startOfWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function weekDays(anchor = new Date()) {
  const start = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function HomeWeekWidget({ variant = 'dots', accent }) {
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();
  const [garminData, setGarminData] = useState(() => peekGarminAllDataCache());

  useEffect(() => subscribeGarminAllDataCache(setGarminData), []);

  const days = useMemo(() => weekDays(new Date()), []);
  const todayStr = getDateStr(new Date());

  const trained = days.map((d) =>
    dayCountsAsCalendarTrainingDay(workoutData, getDateStr(d), garminData)
  );
  const doneCount = trained.filter(Boolean).length;

  return (
    <HomeWidgetShell title="Semaine en cours" accent={accent}>
      {variant === 'band' ? (
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const ds = getDateStr(d);
            const isToday = ds === todayStr;
            const on = trained[i];
            return (
              <div
                key={ds}
                className="flex flex-col items-center rounded-lg border px-1 py-1.5 text-center"
                style={{
                  borderColor: isToday
                    ? accent
                    : on
                      ? `color-mix(in srgb, ${accent} 40%, transparent)`
                      : 'rgba(255,255,255,0.1)',
                  background: on
                    ? `color-mix(in srgb, ${accent} 22%, transparent)`
                    : 'rgba(0,0,0,0.25)'
                }}
              >
                <span className="text-[9px] uppercase text-white/45">{LABELS[i]}</span>
                <span className="text-sm font-semibold tabular-nums text-white">{d.getDate()}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-1">
          {days.map((d, i) => {
            const ds = getDateStr(d);
            const isToday = ds === todayStr;
            const on = trained[i];
            return (
              <span
                key={ds}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] tabular-nums"
                style={{
                  background: on ? accent : 'rgba(255,255,255,0.08)',
                  color: on ? '#07070b' : '#fff',
                  boxShadow: isToday ? `0 0 0 2px ${accent}` : undefined,
                  fontWeight: isToday ? 700 : 500
                }}
                title={ds}
              >
                {LABELS[i]}
              </span>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-[11px] text-white/70">
        {doneCount} séance{doneCount === 1 ? '' : 's'} faite{doneCount === 1 ? '' : 's'}
      </p>
    </HomeWidgetShell>
  );
}
