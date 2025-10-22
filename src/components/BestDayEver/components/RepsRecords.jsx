import React from 'react';
import { BarChart3, Target, TrendingUp, Trophy } from 'lucide-react';

const RepsRecords = ({ records, formatDate, workoutHistory }) => {
  // Vérifier si nous avons des données
  if (!records || !records.reps) {
    return (
      <div className="text-center py-12">
        <Target size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Aucune donnée de répétitions disponible</p>
        <p className="text-slate-500 text-sm mt-2">Commence ton premier entraînement pour voir tes records !</p>
      </div>
    );
  }

  // Calculer les statistiques de progression
  const getProgressionData = () => {
    if (!workoutHistory || workoutHistory.length === 0) return [];
    
    return workoutHistory
      .filter(session => session.exercises && session.exercises.length > 0)
      .map(session => {
        const sessionReps = session.totalReps || session.exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
        const maxReps = Math.max(...session.exercises.map(ex => ex.reps || 0));
        const bestExercise = session.exercises.find(ex => ex.reps === maxReps);
        
        return {
          date: session.date,
          totalReps: sessionReps,
          maxSingleReps: maxReps,
          bestExercise: bestExercise?.nom || bestExercise?.name || 'Exercice inconnu',
          exerciseCount: session.exercises.length
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };

  const progressionData = getProgressionData();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Target className="text-blue-400" size={28} />
          Records de Répétitions
        </h3>
        <p className="text-slate-400">Tes meilleures performances en volume et endurance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Record de reps en une séance */}
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <BarChart3 size={24} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Record de Volume</h4>
              <p className="text-sm text-blue-200/80">Plus de reps en une séance</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-3">
              {records.reps?.total?.value || 0}
              <span className="text-lg ml-1">reps</span>
            </div>
            <div className="text-slate-300 font-medium mb-2">
              {records.reps?.total?.date ? formatDate(records.reps.total.date) : 'N/A'}
            </div>
            <div className="text-sm text-blue-200/60">
              {records.reps?.total?.exercises?.length || 0} exercices différents
            </div>
          </div>

          {/* Détails des exercices de cette séance */}
          {records.reps?.total?.exercises && records.reps.total.exercises.length > 0 && (
            <div className="mt-4 bg-slate-800/30 rounded-lg p-3">
              <div className="text-xs font-medium text-slate-300 mb-2">Exercices de cette séance:</div>
              <div className="space-y-1">
                {records.reps.total.exercises.slice(0, 3).map((exercise, index) => {
                  const exerciseName = exercise.nom || exercise.name || 'Exercice inconnu';
                  const exerciseReps = exercise.reps || 0;
                  return (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-slate-400">• {exerciseName}</span>
                      <span className="text-blue-400 font-medium">{exerciseReps}</span>
                    </div>
                  );
                })}
                {records.reps.total.exercises.length > 3 && (
                  <div className="text-xs text-slate-500 text-center mt-1">
                    ... et {records.reps.total.exercises.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Record de reps pour un exercice */}
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-full">
              <Trophy size={24} className="text-green-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Record d'Endurance</h4>
              <p className="text-sm text-green-200/80">Plus de reps par exercice</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-3">
              {records.reps?.single?.value || 0}
              <span className="text-lg ml-1">reps</span>
            </div>
            <div className="text-slate-300 font-medium mb-2">
              {records.reps?.single?.exercise || 'Aucun exercice'}
            </div>
            <div className="text-sm text-green-200/60">
              {records.reps?.single?.date ? formatDate(records.reps.single.date) : 'N/A'}
            </div>
          </div>

          {/* Barre de progression visuelle */}
          <div className="mt-4 bg-slate-800/30 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-300 mb-2">Niveau d'endurance:</div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((records.reps?.single?.value || 0) / 100 * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1 text-center">
              {records.reps?.single?.value >= 50 ? 'Niveau Expert' : 
               records.reps?.single?.value >= 30 ? 'Niveau Avancé' : 
               records.reps?.single?.value >= 15 ? 'Niveau Intermédiaire' : 'Niveau Débutant'}
            </div>
          </div>
        </div>
      </div>

      {/* Progression des records */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h4 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-400" />
          Historique des Performances
        </h4>
        
        {progressionData.length > 0 ? (
          <div className="space-y-3">
            {progressionData.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-sm font-medium text-white">
                      {formatDate(session.date).split(',')[0]}
                    </div>
                    <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      {session.exerciseCount} exercices
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Meilleur exercice: {session.bestExercise}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-400">
                    {session.totalReps} <span className="text-sm">total</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    {session.maxSingleReps} <span className="text-xs">max</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">Aucune donnée de progression disponible</p>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-white mb-1">
            {workoutHistory?.length || 0}
          </div>
          <div className="text-xs text-slate-400">séances totales</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-white mb-1">
            {workoutHistory?.reduce((sum, s) => sum + (s.totalReps || s.exercises?.reduce((reps, ex) => reps + (ex.reps || 0), 0) || 0), 0) || 0}
          </div>
          <div className="text-xs text-slate-400">reps totales</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-white mb-1">
            {Math.round((workoutHistory?.reduce((sum, s) => sum + (s.totalReps || s.exercises?.reduce((reps, ex) => reps + (ex.reps || 0), 0) || 0), 0) || 0) / (workoutHistory?.length || 1))}
          </div>
          <div className="text-xs text-slate-400">moyenne/séance</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-xl font-bold text-white mb-1">
            {records.exercises?.uniqueExercises?.size || 0}
          </div>
          <div className="text-xs text-slate-400">exercices uniques</div>
        </div>
      </div>
    </div>
  );
};

export default RepsRecords;