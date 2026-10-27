import React from 'react';
import { useTranslation } from '../../../../utils/translations';
import { RUNNING_STATS_PERIOD_OPTIONS } from '../../../../utils/sport/runningCardioStatsAnalytics';

/**
 * Sélecteur de plage (7 j → toujours) pour les graphiques stats course.
 */
export default function RunningStatsPeriodPicker({ value, onChange, className = '' }) {
  const t = useTranslation();

  return (
    <div className={`chips ${className}`}>
      {RUNNING_STATS_PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className="chip"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}
