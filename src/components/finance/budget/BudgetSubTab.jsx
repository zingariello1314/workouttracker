import React, { useMemo, lazy } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import BudgetErrorBoundary from './BudgetErrorBoundary';
import BudgetPersonnelSyncListener from './BudgetPersonnelSyncListener';
import SubTabWrapper from '../common/SubTabWrapper';
import '../financeSubtabsThemeOverrides.css';

/**
 * ✅ PHASE 2 - Étape 2.1 : Refactorisé pour utiliser SubTabWrapper
 * 
 * Améliorations :
 * - Code réduit de ~100 lignes à ~30 lignes
 * - Réutilisation composant générique
 * - Maintenance facilitée
 */

// Lazy loading pour performance
const DashboardSubTab = lazy(() => import('./DashboardSubTab'));
const CategoryManagerSubTab = lazy(() => import('./CategoryManagerSubTab'));
const CalendarPredictiveSubTab = lazy(() => import('./CalendarPredictiveSubTab'));

const BudgetSubTabSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-slate-200">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-12 w-12 bg-slate-700 rounded-full mb-4"></div>
      <div className="h-4 w-48 bg-slate-700 rounded mb-2"></div>
      <div className="h-4 w-32 bg-slate-700 rounded"></div>
    </div>
  </div>
);

const BudgetSubTab = () => {
  const t = useTranslation();
  const { loading } = useBudget();

  // ✅ PHASE 2 : Définition des sous-onglets
  const subTabs = useMemo(() => [
    { id: 'dashboard', labelKey: 'finance.budget.subTabs.dashboard', icon: '📊', component: DashboardSubTab },
    { id: 'categories', labelKey: 'finance.budget.subTabs.categories', icon: '🏗️', component: CategoryManagerSubTab },
    { id: 'calendar', labelKey: 'finance.budget.subTabs.calendar', icon: '📅', component: CalendarPredictiveSubTab }
  ], []);

  if (loading) {
    return <BudgetSubTabSkeleton />;
  }

  return (
    <div className="budget-tab-container finance-dark-green-scope min-h-[calc(100vh-140px)] flex flex-col space-y-4">
      <BudgetPersonnelSyncListener />
      {/* Header */}
      <div className="rounded-xl border border-[#1e6b47]/60 bg-black p-4">
        <h2 className="mb-1 text-2xl font-bold text-[#d4f5e6]">{t('finance.subTabs.budget')}</h2>
        <p className="text-sm text-[#8fbfa3]">Modules budget : tableau de bord, catégories et calendrier prédictif.</p>
      </div>

      {/* ✅ PHASE 2 : Utilisation du composant générique */}
      <SubTabWrapper
        subTabs={subTabs}
        defaultSubTab="dashboard"
        Skeleton={BudgetSubTabSkeleton}
        ErrorBoundary={BudgetErrorBoundary}
        storageKey="finance.budget.activeSubTab"
        enablePrefetch={true}
      />
    </div>
  );
};

export default BudgetSubTab;

