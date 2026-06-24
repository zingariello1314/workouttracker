import React from 'react';
import { Scale } from 'lucide-react';

/**
 * Ligne pesée sous les distinctions emoji du détail jour.
 */
export default function CalendarDayWeightBanner({ weightKg, t }) {
  const tr = t || ((k, d) => d);
  if (weightKg == null) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-600/45 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-200">
      <Scale className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />
      <span>
        {tr('calendar.heatmap.dayDetails.weightLogged', 'Pesée réalisée')} :{' '}
        <strong className="tabular-nums text-sky-50">{weightKg} kg</strong>
      </span>
    </div>
  );
}
