import React from 'react';
import { Activity } from 'lucide-react';

const TopExercisesChart = ({ data, colors }) => {
  // Calculer les données des top exercices
  const topExercisesData = React.useMemo(() => {
    const exerciseCounts = {};
    
    data.workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        const exerciseName = exercise.name;
        exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + (exercise.reps || 0);
      });
    });
    
    return Object.entries(exerciseCounts)
      .map(([exercise, reps]) => ({ exercise, reps }))
      .sort((a, b) => b.reps - a.reps)
      .slice(0, 10); // Top 10 exercices
  }, [data.workoutHistory]);

  if (topExercisesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <Activity className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucun exercice enregistré</p>
          <p className="text-sm text-gray-500 mt-2">Vos exercices préférés apparaîtront ici !</p>
        </div>
      </div>
    );
  }

  const maxReps = Math.max(...topExercisesData.map(d => d.reps));
  const colorArray = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.purple,
    colors.pink,
    colors.indigo,
    colors.teal,
    colors.slate,
    colors.danger,
    colors.zinc
  ];

  return (
    <div className="space-y-4">
      {/* Graphique */}
      <div className="h-80 space-y-3 overflow-y-auto">
        {topExercisesData.map((item, index) => {
          const percentage = (item.reps / maxReps) * 100;
          const color = colorArray[index % colorArray.length];
          
          return (
            <div key={item.exercise} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-200 truncate pr-2">{item.exercise}</span>
                <span className="text-sm text-gray-400 flex-shrink-0">{item.reps} rép.</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}40`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Exercices</div>
          <div className="text-lg font-bold text-purple-400">
            {topExercisesData.length}
          </div>
          <div className="text-xs text-gray-500">différents</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Total</div>
          <div className="text-lg font-bold text-pink-400">
            {topExercisesData.reduce((sum, d) => sum + d.reps, 0)}
          </div>
          <div className="text-xs text-gray-500">répétitions</div>
        </div>
      </div>
    </div>
  );
};

export default TopExercisesChart;
