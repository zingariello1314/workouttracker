import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useWorkout } from '../../../../context/WorkoutContext';
import { peekGarminAllDataCache, subscribeGarminAllDataCache } from '../../../../hooks/garminDataLoad';
import { useTranslation } from '../../../../utils/translations';
import { getDateStr } from '../../../../utils/dateUtils';
import { computeCalendarMonthSportStats } from '../../../../utils/calendarMonthSportStats';
import { computeCalendarMonthHighlights } from '../../../../utils/calendarMonthHighlights';
import { computeCalendarWeekLeaders } from '../../../../utils/calendarWeekLeaders';
import CalendarMonthSportTiles from '../../../calendar/CalendarMonthSportTiles';

function previewMonth(rows) {
  let best = null;
  (rows || []).forEach((row) => {
    if ((row.reps || 0) <= 0 && (row.stepsDays || 0) <= 0) return;
    const key = row.year * 12 + row.monthIndex;
    if (!best || key > best.key) best = { key, year: row.year, monthIndex: row.monthIndex };
  });
  if (best) return best;
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function monthDaysFor(year, monthIndex) {
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

export default function CalendarMonthTilesSettings() {
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();
  const t = useTranslation();
  const [garminData, setGarminData] = useState(() => peekGarminAllDataCache());

  useEffect(() => subscribeGarminAllDataCache((data) => setGarminData(data)), []);

  const preview = useMemo(() => {
    const leaders = computeCalendarWeekLeaders(workoutData, garminData);
    const picked = previewMonth(leaders.rows);
    const monthDays = monthDaysFor(picked.year, picked.monthIndex);
    return {
      year: picked.year,
      monthIndex: picked.monthIndex,
      weekLeaders: leaders,
      sportStats: computeCalendarMonthSportStats(monthDays, workoutData, garminData, getDateStr),
      highlights: computeCalendarMonthHighlights(monthDays, workoutData, garminData, getDateStr, {})
    };
  }, [workoutData, garminData]);

  const monthLabel = new Date(preview.year, preview.monthIndex, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card variant="settings" className="mt-4">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <LayoutGrid className="mr-2 text-violet-300" size={20} />
          Calendrier — blocs sous les mois
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-slate-300/80">
          La même carte que sous les mois du calendrier, avec tes données ({monthLabel}). Repliée, elle
          montre le résumé. Dépliée, chaque bloc se masque, se réaffiche ou se réordonne. Les remettre
          réaffiche aussi les mois déjà enregistrés.
        </p>
        <div className="max-w-md">
          <CalendarMonthSportTiles
            editable
            defaultExpanded
            sportStats={preview.sportStats}
            highlights={preview.highlights}
            holders={{}}
            monthIndex={preview.monthIndex}
            calendarYear={preview.year}
            calendarMonth={preview.monthIndex}
            weekLeaders={preview.weekLeaders}
            t={t}
            onOpenHighlight={() => {}}
          />
        </div>
      </CardContent>
    </Card>
  );
}
