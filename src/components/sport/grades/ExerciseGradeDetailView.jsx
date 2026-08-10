import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { useAuth } from '../../../context/AuthContext';
import { useWorkout } from '../../../context/WorkoutContext';
import { isAdminUser } from '../../../utils/accessControl';
import { computeExerciseGradeDetail } from '../../../services/xp/exerciseGradeDetailStats';
import { resolveExerciseGradeVitals } from '../../../services/xp/exerciseGradeVitals';
import ExerciseGradeEmblem from './ExerciseGradeEmblem';
import ExerciseGradeProgressBars from './ExerciseGradeProgressBars';

function StatBlock({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-[#0F4C5C]/35 bg-black/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default function ExerciseGradeDetailView({ benchmarkKey, onBack, vitalsRefreshKey = 0 }) {
  const t = useTranslation();
  const { currentUser, isAuthenticated } = useAuth();
  const {
    getCurrentData,
    getExerciseNameById,
    getTodayWorkout,
    activeProgram,
    data,
    tempData,
    hasUnsavedExercises,
    hasUnsavedStretches
  } = useWorkout();

  const snapshot = useMemo(
    () => getCurrentData(),
    [getCurrentData, data, tempData, hasUnsavedExercises, hasUnsavedStretches, vitalsRefreshKey]
  );

  const detail = useMemo(() => {
    const vitals = resolveExerciseGradeVitals({
      progressEntries: snapshot?.progressEntries,
      profileQuestionnaireRaw: currentUser?.profileQuestionnaire
    });
    return computeExerciseGradeDetail(benchmarkKey, snapshot, getExerciseNameById, vitals, {
      getTodayWorkout,
      activeProgram,
      isAdmin: isAdminUser(currentUser),
      isAuthenticated
    });
  }, [
    benchmarkKey,
    snapshot,
    getExerciseNameById,
    currentUser,
    getTodayWorkout,
    activeProgram,
    isAuthenticated,
    vitalsRefreshKey
  ]);

  if (!detail) {
    return (
      <div className="rounded-xl border border-[#0F4C5C]/40 bg-black p-6 text-sm text-slate-500">
        {t('recap.exerciseGrades.detailMissing', 'Exercice introuvable.')}
        <button type="button" onClick={onBack} className="mt-3 text-teal-400 text-xs">
          {t('common.back', 'Retour')}
        </button>
      </div>
    );
  }

  const g = detail.grade;
  const fmt = (n) => Number(n).toLocaleString('fr-FR');

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('recap.exerciseGrades.backToList', 'Retour au classement')}
      </button>

      <section className="overflow-hidden rounded-2xl border border-[#0F4C5C]/55 bg-gradient-to-br from-black via-[#041a14]/95 to-black p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <div className="flex shrink-0 justify-center sm:w-[min(38%,220px)]">
            <ExerciseGradeEmblem
              gradeId={g.gradeId}
              gradeLabel={g.gradeLabel}
              layout="hero"
              className="w-full max-w-[200px]"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500">
              {t('recap.exerciseGrades.detailTitle', 'Fiche exercice')}
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white">{detail.label}</h3>
            <p className="mt-1 text-xl font-bold tabular-nums text-cyan-100">
              {fmt(detail.headlineValue)}{' '}
              <span className="text-sm font-normal text-slate-400">{detail.headlineLabel}</span>
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: g.accent }}>
              {g.gradeLabel}
            </p>
            <ExerciseGradeProgressBars progress={detail.progress} />
            {detail.description ? (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{detail.description}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <StatBlock
          label={t('recap.exerciseGrades.statChecks', 'Séances cochées')}
          value={fmt(detail.totalChecks)}
          sub={t('recap.exerciseGrades.statChecksSub', 'Programme + défis liés')}
        />
        <StatBlock
          label={t('recap.exerciseGrades.statAvgDay', 'Moyenne / jour actif')}
          value={fmt(detail.avgRepsPerActiveDay)}
          sub={t('recap.exerciseGrades.statAvgDaySub', '{{n}} jours avec activité', {
            n: fmt(detail.daysWithActivity)
          })}
        />
        <StatBlock
          label={t('recap.exerciseGrades.statPeak', 'Pic sur une journée')}
          value={fmt(detail.peakDailyReps)}
          sub={detail.metric === 'max_weight_kg' ? `${fmt(detail.metrics.maxWeightKg)} kg max` : null}
        />
        <StatBlock
          label={t('recap.exerciseGrades.statYear', `En ${detail.year}`)}
          value={fmt(detail.repsThisYear)}
          sub={t('recap.exerciseGrades.statYearChecks', '{{n}} coches', { n: fmt(detail.checksThisYear) })}
        />
        <StatBlock
          label={t('recap.exerciseGrades.statRegularity', 'Régularité (jours prévus)')}
          value={
            detail.regularityPct != null
              ? `${detail.regularityPct.toLocaleString('fr-FR')} %`
              : '—'
          }
          sub={
            detail.plannedDays > 0
              ? t('recap.exerciseGrades.statRegularitySub', '{{ok}} / {{total}} jours planifiés cochés', {
                  ok: fmt(detail.plannedDaysChecked),
                  total: fmt(detail.plannedDays)
                })
              : t('recap.exerciseGrades.statRegularityNa', 'Programme actif requis pour ce calcul')
          }
        />
        <StatBlock
          label={t('recap.exerciseGrades.statLifetime', 'Volume total')}
          value={fmt(detail.totalReps)}
          sub={detail.headlineLabel}
        />
      </div>

      {detail.timeline?.length > 0 ? (
        <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            {t('recap.exerciseGrades.timelineTitle', 'Historique des grades')}
          </h3>
          <ol className="relative border-l border-teal-800/60 ml-3 space-y-3 pl-5">
            {detail.timeline.map((ev) => {
              const dateLabel = ev.at
                ? new Date(ev.at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : t('recap.exerciseGrades.timelineNoDate', 'Date non enregistrée (niveau déjà atteint)');
              return (
                <li key={ev.id} className="relative text-sm text-teal-50">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full border-2 border-teal-500 bg-black" />
                  <span className="font-medium">{ev.gradeLabel}</span>
                  <span className="block text-[10px] text-slate-500">{dateLabel}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
