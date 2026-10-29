import React, { useMemo } from 'react';
import CoachVisionPanel from '../CoachVisionPanel';
import ProgramStructurePanel from '../ProgramStructurePanel';
import RecapDenseInsightsPanel from '../RecapDenseInsightsPanel';
import RecapBenchmarkCoachPanel from '../RecapBenchmarkCoachPanel';
import RecapTrainingStateDebugPanel from '../RecapTrainingStateDebugPanel';
import CoachMetricText from '../CoachMetricText';
import { useTranslation } from '../../../../utils/translations';
import { useWorkout } from '../../../../context/WorkoutContext';
import { openSettingsQuizSection } from '../../../../utils/settingsNavigation';
import { countDistinctCheckedExerciseIds28 } from '../../../../utils/sport/recapCrossCoachAggregate';
import { countTrainingDaysInRange } from '../../../../utils/sport/recapTrainingDayTruth';

function flattenProgramLevels(levels) {
  if (!levels) return [];
  const keys = ['progression', 'recovery', 'trends', 'compliments', 'recommendations'];
  const out = [];
  keys.forEach((k) => {
    (levels[k] || []).forEach((item) => {
      const text = typeof item === 'string' ? item : item?.text;
      if (text) out.push({ text, bucket: k });
    });
  });
  return out.slice(0, 10);
}

function signalKind(text, bucket) {
  if (bucket === 'recommendations') return 'rc2';
  if (bucket === 'progression' || bucket === 'trends') return 'dt';
  if (/écart|alerte|attention|ambitieux|incomplet|~0\s*%|déséquilibre/i.test(text)) return 'wr';
  if (/max enregistré|exercice |compare avec|moyenne récente|reps\/séance/i.test(text)) return 'dt';
  if (/ajouter|vise|plutôt|pourrait|conseil|GTG|étirement/i.test(text)) return 'rc2';
  return 'wr';
}

function synthTone(text, index) {
  if (/nutrition|calorie|repas/i.test(text)) return 'na4';
  if (/quiz|questionnaire|profil incomplet/i.test(text)) return 'na5';
  if (/GTG|fréquence spécifique|qualité du geste/i.test(text)) return 'na2';
  if (/écart|régularité|dessous|loin du plan|retard/i.test(text)) return 'na3';
  if (index === 0) return 'nd';
  return 'na3';
}

export default function RecapAnalyseDetails({
  assessment,
  synthesisCoach,
  profileQuestionnaireRaw,
  enrichment,
  programCoachAnalysis,
  activeProgram,
  period = '30d',
  garminData = null,
  isAdmin = false
}) {
  const t = useTranslation();
  const { setActiveTab, getCurrentData, getExerciseNameById } = useWorkout();

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
  const calendarCards = (coach?.engine?.cards || []).filter((c) => c.pillar === 'calendar');
  const periodLabel = t(`recap.period.${period}`, period);
  const windowPeriod = assessment?.windowPeriod;
  const showInterpretationDebug = import.meta.env.DEV || isAdmin;

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
      start && end && snapshot ? countDistinctCheckedExerciseIds28(snapshot, start, end) : 0;
    return { days, reps, vol, distinct };
  }, [assessment, enrichment, windowPeriod, getCurrentData, garminData]);

  const dowRows = useMemo(() => {
    return (enrichment?.dayOfWeek || [])
      .filter((d) => d.plannedDays > 0)
      .map((d) => ({
        key: d.dow,
        label: d.label,
        value: d.avgCompletionPct ?? 0,
        display: d.avgCompletionPct != null ? `${d.avgCompletionPct} %` : '—',
        color: '#2dd4bf'
      }));
  }, [enrichment?.dayOfWeek]);

  const extraProgramInsights = useMemo(
    () => flattenProgramLevels(programCoachAnalysis?.levels),
    [programCoachAnalysis?.levels]
  );

  const challengeRows = programCoachAnalysis?.denseAnalytics?.challengeRows || [];

  const trainingLines = useMemo(() => {
    const lines = [];
    lines.push({
      text: `${periodTrainingLine.days} jour${periodTrainingLine.days > 1 ? 's' : ''} avec activité · ${periodTrainingLine.reps.toLocaleString('fr-FR')} reps sur la fenêtre${
        periodTrainingLine.vol > 0
          ? ` · volume (kg×reps) total : ${periodTrainingLine.vol.toLocaleString('fr-FR')}`
          : ''
      }.`,
      tone: 'nd'
    });
    if (
      assessment?.sessionLoadAlignment28?.avgScore0to100 != null &&
      assessment.sessionLoadAlignment28.sessionDaysScored >= 2
    ) {
      const score = assessment.sessionLoadAlignment28.avgScore0to100;
      lines.push({
        text:
          score >= 70
            ? `Alignement prévu/réalisé ~${score} % — bonne exécution du plan.`
            : `Sur les séances comparables, écart au plan ~${score} % en moyenne — coche charges et reps pour affiner.`,
        tone: synthTone(`écart ${score}`, 1)
      });
    }
    if (periodTrainingLine.distinct > 0) {
      lines.push({
        text: `~${periodTrainingLine.distinct} mouvements du programme touchés — ${
          periodTrainingLine.distinct >= 40
            ? 'variété raisonnable si la récup suit.'
            : 'base étroite, normal si tu consolides.'
        }`,
        tone: 'nd'
      });
    }
    trainingCards.forEach((card) => {
      const tpl = `recap.crossCoach.insight.${card.templateKey}`;
      const text = t(tpl, card.payload || {});
      lines.push({ text, tone: synthTone(text, lines.length) });
    });
    suggestions.forEach((s) => {
      lines.push({ text: s.text, tone: synthTone(s.text, lines.length) });
    });
    return lines;
  }, [periodTrainingLine, assessment, trainingCards, suggestions, t]);

  const calendarLines = useMemo(() => {
    return calendarCards.map((card) => {
      const tpl = `recap.crossCoach.insight.${card.templateKey}`;
      const text = t(tpl, card.payload || {});
      return { text, tone: synthTone(text, 1) };
    });
  }, [calendarCards, t]);

  return (
    <>
      {showInterpretationDebug ? (
        <>
          <RecapTrainingStateDebugPanel
            trainingState={assessment?.trainingState}
            priorState={assessment?.priorState}
            stateTransitions={assessment?.stateTransitions}
            trainingEvents={assessment?.trainingEvents}
            performanceRobustness={assessment?.performanceRobustness}
            populationComparisons={assessment?.populationComparisons}
            composedInterpretations={assessment?.composedInterpretations}
            athleteIdentity={assessment?.athleteIdentity}
            athleteJourney={assessment?.athleteJourney}
            phenomena={assessment?.phenomena}
            periodDiscoveries={assessment?.periodDiscoveries}
            insightSignature={assessment?.insightSignature}
          />
          <div style={{ margin: '8px 0 16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('dev-analysis-engine')}
              style={{
                background: '#0f172a',
                color: '#7dd3fc',
                border: '1px solid #0369a1',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Ouvrir la console diagnostic moteur d’analyse
            </button>
          </div>
        </>
      ) : null}

      <div id="reperes">
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
      </div>

      <div id="coach">
        {programCoachAnalysis?.coachVisionReport || programCoachAnalysis?.coachVision ? (
          <CoachVisionPanel
            report={programCoachAnalysis.coachVisionReport}
            fallbackText={programCoachAnalysis.coachVision}
            periodLabel={periodLabel}
            challengeRows={challengeRows}
          />
        ) : null}
      </div>

      <div id="prog">
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
          <>
            <div className="sgt">
              <h3>Signaux programme détaillés</h3>
              {activeProgram?.name ? <span>{activeProgram.name}</span> : null}
            </div>
            <div className="sig">
              {extraProgramInsights.map((item, i) => (
                <div key={i} className={`sg ${signalKind(item.text, item.bucket)}`}>
                  <span>
                    <CoachMetricText text={item.text} variant="v" />
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {(dataGaps.length > 0 || quizIncomplete) && (
        <div className="att">
          <b>{t('recap.analyse.alerts', 'Points d’attention')}</b>
          {quizIncomplete ? (
            <a
              href="#quiz"
              onClick={(e) => {
                e.preventDefault();
                openSettingsQuizSection(setActiveTab);
              }}
            >
              {t(
                'recap.analyse.quizIncomplete',
                'Questionnaire profil incomplet — complète-le pour affiner les conseils.'
              )}
            </a>
          ) : null}
          {!enrichment?.weight?.hasData ? (
            <>
              <br />
              {t(
                'recap.analyse.noWeight',
                'Ajoute une pesée (Suivi corporel) pour ancrer la tendance de poids.'
              )}
            </>
          ) : null}
          {dataGaps.map((g) => (
            <React.Fragment key={g.code}>
              <br />
              {t(`recap.crossCoach.gap.${g.code}`) || g.code}
            </React.Fragment>
          ))}
        </div>
      )}

      <section id="synth">
        <div className="sh">
          <h2>{t('recap.crossCoach.title', 'Synthèse corps · entraînement · nutrition')}</h2>
        </div>
        <div className="sy">
          <div>
            <div className="sb">⚒ Entraînement</div>
            <ul className="bl">
              {trainingLines.map((line, i) => (
                <li
                  key={i}
                  className={line.tone}
                  style={{
                    '--a':
                      line.tone === 'nd'
                        ? 'var(--d)'
                        : line.tone === 'na2'
                          ? 'var(--a2)'
                          : line.tone === 'na3'
                            ? 'var(--a3)'
                            : line.tone === 'na4'
                              ? 'var(--a4)'
                              : line.tone === 'na5'
                                ? 'var(--a5)'
                                : 'var(--a4)'
                  }}
                >
                  <span>
                    <CoachMetricText text={line.text} variant="v" />
                  </span>
                </li>
              ))}
            </ul>
            {calendarLines.length > 0 ? (
              <div className="ag">
                <div className="sb">Calendrier &amp; nutrition</div>
                <ul className="bl">
                  {calendarLines.map((line, i) => (
                    <li
                      key={i}
                      className={line.tone}
                      style={{
                        '--a':
                          line.tone === 'na4'
                            ? 'var(--a4)'
                            : line.tone === 'na5'
                              ? 'var(--a5)'
                              : 'var(--a3)'
                      }}
                    >
                      <span>
                        <CoachMetricText text={line.text} variant="v" />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="nut">
            <h3>◉ Nutrition</h3>
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
              <p>{t('recap.crossCoach.loadingChip')}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
