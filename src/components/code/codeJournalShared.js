/** Modes d’entrée (persistés sur chaque ligne du journal IndexedDB). */
export const JOURNAL_MODES = [
  { id: 'plan', label: 'Plan' },
  { id: 'journal', label: 'Journal du jour' },
  { id: 'todo', label: 'À faire' },
  { id: 'link', label: 'Liens' },
];

export function normalizeJournalUrl(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (/^\/\//.test(t)) return `https:${t}`;
  return `https://${t}`;
}

export function isValidJournalHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** @param {unknown} list */
export function cloneJournalLinks(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({
      id: x.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      url: String(x.url || x.href || '').trim(),
      title: String(x.title || '').trim(),
    }))
    .filter((x) => x.url);
}
