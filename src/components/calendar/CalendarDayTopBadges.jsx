import React from 'react';
import { Crown } from 'lucide-react';
import { calendarBadgeCountScale } from '../../utils/calendarYearDayBadges';

/**
 * Vue mois : performances en bas à gauche, au-dessus des barres.
 * Vue année : badges en haut à droite, au-dessus des barres.
 */
export default function CalendarDayTopBadges({
  badges,
  compact = false,
  sizeScale = 1,
  stripeReservePx = 0,
  anchor = 'bottom-left'
}) {
  if (!badges?.length) return null;

  const countScale = calendarBadgeCountScale(badges.length, { compact });
  const scale = Math.max(0.45, Math.min(1.55, (Number(sizeScale) || 1) * countScale));
  const topRight = anchor === 'top-right';
  const stackVertical = topRight && compact && badges.length >= 3;
  const emojiPx = Math.round((topRight ? (compact ? 10 : 15) : (compact ? 9 : 14)) * scale);
  const crownPx = Math.round((topRight ? (compact ? 10 : 16) : (compact ? 9 : 15)) * scale);
  const gapPx = stackVertical
    ? Math.max(0, Math.round(scale))
    : Math.max(0, Math.round((topRight ? 1 : compact ? 0 : 1) * scale));
  const leftInset = compact ? 1 : 3;
  const bottomInset = (Number(stripeReservePx) || 0) + (compact ? 1 : 3);
  const numberReserve = compact ? 11 : 16;
  const topInset = compact ? 1 : 2;
  const rightInset = compact ? 1 : 3;

  return (
    <div
      className={`pointer-events-none absolute flex leading-none ${
        topRight
          ? `z-[10] ${stackVertical ? 'flex-col items-end' : 'flex-row-reverse flex-nowrap items-start'}`
          : 'z-[8] flex-row flex-wrap content-end items-end'
      }`}
      style={
        topRight
          ? {
              top: topInset,
              right: rightInset,
              maxWidth: compact ? (stackVertical ? '46%' : '62%') : undefined,
              maxHeight: `calc(100% - ${stripeReservePx + topInset + 2}px)`,
              gap: gapPx
            }
          : {
              left: leftInset,
              bottom: bottomInset,
              maxWidth: compact ? '92%' : '94%',
              maxHeight: `calc(100% - ${bottomInset + numberReserve}px)`,
              gap: gapPx
            }
      }
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
