/**
 * Gate de temporalité / activité pour les découvertes Récap (point 22).
 *
 * Une carte « window » ne passe que si l’activité déclarée est réellement
 * présente dans [window.start, window.end]. Absence de carte préférable
 * à un remplissage hors période.
 */

/** Activités connues pour le scope. */
export const DISCOVERY_ACTIVITIES = Object.freeze({
  strength: 'strength',
  sleep: 'sleep',
  running: 'running',
  rest: 'rest'
});

/**
 * Scopes par défaut par kind. mode=historical_explicit : associations
 * historiques assumées (pas exigence d’observation dans la fenêtre courte).
 * mode=window : au moins une observation de chaque activité dans la fenêtre.
 */
const KIND_SCOPE = {
  disc_sleep_cardio: { activities: ['running', 'sleep'], mode: 'window' },
  disc_cardio_strength: { activities: ['running', 'strength'], mode: 'window' },
  disc_no_running: { activities: ['strength'], mode: 'window' },
  disc_sleep_volume: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_assoc: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_intensity: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_perf: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_rpe: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_architecture: { activities: ['sleep'], mode: 'historical_explicit' },
  disc_sleep_efficiency: { activities: ['sleep'], mode: 'historical_explicit' },
  disc_sleep_combo: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_family: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_zones: { activities: ['sleep'], mode: 'historical_explicit' },
  disc_sleep_delayed: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_load: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_j2: { activities: ['sleep', 'strength'], mode: 'historical_explicit' },
  disc_sleep_month: { activities: ['sleep'], mode: 'window' },
  disc_sleep_week: { activities: ['sleep'], mode: 'window' },
  disc_sleep_night: { activities: ['sleep'], mode: 'window' },
  disc_sleep_deep: { activities: ['sleep'], mode: 'window' },
  disc_sleep_freq: { activities: ['sleep'], mode: 'window' },
  disc_sleep_quarter: { activities: ['sleep', 'strength'], mode: 'historical_explicit' }
};

/**
 * Filtre les jours de course à la fenêtre calendaire.
 * @param {Array<{date: string}>} runDays
 * @param {{start?: string, end?: string}|null} window
 */
export function filterRunDaysToWindow(runDays, window) {
  const list = Array.isArray(runDays) ? runDays : [];
  if (!window?.start || !window?.end) return list;
  return list.filter((r) => r?.date && r.date >= window.start && r.date <= window.end);
}

/**
 * Attache un scope explicite (ou le défaut du kind) à une découverte.
 */
export function withDiscoveryScope(discovery, override = null) {
  if (!discovery) return discovery;
  const fromKind = KIND_SCOPE[discovery.kind] || null;
  const scope = override || discovery.scope || fromKind || {
    activities: [],
    mode: 'window'
  };
  return { ...discovery, scope };
}

/**
 * Contexte d’activité dans la fenêtre (et éventuellement hors fenêtre pour historique).
 * @param {object} ctx
 * @param {{start?: string, end?: string}} [ctx.window]
 * @param {number} [ctx.runningKm]
 * @param {number} [ctx.runningMinutes]
 * @param {number} [ctx.runDaysInWindow]
 * @param {number} [ctx.strengthReps]
 * @param {number} [ctx.trainingDays]
 * @param {number} [ctx.nightsInWindow]
 * @param {number} [ctx.sleepPairs]
 */
export function buildPeriodActivityContext(ctx = {}) {
  const runDaysInWindow = Number(ctx.runDaysInWindow) || 0;
  const runningKm = Number(ctx.runningKm) || 0;
  const runningMinutes = Number(ctx.runningMinutes) || 0;
  const hasRunning =
    runDaysInWindow > 0 || runningKm > 0.2 || runningMinutes > 0;
  const strengthReps = Number(ctx.strengthReps) || 0;
  const trainingDays = Number(ctx.trainingDays) || 0;
  const hasStrength = strengthReps >= 20 || trainingDays >= 1;
  const nightsInWindow = Number(ctx.nightsInWindow) || 0;
  const hasSleep = nightsInWindow >= 1 || Number(ctx.sleepPairs) > 0;

  return {
    window: ctx.window || null,
    has: {
      running: hasRunning,
      strength: hasStrength,
      sleep: hasSleep,
      rest: !hasStrength && !hasRunning
    },
    counts: {
      runDaysInWindow,
      runningKm,
      runningMinutes,
      strengthReps,
      trainingDays,
      nightsInWindow
    }
  };
}

/**
 * @returns {{ ok: boolean, reason: string }}
 */
export function assertDiscoveryPeriodScope(discovery, activityCtx) {
  const scoped = withDiscoveryScope(discovery);
  const scope = scoped.scope || { activities: [], mode: 'window' };
  const mode = scope.mode || 'window';
  const activities = Array.isArray(scope.activities) ? scope.activities : [];

  if (mode === 'historical_explicit') {
    return { ok: true, reason: '' };
  }

  if (!activities.length) {
    return { ok: true, reason: '' };
  }

  const has = activityCtx?.has || {};
  for (const act of activities) {
    if (act === 'running' && !has.running) {
      return { ok: false, reason: 'no_running_in_window' };
    }
    if (act === 'sleep' && !has.sleep) {
      return { ok: false, reason: 'no_sleep_in_window' };
    }
    if (act === 'strength' && !has.strength) {
      return { ok: false, reason: 'no_strength_in_window' };
    }
  }
  return { ok: true, reason: '' };
}

/**
 * Filtre une liste de découvertes ; conserve les raisons de drop.
 * @returns {{ kept: object[], dropped: Array<{ discovery: object, reason: string }> }}
 */
export function filterDiscoveriesByPeriodScope(discoveries, activityCtx) {
  const kept = [];
  const dropped = [];
  (discoveries || []).forEach((d) => {
    const scoped = withDiscoveryScope(d);
    const { ok, reason } = assertDiscoveryPeriodScope(scoped, activityCtx);
    if (ok) kept.push(scoped);
    else dropped.push({ discovery: scoped, reason: reason || 'period_scope' });
  });
  return { kept, dropped };
}
