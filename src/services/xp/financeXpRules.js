/**
 * XP du module Finance — agrégation multi-sous-onglets avec courbes favorisant le début de progression.
 * Reste local au module (hors total Momentum global) pour éviter une dépendance au FinanceProvider ailleurs.
 */

/** Palier de niveau « Finance » (entre Livres 500 et Sport 1000). */
export const FINANCE_XP_PER_LEVEL = 750;

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {object} input
 * @param {Array<object>} [input.portfolio]
 * @param {object|null} [input.salaire]
 * @param {object|null} [input.repartition]
 * @param {Array} [input.objectifs]
 * @param {Array} [input.achatsLoisirs]
 * @param {object|null} [input.or]
 * @param {object|null} [input.liquidites]
 * @param {object|null} [input.bourseCrypto]
 * @param {object|null} [input.allocation]
 * @param {number} [input.budgetDepensesCount]
 * @param {number} [input.budgetCategoriesCount]
 * @param {number} [input.shoppingListesCount]
 * @param {number} [input.shoppingArticlesCount]
 * @param {number} [input.shoppingListesCompletees]
 */
export function computeFinanceXp(input = {}) {
  const breakdown = {
    bourseBase: 0,
    bourseInvested: 0,
    bourseLive: 0,
    planRepartition: 0,
    planObjectifs: 0,
    planSalaire: 0,
    planLoisirs: 0,
    investPatrimoine: 0,
    investPositions: 0,
    budgetDepenses: 0,
    budgetCategories: 0,
    shoppingLists: 0,
    shoppingArticles: 0,
    shoppingDone: 0,
  };

  const portfolio = Array.isArray(input.portfolio) ? input.portfolio : [];

  // —— Bourse : entrées rapides (racine) puis rendements décroissants sur l’encours saisi
  breakdown.bourseBase = Math.round(Math.min(260, 50 * Math.sqrt(portfolio.length + 0.2)));
  let live = 0;
  portfolio.forEach((p) => {
    const q = safeNum(p?.quantite);
    const entry = safeNum(p?.prixEntree);
    const invested = Math.max(0, q * entry);
    breakdown.bourseInvested += Math.min(
      420,
      Math.round(92 * Math.log1p(invested / 180))
    );
    if (p?.yahooData && safeNum(p.yahooData.prixActuel) > 0) live += 1;
  });
  breakdown.bourseLive = Math.round(Math.min(180, 26 * Math.sqrt(live + 0.2)));

  // —— Planificateur
  const cats = input.repartition?.categories;
  if (Array.isArray(cats)) {
    const active = cats.filter(
      (c) =>
        c &&
        c.type !== 'surplus' &&
        safeNum(c.montant) > 0
    ).length;
    breakdown.planRepartition = Math.round(Math.min(240, 13 * active));
  }
  const objN = Array.isArray(input.objectifs) ? input.objectifs.length : 0;
  breakdown.planObjectifs = Math.round(Math.min(900, 40 * objN));

  const net = safeNum(input.salaire?.netMensuel);
  if (net > 0) {
    breakdown.planSalaire = Math.round(
      Math.min(210, 68 * Math.log1p(net / 400))
    );
  }
  const loisirsN = Array.isArray(input.achatsLoisirs) ? input.achatsLoisirs.length : 0;
  breakdown.planLoisirs = Math.round(Math.min(320, 16 * Math.sqrt(loisirsN + 0.15)));

  // —— Investissements (patrimoine saisi + nombre de lignes)
  const d = input.allocation?.details || {};
  const valor =
    safeNum(d.valorisationOr) +
    safeNum(d.totalLiquidites) +
    safeNum(d.valorisationBourseCrypto);
  breakdown.investPatrimoine = Math.round(
    Math.min(480, 58 * Math.log1p(valor / 450))
  );
  const bcPos = Array.isArray(input.bourseCrypto?.positions)
    ? input.bourseCrypto.positions.length
    : 0;
  const orOk = input.or && safeNum(input.or.stockActuel) >= 0;
  const liqOk = input.liquidites && safeNum(input.liquidites.stockTotal) >= 0;
  breakdown.investPositions = Math.round(
    Math.min(200, 22 * bcPos) + (orOk ? 36 : 0) + (liqOk ? 28 : 0)
  );

  // —— Budget
  const depN = Math.max(0, Math.floor(safeNum(input.budgetDepensesCount)));
  const catN = Math.max(0, Math.floor(safeNum(input.budgetCategoriesCount)));
  breakdown.budgetDepenses = Math.round(Math.min(650, 2.8 * Math.sqrt(depN + 0.5)));
  breakdown.budgetCategories = Math.round(Math.min(180, 11 * Math.sqrt(catN + 0.3)));

  // —— Smart Shopping
  const listN = Math.max(0, Math.floor(safeNum(input.shoppingListesCount)));
  const artN = Math.max(0, Math.floor(safeNum(input.shoppingArticlesCount)));
  const doneN = Math.max(0, Math.floor(safeNum(input.shoppingListesCompletees)));
  breakdown.shoppingLists = Math.round(Math.min(200, 20 * Math.sqrt(listN + 0.2)));
  breakdown.shoppingArticles = Math.round(Math.min(380, 3.2 * Math.sqrt(artN + 0.5)));
  breakdown.shoppingDone = Math.round(Math.min(280, 62 * Math.sqrt(doneN + 0.2)));

  const totalXP = Math.round(
    breakdown.bourseBase +
      breakdown.bourseInvested +
      breakdown.bourseLive +
      breakdown.planRepartition +
      breakdown.planObjectifs +
      breakdown.planSalaire +
      breakdown.planLoisirs +
      breakdown.investPatrimoine +
      breakdown.investPositions +
      breakdown.budgetDepenses +
      breakdown.budgetCategories +
      breakdown.shoppingLists +
      breakdown.shoppingArticles +
      breakdown.shoppingDone
  );

  return { totalXP, breakdown };
}
