import React, { useMemo, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Library,
  Trophy,
  Heart,
  Timer,
  Bookmark,
  BookMarked,
} from 'lucide-react';
import CalendarHeatmap from '../CalendarHeatmap';
import {
  buildBooksSessionsByDate,
  computeBooksLibraryCalendarStats,
} from '../../utils/booksCalendarMetrics';
import { useTranslation } from '../../utils/translations';
import { useReadingDayFeedbacks } from '../../hooks/useReadingDayFeedbacks';

const BooksCalendarView = ({ books = [], coverUrls = {}, setBooks }) => {
  const t = useTranslation();
  const { dayFeedbacks, setDayFeedback } = useReadingDayFeedbacks();

  const sessionsByDate = useMemo(() => buildBooksSessionsByDate(books), [books]);

  const libStats = useMemo(() => computeBooksLibraryCalendarStats(books), [books]);

  const stats = useMemo(() => {
    let sessions = 0;
    let pages = 0;
    let minutes = 0;
    sessionsByDate.forEach((day) => {
      sessions += day.sessions || 0;
      pages += day.pages || 0;
      minutes += day.minutes || 0;
    });
    const activeDays = [...sessionsByDate.values()].filter((d) => d.sessions > 0).length;
    return { sessions, pages, minutes, activeDays };
  }, [sessionsByDate]);

  const onUpdateBookSession = useCallback(
    (bookId, sessionId, data) => {
      if (!setBooks) return;
      setBooks((prev) =>
        prev.map((book) => {
          if (book.id !== bookId) return book;
          return {
            ...book,
            readingSessions: (book.readingSessions || []).map((s) =>
              s.id === sessionId ? { ...s, ...data } : s
            ),
          };
        })
      );
    },
    [setBooks]
  );

  const booksCalendarContext = useMemo(
    () => ({
      sessionsByDate,
      books,
      coverUrls,
      dayFeedbacks,
      setDayFeedback,
      onUpdateBookSession,
    }),
    [sessionsByDate, books, coverUrls, dayFeedbacks, setDayFeedback, onUpdateBookSession]
  );

  const fmtBook = (b) => (b?.title ? b.title : '—');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-600 bg-black shadow-lg overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-700/80">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Library className="text-purple-400" size={24} />
            {t('books.calendar.summaryTitle', 'Lecture — vue calendrier')}
          </h3>
        </div>
        <div className="px-4 md:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/75 rounded-lg p-4 text-center border border-slate-700/80">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-blue-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('books.calendar.daysWithSessions', 'Jours avec session')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.activeDays}</div>
            </div>
            <div className="bg-slate-900/75 rounded-lg p-4 text-center border border-slate-700/80">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="text-emerald-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('books.calendar.totalSessions', 'Sessions')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.sessions}</div>
            </div>
            <div className="bg-slate-900/75 rounded-lg p-4 text-center border border-slate-700/80">
              <div className="flex items-center justify-center mb-2">
                <FileText className="text-amber-400 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('books.calendar.pagesRead', 'Pages lues')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.pages}</div>
            </div>
            <div className="bg-slate-900/75 rounded-lg p-4 text-center border border-slate-700/80">
              <div className="flex items-center justify-center mb-2">
                <Clock className="text-violet-300 mr-2" size={20} />
                <span className="text-slate-300 text-sm">
                  {t('books.calendar.timeReading', 'Temps lecture')}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.minutes} min</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <Trophy className="text-amber-400 shrink-0" size={16} />
                Livres terminés
              </div>
              <div className="text-xl font-bold text-white">{libStats.finishedCount}</div>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <FileText className="text-cyan-400 shrink-0" size={16} />
                Vitesse (pages/h)
              </div>
              <div className="text-xl font-bold text-white">{libStats.pagesPerHour}</div>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <Bookmark className="text-sky-400 shrink-0" size={16} />
                En cours (≥1 session)
              </div>
              <div className="text-xl font-bold text-white">{libStats.inProgressWithSession}</div>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <BookMarked className="text-indigo-400 shrink-0" size={16} />
                Commencés (session)
              </div>
              <div className="text-xl font-bold text-white">{libStats.startedWithSession}</div>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70 sm:col-span-2">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <Timer className="text-orange-400 shrink-0" size={16} />
                Livre le plus « rapide » (pages/h en session)
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {fmtBook(libStats.fastestBook)}
                {libStats.fastestPph != null ? (
                  <span className="text-slate-400 font-normal"> · ~{libStats.fastestPph} p/h</span>
                ) : null}
              </div>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70 sm:col-span-2">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <Heart className="text-rose-400 shrink-0" size={16} />
                Livre le mieux noté
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {fmtBook(libStats.mostLikedBook)}
                {libStats.mostLikedScore > 0 ? (
                  <span className="text-slate-400 font-normal">
                    {' '}
                    · {libStats.mostLikedScore.toFixed(1)}/10
                  </span>
                ) : null}
              </div>
            </div>
            <div className="bg-slate-900/70 rounded-lg p-3 text-center border border-slate-700/70 lg:col-span-4">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="text-violet-400 shrink-0" size={16} />
                Plus de temps passé sur
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {fmtBook(libStats.mostTimeBook)}
                {libStats.mostTimeMinutes > 0 ? (
                  <span className="text-slate-400 font-normal"> · {libStats.mostTimeMinutes} min</span>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-4">
            {t(
              'books.calendar.tintHint',
              'Même échelle de couleurs que le sport : dans le mois ou l’année affiché, le jour le plus chargé est le plus « chaud », le moins chargé le plus vert.'
            )}
          </p>
        </div>
      </div>

      <CalendarHeatmap
        variant="books"
        booksCalendarContext={booksCalendarContext}
        initialViewMode="month"
        garminData={null}
        workoutHistory={[]}
      />
    </div>
  );
};

export default BooksCalendarView;
