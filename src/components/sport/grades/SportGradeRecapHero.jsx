import React from 'react';
import { useTranslation } from '../../../utils/translations';
import SportGradeEmblem from './SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from './SportGradeIdentity';
import SportGradeXpInsights from './SportGradeXpInsights';

/**
 * Carte Récap unique : grande illustration du grade de progression + grade mérité en texte.
 */
export default function SportGradeRecapHero({
  progressionGradeId,
  progressionTier,
  meritedGradeId,
  meritedTier,
  level,
  totalXP,
  dailyInsights
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
    <section className="rb-hero">
      <div>
        <div className="rb-ph">
          <SportGradeEmblem gradeId={progressionGradeId} layout="hero" className="sm:max-w-none sm:w-full" />
        </div>

        <div>
          <div className="hh">
            <div>
              <p className="eb">{t('sport.grades.progressionLabel', 'Progression')}</p>
              <h3>{progName}</h3>
              <span className="pal">{progPalier}</span>
            </div>
            {level != null ? (
              <p className="rb-lvn">
                <b>{level}</b>
                <span>{t('sport.grades.levelWord', 'Niveau')}</span>
              </p>
            ) : null}
          </div>

          <div className="bl">
            <p className="lb2">{t('sport.grades.meritedLabel', 'Grade mérité')}</p>
            {sameMerited ? (
              <p>
                {t(
                  'recap.grades.meritedSameAsProgression',
                  'Identique à ta progression — toutes les conditions de grade sont remplies pour ce palier.'
                )}
              </p>
            ) : (
              <p>
                {t('recap.grades.meritedLine', `${merName} · ${merPalier}`, {
                  grade: merName,
                  palier: merPalier
                })}
              </p>
            )}
          </div>
          <SportGradeXpInsights dailyInsights={dailyInsights} totalXP={totalXP} />
        </div>
      </div>
    </section>
  );
}
