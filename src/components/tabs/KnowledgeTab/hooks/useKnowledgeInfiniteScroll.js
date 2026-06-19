import { useEffect, useRef } from 'react';

/**
 * Charge la page suivante quand le sentinel entre dans le viewport (scroll page).
 */
export function useKnowledgeInfiniteScroll({
  enabled = true,
  hasMore,
  loading,
  loadingMore,
  onLoadMore
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        onLoadMore();
      },
      { root: null, rootMargin: '240px 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, hasMore, loading, loadingMore, onLoadMore]);

  return sentinelRef;
}
