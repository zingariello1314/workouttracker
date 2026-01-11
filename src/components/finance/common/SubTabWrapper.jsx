/**
 * Composant générique pour wrapper les sous-onglets Finance
 * 
 * ✅ PHASE 2 - Étape 2.1 : Composant générique pour éliminer duplication
 * 
 * Fonctionnalités :
 * - Prefetch intelligent des modules
 * - Memoization automatique
 * - ErrorBoundary optionnel
 * - Skeleton loader personnalisable
 * - Navigation avec état persistant
 * 
 * @module components/finance/common/SubTabWrapper
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * @typedef {Object} SubTab
 * @property {string} id - Identifiant unique du sous-onglet
 * @property {string} labelKey - Clé de traduction pour le label
 * @property {string} icon - Emoji ou icône
 * @property {string|Function} component - Chemin du composant ou composant lazy
 */

/**
 * Composant générique SubTabWrapper
 * 
 * @param {Object} props
 * @param {Array<SubTab>} props.subTabs - Liste des sous-onglets
 * @param {string} props.defaultSubTab - Sous-onglet actif par défaut
 * @param {React.ComponentType} [props.Skeleton] - Composant skeleton loader
 * @param {React.ComponentType} [props.ErrorBoundary] - Composant ErrorBoundary
 * @param {Function} [props.onTabChange] - Callback appelé lors du changement d'onglet
 * @param {string} [props.storageKey] - Clé localStorage pour persister l'état (optionnel)
 * @param {boolean} [props.enablePrefetch] - Activer le prefetch (défaut: true)
 */
const SubTabWrapper = ({
  subTabs,
  defaultSubTab,
  Skeleton,
  ErrorBoundary,
  onTabChange,
  storageKey,
  enablePrefetch = true
}) => {
  const t = useTranslation();
  
  // ✅ PHASE 2 : État avec persistance localStorage si storageKey fourni
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved && subTabs.some(tab => tab.id === saved)) {
          return saved;
        }
      } catch (error) {
        console.warn(`[SubTabWrapper] Erreur lecture localStorage pour ${storageKey}:`, error);
      }
    }
    return defaultSubTab;
  });

  // ✅ PHASE 2 : Sauvegarder état dans localStorage si storageKey fourni
  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, activeSubTab);
      } catch (error) {
        console.warn(`[SubTabWrapper] Erreur sauvegarde localStorage pour ${storageKey}:`, error);
      }
    }
  }, [activeSubTab, storageKey]);

  // ✅ PHASE 2 : Émettre événement pour rotation images profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSubTab, isSubTab: true } 
    }));
  }, [activeSubTab]);

  // ✅ PHASE 2 : Memoization subTabs pour éviter re-renders
  const memoizedSubTabs = useMemo(() => subTabs, [subTabs]);

  // ✅ PHASE 2 : Map des composants lazy
  const componentMap = useMemo(() => {
    const map = {};
    memoizedSubTabs.forEach(tab => {
      if (tab.component) {
        // Si c'est déjà un composant lazy, l'utiliser directement
        if (typeof tab.component === 'function' && tab.component._payload) {
          map[tab.id] = tab.component;
        } else if (typeof tab.component === 'string') {
          // Sinon, créer lazy component depuis le chemin
          map[tab.id] = lazy(() => import(`../${tab.component}`));
        } else {
          // Composant direct (non lazy)
          map[tab.id] = tab.component;
        }
      }
    });
    return map;
  }, [memoizedSubTabs]);

  // ✅ PHASE 3 - Étape 3.3 : Prefetch intelligent amélioré pour composants lazy
  useEffect(() => {
    if (!enablePrefetch) return;

    const prefetchComponent = (tab) => {
      if (!tab.component) return;

      // ✅ PHASE 3.3 : Prefetch composants lazy (React.lazy)
      if (tab.component._payload) {
        // Composant lazy React - déclencher le chargement
        try {
          tab.component._payload._result.then(() => {
            // Composant chargé avec succès
          }).catch(() => {
            // Ignorer erreurs de prefetch
          });
        } catch (e) {
          // Ignorer erreurs
        }
      } else if (typeof tab.component === 'string') {
        // Chemin string - import dynamique
        import(`../${tab.component}`).catch(err => {
          console.warn(`[SubTabWrapper] Prefetch failed for ${tab.id}:`, err);
        });
      } else if (typeof tab.component === 'function' && tab.component.preload) {
        // Composant avec méthode preload
        tab.component.preload();
      }
    };

    const prefetchAll = () => {
      memoizedSubTabs.forEach(tab => {
        if (tab.id !== activeSubTab) {
          prefetchComponent(tab);
        }
      });
    };

    // ✅ PHASE 3.3 : Prefetch immédiat au montage + au survol
    // Prefetch immédiat (non-bloquant)
    if (typeof requestIdleCallback !== 'undefined') {
      const idleCallbackId = requestIdleCallback(prefetchAll, { timeout: 1000 });
      return () => cancelIdleCallback(idleCallbackId);
    } else {
      // Fallback: setTimeout avec délai minimal (non-bloquant)
      const prefetchTimer = setTimeout(prefetchAll, 100);
      return () => clearTimeout(prefetchTimer);
    }
  }, [activeSubTab, memoizedSubTabs, enablePrefetch]);

  // ✅ PHASE 3.3 : Prefetch au survol des onglets
  const handleTabHover = (tabId) => {
    if (!enablePrefetch) return;
    
    const tab = memoizedSubTabs.find(t => t.id === tabId);
    if (tab && tab.id !== activeSubTab) {
      // Prefetch au survol pour latence réduite
      if (tab.component?._payload) {
        try {
          tab.component._payload._result.then(() => {
            // Composant chargé
          }).catch(() => {
            // Ignorer erreurs
          });
        } catch (e) {
          // Ignorer erreurs
        }
      }
    }
  };

  // ✅ PHASE 2 : Handler changement d'onglet
  const handleTabChange = (tabId) => {
    setActiveSubTab(tabId);
    onTabChange?.(tabId);
  };

  // ✅ PHASE 2 : Composant actif avec memoization
  const ActiveComponent = useMemo(() => {
    return componentMap[activeSubTab];
  }, [activeSubTab, componentMap]);

  // ✅ PHASE 2 : Skeleton par défaut si non fourni
  const DefaultSkeleton = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-slate-200">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-slate-700 rounded-full mb-4"></div>
        <div className="h-4 w-48 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 w-32 bg-slate-700 rounded"></div>
      </div>
    </div>
  );

  const SkeletonComponent = Skeleton || DefaultSkeleton;

  return (
    <div className="sub-tab-wrapper flex flex-col h-full">
      {/* Navigation */}
      <nav className="sub-tabs-navigation flex gap-4 p-4 bg-slate-800/50 rounded-t-lg border-b border-slate-700/50 mb-4">
        {memoizedSubTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            onMouseEnter={() => handleTabHover(tab.id)}
            className={`gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2 ${
              activeSubTab === tab.id
                ? 'gradient-button-premium-variant'
                : ''
            }`}
            aria-label={t(tab.labelKey)}
            aria-current={activeSubTab === tab.id ? 'page' : undefined}
          >
            <span className="text-lg" aria-hidden="true">{tab.icon}</span>
            <span className="text-sm font-medium">{t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>

      {/* Contenu principal */}
      <main className="sub-tab-main-content flex-1 p-6 bg-slate-800/50 rounded-b-lg">
        {ErrorBoundary ? (
          <ErrorBoundary>
            <Suspense fallback={<SkeletonComponent />}>
              {ActiveComponent && <ActiveComponent />}
            </Suspense>
          </ErrorBoundary>
        ) : (
          <Suspense fallback={<SkeletonComponent />}>
            {ActiveComponent && <ActiveComponent />}
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default SubTabWrapper;
