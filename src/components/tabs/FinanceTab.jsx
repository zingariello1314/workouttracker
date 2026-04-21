import React, { useEffect, Suspense, lazy, useMemo } from 'react';
import { useTranslation } from '../../utils/translations';
import { FinanceProvider } from '../../context/FinanceContext';
import ErrorBoundary from '../ui/ErrorBoundary';
import { useNavigationCache } from '../../hooks/useNavigationCache';
import { useFinancePerformance } from '../../hooks/useFinancePerformance';
import { financeTheme as F } from '../finance/financeThemeClasses';

// ✅ PHASE 2 : Lazy loading des sous-onglets Finance
const BourseSubTab = lazy(() => import('../finance/bourse/BourseSubTab'));
const BudgetSubTab = lazy(() => import('../finance/budget/BudgetSubTab'));
const InvestissementsSubTab = lazy(() => import('../finance/investissements/InvestissementsSubTab'));
const SmartShoppingSubTab = lazy(() => import('../finance/smartShopping/SmartShoppingSubTab'));
const PlanificateurSubTab = lazy(() => import('../finance/planificateur/PlanificateurSubTab'));
const SyntheseSubTab = lazy(() => import('../finance/synthese/SyntheseSubTab'));
const FinanceCalendarView = lazy(() => import('../finance/FinanceCalendarView'));

// Skeleton loader pour les sous-onglets
const FinanceSubTabSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="text-4xl mb-4 animate-spin">💰</div>
      <div className="font-semibold uppercase tracking-wide text-[#8fbfa3]">CHARGEMENT...</div>
    </div>
  </div>
);

const FinanceTab = () => {
  const t = useTranslation();
  
  // ✅ PHASE 4 - Étape 4.1 : Mesure performance
  const { measureOperation } = useFinancePerformance('FinanceTab');
  
  // ✅ PHASE 3 - Étape 3.2 : Cache navigation avec hook réutilisable
  const [activeSubTab, setActiveSubTab] = useNavigationCache('finance.activeSubTab', 'bourse', {
    enableCache: true,
    maxRetries: 3
  });

  // Émettre un événement lors du changement de sous-onglet pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSubTab, isSubTab: true } 
    }));
  }, [activeSubTab]);

  // ✅ PHASE 1 : Memoization subTabs pour éviter re-renders
  // ✅ CORRECTION : Mapping ID -> labelKey pour éviter erreur traduction
  const subTabs = useMemo(() => [
    { id: 'bourse', labelKey: 'finance.subTabs.bourse', icon: '📈' },
    { id: 'budget', labelKey: 'finance.subTabs.budget', icon: '💰' },
    { id: 'investissements', labelKey: 'finance.subTabs.investissements', icon: '🥇' },
    { id: 'smart-shopping', labelKey: 'finance.subTabs.smartShopping', icon: '🛒' },
    { id: 'planificateur', labelKey: 'finance.subTabs.planificateur', icon: '📅' },
    { id: 'calendrier', labelKey: 'finance.subTabs.calendrier', icon: '🗓️' },
    { id: 'synthese', labelKey: 'finance.subTabs.synthese', icon: '📊' }
  ], []);

  // ✅ CORRECTION : Map pour convertir ID en labelKey (évite erreur traduction)
  const labelKeyMap = useMemo(() => {
    const map = {};
    subTabs.forEach(tab => {
      map[tab.id] = tab.labelKey;
    });
    return map;
  }, [subTabs]);

  // ✅ PHASE 1 : Map des composants pour lookup dynamique (évite switch redondant)
  const componentMap = useMemo(() => ({
    'bourse': BourseSubTab,
    'budget': BudgetSubTab,
    'investissements': InvestissementsSubTab,
    'smart-shopping': SmartShoppingSubTab,
    'planificateur': PlanificateurSubTab,
    'calendrier': FinanceCalendarView,
    'synthese': SyntheseSubTab
  }), []);

  const renderSubTabContent = () => {
    const ActiveComponent = componentMap[activeSubTab] || BourseSubTab;
    return <ActiveComponent />;
  };

  return (
    <FinanceProvider>
      <div className="relative min-h-screen">
        {/* Contenu avec z-index relatif */}
        <div className="relative z-10 finance-tab-container min-h-[calc(100vh-140px)]">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-[#d4f5e6]">
            {t('finance.title')}
          </h1>
          <p className="text-[#8fbfa3]">
            {t('finance.subtitle')}
          </p>
        </div>

        {/* Navigation sous-onglets */}
        <div className="finance-sidebar mb-6">
          <nav className="sub-tabs-navigation flex flex-wrap gap-2">
            {subTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                data-subtab={tab.id}
                data-tab={`finance-${tab.id}`}
                aria-selected={activeSubTab === tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`${activeSubTab === tab.id ? F.btnPrimary : F.btnSecondary} flex items-center gap-2`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{t(tab.labelKey)}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu sous-onglet actif avec ErrorBoundary et Suspense */}
        <div className="finance-main-content p-1" data-subtab-content={activeSubTab}>
          <ErrorBoundary
            context={{ activeSubTab, tab: 'finance' }}
            title={`Erreur dans ${t(labelKeyMap[activeSubTab] || 'finance.subTabs.bourse')}`}
            message="Une erreur s'est produite dans ce sous-onglet. Vous pouvez réessayer ou changer de sous-onglet."
          >
            <Suspense fallback={<FinanceSubTabSkeleton />}>
              {renderSubTabContent()}
            </Suspense>
          </ErrorBoundary>
        </div>
        </div>
        </div>
      </div>
    </FinanceProvider>
  );
};

export default FinanceTab;
