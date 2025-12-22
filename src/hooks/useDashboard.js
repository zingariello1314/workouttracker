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

  // Initial load
  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
