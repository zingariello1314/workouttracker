/**
 * Composant CalendarHeatmap - Heatmap calendrier d'activité
 * Toujours l'année en cours, occupe tout le bloc, mois alignés au-dessus des colonnes.
 */

import React, { useMemo, useState } from 'react';
import { qstatsPanel, qstatsMuted, qstatsMutedTight } from '../questsStatsTheme';

const HeatmapTooltip = ({ date, completed, totalQuests }) => {
  const dateObj = new Date(date + 'T12:00:00');
  const dateStr = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-black border-2 border-amber-400/60 rounded-lg p-3 shadow-xl z-50">
      <p className="text-amber-100 font-medium mb-2">{dateStr}</p>
      <p className="text-sm text-amber-300">
        Quêtes complétées: <span className="font-bold text-amber-200">{completed}</span>
      </p>
      {totalQuests > 0 && (
        <p className="text-sm text-amber-200/90">
          Taux de réussite: <span className="font-bold text-amber-300">{Math.round((completed / totalQuests) * 100)}%</span>
        </p>
      )}
    </div>
  );
};

const CalendarHeatmap = ({ calendarHeatmap, calendarMonthSpans, dailyPerformances }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  const maxCompleted = useMemo(() => {
    if (!calendarHeatmap || calendarHeatmap.length === 0) return 1;
    return Math.max(...calendarHeatmap.flat().map((d) => d.completed), 1);
  }, [calendarHeatmap]);

  const getColor = (completed) => {
    if (completed === 0) return 'bg-black border border-amber-900/40';
    const intensity = maxCompleted > 0 ? completed / maxCompleted : 0;
    if (intensity <= 0.25) return 'bg-amber-950 border border-amber-800/50';
    if (intensity <= 0.5) return 'bg-amber-900 border border-amber-700/50';
    if (intensity <= 0.75) return 'bg-amber-600 border border-amber-500/60';
    return 'bg-amber-400 border border-amber-300/70';
  };

  if (!calendarHeatmap || calendarHeatmap.length === 0) {
    return null;
  }

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const numWeeks = calendarHeatmap.length;

  return (
    <div className={`${qstatsPanel} w-full flex flex-col min-h-[300px]`}>
      <div className={`text-xs ${qstatsMuted} mb-3 font-semibold`}>Calendrier d'activité — année en cours</div>

      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden">
        <table className="w-full min-h-[200px] border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col className="w-6 min-w-[24px]" />
            {Array.from({ length: numWeeks }).map((_, i) => (
              <col key={i} style={{ minWidth: 10 }} />
            ))}
          </colgroup>
          <thead>
            {calendarMonthSpans && calendarMonthSpans.length > 0 && (
              <tr>
                <th className="p-0 bg-transparent border-0" />
                {calendarMonthSpans.map(({ label, span }, i) => (
                  <th
                    key={i}
                    colSpan={span}
                    className={`text-[10px] ${qstatsMutedTight} font-medium text-left pl-0.5 pb-1 border-0 bg-transparent`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {dayLabels.map((label, dayIndex) => (
              <tr key={dayIndex} className="group">
                <td className={`text-[10px] ${qstatsMutedTight} text-right pr-1 align-middle py-0.5 border-0 bg-transparent`}>
                  {label}
                </td>
                {calendarHeatmap.map((week, weekIndex) => {
                  const day = week[dayIndex];
                  if (!day) {
                    return <td key={weekIndex} className="p-0.5 border-0 bg-transparent" />;
                  }
                  const isHovered =
                    hoveredCell?.weekIndex === weekIndex && hoveredCell?.dayIndex === dayIndex;
                  return (
                    <td key={weekIndex} className="p-0.5 border-0 align-middle">
                      <div
                        className={`w-full aspect-square min-w-[6px] max-w-[16px] mx-auto rounded-sm ${getColor(day.completed)} cursor-pointer transition-all hover:scale-125 hover:z-10 relative`}
                        onMouseEnter={() =>
                          setHoveredCell({ weekIndex, dayIndex, day })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20 pointer-events-none">
                            <HeatmapTooltip
                              date={day.date}
                              completed={day.completed}
                              totalQuests={
                                dailyPerformances?.find((p) => p.date === day.date)
                                  ?.totalQuests || 0
                              }
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`flex items-center gap-2 mt-4 text-xs ${qstatsMuted} flex-shrink-0`}>
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-black border border-amber-900/50" />
          <div className="w-3 h-3 rounded-sm bg-amber-950 border border-amber-800/50" />
          <div className="w-3 h-3 rounded-sm bg-amber-800 border border-amber-600/50" />
          <div className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-400/60" />
          <div className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-200/50" />
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
