import { useMemo, useState } from 'react';
import { Landmark, CalendarDays, RefreshCw, Wallet, ChevronDown, ChevronUp, Gem, CandlestickChart } from 'lucide-react';
import { FinanceProvider } from '../../context/FinanceContext';
import { useWorkout } from '../../context/WorkoutContext';
import { usePlanificateur } from '../../hooks/usePlanificateur';
import { useInvestissements } from '../../hooks/useInvestissements';
import RepartitionSalaireSubTab from '../finance/planificateur/RepartitionSalaireSubTab';

const DashboardFinanceModule = () => {
  const { setActiveTab } = useWorkout();
  const [isRepartitionExpanded, setIsRepartitionExpanded] = useState(false);
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

  const totalAllocation = useMemo(() => {
    return compactAllocations.reduce((sum, item) => sum + item.montant, 0);
  }, [compactAllocations]);

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
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-950/90 via-amber-950/30 to-emerald-950/20 shadow-[0_0_80px_rgba(245,158,11,0.18)]">
      <div className="relative p-6 md:p-7 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/20 border border-amber-300/40 p-2">
              <Landmark className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Finance</h3>
              <p className="text-xs text-slate-300">Focus Planificateur - Répartition salaire</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToPlanificateur('repartition')}
              className="h-8 px-3 rounded-lg border border-amber-400/50 bg-amber-500/20 text-amber-100 text-xs font-medium hover:bg-amber-500/30 inline-flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              Répartition salaire
            </button>
            <button
              type="button"
              onClick={() => goToPlanificateur('loisirs')}
              className="h-8 px-3 rounded-lg border border-emerald-400/45 bg-emerald-500/20 text-emerald-100 text-xs font-medium hover:bg-emerald-500/30"
            >
              Planification loisirs
            </button>
            <button
              type="button"
              onClick={() => goToPlanificateur('3ans')}
              className="h-8 px-3 rounded-lg border border-cyan-400/45 bg-cyan-500/20 text-cyan-100 text-xs font-medium hover:bg-cyan-500/30 inline-flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Plan 3 ans
            </button>
            <button
              type="button"
              onClick={() => goToPlanificateur('sync')}
              className="h-8 px-3 rounded-lg border border-violet-400/45 bg-violet-500/20 text-violet-100 text-xs font-medium hover:bg-violet-500/30 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-slate-950/35 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-amber-100">Répartition salaire</h4>
              <p className="text-[11px] text-slate-400">
                {isRepartitionExpanded
                  ? 'Vue complète identique à l’onglet Finance'
                  : 'Vue condensée: camembert + allocations'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRepartitionExpanded((prev) => !prev)}
              className="h-8 px-3 rounded-lg border border-amber-400/45 bg-amber-500/15 text-amber-100 text-xs font-medium hover:bg-amber-500/30 inline-flex items-center gap-1.5"
            >
              {isRepartitionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {isRepartitionExpanded ? 'Plier' : 'Déplier'}
            </button>
          </div>

          {isRepartitionExpanded ? (
            <FinanceProvider>
              <RepartitionSalaireSubTab />
            </FinanceProvider>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
              <div className="rounded-xl border border-amber-500/30 bg-slate-900/55 p-4 flex flex-col items-center justify-center gap-3">
                <div className="relative w-40 h-40 rounded-full p-2" style={repartitionChartStyle}>
                  <div className="absolute inset-[18%] rounded-full bg-slate-950/90 border border-slate-700/80 grid place-items-center">
                    <div className="text-center">
                      <div className="text-[11px] text-slate-400">Alloué</div>
                      <div className="text-sm font-semibold text-white">{formatCurrency(totalAllocation)}</div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Net mensuel: <span className="text-slate-200">{formatCurrency(salaire?.netMensuel || 0)}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/45 p-3">
                {planLoading ? (
                  <div className="text-sm text-slate-300">Chargement des allocations...</div>
                ) : compactAllocations.length === 0 ? (
                  <div className="text-sm text-slate-400">Aucune allocation définie pour le moment.</div>
                ) : (
                  <div className="space-y-2">
                    {compactAllocations.map((item, idx) => {
                      const ratio = totalAllocation > 0 ? (item.montant / totalAllocation) * 100 : 0;
                      return (
                        <div key={item.id || `${item.label}-${idx}`} className={`rounded-lg border bg-slate-950/55 p-2 ${item.border}`}>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-200 truncate inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              {item.label}
                            </span>
                            <span className={`${item.text} shrink-0`}>{formatCurrency(item.montant)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio)}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-emerald-200" />
              <h4 className="text-sm font-semibold text-emerald-100">Investissements (aperçu)</h4>
            </div>
            {investissementsLoading ? (
              <div className="text-sm text-slate-300">Chargement des investissements...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {investmentCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.key} className={`rounded-lg border ${card.border} ${card.bg} p-2.5`}>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Icon className={`w-3.5 h-3.5 ${card.accent}`} />
                        {card.label}
                      </div>
                      <div className="text-sm font-semibold text-white mt-1">{formatCurrency(card.value)}</div>
                      <div className="text-[11px] text-slate-300">{card.percent.toFixed(1)}% du patrimoine</div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => goToFinanceSubTab('investissements')}
              className="h-8 px-3 rounded-lg border border-emerald-400/45 bg-emerald-500/15 text-emerald-100 text-xs font-medium hover:bg-emerald-500/30 inline-flex items-center gap-1.5"
            >
              Voir investissements
            </button>
          </div>

          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CandlestickChart className="w-4 h-4 text-cyan-200" />
              <h4 className="text-sm font-semibold text-cyan-100">Bourse (aperçu)</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-cyan-400/30 bg-slate-900/55 p-2.5">
                <div className="text-[11px] text-slate-400">Positions</div>
                <div className="text-lg font-semibold text-white">{(bourseCrypto?.positions || []).length}</div>
              </div>
              <div className="rounded-lg border border-cyan-400/30 bg-slate-900/55 p-2.5">
                <div className="text-[11px] text-slate-400">Montant bourse/crypto</div>
                <div className="text-sm font-semibold text-white">
                  {formatCurrency(allocation?.details?.valorisationBourseCrypto || 0)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => goToFinanceSubTab('bourse')}
              className="h-8 px-3 rounded-lg border border-cyan-400/45 bg-cyan-500/15 text-cyan-100 text-xs font-medium hover:bg-cyan-500/30 inline-flex items-center gap-1.5"
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              Voir bourse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFinanceModule;

