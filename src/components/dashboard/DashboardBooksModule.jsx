import { Suspense, lazy, useMemo, useState } from 'react';
import { BookOpen, Calendar, Clock3, Library, PieChart, Star, Target, Timer, TrendingUp } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import { useBooksCovers } from '../tabs/BooksTab/hooks/useBooksCovers';
import { useBooksProgress } from '../tabs/BooksTab/hooks/useBooksProgress';
import { useStatisticsData } from '../../hooks/useStatisticsData';
import {
  getAverageDurationPerSession,
  getAveragePagesPerSession,
  getEstimatedRemainingTimeMinutes,
  getReadingProgressPercent,
  getTotalPagesRead,
  getTotalReadingTime
} from '../tabs/BooksTab/utils';
import PagesPerDayChart from '../tabs/books/statistics/charts/PagesPerDayChart';
import ReadingSpeedChart from '../tabs/books/statistics/charts/ReadingSpeedChart';
import HeatmapCalendar from '../tabs/books/statistics/charts/HeatmapCalendar';
import GenreDistributionChart from '../tabs/books/statistics/charts/GenreDistributionChart';
import GoalsProgressChart from '../tabs/books/statistics/charts/GoalsProgressChart';
import './dashboardBooksModule.css';

const BooksDomeGallery = lazy(() => import('../books/BooksDomeGallery'));

const safeNumber = (v) => (Number.isFinite(v) ? v : 0);

const DashboardBooksModule = () => {
  const { setActiveTab } = useWorkout();
  const { books, isLoading } = useBooksStorage();
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [activeChart, setActiveChart] = useState('pages-per-day');
  const { coverUrls } = useBooksCovers(books, true);
  const { booksWithProgress } = useBooksProgress(books, books);
  const currentYear = String(new Date().getFullYear());
  const chartStatisticsData = useStatisticsData(books, currentYear, { genre: '', status: '', author: '' }, 0);
  const allTimeStatisticsData = useStatisticsData(books, 'all', { genre: '', status: '', author: '' }, 0);

  const chartConfigs = useMemo(
    () => ({
      'pages-per-day': {
        title: 'Pages par jour',
        description: 'Evolution quotidienne des pages lues',
        Icon: BookOpen,
        Component: PagesPerDayChart
      },
      'reading-speed': {
        title: 'Vitesse de lecture',
        description: 'Evolution de ta vitesse de lecture',
        Icon: TrendingUp,
        Component: ReadingSpeedChart
      },
      'heatmap-calendar': {
        title: "Calendrier d'activite",
        description: 'Visualisation de ta regularite',
        Icon: Calendar,
        Component: HeatmapCalendar
      },
      'genre-distribution': {
        title: 'Repartition par genre',
        description: 'Analyse de tes preferences',
        Icon: PieChart,
        Component: GenreDistributionChart
      },
      'goals-progress': {
        title: 'Progression des objectifs',
        description: 'Suivi de tes objectifs de lecture',
        Icon: Target,
        Component: GoalsProgressChart
      }
    }),
    []
  );

  const resolvedChartConfig = chartConfigs[activeChart] || chartConfigs['pages-per-day'];

  const domeBooks = useMemo(
    () =>
      booksWithProgress
        .filter((b) => b.hasCover && coverUrls[b.id])
        .map((b) => ({
          id: b.id,
          title: b.title || 'Livre sans titre',
          author: b.author || '',
          genre: b.genre || '',
          year: b.year || null,
          pages: b.pages || null,
          personalScore: typeof b.personalScore === 'number' ? b.personalScore : 0,
          status: b.status || 'in-progress',
          shortSummary: b.shortSummary || b.notes || '',
          coverUrl: coverUrls[b.id]
        })),
    [booksWithProgress, coverUrls]
  );

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

  const stats = useMemo(() => {
    const metrics = allTimeStatisticsData?.metrics || {};
    const sessions = allTimeStatisticsData?.aggregatedData?.sessions || [];
    const byStatus = {
      inProgress: books.filter((b) => b.status === 'in-progress').length,
      completed: books.filter((b) => b.status === 'completed').length,
      toRead: books.filter((b) => b.status === 'to-read').length,
      paused: books.filter((b) => b.status === 'paused').length,
      abandoned: books.filter((b) => b.status === 'abandoned').length
    };

    let lastSessionDate = null;
    let lastSessionTs = -1;
    let pagesLast30 = 0;
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    sessions.forEach((session) => {
      const sessionDate = String(session?.normalizedDate || session?.date || '');
      if (!sessionDate) return;
      const pages = safeNumber(Number(session?.pagesRead));
      if (sessionDate >= last30) {
        pagesLast30 += pages;
      }

      const timePart = session?.startTime ? String(session.startTime) : '00:00';
      const ts = new Date(`${sessionDate}T${timePart}:00`).getTime();
      if (!Number.isNaN(ts) && ts > lastSessionTs) {
        lastSessionTs = ts;
        lastSessionDate = new Date(ts);
      }
    });

    const completedWithScore = books
      .filter((b) => b.status === 'completed' && Number.isFinite(Number(b.personalScore)))
      .sort((a, b) => Number(b.personalScore) - Number(a.personalScore));
    const bestRated = completedWithScore[0] || null;

    return {
      totalBooks: books.length,
      ...byStatus,
      sessionsCount: safeNumber(Number(metrics.sessionsCount)),
      totalMinutes: safeNumber(Number(metrics.totalTime)),
      totalPagesRead: safeNumber(Number(metrics.totalPages)),
      avgPagesSession: safeNumber(Number(metrics.averagePagesPerSession)),
      avgMinutesSession: safeNumber(Number(metrics.averageSessionDuration)),
      averageSpeed: safeNumber(Number(metrics.averageSpeed)),
      readingFrequency: safeNumber(Number(metrics.readingFrequency)),
      uniqueDays: safeNumber(Number(metrics.uniqueDays)),
      currentStreak: safeNumber(Number(metrics.currentStreak)),
      lastSessionDate,
      pagesLast30,
      bestRated
    };
  }, [books, allTimeStatisticsData]);

  const byStatusRows = useMemo(() => ({
    inProgress: booksWithProgress.filter((b) => b.status === 'in-progress'),
    completed: booksWithProgress.filter((b) => b.status === 'completed'),
    toRead: booksWithProgress.filter((b) => b.status === 'to-read')
  }), [booksWithProgress]);

  const openBooksTab = () => {
    if (selectedBook?.id) {
      sessionStorage.setItem('nav_params_books', JSON.stringify({ bookId: selectedBook.id }));
    }
    setActiveTab?.('books');
  };

  const openBooksStatsTab = () => {
    sessionStorage.setItem('nav_params_books', JSON.stringify({ tab: 'statistics' }));
    setActiveTab?.('books');
  };

  const openAddBook = () => {
    sessionStorage.setItem('nav_params_books', JSON.stringify({ tab: 'library', action: 'addBook' }));
    setActiveTab?.('books');
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#3A86FF]/95 bg-black shadow-[0_0_50px_rgba(58,134,255,0.28)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 10% 10%, rgba(56,189,248,0.2), transparent 50%), radial-gradient(circle at 90% 20%, rgba(37,99,235,0.18), transparent 52%), radial-gradient(circle at 65% 90%, rgba(14,165,233,0.12), transparent 45%)',
          mixBlendMode: 'screen'
        }}
      />
      <div className="relative p-6 md:p-7 lg:p-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/20 border border-sky-300/40 p-2">
              <Library className="w-6 h-6 text-sky-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Livres</h3>
              <p className="text-xs text-sky-200/75">
                Vue 3D en tête + cockpit lecture enrichi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openBooksTab}
            className="h-8 px-3 rounded-lg border border-sky-400/40 bg-sky-500/20 text-sky-100 text-xs font-medium hover:bg-sky-500/30"
          >
            Ouvrir Livres
          </button>
        </div>

        <div className="rounded-2xl border border-sky-500/35 bg-black overflow-hidden">
          <Suspense
            fallback={
              <div className="h-[56vh] flex items-center justify-center text-sky-200/80 text-sm">
                Chargement de la vue 3D...
              </div>
            }
          >
            <BooksDomeGallery
              className="dashboard-books-dome"
              books={domeBooks}
              onBookOpen={(id) => setSelectedBookId(id)}
              dragSensitivity={50}
              dragDampening={0.3}
              maxVerticalRotationDeg={8}
              fit={1.18}
              fitBasis="height"
              minRadius={900}
              maxRadius={2200}
              padFactor={0.02}
            />
          </Suspense>
        </div>

        {!isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-sky-100">Bibliothèque par statut</div>
              <button
                type="button"
                onClick={openAddBook}
                className="h-7 px-2.5 rounded-md border border-sky-400/50 bg-sky-500/15 text-sky-100 text-[11px] font-medium hover:bg-sky-500/28"
              >
                Ajouter un nouveau livre
              </button>
            </div>

            {[
              {
                key: 'inProgress',
                title: `Livres en cours (${byStatusRows.inProgress.length})`,
                badge: 'En cours',
                badgeCls: 'bg-sky-500/15 text-sky-100 border-sky-400/40',
                list: byStatusRows.inProgress
              },
              {
                key: 'completed',
                title: `Livres terminés (${byStatusRows.completed.length})`,
                badge: 'Terminé',
                badgeCls: 'bg-sky-500/20 text-sky-100 border-sky-400/40',
                list: byStatusRows.completed
              },
              {
                key: 'toRead',
                title: `Livres à lire (${byStatusRows.toRead.length})`,
                badge: 'À lire',
                badgeCls: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
                list: byStatusRows.toRead
              }
            ].map((row) => (
              <div key={row.key} className="rounded-xl border border-sky-500/35 bg-black p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-white">{row.title}</div>
                  <button
                    type="button"
                    onClick={openBooksTab}
                    className="text-[11px] px-2 py-1 rounded-md border border-sky-400/35 text-sky-100 hover:bg-sky-500/25"
                  >
                    Voir tout
                  </button>
                </div>
                {row.list.length === 0 ? (
                  <div className="text-xs text-sky-200/65">Aucun livre dans cette catégorie.</div>
                ) : (
                  <div className="space-y-2">
                    {row.list.slice(0, 6).map((book) => {
                      const progress = getReadingProgressPercent(book);
                      const bookCover = coverUrls[book.id];
                      const score = Number(book.personalScore) || 0;
                      return (
                        <button
                          type="button"
                          key={book.id}
                          onClick={() => {
                            setSelectedBookId(book.id);
                          }}
                          className="w-full text-left rounded-lg border border-sky-500/35 bg-black hover:bg-sky-950/40 transition-colors p-2.5 flex items-center gap-3"
                        >
                          <div className="h-14 w-11 rounded overflow-hidden border border-sky-500/40 bg-black shrink-0">
                            {bookCover ? (
                              <img src={bookCover} alt={book.title || 'Livre'} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-sky-300/50">No cover</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white truncate">{book.title || 'Livre sans titre'}</div>
                            <div className="text-xs text-sky-200/70 truncate">{book.author || 'Auteur non renseigné'}</div>
                            <div className="mt-1 flex items-center gap-2 text-[11px]">
                              <span className={`px-2 py-0.5 rounded-full border ${row.badgeCls}`}>{row.badge}</span>
                              <span className="text-sky-100/90">{progress ?? 0}%</span>
                              <span className="text-sky-400/40">•</span>
                              <span className="text-sky-100/90">{book.pages || 0} p</span>
                              {score > 0 && (
                                <>
                                  <span className="text-sky-400/40">•</span>
                                  <span className="text-sky-300">{'★'.repeat(Math.max(1, Math.round(score)))}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="rounded-xl border border-sky-500/40 bg-black p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(chartConfigs).map(([key, cfg]) => {
                const Icon = cfg.Icon;
                const isActive = key === activeChart;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveChart(key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? 'border-sky-400 bg-sky-500/25 text-sky-50 shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                        : 'border-sky-700/45 bg-black text-sky-200/85 hover:border-sky-500/60 hover:bg-sky-950/35'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-sky-200/70">{resolvedChartConfig.description}</div>
              <button
                type="button"
                onClick={openBooksStatsTab}
                className="h-7 px-2.5 rounded-md border border-sky-400/50 bg-sky-500/12 text-sky-100 text-[11px] font-medium hover:bg-sky-500/22"
              >
                Accéder aux statistiques de lecture
              </button>
            </div>

            <div className="rounded-xl border border-sky-500/35 bg-black p-3 min-w-0 w-full">
              <resolvedChartConfig.Component
                books={books}
                statisticsData={chartStatisticsData}
                selectedPeriod={currentYear}
                filters={{ genre: '', status: '', author: '' }}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-sky-200/80">Chargement des statistiques livres...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70">Bibliothèque</div>
                <div className="text-xl font-bold text-white">{stats.totalBooks}</div>
                <div className="text-[11px] text-sky-300/55">en cours {stats.inProgress} • terminés {stats.completed}</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70 flex items-center gap-1"><BookOpen className="w-3 h-3 text-sky-400" /> Sessions</div>
                <div className="text-xl font-bold text-white">{stats.sessionsCount}</div>
                <div className="text-[11px] text-sky-300/55">pages/session {stats.avgPagesSession}</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70 flex items-center gap-1"><Clock3 className="w-3 h-3 text-sky-400" /> Temps total</div>
                <div className="text-xl font-bold text-white">{stats.totalMinutes} min</div>
                <div className="text-[11px] text-sky-300/55">moy/session {stats.avgMinutesSession} min</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70">Pages lues</div>
                <div className="text-xl font-bold text-white">{stats.totalPagesRead}</div>
                <div className="text-[11px] text-sky-300/55">30j: {stats.pagesLast30}</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70">À lire / pause / abandonnés</div>
                <div className="text-xl font-bold text-white">{stats.toRead} / {stats.paused} / {stats.abandoned}</div>
                <div className="text-[11px] text-sky-300/55">répartition backlog</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-sky-400" /> Dernière session</div>
                <div className="text-sm font-bold text-white">
                  {stats.lastSessionDate
                    ? stats.lastSessionDate.toLocaleDateString('fr-FR')
                    : 'Aucune'}
                </div>
                <div className="text-[11px] text-sky-300/55">activité récente</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70">Vitesse de lecture</div>
                <div className="text-xl font-bold text-white">{stats.averageSpeed.toFixed(1)} p/h</div>
                <div className="text-[11px] text-sky-300/55">pages par heure</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70">Rythme de lecture</div>
                <div className="text-xl font-bold text-white">{stats.readingFrequency.toFixed(1)} / sem</div>
                <div className="text-[11px] text-sky-300/55">sessions par semaine</div>
              </div>
              <div className="rounded-xl border border-sky-500/40 bg-black p-3">
                <div className="text-xs text-sky-200/70">Jours actifs</div>
                <div className="text-xl font-bold text-white">{stats.uniqueDays}</div>
                <div className="text-[11px] text-sky-300/55">streak actuel {stats.currentStreak} j</div>
              </div>
            </div>

            <div className="rounded-xl border border-sky-500/40 bg-black p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-sky-100">Livre focus</div>
                {selectedBook && (
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('nav_params_books', JSON.stringify({ bookId: selectedBook.id }));
                      setActiveTab?.('books');
                    }}
                    className="text-[11px] px-2 py-1 rounded-md border border-sky-400/35 text-sky-100 hover:bg-sky-500/25"
                  >
                    Voir fiche
                  </button>
                )}
              </div>
              {selectedBook ? (
                <>
                  <div className="rounded-xl border border-sky-500/40 bg-black p-3 flex items-start gap-3">
                    <div className="h-24 w-16 rounded overflow-hidden border border-sky-500/40 bg-black shrink-0">
                      {coverUrls[selectedBook.id] ? (
                        <img src={coverUrls[selectedBook.id]} alt={selectedBook.title || 'Livre'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-sky-300/50">No cover</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-semibold line-clamp-2">{selectedBook.title}</div>
                      <div className="text-xs text-sky-200/70 line-clamp-1">{selectedBook.author || 'Auteur non renseigné'}</div>
                      <div className="text-xs text-sky-300/55 mt-1 line-clamp-3">
                        {selectedBook.shortSummary || selectedBook.notes || 'Aucun résumé pour ce livre.'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-black border border-sky-500/35 p-2">
                      <div className="text-sky-200/70 flex items-center gap-1"><Target className="w-3 h-3" /> Progression</div>
                      <div className="text-white font-semibold">
                        {getReadingProgressPercent(selectedBook) ?? 0}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-black border border-sky-500/35 p-2">
                      <div className="text-sky-200/70 flex items-center gap-1"><Timer className="w-3 h-3" /> Temps lu</div>
                      <div className="text-white font-semibold">{getTotalReadingTime(selectedBook)} min</div>
                    </div>
                    <div className="rounded-lg bg-black border border-sky-500/35 p-2">
                      <div className="text-sky-200/70">Pages lues</div>
                      <div className="text-white font-semibold">{getTotalPagesRead(selectedBook)}</div>
                    </div>
                    <div className="rounded-lg bg-black border border-sky-500/35 p-2">
                      <div className="text-sky-200/70">Temps restant</div>
                      <div className="text-white font-semibold">
                        {getEstimatedRemainingTimeMinutes(selectedBook) ?? '—'} min
                      </div>
                    </div>
                    <div className="rounded-lg bg-black border border-sky-500/35 p-2 md:col-span-2">
                      <div className="text-sky-200/70">Moyennes livre</div>
                      <div className="text-white font-semibold">
                        {getAveragePagesPerSession(selectedBook)} pages/session • {getAverageDurationPerSession(selectedBook)} min/session
                      </div>
                    </div>
                    <div className="rounded-lg bg-black border border-sky-500/35 p-2 md:col-span-2">
                      <div className="text-sky-200/70 flex items-center gap-1"><Star className="w-3 h-3 text-sky-300" /> Meilleure note terminée</div>
                      <div className="text-white font-semibold line-clamp-1">
                        {stats.bestRated
                          ? `${stats.bestRated.title} (${stats.bestRated.personalScore}/5)`
                          : 'Pas encore de note'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-sky-200/70">
                  Aucun livre trouvé. Ajoute des livres et des couvertures dans l’onglet Livres pour alimenter ce module.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBooksModule;
