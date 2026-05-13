/**
 * Store sidebar dans QuietQuestDB (même base que XP — voir `xpDbGateway.js`).
 *
 * @module services/sidebar/sidebarDbGateway
 */

import { XP_DB_NAME } from '../xp/xpDbGateway.js';

export { XP_DB_NAME as SIDEBAR_PREFS_DB_NAME };

export const STORE_SIDEBAR_PREFERENCES = 'sidebarPreferences';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applySidebarPreferencesSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_SIDEBAR_PREFERENCES)) {
    db.createObjectStore(STORE_SIDEBAR_PREFERENCES);
  }
}
