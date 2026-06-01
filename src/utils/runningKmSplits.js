/**
 * Découpage km par km pour séances course (tours Garmin ou agrégation).
 */

/** @param {object} lap */
export function lapMeters(lap) {
  if (!lap) return 0;
  if (lap.distanceMeters != null && lap.distanceMeters > 0) return Number(lap.distanceMeters);
  if (lap.distanceKm != null && lap.distanceKm > 0) return Number(lap.distanceKm) * 1000;
  return 0;
}

/** @param {object} lap */
export function paceFromLap(lap) {
  const m = lapMeters(lap);
  const dur = Number(lap.durationSeconds);
  if (m > 0 && dur > 0) {
    const km = m / 1000;
    return { paceSecPerKm: dur / km, kmh: (km / dur) * 3600 };
  }
  if (lap.avgPaceSecondsPerKm != null && lap.avgPaceSecondsPerKm > 0) {
    return { paceSecPerKm: lap.avgPaceSecondsPerKm, kmh: 3600 / lap.avgPaceSecondsPerKm };
  }
  if (lap.avgSpeedKmh != null && lap.avgSpeedKmh > 0) {
    return { paceSecPerKm: 3600 / lap.avgSpeedKmh, kmh: Number(lap.avgSpeedKmh) };
  }
  return null;
}

/**
 * Parse "01:02:57", "62:57", "6:16" (pace) → secondes.
 * @param {string|number} raw
 */
export function parseClockToSeconds(raw) {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(raw);
  const s = String(raw).trim().replace(/min\/km|\/km|min/gi, '').trim();
  const parts = s.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

function rowFromSegment(kmIndex, distanceM, durationSec) {
  if (distanceM <= 0 || durationSec <= 0) return null;
  const distanceKm = distanceM / 1000;
  return {
    km: kmIndex,
    label: `Km ${kmIndex}`,
    distanceKm,
    durationSeconds: durationSec,
    paceSecPerKm: durationSec / distanceKm,
    kmh: (distanceKm / durationSec) * 3600
  };
}

/**
 * Répartit les tours en tranches d’1 km (dernier km partiel inclus).
 * @param {object[]} laps
 */
function bucketLapsIntoKm(laps) {
  const rows = [];
  let kmIndex = 1;
  let pendingM = 0;
  let pendingSec = 0;

  const flush = () => {
    if (pendingM <= 0 || pendingSec <= 0) return;
    const row = rowFromSegment(kmIndex, pendingM, pendingSec);
    if (row) rows.push(row);
    kmIndex += 1;
    pendingM = 0;
    pendingSec = 0;
  };

  for (const lap of laps) {
    let remainM = lapMeters(lap);
    let remainSec = Number(lap.durationSeconds) || 0;
    if (remainM <= 0 || remainSec <= 0) continue;

    while (remainM > 0 && remainSec > 0) {
      const toCompleteKm = 1000 - pendingM;
      if (pendingM > 0 && remainM >= toCompleteKm) {
        const ratio = toCompleteKm / remainM;
        const takeSec = remainSec * ratio;
        pendingSec += takeSec;
        const row = rowFromSegment(kmIndex, 1000, pendingSec);
        if (row) rows.push(row);
        kmIndex += 1;
        pendingM = 0;
        pendingSec = 0;
        remainM -= toCompleteKm;
        remainSec -= takeSec;
      } else if (pendingM === 0 && remainM >= 1000) {
        const ratio = 1000 / remainM;
        const takeSec = remainSec * ratio;
        const row = rowFromSegment(kmIndex, 1000, takeSec);
        if (row) rows.push(row);
        kmIndex += 1;
        remainM -= 1000;
        remainSec -= takeSec;
      } else {
        pendingM += remainM;
        pendingSec += remainSec;
        remainM = 0;
        remainSec = 0;
      }
    }
  }

  if (pendingM > 30 && pendingSec > 0) {
    const row = rowFromSegment(kmIndex, pendingM, pendingSec);
    if (row) rows.push(row);
  }

  return rows;
}

/**
 * @param {object[]} laps
 * @param {{ session?: object, garminFull?: object }} [opts]
 * @returns {{ rows: object[], totals: object }|null}
 */
export function buildKmSplitsFromLaps(laps, opts = {}) {
  if (!Array.isArray(laps) || laps.length === 0) return null;

  const usable = laps.filter((lap) => lapMeters(lap) > 0 && Number(lap.durationSeconds) > 0);
  if (!usable.length) return null;

  const directRows = usable.map((lap, i) => {
    const pace = paceFromLap(lap);
    const distanceKm = lapMeters(lap) / 1000;
    const durationSeconds = Number(lap.durationSeconds);
    return {
      km: Number(lap.index) > 0 ? Number(lap.index) : i + 1,
      label: `Km ${Number(lap.index) > 0 ? lap.index : i + 1}`,
      distanceKm,
      durationSeconds,
      paceSecPerKm: pace?.paceSecPerKm ?? durationSeconds / distanceKm,
      kmh: pace?.kmh ?? (distanceKm / durationSeconds) * 3600
    };
  });

  const totalKm = directRows.reduce((s, r) => s + r.distanceKm, 0);
  const totalSec = directRows.reduce((s, r) => s + r.durationSeconds, 0);
  const oneKmLikeCount = directRows.filter(
    (r) => r.distanceKm >= 0.45 && r.distanceKm <= 1.2
  ).length;
  const useDirect = oneKmLikeCount / directRows.length >= 0.65;

  const rows = useDirect
    ? directRows.map((r, i) => ({
        ...r,
        km: i + 1,
        label: `Km ${i + 1}`
      }))
    : bucketLapsIntoKm(usable);

  if (!rows.length) return null;

  const sumKm = rows.reduce((s, r) => s + r.distanceKm, 0);
  const sumSec = rows.reduce((s, r) => s + r.durationSeconds, 0);

  let totals = {
    distanceKm: sumKm,
    durationSeconds: sumSec,
    paceSecPerKm: sumKm > 0 ? sumSec / sumKm : null,
    kmh: sumSec > 0 ? (sumKm / sumSec) * 3600 : null
  };

  const session = opts.session;
  const garminFull = opts.garminFull;
  const sessionKm = parseFloat(String(session?.distance ?? '').replace(',', '.'));
  const sessionSec =
    parseClockToSeconds(session?.duration) ||
    Number(garminFull?.duration) ||
    Number(garminFull?.running?.durationSeconds) ||
    0;

  if (sessionKm > 0 && sessionSec > 0) {
    totals = {
      distanceKm: sessionKm,
      durationSeconds: sessionSec,
      paceSecPerKm: sessionSec / sessionKm,
      kmh: (sessionKm / sessionSec) * 3600
    };
  }

  return { rows, totals };
}

/**
 * @param {object} session
 * @param {object|null} garminFull
 */
export function buildKmSplitsForRunningSession(session, garminFull = null) {
  const laps = garminFull?.running?.laps;
  const fromLaps = buildKmSplitsFromLaps(laps, { session, garminFull });
  if (fromLaps) return fromLaps;

  const km = parseFloat(String(session?.distance ?? '').replace(',', '.'));
  const sec =
    parseClockToSeconds(session?.duration) ||
    Number(garminFull?.duration) ||
    0;
  if (km <= 0 || sec <= 0) return null;

  return {
    rows: [
      {
        km: 1,
        label: 'Km 1',
        distanceKm: km,
        durationSeconds: sec,
        paceSecPerKm: sec / km,
        kmh: (km / sec) * 3600
      }
    ],
    totals: {
      distanceKm: km,
      durationSeconds: sec,
      paceSecPerKm: sec / km,
      kmh: (km / sec) * 3600
    }
  };
}
