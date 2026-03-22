/**
 * Patch des catégories fixes V2 (Or, Bourse, Cash) pour aligner Investissements Divers ↔ Planificateur.
 */

export const FIXED_CAT_IDS = {
  loyer: 'cat_loyer',
  courses: 'cat_courses',
  loisirs: 'cat_loisirs',
  or: 'cat_investissementOr',
  bourse: 'cat_bourse',
  cash: 'cat_cash'
};

const DEFAULT_ROW = {
  [FIXED_CAT_IDS.loyer]: {
    id: FIXED_CAT_IDS.loyer,
    key: 'loyer',
    label: 'Loyer',
    emoji: '🏠',
    type: 'charges',
    subType: 'loyer',
    order: 1
  },
  [FIXED_CAT_IDS.courses]: {
    id: FIXED_CAT_IDS.courses,
    key: 'courses',
    label: 'Courses',
    emoji: '🛒',
    type: 'charges',
    subType: 'courses',
    order: 2
  },
  [FIXED_CAT_IDS.loisirs]: {
    id: FIXED_CAT_IDS.loisirs,
    key: 'loisirs',
    label: 'Loisirs',
    emoji: '🎮',
    type: 'loisirs',
    subType: 'loisirs',
    order: 6
  },
  [FIXED_CAT_IDS.or]: {
    id: FIXED_CAT_IDS.or,
    key: 'investissementOr',
    label: 'Or',
    emoji: '🥇',
    type: 'investissement',
    subType: 'or',
    order: 3
  },
  [FIXED_CAT_IDS.bourse]: {
    id: FIXED_CAT_IDS.bourse,
    key: 'investissementBourse',
    label: 'Bourse',
    emoji: '📈',
    type: 'investissement',
    subType: 'bourse',
    order: 4
  },
  [FIXED_CAT_IDS.cash]: {
    id: FIXED_CAT_IDS.cash,
    key: 'cashAccumulation',
    label: 'Cash',
    emoji: '💰',
    type: 'epargne',
    subType: 'cash',
    order: 5
  }
};

/**
 * Lit le montant d’une catégorie fixe (id ou subType).
 * @returns {number|null} null si la répartition n’a pas encore de lignes exploitables
 */
export function getFixedCategoryMontant(repartition, categoryId, subTypeFallback) {
  if (!repartition?.categories?.length) return null;
  const cats = repartition.categories;
  const byId = cats.find((c) => c?.id === categoryId);
  if (byId && typeof byId.montant === 'number' && !Number.isNaN(byId.montant)) {
    return byId.montant;
  }
  if (subTypeFallback) {
    const bySub = cats.find((c) => c?.subType === subTypeFallback);
    if (bySub && typeof bySub.montant === 'number' && !Number.isNaN(bySub.montant)) {
      return bySub.montant;
    }
  }
  return null;
}

/**
 * Met à jour (ou crée) une ligne fixe dans repartition.categories.
 */
export function repartitionPatchFixedCategoryMontant(repartition, categoryId, montant) {
  const amount = Math.max(0, Number(montant) || 0);
  const prev = [...(repartition?.categories || [])];
  const i = prev.findIndex((c) => c?.id === categoryId);
  if (i >= 0) {
    prev[i] = { ...prev[i], montant: amount };
  } else {
    const def = DEFAULT_ROW[categoryId];
    if (!def) {
      throw new Error(`[repartitionPatchFixedCategoryMontant] id inconnu: ${categoryId}`);
    }
    prev.push({ ...def, montant: amount, fixed: true });
  }
  return {
    ...(repartition || {}),
    id: repartition?.id || 'current',
    categories: prev,
    updatedAt: new Date().toISOString()
  };
}

const ALL_PATCHABLE_FIXED_IDS = new Set(Object.keys(DEFAULT_ROW));

/**
 * Met à jour le montant d’une ligne planificateur (fixes connues ou id déjà présent dans categories).
 */
export function repartitionSetCategoryMontant(repartition, planifCategoryId, montant) {
  if (!planifCategoryId) return repartition;
  const amount = Math.max(0, Number(montant) || 0);
  if (ALL_PATCHABLE_FIXED_IDS.has(planifCategoryId)) {
    return repartitionPatchFixedCategoryMontant(repartition, planifCategoryId, amount);
  }
  const prev = [...(repartition?.categories || [])];
  const i = prev.findIndex((c) => c?.id === planifCategoryId);
  if (i < 0) return repartition;
  prev[i] = { ...prev[i], montant: amount };
  return {
    ...(repartition || {}),
    id: repartition?.id || 'current',
    categories: prev,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Fusionne des champs (libellé, emoji, sous-catégories, type, montant optionnel) sur une ligne existante.
 */
export function repartitionMergeCategoryFields(repartition, planifCategoryId, patch) {
  if (!planifCategoryId || !patch || typeof patch !== 'object') return repartition;
  const prev = [...(repartition?.categories || [])];
  const i = prev.findIndex((c) => c?.id === planifCategoryId);
  if (i < 0) return repartition;
  const cur = prev[i];
  const nextRow = { ...cur };
  if (patch.label != null) nextRow.label = String(patch.label).trim() || cur.label;
  if (patch.emoji != null) nextRow.emoji = String(patch.emoji).slice(0, 10) || cur.emoji;
  if (patch.type != null) nextRow.type = patch.type;
  if (patch.sousCategories != null) {
    nextRow.sousCategories = Array.isArray(patch.sousCategories) ? [...patch.sousCategories] : [];
  }
  if (patch.montant != null && typeof patch.montant === 'number' && !Number.isNaN(patch.montant)) {
    nextRow.montant = Math.max(0, patch.montant);
  }
  prev[i] = nextRow;
  return {
    ...(repartition || {}),
    id: repartition?.id || 'current',
    categories: prev,
    updatedAt: new Date().toISOString()
  };
}
