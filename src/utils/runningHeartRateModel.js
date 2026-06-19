/**
 * Modèle FC personnel course : estimation FC max évolutive et zones 1–5 (% FC max).
 * Toutes les sorties avec données FC contribuent ; les pics récents et répétés
 * au plafond observé ajustent l'estimation vers le haut (capteur / effort sous-estimé).
 */

function toNum(v, fb = 0) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fb;
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const w = idx - lo;
  return sortedAsc[lo] * (1 - w) + sortedAsc[hi] * w;
}

/** Zones standard en % FC max (modèle 5 zones course). */
export const RUNNING_HR_ZONES = [
  {
    zone: 1,
    key: 'z1',
    pctMin: 50,
    pctMax: 60,
    labelKey: 'endurance.running.hrZones.z1',
    shortKey: 'endurance.running.hrZones.z1Short'
  },
  {
    zone: 2,
    key: 'z2',
    pctMin: 60,
    pctMax: 70,
    labelKey: 'endurance.running.hrZones.z2',
    shortKey: 'endurance.running.hrZones.z2Short',
    efPctMin: 65,
    efPctMax: 75
  },
  {
    zone: 3,
    key: 'z3',
    pctMin: 70,
    pctMax: 80,
    labelKey: 'endurance.running.hrZones.z3',
    shortKey: 'endurance.running.hrZones.z3Short'
  },
  {
    zone: 4,
    key: 'z4',
    pctMin: 80,
    pctMax: 90,
    labelKey: 'endurance.running.hrZones.z4',
    shortKey: 'endurance.running.hrZones.z4Short'
  },
  {
    zone: 5,
    key: 'z5',
    pctMin: 90,
    pctMax: 100,
    labelKey: 'endurance.running.hrZones.z5',
    shortKey: 'endurance.running.hrZones.z5Short'
  }
];

export const EF_HR_PCT_MIN = 65;
export const EF_HR_PCT_MAX = 75;

export function hrPercentOfMax(bpm, fcMax) {
  if (!bpm || !fcMax || fcMax <= 0) return null;
  return (bpm / fcMax) * 100;
}

/** @returns {1|2|3|4|5|null} */
export function classifyHeartRateZone(bpm, fcMax) {
  const pct = hrPercentOfMax(bpm, fcMax);
  if (pct == null) return null;
  if (pct >= 90) return 5;
  if (pct < 50) return 1;
  for (const z of RUNNING_HR_ZONES) {
    if (pct >= z.pctMin && pct < z.pctMax) return z.zone;
  }
  return 3;
}

export function heartRateZoneBoundsBpm(fcMax, zoneNumber) {
  const z = RUNNING_HR_ZONES.find((row) => row.zone === zoneNumber);
  if (!z || !fcMax) return null;
  return {
    min: Math.round((fcMax * z.pctMin) / 100),
    max: Math.round((fcMax * z.pctMax) / 100)
  };
}

export function formatHeartRateZoneLabel(zoneNumber, t) {
  if (!zoneNumber || typeof t !== 'function') return '';
  const z = RUNNING_HR_ZONES.find((row) => row.zone === zoneNumber);
  if (!z) return '';
  const label = t(z.labelKey);
  return label && label !== z.labelKey ? label : `Zone ${zoneNumber}`;
}

export function formatHeartRateZoneShort(zoneNumber, t) {
  if (!zoneNumber || typeof t !== 'function') return '';
  const z = RUNNING_HR_ZONES.find((row) => row.zone === zoneNumber);
  if (!z) return `Z${zoneNumber}`;
  const label = t(z.shortKey);
  return label && label !== z.shortKey ? label : `Z${zoneNumber}`;
}

/**
 * @param {Array<{ maxHR: number, avgHR?: number|null, date?: string|null, weight?: number }>} peaks
 * @param {{ ageYears?: number|null, profileFcMax?: number|null }} [options]
 */
export function estimateUserMaxHeartRateFromPeaks(peaks, options = {}) {
  const { ageYears = null, profileFcMax = null } = options;

  if (profileFcMax != null && profileFcMax > 0) {
    return Math.round(Math.min(230, profileFcMax));
  }

  const valid = (peaks || []).filter((p) => toNum(p?.maxHR, 0) > 0);
  if (valid.length === 0) {
    const ageNum = toNum(ageYears, 0);
    if (ageNum >= 10 && ageNum <= 110) return Math.round(208 - 0.7 * ageNum);
    return 190;
  }

  const values = valid.map((p) => Math.round(toNum(p.maxHR, 0))).sort((a, b) => a - b);
  const absoluteMax = values[values.length - 1];
  const p99 = Math.round(percentile(values, 99));

  const now = Date.now();
  let weightedMax = 0;
  let totalWeight = 0;
  for (const p of valid) {
    const maxHR = Math.round(toNum(p.maxHR, 0));
    let w = toNum(p.weight, 1) || 1;
    if (p.date) {
      const ageDays = (now - new Date(`${p.date}T12:00:00`).getTime()) / 86400000;
      if (Number.isFinite(ageDays) && ageDays >= 0) {
        w *= ageDays <= 180 ? 1.15 : ageDays <= 365 ? 1 : 0.85;
      }
    }
    weightedMax += maxHR * w;
    totalWeight += w;
  }
  const recencyMax = totalWeight > 0 ? Math.round(weightedMax / totalWeight) : absoluteMax;

  const nearCeiling = valid.filter((p) => toNum(p.maxHR, 0) >= absoluteMax - 3).length;
  const ceilingBump = nearCeiling >= 5 ? 5 : nearCeiling >= 3 ? 4 : nearCeiling >= 2 ? 2 : 0;

  const highEffort = valid.filter((p) => {
    const maxHR = toNum(p.maxHR, 0);
    const avgHR = toNum(p.avgHR, 0);
    return maxHR > 0 && avgHR > 0 && avgHR / maxHR >= 0.92;
  }).length;
  const effortBump = highEffort >= 2 ? 3 : highEffort >= 1 ? 2 : 0;

  let estimate = Math.max(absoluteMax, p99, recencyMax) + Math.max(ceilingBump, effortBump);

  const ageNum = toNum(ageYears, 0);
  if (ageNum >= 10 && ageNum <= 110) {
    const ageBased = 208 - 0.7 * ageNum;
    if (absoluteMax >= ageBased - 10) {
      estimate = Math.max(estimate, ageBased);
    }
    estimate = Math.min(estimate, Math.max(absoluteMax + 8, ageBased + 15), 230);
  } else {
    estimate = Math.min(Math.max(estimate, absoluteMax), 230);
  }

  return Math.round(estimate);
}

/** FC de référence unifiée (classification vitesse / seuils). */
export function estimateHrReferenceFromPeaks(peaks, { age = null } = {}) {
  const observed = estimateUserMaxHeartRateFromPeaks(peaks, { ageYears: age });
  const ageNum = toNum(age, 0);
  const ageBased = ageNum >= 10 && ageNum <= 110 ? 208 - 0.7 * ageNum : 0;
  return Math.min(230, Math.max(observed, ageBased, 150));
}
