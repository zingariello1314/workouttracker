/**
 * Ajouter une session de lecture depuis la sidebar — mêmes validations que BooksTab (useBooksSessions).
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { useBooksStorage } from '../../../hooks/useBooksStorage';
import { useBooksSessions } from '../../tabs/BooksTab/hooks/useBooksSessions';
import { Input, TextArea } from '../../ui/Input';
import { useTranslation } from '../../../utils/translations';
import { openBooksWithNavParams } from '../../../utils/booksSidebarNav';

const SidebarReadingSessionModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const t = useTranslation();
  const { books, setBooks, isLoading } = useBooksStorage();
  const [bookId, setBookId] = useState('');

  const selectedBook = useMemo(() => {
    if (!bookId) return null;
    return books.find((b) => String(b.id) === String(bookId)) || null;
  }, [books, bookId]);

  const { sessionForm, handleSessionChange, handleAddSession, resetSessionForm } = useBooksSessions(
    books,
    setBooks,
    selectedBook
  );

  useEffect(() => {
    if (!books.length) return;
    setBookId((prev) => {
      if (prev && books.some((b) => String(b.id) === String(prev))) return prev;
      const inProgress = books.find((b) => b.status === 'in-progress');
      return String((inProgress || books[0]).id);
    });
  }, [books]);

  useEffect(() => {
    if (!isExpanded) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!sessionForm.date) {
      handleSessionChange('date', today);
    }
  }, [isExpanded, sessionForm.date, handleSessionChange]);

  const onSubmit = (e) => {
    handleAddSession(e);
  };

  const openFullSessions = () => {
    openBooksWithNavParams(setActiveTab, {
      tab: 'statistics',
      statsNavigation: { scrollToId: 'books-stats-all-sessions' }
    });
  };

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section session de lecture"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">
            ✏️
          </span>
          Lecture · session
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-2 px-1 py-2 min-w-0">
          <div className="rounded-xl border border-emerald-500/25 bg-slate-950/80 p-2.5 space-y-2 shadow-inner shadow-emerald-950/20">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-[11px] font-semibold text-emerald-100/95">
                {t('books.sessions.addTitle', 'Ajouter une session de lecture')}
              </h3>
              <button
                type="button"
                onClick={openFullSessions}
                className="h-6 shrink-0 rounded border border-emerald-400/40 px-1.5 text-[9px] font-medium text-emerald-200 hover:bg-emerald-500/15"
              >
                Voir sessions
              </button>
            </div>

            {isLoading ? (
              <p className="text-[10px] text-slate-400">Chargement…</p>
            ) : !books.length ? (
              <p className="text-[10px] text-slate-500">Aucun livre. Ajoute-en un dans l’onglet Livres.</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-2">
                <div>
                  <label className="mb-0.5 block text-[9px] font-medium text-slate-400">Livre</label>
                  <select
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    className="w-full rounded-lg border border-emerald-500/35 bg-slate-900/90 px-2 py-1.5 text-[10px] text-white focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.title || 'Sans titre'}
                        {b.author ? ` — ${b.author}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    id="sb-session-date"
                    type="date"
                    size="sm"
                    max={new Date().toISOString().slice(0, 10)}
                    label={t('books.sessions.date', 'Date')}
                    value={sessionForm.date}
                    onChange={(e) => handleSessionChange('date', e.target.value)}
                    containerClassName="[&_label]:text-[9px] [&_label]:mb-1"
                    className="!text-[10px] !py-1 !px-2 border-emerald-500/40 bg-slate-900/80"
                  />
                  <Input
                    id="sb-session-duration"
                    type="number"
                    size="sm"
                    min={0}
                    label={t('books.sessions.duration', 'Durée (minutes)')}
                    value={sessionForm.durationMinutes}
                    onChange={(e) => handleSessionChange('durationMinutes', e.target.value)}
                    containerClassName="[&_label]:text-[9px] [&_label]:mb-1"
                    className="!text-[10px] !py-1 !px-2 border-emerald-500/40 bg-slate-900/80"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    id="sb-session-time"
                    type="time"
                    size="sm"
                    label={t('books.sessions.time', 'Heure (optionnel)')}
                    value={sessionForm.startTime}
                    onChange={(e) => handleSessionChange('startTime', e.target.value)}
                    containerClassName="[&_label]:text-[9px] [&_label]:mb-1"
                    className="!text-[10px] !py-1 !px-2 border-emerald-500/40 bg-slate-900/80"
                  />
                  <Input
                    id="sb-session-pages"
                    type="number"
                    size="sm"
                    min={0}
                    label={t('books.sessions.pages', 'Pages lues')}
                    value={sessionForm.pagesRead}
                    onChange={(e) => handleSessionChange('pagesRead', e.target.value)}
                    containerClassName="[&_label]:text-[9px] [&_label]:mb-1"
                    className="!text-[10px] !py-1 !px-2 border-emerald-500/40 bg-slate-900/80"
                  />
                </div>
                <TextArea
                  id="sb-session-note"
                  rows={2}
                  label={t('books.sessions.note', 'Note (optionnel)')}
                  value={sessionForm.note}
                  onChange={(e) => handleSessionChange('note', e.target.value)}
                  className="!text-[10px] border-sky-500/40 bg-slate-900/80 min-h-[52px]"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="submit"
                    className="flex-1 min-w-[8rem] rounded-lg border border-sky-500/45 bg-gradient-to-r from-sky-950/90 to-slate-900/90 px-2 py-1.5 text-[10px] font-semibold text-sky-50 shadow hover:from-sky-900/95"
                  >
                    {t('books.sessions.addButton', 'Ajouter la session')}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetSessionForm()}
                    className="rounded-lg border border-slate-600/70 px-2 py-1.5 text-[9px] text-slate-300 hover:bg-slate-800/80"
                  >
                    Réinitialiser
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarReadingSessionModule.displayName = 'SidebarReadingSessionModule';

export default SidebarReadingSessionModule;
