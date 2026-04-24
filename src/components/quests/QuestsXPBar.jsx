/**
 * Barre XP dédiée aux quêtes (QuietQuest)
 * — Total XP = somme des validations (cohérent avec le dashboard global)
 * — Progression de niveau = userData (courbe à palier croissant)
 */

import React, { useMemo } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { calculateQuestsXP } from '../../services/xp/xpCalculations';
import { isQuestEveryDayRecurrent } from '../../utils/questXpCore';

const QuestsXPBar = ({ userData, validations, allQuests, isLoading = false }) => {
  const totalValidationXp = useMemo(
    () => calculateQuestsXP(validations, allQuests),
    [validations, allQuests]
  );

  const everyDayValidationCount = useMemo(() => {
    if (!Array.isArray(validations) || validations.length === 0) return 0;
    const map = new Map((allQuests || []).filter(Boolean).map((q) => [q.id, q]));
    let n = 0;
    for (const v of validations) {
      const q = map.get(v?.queteId ?? v?.questId);
      if (isQuestEveryDayRecurrent(q)) n += 1;
    }
    return n;
  }, [validations, allQuests]);

  const level = userData?.level ?? 1;
  const currentXP = userData?.currentXP ?? 0;
  const xpForNextLevel = Math.max(1, userData?.xpForNextLevel ?? 2500);
  const xpNeeded = Math.max(0, xpForNextLevel - currentXP);
  const percent = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  const totalDisplay =
    isLoading && (!validations || validations.length === 0)
      ? '…'
      : totalValidationXp.toLocaleString('fr-FR');

  return (
    <div className="rounded-2xl border-2 border-amber-400/75 bg-black px-6 py-4 shadow-lg shadow-black/50">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <div className="font-semibold text-amber-50">Niveau {level}</div>
            <p className="flex items-center gap-1.5 text-sm text-amber-200/90">
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-400" />
              <span>{totalDisplay} XP total (validations)</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Sur ce niveau :{' '}
              <span className="font-semibold tabular-nums text-amber-300">
                {currentXP.toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500"> / </span>
              <span className="tabular-nums text-slate-300">
                {xpForNextLevel.toLocaleString('fr-FR')}
              </span>{' '}
              <span className="text-slate-500">XP</span>
            </p>
            <p className="mt-1 text-xs text-amber-100/90">
              Encore{' '}
              <span className="font-semibold tabular-nums text-amber-200">
                {xpNeeded.toLocaleString('fr-FR')}
              </span>{' '}
              XP à gagner pour passer au niveau{' '}
              <span className="font-semibold text-amber-50">{level + 1}</span>.
            </p>
            {everyDayValidationCount > 0 && (
              <p className="mt-1 text-[11px] text-amber-200/65">
                Validations sur quêtes « tous les jours » (7j/7) :{' '}
                <span className="font-semibold text-amber-100/90 tabular-nums">
                  {everyDayValidationCount}
                </span>{' '}
                — l’XP de chaque cochet inclut un bonus fidélité pour ces habitudes.
              </p>
            )}
          </div>
        </div>
        <div className="min-w-[9.5rem] shrink-0 rounded-lg border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-right">
          <div className="text-[10px] font-medium uppercase tracking-wide text-amber-200/70">
            Reste jusqu&apos;au niveau {level + 1}
          </div>
          <div className="text-xl font-bold tabular-nums text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]">
            {xpNeeded.toLocaleString('fr-FR')}{' '}
            <span className="text-sm font-semibold text-amber-100/90">XP</span>
          </div>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full border border-amber-800/45 bg-black">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-amber-200/75">
        <span className="tabular-nums">
          {currentXP.toLocaleString('fr-FR')} / {xpForNextLevel.toLocaleString('fr-FR')} XP sur le palier — encore{' '}
          <span className="font-semibold text-amber-100/95">{xpNeeded.toLocaleString('fr-FR')} XP</span>
        </span>
        <span className="text-amber-200/55">{Math.round(percent)} %</span>
      </div>
    </div>
  );
};

export default QuestsXPBar;
