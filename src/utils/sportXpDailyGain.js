/**
 * Compteur d’XP gagnés aujourd’hui (heure locale).
 * Baseline = totalXP au premier tick du jour calendaire local ;
 * gained = max(0, totalXP - baseline).
 */

const STORAGE_KEY = 'momentum_sport_xp_daily_gain_v1';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

/**
 * @param {number} totalXP
 * @returns {{ date: string, gained: number, baseline: number }}
 */
export function syncSportXpDailyGain(totalXP) {
  const total = Math.max(0, Math.round(Number(totalXP) || 0));
  const date = todayKey();
  const prev = readStore();

  if (!prev || prev.date !== date || typeof prev.baseline !== 'number') {
    const next = { date, baseline: total, gained: 0 };
    writeStore(next);
    return next;
  }

  const gained = Math.max(0, total - prev.baseline);
  const next = { date, baseline: prev.baseline, gained };
  if (gained !== prev.gained) writeStore(next);
  return next;
}

export function getSportXpDailyGain(totalXP) {
  return syncSportXpDailyGain(totalXP).gained;
}
