import React, { useMemo } from 'react';

import { Dumbbell, Salad } from 'lucide-react';

import { useTranslation } from '../../../../utils/translations';

import { useWorkout } from '../../../../context/WorkoutContext';

import { openSettingsQuizSection } from '../../../../utils/settingsNavigation';

import { RecapSection, RecapHorizontalBars } from '../components/RecapUiBlocks';



const HORIZON_PILLS = {

  short: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',

  medium: 'bg-teal-500/20 text-teal-200 border-teal-500/40',

  long: 'bg-emerald-600/20 text-emerald-200 border-emerald-600/40'

};



const MUSCLE_COLORS = {

  chest: '#f472b6',

  back: '#38bdf8',

  shoulders: '#a78bfa',

  biceps: '#34d399',

  triceps: '#fb923c',

  quads: '#facc15',

  hamstrings: '#f87171',

  calves: '#22d3ee',

  core: '#2dd4bf',

  tibialis_anterior: '#94a3b8',

  legs: '#eab308'

};



function InsightColumn({ title, items, horizonKey, accent }) {

  const pill = HORIZON_PILLS[horizonKey] || HORIZON_PILLS.medium;

  const trimmed = (items || []).slice(0, 4);

  return (

    <div className={`rounded-xl border p-4 ${accent}`}>

      <div className="mb-3 flex items-center gap-2">

        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pill}`}>

          {title}

        </span>

      </div>

      {trimmed.length === 0 ? (

        <p className="text-[11px] text-slate-500">—</p>

      ) : (

        <ul className="space-y-2.5 text-[11px] leading-relaxed text-slate-200/95">

          {trimmed.map((text, i) => (

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



function CoachCard({ icon: Icon, title, accentBorder, accentBg, children }) {

  return (

    <div className={`rounded-xl border ${accentBorder} ${accentBg} p-4`}>

      <div className="mb-2 flex items-center gap-2">

        <Icon size={16} className="text-current opacity-90" />

        <h3 className="text-xs font-semibold uppercase tracking-wide">{title}</h3>

      </div>

      <div className="space-y-2 text-xs leading-relaxed text-slate-200/95">{children}</div>

    </div>

  );

}



export default function RecapAnalyseView({

  assessment,

  synthesisCoach,

  profileQuestionnaireRaw,

  enrichment

}) {

  const t = useTranslation();

  const { setActiveTab } = useWorkout();



  const shortTerm = assessment?.insights?.shortTerm || [];

  const mediumTerm = assessment?.insights?.mediumTerm || [];

  const longTerm = assessment?.insights?.longTerm || [];

  const suggestions = (assessment?.suggestions || []).slice(0, 4);



  const coach = synthesisCoach;

  const dataGaps = coach?.engine?.dataGaps || [];

  const quizIncomplete =

    profileQuestionnaireRaw &&

    (assessment?.quiz?.completedCount ?? 0) < (assessment?.quiz?.totalCount ?? 1);



  const trainingCards = (coach?.engine?.cards || []).filter(

    (c) => c.pillar === 'sport' || c.pillar === 'combined' || c.pillar === 'body'

  );

  const nutritionCards = (coach?.engine?.cards || []).filter((c) => c.pillar === 'nutrition');



  const feedbackRows = useMemo(() => {

    const fb = enrichment?.feedback;

    if (!fb?.count) return [];

    return [

      fb.ressenti != null && {

        key: 'ressenti',

        label: t('recap.enrichment.feedback.ressenti', 'Ressenti'),

        value: fb.ressenti,

        display: `${fb.ressenti}/10`,

        color: '#34d399'

      },

      fb.difficulte != null && {

        key: 'difficulte',

        label: t('recap.enrichment.feedback.difficulte', 'Difficulté'),

        value: fb.difficulte,

        display: `${fb.difficulte}/10`,

        color: '#fb7185'

      },

      fb.motivation != null && {

        key: 'motivation',

        label: t('recap.enrichment.feedback.motivation', 'Motivation'),

        value: fb.motivation,

        display: `${fb.motivation}/10`,

        color: '#a78bfa'

      },

      fb.sommeil != null && {

        key: 'sommeil',

        label: t('recap.enrichment.feedback.sommeil', 'Sommeil (feedback)'),

        value: fb.sommeil,

        display: `${fb.sommeil}/10`,

        color: '#6366f1'

      }

    ].filter(Boolean);

  }, [enrichment?.feedback, t]);



  const dowRows = useMemo(() => {

    return (enrichment?.dayOfWeek || [])

      .filter((d) => d.plannedDays > 0)

      .map((d) => ({

        key: d.dow,

        label: d.label,

        value: d.avgCompletionPct ?? 0,

        display: d.avgCompletionPct != null ? `${d.avgCompletionPct}%` : '—',

        color: '#2dd4bf'

      }));

  }, [enrichment?.dayOfWeek]);



  const weight = enrichment?.weight;

  const pushPull = enrichment?.pushPull;



  return (

    <div className="space-y-5">

      {(shortTerm.length > 0 || mediumTerm.length > 0 || longTerm.length > 0) && (

        <div className="grid gap-3 md:grid-cols-3">

          <InsightColumn

            title={t('recap.assessment.horizonShort')}

            items={shortTerm}

            horizonKey="short"

            accent="border-cyan-500/35 bg-cyan-950/25"

          />

          <InsightColumn

            title={t('recap.assessment.horizonMedium')}

            items={mediumTerm}

            horizonKey="medium"

            accent="border-teal-500/35 bg-teal-950/30"

          />

          <InsightColumn

            title={t('recap.assessment.horizonLong')}

            items={longTerm}

            horizonKey="long"

            accent="border-emerald-600/35 bg-emerald-950/25"

          />

        </div>

      )}



      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

        {weight?.hasData ? (

          <RecapSection title={t('recap.enrichment.weightDelta', 'Évolution poids')}>

            <p className="text-lg font-bold tabular-nums text-white">

              {weight.deltaKg != null ? (

                <span className={weight.deltaKg <= 0 ? 'text-emerald-300' : 'text-amber-300'}>

                  {weight.deltaKg > 0 ? '+' : ''}

                  {weight.deltaKg} kg

                </span>

              ) : (

                '—'

              )}

            </p>

            <p className="mt-1 text-[11px] text-slate-500">

              {weight.startKg != null && weight.endKg != null

                ? `${weight.startKg} → ${weight.endKg} kg`

                : weight.endKg != null

                  ? t('recap.enrichment.weightLatest', { v: weight.endKg, defaultValue: `Dernière : ${weight.endKg} kg` })

                  : null}

            </p>

          </RecapSection>

        ) : null}



        {pushPull?.pushPct != null ? (

          <RecapSection title={t('recap.enrichment.pushPull', 'Push / Pull (reps)')}>

            <div className="flex gap-4 text-sm">

              <div>

                <span className="text-[10px] uppercase text-slate-500">Push</span>

                <div className="font-bold text-pink-300 tabular-nums">{pushPull.pushPct}%</div>

                <div className="text-[10px] text-slate-500">{pushPull.push} reps</div>

              </div>

              <div>

                <span className="text-[10px] uppercase text-slate-500">Pull</span>

                <div className="font-bold text-sky-300 tabular-nums">{pushPull.pullPct}%</div>

                <div className="text-[10px] text-slate-500">{pushPull.pull} reps</div>

              </div>

              {pushPull.ratio != null ? (

                <div>

                  <span className="text-[10px] uppercase text-slate-500">Ratio</span>

                  <div className="font-bold text-white tabular-nums">{pushPull.ratio}</div>

                </div>

              ) : null}

            </div>

          </RecapSection>

        ) : null}



        {enrichment?.completion?.globalPct != null ? (

          <RecapSection title={t('recap.enrichment.adherenceItems', 'Adhérence items')}>

            <p className="text-lg font-bold tabular-nums text-emerald-300">{enrichment.completion.globalPct}%</p>

            <p className="text-[11px] text-slate-500">{enrichment.completion.detailLabel}</p>

          </RecapSection>

        ) : null}

      </div>



      {(feedbackRows.length > 0 || dowRows.length > 0) && (

        <div className="grid gap-3 md:grid-cols-2">

          {feedbackRows.length > 0 ? (

            <RecapSection

              title={t('recap.enrichment.feedbackAggregate', 'Feedbacks séance (moyennes)')}

              subtitle={t('recap.enrichment.feedbackCount', {

                n: enrichment.feedbackCount,

                defaultValue: `${enrichment.feedbackCount} séances renseignées`

              })}

            >

              <RecapHorizontalBars rows={feedbackRows} maxValue={10} />

            </RecapSection>

          ) : null}

          {dowRows.length > 0 ? (

            <RecapSection title={t('recap.enrichment.dowAdherence', 'Complétion par jour de semaine')}>

              <RecapHorizontalBars rows={dowRows} maxValue={100} />

            </RecapSection>

          ) : null}

        </div>

      )}



      {(dataGaps.length > 0 || quizIncomplete) && (

        <div className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3">

          <p className="text-xs font-semibold text-amber-100">{t('recap.analyse.alerts', 'Points d’attention')}</p>

          <ul className="mt-2 space-y-1 text-[11px] text-amber-50/90">

            {quizIncomplete ? (

              <li>

                <button

                  type="button"

                  onClick={() => openSettingsQuizSection(setActiveTab)}

                  className="text-left underline decoration-amber-400/50 underline-offset-2 hover:text-amber-50"

                >

                  {t('recap.analyse.quizIncomplete', 'Questionnaire profil incomplet — complète-le pour affiner les conseils.')}

                </button>

              </li>

            ) : null}

            {dataGaps.map((g) => (

              <li key={g.code}>{t(`recap.crossCoach.gap.${g.code}`) || g.code}</li>

            ))}

          </ul>

        </div>

      )}



      <section>

        <h2 className="mb-3 text-sm font-semibold text-teal-100">{t('recap.crossCoach.title')}</h2>

        <div className="grid gap-3 md:grid-cols-2">

          <CoachCard

            icon={Dumbbell}

            title={t('recap.crossCoach.pillar.training')}

            accentBorder="border-emerald-500/35"

            accentBg="bg-emerald-950/20 text-emerald-100"

          >

            {coach ? (

              <>

                <p>{t('recap.crossCoach.pillar.trainingLine', coach.trainingLineParams)}</p>

                {trainingCards.map((card) => {

                  const tpl = `recap.crossCoach.insight.${card.templateKey}`;

                  return <p key={card.id}>{t(tpl, card.payload || {})}</p>;

                })}

                {suggestions.map((s) => (

                  <p key={s.kind} className="text-emerald-50/90">

                    · {s.text}

                  </p>

                ))}

              </>

            ) : (

              <p className="text-slate-500">{t('recap.crossCoach.loadingChip')}</p>

            )}

          </CoachCard>



          <CoachCard

            icon={Salad}

            title={t('recap.crossCoach.pillar.nutrition')}

            accentBorder="border-amber-500/35"

            accentBg="bg-amber-950/15 text-amber-100"

          >

            {coach ? (

              <>

                <p>

                  {coach.nutritionLineKey === 'recap.crossCoach.pillar.nutritionLine.days'

                    ? t(coach.nutritionLineKey, {

                        n: String(coach.aggregate?.nutrition?.daysWithLoggedMeals28 ?? 0)

                      })

                    : t(coach.nutritionLineKey)}

                </p>

                {nutritionCards.map((card) => {

                  const tpl = `recap.crossCoach.insight.${card.templateKey}`;

                  return <p key={card.id}>{t(tpl, card.payload || {})}</p>;

                })}

              </>

            ) : (

              <p className="text-slate-500">{t('recap.crossCoach.loadingChip')}</p>

            )}

          </CoachCard>

        </div>

      </section>



      {enrichment?.muscleShareRows?.length > 0 ? (

        <RecapSection title={t('recap.enrichment.muscleShare', 'Répartition musculaire (reps)')}>

          <RecapHorizontalBars

            rows={enrichment.muscleShareRows.slice(0, 8).map((r) => ({

              key: r.groupId,

              label: t(`recap.muscleGroup.${r.groupId}`, r.groupId),

              value: r.reps,

              display: `${r.reps} reps`,

              color: MUSCLE_COLORS[r.groupId] || '#94a3b8'

            }))}

          />

        </RecapSection>

      ) : null}

    </div>

  );

}

