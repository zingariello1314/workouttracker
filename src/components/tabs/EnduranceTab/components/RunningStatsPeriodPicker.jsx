import React from 'react';
import { useTranslation } from '../../../../utils/translations';
import { RUNNING_STATS_PERIOD_OPTIONS } from '../../../../utils/sport/runningCardioStatsAnalytics';

/**
 * Sélecteur de plage (7 j → toujours) pour les graphiques stats course.
 */
export default function RunningStatsPeriodPicker({ value, onChange, className = '' }) {
  const t = useTranslation();

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {RUNNING_STATS_PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
            value === opt.id
              ? 'border-sky-500/60 bg-sky-500/15 text-sky-100'
              : 'border-[#0F4C5C]/50 bg-black text-teal-200/75 hover:border-teal-600/45'
          }`}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}
