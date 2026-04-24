/**
 * Barre XP Apprentissage — charte : fond noir, contour vert, fluide XP en vert.
 */

import React from 'react';
import { BookOpen, Clock, GraduationCap, TrendingUp } from 'lucide-react';
import { useApprentissageXP } from '../../hooks/useApprentissageXP';

const ApprentissageXPBar = () => {
  const { totalXP, level, breakdown, progress } = useApprentissageXP();
  const xpOnLevel = progress.xpOnLevel ?? progress.currentXP ?? 0;
  const xpForLevel = progress.xpForLevel ?? progress.nextLevelXP ?? 1;
  const xpNeeded = progress.xpNeeded ?? 0;
  const pct = Math.min(100, Math.max(0, progress.percent ?? 0));

  return (
    <div className="mb-6 rounded-xl border-2 border-emerald-500/70 bg-black p-4 shadow-lg shadow-emerald-500/10">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <span className="font-semibold text-emerald-50">Niveau {level}</span>
            <p className="mt-0.5 text-xs text-slate-400">
              XP sur le palier niveau {level} :{' '}
              <span className="font-semibold tabular-nums text-emerald-300">
                {xpOnLevel.toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500"> / </span>
              <span className="tabular-nums text-slate-300">
                {xpForLevel.toLocaleString('fr-FR')}
              </span>{' '}
              <span className="text-slate-500">XP</span>
            </p>
            <p className="mt-1 text-xs text-emerald-100/90">
              Encore{' '}
              <span className="font-semibold tabular-nums text-emerald-200">
                {xpNeeded.toLocaleString('fr-FR')}
              </span>{' '}
              XP à gagner pour le niveau{' '}
              <span className="font-semibold text-emerald-50">{level + 1}</span>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <span className="text-sm text-emerald-200/85">
            {totalXP.toLocaleString('fr-FR')} XP total
          </span>
          <div className="min-w-[9.5rem] rounded-lg border border-emerald-500/35 bg-emerald-950/25 px-3 py-2 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-200/70">
              Reste jusqu&apos;au niveau {level + 1}
            </div>
            <div className="text-xl font-bold tabular-nums text-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.25)]">
              {xpNeeded.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-semibold text-emerald-100/90">XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full border border-emerald-500/45 bg-black">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-emerald-200/75">
        <span className="tabular-nums">
          {xpOnLevel.toLocaleString('fr-FR')} / {xpForLevel.toLocaleString('fr-FR')} XP sur le palier — encore{' '}
          <span className="font-semibold text-emerald-100/95">{xpNeeded.toLocaleString('fr-FR')} XP</span>
        </span>
        <span className="text-emerald-300/55">{Math.round(pct)} %</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <GraduationCap className="h-3 w-3 shrink-0 text-emerald-400" />
          <span className="text-emerald-200/80">{breakdown.subjects} matière{breakdown.subjects !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <Clock className="h-3 w-3 shrink-0 text-emerald-400" />
          <span className="text-emerald-200/80">{breakdown.sessions} session{breakdown.sessions !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <TrendingUp className="h-3 w-3 shrink-0 text-emerald-400" />
          <span className="text-emerald-200/80">{breakdown.studyTime}h d&apos;étude</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <BookOpen className="h-3 w-3 shrink-0 text-emerald-400" />
          <span className="text-emerald-200/80">Niv. {level}</span>
        </div>
      </div>
    </div>
  );
};

export default ApprentissageXPBar;
