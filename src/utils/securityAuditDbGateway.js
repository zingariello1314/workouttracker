/**
 * Schéma IndexedDB audit auth (WorkoutTrackerSecurityDB).
 *
 * @module utils/securityAuditDbGateway
 */

export const SECURITY_DB_NAME = 'WorkoutTrackerSecurityDB';
export const SECURITY_DB_VERSION = 1;
export const STORE_AUTH_AUDIT_TRAIL = 'authAuditTrail';

/**
 * @param {IDBVersionChangeEvent} event
 */
export function applySecurityAuditSchemaUpgrade(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains(STORE_AUTH_AUDIT_TRAIL)) {
    const store = db.createObjectStore(STORE_AUTH_AUDIT_TRAIL, { keyPath: 'id' });
    store.createIndex('timestamp', 'timestamp', { unique: false });
    store.createIndex('eventType', 'eventType', { unique: false });
  }
}
