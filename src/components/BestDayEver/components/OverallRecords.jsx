import React from 'react';
import { Trophy, Target, Clock, Flame, Dumbbell, Calendar, Medal, PartyPopper } from 'lucide-react';

const OverallRecords = ({ 
  records, 
  bestDayMetric, 
  setBestDayMetric, 
  celebrationMode, 
  setCelebrationMode,
  formatDate 
}) => {
  if (!records.overall?.bestDay && !records.bestDaysByMetric) {
    return (
      <div className="text-center py-12">
        <Trophy size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Aucune séance enregistrée pour le moment</p>
      </div>
    );
  }

  const currentBestDay = records.bestDaysByMetric?.[bestDayMetric] || records.overall;
  const { value, date, details } = currentBestDay;

  const metricLabels = {
    reps: 'répétitions totales',
    exercises: 'exercices différents',
    duration: 'minutes d\'entraînement',
    calories: 'calories brûlées'
  };

  const metricIcons = {
    reps: Target,
    exercises: Dumbbell,
    duration: Clock,
    calories: Flame
  };

  const MetricIcon = metricIcons[bestDayMetric];

  return (
    <div className="space-y-6">
      {/* Sélecteur de métrique */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(metricLabels).map((metric) => (
          <button
            key={metric}
            onClick={() => setBestDayMetric(metric)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              bestDayMetric === metric
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            {metricLabels[metric]}
          </button>
        ))}
      </div>

      {/* Meilleur jour principal */}
      <div className="bg-gradient-to-br from-yellow-600/20 via-orange-600/20 to-red-600/20 rounded-xl p-6 border border-yellow-600/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <MetricIcon size={24} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">🏆 Ton Meilleur Jour</h3>
              <p className="text-yellow-200/80">Par {metricLabels[bestDayMetric]}</p>
            </div>
          </div>
          <button
            onClick={() => setCelebrationMode(!celebrationMode)}
            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-all"
          >
            <PartyPopper size={20} className="text-yellow-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{value || 0}</div>
            <div className="text-sm text-slate-300">{metricLabels[bestDayMetric]}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{details?.metrics?.exercises || 0}</div>
            <div className="text-sm text-slate-300">exercices différents</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{details?.intensity || 5}/10</div>
            <div className="text-sm text-slate-300">intensité ressentie</div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-lg font-semibold text-white">{formatDate(date)}</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300 mb-2">Détails de la séance:</div>
            {details?.exercises?.slice(0, 5).map((exercise, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">• {exercise.name}</span>
                <span className="text-yellow-400 font-medium">{exercise.reps} reps</span>
              </div>
            ))}
            {details?.exercises?.length > 5 && (
              <div className="text-xs text-slate-400 mt-2">
                ... et {details.exercises.length - 5} autres exercices
              </div>
            )}
          </div>
        </div>

        {/* Top 5 historique */}
        <div className="bg-slate-800/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Medal size={18} className="text-yellow-400" />
            Top 5 - {metricLabels[bestDayMetric]}
          </h4>
          <div className="space-y-2">
            {records.topFive?.[bestDayMetric]?.map((entry, index) => {
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              return (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{medals[index]}</span>
                    <span className="text-slate-300">{formatDate(entry.date).split(',')[0]}</span>
                  </div>
                  <span className="text-yellow-400 font-medium">{entry.value} {bestDayMetric === 'duration' ? 'min' : bestDayMetric === 'calories' ? 'cal' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-white">{records.exercises?.uniqueExercises.size || 0}</div>
          <div className="text-xs text-slate-400">exercices maîtrisés</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-white">{records.streaks?.longest || 0}</div>
          <div className="text-xs text-slate-400">série record</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-white">{records.achievements?.length || 0}</div>
          <div className="text-xs text-slate-400">succès débloqués</div>
        </div>
      </div>
    </div>
  );
};

export default OverallRecords;