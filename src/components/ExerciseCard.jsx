import React, { useMemo } from 'react';
import { Clock, Target, Zap, Award, Info, ChevronRight, Gauge } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { summarizeExerciseSeries } from '../utils/exerciseSeriesSummary';
import Badge from './ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import LoadDifficultyStars from './sport/LoadDifficultyStars';
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
  compact = false,
  onOpenDetail,
  effectiveLoadCoeff
}) => {
  const t = useTranslation();
  const seriesSummary = useMemo(() => summarizeExerciseSeries(exercise), [exercise]);
  // Fonction pour obtenir la couleur selon la catégorie
  /** Pastilles catégorie : nuances bleu / teal (charte Sport) */
  const getCategoryColor = (category) => {
    switch (category) {
      case ExerciseCategories.STRENGTH:
        return 'border border-sky-500/40 bg-sky-950/40 text-sky-200';
      case ExerciseCategories.CARDIO:
        return 'border border-cyan-500/40 bg-cyan-950/35 text-cyan-100';
      case ExerciseCategories.CORE:
        return 'border border-[#0F5C45]/45 bg-[#0F5C45]/20 text-teal-100';
      case ExerciseCategories.ISOMETRIC:
        return 'border border-blue-600/40 bg-blue-950/35 text-blue-200';
      case ExerciseCategories.FLEXIBILITY:
        return 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-100';
      default:
        return 'border border-[#0F4C5C]/50 bg-black text-teal-200';
    }
  };

  const getMuscleGroupColor = (muscleGroup) => {
    switch (muscleGroup) {
      case MuscleGroups.CHEST:
        return 'border border-sky-500/35 bg-sky-950/30 text-sky-200';
      case MuscleGroups.BACK:
        return 'border border-[#0F4C5C]/50 bg-black text-teal-100';
      case MuscleGroups.SHOULDERS:
        return 'border border-cyan-500/35 bg-cyan-950/30 text-cyan-100';
      case MuscleGroups.BICEPS:
        return 'border border-blue-500/35 bg-blue-950/30 text-blue-200';
      case MuscleGroups.TRICEPS:
        return 'border border-indigo-500/35 bg-indigo-950/30 text-indigo-200';
      case MuscleGroups.LEGS:
        return 'border border-teal-600/40 bg-teal-950/25 text-teal-100';
      case MuscleGroups.QUADS:
        return 'border border-[#0F5C45]/45 bg-[#0F5C45]/15 text-teal-50';
      case MuscleGroups.HAMSTRINGS:
        return 'border border-slate-600/50 bg-black text-slate-300';
      case MuscleGroups.CALVES:
        return 'border border-sky-600/35 bg-slate-950/50 text-sky-100';
      case MuscleGroups.CORE:
        return 'border border-[#0F4C5C]/45 bg-black text-teal-200';
      default:
        return 'border border-[#0F4C5C]/40 bg-black text-teal-300';
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
      case MuscleGroups.QUADS:
        return 'Quadriceps';
      case MuscleGroups.HAMSTRINGS:
        return 'Ischio-jambiers';
      case MuscleGroups.CALVES:
        return 'Mollets';
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
        className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
          isCompleted
            ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-100'
            : 'border-[#0F4C5C]/55 bg-black hover:border-[#0F5C45]/65'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white">{exercise.name}</h4>
            <p className="mt-1 text-xs text-teal-700">{exercise.series}</p>
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
    <Card
      variant="sport"
      className={`transition-all duration-200 ${
        onOpenDetail ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40' : ''
      } ${
        isCompleted ? '!border-emerald-500/55 bg-emerald-950/15' : ''
      }`}
      role={onOpenDetail ? 'button' : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
      onClick={onOpenDetail ? () => onOpenDetail(exercise) : undefined}
      onKeyDown={
        onOpenDetail
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail(exercise);
              }
            }
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-white leading-tight flex-1">
            {exercise.name}
          </CardTitle>

          {typeof effectiveLoadCoeff === 'number' && !Number.isNaN(effectiveLoadCoeff) && (
            <div className="flex items-center gap-2 shrink-0">
              <LoadDifficultyStars coeff={effectiveLoadCoeff} className="scale-90" />
              <div className="flex items-center gap-1.5 rounded-lg border border-[#0F4C5C]/50 bg-black px-2.5 py-1">
                <Gauge className="h-4 w-4 text-sky-400" />
                <div className="text-right">
                  <div className="text-[9px] uppercase leading-none text-teal-700">
                    {t('exercisesTab.card.loadShort', 'Diff. charge')}
                  </div>
                  <div className="text-sm font-bold tabular-nums leading-tight text-sky-200">
                    {Math.round(effectiveLoadCoeff * 100) / 100}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {onToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`ml-1 h-6 w-6 shrink-0 rounded-full border-2 transition-all duration-200 ${
                isCompleted
                  ? 'border-emerald-500 bg-emerald-600'
                  : 'border-[#0F4C5C]/60 hover:border-[#0F5C45]/70'
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
            <Badge className="border border-sky-500/40 bg-sky-950/35 text-sky-200">
              <Award className="w-3 h-3 mr-1" />
              {getDifficultyIcon(exercise.difficulty)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Informations principales */}
        <div className="space-y-3">
          {exercise.series && (
            <div className="rounded-lg border border-[#0F4C5C]/50 bg-black p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wide text-teal-700">
                    {t('exercisesTab.card.volume', 'Volume au programme')}
                  </span>
                  <p className="mt-1 break-words font-medium text-white">
                    {seriesSummary.headline || exercise.series}
                  </p>
                  {seriesSummary.detail && (
                    <p className="mt-2 text-xs leading-relaxed text-teal-700/95">{seriesSummary.detail}</p>
                  )}
                </div>
                {onOpenDetail && <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" aria-hidden />}
              </div>
            </div>
          )}

          {(exercise.equipment || exercise.materiel) && (
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 font-medium text-teal-200/90">Équipement:</span>
              <span className="text-right text-teal-100">
                {exercise.equipment ? getEquipmentName(exercise.equipment) : exercise.materiel}
              </span>
            </div>
          )}

          {exercise.restTime && (
            <div className="flex items-center justify-between">
              <span className="flex items-center font-medium text-teal-200/90">
                <Clock className="mr-1 h-4 w-4" />
                Repos:
              </span>
              <span className="text-teal-50">{exercise.restTime}s</span>
            </div>
          )}

          {exercise.tempo && (
            <div className="flex items-center justify-between">
              <span className="flex items-center font-medium text-teal-200/90">
                <Zap className="mr-1 h-4 w-4" />
                Tempo:
              </span>
              <span className="text-teal-50">{exercise.tempo}</span>
            </div>
          )}
        </div>

        {/* Muscles secondaires */}
        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
          <div className="mt-4">
            <span className="text-sm font-medium text-teal-200/90">Muscles secondaires:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {exercise.secondaryMuscles.map((muscle, index) => (
                <Badge
                  key={index}
                  className="border border-[#0F4C5C]/45 bg-black text-xs text-teal-200"
                >
                  {getMuscleGroupName(muscle)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Notes et technique */}
        {(exercise.notes || exercise.technique) && showDetails && (
          <div className="mt-4 rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
            <div className="flex items-start">
              <Info className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
              <div className="text-sm text-teal-100/90">
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

        {onOpenDetail && (
          <p className="mt-3 text-xs text-teal-500">
            {t('exercisesTab.card.openHint', 'Cliquez pour la fiche complète et les réglages.')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;