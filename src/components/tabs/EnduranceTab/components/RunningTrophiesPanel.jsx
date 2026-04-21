import React, { useMemo } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { evaluateRunningTrophies } from '../../../../services/endurance/runningTrophiesService';

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

export default function RunningTrophiesPanel({ sessions = [], garminById }) {
  const evaluation = useMemo(
    () => evaluateRunningTrophies({ runningSessions: sessions, garminById: garminById || new Map() }),
    [sessions, garminById]
  );

  const grouped = useMemo(() => groupByCategory(evaluation.results), [evaluation.results]);
  const unlockedCount = evaluation.results.filter((r) => r.highestLevel && r.auto !== false).length;
  const autoCount = evaluation.results.filter((r) => r.auto !== false).length;

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
                Score composite basé sur tes séances (manuel + Garmin). Les niveaux bronze → élite adaptent les seuils
                quand c’est pertinent.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 text-xs text-slate-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>
            Les trophées « pluie », « negative split », « cadence », « VO2 », « arrêts » utilisent les champs Garmin quand
            la sync a rempli les laps / métadonnées. Sinon ils restent verrouillés (pas de faux positif).
          </p>
        </div>
      </div>

      {grouped.map(([category, items]) => (
        <section key={category} className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
          <h4 className="mb-4 text-lg font-semibold text-white">{category}</h4>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((trophy) => (
              <article
                key={trophy.id}
                className={`rounded-xl border p-4 transition ${
                  trophy.highestLevel
                    ? 'border-emerald-500/50 bg-emerald-950/15'
                    : 'border-[#0F4C5C]/40 bg-slate-950/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{trophy.title}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{trophy.difficulty}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
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
                </div>
                {trophy.auto === false ? (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Détection automatique à brancher (sinon risque de faux positifs). Affiché ici pour suivre ta liste
                    complète.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {trophy.levels.map((lvl) => (
                      <div key={lvl.level} className="flex items-center justify-between gap-2 text-xs">
                        <span className={lvl.unlocked ? 'text-emerald-200' : 'text-slate-500'}>
                          {LEVEL_LABEL[lvl.level]}
                        </span>
                        <span className="tabular-nums text-slate-400">
                          {lvl.unlocked ? 'OK' : `${Math.round(lvl.progress * 100)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
