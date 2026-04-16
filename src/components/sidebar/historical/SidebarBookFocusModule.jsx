/**
 * Livre focus — même logique synthétique que le bloc dashboard Livres (version compacte).
 */

import { memo, useMemo, useState } from 'react';
import { Star, Target, Timer } from 'lucide-react';
import { useBooksStorage } from '../../../hooks/useBooksStorage';
import { useBooksCovers } from '../../tabs/BooksTab/hooks/useBooksCovers';
import { useBooksProgress } from '../../tabs/BooksTab/hooks/useBooksProgress';
import {
  getAverageDurationPerSession,
  getAveragePagesPerSession,
  getEstimatedRemainingTimeMinutes,
  getReadingProgressPercent,
  getTotalPagesRead,
  getTotalReadingTime
} from '../../tabs/BooksTab/utils';
import { openBooksWithNavParams } from '../../../utils/booksSidebarNav';

const SidebarBookFocusModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const { books, isLoading } = useBooksStorage();
  const [selectedBookId, setSelectedBookId] = useState(null);
  const { coverUrls } = useBooksCovers(books, true);
  const { booksWithProgress } = useBooksProgress(books, books);

  const latestSessionBookId = useMemo(() => {
    let latestBookId = null;
    let latestTs = -1;
    booksWithProgress.forEach((book) => {
      (book.readingSessions || []).forEach((session) => {
        if (!session?.date) return;
        const datePart = String(session.date);
        const timePart = session.startTime ? String(session.startTime) : '00:00';
        const ts = new Date(`${datePart}T${timePart}:00`).getTime();
        if (!Number.isNaN(ts) && ts > latestTs) {
          latestTs = ts;
          latestBookId = book.id;
        }
      });
    });
    return latestBookId;
  }, [booksWithProgress]);

  const selectedBook = useMemo(() => {
    if (selectedBookId) {
      return booksWithProgress.find((b) => b.id === selectedBookId) || null;
    }
    if (latestSessionBookId) {
      return booksWithProgress.find((b) => b.id === latestSessionBookId) || null;
    }
    return booksWithProgress[0] || null;
  }, [booksWithProgress, selectedBookId, latestSessionBookId]);

  const stats30 = useMemo(() => {
    const completedWithScore = books
      .filter((b) => b.status === 'completed' && Number.isFinite(Number(b.personalScore)))
      .sort((a, b) => Number(b.personalScore) - Number(a.personalScore));
    const bestRated = completedWithScore[0] || null;
    return { bestRated };
  }, [books]);

  const openFiche = () => {
    if (!selectedBook?.id) return;
    openBooksWithNavParams(setActiveTab, { bookId: selectedBook.id });
  };

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section livre focus"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">
            📖
          </span>
          Lecture · livre focus
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-2 px-1 py-2 min-w-0">
          <div className="rounded-xl border border-violet-500/25 bg-slate-950/75 p-2 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-violet-100">Livre focus</span>
              {selectedBook ? (
                <button
                  type="button"
                  onClick={openFiche}
                  className="h-6 shrink-0 rounded border border-violet-400/40 px-2 text-[9px] font-medium text-violet-100 hover:bg-violet-500/20"
                >
                  Voir fiche
                </button>
              ) : null}
            </div>

            {books.length > 1 ? (
              <select
                value={selectedBookId || ''}
                onChange={(e) => setSelectedBookId(e.target.value || null)}
                className="w-full rounded-lg border border-slate-600/60 bg-slate-900/80 px-2 py-1 text-[10px] text-white"
              >
                <option value="">Dernier lu / défaut</option>
                {booksWithProgress.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.title || 'Sans titre'}
                  </option>
                ))}
              </select>
            ) : null}

            {isLoading ? (
              <p className="text-[10px] text-slate-400">Chargement…</p>
            ) : !selectedBook ? (
              <p className="text-[10px] text-slate-500">Aucun livre.</p>
            ) : (
              <>
                <div className="flex gap-2 rounded-lg border border-slate-700/60 bg-slate-900/50 p-2">
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded border border-slate-700/70 bg-slate-900">
                    {coverUrls[selectedBook.id] ? (
                      <img
                        src={coverUrls[selectedBook.id]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[8px] text-slate-500">—</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[10px] font-semibold text-white">{selectedBook.title}</div>
                    <div className="line-clamp-1 text-[9px] text-slate-400">{selectedBook.author || '—'}</div>
                    <div className="mt-0.5 line-clamp-2 text-[8px] text-slate-500">
                      {selectedBook.shortSummary || selectedBook.notes || '—'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-1.5">
                    <div className="flex items-center gap-0.5 text-[8px] text-slate-400">
                      <Target className="h-3 w-3" /> Progression
                    </div>
                    <div className="text-[11px] font-bold text-white">{getReadingProgressPercent(selectedBook) ?? 0}%</div>
                  </div>
                  <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-1.5">
                    <div className="flex items-center gap-0.5 text-[8px] text-slate-400">
                      <Timer className="h-3 w-3" /> Temps lu
                    </div>
                    <div className="text-[11px] font-bold text-white">{getTotalReadingTime(selectedBook)} min</div>
                  </div>
                  <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-1.5">
                    <div className="text-[8px] text-slate-400">Pages lues</div>
                    <div className="text-[11px] font-bold text-white">{getTotalPagesRead(selectedBook)}</div>
                  </div>
                  <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-1.5">
                    <div className="text-[8px] text-slate-400">Temps restant</div>
                    <div className="text-[11px] font-bold text-white">
                      {getEstimatedRemainingTimeMinutes(selectedBook) ?? '—'} min
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-1.5 text-[9px] text-slate-200">
                  <span className="text-slate-400">Moyennes livre · </span>
                  {getAveragePagesPerSession(selectedBook)} p./sess. · {getAverageDurationPerSession(selectedBook)} min/sess.
                </div>
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-1.5">
                  <div className="flex items-center gap-0.5 text-[8px] text-slate-400">
                    <Star className="h-3 w-3 text-amber-300" /> Meilleure note terminée
                  </div>
                  <div className="line-clamp-2 text-[9px] font-semibold text-white">
                    {stats30.bestRated
                      ? `${stats30.bestRated.title} (${stats30.bestRated.personalScore}/5)`
                      : '—'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarBookFocusModule.displayName = 'SidebarBookFocusModule';

export default SidebarBookFocusModule;
