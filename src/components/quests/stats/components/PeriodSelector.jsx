/**
 * Composant PeriodSelector - Sélecteur de période amélioré
 */

import React from 'react';
import { Calendar } from 'lucide-react';

const PERIODS = [
  { key: '7d', label: '7 jours', icon: '📅' },
  { key: '30d', label: '30 jours', icon: '📆' },
  { key: '90d', label: '90 jours', icon: '🗓️' },
  { key: '180d', label: '6 mois', icon: '📊' },
  { key: '365d', label: '12 mois', icon: '📈' },
  { key: 'all', label: 'Tout', icon: '∞' },
];

const PeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Calendar className="w-4 h-4 text-slate-400 mr-1" />
      <span className="text-[11px] text-slate-400 mr-1">Période :</span>
      {PERIODS.map((period) => (
        <button
          key={period.key}
          type="button"
          onClick={() => onPeriodChange(period.key)}
          className={`px-2 py-1 rounded-full border text-xs transition-all ${
            selectedPeriod === period.key
              ? 'bg-emerald-400 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/30'
              : 'bg-slate-900/50 text-slate-200 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <span className="mr-1">{period.icon}</span>
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;

