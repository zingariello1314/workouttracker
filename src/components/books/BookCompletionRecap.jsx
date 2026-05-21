import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Star } from 'lucide-react';
import ReadingSessionCriteriaSliders from './ReadingSessionCriteriaSliders';
import {
  READING_SESSION_CRITERIA,
  aggregateCriteriaMeansForBook,
  getBookDisplayRating,
  normalizeCriteriaRatings,
  defaultCriteriaRatings,
} from '../../utils/bookReadingRatings';
import {
  computeReadingStatsForBook,
  formatRankLabel,
  getCompletedBookRank,
} from '../../utils/bookCompletionUtils';

/**
 * Récapitulatif de fin de livre (au-dessus des résumés), modifiable.
 */
export default function BookCompletionRecap({
  book,
  allBooks = [],
  onSaveReview,
  onOpenCompletionForm,
}) {
  const [editing, setEditing] = useState(false);
  const [criteria, setCriteria] = useState(defaultCriteriaRatings());
  const [impression, setImpression] = useState('');

  useEffect(() => {
    const cr = book?.completionReview?.criteriaRatings;
    setCriteria(cr ? normalizeCriteriaRatings(cr) : defaultCriteriaRatings());
    setImpression(book?.completionReview?.impression || '');
    setEditing(false);
  }, [book?.id, book?.completionReview]);

  const stats = useMemo(() => computeReadingStatsForBook(book), [book]);
  const sessionAgg = useMemo(
    () => aggregateCriteriaMeansForBook(book?.readingSessions),
    [book?.readingSessions]
  );
  const disp = useMemo(() => getBookDisplayRating(book), [book]);
  const rank = useMemo(
    () => formatRankLabel(getCompletedBookRank(allBooks, book?.id)),
    [allBooks, book?.id]
  );

  const handleSave = useCallback(() => {
    onSaveReview?.({
      criteriaRatings: normalizeCriteriaRatings(criteria),
      impression: impression.trim(),
    });
    setEditing(false);
  }, [criteria, impression, onSaveReview]);

  if (!book || book.status !== 'completed') return null;

  const review = book.completionReview;
  const hasCompletionForm = Boolean(
    review?.criteriaRatings || (review?.impression && review.impression.trim())
  );

  return (
    <div className="mt-8 mb-6 rounded-xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-black px-4 py-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-300 fill-amber-400/20" />
          <h3 className="text-base font-bold text-amber-50">Bilan de lecture</h3>
        </div>
        {!editing ? (
          <div className="flex flex-wrap gap-2">
            {!hasCompletionForm && typeof onOpenCompletionForm === 'function' && (
              <button
                type="button"
                onClick={() => onOpenCompletionForm(book)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400"
              >
                Remplir le bilan de fin
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-amber-600/50 text-amber-100 hover:bg-amber-500/15"
            >
              <Pencil className="w-3.5 h-3.5" />
              {hasCompletionForm ? 'Modifier le bilan' : 'Bilan rapide (fiche)'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-semibold"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setCriteria(
                  book.completionReview?.criteriaRatings
                    ? normalizeCriteriaRatings(book.completionReview.criteriaRatings)
                    : defaultCriteriaRatings()
                );
                setImpression(book.completionReview?.impression || '');
                setEditing(false);
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-300"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-sky-500/25 bg-sky-950/20 px-3 py-3">
          <p className="text-[11px] text-sky-300/80 uppercase tracking-wide">Note du livre (sessions)</p>
          <p className="text-2xl font-mono text-sky-100 mt-1">
            {disp.value > 0 ? disp.value.toFixed(1) : '—'}
            <span className="text-sm text-sky-300/70"> /10</span>
          </p>
          <p className="text-[11px] text-sky-200/60 mt-1">
            Calculée à 100 % depuis tes {sessionAgg?.sessionCount ?? 0} session
            {(sessionAgg?.sessionCount ?? 0) > 1 ? 's' : ''} notées.
          </p>
        </div>
        {rank?.line && (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-3">
            <p className="text-[11px] text-emerald-300/80 uppercase tracking-wide">Classement</p>
            <p className="text-sm text-emerald-100 mt-2 leading-snug">{rank.line}</p>
          </div>
        )}
      </div>

      {stats && (
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <span>
            <strong className="text-slate-200">{stats.sessionCount}</strong> sessions
          </span>
          <span>
            <strong className="text-slate-200">{stats.totalPages}</strong> pages lues
          </span>
          <span>
            <strong className="text-slate-200">{stats.totalMinutes}</strong> min
          </span>
          {stats.pagesPerMin != null && (
            <span>
              ~<strong className="text-slate-200">{stats.pagesPerMin}</strong> p./min
            </span>
          )}
        </div>
      )}

      {editing ? (
        <>
          <ReadingSessionCriteriaSliders criteriaRatings={criteria} onChange={(k, v) => setCriteria((p) => ({ ...p, [k]: v }))} />
          <textarea
            rows={3}
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder="Impressions de fin de lecture…"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 text-sm text-slate-100 px-3 py-2"
          />
        </>
      ) : (
        <>
          {review?.criteriaRatings && (
            <ul className="grid sm:grid-cols-2 gap-2 text-xs">
              {READING_SESSION_CRITERIA.map(({ key, label }) => (
                <li key={key} className="flex justify-between text-slate-300 border-b border-slate-700/40 pb-1">
                  <span>{label}</span>
                  <span className="font-mono text-amber-100">
                    {Number(review.criteriaRatings[key] ?? '—')}/10
                  </span>
                </li>
              ))}
            </ul>
          )}
          {review?.impression && (
            <p className="text-sm text-slate-300 whitespace-pre-line border-l-2 border-amber-500/40 pl-3">
              {review.impression}
            </p>
          )}
          {!review?.criteriaRatings && !review?.impression && (
            <p className="text-xs text-slate-500 italic">
              Aucun bilan de fin enregistré — utilise « Remplir le bilan de fin » (formulaire
              complet) ou « Bilan rapide » pour noter directement sur la fiche.
            </p>
          )}
        </>
      )}
    </div>
  );
}
