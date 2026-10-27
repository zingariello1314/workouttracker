import React, { useMemo } from 'react';
import { CalendarRange, Crown } from 'lucide-react';
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
  { id: 'endurance', color: 'var(--t-ef)', labelKey: 'endurance.running.historyFilter.kind.endurance' },
  { id: 'speed', color: 'var(--t-vit)', labelKey: 'endurance.running.historyFilter.kind.speed' },
  { id: 'interval', color: 'var(--t-fract)', labelKey: 'endurance.running.historyFilter.kind.interval' }
];

function HighlightCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div>
      <span className="lab" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <i className="dot" style={{ '--c': accent || 'var(--accent)' }} />
        {Icon ? <Icon className="ic" /> : null}
        {label}
      </span>
      <b className="num">{value}</b>
      {sub ? <div className="tiny">{sub}</div> : null}
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
    <div className="mrow">
      <div className="nm">
        <i className="dot" style={{ '--c': color }} />
        {label}
      </div>
      <div className="mb">
        <div className="bar" style={{ '--c': color }}>
          <i style={{ width: `${Math.min(100, actualPct)}%` }} />
        </div>
      </div>
      <div className="v num">
        <b>{actualPct}%</b>
        <span>
          {km} km · {sessions} séance(s)
        </span>
      </div>
      <div className="d num">
        {showIdeal && idealPct != null ? (
          <>
            {t('endurance.running.insights.idealShort', { pct: idealPct })}
            {deltaLabel ? <em>{deltaLabel}</em> : null}
          </>
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
      <section style={{ marginBottom: 64 }}>
        <div className="sec-h">
          <div>
            <h2>{t('endurance.running.insights.title')}</h2>
            <p>{t('endurance.running.insights.empty')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: 64 }}>
      <div className="sec-h">
        <div>
          <h2>{t('endurance.running.insights.title')}</h2>
          <p>{t('endurance.running.insights.subtitle')}</p>
        </div>
      </div>

      <div className="two">
        <HighlightCard
          icon={CalendarRange}
          accent="var(--t-fract)"
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
          accent="var(--t-vit)"
          label={t('endurance.running.insights.bestDay')}
          value={highlights.bestDay ? `${highlights.bestDay.km} km` : '—'}
          sub={
            highlights.bestDay
              ? formatDate(highlights.bestDay.date)
              : t('endurance.running.stats.noRecord')
          }
        />
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="sec-h">
          <div>
            <h2>{t('endurance.running.insights.distributionTitle')}</h2>
            <p>
              {t('endurance.running.insights.distributionHint', {
                km: distribution.totalKm,
                sessions: distribution.totalSessions
              })}
            </p>
          </div>
        </div>

        <p className="lab" style={{ marginBottom: 4 }}>
          {t('endurance.running.insights.macroSummaryTitle')}
        </p>
        <div style={{ marginBottom: 28 }}>
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

        <p className="lab" style={{ marginBottom: 4 }}>
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

        <div className="note">
          {t('endurance.running.insights.idealFootnote')}{' '}
          {t(profileHintKey)}
          {t('endurance.running.insights.idealFootnoteEnd')}
        </div>
      </div>
    </section>
  );
}
