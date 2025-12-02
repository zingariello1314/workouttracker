/**
 * Composant principal pour l'onglet Budget Personnel
 * Contient les sous-onglets : Dashboard, Catégories, Calendrier
 */

import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import SkeletonLoader from './SkeletonLoader';

// Lazy loading des sous-composants
const DashboardSubTab = lazy(() => import('./DashboardSubTab'));
const CategoryManagerSubTab = lazy(() => import('./CategoryManagerSubTab'));
const CalendarPredictiveSubTab = lazy(() => import('./CalendarPredictiveSubTab'));

const BudgetTab = () => {
  const t = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const { loading, error } = useBudget();

  const subTabs = useMemo(() => [
    { id: 'dashboard', labelKey: 'budget.subTabs.dashboard', icon: '📊' },
    { id: 'categories', labelKey: 'budget.subTabs.categories', icon: '🏗️' },
    { id: 'calendrier', labelKey: 'budget.subTabs.calendrier', icon: '📅' }
  ], []);

  const renderSubTabContent = () => {
    if (loading) {
      return <SkeletonLoader type="budget-tab" />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Erreur de chargement</h2>
          <p className="text-lg text-slate-300">{error}</p>
        </div>
      );
    }

    switch (activeSubTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<SkeletonLoader type="dashboard" />}>
            <DashboardSubTab />
          </Suspense>
        );
      case 'categories':
        return (
          <Suspense fallback={<SkeletonLoader type="category-manager" />}>
            <CategoryManagerSubTab />
          </Suspense>
        );
      case 'calendrier':
        return (
          <Suspense fallback={<SkeletonLoader type="calendar" />}>
            <CalendarPredictiveSubTab />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<SkeletonLoader type="dashboard" />}>
            <DashboardSubTab />
          </Suspense>
        );
    }
  };

  return (
    <div className="budget-tab-container">
      {/* Navigation sous-onglets */}
      <div className="mb-6">
        <nav className="flex flex-wrap gap-2">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu sous-onglet actif */}
      <div className="budget-content">
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default BudgetTab;

