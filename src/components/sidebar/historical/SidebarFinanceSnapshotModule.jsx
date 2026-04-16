/**
 * Aperçu Finance (sidebar) : mêmes données que le bloc dashboard (planificateur + investissements / bourse),
 * en colonne étroite. La répartition salaire reste en vue condensée (sans sous-onglet déplié).
 * Le module entier est pliable ; l’état est persisté via IndexedDB (clé module.id).
 */

import { memo, useMemo } from 'react';
import { Landmark, Wallet, Gem, CandlestickChart } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useInvestissements } from '../../../hooks/useInvestissements';

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const getAllocationVisual = (cat = {}) => {
  const key = `${cat.id || ''} ${cat.subType || ''} ${cat.type || ''} ${cat.label || ''}`.toLowerCase();
  if (key.includes('loyer')) return { color: '#ef4444', text: 'text-red-200', border: 'border-red-400/30' };
  if (key.includes('course')) return { color: '#f59e0b', text: 'text-amber-200', border: 'border-amber-400/30' };
  if (key.includes('or')) return { color: '#eab308', text: 'text-yellow-200', border: 'border-yellow-400/30' };
  if (key.includes('bourse')) return { color: '#3b82f6', text: 'text-blue-200', border: 'border-blue-400/30' };
  if (key.includes('cash')) return { color: '#10b981', text: 'text-emerald-200', border: 'border-emerald-400/30' };
  if (key.includes('loisir')) return { color: '#8b5cf6', text: 'text-violet-200', border: 'border-violet-400/30' };
  return { color: '#14b8a6', text: 'text-cyan-200', border: 'border-cyan-400/30' };
};

const SidebarFinanceSnapshotModule = memo(({ isExpanded, onToggle, setActiveTab: setActiveTabProp }) => {
  const { setActiveTab: setActiveTabCtx } = useWorkout();
  const setActiveTab = setActiveTabProp || setActiveTabCtx;

  const { salaire, repartition, loading: planLoading } = usePlanificateur();
  const { bourseCrypto, calculateAllocation, loading: investissementsLoading } = useInvestissements();

  const goToPlanificateur = (section = 'repartition') => {
    try {
      localStorage.setItem('finance.activeSubTab', 'planificateur');
      localStorage.setItem('finance.planificateur.activeSection', section);
    } catch {
      // no-op
    }
    setActiveTab?.('finance');
  };

  const goToFinanceSubTab = (subTab = 'investissements') => {
    try {
      localStorage.setItem('finance.activeSubTab', subTab);
    } catch {
      // no-op
    }
    setActiveTab?.('finance');
  };

  const compactAllocations = useMemo(() => {
    const categories = Array.isArray(repartition?.categories) ? repartition.categories : [];
    return categories
      .filter((cat) => cat?.type !== 'surplus' && (Number(cat?.montant) || 0) > 0)
      .map((cat) => ({
        id: cat.id,
        subType: cat.subType,
        type: cat.type,
        label: cat.label || cat.nom || cat.name || cat.subType || 'Allocation',
        montant: Number(cat.montant) || 0,
        ...getAllocationVisual(cat)
      }))
      .sort((a, b) => b.montant - a.montant);
  }, [repartition]);

  const totalAllocation = useMemo(
    () => compactAllocations.reduce((sum, item) => sum + item.montant, 0),
    [compactAllocations]
  );

  const repartitionChartStyle = useMemo(() => {
    if (!compactAllocations.length || totalAllocation <= 0) {
      return { background: 'rgba(51, 65, 85, 0.35)' };
    }
    let cursor = 0;
    const segments = compactAllocations.map((item) => {
      const percent = (item.montant / totalAllocation) * 100;
      const start = cursor;
      cursor += percent;
      return `${item.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    return { background: `conic-gradient(${segments.join(', ')})` };
  }, [compactAllocations, totalAllocation]);

  const allocation = useMemo(() => calculateAllocation?.(), [calculateAllocation]);
  const investmentCards = useMemo(() => {
    const details = allocation?.details || {};
    return [
      {
        key: 'or',
        label: 'Or',
        value: Number(details.valorisationOr) || 0,
        percent: Number(allocation?.or) || 0,
        icon: Gem,
        accent: 'text-amber-200',
        border: 'border-amber-400/30',
        bg: 'bg-amber-500/10'
      },
      {
        key: 'liquidites',
        label: 'Liquidités',
        value: Number(details.totalLiquidites) || 0,
        percent: Number(allocation?.liquidites) || 0,
        icon: Wallet,
        accent: 'text-emerald-200',
        border: 'border-emerald-400/30',
        bg: 'bg-emerald-500/10'
      },
      {
        key: 'bourse',
        label: 'Bourse/Crypto',
        value: Number(details.valorisationBourseCrypto) || 0,
        percent: Number(allocation?.bourseCrypto) || 0,
        icon: CandlestickChart,
        accent: 'text-cyan-200',
        border: 'border-cyan-400/30',
        bg: 'bg-cyan-500/10'
      }
    ];
  }, [allocation]);

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Finance"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon inline-flex items-center justify-center" aria-hidden="true">
            <Landmark className="h-4 w-4 text-amber-300" />
          </span>
          Finance
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content px-0.5 py-2 min-w-0">
          <div
            className="sidebar-finance-snapshot rounded-2xl border border-amber-500/25 bg-gradient-to-b from-slate-950/95 via-amber-950/20 to-slate-950/95 p-3 shadow-inner space-y-3"
            aria-label="Aperçu finance"
          >
            <p className="text-[10px] text-slate-500 px-0.5">Planificateur · investissements · bourse</p>

            <div className="rounded-xl border border-amber-400/20 bg-slate-950/40 p-2.5 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-amber-100">Répartition salaire</h4>
                <p className="text-[10px] text-slate-500">Vue condensée : camembert + allocations</p>
              </div>

              <div className="flex flex-col items-center gap-2">
                {/* Anneau conique masqué dans un cercle (évite le débordement des couleurs hors du disque) */}
                <div className="relative flex h-[7.25rem] w-[7.25rem] shrink-0 items-center justify-center">
                  <div className="pointer-events-none absolute inset-0 rounded-full border border-slate-600/50" aria-hidden />
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="h-full w-full rounded-full" style={repartitionChartStyle} />
                  </div>
                  <div className="relative z-10 flex aspect-square w-[58%] max-h-[58%] items-center justify-center rounded-full border border-slate-700/80 bg-slate-950/95 px-1 shadow-inner">
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400">Alloué</div>
                      <div className="text-base font-bold text-white leading-tight">{formatCurrency(totalAllocation)}</div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Net mensuel : <span className="text-slate-200 font-medium">{formatCurrency(salaire?.netMensuel || 0)}</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-2">
                {planLoading ? (
                  <div className="text-xs text-slate-400">Chargement des allocations…</div>
                ) : compactAllocations.length === 0 ? (
                  <div className="text-xs text-slate-500">Aucune allocation définie.</div>
                ) : (
                  <ul className="space-y-1.5">
                    {compactAllocations.map((item, idx) => {
                      const ratio = totalAllocation > 0 ? (item.montant / totalAllocation) * 100 : 0;
                      return (
                        <li key={item.id || `${item.label}-${idx}`} className={`rounded-md border bg-slate-950/50 px-2 py-1.5 ${item.border}`}>
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-slate-200 truncate inline-flex items-center gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              {item.label}
                            </span>
                            <span className={`${item.text} shrink-0 tabular-nums`}>{formatCurrency(item.montant)}</span>
                          </div>
                          <div className="mt-1 h-1 w-full rounded-full bg-slate-800/90">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio)}%`, backgroundColor: item.color }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={() => goToPlanificateur('repartition')}
                className="w-full h-8 rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-100 text-[11px] font-medium hover:bg-amber-500/25"
              >
                Ouvrir le planificateur
              </button>
            </div>

            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                <h4 className="text-xs font-semibold text-emerald-100">Investissements (aperçu)</h4>
              </div>
              {investissementsLoading ? (
                <div className="text-xs text-slate-400">Chargement…</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {investmentCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.key} className={`rounded-lg border ${card.border} ${card.bg} px-2 py-1.5`}>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Icon className={`w-3 h-3 ${card.accent}`} />
                          {card.label}
                        </div>
                        <div className="text-sm font-semibold text-white tabular-nums">{formatCurrency(card.value)}</div>
                        <div className="text-[10px] text-slate-400">{card.percent.toFixed(1)}% du patrimoine</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => goToFinanceSubTab('investissements')}
                className="w-full h-8 rounded-lg border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 text-[11px] font-medium hover:bg-emerald-500/25"
              >
                Voir investissements
              </button>
            </div>

            <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/5 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <CandlestickChart className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <h4 className="text-xs font-semibold text-cyan-100">Bourse (aperçu)</h4>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="rounded-lg border border-cyan-400/30 bg-slate-900/55 px-2 py-1.5">
                  <div className="text-[10px] text-slate-400">Positions</div>
                  <div className="text-lg font-semibold text-white">{(bourseCrypto?.positions || []).length}</div>
                </div>
                <div className="rounded-lg border border-cyan-400/30 bg-slate-900/55 px-2 py-1.5">
                  <div className="text-[10px] text-slate-400">Montant bourse/crypto</div>
                  <div className="text-sm font-semibold text-white tabular-nums">
                    {formatCurrency(allocation?.details?.valorisationBourseCrypto || 0)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToFinanceSubTab('bourse')}
                className="w-full h-8 rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-100 text-[11px] font-medium hover:bg-cyan-500/25 inline-flex items-center justify-center gap-1.5"
              >
                <CandlestickChart className="w-3.5 h-3.5" />
                Voir bourse
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarFinanceSnapshotModule.displayName = 'SidebarFinanceSnapshotModule';

export default SidebarFinanceSnapshotModule;
