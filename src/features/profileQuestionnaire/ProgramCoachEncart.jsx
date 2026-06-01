import React from 'react';
import { buildCoachEncartFromMeta } from './quizProgramPresentation';
import ProgramNutritionWeekPanel from './ProgramNutritionWeekPanel';

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
          {Array.isArray(quizGenerationMeta?.daysRemovedByCap) &&
          quizGenerationMeta.daysRemovedByCap.length > 0 ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/35 px-3 py-2 mb-2">
              <p className="text-[10px] uppercase tracking-wide text-amber-300/95 mb-1">
                Jours retirés pour tenir la charge
              </p>
              <p className="text-sm text-amber-50/95 leading-relaxed">
                {quizGenerationMeta.daysRemovedByCap.join(', ')} — le programme garde{' '}
                {quizGenerationMeta.prescribedActiveDays ?? '—'} séance(s) pour couvrir tes objectifs
                sans surcharge.
              </p>
            </div>
          ) : null}
          {quizGenerationMeta?.weekAllocationSummaryFr ? (
            <div className="rounded-lg border border-slate-500/30 bg-slate-900/40 px-3 py-2 mb-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                Répartition de la semaine
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">
                {quizGenerationMeta.weekAllocationSummaryFr}
              </p>
            </div>
          ) : null}
          {quizGenerationMeta?.objectivesSummaryFr || quizGenerationMeta?.weeklyObjectives ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 mb-2">
              <p className="text-[10px] uppercase tracking-wide text-emerald-300/90 mb-1">
                Objectifs de la semaine
              </p>
              <p className="text-sm text-emerald-50/95 leading-relaxed">
                {quizGenerationMeta.objectivesSummaryFr ||
                  'Volumes et missions calés sur tes réponses au quiz.'}
              </p>
              {quizGenerationMeta.prescribedActiveDays != null &&
              quizGenerationMeta.weeklyObjectives?.minActiveDaysToCover != null ? (
                <p className="text-[11px] text-slate-400 mt-1">
                  {quizGenerationMeta.prescribedActiveDays} séance(s) prescrites pour couvrir{' '}
                  {quizGenerationMeta.weeklyObjectives.minActiveDaysToCover} créneaux recommandés.
                </p>
              ) : null}
            </div>
          ) : null}
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

      {quizGenerationMeta?.nutritionAlignment?.byDay ? (
        <ProgramNutritionWeekPanel
          nutritionAlignment={quizGenerationMeta.nutritionAlignment}
          compact={compact}
        />
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
