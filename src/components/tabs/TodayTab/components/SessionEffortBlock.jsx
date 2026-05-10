import React, { useMemo } from 'react';
import SessionEffortStars from './SessionEffortStars';

/**
 * Curseur 1–5 + étoiles alignés (onglet Aujourd’hui) : suggestion visuelle sans persistance tant que l’utilisateur n’agit pas.
 *
 * @param {object} props
 * @param {number|null|undefined} props.persistedValue — valeur DB (null = pas encore noté pour cette séance)
 * @param {number} props.suggestedStars — défaut affiché (ex. difficulté auto exercice ou 3)
 * @param {boolean} props.disabled
 * @param {(n: number) => void} props.onChange
 * @param {string} props.idPrefix — id stable pour aria (ex. ex-101 / stretch-matin-9111)
 */
export default function SessionEffortBlock({
  persistedValue,
  suggestedStars,
  disabled = false,
  onChange,
  idPrefix = 'effort'
}) {
  const fallback = useMemo(() => {
    const s = Number(suggestedStars);
    if (Number.isFinite(s) && s >= 1 && s <= 5) return Math.round(s);
    return 3;
  }, [suggestedStars]);

  const pv = Number(persistedValue);
  const hasPersisted = Number.isFinite(pv) && pv >= 1 && pv <= 5;
  /** Tant que rien n’est enregistré, on reflète uniquement une suggestion sans écrire en base. */
  const display = hasPersisted ? Math.round(pv) : fallback;

  const commit = (n) => {
    const x = Math.round(Number(n));
    if (!disabled && Number.isFinite(x) && x >= 1 && x <= 5) onChange?.(x);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[260px]" role="group" aria-label="Difficulté ressentie de 1 à 5">
      <label htmlFor={`${idPrefix}-effort-slider`} className="text-[11px] text-slate-400 sr-only">
        Curseur difficulté ({display} sur 5)
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`${idPrefix}-effort-slider`}
          type="range"
          min={1}
          max={5}
          step={1}
          value={display}
          disabled={disabled}
          onChange={(e) => commit(Number(e.target.value))}
          className="flex-1 h-2 accent-amber-400 cursor-pointer bg-slate-700 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={display}
        />
        <span className="tabular-nums text-xs text-amber-200/90 font-medium w-6 text-center">{display}</span>
      </div>
      <SessionEffortStars
        value={display}
        disabled={disabled}
        onChange={commit}
        className="scale-95 origin-left"
      />
      {!hasPersisted && (
        <p className="text-[10px] text-slate-500 leading-snug">
          Déplace le curseur ou touche une étoile pour enregistrer ta note du jour (sinon l’auto est utilisée pour l’analyse).
        </p>
      )}
    </div>
  );
}
