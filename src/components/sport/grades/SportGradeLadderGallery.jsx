import React from 'react';
import { useTranslation } from '../../../utils/translations';
import {
  SPORT_GRADE_IDS,
  SPORT_GRADE_ACCENT,
  tierRowsForGrade,
  hasConditionalTierRequirements
} from '../../../services/xp/sportGradeCatalog';
import { evaluateTierRowConditions } from '../../../services/xp/sportGradeResolution';
import SportGradeEmblem from './SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from './SportGradeIdentity';

/**
 * Galerie des 10 grades — clic → fiche détail (conditions, XP, progression).
 */
export default function SportGradeLadderGallery({
  level,
  progressionGradeId,
  progressionTier,
  onSelectGrade,
  aggregates,
  masteryScore = 0
}) {
  const t = useTranslation();

  const cards = SPORT_GRADE_IDS.map((gradeId) => {
    const tiers = tierRowsForGrade(gradeId);
    const conditional = hasConditionalTierRequirements(gradeId);
    const maxTierRow = tiers.reduce((best, row) => {
      const reached = conditional
        ? evaluateTierRowConditions(row, { level, masteryScore, aggregates }).met
        : level >= row.levelMin;
      return reached ? row : best;
    }, null) || tiers[0];
    const isCurrentGrade = progressionGradeId === gradeId;
    const unlocked = level >= (tiers[0]?.levelMin ?? 1);
    return { gradeId, tiers, maxTierRow, isCurrentGrade, unlocked, conditional };
  });

  return (
    <section>
      <h3 className="text-sm font-semibold text-white mb-1">
        {t('recap.grades.ladderGalleryTitle', 'Parcours des grades')}
      </h3>
      <p className="text-[11px] text-slate-500 mb-4 max-w-2xl">
        {t(
          'recap.grades.ladderGalleryIntro',
          'Chaque grade comporte trois paliers (I, II, III), débloqués par le niveau. Clique une carte pour voir les conditions et ta progression.'
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ gradeId, tiers, maxTierRow, isCurrentGrade, unlocked, conditional }) => {
          const accent = SPORT_GRADE_ACCENT[gradeId] || '#2dd4bf';
          return (
            <button
              key={gradeId}
              type="button"
              onClick={() => onSelectGrade?.(gradeId)}
              className={`flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-black/90 to-[#041a14]/80 text-left transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 ${
                isCurrentGrade
                  ? 'border-emerald-500/50 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500/30'
                  : unlocked
                    ? 'border-[#0F4C5C]/50'
                    : 'border-[#0F4C5C]/25 opacity-75'
              }`}
            >
              <div className="relative px-3 pt-3 pb-2 w-full">
                <SportGradeEmblem gradeId={gradeId} layout="gallery" />
                {isCurrentGrade ? (
                  <span className="absolute top-5 right-5 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                    {t('recap.grades.ladderYouAreHere', 'Tu es ici')}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col px-3 pb-3 w-full">
                <h4 className="text-base font-bold text-white">{sportGradeLabel(gradeId, t)}</h4>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {t('recap.grades.ladderTapDetail', 'Appuyer pour le détail')}
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  {t('recap.grades.ladderLevelFrom', 'Dès le niveau {{n}}', {
                    n: tiers[0]?.levelMin ?? 1
                  })}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tiers.map((row) => {
                    const tierReached = conditional
                      ? evaluateTierRowConditions(row, { level, masteryScore, aggregates }).met
                      : level >= row.levelMin;
                    const isActiveTier =
                      isCurrentGrade && progressionTier === row.tier && tierReached;
                    return (
                      <span
                        key={row.tier}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                          isActiveTier
                            ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                            : tierReached
                              ? 'border-teal-700/50 bg-teal-950/40 text-teal-200/90'
                              : 'border-slate-800 bg-black/40 text-slate-600'
                        }`}
                        style={
                          isActiveTier ? { boxShadow: `0 0 12px -4px ${accent}` } : undefined
                        }
                      >
                        {sportPalierLabel(row.tier, t)} · {row.levelMin}
                      </span>
                    );
                  })}
                </div>
                {maxTierRow && unlocked ? (
                  <p className="mt-auto pt-2 text-[10px] text-slate-600">
                    {t('recap.grades.ladderTierProgress', 'Palier atteint : {{palier}}', {
                      palier: sportPalierLabel(maxTierRow.tier, t)
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
