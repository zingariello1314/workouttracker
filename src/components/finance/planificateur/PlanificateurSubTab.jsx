import React, { useMemo, lazy } from 'react';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import SkeletonLoader from '../bourse/SkeletonLoader';
import PlanificateurErrorBoundary from './PlanificateurErrorBoundary';
import SubTabWrapper from '../common/SubTabWrapper';

/**
 * ✅ PHASE 2 - Étape 2.1 : Refactorisé pour utiliser SubTabWrapper
 * 
 * Améliorations :
 * - Code réduit de ~105 lignes à ~50 lignes
 * - Réutilisation composant générique
 * - Maintenance facilitée
 */

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
  const { loading, error } = usePlanificateur();

  // ✅ PHASE 2 : Définition des sections
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
    <PlanificateurErrorBoundary>
      <div className="planificateur-sub-tab-container flex flex-col h-full">
        {/* ✅ PHASE 2 : Utilisation du composant générique */}
        <SubTabWrapper
          subTabs={sections}
          defaultSubTab="repartition"
          Skeleton={SkeletonLoader}
          ErrorBoundary={null} // Déjà wrappé par PlanificateurErrorBoundary
          storageKey="finance.planificateur.activeSection"
          enablePrefetch={true}
        />
      </div>
    </PlanificateurErrorBoundary>
  );
};

export default PlanificateurSubTab;
