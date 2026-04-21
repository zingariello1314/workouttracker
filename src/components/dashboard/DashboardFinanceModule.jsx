import { useMemo, useState } from 'react';
import { Landmark, CalendarDays, RefreshCw, Wallet, ChevronDown, ChevronUp, Gem, CandlestickChart } from 'lucide-react';
import { financeTheme as F } from '../finance/financeThemeClasses';
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
        accent: 'text-[#c8efd9]',
        border: 'border-[#339C5A]/45',
        bg: 'bg-black'
      },
      {
        key: 'bourse',
        label: 'Bourse/Crypto',
        value: Number(details.valorisationBourseCrypto) || 0,
        percent: Number(allocation?.bourseCrypto) || 0,
        icon: CandlestickChart,
        accent: 'text-[#8fbfa3]',
        border: 'border-[#1e6b47]/70',
        bg: 'bg-black'
      }
    ];
  }, [allocation]);

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#339C5A]/75 bg-black shadow-[0_0_40px_rgba(51,156,90,0.22)]">
      <div className="relative p-6 md:p-7 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#339C5A]/60 bg-black p-2 shadow-[0_0_20px_rgba(51,156,90,0.2)]">
              <Landmark className="w-6 h-6 text-[#c8efd9]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Finance</h3>
              <p className={`text-xs ${F.muted}`}>Focus Planificateur - Répartition salaire</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToPlanificateur('repartition')}
              className={`h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 ${F.btnSecondary}`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Répartition salaire
            </button>
            <button
              type="button"
              onClick={() => goToPlanificateur('loisirs')}
              className={`h-8 px-3 text-xs font-medium ${F.btnSecondary}`}
            >
              Planification loisirs
            </button>
            <button
              type="button"
              onClick={() => goToPlanificateur('3ans')}
              className={`h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 ${F.btnSecondary}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Plan 3 ans
            </button>
            <button
              type="button"
              onClick={() => goToPlanificateur('sync')}
              className={`h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 ${F.btnSecondary}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
          </div>
        </div>

        <div className={`rounded-2xl ${F.inset} space-y-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[#e8faf0]">Répartition salaire</h4>
              <p className={F.mutedXs}>
                {isRepartitionExpanded
                  ? 'Vue complète identique à l’onglet Finance'
                  : 'Vue condensée: camembert + allocations'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRepartitionExpanded((prev) => !prev)}
              className={`h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 ${F.btnPrimary}`}
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
              <div className="rounded-xl border border-[#1e6b47]/55 bg-black p-4 flex flex-col items-center justify-center gap-3">
                <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                  <div className="pointer-events-none absolute inset-0 rounded-full border border-[#339C5A]/35" aria-hidden />
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="h-full w-full rounded-full" style={repartitionChartStyle} />
                  </div>
                  <div className="relative z-10 flex aspect-square w-[64%] max-h-[64%] items-center justify-center rounded-full border border-[#339C5A]/50 bg-black px-2 shadow-inner">
                    <div className="text-center">
                      <div className={F.mutedXs}>Alloué</div>
                      <div className="text-sm font-semibold text-white">{formatCurrency(totalAllocation)}</div>
                    </div>
                  </div>
                </div>
                <div className={F.mutedXs}>
                  Net mensuel: <span className="text-[#d4f5e6]">{formatCurrency(salaire?.netMensuel || 0)}</span>
                </div>
              </div>
              <div className={`rounded-xl ${F.insetMuted}`}>
                {planLoading ? (
                  <div className={`text-sm ${F.muted}`}>Chargement des allocations...</div>
                ) : compactAllocations.length === 0 ? (
                  <div className={`text-sm ${F.muted}`}>Aucune allocation définie pour le moment.</div>
                ) : (
                  <div className="space-y-2">
                    {compactAllocations.map((item, idx) => {
                      const ratio = totalAllocation > 0 ? (item.montant / totalAllocation) * 100 : 0;
                      return (
                        <div key={item.id || `${item.label}-${idx}`} className={`rounded-lg border border-[#1e6b47]/50 bg-black p-2 ${item.border}`}>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-[#e8faf0] truncate inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                              {item.label}
                            </span>
                            <span className={`${item.text} shrink-0`}>{formatCurrency(item.montant)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#0a1812]">
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
          <div className={`rounded-2xl border border-[#1e6b47]/60 bg-black p-4 space-y-3 shadow-inner shadow-black/40`}>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-[#7ecfae]" />
              <h4 className="text-sm font-semibold text-[#e8faf0]">Investissements (aperçu)</h4>
            </div>
            {investissementsLoading ? (
              <div className={`text-sm ${F.muted}`}>Chargement des investissements...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {investmentCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.key} className={`rounded-lg border ${card.border} ${card.bg} p-2.5`}>
                      <div className={`flex items-center gap-1.5 text-[11px] ${F.muted}`}>
                        <Icon className={`w-3.5 h-3.5 ${card.accent}`} />
                        {card.label}
                      </div>
                      <div className="text-sm font-semibold text-white mt-1">{formatCurrency(card.value)}</div>
                      <div className={`text-[11px] ${F.muted}`}>{card.percent.toFixed(1)}% du patrimoine</div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => goToFinanceSubTab('investissements')}
              className={`h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 ${F.btnPrimary}`}
            >
              Voir investissements
            </button>
          </div>

          <div className={`rounded-2xl border border-[#1e6b47]/60 bg-black p-4 space-y-3 shadow-inner shadow-black/40`}>
            <div className="flex items-center gap-2">
              <CandlestickChart className="w-4 h-4 text-[#8fbfa3]" />
              <h4 className="text-sm font-semibold text-[#e8faf0]">Bourse (aperçu)</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#339C5A]/40 bg-black p-2.5">
                <div className={F.mutedXs}>Positions</div>
                <div className="text-lg font-semibold text-white">{(bourseCrypto?.positions || []).length}</div>
              </div>
              <div className="rounded-lg border border-[#339C5A]/40 bg-black p-2.5">
                <div className={F.mutedXs}>Montant bourse/crypto</div>
                <div className="text-sm font-semibold text-white">
                  {formatCurrency(allocation?.details?.valorisationBourseCrypto || 0)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => goToFinanceSubTab('bourse')}
              className={`h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 ${F.btnPrimary}`}
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

