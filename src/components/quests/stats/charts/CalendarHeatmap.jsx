/**
 * Composant CalendarHeatmap - Heatmap calendrier d'activité
 */

import React, { useMemo, useState } from 'react';
import { generateCalendarHeatmap } from '../utils/statsCalculations';

const HeatmapTooltip = ({ date, completed, totalQuests }) => {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
      <p className="text-white font-medium mb-2">{dateStr}</p>
      <p className="text-sm text-emerald-300">
        Quêtes complétées: <span className="font-bold">{completed}</span>
      </p>
      {totalQuests > 0 && (
        <p className="text-sm text-slate-300">
          Taux de réussite: <span className="font-bold">{Math.round((completed / totalQuests) * 100)}%</span>
        </p>
      )}
    </div>
  );
};

const CalendarHeatmap = ({ calendarHeatmap, dailyPerformances }) => {
  const [hoveredDate, setHoveredDate] = useState(null);

  // Trouver le max pour normaliser
  const maxCompleted = useMemo(() => {
    if (!calendarHeatmap || calendarHeatmap.length === 0) return 1;
    return Math.max(...calendarHeatmap.flat().map(d => d.completed), 1);
  }, [calendarHeatmap]);

  // Fonction pour déterminer la couleur
  const getColor = (completed) => {
    if (completed === 0) return 'bg-slate-800';
    if (completed <= 2) return 'bg-slate-700';
    if (completed <= 5) return 'bg-slate-600';
    if (completed <= 8) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  if (!calendarHeatmap || calendarHeatmap.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
      <div className="text-xs text-slate-400 mb-4 font-semibold">Calendrier d'activité</div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Légende jours */}
          <div className="flex gap-1 mb-2">
            <div className="w-3"></div>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <div key={index} className="w-3 text-xs text-slate-400 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="flex flex-col gap-1">
            {calendarHeatmap.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1 items-center">
                {/* Numéro de semaine (optionnel) */}
                <div className="w-3 text-xs text-slate-500 text-right">
                  {weekIndex % 4 === 0 ? weekIndex + 1 : ''}
                </div>
                
                {/* Jours de la semaine */}
                {week.map((day, dayIndex) => {
                  const intensity = day.completed / maxCompleted;
                  const opacity = Math.max(0.3, intensity);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getColor(day.completed)} cursor-pointer transition-all hover:scale-125 hover:z-10 relative`}
                      style={{ opacity }}
                      onMouseEnter={() => setHoveredDate(day)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      {hoveredDate?.date === day.date && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
                          <HeatmapTooltip 
                            date={day.date} 
                            completed={day.completed}
                            totalQuests={dailyPerformances.find(p => p.date === day.date)?.totalQuests || 0}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
          <div className="w-3 h-3 rounded-sm bg-slate-700"></div>
          <div className="w-3 h-3 rounded-sm bg-slate-600"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;

