import { appendMigrationJournalEntry } from './migrationJournal.js';
import { flushIntentionsOutbox } from './intentionsOutbox.js';

/**
 * Orchestrateur Phase 3 (jalon) : journal + vidage file intentions.
 * Nom de fonction historique : **aucune** lecture ni export des stores IndexedDB métier
 * vers le cloud — uniquement retry des mutations intentions déjà mises en file.
 * Les données IndexedDB métier ne sont ni parcourues ni « migrées » par cet appel.
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
    note: 'IndexedDB métier inchangé ; cette étape vide uniquement la file intentions Phase 3 (sync runtime).'
  };
}
