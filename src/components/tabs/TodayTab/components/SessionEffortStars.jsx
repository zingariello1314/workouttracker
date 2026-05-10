import React from 'react';

/**
 * 5 étoiles cliquables (1–5) pour la difficulté « séance » (Aujourd’hui).
 * @param {object} props
 * @param {number|null} [props.value=null] — valeur enregistrée ; null / undefined = aucune saisie
 * @param {boolean} props.disabled
 * @param {(n: number) => void} props.onChange
 * @param {string} [props.className]
 * @param {string} [props.label]
 */
export default function SessionEffortStars({ value = null, disabled = false, onChange, className = '', label }) {
  const v = Number(value);
  const selected =
    Number.isFinite(v) && v >= 1 && v <= 5 ? Math.round(v) : 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-1 ${className}`}
      role="group"
      aria-label={label || `Difficulté ressentie (${selected || 'non notée'})`}
    >
      {label ? (
        <span className="text-[11px] text-slate-400 mr-1 max-w-[7rem] leading-tight">{label}</span>
      ) : null}
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = selected >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(n)}
            className={`min-h-[36px] min-w-[34px] rounded-md text-lg leading-none transition-colors
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-600/40 active:bg-slate-500/35'}
              ${filled ? 'text-amber-300' : 'text-slate-600'}`}
            aria-label={`${n} sur 5`}
            aria-pressed={filled}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
