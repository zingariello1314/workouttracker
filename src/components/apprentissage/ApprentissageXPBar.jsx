/**
 * Barre XP Apprentissage
 */

import React from 'react';
import { BookOpen, Clock, GraduationCap, TrendingUp } from 'lucide-react';
import { useApprentissageXP } from '../../hooks/useApprentissageXP';

const ApprentissageXPBar = () => {
  const { totalXP, level, breakdown, progress } = useApprentissageXP();

  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white">Niveau {level}</span>
        </div>
        <span className="text-sm text-slate-300">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 mb-3">
        <span>
          {progress.currentXP?.toLocaleString('fr-FR') || 0} / {progress.nextLevelXP?.toLocaleString('fr-FR') || 0} XP
        </span>
        <span>{Math.round(progress.percent)}% • {progress.xpNeeded?.toLocaleString('fr-FR') || 0} XP restants</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <GraduationCap className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">{breakdown.subjects} matière{breakdown.subjects !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">{breakdown.sessions} session{breakdown.sessions !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">{breakdown.studyTime}h d'étude</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">Niv. {level}</span>
        </div>
      </div>
    </div>
  );
};

export default ApprentissageXPBar;
