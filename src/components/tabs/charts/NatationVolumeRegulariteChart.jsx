import React from 'react';
import { Calendar } from 'lucide-react';

const NatationVolumeRegulariteChart = ({ data, colors }) => {
  // Calculer les données réelles de volume et régularité
  const calculateVolumeRegulariteData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    // Filtrer les séances de natation
    const natationSessions = workoutHistory.filter(session => 
      session.exercises?.some(exercise => 
        exercise.name.toLowerCase().includes('natation') || 
        exercise.name.toLowerCase().includes('crawl') ||
        exercise.name.toLowerCase().includes('brasse')
      )
    );
    
    const sessions = natationSessions.length;
    
    // Utiliser les vraies données même si elles sont faibles
    
    const frequency = sessions / 4; // Fréquence par semaine sur 4 semaines
    const targetFrequency = 3; // Objectif 3 séances/semaine
    const frequencyPercent = Math.min((frequency / targetFrequency) * 100, 100);
    
    // Calendrier du mois basé sur les vraies données
    const calendar = Array(30).fill(0).map((_, idx) => {
      const hasSession = natationSessions.some(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getDate() === idx + 1;
      });
      return hasSession;
    });
    
    return {
      sessions,
      frequency: frequency.toFixed(1),
      frequencyPercent,
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
        <div className="text-xs text-slate-400 mt-1">Objectif: 3 séances/semaine</div>
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
          <span className="text-cyan-400 font-semibold">{(volumeData.sessions * 1.25).toFixed(1)} km</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Jours préférés:</span>
          <span className="text-cyan-400 font-semibold">Mar, Jeu, Sam</span>
        </div>
      </div>
    </div>
  );
};

export default NatationVolumeRegulariteChart;
