/**
 * Composant KPICards - Affiche les indicateurs clés de performance
 */

import React from 'react';
import { qstatsPanel, qstatsMuted, qstatsMutedTight } from '../questsStatsTheme';

const kpiCard = `${qstatsPanel} !py-3`;

const KPICards = ({ stats }) => {
  const { totalXP, currentStreak, bestStreak, completionRate, dailyAverage } = stats;

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* XP total */}
      <div className={kpiCard}>
        <div className={`text-xs ${qstatsMuted} mb-1`}>XP total gagné</div>
        <div className="text-xl font-semibold text-amber-300">
          {totalXP.toLocaleString('fr-FR')} XP
        </div>
      </div>

      {/* Streak actuel */}
      <div className={kpiCard}>
        <div className={`text-xs ${qstatsMuted} mb-1`}>Streak actuel</div>
        <div className="text-xl font-semibold text-amber-200">
          {currentStreak} jour{currentStreak > 1 ? 's' : ''}
        </div>
        <div className={`text-[11px] ${qstatsMutedTight} mt-1`}>
          Meilleur streak : {bestStreak} jour{bestStreak > 1 ? 's' : ''}
        </div>
      </div>

      {/* Taux de réussite moyen */}
      <div className={kpiCard}>
        <div className={`text-xs ${qstatsMuted} mb-1`}>Taux de réussite moyen</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-2 rounded-full bg-black border border-amber-600/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          <div className="text-lg font-semibold text-amber-200">
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Moyenne quotidienne */}
      <div className={kpiCard}>
        <div className={`text-xs ${qstatsMuted} mb-1`}>Moyenne quotidienne</div>
        <div className="text-xl font-semibold text-amber-300">
          {dailyAverage.toFixed(1)} quête{dailyAverage !== 1 ? 's' : ''}
        </div>
        <div className={`text-[11px] ${qstatsMutedTight} mt-1`}>
          Sur les 7 derniers jours
        </div>
      </div>
    </div>
  );
};

export default KPICards;
