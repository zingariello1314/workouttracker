import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

function AxisRow({ label, axis }) {
  if (!axis) return null;
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200">{axis.value}</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-teal-200">{axis.trend}</span>
        <span className="text-slate-500">conf. {Math.round((axis.confidence || 0) * 100)} %</span>
      </div>
      {axis.evidence?.length ? (
        <ul className="mt-1.5 space-y-0.5 text-[10px] text-slate-400">
          {axis.evidence.slice(0, 3).map((e, i) => (
            <li key={i}>· {e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ChipList({ items, empty = '—' }) {
  if (!items?.length) return <p className="text-[10px] text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-1 text-[10px] text-slate-300">
      {items.slice(0, 8).map((item, i) => (
        <li key={item.id || i} className="rounded border border-slate-700/50 bg-slate-900/30 px-2 py-1">
          <span className="font-medium text-violet-200">{item.type || item.kind || item.axis}</span>
          {item.narrative ? <span> — {item.narrative}</span> : null}
          {item.exerciseName ? <span> ({item.exerciseName})</span> : null}
          {item.text ? <p className="mt-1 text-slate-400">{item.text}</p> : null}
          {item.confidence != null ? (
            <span className="ml-1 text-slate-500">[{Math.round(item.confidence * 100)} %]</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Panneau debug (dev) — état interprétation moteur Récap Analyse.
 */
export default function RecapTrainingStateDebugPanel({
  trainingState,
  priorState = null,
  stateTransitions = [],
  trainingEvents = [],
  performanceRobustness = [],
  populationComparisons = [],
  composedInterpretations = [],
  insightSignature = null,
  athleteIdentity = null,
  phenomena = []
}) {
  const [open, setOpen] = useState(false);

  if (!trainingState) return null;

  const features = trainingState.features || {};

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-200">
          <Brain size={14} />
          Moteur d&apos;interprétation {import.meta.env.DEV ? '(dev)' : '(admin)'}
        </span>
        {open ? <ChevronUp size={14} className="text-violet-300" /> : <ChevronDown size={14} className="text-violet-300" />}
      </button>

      {open ? (
        <div className="space-y-3 border-t border-violet-500/20 px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
            {trainingState.lifePhase ? (
              <span className="rounded-full border border-violet-500/40 px-2 py-0.5 text-violet-200">
                phase {trainingState.lifePhase}
              </span>
            ) : null}
            {trainingState.adaptationCost ? (
              <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-amber-200">
                coût {trainingState.adaptationCost}
              </span>
            ) : null}
            {trainingState.context?.tier ? (
              <span className="rounded-full border border-slate-600 px-2 py-0.5">{trainingState.context.tier}</span>
            ) : null}
            {insightSignature ? (
              <span className="truncate text-slate-600" title={insightSignature}>
                sig…{String(insightSignature).slice(-24)}
              </span>
            ) : null}
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500">
            Trois couches distinctes : <span className="text-slate-300">état brut</span> (features, reps
            cochées) → <span className="text-slate-300">interprétation</span> (phénomènes) →{' '}
            <span className="text-slate-300">conclusion</span> (cartes). « Volume » = nombre de
            répétitions suivies, pas une dose mécanique. Identité = habitude observée, pas un rythme
            optimal. Les colonnes n’affichent que les lectures retenues.
          </p>

          {athleteIdentity?.ready ? (
            <p className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-2.5 py-2 text-[10px] text-slate-300">
              Identité fréquence : {athleteIdentity.frequency?.status} · actuel{' '}
              {athleteIdentity.frequency?.currentPerWeek} /sem. · habitude{' '}
              {athleteIdentity.frequency?.meanPerWeek} (plage {athleteIdentity.frequency?.bandLow}–
              {athleteIdentity.frequency?.bandHigh}) — comportement observé, pas un optimum.
            </p>
          ) : null}

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Phénomènes ({(phenomena || []).length})
            </p>
            <ChipList
              items={(phenomena || []).map((p) => ({
                id: p.id,
                type: p.type,
                narrative: (p.signals || []).join(', '),
                text: [
                  p.interpretation ? JSON.stringify(p.interpretation) : null,
                  p.priority
                    ? `anomalie ${p.priority.unusual ? 'oui' : 'non'} · importance objectif ${
                        p.priority.goalRelevant ? 'oui' : 'non'
                      }`
                    : null
                ]
                  .filter(Boolean)
                  .join(' · '),
                confidence: p.confidence
              }))}
              empty="Aucun phénomène composé sur cette fenêtre"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <AxisRow label="Exposition (reps)" axis={trainingState.load} />
            <AxisRow label="Sortie observée" axis={trainingState.performance} />
            <AxisRow label="Récup." axis={trainingState.recovery} />
            <AxisRow label="Fatigue" axis={trainingState.fatigue} />
            <AxisRow label="Adhérence" axis={trainingState.adherence} />
            <AxisRow label="Réponse" axis={trainingState.programResponse} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Features</p>
              <pre className="max-h-32 overflow-auto rounded-lg border border-slate-700/50 bg-slate-950/60 p-2 text-[10px] text-slate-300">
                {JSON.stringify(features, null, 2)}
              </pre>
            </div>
            {priorState ? (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Fenêtre précédente (résumé)
                </p>
                <pre className="max-h-32 overflow-auto rounded-lg border border-slate-700/50 bg-slate-950/60 p-2 text-[10px] text-slate-300">
                  {JSON.stringify(
                    {
                      load: priorState.load?.value,
                      performance: priorState.performance?.value,
                      recovery: priorState.recovery?.value
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Transitions</p>
              <ChipList items={stateTransitions} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Événements</p>
              <ChipList items={trainingEvents} />
            </div>
            <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Robustesse
            </p>
            <ChipList
              items={(() => {
                const seen = new Set();
                return (performanceRobustness || []).filter((r) => {
                  const k = r.exerciseName || r.exerciseId;
                  if (!k || seen.has(k)) return false;
                  seen.add(k);
                  return true;
                });
              })()}
            />
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Comparaisons hiérarchiques ({populationComparisons.length})
            </p>
            <ul className="space-y-1 text-[10px] text-slate-300">
              {(populationComparisons || []).slice(0, 6).map((item) => (
                <li key={item.id} className="rounded border border-slate-700/50 bg-slate-900/30 px-2 py-1">
                  <span className="mr-2 rounded bg-slate-800 px-1 py-0.5 text-[9px] uppercase text-amber-200">
                    {item.level}
                  </span>
                  {item.text}
                </li>
              ))}
              {!populationComparisons?.length ? (
                <li className="text-slate-500">—</li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Interprétations composées ({composedInterpretations.length})
            </p>
            <ChipList items={composedInterpretations} empty="Aucune relation active sur cette fenêtre" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
