/**
 * Journal de rejet Spec #24 (Lot A) — mode log only, jamais bloquant.
 * Alimente le debug admin et la calibration des seuils.
 */

const MAX_ENTRIES = 400;

/** @type {{ id: string, rule: string, values?: object, at: string }[]} */
const entries = [];

let enabled = true;

export function setRecapRejectLogEnabled(next) {
  enabled = Boolean(next);
}

export function clearRecapRejectLog() {
  entries.length = 0;
}

export function getRecapRejectLog() {
  return entries.slice();
}

/**
 * @param {{ id?: string, rule: string, values?: object, card?: object }} row
 */
export function logRecapReject(row) {
  if (!enabled || !row?.rule) return;
  const id =
    row.id ||
    row.card?.id ||
    row.card?.kind ||
    String(row.card?.title || '').slice(0, 48) ||
    'unknown';
  const entry = {
    id: String(id),
    rule: String(row.rule),
    values: row.values || null,
    at: new Date().toISOString()
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[recapReject]', entry.rule, entry.id, entry.values || '');
  }
}

export function summarizeRecapRejectLog() {
  const byRule = {};
  entries.forEach((e) => {
    byRule[e.rule] = (byRule[e.rule] || 0) + 1;
  });
  return { total: entries.length, byRule };
}
