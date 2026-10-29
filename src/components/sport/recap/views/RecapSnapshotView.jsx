import React, { useMemo } from 'react';
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
  RecapStatusRow
} from '../components/RecapUiBlocks';
import RecapLeastCheckedList from '../components/RecapLeastCheckedList';
import { JUSTIFICATION_REASONS, JUSTIFICATION_LABELS } from '../../../../utils/dayJustificationUtils';

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

function splitAnswerChips(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '—') return [];
  return raw
    .split(/\s*[·|,;/]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
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
    programCompletion28,
    totalReps28,
    volumeKgRepsSum28,
    avgKgRepsPerWeightedDay28,
    sessionLoadAlignment28,
    quiz,
    activeDays28,
    expectedSessionsOver28
  } = assessment || {};

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

  const quizPct = useMemo(() => {
    const done = quiz?.completedCount ?? 0;
    const total = quiz?.totalCount ?? 0;
    if (!total) return null;
    return Math.round((done / total) * 1000) / 10;
  }, [quiz?.completedCount, quiz?.totalCount]);

  const topZones = useMemo(() => buildTopZones(recapState, t, 5), [recapState, t]);
  const zoneMax = useMemo(() => Math.max(...topZones.map((z) => z.vol || 0), 1), [topZones]);

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
  const periodLabel = t(`recap.period.${period}`);
  const challenges = enrichment?.activeChallenges || [];

  return (
    <div className="rb-snap">
      <RecapSection
        id="sn-ind"
        title={t('recap.snapshot.indicators', 'Indicateurs')}
        subtitle={periodLabel}
        panel={false}
      >
        <div className="kgrid">
          <RecapKpiCard
            label={t('recap.snapshot.regularity', 'Régularité')}
            value={`${regPct}%`}
            note={t('recap.assessment.activeDays', { n: activeDays28, exp: expectedSessionsOver28 })}
            accent={regPct >= 80 ? 'emerald' : 'amber'}
            icon="pulse"
            progress={regPct}
          />
          <RecapKpiCard
            label={t('recap.enrichment.completionGlobal', 'Programme (moy/jour)')}
            value={globalPct != null ? `${globalPct}%` : '—'}
            note={comp.detailLabel}
            accent="coral"
            icon="grid"
            progress={globalPct}
          />
          <RecapKpiCard
            label={t('recap.enrichment.completionExos', 'Exos (moy/jour)')}
            value={comp.exoPct != null ? `${comp.exoPct}%` : '—'}
            note={comp.exoDetailLabel ?? undefined}
            accent="teal"
            icon="act"
            progress={comp.exoPct}
          />
          <RecapKpiCard
            label={t('recap.enrichment.completionStretch', 'Étirements')}
            value={comp.stretchPct != null ? `${comp.stretchPct}%` : '—'}
            note={comp.stretchTotal > 0 ? `${comp.stretchChecked}/${comp.stretchTotal}` : undefined}
            accent="violet"
            icon="prog"
            progress={comp.stretchPct}
          />
          <RecapKpiCard
            label={t('recap.snapshot.running', 'Course')}
            value={runningKm > 0 ? `${runningKm < 10 ? runningKm.toFixed(1) : Math.round(runningKm)} km` : '—'}
            note={t('recap.periodNote', { label: periodLabel })}
            accent="sky"
            icon="road"
          />
        </div>

        <div className="kgrid">
          <RecapKpiCard
            label={t('recap.snapshot.repsPeriod', 'Reps (période)')}
            value={totalReps28?.toLocaleString('fr-FR') ?? '0'}
            note={t('recap.periodNote', { label: periodLabel })}
            accent="amber"
            icon="dumb"
          />
          <RecapKpiCard
            label={t('recap.snapshot.volume', 'Volume kg×reps')}
            value={`${volumeKgRepsSum28 ?? 0}`}
            note={t('recap.assessment.avgVolume', { v: avgKgRepsPerWeightedDay28 ?? 0 })}
            accent="teal"
            icon="act"
          />
          <RecapKpiCard
            label={t('recap.enrichment.streak', 'Série actuelle')}
            value={streak?.current != null ? `${streak.current} j` : '—'}
            note={streak?.longest ? t('recap.enrichment.streakBest', { n: streak.longest }) : undefined}
            accent="coral"
            icon="flame"
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
            icon="chat"
          />
          <RecapKpiCard
            label={t('recap.enrichment.steps', 'Pas moy. (fusionnés)')}
            value={garmin?.avgSteps != null ? garmin.avgSteps.toLocaleString('fr-FR') : '—'}
            note={
              garmin?.avgSleepHours != null
                ? t('recap.enrichment.sleepAvg', { h: garmin.avgSleepHours })
                : garmin?.hasSignal
                  ? garmin?.daysWithStepsData > 0
                    ? `${garmin.daysWithStepsData} j. avec pas (Garmin + compléments)`
                    : t('recap.enrichment.garminPartial', 'Signal Garmin partiel')
                  : undefined
            }
            accent="sky"
            icon="steps"
          />
        </div>
      </RecapSection>

      <RecapSection id="sn-stat" className="rb-stat" title={t('recap.snapshot.status', 'Statut')}>
        <RecapStatusRow tone="a2">
          {t('recap.assessment.identity')} : <b>{username}</b>
          {journeyStartYmd ? (
            <>
              {' '}
              · {t('recap.assessment.journey')} {journeyStartYmd} ({t('recap.assessment.tenure', { days: tenureDays })})
            </>
          ) : null}
        </RecapStatusRow>
        {window28?.startYmd ? (
          <RecapStatusRow tone="a5">
            {t('recap.assessment.window')} {window28.startYmd} → {window28.endYmd}
          </RecapStatusRow>
        ) : null}
        {sla.avgScore0to100 != null ? (
          <RecapStatusRow tone={sla.avgScore0to100 >= 70 ? 'a2' : 'd'}>
            {t('recap.assessment.sessionAlignLineAvg', {
              score: sla.avgScore0to100,
              scored: sla.sessionDaysScored,
              plan: sla.sessionDaysWithPlan
            })}
          </RecapStatusRow>
        ) : null}
        {comp.activeTrainingDays > 0 ? (
          <RecapStatusRow tone={globalPct != null && globalPct >= 80 ? 'a2' : 'a3'}>
            {t('recap.enrichment.completionDaysLine', {
              full: comp.daysFullyComplete,
              partial: comp.daysPartial,
              active: comp.activeTrainingDays,
              planned: comp.plannedDays,
              legacy: progPctLegacy ?? '—'
            })}
          </RecapStatusRow>
        ) : null}
        {enrichment?.seriesOverrideDays > 0 ? (
          <RecapStatusRow tone="a3">
            {t('recap.enrichment.seriesOverride', {
              n: enrichment.seriesOverrideDays,
              defaultValue: `${enrichment.seriesOverrideDays} jour(s) avec séries ajustées manuellement`
            })}
          </RecapStatusRow>
        ) : null}
        {enrichment?.circuits?.totalRounds > 0 ? (
          <RecapStatusRow tone="a5">
            {t('recap.enrichment.circuits', {
              rounds: enrichment.circuits.totalRounds,
              days: enrichment.circuits.activeDays,
              defaultValue: `Circuits : ${enrichment.circuits.totalRounds} tours sur ${enrichment.circuits.activeDays} jours`
            })}
          </RecapStatusRow>
        ) : null}
      </RecapSection>

      <RecapSection
        id="sn-def"
        title={t('recap.snapshot.periodPulse', 'Période')}
        subtitle={periodLabel}
        panel={false}
      >
        <div className="rb-pulse">
          <article className="rb-pulse-card">
            <header>
              <h3>{t('recap.enrichment.challengesTitle', 'Défis endurance')}</h3>
            </header>
            <RecapChallengePills
              challenges={challenges}
              t={t}
              emptyLabel={t('recap.enrichment.noChallenge', "Aucun défi d'endurance actif")}
            />
          </article>

          <article className="rb-pulse-card">
            <header>
              <h3>{t('recap.enrichment.justifications', 'Justifications')}</h3>
            </header>
            {justificationBars.length > 0 ? (
              <div className="rb-just-tiles">
                {justificationBars.map((row) => (
                  <div key={row.key || row.label} className="rb-just-tile" style={{ '--a': row.color || 'var(--d)' }}>
                    <b>{row.display ?? row.value}</b>
                    <span>{row.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="emp">{t('recap.enrichment.noJustification', 'Aucune justification sur la période')}</p>
            )}
          </article>

          <article className="rb-pulse-card rb-pulse-wide">
            <header>
              <h3>{t('recap.enrichment.leastChecked', 'Exercices les moins cochés')}</h3>
              <p>
                {t(
                  'recap.enrichment.leastCheckedHintShort',
                  'Taux de coche sur séances faites (min. 2). Circuits regroupés.'
                )}
              </p>
            </header>
            {(enrichment?.leastCheckedExercises?.length ?? 0) > 0 ? (
              <RecapLeastCheckedList items={enrichment.leastCheckedExercises} layout="grid" />
            ) : (
              <p className="emp">{t('recap.enrichment.noLeastChecked', 'Pas assez de séances pour classer')}</p>
            )}
          </article>
        </div>
      </RecapSection>

      {(quizFilled.length > 0 || (quiz?.totalCount ?? 0) > 0) && (
        <RecapSection
          id="sn-quiz"
          title={t('recap.assessment.quizTitle', 'Quiz profil')}
          badge={`${quiz?.completedCount ?? 0} / ${quiz?.totalCount ?? 0}`}
          action={
            <button type="button" className="r" onClick={() => openSettingsQuizSection(setActiveTab)}>
              {t('recap.snapshot.editQuiz', 'Mettre à jour')} ›
            </button>
          }
          panelClassName="qz"
        >
          {quizPct != null ? (
            <div className="qb">
              <div className="gz" style={{ '--a': 'var(--a1)' }}>
                <i style={{ '--w': `${quizPct}%` }} />
              </div>
              <b>{String(quizPct).replace('.', ',')} %</b>
            </div>
          ) : null}
          {quizFilled.length > 0 ? (
            quizFilled.map((row) => {
              const chips = splitAnswerChips(row.value);
              const multi = chips.length > 1;
              return (
                <div key={row.id} className="qr">
                  <span>{row.title}</span>
                  <div className="an">
                    {multi
                      ? chips.map((chip) => <i key={`${row.id}-${chip}`}>{chip}</i>)
                      : chips[0] || row.value}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="emp">
              {t(
                'recap.snapshot.quizIncompleteHint',
                'Complète le questionnaire pour affiner programmes et conseils.'
              )}
            </p>
          )}
        </RecapSection>
      )}

      {topZones.length > 0 ? (
        <RecapSection
          id="sn-zones"
          title={t('recap.snapshot.topZones', 'Zones les plus sollicitées')}
          panel={false}
        >
          <div className="zg">
            {topZones.map((z, index) => {
              const pct = Math.round(((z.vol || 0) / zoneMax) * 1000) / 10;
              return (
                <div
                  key={z.groupId}
                  className="zc"
                  style={{ '--a': z.color || 'var(--d)', animationDelay: `${index * 0.05}s` }}
                >
                  <div className="zn">{z.label}</div>
                  <div className="zv">
                    {z.vol > 0 ? z.vol : '—'}
                    {z.vol > 0 ? <u>reps</u> : null}
                  </div>
                  <div className="gz">
                    <i style={{ '--w': `${pct}%` }} />
                  </div>
                  <div className="zs">{t(`recap.zones.recovery.${z.band}`)}</div>
                </div>
              );
            })}
          </div>
        </RecapSection>
      ) : null}
    </div>
  );
}
