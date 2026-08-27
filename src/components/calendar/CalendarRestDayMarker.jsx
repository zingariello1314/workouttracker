import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Indicateur visuel « jour de repos » (justification repos) — vue mois et année.
 */
export default function CalendarRestDayMarker({
  compact = false,
  className,
  corner = 'top-right'
}) {
  const isBottom = corner === 'bottom-right';
  return (
    <span
      className={cn(
        'pointer-events-none absolute z-[6] flex items-center justify-center font-semibold leading-none text-sky-300/95',
        compact
          ? isBottom
            ? 'right-[2px] bottom-[2px] text-[8px]'
            : 'right-[2px] top-[2px] text-[8px]'
          : isBottom
            ? 'right-[3px] bottom-[3px] text-[10px]'
            : 'right-[3px] top-[3px] text-[10px]',
        className
      )}
      aria-hidden
      title="Repos"
    >
      <span
        className={cn(
          'rounded-full border border-sky-400/70 bg-sky-950/90',
          compact ? 'px-[3px] py-[1px]' : 'px-1 py-0.5'
        )}
      >
        💤
      </span>
    </span>
  );
}
