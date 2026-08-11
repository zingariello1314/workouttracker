import React, { useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import {
  getSportGradeDescription,
  getExerciseMaterialDescription,
  getExerciseGradeDescription
} from '../../../services/xp/gradeDescriptionCopy';

/**
 * Description sous l’illustration du grade : symbolique + conditions de déblocage.
 * @param {'sport' | 'exercise-material' | 'exercise-grade'} variant
 * @param {string} [sportGradeId]
 * @param {string} [exerciseMaterial]
 * @param {number} [exerciseSortIndex]
 */
export default function GradeMechanicsIntro({
  variant = 'sport',
  sportGradeId,
  exerciseMaterial,
  exerciseSortIndex,
  className = ''
}) {
  const t = useTranslation();

  const copy = useMemo(() => {
    if (variant === 'exercise-material' && exerciseMaterial) {
      return getExerciseMaterialDescription(exerciseMaterial, t);
    }
    if (variant === 'exercise-grade' && exerciseSortIndex != null) {
      return getExerciseGradeDescription(exerciseSortIndex, t);
    }
    if (sportGradeId) {
      return getSportGradeDescription(sportGradeId, t);
    }
    return null;
  }, [variant, sportGradeId, exerciseMaterial, exerciseSortIndex, t]);

  if (!copy?.flavor) return null;

  return (
    <div
      className={`mt-3 space-y-2.5 rounded-xl border border-[#0F4C5C]/45 bg-black/70 px-3 py-2.5 text-left text-[11px] leading-relaxed text-slate-400 ${className}`}
    >
      <p className="text-slate-300">{copy.flavor}</p>
      {copy.tiersHint ? <p>{copy.tiersHint}</p> : null}
      {copy.unlockTitle && copy.unlockBody ? (
        <div className="space-y-1 border-t border-[#0F4C5C]/35 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
            {copy.unlockTitle}
          </p>
          <p>{copy.unlockBody}</p>
        </div>
      ) : null}
      {copy.highlight ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-2 py-1.5 text-amber-100/90">
          {copy.highlight}
        </p>
      ) : null}
    </div>
  );
}
