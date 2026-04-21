import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Info, X } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useTranslation } from '../../utils/translations';
import { useBudget } from '../../hooks/useBudget';
import { usePlanificateur } from '../../hooks/usePlanificateur';
import { useFinance } from '../../context/FinanceContext';
import { useSmartShopping } from '../../hooks/useSmartShopping';
import { useInvestissements } from '../../hooks/useInvestissements';
import {
  buildFinanceCalendarDayMap,
  daysInMonth,
  monthSummaryFromMap,
} from '../../utils/finance/financeCalendarAggregates';
import {
  buildFinanceMonthIntensityMap,
  hasFinanceDayActivity,
} from '../../utils/finance/financeCalendarIntensity';
import { calendarHeatmapCompositeBackground } from '../../utils/calendarHeatmapTint';
import { getDateStr } from '../../utils/dateUtils';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const WEEK_DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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

function formatMonthTitle(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatEur(n) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function financeCellStyle(intensity, isToday) {
  const u = intensity?.visualContext?.composite01 ?? 0;
  const ring = isToday ? ' ring-2 ring-amber-300/95' : '';
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
  const dim = daysInMonth(year, monthIndex);
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push({ type: 'pad', key: `pad-${i}` });
  for (let d = 1; d <= dim; d += 1) {
    const date = new Date(year, monthIndex, d);
    cells.push({ type: 'day', date, dateStr: getDateStr(date), key: `d-${d}` });
  }
  return cells;
}

function countFinanceActiveDays(intensityMap, year, monthIndex) {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  let n = 0;
  intensityMap.forEach((inten, ds) => {
    if (!ds.startsWith(prefix)) return;
    if (hasFinanceDayActivity(inten.financeDay)) n += 1;
  });
  return n;
}

/**
 * Calendrier finance : même esthétique heatmap que Sport / Livres / Quêtes (teinte relative par mois).
 */
const FinanceCalendarView = () => {
  const t = useTranslation();
  const [viewMode, setViewMode] = useState('year');
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), 0, 1);
  });
  const [selectedYmd, setSelectedYmd] = useState(null);

  const displayYear = cursor.getFullYear();
  const monthIndex = cursor.getMonth();

  const { depenses, depensesPlanifiees, chargesFixes, loading: budgetLoading } = useBudget();
  const { achatsLoisirs, loading: planifLoading } = usePlanificateur();
  const { portfolio, loading: financeLoading } = useFinance();
  const { data: smartData, loading: shopLoading } = useSmartShopping();
  const { loadAcquisitions } = useInvestissements();

  const [acquisitions, setAcquisitions] = useState([]);
  const [acqLoading, setAcqLoading] = useState(false);

  const range = useMemo(() => {
    if (viewMode === 'year') {
      return { from: `${displayYear}-01-01`, to: `${displayYear}-12-31` };
    }
    const ms = `${displayYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const last = daysInMonth(displayYear, monthIndex);
    const me = `${displayYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    return { from: ms, to: me };
  }, [viewMode, displayYear, monthIndex]);

  useEffect(() => {
    let alive = true;
    setAcqLoading(true);
    (async () => {
      try {
        const rows = await loadAcquisitions({ dateFrom: range.from, dateTo: range.to });
        if (alive) setAcquisitions(Array.isArray(rows) ? rows : []);
      } catch {
        if (alive) setAcquisitions([]);
      } finally {
        if (alive) setAcqLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadAcquisitions, range.from, range.to]);

  const shoppingListes = smartData?.listes || [];

  const financeInputBase = useMemo(
    () => ({
      depenses,
      depensesPlanifiees,
      chargesFixes,
      portfolio: Array.isArray(portfolio) ? portfolio : [],
      shoppingListes,
      achatsLoisirs: Array.isArray(achatsLoisirs) ? achatsLoisirs : [],
      acquisitions,
    }),
    [
      depenses,
      depensesPlanifiees,
      chargesFixes,
      portfolio,
      shoppingListes,
      achatsLoisirs,
      acquisitions,
    ]
  );

  const yearMonthIntensityMaps = useMemo(() => {
    if (viewMode !== 'year') return null;
    return Array.from({ length: 12 }, (_, mi) =>
      buildFinanceMonthIntensityMap(displayYear, mi, {
        year: displayYear,
        monthIndex: mi,
        ...financeInputBase,
      })
    );
  }, [viewMode, displayYear, financeInputBase]);

  const monthIntensityMap = useMemo(
    () =>
      buildFinanceMonthIntensityMap(displayYear, monthIndex, {
        year: displayYear,
        monthIndex,
        ...financeInputBase,
      }),
    [displayYear, monthIndex, financeInputBase]
  );

  const dayMapMonth = useMemo(
    () =>
      buildFinanceCalendarDayMap({
        year: displayYear,
        monthIndex,
        ...financeInputBase,
      }),
    [displayYear, monthIndex, financeInputBase]
  );

  const summary = useMemo(
    () => monthSummaryFromMap(dayMapMonth, displayYear, monthIndex),
    [dayMapMonth, displayYear, monthIndex]
  );

  const cells = useMemo(() => buildMonthCells(displayYear, monthIndex), [displayYear, monthIndex]);

  const todayStr = useMemo(() => getDateStr(new Date()), []);

  const goPrev = useCallback(() => {
    setSelectedYmd(null);
    if (viewMode === 'year') {
      setCursor((c) => new Date(c.getFullYear() - 1, 0, 1));
    } else {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    }
  }, [viewMode]);

  const goNext = useCallback(() => {
    setSelectedYmd(null);
    if (viewMode === 'year') {
      setCursor((c) => new Date(c.getFullYear() + 1, 0, 1));
    } else {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    }
  }, [viewMode]);

  const loading = budgetLoading || planifLoading || financeLoading || shopLoading || acqLoading;

  const selectedAgg = selectedYmd ? dayMapMonth.get(selectedYmd) : null;

  const openDayFromYear = useCallback((ymd) => {
    if (!ymd) return;
    const mi = parseInt(ymd.slice(5, 7), 10) - 1;
    const y = parseInt(ymd.slice(0, 4), 10);
    setCursor(new Date(y, mi, 1));
    setViewMode('month');
    setSelectedYmd(ymd);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border border-slate-600/50 bg-slate-950/90 shadow-lg">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-white">
            <CalendarDays className="text-violet-400 shrink-0" size={22} />
            {t('finance.calendar.title', 'Calendrier finance')}
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            {t(
              'finance.calendar.subtitle',
              'Vue annuelle type heatmap (comme Sport / Livres / Quêtes) : teinte relative par mois. Passe en vue mois pour zoomer ; clic sur un jour = détail des signaux comptés pour l’intensité.'
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2">
            <div className="flex rounded-lg border border-slate-600 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setSelectedYmd(null);
                  setViewMode('year');
                  setCursor((c) => new Date(c.getFullYear(), 0, 1));
                }}
                className={`px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'year'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t('finance.calendar.viewYear', 'Année')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedYmd(null);
                  setViewMode('month');
                }}
                className={`px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'month'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t('finance.calendar.viewMonth', 'Mois')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                aria-label="Période précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center text-base font-semibold capitalize text-white min-w-[160px]">
                {viewMode === 'year' ? displayYear : formatMonthTitle(displayYear, monthIndex)}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                aria-label="Période suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center text-slate-400 text-sm">
              {t('finance.calendar.loading', 'Chargement des données…')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {t('finance.calendar.totalSpend', 'Dépenses budget')}
                  </div>
                  <div className="text-lg font-bold text-emerald-200 tabular-nums">
                    {formatEur(summary.budgetSpend)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {t('finance.calendar.daysBudget', 'Jours avec dépense')}
                  </div>
                  <div className="text-lg font-bold text-white tabular-nums">{summary.daysWithBudget}</div>
                </div>
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {t('finance.calendar.plannedDays', 'Jours planifiés')}
                  </div>
                  <div className="text-lg font-bold text-sky-200 tabular-nums">{summary.plannedDays}</div>
                </div>
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">
                    {t('finance.calendar.shoppingDone', 'Courses terminées')}
                  </div>
                  <div className="text-lg font-bold text-teal-200 tabular-nums">{summary.shoppingDays}</div>
                </div>
              </div>

              <details className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
                <summary className="cursor-pointer font-medium text-slate-300 flex items-center gap-2 list-none">
                  <Info className="h-3.5 w-3.5 text-slate-500" />
                  {t('finance.calendar.legendTitle', 'Sources affichées par jour')}
                </summary>
                <ul className="mt-2 space-y-1 pl-1 list-disc list-inside">
                  <li>Budget — dépenses enregistrées</li>
                  <li>Dépenses planifiées (hors annulées)</li>
                  <li>Charges fixes mensuelles</li>
                  <li>Bourse — date d&apos;achat des positions</li>
                  <li>Investissements — acquisitions</li>
                  <li>Smart shopping — listes complétées</li>
                  <li>Planificateur — objectifs loisirs (montant le 1er du mois)</li>
                </ul>
              </details>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span>Faible</span>
                {[0, 0.2, 0.45, 0.72, 1].map((u) => (
                  <div
                    key={u}
                    className="w-5 h-3 rounded border border-slate-600"
                    style={{ backgroundColor: calendarHeatmapCompositeBackground(u) }}
                  />
                ))}
                <span>Élevé (échelle relative dans le mois affiché)</span>
              </div>

              {viewMode === 'year' && yearMonthIntensityMaps ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {yearMonthIntensityMaps.map((mapForMonth, mi) => {
                    const dm = buildFinanceCalendarDayMap({
                      year: displayYear,
                      monthIndex: mi,
                      ...financeInputBase,
                    });
                    const sm = monthSummaryFromMap(dm, displayYear, mi);
                    const activeDays = countFinanceActiveDays(mapForMonth, displayYear, mi);
                    return (
                      <div key={mi} className="space-y-3 min-w-0">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{MONTH_NAMES[mi]}</h4>
                          <div className="text-[10px] text-slate-400 shrink-0">
                            {activeDays} jour{activeDays > 1 ? 's' : ''} actif{activeDays > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-2">
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {WEEK_DAYS_SHORT.map((wd, i) => (
                              <div key={i} className="text-center text-[9px] text-slate-500 font-medium">
                                {wd}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {buildMonthCells(displayYear, mi).map((cell) => {
                              if (cell.type === 'pad') {
                                return (
                                  <div key={cell.key} className="aspect-square rounded-sm bg-transparent min-w-0" />
                                );
                              }
                              const inten = mapForMonth.get(cell.dateStr) || null;
                              const isToday = cell.dateStr === todayStr;
                              const st = financeCellStyle(inten, isToday);
                              return (
                                <button
                                  key={cell.key}
                                  type="button"
                                  onClick={() => openDayFromYear(cell.dateStr)}
                                  className={`aspect-square min-w-0 rounded-sm text-[10px] font-semibold flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-violet-500/60 ${st.className}`}
                                  style={st.style}
                                >
                                  <span className={`tabular-nums text-black ${isToday ? 'font-bold' : ''}`}>
                                    {cell.date.getDate()}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-slate-900/70 border border-slate-700/80 p-2 text-center">
                            <div className="text-white font-bold tabular-nums">{formatEur(sm.budgetSpend)}</div>
                            <div className="text-slate-500">Budget (mois)</div>
                          </div>
                          <div className="rounded-md bg-slate-900/70 border border-slate-700/80 p-2 text-center">
                            <div className="text-white font-bold tabular-nums">
                              {sm.daysWithBudget +
                                sm.plannedDays +
                                sm.chargeDays +
                                sm.portfolioDays +
                                sm.shoppingDays +
                                sm.acquisitionDays}
                            </div>
                            <div className="text-slate-500">Jours avec signal</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {viewMode === 'month' ? (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {WEEKDAY_LABELS.map((w) => (
                      <div key={w} className="text-center text-xs text-slate-500 font-medium py-1">
                        {w}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {cells.map((cell) => {
                      if (cell.type === 'pad') {
                        return <div key={cell.key} className="aspect-square rounded-md bg-slate-900/20" />;
                      }
                      const inten = monthIntensityMap.get(cell.dateStr) || null;
                      const isToday = cell.dateStr === todayStr;
                      const st = financeCellStyle(inten, isToday);
                      const dayNum = cell.date.getDate();
                      return (
                        <button
                          key={cell.key}
                          type="button"
                          onClick={() => setSelectedYmd(cell.dateStr)}
                          className={`aspect-square rounded-md text-sm font-semibold flex items-center justify-center transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${st.className}`}
                          style={st.style}
                        >
                          <span className={`tabular-nums text-black ${isToday ? 'font-bold' : ''}`}>
                            {dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {selectedYmd && selectedAgg ? (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/40 bg-slate-950 p-5 space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {new Date(`${selectedYmd}T12:00:00`).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedYmd(null)}
                        className="text-slate-400 hover:text-white p-1"
                        aria-label="Fermer"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Intensité affichée = rang relatif des scores bruts dans le mois du jour (même principe
                      que les autres calendriers).
                    </p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>
                        Dépenses budget : {selectedAgg.budgetCount} · {formatEur(selectedAgg.budgetSpend)}
                      </li>
                      <li>Dépenses planifiées : {selectedAgg.plannedCount}</li>
                      <li>Charges fixes (mensuel) : {selectedAgg.chargeCount}</li>
                      <li>Nouvelles positions (date d&apos;achat) : {selectedAgg.portfolioAdds}</li>
                      <li>Acquisitions investissements : {selectedAgg.acquisitionCount}</li>
                      <li>Courses smart shopping terminées : {selectedAgg.shoppingDone}</li>
                      {selectedAgg.loisirsMois > 0 ? (
                        <li>Objectifs loisirs (mois) : {formatEur(selectedAgg.loisirsMois)}</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceCalendarView;
