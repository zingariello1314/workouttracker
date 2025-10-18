import React from 'react';
import { BarChart3, Target, TrendingUp } from 'lucide-react';

const RepsRecords = ({ records, formatDate, workoutHistory }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Record de reps en une séance */}
        <div className="bg-slate-800/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 size={20} className="text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Plus de reps en une séance</h4>
              <p className="text-sm text-slate-400">Record de volume</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {records.reps?.total.value || 0}
            </div>
            <div className="text-sm text-slate-300 mb-3">
              {formatDate(records.reps?.total.date)}
            </div>
            <div className="text-xs text-slate-400">
              {records.reps?.total.exercises?.length || 0} exercices
            </div>
          </div>
        </div>

        {/* Record de reps pour un exercice */}
        <div className="bg-slate-800/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Target size={20} className="text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Plus de reps par exercice</h4>
              <p className="text-sm text-slate-400">Record d'endurance</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {records.reps?.single.value || 0}
            </div>
            <div className="text-sm text-slate-300 mb-1">
              {records.reps?.single.exercise || 'N/A'}
            </div>
            <div className="text-xs text-slate-400">
              {formatDate(records.reps?.single.date)}
            </div>
          </div>
        </div>
      </div>

      {/* Progression des records */}
      <div className="bg-slate-800/50 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-400" />
          Évolution des records
        </h4>
        
        <div className="space-y-3">
          {workoutHistory
            .filter(session => session.exercises?.some(ex => ex.reps >= 20))
            .slice(-5)
            .map((session, index) => {
              const maxReps = Math.max(...session.exercises.map(ex => ex.reps || 0));
              const bestExercise = session.exercises.find(ex => ex.reps === maxReps);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-white">{bestExercise?.name}</div>
                    <div className="text-xs text-slate-400">{formatDate(session.date)}</div>
                  </div>
                  <div className="text-lg font-bold text-purple-400">{maxReps}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default RepsRecords;