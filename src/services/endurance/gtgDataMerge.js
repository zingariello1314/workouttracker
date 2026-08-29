/**
 * Fusion GTG pour import Sport (config, jours cochés, protocole).
 * @module services/endurance/gtgDataMerge
 */

import { normalizeGtgData } from './gtgService';

function laterIso(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return String(a) >= String(b) ? a : b;
}

function mergeDayRecord(left, right) {
  if (!left) return right || { exercises: {} };
  if (!right) return left;
  const exercises = { ...(left.exercises || {}) };
  Object.entries(right.exercises || {}).forEach(([exId, rec]) => {
    const prev = exercises[exId] || { slots: {} };
    const slots = { ...(prev.slots || {}) };
    Object.entries(rec?.slots || {}).forEach(([si, slot]) => {
      const p = slots[si];
      slots[si] = {
        done: Boolean(p?.done || slot?.done),
        updatedAt: laterIso(p?.updatedAt, slot?.updatedAt)
      };
    });
    exercises[exId] = { slots };
  });
  return {
    exercises,
    slots: { ...(left.slots || {}), ...(right.slots || {}) }
  };
}

export function hasMeaningfulGtgData(raw) {
  if (!raw || typeof raw !== 'object') return false;
  const days = raw.days && typeof raw.days === 'object' ? raw.days : {};
  if (Object.keys(days).length > 0) return true;
  const cfg = raw.config && typeof raw.config === 'object' ? raw.config : {};
  if (cfg.customCatalog && Object.keys(cfg.customCatalog).length > 0) return true;
  if (cfg.protocolByExercise && Object.keys(cfg.protocolByExercise).length > 0) return true;
  if (Array.isArray(cfg.selectedIds) && cfg.selectedIds.length > 0) return true;
  return false;
}

/**
 * Union des configs + union des jours (une coche « fait » gagne).
 */
export function mergeGtgData(existing, incoming) {
  if (!hasMeaningfulGtgData(incoming)) return existing || incoming || null;
  if (!hasMeaningfulGtgData(existing)) return incoming;
  const a = normalizeGtgData(existing);
  const b = normalizeGtgData(incoming);
  const selectedIds = [...new Set([...(a.config.selectedIds || []), ...(b.config.selectedIds || [])])];
  const days = { ...a.days };
  Object.entries(b.days || {}).forEach(([date, rec]) => {
    days[date] = mergeDayRecord(days[date], rec);
  });
  return {
    config: {
      ...a.config,
      ...b.config,
      selectedIds,
      customCatalog: { ...(a.config.customCatalog || {}), ...(b.config.customCatalog || {}) },
      manualMax: { ...(a.config.manualMax || {}), ...(b.config.manualMax || {}) },
      protocolByExercise: {
        ...(a.config.protocolByExercise || {}),
        ...(b.config.protocolByExercise || {})
      },
      perExercise: { ...(a.config.perExercise || {}), ...(b.config.perExercise || {}) }
    },
    days,
    workoutSync: { ...(a.workoutSync || {}), ...(b.workoutSync || {}) }
  };
}
