import { XpRepositoryPhase1 } from './XpRepositoryPhase1.js';
import { getXpRow, openXpSystemDb, putXpRow } from './xpDbGateway.js';

function lsKey(userId) {
  return `xpData_${userId}`;
}

/**
 * IndexedDB + repli localStorage (comportement aligné sur l’historique `xpStorage`).
 */
export class LocalXpRepository extends XpRepositoryPhase1 {
  /** @param {string} userId */
  async loadByUserId(userId) {
    try {
      const row = await getXpRow(userId);
      if (row) return row;
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(lsKey(userId));
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('[XPStorage] Erreur chargement:', error);
      try {
        const raw = localStorage.getItem(lsKey(userId));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  }

  /** @param {Record<string, unknown>} xpData */
  async save(xpData) {
    try {
      if (!xpData || xpData.userId === undefined || xpData.userId === null) {
        throw new Error('xpData.userId requis');
      }

      const db = await openXpSystemDb();

      if (!db) {
        const key = lsKey(xpData.userId);
        localStorage.setItem(
          key,
          JSON.stringify({
            ...xpData,
            lastUpdated: new Date().toISOString(),
          })
        );
        return;
      }

      await putXpRow(xpData);

      const key = lsKey(xpData.userId);
      try {
        localStorage.setItem(key, JSON.stringify(xpData));
      } catch (e) {
        console.warn('[XPStorage] Erreur backup localStorage:', e);
      }
    } catch (error) {
      console.error('[XPStorage] Erreur sauvegarde:', error);
      try {
        const key = lsKey(xpData.userId);
        localStorage.setItem(key, JSON.stringify(xpData));
      } catch (e) {
        console.error('[XPStorage] Erreur fallback:', e);
      }
    }
  }
}
