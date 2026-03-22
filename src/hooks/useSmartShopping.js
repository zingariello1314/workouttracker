/**
 * useSmartShopping - Hook principal Smart Shopping
 * Gestion état + opérations + cache optimisé
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { smartShoppingStorage } from '../services/finance/smartShoppingStorage';
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';

export const useSmartShopping = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================================================
  // LOAD DATA
  // ==========================================================================

  const loadData = useCallback(() => {
    try {
      setLoading(true);
      const loadedData = smartShoppingStorage.loadData();
      setData(loadedData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading smart shopping data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsub = sidebarEvents.on(SIDEBAR_EVENTS.FINANCE_UPDATED, (payload) => {
      if (payload?.type === 'repartition' || payload?.type === 'salaire') {
        loadData();
      }
    });
    return () => unsub();
  }, [loadData]);

  // ==========================================================================
  // BUDGET OPERATIONS
  // ==========================================================================

  const updateBudget = useCallback((budget) => {
    const updated = smartShoppingStorage.updateBudget(budget);
    setData(prev => ({
      ...prev,
      budget: updated
    }));
    return updated;
  }, []);

  // ==========================================================================
  // LISTE OPERATIONS
  // ==========================================================================

  const createListe = useCallback((liste) => {
    const newListe = smartShoppingStorage.createListe(liste);
    setData(prev => ({
      ...prev,
      listes: [...prev.listes, newListe]
    }));
    return newListe;
  }, []);

  const updateListe = useCallback((id, updates) => {
    const updated = smartShoppingStorage.updateListe(id, updates);
    if (updated) {
      setData(prev => ({
        ...prev,
        listes: prev.listes.map(l => l.id === id ? updated : l)
      }));
    }
    return updated;
  }, []);

  const deleteListe = useCallback((id) => {
    smartShoppingStorage.deleteListe(id);
    setData(prev => ({
      ...prev,
      listes: prev.listes.filter(l => l.id !== id)
    }));
  }, []);

  // ==========================================================================
  // ARTICLE OPERATIONS
  // ==========================================================================

  const addArticle = useCallback((listeId, article) => {
    const newArticle = smartShoppingStorage.addArticle(listeId, article);
    if (newArticle) {
      setData(prev => ({
        ...prev,
        listes: prev.listes.map(l => 
          l.id === listeId 
            ? { ...l, articles: [...l.articles, newArticle] }
            : l
        )
      }));
    }
    return newArticle;
  }, []);

  const updateArticle = useCallback((listeId, articleId, updates) => {
    const updated = smartShoppingStorage.updateArticle(listeId, articleId, updates);
    if (updated) {
      setData(prev => ({
        ...prev,
        listes: prev.listes.map(l =>
          l.id === listeId
            ? {
                ...l,
                articles: l.articles.map(a => a.id === articleId ? updated : a)
              }
            : l
        )
      }));
    }
    return updated;
  }, []);

  const deleteArticle = useCallback((listeId, articleId) => {
    smartShoppingStorage.deleteArticle(listeId, articleId);
    setData(prev => ({
      ...prev,
      listes: prev.listes.map(l =>
        l.id === listeId
          ? { ...l, articles: l.articles.filter(a => a.id !== articleId) }
          : l
      )
    }));
  }, []);

  // ==========================================================================
  // INVENTAIRE OPERATIONS
  // ==========================================================================

  const addInventaireItem = useCallback((item) => {
    const newItem = smartShoppingStorage.addInventaireItem(item);
    setData(prev => ({
      ...prev,
      inventaire: {
        ...prev.inventaire,
        articles: [...prev.inventaire.articles, newItem]
      }
    }));
    return newItem;
  }, []);

  const updateInventaireItem = useCallback((id, updates) => {
    const updated = smartShoppingStorage.updateInventaireItem(id, updates);
    if (updated) {
      setData(prev => ({
        ...prev,
        inventaire: {
          ...prev.inventaire,
          articles: prev.inventaire.articles.map(i => i.id === id ? updated : i)
        }
      }));
    }
    return updated;
  }, []);

  const deleteInventaireItem = useCallback((id) => {
    smartShoppingStorage.deleteInventaireItem(id);
    setData(prev => ({
      ...prev,
      inventaire: {
        ...prev.inventaire,
        articles: prev.inventaire.articles.filter(i => i.id !== id)
      }
    }));
  }, []);

  // ==========================================================================
  // COMPUTED VALUES (MEMOIZED)
  // ==========================================================================

  const metrics = useMemo(() => {
    if (!data) return null;
    return smartShoppingStorage.getMetrics();
  }, [data]);

  const alertes = useMemo(() => {
    if (!data) return [];
    
    const alerts = [];
    
    // Budget critique
    if (data.budget.restant < 0) {
      alerts.push({
        type: 'error',
        icon: '🚨',
        message: `Budget dépassé de ${Math.abs(data.budget.restant).toFixed(2)}€`,
        priorite: 'error'
      });
    } else if (data.budget.restant < data.budget.mensuel * 0.1) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        message: `Attention : Il ne reste que ${data.budget.restant.toFixed(2)}€`,
        priorite: 'warning'
      });
    }
    
    // Stock bas
    const stockBas = data.inventaire.articles.filter(i => i.quantite <= i.seuilAlerte);
    if (stockBas.length > 0) {
      alerts.push({
        type: 'info',
        icon: '📦',
        message: `${stockBas.length} article(s) en stock bas`,
        priorite: 'info'
      });
    }
    
    return alerts;
  }, [data]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Data
    budget: data?.budget || null,
    listes: data?.listes || [],
    inventaire: data?.inventaire?.articles || [],
    promos: data?.promos || { sures: [], potentielles: [], nonCiblees: [] },
    profilMarques: data?.profilMarques || {},
    
    // Computed
    metrics,
    alertes,
    
    // State
    loading,
    error,
    
    // Operations
    refreshData: loadData,
    updateBudget,
    createListe,
    updateListe,
    deleteListe,
    addArticle,
    updateArticle,
    deleteArticle,
    addInventaireItem,
    updateInventaireItem,
    deleteInventaireItem
  };
};
