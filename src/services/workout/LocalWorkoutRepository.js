import { WorkoutRepositoryPhase1 } from './WorkoutRepositoryPhase1.js';
import { getWorkoutRow, putWorkoutRow } from './workoutDbGateway.js';
import { getContextRow, putContextRow } from './workoutContextGateway.js';
import { createEmptyWorkoutAggregate } from './workoutAggregateDefaults.js';

/**
 * Implémentation IndexedDB (navigateur uniquement).
 * Normalise les lignes legacy `result.data` vs plat (comme `useWorkoutData`).
 */
export class LocalWorkoutRepository extends WorkoutRepositoryPhase1 {
  /** @param {string} scopeKey */
  async loadAggregate(scopeKey) {
    if (typeof window === 'undefined') return null;
    const row = await getWorkoutRow(scopeKey);
    if (!row) return null;
    const flat = flattenWorkoutRow(row);
    const { id: _id, lastSaved: _ls, dataVersion: _dv, ...rest } = flat;
    return rest;
  }

  /** @param {string} scopeKey @param {Record<string, unknown>} data */
  async saveAggregate(scopeKey, data, _opts = {}) {
    if (typeof window === 'undefined') return;
    const raw = await getWorkoutRow(scopeKey);
    const existingFlat = raw ? flattenWorkoutRow(raw) : null;
    const base = existingFlat
      ? { ...createEmptyWorkoutAggregate(), ...stripPersistMeta(existingFlat) }
      : createEmptyWorkoutAggregate();
    const merged = {
      ...base,
      ...data,
      id: scopeKey,
      lastSaved: new Date().toISOString(),
      dataVersion: (raw && raw.dataVersion) || '1.0'
    };
    await putWorkoutRow(scopeKey, merged);
  }

  /** @param {string} scopeKey */
  async loadProgramContext(scopeKey) {
    if (typeof window === 'undefined') return null;
    const row = await getContextRow(scopeKey);
    if (!row) return null;
    const { id: _id, lastSaved: _ls, ...rest } = row;
    return rest;
  }

  /** @param {string} scopeKey @param {Record<string, unknown>} snapshot */
  async saveProgramContext(scopeKey, snapshot, _opts = {}) {
    if (typeof window === 'undefined') return;
    await putContextRow(scopeKey, snapshot);
  }

  /** @param {string} scopeKey */
  async loadRawWorkoutRow(scopeKey) {
    if (typeof window === 'undefined') return null;
    return getWorkoutRow(scopeKey);
  }

  /** @param {string} scopeKey @param {Record<string, unknown>} row */
  async saveRawWorkoutRow(scopeKey, row) {
    if (typeof window === 'undefined') return;
    await putWorkoutRow(scopeKey, row);
  }
}

/** Aplatit `row.data` legacy vers un seul objet champ métier. */
function flattenWorkoutRow(row) {
  if (row && typeof row.data === 'object' && row.data !== null) {
    return { ...row.data, id: row.id, lastSaved: row.lastSaved, dataVersion: row.dataVersion };
  }
  return { ...row };
}

function stripPersistMeta(flat) {
  const { id, lastSaved, dataVersion, ...rest } = flat;
  return rest;
}
