/**
 * Contrat fonctionnel — organisation des conclusions (Mission 7 §14).
 * Pas de budget arbitraire de cartes : la hiérarchie décrit le rôle, pas un quota UI.
 */

export const CONCLUSION_ROLE = Object.freeze({
  PRINCIPAL: 'principal',
  DEEPENING: 'deepening',
  COMPLEMENTARY: 'complementary_autonomous',
  CATALOG: 'admissible_catalog',
  HISTORICAL: 'analytical_history'
});

/**
 * Classe une ligne publiable selon son rôle dans le pack.
 * Une preuve supplémentaire → deepening, pas une nouvelle principale.
 */
/** Dispositions qui ne peuvent jamais occuper la mise en avant prioritaire (Mission 9). */
export function isNonPriorityDisposition(row) {
  const d = String(row?.p6Disposition || '');
  return d === 'deepening_of_collective' || /^secondary/.test(d);
}

export function classifyConclusionRole(row, { isPriority = false, parentId = null } = {}) {
  if (row?.p6Disposition === 'deepening_of_collective') {
    return {
      role: CONCLUSION_ROLE.DEEPENING,
      parentId: parentId || row?.collapsedInto || null,
      note: 'Approfondissement d’une découverte collective : hors remplissage prioritaire'
    };
  }
  if (isNonPriorityDisposition(row)) {
    return {
      role: CONCLUSION_ROLE.COMPLEMENTARY,
      note: 'Disposition secondaire : accessible, jamais comptée comme principale'
    };
  }
  if (parentId || row?.collapsedInto || row?.p6Disposition === 'source_retained') {
    return {
      role: CONCLUSION_ROLE.DEEPENING,
      parentId: parentId || row?.collapsedInto || null,
      note: 'Preuve ou sous-analyse d’une découverte collective / fusionnée'
    };
  }
  if (isPriority || row?.p6Disposition === 'priority' || row?.p6Disposition === 'promoted_fusion') {
    return {
      role: CONCLUSION_ROLE.PRINCIPAL,
      note: 'Information distincte et importante mise en avant'
    };
  }
  if (row?.p6Disposition === 'exact_duplicate_suppressed') {
    return {
      role: CONCLUSION_ROLE.HISTORICAL,
      note: 'Conservée pour audit, hors catalogue utilisateur'
    };
  }
  return {
    role: CONCLUSION_ROLE.COMPLEMENTARY,
    note: 'Admissible, accessible, hors mise en avant — pas une décharge de cartes faibles'
  };
}

export function buildConclusionHierarchyView({ priority = [], reserve = [], suppressed = [] } = {}) {
  // Garde-fou : un deepening / secondaire égaré dans `priority` est reclassé hors principaux.
  const leaked = priority.filter(isNonPriorityDisposition);
  const principals = priority
    .filter((row) => !isNonPriorityDisposition(row))
    .map((row) => ({
      id: row?.discovery?.id || row?.id,
      title: row?.discovery?.title || row?.title,
      ...classifyConclusionRole(row, { isPriority: true })
    }));
  const complementary = [...leaked, ...reserve].map((row) => ({
    id: row?.discovery?.id || row?.id,
    title: row?.discovery?.title || row?.title,
    ...classifyConclusionRole(row, { isPriority: false })
  }));
  const history = suppressed.map((row) => ({
    id: row?.discovery?.id || row?.id,
    title: row?.discovery?.title || row?.title,
    ...classifyConclusionRole(row)
  }));
  return {
    schema: 'momentum.conclusionHierarchy.v1',
    principals,
    deepenings: [...principals, ...complementary].filter((r) => r.role === CONCLUSION_ROLE.DEEPENING),
    complementary,
    admissibleCatalog: [...principals, ...complementary],
    analyticalHistory: history,
    note: 'Aucun nombre fixe de cartes par catégorie — la qualité et la distinctivité guident la mise en avant.'
  };
}

/**
 * Champs préparatoires P7 (conséquences descriptives seulement en P6).
 * Ne produit pas de recommandations sportives ni de projections physiologiques.
 */
export function p7ActionabilityPrepFields(claimOrDiscovery = {}) {
  const metrics = claimOrDiscovery?.metrics || claimOrDiscovery?.discovery?.metrics || {};
  return {
    schema: 'momentum.p7ActionabilityPrep.v1',
    descriptiveConsequences: metrics.descriptiveConsequences || [],
    conditionalConsequences: metrics.conditionalConsequences || [],
    continuityHypotheses: metrics.continuityHypotheses || [],
    interventionOptions: [], // P7
    followUpIndicators: metrics.followUpIndicators || [],
    contraindications: [], // P7
    sportKnowledgeRefs: [], // P7
    limit: 'P6 autorise seulement les conséquences organisationnelles démontrables. Pas de prédiction physiologique.'
  };
}
