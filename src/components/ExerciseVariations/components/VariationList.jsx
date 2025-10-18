import React from 'react';
import { Edit3, Trash2, Copy, Star, Eye, Play } from 'lucide-react';

const VariationList = ({ 
  variations, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewDetails,
  getDifficultyInfo,
  getCategoryInfo,
  getUserProgressStatus 
}) => {
  if (variations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💪</div>
        <h3 className="text-xl font-semibold text-white mb-2">Aucune variation trouvée</h3>
        <p className="text-slate-400">Ajoutez votre première variation ou modifiez les filtres</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {variations.map((variation) => {
        const difficultyInfo = getDifficultyInfo(variation.difficulty);
        const categoryInfo = getCategoryInfo(variation.category);
        const progressStatus = getUserProgressStatus(variation.id);

        return (
          <div key={variation.id} className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1 line-clamp-2">{variation.name}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${difficultyInfo.color}-500/20 text-${difficultyInfo.color}-400`}>
                    {difficultyInfo.icon} {difficultyInfo.label}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                    {categoryInfo.icon} {categoryInfo.label}
                  </span>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= (variation.rating || 0) ? 'text-yellow-400 fill-current' : 'text-slate-600'}
                  />
                ))}
              </div>
            </div>

            {/* Muscle groups */}
            {variation.muscleGroups && variation.muscleGroups.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {variation.muscleGroups.slice(0, 3).map((muscle) => (
                    <span key={muscle} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                      {muscle}
                    </span>
                  ))}
                  {variation.muscleGroups.length > 3 && (
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded">
                      +{variation.muscleGroups.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {variation.description && (
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                {variation.description}
              </p>
            )}

            {/* Equipment */}
            {variation.equipment && (
              <div className="mb-3">
                <span className="text-xs text-slate-500">Équipement: </span>
                <span className="text-xs text-slate-300">{variation.equipment}</span>
              </div>
            )}

            {/* Progress indicator */}
            {progressStatus && (
              <div className="mb-3">
                <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                  progressStatus.status === 'mastered' ? 'bg-green-500/20 text-green-400' :
                  progressStatus.status === 'learning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {progressStatus.status === 'mastered' ? '✅' : 
                   progressStatus.status === 'learning' ? '📚' : '🆕'}
                  {progressStatus.label}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewDetails(variation)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                  title="Voir les détails"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => onEdit(variation)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                  title="Modifier"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onDuplicate(variation)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all"
                  title="Dupliquer"
                >
                  <Copy size={14} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDelete(variation.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
                  title="Commencer l'exercice"
                >
                  <Play size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariationList;