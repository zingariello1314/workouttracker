/** Préchargement des chunks JS des onglets Sport primordiaux. */

const CORE_SPORT_TAB_LOADERS = {
  recap: () => import('../components/tabs/RecapTab'),
  today: () => import('../components/tabs/TodayTab'),
  calendar: () => import('../components/tabs/CalendarTab')
};

const CORE_SPORT_TAB_IDS = Object.keys(CORE_SPORT_TAB_LOADERS);
const CORE_SPORT_TAB_TOTAL = CORE_SPORT_TAB_IDS.length;

let inflight = null;
let doneCount = 0;
let failed = false;
const listeners = new Set();

function snapshot() {
  return {
    done: doneCount,
    total: CORE_SPORT_TAB_TOTAL,
    ready: doneCount >= CORE_SPORT_TAB_TOTAL,
    partial: CORE_SPORT_TAB_TOTAL === 0 ? 1 : doneCount / CORE_SPORT_TAB_TOTAL,
    failed
  };
}

function notify() {
  const next = snapshot();
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch {
      // ignore subscriber errors
    }
  });
}

export function getCoreSportTabsPreloadProgress() {
  return snapshot();
}

export function subscribeCoreSportTabsPreload(listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
}

export function resetCoreSportTabsPreloadForTests() {
  inflight = null;
  doneCount = 0;
  failed = false;
}

/**
 * Télécharge / parse Recap + Today + Calendar une seule fois par session.
 * Ne monte pas les onglets (pas de heatmap, pas de freeze UI).
 */
export function preloadCoreSportTabs(customLoaders = null) {
  if (inflight && !customLoaders) return inflight;

  const loaders = customLoaders || CORE_SPORT_TAB_LOADERS;
  const ids = Object.keys(loaders);
  if (!customLoaders) {
    doneCount = 0;
    failed = false;
    notify();
  } else {
    doneCount = 0;
    failed = false;
  }

  const run = Promise.all(
    ids.map((id) =>
      Promise.resolve()
        .then(() => loaders[id]())
        .then(() => {
          doneCount += 1;
          notify();
        })
        .catch(() => {
          failed = true;
          doneCount += 1;
          notify();
        })
    )
  );

  if (!customLoaders) {
    inflight = run;
  }
  return run;
}

export const preloadRecapTab = () => {
  preloadCoreSportTabs();
  return CORE_SPORT_TAB_LOADERS.recap();
};

export const preloadTodayTab = () => {
  preloadCoreSportTabs();
  return CORE_SPORT_TAB_LOADERS.today();
};

export const preloadCalendarTab = () => {
  preloadCoreSportTabs();
  return CORE_SPORT_TAB_LOADERS.calendar();
};
