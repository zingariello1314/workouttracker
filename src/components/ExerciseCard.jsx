import React from 'react';
import { Clock, Target, Zap, Award, Info } from 'lucide-react';
import Badge from './ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
  ExerciseCategories, 
  MuscleGroups, 
  Equipment, 
  Difficulty 
} from '../data/workoutProgramEnhanced';

const ExerciseCard = ({ 
  exercise, 
  isCompleted = false, 
  onToggle, 
  showDetails = true,
  compact = false 
}) => {
  // Fonction pour obtenir la couleur selon la catégorie
  const getCategoryColor = (category) => {
    switch (category) {
      case ExerciseCategories.STRENGTH:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case ExerciseCategories.CARDIO:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case ExerciseCategories.CORE:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case ExerciseCategories.ISOMETRIC:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case ExerciseCategories.FLEXIBILITY:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Fonction pour obtenir la couleur selon le groupe musculaire
  const getMuscleGroupColor = (muscleGroup) => {
    switch (muscleGroup) {
      case MuscleGroups.CHEST:
        return 'bg-blue-500/20 text-blue-300';
      case MuscleGroups.BACK:
        return 'bg-green-500/20 text-green-300';
      case MuscleGroups.SHOULDERS:
        return 'bg-yellow-500/20 text-yellow-300';
      case MuscleGroups.BICEPS:
        return 'bg-pink-500/20 text-pink-300';
      case MuscleGroups.TRICEPS:
        return 'bg-red-500/20 text-red-300';
      case MuscleGroups.LEGS:
        return 'bg-purple-500/20 text-purple-300';
      case MuscleGroups.CORE:
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Fonction pour obtenir l'icône de difficulté
  const getDifficultyIcon = (difficulty) => {
    const stars = '★'.repeat(difficulty || 1) + '☆'.repeat(4 - (difficulty || 1));
    return stars;
  };

  // Fonction pour obtenir le nom français de l'équipement
  const getEquipmentName = (equipment) => {
    switch (equipment) {
      case Equipment.BODYWEIGHT:
        return 'Poids du corps';
      case Equipment.BARBELL:
        return 'Barre';
      case Equipment.DUMBBELL:
        return 'Haltères';
      case Equipment.PARALLELS:
        return 'Parallèles';
      case Equipment.BENCH:
        return 'Banc';
      case Equipment.ELASTIC:
        return 'Élastique';
      case Equipment.WEIGHTED_VEST:
        return 'Gilet lesté';
      case Equipment.HANDLES:
        return 'Poignées';
      default:
        return equipment || 'Non spécifié';
    }
  };

  // Fonction pour obtenir le nom français de la catégorie
  const getCategoryName = (category) => {
    switch (category) {
      case ExerciseCategories.STRENGTH:
        return 'Force';
      case ExerciseCategories.CARDIO:
        return 'Cardio';
      case ExerciseCategories.CORE:
        return 'Core';
      case ExerciseCategories.ISOMETRIC:
        return 'Isométrique';
      case ExerciseCategories.FLEXIBILITY:
        return 'Flexibilité';
      default:
        return 'Général';
    }
  };

  // Fonction pour obtenir le nom français du groupe musculaire
  const getMuscleGroupName = (muscleGroup) => {
    switch (muscleGroup) {
      case MuscleGroups.CHEST:
        return 'Pectoraux';
      case MuscleGroups.BACK:
        return 'Dos';
      case MuscleGroups.SHOULDERS:
        return 'Épaules';
      case MuscleGroups.BICEPS:
        return 'Biceps';
      case MuscleGroups.TRICEPS:
        return 'Triceps';
      case MuscleGroups.LEGS:
        return 'Jambes';
      case MuscleGroups.CORE:
        return 'Core';
      case MuscleGroups.FULL_BODY:
        return 'Corps entier';
      default:
        return muscleGroup || 'Non spécifié';
    }
  };

  if (compact) {
    return (
      <div 
        className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
          isCompleted 
            ? 'bg-green-500/10 border-green-500/30 text-green-300' 
            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{exercise.name}</h4>
            <p className="text-xs text-slate-400 mt-1">{exercise.series}</p>
          </div>
          
          {exercise.category && (
            <Badge className={`ml-2 text-xs ${getCategoryColor(exercise.category)}`}>
              {getCategoryName(exercise.category)}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`transition-all duration-200 ${
      isCompleted 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            {exercise.name}
          </CardTitle>
          
          {onToggle && (
            <button
              onClick={onToggle}
              className={`ml-2 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                isCompleted
                  ? 'bg-green-500 border-green-500'
                  : 'border-slate-500 hover:border-slate-400'
              }`}
            >
              {isCompleted && (
                <svg className="w-4 h-4 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Badges de catégorisation */}
        <div className="flex flex-wrap gap-2 mt-2">
          {exercise.category && (
            <Badge className={getCategoryColor(exercise.category)}>
              {getCategoryName(exercise.category)}
            </Badge>
          )}
          
          {exercise.muscleGroup && (
            <Badge className={getMuscleGroupColor(exercise.muscleGroup)}>
              {getMuscleGroupName(exercise.muscleGroup)}
            </Badge>
          )}
          
          {exercise.difficulty && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              <Award className="w-3 h-3 mr-1" />
              {getDifficultyIcon(exercise.difficulty)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Informations principales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Séries:</span>
            <span className="text-white font-semibold">{exercise.series}</span>
          </div>

          {exercise.equipment && (
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Équipement:</span>
              <span className="text-slate-200">{getEquipmentName(exercise.equipment)}</span>
            </div>
          )}

          {exercise.restTime && (
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Repos:
              </span>
              <span className="text-slate-200">{exercise.restTime}s</span>
            </div>
          )}

          {exercise.tempo && (
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Tempo:
              </span>
              <span className="text-slate-200">{exercise.tempo}</span>
            </div>
          )}
        </div>

        {/* Muscles secondaires */}
        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
          <div className="mt-4">
            <span className="text-slate-300 text-sm font-medium">Muscles secondaires:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {exercise.secondaryMuscles.map((muscle, index) => (
                <Badge 
                  key={index} 
                  className="text-xs bg-slate-700/50 text-slate-300 border-slate-600"
                >
                  {getMuscleGroupName(muscle)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes et technique */}
        {(exercise.notes || exercise.technique) && showDetails && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-300">
                {exercise.technique && (
                  <p className="mb-1"><strong>Technique:</strong> {exercise.technique}</p>
                )}
                {exercise.notes && (
                  <p><strong>Notes:</strong> {exercise.notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progression */}
        {exercise.progression && showDetails && (
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start">
              <Target className="w-4 h-4 text-green-400 mr-2 mt-0.5" />
              <div className="text-sm text-green-300">
                <strong>Progression:</strong> {exercise.progression}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;