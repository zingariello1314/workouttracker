/**
 * Façade Phase 1 — workout aggregate + contexte programmes.
 *
 * @typedef {Record<string, unknown>} WorkoutAggregate
 * @typedef {Record<string, unknown>} ProgramContextSnapshot
 */

export class WorkoutRepositoryPhase1 {
  /**
   * @param {string} scopeKey
   * @returns {Promise<WorkoutAggregate | null>}
   */
  async loadAggregate(scopeKey) {
    void scopeKey;
    throw new Error('WorkoutRepositoryPhase1.loadAggregate not implemented');
  }

  /**
   * @param {string} scopeKey
   * @param {WorkoutAggregate} data
   * @param {{ clientMutationId?: string }} [_opts]
   */
  async saveAggregate(scopeKey, data, _opts = {}) {
    void scopeKey;
    void data;
    void _opts;
    throw new Error('WorkoutRepositoryPhase1.saveAggregate not implemented');
  }

  /**
   * @param {string} scopeKey
   * @returns {Promise<ProgramContextSnapshot | null>}
   */
  async loadProgramContext(scopeKey) {
    void scopeKey;
    throw new Error('WorkoutRepositoryPhase1.loadProgramContext not implemented');
  }

  /**
   * @param {string} scopeKey
   * @param {ProgramContextSnapshot} snapshot
   * @param {{ clientMutationId?: string }} [_opts]
   */
  async saveProgramContext(scopeKey, snapshot, _opts = {}) {
    void scopeKey;
    void snapshot;
    void _opts;
    throw new Error('WorkoutRepositoryPhase1.saveProgramContext not implemented');
  }

  /**
   * Ligne brute IndexedDB (incl. `id`, `lastSaved`, `dataVersion`) — utilisé par `useWorkoutData`.
   * @param {string} scopeKey
   * @returns {Promise<Record<string, unknown> | null>}
   */
  async loadRawWorkoutRow(scopeKey) {
    void scopeKey;
    throw new Error('WorkoutRepositoryPhase1.loadRawWorkoutRow not implemented');
  }

  /**
   * @param {string} scopeKey
   * @param {Record<string, unknown>} row
   */
  async saveRawWorkoutRow(scopeKey, row) {
    void scopeKey;
    void row;
    throw new Error('WorkoutRepositoryPhase1.saveRawWorkoutRow not implemented');
  }
}
