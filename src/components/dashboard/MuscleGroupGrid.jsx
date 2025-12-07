import React, { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * MuscleGroupGrid Component - Displays a grid of muscle groups with progress
 * 
 * @param {Object} props
 * @param {Array} props.muscleGroups - Array of muscle group objects
 * @param {Function} props.onCreateNew - Callback when "Create New" is clicked
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 */
const MuscleGroupGrid = ({
  muscleGroups = [],
  onCreateNew,
  loading = false,
  error = null
}) => {
  const [imageErrors, setImageErrors] = useState({});

  // Handle image load errors
  const handleImageError = (muscleId) => {
    setImageErrors(prev => ({ ...prev, [muscleId]: true }));
  };

  // Calculate progress percentage
  const getProgressPercent = (current, target) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Get progress color class
  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement des groupes musculaires..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} type="error" />;
  }

  return (
    <div className="muscle-groups-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Existing muscle groups */}
      {muscleGroups.map((muscle) => {
        const progressPercent = getProgressPercent(muscle.current, muscle.target);
        const progressColor = getProgressColor(progressPercent);

        return (
          <div
            key={muscle.id}
            className="muscle-group-item bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors group"
          >
            {/* Image */}
            <div className="muscle-group-icon mb-3 flex items-center justify-center h-24">
              {muscle.imageData && !imageErrors[muscle.id] ? (
                <img
                  src={muscle.imageData}
                  alt={muscle.name}
                  className="w-full h-full object-contain rounded"
                  loading="lazy"
                  onError={() => handleImageError(muscle.id)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded">
                  <TrendingUp size={32} className="text-orange-400" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="muscle-group-name text-center text-white font-medium mb-2">
              {muscle.name}
            </div>

            {/* Progress */}
            <div className="muscle-group-progress">
              <div className="progress-text text-center text-sm text-gray-400 mb-2">
                <span className="current text-white">{muscle.current}</span>
                <span className="separator mx-1">/</span>
                <span className="target">{muscle.target}</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-bg h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`progress-bar-fill h-full ${progressColor} transition-all duration-300`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="progress-percent text-xs text-gray-500 mt-1 block text-center">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Create New Card */}
      <div
        className="muscle-group-item create-new-item bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors cursor-pointer flex flex-col items-center justify-center"
        onClick={onCreateNew}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onCreateNew();
          }
        }}
        aria-label="Créer un nouveau groupe musculaire"
      >
        <div className="muscle-group-icon mb-3">
          <div className="plus-icon text-orange-400">
            <Plus size={48} />
          </div>
        </div>
        <div className="muscle-group-name text-white font-medium">Nouveau</div>
        <div className="muscle-group-reps text-gray-400 text-sm">Muscle</div>
      </div>

      {/* Empty State */}
      {muscleGroups.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-400 mb-4">
            Aucun groupe musculaire créé
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Créer votre premier groupe
          </button>
        </div>
      )}
    </div>
  );
};

// Memoize for performance (Phase 6)
export default React.memo(MuscleGroupGrid);
