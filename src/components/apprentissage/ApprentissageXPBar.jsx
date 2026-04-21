/**
 * Barre XP Apprentissage — charte : fond noir, contour vert, fluide XP en vert.
 */

import React from 'react';
import { BookOpen, Clock, GraduationCap, TrendingUp } from 'lucide-react';
import { useApprentissageXP } from '../../hooks/useApprentissageXP';

const ApprentissageXPBar = () => {
  const { totalXP, level, breakdown, progress } = useApprentissageXP();

  return (
    <div className="bg-black border-2 border-emerald-500/70 rounded-xl p-4 mb-6 shadow-lg shadow-emerald-500/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-emerald-50">Niveau {level}</span>
        </div>
        <span className="text-sm text-emerald-200/85">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>

      <div className="w-full bg-black border border-emerald-500/45 rounded-full h-2.5 mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 transition-all duration-300 rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-emerald-200/75 mb-3">
        <span>
          {progress.currentXP?.toLocaleString('fr-FR') || 0} / {progress.nextLevelXP?.toLocaleString('fr-FR') || 0} XP
        </span>
        <span>{Math.round(progress.percent)}% • {progress.xpNeeded?.toLocaleString('fr-FR') || 0} XP restants</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <GraduationCap className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-emerald-200/80">{breakdown.subjects} matière{breakdown.subjects !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-emerald-200/80">{breakdown.sessions} session{breakdown.sessions !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-emerald-200/80">{breakdown.studyTime}h d&apos;étude</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-emerald-500/35 bg-black px-2 py-1.5">
          <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-emerald-200/80">Niv. {level}</span>
        </div>
      </div>
    </div>
  );
};

export default ApprentissageXPBar;
