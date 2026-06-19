import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import {
  fetchKnowledgeVideoPlayUrl,
  fetchKnowledgeVideos,
  revokeKnowledgePlayUrl,
  touchRecentlyWatched
} from '../../../../services/knowledge/knowledgeApi';
import { KnowledgeEmptyState } from './KnowledgeUiBlocks';
import { buildSpacedFeedBatch } from '../utils/knowledgeShortsShuffle';

function ShortSlide({ item, index, isActive, userId, setSlideRef, muted, onMutedChange }) {
  const videoRef = useRef(null);
  const playUrlRef = useRef(null);
  const [playUrl, setPlayUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playUrl) return;
    el.muted = muted;
    if (isActive && !muted) {
      el.play().catch(() => {});
    }
  }, [muted, playUrl, isActive]);

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pause();
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    fetchKnowledgeVideoPlayUrl(item.video.id)
      .then(({ playUrl: url }) => {
        if (cancelled) {
          revokeKnowledgePlayUrl(url);
          return;
        }
        playUrlRef.current = url;
        setPlayUrl(url);
        touchRecentlyWatched(userId, item.video.id).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setPlayUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isActive, item.video.id, userId]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !playUrl) return;
    if (isActive) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive, playUrl]);

  useEffect(
    () => () => {
      if (playUrlRef.current) {
        revokeKnowledgePlayUrl(playUrlRef.current);
        playUrlRef.current = null;
      }
    },
    []
  );

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <article
      ref={setSlideRef}
      data-short-slide
      data-index={index}
      className="relative flex h-full min-h-full w-full items-center justify-center bg-black"
    >
      <div className="relative flex h-full w-full max-w-[min(100%,28rem)] flex-col items-center justify-center">
        <div className="relative aspect-[9/16] h-full max-h-full w-auto max-w-full overflow-hidden rounded-lg bg-black shadow-2xl shadow-black/80">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
            </div>
          ) : playUrl ? (
            <video
              ref={videoRef}
              src={playUrl}
              className="h-full w-full object-cover"
              playsInline
              loop
              muted={muted}
              onClick={togglePlay}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              —
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-5 pt-16">
            <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-md">
              {item.video.title}
            </p>
          </div>

          {playUrl ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMutedChange(!muted);
              }}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label={muted ? 'Activer le son' : 'Couper le son'}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function KnowledgeShortsFeed({
  userId,
  hiddenCategoryIds,
  includeCategoryIds = [],
  excludeCategoryIds = [],
  refreshKey = 0
}) {
  const t = useTranslation();
  const scrollerRef = useRef(null);
  const slideRefs = useRef([]);
  const recentVideoIdsRef = useRef([]);
  const [pool, setPool] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [muted, setMuted] = useState(true);

  const loadPool = useCallback(async () => {
    const all = [];
    let offset = 0;
    let total = Infinity;
    while (offset < total) {
      const res = await fetchKnowledgeVideos({
        offset,
        limit: 50,
        hiddenCategoryIds,
        includeCategoryIds,
        excludeCategoryIds
      });
      const batch = res.items || [];
      all.push(...batch);
      total = res.total ?? all.length;
      offset += batch.length;
      if (!batch.length) break;
    }
    return all;
  }, [hiddenCategoryIds, includeCategoryIds, excludeCategoryIds]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPool()
      .then((videos) => {
        if (cancelled) return;
        setPool(videos);
        const batchSize = Math.max(10, videos.length * 2);
        const { items, recentIds } = buildSpacedFeedBatch(videos, batchSize, []);
        recentVideoIdsRef.current = recentIds;
        setFeedItems(items);
        setActiveIndex(0);
        if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPool, refreshKey]);

  const appendMore = useCallback(() => {
    if (!pool.length) return;
    const { items, recentIds } = buildSpacedFeedBatch(pool, 8, recentVideoIdsRef.current);
    recentVideoIdsRef.current = recentIds;
    setFeedItems((prev) => [...prev, ...items]);
  }, [pool]);

  useEffect(() => {
    if (activeIndex >= feedItems.length - 3) appendMore();
  }, [activeIndex, feedItems.length, appendMore]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !feedItems.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.55) return;
          const idx = Number(entry.target.getAttribute('data-index'));
          if (Number.isFinite(idx)) setActiveIndex(idx);
        });
      },
      { root, threshold: [0.55, 0.75] }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [feedItems.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return undefined;
    const onScroll = () => {
      if (root.scrollTop > 40) setShowScrollHint(false);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-16rem)] min-h-[420px] items-center justify-center rounded-2xl border border-violet-500/15 bg-black/80">
        <Loader2 className="h-9 w-9 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!pool.length) {
    return (
      <KnowledgeEmptyState
        title={t('knowledge.emptyVideosFiltered')}
        hint={t('knowledge.emptyVideosFilteredHint')}
      />
    );
  }

  const feedHeightClass =
    includeCategoryIds.length > 0 || excludeCategoryIds.length > 0
      ? 'h-[calc(100dvh-21rem)]'
      : 'h-[calc(100dvh-16rem)]';

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className={`${feedHeightClass} min-h-[380px] snap-y snap-mandatory overflow-y-auto overscroll-y-contain rounded-2xl border border-violet-500/20 bg-black scrollbar-thin scrollbar-track-transparent scrollbar-thumb-violet-500/20`}
        aria-label={t('knowledge.shortsFeed')}
      >
        {feedItems.map((item, index) => (
          <div key={item.key} className="h-full min-h-full w-full snap-start snap-always">
            <ShortSlide
              item={item}
              index={index}
              isActive={index === activeIndex}
              userId={userId}
              muted={muted}
              onMutedChange={setMuted}
              setSlideRef={(el) => {
                slideRefs.current[index] = el;
              }}
            />
          </div>
        ))}
      </div>

      {showScrollHint && feedItems.length > 1 ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70">
          <span className="text-[10px] font-medium uppercase tracking-wider">
            {t('knowledge.shortsScrollHint')}
          </span>
          <ChevronDown size={22} className="animate-bounce" />
        </div>
      ) : null}
    </div>
  );
}
