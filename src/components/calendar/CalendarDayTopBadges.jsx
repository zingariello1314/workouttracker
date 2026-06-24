import React from 'react';
import { Crown } from 'lucide-react';
import { calendarBadgeCountScale } from '../../utils/calendarYearDayBadges';

/**
 * Badges en haut à droite de la case — au-dessus des barres d'activité.
 * Vue année + 3 badges ou plus : pile verticale pour ne pas recouvrir le chiffre du jour.
 */
export default function CalendarDayTopBadges({
  badges,
  compact = false,
  sizeScale = 1,
  stripeReservePx = 0
}) {
  if (!badges?.length) return null;

  const countScale = calendarBadgeCountScale(badges.length, { compact });
  const scale = Math.max(0.45, Math.min(1.55, (Number(sizeScale) || 1) * countScale));
  const stackVertical = compact && badges.length >= 3;

  const emojiPx = Math.round((compact ? 10 : 15) * scale);
  const crownPx = Math.round((compact ? 10 : 16) * scale);
  const gapPx = stackVertical ? Math.max(0, Math.round(scale)) : Math.max(0, Math.round(1 * scale));
  const topInset = compact ? 1 : 2;
  const rightInset = compact ? 1 : 3;

  return (
    <div
      className={`pointer-events-none absolute z-[10] flex leading-none ${
        stackVertical ? 'flex-col items-end' : 'flex-row-reverse flex-nowrap items-start'
      }`}
      style={{
        top: topInset,
        right: rightInset,
        maxWidth: compact ? (stackVertical ? '46%' : '62%') : undefined,
        maxHeight: `calc(100% - ${stripeReservePx + topInset + 2}px)`,
        gap: gapPx
      }}
    >
      {badges.map((badge, index) =>
        badge.type === 'crown' ? (
          <Crown
            key={`crown-${index}`}
            className="shrink-0 text-amber-300 drop-shadow"
            style={{ width: crownPx, height: crownPx, minWidth: crownPx }}
            aria-label={badge.title}
            title={badge.title}
          />
        ) : (
          <span
            key={`${badge.emoji}-${index}`}
            className="shrink-0 drop-shadow"
            style={{ fontSize: emojiPx, lineHeight: 1 }}
            aria-label={badge.title}
            title={badge.title}
          >
            {badge.emoji}
          </span>
        )
      )}
    </div>
  );
}
