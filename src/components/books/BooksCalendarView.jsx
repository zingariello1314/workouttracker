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
      <div className="rounded-2xl border-2 border-[#3A86FF] bg-black shadow-lg shadow-black/40 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-[#3A86FF]/35">
          <h3 className="text-lg md:text-xl font-bold text-sky-100 flex items-center gap-2">
            <Library className="text-sky-300" size={24} />
            {t('books.calendar.summaryTitle', 'Lecture — vue calendrier')}
          </h3>
        </div>
        <div className="px-4 md:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/90 rounded-lg p-4 text-center border border-[#3A86FF]/45">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="text-sky-300 mr-2" size={20} />
                <span className="text-sky-200/85 text-sm">
                  {t('books.calendar.daysWithSessions', 'Jours avec session')}
                </span>
              </div>
              <div className="text-2xl font-bold text-sky-100">{stats.activeDays}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-4 text-center border border-[#3A86FF]/45">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="text-sky-300 mr-2" size={20} />
                <span className="text-sky-200/85 text-sm">
                  {t('books.calendar.totalSessions', 'Sessions')}
                </span>
              </div>
              <div className="text-2xl font-bold text-sky-100">{stats.sessions}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-4 text-center border border-[#3A86FF]/45">
              <div className="flex items-center justify-center mb-2">
                <FileText className="text-sky-300 mr-2" size={20} />
                <span className="text-sky-200/85 text-sm">
                  {t('books.calendar.pagesRead', 'Pages lues')}
                </span>
              </div>
              <div className="text-2xl font-bold text-sky-100">{stats.pages}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-4 text-center border border-[#3A86FF]/45">
              <div className="flex items-center justify-center mb-2">
                <Clock className="text-sky-300 mr-2" size={20} />
                <span className="text-sky-200/85 text-sm">
                  {t('books.calendar.timeReading', 'Temps lecture')}
                </span>
              </div>
              <div className="text-2xl font-bold text-sky-100">{stats.minutes} min</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <Trophy className="text-sky-300 shrink-0" size={16} />
                Livres terminés
              </div>
              <div className="text-xl font-bold text-sky-100">{libStats.finishedCount}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <FileText className="text-sky-300 shrink-0" size={16} />
                Vitesse (pages/h)
              </div>
              <div className="text-xl font-bold text-sky-100">{libStats.pagesPerHour}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <Bookmark className="text-sky-300 shrink-0" size={16} />
                En cours (≥1 session)
              </div>
              <div className="text-xl font-bold text-sky-100">{libStats.inProgressWithSession}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <BookMarked className="text-sky-300 shrink-0" size={16} />
                Commencés (session)
              </div>
              <div className="text-xl font-bold text-sky-100">{libStats.startedWithSession}</div>
            </div>
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40 sm:col-span-2">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <Timer className="text-sky-300 shrink-0" size={16} />
                Livre le plus « rapide » (pages/h en session)
              </div>
              <div className="text-sm font-semibold text-sky-100 truncate">
                {fmtBook(libStats.fastestBook)}
                {libStats.fastestPph != null ? (
                  <span className="text-blue-300/70 font-normal"> · ~{libStats.fastestPph} p/h</span>
                ) : null}
              </div>
            </div>
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40 sm:col-span-2">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <Heart className="text-sky-300 shrink-0" size={16} />
                Livre le mieux noté
              </div>
              <div className="text-sm font-semibold text-sky-100 truncate">
                {fmtBook(libStats.mostLikedBook)}
                {libStats.mostLikedScore > 0 ? (
                  <span className="text-blue-300/70 font-normal">
                    {' '}
                    · {libStats.mostLikedScore.toFixed(1)}/10
                  </span>
                ) : null}
              </div>
            </div>
            <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/40 lg:col-span-4">
              <div className="flex items-center justify-center gap-2 text-sky-200/80 text-xs mb-1">
                <Clock className="text-sky-300 shrink-0" size={16} />
                Plus de temps passé sur
              </div>
              <div className="text-sm font-semibold text-sky-100 truncate">
                {fmtBook(libStats.mostTimeBook)}
                {libStats.mostTimeMinutes > 0 ? (
                  <span className="text-blue-300/70 font-normal"> · {libStats.mostTimeMinutes} min</span>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-sky-200/75 text-xs mt-4">
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
        initialViewMode="year"
        garminData={null}
        workoutHistory={[]}
      />
    </div>
  );
};

export default BooksCalendarView;
