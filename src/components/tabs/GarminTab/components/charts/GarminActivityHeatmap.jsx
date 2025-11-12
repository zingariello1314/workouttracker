import React from 'react';
import { areSelectorChartPropsEqual } from '../../../../../utils/chartComparison';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

/**
 * Graphique heatmap calendrier des activités Garmin
 */
const DAY_ORDER = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function GarminActivityHeatmap({ precomputed, selector }) {
  useUIMetricsTelemetry('GarminActivityHeatmap');
  const heatmap = selector?.heatmap ?? selector ?? precomputed ?? {};
  const displayInfo = heatmap?.displayInfo ?? precomputed?.displayInfo ?? null;
  const activityData = heatmap?.activityByDate ?? precomputed?.activityByDate ?? {};
  const weeks = Array.isArray(heatmap?.weeks) ? heatmap.weeks : precomputed?.weeks ?? [];
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
            {weeks.map((week) => (
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

const MemoizedGarminActivityHeatmap = React.memo(GarminActivityHeatmap, areSelectorChartPropsEqual);

export default MemoizedGarminActivityHeatmap;
export { MemoizedGarminActivityHeatmap as GarminActivityHeatmap };

