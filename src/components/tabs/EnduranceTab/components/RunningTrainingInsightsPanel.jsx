import React, { useMemo } from 'react';
import { BarChart3, CalendarRange, Crown, PieChart, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { normalizeProfileQuestionnaire } from '../../../../features/profileQuestionnaire/schema';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import {
  buildRunningSessionRows,
  computeRunningVolumeHighlights,
  estimateMaxHeartRate,
  resolveIdealRunningKindSplit
} from '../../../../utils/sport/runningCardioStatsAnalytics';
import {
  computeRunningTypeDistribution
} from '../../../../utils/runningSessionDistribution';

const MACRO_META = [
  { id: 'endurance', color: '#34d399', labelKey: 'endurance.running.historyFilter.kind.endurance' },
  { id: 'speed', color: '#fb7185', labelKey: 'endurance.running.historyFilter.kind.speed' },
  { id: 'interval', color: '#fbbf24', labelKey: 'endurance.running.historyFilter.kind.interval' }
];

function HighlightCard({ icon: Icon, iconClass, label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#0F4C5C]/50 bg-black/80 p-4">
      <div className={`mb-2 flex items-center gap-2 ${iconClass}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums text-white">{value}</div>
      {sub ? <p className="mt-1 text-[11px] leading-snug text-slate-500">{sub}</p> : null}
    </div>
  );
}

function TypeDistributionRow({ label, actualPct, idealPct, km, sessions, color, showIdeal, t }) {
  const delta =
    idealPct != null ? Math.round((actualPct - idealPct) * 10) / 10 : null;
  const deltaLabel =
    delta == null
      ? null
      : Math.abs(delta) < 2
        ? t('endurance.running.insights.deltaOk')
        : delta > 0
          ? t('endurance.running.insights.deltaOver', { delta: `+${delta}` })
          : t('endurance.running.insights.deltaUnder', { delta: String(delta) });

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-sm">
        <span className="font-medium text-teal-100">{label}</span>
        <span className="text-xs text-slate-400">
          {actualPct}% · {km} km · {sessions} séance(s)
          {showIdeal && idealPct != null ? (
            <>
              <span className="mx-1 text-slate-600">|</span>
              {t('endurance.running.insights.idealShort', { pct: idealPct })}
              {deltaLabel ? (
                <span
                  className={`ml-1 ${Math.abs(delta) < 2 ? 'text-emerald-400/90' : 'text-amber-300/90'}`}
                >
                  ({deltaLabel})
                </span>
              ) : null}
            </>
          ) : null}
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-800/90">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, actualPct)}%`, backgroundColor: color }}
        />
        {showIdeal && idealPct != null ? (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow"
            style={{ left: `calc(${Math.min(100, idealPct)}% - 1px)` }}
            title={t('endurance.running.insights.idealMarker', { pct: idealPct })}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function RunningTrainingInsightsPanel({
  sessions = [],
  garminById = null,
  garminRunningKindByGarminId = null
}) {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const { currentUser } = useAuth();

  const profileAnswers = useMemo(() => {
    const q = normalizeProfileQuestionnaire(currentUser?.profileQuestionnaire);
    return q?.answers || null;
  }, [currentUser?.profileQuestionnaire]);

  const classificationCtx = useMemo(() => {
    const age = profileAnswers?.vitalsSelfReport?.age;
    return { age: Number.isFinite(Number(age)) ? Number(age) : null };
  }, [profileAnswers]);

  const fcMax = useMemo(
    () =>
      estimateMaxHeartRate(sessions, garminById, {
        ageYears: classificationCtx?.age ?? null,
        garminCardioActivities: garminById instanceof Map ? [...garminById.values()] : null
      }),
    [sessions, garminById, classificationCtx]
  );

  const rows = useMemo(
    () =>
      buildRunningSessionRows(
        sessions,
        garminById,
        classificationCtx,
        garminRunningKindByGarminId
      ),
    [sessions, garminById, classificationCtx, garminRunningKindByGarminId]
  );

  const highlights = useMemo(() => computeRunningVolumeHighlights(rows), [rows]);
  const distribution = useMemo(
    () =>
      computeRunningTypeDistribution(rows, {
        garminById,
        fcMax,
        classificationCtx,
        garminRunningKindByGarminId
      }),
    [rows, garminById, fcMax, classificationCtx, garminRunningKindByGarminId]
  );
  const ideal = useMemo(() => resolveIdealRunningKindSplit(profileAnswers), [profileAnswers]);

  const profileHintKey = ideal.profile
    ? `endurance.running.insights.profile.${ideal.profile}`
    : 'endurance.running.insights.profile.mixed';

  if (!rows.length) {
    return (
      <section className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp className="h-5 w-5 text-sky-400" />
          {t('endurance.running.insights.title')}
        </h3>
        <p className="text-sm text-teal-800">{t('endurance.running.insights.empty')}</p>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-6">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp className="h-5 w-5 text-sky-400" />
          {t('endurance.running.insights.title')}
        </h3>
        <p className="mt-1 text-xs text-teal-700">{t('endurance.running.insights.subtitle')}</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <HighlightCard
          icon={CalendarRange}
          iconClass="text-amber-300"
          label={t('endurance.running.insights.bestWeek')}
          value={highlights.bestWeek ? `${highlights.bestWeek.km} km` : '—'}
          sub={
            highlights.bestWeek
              ? highlights.bestWeek.weekLabel
              : t('endurance.running.stats.noRecord')
          }
        />
        <HighlightCard
          icon={Crown}
          iconClass="text-rose-300"
          label={t('endurance.running.insights.bestDay')}
          value={highlights.bestDay ? `${highlights.bestDay.km} km` : '—'}
          sub={
            highlights.bestDay
              ? formatDate(highlights.bestDay.date)
              : t('endurance.running.stats.noRecord')
          }
        />
      </div>

      <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/60 p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-white">
            <PieChart className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold">{t('endurance.running.insights.distributionTitle')}</span>
          </div>
          <p className="max-w-md text-[11px] text-slate-500">
            {t('endurance.running.insights.distributionHint', {
              km: distribution.totalKm,
              sessions: distribution.totalSessions
            })}
          </p>
        </div>

        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t('endurance.running.insights.macroSummaryTitle')}
        </p>
        <div className="mb-5 space-y-3">
          {MACRO_META.map(({ id, color, labelKey }) => (
            <TypeDistributionRow
              key={`macro-${id}`}
              label={t(labelKey)}
              actualPct={distribution.macroKmPct[id]}
              idealPct={ideal[id]}
              km={distribution.macroKm[id]}
              sessions={distribution.items
                .filter((item) => item.macro === id)
                .reduce((s, item) => s + item.sessions, 0)}
              color={color}
              showIdeal
              t={t}
            />
          ))}
        </div>

        <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t('endurance.running.insights.typeDetailTitle')}
        </p>
        <div className="space-y-4">
          {distribution.items.map((item) => {
            const label = t(item.labelKey);
            const resolvedLabel = label && label !== item.labelKey ? label : item.type;
            return (
              <TypeDistributionRow
                key={item.type}
                label={resolvedLabel}
                actualPct={item.kmPct}
                km={item.km}
                sessions={item.sessions}
                color={item.color}
                showIdeal={false}
                t={t}
              />
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-start gap-2 rounded-lg border border-[#0F4C5C]/35 bg-black/50 px-4 py-3 text-[11px] text-slate-500">
          <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
          <p>
            {t('endurance.running.insights.idealFootnote')}{' '}
            <span className="text-teal-600">{t(profileHintKey)}</span>
            {t('endurance.running.insights.idealFootnoteEnd')}
          </p>
        </div>
      </div>
    </section>
  );
}
