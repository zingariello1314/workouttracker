/**
 * Barre XP dédiée aux quêtes (QuietQuest)
 */

import React, { useMemo } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { calculateQuestsXP } from '../../services/xp/xpCalculations';

const QuestsXPBar = ({ userData, validations, allQuests }) => {
  const totalXP = useMemo(
    () => calculateQuestsXP(validations, allQuests),
    [validations, allQuests]
  );

  const level = userData?.level || 1;
  const currentXP = userData?.currentXP || 0;
  const xpForNextLevel = userData?.xpForNextLevel || 2500;
  const percent = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-2xl px-6 py-4 shadow-xl shadow-emerald-500/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white">Niveau {level}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <TrendingUp className="w-4 h-4 text-emerald-300" />
          <span>{totalXP.toLocaleString('fr-FR')} XP total</span>
        </div>
      </div>

      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>{currentXP.toLocaleString('fr-FR')} / {xpForNextLevel.toLocaleString('fr-FR')} XP</span>
        <span>Prochain niveau</span>
      </div>
    </div>
  );
};

export default QuestsXPBar;
