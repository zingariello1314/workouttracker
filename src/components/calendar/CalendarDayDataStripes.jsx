import React, { useMemo } from 'react';
import { sortCalendarDayStripes } from '../../utils/calendarDayMomentumStripes';
import { filterCalendarStripesForYearView } from '../../utils/calendarPhysicalActivityStripes';

/** Vue année : cases ~20px ; mois : place pour toutes les bandes demandées. */
const MAX_VISIBLE = { compact: 3, normal: 10 };

/** Hauteur réservée sous le numéro du jour (px). */
export function calendarStripeReservePx(compact = false, stripeCount = 0) {
  const n = Math.min(stripeCount || 0, compact ? MAX_VISIBLE.compact : MAX_VISIBLE.normal);
  if (n <= 0) return 0;
  const barH = compact ? 6 : 12;
  const gap = compact ? 1 : 2;
  return n * barH + (n - 1) * gap + (compact ? 3 : 6);
}

/**
 * Barres horizontales empilées en bas de case — style widget Garmin (réf. captures utilisateur).
 * @param {boolean} [physicalOnly] — vue année : uniquement activités physiques (hors marche, pas, sommeil…)
 */
export default function CalendarDayDataStripes({ stripes, compact = false, physicalOnly = false }) {
  const { visible, extra } = useMemo(() => {
    if (!Array.isArray(stripes) || stripes.length === 0) {
      return { visible: [], extra: 0 };
    }
    const max = compact ? MAX_VISIBLE.compact : MAX_VISIBLE.normal;
    const sorted = sortCalendarDayStripes(stripes);
    let filtered = sorted;
    if (physicalOnly) {
      filtered = filterCalendarStripesForYearView(sorted);
    } else {
      filtered = sorted.filter((s) => s.kind !== 'heartRate' && s.kind !== 'stress');
    }
    const list = filtered.slice(0, max);
    return {
      visible: list,
      extra: Math.max(0, filtered.length - list.length)
    };
  }, [stripes, compact, physicalOnly]);

  if (!visible.length) return null;

  const barH = compact ? 6 : 12;
  const gap = compact ? 1 : 2;
  const insetX = compact ? 1 : 3;
  const insetBottom = compact ? 1 : 4;

  return (
    <>
      <div
        className="pointer-events-none absolute z-[5] flex flex-col"
        style={{
          left: insetX,
          right: insetX,
          bottom: insetBottom,
          gap
        }}
        aria-hidden="true"
      >
        {visible.map((stripe, index) => (
          <div
            key={stripe.key || `${stripe.kind}-${index}`}
            style={{
              width: '100%',
              height: barH,
              minHeight: barH,
              backgroundColor: stripe.color,
              borderRadius: compact ? 1 : 3,
              border: '1px solid rgba(0,0,0,0.65)',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)'
            }}
          />
        ))}
      </div>
      {extra > 0 && (
        <span
          className={`pointer-events-none absolute z-[6] font-bold leading-none text-sky-400 ${
            compact ? 'bottom-[2px] right-[3px] text-[8px]' : 'bottom-[3px] right-[4px] text-[9px]'
          }`}
          aria-hidden
        >
          +{extra}
        </span>
      )}
    </>
  );
}
