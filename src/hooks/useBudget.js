/**
 * Hook principal pour la gestion du budget personnel
 * Centralise la logique de gestion du budget, catégories et dépenses
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { budgetStorage } from '../services/finance/budgetStorage';
import logger from '../utils/logger';

const log = logger.module('useBudget');

export const useBudget = () => {
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== INITIALISATION ====================

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetData, categoriesData, depensesData] = await Promise.all([
        budgetStorage.loadBudget(),
        budgetStorage.getAllCategories(),
        budgetStorage.getAllDepenses()
      ]);

      setBudget(budgetData || {
        revenus: 0,
        depenses: { categories: [] },
        epargne: { objectif: 0, actuelle: 0 }
      });
      setCategories(categoriesData || []);
      setDepenses(depensesData || []);

      log.info('Budget data loaded');
    } catch (err) {
      log.error('Error loading budget data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== BUDGET ====================

  const updateBudget = useCallback(async (updates) => {
    try {
      setError(null);
      const updatedBudget = { ...budget, ...updates };
      await budgetStorage.saveBudget(updatedBudget);
      setBudget(updatedBudget);
      log.info('Budget updated');
      return true;
    } catch (err) {
      log.error('Error updating budget:', err);
      setError(err.message);
      throw err;
    }
  }, [budget]);

  const updateRevenus = useCallback(async (revenus) => {
    return updateBudget({ revenus });
  }, [updateBudget]);

  const updateEpargne = useCallback(async (epargne) => {
    return updateBudget({ epargne: { ...budget?.epargne, ...epargne } });
  }, [updateBudget, budget]);

  // ==================== CATEGORIES ====================

  const addCategorie = useCallback(async (categorieData) => {
    try {
      setError(null);
      const newCategorie = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nom: categorieData.nom,
        budgetMensuel: categorieData.budgetMensuel || 0,
        depenseActuelle: 0,
        sousCategories: categorieData.sousCategories || [],
        regles: {
          alerte80: categorieData.regles?.alerte80 ?? true,
          alerte100: categorieData.regles?.alerte100 ?? true,
          alerte120: categorieData.regles?.alerte120 ?? true
        },
        icone: categorieData.icone || '💰',
        couleur: categorieData.couleur || '#3b82f6',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await budgetStorage.saveCategory(newCategorie);
      setCategories(prev => [...prev, newCategorie]);
      log.info(`Category ${newCategorie.id} added`);
      return newCategorie;
    } catch (err) {
      log.error('Error adding category:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const updateCategorie = useCallback(async (categoryId, updates) => {
    try {
      setError(null);
      const category = categories.find(c => c.id === categoryId);
      if (!category) {
        throw new Error(`Category ${categoryId} not found`);
      }

      const updatedCategory = {
        ...category,
        ...updates,
        updatedAt: Date.now()
      };

      await budgetStorage.saveCategory(updatedCategory);
      setCategories(prev =>
        prev.map(c => c.id === categoryId ? updatedCategory : c)
      );
      log.info(`Category ${categoryId} updated`);
      return updatedCategory;
    } catch (err) {
      log.error('Error updating category:', err);
      setError(err.message);
      throw err;
    }
  }, [categories]);

  const deleteCategorie = useCallback(async (categoryId) => {
    try {
      setError(null);
      await budgetStorage.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      
      // Supprimer aussi les dépenses associées
      const depensesToDelete = depenses.filter(d => d.categorie === categoryId);
      for (const depense of depensesToDelete) {
        await budgetStorage.deleteDepense(depense.id);
      }
      setDepenses(prev => prev.filter(d => d.categorie !== categoryId));
      
      log.info(`Category ${categoryId} deleted`);
      return true;
    } catch (err) {
      log.error('Error deleting category:', err);
      setError(err.message);
      throw err;
    }
  }, [depenses]);

  const reorderCategories = useCallback(async (newOrder) => {
    try {
      setError(null);
      await budgetStorage.reorderCategories(newOrder);
      setCategories(newOrder);
      log.info('Categories reordered');
      return true;
    } catch (err) {
      log.error('Error reordering categories:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // ==================== DEPENSES ====================

  const addDepensePlanifiee = useCallback(async (depenseData) => {
    try {
      setError(null);
      const newDepense = {
        id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        titre: depenseData.titre,
        montant: depenseData.montant,
        date: depenseData.date,
        categorie: depenseData.categorie,
        statut: depenseData.statut || 'planifie',
        priorite: depenseData.priorite || 'normal',
        datePlanifiee: depenseData.datePlanifiee || depenseData.date,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await budgetStorage.saveDepense(newDepense);
      setDepenses(prev => [...prev, newDepense]);
      
      // Mettre à jour la dépense actuelle de la catégorie
      if (depenseData.categorie) {
        const category = categories.find(c => c.id === depenseData.categorie);
        if (category) {
          await updateCategorie(depenseData.categorie, {
            depenseActuelle: (category.depenseActuelle || 0) + depenseData.montant
          });
        }
      }
      
      log.info(`Depense ${newDepense.id} added`);
      return newDepense;
    } catch (err) {
      log.error('Error adding depense:', err);
      setError(err.message);
      throw err;
    }
  }, [categories, updateCategorie]);

  const updateDepensePlanifiee = useCallback(async (depenseId, updates) => {
    try {
      setError(null);
      const depense = depenses.find(d => d.id === depenseId);
      if (!depense) {
        throw new Error(`Depense ${depenseId} not found`);
      }

      const oldMontant = depense.montant;
      const updatedDepense = {
        ...depense,
        ...updates,
        updatedAt: Date.now()
      };

      await budgetStorage.saveDepense(updatedDepense);
      setDepenses(prev =>
        prev.map(d => d.id === depenseId ? updatedDepense : d)
      );

      // Mettre à jour la dépense actuelle de la catégorie si le montant a changé
      if (updates.montant !== undefined && updates.montant !== oldMontant && depense.categorie) {
        const category = categories.find(c => c.id === depense.categorie);
        if (category) {
          const diff = updates.montant - oldMontant;
          await updateCategorie(depense.categorie, {
            depenseActuelle: (category.depenseActuelle || 0) + diff
          });
        }
      }

      log.info(`Depense ${depenseId} updated`);
      return updatedDepense;
    } catch (err) {
      log.error('Error updating depense:', err);
      setError(err.message);
      throw err;
    }
  }, [depenses, categories, updateCategorie]);

  const deleteDepensePlanifiee = useCallback(async (depenseId) => {
    try {
      setError(null);
      const depense = depenses.find(d => d.id === depenseId);
      if (!depense) {
        throw new Error(`Depense ${depenseId} not found`);
      }

      await budgetStorage.deleteDepense(depenseId);
      setDepenses(prev => prev.filter(d => d.id !== depenseId));

      // Mettre à jour la dépense actuelle de la catégorie
      if (depense.categorie) {
        const category = categories.find(c => c.id === depense.categorie);
        if (category) {
          await updateCategorie(depense.categorie, {
            depenseActuelle: Math.max(0, (category.depenseActuelle || 0) - depense.montant)
          });
        }
      }

      log.info(`Depense ${depenseId} deleted`);
      return true;
    } catch (err) {
      log.error('Error deleting depense:', err);
      setError(err.message);
      throw err;
    }
  }, [depenses, categories, updateCategorie]);

  // ==================== CALCULS ====================

  const calculateMetrics = useCallback(() => {
    if (!budget || categories.length === 0) {
      return null;
    }

    const revenus = budget.revenus || 0;
    const depensesTotal = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
    const epargne = budget.epargne?.actuelle || 0;
    const restant = revenus - depensesTotal - epargne;
    const pourcentUtilise = revenus > 0 ? (depensesTotal / revenus) * 100 : 0;

    // Projection fin de mois
    const now = new Date();
    const joursEcoules = now.getDate();
    const joursTotal = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const rythmeActuel = joursEcoules > 0 ? depensesTotal / joursEcoules : 0;
    const projection = rythmeActuel * joursTotal;

    // Statut intelligent
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
      statut
    };
  }, [budget, categories, depenses]);

  const depensesMoisActuel = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return depenses.filter(d => {
      const depenseDate = new Date(d.date);
      return depenseDate.getFullYear() === year && depenseDate.getMonth() + 1 === month;
    });
  }, [depenses]);

  // ==================== REFRESH ====================

  const refreshData = useCallback(() => {
    return loadAllData();
  }, []);

  return {
    // State
    budget,
    categories,
    depenses,
    depensesMoisActuel,
    loading,
    error,

    // Budget actions
    updateBudget,
    updateRevenus,
    updateEpargne,

    // Category actions
    addCategorie,
    updateCategorie,
    deleteCategorie,
    reorderCategories,

    // Depense actions
    addDepensePlanifiee,
    updateDepensePlanifiee,
    deleteDepensePlanifiee,

    // Calculs
    calculateMetrics,

    // Utils
    refreshData
  };
};

export default useBudget;

