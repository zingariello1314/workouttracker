/**
 * Synthèse du jour : quêtes, sport (Garmin), lecture — sous la barre XP.
 */

import { useMemo } from 'react';
import { BookOpen, ChevronRight, Dumbbell, Sparkles, Target } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useDashboardMomentum } from '../../hooks/useDashboardMomentum';
import MomentumWeekCharts from './MomentumWeekCharts';

const pillClass = (tone) => {
  if (tone === 'good') return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/35';
  if (tone === 'mid') return 'bg-amber-500/15 text-amber-200 border-amber-500/35';
  if (tone === 'low') return 'bg-rose-500/15 text-rose-200 border-rose-500/35';
  return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
};

const DashboardMomentumBlock = () => {
  const { setActiveTab } = useWorkout();
  const {
    loading,
    todayDate,
    quests,
    sport,
    reading,
    insight,
    weekChartData,
    weekRangeLabel,
    booksReadWeek,
    weekPagesPerHour
  } =
    useDashboardMomentum();

  const dateLabel = useMemo(() => {
    if (!todayDate) return '';
    try {
      return new Date(`${todayDate}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch {
      return todayDate;
    }
  }, [todayDate]);

  const questTone = useMemo(() => {
    if (quests.total === 0) return 'good';
    if (quests.rate >= 70) return 'good';
    if (quests.rate >= 35) return 'mid';
    return 'low';
  }, [quests.total, quests.rate]);

  const sportTone = useMemo(() => {
    const moved =
      sport.activitiesCount > 0 ||
      sport.intensityMinutes >= 8 ||
      (sport.steps >= 4000 && sport.hasGarminForDay);
    if (moved) return 'good';
    if (sport.hasGarminForDay && (sport.steps > 0 || sport.intensityMinutes > 0)) return 'mid';
    return 'low';
  }, [sport]);

  const readingTone = useMemo(() => {
    if (reading.minutes <= 0 && reading.pages <= 0) return 'low';
    if (reading.minutes >= reading.dailyGoal || reading.pages >= 25) return 'good';
    return 'mid';
  }, [reading.minutes, reading.pages, reading.dailyGoal]);

  const goQuests = () => {
    try {
      localStorage.setItem('quests.activeSubTab', 'today');
      sessionStorage.setItem('nav_params_quests', JSON.stringify({ tab: 'today' }));
    } catch {
      /* ignore */
    }
    setActiveTab?.('quests');
  };

  const goSport = () => {
    try {
      localStorage.setItem('sport.lastSubTab', 'today');
    } catch {
      /* ignore */
    }
    setActiveTab?.('today');
  };

  const goBooks = () => {
    setActiveTab?.('books');
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-6 mb-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-700/80 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="h-24 bg-slate-800/80 rounded-lg" />
          <div className="h-24 bg-slate-800/80 rounded-lg" />
          <div className="h-24 bg-slate-800/80 rounded-lg" />
        </div>
        <div className="h-12 bg-slate-800/60 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/40 p-6 mb-6 shadow-lg shadow-slate-950/40 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 text-cyan-300" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Vue du jour</h3>
            <p className="text-xs text-slate-400 capitalize">{dateLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <button
          type="button"
          onClick={goQuests}
          className="text-left rounded-lg border border-slate-700/60 bg-slate-950/50 p-4 hover:bg-slate-800/60 hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <Target className="w-4 h-4 text-purple-400" />
              Quêtes
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${pillClass(questTone)}`}>
              {quests.total === 0 ? 'Libre' : `${quests.rate} %`}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {quests.completed}/{quests.total || '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {quests.total > 0
              ? `${quests.gainedXP} / ${quests.potentialXP} XP quêtes`
              : 'Aucune quête planifiée'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 group-hover:text-cyan-300">
            Ouvrir les quêtes
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={goSport}
          className="text-left rounded-lg border border-slate-700/60 bg-slate-950/50 p-4 hover:bg-slate-800/60 hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              Sport
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${pillClass(sportTone)}`}>
              {sport.activitiesCount > 0 ? `${sport.activitiesCount} act.` : sport.intensityMinutes > 0 ? 'Intensité' : sport.hasGarminForDay ? 'Suivi' : '—'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {sport.intensityMinutes > 0
              ? `${sport.intensityMinutes} min int.`
              : sport.activitiesCount > 0
                ? `${sport.activitiesCount} séance(s)`
                : sport.reps > 0
                  ? `${sport.reps} reps`
                  : sport.steps > 0
                  ? `${sport.steps.toLocaleString('fr-FR')} pas`
                  : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Reps: {sport.reps} · Exos: {sport.checkedExercises} · Défis: {sport.validatedChallenges}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {sport.hasGarminForDay
              ? `Garmin: ${sport.activitiesCount} activité(s) · ${sport.steps.toLocaleString('fr-FR')} pas`
              : 'Garmin : pas de métrique pour ce jour'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 group-hover:text-cyan-300">
            Ouvrir le sport
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={goBooks}
          className="text-left rounded-lg border border-slate-700/60 bg-slate-950/50 p-4 hover:bg-slate-800/60 hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Lecture
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${pillClass(readingTone)}`}>
              {reading.minutes > 0 || reading.pages > 0 ? 'En cours' : 'À faire'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {reading.pages > 0 || reading.minutes > 0
              ? `${reading.pages} p. · ${reading.minutes} min`
              : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Rythme: {reading.pagesPerHour > 0 ? `${reading.pagesPerHour} p/h` : '—'} · Objectif: {reading.dailyGoal} min
            {reading.sessions > 0 ? ` · ${reading.sessions} session(s)` : ''}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate" title={reading.booksReadToday?.join(', ') || ''}>
            Livres du jour: {reading.booksReadToday?.length > 0 ? reading.booksReadToday.join(', ') : '—'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 group-hover:text-cyan-300">
            Ouvrir les livres
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      {insight ? (
        <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">{insight}</p>
      ) : null}

      {weekChartData?.length > 0 ? (
        <MomentumWeekCharts chartData={weekChartData} weekRangeLabel={weekRangeLabel} />
      ) : null}
      <p className="text-xs text-slate-500 mt-3">
        Semaine lecture: {weekPagesPerHour > 0 ? `${weekPagesPerHour} p/h` : '—'} · Livres lus: {booksReadWeek?.length || 0}
      </p>
      {booksReadWeek?.length > 0 ? (
        <p className="text-xs text-slate-500 mt-1 truncate" title={booksReadWeek.join(', ')}>
          {booksReadWeek.join(', ')}
        </p>
      ) : null}
    </div>
  );
};

export default DashboardMomentumBlock;
