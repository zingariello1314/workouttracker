import React, { useMemo } from 'react';
import { computeBlendedExerciseEffortStars } from '../../utils/exerciseSessionEffortBlend';
import { Gauge, Plus, ChevronRight, Award } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import {
  ExerciseCategories,
  MuscleGroups,
  Equipment
} from '../../data/workoutProgramEnhanced';
import LoadDifficultyStars from './LoadDifficultyStars';
import AnatomyExerciseCardPreview from '../anatomy/AnatomyExerciseCardPreview';

function getCategoryLabel(category, t) {
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
      return typeof category === 'string' ? category : t('exercisesTab.misc.notSpecified', 'Non spécifié');
  }
}

function getMuscleLabel(muscleGroup, t) {
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
      return typeof muscleGroup === 'string' ? muscleGroup : t('exercisesTab.misc.notSpecified', 'Non spécifié');
  }
}

function getEquipmentLabel(equipment, t) {
  if (!equipment || typeof equipment !== 'string') return '';
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
    default:
      return equipment;
  }
}

/**
 * Carte banque alignée sur le layout « étirements » (aperçu 3D, tags, primaires / secondaires).
 */
export default function SportBankExerciseCard({
  exercise,
  onOpenDetail,
  effectiveLoadCoeff,
  hasRecordedMax = false,
  maxRecord = null,
  onRequestAddToProgram,
  showAddButton = false,
  /** Pour étoiles / difficulté fusionnée (séances, ressenti fiche…). */
  workoutData = null
}) {
  const t = useTranslation();

  const effortBlend = useMemo(() => {
    if (!workoutData || !exercise) return null;
    try {
      return computeBlendedExerciseEffortStars(workoutData, exercise);
    } catch {
      return null;
    }
  }, [workoutData, exercise]);

  const open = () => onOpenDetail?.(exercise);

  const diffNum =
    typeof exercise?.difficulty === 'number' && exercise.difficulty >= 1 && exercise.difficulty <= 4
      ? exercise.difficulty
      : null;

  const categoryStr = getCategoryLabel(exercise?.category, t);
  const muscleStr = getMuscleLabel(exercise?.muscleGroup, t);
  const eqStr = exercise?.equipment
    ? getEquipmentLabel(exercise.equipment, t) || exercise.equipment
    : exercise?.materiel || '';

  const coeffSafe =
    typeof effectiveLoadCoeff === 'number' && !Number.isNaN(effectiveLoadCoeff)
      ? effectiveLoadCoeff
      : 1;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="group text-left rounded-xl border-2 border-[#0F4C5C]/85 bg-black shadow-lg shadow-black/40 hover:border-[#0F5C45]/80 hover:shadow-[0_0_24px_-8px_rgba(15,92,69,0.45)] transition-all duration-200 p-4 grid h-full min-h-[32rem] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45
        grid-rows-[auto_auto_auto_300px_auto_auto_minmax(3.5rem,1fr)_auto]
        gap-3"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#0F4C5C]/35 pb-3 min-h-[3.75rem] row-start-1">
        <div className="min-w-0 flex-1 flex flex-col justify-start gap-1">
          <h4 className="text-sm font-semibold text-white leading-snug tracking-tight line-clamp-2 min-h-[2.5rem]">
            {exercise.name}
          </h4>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1" title="Étoiles = difficulté estimée (séances / ressenti / auto) lorsque tes données sont disponibles">
          <LoadDifficultyStars
            coeff={coeffSafe}
            starCountOverride={
              effortBlend?.displayStars != null ? effortBlend.displayStars : undefined
            }
            className="scale-90"
          />
          <div
            className="flex items-center gap-1 rounded-md border border-[#0F4C5C]/50 bg-black px-2 py-0.5"
            title="Indice charge calendrier (réglage fiche)"
          >
            <Gauge className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-[10px] font-bold tabular-nums text-sky-200">
              {Math.round(coeffSafe * 100) / 100}
            </span>
          </div>
        </div>
      </div>

      <div className="row-start-2 min-h-[1.875rem] flex flex-col justify-start" data-no-drag-scroll>
        {showAddButton && onRequestAddToProgram ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestAddToProgram({ kind: 'exercise', exercise });
            }}
            className="inline-flex w-fit max-w-full items-center gap-1 rounded-md border border-[#0F5C45]/55 bg-[#0F5C45]/18 px-2 py-0.5 text-[10px] font-medium leading-tight text-teal-100 transition hover:bg-[#0F5C45]/35 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45"
          >
            <Plus className="h-3 w-3 shrink-0" />
            Ajouter au programme
          </button>
        ) : (
          <span className="invisible inline-block text-[10px] py-0.5" aria-hidden>
            Ajouter au programme
          </span>
        )}
      </div>

      <div className="row-start-3 flex min-h-[4.25rem] shrink-0 flex-wrap content-start items-start gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-md border border-sky-500/35 bg-sky-950/35 text-sky-200">
          {categoryStr}
        </span>
        {exercise.trainingDiscipline && (
          <span className="px-2 py-0.5 rounded-md border border-[#0F5C45]/45 bg-[#0F5C45]/15 text-teal-100 capitalize">
            {exercise.trainingDiscipline}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md border border-[#0F4C5C]/50 bg-black text-teal-200/90">
          {muscleStr}
        </span>
        {diffNum !== null && (
          <span className="inline-flex items-center gap-1 text-teal-700 tabular-nums">
            <Award className="h-3 w-3 shrink-0 text-amber-400/90" />
            Niv. {diffNum}/4
          </span>
        )}
        {hasRecordedMax && (
          <span className="rounded-md border border-emerald-500/40 bg-emerald-950/25 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-emerald-300">
            Max enregistré
          </span>
        )}
      </div>

      <div className="row-start-4 flex h-[300px] w-full min-h-0 shrink-0 overflow-hidden [&>*]:min-h-0">
        <AnatomyExerciseCardPreview exercise={exercise} previewLayout="gridFill" />
      </div>

      {(exercise.primaryMuscles?.length > 0 || exercise.secondaryMuscles?.length > 0) ? (
        <div className="row-start-5 space-y-1 min-h-[2.75rem]">
          {exercise.primaryMuscles?.length > 0 && (
            <div className="text-[10px] text-teal-600/90 leading-snug" title={exercise.primaryMuscles.join(', ')}>
              <span className="text-teal-800 uppercase tracking-wide font-medium">Primaires · </span>
              <span className="text-teal-100/85">
                {exercise.primaryMuscles.slice(0, 4).join(' · ')}
                {exercise.primaryMuscles.length > 4 ? '…' : ''}
              </span>
            </div>
          )}
          {exercise.secondaryMuscles?.length > 0 && (
            <div className="text-[10px] text-slate-500 leading-snug line-clamp-2" title={exercise.secondaryMuscles.join(', ')}>
              <span className="text-slate-600 uppercase tracking-wide font-medium">Secondaires · </span>
              {exercise.secondaryMuscles.slice(0, 3).join(' · ')}
              {exercise.secondaryMuscles.length > 3 ? '…' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="row-start-5 min-h-[2.75rem]" aria-hidden />
      )}

      <div className="row-start-6 flex min-h-[2.85rem] flex-col justify-start gap-2 border-t border-[#0F4C5C]/30 pt-3">
        {eqStr ? (
          <div className="flex items-start justify-between gap-2 text-[11px]">
            <span className="font-medium text-teal-800 shrink-0">Équipement</span>
            <span className="text-right text-teal-100/85 leading-snug">{eqStr}</span>
          </div>
        ) : (
          <div className="text-[11px] text-transparent select-none pointer-events-none" aria-hidden>
            —
          </div>
        )}
        {hasRecordedMax && maxRecord?.recordedAt ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 px-2 py-1 text-[10px] text-emerald-200">
            Dernier max : {new Date(maxRecord.recordedAt).toLocaleDateString('fr-FR')}
          </div>
        ) : (
          <div className="min-h-[1.35rem]" aria-hidden />
        )}
      </div>

      <p className="row-start-7 text-[11px] text-teal-100/75 line-clamp-3 leading-relaxed border-t border-[#0F4C5C]/30 pt-3 min-h-[3.75rem]">
        {exercise.notes || exercise.technique || t('exercisesTab.card.noNotesShort', 'Ouverture fiche pour détails et technique.')}
      </p>

      <p className="row-start-8 flex items-center gap-1 text-[10px] text-teal-600/90">
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        {t('exercisesTab.card.openHint', 'Cliquez pour la fiche complète et les réglages.')}
      </p>
    </div>
  );
}
