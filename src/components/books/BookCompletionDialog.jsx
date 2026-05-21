import React, { useEffect, useMemo, useState } from 'react';
import { Star, BookOpen } from 'lucide-react';
import ReadingSessionCriteriaSliders from './ReadingSessionCriteriaSliders';
import {
  defaultCriteriaRatings,
  normalizeCriteriaRatings,
  averageCriteriaScore,
  aggregateCriteriaMeansForBook,
  READING_SESSION_CRITERIA,
} from '../../utils/bookReadingRatings';
import {
  computeReadingStatsForBook,
  formatRankLabel,
  getCompletedBookRank,
  resolveFinalBookScore,
} from '../../utils/bookCompletionUtils';

export default function BookCompletionDialog({
  pending,
  allBooks = [],
  book,
  onConfirm,
  onDismiss,
}) {
  const [completionCriteria, setCompletionCriteria] = useState(() => defaultCriteriaRatings());
  const [impression, setImpression] = useState('');

  useEffect(() => {
    if (!pending) return;
    const agg = book ? aggregateCriteriaMeansForBook(book.readingSessions) : null;
    if (agg?.means) {
      setCompletionCriteria(normalizeCriteriaRatings(agg.means));
    } else {
      setCompletionCriteria(defaultCriteriaRatings());
    }
    setImpression('');
  }, [pending, book]);

  const stats = useMemo(
    () => (book ? computeReadingStatsForBook(book) : null),
    [book]
  );

  const sessionAgg = useMemo(
    () => (book ? aggregateCriteriaMeansForBook(book.readingSessions) : null),
    [book]
  );

  const sessionScore = sessionAgg?.overall ?? pending?.suggestedScore ?? 0;

  const completionScore = useMemo(
    () => averageCriteriaScore(completionCriteria),
    [completionCriteria]
  );

  const finalScore = useMemo(() => {
    if (!book) return sessionScore;
    return resolveFinalBookScore(book, completionCriteria);
  }, [book, completionCriteria, sessionScore]);

  const rankPreview = useMemo(() => {
    if (!book?.id || !Array.isArray(allBooks)) return null;
    const hypothetical = allBooks.map((b) =>
      b.id === book.id
        ? {
            ...b,
            status: 'completed',
            personalScore: finalScore,
            readingSessions: book.readingSessions,
          }
        : b
    );
    return formatRankLabel(getCompletedBookRank(hypothetical, book.id));
  }, [allBooks, book, finalScore]);

  if (!pending || !book) return null;

  const handleCriteriaChange = (key, value) => {
    setCompletionCriteria((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[14vh] pb-10 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-completion-title"
        className="w-full max-w-2xl max-h-[min(82vh,calc(100vh-14vh-2.5rem))] overflow-y-auto rounded-2xl border border-amber-500/35 bg-slate-950 shadow-2xl p-6 space-y-5 mb-6"
      >
        <div className="flex items-start gap-3">
          <BookOpen className="w-7 h-7 text-amber-300 shrink-0" />
          <div>
            <h2 id="book-completion-title" className="text-xl font-bold text-white">
              Vous avez terminé ce livre
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              <span className="font-semibold text-white">{pending.bookTitle}</span> — pages enregistrées{' '}
              <span className="font-mono text-amber-200">
                {pending.cumPages} / {pending.totalPagesBook}
              </span>
              . Prenez le temps de noter vos impressions : la note affichée du livre reste calculée à{' '}
              <strong className="text-amber-100">100 %</strong> à partir de vos sessions de lecture.
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-lg border border-slate-600/50 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] text-slate-400 uppercase">Sessions</p>
              <p className="text-lg font-semibold text-white">{stats.sessionCount}</p>
            </div>
            <div className="rounded-lg border border-slate-600/50 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] text-slate-400 uppercase">Pages lues</p>
              <p className="text-lg font-semibold text-white">{stats.totalPages}</p>
            </div>
            <div className="rounded-lg border border-slate-600/50 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] text-slate-400 uppercase">Minutes</p>
              <p className="text-lg font-semibold text-white">{stats.totalMinutes}</p>
            </div>
            <div className="rounded-lg border border-slate-600/50 bg-slate-900/60 px-2 py-2">
              <p className="text-[10px] text-slate-400 uppercase">Progression</p>
              <p className="text-lg font-semibold text-white">
                {stats.progressPercent != null ? `${stats.progressPercent}%` : '—'}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-sky-500/30 bg-sky-950/25 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-sky-200/90 flex items-center gap-1">
            <Star className="w-4 h-4" />
            Note issue des sessions (utilisée pour le livre)
          </p>
          <p className="text-2xl font-mono text-sky-100">
            {Number(sessionScore).toFixed(1)}
            <span className="text-sm text-sky-300/80"> /10</span>
            {sessionAgg && (
              <span className="block text-xs text-sky-200/70 mt-1 font-sans">
                Moyenne de {sessionAgg.sessionCount} session
                {sessionAgg.sessionCount > 1 ? 's' : ''} sur les 5 critères.
              </span>
            )}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-amber-100 mb-2">
            Bilan de fin (critères sur 10) — archivé sur la fiche du livre
          </p>
          <ReadingSessionCriteriaSliders
            criteriaRatings={completionCriteria}
            onChange={handleCriteriaChange}
          />
          <p className="text-xs text-slate-400 mt-2">
            Moyenne du bilan :{' '}
            <span className="font-mono text-amber-200">{completionScore.toFixed(1)}/10</span>
            {READING_SESSION_CRITERIA.map((c) => c.label).join(', ')}.
          </p>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1" htmlFor="completion-impression">
            Impressions libres (optionnel)
          </label>
          <textarea
            id="completion-impression"
            rows={4}
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder="Ce qui t’a marqué, ce que tu retiens, ce que tu recommanderais…"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400/60"
          />
        </div>

        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-100">Note finale enregistrée pour le livre</p>
          <p className="text-3xl font-mono text-emerald-50 mt-1">
            {Number(finalScore).toFixed(1)}
            <span className="text-base text-emerald-200/80"> /10</span>
          </p>
          {rankPreview?.line && (
            <p className="text-sm text-emerald-200/85 mt-2">{rankPreview.line}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-slate-700/50">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                completionCriteria: normalizeCriteriaRatings(completionCriteria),
                impression: impression.trim(),
                finalScore,
                stats,
              })
            }
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400"
          >
            Enregistrer terminé + bilan
          </button>
        </div>
      </div>
    </div>
  );
}
