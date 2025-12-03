import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import SkeletonLoader from '../bourse/SkeletonLoader';

// Lazy loading pour performance
const RepartitionSalaireSubTab = lazy(() => import('./RepartitionSalaireSubTab'));
const PlanificationLoisirsSubTab = lazy(() => import('./PlanificationLoisirsSubTab'));
const Planification3AnsSubTab = lazy(() => import('./Planification3AnsSubTab'));
const SynchronisationSubTab = lazy(() => import('./SynchronisationSubTab'));

const PlanificateurSubTabSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full p-4 text-slate-200">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-12 w-12 bg-slate-700 rounded-full mb-4"></div>
      <div className="h-4 w-48 bg-slate-700 rounded mb-2"></div>
      <div className="h-4 w-32 bg-slate-700 rounded"></div>
    </div>
  </div>
);

const PlanificateurSubTab = () => {
  const t = useTranslation();
  const { loading, error } = usePlanificateur();
  const [activeSection, setActiveSection] = useState('repartition');

  const sections = useMemo(() => [
    { 
      id: 'repartition', 
      labelKey: 'finance.planificateur.sections.repartition', 
      icon: '💰', 
      component: RepartitionSalaireSubTab 
    },
    { 
      id: 'loisirs', 
      labelKey: 'finance.planificateur.sections.loisirs', 
      icon: '🎮', 
      component: PlanificationLoisirsSubTab 
    },
    { 
      id: '3ans', 
      labelKey: 'finance.planificateur.sections.3ans', 
      icon: '📅', 
      component: Planification3AnsSubTab 
    },
    { 
      id: 'sync', 
      labelKey: 'finance.planificateur.sections.sync', 
      icon: '🔄', 
      component: SynchronisationSubTab 
    }
  ], []);

  const ActiveComponent = sections.find(section => section.id === activeSection)?.component;

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <p className="text-red-400 font-semibold mb-2">Erreur de chargement du planificateur</p>
          <p className="text-slate-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planificateur-sub-tab-container flex flex-col h-full">
      {/* Navigation sections */}
      <nav className="sub-sections-navigation flex gap-4 p-4 bg-slate-800/50 rounded-t-lg border-b border-slate-700/50 mb-4">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`sub-section-button flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200
              ${activeSection === section.id
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
          >
            <span className="text-lg">{section.icon}</span>
            <span className="text-sm font-medium">{t(section.labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Main content area */}
      <main className="planificateur-main-content flex-1 p-6 bg-slate-800/50 rounded-b-lg">
        <Suspense fallback={<SkeletonLoader />}>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </main>
    </div>
  );
};

export default PlanificateurSubTab;
