/**
 * Récap lecture — métriques cliquables vers l’onglet Livres (globe / stats / graphiques).
 */

import { memo, useMemo } from 'react';
import { BookOpen, Clock3, TrendingUp } from 'lucide-react';
import { useBooksStorage } from '../../../hooks/useBooksStorage';
import { useStatisticsData } from '../../../hooks/useStatisticsData';
import { openBooksWithNavParams } from '../../../utils/booksSidebarNav';

const safeNumber = (v) => (Number.isFinite(v) ? v : 0);

const cardClass =
  'w-full text-left rounded-lg border px-2 py-1.5 transition-colors hover:bg-slate-800/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/40';

const SidebarBooksRecapModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const { books, isLoading } = useBooksStorage();
  const allTime = useStatisticsData(books, 'all', { genre: '', status: '', author: '' }, books.length);

  const stats = useMemo(() => {
    const metrics = allTime?.metrics || {};
    const sessions = allTime?.aggregatedData?.sessions || [];
    const byStatus = {
      inProgress: books.filter((b) => b.status === 'in-progress').length,
      completed: books.filter((b) => b.status === 'completed').length
    };
    let pagesLast30 = 0;
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    sessions.forEach((session) => {
      const sessionDate = String(session?.normalizedDate || session?.date || '');
      if (!sessionDate || sessionDate < last30) return;
      pagesLast30 += safeNumber(Number(session?.pagesRead));
    });

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
      pagesLast30
    };
  }, [books, allTime]);

  const go = (params) => () => openBooksWithNavParams(setActiveTab, params);

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section récap lecture"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">
            📊
          </span>
          Lecture · récap
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-1.5 px-1 py-2 min-w-0">
          <p className="px-0.5 text-[9px] text-slate-500">Touche une carte pour ouvrir la zone correspondante dans Livres.</p>
          {isLoading ? (
            <p className="text-[10px] text-slate-400">Chargement…</p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={go({ showGlobe: true })}
                className={`${cardClass} border-violet-500/35 bg-violet-500/5`}
              >
                <div className="text-[9px] text-slate-400">Bibliothèque</div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.totalBooks}</div>
                <div className="text-[9px] text-slate-500">
                  en cours {stats.inProgress} • terminés {stats.completed}
                </div>
              </button>
              <button
                type="button"
                onClick={go({
                  tab: 'statistics',
                  statsNavigation: { scrollToId: 'books-stats-session-analysis' }
                })}
                className={`${cardClass} border-indigo-500/35 bg-indigo-500/5`}
              >
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Sessions
                </div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.sessionsCount}</div>
                <div className="text-[9px] text-slate-500">pages/session {stats.avgPagesSession}</div>
              </button>
              <button
                type="button"
                onClick={go({
                  tab: 'statistics',
                  statsNavigation: { scrollToId: 'books-stats-metrics-panel' }
                })}
                className={`${cardClass} border-blue-500/35 bg-blue-500/5`}
              >
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                  <Clock3 className="h-3 w-3" /> Temps total
                </div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.totalMinutes} min</div>
                <div className="text-[9px] text-slate-500">moy/session {stats.avgMinutesSession} min</div>
              </button>
              <button
                type="button"
                onClick={go({
                  tab: 'statistics',
                  statsNavigation: { scrollToId: 'books-stats-metrics-panel' }
                })}
                className={`${cardClass} border-fuchsia-500/35 bg-fuchsia-500/5`}
              >
                <div className="text-[9px] text-slate-400">Pages lues</div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.totalPagesRead}</div>
                <div className="text-[9px] text-slate-500">30j: {stats.pagesLast30}</div>
              </button>
              <button
                type="button"
                onClick={go({
                  tab: 'statistics',
                  statsNavigation: {
                    chart: 'reading-speed',
                    scrollToId: 'books-stats-charts-container'
                  }
                })}
                className={`${cardClass} border-emerald-500/35 bg-emerald-500/5`}
              >
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Vitesse de lecture
                </div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.averageSpeed.toFixed(1)} p/h</div>
                <div className="text-[9px] text-slate-500">pages par heure</div>
              </button>
              <button
                type="button"
                onClick={go({
                  tab: 'statistics',
                  statsNavigation: { scrollToId: 'books-stats-session-analysis' }
                })}
                className={`${cardClass} border-rose-500/35 bg-rose-500/5`}
              >
                <div className="text-[9px] text-slate-400">Rythme de lecture</div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.readingFrequency.toFixed(1)} / sem</div>
                <div className="text-[9px] text-slate-500">sessions par semaine</div>
              </button>
              <button
                type="button"
                onClick={go({
                  tab: 'statistics',
                  statsNavigation: {
                    chart: 'heatmap-calendar',
                    scrollToId: 'books-stats-charts-container'
                  }
                })}
                className={`${cardClass} border-sky-500/35 bg-sky-500/5`}
              >
                <div className="text-[9px] text-slate-400">Jours actifs</div>
                <div className="text-sm font-bold text-white tabular-nums">{stats.uniqueDays}</div>
                <div className="text-[9px] text-slate-500">streak actuel {stats.currentStreak} j</div>
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
});

SidebarBooksRecapModule.displayName = 'SidebarBooksRecapModule';

export default SidebarBooksRecapModule;
