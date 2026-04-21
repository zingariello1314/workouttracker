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
    <div className="rounded-lg border border-[#3A86FF]/35 bg-black/50 px-3 py-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[#93c5fd]/90 uppercase tracking-wide">
          {title}
        </span>
        {avg != null && Number.isFinite(avg) && (
          <span className="text-xs font-mono text-[#bfdbfe]">{avg.toFixed(1)}/10</span>
        )}
      </div>
      {hasCrit && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#93c5fd]/75">
          {READING_SESSION_CRITERIA.map(({ key, label }) => (
            <li key={key} className="flex justify-between gap-2 border-b border-[#3A86FF]/20 pb-0.5">
              <span>{label}</span>
              <span className="font-mono text-[#bfdbfe]">{Number(cr[key]) || '—'}/10</span>
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="text-xs text-[#93c5fd]/88 whitespace-pre-wrap">{note}</p> : null}
    </div>
  );
}
