import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { buildAssessmentChartSeries, getLatestWeightSnapshot } from '../../../utils/sport/recapAssessmentSeries';
import { normalizeProfileQuestionnaire } from '../../../features/profileQuestionnaire/schema';
import DenseDailyLineChart from '../charts/DenseDailyLineChart';
import { useRecapSynthesisCoach } from '../../../hooks/useRecapSynthesisCoach';

const CHART_DAYS = 84;

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
 * Bloc Récap : synthèse unifiée (coach ~28 j + profil/niveau), courbes poids/reps, horizons.
 * @param {object} props.assessment — résultat de computeRecapUserAssessment (calculé par le parent pour éviter le double passage).
 */
const RecapUserAssessmentPanel = ({
  assessment,
  snapshot,
  profileQuestionnaireRaw,
  activeProgram,
  currentUser
}) => {
  const t = useTranslation();
  const [quizOpen, setQuizOpen] = useState(false);

  const synthesisCoach = useRecapSynthesisCoach({
    snapshot,
    assessment,
    activeProgram: activeProgram ?? null,
    profileQuestionnaireRaw
  });

  const {
    aggregate,
    engine: coachEngine,
    nutritionLoading: coachNutritionLoading,
    garminLoading: coachGarminLoading,
    trainingLineParams,
    bodyLine: coachBodyLine,
    nutritionLineKey: coachNutritionLineKey
  } = synthesisCoach;

  const chartBundle = useMemo(() => buildAssessmentChartSeries(snapshot, CHART_DAYS), [snapshot]);

  const bodySnap = useMemo(() => getLatestWeightSnapshot(snapshot?.progressEntries), [snapshot?.progressEntries]);
  const qq = useMemo(
    () => normalizeProfileQuestionnaire(profileQuestionnaireRaw || null),
    [profileQuestionnaireRaw]
  );
  const bodyFatQuiz = qq.answers?.bodyFatPercentEstimate;

  const username = currentUser?.username || t('recap.assessment.userFallback');

  const {
    journeyStartYmd,
    tenureDays,
    window28,
    weightedDays28,
    volumeKgRepsSum28,
    avgKgRepsPerWeightedDay28,
    totalReps28,
    avgRepsPerStrengthDay28,
    activeDays28,
    expectedSessionsOver28,
    regularityScore,
    programAdherenceDetail,
    programCompletion28,
    avgExerciseDifficulty,
    level0to100,
    tier,
    quiz,
    suggestions,
    predictions,
    disclaimers,
    insights,
    lifetimeReps,
    dataMaturity,
    sessionLoadAlignment28
  } = assessment;

  const sla = sessionLoadAlignment28 || {
    avgScore0to100: null,
    sessionDaysScored: 0,
    sessionDaysWithPlan: 0,
    seriesOverrideDays28: 0,
    seriesOverrideExerciseTouches28: 0
  };

  const shortTerm = insights?.shortTerm || [];
  const mediumTerm = insights?.mediumTerm || [];
  const longTerm = insights?.longTerm || [];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#0F4C5C]/70 bg-gradient-to-br from-black via-[#050d12] to-black shadow-[0_0_40px_-12px_rgba(15,92,69,0.45)]">
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#0F5C45]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-teal-600/8 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#0F4C5C]/60 bg-[#041a14]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300/90">
                {t('recap.assessment.badge')}
              </span>
              <span className="rounded-md border border-emerald-500/35 bg-emerald-950/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/95">
                {t('recap.crossCoach.badge')}
              </span>
              {dataMaturity > 0.35 && (
                <span className="rounded-md border border-emerald-500/25 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-200/90">
                  {t('recap.assessment.maturity', { pct: Math.round(dataMaturity * 100) })}
                </span>
              )}
              {coachNutritionLoading ? (
                <span className="text-[10px] text-amber-200/85">{t('recap.crossCoach.loadingChip')}</span>
              ) : null}
              {coachGarminLoading ? (
                <span className="text-[10px] text-sky-200/85">{t('recap.crossCoach.loadingGarminChip')}</span>
              ) : null}
            </div>
            <h2 className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">
              {t('recap.assessment.title')}
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-teal-200/75 sm:text-sm">
              {t('recap.assessment.subtitle')}
            </p>

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

            <div className="my-8 border-t border-[#0F4C5C]/40" />

            <div className="flex flex-wrap items-stretch gap-2">
              <div className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border border-[#0F4C5C]/50 bg-black/50 px-3 py-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#0F5C45]/40 bg-[#0a1812] text-sm font-bold text-emerald-300">
                  {String(username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    {t('recap.assessment.identity')}
                  </div>
                  <div className="truncate text-sm font-semibold text-white">{username}</div>
                </div>
              </div>

              <div className="flex min-w-[120px] flex-1 flex-col justify-center rounded-xl border border-[#0F4C5C]/50 bg-black/40 px-3 py-2.5">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                  {t('recap.assessment.latestWeight')}
                </span>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {bodySnap?.weightKg != null ? `${bodySnap.weightKg} kg` : '—'}
                </span>
                {bodySnap?.dateYmd && (
                  <span className="text-[10px] text-slate-500">{bodySnap.dateYmd}</span>
                )}
              </div>

              <div className="flex min-w-[120px] flex-1 flex-col justify-center rounded-xl border border-[#0F4C5C]/50 bg-black/40 px-3 py-2.5">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                  {t('recap.assessment.bodyFat')}
                </span>
                <span className="text-sm font-semibold tabular-nums text-white">
                  {bodySnap?.bodyFat != null
                    ? `${bodySnap.bodyFat} %`
                    : bodyFatQuiz != null
                      ? `~${bodyFatQuiz} % (${t('recap.assessment.quizEstimate')})`
                      : '—'}
                </span>
              </div>

              <div className="flex min-w-[100px] flex-1 flex-col justify-center rounded-xl border border-[#0F4C5C]/50 bg-black/40 px-3 py-2.5">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                  {t('recap.assessment.lifetimeReps')}
                </span>
                <span className="text-sm font-semibold tabular-nums text-teal-100">
                  {lifetimeReps.toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center lg:items-end">
            <div
              className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-[#0F5C45]/50 bg-gradient-to-b from-[#0c2420] to-black shadow-inner shadow-black/60"
              style={{
                boxShadow: '0 0 32px rgba(20, 184, 166, 0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
              }}
            >
              <span className="text-4xl font-bold tabular-nums leading-none text-white">{level0to100}</span>
              <span className="mt-1 text-center text-[10px] font-medium leading-tight text-emerald-300/95">
                {tier}
              </span>
            </div>
            <p className="mt-2 max-w-[11rem] text-center text-[10px] leading-snug text-slate-500 lg:text-right">
              {t('recap.assessment.scoreHint')}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-200/80">
              {t('recap.assessment.chartWeight')}
            </h3>
            {chartBundle.hasWeightPath ? (
              <DenseDailyLineChart
                seriesA={chartBundle.weightSeries}
                metaA={{ label: t('recap.assessment.chartWeightAxis'), color: '#2dd4bf' }}
                height={190}
                valueFormatA={(v) => `${Math.round(v * 10) / 10} kg`}
                emptyMessage={t('recap.assessment.chartEmptyWeight')}
                showTopLabels
              />
            ) : (
              <div className="rounded-xl border border-[#0F4C5C]/40 bg-black/60 py-10 text-center text-xs text-slate-500">
                {t('recap.assessment.chartEmptyWeight')}
              </div>
            )}
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              {t('recap.assessment.chartWeightFoot')}
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-200/80">
              {t('recap.assessment.chartReps')}
            </h3>
            <DenseDailyLineChart
              seriesA={chartBundle.repsSeries}
              metaA={{ label: t('recap.assessment.chartRepsAxis'), color: '#34d399' }}
              height={190}
              valueFormatA={(v) => String(Math.round(v))}
              emptyMessage={t('recap.assessment.chartEmptyReps')}
              showTopLabels
            />
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              {t('recap.assessment.chartRepsFoot', { d: CHART_DAYS })}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/55 p-4 backdrop-blur-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t('recap.assessment.journey')}
            </div>
            <div className="mt-1 text-base font-semibold text-white">{journeyStartYmd || '—'}</div>
            <div className="mt-1 text-xs text-teal-200/75">
              {t('recap.assessment.tenure', { days: tenureDays })}
            </div>
          </div>
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/55 p-4 backdrop-blur-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t('recap.assessment.window')}
            </div>
            <div className="mt-1 text-xs text-teal-100">
              {window28.startYmd} → {window28.endYmd}
            </div>
            <div className="mt-1.5 text-xs text-teal-200/80">
              {t('recap.assessment.activeDays', { n: activeDays28, exp: expectedSessionsOver28 })}
            </div>
            <div className="mt-1 text-xs text-amber-200/85">
              {t('recap.assessment.regularity', { pct: Math.round(regularityScore * 100) })}
            </div>
          </div>
          <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/55 p-4 backdrop-blur-sm md:col-span-2 lg:col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t('recap.assessment.program')}
            </div>
            <p className="mt-1 text-xs leading-snug text-teal-100">{programAdherenceDetail.label}</p>
            {programCompletion28 != null && (
              <div className="mt-2 text-sm font-semibold tabular-nums text-emerald-300/95">
                {programCompletion28.pct}%
              </div>
            )}
          </div>
        </div>

        {(sla.sessionDaysWithPlan > 0 || sla.seriesOverrideDays28 > 0) && (
          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/25 to-black/50 p-4">
            <div className="text-xs font-semibold text-cyan-100/95">
              {t('recap.assessment.sessionAlignTitle')}
            </div>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-200/95">
              {sla.avgScore0to100 != null ? (
                <li>
                  {t('recap.assessment.sessionAlignLineAvg', {
                    score: sla.avgScore0to100,
                    scored: sla.sessionDaysScored,
                    plan: sla.sessionDaysWithPlan
                  })}
                </li>
              ) : sla.sessionDaysWithPlan > 0 ? (
                <li>{t('recap.assessment.sessionAlignPartial', { plan: sla.sessionDaysWithPlan })}</li>
              ) : null}
              {sla.seriesOverrideDays28 > 0 ? (
                <li className="text-cyan-200/85">
                  {t('recap.assessment.sessionOverrides', {
                    d: sla.seriesOverrideDays28,
                    t: sla.seriesOverrideExerciseTouches28
                  })}
                </li>
              ) : (
                <li className="text-slate-500">{t('recap.assessment.sessionOverridesNone')}</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#0F4C5C]/35 bg-[#060f14]/90 p-4">
            <div className="text-xs font-semibold text-teal-100">{t('recap.assessment.loadBlock')}</div>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-200/95">
              <li>{t('recap.assessment.weightedDays', { n: weightedDays28 })}</li>
              <li>{t('recap.assessment.volumeSum', { v: volumeKgRepsSum28 })}</li>
              <li>{t('recap.assessment.avgVolume', { v: avgKgRepsPerWeightedDay28 })}</li>
              <li className="text-teal-300/75">{t('recap.assessment.loadOnlyWeightedDays')}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#0F4C5C]/35 bg-[#060f14]/90 p-4">
            <div className="text-xs font-semibold text-teal-100">{t('recap.assessment.repsBlock')}</div>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-200/95">
              <li>{t('recap.assessment.totalReps', { n: totalReps28 })}</li>
              <li>{t('recap.assessment.avgRepsPerDay', { n: avgRepsPerStrengthDay28 })}</li>
              <li>
                {avgExerciseDifficulty != null
                  ? t('recap.assessment.avgDifficulty', { d: avgExerciseDifficulty })
                  : t('recap.assessment.noDifficulty')}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-950/40 to-black/40 p-1">
          <button
            type="button"
            onClick={() => setQuizOpen(!quizOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left"
          >
            <span className="text-sm font-semibold text-violet-100">
              {t('recap.assessment.quizHeading', {
                done: quiz.completedCount,
                total: quiz.totalCount
              })}
            </span>
            <span className="text-violet-300/80">{quizOpen ? '▼' : '▶'}</span>
          </button>
          {quizOpen && (
            <ul className="max-h-72 space-y-2 overflow-y-auto px-3 pb-3 pr-1">
              {quiz.summaryLines.map((row) => (
                <li key={row.id} className="border-b border-violet-500/10 pb-2 text-xs last:border-0">
                  <div className="text-slate-500">{row.title}</div>
                  <div className="mt-0.5 text-slate-100">{row.value}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(shortTerm.length > 0 || mediumTerm.length > 0 || longTerm.length > 0) && (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <InsightColumn
              title={t('recap.assessment.horizonShort')}
              items={shortTerm}
              accent="border-cyan-500/35 bg-cyan-950/25"
            />
            <InsightColumn
              title={t('recap.assessment.horizonMedium')}
              items={mediumTerm}
              accent="border-teal-500/35 bg-teal-950/30"
            />
            <InsightColumn
              title={t('recap.assessment.horizonLong')}
              items={longTerm}
              accent="border-emerald-600/35 bg-emerald-950/25"
            />
          </div>
        )}

        {(suggestions.length > 0 || predictions.length > 0) && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4">
              <div className="text-xs font-semibold text-amber-100">{t('recap.assessment.suggestions')}</div>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-amber-50/95">
                {suggestions.map((s) => (
                  <li key={s.kind} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/80" />
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4">
              <div className="text-xs font-semibold text-sky-100">{t('recap.assessment.predictions')}</div>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-sky-50/95">
                {predictions.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400/80" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-1.5 border-t border-[#0F4C5C]/30 pt-4 text-[10px] leading-relaxed text-slate-500">
          {disclaimers.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
};

function InsightColumn({ title, items, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      {items.length === 0 ? (
        <p className="text-[11px] text-slate-500">—</p>
      ) : (
        <ul className="space-y-2.5 text-[11px] leading-relaxed text-slate-200/95">
          {items.map((text, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500/70" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecapUserAssessmentPanel;
