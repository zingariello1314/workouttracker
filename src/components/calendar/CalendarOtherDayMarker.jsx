import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Indicateur visuel « jour justifié autre » — vue mois et année.
 */
export default function CalendarOtherDayMarker({ compact = false, className }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute z-[6] flex items-center justify-center font-semibold leading-none text-violet-300/95',
        compact ? 'right-[2px] top-[2px] text-[8px]' : 'right-[3px] top-[3px] text-[10px]',
        className
      )}
      aria-hidden
      title="Autre"
    >
      <span
        className={cn(
          'rounded-full border border-violet-400/70 bg-violet-950/90',
          compact ? 'px-[3px] py-[1px]' : 'px-1 py-0.5'
        )}
      >
        📝
      </span>
    </span>
  );
}
