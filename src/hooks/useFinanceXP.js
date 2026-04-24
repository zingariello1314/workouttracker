/**
 * XP Finance — agrège bourse (contexte), planificateur, investissements, budget, smart shopping.
 * À utiliser uniquement sous FinanceProvider.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { usePlanificateur } from './usePlanificateur';
import { useInvestissements } from './useInvestissements';
import { budgetStorage } from '../services/finance/budgetStorage';
import { smartShoppingStorage } from '../services/finance/smartShoppingStorage';
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';
import { computeFinanceXp, FINANCE_XP_PER_LEVEL } from '../services/xp/financeXpRules';
import { levelProgressFromXpAmount } from '../utils/xpLevelFromAmount';

export function useFinanceXP() {
  const { portfolio, loading: financeLoading } = useFinance();
  const plan = usePlanificateur();
  const inv = useInvestissements();

  const [budgetSnap, setBudgetSnap] = useState({ depensesCount: 0, categoriesCount: 0 });
  const [refreshTick, setRefreshTick] = useState(0);

  const bump = useCallback(() => {
    setRefreshTick((n) => n + 1);
  }, []);

  const reloadBudget = useCallback(async () => {
    try {
      const [depenses, cats] = await Promise.all([
        budgetStorage.loadDepenses(),
        budgetStorage.loadCategories(),
      ]);
      setBudgetSnap({
        depensesCount: Array.isArray(depenses) ? depenses.length : 0,
        categoriesCount: Array.isArray(cats) ? cats.length : 0,
      });
    } catch {
      setBudgetSnap({ depensesCount: 0, categoriesCount: 0 });
    }
  }, []);

  useEffect(() => {
    void reloadBudget();
    const unsub = sidebarEvents.on(SIDEBAR_EVENTS.FINANCE_UPDATED, () => {
      bump();
      void reloadBudget();
    });
    const onVis = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        bump();
        void reloadBudget();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reloadBudget, bump]);

  useEffect(() => {
    const id = window.setInterval(() => bump(), 120_000);
    return () => window.clearInterval(id);
  }, [bump]);

  const shoppingSnap = useMemo(() => {
    void refreshTick;
    try {
      const listes = smartShoppingStorage.getListes() || [];
      const articles = listes.reduce(
        (s, l) => s + (Array.isArray(l?.articles) ? l.articles.length : 0),
        0
      );
      const done = listes.filter((l) => l?.statut === 'completee').length;
      return { listes: listes.length, articles, done };
    } catch {
      return { listes: 0, articles: 0, done: 0 };
    }
  }, [refreshTick]);

  const { totalXP, breakdown } = useMemo(
    () =>
      computeFinanceXp({
        portfolio,
        salaire: plan.salaire,
        repartition: plan.repartition,
        objectifs: plan.objectifs,
        achatsLoisirs: plan.achatsLoisirs,
        or: inv.or,
        liquidites: inv.liquidites,
        bourseCrypto: inv.bourseCrypto,
        allocation: inv.allocation,
        budgetDepensesCount: budgetSnap.depensesCount,
        budgetCategoriesCount: budgetSnap.categoriesCount,
        shoppingListesCount: shoppingSnap.listes,
        shoppingArticlesCount: shoppingSnap.articles,
        shoppingListesCompletees: shoppingSnap.done,
      }),
    [
      portfolio,
      plan.salaire,
      plan.repartition,
      plan.objectifs,
      plan.achatsLoisirs,
      inv.or,
      inv.liquidites,
      inv.bourseCrypto,
      inv.allocation,
      budgetSnap.depensesCount,
      budgetSnap.categoriesCount,
      shoppingSnap.listes,
      shoppingSnap.articles,
      shoppingSnap.done,
    ]
  );

  const levelInfo = useMemo(
    () => levelProgressFromXpAmount(totalXP, FINANCE_XP_PER_LEVEL),
    [totalXP]
  );

  return {
    totalXP,
    breakdown,
    level: levelInfo.level,
    progress: levelInfo.progress,
    isLoading: !!(financeLoading || plan.loading || inv.loading),
  };
}
