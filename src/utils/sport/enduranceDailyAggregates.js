/**
 * Agrégations journalières pour graphiques Endurance / Récap.
 */
import { normalizeDateString, isMockEnduranceSession } from '../calendarUtils';
import { enduranceRepsForSession } from '../trainingLoadUtils';
import { getCircuitDailyHistory } from '../circuits/circuitDefinitionUtils';

function parseKm(session) {
  return Math.max(0, parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0);
}

/**
 * @param {any[]} sessions
 * @param {(s: any) => number} getContribution
 * @returns {Map<string, number>}
 */
export function sumBySessionDate(sessions, getContribution) {
  const map = new Map();
  for (const s of sessions || []) {
    if (isMockEnduranceSession(s)) continue;
    const d = normalizeDateString(s?.date);
    if (!d) continue;
    const v = getContribution(s);
    if (!Number.isFinite(v) || v <= 0) continue;
    map.set(d, (map.get(d) || 0) + v);
  }
  return map;
}

export function aggregateRunningKmByDate(sessions) {
  return sumBySessionDate(sessions, parseKm);
}

export function aggregatePushupRepsByDate(sessions) {
  return sumBySessionDate(sessions, (s) => Math.max(0, Math.floor(Number(s.count ?? s.reps) || 0)));
}

/** Durée affichée en minutes dans l’UI → secondes pour l’axe Y */
export function aggregateGainageSecondsByDate(sessions) {
  return sumBySessionDate(sessions, (s) => {
    const min = Math.max(0, parseFloat(String(s.duration ?? '').replace(',', '.')) || 0);
    return min * 60;
  });
}

export function aggregateJumpropeJumpsByDate(sessions) {
  return sumBySessionDate(sessions, (s) => Math.max(0, Math.floor(Number(s.jumps) || 0)));
}

/**
 * Tours de circuits par jour (somme des rounds sur tous les circuits).
 * @returns {Map<string, number>}
 */
export function aggregateCircuitRoundsByDate(circuitProgress, circuitDefinitions) {
  const hist = getCircuitDailyHistory(circuitProgress, circuitDefinitions);
  const map = new Map();
  hist.forEach(({ date, totalRounds }) => {
    const d = normalizeDateString(date);
    if (!d) return;
    const n = Math.max(0, Math.round(Number(totalRounds) || 0));
    if (n > 0) map.set(d, n);
  });
  return map;
}
