/**
 * Barre XP Livres
 */

import React from 'react';
import { BookOpen, FileText, Flame, TrendingUp } from 'lucide-react';
import { useBooksXP } from '../../../../hooks/useBooksXP';

const BooksXPBar = () => {
  const { totalXP, level, breakdown, progress } = useBooksXP();
  const xpOnLevel = progress.xpOnLevel ?? 0;
  const xpForLevel = progress.xpForLevel ?? 500;

  return (
    <div className="rounded-xl border-2 border-[#3A86FF] bg-black p-4 shadow-md shadow-black/40">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 shrink-0 text-sky-300" />
          <div>
            <div className="font-semibold text-sky-100">Niveau {level}</div>
            <p className="text-sm text-sky-200/90">
              {totalXP.toLocaleString('fr-FR')} XP au total
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Sur ce niveau :{' '}
              <span className="font-semibold tabular-nums text-[#60a5fa]">
                {xpOnLevel.toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500"> / </span>
              <span className="tabular-nums text-slate-300">
                {xpForLevel.toLocaleString('fr-FR')}
              </span>{' '}
              <span className="text-slate-500">XP</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Prochain niveau</div>
          <div className="text-lg font-bold text-sky-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.35)]">
            {progress.xpNeeded.toLocaleString('fr-FR')} XP
          </div>
        </div>
      </div>

      <div className="w-full rounded-full h-2.5 mb-3 bg-black border border-[#3A86FF]/45 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#3A86FF] to-[#60a5fa] transition-all shadow-[0_0_10px_rgba(58,134,255,0.35)]"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 shrink-0 text-sky-300" />
          <span className="text-sky-200/85">{breakdown.sessions} sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 shrink-0 text-sky-300" />
          <span className="text-sky-200/85">{breakdown.pages} pages</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 shrink-0 text-sky-300" />
          <span className="text-sky-200/85">
            {(Number(breakdown.pagesPerHour) || 0).toFixed(1)} p/h
          </span>
        </div>
      </div>

      {(breakdown.streakBonusXp > 0 ||
        breakdown.volumeBonusXp > 0 ||
        (breakdown.currentStreak ?? 0) > 0 ||
        (breakdown.longestStreak ?? 0) > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-sky-300/75">
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3 h-3 shrink-0 text-amber-400/90" />
            Série {breakdown.currentStreak ?? 0}j · record {breakdown.longestStreak ?? 0}j
            {(breakdown.streakBonusXp ?? 0) > 0 && (
              <span className="text-sky-200/90">(+{breakdown.streakBonusXp} XP)</span>
            )}
          </span>
          {(breakdown.volumeBonusXp ?? 0) > 0 && (
            <span>Volume pages (+{breakdown.volumeBonusXp} XP)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default BooksXPBar;
