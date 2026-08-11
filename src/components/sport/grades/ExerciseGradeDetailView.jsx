import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Calendar, Trophy, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { useAuth } from '../../../context/AuthContext';
import { useWorkout } from '../../../context/WorkoutContext';
import { isAdminUser } from '../../../utils/accessControl';
import { computeExerciseGradeDetail } from '../../../services/xp/exerciseGradeDetailStats';
import { resolveExerciseGradeVitals } from '../../../services/xp/exerciseGradeVitals';
import { formatCatalogDateHeadline, pushupBreakdownDisplayLines } from '../../../services/xp/exerciseGradeCheckHistory';
import { removeExerciseGradeCheckAndReconcile } from '../../../services/xp/exerciseGradeCheckHistoryActions';
import { invalidateSportXpCache } from '../../../hooks/useSportXP';
import ExerciseGradeEmblem from './ExerciseGradeEmblem';
import ExerciseGradeProgressBars from './ExerciseGradeProgressBars';
import {
  RECAP_GRADE_DETAIL_FOCUS_ID,
  scrollToRecapGradeDetail
} from '../../../utils/sport/recapGradesScroll';
import { calendarDeepLinkFromCheckHistoryRow } from '../../../utils/sport/calendarExerciseDeepLink';

function StatBlock({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-[#0F4C5C]/35 bg-black/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

function valueUnitForMetric(metric) {
  if (metric === 'hold_seconds') return 's';
  if (metric === 'max_weight_kg') return 'kg×reps';
  return 'reps';
}

function PushupBreakdownList({ lines, fmt }) {
  if (!lines?.length) return null;
  return (
    <ul className="mt-2.5 space-y-1 border-t border-white/5 pt-2">
      {lines.map((line) => (
        <li key={line.key} className="flex justify-between gap-2 text-[10px] text-slate-400">
          <span>{line.label}</span>
          <span className="font-semibold tabular-nums text-slate-200">{fmt(line.reps)}</span>
        </li>
      ))}
    </ul>
  );
}

function RecordCard({ kind, title, dateHeadline, subDate, total, unit, checks, highlight, badge, pushupLines, fmt }) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border px-4 py-3.5 ${
        highlight
          ? 'border-amber-400/55 bg-gradient-to-br from-amber-950/35 via-black/80 to-black shadow-[0_0_24px_-8px_rgba(251,191,36,0.35)]'
          : 'border-[#0F4C5C]/40 bg-black/55'
      }`}
    >
      {badge ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200">
          <Trophy className="h-3 w-3" />
          {badge}
        </span>
      ) : null}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p
        className={`mt-2 text-lg font-bold leading-snug text-white sm:text-xl ${
          highlight ? 'pr-16' : ''
        }`}
      >
        {dateHeadline || '—'}
      </p>
      {subDate ? <p className="mt-0.5 text-[11px] capitalize text-slate-400">{subDate}</p> : null}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-white/5 pt-3">
        <span className="text-2xl font-bold tabular-nums text-cyan-100">{total}</span>
        <span className="text-[11px] text-slate-500">{unit}</span>
        {checks != null && checks > 0 ? (
          <span className="ml-auto text-[10px] text-slate-500">
            {checks.toLocaleString('fr-FR')} coche{checks > 1 ? 's' : ''}
          </span>
        ) : null}
      </div>
      {kind === 'day' && highlight ? (
        <p className="mt-2 text-[10px] text-amber-200/80">
          Record journalier — toutes sources confondues ce jour-là
        </p>
      ) : null}
      <PushupBreakdownList lines={pushupLines} fmt={fmt} />
    </div>
  );
}

function HistoryRow({ row, fmt, t, unit, onRequestDelete, onOpenInCalendar, deletingId }) {
  const peak = row.isPeakSession;
  const bestDay = row.isBestDay;
  const busy = deletingId === row.id;
  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border sm:flex-row sm:items-stretch sm:justify-between ${
        bestDay
          ? 'border-amber-400/40 bg-amber-950/20'
          : peak
            ? 'border-teal-500/30 bg-teal-950/15'
            : 'border-[#0F4C5C]/25 bg-black/40'
      } ${busy ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => onOpenInCalendar?.(row)}
        className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-teal-950/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500/50 sm:flex-row sm:items-center sm:justify-between"
        title={t('recap.exerciseGrades.openCheckInCalendar', 'Voir cette coche dans le calendrier')}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{row.dateHeadline}</p>
          <p className="text-[11px] capitalize text-slate-500">{row.weekday}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {bestDay ? (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-100">
                {t('recap.exerciseGrades.badgeBestDay', 'Meilleur jour')}
              </span>
            ) : null}
            {peak ? (
              <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-medium text-teal-200">
                {t('recap.exerciseGrades.badgePeakSession', 'Meilleure séance')}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-0.5 text-[9px] text-teal-500/90">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden />
              {t('recap.exerciseGrades.openInCalendarShort', 'Calendrier')}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:text-right">
          <div>
            <p className="text-xl font-bold tabular-nums text-cyan-100">{fmt(row.reps)}</p>
            <p className="text-[9px] uppercase text-slate-500">{unit}</p>
          </div>
          <p className="max-w-[8rem] text-[10px] leading-snug text-slate-400 sm:max-w-[10rem]">
            {row.source === 'endurance'
              ? t('recap.exerciseGrades.sourceEndurance', 'Défis pompes')
              : row.sourceLabel}
          </p>
        </div>
      </button>
      {onRequestDelete ? (
        <div className="flex shrink-0 items-center border-t border-[#0F4C5C]/20 px-2 py-2 sm:border-t-0 sm:border-l sm:px-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onRequestDelete(row)}
            className="rounded-md border border-red-500/30 bg-red-950/30 p-2 text-red-300 hover:bg-red-950/50 disabled:opacity-50"
            title={t('recap.exerciseGrades.deleteCheck', 'Supprimer cette coche')}
            aria-label={t('recap.exerciseGrades.deleteCheck', 'Supprimer cette coche')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </li>
  );
}

function DeleteCheckConfirmDialog({ row, t, onCancel, onConfirm, pending }) {
  if (!row) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-check-title"
    >
      <div className="w-full max-w-md rounded-xl border border-red-500/35 bg-[#0a1210] p-4 shadow-xl">
        <h4 id="delete-check-title" className="text-sm font-semibold text-white">
          {t('recap.exerciseGrades.deleteCheckTitle', 'Supprimer cette coche ?')}
        </h4>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          {t(
            'recap.exerciseGrades.deleteCheckBody',
            'La séance du {{date}} ({{reps}}) sera retirée du programme et des défis liés. Ton grade et tes records seront recalculés. Si c’était la dernière coche, l’exercice disparaîtra du classement.',
            { date: row.dateHeadline, reps: row.reps }
          )}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-lg border border-[#0F4C5C]/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-black/60"
          >
            {t('common.cancel', 'Annuler')}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="rounded-lg border border-red-500/50 bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {pending
              ? t('common.deleting', 'Suppression…')
              : t('recap.exerciseGrades.deleteCheckConfirm', 'Supprimer')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExerciseGradeDetailView({
  benchmarkKey,
  onBack,
  vitalsRefreshKey = 0,
  onGradeRemoved
}) {
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
    hasUnsavedStretches,
    updateData,
    replaceDraftWorkoutData,
    requestOpenCalendarDay
  } = useWorkout();

  const [pendingDeleteRow, setPendingDeleteRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [dataRevision, setDataRevision] = useState(0);

  const snapshot = useMemo(
    () => getCurrentData(),
    [
      getCurrentData,
      data,
      tempData,
      hasUnsavedExercises,
      hasUnsavedStretches,
      vitalsRefreshKey,
      dataRevision
    ]
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

  const vitals = useMemo(
    () =>
      resolveExerciseGradeVitals({
        progressEntries: snapshot?.progressEntries,
        profileQuestionnaireRaw: currentUser?.profileQuestionnaire
      }),
    [snapshot?.progressEntries, currentUser?.profileQuestionnaire]
  );

  const confirmDeleteCheck = useCallback(async () => {
    if (!pendingDeleteRow || !updateData) return;
    setDeletingId(pendingDeleteRow.id);
    try {
      const current = getCurrentData();
      const result = removeExerciseGradeCheckAndReconcile(
        current,
        pendingDeleteRow.id,
        benchmarkKey,
        getExerciseNameById,
        vitals
      );
      if (!result.removed) return;
      await updateData(result.next, { strict: true });
      replaceDraftWorkoutData?.(result.next);
      invalidateSportXpCache();
      setDataRevision((n) => n + 1);
      setPendingDeleteRow(null);
      if (result.gradeRemoved) {
        onGradeRemoved?.();
      }
    } catch (err) {
      console.error('[ExerciseGradeDetail] delete check failed', err);
    } finally {
      setDeletingId(null);
    }
  }, [
    pendingDeleteRow,
    updateData,
    getCurrentData,
    benchmarkKey,
    getExerciseNameById,
    vitals,
    replaceDraftWorkoutData,
    onGradeRemoved
  ]);

  useEffect(() => {
    if (!benchmarkKey) return;
    scrollToRecapGradeDetail();
  }, [benchmarkKey]);

  const openCheckInCalendar = useCallback(
    (row) => {
      const link = calendarDeepLinkFromCheckHistoryRow(row);
      if (!link || typeof requestOpenCalendarDay !== 'function') return;
      requestOpenCalendarDay(link.dateYmd, link.scrollAnchor);
    },
    [requestOpenCalendarDay]
  );

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
  const unit = valueUnitForMetric(detail.metric);
  const pr = detail.periodRecords;
  const firstH = detail.firstCheckDate ? formatCatalogDateHeadline(detail.firstCheckDate) : null;
  const lastH = detail.lastCheckDate ? formatCatalogDateHeadline(detail.lastCheckDate) : null;

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

      <section
        id={RECAP_GRADE_DETAIL_FOCUS_ID}
        className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#0F4C5C]/55 bg-gradient-to-br from-black via-[#041a14]/95 to-black p-4 sm:p-5"
      >
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
            {firstH && lastH ? (
              <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                {t('recap.exerciseGrades.activitySpan', 'Du {{from}} au {{to}}', {
                  from: firstH.primary,
                  to: lastH.primary
                })}
              </p>
            ) : null}
            <p className="mt-1 text-xl font-bold tabular-nums text-cyan-100">
              {fmt(detail.headlineValue)}{' '}
              <span className="text-sm font-normal text-slate-400">{detail.headlineLabel}</span>
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: g.accent }}>
              {g.gradeLabel}
            </p>
            {g.parallelLevel ? (
              <p className="text-[11px] text-slate-400">
                {t('recap.exerciseGrades.parallelLevelLine', 'Niveau {{n}} · {{eq}} rep équivalent pompes (×{{w}})', {
                  n: g.parallelLevel,
                  eq: fmt(Math.round(g.weightedLifetimeValue || 0)),
                  w: (g.difficulty?.repWeight ?? 1).toLocaleString('fr-FR')
                })}
              </p>
            ) : null}
            {g.gradePaths?.activeLabels?.length ? (
              <p className="text-[10px] text-slate-500">
                {t('recap.exerciseGrades.gradePaths', 'Voies actives : {{paths}}', {
                  paths: g.gradePaths.activeLabels.join(', ')
                })}
              </p>
            ) : null}
            <ExerciseGradeProgressBars progress={detail.progress} />
            {detail.levelProgress ? (
              <div className="mt-3 rounded-lg border border-cyan-500/25 bg-cyan-950/15 px-3 py-2 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400/90">
                  {t('recap.exerciseGrades.levelEvolutionTitle', 'Évolution du niveau')}
                </p>
                <p className="text-[11px] text-slate-300">
                  {t('recap.exerciseGrades.levelEvolutionLine', 'Niveau {{cur}} → {{next}} · {{eq}} rep eq.', {
                    cur: detail.levelProgress.currentLevel,
                    next: detail.levelProgress.nextLevel,
                    eq: fmt(Math.round(detail.levelProgress.repEq || 0))
                  })}
                </p>
                {detail.levelProgress.repEqToNextLevel > 0 ? (
                  <p className="text-[10px] text-slate-500">
                    {t(
                      'recap.exerciseGrades.levelRepEqNeeded',
                      'Encore {{n}} rep eq. pour le prochain niveau',
                      { n: fmt(detail.levelProgress.repEqToNextLevel) }
                    )}
                  </p>
                ) : null}
                {detail.nextGradeGate?.gate ? (
                  <p className="text-[10px] text-slate-500">
                    {t(
                      'recap.exerciseGrades.nextGradeTargets',
                      'Prochain grade — pic {{peak}}, volume {{life}}, coches {{checks}}',
                      {
                        peak: fmt(detail.nextGradeGate.gate.peak),
                        life: fmt(detail.nextGradeGate.gate.life),
                        checks: fmt(detail.nextGradeGate.gate.checks)
                      }
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
            {detail.performancePeak?.value ? (
              <div className="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-950/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
                  {t('recap.exerciseGrades.performanceMaxTitle', 'Max Performances (défis)')}
                </p>
                <p className="text-sm font-bold tabular-nums text-white">
                  {fmt(detail.performancePeak.value)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {detail.metric === 'hold_seconds'
                      ? t('recap.exerciseGrades.secondsShort', 's')
                      : detail.metric === 'max_weight_kg'
                        ? 'kg'
                        : t('recap.exerciseGrades.repsShort', 'reps')}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500">
                  {t('recap.exerciseGrades.performanceMaxHint', 'Synchronisé avec l’onglet Performances / défis')}
                </p>
              </div>
            ) : null}
            {detail.description ? (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">{detail.description}</p>
            ) : null}
            {detail.isPushupsCatalog && detail.pushupBreakdownLifetime?.length > 0 ? (
              <div className="mt-3 rounded-lg border border-[#0F4C5C]/35 bg-black/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
                  {t('recap.exerciseGrades.pushupSplitTitle', 'Répartition pompes (total)')}
                </p>
                <PushupBreakdownList lines={detail.pushupBreakdownLifetime} fmt={fmt} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {pr?.bestDay?.dateStr ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {t('recap.exerciseGrades.recordsTitle', 'Records personnels')}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <RecordCard
              kind="day"
              highlight
              badge={t('recap.exerciseGrades.recordTop', 'Record')}
              title={t('recap.exerciseGrades.statBestDay', 'Meilleur jour')}
              dateHeadline={pr.bestDay.dateHeadline}
              subDate={pr.bestDay.weekday}
              total={fmt(pr.bestDay.reps)}
              unit={unit}
              pushupLines={pushupBreakdownDisplayLines(pr.bestDay.pushupChannels)}
              fmt={fmt}
            />
            <RecordCard
              kind="week"
              title={t('recap.exerciseGrades.statBestWeek', 'Meilleure semaine')}
              dateHeadline={pr.bestWeek.dateHeadline}
              subDate={t('recap.exerciseGrades.weekTotalHint', 'Total sur 7 jours (lun. → dim.)')}
              total={pr.bestWeek.weekStart ? fmt(pr.bestWeek.reps) : '—'}
              unit={unit}
              checks={pr.bestWeek.checks}
              pushupLines={pushupBreakdownDisplayLines(pr.bestWeek.pushupChannels)}
              fmt={fmt}
            />
            <RecordCard
              kind="month"
              title={t('recap.exerciseGrades.statBestMonth', 'Meilleur mois')}
              dateHeadline={pr.bestMonth.dateHeadline}
              subDate={t('recap.exerciseGrades.monthTotalHint', 'Total sur le mois calendaire')}
              total={pr.bestMonth.monthKey ? fmt(pr.bestMonth.reps) : '—'}
              unit={unit}
              checks={pr.bestMonth.checks}
              pushupLines={pushupBreakdownDisplayLines(pr.bestMonth.pushupChannels)}
              fmt={fmt}
            />
          </div>
        </section>
      ) : null}

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

      {detail.checkHistoryByMonth?.length > 0 ? (
        <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
          <h3 className="text-sm font-semibold text-white">
            {t('recap.exerciseGrades.checkHistoryTitle', 'Historique des coches')}
          </h3>
          <p className="mt-1 text-[10px] text-slate-500">
            {t(
              'recap.exerciseGrades.checkHistoryHint',
              'Regroupé par mois — clique une ligne pour ouvrir le jour dans le calendrier (l’enregistrement sera mis en surbrillance).'
            )}
          </p>
          <div className="mt-4 max-h-[min(480px,55vh)] space-y-5 overflow-y-auto pr-1">
            {detail.checkHistoryByMonth.map((group) => (
              <div key={group.monthKey}>
                <p className="sticky top-0 z-10 bg-[#041a14]/95 py-1 text-xs font-semibold capitalize text-teal-400/95">
                  {group.monthLabel}
                </p>
                <ul className="mt-2 space-y-2">
                  {group.items.map((row) => (
                    <HistoryRow
                      key={row.id}
                      row={row}
                      fmt={fmt}
                      t={t}
                      unit={unit}
                      deletingId={deletingId}
                      onRequestDelete={setPendingDeleteRow}
                      onOpenInCalendar={openCheckInCalendar}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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

      <DeleteCheckConfirmDialog
        row={pendingDeleteRow}
        t={t}
        pending={Boolean(deletingId)}
        onCancel={() => !deletingId && setPendingDeleteRow(null)}
        onConfirm={confirmDeleteCheck}
      />
    </div>
  );
}
