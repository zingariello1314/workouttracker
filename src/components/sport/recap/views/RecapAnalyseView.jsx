import React, { useMemo } from 'react';

import { Dumbbell, Salad, Sparkles } from 'lucide-react';
import CoachVisionPanel from '../CoachVisionPanel';
import ProgramStructurePanel from '../ProgramStructurePanel';
import RecapDenseInsightsPanel from '../RecapDenseInsightsPanel';
import RecapBenchmarkCoachPanel from '../RecapBenchmarkCoachPanel';
import RecapPeriodHighlightsPanel from '../RecapPeriodHighlightsPanel';

import { useTranslation } from '../../../../utils/translations';

import { useWorkout } from '../../../../context/WorkoutContext';

import { openSettingsQuizSection } from '../../../../utils/settingsNavigation';

import { countDistinctCheckedExerciseIds28 } from '../../../../utils/sport/recapCrossCoachAggregate';
import { countTrainingDaysInRange } from '../../../../utils/sport/recapTrainingDayTruth';

import { RecapSection } from '../components/RecapUiBlocks';

import RecapTrainingStateDebugPanel from '../RecapTrainingStateDebugPanel';



const HORIZON_PILLS = {

  short: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',

  medium: 'bg-teal-500/20 text-teal-200 border-teal-500/40',

  long: 'bg-emerald-600/20 text-emerald-200 border-emerald-600/40'

};



function InsightColumn({ title, items, horizonKey, accent }) {

  const pill = HORIZON_PILLS[horizonKey] || HORIZON_PILLS.medium;

  const trimmed = (items || []).slice(0, 5);

  return (

    <div className={`rounded-xl border p-4 ${accent}`}>

      <div className="mb-3 flex items-center gap-2">

        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pill}`}>

          {title}

        </span>

      </div>

      {trimmed.length === 0 ? (

        <p className="text-[12px] leading-relaxed text-slate-500">Aucun signal assez robuste sur cet horizon.</p>

      ) : (

        <div className="space-y-4">

          {trimmed.map((item, i) => {

            const card = typeof item === 'object' && item ? item : { body: String(item || '') };

            return (

              <article key={i} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">

                {card.title ? (

                  <h4 className="mb-1.5 text-[12px] font-semibold leading-snug text-teal-100/95">

                    {card.title}

                  </h4>

                ) : null}

                <p className="whitespace-pre-line text-[12px] leading-relaxed text-slate-200/95">

                  {card.body || card.text}

                </p>

                {card.evidence ? (

                  <p className="mt-1.5 text-[10px] tracking-wide text-slate-500">{card.evidence}</p>

                ) : null}

                {card.confidence ? (

                  <p className="mt-0.5 text-[10px] text-slate-500">{card.confidence}</p>

                ) : null}

              </article>

            );

          })}

        </div>

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



function flattenProgramLevels(levels) {

  if (!levels) return [];

  const keys = ['progression', 'recovery', 'trends', 'compliments', 'recommendations'];

  const out = [];

  keys.forEach((k) => {

    (levels[k] || []).forEach((item) => {

      const text = typeof item === 'string' ? item : item?.text;

      if (text) out.push(text);

    });

  });

  return out.slice(0, 10);

}



export default function RecapAnalyseView({

  assessment,

  synthesisCoach,

  profileQuestionnaireRaw,

  enrichment,

  programCoachAnalysis,

  activeProgram,

  period = '30d',

  garminData = null,

  periodWindow = null,

  recapState = null,

  isAdmin = false

}) {

  const t = useTranslation();

  const { setActiveTab, getCurrentData, getExerciseNameById } = useWorkout();



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



  const periodLabel = t(`recap.period.${period}`, period);

  const windowPeriod = assessment?.windowPeriod;

  const periodTrainingLine = useMemo(() => {

    const snapshot = getCurrentData();

    const start = enrichment?.window?.start ?? windowPeriod?.startYmd;

    const end = enrichment?.window?.end ?? windowPeriod?.endYmd;

    const days =

      start && end && snapshot

        ? countTrainingDaysInRange(snapshot, start, end, garminData)

        : enrichment?.completion?.activeTrainingDays ?? windowPeriod?.daySpan ?? 0;

    const reps = assessment?.totalReps28 ?? 0;

    const vol = assessment?.volumeKgRepsSum28 ?? 0;

    const distinct =

      start && end && snapshot

        ? countDistinctCheckedExerciseIds28(snapshot, start, end)

        : 0;

    return { days, reps, vol, distinct };

  }, [assessment, enrichment, windowPeriod, getCurrentData, garminData]);



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



  const extraProgramInsights = useMemo(

    () => flattenProgramLevels(programCoachAnalysis?.levels),

    [programCoachAnalysis?.levels]

  );



  const hasInsightColumns = true;

  const showInterpretationDebug = import.meta.env.DEV || isAdmin;



  return (

    <div className="space-y-5">

      <RecapPeriodHighlightsPanel
        period={period}
        periodWindow={periodWindow ?? enrichment?.window}
        garminData={garminData}
        recapState={recapState}
      />

      {hasInsightColumns ? (

        <div className="grid gap-3 lg:grid-cols-3">

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

      ) : null}



      {showInterpretationDebug ? (

        <RecapTrainingStateDebugPanel

          trainingState={assessment?.trainingState}

          priorState={assessment?.priorState}

          stateTransitions={assessment?.stateTransitions}

          trainingEvents={assessment?.trainingEvents}

          performanceRobustness={assessment?.performanceRobustness}

          populationComparisons={assessment?.populationComparisons}

          composedInterpretations={assessment?.composedInterpretations}

          athleteIdentity={assessment?.athleteIdentity}

          phenomena={assessment?.phenomena}

          insightSignature={assessment?.insightSignature}

        />

      ) : null}



      <RecapBenchmarkCoachPanel

        snapshot={getCurrentData()}

        enrichment={enrichment}

        garminData={garminData}

        assessment={assessment}

        getExerciseNameById={getExerciseNameById}

        profileQuestionnaireRaw={profileQuestionnaireRaw}

        period={period}

        t={t}

      />



      {programCoachAnalysis?.coachVisionReport || programCoachAnalysis?.coachVision ? (

        <CoachVisionPanel

          report={programCoachAnalysis.coachVisionReport}

          fallbackText={programCoachAnalysis.coachVision}

          periodLabel={periodLabel}

        />

      ) : null}



      {programCoachAnalysis?.denseAnalytics ? (

        <RecapDenseInsightsPanel

          denseAnalytics={programCoachAnalysis.denseAnalytics}

          periodLabel={periodLabel}

        />

      ) : null}



      {programCoachAnalysis?.structureReport ? (

        <ProgramStructurePanel

          report={programCoachAnalysis.structureReport}

          dowRows={dowRows}

          periodLabel={periodLabel}

        />

      ) : null}



      {extraProgramInsights.length > 0 ? (

        <RecapSection

          title={t('recap.programCoach.signalsExtra', 'Signaux programme détaillés')}

          subtitle={activeProgram?.name || null}

        >

          <ul className="grid gap-2 md:grid-cols-2">

            {extraProgramInsights.map((text, i) => (

              <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">

                <Sparkles size={12} className="mt-0.5 shrink-0 text-teal-500/70" />

                <span>{text}</span>

              </li>

            ))}

          </ul>

        </RecapSection>

      ) : null}



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

                  {t(

                    'recap.analyse.quizIncomplete',

                    'Questionnaire profil incomplet — complète-le pour affiner les conseils.'

                  )}

                </button>

              </li>

            ) : null}

            {!enrichment?.weight?.hasData ? (

              <li>

                {t(

                  'recap.analyse.noWeight',

                  'Ajoute une pesée (Suivi corporel) pour ancrer la tendance de poids.'

                )}

              </li>

            ) : null}

            {dataGaps.map((g) => (

              <li key={g.code}>{t(`recap.crossCoach.gap.${g.code}`) || g.code}</li>

            ))}

          </ul>

        </div>

      )}



      <section>

        <h2 className="mb-3 text-sm font-semibold text-teal-100">

          {t('recap.crossCoach.title', 'Synthèse corps · entraînement · nutrition')}

        </h2>

        <div className="grid gap-3 md:grid-cols-2">

          <CoachCard

            icon={Dumbbell}

            title={t('recap.crossCoach.pillar.training', 'Entraînement')}

            accentBorder="border-emerald-500/35"

            accentBg="bg-emerald-950/20 text-emerald-100"

          >

            <p>

              {periodTrainingLine.days} jour{periodTrainingLine.days > 1 ? 's' : ''} avec activité ·{' '}

              {periodTrainingLine.reps.toLocaleString('fr-FR')} reps sur la fenêtre

              {periodTrainingLine.vol > 0

                ? ` · volume (kg×reps) total : ${periodTrainingLine.vol.toLocaleString('fr-FR')}`

                : ''}

              .

            </p>

            {assessment?.sessionLoadAlignment28?.avgScore0to100 != null &&

            assessment.sessionLoadAlignment28.sessionDaysScored >= 2 ? (

              <p>

                {assessment.sessionLoadAlignment28.avgScore0to100 >= 70

                  ? `Alignement prévu/réalisé ~${assessment.sessionLoadAlignment28.avgScore0to100} % — bonne exécution du plan.`

                  : `Sur les séances comparables, écart au plan ~${assessment.sessionLoadAlignment28.avgScore0to100} % en moyenne — coche charges et reps pour affiner.`}

              </p>

            ) : null}

            {periodTrainingLine.distinct > 0 ? (

              <p>

                ~{periodTrainingLine.distinct} mouvements du programme touchés —{' '}

                {periodTrainingLine.distinct >= 40 ? 'variété raisonnable si la récup suit.' : 'base étroite, normal si tu consolides.'}

              </p>

            ) : null}

            {trainingCards.map((card) => {

              const tpl = `recap.crossCoach.insight.${card.templateKey}`;

              return <p key={card.id}>{t(tpl, card.payload || {})}</p>;

            })}

            {suggestions.map((s) => (

              <p key={s.kind} className="text-emerald-50/90">

                · {s.text}

              </p>

            ))}

          </CoachCard>



          <CoachCard

            icon={Salad}

            title={t('recap.crossCoach.pillar.nutrition', 'Nutrition')}

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

    </div>

  );

}
