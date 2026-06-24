import React, { useCallback, useMemo, useState } from 'react';
import { Trophy, Sparkles, Search } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import { useWorkout } from '../../../../context/WorkoutContext';
import {
  evaluateRunningTrophies,
  computeRunningTrophiesXp,
  describeRunningTrophyCurrentProgress,
  describeRunningTrophyLevelRequirement,
  runningTrophyLevelXpReward
} from '../../../../services/endurance/runningTrophiesService';

const LEVEL_LABEL = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  elite: 'Élite'
};

const LEVEL_BADGE = {
  bronze: 'border-amber-700/60 bg-amber-950/40 text-amber-100',
  silver: 'border-slate-400/50 bg-slate-800/60 text-slate-100',
  gold: 'border-yellow-400/60 bg-yellow-950/30 text-yellow-100',
  elite: 'border-fuchsia-500/60 bg-fuchsia-950/35 text-fuchsia-100'
};

function groupByCategory(results) {
  const map = new Map();
  results.forEach((r) => {
    const key = r.category || 'Autres';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  return Array.from(map.entries());
}

function formatSessionOneLine(s, t, formatSessionDate) {
  const hrG = s.hrTrendGroup ? `[${s.hrTrendGroup}]` : '';
  const bucket = s.bucketLabel ? `[${s.bucketLabel}]` : '';
  const km =
    s.distanceKm != null && Number.isFinite(s.distanceKm)
      ? `${s.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
      : '—';
  const fc =
    s.avgHrBpm != null && Number.isFinite(s.avgHrBpm) ? `FC moy. ${Math.round(s.avgHrBpm)}` : null;
  const pace = s.paceLabel || '—';
  const dur = s.durationClock && s.durationClock !== '—' ? s.durationClock : null;
  const src = s.source ? String(s.source) : '';
  const beatPrev =
    s.prevPaceLabel && typeof t === 'function'
      ? t('endurance.running.trophies.beatPrevPace', { pace: s.prevPaceLabel })
      : s.prevPaceLabel
        ? `Battait ${s.prevPaceLabel}`
        : '';
  const mid = [hrG, bucket, km, fc, pace, dur, beatPrev].filter(Boolean).join(' · ');
  const when =
    typeof formatSessionDate === 'function'
      ? formatSessionDate(s.date, s.time)
      : `${s.date}${s.time ? ` ${String(s.time).slice(0, 5)}` : ''}`;
  return `${when} · ${mid}${src ? ` · ${src}` : ''}`;
}

function buildUnlockedEntries(results) {
  const out = [];
  (results || []).forEach((trophy) => {
    if (trophy.auto === false) return;
    (trophy.levels || []).forEach((lvl) => {
      if (lvl.unlocked) {
        out.push({
          key: `${trophy.id}-${lvl.level}`,
          trophyId: trophy.id,
          title: trophy.title,
          category: trophy.category || 'Autres',
          level: lvl.level,
          difficulty: trophy.difficulty || ''
        });
      }
    });
  });
  return out.sort((a, b) => {
    const ca = `${a.category} ${a.title} ${a.level}`;
    const cb = `${b.category} ${b.title} ${b.level}`;
    return ca.localeCompare(cb, 'fr', { sensitivity: 'base' });
  });
}

export default function RunningTrophiesPanel({ sessions = [], garminById }) {
  const t = useTranslation();
  const { formatEnduranceSessionDate } = useFormatters();
  const { data: workoutAggregate } = useWorkout();
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const evaluation = useMemo(
    () =>
      evaluateRunningTrophies({
        runningSessions: sessions,
        garminById: garminById || new Map(),
        workoutAggregate
      }),
    [sessions, garminById, workoutAggregate]
  );

  const grouped = useMemo(() => groupByCategory(evaluation.results), [evaluation.results]);
  const unlockedCount = evaluation.results.filter((r) => r.highestLevel && r.auto !== false).length;
  const autoCount = evaluation.results.filter((r) => r.auto !== false).length;
  const trophiesXp = useMemo(() => computeRunningTrophiesXp(evaluation.results), [evaluation.results]);

  const unlockedEntries = useMemo(() => buildUnlockedEntries(evaluation.results), [evaluation.results]);

  const unlockedCategories = useMemo(() => {
    const s = new Set();
    unlockedEntries.forEach((e) => s.add(e.category));
    return ['all', ...Array.from(s).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [unlockedEntries]);

  const filteredUnlocked = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unlockedEntries.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        String(e.title).toLowerCase().includes(q) ||
        String(e.category).toLowerCase().includes(q) ||
        String(LEVEL_LABEL[e.level] || '').toLowerCase().includes(q)
      );
    });
  }, [unlockedEntries, search, categoryFilter]);

  const scrollToTrophyInAllTab = useCallback((trophyId) => {
    setSubTab('all');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = document.getElementById(`running-trophy-${trophyId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }, []);

  const tabBtn = (active) =>
    `rounded-xl border px-4 py-2 text-sm font-medium transition ${
      active
        ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
        : 'border-[#0F4C5C]/45 bg-black text-teal-100 hover:border-sky-500/40'
    }`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
              <Trophy className="h-7 w-7 text-sky-300" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Trophées — Course</h3>
              <p className="mt-1 text-sm text-teal-200/80">
                Score composite basé sur tes séances (manuel + Garmin). Chaque palier bronze → élite exige un peu plus
                (distance, durée, nombre de séances ou allure plus rapide selon le type). L’XP sport inclut ces trophées.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-600/50 bg-emerald-950/25 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-emerald-200/80">XP trophées course</div>
              <div className="text-3xl font-bold text-white tabular-nums">+{trophiesXp}</div>
              <div className="text-[11px] text-emerald-300/75">comptée dans la barre Sport</div>
            </div>
            <div className="rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/15 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-teal-200/80">Score</div>
              <div className="text-3xl font-bold text-white tabular-nums">{evaluation.scoreComposite}%</div>
              <div className="text-[11px] text-teal-300/70">
                {evaluation.scoreRaw} / {evaluation.scoreMax} pts
              </div>
            </div>
            <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-sky-200/80">Débloqués</div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {unlockedCount}/{autoCount}
              </div>
              <div className="text-[11px] text-sky-200/70">auto</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={tabBtn(subTab === 'all')} onClick={() => setSubTab('all')}>
            {t('endurance.running.trophies.tabAll')}
          </button>
          <button type="button" className={tabBtn(subTab === 'unlocked')} onClick={() => setSubTab('unlocked')}>
            {t('endurance.running.trophies.tabUnlocked')}
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 text-xs text-slate-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>
            Les trophées « allure stable » et « sans arrêt » s’appuient sur les tours / métadonnées Garmin quand la sync
            est complète. Les seuils « allure max » (5k / 10k / 1k) restent exigeants mais plafonnés côté élite pour
            rester crédibles. Cadence et VO₂ : voir « Records & stats course ».
          </p>
        </div>
      </div>

      {subTab === 'unlocked' ? (
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <label className="mb-1 block text-xs font-medium text-teal-700">
                {t('endurance.running.trophies.searchPlaceholder')}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('endurance.running.trophies.searchPlaceholder')}
                  className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                />
              </div>
            </div>
            <div className="w-full shrink-0 lg:max-w-xs">
              <label className="mb-1 block text-xs font-medium text-teal-700">
                {t('endurance.running.trophies.categoryFilter')}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              >
                {unlockedCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? t('endurance.running.trophies.categoryAll') : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-slate-500">{t('endurance.running.trophies.unlockedHint')}</p>
          {filteredUnlocked.length === 0 ? (
            <p className="text-sm text-teal-800">{t('endurance.running.trophies.unlockedEmpty')}</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-teal-700">
                {filteredUnlocked.length === 1
                  ? t('endurance.running.trophies.unlockedCount', { count: filteredUnlocked.length })
                  : t('endurance.running.trophies.unlockedCountPlural', { count: filteredUnlocked.length })}
              </p>
              <div className="max-h-[min(70vh,36rem)] overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredUnlocked.map((row) => (
                    <button
                      type="button"
                      key={row.key}
                      onClick={() => scrollToTrophyInAllTab(row.trophyId)}
                      className="flex aspect-square min-h-[6.5rem] flex-col items-stretch justify-between rounded-xl border border-slate-800/70 bg-black/50 p-2.5 text-left text-xs transition hover:border-sky-500/45 hover:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-3 font-medium leading-snug text-white">{row.title}</p>
                        <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{row.category}</p>
                      </div>
                      <span
                        className={`mt-2 shrink-0 self-start rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${LEVEL_BADGE[row.level]}`}
                      >
                        {LEVEL_LABEL[row.level]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
            <h4 className="mb-4 text-lg font-semibold text-white">{category}</h4>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((trophy) => {
                const progressLine = describeRunningTrophyCurrentProgress(trophy, evaluation.stats);
                const contrib = trophy.contributingSessions || [];
                const more = trophy.contributingMoreCount || 0;
                const hint = trophy.contributingHint;
                const sections = trophy.contributingSections || [];
                const sessionTotal = contrib.length + more;
                const hasSections = sections.length > 0;

                return (
                  <article
                    id={`running-trophy-${trophy.id}`}
                    key={trophy.id}
                    className={`scroll-mt-24 rounded-xl border p-4 transition ${
                      trophy.highestLevel
                        ? 'border-emerald-500/50 bg-emerald-950/15'
                        : 'border-[#0F4C5C]/40 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <p className="text-sm font-semibold leading-snug text-white">{trophy.title}</p>
                          {trophy.auto === false && (
                            <span className="rounded-full border border-slate-600/60 bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                              Bientôt auto
                            </span>
                          )}
                          {trophy.highestLevel && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${LEVEL_BADGE[trophy.highestLevel]}`}
                            >
                              {LEVEL_LABEL[trophy.highestLevel]}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{trophy.difficulty}</p>
                      </div>
                      <div
                        className="w-full shrink-0 rounded-lg border border-sky-500/35 bg-sky-950/45 px-2.5 py-1.5 sm:max-w-[11.5rem] sm:text-right"
                        title={progressLine}
                      >
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-sky-200/90">Actuelle</div>
                        <p className="break-words text-left text-[10px] leading-snug text-sky-50/95 [overflow-wrap:anywhere] sm:text-right">
                          {progressLine}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {trophy.levels.map((lvl) => {
                        const xpTier =
                          trophy.auto === false ? 0 : runningTrophyLevelXpReward(trophy.difficulty, lvl.level);
                        return (
                          <div key={lvl.level} className="rounded-lg border border-slate-800/80 bg-black/30 px-2 py-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className={lvl.unlocked ? 'font-medium text-emerald-200' : 'text-slate-500'}>
                                {LEVEL_LABEL[lvl.level]}
                              </span>
                              <div className="flex flex-col items-end gap-0.5 text-right">
                                <span className="tabular-nums text-slate-400">
                                  {lvl.unlocked ? 'OK' : `${Math.round(lvl.progress * 100)}%`}
                                </span>
                                {trophy.auto !== false && xpTier > 0 ? (
                                  <span className="text-[9px] font-semibold text-amber-200/90">
                                    {lvl.unlocked
                                      ? t('endurance.running.trophies.xpGained', { xp: xpTier })
                                      : t('endurance.running.trophies.xpOnUnlock', { xp: xpTier })}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <p className="mt-1 text-[10px] leading-snug text-slate-500">
                              {describeRunningTrophyLevelRequirement(trophy, lvl.target, LEVEL_LABEL[lvl.level])}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {(sessionTotal > 0 || hint || hasSections) && (
                      <details className="mt-3 rounded-lg border border-slate-700/70 bg-slate-950/50 px-2 py-1.5">
                        <summary className="cursor-pointer select-none text-[11px] font-medium text-teal-200/90 hover:text-teal-100">
                          Sessions liées
                          {sessionTotal > 0 ? ` (${sessionTotal})` : hasSections ? ` — ${t('endurance.running.trophies.calendarDetail')}` : ''}
                        </summary>
                        {hint && <p className="mt-2 text-[10px] leading-snug text-slate-500">{hint}</p>}
                        {contrib.length > 0 && (
                          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-[10px] text-slate-300">
                            {contrib.map((s, idx) => (
                              <li
                                key={`${trophy.id}-${String(s.id ?? idx)}-${s.date}-${s.time ?? ''}`}
                                className="border-b border-slate-800/60 pb-1 last:border-0"
                              >
                                {formatSessionOneLine(s, t, formatEnduranceSessionDate)}
                              </li>
                            ))}
                          </ul>
                        )}
                        {more > 0 && (
                          <p className="mt-1 text-[10px] text-slate-500">+ {more} autre{more > 1 ? 's' : ''}…</p>
                        )}
                        {hasSections && (
                          <div className="mt-3 space-y-3 border-t border-slate-800/70 pt-2">
                            {sections.map((sec) => (
                              <div key={`${sec.kind}-${sec.monthKey}`} className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  {sec.kind === 'sustainMonth'
                                    ? t('endurance.running.trophies.sectionSustainMonth', { month: sec.monthKey })
                                    : sec.kind === 'currentMonth'
                                      ? t('endurance.running.trophies.sectionCurrentMonth', { month: sec.monthKey })
                                      : t('endurance.running.trophies.sectionBestMonth', { month: sec.monthKey })}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {t('endurance.running.trophies.totalSessionsInMonth', { count: sec.totalCount })}
                                </p>
                                {(sec.weeks || []).map((w) => (
                                  <div key={w.weekKey} className="rounded-md border border-slate-800/60 bg-black/30 px-2 py-1.5">
                                    <p className="text-[10px] font-medium text-teal-100/90">
                                      {t('endurance.running.trophies.weekRunsHeader', {
                                        index: w.weekIndex,
                                        count: w.count,
                                        weekKey: w.weekKey
                                      })}
                                      {typeof w.meetsMin === 'boolean' ? (
                                        <span
                                          className={
                                            w.meetsMin ? 'font-normal text-emerald-400/90' : 'font-normal text-rose-400/90'
                                          }
                                        >
                                          {w.meetsMin
                                            ? t('endurance.running.trophies.weekSustainOk')
                                            : t('endurance.running.trophies.weekSustainNo')}
                                        </span>
                                      ) : null}
                                    </p>
                                    {w.items?.length > 0 && (
                                      <ul className="mt-1 max-h-28 space-y-0.5 overflow-y-auto text-[10px] text-slate-300">
                                        {w.items.map((s, idx) => (
                                          <li key={`${sec.kind}-${w.weekKey}-${String(s.id ?? idx)}`}>
                                            {formatSessionOneLine(s, t, formatEnduranceSessionDate)}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {w.moreCount > 0 && (
                                      <p className="mt-1 text-[9px] text-slate-500">
                                        {t('endurance.running.trophies.moreInWeek', { count: w.moreCount })}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
