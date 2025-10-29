import React from 'react';
import { Calendar } from 'lucide-react';

const NatationVolumeRegulariteChart = ({ data, colors }) => {
  // Calculer les données réelles de volume et régularité
  const calculateVolumeRegulariteData = () => {
    // Structure : data peut être { data: {...} } ou directement {...}
    const actualData = data?.data || data || {};
    
    // 1. Données de l'onglet Aujourd'hui (activités complémentaires)
    const complementarySessions = [];
    const checkedExercises = actualData?.checkedExercises || {};
    
    Object.keys(checkedExercises).forEach(key => {
      if (checkedExercises[key] && key.includes('complementary_natation')) {
        const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          complementarySessions.push({
            date: dateMatch[1],
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
        enduranceSessions.push({
          date: sessionDate,
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
        allSessions.push({
          ...compSession,
          distance: 0 // Pas de distance dans l'onglet Aujourd'hui
        });
      }
    });
    
    const sessions = allSessions.length;
    const totalDistance = allSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
    
    // Calculer la fréquence basée sur la période réelle depuis la première session
    let frequency = 0;
    let targetFrequency = 1; // Objectif réaliste : 1 séance/semaine
    let frequencyPercent = 0;
    
    if (sessions > 0) {
      // Trier les sessions par date
      const sortedSessions = allSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstSession = new Date(sortedSessions[0].date);
      const lastSession = new Date(sortedSessions[sortedSessions.length - 1].date);
      
      // Calculer le nombre de semaines écoulées
      const weeksElapsed = Math.max(1, Math.ceil((lastSession - firstSession) / (7 * 24 * 60 * 60 * 1000)) + 1);
      
      frequency = sessions / weeksElapsed;
      frequencyPercent = Math.min((frequency / targetFrequency) * 100, 100);
    }
    
    // Calendrier du mois basé sur les vraies données
    const calendar = Array(30).fill(0).map((_, idx) => {
      const hasSession = allSessions.some(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getDate() === idx + 1;
      });
      return hasSession;
    });
    
    return {
      sessions,
      totalDistance: Math.round(totalDistance),
      frequency: frequency.toFixed(1),
      frequencyPercent,
      targetFrequency,
      calendar
    };
  };

  const volumeData = calculateVolumeRegulariteData();

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/10">
        <div className="text-sm text-slate-400 mb-1">FRÉQUENCE</div>
        <div className="text-2xl font-bold text-cyan-400 mb-2">{volumeData.frequency} séances/semaine</div>
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
            style={{ width: `${volumeData.frequencyPercent}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 mt-1">Objectif: {volumeData.targetFrequency} séance{volumeData.targetFrequency > 1 ? 's' : ''}/semaine</div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-slate-400 mb-2">Calendrier du mois</div>
        <div className="grid grid-cols-10 gap-1">
          {volumeData.calendar.map((hasSession, idx) => (
            <div
              key={idx}
              className={`w-full aspect-square rounded-sm ${
                hasSession
                  ? 'bg-cyan-500 shadow-sm shadow-cyan-500/50'
                  : 'bg-slate-800 border border-slate-700/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Volume total:</span>
          <span className="text-cyan-400 font-semibold">{(volumeData.totalDistance / 1000).toFixed(1)} km</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Jours préférés:</span>
          <span className="text-cyan-400 font-semibold">
            {(() => {
              // Calculer les jours préférés basés sur les vraies données
              const dayCounts = {};
              volumeData.calendar.forEach((hasSession, idx) => {
                if (hasSession) {
                  const date = new Date(2025, 0, idx + 1); // Janvier 2025
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                  dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
                }
              });
              
              const sortedDays = Object.entries(dayCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([day]) => day);
              
              return sortedDays.length > 0 ? sortedDays.join(', ') : 'Aucun';
            })()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NatationVolumeRegulariteChart;
