import React from 'react';
import { READING_SESSION_CRITERIA, averageCriteriaScore } from '../../utils/bookReadingRatings';

/** Affichage compact des critères + note texte pour une session ou un bloc similaire */
export default function BookSessionFeedbackReadonly({ session, title = 'Feedback session' }) {
  if (!session) return null;
  const cr = session.criteriaRatings;
  const hasCrit = cr && typeof cr === 'object';
  const note = (session.note || '').trim();
  const hasScore = session.sessionScore != null && Number.isFinite(Number(session.sessionScore));
  if (!hasCrit && !note && !hasScore) return null;

  const avg =
    session.sessionScore != null
      ? Number(session.sessionScore)
      : hasCrit
        ? averageCriteriaScore(cr)
        : null;

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 py-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-amber-200/90 uppercase tracking-wide">
          {title}
        </span>
        {avg != null && Number.isFinite(avg) && (
          <span className="text-xs font-mono text-amber-100">{avg.toFixed(1)}/10</span>
        )}
      </div>
      {hasCrit && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-400">
          {READING_SESSION_CRITERIA.map(({ key, label }) => (
            <li key={key} className="flex justify-between gap-2 border-b border-slate-800/60 pb-0.5">
              <span>{label}</span>
              <span className="font-mono text-slate-200">{Number(cr[key]) || '—'}/10</span>
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="text-xs text-slate-300 whitespace-pre-wrap">{note}</p> : null}
    </div>
  );
}
