import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import {
  evaluateRunningTrophies,
  describeRunningTrophyCurrentProgress,
  describeRunningTrophyLevelRequirement,
  runningTrophyLevelXpReward
} from '../../../../services/endurance/runningTrophiesService';

const LEVEL_LABEL_FR = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  elite: 'Élite'
};

function highestUnlockedIndex(levels) {
  let hi = -1;
  (levels || []).forEach((l, i) => {
    if (l.unlocked) hi = i;
  });
  return hi;
}

/** Score de « progression » pour classer les trophées (paliers débloqués + % palier suivant). */
function advanceScore(row) {
  const levels = row.levels || [];
  const hi = highestUnlockedIndex(levels);
  const next = levels[hi + 1];
  if (!next) return hi + 100;
  const p = Number.isFinite(next.progress) ? next.progress : 0;
  return hi + p;
}

function groupByCategory(results) {
  const m = new Map();
  (results || []).forEach((r) => {
    if (r.auto === false || r.id === 'complete_simples') return;
    const cat = r.category || 'Autres';
    if (!m.has(cat)) m.set(cat, []);
    m.get(cat).push(r);
  });
  return m;
}

function topThreePerCategory(results, stats) {
  const m = groupByCategory(results);
  const out = [];
  const catKeys = [...m.keys()].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  catKeys.forEach((cat) => {
    const rows = [...m.get(cat)].sort((a, b) => advanceScore(b) - advanceScore(a)).slice(0, 3);
    if (!rows.length) return;
    out.push({
      category: cat,
      rows: rows.map((row) => {
        const hi = highestUnlockedIndex(row.levels);
        const highest = hi >= 0 ? row.levels[hi].level : null;
        const nextLevel = hi >= 0 && hi < (row.levels || []).length - 1 ? row.levels[hi + 1] : null;
        const nextLabel =
          nextLevel && nextLevel.level
            ? describeRunningTrophyLevelRequirement(
                row,
                nextLevel.target,
                LEVEL_LABEL_FR[nextLevel.level] || nextLevel.level
              )
            : null;
        return {
          id: row.id,
          title: row.title,
          highest,
          currentLine: describeRunningTrophyCurrentProgress(row, stats),
          nextRequirement: nextLabel,
          nextXp:
            nextLevel && nextLevel.level
              ? runningTrophyLevelXpReward(row.difficulty || 'simple', nextLevel.level)
              : null,
          progressNext: nextLevel?.progress
        };
      })
    });
  });
  return out;
}

/**
 * Aperçu des trophées course les plus avancés par catégorie (3 max / catégorie).
 */
const RunningTrophiesHighlightPanel = ({ sessions = [], garminById = null }) => {
  const evaluation = useMemo(
    () => evaluateRunningTrophies({ runningSessions: sessions || [], garminById: garminById || new Map() }),
    [sessions, garminById]
  );

  const sections = useMemo(
    () => topThreePerCategory(evaluation.results, evaluation.stats),
    [evaluation.results, evaluation.stats]
  );

  if (!sections.length) {
    return (
      <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-5 text-sm text-teal-700">
        Aucun trophée course à afficher pour le moment (ajoute des sorties ou synchronise Garmin).
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6">
      <div className="mb-4 flex items-center gap-2 text-white">
        <Award className="h-6 w-6 text-sky-400" />
        <h3 className="text-lg font-bold">Trophées course — plus avancés par catégorie</h3>
      </div>
      <p className="mb-4 text-xs text-teal-700">
        Jusqu’à 3 défis par catégorie, triés par progression (paliers débloqués et avancement vers le suivant).
      </p>
      <div className="space-y-6">
        {sections.map((sec) => (
          <div key={sec.category}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-500">{sec.category}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sec.rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border-2 border-[#0F4C5C]/50 bg-black/80 p-4 text-left shadow-inner shadow-black/20"
                >
                  <div className="text-sm font-semibold text-white leading-snug">{row.title}</div>
                  <div className="mt-1 text-[11px] text-teal-600">
                    Palier max :{' '}
                    <span className="text-teal-200">
                      {row.highest ? LEVEL_LABEL_FR[row.highest] || row.highest : '—'}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-teal-100/90">{row.currentLine}</p>
                  {row.nextRequirement ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-teal-700">
                      Prochain : {row.nextRequirement}
                      {row.nextXp != null ? ` · +${row.nextXp} XP` : ''}
                      {row.progressNext != null ? ` (${Math.round(row.progressNext * 100)} %)` : ''}
                    </p>
                  ) : (
                    <p className="mt-2 text-[10px] text-teal-600">Tous les paliers atteints.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RunningTrophiesHighlightPanel;
