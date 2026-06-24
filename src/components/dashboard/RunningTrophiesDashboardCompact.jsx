import { useEffect, useMemo, useState } from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useGarminData } from '../../hooks/useGarminData';
import {
  evaluateRunningTrophies,
  computeRunningTrophiesXp
} from '../../services/endurance/runningTrophiesService';

/**
 * Suivi concis des trophées course (dashboard Sport / Vue du jour).
 * Remplace le panneau large « par catégorie » de l’onglet Défis.
 */
export default function RunningTrophiesDashboardCompact({ onOpenEndurance, garminById: garminByIdProp }) {
  const { data, getCurrentData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [garminMap, setGarminMap] = useState(() => new Map());

  useEffect(() => {
    if (garminByIdProp) return;
    let alive = true;
    if (!dbReady) return;
    (async () => {
      try {
        const loaded = await loadAllData();
        if (!alive) return;
        const m = new Map();
        const cardio = loaded?.activities?.cardio;
        if (Array.isArray(cardio)) {
          cardio.forEach((act) => {
            const id = act?.garminId ?? act?.id;
            if (id == null) return;
            m.set(String(id), act);
          });
        }
        setGarminMap(m);
      } catch {
        if (alive) setGarminMap(new Map());
      }
    })();
    return () => {
      alive = false;
    };
  }, [dbReady, loadAllData, garminByIdProp]);

  const garminById = garminByIdProp || garminMap;

  const live = getCurrentData?.() || data || {};
  const sessions = live?.enduranceData?.sessions?.running || [];

  const evaluation = useMemo(
    () => evaluateRunningTrophies({ runningSessions: sessions, garminById, workoutAggregate: live }),
    [sessions, garminById, live]
  );

  const { results: trophyRows = [], stats: runStats } = evaluation || {};

  const xp = useMemo(() => computeRunningTrophiesXp(trophyRows), [trophyRows]);

  const unlocked = useMemo(() => {
    let n = 0;
    (trophyRows || []).forEach((row) => {
      if (row.auto === false) return;
      (row.levels || []).forEach((lvl) => {
        if (lvl.unlocked) n += 1;
      });
    });
    return n;
  }, [trophyRows]);

  const nextHints = useMemo(() => {
    const rows = (trophyRows || []).filter((r) => r.auto !== false && r.id !== 'complete_simples');
    const scored = rows
      .map((row) => {
        const levels = row.levels || [];
        let hi = -1;
        levels.forEach((l, i) => {
          if (l.unlocked) hi = i;
        });
        const next = levels[hi + 1];
        const p = next && Number.isFinite(next.progress) ? next.progress : hi >= levels.length - 1 ? 1 : 0;
        return { row, score: hi + p };
      })
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.row.title);
  }, [trophyRows]);

  /** Paliers non complétés les plus avancés (% vers le prochain niveau). */
  const nextPaliers = useMemo(() => {
    const rows = (trophyRows || []).filter((r) => r.auto !== false && r.id !== 'complete_simples');
    const scored = [];
    rows.forEach((row) => {
      const levels = row.levels || [];
      const next = levels.find((l) => !l.unlocked);
      if (!next || !Number.isFinite(next.progress)) return;
      const p = Math.max(0, Math.min(1, next.progress));
      scored.push({
        id: row.id,
        title: row.title,
        progress: p,
        level: next.level,
        value: next.value,
        target: next.target
      });
    });
    scored.sort((a, b) => b.progress - a.progress);
    return scored.slice(0, 5);
  }, [trophyRows]);

  const distanceKm =
    runStats && Number.isFinite(runStats.totalDistance) ? Math.round(runStats.totalDistance * 10) / 10 : null;
  const runsCount =
    runStats && Number.isFinite(runStats.totalRuns) ? runStats.totalRuns : Array.isArray(sessions) ? sessions.length : 0;

  return (
    <div className="rounded-xl border border-[#0F4C5C]/60 bg-black p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Award className="h-4 w-4 text-teal-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate">Trophées course</span>
        </div>
        {onOpenEndurance ? (
          <button
            type="button"
            onClick={onOpenEndurance}
            className="shrink-0 inline-flex items-center gap-0.5 rounded-md border border-teal-500/40 px-2 py-1 text-[10px] font-medium text-teal-100 hover:bg-teal-500/15"
          >
            Défis
            <ChevronRight className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-teal-100/90">
        <span>
          Paliers débloqués : <strong className="text-white">{unlocked}</strong>
        </span>
        <span className="text-teal-400/35">·</span>
        <span>
          XP trophées : <strong className="text-white">{xp}</strong>
        </span>
      </div>
      {nextHints.length > 0 ? (
        <ul className="text-[10px] text-teal-200/75 space-y-0.5 leading-snug">
          {nextHints.map((t) => (
            <li key={t} className="truncate" title={t}>
              → {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-teal-300/55">Ajoute des sorties ou synchronise Garmin pour progresser.</p>
      )}

      {(distanceKm != null && distanceKm > 0) || runsCount > 0 ? (
        <div className="rounded-lg border border-[#0F4C5C]/40 bg-black/80 px-2 py-1.5 text-[10px] text-teal-200/80">
          <span className="font-medium text-teal-100/90">Synthèse course (toutes séances)</span>
          <span className="mx-1 text-teal-500/40">·</span>
          <span>
            {distanceKm != null ? `${distanceKm.toLocaleString('fr-FR')} km cumul` : '—'}
          </span>
          <span className="mx-1 text-teal-500/40">·</span>
          <span>{runsCount} sortie(s)</span>
        </div>
      ) : null}

      {nextPaliers.length > 0 ? (
        <div className="space-y-1.5 pt-0.5 border-t border-[#0F4C5C]/35">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-300/70">Prochains paliers</p>
          <ul className="space-y-1.5">
            {nextPaliers.map((row) => {
              const pct = Math.round(row.progress * 100);
              return (
                <li key={row.id} className="min-w-0">
                  <div className="flex justify-between gap-2 text-[10px] text-teal-100/85">
                    <span className="truncate font-medium" title={row.title}>
                      {row.title}
                    </span>
                    <span className="shrink-0 tabular-nums text-teal-400/90">{pct}%</span>
                  </div>
                  <div
                    className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-teal-950/80 border border-[#0F4C5C]/40"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400/90"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[9px] text-teal-300/45 truncate capitalize" title={row.level}>
                    Niveau visé : {row.level}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
