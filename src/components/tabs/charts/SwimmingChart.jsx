import React from 'react';
import { Waves } from 'lucide-react';

const SwimmingChart = ({ data, colors }) => {
  // Calculer les données de natation
  const swimmingData = React.useMemo(() => {
    // Structure : data peut être { data: {...} } ou directement {...}
    const actualData = data?.data || data || {};
    const sessions = [];
    
    // 1. Données de l'onglet Aujourd'hui (activités complémentaires)
    const checkedExercises = actualData?.checkedExercises || {};
    const reps = actualData?.reps || {};
    
    Object.keys(checkedExercises).forEach(key => {
      if (checkedExercises[key] && key.includes('complementary_natation')) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const minutesKey = `${dateStr}_complementary_natation_minutes`;
          const duration = parseInt(reps[minutesKey]) || 90;
          
          sessions.push({
            date: dateStr,
            duration: duration,
            distance: 0, // Pas de distance dans l'onglet Aujourd'hui
            reps: 0,
            type: 'complementary'
          });
        }
      }
    });
    
    // 2. Données de l'onglet Endurance (sessions détaillées)
    const enduranceData = actualData?.enduranceData || {};
    const swimmingSessions = enduranceData.sessions?.swimming || [];
    
    swimmingSessions.forEach(session => {
      if (session.date) {
        let sessionDate = session.date;
        if (sessionDate.includes('T')) {
          sessionDate = sessionDate.split('T')[0];
        }
        
        // totalTime est en secondes, convertir en minutes si pas de duration
        let duration = session.duration || 0;
        if (!duration && session.totalTime) {
          duration = typeof session.totalTime === 'number' ? session.totalTime / 60 : parseFloat(session.totalTime) / 60;
        }
        
        sessions.push({
          date: sessionDate,
          duration: duration,
          distance: session.totalDistance || session.distance || 0,
          reps: session.reps || 0,
          type: 'endurance'
        });
      }
    });
    
    // Grouper par semaine
    const weeklyData = {};
    sessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          sessions: 0,
          totalDuration: 0,
          totalDistance: 0,
          totalReps: 0
        };
      }
      
      weeklyData[weekKey].sessions += 1;
      weeklyData[weekKey].totalDuration += session.duration;
      weeklyData[weekKey].totalDistance += session.distance;
      weeklyData[weekKey].totalReps += session.reps;
    });
    
    return Object.values(weeklyData).sort((a, b) => new Date(a.week) - new Date(b.week));
  }, [data]);

  if (swimmingData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <Waves className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune séance de natation</p>
          <p className="text-sm text-gray-500 mt-2">Enregistrez vos séances de natation pour voir vos statistiques !</p>
        </div>
      </div>
    );
  }

  const maxSessions = Math.max(...swimmingData.map(d => d.sessions), 1);
  const maxDuration = Math.max(...swimmingData.map(d => d.totalDuration), 1);
  const maxDistance = Math.max(...swimmingData.map(d => d.totalDistance), 1);
  
  // Fonction utilitaire pour calculer les coordonnées de manière sécurisée
  const getSafeCoordinates = (week, index) => {
    // Validation stricte des données
    const safeSessions = Number(week.sessions) || 0;
    const safeDuration = Number(week.totalDuration) || 0;
    const safeDistance = Number(week.totalDistance) || 0;
    const safeMaxSessions = Number(maxSessions) || 1;
    const safeMaxDuration = Number(maxDuration) || 1;
    const safeMaxDistance = Number(maxDistance) || 1;
    
    const x = swimmingData.length > 1 ? 
      Math.max(0, Math.min(100, (index / (swimmingData.length - 1)) * 100)) : 50;
    
    const sessionsHeight = Math.max(0, Math.min(100, (safeSessions / safeMaxSessions) * 80));
    const durationHeight = Math.max(0, Math.min(100, (safeDuration / safeMaxDuration) * 60));
    const distanceHeight = Math.max(0, Math.min(100, (safeDistance / safeMaxDistance) * 40));
    
    // Validation finale des coordonnées
    return { 
      x: isNaN(x) ? 50 : x,
      sessionsHeight: isNaN(sessionsHeight) ? 0 : sessionsHeight,
      durationHeight: isNaN(durationHeight) ? 0 : durationHeight,
      distanceHeight: isNaN(distanceHeight) ? 0 : distanceHeight
    };
  };

  return (
    <div className="space-y-4">
      {/* Graphique en aires superposées */}
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            {/* Gradient pour les séances */}
            <linearGradient id="sessionsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.teal} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={colors.teal} stopOpacity="0.2"/>
            </linearGradient>
            
            {/* Gradient pour la durée */}
            <linearGradient id="durationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.6"/>
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.1"/>
            </linearGradient>
            
            {/* Gradient pour la distance */}
            <linearGradient id="distanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.purple} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={colors.purple} stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          {/* Grille de fond */}
          <g opacity="0.1">
            {[...Array(6)].map((_, i) => (
              <line
                key={i}
                x1="0"
                y1={`${(i / 5) * 100}%`}
                x2="100%"
                y2={`${(i / 5) * 100}%`}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Aires superposées */}
          {swimmingData.slice(-8).map((week, index) => {
            const coords = getSafeCoordinates(week, index);
            
            return (
              <g key={week.week}>
                {/* Aire des séances */}
                <rect
                  x={`${coords.x}%`}
                  y={`${100 - coords.sessionsHeight}%`}
                  width="12%"
                  height={`${coords.sessionsHeight}%`}
                  fill="url(#sessionsGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Aire de la durée */}
                <rect
                  x={`${coords.x + 1}%`}
                  y={`${100 - coords.durationHeight}%`}
                  width="10%"
                  height={`${coords.durationHeight}%`}
                  fill="url(#durationGradient)"
                  className="transition-all duration-500"
                />
                
                {/* Aire de la distance */}
                {coords.distanceHeight > 0 && (
                  <rect
                    x={`${coords.x + 2}%`}
                    y={`${100 - coords.distanceHeight}%`}
                    width="8%"
                    height={`${coords.distanceHeight}%`}
                    fill="url(#distanceGradient)"
                    className="transition-all duration-500"
                  />
                )}
                
                {/* Points de données */}
                <circle
                  cx={`${coords.x + 6}%`}
                  cy={`${100 - coords.sessionsHeight}%`}
                  r="4"
                  fill={colors.teal}
                  className="hover:r-6 transition-all duration-300 cursor-pointer"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(20, 184, 166, 0.4))'
                  }}
                  title={`Sem. ${new Date(week.week).getWeek()}: ${week.sessions} séances, ${week.totalDuration}min`}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Légende */}
        <div className="absolute top-2 right-2 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.teal }} />
            <span className="text-xs text-gray-300">Séances</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.primary }} />
            <span className="text-xs text-gray-300">Durée</span>
          </div>
          {maxDistance > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.purple }} />
              <span className="text-xs text-gray-300">Distance</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Séances</div>
          <div className="text-lg font-bold text-teal-400">
            {swimmingData.reduce((sum, d) => sum + d.sessions, 0)}
          </div>
          <div className="text-xs text-gray-500">total</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Durée</div>
          <div className="text-lg font-bold text-blue-400">
            {swimmingData.reduce((sum, d) => sum + d.totalDuration, 0)}
          </div>
          <div className="text-xs text-gray-500">minutes</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Distance</div>
          <div className="text-lg font-bold text-purple-400">
            {swimmingData.reduce((sum, d) => sum + d.totalDistance, 0)}
          </div>
          <div className="text-xs text-gray-500">mètres</div>
        </div>
      </div>
    </div>
  );
};

export default SwimmingChart;
