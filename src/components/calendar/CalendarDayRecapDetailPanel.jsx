import React, { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import SleepPhasesChart from '../Charts/SleepPhasesChart';
import CalendarDayMetricSparkline from './CalendarDayMetricSparkline';
import CalendarManualWalkEditor from './CalendarManualWalkEditor';
import CalendarSessionDateReassign from './CalendarSessionDateReassign';
import {
  buildBodyBatteryDetailContext,
  buildGarminActivityDetailContext,
  buildHeartRateDetailContext,
  buildRunningDetailContext,
  buildSleepDetailContext,
  buildStepsDetailContext,
  buildStretchDetailContext,
  buildStressDetailContext,
  buildWorkoutDetailContext
} from '../../utils/calendarDayRecapDetail';
import { normalizeManualDailyWalkByDate } from '../../utils/sport/manualDailyWalkUtils';

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-black/90 p-3 text-center">
      <div className="text-lg font-bold tabular-nums text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {hint ? <div className="mt-1 text-[10px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h5 className="text-sm font-medium text-slate-300">{title}</h5>
      {children}
    </section>
  );
}

function formatLocale(n, locale = 'fr-FR') {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString(locale);
}

export default function CalendarDayRecapDetailPanel({
  row,
  dateStr,
  garminData,
  workoutData,
  intensity,
  programs = [],
  language = 'fr',
  t,
  onBack,
  updateData
}) {
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  const manualWalk = normalizeManualDailyWalkByDate(workoutData?.enduranceData?.manualDailyWalkByDate);
  const [showWalkEditor, setShowWalkEditor] = useState(false);

  const content = useMemo(() => {
    if (!row?.kind || !dateStr) return null;

    switch (row.kind) {
      case 'sleep': {
        const ctx = buildSleepDetailContext(garminData, dateStr);
        if (!ctx) return { empty: t('calendar.heatmap.recapDetail.noSleep', 'Aucune donnée sommeil pour cette nuit.') };
        return {
          title: t('calendar.heatmap.garminRecap.sleep', 'Sommeil'),
          body: (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile label={t('calendar.heatmap.recapDetail.total', 'Durée totale')} value={ctx.totalLabel || '—'} />
                {ctx.quality != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.quality', 'Score')} value={`${ctx.quality}/100`} />
                )}
                {ctx.bedTime && (
                  <StatTile label={t('calendar.heatmap.recapDetail.bedTime', 'Coucher')} value={ctx.bedTime} />
                )}
                {ctx.wakeTime && (
                  <StatTile label={t('calendar.heatmap.recapDetail.wakeTime', 'Lever')} value={ctx.wakeTime} />
                )}
              </div>
              {ctx.sleepChartData.length > 0 && (
                <Section title={t('calendar.heatmap.recapDetail.phases', 'Phases de sommeil')}>
                  <SleepPhasesChart data={ctx.sleepChartData} height={180} showObjectives={false} />
                </Section>
              )}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {ctx.deepMin > 0 && (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.deep', 'Profond')}
                    value={`${Math.floor(ctx.deepMin / 60)}h${String(ctx.deepMin % 60).padStart(2, '0')}`}
                  />
                )}
                {ctx.lightMin > 0 && (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.light', 'Léger')}
                    value={`${Math.floor(ctx.lightMin / 60)}h${String(ctx.lightMin % 60).padStart(2, '0')}`}
                  />
                )}
                {ctx.remMin > 0 && (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.rem', 'REM')}
                    value={`${Math.floor(ctx.remMin / 60)}h${String(ctx.remMin % 60).padStart(2, '0')}`}
                  />
                )}
                {ctx.awakeMin > 0 && (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.awake', 'Éveillé')}
                    value={`${ctx.awakeMin} min`}
                  />
                )}
              </div>
              {ctx.respiration && (
                <Section title={t('calendar.heatmap.recapDetail.respiration', 'Respiration (sommeil)')}>
                  <div className="grid grid-cols-3 gap-3">
                    {ctx.respiration.min != null && (
                      <StatTile label="Min" value={`${ctx.respiration.min} /min`} />
                    )}
                    {ctx.respiration.avg != null && (
                      <StatTile label={t('calendar.heatmap.recapDetail.avg', 'Moyenne')} value={`${ctx.respiration.avg} /min`} />
                    )}
                    {ctx.respiration.max != null && (
                      <StatTile label="Max" value={`${ctx.respiration.max} /min`} />
                    )}
                  </div>
                </Section>
              )}
              {ctx.spo2 != null && (
                <StatTile label="SpO₂" value={`${ctx.spo2} %`} />
              )}
            </>
          )
        };
      }

      case 'steps': {
        const ctx = buildStepsDetailContext(garminData, dateStr, manualWalk);
        return {
          title: t('calendar.heatmap.garminRecap.steps', 'Pas'),
          body: (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile label={t('calendar.heatmap.recapDetail.today', 'Ce jour')} value={formatLocale(ctx.today, locale)} />
                <StatTile
                  label={t('calendar.heatmap.recapDetail.goal', 'Objectif Garmin')}
                  value={formatLocale(ctx.goal, locale)}
                />
                <StatTile label={t('calendar.heatmap.recapDetail.ofGoal', '% objectif')} value={`${ctx.pct} %`} />
                {ctx.weekAvg != null && (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.weekAvg', 'Moy. 7 jours')}
                    value={formatLocale(ctx.weekAvg, locale)}
                    hint={t('calendar.heatmap.recapDetail.weekDays', { count: ctx.weekDays, defaultValue: `${ctx.weekDays} jour(s) avec pas` })}
                  />
                )}
                {ctx.monthAvg != null && (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.monthAvg', 'Moy. ce mois')}
                    value={formatLocale(ctx.monthAvg, locale)}
                    hint={t('calendar.heatmap.recapDetail.monthDays', { count: ctx.monthDays, defaultValue: `${ctx.monthDays} jour(s)` })}
                  />
                )}
                {ctx.distanceKm != null && ctx.distanceKm > 0 && (
                  <StatTile label={t('calendar.heatmap.recapDetail.distance', 'Distance')} value={`${ctx.distanceKm} km`} />
                )}
                {ctx.floors != null && ctx.floors > 0 && (
                  <StatTile label={t('calendar.heatmap.recapDetail.floors', 'Étages')} value={String(ctx.floors)} />
                )}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{ width: `${Math.min(100, ctx.pct)}%` }}
                />
              </div>
              {ctx.stepsBreakdown?.declarative > 0 && (
                <p className="text-xs text-slate-500">
                  {formatLocale(ctx.stepsBreakdown.garmin, locale)} Garmin
                  {ctx.stepsBreakdown.declarative > 0
                    ? ` + ${formatLocale(ctx.stepsBreakdown.declarative, locale)} complément`
                    : ''}
                </p>
              )}
              {typeof updateData === 'function' && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowWalkEditor((v) => !v)}
                    className="text-xs text-sky-400 underline hover:text-sky-200"
                  >
                    {t('calendar.heatmap.recapDetail.editSteps', 'Compléter les pas')}
                  </button>
                  {showWalkEditor && (
                    <CalendarManualWalkEditor
                      dateStr={dateStr}
                      garminSteps={ctx.stepsBreakdown?.garmin ?? 0}
                      currentData={workoutData}
                      updateData={updateData}
                      onClose={() => setShowWalkEditor(false)}
                      t={t}
                    />
                  )}
                </>
              )}
            </>
          )
        };
      }

      case 'heartRate': {
        const ctx = buildHeartRateDetailContext(garminData, dateStr);
        if (!ctx) return { empty: t('calendar.heatmap.recapDetail.noHr', 'Pas de données FC pour ce jour.') };
        return {
          title: t('calendar.heatmap.garminRecap.heartRate', 'Fréquence cardiaque'),
          body: (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {ctx.resting != null && <StatTile label={t('calendar.heatmap.recapDetail.restingHr', 'Repos')} value={`${ctx.resting} bpm`} />}
                {ctx.min != null && ctx.max != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.range', 'Plage')} value={`${ctx.min} – ${ctx.max}`} />
                )}
                {ctx.avg != null && <StatTile label={t('calendar.heatmap.recapDetail.avg', 'Moyenne')} value={`${ctx.avg} bpm`} />}
              </div>
              {ctx.hasChart ? (
                <Section title={t('calendar.heatmap.recapDetail.hrCurve', 'Courbe sur 24 h')}>
                  <CalendarDayMetricSparkline data={ctx.chartPoints} dataKey="bpm" color="#ef4444" unit=" bpm" height={220} />
                </Section>
              ) : (
                <p className="text-xs text-slate-500">
                  {t('calendar.heatmap.recapDetail.noHrSeries', 'Courbe minute par minute non disponible — resynchronise Garmin pour l’obtenir.')}
                </p>
              )}
            </>
          )
        };
      }

      case 'stress': {
        const ctx = buildStressDetailContext(garminData, dateStr);
        if (!ctx) return { empty: t('calendar.heatmap.recapDetail.noStress', 'Pas de données stress.') };
        return {
          title: t('calendar.heatmap.garminRecap.stress', 'Stress'),
          body: (
            <>
              <div className="grid grid-cols-2 gap-3">
                {ctx.average != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.avg', 'Moyenne')} value={`${Math.round(ctx.average)} / 100`} />
                )}
                {ctx.max != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.max', 'Pic')} value={`${Math.round(ctx.max)} / 100`} />
                )}
              </div>
              {ctx.hasChart ? (
                <Section title={t('calendar.heatmap.recapDetail.stressCurve', 'Évolution dans la journée')}>
                  <CalendarDayMetricSparkline
                    data={ctx.chartPoints}
                    dataKey="level"
                    color="#f97316"
                    yDomain={[0, 100]}
                    height={220}
                  />
                </Section>
              ) : (
                <p className="text-xs text-slate-500">
                  {t('calendar.heatmap.recapDetail.noStressSeries', 'Graphique détaillé non disponible — seule la moyenne journalière est synchronisée.')}
                </p>
              )}
            </>
          )
        };
      }

      case 'bodyBattery': {
        const ctx = buildBodyBatteryDetailContext(garminData, dateStr);
        if (!ctx) return { empty: t('calendar.heatmap.recapDetail.noBb', 'Pas de Body Battery.') };
        return {
          title: 'Body Battery',
          body: (
            <>
              <div className="grid grid-cols-3 gap-3">
                {ctx.current != null && <StatTile label={t('calendar.heatmap.recapDetail.current', 'Niveau')} value={String(Math.round(ctx.current))} />}
                {ctx.charged != null && <StatTile label={t('calendar.heatmap.recapDetail.charged', 'Rechargé')} value={`+${Math.round(ctx.charged)}`} />}
                {ctx.drained != null && <StatTile label={t('calendar.heatmap.recapDetail.drained', 'Dépensé')} value={`−${Math.round(ctx.drained)}`} />}
              </div>
              {ctx.hasChart && (
                <CalendarDayMetricSparkline data={ctx.chartPoints} dataKey="level" color="#3b82f6" yDomain={[0, 100]} height={200} />
              )}
            </>
          )
        };
      }

      case 'workout': {
        const ctx = buildWorkoutDetailContext(workoutData, dateStr, intensity, garminData);
        return {
          title: t('calendar.heatmap.momentumRecap.workout', 'Entraînement'),
          body: (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile label={t('calendar.heatmap.recapDetail.exercises', 'Exercices')} value={String(ctx.count)} />
                <StatTile label={t('calendar.heatmap.recapDetail.totalReps', 'Reps totales')} value={String(ctx.totalReps)} />
                <StatTile label={t('calendar.heatmap.recapDetail.duration', 'Durée')} value={`${ctx.durationMin} min`} />
                {ctx.caloriesKcal != null ? (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.streetCalories', 'Calories (Garmin)')}
                    value={`${formatLocale(ctx.caloriesKcal, locale)} kcal`}
                    hint={
                      ctx.avgCaloriesKcal != null
                        ? t('calendar.heatmap.recapDetail.streetCaloriesAvg', {
                            avg: formatLocale(ctx.avgCaloriesKcal, locale),
                            count: ctx.avgSampleCount,
                            defaultValue: `Moy. street : ${ctx.avgCaloriesKcal} kcal (${ctx.avgSampleCount} séance(s))`
                          })
                        : t('calendar.heatmap.recapDetail.streetCaloriesNoAvg', 'Pas assez d’autres séances street pour une moyenne')
                    }
                  />
                ) : (
                  <StatTile
                    label={t('calendar.heatmap.recapDetail.streetCalories', 'Calories (Garmin)')}
                    value="—"
                    hint={t(
                      'calendar.heatmap.recapDetail.streetCaloriesMissing',
                      'Synchronise Garmin ou vérifie l’activité « Cardio » du jour'
                    )}
                  />
                )}
              </div>
              {ctx.exercises.length > 0 && (
                <Section title={t('calendar.heatmap.recapDetail.exerciseList', 'Exercices cochés')}>
                  <ul className="divide-y divide-slate-800 rounded-lg border border-slate-700/50 overflow-hidden">
                    {ctx.exercises.map((ex, i) => (
                      <li key={`${ex.name}-${i}`} className="flex items-center justify-between px-3 py-2.5 text-sm">
                        <span className="text-white truncate pr-2">{ex.name}</span>
                        <span className="shrink-0 tabular-nums text-sky-400">
                          {ex.reps > 0
                            ? (ex.displayValue || `${ex.reps} reps`)
                            : t('calendar.heatmap.recapDetail.checked', 'Coché')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )
        };
      }

      case 'stretch': {
        const ctx = buildStretchDetailContext(workoutData, dateStr, programs);
        return {
          title: t('calendar.heatmap.momentumRecap.stretch', 'Étirements'),
          body: (
            <>
              <StatTile
                label={t('calendar.heatmap.recapDetail.stretchProgress', 'Progression')}
                value={
                  ctx.plannedCount > 0
                    ? `${ctx.checkedCount}/${ctx.plannedCount}`
                    : String(ctx.checkedCount)
                }
              />
              {ctx.items.length > 0 && (
                <ul className="divide-y divide-slate-800 rounded-lg border border-slate-700/50 overflow-hidden">
                  {ctx.items.map((it) => (
                    <li key={`${it.moment}-${it.id}`} className="px-3 py-2.5 text-sm text-white">
                      <span className="text-slate-400 capitalize">{it.moment}</span>
                      <span className="mx-2 text-slate-600">·</span>
                      {it.name}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        };
      }

      case 'momentumRun': {
        const ctx = buildRunningDetailContext(workoutData, dateStr, row.id);
        if (!ctx) return { empty: t('calendar.heatmap.recapDetail.noRun', 'Aucune course enregistrée.') };
        return {
          title: t('calendar.heatmap.momentumRecap.running', 'Course'),
          body: (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {ctx.distanceKm > 0 && (
                  <StatTile label={t('calendar.heatmap.recapDetail.distance', 'Distance')} value={`${ctx.distanceKm} km`} />
                )}
                {ctx.duration && <StatTile label={t('calendar.heatmap.recapDetail.duration', 'Durée')} value={ctx.duration} />}
                {ctx.pace && <StatTile label={t('calendar.heatmap.recapDetail.pace', 'Allure')} value={`${ctx.pace} /km`} />}
                {ctx.speed && <StatTile label={t('calendar.heatmap.recapDetail.speed', 'Vitesse')} value={`${ctx.speed} km/h`} />}
                {ctx.elevation != null && ctx.elevation !== '' && (
                  <StatTile label={t('calendar.heatmap.recapDetail.elevation', 'D+')} value={`${ctx.elevation} m`} />
                )}
              </div>
              {ctx.notes && (
                <p className="rounded-lg border border-slate-700/50 bg-black/80 px-3 py-2 text-sm text-slate-300">{ctx.notes}</p>
              )}
              {typeof updateData === 'function' && ctx.session && (
                <CalendarSessionDateReassign
                  session={ctx.session}
                  activityType="running"
                  workoutData={workoutData}
                  updateData={updateData}
                  t={t}
                />
              )}
              {ctx.allSessions.length > 1 && (
                <p className="text-xs text-slate-500">
                  {t('calendar.heatmap.recapDetail.multiRun', {
                    count: ctx.allSessions.length,
                    defaultValue: `${ctx.allSessions.length} sorties ce jour — détail de la première ligne sélectionnée.`
                  })}
                </p>
              )}
            </>
          )
        };
      }

      case 'activity': {
        const ctx = buildGarminActivityDetailContext(garminData, dateStr, row.id, workoutData);
        if (!ctx) return { empty: t('calendar.heatmap.recapDetail.noActivity', 'Activité introuvable.') };
        const garminSession = ctx.act
          ? {
              ...ctx.act,
              garminId: ctx.act.garminId ?? ctx.act.id,
              source: 'garmin',
              date: ctx.act.date
            }
          : null;
        return {
          title: ctx.title,
          body: (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {ctx.durationMin > 0 && (
                  <StatTile label={t('calendar.heatmap.recapDetail.duration', 'Durée')} value={`${ctx.durationMin} min`} />
                )}
                {ctx.calories != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.calories', 'Calories')} value={`${ctx.calories} kcal`} />
                )}
                {ctx.distanceM != null && ctx.distanceM > 0 && (
                  <StatTile label={t('calendar.heatmap.recapDetail.distance', 'Distance')} value={`${(ctx.distanceM / 1000).toFixed(2)} km`} />
                )}
                {ctx.avgHR != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.avgHr', 'FC moy.')} value={`${ctx.avgHR} bpm`} />
                )}
                {ctx.maxHR != null && (
                  <StatTile label={t('calendar.heatmap.recapDetail.maxHr', 'FC max')} value={`${ctx.maxHR} bpm`} />
                )}
              </div>
              {typeof updateData === 'function' && garminSession?.garminId != null && (
                <CalendarSessionDateReassign
                  session={garminSession}
                  activityType={ctx.isRun ? 'running' : 'cardio'}
                  workoutData={workoutData}
                  updateData={updateData}
                  t={t}
                />
              )}
            </>
          )
        };
      }

      default:
        return { empty: t('calendar.heatmap.recapDetail.unsupported', 'Détail non disponible.') };
    }
  }, [row, dateStr, garminData, workoutData, intensity, programs, manualWalk, locale, t, updateData, showWalkEditor]);

  if (!content) return null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-sky-400 hover:text-sky-200"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('calendar.heatmap.recapDetail.back', 'Retour au récap')}
      </button>

      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: row.iconBg }}
        >
          {row.icon}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white">{content.title || row.title}</h4>
          {row.subtitle ? <p className="text-sm text-slate-400">{row.subtitle}</p> : null}
        </div>
      </div>

      {content.empty ? (
        <p className="rounded-lg border border-slate-700/50 bg-black/80 px-4 py-6 text-center text-sm text-slate-400">
          {content.empty}
        </p>
      ) : (
        <div className="space-y-5">{content.body}</div>
      )}
    </div>
  );
}
