/**
 * Répartition km / séances par type de sortie course (libellés précis).
 */

import { getGarminForRunningSession } from './runningGarminMetrics';
import { resolveRunningSessionPresentation } from './runningSessionPresentation';

/** Couleurs + regroupement macro (80/20 profil). */
export const RUNNING_TYPE_DISTRIBUTION_META = {
  easy: { color: '#34d399', labelKey: 'endurance.running.sessionTypes.easy', macro: 'endurance' },
  fundamental: { color: '#34d399', labelKey: 'endurance.running.sessionTypes.fundamental', macro: 'endurance' },
  recovery: { color: '#6ee7b7', labelKey: 'endurance.running.sessionTypes.recovery', macro: 'endurance' },
  endurance: { color: '#2dd4bf', labelKey: 'endurance.running.sessionTypes.endurance', macro: 'endurance' },
  long_run: { color: '#10b981', labelKey: 'endurance.running.sessionTypes.long_run', macro: 'endurance' },
  long: { color: '#10b981', labelKey: 'endurance.running.sessionTypes.long', macro: 'endurance' },
  fartlek: { color: '#a78bfa', labelKey: 'endurance.running.sessionTypes.fartlek', macro: 'endurance' },
  trail: { color: '#4ade80', labelKey: 'endurance.running.sessionTypes.trail', macro: 'endurance' },
  hike: { color: '#65a30d', labelKey: 'endurance.running.sessionTypes.hike', macro: 'endurance' },
  tempo: { color: '#f472b6', labelKey: 'endurance.running.sessionTypes.tempo', macro: 'speed' },
  threshold: { color: '#e879f9', labelKey: 'endurance.running.sessionTypes.threshold', macro: 'speed' },
  speed: { color: '#fb7185', labelKey: 'endurance.running.sessionTypes.speed', macro: 'speed' },
  sprint: { color: '#f43f5e', labelKey: 'endurance.running.sessionTypes.sprint', macro: 'speed' },
  race: { color: '#fcd34d', labelKey: 'endurance.running.sessionTypes.race', macro: 'speed' },
  competition: { color: '#fcd34d', labelKey: 'endurance.running.sessionTypes.competition', macro: 'speed' },
  hill: { color: '#86efac', labelKey: 'endurance.running.sessionTypes.hill', macro: 'speed' },
  interval: { color: '#fbbf24', labelKey: 'endurance.running.sessionTypes.interval', macro: 'interval' }
};

const MACRO_ORDER = ['endurance', 'speed', 'interval'];

function pct(n, total) {
  return total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
}

/**
 * @param {ReturnType<import('./sport/runningCardioStatsAnalytics').buildRunningSessionRows>} rows
 * @param {{ garminById?: Map|null, fcMax?: number, classificationCtx?: object, garminRunningKindByGarminId?: Map|null }} ctx
 */
export function computeRunningTypeDistribution(rows, ctx = {}) {
  const {
    garminById = null,
    fcMax = 190,
    classificationCtx = {},
    garminRunningKindByGarminId = null
  } = ctx;

  const kmByType = {};
  const sessionsByType = {};

  for (const row of rows || []) {
    const session = row?.session;
    if (!session) continue;

    const garmin = getGarminForRunningSession(session, garminById);
    const gid = session?.garminId ?? session?.id;
    const inferredKind =
      row.kind ??
      (gid != null && garminRunningKindByGarminId?.get
        ? garminRunningKindByGarminId.get(String(gid))
        : undefined);

    const { primaryType } = resolveRunningSessionPresentation(session, garmin, {
      fcMax,
      inferredKind,
      classificationCtx
    });

    const type = primaryType || 'endurance';
    const km = row.dist > 0 ? row.dist : 0;
    kmByType[type] = (kmByType[type] || 0) + km;
    sessionsByType[type] = (sessionsByType[type] || 0) + 1;
  }

  const totalKm = Object.values(kmByType).reduce((s, v) => s + v, 0);
  const totalSessions = Object.values(sessionsByType).reduce((s, v) => s + v, 0);

  const items = Object.keys(sessionsByType)
    .map((type) => {
      const meta = RUNNING_TYPE_DISTRIBUTION_META[type] || {
        color: '#94a3b8',
        labelKey: `endurance.running.sessionTypes.${type}`,
        macro: 'endurance'
      };
      const km = Math.round((kmByType[type] || 0) * 100) / 100;
      return {
        type,
        km,
        sessions: sessionsByType[type] || 0,
        kmPct: pct(km, totalKm),
        sessionPct: pct(sessionsByType[type] || 0, totalSessions),
        color: meta.color,
        labelKey: meta.labelKey,
        macro: meta.macro
      };
    })
    .sort((a, b) => b.km - a.km || b.sessions - a.sessions);

  const macroKm = { endurance: 0, speed: 0, interval: 0 };
  const macroSessions = { endurance: 0, speed: 0, interval: 0 };
  for (const item of items) {
    const m = MACRO_ORDER.includes(item.macro) ? item.macro : 'endurance';
    macroKm[m] += item.km;
    macroSessions[m] += item.sessions;
  }

  return {
    items,
    totalKm: Math.round(totalKm * 100) / 100,
    totalSessions,
    macroKm: {
      endurance: Math.round(macroKm.endurance * 100) / 100,
      speed: Math.round(macroKm.speed * 100) / 100,
      interval: Math.round(macroKm.interval * 100) / 100
    },
    macroKmPct: {
      endurance: pct(macroKm.endurance, totalKm),
      speed: pct(macroKm.speed, totalKm),
      interval: pct(macroKm.interval, totalKm)
    }
  };
}

export { MACRO_ORDER as RUNNING_MACRO_KINDS };
