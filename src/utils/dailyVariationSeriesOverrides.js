/**
 * Surcharges journalières du texte « séries × reps » (dailyVariations) pour un jour donné.
 * Permet d’adapter le prévu du jour (ex. 4×10 → 5×15) sans modifier le programme source :
 * calculateAutoReps, affichage et cohérence des reps saisies utilisent alors le prévu du jour.
 */

/**
 * @param {Object|null|undefined} dailyVariations
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Record<string, string>} clés = id d’exercice (string), valeurs = texte séries (ex. "5×15")
 */
export function getExerciseSeriesOverrides(dailyVariations, dateStr) {
  const raw = dailyVariations?.[dateStr]?.exerciseSeriesOverrides;
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) out[String(k)] = s;
  }
  return out;
}

/**
 * Applique les surcharges de `series` sur une liste d’exercices (copie superficielle par item).
 * @param {Array<Object>} exercises
 * @param {Record<string, string>} overrides
 */
export function mergeSeriesIntoProgramExercises(exercises, overrides) {
  if (!Array.isArray(exercises) || exercises.length === 0) return exercises || [];
  if (!overrides || typeof overrides !== 'object' || Object.keys(overrides).length === 0) {
    return exercises;
  }
  return exercises.map((ex) => {
    if (!ex || typeof ex.id !== 'number') return ex;
    const key = String(ex.id);
    const ov = overrides[key] ?? overrides[ex.id];
    if (ov && String(ov).trim()) {
      return { ...ex, series: String(ov).trim() };
    }
    return ex;
  });
}

/** Normalise une chaîne séries (accepte "x" ou "×"). */
export function normalizeSeriesInputForStorage(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s) return '';
  s = s.replace(/\s+/g, '').replace(/[xX]/g, '×');
  return s;
}

/**
 * @returns {Record<string, { name: string, databaseKey: string, materiel?: string }>}
 */
export function getExerciseVariationOverrides(dailyVariations, dateStr) {
  const raw = dailyVariations?.[dateStr]?.exerciseVariationOverrides;
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue;
    const name = String(v.name || '').trim();
    const databaseKey = String(v.databaseKey || '').trim();
    if (!name) continue;
    out[String(k)] = {
      name,
      databaseKey: databaseKey || undefined,
      materiel: v.materiel != null ? String(v.materiel) : undefined
    };
  }
  return out;
}

export function mergeVariationOverridesIntoProgramExercises(exercises, overrides) {
  if (!Array.isArray(exercises) || !overrides || Object.keys(overrides).length === 0) {
    return exercises || [];
  }
  return exercises.map((ex) => {
    if (!ex || typeof ex.id !== 'number') return ex;
    const ov = overrides[String(ex.id)] ?? overrides[ex.id];
    if (!ov) return ex;
    return {
      ...ex,
      name: ov.name,
      ...(ov.materiel ? { materiel: ov.materiel } : {}),
      variationDatabaseKey: ov.databaseKey,
      notes: ex.notes
    };
  });
}
