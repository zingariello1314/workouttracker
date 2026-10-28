import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import { analyzeRunningSessionFactors } from '../../../../utils/trainingLoadUtils';
import { formatTimelineRowSummary } from '../../../../utils/sport/recapEnrichmentMetrics';
import RecapExerciseProgressionPanel from '../RecapExerciseProgressionPanel';

const FILTER_ALL = 'all';
const PAGE_SIZE = 15;

const TYPE_MARK = {
  running: 'road',
  swimming: 'timer',
  boxing: 'timer',
  jumprope: 'timer',
  pushups: 'dumb',
  gainage: 'timer',
  strength: 'dumb',
  circuit: 'dumb'
};

const TYPE_TONE = {
  running: 'var(--a5)',
  swimming: 'var(--a5)',
  boxing: 'var(--a3)',
  jumprope: 'var(--a1)',
  pushups: 'var(--a3)',
  gainage: 'var(--d)',
  strength: 'var(--a1)',
  circuit: 'var(--a4)'
};

function splitDay(dateYmd) {
  const [y, m, d] = String(dateYmd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return {
    day: String(d).padStart(2, '0'),
    month: date.toLocaleDateString(undefined, { month: 'short' }),
    week: date.toLocaleDateString(undefined, { weekday: 'short' })
  };
}

function groupByDate(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const d = row.dateYmd;
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(row);
  });
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export default function RecapSessionsView({
  digest,
  enrichment,
  period,
  periodWindow,
  snapshot,
  getExerciseNameById,
  onOpenEndurance,
  paneActive = true
}) {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const [filter, setFilter] = useState(FILTER_ALL);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [progressionOn, setProgressionOn] = useState(false);

  useEffect(() => {
    if (!paneActive || progressionOn) return undefined;
    const run = () => setProgressionOn(true);
    const handle = window.requestIdleCallback
      ? window.requestIdleCallback(run, { timeout: 900 })
      : window.setTimeout(run, 320);
    return () => {
      if (window.requestIdleCallback) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [paneActive, progressionOn]);

  const timeline = enrichment?.timeline?.rows || [];
  const totalsByType = enrichment?.timeline?.totalsByType || {};

  const activityFilters = useMemo(() => {
    const types = Object.keys(totalsByType).filter((k) => totalsByType[k] > 0);
    return [
      { id: FILTER_ALL, label: t('recap.sessions.filterAll', 'Tout'), count: timeline.length },
      ...types.map((id) => ({
        id,
        label: t(`recap.sessions.type.${id}`, id),
        count: totalsByType[id]
      }))
    ];
  }, [totalsByType, timeline.length, t]);

  const filtered = useMemo(() => {
    return filter === FILTER_ALL ? timeline : timeline.filter((r) => r.activityType === filter);
  }, [timeline, filter]);

  const grouped = useMemo(() => {
    return groupByDate(filtered.slice(0, visibleCount));
  }, [filtered, visibleCount]);

  const periodLabel = t(`recap.period.${period}`);

  return (
    <div id="recap-sessions-feedback" className="rb-sess scroll-mt-28">
      <header id="j-journal" className="jh">
        <span className="ico" />
        <div>
          <h2>{t('recap.sessions.journalTitle', 'Journal des séances')}</h2>
          <p>
            {t(
              'recap.sessions.journalSubtitle',
              'Historique chronologique — muscu, endurance et circuits sur la période.'
            )}
          </p>
          <div className="mt">
            {t('recap.periodNote', { label: periodLabel })} · {filtered.length}{' '}
            {filtered.length > 1 ? 'entrées' : 'entrée'}
          </div>
        </div>
      </header>

      <div id="j-prog">
      {progressionOn && snapshot && getExerciseNameById ? (
        <RecapExerciseProgressionPanel
          snapshot={snapshot}
          window={periodWindow}
          getExerciseNameById={getExerciseNameById}
          periodLabel={periodLabel}
        />
      ) : null}
      </div>

      <section id="j-hist">
      <div className="sh">
        <h2>{t('recap.sessions.historyTitle', 'Historique')}</h2>
      </div>
      {activityFilters.length > 1 ? (
        <div className="jf">
          {activityFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setVisibleCount(PAGE_SIZE);
              }}
              className={filter === f.id ? 'on' : undefined}
            >
              {f.label}
              <b>{f.count}</b>
            </button>
          ))}
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <p className="emp">
          {t('recap.sessions.emptyPeriod', 'Aucune séance enregistrée sur cette période.')}
        </p>
      ) : (
        <div>
          {grouped.map(([dateYmd, dayRows]) => {
            const parts = splitDay(dateYmd);
            return (
            <section key={dateYmd} className="dg">
              <div>
                <div className="dd">{parts?.day || ''}</div>
                <div className="dm">{parts?.month || formatDate(dateYmd)}</div>
                <div className="dc">
                  {parts?.week ? `${parts.week} · ` : ''}
                  {dayRows.length} activité{dayRows.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="evl">
                {dayRows.map((row) => {
                  const s = row.raw;
                  const summary = formatTimelineRowSummary(row);
                  const typeLabel = t(`recap.sessions.type.${row.activityType}`, row.activityType);
                  const mark = TYPE_MARK[row.activityType] || 'timer';
                  const isGarmin =
                    row.activityType === 'running' && Boolean(s?.garminId || s?.source === 'garmin');
                  const rf = row.runningFactors || (s ? analyzeRunningSessionFactors(s) : null);
                  const typeKey = rf?.type || s?.type;

                  return (
                    <div
                      key={row.id}
                      className="ev"
                      style={{ '--c': TYPE_TONE[row.activityType] || 'var(--d)' }}
                    >
                      <span className={`et ${mark}`} />
                      <div className="min-w-0">
                        <div className="en">{typeLabel}</div>
                        <div className="es">
                          {summary.secondary ? <span>{summary.secondary}</span> : null}
                          {isGarmin ? <span>Garmin</span> : null}
                          {typeKey && row.activityType === 'running' ? (
                            <span>{t('recap.endurance.row.runType', { type: typeKey })}</span>
                          ) : null}
                          {s?.avgHR ? <span>FC moy. {s.avgHR}</span> : null}
                          {row.activityType === 'strength' ? (
                            <span>Séance musculation enregistrée</span>
                          ) : null}
                        </div>
                      </div>
                      {summary.primary ? <span className="vc">{summary.primary}</span> : null}
                    </div>
                  );
                })}
              </div>
            </section>
            );
          })}
        </div>
      )}

      {filtered.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          className="more"
        >
          {t('recap.sessions.loadMore', 'Afficher plus')} ({filtered.length - visibleCount} restantes)
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onOpenEndurance?.('running')}
        className="go"
      >
        {t('recap.sessions.viewAll', 'Voir l’historique complet dans Endurance')}
        <ChevronRight size={16} />
      </button>
      </section>
    </div>
  );
}
