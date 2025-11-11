import React from 'react';
import { useFilteredDates } from '../../hooks/useFilteredDates';
import { areChartPropsEqual, areActivitiesEqual, normalizeActivityValue } from '../../../../../utils/chartComparison';

/**
 * Graphique heatmap calendrier des activités Garmin
 */
const DAY_ORDER = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function GarminActivityHeatmap({ precomputed, activities, dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors }) {
  const fallbackFiltered = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    7
  );

  const filteredDates = precomputed?.filteredDates ?? fallbackFiltered.filteredDates;
  const displayInfo = precomputed?.displayInfo ?? fallbackFiltered.displayInfo;

  // Calculer les statistiques pour chaque jour
  const activityData = React.useMemo(() => {
    if (precomputed?.activityByDate) {
      return precomputed.activityByDate;
    }

    const result = {};

    const incrementDay = (date, field) => {
      if (!result[date]) {
        result[date] = {
          date,
          total: 0,
          swimming: 0,
          jumpRope: 0,
          cardio: 0,
          distance: 0,
          duration: 0
        };
      }
      result[date].total += 1;
      result[date][field] += 1;
    };

    const addMetrics = (date, act) => {
      if (!result[date]) return;
      result[date].distance += normalizeActivityValue(act.distance);
      result[date].duration += normalizeActivityValue(act.duration);
    };

    ['swimming', 'jumpRope', 'cardio'].forEach(type => {
      const acts = activities?.[type] || [];
      acts.forEach(act => {
        const date = act.date;
        if (!date || !filteredDates.includes(date)) return;
        const field = type === 'swimming' ? 'swimming' : type === 'jumpRope' ? 'jumpRope' : 'cardio';
        incrementDay(date, field);
        addMetrics(date, act);
      });
    });

    return result;
  }, [precomputed, activities, filteredDates]);

  const weeks = React.useMemo(() => {
    if (precomputed?.weeks) {
      return precomputed.weeks;
    }

    const weeklyData = {};
    filteredDates.forEach(date => {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Dimanche
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          days: {},
          total: 0
        };
      }
      
      const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()];
      weeklyData[weekKey].days[dayName] = activityData[date] || { date, total: 0, swimming: 0, jumpRope: 0, cardio: 0, distance: 0, duration: 0 };
      weeklyData[weekKey].total += (activityData[date]?.total || 0);
    });
    return Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week)).slice(-8); // 8 dernières semaines
  }, [precomputed, filteredDates, activityData]);

  if (!activities || !dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée disponible pour le calendrier.
      </div>
    );
  }
  const getIntensityColor = React.useCallback((total) => {
    if (total === 0) return 'bg-slate-800';
    if (total === 1) return 'bg-green-600';
    if (total === 2) return 'bg-yellow-500';
    if (total >= 3) return 'bg-red-500';
    return 'bg-slate-700';
  }, []);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">📅 Calendrier d'activité</h4>
        {displayInfo && (
          <div className="text-slate-400 text-xs">{displayInfo}</div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-slate-400 px-2 py-2"></th>
              {DAY_ORDER.map(day => (
                <th key={day} className="text-center text-slate-400 px-1 py-2">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIdx) => (
              <tr key={week.week}>
                <td className="text-slate-400 px-2 py-1 text-right">
                  {new Date(week.week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </td>
                {DAY_ORDER.map(day => {
                  const dayData = week.days[day];
                  const total = dayData?.total || 0;
                  return (
                    <td key={day} className="px-1 py-1">
                      <div
                        className={`${getIntensityColor(total)} rounded text-white text-center p-1 min-w-[32px] cursor-pointer hover:opacity-80 transition-opacity`}
                        title={`${dayData?.date || ''}: ${total} activité(s)${dayData?.swimming ? `, ${dayData.swimming} natation` : ''}${dayData?.jumpRope ? `, ${dayData.jumpRope} corde` : ''}${dayData?.cardio ? `, ${dayData.cardio} cardio` : ''}`}
                      >
                        {total > 0 ? total : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-800 rounded"></div>
          <span>Aucune activité</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>1 activité</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>2 activités</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>3+ activités</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GarminActivityHeatmap, (prevProps, nextProps) => {
  return (
    areActivitiesEqual(prevProps.activities, nextProps.activities) &&
    areChartPropsEqual(prevProps, nextProps)
  );
});

