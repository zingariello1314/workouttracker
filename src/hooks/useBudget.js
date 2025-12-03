/**
 * Hook principal pour la gestion du budget personnel
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { budgetStorage } from '../services/finance/budgetStorage';
import logger from '../utils/logger';

const log = logger.module('useBudget');

export const useBudget = () => {
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [depensesPlanifiees, setDepensesPlanifiees] = useState([]);
  const [chargesFixes, setChargesFixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetData, categoriesData, depensesData, planifieesData, chargesData] = await Promise.all([
        budgetStorage.loadBudget(),
        budgetStorage.loadCategories(),
        budgetStorage.loadDepenses(),
        budgetStorage.loadDepensesPlanifiees(),
        budgetStorage.loadChargesFixes()
      ]);

      setBudget(budgetData);
      setCategories(categoriesData);
      setDepenses(depensesData);
      setDepensesPlanifiees(planifieesData);
      setChargesFixes(chargesData);
    } catch (err) {
      log.error('Error loading budget data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== BUDGET ==========
  const updateBudget = useCallback(async (updates) => {
    try {
      const updatedBudget = { ...budget, ...updates };
      const saved = await budgetStorage.saveBudget(updatedBudget);
      setBudget(saved);
      return saved;
    } catch (err) {
      log.error('Error updating budget:', err);
      setError(err);
      throw err;
    }
  }, [budget]);

  // ========== CATEGORIES ==========
  const addCategory = useCallback(async (category) => {
    try {
      const saved = await budgetStorage.saveCategory(category);
      setCategories(prev => [...prev, saved].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)));
      return saved;
    } catch (err) {
      log.error('Error adding category:', err);
      setError(err);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (categoryId, updates) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) throw new Error('Category not found');
      
      const updated = { ...category, ...updates };
      const saved = await budgetStorage.saveCategory(updated);
      setCategories(prev => prev.map(c => c.id === categoryId ? saved : c));
      return saved;
    } catch (err) {
      log.error('Error updating category:', err);
      setError(err);
      throw err;
    }
  }, [categories]);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      await budgetStorage.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err) {
      log.error('Error deleting category:', err);
      setError(err);
      throw err;
    }
  }, []);

  const reorderCategories = useCallback(async (newOrder) => {
    try {
      await budgetStorage.reorderCategories(newOrder);
      setCategories(newOrder);
    } catch (err) {
      log.error('Error reordering categories:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== DEPENSES ==========
  const addDepense = useCallback(async (depense) => {
    try {
      const saved = await budgetStorage.saveDepense(depense);
      setDepenses(prev => [saved, ...prev]);
      return saved;
    } catch (err) {
      log.error('Error adding depense:', err);
      setError(err);
      throw err;
    }
  }, []);

  const updateDepense = useCallback(async (depenseId, updates) => {
    try {
      const depense = depenses.find(d => d.id === depenseId);
      if (!depense) throw new Error('Depense not found');
      
      const updated = { ...depense, ...updates };
      const saved = await budgetStorage.saveDepense(updated);
      setDepenses(prev => prev.map(d => d.id === depenseId ? saved : d));
      return saved;
    } catch (err) {
      log.error('Error updating depense:', err);
      setError(err);
      throw err;
    }
  }, [depenses]);

  const deleteDepense = useCallback(async (depenseId) => {
    try {
      await budgetStorage.deleteDepense(depenseId);
      setDepenses(prev => prev.filter(d => d.id !== depenseId));
    } catch (err) {
      log.error('Error deleting depense:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== DEPENSES PLANIFIEES ==========
  const addDepensePlanifiee = useCallback(async (depensePlanifiee) => {
    try {
      const saved = await budgetStorage.saveDepensePlanifiee(depensePlanifiee);
      setDepensesPlanifiees(prev => [...prev, saved].sort((a, b) => new Date(a.date) - new Date(b.date)));
      return saved;
    } catch (err) {
      log.error('Error adding depense planifiee:', err);
      setError(err);
      throw err;
    }
  }, []);

  const updateDepensePlanifiee = useCallback(async (depenseId, updates) => {
    try {
      const depense = depensesPlanifiees.find(d => d.id === depenseId);
      if (!depense) throw new Error('Depense planifiee not found');
      
      const updated = { ...depense, ...updates };
      const saved = await budgetStorage.saveDepensePlanifiee(updated);
      setDepensesPlanifiees(prev => prev.map(d => d.id === depenseId ? saved : d));
      return saved;
    } catch (err) {
      log.error('Error updating depense planifiee:', err);
      setError(err);
      throw err;
    }
  }, [depensesPlanifiees]);

  const deleteDepensePlanifiee = useCallback(async (depenseId) => {
    try {
      await budgetStorage.deleteDepensePlanifiee(depenseId);
      setDepensesPlanifiees(prev => prev.filter(d => d.id !== depenseId));
    } catch (err) {
      log.error('Error deleting depense planifiee:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== CHARGES FIXES ==========
  const addChargeFixe = useCallback(async (charge) => {
    try {
      const saved = await budgetStorage.saveChargeFixe(charge);
      setChargesFixes(prev => [...prev, saved]);
      return saved;
    } catch (err) {
      log.error('Error adding charge fixe:', err);
      setError(err);
      throw err;
    }
  }, []);

  const updateChargeFixe = useCallback(async (chargeId, updates) => {
    try {
      const charge = chargesFixes.find(c => c.id === chargeId);
      if (!charge) throw new Error('Charge fixe not found');
      
      const updated = { ...charge, ...updates };
      const saved = await budgetStorage.saveChargeFixe(updated);
      setChargesFixes(prev => prev.map(c => c.id === chargeId ? saved : c));
      return saved;
    } catch (err) {
      log.error('Error updating charge fixe:', err);
      setError(err);
      throw err;
    }
  }, [chargesFixes]);

  const deleteChargeFixe = useCallback(async (chargeId) => {
    try {
      await budgetStorage.deleteChargeFixe(chargeId);
      setChargesFixes(prev => prev.filter(c => c.id !== chargeId));
    } catch (err) {
      log.error('Error deleting charge fixe:', err);
      setError(err);
      throw err;
    }
  }, []);

  // ========== CALCULS ==========
  const calculateMetrics = useCallback((mois = null) => {
    if (!budget) return null;

    const moisActuel = mois || new Date().toISOString().slice(0, 7);
    const depensesMois = depenses.filter(d => {
      const dDate = new Date(d.date);
      const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      return dMois === moisActuel;
    });

    const revenus = budget.revenus || 0;
    const depensesTotal = depensesMois.reduce((sum, d) => sum + d.montant, 0);
    const epargne = budget.epargne?.actuelle || 0;
    const restant = revenus - depensesTotal - epargne;
    const pourcentUtilise = revenus > 0 ? (depensesTotal / revenus) * 100 : 0;

    // Projection fin de mois
    const joursEcoules = new Date().getDate();
    const joursTotal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const rythmeActuel = joursEcoules > 0 ? depensesTotal / joursEcoules : 0;
    const projection = rythmeActuel * joursTotal;

    // Statut
    let statut = 'MAITRISE';
    if (pourcentUtilise > 100) statut = 'CRITIQUE';
    else if (pourcentUtilise > 90) statut = 'DEPASSEMENT';
    else if (pourcentUtilise > 75) statut = 'ATTENTION';

    return {
      revenus,
      depenses: depensesTotal,
      epargne,
      restant,
      pourcentUtilise: Math.round(pourcentUtilise * 10) / 10,
      projection,
      statut,
      depensesMois
    };
  }, [budget, depenses]);

  // Dépenses du mois actuel
  const depensesMoisActuel = useMemo(() => {
    const moisActuel = new Date().toISOString().slice(0, 7);
    return depenses.filter(d => {
      const dDate = new Date(d.date);
      const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
      return dMois === moisActuel;
    });
  }, [depenses]);

  return {
    // Data
    budget,
    categories,
    depenses,
    depensesMoisActuel,
    depensesPlanifiees,
    chargesFixes,
    loading,
    error,

    // Actions Budget
    updateBudget,

    // Actions Categories
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Actions Depenses
    addDepense,
    updateDepense,
    deleteDepense,

    // Actions Depenses Planifiées
    addDepensePlanifiee,
    updateDepensePlanifiee,
    deleteDepensePlanifiee,

    // Actions Charges Fixes
    addChargeFixe,
    updateChargeFixe,
    deleteChargeFixe,

    // Calculs
    calculateMetrics,
    refreshData: loadData
  };
};

