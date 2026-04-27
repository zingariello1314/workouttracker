/**
 * Métriques « spéciales » pour le calendrier course : allure soutenue hors fractionné,
 * et fractionné pondéré (effort / récup / nombre de tours).
 */

import { classifyLapPhase, inferRunningSessionTypeFromGarminActivity } from './garminRunningLaps';
import { parseRunningSessionDurationMinutes, formatPaceMinPerKm } from './runningPersonalRecords';

const MIN_SUSTAINED_MIN = 4;
/** Fenêtre autour de la meilleure allure (min/km) pour privilégier la plus longue tenue à quasi-même allure */
const PACE_TIE_BAND_MIN_PER_KM = 0.25;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getGarmin(session, garminById) {
  if (!garminById || typeof garminById.get !== 'function') return null;
  const key = session?.garminId != null ? String(session.garminId) : String(session?.id ?? '');
  return garminById.get(key) || null;
}

/**
 * Séance fractionnée (type saisi ou structure Garmin effort/récup).
 */
export function isRunningIntervalSession(session, garminActivity) {
  const runType = String(session?.type || '').toLowerCase();
  if (runType === 'interval' || runType.includes('interval') || runType.includes('fraction')) return true;
  if (garminActivity && inferRunningSessionTypeFromGarminActivity(garminActivity) === 'interval') return true;
  return false;
}

function lapDurationSeconds(lap) {
  return toNumber(lap?.durationSeconds, 0);
}

function lapDistanceKm(lap) {
  const dk = toNumber(lap?.distanceKm, 0);
  if (dk > 0) return dk;
  return toNumber(lap?.distanceMeters, 0) / 1000;
}

/** Segments consécutifs de « course utile » : exclut échauffement, récup, retour au calme */
function enduranceMovingSegmentsFromLaps(laps) {
  if (!Array.isArray(laps) || laps.length === 0) return [];
  const segments = [];
  let cur = { durSec: 0, distKm: 0 };

  const useLap = (lap) => {
    const phase = classifyLapPhase(lap);
    return phase === 'effort' || phase === 'other';
  };

  for (const lap of laps) {
    if (useLap(lap)) {
      cur.durSec += lapDurationSeconds(lap);
      cur.distKm += lapDistanceKm(lap);
    } else {
      if (cur.durSec > 0 && cur.distKm > 0) {
        segments.push({ ...cur });
      }
      cur = { durSec: 0, distKm: 0 };
    }
  }
  if (cur.durSec > 0 && cur.distKm > 0) segments.push(cur);
  return segments;
}

function sessionWholeBlock(session) {
  const dist = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
  const durMin = parseRunningSessionDurationMinutes(session?.duration);
  if (dist < 0.12 || durMin < MIN_SUSTAINED_MIN) return null;
  const paceMinPerKm = durMin / dist;
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return null;
  return {
    date: session.date,
    sessionId: session.id,
    distKm: dist,
    durMin,
    paceMinPerKm,
    source: 'session'
  };
}

/**
 * Blocs candidats pour allure soutenue (hors fractionné) : tours « utiles » Garmin ou séance entière.
 */
function collectNonIntervalSustainedBlocks(session, garmin) {
  if (isRunningIntervalSession(session, garmin)) return [];

  const laps = garmin?.running?.laps;
  if (Array.isArray(laps) && laps.length > 0) {
    const segs = enduranceMovingSegmentsFromLaps(laps);
    const out = [];
    for (const s of segs) {
      const durMin = s.durSec / 60;
      if (durMin < MIN_SUSTAINED_MIN || s.distKm < 0.12) continue;
      const paceMinPerKm = durMin / s.distKm;
      if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) continue;
      out.push({
        date: session.date,
        sessionId: session.id,
        distKm: s.distKm,
        durMin,
        paceMinPerKm,
        source: 'laps'
      });
    }
    if (out.length > 0) return out;
  }

  const whole = sessionWholeBlock(session);
  return whole ? [whole] : [];
}

/**
 * Meilleure allure soutenue hors fractionné : d’abord la plus rapide (min/km minimal),
 * puis parmi les blocs à ≤ bande près, la plus longue durée.
 */
export function computeBestSustainedNonIntervalPace(sessions, garminById) {
  const list = Array.isArray(sessions) ? sessions : [];
  const candidates = [];
  for (const session of list) {
    if (!session?.date) continue;
    const g = getGarmin(session, garminById);
    const blocks = collectNonIntervalSustainedBlocks(session, g);
    for (const b of blocks) candidates.push(b);
  }
  if (candidates.length === 0) return null;

  let bestPace = Math.min(...candidates.map((c) => c.paceMinPerKm));
  const pool = candidates.filter((c) => c.paceMinPerKm <= bestPace + PACE_TIE_BAND_MIN_PER_KM);
  let pick = pool[0];
  for (const c of pool) {
    if (c.durMin > pick.durMin) pick = c;
    else if (c.durMin === pick.durMin && c.distKm > pick.distKm) pick = c;
  }

  return {
    date: pick.date,
    sessionId: pick.sessionId,
    paceMinPerKm: pick.paceMinPerKm,
    durationMin: pick.durMin,
    distanceKm: pick.distKm,
    paceLabel: formatPaceMinPerKm(pick.paceMinPerKm)
  };
}

function lapPhaseBucket(lap) {
  const p = classifyLapPhase(lap);
  if (p === 'recovery') return 'recovery';
  if (p === 'effort' || p === 'other') return 'effort';
  return 'skip';
}

/**
 * Score fractionné : combine vitesse effort, vitesse récup (km/h) et nombre de tours effort.
 * Sans tours Garmin détaillés → null.
 */
export function computeBestWeightedIntervalSession(sessions, garminById) {
  const W_PASSIVE = 0.38;
  const LAP_EXP = 0.42;

  const list = Array.isArray(sessions) ? sessions : [];
  let best = null;
  let bestScore = -1;

  for (const session of list) {
    if (!session?.date) continue;
    const g = getGarmin(session, garminById);
    if (!isRunningIntervalSession(session, g)) continue;
    const laps = g?.running?.laps;
    if (!Array.isArray(laps) || laps.length < 2) continue;

    let effSec = 0;
    let effKm = 0;
    let recSec = 0;
    let recKm = 0;
    let effortLaps = 0;

    for (const lap of laps) {
      const bucket = lapPhaseBucket(lap);
      const ds = lapDurationSeconds(lap);
      const dk = lapDistanceKm(lap);
      if (ds <= 0 || dk <= 0) continue;
      if (bucket === 'effort') {
        effSec += ds;
        effKm += dk;
        effortLaps += 1;
      } else if (bucket === 'recovery') {
        recSec += ds;
        recKm += dk;
      }
    }

    if (effSec <= 0 || effKm < 0.08 || effortLaps < 1) continue;

    const paceEffSecPerKm = effSec / effKm;
    const speedEff = paceEffSecPerKm > 0 ? 3600 / paceEffSecPerKm : 0;

    let speedRec = 0;
    if (recSec > 0 && recKm >= 0.05) {
      const paceRecSecPerKm = recSec / recKm;
      if (paceRecSecPerKm > 0) speedRec = 3600 / paceRecSecPerKm;
    }

    const combined = speedEff + W_PASSIVE * speedRec;
    const score = combined * Math.pow(1 + effortLaps, LAP_EXP);

    if (score > bestScore) {
      bestScore = score;
      const paceEffMinPerKm = paceEffSecPerKm / 60;
      const paceRecMinPerKm = recKm > 0 && recSec > 0 ? recSec / recKm / 60 : null;
      best = {
        date: session.date,
        sessionId: session.id,
        score,
        effortLapCount: effortLaps,
        paceEffortMinPerKm: paceEffMinPerKm,
        paceRecoveryMinPerKm: paceRecMinPerKm,
        paceEffortLabel: formatPaceMinPerKm(paceEffMinPerKm),
        paceRecoveryLabel: paceRecMinPerKm != null ? formatPaceMinPerKm(paceRecMinPerKm) : null
      };
    }
  }

  return best;
}
