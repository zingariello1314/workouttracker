/**
 * Composant ValidationTimelineChart - Timeline des validations
 * Visualise l'activité dans le temps avec événements marquants
 */

import React, { useMemo, useState } from 'react';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { formatDateForChart } from '../utils/dateHelpers';
import { qstatsPanel, qstatsHeaderRow, qstatsAccentBar, qstatsMuted, qstatsMutedTight } from '../questsStatsTheme';

const ValidationTimelineChart = ({ validations, dailyPerformances, userData }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const timelineData = useMemo(() => {
    if (!validations || validations.length === 0) return { events: [], timeline: [] };

    const events = [];
    const timeline = [];

    // Trier validations par date
    const sortedValidations = [...validations].sort((a, b) => a.date.localeCompare(b.date));
    
    if (sortedValidations.length === 0) return { events: [], timeline: [] };

    // 1. Première validation
    const firstValidation = sortedValidations[0];
    events.push({
      type: 'first',
      date: firstValidation.date,
      label: 'Première validation',
      color: '#06b6d4',
      icon: '🎯',
      description: `Début de votre parcours QuietQuest`,
    });

    // 2. Records (jours avec le plus de quêtes)
    if (dailyPerformances && dailyPerformances.length > 0) {
      const maxQuests = Math.max(...dailyPerformances.map(p => p.completedQuests || 0));
      const recordDays = dailyPerformances.filter(p => p.completedQuests === maxQuests);
      
      recordDays.forEach(day => {
        events.push({
          type: 'record',
          date: day.date,
          label: `Record: ${maxQuests} quêtes`,
          color: '#10b981',
          icon: '🏆',
          description: `Votre meilleur jour avec ${maxQuests} quêtes complétées`,
        });
      });
    }

    // 3. Niveaux atteints (approximation basée sur XP total)
    if (userData) {
      const currentLevel = userData.level || 1;
      // Estimer les dates de niveau en fonction de l'XP cumulé
      const xpPerLevel = 1000; // Approximation
      for (let level = 2; level <= Math.min(currentLevel, 10); level++) {
        const xpNeeded = (level - 1) * xpPerLevel;
        // Trouver la validation qui a atteint ce niveau
        let cumulativeXP = 0;
        for (const v of sortedValidations) {
          cumulativeXP += v.xpGagne || 0;
          if (cumulativeXP >= xpNeeded) {
            events.push({
              type: 'level',
              date: v.date,
              label: `Niveau ${level}`,
              color: '#8b5cf6',
              icon: '⭐',
              description: `Vous avez atteint le niveau ${level}`,
            });
            break;
          }
        }
      }
    }

    // 4. Streaks importants (7 jours, 30 jours)
    const streaks = [];
    let currentStreak = 0;
    let lastDate = null;
    
    const uniqueDates = [...new Set(sortedValidations.map(v => v.date))].sort();
    
    uniqueDates.forEach((date, index) => {
      if (index === 0) {
        currentStreak = 1;
        lastDate = date;
      } else {
        const daysDiff = Math.floor((new Date(date) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          if (currentStreak >= 7) {
            streaks.push({ date: lastDate, streak: currentStreak });
          }
          currentStreak = 1;
        }
        lastDate = date;
      }
    });
    
    if (currentStreak >= 7) {
      streaks.push({ date: lastDate, streak: currentStreak });
    }

    streaks.forEach(({ date, streak }) => {
      if (streak === 7) {
        events.push({
          type: 'streak',
          date,
          label: `Streak 7 jours`,
          color: '#f59e0b',
          icon: '🔥',
          description: `7 jours consécutifs de quêtes complétées`,
        });
      } else if (streak >= 30) {
        events.push({
          type: 'streak',
          date,
          label: `Streak ${streak} jours`,
          color: '#ef4444',
          icon: '🔥🔥',
          description: `${streak} jours consécutifs ! Impressionnant !`,
        });
      }
    });

    // Créer timeline avec intensité d'activité
    const dateMap = new Map();
    sortedValidations.forEach(v => {
      const count = dateMap.get(v.date) || 0;
      dateMap.set(v.date, count + 1);
    });

    const allDates = [...new Set(sortedValidations.map(v => v.date))].sort();
    const maxIntensity = Math.max(...Array.from(dateMap.values()), 1);

    allDates.forEach(date => {
      timeline.push({
        date,
        intensity: dateMap.get(date) || 0,
        normalizedIntensity: (dateMap.get(date) || 0) / maxIntensity,
      });
    });

    // Trier les événements par date
    events.sort((a, b) => a.date.localeCompare(b.date));

    return { events, timeline };
  }, [validations, dailyPerformances, userData]);

  if (timelineData.timeline.length === 0) return null;

  // Calculer la plage de dates
  const startDate = timelineData.timeline[0]?.date;
  const endDate = timelineData.timeline[timelineData.timeline.length - 1]?.date;
  const totalDays = Math.max(1, Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Timeline des validations et événements
      </div>
      <LazyChart height={400}>
        <div className="relative w-full" style={{ minHeight: '400px' }}>
          {/* Ligne de temps principale */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-amber-900/60 via-amber-500/50 to-amber-900/60 transform -translate-y-1/2" />
          
          {/* Zones d'intensité */}
          {timelineData.timeline.map((item, index) => {
            const leftPercent = (index / Math.max(1, timelineData.timeline.length - 1)) * 100;
            const width = 100 / Math.max(1, timelineData.timeline.length);
            
            return (
              <div
                key={index}
                className="absolute top-1/2 transform -translate-y-1/2 h-8 rounded"
                style={{
                  left: `${leftPercent}%`,
                  width: `${width}%`,
                  backgroundColor: `rgba(245, 158, 11, ${item.normalizedIntensity * 0.35})`,
                  borderTop: `2px solid rgba(251, 191, 36, ${0.35 + item.normalizedIntensity * 0.45})`,
                }}
              />
            );
          })}

          {/* Événements */}
          {timelineData.events.map((event, index) => {
            const eventIndex = timelineData.timeline.findIndex(t => t.date === event.date);
            const leftPercent = eventIndex >= 0 
              ? (eventIndex / Math.max(1, timelineData.timeline.length - 1)) * 100
              : 0;
            
            const isEven = index % 2 === 0;
            
            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2"
                style={{
                  left: `${leftPercent}%`,
                  top: isEven ? '20%' : '80%',
                }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Ligne vers la timeline */}
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-0.5"
                  style={{
                    top: isEven ? '100%' : '0%',
                    height: isEven ? '60%' : '60%',
                    backgroundColor: event.color,
                    opacity: 0.5,
                  }}
                />
                
                {/* Point d'événement */}
                <div
                  className="relative cursor-pointer transition-all duration-200"
                  style={{
                    transform: hoveredEvent === event ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 shadow-lg"
                    style={{
                      backgroundColor: event.color,
                      borderColor: '#fff',
                      boxShadow: `0 0 12px ${event.color}80`,
                    }}
                  />
                  
                  {/* Label */}
                  <div
                    className={`absolute whitespace-nowrap text-xs font-semibold px-2 py-1 rounded-lg border transition-all duration-200 ${
                      hoveredEvent === event ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                    style={{
                      [isEven ? 'top' : 'bottom']: '120%',
                      left: '50%',
                      transform: hoveredEvent === event 
                        ? 'translateX(-50%) translateY(0)' 
                        : 'translateX(-50%) translateY(10px)',
                      backgroundColor: 'rgba(0, 0, 0, 0.92)',
                      borderColor: `${event.color}80`,
                      color: event.color,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{event.icon}</span>
                      <span>{event.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tooltip détaillé */}
          {hoveredEvent && (
            <div
              className="absolute bg-black border-2 rounded-lg p-3 shadow-2xl z-20"
              style={{
                borderColor: `${hoveredEvent.color}99`,
                top: '10px',
                right: '10px',
                maxWidth: '250px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{hoveredEvent.icon}</span>
                <p className="font-semibold text-sm tracking-wide" style={{ color: hoveredEvent.color }}>
                  {hoveredEvent.label}
                </p>
              </div>
              <p className={`text-xs ${qstatsMuted} mb-1`}>
                {formatDateForChart(hoveredEvent.date, 'long')}
              </p>
              <p className="text-sm text-amber-100/95">{hoveredEvent.description}</p>
            </div>
          )}

          {/* Légende dates */}
          <div className={`absolute bottom-0 left-0 right-0 flex justify-between text-xs ${qstatsMutedTight} px-2`}>
            <span>{startDate ? formatDateForChart(startDate, 'short') : ''}</span>
            <span>{endDate ? formatDateForChart(endDate, 'short') : ''}</span>
          </div>
        </div>
      </LazyChart>
    </div>
  );
};

export default ValidationTimelineChart;

