/**
 * CircuitsTodaySection — affiche les circuits planifiés pour la date courante.
 *
 * Style aligné sur la charte sport :
 *   - cartes `Card variant="sport"`
 *   - sous-cartes `border-[#0F4C5C]/45 bg-black` (ou emerald si fait)
 *   - boutons primaires `border-[#0F5C45]/60 bg-[#0F5C45]/20`
 *   - palette teal/emerald/amber alignée sur le reste de l'onglet sport
 *
 * Source des circuits :
 *   1. `program.schedule[dayName].circuitIds` (assignations programme).
 *   2. + Tous les circuits déjà entamés ce jour (clés présentes dans
 *      `circuitProgress[dateStr]`) — utile si l'utilisateur lance un circuit
 *      depuis le hub Défis sans l'avoir assigné à un jour.
 */

import React, { useMemo, useState } from 'react';
import {
  Repeat,
  Layers,
  Award,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RotateCw,
  Minus
} from 'lucide-react';
import Card from '../../../ui/Card';
import { useWorkout } from '../../../../context/WorkoutContext';
import {
  computeCircuitXpForDay,
  CIRCUIT_BASE_XP_PER_BONUS_ROUND,
  CIRCUIT_TRIPLE_TARGET_BONUS_XP
} from '../../../../services/xp/circuitsXpService';
import { getCircuitIdsForDay } from '../../../../utils/circuits/circuitDefinitionUtils';

const CircuitProgressBar = ({ rounds, target }) => {
  const safeTarget = Math.max(1, target);
  const triple = safeTarget * 3;
  const pctTarget = Math.min(100, (Math.min(rounds, safeTarget) / safeTarget) * 100);
  const pctOver =
    rounds > safeTarget ? Math.min(100, ((rounds - safeTarget) / (triple - safeTarget)) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-[#0F4C5C]/55 bg-black">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#0F5C45]/80 transition-all"
          style={{ width: `${pctTarget}%` }}
        />
        {pctOver > 0 && (
          <div
            className="absolute inset-y-0 rounded-full bg-amber-500/85 transition-all"
            style={{
              left: `${pctTarget}%`,
              width: `${(pctOver / 100) * (100 - pctTarget)}%`
            }}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-teal-200/70">
        <span>0</span>
        <span className="text-teal-200">cible : {safeTarget}</span>
        <span className="text-amber-200">3× : {triple}</span>
      </div>
    </div>
  );
};

const CircuitCard = ({ circuit, rounds, onIncrement, onDecrement }) => {
  const target = Math.max(1, Number(circuit.targetRounds) || 1);
  const xpInfo = computeCircuitXpForDay(rounds, target);
  const isCompleted = xpInfo.isCompleted;
  const isTriple = xpInfo.isTripleAchieved;

  const items = Array.isArray(circuit.items) ? circuit.items : [];

  const [isOpen, setIsOpen] = useState(false);

  const cardBorder = isTriple
    ? 'border-amber-400/50 bg-amber-950/15'
    : isCompleted
      ? 'border-emerald-500/50 bg-emerald-950/15'
      : 'border-[#0F4C5C]/45 bg-slate-950/40';

  return (
    <div className={`rounded-xl border p-4 transition ${cardBorder}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
            <Layers size={14} className="text-sky-300" />
            {circuit.name}
            {isTriple && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100">
                <Sparkles size={10} /> 3× atteint
              </span>
            )}
            {!isTriple && isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/55 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100">
                cible atteinte
              </span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-teal-200/70">
            {target} tours cibles · {items.length} exo{items.length > 1 ? 's' : ''}
            {circuit.restBetweenRoundsSec ? ` · repos ${circuit.restBetweenRoundsSec}s` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-white">
              {rounds}
              <span className="text-base text-teal-200/70">/{target}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wide text-teal-200/80">tours faits</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <CircuitProgressBar rounds={rounds} target={target} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDecrement}
            disabled={rounds <= 0}
            className="inline-flex items-center gap-1 rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-1.5 text-sm text-teal-100 hover:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Annuler le dernier tour"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={onIncrement}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/20 px-4 py-1.5 text-sm font-semibold text-teal-50 hover:border-[#0F5C45]/80 hover:bg-[#0F5C45]/30"
          >
            <RotateCw size={14} /> +1 tour
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#0F4C5C]/55 bg-black px-2.5 py-1.5 text-xs text-teal-100 hover:border-sky-500/40"
          >
            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Détails
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-400/45 bg-amber-950/25 px-3 py-1.5 text-xs">
          <Award size={14} className="text-amber-200" />
          <span className="font-semibold text-amber-100">
            +{xpInfo.xp} XP
            {xpInfo.bonusRounds > 1 ? ` · ${xpInfo.bonusRounds} bonus` : ''}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-2 rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-3">
          {items.length === 0 ? (
            <p className="text-xs text-teal-200/70">Aucun exercice configuré pour ce circuit.</p>
          ) : (
            <ul className="space-y-1.5">
              {items.map((it, i) => (
                <li
                  key={it.slotId || `${it.exerciseKey}-${i}`}
                  className="flex items-center justify-between gap-2 text-xs text-teal-50"
                >
                  <span className="truncate">
                    <span className="text-sky-300">{i + 1}.</span> {it.exerciseName}
                    {it.notes ? <span className="text-teal-200/60"> — {it.notes}</span> : null}
                  </span>
                  <span className="shrink-0 rounded-md border border-[#0F4C5C]/55 bg-slate-950/60 px-2 py-0.5 text-teal-200">
                    {it.mode === 'duration' ? `${it.targetDurationSec || 0} s` : `${it.targetReps || 0} reps`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {circuit.notes && (
            <p className="rounded-md border border-[#0F4C5C]/40 bg-slate-950/40 p-2 text-[11px] italic text-teal-200/80">
              {circuit.notes}
            </p>
          )}
          <p className="text-[10px] text-teal-200/60">
            Barème XP : {CIRCUIT_BASE_XP_PER_BONUS_ROUND} XP au tour cible et chaque tour bonus,
            {' '}{CIRCUIT_TRIPLE_TARGET_BONUS_XP} XP au tour numéro {target * 3} (3× cible) — remplace le bonus standard.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Circuits planifiés pour un jour de programme + suivi des tours sur une date calendaire.
 * @param {string} dayName — jour du programme (lundi…)
 * @param {string} dateStr — date YYYY-MM-DD pour la progression
 * @param {object} [program] — programme (défaut : programme actif)
 * @param {boolean} [embedded] — style intégré (calendrier) sans carte englobante
 * @param {string} [title] — titre de section personnalisé
 * @param {string} [hint] — sous-texte optionnel
 */
export const CircuitsDaySection = ({
  dayName,
  dateStr,
  program: programProp,
  embedded = false,
  title,
  hint
}) => {
  const {
    data,
    activeProgram,
    incrementCircuitRound,
    decrementCircuitRound
  } = useWorkout();

  const program = programProp ?? activeProgram;
  const circuitDefinitions = data?.circuitDefinitions || {};
  const circuitProgressForDay = data?.circuitProgress?.[dateStr] || {};

  const visibleCircuits = useMemo(() => {
    const ids = new Set();
    getCircuitIdsForDay(program, dayName).forEach((id) => ids.add(id));
    Object.keys(circuitProgressForDay).forEach((id) => ids.add(id));
    const out = [];
    ids.forEach((id) => {
      const def = circuitDefinitions[id];
      if (def) out.push(def);
    });
    return out.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'));
  }, [program, dayName, circuitDefinitions, circuitProgressForDay]);

  if (visibleCircuits.length === 0) return null;

  const sectionTitle = title || `Circuits du jour (${visibleCircuits.length})`;

  const cards = (
    <div className="space-y-3">
      {visibleCircuits.map((c) => {
        const rounds = Math.max(
          0,
          Math.round(Number(circuitProgressForDay[c.id]?.roundsCompleted) || 0)
        );
        return (
          <CircuitCard
            key={c.id}
            circuit={c}
            rounds={rounds}
            onIncrement={() => incrementCircuitRound(dateStr, c.id)}
            onDecrement={() => decrementCircuitRound(dateStr, c.id)}
          />
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-3 border-t border-sky-500/35 pt-4">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-sky-200">
            <Repeat className="h-4 w-4 text-sky-300" />
            {sectionTitle}
          </h4>
          {hint ? <p className="mt-1 text-xs text-slate-400 leading-relaxed">{hint}</p> : null}
        </div>
        {cards}
      </div>
    );
  }

  return (
    <Card variant="sport">
      <Card.Header variant="sport">
        <Card.Title tone="sport" className="flex items-center">
          <Repeat className="mr-2 text-sky-300" size={20} />
          {sectionTitle}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {hint ? <p className="mb-3 text-xs text-teal-200/70 leading-relaxed">{hint}</p> : null}
        {cards}
      </Card.Content>
    </Card>
  );
};

const CircuitsTodaySection = (props) => <CircuitsDaySection {...props} />;

export default CircuitsTodaySection;
