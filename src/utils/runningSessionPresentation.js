/**
 * Libellés et catégorisation affichés pour une séance course (historique, détail).
 */

import { inferRunningSessionKindFromSession } from './runningSessionClassification';
import { resolveRunningSessionDisplayType, runningSessionTypeLabel } from './runningSessionTypeLabel';
import {
  classifyHeartRateZone,
  formatHeartRateZoneShort,
  hrPercentOfMax
} from './runningHeartRateModel';
import { resolveSessionHeartRate } from './sport/runningCardioStatsAnalytics';

const EXPLICIT_TYPES = new Set([
  'easy',
  'fundamental',
  'recovery',
  'long_run',
  'long',
  'endurance',
  'speed',
  'fartlek',
  'interval',
  'threshold',
  'tempo',
  'sprint',
  'race',
  'competition',
  'walk',
  'walking',
  'hike'
]);

function refineTypeFromZone(baseType, zone, hrPct, kind) {
  if (kind === 'interval') return 'interval';
  if (kind === 'speed') return 'speed';
  if (baseType === 'interval' || baseType === 'speed' || baseType === 'sprint') return baseType;
  if (baseType === 'threshold' || baseType === 'tempo' || baseType === 'fartlek') return baseType;
  if (baseType === 'long_run' || baseType === 'long') return baseType;
  if (baseType === 'race' || baseType === 'competition') return baseType;
  if (baseType === 'recovery' || baseType === 'walk' || baseType === 'walking') return baseType;

  if (zone == null && hrPct == null) return baseType;

  if (zone === 1 || (hrPct != null && hrPct < 62)) return 'recovery';
  if (zone === 2 || (hrPct != null && hrPct >= 60 && hrPct <= 78)) return 'easy';
  if (zone === 3) return baseType === 'endurance' ? 'endurance' : 'tempo';
  if (zone === 4) return 'threshold';
  if (zone === 5) return 'sprint';

  return baseType;
}

/**
 * @param {object} session
 * @param {object|null} garmin
 * @param {{ fcMax?: number, inferredKind?: string, classificationCtx?: object, t?: Function }} options
 */
export function resolveRunningSessionPresentation(session, garmin = null, options = {}) {
  const { fcMax = null, inferredKind, classificationCtx = {}, t = (k) => k } = options;
  const kind =
    inferredKind ?? inferRunningSessionKindFromSession(session, garmin, classificationCtx);
  const displayType = resolveRunningSessionDisplayType(session, kind);
  const sessionType = String(session?.type || '').toLowerCase();

  const { avgHR } = resolveSessionHeartRate(session, garmin);
  const hrPct = avgHR && fcMax ? hrPercentOfMax(avgHR, fcMax) : null;
  const zone = avgHR && fcMax ? classifyHeartRateZone(avgHR, fcMax) : null;

  let primaryType = displayType;
  if (EXPLICIT_TYPES.has(sessionType) && sessionType !== 'endurance') {
    primaryType = displayType;
  } else {
    primaryType = refineTypeFromZone(displayType, zone, hrPct, kind);
  }

  const primaryLabel = runningSessionTypeLabel(primaryType, t);
  const zoneLabel = zone ? formatHeartRateZoneShort(zone, t) : null;
  const hrSubtitle =
    hrPct != null
      ? zoneLabel
        ? `${zoneLabel} · ${Math.round(hrPct)} % FC max`
        : `${Math.round(hrPct)} % FC max`
      : null;

  return {
    primaryLabel,
    primaryType,
    zone,
    zoneLabel,
    hrPct,
    hrSubtitle,
    kind,
    displayType,
    avgHR
  };
}
