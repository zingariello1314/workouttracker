import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useTranslation } from '../../utils/translations';
import ErrorBoundary from '../ui/ErrorBoundary';

const RubiksCubeView = lazy(() => import('../apprentissage/RubiksCubeView'));
const RubiksTimerView = lazy(() => import('../cube/RubiksTimerView'));
const RubiksMethodsView = lazy(() => import('../cube/RubiksMethodsView'));
const RubiksMethodPage = lazy(() => import('../cube/RubiksMethodPage'));
const RubiksSettingsView = lazy(() => import('../cube/RubiksSettingsView'));

const LoadingFallback = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <div className="rounded-xl border-2 border-emerald-500/50 bg-black px-8 py-10 text-center">
      <div className="mb-4 animate-spin text-4xl">🧊</div>
      <div className="font-semibold uppercase tracking-wide text-emerald-200/90">Chargement…</div>
    </div>
  </div>
);

const RubiksTab = () => {
  const t = useTranslation();
  const [methodPageId, setMethodPageId] = useState(null);
  const [currentSubView, setCurrentSubView] = useState(() => {
    try {
      const saved = localStorage.getItem('rubiks.activeSubView');
      if (saved === 'solve' || saved === 'timer' || saved === 'methods' || saved === 'settings') {
        return saved;
      }
      return 'solve';
    } catch {
      return 'solve';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rubiks.activeSubView', currentSubView);
    } catch {
      /* ignore */
    }
  }, [currentSubView]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('tab-change', { detail: { tab: currentSubView, isSubTab: true } })
    );
  }, [currentSubView]);

  const subViews = [
    { id: 'solve', label: t('rubiks.subTabs.solve', 'Résoudre'), icon: '🧊' },
    { id: 'timer', label: t('rubiks.subTabs.timer', 'Chrono'), icon: '⏱️' },
    { id: 'methods', label: t('rubiks.subTabs.methods', 'Méthodes'), icon: '📘' },
    { id: 'settings', label: t('rubiks.subTabs.settings', 'Paramètres'), icon: '⚙️' }
  ];

  const renderSubView = () => {
    switch (currentSubView) {
      case 'timer':
        return <RubiksTimerView />;
      case 'methods':
        if (methodPageId) {
          return <RubiksMethodPage methodId={methodPageId} onBack={() => setMethodPageId(null)} />;
        }
        return <RubiksMethodsView onOpenMethod={setMethodPageId} />;
      case 'settings':
        return <RubiksSettingsView />;
      default:
        return <RubiksCubeView />;
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 min-h-screen">
        {!methodPageId ? (
        <div className="sticky top-0 z-30">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {subViews.map((subView) => (
                <button
                  key={subView.id}
                  type="button"
                  onClick={() => {
                    setMethodPageId(null);
                    setCurrentSubView(subView.id);
                  }}
                  data-subtab={subView.id}
                  data-tab={`rubiks-${subView.id}`}
                  className={`flex flex-shrink-0 items-center space-x-2 whitespace-nowrap rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    currentSubView === subView.id
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                      : 'border-emerald-600/50 bg-black text-emerald-200/90 hover:border-emerald-400/75 hover:bg-emerald-950/40'
                  }`}
                >
                  <span className="text-lg">{subView.icon}</span>
                  <span>{subView.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        ) : null}

        <div className="py-6">
          <ErrorBoundary
            context={{ currentSubView, tab: 'rubiks' }}
            title={`Erreur dans ${currentSubView}`}
            message="Une erreur s'est produite dans ce sous-onglet. Vous pouvez réessayer ou changer de sous-onglet."
          >
            <Suspense fallback={<LoadingFallback />}>{renderSubView()}</Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default RubiksTab;
