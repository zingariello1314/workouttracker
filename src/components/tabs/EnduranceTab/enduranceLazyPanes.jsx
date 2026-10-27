import React, { lazy, Suspense } from 'react';

/** Fallback discret : ne bloque pas le shell (titre + menu). */
export function EndurancePaneFallback() {
  return (
    <div className="empty">Chargement…</div>
  );
}

export function EnduranceLazyPane({ children }) {
  return <Suspense fallback={<EndurancePaneFallback />}>{children}</Suspense>;
}

/**
 * Après le premier paint (2 rAF), sans setTimeout.
 * Annulé au démontage / Strict Mode.
 */
export function scheduleEnduranceWorkAfterPaint(fn) {
  let cancelled = false;
  let raf2 = 0;
  const raf1 = window.requestAnimationFrame(() => {
    raf2 = window.requestAnimationFrame(() => {
      if (!cancelled) fn();
    });
  });
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(raf1);
    if (raf2) window.cancelAnimationFrame(raf2);
  };
}

export const SwimmingSessionExtras = lazy(() =>
  import('./components/SwimmingSessionExtras.jsx')
);
export const RunningSessionDetailPage = lazy(() =>
  import('./components/RunningSessionDetailPage.jsx')
);
export const RunningTrophiesPanel = lazy(() =>
  import('./components/RunningTrophiesPanel.jsx')
);
export const SimpleEnduranceTrophiesPanel = lazy(() =>
  import('./components/SimpleEnduranceTrophiesPanel.jsx')
);
export const PushupTrophiesPanel = lazy(() =>
  import('./components/PushupTrophiesPanel.jsx')
);
export const PushupSessionsHistory = lazy(() =>
  import('./components/PushupSessionsHistory.jsx')
);
export const WalkingStatsPanel = lazy(() =>
  import('./components/WalkingStatsPanel.jsx')
);
export const WalkingTrophiesPanel = lazy(() =>
  import('./components/WalkingTrophiesPanel.jsx')
);
export const ManualDailyWalkPanel = lazy(() =>
  import('./components/ManualDailyWalkPanel.jsx')
);
export const AllTrophiesHubPanel = lazy(() =>
  import('./components/AllTrophiesHubPanel.jsx')
);
export const EnduranceCalendarModernPanel = lazy(() =>
  import('./components/EnduranceCalendarModernPanel.jsx')
);
export const DefisDisciplineCalendarPanel = lazy(() =>
  import('./components/DefisDisciplineCalendarPanel.jsx')
);
export const PerformanceChallengesTab = lazy(() =>
  import('../PerformanceChallengesTab.jsx')
);
export const CircuitsHubPanel = lazy(() =>
  import('./components/CircuitsHubPanel.jsx')
);
export const GtgPanel = lazy(() => import('./components/GtgPanel.jsx'));
export const PyramidTrainingPanel = lazy(() =>
  import('../../sport/pyramid/PyramidTrainingPanel.jsx')
);
export const EnduranceDisciplineStatsPanel = lazy(() =>
  import('../../sport/charts/EnduranceDisciplineStatsPanel.jsx')
);
export const RunningStatsPanel = lazy(() =>
  import('./components/RunningStatsPanel.jsx')
);

const SUBTAB_PREFETCH = {
  walking: () =>
    Promise.all([
      import('./components/WalkingStatsPanel.jsx'),
      import('./components/WalkingTrophiesPanel.jsx'),
      import('./components/ManualDailyWalkPanel.jsx')
    ]),
  pushups: () =>
    Promise.all([
      import('./components/PushupTrophiesPanel.jsx'),
      import('./components/PushupSessionsHistory.jsx')
    ]),
  swimming: () => import('./components/SwimmingSessionExtras.jsx'),
  jumprope: () => import('./components/SimpleEnduranceTrophiesPanel.jsx'),
  gainage: () => import('./components/SimpleEnduranceTrophiesPanel.jsx'),
  trophies: () => import('./components/AllTrophiesHubPanel.jsx'),
  circuits: () => import('./components/CircuitsHubPanel.jsx'),
  gtg: () => import('./components/GtgPanel.jsx'),
  pyramid: () => import('../../sport/pyramid/PyramidTrainingPanel.jsx'),
  performance: () => import('../PerformanceChallengesTab.jsx'),
  calendar: () => import('./components/EnduranceCalendarModernPanel.jsx'),
  running: () =>
    Promise.all([
      import('./components/RunningTrophiesPanel.jsx'),
      import('./components/RunningStatsPanel.jsx'),
      import('./components/DefisDisciplineCalendarPanel.jsx'),
      import('./components/RunningSessionDetailPage.jsx')
    ])
};

export function prefetchEnduranceSubTab(tabId) {
  const load = SUBTAB_PREFETCH[tabId];
  if (typeof load !== 'function') return undefined;
  return load().catch(() => {});
}
