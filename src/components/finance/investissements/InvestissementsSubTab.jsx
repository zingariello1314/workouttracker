import React, { useMemo, lazy } from 'react';
import { useInvestissements } from '../../../hooks/useInvestissements';
import InvestissementsErrorBoundary from './InvestissementsErrorBoundary';
import SubTabWrapper from '../common/SubTabWrapper';
import '../financeSubtabsThemeOverrides.css';

/**
 * ✅ PHASE 2 - Étape 2.1 : Refactorisé pour utiliser SubTabWrapper
 * 
 * Améliorations :
 * - Code réduit de ~80 lignes à ~30 lignes
 * - Réutilisation composant générique
 * - Maintenance facilitée
 */

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
  const { loading } = useInvestissements();

  // ✅ PHASE 2 : Définition des sous-onglets
  const subTabs = useMemo(() => [
    { id: 'dashboard', labelKey: 'finance.investissements.subTabs.dashboard', icon: '📊', component: DashboardUnifieSubTab },
    { id: 'or', labelKey: 'finance.investissements.subTabs.or', icon: '🥇', component: OrPhysiqueSubTab },
    { id: 'liquidites', labelKey: 'finance.investissements.subTabs.liquidites', icon: '💰', component: LiquiditesSubTab },
    { id: 'bourse-crypto', labelKey: 'finance.investissements.subTabs.bourseCrypto', icon: '📈', component: BourseCryptoSubTab }
  ], []);

  if (loading) {
    return <InvestissementsSubTabSkeleton />;
  }

  return (
    <div className="investissements-sub-tab-container finance-dark-green-scope flex h-full flex-col space-y-4">
      {/* ✅ PHASE 2 : Utilisation du composant générique */}
      <SubTabWrapper
        subTabs={subTabs}
        defaultSubTab="dashboard"
        Skeleton={InvestissementsSubTabSkeleton}
        ErrorBoundary={InvestissementsErrorBoundary}
        storageKey="finance.investissements.activeSubTab"
        enablePrefetch={true}
      />
    </div>
  );
};

export default InvestissementsSubTab;
