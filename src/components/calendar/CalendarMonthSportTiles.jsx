import React from 'react';
import { Crown } from 'lucide-react';
import { formatCalendarSportDuration } from '../../utils/calendarSportStatsFormat';
import { formatCalendarHighlightDayLabel } from '../../utils/calendarMonthHighlights';

function RecordTile({ metric, value, label, holders, monthIndex, className = '' }) {
  const isRecord = holders?.[metric] === monthIndex;
  return (
    <div
      className={`relative rounded p-1.5 text-center ${
        isRecord ? 'bg-amber-900/35 ring-1 ring-amber-400/50' : className || 'bg-slate-800/55 ring-1 ring-slate-600/30'
      }`}
    >
      {isRecord ? (
        <Crown className="absolute right-1 top-0.5 h-3 w-3 text-amber-300" aria-hidden />
      ) : null}
      <div className="font-bold tabular-nums text-white">{value}</div>
      <div className="leading-tight text-slate-400">{label}</div>
    </div>
  );
}

function HighlightButton({ onOpen, value, label, tone, dateYmd, disabled }) {
  const tones = {
    teal: 'bg-teal-900/35 ring-teal-500/30 hover:bg-teal-900/55 text-teal-100',
    amber: 'bg-amber-900/30 ring-amber-500/30 hover:bg-amber-900/50 text-amber-100',
    sky: 'bg-sky-900/35 ring-sky-500/30 hover:bg-sky-900/55 text-sky-100',
    orange: 'bg-orange-900/35 ring-orange-500/35 hover:bg-orange-900/55 text-orange-100',
    emerald: 'bg-emerald-900/35 ring-emerald-500/30 hover:bg-emerald-900/55 text-emerald-100'
  };
  const cls = `rounded p-1.5 text-center ring-1 ${tones[tone] || tones.teal}`;
  if (disabled) {
    return (
      <div className={`${cls} opacity-80`}>
        <div className="font-bold tabular-nums">{value}</div>
        <div className="leading-tight text-slate-400">{label}</div>
      </div>
    );
  }
  return (
    <button type="button" onClick={onOpen} className={`${cls} transition`}>
      <div className="font-bold tabular-nums">{value}</div>
      <div className="leading-tight opacity-80">{label}</div>
      {dateYmd ? (
        <div className="mt-0.5 text-[9px] text-slate-400">{formatCalendarHighlightDayLabel(dateYmd)}</div>
      ) : null}
    </button>
  );
}

export default function CalendarMonthSportTiles({
  sportStats,
  highlights,
  holders,
  monthIndex,
  t,
  onOpenHighlight
}) {
  const s = sportStats || {};
  const h = highlights || {};
  const weeks = Array.isArray(h.weekStepAvgs) ? h.weekStepAvgs : [0, 0, 0, 0];
  const bestSteps = h.bestDaySteps;
  const bestReps = h.bestDayReps;
  const bestVol = h.bestDayVolumeKg;
  const bestRun = h.bestRun;
  const bestKcal = h.bestKcalDay;

  return (
    <div className="space-y-1.5 text-[10px]">
      <div className="grid grid-cols-3 gap-1">
        <RecordTile
          metric="totalReps"
          value={String(s.totalReps || 0)}
          label={t('calendar.stats.monthReps')}
          holders={holders}
          monthIndex={monthIndex}
        />
        <RecordTile
          metric="otherExerciseMinutes"
          value={formatCalendarSportDuration(s.otherExerciseMinutes)}
          label={t('calendar.stats.monthOtherExerciseTime')}
          holders={holders}
          monthIndex={monthIndex}
        />
        <RecordTile
          metric="totalMinutes"
          value={formatCalendarSportDuration(s.totalMinutes)}
          label={t('calendar.stats.monthTotalTime')}
          holders={holders}
          monthIndex={monthIndex}
        />
        <RecordTile
          metric="totalKg"
          value={`${s.totalKg || 0} kg`}
          label={t('calendar.stats.monthKgLifted')}
          holders={holders}
          monthIndex={monthIndex}
        />
        <RecordTile
          metric="longestStreak"
          value={String(s.longestStreak || 0)}
          label={t('calendar.stats.monthLongestStreak')}
          holders={holders}
          monthIndex={monthIndex}
        />
        <RecordTile
          metric="trainingDays"
          value={String(s.trainingDays ?? 0)}
          label={t('calendar.stats.monthTrainingDays')}
          holders={holders}
          monthIndex={monthIndex}
        />
      </div>

      <div className="grid grid-cols-3 gap-1 border-t border-sky-900/40 pt-1.5">
        <RecordTile
          metric="runningKm"
          value={`${s.runningKm || 0} km`}
          label={t('calendar.stats.monthRunningKm')}
          holders={holders}
          monthIndex={monthIndex}
          className="bg-sky-950/35 ring-1 ring-sky-700/30"
        />
        <RecordTile
          metric="runningMinutes"
          value={formatCalendarSportDuration(s.runningMinutes)}
          label={t('calendar.stats.monthRunningTime')}
          holders={holders}
          monthIndex={monthIndex}
          className="bg-sky-950/35 ring-1 ring-sky-700/30"
        />
        <RecordTile
          metric="runningSessionCount"
          value={String(s.runningSessionCount || 0)}
          label={t('calendar.stats.monthRunSessions', 'Sorties course')}
          holders={holders}
          monthIndex={monthIndex}
          className="bg-sky-950/35 ring-1 ring-sky-700/30"
        />
        <HighlightButton
          tone="sky"
          value={bestRun ? `${bestRun.km} km` : '0 km'}
          label={t('calendar.stats.monthBestRun', 'Meilleure course')}
          dateYmd={bestRun?.dateYmd}
          disabled={!bestRun}
          onOpen={() => onOpenHighlight(bestRun.dateYmd, bestRun.scrollAnchor)}
        />
      </div>

      <div className="grid grid-cols-3 gap-1 border-t border-emerald-900/40 pt-1.5">
        <RecordTile
          metric="totalSteps"
          value={(s.totalSteps || h.totalSteps || 0).toLocaleString('fr-FR')}
          label={t('calendar.stats.monthTotalSteps', 'Pas du mois')}
          holders={holders}
          monthIndex={monthIndex}
          className="bg-emerald-950/35 ring-1 ring-emerald-700/30"
        />
        <HighlightButton
          tone="emerald"
          value={bestSteps ? bestSteps.steps.toLocaleString('fr-FR') : '0'}
          label={t('calendar.stats.monthBestSteps', 'Jour le plus de pas')}
          dateYmd={bestSteps?.dateYmd}
          disabled={!bestSteps}
          onOpen={() => onOpenHighlight(bestSteps.dateYmd, bestSteps.scrollAnchor)}
        />
        <div className="rounded bg-emerald-950/30 p-1.5 text-center ring-1 ring-emerald-700/25">
          <div className="font-bold tabular-nums text-emerald-100">
            {(h.avgStepsPerDay || 0).toLocaleString('fr-FR')}
          </div>
          <div className="leading-tight text-emerald-300/80">
            {t('calendar.stats.monthAvgSteps', 'Pas moy. (jours actifs)')}
          </div>
        </div>
        {weeks.map((avg, i) => (
          <div
            key={`w${i}`}
            className="rounded bg-emerald-950/25 p-1.5 text-center ring-1 ring-emerald-800/20"
          >
            <div className="font-bold tabular-nums text-emerald-50">{avg.toLocaleString('fr-FR')}</div>
            <div className="leading-tight text-emerald-400/80">
              {t('calendar.stats.monthWeekSteps', 'S{{n}} pas moy.', { n: i + 1 })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 border-t border-orange-900/40 pt-1.5">
        <RecordTile
          metric="activeKcal"
          value={`${Math.round(s.activeKcal || 0).toLocaleString('fr-FR')} kcal`}
          label={t('calendar.stats.monthActiveKcal')}
          holders={holders}
          monthIndex={monthIndex}
          className="bg-orange-950/30 ring-1 ring-orange-700/25"
        />
        <HighlightButton
          tone="orange"
          value={bestKcal ? bestKcal.value.toLocaleString('fr-FR') : '0'}
          label={t('calendar.stats.monthBestKcal', 'Record kcal')}
          dateYmd={bestKcal?.dateYmd}
          disabled={!bestKcal}
          onOpen={() => onOpenHighlight(bestKcal.dateYmd, bestKcal.scrollAnchor)}
        />
        <div className="rounded bg-orange-950/25 p-1.5 text-center ring-1 ring-orange-800/20">
          <div className="font-bold tabular-nums text-orange-100">
            {(h.avgKcalPerDay || 0).toLocaleString('fr-FR')}
          </div>
          <div className="leading-tight text-orange-300/80">
            {t('calendar.stats.monthAvgKcal', 'Kcal moy. / jour')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-t border-violet-900/40 pt-1.5">
        <div className="rounded bg-indigo-950/35 p-1.5 text-center ring-1 ring-indigo-600/25">
          <div className="font-bold tabular-nums text-indigo-100">{`${h.avgSleepHours || 0} h`}</div>
          <div className="leading-tight text-indigo-300/80">
            {t('calendar.stats.monthAvgSleep', 'Sommeil moy.')}
          </div>
        </div>
        <div className="rounded bg-violet-950/40 p-1.5 text-center ring-1 ring-violet-500/25">
          <div className="font-bold tabular-nums text-violet-100">
            {h.restDaysChecked || 0}/{h.restDaysPlanned || 0}
          </div>
          <div className="leading-tight text-violet-300/80">
            {t('calendar.stats.monthRestRatio', 'Repos cochés / prévus')}
          </div>
        </div>
        <div className="rounded bg-pink-950/35 p-1.5 text-center ring-1 ring-pink-500/25">
          <div className="font-bold tabular-nums text-pink-100">{h.stretchCount || 0}</div>
          <div className="leading-tight text-pink-300/80">
            {t('calendar.stats.monthStretches', 'Étirements')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-t border-slate-700/40 pt-1.5">
        <HighlightButton
          tone="teal"
          value={bestReps ? String(bestReps.value) : '0'}
          label={t('calendar.stats.monthBestReps', 'Meilleur jour reps')}
          dateYmd={bestReps?.dateYmd}
          disabled={!bestReps}
          onOpen={() => onOpenHighlight(bestReps.dateYmd, bestReps.scrollAnchor)}
        />
        <HighlightButton
          tone="amber"
          value={bestVol ? `${bestVol.valueKg.toLocaleString('fr-FR')} kg` : '0 kg'}
          label={t('calendar.stats.monthBestDayVolume', 'Meilleur jour volume')}
          dateYmd={bestVol?.dateYmd}
          disabled={!bestVol}
          onOpen={() => onOpenHighlight(bestVol.dateYmd, bestVol.scrollAnchor)}
        />
        <div className="col-span-1 rounded bg-slate-800/60 p-1.5 text-center ring-1 ring-slate-600/40">
          <div className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
            {t('calendar.stats.monthTopMuscles', 'Top muscles')}
          </div>
          <div className="mt-0.5 text-[10px] leading-snug text-slate-200">
            {h.topMuscles?.length
              ? h.topMuscles.map((m, i) => `${i + 1}. ${m.label}`).join(' · ')
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
