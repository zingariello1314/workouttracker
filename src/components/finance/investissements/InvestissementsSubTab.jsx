import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useInvestissements } from '../../../hooks/useInvestissements';

// Lazy loading pour performance
const OrPhysiqueSubTab = lazy(() => import('./OrPhysiqueSubTab'));
const LiquiditesSubTab = lazy(() => import('./LiquiditesSubTab'));
const BourseCryptoSubTab = lazy(() => import('./BourseCryptoSubTab'));
const DashboardUnifieSubTab = lazy(() => import('./DashboardUnifieSubTab'));

const InvestissementsSubTabSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-slate-200">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-12 w-12 bg-slate-700 rounded-full mb-4"></div>
      <div className="h-4 w-48 bg-slate-700 rounded mb-2"></div>
      <div className="h-4 w-32 bg-slate-700 rounded"></div>
    </div>
  </div>
);

const InvestissementsSubTab = () => {
  const t = useTranslation();
  const { loading } = useInvestissements();
  const [activeSubTab, setActiveSubTab] = useState('dashboard');

  // Émettre un événement lors du changement de sous-onglet pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSubTab, isSubTab: true } 
    }));
  }, [activeSubTab]);

  const subTabs = useMemo(() => [
    { id: 'dashboard', labelKey: 'finance.investissements.subTabs.dashboard', icon: '📊', component: DashboardUnifieSubTab },
    { id: 'or', labelKey: 'finance.investissements.subTabs.or', icon: '🥇', component: OrPhysiqueSubTab },
    { id: 'liquidites', labelKey: 'finance.investissements.subTabs.liquidites', icon: '💰', component: LiquiditesSubTab },
    { id: 'bourse-crypto', labelKey: 'finance.investissements.subTabs.bourseCrypto', icon: '📈', component: BourseCryptoSubTab }
  ], []);

  const ActiveComponent = subTabs.find(tab => tab.id === activeSubTab)?.component;

  if (loading) {
    return <InvestissementsSubTabSkeleton />;
  }

  return (
    <div className="investissements-sub-tab-container flex flex-col h-full">
      {/* Sub-navigation */}
      <nav className="sub-tabs-navigation flex gap-4 p-4 bg-slate-800/50 rounded-t-lg border-b border-slate-700/50 mb-4">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`sub-tab-button flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200
              ${activeSubTab === tab.id
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-sm font-medium">{t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Main content area */}
      <main className="investissements-main-content flex-1 p-6 bg-slate-800/50 rounded-b-lg">
        <Suspense fallback={<InvestissementsSubTabSkeleton />}>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </main>
    </div>
  );
};

export default InvestissementsSubTab;
