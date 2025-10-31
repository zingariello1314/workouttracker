import React from 'react';
import { BarChart } from 'lucide-react';

const ObjectivesChart = ({ data, colors }) => {
  // Données simulées pour les objectifs (à remplacer par de vraies données)
  const objectivesData = React.useMemo(() => {
    // Simulation d'objectifs basés sur les données existantes
    const latestEntry = data.data?.progressEntries?.slice(-1)[0];
    const currentWeight = latestEntry?.weight || 70;
    const currentWaist = latestEntry?.waist || 80;
    
    // Calculer les répétitions actuelles de la semaine
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    // CORRECTION: Exclure les jumps de corde à sauter
    const calculateValidReps = (session) => {
      if (!session || !session.exercises) return session?.totalReps || 0;
      return session.exercises.reduce((total, ex) => {
        const isJumprope = (ex.exerciseId || ex.id || '').toString().includes('endurance_jumprope') ||
                           ex.activityType === 'jumprope';
        if (isJumprope) return total;
        return total + (parseInt(ex.reps) || 0);
      }, 0);
    };
    const currentWeekReps = data.workoutHistory
      .filter(session => new Date(session.date) >= weekAgo)
      .reduce((sum, session) => sum + calculateValidReps(session), 0);
    
    return [
      {
        metric: 'Poids',
        current: currentWeight,
        target: currentWeight - 5, // Objectif de perte de 5kg
        deadline: '6 mois',
        progress: Math.max(0, Math.min(100, ((currentWeight - (currentWeight - 5)) / 5) * 100))
      },
      {
        metric: 'Tour de taille',
        current: currentWaist,
        target: currentWaist - 3, // Objectif de réduction de 3cm
        deadline: '3 mois',
        progress: Math.max(0, Math.min(100, ((currentWaist - (currentWaist - 3)) / 3) * 100))
      },
      {
        metric: 'Répétitions/semaine',
        current: currentWeekReps,
        target: 800,
        deadline: '2 mois',
        progress: Math.min(100, (currentWeekReps / 800) * 100)
      }
    ];
  }, [data.data?.progressEntries, data.workoutHistory]);

  if (objectivesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <BarChart className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucun objectif défini</p>
          <p className="text-sm text-gray-500 mt-2">Définissez vos objectifs dans les paramètres !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Graphique en barres */}
      <div className="h-80 space-y-4">
        {objectivesData.map((objective, index) => {
          const color = index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.accent;
          
          return (
            <div key={objective.metric} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-200">{objective.metric}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{objective.current}</span>
                  <span className="text-xs text-gray-500">→</span>
                  <span className="text-xs text-gray-400">{objective.target}</span>
                </div>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${objective.progress}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}40`
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {Math.round(objective.progress)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Échéance: {objective.deadline}</span>
                <span>Progression: {objective.progress.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé des objectifs */}
      <div className="grid grid-cols-3 gap-3">
        {objectivesData.map((objective, index) => {
          const color = index === 0 ? colors.primary : index === 1 ? colors.secondary : colors.accent;
          const isCompleted = objective.progress >= 100;
          
          return (
            <div key={objective.metric} className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">{objective.metric}</div>
              <div className={`text-lg font-bold ${isCompleted ? 'text-green-400' : 'text-gray-300'}`}>
                {isCompleted ? '✓' : Math.round(objective.progress)}%
              </div>
              <div className="text-xs text-gray-500">
                {isCompleted ? 'Atteint !' : 'En cours'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ObjectivesChart;
