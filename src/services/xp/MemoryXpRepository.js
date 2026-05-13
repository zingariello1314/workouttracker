import { XpRepositoryPhase1 } from './XpRepositoryPhase1.js';

/** Pour tests / environnement sans persistance réelle. */
export class MemoryXpRepository extends XpRepositoryPhase1 {
  constructor() {
    super();
    /** @type {Map<string, Record<string, unknown>>} */
    this._byUser = new Map();
  }

  /** @param {string} userId */
  async loadByUserId(userId) {
    const v = this._byUser.get(String(userId));
    return v ? { ...v } : null;
  }

  /** @param {Record<string, unknown>} xpData */
  async save(xpData) {
    const id = xpData?.userId != null ? String(xpData.userId) : '';
    if (!id) throw new Error('xpData.userId requis');
    this._byUser.set(id, {
      ...xpData,
      userId: id,
      lastUpdated: new Date().toISOString(),
    });
  }

  clear() {
    this._byUser.clear();
  }
}
