/**
 * Journal append-only des étapes migration Phase 3 (localStorage, filet de reprise).
 */

const KEY = 'momentum_phase3_migration_journal_v1';
const MAX = 400;

function readRaw() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRaw(arr) {
  if (typeof localStorage === 'undefined') return;
  try {
    const trimmed = arr.length > MAX ? arr.slice(-MAX) : arr;
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}

/**
 * @param {{ phase: string, event: string, detail?: string }} entry
 */
export function appendMigrationJournalEntry(entry) {
  const row = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    phase: String(entry.phase || ''),
    event: String(entry.event || ''),
    detail: entry.detail != null ? String(entry.detail).slice(0, 2000) : ''
  };
  const arr = readRaw();
  arr.push(row);
  writeRaw(arr);
  return row;
}

export function getMigrationJournalSnapshot(limit = 50) {
  const arr = readRaw();
  return arr.slice(-Math.max(1, Math.min(200, limit)));
}

export function clearMigrationJournal() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
