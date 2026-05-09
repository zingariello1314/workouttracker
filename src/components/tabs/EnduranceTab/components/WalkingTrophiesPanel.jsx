import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Search, Sparkles } from 'lucide-react';
import { evaluateWalkingTrophies } from '../../../../services/endurance/walkingTrophiesService';
import { runningTrophyLevelXpReward } from '../../../../services/endurance/runningTrophiesService';
import { useGarminData } from '../../../../hooks/useGarminData';
import { useWorkout } from '../../../../context/WorkoutContext';
import { buildAllTimeWalkingFromSteps } from '../../../../utils/sport/walkingFromSteps';

const LEVEL_LABEL = { bronze: 'Bronze', silver: 'Argent', gold: 'Or', elite: 'Élite' };

const LEVEL_BADGE = {
  bronze: 'border-amber-500/60 bg-amber-500/15 text-amber-200',
  silver: 'border-slate-400/60 bg-slate-400/15 text-slate-100',
  gold: 'border-yellow-400/60 bg-yellow-400/15 text-yellow-100',
  elite: 'border-violet-400/60 bg-violet-400/20 text-violet-100'
};

function groupByCategory(results) {
  const map = new Map();
  (results || []).forEach((r) => {
    const key = r.category || 'Autres';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  return Array.from(map.entries());
}

function formatSessionLine(session) {
  const d = session?.date || '—';
  const time = session?.time ? String(session.time).slice(0, 5) : '';
  const km = session?.distance ? `${String(session.distance).replace('.', ',')} km` : null;
  const duration = session?.duration ? `${session.duration}` : null;
  return [d, time, km, duration].filter(Boolean).join(' · ');
}

function buildUnlockedEntries(results) {
  const out = [];
  (results || []).forEach((trophy) => {
    (trophy.levels || []).forEach((lvl) => {
      if (lvl.unlocked) {
        out.push({
          key: `${trophy.id}-${lvl.level}`,
          trophyId: trophy.id,
          title: trophy.title,
          category: trophy.category || 'Autres',
          level: lvl.level
        });
      }
    });
  });
  return out.sort((a, b) => `${a.category} ${a.title}`.localeCompare(`${b.category} ${b.title}`, 'fr'));
}

export default function WalkingTrophiesPanel({ sessions = [] }) {
  const { data: workoutData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [garminSupplemental, setGarminSupplemental] = useState({ walkKmAllTime: 0, stepsAllTime: 0 });
  const [garminLoaded, setGarminLoaded] = useState(false);
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadAllData();
        if (cancelled) return;
        const computed = buildAllTimeWalkingFromSteps({
          dailyMetrics: loaded?.dailyMetrics || {},
          activities: loaded?.activities || {},
          manualStepsByDate: workoutData?.enduranceData?.manualDailyWalkByDate
        });
        setGarminSupplemental({
          walkKmAllTime: Number(computed?.totalWalkingKm) || 0,
          stepsAllTime: Number(computed?.totalSteps) || 0
        });
      } catch {
        if (!cancelled) setGarminSupplemental({ walkKmAllTime: 0, stepsAllTime: 0 });
      } finally {
        if (!cancelled) setGarminLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dbReady, loadAllData, workoutData?.enduranceData?.manualDailyWalkByDate]);

  const evaluation = useMemo(
    () => evaluateWalkingTrophies(sessions, garminSupplemental),
    [sessions, garminSupplemental]
  );
  const grouped = useMemo(() => groupByCategory(evaluation.results), [evaluation.results]);
  const unlockedEntries = useMemo(() => buildUnlockedEntries(evaluation.results), [evaluation.results]);
  const unlockedCount = evaluation.results.filter((r) => r.highestLevel).length;
  const totalCount = evaluation.results.length;

  const xp = useMemo(
    () =>
      (evaluation.results || []).reduce(
        (sum, t) =>
          sum +
          (t.levels || []).reduce(
            (acc, lvl) => acc + (lvl.unlocked ? runningTrophyLevelXpReward(t.difficulty, lvl.level) : 0),
            0
          ),
        0
      ),
    [evaluation.results]
  );

  const unlockedCategories = useMemo(() => {
    const set = new Set();
    unlockedEntries.forEach((e) => set.add(e.category));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
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
              <h3 className="text-2xl font-bold text-white">Trophées — Marche</h3>
              <p className="mt-1 text-sm text-teal-200/80">
                Données = distance, durée, calories, cadence et régularité. Le badge en haut à droite de chaque carte
                affiche le plus haut palier débloqué.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-600/50 bg-emerald-950/25 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-emerald-200/80">XP trophées marche</div>
              <div className="text-3xl font-bold text-white tabular-nums">+{xp}</div>
              <div className="text-[11px] text-emerald-300/75">comptée dans la barre Sport</div>
            </div>
            <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-center">
              <div className="text-xs uppercase tracking-wide text-sky-200/80">Débloqués</div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {unlockedCount}/{totalCount}
              </div>
              <div className="text-[11px] text-sky-200/70">trophées</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={tabBtn(subTab === 'all')} onClick={() => setSubTab('all')}>
            Tous les trophées
          </button>
          <button type="button" className={tabBtn(subTab === 'unlocked')} onClick={() => setSubTab('unlocked')}>
            Mes paliers débloqués
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 text-xs text-slate-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>
            Les « sessions liées » expliquent le calcul principal du trophée (records, volume, régularité).
            {garminLoaded ? ' Les trophées All-time Garmin sont aussi alimentés par pas et distance réelle estimée.' : ''}
          </p>
        </div>
      </div>

      {subTab === 'unlocked' ? (
        <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <label className="mb-1 block text-xs font-medium text-teal-700">Rechercher un trophée...</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Titre, catégorie, palier..."
                  className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                />
              </div>
            </div>
            <div className="w-full shrink-0 lg:max-w-xs">
              <label className="mb-1 block text-xs font-medium text-teal-700">Catégorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
              >
                {unlockedCategories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Toutes' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredUnlocked.length === 0 ? (
            <p className="text-sm text-teal-800">Aucun palier débloqué pour l’instant.</p>
          ) : (
            <div className="max-h-[min(70vh,36rem)] overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredUnlocked.map((row) => (
                  <div
                    key={row.key}
                    className="flex aspect-square min-h-[6.5rem] flex-col items-stretch justify-between rounded-xl border border-slate-800/70 bg-black/50 p-2.5 text-left text-xs"
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
            <h4 className="mb-4 text-lg font-semibold text-white">{category}</h4>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((trophy) => {
                const sessionTotal =
                  (trophy.contributingSessions || []).length + Number(trophy.contributingMoreCount || 0);
                return (
                  <article
                    key={trophy.id}
                    className={`rounded-xl border p-4 transition ${
                      trophy.highestLevel ? 'border-emerald-500/50 bg-emerald-950/15' : 'border-[#0F4C5C]/40 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold leading-snug text-white">{trophy.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{trophy.difficulty}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          trophy.highestLevel ? LEVEL_BADGE[trophy.highestLevel] : 'border-slate-600/60 bg-slate-700/20 text-slate-300'
                        }`}
                      >
                        {trophy.highestLevel ? LEVEL_LABEL[trophy.highestLevel] : 'En cours'}
                      </span>
                    </div>

                    <div className="mt-2 rounded-lg border border-sky-500/35 bg-sky-950/45 px-2.5 py-1.5 text-[10px] text-sky-50/95">
                      Actuelle: {trophy.currentLabel}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {(trophy.levels || []).map((lvl) => {
                        const xpTier = runningTrophyLevelXpReward(trophy.difficulty, lvl.level);
                        return (
                          <div key={`${trophy.id}-${lvl.level}`} className="rounded-lg border border-slate-800/80 bg-black/30 px-2 py-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className={lvl.unlocked ? 'text-emerald-300' : 'text-slate-400'}>
                                {LEVEL_LABEL[lvl.level]}
                              </span>
                              <span className={lvl.unlocked ? 'text-emerald-200 font-semibold' : 'text-slate-500'}>
                                {lvl.unlocked ? `+${xpTier} XP` : `${Math.round(lvl.progress * 100)}%`}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500">
                              Objectif {LEVEL_LABEL[lvl.level]}: {String(lvl.target).replace('.', ',')} {trophy.unit || ''}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {sessionTotal > 0 && (
                      <details className="mt-3 rounded-lg border border-slate-700/70 bg-slate-950/50 px-2 py-1.5">
                        <summary className="cursor-pointer select-none text-[11px] font-medium text-teal-200/90 hover:text-teal-100">
                          Sessions liées ({sessionTotal})
                        </summary>
                        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-[10px] text-slate-300">
                          {(trophy.contributingSessions || []).map((s, idx) => (
                            <li key={`${trophy.id}-${String(s.id ?? idx)}-${s.date}-${s.time ?? ''}`} className="border-b border-slate-800/60 pb-1 last:border-0">
                              {formatSessionLine(s)}
                            </li>
                          ))}
                        </ul>
                        {Number(trophy.contributingMoreCount || 0) > 0 && (
                          <p className="mt-1 text-[10px] text-slate-500">+ {trophy.contributingMoreCount} autre(s)...</p>
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
