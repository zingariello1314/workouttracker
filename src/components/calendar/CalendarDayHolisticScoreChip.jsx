import React from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

/**
 * Pastille compacte en tête du détail jour — clic scroll vers le détail complet.
 */
export default function CalendarDayHolisticScoreChip({ score, onScrollToDetail, t }) {
  const tr = t || ((k, d) => d);
  if (score == null) return null;

  return (
    <button
      type="button"
      onClick={onScrollToDetail}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/25 px-4 py-3 text-left transition-colors hover:border-emerald-400/55 hover:bg-emerald-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400/70"
      aria-label={tr(
        'calendar.heatmap.dayDetails.holisticScoreScroll',
        'Voir le détail de la note globale'
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-emerald-100">
        <Sparkles className="h-4 w-4 text-emerald-300" aria-hidden />
        {tr('calendar.heatmap.dayDetails.holisticScoreTitle', 'Note globale du jour')}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-2xl font-bold tabular-nums text-emerald-50">{score}</span>
        <span className="text-sm text-emerald-300/80">/100</span>
        <ChevronDown
          className="h-4 w-4 text-emerald-400/70 transition-transform group-hover:translate-y-0.5"
          aria-hidden
        />
      </span>
    </button>
  );
}
