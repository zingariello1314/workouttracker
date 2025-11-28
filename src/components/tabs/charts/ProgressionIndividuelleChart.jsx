import React from 'react';
import { useTranslation } from '../../../utils/translations';
import { TrendingUp } from 'lucide-react';

const ProgressionIndividuelleChart = ({ data, colors }) => {
  // Calculer les données de progression par exercice
  const calculateProgressionData = () => {
    const workoutHistory = data.workoutHistory || [];
    const exerciseProgress = {};
    
    // Grouper par exercice et par mois
    workoutHistory.forEach(session => {
      const sessionDate = new Date(session.date);
      const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
      
      session.exercises?.forEach(exercise => {
        const key = `${exercise.name}_${monthKey}`;
        if (!exerciseProgress[key]) {
          exerciseProgress[key] = {
            exercise: exercise.name,
            month: monthKey,
            reps: 0,
            sessions: 0
          };
        }
        exerciseProgress[key].reps += exercise.reps || 0;
        exerciseProgress[key].sessions += 1;
      });
    });
    
    // Utiliser les vraies données même si elles sont faibles
    
    // Convertir en données de progression
    const exerciseData = {};
    Object.values(exerciseProgress).forEach(item => {
      if (!exerciseData[item.exercise]) {
        exerciseData[item.exercise] = [];
      }
      exerciseData[item.exercise].push({
        month: item.month,
        reps: item.reps
      });
    });
    
    // Prendre les 3 exercices les plus pratiqués
    const topExercises = Object.entries(exerciseData)
      .sort((a, b) => b[1].reduce((sum, item) => sum + item.reps, 0) - a[1].reduce((sum, item) => sum + item.reps, 0))
      .slice(0, 3);
    
    return topExercises.map(([name, data], index) => {
      // Calculer la progression réelle
      const sortedData = data.sort((a, b) => a.month.localeCompare(b.month));
      const firstMonth = sortedData[0];
      const lastMonth = sortedData[sortedData.length - 1];
      
      const change = firstMonth && lastMonth ? 
        Math.round(((lastMonth.reps - firstMonth.reps) / firstMonth.reps) * 100) : 0;
      
      return {
        name,
        color: ['#ec4899', '#06b6d4', '#8b5cf6'][index],
        points: sortedData.map(item => item.reps),
        change
      };
    });
  };

  const progressionData = calculateProgressionData();
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];

  // Fonction utilitaire pour calculer les coordonnées SVG de manière sécurisée
  const getSafeCoordinates = (value, index, values) => {
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = Math.max(maxVal - minVal, 1);
    
    const x = Math.max(0, Math.min(300, (index / (values.length - 1)) * 300));
    const y = Math.max(0, Math.min(160, 160 - ((value - minVal) / range) * 160));
    
    return {
      x: isNaN(x) ? 0 : x,
      y: isNaN(y) ? 80 : y
    };
  };

  if (progressionData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <TrendingUp className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-lg font-medium">{t('charts.noData.progression')}</p>
          <p className="text-sm text-slate-500 mt-2">{t('charts.noData.progressionHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-40 relative mb-2">
        <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="300"
              y2={y}
              stroke="#334155"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Lines */}
          {progressionData.map((line, lineIdx) => {
            const pathData = line.points
              .map((val, i) => {
                const coords = getSafeCoordinates(val, i, line.points);
                return `${i === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
              })
              .join(' ');
            
            return (
              <g key={lineIdx}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={line.color}
                  strokeWidth="3"
                  style={{ filter: `drop-shadow(0 0 4px ${line.color}80)` }}
                />
                {line.points.map((val, i) => {
                  const coords = getSafeCoordinates(val, i, line.points);
                  return (
                    <circle
                      key={i}
                      cx={coords.x}
                      cy={coords.y}
                      r="4"
                      fill={line.color}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-2">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-700/50 space-y-2">
        {progressionData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }}
              />
              <span className="text-slate-300">{item.name}</span>
            </div>
            <span className="text-emerald-400 font-semibold">+{item.change}%</span>
          </div>
        ))}
        <div className="mt-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-emerald-500/20">
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Tendance: +18% 📈
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressionIndividuelleChart;
