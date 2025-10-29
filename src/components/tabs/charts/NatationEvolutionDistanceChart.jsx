import React from 'react';
import { TrendingUp } from 'lucide-react';

const NatationEvolutionDistanceChart = ({ data, colors }) => {
  // Calculer les données réelles d'évolution de distance
  const calculateDistanceEvolution = () => {
    // Structure : data peut être { data: {...} } ou directement {...}
    const actualData = data?.data || data || {};
    
    // 1. Données de l'onglet Aujourd'hui (activités complémentaires)
    const complementarySessions = [];
    const checkedExercises = actualData?.checkedExercises || {};
    const reps = actualData?.reps || {};
    
    Object.keys(checkedExercises).forEach(key => {
      if (checkedExercises[key] && key.includes('complementary_natation')) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const minutesKey = `${dateStr}_complementary_natation_minutes`;
          const duration = parseInt(reps[minutesKey]) || 90;
          
          complementarySessions.push({
            date: dateStr,
            duration: duration,
            distance: 0, // Pas de distance dans l'onglet Aujourd'hui
            type: 'complementary'
          });
        }
      }
    });
    
    // 2. Données de l'onglet Endurance (sessions détaillées)
    const enduranceSessions = [];
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
        
        enduranceSessions.push({
          date: sessionDate,
          duration: duration,
          distance: session.totalDistance || session.distance || 0,
          type: 'endurance'
        });
      }
    });
    
    // 3. Combiner les données (priorité aux sessions détaillées)
    const allSessions = [...enduranceSessions];
    
    // Ajouter les sessions complémentaires qui n'ont pas de session détaillée
    complementarySessions.forEach(compSession => {
      const hasDetailedSession = enduranceSessions.some(endSession => endSession.date === compSession.date);
      if (!hasDetailedSession) {
        allSessions.push(compSession);
      }
    });
    
    // Grouper par semaine
    const weeklyData = {};
    allSessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = 0;
      }
      
      // Utiliser la distance réelle ou estimer basé sur la durée
      if (session.distance > 0) {
        weeklyData[weekKey] += session.distance;
      } else if (session.duration > 0) {
        // Estimation : 50m par minute de natation
        weeklyData[weekKey] += session.duration * 50;
      }
    });
    
    // Convertir en tableau et prendre les 5 dernières semaines
    const weeks = Object.entries(weeklyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-5)
      .map(([week, distance], index) => ({
        week: `S${index + 1}`,
        distance: distance // Utiliser la distance réelle, pas de minimum artificiel
      }));
    
    return weeks;
  };

  const weeklyData = calculateDistanceEvolution();
  const maxDistance = Math.max(...weeklyData.map(w => w.distance), 100); // Minimum 100m au lieu de 3000m

  // Fonction utilitaire pour calculer les coordonnées SVG de manière sécurisée
  const getSafeCoordinates = (value, index, values) => {
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = Math.max(maxVal - minVal, 1);
    
    const x = Math.max(20, Math.min(300, 20 + (index / (values.length - 1)) * 280));
    const y = Math.max(20, Math.min(170, 170 - ((value - minVal) / range) * 150));
    
    return {
      x: isNaN(x) ? 20 : x,
      y: isNaN(y) ? 170 : y
    };
  };

  if (weeklyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <TrendingUp className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-lg font-medium">Aucune donnée de natation</p>
          <p className="text-sm text-slate-500 mt-2">Commencez vos séances de natation pour voir l'évolution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-44 relative mb-2">
        <svg className="w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 45, 90, 135, 180].map((y) => (
            <line
              key={y}
              x1="20"
              y1={y}
              x2="300"
              y2={y}
              stroke="#334155"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {(() => {
            const points = weeklyData.map(w => w.distance);
            const maxVal = Math.max(...points);
            const minVal = Math.min(...points);
            const range = Math.max(maxVal - minVal, 1);
            
            const pathData = points
              .map((val, i) => {
                const coords = getSafeCoordinates(val, i, points);
                return `${i === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
              })
              .join(' ');
            
            const areaPath = pathData + ` L ${getSafeCoordinates(points[points.length - 1], points.length - 1, points).x} 170 L 20 170 Z`;
            
            return (
              <g>
                <path
                  d={areaPath}
                  fill="url(#gradient-cyan)"
                  opacity="0.3"
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 4px #06b6d480)' }}
                />
                {points.map((val, i) => {
                  const coords = getSafeCoordinates(val, i, points);
                  return (
                    <circle
                      key={i}
                      cx={coords.x}
                      cy={coords.y}
                      r="5"
                      fill="#06b6d4"
                      stroke="#0e7490"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            );
          })()}
          
          <defs>
            <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-3">
          {weeklyData.map((w) => (
            <span key={w.week}>{w.week}</span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700/50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Distance totale:</span>
          <span className="text-cyan-400 font-semibold">{(weeklyData.reduce((sum, w) => sum + w.distance, 0) / 1000).toFixed(1)} km</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Progression:</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">+28%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NatationEvolutionDistanceChart;
