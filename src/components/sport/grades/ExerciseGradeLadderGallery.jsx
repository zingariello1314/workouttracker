import React from 'react';
import { useTranslation } from '../../../utils/translations';
import {
  EXERCISE_MATERIAL_ORDER,
  exerciseMaterialLabelFr,
  formatExerciseListShort,
  groupRowsByMaterialAndTier,
  heroGradeIdForMaterial,
  tiersForMaterial
} from '../../../services/xp/exerciseGradeLadderUtils';
import ExerciseGradeEmblem from './ExerciseGradeEmblem';

/**
 * Parcours Bois → Platine — cartes alignées sur SportGradeLadderGallery.
 */
export default function ExerciseGradeLadderGallery({ rows, onSelectMaterial }) {
  const t = useTranslation();
  const grouped = groupRowsByMaterialAndTier(rows);

  const bestSortIndex = rows?.length
    ? Math.max(...rows.map((r) => r.grade?.sortIndex ?? -1))
    : -1;

  return (
    <section>
      <h3 className="text-sm font-semibold text-white mb-1">
        {t('recap.exerciseGrades.ladderGalleryTitle', 'Parcours des grades exercice')}
      </h3>
      <p className="text-[11px] text-slate-500 mb-4 max-w-2xl">
        {t(
          'recap.exerciseGrades.ladderGalleryIntro',
          'Chaque matériau comporte trois paliers (I, II, III). Clique une carte pour voir les seuils et le récap de tes exercices.'
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXERCISE_MATERIAL_ORDER.map((material) => {
          const tiers = tiersForMaterial(material);
          const minIdx = tiers[0]?.sortIndex ?? 0;
          const unlocked = bestSortIndex >= minIdx;
          const heroId = heroGradeIdForMaterial(material, rows);
          const heroGrade = tiers.find((tier) => tier.id === heroId) || tiers[0];
          const byTier = grouped[material] || { I: [], II: [], III: [] };
          const maxTierReached = tiers.reduce(
            (best, row) => (bestSortIndex >= row.sortIndex ? row : best),
            tiers[0]
          );

          return (
            <button
              key={material}
              type="button"
              onClick={() => onSelectMaterial?.(material)}
              className={`flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-black/90 to-[#041a14]/80 text-left transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 ${
                unlocked ? 'border-[#0F4C5C]/50' : 'border-[#0F4C5C]/25 opacity-75'
              }`}
            >
              <div className="relative px-3 pt-3 pb-2 w-full">
                <ExerciseGradeEmblem
                  gradeId={heroGrade.id}
                  gradeLabel={heroGrade.label}
                  layout="gallery"
                  className="border-0 !max-w-none !shadow-none mx-auto"
                />
              </div>
              <div className="flex flex-1 flex-col px-3 pb-3 w-full">
                <h4 className="text-base font-bold text-white">{exerciseMaterialLabelFr(material)}</h4>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {t('recap.grades.ladderTapDetail', 'Appuyer pour le détail')}
                </p>
                <div className="mt-2 space-y-1 text-[10px] leading-snug text-slate-400">
                  {['I', 'II', 'III'].map((roman) => {
                    const list = formatExerciseListShort(byTier[roman], 4);
                    return (
                      <p key={roman}>
                        <span className="font-semibold text-teal-600/90">
                          {t('recap.exerciseGrades.ladderPalierShort', 'Palier {{n}}', { n: roman })}
                        </span>
                        {list ? (
                          <span className="text-slate-400"> : {list}</span>
                        ) : (
                          <span className="text-slate-600"> : —</span>
                        )}
                      </p>
                    );
                  })}
                </div>
                {maxTierReached && unlocked ? (
                  <p className="mt-auto pt-2 text-[10px] text-slate-600">
                    {t('recap.exerciseGrades.ladderTierReached', 'Palier atteint : {{label}}', {
                      label: maxTierReached.label
                    })}
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
