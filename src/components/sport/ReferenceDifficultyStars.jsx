import React from 'react';
import { Crown, Star } from 'lucide-react';

export const MAX_REF_STARS = 8;

const VISUAL_STAR_SLOTS = 7;

/**
 * Étoiles référentiel officiel (1–8).
 * Affichage : badge n/8 + 7 étoiles Lucide + couronne si niveau 8.
 */
export default function ReferenceDifficultyStars({
  stars,
  intensityCoeff,
  className = '',
  title,
  /** Affiche le score texte « 4/8 » */
  showScore = true,
  /** inline = étoiles seules · pill = pastille bordée (Aujourd'hui / banque) */
  variant = 'inline',
  size = 'sm',
  /** Affiche « ×1,55 » sous la pastille (variant pill) */
  showCoeff = false
}) {
  const n = Math.min(MAX_REF_STARS, Math.max(1, Math.round(Number(stars) || 1)));
  const coeffLabel =
    intensityCoeff != null && Number.isFinite(Number(intensityCoeff))
      ? Math.round(Number(intensityCoeff) * 100) / 100
      : null;
  const tip =
    title ||
    (coeffLabel != null
      ? `Difficulté référentiel ${n}/${MAX_REF_STARS} · coeff. ×${coeffLabel}`
      : `Difficulté référentiel ${n}/${MAX_REF_STARS}`);

  const filledCount = n >= MAX_REF_STARS ? VISUAL_STAR_SLOTS : n;
  const isElite = n >= MAX_REF_STARS;
  const iconClass = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';
  const crownClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const starRow = (
    <span className="inline-flex items-center gap-px" aria-hidden>
      {Array.from({ length: VISUAL_STAR_SLOTS }, (_, i) => {
        const on = i < filledCount;
        return (
          <Star
            key={`ref-star-${i}`}
            className={`${iconClass} shrink-0 transition-colors ${
              on
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.45)]'
                : 'fill-transparent text-slate-600/90'
            }`}
            strokeWidth={on ? 1.5 : 1.75}
          />
        );
      })}
      {isElite ? (
        <Crown
          className={`${crownClass} shrink-0 ml-0.5 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.55)]`}
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
    </span>
  );

  const scoreBadge = showScore ? (
    <span
      className={`font-bold tabular-nums leading-none ${
        size === 'md' ? 'text-xs' : 'text-[11px]'
      } ${isElite ? 'text-amber-200' : 'text-amber-100/95'}`}
    >
      {n}
      <span className="font-medium text-amber-500/70">/{MAX_REF_STARS}</span>
    </span>
  ) : null;

  const inner = (
    <>
      {scoreBadge}
      {starRow}
    </>
  );

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex select-none flex-col items-start gap-0.5 ${className}`}
        title={tip}
        aria-label={tip}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 ${
            isElite
              ? 'border-amber-400/35 bg-gradient-to-r from-amber-950/50 to-amber-900/20'
              : 'border-amber-500/20 bg-amber-950/25'
          }`}
        >
          {inner}
        </span>
        {showCoeff && coeffLabel != null ? (
          <span className="text-[10px] tabular-nums text-amber-500/80 pl-0.5 leading-none">
            ×{coeffLabel}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex select-none items-center gap-1.5 ${className}`}
      title={tip}
      aria-label={tip}
    >
      {inner}
    </span>
  );
}
