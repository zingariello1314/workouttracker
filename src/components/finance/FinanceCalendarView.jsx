import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Info, X } from 'lucide-react';
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
import { financeTheme as F } from './financeThemeClasses';

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
  const ring = isToday ? ' ring-2 ring-[#5BC49A] ring-offset-1 ring-offset-black' : '';
  if (u < 0.008) {
    return {
      className: `border border-[#339C5A]/32 bg-black${ring}`,
      style: undefined,
      dayTextClass: 'text-[#9ddbb8]',
    };
  }
  return {
    className: `border border-[#339C5A]/22${ring}`.trim(),
    style: { backgroundColor: calendarHeatmapCompositeBackground(Math.min(1, Math.max(0, u))) },
    dayTextClass: 'text-slate-900',
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
 * Calendrier finance : heatmap relative + charte noir / vert (#339C5A).
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
      <section className="rounded-xl border border-[#1e6b47]/55 bg-black p-4">
        <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-[#d4f5e6]">
          <CalendarDays className="shrink-0 text-[#5BC49A]" size={22} />
          {t('finance.calendar.title', 'Calendrier finance')}
        </h3>
        <p className={`mt-1 text-sm leading-relaxed ${F.muted}`}>
          {t(
            'finance.calendar.subtitle',
            'Vue annuelle type heatmap (comme Sport / Livres / Quêtes) : teinte relative par mois. Passe en vue mois pour zoomer ; clic sur un jour = détail des signaux comptés pour l’intensité.'
          )}
        </p>
      </section>

          <section className="rounded-xl border border-[#1e6b47]/55 bg-black p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex overflow-hidden rounded-lg border border-[#339C5A]/40">
              <button
                type="button"
                onClick={() => {
                  setSelectedYmd(null);
                  setViewMode('year');
                  setCursor((c) => new Date(c.getFullYear(), 0, 1));
                }}
                className={`border-r border-[#339C5A]/35 px-3 py-1.5 text-xs font-semibold last:border-r-0 ${
                  viewMode === 'year' ? F.btnSegmentActive : F.btnSegmentIdle
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
                  viewMode === 'month' ? F.btnSegmentActive : F.btnSegmentIdle
                }`}
              >
                {t('finance.calendar.viewMonth', 'Mois')}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className={F.btnIcon}
                aria-label="Période précédente"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-[160px] text-center text-base font-semibold capitalize text-[#e8faf0]">
                {viewMode === 'year' ? displayYear : formatMonthTitle(displayYear, monthIndex)}
              </div>
              <button
                type="button"
                onClick={goNext}
                className={F.btnIcon}
                aria-label="Période suivante"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            </div>
          </section>

          {loading ? (
            <div className={`flex min-h-[200px] items-center justify-center text-sm ${F.muted}`}>
              {t('finance.calendar.loading', 'Chargement des données…')}
            </div>
          ) : (
            <>
              <section className="rounded-xl border border-[#1e6b47]/55 bg-black p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7ecfae]/85">
                  Indicateurs du mois
                </div>
              <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
                <div className={F.inset}>
                  <div className={F.label}>
                    {t('finance.calendar.totalSpend', 'Dépenses budget')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-[#7ecfae]">
                    {formatEur(summary.budgetSpend)}
                  </div>
                </div>
                <div className={F.inset}>
                  <div className={F.label}>
                    {t('finance.calendar.daysBudget', 'Jours avec dépense')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-[#e8faf0]">{summary.daysWithBudget}</div>
                </div>
                <div className={F.inset}>
                  <div className={F.label}>
                    {t('finance.calendar.plannedDays', 'Jours planifiés')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-[#8fd4e8]">{summary.plannedDays}</div>
                </div>
                <div className={F.inset}>
                  <div className={F.label}>
                    {t('finance.calendar.shoppingDone', 'Courses terminées')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-[#6ec9a8]">{summary.shoppingDays}</div>
                </div>
              </div>
              </section>

              <section className="rounded-xl border border-[#1e6b47]/55 bg-black p-3">
              <details className={`rounded-lg border border-[#1e6b47]/50 bg-black/70 px-3 py-2 text-xs ${F.muted}`}>
                <summary className={`flex cursor-pointer list-none items-center gap-2 font-medium text-[#b8e8d0]`}>
                  <Info className="h-3.5 w-3.5 text-[#339C5A]" />
                  {t('finance.calendar.legendTitle', 'Sources affichées par jour')}
                </summary>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
                  <li>Budget — dépenses enregistrées</li>
                  <li>Dépenses planifiées (hors annulées)</li>
                  <li>Charges fixes mensuelles</li>
                  <li>Bourse — date d&apos;achat des positions</li>
                  <li>Investissements — acquisitions</li>
                  <li>Smart shopping — listes complétées</li>
                  <li>Planificateur — objectifs loisirs (montant le 1er du mois)</li>
                </ul>
              </details>

              <div className={`mt-2 flex flex-wrap items-center gap-2 text-[10px] ${F.mutedXs}`}>
                <span>Faible</span>
                {[0, 0.2, 0.45, 0.72, 1].map((u) => (
                  <div
                    key={u}
                    className="h-3 w-5 rounded border border-[#339C5A]/35"
                    style={{ backgroundColor: calendarHeatmapCompositeBackground(u) }}
                  />
                ))}
                <span>Élevé (échelle relative dans le mois affiché)</span>
              </div>
              </section>

              {viewMode === 'year' && yearMonthIntensityMaps ? (
                <section className="rounded-xl border border-[#1e6b47]/55 bg-black p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7ecfae]/85">
                  Vue annuelle par module mensuel
                </div>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                  {yearMonthIntensityMaps.map((mapForMonth, mi) => {
                    const dm = buildFinanceCalendarDayMap({
                      year: displayYear,
                      monthIndex: mi,
                      ...financeInputBase,
                    });
                    const sm = monthSummaryFromMap(dm, displayYear, mi);
                    const activeDays = countFinanceActiveDays(mapForMonth, displayYear, mi);
                    return (
                      <div key={mi} className="min-w-0 space-y-3">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-medium text-[#e8faf0]">{MONTH_NAMES[mi]}</h4>
                          <div className={`shrink-0 text-[10px] ${F.muted}`}>
                            {activeDays} jour{activeDays > 1 ? 's' : ''} actif{activeDays > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[#1e6b47]/45 bg-black p-2">
                          <div className="mb-1 grid grid-cols-7 gap-1">
                            {WEEK_DAYS_SHORT.map((wd, i) => (
                              <div key={i} className="text-center text-[9px] font-medium text-[#6a9e86]">
                                {wd}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {buildMonthCells(displayYear, mi).map((cell) => {
                              if (cell.type === 'pad') {
                                return (
                                  <div key={cell.key} className="aspect-square min-w-0 rounded-sm bg-transparent" />
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
                                  className={`flex aspect-square min-w-0 items-center justify-center rounded-sm text-[10px] font-semibold transition-transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-[#339C5A]/60 ${st.className}`}
                                  style={st.style}
                                >
                                  <span className={`tabular-nums ${st.dayTextClass} ${isToday ? 'font-bold' : ''}`}>
                                    {cell.date.getDate()}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md border border-[#1e6b47]/55 bg-black/80 p-2 text-center">
                            <div className="font-bold tabular-nums text-[#e8faf0]">{formatEur(sm.budgetSpend)}</div>
                            <div className={F.mutedXs}>Budget (mois)</div>
                          </div>
                          <div className="rounded-md border border-[#1e6b47]/55 bg-black/80 p-2 text-center">
                            <div className="font-bold tabular-nums text-[#e8faf0]">
                              {sm.daysWithBudget +
                                sm.plannedDays +
                                sm.chargeDays +
                                sm.portfolioDays +
                                sm.shoppingDays +
                                sm.acquisitionDays}
                            </div>
                            <div className={F.mutedXs}>Jours avec signal</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </section>
              ) : null}

              {viewMode === 'month' ? (
                <section className="rounded-xl border border-[#1e6b47]/55 bg-black p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7ecfae]/85">
                    Vue mensuelle détaillée
                  </div>
                  <div className="mb-2 grid grid-cols-7 gap-2">
                    {WEEKDAY_LABELS.map((w) => (
                      <div key={w} className={`py-1 text-center text-xs font-medium ${F.muted}`}>
                        {w}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {cells.map((cell) => {
                      if (cell.type === 'pad') {
                        return (
                          <div key={cell.key} className={`aspect-square rounded-md border border-[#0d2818]/50 bg-black/40`} />
                        );
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
                          className={`flex aspect-square items-center justify-center rounded-md text-sm font-semibold transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#339C5A]/55 ${st.className}`}
                          style={st.style}
                        >
                          <span className={`tabular-nums ${st.dayTextClass} ${isToday ? 'font-bold' : ''}`}>
                            {dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {selectedYmd && selectedAgg ? (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
                  <div role="dialog" aria-modal="true" className={`${F.modalPanel} space-y-4`}>
                    <div className="flex items-center justify-between gap-2 border-b border-[#1e6b47]/50 pb-3">
                      <h3 className={F.modalTitle}>
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
                        className={`rounded-lg p-1 transition-colors ${F.muted} hover:bg-[#339C5A]/15 hover:text-[#e8faf0]`}
                        aria-label="Fermer"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <p className={F.mutedXs}>
                      Intensité affichée = rang relatif des scores bruts dans le mois du jour (même principe
                      que les autres calendriers).
                    </p>
                    <ul className={`space-y-1 text-sm ${F.body}`}>
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
    </div>
  );
};

export default FinanceCalendarView;
