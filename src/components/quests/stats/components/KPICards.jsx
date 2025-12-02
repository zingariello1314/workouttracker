/**
 * Composant KPICards - Affiche les indicateurs clés de performance
 */

import React from 'react';

const KPICards = ({ stats }) => {
  const { totalXP, currentStreak, bestStreak, completionRate, dailyAverage } = stats;

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* XP total */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-1">XP total gagné</div>
        <div className="text-xl font-semibold text-emerald-300">
          {totalXP.toLocaleString('fr-FR')} XP
        </div>
      </div>

      {/* Streak actuel */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-1">Streak actuel</div>
        <div className="text-xl font-semibold text-slate-100">
          {currentStreak} jour{currentStreak > 1 ? 's' : ''}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Meilleur streak : {bestStreak} jour{bestStreak > 1 ? 's' : ''}
        </div>
      </div>

      {/* Taux de réussite moyen */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-1">Taux de réussite moyen</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          <div className="text-lg font-semibold text-slate-100">
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Moyenne quotidienne */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-1">Moyenne quotidienne</div>
        <div className="text-xl font-semibold text-blue-300">
          {dailyAverage.toFixed(1)} quête{dailyAverage !== 1 ? 's' : ''}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Sur les 7 derniers jours
        </div>
      </div>
    </div>
  );
};

export default KPICards;

