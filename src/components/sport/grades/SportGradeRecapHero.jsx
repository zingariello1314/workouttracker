import React from 'react';
import { useTranslation } from '../../../utils/translations';
import SportGradeEmblem from './SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from './SportGradeIdentity';

/**
 * Carte Récap unique : grande illustration du grade de progression + grade mérité en texte.
 */
export default function SportGradeRecapHero({
  progressionGradeId,
  progressionTier,
  meritedGradeId,
  meritedTier,
  level
}) {
  const t = useTranslation();
  if (!progressionGradeId) return null;

  const progName = sportGradeLabel(progressionGradeId, t);
  const progPalier = sportPalierLabel(progressionTier, t);
  const merName = sportGradeLabel(meritedGradeId, t);
  const merPalier = sportPalierLabel(meritedTier, t);

  const sameMerited =
    meritedGradeId === progressionGradeId && Number(meritedTier) === Number(progressionTier);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#0F4C5C]/55 bg-gradient-to-br from-black via-[#041a14]/95 to-black shadow-lg shadow-black/50">
      <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-stretch sm:gap-6 sm:p-5">
        <div className="flex shrink-0 justify-center sm:w-[min(42%,300px)] sm:justify-start">
          <SportGradeEmblem gradeId={progressionGradeId} layout="hero" className="sm:max-w-none sm:w-full" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500">
            {t('sport.grades.progressionLabel', 'Progression')}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{progName}</h3>
          <p className="mt-1 text-sm font-medium text-cyan-200/90">{progPalier}</p>
          {level != null ? (
            <p className="mt-1 text-xs tabular-nums text-slate-500">
              {t('sport.grades.levelShort', `Niveau ${level}`, { level })}
            </p>
          ) : null}

          <div className="my-4 h-px w-full bg-[#0F4C5C]/45" />

          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/90">
            {t('sport.grades.meritedLabel', 'Grade mérité')}
          </p>
          {sameMerited ? (
            <p className="mt-1 text-sm text-slate-400">
              {t(
                'recap.grades.meritedSameAsProgression',
                'Identique à ta progression — toutes les conditions de grade sont remplies pour ce palier.'
              )}
            </p>
          ) : (
            <p className="mt-1 text-base font-semibold text-amber-100/95">
              {t('recap.grades.meritedLine', `${merName} · ${merPalier}`, {
                grade: merName,
                palier: merPalier
              })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
