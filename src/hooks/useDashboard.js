/**
 * useDashboard Hook
 * State management centralisé pour le Dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  newsAPI,
  initDashboard 
} from '../services/dashboard/dashboardStorage';

export const useDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State - Module conservé
  const [newsData, setNewsData] = useState(null);

  // ============================================================================
  // LOAD DATA - Module conservé
  // ============================================================================

  const loadNews = useCallback(async (category = 'tout') => {
    try {
      const data = await newsAPI.get({ category, page: 1, pageSize: 20 });
      setNewsData(data);
    } catch (err) {
      console.error('Error loading news:', err);
      throw err;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await initDashboard();
      await loadNews();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadNews]);

  // ✅ CORRECTION : Ne charger les news que si on est sur le dashboard
  // Évite les appels API inutiles au démarrage
  // Le hook est monté même si DashboardTab n'est pas rendu, donc on attend le montage du composant
  const [shouldLoadNews, setShouldLoadNews] = useState(false);
  
  useEffect(() => {
    // Écouter les changements d'onglet pour activer le chargement
    const handleTabChange = (e) => {
      if (e.detail?.tab === 'dashboard') {
        setShouldLoadNews(true);
      }
    };
    
    // Vérifier si on est déjà sur le dashboard au montage
    const checkInitialTab = () => {
      const isDashboardActive = document.body.classList.contains('dashboard-active') || 
                                window.location.hash === '#dashboard';
      if (isDashboardActive) {
        setShouldLoadNews(true);
      }
    };
    
    checkInitialTab();
    window.addEventListener('tab-change', handleTabChange);
    
    return () => {
      window.removeEventListener('tab-change', handleTabChange);
    };
  }, []);
  
  // Charger les news seulement si shouldLoadNews est true
  useEffect(() => {
    if (shouldLoadNews) {
      loadAll();
    } else {
      // Ne pas charger initDashboard ici pour éviter les appels inutiles
      // Il sera chargé quand on ouvrira le dashboard
      setLoading(false);
    }
  }, [shouldLoadNews, loadAll]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    loading,
    error,
    newsData,
    
    // Refresh
    refreshAll: loadAll,
    refreshNews: loadNews
  };
};

export default useDashboard;
