import React, { useMemo, useState } from 'react';
import { Calendar, ChevronRight, Dumbbell, Footprints, Timer } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import { analyzeRunningSessionFactors } from '../../../../utils/trainingLoadUtils';
import { formatTimelineRowSummary } from '../../../../utils/sport/recapEnrichmentMetrics';
import RecapExerciseProgressionPanel from '../RecapExerciseProgressionPanel';

const FILTER_ALL = 'all';
const PAGE_SIZE = 15;

const TYPE_ICONS = {
  running: Footprints,
  swimming: Timer,
  boxing: Timer,
  jumprope: Timer,
  pushups: Dumbbell,
  gainage: Timer,
  strength: Dumbbell,
  circuit: Dumbbell
};

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
  onOpenEndurance
}) {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const [filter, setFilter] = useState(FILTER_ALL);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    <div className="space-y-5">
      <header className="rounded-xl border border-[#0F4C5C]/55 bg-gradient-to-br from-teal-950/30 to-black px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-teal-500/30 bg-teal-950/40 p-2.5">
            <Calendar size={20} className="text-teal-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t('recap.sessions.journalTitle', 'Journal des séances')}
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xl">
              {t(
                'recap.sessions.journalSubtitle',
                'Historique chronologique — muscu, endurance et circuits sur la période.'
              )}
            </p>
            <p className="mt-2 text-[11px] font-medium text-teal-500/90">
              {t('recap.periodNote', { label: periodLabel })} · {filtered.length}{' '}
              {filtered.length > 1 ? 'entrées' : 'entrée'}
            </p>
          </div>
        </div>
      </header>

      {snapshot && getExerciseNameById ? (
        <RecapExerciseProgressionPanel
          snapshot={snapshot}
          window={periodWindow}
          getExerciseNameById={getExerciseNameById}
          periodLabel={periodLabel}
        />
      ) : null}

      {activityFilters.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {activityFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                filter === f.id
                  ? 'border-teal-400/60 bg-teal-950/50 text-teal-100'
                  : 'border-[#0F4C5C]/45 bg-black/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
              <span className="ml-1 tabular-nums opacity-70">{f.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <p className="rounded-xl border border-[#0F4C5C]/40 bg-black/50 px-4 py-8 text-center text-sm text-slate-500">
          {t('recap.sessions.emptyPeriod', 'Aucune séance enregistrée sur cette période.')}
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateYmd, dayRows]) => (
            <section key={dateYmd} className="rounded-xl border border-[#0F4C5C]/50 bg-black/70 overflow-hidden">
              <div className="border-b border-[#0F4C5C]/35 bg-teal-950/20 px-3 py-2">
                <span className="text-xs font-semibold text-teal-300">{formatDate(dateYmd)}</span>
                <span className="ml-2 text-[10px] text-slate-500">
                  {dayRows.length} activité{dayRows.length > 1 ? 's' : ''}
                </span>
              </div>
              <ul className="divide-y divide-[#0F4C5C]/25">
                {dayRows.map((row) => {
                  const s = row.raw;
                  const summary = formatTimelineRowSummary(row);
                  const typeLabel = t(`recap.sessions.type.${row.activityType}`, row.activityType);
                  const Icon = TYPE_ICONS[row.activityType] || Footprints;
                  const isGarmin =
                    row.activityType === 'running' && Boolean(s?.garminId || s?.source === 'garmin');
                  const rf = row.runningFactors || (s ? analyzeRunningSessionFactors(s) : null);
                  const typeKey = rf?.type || s?.type;

                  return (
                    <li key={row.id} className="flex items-start gap-3 px-3 py-3">
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#0F4C5C]/40"
                        style={{ backgroundColor: `${row.meta?.color || '#94a3b8'}18` }}
                      >
                        <Icon size={14} style={{ color: row.meta?.color || '#94a3b8' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-white">{typeLabel}</span>
                          {summary.primary ? (
                            <span className="text-sm font-bold tabular-nums text-emerald-300">
                              {summary.primary}
                            </span>
                          ) : null}
                          {summary.secondary ? (
                            <span className="text-xs tabular-nums text-slate-400">{summary.secondary}</span>
                          ) : null}
                          {isGarmin ? (
                            <span className="rounded-full border border-sky-500/40 bg-sky-950/40 px-1.5 py-0.5 text-[9px] text-sky-200">
                              Garmin
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-slate-500">
                          {typeKey && row.activityType === 'running' ? (
                            <span>{t('recap.endurance.row.runType', { type: typeKey })}</span>
                          ) : null}
                          {s?.avgHR ? <span>FC moy. {s.avgHR}</span> : null}
                          {row.activityType === 'strength' ? (
                            <span>Séance musculation enregistrée</span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {filtered.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          className="w-full rounded-xl border border-[#0F4C5C]/45 bg-black/40 py-2.5 text-xs font-medium text-teal-300 hover:bg-teal-950/20"
        >
          {t('recap.sessions.loadMore', 'Afficher plus')} ({filtered.length - visibleCount} restantes)
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onOpenEndurance?.('running')}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F5C45]/55 bg-[#0F5C45]/20 px-4 py-3 text-sm font-medium text-emerald-100 transition-colors hover:bg-[#0F5C45]/30"
      >
        {t('recap.sessions.viewAll', 'Voir l’historique complet dans Endurance')}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
