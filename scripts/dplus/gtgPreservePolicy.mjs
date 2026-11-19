/**
 * Délègue au garde-fou de production.
 * L'effacement total exige explicitGtgClear ou allowWipe.
 * sessionTypesTouched n'autorise pas l'effacement GTG.
 */
import { mergeEnduranceWithoutSilentWipe } from '../../src/services/endurance/enduranceWipeGuard.js';

export function gtgDayCount(gtg) {
  const days = gtg?.days;
  if (!days || typeof days !== 'object') return 0;
  return Object.keys(days).length;
}

export function isGtgEmpty(gtg) {
  return gtgDayCount(gtg) === 0;
}

export function mergeEndurancePreservingGtg(previous, incoming, options = {}) {
  const merged = mergeEnduranceWithoutSilentWipe(previous, incoming, options);
  const allowWipe = options.allowWipe === true;
  const gtgExplicit = allowWipe || options.explicitGtgClear === true;

  const prevList = Array.isArray(previous?.sessions?.gtg) ? previous.sessions.gtg : [];
  const incomingSessions = incoming?.sessions;
  const hasList = incomingSessions && Object.prototype.hasOwnProperty.call(incomingSessions, 'gtg');
  const incomingList = hasList && Array.isArray(incomingSessions.gtg) ? incomingSessions.gtg : null;
  if (!gtgExplicit && prevList.length > 0 && (!hasList || (incomingList && incomingList.length === 0))) {
    merged.sessions = { ...(merged.sessions || {}), gtg: prevList };
  }

  const prevGtg = previous?.gtg;
  if (!gtgExplicit && incoming && Object.prototype.hasOwnProperty.call(incoming, 'gtg')) {
    if (isGtgEmpty(incoming.gtg) && !isGtgEmpty(prevGtg)) {
      merged.gtg = prevGtg;
    }
  }
  return merged;
}

export function removeGtgPassage(gtg, dateStr, passageId) {
  const days = { ...(gtg?.days || {}) };
  const day = days[dateStr];
  if (!day) return gtg;
  const adHoc = (day.adHoc || []).filter((passage) => passage?.id !== passageId);
  days[dateStr] = { ...day, adHoc };
  return { ...gtg, days };
}

/** Refuse deux ajouts sans id. Même id : une entrée. Ids distincts : union. */
export function mergePassageLists(remote, local) {
  const left = Array.isArray(remote) ? remote : [];
  const right = Array.isArray(local) ? local : [];
  if ([...left, ...right].some((entry) => !entry || entry.id == null || entry.id === '')) {
    return { status: 'refused', entries: left, reason: 'missing-id' };
  }
  const byId = new Map();
  for (const entry of left) byId.set(String(entry.id), entry);
  for (const entry of right) {
    const id = String(entry.id);
    if (!byId.has(id)) byId.set(id, entry);
  }
  return { status: 'ok', entries: [...byId.values()], reason: null };
}
