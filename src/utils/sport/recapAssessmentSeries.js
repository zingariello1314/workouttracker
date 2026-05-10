/**
 * Séries temporelles pour le module « Synthèse profil » (poids + reps sur la même fenêtre).
 */

import { buildTotalStrengthRepsByDate } from './recapDailyChartData';

const MS_DAY = 86400000;

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Poids par jour (impédance + mensurations ; si plusieurs entrées le même jour, la plus récente). */
export function buildWeightByDateMap(progressEntries) {
  const tmp = new Map();
  if (!Array.isArray(progressEntries)) return new Map();
  progressEntries.forEach((e) => {
    const d = String(e?.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    if (e.type !== 'metrics' && e.type !== 'impedance') return;
    const w = Number(e.weight);
    if (!Number.isFinite(w) || w <= 0) return;
    const ts = String(e.updatedAt || e.createdAt || '');
    const prev = tmp.get(d);
    if (!prev || ts >= (prev.ts || '')) tmp.set(d, { w, ts });
  });
  const out = new Map();
  tmp.forEach((v, k) => out.set(k, v.w));
  return out;
}

/** Dernière mesure de poids connue. */
export function getLatestWeightSnapshot(progressEntries) {
  let best = null;
  if (!Array.isArray(progressEntries)) return null;
  progressEntries.forEach((e) => {
    if (e.type !== 'metrics' && e.type !== 'impedance') return;
    const w = Number(e.weight);
    if (!Number.isFinite(w) || w <= 0) return;
    const d = String(e.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const ts = String(e.updatedAt || e.createdAt || `${d}T12:00:00`);
    if (!best || ts > best.ts) {
      const bf = e.bodyFatPercentage ?? e.bodyFat;
      best = {
        weightKg: Math.round(w * 10) / 10,
        dateYmd: d,
        ts,
        bodyFat: bf != null && Number.isFinite(Number(bf)) ? Math.round(Number(bf) * 10) / 10 : null
      };
    }
  });
  return best;
}

/**
 * @returns {{ weightSeries: {date:string,value:number}[], repsSeries: {date:string,value:number}[], range: { startYmd, endYmd }, hasWeightInWindow: boolean }}
 */
export function buildAssessmentChartSeries(snapshot, dayCount = 84) {
  const data = snapshot || {};
  const end = new Date();
  const endYmd = ymdFromDate(end);
  const start = new Date(end.getTime() - (dayCount - 1) * MS_DAY);
  const startYmd = ymdFromDate(start);

  const repsMap = buildTotalStrengthRepsByDate(data);
  const weightRaw = buildWeightByDateMap(data.progressEntries);

  const dates = [];
  for (let i = 0; i < dayCount; i++) {
    const dt = new Date(start.getTime() + i * MS_DAY);
    dates.push(ymdFromDate(dt));
  }

  let carryW = null;
  let lastBeforeStr = null;
  weightRaw.forEach((w, d) => {
    if (d >= startYmd) return;
    if (!lastBeforeStr || d > lastBeforeStr) {
      lastBeforeStr = d;
      carryW = w;
    }
  });

  let hasInWin = false;
  const weightSeries = dates.map((d) => {
    if (weightRaw.has(d)) {
      carryW = weightRaw.get(d);
      hasInWin = true;
    }
    return {
      date: d,
      value: carryW != null && Number.isFinite(carryW) ? Math.round(carryW * 10) / 10 : 0
    };
  });

  const repsSeries = dates.map((d) => ({
    date: d,
    value: Math.round(Number(repsMap.get(d)) || 0)
  }));

  const hasWeightPath = carryW != null || hasInWin;

  return {
    weightSeries,
    repsSeries,
    range: { startYmd, endYmd },
    hasWeightInWindow: hasInWin,
    hasWeightPath
  };
}
