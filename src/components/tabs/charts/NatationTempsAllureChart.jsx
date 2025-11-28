import React from 'react';
import { Clock } from 'lucide-react';

const NatationTempsAllureChart = ({ data, colors }) => {
  // Fonction utilitaire pour convertir le temps en secondes
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    
    // Format "MM:SS" ou "M:SS"
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    
    // Format "SS" ou nombre de secondes
    const seconds = parseFloat(timeStr);
    return isNaN(seconds) ? 0 : seconds;
  };

  // Calculer les données réelles de temps et allure
  const calculateTempsAllureData = () => {
    // Structure : data peut être { data: {...} } ou directement {...}
    const actualData = data?.data || data || {};
    
    // 1. Données de l'onglet Endurance (sessions détaillées avec temps)
    const enduranceData = actualData?.enduranceData || {};
    const swimmingSessions = enduranceData.sessions?.swimming || [];
    
    // Extraire les temps au 100m depuis les longueurs
    const temps100m = [];
    
    swimmingSessions.forEach(session => {
      if (session.laps && Array.isArray(session.laps)) {
        session.laps.forEach(lap => {
          if (lap.distance && lap.time) {
            // Calculer le temps au 100m
            const distance = parseFloat(lap.distance) || 0;
            const timeInSeconds = parseTimeToSeconds(lap.time);
            
            if (distance > 0 && timeInSeconds > 0) {
              const timePer100m = (timeInSeconds / distance) * 100;
              temps100m.push(timePer100m);
            }
          }
        });
      }
    });
    
    // Si pas assez de données réelles, ne pas afficher de données simulées
    if (temps100m.length === 0) {
      return {
        temps100m: [],
        meilleurTemps: 0,
        progression: 0
      };
    }
    
    // Grouper les temps par semaine pour avoir une progression réelle
    const weeklyTimes = {};
    
    swimmingSessions.forEach(session => {
      if (session.date) {
        const sessionDate = new Date(session.date);
        const weekStart = new Date(sessionDate);
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyTimes[weekKey]) {
          weeklyTimes[weekKey] = [];
        }
        
        // Ajouter les temps de cette session
        if (session.laps && Array.isArray(session.laps)) {
          session.laps.forEach(lap => {
            if (lap.distance && lap.time) {
              const distance = parseFloat(lap.distance) || 0;
              const timeInSeconds = parseTimeToSeconds(lap.time);
              
              if (distance > 0 && timeInSeconds > 0) {
                const timePer100m = (timeInSeconds / distance) * 100;
                weeklyTimes[weekKey].push(timePer100m);
              }
            }
          });
        }
      }
    });
    
    // Convertir en tableau trié par date et prendre les 5 dernières semaines
    const sortedWeeks = Object.entries(weeklyTimes)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-5);
    
    // Créer le tableau final avec les temps moyens par semaine
    const selectedTimes = [];
    for (let i = 0; i < 5; i++) {
      if (i < sortedWeeks.length) {
        // Calculer le temps moyen de cette semaine
        const weekTimes = sortedWeeks[i][1];
        const avgTime = weekTimes.reduce((sum, time) => sum + time, 0) / weekTimes.length;
        selectedTimes.push(avgTime);
      } else {
        // Semaine sans données
        selectedTimes.push(0);
      }
    }
    
    // Calculer le meilleur temps et la progression seulement avec les semaines qui ont des données
    const validTimes = selectedTimes.filter(t => t > 0);
    const meilleurTemps = validTimes.length > 0 ? Math.min(...validTimes) : 0;
    
    // Progression basée sur les semaines avec données
    let progression = 0;
    if (validTimes.length > 1) {
      const firstTime = validTimes[0];
      const lastTime = validTimes[validTimes.length - 1];
      progression = Math.round(((lastTime - firstTime) / firstTime) * 100);
    }
    
    return {
      temps100m: selectedTimes,
      meilleurTemps,
      progression
    };
  };

  const tempsData = calculateTempsAllureData();

  // Si pas de données, afficher un message
  if (tempsData.temps100m.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-blue-500/10 text-center">
          <div className="text-slate-400 mb-2">ÉVOLUTION DES TEMPS AU 100M</div>
          <div className="text-slate-500 text-sm">
            {t('charts.noData.time')}<br />
            Ajoutez des sessions de natation avec des temps de longueurs pour voir votre progression.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/10">
        <div className="text-sm text-slate-400 mb-3">ÉVOLUTION DES TEMPS AU 100M</div>
        <div className="flex items-end gap-2 h-32 mb-2">
          {tempsData.temps100m.map((time, idx) => {
            // Si pas de données pour cette semaine (time = 0)
            if (time === 0) {
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full h-full flex flex-col justify-end">
                    <div className="w-full h-2 bg-slate-700 rounded-t opacity-50"></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">S{idx + 1}</div>
                </div>
              );
            }
            
            // Calculer la hauteur de manière sécurisée pour les semaines avec données
            const validTimes = tempsData.temps100m.filter(t => t > 0);
            const maxTime = Math.max(...validTimes);
            const minTime = Math.min(...validTimes);
            const range = Math.max(maxTime - minTime, 10); // Minimum 10 secondes de range
            const normalizedTime = (maxTime - time) / range;
            const barHeight = Math.max(8, Math.min(120, normalizedTime * 100 + 20)); // Entre 8px et 120px
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full h-full flex flex-col justify-end">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t transition-all"
                    style={{ height: `${barHeight}px` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-slate-800 px-2 py-1 rounded whitespace-nowrap transition-opacity z-10">
                      {Math.floor(time / 60)}'{(time % 60).toString().padStart(2, '0')}"
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">S{idx + 1}</div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-slate-400 text-center mt-2">
          Progression des temps sur 5 semaines
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/10">
          <div className="text-xs text-slate-400 mb-1">MEILLEUR 100M</div>
          <div className="text-xl font-bold text-cyan-400">
            {(() => {
              const minutes = Math.floor(tempsData.meilleurTemps / 60);
              const seconds = Math.floor(tempsData.meilleurTemps % 60);
              return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
            })()}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/10">
          <div className="text-xs text-slate-400 mb-1">PROGRESSION</div>
          <div className="text-xl font-bold text-emerald-400">
            {tempsData.progression > 0 ? '+' : ''}{tempsData.progression}%
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-emerald-500/20">
        <div className="text-xs text-emerald-400">
          {(() => {
            const validTimes = tempsData.temps100m.filter(t => t > 0);
            if (validTimes.length === 0) {
              return `📊 ${t('charts.noData.progression')}`;
            } else if (validTimes.length === 1) {
              return `📈 ${t('charts.noData.progressionHint')}`;
            } else {
              const improvement = tempsData.temps100m.length > 1 ? 
                Math.floor(tempsData.temps100m[0] - tempsData.temps100m[tempsData.temps100m.length - 1]) : 0;
              return improvement > 0 ? 
                `💪 Tu t'améliores ! -${improvement}s en ${validTimes.length} semaine(s)` :
                `📊 Progression: ${Math.abs(improvement)}s en ${validTimes.length} semaine(s)`;
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default NatationTempsAllureChart;
