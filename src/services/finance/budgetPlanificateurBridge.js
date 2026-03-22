/**
 * Synchronisation Budget Personnel ↔ Répartition salaire (planificateur V2)
 */

import logger from '../../utils/logger';
import { budgetStorage } from './budgetStorage';
import { planificateurStorage } from './planificateurStorage';
import {
  repartitionSetCategoryMontant,
  repartitionMergeCategoryFields,
  FIXED_CAT_IDS
} from '../../utils/repartitionFixedCategoryPatch';
import { getCategoryColor } from '../../utils/planificateurUtils';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../utils/sidebarEvents';
import { smartShoppingStorage } from './smartShoppingStorage';

const log = logger.module('budgetPlanificateurBridge');

/** Ligne fixe « Courses » = budget Smart Shopping (répartition ↔ budget ↔ listes). */
export const COURSES_PLANIF_CATEGORY_ID = 'cat_courses';

/** Ids planificateur proposés dans le formulaire budget */
/** Même ordre logique que les lignes fixes du planificateur (répartition salaire). */
export const PLANIF_CATEGORY_LINK_OPTIONS = [
  { id: '', label: 'Aucun lien' },
  { id: 'cat_loyer', label: 'Loyer / Logement' },
  { id: 'cat_courses', label: 'Courses (Smart Shopping)' },
  { id: 'cat_investissementOr', label: 'Or' },
  { id: 'cat_bourse', label: 'Bourse' },
  { id: 'cat_cash', label: 'Cash' },
  { id: 'cat_loisirs', label: 'Loisirs' }
];

export function inferSyncRepartitionCategoryIdFromNom(nom) {
  if (!nom || typeof nom !== 'string') return null;
  const n = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/\b(loyer|logement|rent)\b/.test(n)) return 'cat_loyer';
  if (/\b(courses|course|supermarche|alimentation)\b/.test(n)) return 'cat_courses';
  if (/\bloisir/.test(n)) return 'cat_loisirs';
  if (/\b(cash|liquidit|epargne securite)\b/.test(n)) return 'cat_cash';
  if (/\b(or|lingot)\b/.test(n)) return 'cat_investissementOr';
  if (/\b(bourse|etf|action)\b/.test(n)) return 'cat_bourse';
  return null;
}

export function getMontantForPlanifCategoryId(repartition, planifCategoryId) {
  if (!repartition?.categories || !planifCategoryId) return null;
  const c = repartition.categories.find((x) => x && x.id === planifCategoryId);
  if (c && typeof c.montant === 'number' && !Number.isNaN(c.montant)) return c.montant;
  return null;
}

const PLANIF_FIXED_ID_SET = new Set(Object.values(FIXED_CAT_IDS));

function normLabel(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function sousListEqual(a, b) {
  const aa = Array.isArray(a) ? a : [];
  const bb = Array.isArray(b) ? b : [];
  if (aa.length !== bb.length) return false;
  return aa.every((v, i) => v === bb[i]);
}

const DEFAULT_CATEGORY_REGLES = {
  alerte80: true,
  alerte100: true,
  alerte120: true,
  action80: 'NOTIFICATION',
  action100: 'BLOCK',
  action120: 'BLOCK_STRICT'
};

function normalizeCategoryRegles(r) {
  if (!r || typeof r !== 'object') return { ...DEFAULT_CATEGORY_REGLES };
  return { ...DEFAULT_CATEGORY_REGLES, ...r };
}

function sanitizeSousCategories(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => typeof s === 'string' && String(s).trim().length > 0)
    .map((s) => String(s).trim().slice(0, 100));
}

function getPlanifCategoryRows(repartition) {
  if (!repartition?.categories?.length) return [];
  return repartition.categories.filter((c) => c && c.type !== 'surplus');
}

/**
 * Supprime les catégories budget qui ne correspondent à aucune ligne de la répartition.
 * Ne supprime pas une catégorie encore référencée par des dépenses.
 * @returns {number} nombre de catégories supprimées
 */
export async function pruneBudgetCategoriesNotInPlanificateur(repartition) {
  const rows = getPlanifCategoryRows(repartition);
  const planIds = new Set(rows.map((r) => r.id));
  const categories = (await budgetStorage.loadCategories()) || [];
  let depenses = [];
  try {
    depenses = (await budgetStorage.loadDepenses()) || [];
  } catch (e) {
    log.warn('[pruneBudgetCategoriesNotInPlanificateur] loadDepenses:', e);
  }
  const usedCatIds = new Set(depenses.map((d) => d.categorie).filter(Boolean));
  let removed = 0;

  for (const cat of categories) {
    const linked =
      (cat.syncRepartitionCategoryId && planIds.has(cat.syncRepartitionCategoryId)) ||
      planIds.has(cat.id);
    if (linked) continue;
    if (usedCatIds.has(cat.id)) {
      log.debug('[pruneBudgetCategoriesNotInPlanificateur] Conservée (dépenses liées):', cat.id, cat.nom);
      continue;
    }
    try {
      await budgetStorage.deleteCategory(cat.id);
      removed += 1;
    } catch (e) {
      log.warn('[pruneBudgetCategoriesNotInPlanificateur] Suppression impossible:', cat.id, e);
    }
  }
  return removed;
}

/**
 * Aligne le budget mensuel Smart Shopping sur la ligne Courses du planificateur.
 */
export function syncSmartShoppingBudgetFromPlan(repartition) {
  const rows = repartition?.categories || [];
  const row = rows.find((c) => c && c.id === COURSES_PLANIF_CATEGORY_ID);
  const mensuel =
    row && typeof row.montant === 'number' && !Number.isNaN(row.montant)
      ? Math.max(0, Math.min(10_000_000, row.montant))
      : 0;
  const data = smartShoppingStorage.loadData();
  const depenseCeMois = Math.max(0, Number(data.budget?.depenseCeMois) || 0);
  smartShoppingStorage.updateBudget({
    mensuel,
    depenseCeMois,
    restant: Math.max(0, mensuel - depenseCeMois)
  });
}

/**
 * Met à jour la ligne Courses dans le planificateur (puis propagation habituelle).
 * À utiliser quand l’utilisateur modifie le budget mensuel depuis Smart Shopping.
 */
export async function applySmartShoppingMonthlyBudgetToPlanificateur(mensuel) {
  const amount = Math.max(0, Number(mensuel) || 0);
  const repartition = await planificateurStorage.getRepartition();
  if (!repartition) {
    log.warn('[applySmartShoppingMonthlyBudgetToPlanificateur] Pas de répartition');
    return null;
  }
  const next = repartitionSetCategoryMontant(repartition, COURSES_PLANIF_CATEGORY_ID, amount);
  const saved = await planificateurStorage.saveRepartition(next);
  const { planificateurSync } = await import('./planificateurSync.js');
  await planificateurSync.propagateRepartitionChange(saved);
  sidebarEvents.emit(SIDEBAR_EVENTS.FINANCE_UPDATED, {
    type: 'repartition',
    data: saved
  });
  return saved;
}

/**
 * Pour chaque ligne de répartition (hors surplus), crée ou met à jour une catégorie budget miroir.
 * Montants / icônes / sous-catégories / couleur : alignés sur le planificateur.
 * Nom affiché : conservé si une catégorie budget existait déjà (ex. « Logement » liée à cat_loyer).
 * @returns {number} nombre de catégories budget écrites
 */
export async function mirrorPlanifRowsToBudgetCategories(repartition) {
  const rows = getPlanifCategoryRows(repartition);
  if (!rows.length) return 0;

  let categories = (await budgetStorage.loadCategories()) || [];
  const assigned = new Set();
  let writes = 0;
  const now = new Date().toISOString();
  const sorted = [...rows].sort(
    (a, b) => (a.order ?? a.ordre ?? 99) - (b.order ?? b.ordre ?? 99)
  );

  const findExistingBudget = (P) => {
    const bySameId = categories.find((c) => c && c.id === P.id);
    if (bySameId) return bySameId;
    const bySync = categories.find(
      (c) => c && c.syncRepartitionCategoryId === P.id && !assigned.has(c.id)
    );
    if (bySync) return bySync;
    const inferred = categories.find((c) => {
      if (!c || assigned.has(c.id)) return false;
      if (c.syncRepartitionCategoryId && c.syncRepartitionCategoryId !== P.id) return false;
      const inf = inferSyncRepartitionCategoryIdFromNom(c.nom);
      return inf === P.id;
    });
    if (inferred) return inferred;
    if (!PLANIF_FIXED_ID_SET.has(P.id)) {
      const nm = normLabel(P.label);
      const loose = categories.filter(
        (c) =>
          c &&
          !assigned.has(c.id) &&
          !c.syncRepartitionCategoryId &&
          normLabel(c.nom) === nm
      );
      if (loose.length === 1) return loose[0];
    }
    return null;
  };

  for (const P of sorted) {
    const montantRaw = Number(P.montant);
    const montant = Number.isFinite(montantRaw)
      ? Math.min(10_000_000, Math.max(0, montantRaw))
      : 0;
    const sous = sanitizeSousCategories(P.sousCategories);
    const emoji = (P.emoji || '📁').slice(0, 10);
    const label = String(P.label || 'Catégorie').slice(0, 100);
    const couleur = getCategoryColor(P);

    const B = findExistingBudget(P);
    if (B) assigned.add(B.id);

    if (B) {
      const displayNom =
        typeof B.nom === 'string' && B.nom.trim()
          ? B.nom.trim().slice(0, 100)
          : label;

      const next = {
        ...B,
        nom: displayNom,
        budgetMensuel: montant,
        icone: emoji,
        sousCategories: sous,
        syncRepartitionCategoryId: P.id,
        couleur,
        regles: normalizeCategoryRegles(B.regles),
        updatedAt: now
      };
      const changed =
        B.nom !== next.nom ||
        B.budgetMensuel !== next.budgetMensuel ||
        (B.icone || '📁') !== next.icone ||
        B.syncRepartitionCategoryId !== next.syncRepartitionCategoryId ||
        !sousListEqual(B.sousCategories, next.sousCategories) ||
        (B.couleur || '') !== (next.couleur || '');
      if (changed) {
        try {
          await budgetStorage.saveCategory(next);
          categories = categories.map((c) => (c.id === B.id ? next : c));
          writes += 1;
        } catch (e) {
          log.warn('[mirrorPlanifRowsToBudgetCategories] Sauvegarde catégorie ignorée:', P.id, e);
        }
      }
    } else {
      const maxOrdre = categories.reduce((m, c) => Math.max(m, c.ordre ?? 0), -1);
      const newCat = {
        id: P.id,
        nom: label,
        budgetMensuel: montant,
        sousCategories: sous,
        icone: emoji,
        couleur,
        ordre: maxOrdre + 1,
        syncRepartitionCategoryId: P.id,
        regles: { ...DEFAULT_CATEGORY_REGLES }
      };
      try {
        await budgetStorage.saveCategory(newCat);
        categories = [...categories, newCat];
        assigned.add(newCat.id);
        writes += 1;
      } catch (e) {
        log.warn('[mirrorPlanifRowsToBudgetCategories] Création catégorie ignorée:', P.id, e);
      }
    }
  }

  return writes;
}

/** Somme des budgets type épargne + investissement (vue « épargne » dashboard) */
export function sumEpargneEtInvestissementFromRepartition(repartition) {
  const cats = repartition?.categories || [];
  return cats
    .filter((c) => c && (c.type === 'epargne' || c.type === 'investissement'))
    .reduce((s, c) => s + (Number(c.montant) || 0), 0);
}

/**
 * Applique la répartition + salaire au budget et aux catégories liées (IndexedDB).
 * @returns {{ budgetUpdated: boolean, categoriesUpdated: number }}
 */
export async function syncBudgetPersonnelFromPlanificateurData(repartition, salaireNetMensuel) {
  if (!repartition) {
    return { budgetUpdated: false, categoriesUpdated: 0 };
  }

  const budget = (await budgetStorage.loadBudget()) || budgetStorage.getDefaultBudget();
  let budgetUpdated = false;
  const newBudget = { ...budget };

  const net = Math.max(0, Number(salaireNetMensuel) || 0);
  if (net > 0 && newBudget.revenus !== net) {
    newBudget.revenus = net;
    budgetUpdated = true;
  }

  const epargneCalc = sumEpargneEtInvestissementFromRepartition(repartition);
  newBudget.epargne = {
    objectif: newBudget.epargne?.objectif ?? 0,
    actuelle: epargneCalc
  };
  if ((budget.epargne?.actuelle ?? 0) !== epargneCalc) {
    budgetUpdated = true;
  }

  if (budgetUpdated) {
    await budgetStorage.saveBudget(newBudget);
  }

  const mirrorWrites = await mirrorPlanifRowsToBudgetCategories(repartition);
  let pruned = 0;
  try {
    pruned = await pruneBudgetCategoriesNotInPlanificateur(repartition);
  } catch (e) {
    log.warn('[syncBudgetPersonnelFromPlanificateurData] Prune:', e);
  }
  try {
    syncSmartShoppingBudgetFromPlan(repartition);
  } catch (e) {
    log.warn('[syncBudgetPersonnelFromPlanificateurData] Smart Shopping:', e);
  }

  return {
    budgetUpdated,
    categoriesUpdated: mirrorWrites + pruned
  };
}

/**
 * Pousse le budget mensuel d’une catégorie budget vers le planificateur (ligne liée).
 */
export async function pushCategoryBudgetToPlanificateur(category) {
  const linkId = category?.syncRepartitionCategoryId;
  if (!linkId) return null;

  const repartition = await planificateurStorage.getRepartition();
  if (!repartition) {
    log.warn('[pushCategoryBudgetToPlanificateur] Pas de répartition');
    return null;
  }

  const montant = Math.max(0, Number(category.budgetMensuel) || 0);
  let next = repartitionSetCategoryMontant(repartition, linkId, montant);
  next = repartitionMergeCategoryFields(next, linkId, {
    label: category.nom,
    emoji: category.icone || '📁',
    sousCategories: Array.isArray(category.sousCategories) ? category.sousCategories : []
  });
  const saved = await planificateurStorage.saveRepartition(next);

  const { planificateurSync } = await import('./planificateurSync.js');
  await planificateurSync.propagateRepartitionChange(saved);

  sidebarEvents.emit(SIDEBAR_EVENTS.FINANCE_UPDATED, {
    type: 'repartition',
    data: saved
  });

  return saved;
}

/**
 * Crée une ligne personnalisée dans la répartition pour une catégorie budget sans lien (ni inférence).
 */
export async function ensureBudgetCategoryInPlanificateur(category) {
  if (!category?.id || !category.nom) return null;

  const repartition = await planificateurStorage.getRepartition();
  if (!repartition) {
    log.warn('[ensureBudgetCategoryInPlanificateur] Pas de répartition');
    return null;
  }

  const cats = [...(repartition.categories || [])];
  let idx = -1;
  if (category.syncRepartitionCategoryId) {
    idx = cats.findIndex((c) => c?.id === category.syncRepartitionCategoryId);
  }
  if (idx < 0) idx = cats.findIndex((c) => c?.id === category.id);

  const montant = Math.max(0, Number(category.budgetMensuel) || 0);
  const sous = Array.isArray(category.sousCategories) ? [...category.sousCategories] : [];
  const emoji = (category.icone || '📁').slice(0, 10);

  let linkId;
  if (idx >= 0) {
    const row = cats[idx];
    linkId = row.id;
    const merged = {
      ...row,
      label: category.nom,
      emoji,
      montant,
      sousCategories: sous
    };
    if (!row.fixed) {
      merged.type = row.type || 'autre';
    } else {
      merged.type = row.type;
      merged.fixed = true;
    }
    cats[idx] = merged;
  } else {
    linkId = category.id;
    cats.push({
      id: linkId,
      label: category.nom,
      emoji,
      type: 'autre',
      montant,
      sousCategories: sous,
      fixed: false,
      order: 100 + cats.length
    });
  }

  const nextRep = {
    ...repartition,
    id: repartition.id || 'current',
    categories: cats,
    updatedAt: new Date().toISOString()
  };

  let budgetCategory = category;
  if (category.syncRepartitionCategoryId !== linkId) {
    budgetCategory = await budgetStorage.saveCategory({
      ...category,
      syncRepartitionCategoryId: linkId
    });
  }

  const saved = await planificateurStorage.saveRepartition(nextRep);

  const { planificateurSync } = await import('./planificateurSync.js');
  await planificateurSync.propagateRepartitionChange(saved);

  sidebarEvents.emit(SIDEBAR_EVENTS.FINANCE_UPDATED, {
    type: 'repartition',
    data: saved
  });

  return { saved, budgetCategory };
}

/**
 * Infère un lien planificateur si possible, sinon crée une ligne dédiée.
 */
export async function pushOrEnsureBudgetCategoryToPlanificateur(category) {
  if (!category?.id) return null;
  const inferred =
    category.syncRepartitionCategoryId || inferSyncRepartitionCategoryIdFromNom(category.nom);
  if (inferred) {
    const patched =
      category.syncRepartitionCategoryId === inferred
        ? category
        : await budgetStorage.saveCategory({
            ...category,
            syncRepartitionCategoryId: inferred
          });
    await pushCategoryBudgetToPlanificateur(patched);
    return { budgetCategory: patched };
  }
  return ensureBudgetCategoryInPlanificateur(category);
}
