/**
 * Lisibilité du GLB écorché (Anatomie, Récap, banque) — léger relèvement, pas de look « plastique ».
 */

/** Teinte de repos (corps sans surbrillance). */
export const ECORCHE_IDLE_UNIFORM = '#503030';

/** Corps atténué mais lisible — vignettes « Muscles de cette famille » uniquement. */
export const ECORCHE_FAMILY_ROW_IDLE = '#a88278';
export const ECORCHE_FAMILY_ROW_IDLE_EMISSIVE = '#6a5048';
export const ECORCHE_FAMILY_ROW_IDLE_EMISSIVE_INTENSITY = 0.34;

/** Légère émission sur le repos pour détacher du fond noir. */
export const ECORCHE_IDLE_EMISSIVE = '#2a1818';
export const ECORCHE_IDLE_EMISSIVE_INTENSITY = 0.12;

/** @param {{ explorer?: boolean, familyRowThumb?: boolean }} [opts] */
export function anatomySceneLightIntensity({ explorer = false, familyRowThumb = false } = {}) {
  const mul = explorer ? 1.18 : familyRowThumb ? 1.22 : 1.08;
  return {
    ambient: (familyRowThumb ? 0.72 : 0.58) * mul,
    key: (familyRowThumb ? 1.28 : 1.12) * mul,
    fill: (familyRowThumb ? 0.52 : 0.38) * mul
  };
}

/** @param {string | undefined | null} hex */
export function isEcorcheFamilyRowIdlePaint(hex) {
  return hex === ECORCHE_FAMILY_ROW_IDLE;
}

/** @param {string | undefined | null} hex */
export function isEcorcheIdlePaint(hex) {
  return hex === ECORCHE_IDLE_UNIFORM || hex === '#3a2222' || hex === ECORCHE_FAMILY_ROW_IDLE;
}
