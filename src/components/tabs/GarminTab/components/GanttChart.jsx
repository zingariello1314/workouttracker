/**
 * 🔴 FIX #81-87: Composant Gantt Chart pour visualiser les activités
 * Timeline visuelle des activités Garmin
 */
import React from 'react';
import { DATE_RANGE } from '../constants';

export default function GanttChart({ activities, startDate, endDate }) {
  const [selectedPeriod, setSelectedPeriod] = React.useState('week');

  /**
   * Combine toutes les activités et les trie par date
   */
  const allActivities = React.useMemo(() => {
    const combined = [
      ...(activities?.swimming || []).map(a => ({ ...a, type: 'swimming', color: '#3b82f6' })),
      ...(activities?.jumpRope || []).map(a => ({ ...a, type: 'jumpRope', color: '#10b981' })),
      ...(activities?.cardio || []).map(a => ({ ...a, type: 'cardio', color: '#f59e0b' }))
    ];

    return combined.sort((a, b) => {
      const dateA = new Date(a.date || a.startTimeLocal || 0);
      const dateB = new Date(b.date || b.startTimeLocal || 0);
      return dateA - dateB;
    });
  }, [activities]);

  /**
   * Calcule la plage de dates à afficher
   */
  const dateRange = React.useMemo(() => {
    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }

    if (allActivities.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      };
    }

    const dates = allActivities.map(a => new Date(a.date || a.startTimeLocal)).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      };
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Ajouter une marge
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    return { start: minDate, end: maxDate };
  }, [allActivities, startDate, endDate]);

  /**
   * Calcule la position X d'une activité
   */
  const getActivityPosition = React.useCallback((activity) => {
    const activityDate = new Date(activity.date || activity.startTimeLocal);
    const totalDays = (dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24);
    const daysFromStart = (activityDate - dateRange.start) / (1000 * 60 * 60 * 24);
    
    return {
      left: `${(daysFromStart / totalDays) * 100}%`,
      width: `${Math.max(1, (activity.duration || 60) / (60 * 24))}%` // Minimum 1% de largeur
    };
  }, [dateRange]);

  /**
   * Génère les dates pour l'axe horizontal
   */
  const timelineDates = React.useMemo(() => {
    const dates = [];
    const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    const step = Math.max(1, Math.floor(totalDays / 10)); // Max 10 dates affichées

    for (let i = 0; i <= totalDays; i += step) {
      const date = new Date(dateRange.start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  }, [dateRange]);

  /**
   * Organise les activités par date et calcule les positions verticales
   * pour éviter les superpositions
   */
  const organizedActivities = React.useMemo(() => {
    const activitiesByDate = {};
    
    allActivities.forEach(activity => {
      const activityDate = new Date(activity.date || activity.startTimeLocal);
      const dateKey = activityDate.toISOString().split('T')[0];
      
      if (!activitiesByDate[dateKey]) {
        activitiesByDate[dateKey] = [];
      }
      activitiesByDate[dateKey].push(activity);
    });

    // Calculer les positions Y en évitant les superpositions
    const ACTIVITY_HEIGHT = 40; // Hauteur de chaque activité
    const ACTIVITY_SPACING = 5; // Espacement entre activités
    const START_Y = 35; // Position Y de départ (sous l'axe)
    
    let currentY = START_Y;
    const activityPositions = [];

    // Parcourir toutes les dates dans l'ordre chronologique
    const sortedDates = Object.keys(activitiesByDate).sort();
    
    sortedDates.forEach(dateKey => {
      const dateActivities = activitiesByDate[dateKey];
      
      dateActivities.forEach((activity, idx) => {
        activityPositions.push({
          ...activity,
          yPosition: currentY
        });
        
        // Si plusieurs activités le même jour, les empiler
        if (idx < dateActivities.length - 1) {
          currentY += ACTIVITY_HEIGHT + ACTIVITY_SPACING;
        } else {
          // Après le dernier de la journée, espace plus grand
          currentY += ACTIVITY_HEIGHT + ACTIVITY_SPACING * 2;
        }
      });
    });

    return activityPositions;
  }, [allActivities]);

  /**
   * Calcule la hauteur totale nécessaire pour la timeline
   */
  const timelineHeight = React.useMemo(() => {
    if (organizedActivities.length === 0) {
      return 200; // Hauteur minimale pour l'axe
    }
    
    const ACTIVITY_HEIGHT = 40;
    const ACTIVITY_SPACING = 5;
    const START_Y = 35;
    const BOTTOM_PADDING = 20;
    
    // Trouver la position Y la plus basse
    const maxY = Math.max(...organizedActivities.map(a => a.yPosition)) + ACTIVITY_HEIGHT;
    
    return maxY + BOTTOM_PADDING;
  }, [organizedActivities]);

  return (
    <div 
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-4"
      role="region"
      aria-label="Gantt Chart des activités"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">📊 Timeline Activités</h3>
        
        {/* Légende */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-300">Natation</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span className="text-slate-300">Corde à sauter</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-slate-300">Cardio</span>
          </div>
        </div>
      </div>

      {allActivities.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <p>Aucune activité à afficher</p>
        </div>
      ) : (
        <>
          {/* Timeline horizontale - SANS overflow-y, hauteur dynamique */}
          <div className="mb-4 overflow-x-auto overflow-y-visible">
            <div 
              className="relative" 
              style={{ 
                minWidth: '800px',
                height: `${timelineHeight}px`
              }}
            >
              {/* Lignes de dates */}
              <div className="absolute top-0 left-0 right-0 h-px bg-slate-600 z-0"></div>
              {timelineDates.map((date, idx) => {
                const position = ((date - dateRange.start) / (dateRange.end - dateRange.start)) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 w-px bg-slate-600 opacity-30 z-0"
                    style={{ 
                      left: `${position}%`,
                      height: `${timelineHeight}px`
                    }}
                  >
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap z-10">
                      {date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                );
              })}

              {/* Activités avec positions calculées pour éviter superpositions */}
              {organizedActivities.map((activity, idx) => {
                const position = getActivityPosition(activity);
                const activityDate = new Date(activity.date || activity.startTimeLocal);
                const durationMinutes = activity.duration ? Math.floor(activity.duration / 60) : 0;
                
                return (
                  <div
                    key={`${activity.type}-${activity.id || idx}`}
                    className="absolute rounded px-2 py-1 text-white text-xs cursor-pointer hover:opacity-80 transition-opacity shadow-lg z-20"
                    style={{
                      left: position.left,
                      top: `${activity.yPosition}px`,
                      width: `calc(${position.width} - 2px)`,
                      backgroundColor: activity.color,
                      minWidth: '60px',
                      maxWidth: '200px'
                    }}
                    title={`${activity.activityName || activity.type}\n${activityDate.toLocaleDateString('fr-FR')}\n${durationMinutes} min`}
                  >
                    <div className="font-medium truncate">
                      {activity.activityName || activity.type}
                    </div>
                    <div className="text-xs opacity-90">
                      {durationMinutes} min
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Infos */}
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
            <p>
              Total: {allActivities.length} activité(s) entre{' '}
              {dateRange.start.toLocaleDateString('fr-FR')} et{' '}
              {dateRange.end.toLocaleDateString('fr-FR')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

