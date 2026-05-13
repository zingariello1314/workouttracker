/**
 * Façade Phase 1 — persistance XP centralisée (QuietQuestDB / xpSystem).
 *
 * @typedef {Record<string, unknown>} XPRecord
 */

export class XpRepositoryPhase1 {
  /**
   * @param {string} userId
   * @returns {Promise<XPRecord | null>}
   */
  async loadByUserId(userId) {
    void userId;
    throw new Error('XpRepositoryPhase1.loadByUserId not implemented');
  }

  /**
   * @param {XPRecord} xpData — doit inclure `userId`
   */
  async save(xpData) {
    void xpData;
    throw new Error('XpRepositoryPhase1.save not implemented');
  }
}
