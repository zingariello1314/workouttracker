import React, { useMemo, useState } from 'react';
import { Star, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import {
  READING_SESSION_CRITERIA,
  aggregateCriteriaMeansForBook,
  getBookDisplayRating,
} from '../../utils/bookReadingRatings';

function StarsRow({ value }) {
  const n = Math.min(10, Math.max(0, Number(value) || 0));
  const full = Math.floor(n);
  const half = n - full >= 0.5;
  const items = [];
  for (let i = 0; i < 10; i += 1) {
    if (i < full) {
      items.push(
        <Star key={i} className="w-3.5 h-3.5 text-sky-300 fill-sky-300 shrink-0" />
      );
    } else if (i === full && half) {
      items.push(
        <Star key={i} className="w-3.5 h-3.5 text-sky-300 fill-sky-300/50 shrink-0" />
      );
    } else {
      items.push(
        <Star key={i} className="w-3.5 h-3.5 text-slate-600 fill-slate-700/60 shrink-0" />
      );
    }
  }
  return <div className="flex flex-wrap gap-0.5">{items}</div>;
}

export default function FinishedBooksRatingsShowcase({ books = [] }) {
  const [openId, setOpenId] = useState(null);

  const finished = useMemo(() => {
    return (books || [])
      .filter((b) => b?.status === 'completed')
      .map((b) => {
        const disp = getBookDisplayRating(b);
        const agg = aggregateCriteriaMeansForBook(b.readingSessions);
        return { book: b, disp, agg };
      })
      .sort((a, b) => {
        const da = a.book.finishedAt || '';
        const db = b.book.finishedAt || '';
        return db.localeCompare(da);
      });
  }, [books]);

  if (finished.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-[#3A86FF] bg-black p-6 text-center text-[#93c5fd]/85 text-sm">
        Aucun livre terminé pour l’instant. Quand un livre est marqué « Terminé » (avec ta note personnelle ou la
        synthèse des sessions), il apparaîtra ici avec le détail des critères.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#3A86FF] bg-black p-4 md:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Star className="w-6 h-6 text-[#93c5fd] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-bold text-[#bfdbfe]">Livres terminés & notes</h3>
          <p className="text-xs text-[#93c5fd]/80 mt-1">
            Note affichée : ta note personnelle si tu l’as saisie, sinon la moyenne des retours de lecture par
            session. Déplie un livre pour voir la moyenne de chaque critère sur toutes les sessions.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {finished.map(({ book, disp, agg }) => {
          const expanded = openId === book.id;
          const finishedLabel = book.finishedAt
            ? new Date(`${book.finishedAt}T12:00:00`).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—';
          return (
            <li
              key={book.id}
              className="rounded-xl border border-[#3A86FF]/40 bg-black/80 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-[#3A86FF]/10 transition-colors"
                onClick={() => setOpenId(expanded ? null : book.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#bfdbfe] truncate">{book.title || 'Sans titre'}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-[#93c5fd]/75">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {finishedLabel}
                    </span>
                    {book.genre ? <span>· {book.genre}</span> : null}
                    <span className="text-slate-500">
                      · note {disp.source === 'personal' ? 'perso' : 'synthèse sessions'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-sm font-mono text-sky-200">{disp.value.toFixed(1)}/10</span>
                  <StarsRow value={disp.value} />
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>
              {expanded && agg && (
                <div className="px-3 pb-3 pt-0 border-t border-[#3A86FF]/25 space-y-2">
                  <p className="text-[11px] text-[#93c5fd]/65 pt-2">
                    Moyennes sur {agg.sessionCount} session{agg.sessionCount > 1 ? 's' : ''} (échelle 1–10 par
                    critère) — même barème que lors de l’enregistrement d’une session.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {READING_SESSION_CRITERIA.map(({ key, label }) => (
                      <div
                        key={key}
                        className="rounded-lg bg-black/60 border border-[#3A86FF]/30 px-2 py-2 text-xs"
                      >
                        <div className="flex justify-between text-[#93c5fd]/90">
                          <span>{label}</span>
                          <span className="font-mono text-sky-200/90">{agg.means[key]}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#93c5fd]/80">
                    Moyenne globale des critères (sessions) :{' '}
                    <span className="font-mono text-sky-200">{agg.overall.toFixed(1)}</span>/10
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
