import { appendMigrationJournalEntry } from './migrationJournal.js';
import { flushIntentionsOutbox } from './intentionsOutbox.js';

/**
 * Orchestrateur Phase 3 (jalon) : journal + vidage file intentions.
 * Les données IndexedDB métier (workout, etc.) restent locales — pas de suppression.
 *
 * @param {string} accessToken
 * @returns {Promise<{ ok: boolean, outbox: { sent: number, failed: number, remaining: number }, note: string }>}
 */
export async function migrateLocalDataToBackend(accessToken) {
  appendMigrationJournalEntry({
    phase: '3',
    event: 'migrateLocalDataToBackend_start',
    detail: ''
  });
  const outbox = await flushIntentionsOutbox(accessToken);
  appendMigrationJournalEntry({
    phase: '3',
    event: 'migrateLocalDataToBackend_end',
    detail: JSON.stringify(outbox)
  });
  return {
    ok: true,
    outbox,
    note: 'IndexedDB métier conservé ; cette étape vide la file intentions Phase 3 uniquement.'
  };
}
