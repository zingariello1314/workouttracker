import React from 'react';
import { Calendar } from 'lucide-react';

const CalendrierActiviteChart = ({ data, colors }) => {
  // Calculer les données réelles du calendrier
  const calculateCalendarData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    // Créer un calendrier des 3 derniers mois basé sur les vraies dates
    const calendarData = [];
    const now = new Date();
    
    // Générer les 3 derniers mois dynamiquement
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' });
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      
      const monthData = {
        month: monthName,
        days: []
      };
      
      // Générer les jours du mois
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasSession = workoutHistory.some(session => session.date === dateStr);
        
        // Calculer l'intensité basée sur les répétitions
        const session = workoutHistory.find(s => s.date === dateStr);
        const intensity = session ? Math.min((session.totalReps || 0) / 100, 1) : 0;
        
        monthData.days.push({
          hasSession,
          intensity,
          reps: session?.totalReps || 0,
          date: dateStr
        });
      }
      
      calendarData.push(monthData);
    }
    
    return calendarData;
  };

  const calendarData = calculateCalendarData();
  const totalSessions = calendarData.reduce((sum, month) => 
    sum + month.days.filter(day => day.hasSession).length, 0
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {calendarData.map((month, monthIdx) => (
          <div key={`month-${monthIdx}`} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-8">{month.month}</span>
            <div className="flex flex-wrap gap-1">
              {month.days.map((day, dayIdx) => (
                <div
                  key={`day-${monthIdx}-${dayIdx}`}
                  className={`w-2.5 h-2.5 rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${
                    day.hasSession
                      ? day.intensity > 0.7
                        ? 'bg-purple-500 shadow-sm shadow-purple-500/50'
                        : day.intensity > 0.4
                        ? 'bg-purple-600/70'
                        : 'bg-purple-700/50'
                      : 'bg-slate-800 border border-slate-700/50'
                  }`}
                  title={day.hasSession ? `Séance - ${day.reps} reps` : 'Repos'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 text-xs mb-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700/50" />
            <span className="text-slate-400">Repos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-700/50" />
            <span className="text-slate-400">Faible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-600/70" />
            <span className="text-slate-400">Moyen</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <span className="text-slate-400">Intense</span>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <span className="text-purple-400 font-semibold">{totalSessions} séances</span> sur 90 jours ({Math.round((totalSessions / 90) * 100)}%)
        </div>
      </div>
    </div>
  );
};

export default CalendrierActiviteChart;
