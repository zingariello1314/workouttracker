import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

/**
 * ComparisonMetrics Component - Displays today vs yesterday comparisons
 * 
 * @param {Object} props
 * @param {Object} props.comparisons - Comparison data
 */
const ComparisonMetrics = ({
  comparisons = null
}) => {
  if (!comparisons) {
    return (
      <div className="comparison-metrics bg-gray-800 border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400 text-center">Aucune donnée de comparaison disponible</p>
      </div>
    );
  }

  const { general, exercises, overallClass } = comparisons;

  // Get arrow icon based on change class
  const getArrowIcon = (changeClass) => {
    switch (changeClass) {
      case 'positive':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'negative':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-gray-500" />;
    }
  };

  // Get color class based on metric class
  const getColorClass = (metricClass) => {
    switch (metricClass) {
      case 'improvement':
        return 'text-green-500';
      case 'decline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get overall badge
  const getOverallBadge = () => {
    const badges = {
      excellent: { text: 'Excellent', color: 'bg-green-500', icon: '🔥' },
      good: { text: 'Bien', color: 'bg-blue-500', icon: '👍' },
      average: { text: 'Moyen', color: 'bg-yellow-500', icon: '⚡' },
      'needs-work': { text: 'À améliorer', color: 'bg-orange-500', icon: '💪' }
    };
    return badges[overallClass] || badges.average;
  };

  const badge = getOverallBadge();

  return (
    <div className="comparison-metrics bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-orange-400">
          Comparaison Aujourd'hui vs Hier
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 ${badge.color} rounded-full`}>
          <span>{badge.icon}</span>
          <span className="text-white text-sm font-bold">{badge.text}</span>
        </div>
      </div>

      {/* General Metrics */}
      <div className="general-metrics mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Métriques Générales</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Volume */}
          <div className="metric-card bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Volume</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">{general.volume.current}</span>
              {getArrowIcon(general.volume.changeClass)}
            </div>
            <div className="text-xs text-gray-500">
              Hier: {general.volume.previous}
            </div>
            <div className={`text-xs font-bold mt-1 ${getColorClass(general.volume.class)}`}>
              {general.volume.change}
            </div>
          </div>

          {/* Intensity */}
          <div className="metric-card bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Intensité</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">{general.intensity.current}</span>
              {getArrowIcon(general.intensity.changeClass)}
            </div>
            <div className="text-xs text-gray-500">
              Hier: {general.intensity.previous}
            </div>
            <div className={`text-xs font-bold mt-1 ${getColorClass(general.intensity.class)}`}>
              {general.intensity.change}
            </div>
          </div>

          {/* Rest Time */}
          <div className="metric-card bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Temps de repos</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">{general.restTime.current}</span>
              {getArrowIcon(general.restTime.changeClass)}
            </div>
            <div className="text-xs text-gray-500">
              Hier: {general.restTime.previous}
            </div>
            <div className={`text-xs font-bold mt-1 ${getColorClass(general.restTime.class)}`}>
              {general.restTime.change}
            </div>
          </div>

          {/* Duration */}
          <div className="metric-card bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Durée</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">{general.duration.current}</span>
              {getArrowIcon(general.duration.changeClass)}
            </div>
            <div className="text-xs text-gray-500">
              Hier: {general.duration.previous}
            </div>
            <div className={`text-xs font-bold mt-1 ${getColorClass(general.duration.class)}`}>
              {general.duration.change}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Exercise Comparisons */}
      {exercises && exercises.length > 0 && (
        <div className="exercise-comparisons">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Par Exercice</h4>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={index}
                className="exercise-row bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{exercise.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{exercise.name}</div>
                    <div className="text-xs text-gray-500">
                      Hier: {exercise.previous}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{exercise.current}</div>
                    <div className={`text-xs font-bold ${getColorClass(exercise.class)}`}>
                      {exercise.change}
                    </div>
                  </div>
                  {getArrowIcon(exercise.changeClass)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Award className="text-orange-400 flex-shrink-0" size={20} />
          <div className="text-sm text-gray-300">
            <span className="font-bold text-orange-400">Résumé: </span>
            {overallClass === 'excellent' && 'Performance exceptionnelle ! Continuez sur cette lancée.'}
            {overallClass === 'good' && 'Bonne progression. Quelques points à améliorer.'}
            {overallClass === 'average' && 'Performance stable. Essayez de pousser un peu plus.'}
            {overallClass === 'needs-work' && 'Il y a de la marge de progression. Concentrez-vous sur vos points faibles.'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize for performance (Phase 6)
export default React.memo(ComparisonMetrics);
