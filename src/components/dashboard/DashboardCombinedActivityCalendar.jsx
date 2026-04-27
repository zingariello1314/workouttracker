/**
 * Calendrier dashboard : fusion sport + quêtes + lecture (vue mois ou année + stats année).
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers, X } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import { useGarminData } from '../../hooks/useGarminData';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import { useBudget } from '../../hooks/useBudget';
import { usePlanificateur } from '../../hooks/usePlanificateur';
import { useSmartShopping } from '../../hooks/useSmartShopping';
import { useInvestissements } from '../../hooks/useInvestissements';
import { financeStorage } from '../../services/finance/financeStorage';
import { loadReadingDayFeedbacks } from '../../utils/readingDayFeedbacksStorage';
import { getDateStr } from '../../utils/dateUtils';
import { calendarHeatmapCompositeBackground } from '../../utils/calendarHeatmapTint';
import { useAuth } from '../../context/AuthContext';
import { canAccessPrivateData } from '../../utils/accessControl';
import {
  buildCombinedMonthIntensityMap,
  computeCombinedYearDashboardStats,
} from '../../utils/dashboardCombinedCalendarMetrics';
import {
  openApprentissageDB,
  loadSessionsHistoryFromIndexedDB,
} from '../../utils/apprentissageIndexedDB';
import { buildLearningSessionsByDate } from '../../utils/apprentissageCalendarMetrics';
import { buildFinanceCalendarYearDayMap } from '../../utils/finance/financeCalendarAggregates';
import BookSessionFeedbackReadonly from '../books/BookSessionFeedbackReadonly';

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function combinedCellStyle(intensity, isToday) {
  const u = intensity?.visualContext?.composite01 ?? 0;
  const ring = isToday ? ' ring-2 ring-[#ffd700]/90 shadow-[0_0_10px_rgba(255,215,0,0.45)]' : '';
  if (u < 0.008) {
    return { className: `bg-white border border-slate-400${ring}`, style: undefined };
  }
  return {
    className: `border border-slate-900/20${ring}`.trim(),
    style: { backgroundColor: calendarHeatmapCompositeBackground(Math.min(1, Math.max(0, u))) },
  };
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) {
    cells.push({ type: 'pad', key: `pad-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, monthIndex, d);
    cells.push({ type: 'day', date, dateStr: getDateStr(date), key: `d-${d}` });
  }
  return cells;
}

function fmtShortDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

function formatEurShort(n) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

/** Allure moyenne globale année : minutes par km → mm:ss /km */
function formatPaceMinPerKm(minPerKm) {
  if (minPerKm == null || !Number.isFinite(minPerKm) || minPerKm <= 0) return '—';
  const whole = Math.floor(minPerKm);
  const sec = Math.min(59, Math.round((minPerKm - whole) * 60));
  return `${whole}:${String(sec).padStart(2, '0')} /km`;
}

function countActiveDaysInMonth(intensityMap, year, monthIndex) {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  let n = 0;
  intensityMap.forEach((inten, ds) => {
    if (!ds.startsWith(prefix)) return;
    if (Number(inten?.intensityScore) > 0) n += 1;
  });
  return n;
}

function MiniCombinedMonthGrid({ year, monthIndex, intensityMap, todayStr, onPickDay }) {
  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);
  const activeDays = useMemo(
    () => countActiveDaysInMonth(intensityMap, year, monthIndex),
    [intensityMap, year, monthIndex]
  );
  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h4 className="text-white font-medium text-sm truncate">{MONTH_NAMES[monthIndex]}</h4>
        <div className="text-[10px] text-slate-400 shrink-0">
          {activeDays} jour{activeDays > 1 ? 's' : ''} actif{activeDays > 1 ? 's' : ''}
        </div>
      </div>
      <div className="bg-slate-700/30 rounded-lg p-2">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEK_DAYS.map((wd, i) => (
            <div key={i} className="text-center text-[9px] text-slate-500 font-medium">
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (cell.type === 'pad') {
              return <div key={cell.key} className="aspect-square rounded-sm bg-transparent min-w-0" />;
            }
            const inten = intensityMap.get(cell.dateStr) || null;
            const isToday = cell.dateStr === todayStr;
            const style = combinedCellStyle(inten, isToday);
            const dayNum = cell.date.getDate();
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => onPickDay(cell.dateStr)}
                className={`aspect-square min-w-0 rounded-sm text-[10px] font-semibold flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#ffd700]/55 ${style.className}`}
                style={style.style}
              >
                <span className={`tabular-nums text-black ${isToday ? 'font-bold' : ''}`}>{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardCombinedActivityCalendar(props) {
  const { onCombinedYearStats } = props || {};
  const { currentUser, isAuthenticated } = useAuth();
  const canAccessData = canAccessPrivateData({ user: currentUser, isAuthenticated });
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState('year');
  const [selected, setSelected] = useState(null);
  const [garminBundle, setGarminBundle] = useState({ dailyMetrics: {}, activities: {} });
  const [fbTick, setFbTick] = useState(0);

  const { data: workoutData } = useWorkout();
  const { books } = useBooksStorage();
  const { dbReady, loadAllData } = useGarminData();
  const {
    validationsByDate,
    validations,
    allQuests,
    getQuestsForDate,
    prayerLocation,
  } = useQuietQuestEngine();

  const { depenses, depensesPlanifiees, chargesFixes } = useBudget();
  const { achatsLoisirs } = usePlanificateur();
  const { data: smartData } = useSmartShopping();
  const { loadAcquisitions } = useInvestissements();

  const [portfolioLocal, setPortfolioLocal] = useState([]);
  const [learningHistory, setLearningHistory] = useState([]);
  const [yearAcquisitions, setYearAcquisitions] = useState([]);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();

  useEffect(() => {
    if (!canAccessData) {
      setPortfolioLocal([]);
      return () => {};
    }
    let alive = true;
    financeStorage
      .loadPortfolio()
      .then((p) => {
        if (alive) setPortfolioLocal(Array.isArray(p) ? p : []);
      })
      .catch(() => {
        if (alive) setPortfolioLocal([]);
      });
    return () => {
      alive = false;
    };
  }, [canAccessData]);

  const learningUserId = 'main';
  useEffect(() => {
    if (!canAccessData) {
      setLearningHistory([]);
      return () => {};
    }
    let alive = true;
    const load = async () => {
      try {
        const db = await openApprentissageDB();
        if (db) {
          const h = await loadSessionsHistoryFromIndexedDB(db, learningUserId);
          if (alive && Array.isArray(h)) setLearningHistory(h);
        } else {
          const raw = localStorage.getItem('apprentissage_sessions_history');
          if (alive && raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) setLearningHistory(parsed);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* ignore */
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [learningUserId, canAccessData]);

  useEffect(() => {
    if (!canAccessData) {
      setYearAcquisitions([]);
      return () => {};
    }
    let alive = true;
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    loadAcquisitions({ dateFrom: from, dateTo: to })
      .then((rows) => {
        if (alive) setYearAcquisitions(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setYearAcquisitions([]);
      });
    return () => {
      alive = false;
    };
  }, [year, loadAcquisitions, canAccessData]);

  const learningSessionsByDate = useMemo(
    () => buildLearningSessionsByDate(learningHistory),
    [learningHistory]
  );

  const shoppingListes = smartData?.listes || [];

  const financeYearDayMap = useMemo(
    () =>
      buildFinanceCalendarYearDayMap(year, {
        depenses: depenses || [],
        depensesPlanifiees: depensesPlanifiees || [],
        chargesFixes: chargesFixes || [],
        portfolio: portfolioLocal,
        shoppingListes,
        achatsLoisirs: achatsLoisirs || [],
        acquisitions: yearAcquisitions,
      }),
    [
      year,
      depenses,
      depensesPlanifiees,
      chargesFixes,
      portfolioLocal,
      shoppingListes,
      achatsLoisirs,
      yearAcquisitions,
    ]
  );

  useEffect(() => {
    const h = () => setFbTick((x) => x + 1);
    window.addEventListener('reading-day-feedbacks-updated', h);
    return () => window.removeEventListener('reading-day-feedbacks-updated', h);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!canAccessData || !dbReady) {
      setGarminBundle({ dailyMetrics: {}, activities: {} });
      return undefined;
    }
    loadAllData()
      .then((data) => {
        if (!alive) return;
        setGarminBundle({
          dailyMetrics: data?.dailyMetrics || {},
          activities: data?.activities || {},
        });
      })
      .catch(() => {
        if (alive) setGarminBundle({ dailyMetrics: {}, activities: {} });
      });
    return () => {
      alive = false;
    };
  }, [dbReady, loadAllData, canAccessData]);

  const questCalendarContext = useMemo(
    () => ({
      validationsByDate,
      validations: validations || [],
      allQuests,
      getQuestsForDate,
      prayerLocation,
    }),
    [validationsByDate, validations, allQuests, getQuestsForDate, prayerLocation]
  );

  const combinedCtx = useMemo(() => {
    const dayFeedbacks = canAccessData ? loadReadingDayFeedbacks() : {};
    return {
      books: canAccessData ? books : [],
      dayFeedbacks,
      questCalendarContext: canAccessData
        ? questCalendarContext
        : { validationsByDate: new Map(), validations: [], allQuests: [], getQuestsForDate: () => [], prayerLocation: null },
      workoutData: canAccessData ? workoutData : {},
      garminBundle: canAccessData ? garminBundle : { dailyMetrics: {}, activities: {} },
      learningSessionsByDate: canAccessData ? learningSessionsByDate : new Map(),
      financeYearDayMap: canAccessData ? financeYearDayMap : new Map(),
    };
  }, [
    canAccessData,
    books,
    questCalendarContext,
    workoutData,
    garminBundle,
    fbTick,
    learningSessionsByDate,
    financeYearDayMap,
  ]);

  const intensityMap = useMemo(
    () => buildCombinedMonthIntensityMap(year, monthIndex, combinedCtx),
    [year, monthIndex, combinedCtx]
  );

  const yearMonthMaps = useMemo(() => {
    if (viewMode !== 'year') return null;
    return Array.from({ length: 12 }, (_, mi) => buildCombinedMonthIntensityMap(year, mi, combinedCtx));
  }, [viewMode, year, combinedCtx]);

  const yearDashboardStats = useMemo(() => {
    if (viewMode !== 'year') return null;
    return computeCombinedYearDashboardStats(year, combinedCtx);
  }, [viewMode, year, combinedCtx]);

  const yearStatsSigRef = useRef('');
  useEffect(() => {
    if (!onCombinedYearStats || viewMode !== 'year' || !yearDashboardStats) return;
    const t = yearDashboardStats.totals;
    const sig = [
      year,
      yearDashboardStats.daysWithCombinedActivity,
      yearDashboardStats.daysTriplePillar,
      t?.totalReadingMinutes,
      t?.totalQuestValidations,
      t?.totalRepsYear,
      t?.runningTotalKm,
      t?.runningSessions,
    ].join('|');
    if (yearStatsSigRef.current === sig) return;
    yearStatsSigRef.current = sig;
    onCombinedYearStats(yearDashboardStats);
  }, [viewMode, year, yearDashboardStats, onCombinedYearStats]);

  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);

  const todayStr = useMemo(() => getDateStr(new Date()), []);

  const goPrev = useCallback(() => {
    setSelected(null);
    if (viewMode === 'year') {
      setCursor((c) => new Date(c.getFullYear() - 1, c.getMonth(), 1));
    } else {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    }
  }, [viewMode]);

  const goNext = useCallback(() => {
    setSelected(null);
    if (viewMode === 'year') {
      setCursor((c) => new Date(c.getFullYear() + 1, c.getMonth(), 1));
    } else {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    }
  }, [viewMode]);

  const onToggleView = useCallback((mode) => {
    setSelected(null);
    setViewMode(mode);
  }, []);

  const onPickDay = useCallback((dateStr) => {
    setSelected(dateStr);
  }, []);

  const selectedInt = useMemo(() => {
    if (!selected) return null;
    if (viewMode === 'month') return intensityMap.get(selected) || null;
    const m = parseInt(selected.slice(5, 7), 10) - 1;
    if (!yearMonthMaps || m < 0 || m > 11) return null;
    return yearMonthMaps[m].get(selected) || null;
  }, [selected, viewMode, intensityMap, yearMonthMaps]);

  const det = selectedInt?.combinedDetail;

  const totals = yearDashboardStats?.totals;
  const bc = yearDashboardStats?.bestCombined;
  const bq = yearDashboardStats?.bestQuests;
  const bs = yearDashboardStats?.bestSport;
  const bb = yearDashboardStats?.bestBooks;

  return (
    <div
      className="rounded-2xl border-2 border-[#ffd700]/45 p-5 shadow-[0_0_28px_rgba(255,215,0,0.18),inset_0_0_16px_rgba(255,215,0,0.06)] md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(15, 15, 20, 0.98) 0%, rgba(255, 20, 147, 0.08) 35%, rgba(255, 140, 0, 0.06) 65%, rgba(255, 215, 0, 0.07) 100%)',
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <Layers className="h-6 w-6 shrink-0 text-[#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,0.45)]" />
          <div>
            <h2 className="bg-gradient-to-b from-[#ff1493] via-[#ff8c00] to-[#ffd700] bg-clip-text text-lg font-bold text-transparent md:text-xl">
              Calendrier d’activité combinée
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Sport, quêtes, lecture, apprentissage et finance (même pondération relative que les calendriers
              par domaine) : plusieurs piliers le même jour augmentent le score. Clique un jour pour le détail.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-[#ffd700]/35">
            <button
              type="button"
              onClick={() => onToggleView('month')}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'month'
                  ? 'bg-gradient-to-r from-[#ff1493] via-[#ff8c00] to-[#ffd700] text-white shadow-inner'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-[rgba(255,20,147,0.12)]'
              }`}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => onToggleView('year')}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'year'
                  ? 'bg-gradient-to-r from-[#ff1493] via-[#ff8c00] to-[#ffd700] text-white shadow-inner'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-[rgba(255,20,147,0.12)]'
              }`}
            >
              Année
            </button>
          </div>
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-[#ffd700]/30 bg-slate-900/70 p-2 text-white transition hover:border-[#ff8c00]/50 hover:bg-[rgba(255,20,147,0.1)]"
            aria-label={viewMode === 'year' ? 'Année précédente' : 'Mois précédent'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[160px] text-center">
            {viewMode === 'year' ? year : `${MONTH_NAMES[monthIndex]} ${year}`}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-[#ffd700]/30 bg-slate-900/70 p-2 text-white transition hover:border-[#ff8c00]/50 hover:bg-[rgba(255,20,147,0.1)]"
            aria-label={viewMode === 'year' ? 'Année suivante' : 'Mois suivant'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'year' && yearDashboardStats && totals && (
        <div className="mb-5 space-y-3 rounded-xl border border-[#ffd700]/30 bg-black/45 p-4 text-xs text-slate-300">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
            Synthèse {year} (jusqu’à aujourd’hui si année en cours)
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Données : livres, quêtes, sport/Garmin, sessions apprentissage (IndexedDB / localStorage), et
            signaux datés finance (budget, planifié, charges mensuelles, bourse, acquisitions, shopping,
            loisirs mois cible) — aligné sur les vues calendrier de chaque onglet.
          </p>
          <p className="text-[10px] text-slate-400">
            Jours avec score combiné &gt; 0 :{' '}
            <span className="text-white font-semibold">{yearDashboardStats.daysWithCombinedActivity}</span>
            {' · '}
            Jours « triple pilier » (lecture + quête + sport le même jour) :{' '}
            <span className="text-white font-semibold">{yearDashboardStats.daysTriplePillar}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#ffd700]/25 bg-slate-950/60 p-3">
              <p className="mb-1 font-semibold text-[#ffd700]">Meilleur jour combiné</p>
              {bc ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bc.dateStr)}</p>
                  <p className="text-slate-500 mt-1">
                    Score brut ~{bc.score.toFixed(1)} · L {bc.bookInt.intensityScore.toFixed(0)} · Q{' '}
                    {bc.questInt.intensityScore.toFixed(0)} · S {bc.sportDetail.score.toFixed(0)} · A{' '}
                    {(bc.learnInt?.intensityScore ?? 0).toFixed(0)} · F {(bc.financeScore ?? 0).toFixed(0)}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Aucune activité enregistrée.</p>
              )}
            </div>
            <div className="rounded-lg border border-[#ffd700]/25 bg-slate-950/60 p-3">
              <p className="mb-1 font-semibold text-[#ff69b4]">Meilleur jour quêtes</p>
              {bq ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bq.dateStr)}</p>
                  <p className="text-slate-500 mt-1">
                    Score {bq.score.toFixed(1)} · {bq.questInt.questData?.completedCount ?? 0} coches ·{' '}
                    {bq.questInt.questData?.xpTotal ?? 0} XP · ~{bq.questInt.questData?.minutesOccupied ?? 0}{' '}
                    min quêtes
                  </p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>
            <div className="rounded-lg border border-[#ffd700]/25 bg-slate-950/60 p-3">
              <p className="mb-1 font-semibold text-[#ff8c00]">Meilleur jour sport</p>
              {bs ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bs.dateStr)}</p>
                  <p className="text-slate-500 mt-1">
                    Score {bs.score.toFixed(1)} · {bs.sportDetail.reps} reps ·{' '}
                    {bs.sportDetail.checkedExercises} ex. · {bs.sportDetail.intensityMinutes} min intensité
                  </p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>
            <div className="rounded-lg border border-[#ffd700]/25 bg-slate-950/60 p-3">
              <p className="mb-1 font-semibold text-[#ffb347]">Meilleur jour lecture</p>
              {bb ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bb.dateStr)}</p>
                  <p className="text-slate-500 mt-1">Score {bb.score.toFixed(1)}</p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 text-[11px]">
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Course (Garmin, année)</span>
              <span className="text-white font-semibold">
                {totals.runningTotalKm >= 0.1
                  ? `${totals.runningTotalKm.toFixed(1)} km`
                  : '—'}
              </span>
              <span className="text-slate-600 block mt-0.5">
                {totals.runningSessions > 0
                  ? `${totals.runningSessions} sortie(s) · ${Math.round(totals.runningTotalMin)} min`
                  : 'Pas d’activité course détectée'}
              </span>
              <span className="text-slate-500 block mt-0.5">
                Allure moy. : {formatPaceMinPerKm(totals.runningAvgPaceMinPerKm)}
              </span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Temps combiné (approx.)</span>
              <span className="text-white font-semibold">
                {Math.round(totals.combinedTimeMinutes)} min
              </span>
              <span className="text-slate-600 block mt-0.5">
                lecture + temps quêtes + min intensité Garmin
              </span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Lecture (année)</span>
              <span className="text-white font-semibold">
                {totals.totalReadingSessions} séances · {totals.totalReadingPages} p.
              </span>
              <span className="text-slate-600 block mt-0.5">{totals.totalReadingMinutes} min</span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Répétitions (séance)</span>
              <span className="text-white font-semibold">{totals.totalRepsYear.toLocaleString('fr-FR')}</span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Volume soulevé</span>
              <span className="text-white font-semibold">
                {Math.round(totals.totalVolumeKg).toLocaleString('fr-FR')} kg·rep
              </span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Quêtes cochées (total)</span>
              <span className="text-white font-semibold">{totals.totalQuestValidations}</span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Moy. coches / jour</span>
              <span className="text-white font-semibold">
                {totals.avgQuestPerCalendarDay.toFixed(2)} (cal.)
              </span>
              <span className="text-slate-600 block mt-0.5">
                {totals.daysWithQuestValidation > 0
                  ? `${totals.avgQuestOnActiveDays.toFixed(2)} sur jours avec quête`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] md:text-xs text-slate-500 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {cells.map((cell) => {
              if (cell.type === 'pad') {
                return <div key={cell.key} className="aspect-square rounded-md bg-slate-900/20" />;
              }
              const inten = intensityMap.get(cell.dateStr) || null;
              const isToday = cell.dateStr === todayStr;
              const style = combinedCellStyle(inten, isToday);
              const dayNum = cell.date.getDate();
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => onPickDay(cell.dateStr)}
                  className={`aspect-square rounded-md text-xs md:text-sm font-medium flex flex-col items-center justify-center transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#ffd700]/55 ${style.className}`}
                  style={style.style}
                >
                  <span className={`tabular-nums text-black ${isToday ? 'font-bold' : 'font-semibold'}`}>
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'year' && yearMonthMaps && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {yearMonthMaps.map((mapForMonth, mi) => (
            <MiniCombinedMonthGrid
              key={mi}
              year={year}
              monthIndex={mi}
              intensityMap={mapForMonth}
              todayStr={todayStr}
              onPickDay={onPickDay}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
        <span>Faible</span>
        {[0, 0.2, 0.45, 0.72, 1].map((u) => (
          <div
            key={u}
            className="w-5 h-3 rounded border border-slate-600"
            style={{ backgroundColor: calendarHeatmapCompositeBackground(u) }}
          />
        ))}
        <span>
          {viewMode === 'year'
            ? 'Élevé (échelle relative par mois, comme le sport)'
            : 'Élevé (mois courant)'}
        </span>
      </div>

      {selected && det && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border-2 border-[#ffd700]/45 bg-slate-950 p-5 shadow-[0_0_32px_rgba(255,215,0,0.2)]"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                {new Date(`${selected}T12:00:00`).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Score combiné (brut) :{' '}
              <span className="font-mono text-[#ffd700]">
                {Number(selectedInt?.intensityScore || 0).toFixed(1)}
              </span>{' '}
              · teinte = rang relatif dans le mois affiché.
            </p>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-emerald-300">Sport & Garmin</h4>
              <p className="text-xs text-slate-400">
                Score interne : <span className="font-mono text-white">{det.sport.score.toFixed(1)}</span>
              </p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>Répétitions (séance) : {det.sport.reps}</li>
                <li>Exercices cochés : {det.sport.checkedExercises}</li>
                <li>Séances endurance : {det.sport.enduranceSessions}</li>
                <li>Défis validés : {det.sport.validatedChallenges}</li>
                <li>Pas : {det.sport.steps.toLocaleString('fr-FR')}</li>
                <li>Minutes intensité : {det.sport.intensityMinutes}</li>
                <li>kcal actives : {det.sport.activeKcal}</li>
                <li>Activités Garmin (natation, corde, cardio…) : {det.sport.garminActivitiesCount}</li>
                <li>Ligne Garmin : {det.sport.hasGarminRow ? 'oui' : 'non'}</li>
              </ul>
            </section>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-[#ff69b4]">Quêtes</h4>
              <p className="text-xs text-slate-400">
                Score interne :{' '}
                <span className="font-mono text-white">{det.quests.intensityScore.toFixed(1)}</span>
              </p>
              {(det.quests.questData?.completedRows || []).length > 0 ? (
                <ul className="text-xs space-y-1 text-slate-300">
                  {det.quests.questData.completedRows.map((row, i) => (
                    <li key={i} className="flex justify-between gap-2 border-b border-slate-800/80 pb-1">
                      <span className="truncate">{row.nom}</span>
                      <span className="shrink-0 text-slate-400">
                        {row.dureeMinutes} min · {row.xp} XP
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucune validation ce jour.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-amber-200">Lecture</h4>
              <p className="text-xs text-slate-400">
                Score interne :{' '}
                <span className="font-mono text-white">{det.books.intensityScore.toFixed(1)}</span>
              </p>
              {(det.books.bookData?.entries || []).length > 0 ? (
                <ul className="space-y-3">
                  {det.books.bookData.entries.map((en, idx) => (
                    <li
                      key={`${en.bookId}-${idx}`}
                      className="rounded-lg border border-slate-800 bg-black/30 p-2 text-xs"
                    >
                      <p className="font-medium text-white truncate">{en.bookTitle}</p>
                      <p className="text-slate-500">
                        {en.durationMinutes || 0} min · {en.pagesRead || 0} p. · {en.startTime || '—'}
                      </p>
                      <BookSessionFeedbackReadonly session={en} title="Feedback session" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucune session de lecture ce jour.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-teal-300">Apprentissage</h4>
              <p className="text-xs text-slate-400">
                Score interne :{' '}
                <span className="font-mono text-white">
                  {(det.learning?.intensityScore ?? 0).toFixed(1)}
                </span>
              </p>
              {(det.learning?.bookData?.entries || []).length > 0 ? (
                <ul className="text-xs text-slate-300 space-y-1">
                  {det.learning.bookData.entries.map((en, idx) => (
                    <li key={`learn-${idx}`} className="border-b border-slate-800/80 pb-1">
                      <span className="text-white font-medium">{en.bookTitle}</span> ·{' '}
                      {en.durationMinutes || 0} min
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucune session enregistrée ce jour.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-cyan-300">Finance (signaux datés)</h4>
              <p className="text-xs text-slate-400">
                Score interne :{' '}
                <span className="font-mono text-white">
                  {(det.finance?.intensityScore ?? 0).toFixed(1)}
                </span>
              </p>
              {det.finance?.financeDay ? (
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>
                    Dépenses budget : {det.finance.financeDay.budgetCount} ·{' '}
                    {formatEurShort(det.finance.financeDay.budgetSpend)}
                  </li>
                  <li>Dépenses planifiées : {det.finance.financeDay.plannedCount}</li>
                  <li>Charges fixes (mensuel) : {det.finance.financeDay.chargeCount}</li>
                  <li>Nouvelles positions (date d&apos;achat) : {det.finance.financeDay.portfolioAdds}</li>
                  <li>Acquisitions investissements : {det.finance.financeDay.acquisitionCount}</li>
                  <li>Courses smart shopping terminées : {det.finance.financeDay.shoppingDone}</li>
                  {det.finance.financeDay.loisirsMois > 0 ? (
                    <li>Objectifs loisirs (mois) : {formatEurShort(det.finance.financeDay.loisirsMois)}</li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucun mouvement finance compté ce jour.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
