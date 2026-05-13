import { WorkoutRepositoryPhase1 } from './WorkoutRepositoryPhase1.js';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Implémentation mémoire (tests, storybook, SSR sans IDB).
 */
export class MemoryWorkoutRepository extends WorkoutRepositoryPhase1 {
  constructor() {
    super();
    /** @type {Map<string, Record<string, unknown>>} */
    this._aggregates = new Map();
    /** @type {Map<string, Record<string, unknown>>} */
    this._contexts = new Map();
    /** Lignes persistantes complètes (même forme qu’IndexedDB) */
    /** @type {Map<string, Record<string, unknown>>} */
    this._rawWorkoutRows = new Map();
  }

  /** @param {string} scopeKey */
  async loadAggregate(scopeKey) {
    const v = this._aggregates.get(scopeKey);
    return v ? clone(v) : null;
  }

  /** @param {string} scopeKey @param {Record<string, unknown>} data */
  async saveAggregate(scopeKey, data, _opts = {}) {
    const prev = this._aggregates.get(scopeKey) || {};
    this._aggregates.set(scopeKey, { ...prev, ...data });
  }

  /** @param {string} scopeKey */
  async loadProgramContext(scopeKey) {
    const v = this._contexts.get(scopeKey);
    return v ? clone(v) : null;
  }

  /** @param {string} scopeKey @param {Record<string, unknown>} snapshot */
  async saveProgramContext(scopeKey, snapshot, _opts = {}) {
    const prev = this._contexts.get(scopeKey) || {};
    this._contexts.set(scopeKey, { ...prev, ...snapshot });
  }

  /** @param {string} scopeKey */
  async loadRawWorkoutRow(scopeKey) {
    const v = this._rawWorkoutRows.get(scopeKey);
    return v ? clone(v) : null;
  }

  /** @param {string} scopeKey @param {Record<string, unknown>} row */
  async saveRawWorkoutRow(scopeKey, row) {
    this._rawWorkoutRows.set(scopeKey, clone(row));
  }

  clear() {
    this._aggregates.clear();
    this._contexts.clear();
    this._rawWorkoutRows.clear();
  }
}
