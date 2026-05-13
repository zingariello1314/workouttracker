/**
 * Façade Phase 1 — bibliothèque livres (store `books` dans WorkoutTrackerDB).
 */

export class BooksRepositoryPhase1 {
  /** @returns {Promise<Array<Record<string, unknown>>>} */
  async loadAll() {
    throw new Error('BooksRepositoryPhase1.loadAll not implemented');
  }

  /**
   * Merge intelligent (autres utilisateurs préservés) puis remplace le store.
   * @param {Array<Record<string, unknown>>} books
   * @returns {Promise<boolean>}
   */
  async saveMerged(books) {
    void books;
    throw new Error('BooksRepositoryPhase1.saveMerged not implemented');
  }
}
