import React from 'react';
import { Target } from 'lucide-react';
import { findExerciseInDatabase } from '../../../data/exerciseDatabase';

const MuscleGroupChart = ({ data, colors }) => {
  // Calculer les données des groupes musculaires
  const muscleGroupData = React.useMemo(() => {
    const muscleGroups = {};
    
    data.workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        const exerciseInfo = findExerciseInDatabase(exercise.name);
        if (exerciseInfo) {
          const category = exerciseInfo.category;
          muscleGroups[category] = (muscleGroups[category] || 0) + (exercise.reps || 0);
        }
      });
    });
    
    return Object.entries(muscleGroups)
      .map(([group, reps]) => ({ group, reps }))
      .sort((a, b) => b.reps - a.reps);
  }, [data.workoutHistory]);

  if (muscleGroupData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <Target className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune donnée musculaire</p>
          <p className="text-sm text-gray-500 mt-2">Vos exercices seront analysés ici !</p>
        </div>
      </div>
    );
  }

  const maxReps = Math.max(...muscleGroupData.map(d => d.reps));
  const colorArray = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.purple,
    colors.pink,
    colors.indigo,
    colors.teal,
    colors.slate
  ];

  return (
    <div className="space-y-4">
      {/* Graphique */}
      <div className="h-80 space-y-3 overflow-y-auto">
        {muscleGroupData.map((item, index) => {
          const percentage = (item.reps / maxReps) * 100;
          const color = colorArray[index % colorArray.length];
          
          return (
            <div key={item.group} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-200">{item.group}</span>
                <span className="text-sm text-gray-400">{item.reps} rép.</span>
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
          <div className="text-xs text-gray-400 mb-1">Groupes</div>
          <div className="text-lg font-bold text-green-400">
            {muscleGroupData.length}
          </div>
          <div className="text-xs text-gray-500">musculaires</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Total</div>
          <div className="text-lg font-bold text-pink-400">
            {muscleGroupData.reduce((sum, d) => sum + d.reps, 0)}
          </div>
          <div className="text-xs text-gray-500">répétitions</div>
        </div>
      </div>
    </div>
  );
};

export default MuscleGroupChart;
