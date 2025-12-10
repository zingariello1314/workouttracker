import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import BudgetErrorBoundary from './BudgetErrorBoundary';

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
  const [activeSubTab, setActiveSubTab] = useState('dashboard');

  // Émettre un événement lors du changement de sous-onglet pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSubTab, isSubTab: true } 
    }));
  }, [activeSubTab]);

  const subTabs = [
    { id: 'dashboard', labelKey: 'finance.budget.subTabs.dashboard', icon: '📊', component: DashboardSubTab },
    { id: 'categories', labelKey: 'finance.budget.subTabs.categories', icon: '🏗️', component: CategoryManagerSubTab },
    { id: 'calendar', labelKey: 'finance.budget.subTabs.calendar', icon: '📅', component: CalendarPredictiveSubTab }
  ];

  const ActiveComponent = subTabs.find(tab => tab.id === activeSubTab)?.component;

  if (loading) {
    return <BudgetSubTabSkeleton />;
  }

  return (
    <div className="budget-tab-container min-h-[calc(100vh-140px)] flex flex-col">
      {/* Header avec navigation */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 p-4">
        <h2 className="text-2xl font-bold text-white mb-4">{t('finance.subTabs.budget')}</h2>
        <nav className="flex gap-2 flex-wrap">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
                ${activeSubTab === tab.id
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-sm font-medium">{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 p-6 bg-slate-800/50">
        <BudgetErrorBoundary>
          <Suspense fallback={<BudgetSubTabSkeleton />}>
            {ActiveComponent && <ActiveComponent />}
          </Suspense>
        </BudgetErrorBoundary>
      </main>
    </div>
  );
};

export default BudgetSubTab;

