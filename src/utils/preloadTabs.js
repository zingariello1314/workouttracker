/** Préchargement ordonné : Aujourd'hui, puis Récap et Calendrier, puis la banque, puis le reste. */

const CORE_SPORT_TAB_LOADERS = {
  today: () => import('../components/tabs/TodayTab'),
  recap: () => import('../components/tabs/RecapTab'),
  calendar: () => import('../components/tabs/CalendarTab')
};

const EXERCISE_BANK_LOADER = () => import('../components/tabs/ExercisesTab');

const CORE_SPORT_TAB_IDS = ['today', 'recap', 'calendar'];
const CORE_SPORT_TAB_TOTAL = CORE_SPORT_TAB_IDS.length;

let customInflight = null;
let doneCount = 0;
let failed = false;
let customMode = false;
let todayViewPrepared = false;
let animatedBackgroundPrepared = false;
let calendarViewPrepared = false;
let recapViewPrepared = false;
let priorityInflight = null;
let pipelinePromise = null;
const chunkStatus = {
  today: 'idle',
  recap: 'idle',
  calendar: 'idle',
  exercises: 'idle'
};
const chunkJobs = new Map();
const listeners = new Set();
const todayWaiters = new Set();

function snapshot() {
  const coreDone = CORE_SPORT_TAB_IDS.filter(
    (id) => chunkStatus[id] === 'done' || chunkStatus[id] === 'failed'
  ).length;
  const done = customMode ? doneCount : coreDone;
  const chunksReady = done >= CORE_SPORT_TAB_TOTAL;
  return {
    done,
    total: CORE_SPORT_TAB_TOTAL,
    ready: chunksReady,
    todayViewPrepared,
    animatedBackgroundPrepared,
    calendarViewPrepared,
    recapViewPrepared,
    todayChunkReady: chunkStatus.today === 'done',
    recapChunkReady: chunkStatus.recap === 'done',
    calendarChunkReady: chunkStatus.calendar === 'done',
    exerciseBankReady: chunkStatus.exercises === 'done',
    partial: CORE_SPORT_TAB_TOTAL === 0 ? 1 : done / CORE_SPORT_TAB_TOTAL,
    failed: customMode ? failed : CORE_SPORT_TAB_IDS.some((id) => chunkStatus[id] === 'failed')
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

function releaseTodayWaiters() {
  todayWaiters.forEach((finish) => {
    try {
      finish();
    } catch {
      // ignore
    }
  });
  todayWaiters.clear();
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
  customInflight = null;
  priorityInflight = null;
  pipelinePromise = null;
  doneCount = 0;
  failed = false;
  customMode = false;
  todayViewPrepared = false;
  animatedBackgroundPrepared = false;
  calendarViewPrepared = false;
  recapViewPrepared = false;
  chunkStatus.today = 'idle';
  chunkStatus.recap = 'idle';
  chunkStatus.calendar = 'idle';
  chunkStatus.exercises = 'idle';
  chunkJobs.clear();
  laterTabsStarted = false;
  releaseTodayWaiters();
}

/** La page Aujourd’hui a fait son premier rendu (pendant le chargement du site). */
export function markTodayViewPrepared() {
  if (todayViewPrepared) return;
  todayViewPrepared = true;
  notify();
  releaseTodayWaiters();
}

/** Résout quand Aujourd'hui a rendu, ou au bout de 15 s pour ne pas bloquer les photos d'accueil. */
export function whenTodayViewPrepared() {
  if (todayViewPrepared) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      todayWaiters.delete(finish);
      resolve();
    };
    const timer = window.setTimeout(finish, 15000);
    todayWaiters.add(finish);
  });
}

/** Première image du fond animé sélectionné. */
export function markAnimatedBackgroundPrepared() {
  if (animatedBackgroundPrepared) return;
  animatedBackgroundPrepared = true;
  notify();
}

/** Grille annuelle du calendrier sport déjà calculée. */
export function markCalendarViewPrepared() {
  if (calendarViewPrepared) return;
  calendarViewPrepared = true;
  notify();
}

/** Métriques du récap déjà calculées. */
export function markRecapViewPrepared() {
  if (recapViewPrepared) return;
  recapViewPrepared = true;
  notify();
}

function setChunkStatus(id, status) {
  if (!Object.prototype.hasOwnProperty.call(chunkStatus, id)) return;
  chunkStatus[id] = status;
  notify();
}

function loadChunk(id, factory) {
  if (!chunkJobs.has(id)) {
    const job = Promise.resolve()
      .then(() => factory())
      .then((mod) => {
        setChunkStatus(id, 'done');
        return mod;
      })
      .catch((error) => {
        setChunkStatus(id, 'failed');
        throw error;
      });
    chunkJobs.set(id, job);
  }
  return chunkJobs.get(id);
}

/**
 * Aujourd'hui d'abord, puis Récap et Calendrier ensemble, puis la banque.
 * Les loaders personnalisés servent aux tests et ne lancent pas le reste du site.
 */
export function preloadPriorityTabs(customLoaders = null) {
  if (priorityInflight && !customLoaders) return priorityInflight;

  const loaders = customLoaders || {
    today: CORE_SPORT_TAB_LOADERS.today,
    recap: CORE_SPORT_TAB_LOADERS.recap,
    calendar: CORE_SPORT_TAB_LOADERS.calendar,
    exercises: EXERCISE_BANK_LOADER
  };

  const runOne = (id) => {
    const factory = loaders[id];
    if (typeof factory !== 'function') return Promise.resolve();
    if (!customLoaders) return loadChunk(id, factory).catch(() => {});
    return Promise.resolve()
      .then(() => factory())
      .catch(() => {});
  };

  const run = (async () => {
    await runOne('today');
    await Promise.all([runOne('recap'), runOne('calendar')]);
    await runOne('exercises');
  })();

  if (!customLoaders) priorityInflight = run;
  return run;
}

function viewsWarm(snap) {
  return snap.todayViewPrepared && snap.recapViewPrepared && snap.calendarViewPrepared && snap.exerciseBankReady;
}

function waitUntilPriorityViewsWarm() {
  if (viewsWarm(snapshot())) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribe();
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, 20000);
    unsubscribe = subscribeCoreSportTabsPreload((snap) => {
      if (viewsWarm(snap)) queueMicrotask(finish);
    });
  });
}

/** Pipeline de démarrage. Le reste des onglets n'est demandé qu'une fois les quatre priorités chaudes. */
export function startStartupPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = preloadPriorityTabs()
      .catch(() => {})
      .then(() => waitUntilPriorityViewsWarm())
      .then(() => {
        preloadRemainingTabsIdle();
      });
  }
  return pipelinePromise;
}

/**
 * Télécharge Récap + Aujourd'hui + Calendrier.
 * Conservé pour le survol de la navigation : ne lance pas les autres onglets.
 */
export function preloadCoreSportTabs(customLoaders = null) {
  if (customLoaders) {
    if (customInflight) return customInflight;
    customMode = true;
    const loaders = customLoaders;
    const ids = Object.keys(loaders);
    doneCount = 0;
    failed = false;
    notify();

    const run = (async () => {
      for (const id of ids) {
        try {
          await loaders[id]();
        } catch {
          failed = true;
        }
        doneCount += 1;
        notify();
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      }
    })();

    customInflight = run;
    return run;
  }

  return Promise.all(
    CORE_SPORT_TAB_IDS.map((id) => loadChunk(id, CORE_SPORT_TAB_LOADERS[id]).catch(() => {}))
  );
}

export const preloadRecapTab = () => loadChunk('recap', CORE_SPORT_TAB_LOADERS.recap);
export const preloadTodayTab = () => loadChunk('today', CORE_SPORT_TAB_LOADERS.today);
export const preloadCalendarTab = () => loadChunk('calendar', CORE_SPORT_TAB_LOADERS.calendar);

/** Le chunk de la banque est lourd : il part après Récap et Calendrier, pas avec l'accueil. */
export function preloadExercisesTab() {
  return loadChunk('exercises', EXERCISE_BANK_LOADER);
}

const LATER_TAB_LOADERS = [
  () => import('../components/tabs/EnduranceTab'),
  () => import('../components/tabs/ProgramTab'),
  () => import('../components/tabs/GarminTab'),
  () => import('../components/tabs/NutritionTab'),
  () => import('../components/tabs/ProgressTab'),
  () => import('../components/tabs/DataEntryTab'),
  () => import('../components/tabs/QuestsTab'),
  () => import('../components/tabs/BooksTab'),
  () => import('../components/tabs/FinanceTab'),
  () => import('../components/tabs/SettingsTab'),
  () => import('../components/tabs/DashboardTab'),
  () => import('../components/tabs/AnatomyTab/AnatomyTab'),
  () => import('../components/tabs/SportAnalyticsHubTab'),
  () => import('../components/tabs/ChartsTab'),
  () => import('../components/tabs/PerformanceChallengesTab'),
  () => import('../components/tabs/HistoryTab'),
  () => import('../components/tabs/KnowledgeTab/KnowledgeTab'),
  () => import('../components/tabs/ApprentissageTab'),
  () => import('../components/tabs/CodeTab'),
  () => import('../components/tabs/AddictionQuitTab'),
  () => import('../components/tabs/PricingTab'),
  () => import('../components/tabs/StatsTab'),
  () => import('../components/PredictionsTab'),
  () => import('../components/SmartBalancingTab'),
  () => import('../components/tabs/RubiksTab'),
  () => import('../components/tabs/nutrition/components/CoachDashboard'),
  () => import('../components/ExerciseVariations/ExerciseVariations'),
  () => import('../components/AdvancedStats'),
  () => import('../components/SessionFeedback')
];

let laterTabsStarted = false;

/** Les autres onglets, un par un, seulement après Aujourd'hui, Récap, Calendrier et la banque. */
export function preloadRemainingTabsIdle() {
  if (laterTabsStarted || typeof window === 'undefined') return;
  laterTabsStarted = true;
  let index = 0;
  const step = () => {
    if (index >= LATER_TAB_LOADERS.length) return;
    const load = LATER_TAB_LOADERS[index];
    index += 1;
    Promise.resolve()
      .then(() => load())
      .catch(() => {})
      .finally(() => {
        if (index >= LATER_TAB_LOADERS.length) return;
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(() => step(), { timeout: 2500 });
        } else {
          setTimeout(step, 120);
        }
      });
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => step(), { timeout: 1800 });
  } else {
    setTimeout(step, 500);
  }
}
