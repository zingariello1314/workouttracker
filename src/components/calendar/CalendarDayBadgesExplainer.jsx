import React from 'react';
import { Crown, Trophy } from 'lucide-react';

/**
 * Bandeau en tête du détail jour : emojis du jour + explication.
 */
export default function CalendarDayBadgesExplainer({ badgeDetails, t }) {
  if (!badgeDetails?.length) return null;

  const tr = t || ((k, d) => d);

  return (
    <div className="mb-4 rounded-xl border-2 border-amber-500/45 bg-gradient-to-br from-amber-950/40 to-black p-4 shadow-inner shadow-black/30">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-200">
        <Trophy className="h-4 w-4 text-amber-300" aria-hidden />
        {tr('calendar.heatmap.dayDetails.dayBadgesTitle', 'Distinctions du jour')}
      </h4>
      <ul className="space-y-2.5">
        {badgeDetails.map((badge, index) => (
          <li
            key={`${badge.title}-${index}`}
            className="flex gap-3 rounded-lg border border-amber-500/25 bg-black/35 p-3"
          >
            <span className="flex shrink-0 items-start pt-0.5 text-2xl leading-none" aria-hidden>
              {badge.type === 'crown' ? (
                <Crown className="h-7 w-7 text-amber-300 drop-shadow" />
              ) : (
                badge.emoji
              )}
            </span>
            <div className="min-w-0">
              <div className="font-medium text-amber-100">{badge.title}</div>
              <p className="mt-0.5 text-sm leading-relaxed text-amber-100/75">{badge.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
