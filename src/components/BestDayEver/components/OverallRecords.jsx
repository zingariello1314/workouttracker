import React from 'react';
import { Trophy, Target, Dumbbell, Clock, Flame, Medal, Sparkles } from 'lucide-react';

const OverallRecords = ({ 
  records, 
  bestDayMetric, 
  setBestDayMetric, 
  celebrationMode, 
  setCelebrationMode, 
  formatDate 
}) => {
  // Vérifier si nous avons des données
  if (!records || !records.bestDaysByMetric) {
    return (
      <div className="text-center py-12">
        <Trophy size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Aucune séance enregistrée</p>
        <p className="text-slate-500 text-sm mt-2">Commence ton premier entraînement pour voir tes records !</p>
      </div>
    );
  }

  const metricLabels = {
    reps: 'répétitions totales',
    exercises: 'exercices différents',
    duration: 'durée (minutes)',
    calories: 'calories brûlées'
  };

  const metricIcons = {
    reps: Target,
    exercises: Dumbbell,
    duration: Clock,
    calories: Flame
  };

  const bestDay = records.bestDaysByMetric[bestDayMetric];
  const details = bestDay?.details;

  return (
    <div className="space-y-6">
      {/* Sélecteur de métrique */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(metricLabels).map(([key, label]) => {
          const Icon = metricIcons[key];
          const isActive = bestDayMetric === key;
          return (
            <button
              key={key}
              onClick={() => setBestDayMetric(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Section principale - Ton Meilleur Jour */}
      <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-yellow-500/20 rounded-full">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">🏆 Ton Meilleur Jour</h3>
            <p className="text-yellow-200/80">Par {metricLabels[bestDayMetric]}</p>
          </div>
          {bestDay?.value > 0 && (
            <button
              onClick={() => setCelebrationMode(!celebrationMode)}
              className="ml-auto p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-all"
            >
              <Sparkles size={20} className="text-yellow-400" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Valeur principale */}
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {bestDay?.value || 0}
              {bestDayMetric === 'duration' && <span className="text-lg ml-1">min</span>}
              {bestDayMetric === 'calories' && <span className="text-lg ml-1">cal</span>}
            </div>
            <div className="text-slate-300 font-medium">{metricLabels[bestDayMetric]}</div>
          </div>

          {/* Date */}
          <div className="text-center">
            <div className="text-lg font-semibold text-white mb-1">
              {bestDay?.date ? formatDate(bestDay.date) : 'N/A'}
            </div>
            <div className="text-slate-400 text-sm">Détails de la séance:</div>
          </div>

          {/* Métriques secondaires */}
          <div className="space-y-2">
            {details?.metrics && (
              <>
                {bestDayMetric !== 'reps' && details.metrics.reps && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Répétitions:</span>
                    <span className="text-yellow-400 font-medium">{details.metrics.reps}</span>
                  </div>
                )}
                {bestDayMetric !== 'exercises' && details.metrics.exercises && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Exercices:</span>
                    <span className="text-yellow-400 font-medium">{details.metrics.exercises}</span>
                  </div>
                )}
                {bestDayMetric !== 'duration' && details.metrics.duration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Durée:</span>
                    <span className="text-yellow-400 font-medium">{details.metrics.duration} min</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Intensité:</span>
                  <span className="text-yellow-400 font-medium">{details.intensity || 5}/10</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Liste des exercices */}
        {details?.exercises && details.exercises.length > 0 && (
          <div className="mt-6 bg-slate-800/30 rounded-lg p-4">
            <div className="text-sm font-medium text-slate-300 mb-3">Exercices de cette séance:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {details.exercises.slice(0, 8).map((exercise, index) => {
                const exerciseName = exercise.nom || exercise.name || 'Exercice inconnu';
                const exerciseReps = exercise.reps || 0;
                return (
                  <div key={index} className="flex justify-between items-center text-sm bg-slate-700/30 rounded px-3 py-2">
                    <span className="text-slate-300">• {exerciseName}</span>
                    <span className="text-yellow-400 font-medium">{exerciseReps} reps</span>
                  </div>
                );
              })}
            </div>
            {details.exercises.length > 8 && (
              <div className="text-xs text-slate-400 mt-3 text-center">
                ... et {details.exercises.length - 8} autres exercices
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top 5 historique */}
      {records.topFive && records.topFive[bestDayMetric] && records.topFive[bestDayMetric].length > 0 && (
        <div className="bg-slate-800/30 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Medal size={18} className="text-yellow-400" />
            Top 5 - {metricLabels[bestDayMetric]}
          </h4>
          <div className="space-y-3">
            {records.topFive[bestDayMetric].map((entry, index) => {
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              const value = entry[bestDayMetric] || 0;
              return (
                <div key={index} className="flex justify-between items-center bg-slate-700/30 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{medals[index]}</span>
                    <div>
                      <div className="text-slate-300 font-medium">
                        {formatDate(entry.date).split(',')[0]}
                      </div>
                      <div className="text-xs text-slate-400">
                        {entry.exercises} exercices • {entry.reps} reps
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">
                      {value}
                      {bestDayMetric === 'duration' && <span className="text-sm ml-1">min</span>}
                      {bestDayMetric === 'calories' && <span className="text-sm ml-1">cal</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Statistiques générales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {records.exercises?.uniqueExercises?.size || 0}
          </div>
          <div className="text-xs text-slate-400">exercices maîtrisés</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {records.streaks?.longest || 0}
          </div>
          <div className="text-xs text-slate-400">série record</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {records.achievements?.length || 0}
          </div>
          <div className="text-xs text-slate-400">succès débloqués</div>
        </div>
      </div>
    </div>
  );
};

export default OverallRecords;