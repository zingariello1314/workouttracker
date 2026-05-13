import React from 'react';
import { useTranslation } from '../../../utils/translations';

const COACH_PILLAR_ICONS = {
  sport: '◆',
  body: '◎',
  nutrition: '◇',
  combined: '✦'
};

function coachPillarGlyph(pillar) {
  return COACH_PILLAR_ICONS[pillar] || COACH_PILLAR_ICONS.combined;
}

/**
 * Panneau « coach transversal » Récap (~28 j) : piliers entraînement / corps / nutrition,
 * cartes priorisées, trous de données, disclaimer — données fournies par le parent (un seul hook).
 *
 * @param {{ synthesisCoach: object }} props — retour de `useRecapSynthesisCoach` depuis `RecapTab`.
 */
export default function RecapCrossCoachPanel({ synthesisCoach }) {
  const t = useTranslation();

  if (!synthesisCoach) return null;

  const {
    aggregate,
    engine: coachEngine,
    nutritionLoading: coachNutritionLoading,
    garminLoading: coachGarminLoading,
    trainingLineParams,
    bodyLine: coachBodyLine,
    nutritionLineKey: coachNutritionLineKey
  } = synthesisCoach;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-900/50 bg-gradient-to-br from-[#050a0f] via-black to-[#061410] shadow-[0_0_36px_-14px_rgba(16,185,129,0.35)]">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-emerald-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-teal-700/10 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-emerald-500/35 bg-emerald-950/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/95">
            {t('recap.crossCoach.badge')}
          </span>
          {coachNutritionLoading ? (
            <span className="text-[10px] text-amber-200/85">{t('recap.crossCoach.loadingChip')}</span>
          ) : null}
          {coachGarminLoading ? (
            <span className="text-[10px] text-sky-200/85">{t('recap.crossCoach.loadingGarminChip')}</span>
          ) : null}
        </div>

        <h2 className="mt-3 text-lg font-bold tracking-tight text-white sm:text-xl">{t('recap.crossCoach.title')}</h2>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-teal-200/75 sm:text-sm">{t('recap.crossCoach.subtitle')}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/55 px-3 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {COACH_PILLAR_ICONS.sport} {t('recap.crossCoach.pillar.training')}
            </div>
            <p className="mt-2 text-xs leading-snug text-teal-100/90">
              {t('recap.crossCoach.pillar.trainingLine', trainingLineParams)}
            </p>
            {Number(trainingLineParams.distinct ?? 0) > 0 ? (
              <p className="mt-1 text-[11px] leading-snug text-teal-200/70">
                {t('recap.crossCoach.pillar.distinctExercisesLine', {
                  n: String(trainingLineParams.distinct)
                })}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/55 px-3 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {COACH_PILLAR_ICONS.body} {t('recap.crossCoach.pillar.body')}
            </div>
            <p className="mt-2 text-xs leading-snug text-teal-100/90">{t(coachBodyLine.k, coachBodyLine.p)}</p>
          </div>
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/55 px-3 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {COACH_PILLAR_ICONS.nutrition} {t('recap.crossCoach.pillar.nutrition')}
            </div>
            <p className="mt-2 text-xs leading-snug text-teal-100/90">
              {coachNutritionLineKey === 'recap.crossCoach.pillar.nutritionLine.days'
                ? t(coachNutritionLineKey, {
                    n: String(aggregate.nutrition?.daysWithLoggedMeals28 ?? 0)
                  })
                : t(coachNutritionLineKey)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-teal-200/90">
            {t('recap.crossCoach.remarksHeading')}
          </h3>
          <div className="mt-2 space-y-2">
            {coachEngine.cards.map((card) => {
              const tpl = `recap.crossCoach.insight.${card.templateKey}`;
              const text = t(tpl, card.payload || {});
              return (
                <div
                  key={card.id}
                  className="flex gap-3 rounded-xl border border-teal-800/35 bg-teal-950/20 px-3 py-2.5"
                >
                  <span className="mt-0.5 shrink-0 text-xs text-teal-400/90" aria-hidden>
                    {coachPillarGlyph(card.pillar)}
                  </span>
                  <p className="text-xs leading-relaxed text-slate-100/95">{text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {coachEngine.dataGaps?.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-950/25 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
              {t('recap.crossCoach.gapsTitle')}
            </div>
            <ul className="mt-1 list-disc pl-5 text-[11px] text-amber-100/85">
              {coachEngine.dataGaps.map((g) => (
                <li key={g.code}>{t(`recap.crossCoach.gap.${g.code}`) || g.code}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-[10px] leading-relaxed text-slate-500">{t('recap.crossCoach.disclaimer')}</p>
      </div>
    </section>
  );
}
