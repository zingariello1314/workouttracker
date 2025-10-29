import React from 'react';
import { Calendar } from 'lucide-react';

const CalendrierActiviteChart = ({ data, colors }) => {
  // Fonction pour obtenir le nom du jour
  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  // Fonction pour formater la date
  const getDateStr = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Calculer l'intensité pour une date donnée (même logique que CalendarHeatmap)
  const getIntensityForDate = (date) => {
    const dateStr = getDateStr(date);
    const dayName = getDayName(date);
    
    // Récupérer les données
    const actualData = data?.data || data || {};
    const checkedExercises = actualData?.checkedExercises || {};
    const reps = actualData?.reps || {};
    const enduranceData = actualData?.enduranceData || {};
    
    // Compter les exercices cochés pour cette date
    let completedExercises = 0;
    Object.keys(checkedExercises).forEach(key => {
      if (checkedExercises[key] && key.startsWith(dateStr)) {
        completedExercises++;
      }
    });
    
    // Compter les répétitions totales pour cette date
    let totalReps = 0;
    Object.keys(reps).forEach(key => {
      if (key.startsWith(dateStr)) {
        totalReps += parseInt(reps[key]) || 0;
      }
    });
    
    // Vérifier les activités complémentaires
    const complementaryKey = `${dateStr}_complementary_`;
    const hasComplementaryActivity = Object.keys(checkedExercises).some(key => 
      key.startsWith(complementaryKey) && checkedExercises[key]
    );
    
    // Vérifier les sessions d'endurance
    const hasEnduranceSession = Object.values(enduranceData.sessions || {}).some(sessions => 
      Array.isArray(sessions) && sessions.some(session => session.date === dateStr)
    );
    
    // Calculer l'intensité
    const totalActivities = completedExercises + (hasComplementaryActivity ? 1 : 0) + (hasEnduranceSession ? 1 : 0);
    
    if (totalActivities === 0) return 0;
    
    // Logique hiérarchique : reps > temps > présence
    if (totalReps > 0) {
      if (totalReps <= 50) return 1; // Faible
      if (totalReps <= 150) return 2; // Moyen
      if (totalReps <= 300) return 3; // Intense
      return 4; // Très intense
    } else {
      // Basé sur le nombre d'activités
      if (totalActivities === 1) return 1; // Faible
      if (totalActivities === 2) return 2; // Moyen
      if (totalActivities >= 3) return 3; // Intense
      return 1; // Par défaut
    }
  };

  // Calculer les données réelles du calendrier
  const calculateCalendarData = () => {
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
        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const intensity = getIntensityForDate(currentDate);
        const hasSession = intensity > 0;
        
        monthData.days.push({
          hasSession,
          intensity,
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
              {month.days.map((day, dayIdx) => {
                const getIntensityColor = (level) => {
                  switch (level) {
                    case 0: return 'bg-slate-800 border border-slate-700/50';
                    case 1: return 'bg-purple-700/50';
                    case 2: return 'bg-purple-600/70';
                    case 3: return 'bg-purple-500 shadow-sm shadow-purple-500/50';
                    case 4: return 'bg-purple-400 shadow-sm shadow-purple-400/70';
                    default: return 'bg-slate-800 border border-slate-700/50';
                  }
                };
                
                const getIntensityLabel = (level) => {
                  switch (level) {
                    case 0: return 'Repos';
                    case 1: return 'Faible';
                    case 2: return 'Moyen';
                    case 3: return 'Intense';
                    case 4: return 'Très intense';
                    default: return 'Repos';
                  }
                };
                
                return (
                  <div
                    key={`day-${monthIdx}-${dayIdx}`}
                    className={`w-2.5 h-2.5 rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${getIntensityColor(day.intensity)}`}
                    title={day.hasSession ? `Séance - ${getIntensityLabel(day.intensity)}` : 'Repos'}
                  />
                );
              })}
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
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shadow-sm shadow-purple-500/50" />
            <span className="text-slate-400">Intense</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-400 shadow-sm shadow-purple-400/70" />
            <span className="text-slate-400">Très intense</span>
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
