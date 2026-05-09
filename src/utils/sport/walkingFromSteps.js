import { normalizeGarminDate } from '../../components/tabs/GarminTab/utils/garminFormatters';
import { isGarminRunningLikeActivity } from '../garminRunningLaps';
import { normalizeManualDailyWalkByDate, mergedDailySteps } from './manualDailyWalkUtils';

const DEFAULT_STEPS_PER_KM = 1312;

function toFinitePositive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function distanceKmFromActivity(activity) {
  let d = activity?.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const meters = Number(activity?.running?.distanceMeters ?? activity?.distanceMeters ?? 0);
  if (Number.isFinite(meters) && meters > 0) return meters / 1000;
  return 0;
}

function durationSecFromActivity(activity) {
  const sec = Number(activity?.duration ?? activity?.running?.durationSec ?? 0);
  return Number.isFinite(sec) && sec > 0 ? sec : 0;
}

function cadenceSpmFromActivity(activity) {
  const candidates = [
    activity?.running?.averageCadenceSpm,
    activity?.running?.avgCadence,
    activity?.averageCadence,
    activity?.cadence
  ];
  for (const val of candidates) {
    const n = Number(val);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function stepsFromActivity(activity) {
  const direct = Number(activity?.steps ?? activity?.running?.steps ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const cadence = cadenceSpmFromActivity(activity);
  const sec = durationSecFromActivity(activity);
  if (cadence > 0 && sec > 0) {
    return (cadence * sec) / 60;
  }
  return 0;
}

export function buildAllTimeWalkingFromSteps({
  dailyMetrics = {},
  activities = {},
  stepsPerKm = DEFAULT_STEPS_PER_KM,
  manualStepsByDate = null
}) {
  const manual = normalizeManualDailyWalkByDate(manualStepsByDate || {});
  const dmKeys = Object.keys(dailyMetrics || {});
  const dates = [...new Set([...dmKeys, ...Object.keys(manual)])].sort();
  const runningKmByDate = new Map();
  const runningStepsByDate = new Map();
  const runningDurationByDate = new Map();

  const cardio = Array.isArray(activities?.cardio) ? activities.cardio : [];
  cardio.forEach((activity) => {
    if (!isGarminRunningLikeActivity(activity)) return;
    const dk = normalizeGarminDate(activity?.date || activity?.startTimeLocal || activity?.startTimeGmt);
    if (!dk) return;
    const km = distanceKmFromActivity(activity);
    const steps = stepsFromActivity(activity);
    const durationSec = durationSecFromActivity(activity);
    if (km > 0) {
      runningKmByDate.set(dk, (runningKmByDate.get(dk) || 0) + km);
    }
    if (steps > 0) {
      runningStepsByDate.set(dk, (runningStepsByDate.get(dk) || 0) + steps);
    }
    if (durationSec > 0) {
      runningDurationByDate.set(dk, (runningDurationByDate.get(dk) || 0) + durationSec);
    }
  });

  const points = [];
  let totalSteps = 0;
  let totalWalkingSteps = 0;
  let totalRunningSteps = 0;
  let totalStepsDistanceKm = 0;
  let totalRunningKm = 0;
  let totalWalkingKm = 0;
  let totalRunningDurationSec = 0;

  dates.forEach((dateKey) => {
    const metric = dailyMetrics?.[dateKey] || {};
    const garminSteps = toFinitePositive(metric?.steps);
    const manualSteps = toFinitePositive(manual?.[dateKey]?.steps ?? 0);
    const steps = mergedDailySteps(garminSteps, manualSteps);
    const runningSteps = toFinitePositive(runningStepsByDate.get(dateKey));
    const walkingSteps = Math.max(0, steps - runningSteps);
    const stepsDistanceKm = steps > 0 ? steps / stepsPerKm : 0;
    const walkingStepsDistanceKm = walkingSteps > 0 ? walkingSteps / stepsPerKm : 0;
    const runningKm = toFinitePositive(runningKmByDate.get(dateKey));
    const runningDurationSec = toFinitePositive(runningDurationByDate.get(dateKey));
    const runningKmCoveredByRunningSteps = runningSteps > 0 ? runningSteps / stepsPerKm : 0;
    const residualRunningKm = Math.max(0, runningKm - runningKmCoveredByRunningSteps);
    const walkingKm = Math.max(0, walkingStepsDistanceKm - residualRunningKm);

    totalSteps += steps;
    totalWalkingSteps += walkingSteps;
    totalRunningSteps += runningSteps;
    totalStepsDistanceKm += stepsDistanceKm;
    totalRunningKm += runningKm;
    totalWalkingKm += walkingKm;
    totalRunningDurationSec += runningDurationSec;

    points.push({
      date: dateKey,
      steps,
      walkingSteps,
      runningSteps,
      stepsDistanceKm,
      walkingStepsDistanceKm,
      runningKm,
      walkingKm,
      runningDurationSec
    });
  });

  return {
    stepsPerKm,
    datesCount: dates.length,
    points,
    totalSteps,
    totalWalkingSteps,
    totalRunningSteps,
    totalStepsDistanceKm,
    totalRunningKm,
    totalWalkingKm,
    totalRunningDurationSec
  };
}
