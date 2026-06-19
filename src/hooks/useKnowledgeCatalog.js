import { useCallback, useEffect, useState } from 'react';
import {
  fetchKnowledgeCategories,
  fetchKnowledgeStatus,
  fetchKnowledgeStorageStats,
  fetchKnowledgeUserPrefs,
  saveKnowledgeUserPrefs
} from '../services/knowledge/knowledgeApi';

/**
 * Catalogue Base de connaissances — IndexedDB local (partagé sur cet appareil).
 */
export function useKnowledgeCatalog({ enabled = true, userId = 'anonymous' } = {}) {
  const [categories, setCategories] = useState([]);
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [status, cats, prefs, storageStats] = await Promise.all([
        fetchKnowledgeStatus(),
        fetchKnowledgeCategories(),
        fetchKnowledgeUserPrefs(userId),
        fetchKnowledgeStorageStats()
      ]);
      setStorageReady(Boolean(status?.ok));
      setCategories(Array.isArray(cats) ? cats : []);
      setHiddenCategoryIds(prefs?.hiddenCategoryIds || []);
      setStats(storageStats || null);
    } catch (e) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleHiddenCategory = useCallback(
    async (categoryId) => {
      const next = hiddenCategoryIds.includes(categoryId)
        ? hiddenCategoryIds.filter((id) => id !== categoryId)
        : [...hiddenCategoryIds, categoryId];
      setHiddenCategoryIds(next);
      try {
        await saveKnowledgeUserPrefs(userId, next);
      } catch {
        setHiddenCategoryIds(hiddenCategoryIds);
      }
    },
    [hiddenCategoryIds, userId]
  );

  return {
    categories,
    hiddenCategoryIds,
    storageReady,
    stats,
    loading,
    error,
    reload,
    toggleHiddenCategory,
    setCategories
  };
}
