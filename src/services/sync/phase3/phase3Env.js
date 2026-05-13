/**
 * Feature flags Phase 3 (dual-write / migration). Désactivés par défaut.
 * @see docs/sync/PHASE3_MIGRATION_DUAL_WRITE.md
 */

const truthy = (v) => {
  const s = String(v || '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
};

/** Dual-write : échec réseau → mise en file locale + flush au login. */
export function isPhase3DualWriteEnabled() {
  if (typeof import.meta === 'undefined' || !import.meta.env) return false;
  return truthy(import.meta.env.VITE_PHASE3_DUAL_WRITE);
}

/** Exécute `migrateLocalDataToBackend` au focus fenêtre (optionnel). */
export function isPhase3MigrationOnFocusEnabled() {
  if (typeof import.meta === 'undefined' || !import.meta.env) return false;
  return truthy(import.meta.env.VITE_PHASE3_MIGRATION_ON_FOCUS);
}
