import React from 'react';
import { useTranslation } from '../../../utils/translations';
import {
  SPORT_GRADE_IDS,
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
      <div className="sh">
        <h2>{t('recap.grades.ladderGalleryTitle', 'Parcours des grades')}</h2>
      </div>
      <p className="sub">
        {t(
          'recap.grades.ladderGalleryIntro',
          'Chaque grade comporte trois paliers (I, II, III), débloqués par le niveau. Clique une carte pour voir les conditions et ta progression.'
        )}
      </p>
      <div className="ggrid">
        {cards.map(({ gradeId, tiers, maxTierRow, isCurrentGrade, unlocked, conditional }) => {
          return (
            <button
              key={gradeId}
              type="button"
              onClick={() => onSelectGrade?.(gradeId)}
              className={`gc ${isCurrentGrade ? 'here' : ''} ${unlocked ? '' : 'lock'}`}
            >
              <div className="relative">
                <SportGradeEmblem gradeId={gradeId} layout="gallery" />
                {isCurrentGrade ? (
                  <span className="here-t">
                    {t('recap.grades.ladderYouAreHere', 'Tu es ici')}
                  </span>
                ) : null}
              </div>
              <div>
                <h4>{sportGradeLabel(gradeId, t)}</h4>
                <p className="hn">
                  {t('recap.grades.ladderTapDetail', 'Appuyer pour le détail')}
                </p>
                <p className="lv2">
                  {t('recap.grades.ladderLevelFrom', 'Dès le niveau {{n}}', {
                    n: tiers[0]?.levelMin ?? 1
                  })}
                </p>
                <div className="pl">
                  {tiers.map((row) => {
                    const tierReached = conditional
                      ? evaluateTierRowConditions(row, { level, masteryScore, aggregates }).met
                      : level >= row.levelMin;
                    const isActiveTier =
                      isCurrentGrade && progressionTier === row.tier && tierReached;
                    return (
                      <span
                        key={row.tier}
                        className={isActiveTier ? 'cur' : tierReached ? '' : 'lk'}
                      >
                        {sportPalierLabel(row.tier, t)} · {row.levelMin}
                      </span>
                    );
                  })}
                </div>
                {maxTierRow && unlocked ? (
                  <p className="pa">
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
