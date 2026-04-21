/**
 * Métriques course dérivées des activités Garmin (laps, agrégats) + estimations locales.
 * @module runningGarminMetrics
 */

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {object} session
 * @param {Map<string, object>|null|undefined} garminById
 */
export function getGarminForRunningSession(session, garminById) {
  if (!session || !garminById || typeof garminById.get !== 'function') return null;
  const key = session.garminId != null ? String(session.garminId) : String(session.id);
  return garminById.get(key) || null;
}

/**
 * Cadence (pas/min) : priorité moyenne Garmin, sinon moyenne pondérée des tours, sinon vitesse / fouée.
 * @returns {{ spm: number, source: string } | null}
 */
export function deriveCadenceSpmFromGarmin(garmin) {
  if (!garmin?.running) return null;
  const r = garmin.running;
  const direct = toNumber(r.averageCadenceSpm, 0);
  if (direct >= 80 && direct <= 240) return { spm: Math.round(direct), source: 'garmin_avg' };

  const laps = Array.isArray(r.laps) ? r.laps : [];
  let sumW = 0;
  let sumD = 0;
  for (const lap of laps) {
    const c = toNumber(lap.averageCadenceSpm, 0);
    const dk = toNumber(lap.distanceKm, 0) || toNumber(lap.distanceMeters, 0) / 1000;
    if (c >= 80 && c <= 240 && dk > 0) {
      sumW += c * dk;
      sumD += dk;
    }
  }
  if (sumD > 0) {
    const spm = Math.round(sumW / sumD);
    if (spm >= 80 && spm <= 240) return { spm, source: 'garmin_laps' };
  }

  let strideW = 0;
  let strideD = 0;
  for (const lap of laps) {
    const stride = toNumber(lap.averageStrideLengthMeters, 0);
    const dur = toNumber(lap.durationSeconds, 0);
    const dm = toNumber(lap.distanceMeters, 0) || toNumber(lap.distanceKm, 0) * 1000;
    if (stride > 0.4 && stride < 2.5 && dur > 10 && dm > 30) {
      const v = dm / dur;
      const spm = Math.round((60 * v) / stride);
      if (spm >= 80 && spm <= 240) {
        strideW += spm * dm;
        strideD += dm;
      }
    }
  }
  if (strideD > 0) {
    const spm = Math.round(strideW / strideD);
    if (spm >= 80 && spm <= 240) return { spm, source: 'estimated_stride' };
  }

  const maxC = toNumber(r.maxCadenceSpm, 0);
  if (maxC >= 80 && maxC <= 240) return { spm: Math.round(maxC), source: 'garmin_max' };

  return null;
}

/**
 * VO2 max issu des champs Garmin quand présents.
 * @returns {{ vo2: number, source: 'garmin' } | null}
 */
export function deriveVo2FromGarmin(garmin) {
  if (!garmin) return null;
  const candidates = [
    garmin.vo2Max,
    garmin.training?.vo2Max,
    garmin.trainingStatus?.vo2Max,
    garmin.performance?.vo2Max
  ];
  for (const c of candidates) {
    const v = toNumber(c, 0);
    if (v >= 15 && v < 90) return { vo2: Math.round(v * 10) / 10, source: 'garmin' };
  }
  return null;
}

/**
 * Estimation physiologique (équivalent course à pied, pente 0 %), utile quand Garmin ne renvoie pas le VO2 sur l’activité.
 * Forme simplifiée type ACSM : VO2 ≈ 0,2 × v (m/min) + 3,5 (ml/kg/min), avec v = distance(m) / durée(min).
 * @param {number} distKm
 * @param {number} durMin minutes (>0)
 */
export function estimateVo2FromAcsm(distKm, durMin) {
  if (distKm < 0.25 || durMin < 0.5) return null;
  const vMPerMin = (distKm * 1000) / durMin;
  const vo2 = 0.2 * vMPerMin + 3.5;
  const capped = Math.max(14, Math.min(75, Math.round(vo2 * 10) / 10));
  return { vo2: capped, source: 'estimated_acsm' };
}
