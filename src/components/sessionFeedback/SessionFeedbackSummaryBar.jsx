import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import {
  buildSessionFeedbackSummary,
  formatSessionDurationLabel,
  formatSessionFeedbackHeadline
} from '../../utils/sessionFeedbackSessionSummary';

function formatYmdFr(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Bandeau compact — faits sportifs uniquement, jamais de zéros inventés.
 */
export default function SessionFeedbackSummaryBar({ sessionData }) {
  const [expanded, setExpanded] = useState(false);
  const summary = buildSessionFeedbackSummary(sessionData);
  const headline = formatSessionFeedbackHeadline(summary);

  if (!summary.hasSession) {
    return (
      <div className="mb-4 rounded-xl border border-dashed border-[#0F4C5C]/50 bg-black/30 px-4 py-3">
        <p className="text-sm text-slate-400">
          Aucune séance associée — tu peux quand même renseigner ton ressenti.
        </p>
      </div>
    );
  }

  const durationLabel =
    summary.durationKind === 'measured'
      ? formatSessionDurationLabel(summary.durationMinutes)
      : null;

  const metaParts = [];
  if (summary.exerciseCount != null) {
    metaParts.push(
      `${summary.exerciseCount} exercice${summary.exerciseCount > 1 ? 's' : ''}`
    );
  }
  if (summary.totalReps != null) {
    metaParts.push(`${summary.totalReps} répétition${summary.totalReps > 1 ? 's' : ''}`);
  }
  if (durationLabel) metaParts.push(durationLabel);

  const exercises = Array.isArray(sessionData?.exercises) ? sessionData.exercises : [];
  const sport = sessionData?.sportContext;

  return (
    <div className="mb-4 rounded-xl border border-[#0F4C5C]/45 bg-gradient-to-br from-[#0F4C5C]/15 to-black/40 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-teal-400/90">
            <Activity size={14} />
            Contexte
          </div>
          <p className="text-sm font-semibold text-white leading-snug">
            {headline || `Séance · ${formatYmdFr(summary.sessionDate) || '—'}`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {metaParts.length > 0 ? metaParts.join(' · ') : 'Volume enregistré non résolu'}
            {summary.isPartialVsPlan && summary.plannedExerciseCount != null
              ? ` · ${summary.exerciseCount ?? 0}/${summary.plannedExerciseCount} du programme`
              : ''}
          </p>
        </div>
        {exercises.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-expanded={expanded}
            aria-label={expanded ? 'Masquer les exercices' : 'Voir les exercices'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {expanded && exercises.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-[#0F4C5C]/35 pt-3">
          {exercises.map((ex) => (
            <li
              key={String(ex.id || ex.name)}
              className="flex items-center justify-between gap-2 text-xs text-slate-300"
            >
              <span className="truncate">{ex.name || ex.id}</span>
              <span className="tabular-nums text-slate-500">
                {ex.reps > 0 ? `${ex.reps} reps` : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sport?.reliability?.volume === 'unknown' && summary.sessionDate && (
        <p className="mt-2 text-[11px] text-slate-500">
          Momentum n’a pas pu rattacher le volume à cette ouverture — les questions restent disponibles.
        </p>
      )}
    </div>
  );
}
