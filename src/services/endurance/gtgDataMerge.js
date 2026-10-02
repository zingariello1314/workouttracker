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

function mergeAdHocItems(leftItems, rightItems) {
  const byExercise = new Map();
  [...(leftItems || []), ...(rightItems || [])].forEach((item) => {
    const exerciseId = String(item?.exerciseId || '').trim();
    if (!exerciseId) return;
    const prev = byExercise.get(exerciseId);
    const reps = Math.round(Number(item?.reps) || 0);
    if (!prev) {
      byExercise.set(exerciseId, {
        exerciseId,
        reps,
        done: Boolean(item?.done),
        updatedAt: item?.updatedAt || null
      });
      return;
    }
    byExercise.set(exerciseId, {
      exerciseId,
      reps: Math.max(prev.reps, reps),
      done: Boolean(prev.done || item?.done),
      updatedAt: laterIso(prev.updatedAt, item?.updatedAt)
    });
  });
  return [...byExercise.values()].filter((item) => item.reps > 0);
}

function mergeAdHocPassages(left, right) {
  const byId = new Map();
  [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])].forEach((row) => {
    const id = String(row?.id || '').trim();
    if (!id) return;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, {
        id,
        time: row.time,
        createdAt: row.createdAt || null,
        items: mergeAdHocItems(row.items, [])
      });
      return;
    }
    byId.set(id, {
      id,
      time: row.time || prev.time,
      createdAt: prev.createdAt || row.createdAt || null,
      items: mergeAdHocItems(prev.items, row.items)
    });
  });
  return [...byId.values()].filter((row) => row.time && row.items.length);
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
    slots: { ...(left.slots || {}), ...(right.slots || {}) },
    adHoc: mergeAdHocPassages(left.adHoc, right.adHoc)
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
