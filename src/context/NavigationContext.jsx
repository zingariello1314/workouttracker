import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';

const NavigationContext = createContext(null);

/** API impérative stable (pas d’abonnement React) — pour Today/Recap data-heavy. */
const navigationApi = {
  setActiveTab: () => {},
  requestOpenEnduranceSubTab: () => {},
  requestOpenCalendarDay: () => {},
  getActiveTab: () => 'home',
  getPreviousTab: () => null
};

export function getNavigationApi() {
  return navigationApi;
}

export function setActiveTab(tabId) {
  return navigationApi.setActiveTab(tabId);
}

export function requestOpenEnduranceSubTab(tabId, focus) {
  return navigationApi.requestOpenEnduranceSubTab(tabId, focus);
}

export function requestOpenCalendarDay(dateYmd, scrollAnchor) {
  return navigationApi.requestOpenCalendarDay(dateYmd, scrollAnchor);
}

const ENDURANCE_SUBTABS = [
  'running',
  'walking',
  'pushups',
  'gainage',
  'swimming',
  'jumprope',
  'boxing',
  'circuits',
  'gtg',
  'pyramid',
  'performance'
];

export function NavigationProvider({ children }) {
  const [activeTab, setActiveTabState] = useState('home');
  const [previousTab, setPreviousTab] = useState(null);
  const [pendingEnduranceSubTab, setPendingEnduranceSubTab] = useState(null);
  const [pendingEnduranceFocus, setPendingEnduranceFocus] = useState(null);
  const [pendingCalendarDeepLink, setPendingCalendarDeepLink] = useState(null);

  const activeTabRef = useRef(activeTab);
  const previousTabRef = useRef(previousTab);
  activeTabRef.current = activeTab;
  previousTabRef.current = previousTab;

  const setActiveTab = useCallback((newTab) => {
    if (activeTabRef.current === newTab) return;
    setPreviousTab(activeTabRef.current);
    setActiveTabState(newTab);
  }, []);

  const clearPendingEnduranceSubTab = useCallback(() => {
    setPendingEnduranceSubTab(null);
  }, []);

  const clearPendingEnduranceFocus = useCallback(() => {
    setPendingEnduranceFocus(null);
  }, []);

  const requestOpenEnduranceSubTab = useCallback((tabId, focus = null) => {
    if (!ENDURANCE_SUBTABS.includes(tabId)) return;
    setPendingEnduranceSubTab(tabId);
    setPendingEnduranceFocus(
      focus && typeof focus === 'object'
        ? {
            tabId,
            anchorId: focus.anchorId || null,
            openChallengeModal: Boolean(focus.openChallengeModal)
          }
        : null
    );
    if (activeTabRef.current !== 'endurance') {
      setPreviousTab(activeTabRef.current);
      setActiveTabState('endurance');
    }
  }, []);

  const clearPendingCalendarDeepLink = useCallback(() => {
    setPendingCalendarDeepLink(null);
  }, []);

  const requestOpenCalendarDay = useCallback(
    (dateYmd, scrollAnchor = 'calendar-day-exercise-detail') => {
      if (!dateYmd || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateYmd))) return;
      setPendingCalendarDeepLink({ dateYmd: String(dateYmd), scrollAnchor });
      try {
        localStorage.setItem('sport.lastSubTab', 'calendar');
      } catch {
        /* ignore */
      }
      if (activeTabRef.current !== 'calendar') {
        setPreviousTab(activeTabRef.current);
        setActiveTabState('calendar');
      }
    },
    []
  );

  navigationApi.setActiveTab = setActiveTab;
  navigationApi.requestOpenEnduranceSubTab = requestOpenEnduranceSubTab;
  navigationApi.requestOpenCalendarDay = requestOpenCalendarDay;
  navigationApi.getActiveTab = () => activeTabRef.current;
  navigationApi.getPreviousTab = () => previousTabRef.current;

  const value = useMemo(
    () => ({
      activeTab,
      previousTab,
      setActiveTab,
      pendingEnduranceSubTab,
      pendingEnduranceFocus,
      requestOpenEnduranceSubTab,
      clearPendingEnduranceSubTab,
      clearPendingEnduranceFocus,
      pendingCalendarDeepLink,
      requestOpenCalendarDay,
      clearPendingCalendarDeepLink
    }),
    [
      activeTab,
      previousTab,
      setActiveTab,
      pendingEnduranceSubTab,
      pendingEnduranceFocus,
      requestOpenEnduranceSubTab,
      clearPendingEnduranceSubTab,
      clearPendingEnduranceFocus,
      pendingCalendarDeepLink,
      requestOpenCalendarDay,
      clearPendingCalendarDeepLink
    ]
  );

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}

/**
 * Abonnement React au contexte de navigation (re-render si activeTab change).
 * Pour les arbres data-heavy (Today cards), préférer setActiveTab / getNavigationApi().
 */
export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
}

export { NavigationContext };
