import React from 'react';
import { buildCoachEncartFromMeta } from './quizProgramPresentation';

/**
 * Encart coach affiché à la création d’un programme quiz ou sur le programme actif.
 */
const ProgramCoachEncart = ({ quizGenerationMeta, onSuggestRegenerate, compact = false }) => {
  const encart = buildCoachEncartFromMeta(quizGenerationMeta);
  const showRegen =
    Boolean(quizGenerationMeta?.suggestRegeneration) && typeof onSuggestRegenerate === 'function';

  if (!encart && !showRegen) return null;

  return (
    <div
      className={`rounded-xl border border-cyan-500/30 bg-cyan-950/25 space-y-2 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      {encart ? (
        <>
          <p className="text-xs uppercase tracking-wide text-cyan-300/90">Coach — pourquoi ce programme</p>
          <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
            {encart.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {encart.generationMode ? (
            <p className="text-[10px] text-slate-500">
              Structure interne : {encart.archetypeId || '—'} · mode {encart.generationMode}
            </p>
          ) : null}
        </>
      ) : null}

      {showRegen ? (
        <div className="rounded-lg border border-amber-600/40 bg-amber-950/30 p-3 space-y-2">
          <p className="text-xs text-amber-100/95">
            {quizGenerationMeta.regenerationHint ||
              'Ton historique Sport suggère de régénérer le programme avec des données plus récentes.'}
          </p>
          <button
            type="button"
            onClick={onSuggestRegenerate}
            className="rounded-lg border border-amber-500/60 bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-600/35"
          >
            Régénérer avec mon historique
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ProgramCoachEncart;
