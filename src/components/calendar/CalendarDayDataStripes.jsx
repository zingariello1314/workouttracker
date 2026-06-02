import React, { useMemo } from 'react';

/** Vue année : cases ~20px — max 3 bandes fines ; mois : bandes plus épaisses. */
const MAX_VISIBLE = { compact: 3, normal: 6 };

/** Hauteur réservée sous le numéro du jour (px). */
export function calendarStripeReservePx(compact = false, stripeCount = 0) {
  const n = Math.min(stripeCount || 0, compact ? MAX_VISIBLE.compact : MAX_VISIBLE.normal);
  if (n <= 0) return 0;
  const barH = compact ? 3 : 6;
  const gap = compact ? 1 : 2;
  return n * barH + (n - 1) * gap + (compact ? 3 : 6);
}

/**
 * Barres horizontales empilées en bas de case — style widget Garmin (réf. captures utilisateur).
 */
export default function CalendarDayDataStripes({ stripes, compact = false }) {
  const { visible, extra } = useMemo(() => {
    if (!Array.isArray(stripes) || stripes.length === 0) {
      return { visible: [], extra: 0 };
    }
    const max = compact ? MAX_VISIBLE.compact : MAX_VISIBLE.normal;
    const filtered = compact
      ? stripes.filter((s) => s.kind !== 'heartRate' && s.kind !== 'stress')
      : stripes;
    const list = (filtered.length ? filtered : stripes).slice(0, max);
    return {
      visible: list,
      extra: Math.max(0, stripes.length - list.length)
    };
  }, [stripes, compact]);

  if (!visible.length) return null;

  const barH = compact ? 3 : 6;
  const gap = compact ? 1 : 2;
  const insetX = compact ? 2 : 3;
  const insetBottom = compact ? 2 : 3;

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
              borderRadius: compact ? 1 : 2,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.45)'
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
