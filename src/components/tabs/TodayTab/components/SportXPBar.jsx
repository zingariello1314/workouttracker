/**
 * Barre XP Sport
 */

import React from 'react';
import { Dumbbell, Flame, Footprints, Target, CheckCircle } from 'lucide-react';
import { useSportXP } from '../../../../hooks/useSportXP';

const SportXPBar = () => {
  const { totalXP, level, breakdown, progress } = useSportXP();

  return (
    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-red-400" />
          <span className="font-semibold text-white">Niveau {level}</span>
        </div>
        <span className="text-sm text-slate-300">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Dumbbell className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.reps.toLocaleString('fr-FR')} reps</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.exercises} exercices</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.calories.toLocaleString('fr-FR')} cal</span>
        </div>
        <div className="flex items-center gap-1">
          <Footprints className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.steps.toLocaleString('fr-FR')} pas</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.challenges} défis</span>
        </div>
      </div>
    </div>
  );
};

export default SportXPBar;
