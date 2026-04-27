import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scale } from 'lucide-react';

/**
 * Détail du volume kg×reps sur la période (une ligne par exercice, sommes alignées récap).
 */
export default function RecapLiftVolumeBreakdown({ rows = [], totalKg, periodLabel }) {
  const [open, setOpen] = useState(false);
  const top = Array.isArray(rows) ? rows.slice(0, 25) : [];
  const fmt = (n) =>
    Math.round(Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  if (!totalKg || totalKg <= 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-[#0F4C5C]/50 bg-black/80 p-3 text-xs text-teal-100/90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left font-medium text-teal-50 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <Scale className="h-4 w-4 shrink-0 text-amber-300/90" aria-hidden />
          Détail volume (kg×reps){periodLabel ? ` · ${periodLabel}` : ''}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {!open ? (
        <p className="mt-2 text-[11px] leading-snug text-teal-500">
          Répartition par exercice (même calcul que la case « Poids soulevé ») : poids par série, option « par
          bras », haltères bilatéraux ×2 quand la saisie est le poids d&apos;une seule haltère.
        </p>
      ) : (
        <>
          <div className="mt-2 flex justify-between border-b border-[#0F4C5C]/35 pb-1 text-[10px] uppercase tracking-wide text-teal-500">
            <span>Exercice</span>
            <span className="tabular-nums">kg×reps · reps</span>
          </div>
          <ul className="max-h-52 space-y-1 overflow-y-auto pr-1 text-[11px]">
            {top.map((r) => (
              <li key={String(r.id)} className="flex justify-between gap-2 border-b border-[#0F4C5C]/20 py-1">
                <span className="min-w-0 truncate text-teal-100/95" title={r.name}>
                  {r.name}
                </span>
                <span className="shrink-0 tabular-nums text-amber-100/90">
                  {fmt(r.volumeKg)} · {fmt(r.reps)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-[#0F4C5C]/45 pt-2 text-sm font-semibold text-white">
            <span>Total période</span>
            <span className="tabular-nums text-amber-200">{fmt(totalKg)} kg×reps</span>
          </div>
        </>
      )}
    </div>
  );
}
