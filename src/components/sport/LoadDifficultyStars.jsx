import React from 'react';
import { intensityCoeffToStarCount } from '../../utils/trainingLoadUtils';

/**
 * Affiche 1–5 (ou 1–10) étoiles selon le coefficient de charge (réglage onglet Exercices).
 * @param {number} [starCountOverride] — si défini (1–5 en base 5), remplace le calcul à partir de `coeff` (difficulté fusionnée).
 * @param {5|10} [maxStars=5]
 */
const LoadDifficultyStars = ({ coeff, starCountOverride, className = '', title, maxStars = 5 }) => {
  const c = Number(coeff);
  const fromCoeff = intensityCoeffToStarCount(Number.isFinite(c) ? c : 1);
  const rawOverride = Number(starCountOverride);
  const base5Raw =
    Number.isFinite(rawOverride) && rawOverride >= 1 && rawOverride <= 5
      ? Math.round(rawOverride)
      : fromCoeff;
  const n =
    maxStars === 10
      ? Math.max(1, Math.min(10, Math.round(1 + ((base5Raw - 1) * 9) / 4)))
      : base5Raw;
  const max = maxStars === 10 ? 10 : 5;
  const coefLabel = Number.isFinite(c) ? Math.round(c * 100) / 100 : '—';
  const tip =
    title ||
    (Number.isFinite(rawOverride) && rawOverride >= 1 && rawOverride <= 5
      ? `Difficulté estimée (${n}/${max}) · indice calendrier ×${coefLabel}`
      : Number.isFinite(c)
        ? `Charge calendrier ×${coefLabel} (${n}/${max})`
        : `Charge calendrier (${n}/${max})`);

  return (
    <span
      className={`inline-flex select-none items-center gap-0.5 tracking-tight text-sky-400 ${className}`}
      title={tip}
      aria-label={tip}
    >
      <span className="text-sm" aria-hidden>
        {'★'.repeat(n)}
      </span>
      <span className="text-sm text-teal-900" aria-hidden>
        {'☆'.repeat(max - n)}
      </span>
    </span>
  );
};

export default LoadDifficultyStars;
