import React, { useMemo } from 'react';

import { ChevronRight } from 'lucide-react';

import { MuscleGroups } from '../../../../data/workoutProgramEnhanced';

import { useTranslation } from '../../../../utils/translations';

import { useWorkout } from '../../../../context/WorkoutContext';

import { openSettingsQuizSection } from '../../../../utils/settingsNavigation';

import {

  recapScoreToHexRelative,

  recapDisplayRecoveryBand,

  recapZoneBlendHueScore

} from '../../../../utils/sport/recapIntensityColors';

import RecapKpiCard, {
  RecapSection,
  RecapChallengePills,
  RecapHorizontalBars
} from '../components/RecapUiBlocks';
import RecapLeastCheckedList from '../components/RecapLeastCheckedList';

import { JUSTIFICATION_REASONS, JUSTIFICATION_LABELS } from '../../../../utils/dayJustificationUtils';



function StatusRow({ dot = 'emerald', children }) {

  const dotCls =

    dot === 'amber'

      ? 'bg-amber-400'

      : dot === 'sky'

        ? 'bg-sky-400'

        : dot === 'slate'

          ? 'bg-slate-500'

          : 'bg-emerald-400';

  return (

    <li className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">

      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`} aria-hidden />

      <span>{children}</span>

    </li>

  );

}



function buildTopZones(recapState, t, limit = 5) {

  const { byGroup, repShareByGroup = {}, colorReferenceMax = 1, maxRepShareAcrossGroups = 0, volumeTotals = {} } =

    recapState || {};

  const rows = Object.values(MuscleGroups).map((groupId) => {

    const g = byGroup?.[groupId] || { displayScore: 0 };

    const vol =

      groupId === MuscleGroups.FULL_BODY

        ? Math.round(volumeTotals.strengthReps || 0)

        : Math.round(repShareByGroup[groupId] || 0);

    const repH = groupId === MuscleGroups.FULL_BODY ? vol : repShareByGroup[groupId] || 0;

    const maxRH =

      groupId === MuscleGroups.FULL_BODY

        ? Math.max(maxRepShareAcrossGroups, volumeTotals.strengthReps || 0)

        : maxRepShareAcrossGroups;

    const hueScore = recapZoneBlendHueScore({

      vol,

      maxRH,

      repH,

      displayScore: g.displayScore,

      maxDisplay: Math.max(1, ...Object.values(byGroup || {}).map((x) => x?.displayScore || 0)),

      colorReferenceMax,

      forFullBody: groupId === MuscleGroups.FULL_BODY

    });

    const color = recapScoreToHexRelative(hueScore, colorReferenceMax);

    const band = recapDisplayRecoveryBand(g.displayScore);

    return {

      groupId,

      label: t(`recap.muscleGroup.${groupId}`, groupId),

      vol,

      color,

      band,

      score: g.displayScore || 0

    };

  });

  return rows.sort((a, b) => b.score - a.score).slice(0, limit);

}



export default function RecapSnapshotView({

  assessment,

  recapState,

  runningKm = 0,

  period = '30d',

  currentUser,

  enrichment

}) {

  const t = useTranslation();

  const { setActiveTab } = useWorkout();



  const {

    journeyStartYmd,

    tenureDays,

    window28,

    regularityScore,

    programAdherenceDetail,

    programCompletion28,

    totalReps28,

    volumeKgRepsSum28,

    avgKgRepsPerWeightedDay28,

    sessionLoadAlignment28,

    quiz,

    activeDays28,

    expectedSessionsOver28

  } = assessment || {};

  const daySpan = assessment?.windowPeriod?.daySpan ?? 28;

  const comp = enrichment?.completion || {};

  const sla = sessionLoadAlignment28 || {};

  const regPct = Math.round((regularityScore || 0) * 100);

  const progPctLegacy = programCompletion28?.pct ?? null;

  const globalPct = comp.globalPct;



  const quizFilled = useMemo(() => {

    const lines = (quiz?.summaryLines || []).filter((row) => {

      const v = row?.value;

      return v != null && String(v).trim() !== '' && String(v).trim() !== '—';

    });

    return lines.slice(0, 6);

  }, [quiz?.summaryLines]);



  const topZones = useMemo(() => buildTopZones(recapState, t, 5), [recapState, t]);



  const username = currentUser?.username || t('recap.assessment.userFallback');



  const justificationBars = useMemo(() => {

    const byReason = enrichment?.justifications?.byReason || {};

    return Object.entries(byReason)

      .map(([reason, count]) => ({

        key: reason,

        label: JUSTIFICATION_LABELS[reason] || reason,

        value: count,

        display: count,

        color:

          reason === JUSTIFICATION_REASONS.REPOS

            ? '#38bdf8'

            : reason === JUSTIFICATION_REASONS.MALADIE

              ? '#f87171'

              : '#fbbf24'

      }))

      .sort((a, b) => b.value - a.value);

  }, [enrichment?.justifications]);



  const streak = enrichment?.streak;

  const garmin = enrichment?.garmin;

  const fb = enrichment?.feedback;



  return (

    <div className="space-y-5">

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">

        <RecapKpiCard

          label={t('recap.snapshot.regularity', 'Régularité')}

          value={`${regPct}%`}

          note={t('recap.assessment.activeDays', { n: activeDays28, exp: expectedSessionsOver28 })}

          accent={regPct >= 80 ? 'emerald' : 'amber'}

        />

        <RecapKpiCard

          label={t('recap.enrichment.completionGlobal', 'Programme (moy/jour)')}

          value={globalPct != null ? `${globalPct}%` : '—'}

          note={comp.detailLabel}

          accent={globalPct != null && globalPct >= 85 ? 'emerald' : 'amber'}

        />

        <RecapKpiCard

          label={t('recap.enrichment.completionExos', 'Exos (moy/jour)')}

          value={comp.exoPct != null ? `${comp.exoPct}%` : '—'}

          note={comp.exoDetailLabel ?? undefined}

          accent="teal"

        />

        <RecapKpiCard

          label={t('recap.enrichment.completionStretch', 'Étirements')}

          value={comp.stretchPct != null ? `${comp.stretchPct}%` : '—'}

          note={

            comp.stretchTotal > 0

              ? `${comp.stretchChecked}/${comp.stretchTotal}`

              : undefined

          }

          accent="violet"

        />

        <RecapKpiCard

          label={t('recap.snapshot.running', 'Course')}

          value={runningKm > 0 ? `${runningKm < 10 ? runningKm.toFixed(1) : Math.round(runningKm)} km` : '—'}

          note={t('recap.periodNote', { label: t(`recap.period.${period}`) })}

          accent="sky"

        />

      </div>



      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">

        <RecapKpiCard

          label={t('recap.snapshot.repsPeriod', 'Reps (période)')}

          value={totalReps28?.toLocaleString('fr-FR') ?? '0'}

          note={t('recap.periodNote', { label: t(`recap.period.${period}`) })}

          accent="teal"

        />

        <RecapKpiCard

          label={t('recap.snapshot.volume', 'Volume kg×reps')}

          value={`${volumeKgRepsSum28 ?? 0}`}

          note={t('recap.assessment.avgVolume', { v: avgKgRepsPerWeightedDay28 ?? 0 })}

          accent="sky"

        />

        <RecapKpiCard

          label={t('recap.enrichment.streak', 'Série actuelle')}

          value={streak?.current != null ? `${streak.current} j` : '—'}

          note={

            streak?.longest

              ? t('recap.enrichment.streakBest', { n: streak.longest })

              : undefined

          }

          accent={streak?.current >= 7 ? 'emerald' : 'amber'}

        />

        <RecapKpiCard

          label={t('recap.enrichment.feedbacks', 'Feedbacks séance')}

          value={enrichment?.feedbackCount ?? 0}

          note={

            fb?.ressenti != null

              ? t('recap.enrichment.feedbackRessenti', { v: fb.ressenti })

              : undefined

          }

          accent="rose"

        />

        <RecapKpiCard

          label={t('recap.enrichment.steps', 'Pas moy. (Garmin)')}

          value={garmin?.avgSteps != null ? garmin.avgSteps.toLocaleString('fr-FR') : '—'}

          note={

            garmin?.avgSleepHours != null

              ? t('recap.enrichment.sleepAvg', { h: garmin.avgSleepHours })

              : garmin?.hasSignal

                ? t('recap.enrichment.garminPartial', 'Signal Garmin partiel')

                : undefined

          }

          accent="amber"

        />

      </div>



      <RecapSection title={t('recap.snapshot.status', 'Statut')}>

        <ul className="space-y-2">

          <StatusRow dot="emerald">

            {t('recap.assessment.identity')} : <strong className="text-white">{username}</strong>

            {journeyStartYmd ? (

              <>

                {' '}

                · {t('recap.assessment.journey')} {journeyStartYmd} ({t('recap.assessment.tenure', { days: tenureDays })})

              </>

            ) : null}

          </StatusRow>

          {window28?.startYmd ? (

            <StatusRow dot="sky">

              {t('recap.assessment.window')} {window28.startYmd} → {window28.endYmd}

            </StatusRow>

          ) : null}

          {sla.avgScore0to100 != null ? (

            <StatusRow dot={sla.avgScore0to100 >= 70 ? 'emerald' : 'amber'}>

              {t('recap.assessment.sessionAlignLineAvg', {

                score: sla.avgScore0to100,

                scored: sla.sessionDaysScored,

                plan: sla.sessionDaysWithPlan

              })}

            </StatusRow>

          ) : null}

          {comp.activeTrainingDays > 0 ? (

            <StatusRow dot={globalPct != null && globalPct >= 80 ? 'emerald' : 'amber'}>

              {t('recap.enrichment.completionDaysLine', {

                full: comp.daysFullyComplete,

                partial: comp.daysPartial,

                active: comp.activeTrainingDays,

                planned: comp.plannedDays,

                legacy: progPctLegacy ?? '—'

              })}

            </StatusRow>

          ) : null}

          {enrichment?.seriesOverrideDays > 0 ? (

            <StatusRow dot="amber">

              {t('recap.enrichment.seriesOverride', {

                n: enrichment.seriesOverrideDays,

                defaultValue: `${enrichment.seriesOverrideDays} jour(s) avec séries ajustées manuellement`

              })}

            </StatusRow>

          ) : null}

          {enrichment?.circuits?.totalRounds > 0 ? (

            <StatusRow dot="sky">

              {t('recap.enrichment.circuits', {

                rounds: enrichment.circuits.totalRounds,

                days: enrichment.circuits.activeDays,

                defaultValue: `Circuits : ${enrichment.circuits.totalRounds} tours sur ${enrichment.circuits.activeDays} jours`

              })}

            </StatusRow>

          ) : null}

        </ul>

      </RecapSection>



      {(enrichment?.activeChallenges?.length > 0 || justificationBars.length > 0) && (

        <div className="grid gap-3 md:grid-cols-2">

          {enrichment?.activeChallenges?.length > 0 ? (

            <RecapSection title={t('recap.enrichment.challengesTitle', 'Défis endurance actifs')}>

              <RecapChallengePills challenges={enrichment.activeChallenges} t={t} />

            </RecapSection>

          ) : null}

          {justificationBars.length > 0 ? (

            <RecapSection title={t('recap.enrichment.justifications', 'Justifications (période)')}>

              <RecapHorizontalBars rows={justificationBars} emptyLabel={null} />

            </RecapSection>

          ) : null}

        </div>

      )}



      {(enrichment?.leastCheckedExercises?.length ?? 0) > 0 ? (

        <RecapSection

          title={t('recap.enrichment.leastChecked', 'Exercices les moins cochés')}

          subtitle={t(
            'recap.enrichment.leastCheckedHint',
            'Taux de coche lors de vos séances effectuées (min. 2 séances). Les circuits sont regroupés ; les exos ajoutés récemment ne comptent qu’à partir de leur date d’ajout.'
          )}
        >
          <RecapLeastCheckedList items={enrichment.leastCheckedExercises} />

        </RecapSection>

      ) : null}



      {(quizFilled.length > 0 || (quiz?.totalCount ?? 0) > 0) && (

        <button

          type="button"

          onClick={() => openSettingsQuizSection(setActiveTab)}

          className="group w-full rounded-xl border border-violet-500/25 bg-violet-950/15 px-4 py-3 text-left transition-colors hover:border-violet-400/45 hover:bg-violet-950/25"

        >

          <div className="mb-2 flex items-center justify-between gap-2">

            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/90">

              {t('recap.assessment.quizHeading', {

                done: quiz?.completedCount ?? 0,

                total: quiz?.totalCount ?? 0

              })}

            </h2>

            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-300/90 group-hover:text-violet-200">

              {t('recap.snapshot.editQuiz', 'Mettre à jour')}

              <ChevronRight size={12} />

            </span>

          </div>

          {quizFilled.length > 0 ? (

            <ul className="space-y-1.5">

              {quizFilled.map((row) => (

                <li key={row.id} className="flex justify-between gap-3 text-xs">

                  <span className="text-slate-500 truncate">{row.title}</span>

                  <span className="shrink-0 font-medium text-slate-100">{row.value}</span>

                </li>

              ))}

            </ul>

          ) : (

            <p className="text-xs text-violet-200/75">

              {t('recap.snapshot.quizIncompleteHint', 'Complète le questionnaire pour affiner programmes et conseils.')}

            </p>

          )}

        </button>

      )}



      {topZones.length > 0 ? (

        <RecapSection title={t('recap.snapshot.topZones', 'Zones les plus sollicitées')}>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">

            {topZones.map((z) => (

              <div

                key={z.groupId}

                className="rounded-lg border border-[#0F4C5C]/40 bg-black/50 px-2.5 py-2"

              >

                <div className="flex items-center gap-1.5">

                  <span

                    className="h-2 w-2 shrink-0 rounded-full"

                    style={{ backgroundColor: z.color, boxShadow: `0 0 6px ${z.color}88` }}

                  />

                  <span className="truncate text-xs font-medium" style={{ color: z.color }}>

                    {z.label}

                  </span>

                </div>

                <div className="mt-1 text-sm font-bold tabular-nums text-white">

                  {z.vol > 0 ? `${z.vol} reps` : '—'}

                </div>

                <div className="text-[10px] text-slate-500">{t(`recap.zones.recovery.${z.band}`)}</div>

              </div>

            ))}

          </div>

        </RecapSection>

      ) : null}

    </div>

  );

}

