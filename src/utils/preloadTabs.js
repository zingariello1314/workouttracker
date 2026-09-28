/** Avant le bouton : Aujourd'hui seulement. Les autres onglets se chargent à l'ouverture. */

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
const calendarWaiters = new Set();

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
  releaseCalendarWaiters();
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

function releaseCalendarWaiters() {
  calendarWaiters.forEach((finish) => {
    try {
      finish();
    } catch {
      // ignore
    }
  });
  calendarWaiters.clear();
}

/** Le calendrier a fait son premier rendu. */
export function markCalendarViewPrepared() {
  if (calendarViewPrepared) return;
  calendarViewPrepared = true;
  notify();
  releaseCalendarWaiters();
}

/** Résout quand le calendrier a rendu, ou au bout de 20 s. */
export function whenCalendarViewPrepared() {
  if (calendarViewPrepared) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      calendarWaiters.delete(finish);
      resolve();
    };
    const timer = window.setTimeout(finish, 20000);
    calendarWaiters.add(finish);
  });
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
 * Aujourd'hui d'abord. Les loaders personnalisés enchaînent ensuite Récap, Calendrier et la banque.
 * Les loaders personnalisés servent aux tests et ne lancent pas le reste du site.
 */
export function preloadPriorityTabs(customLoaders = null) {
  if (priorityInflight && !customLoaders) return priorityInflight;

  const loaders = customLoaders || {
    today: CORE_SPORT_TAB_LOADERS.today
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
    if (customLoaders) {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      await Promise.all([runOne('recap'), runOne('calendar')]);
      if (typeof loaders.exercises === 'function') await runOne('exercises');
    }
  })();

  if (!customLoaders) priorityInflight = run;
  return run;
}

/** Avant le bouton : uniquement le chunk Aujourd'hui. Le reste se charge à l'ouverture de l'onglet. */
export function startStartupPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = preloadPriorityTabs().catch(() => {});
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

const BACKGROUND_TAB_LOADERS = [
  () => loadChunk('recap', CORE_SPORT_TAB_LOADERS.recap),
  () => loadChunk('exercises', EXERCISE_BANK_LOADER),
  ...LATER_TAB_LOADERS
];

let laterTabsStarted = false;

export function runWhenMainThreadQuiet(fn) {
  let cancelled = false;
  let idleId = 0;
  let timerId = 0;

  const clear = () => {
    if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId);
    if (timerId) clearTimeout(timerId);
    idleId = 0;
    timerId = 0;
  };

  const attempt = (deadline) => {
    if (cancelled) return;
    const inputPending = navigator.scheduling?.isInputPending?.({ includeContinuous: true });
    const sliceTooSmall = deadline && !deadline.didTimeout && deadline.timeRemaining() < 12;
    if (inputPending || sliceTooSmall) {
      clear();
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(attempt, { timeout: 60000 });
      } else {
        timerId = setTimeout(() => attempt(null), 2000);
      }
      return;
    }
    fn();
  };

  if (typeof requestIdleCallback === 'function') {
    idleId = requestIdleCallback(attempt, { timeout: 60000 });
  } else {
    timerId = setTimeout(() => attempt(null), 3000);
  }

  return () => {
    cancelled = true;
    clear();
  };
}

/** Un module à la fois, seulement quand personne n'interagit. Jamais monté tant que l'onglet n'est pas ouvert. */
export function preloadRemainingTabsIdle() {
  if (laterTabsStarted || typeof window === 'undefined') return;
  laterTabsStarted = true;
  let index = 0;
  const step = () => {
    if (index >= BACKGROUND_TAB_LOADERS.length) return;
    const load = BACKGROUND_TAB_LOADERS[index];
    index += 1;
    Promise.resolve()
      .then(() => load())
      .catch(() => {})
      .finally(() => {
        if (index >= BACKGROUND_TAB_LOADERS.length) return;
        runWhenMainThreadQuiet(step);
      });
  };
  runWhenMainThreadQuiet(step);
}
