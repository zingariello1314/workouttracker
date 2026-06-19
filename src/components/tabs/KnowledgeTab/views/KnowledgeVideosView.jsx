import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Trash2, Upload, X } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import {
  KNOWLEDGE_SECTION,
  KNOWLEDGE_VIDEO_SECTION_LS,
  KNOWLEDGE_VIDEO_SECTIONS,
  persistFeedCategoryFilters,
  readStoredFeedCategoryFilters,
  readStoredSection
} from '../constants';
import {
  createKnowledgeVideo,
  deleteKnowledgeVideo,
  fetchKnowledgeLibraryGrouped,
  fetchKnowledgeVideoPlayUrl,
  revokeKnowledgePlayUrl,
  touchRecentlyWatched
} from '../../../../services/knowledge/knowledgeApi';
import KnowledgeCategoriesPanel from '../components/KnowledgeCategoriesPanel';
import KnowledgeVideoThumbnail from '../components/KnowledgeVideoThumbnail';
import KnowledgeVideoUploadModal from '../components/KnowledgeVideoUploadModal';
import KnowledgeShortsFeed from '../components/KnowledgeShortsFeed';
import KnowledgeShortsCategoryFilter from '../components/KnowledgeShortsCategoryFilter';
import {
  KnowledgeCategoryChips,
  KnowledgeEmptyState,
  KnowledgeLoading,
  KnowledgeSearchBar,
  KnowledgeSectionTabs
} from '../components/KnowledgeUiBlocks';

function formatDuration(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return null;
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function VideoCardGrid({ video, onPlay, isAdmin, onDelete }) {
  const t = useTranslation();

  return (
    <article className="group overflow-hidden rounded-xl border border-violet-500/20 bg-black/80 ring-1 ring-white/5 transition hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-950/30">
      <button type="button" onClick={() => onPlay(video)} className="block w-full text-left">
        <div className="relative aspect-video overflow-hidden">
          <KnowledgeVideoThumbnail videoId={video.id} />
          {video.durationSec != null ? (
            <span className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
              {formatDuration(video.durationSec)}
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-100">{video.title}</h3>
          {video.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{video.description}</p>
          ) : null}
        </div>
      </button>
      {isAdmin ? (
        <div className="border-t border-violet-500/10 px-3 py-2">
          <button
            type="button"
            onClick={() => onDelete(video)}
            className="flex items-center gap-1 text-[11px] text-rose-400/90 hover:text-rose-300"
          >
            <Trash2 size={12} />
            {t('knowledge.delete')}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function VideoPlayerModal({ video, playUrl, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const t = useTranslation();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden rounded-xl bg-black shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90 hover:border-white/40"
            aria-label={t('knowledge.close')}
            title={t('knowledge.close')}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
          {playUrl ? (
            <video
              key={playUrl}
              src={playUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] bg-black"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 pr-1">
          <h2 className="text-lg font-semibold text-white">{video.title}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrev}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNext}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeVideosView({
  isAdmin,
  categories,
  hiddenCategoryIds,
  onCatalogReload,
  userId,
  toggleHiddenCategory,
  catalogRevision = 0
}) {
  const t = useTranslation();
  const [section, setSection] = useState(() =>
    readStoredSection(KNOWLEDGE_VIDEO_SECTION_LS, KNOWLEDGE_VIDEO_SECTIONS, KNOWLEDGE_SECTION.FEED)
  );
  const [libraryGroups, setLibraryGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [player, setPlayer] = useState({ video: null, playUrl: null, index: -1, list: [] });
  const [shortsRefreshKey, setShortsRefreshKey] = useState(0);
  const feedFiltersInit = readStoredFeedCategoryFilters(userId);
  const [includeCategoryIds, setIncludeCategoryIds] = useState(() => feedFiltersInit.includeCategoryIds);
  const [excludeCategoryIds, setExcludeCategoryIds] = useState(() => feedFiltersInit.excludeCategoryIds);
  const playUrlRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KNOWLEDGE_VIDEO_SECTION_LS, section);
    } catch {
      /* ignore */
    }
  }, [section]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const f = readStoredFeedCategoryFilters(userId);
    setIncludeCategoryIds(f.includeCategoryIds);
    setExcludeCategoryIds(f.excludeCategoryIds);
  }, [userId]);

  useEffect(() => {
    persistFeedCategoryFilters(userId, includeCategoryIds, excludeCategoryIds);
  }, [userId, includeCategoryIds, excludeCategoryIds]);

  const feedCategories = useMemo(
    () => categories.filter((c) => !hiddenCategoryIds.includes(c.id)),
    [categories, hiddenCategoryIds]
  );

  const cycleFeedCategory = (catId) => {
    const inInc = includeCategoryIds.includes(catId);
    const inExc = excludeCategoryIds.includes(catId);
    if (!inInc && !inExc) {
      setIncludeCategoryIds((prev) => [...prev, catId]);
    } else if (inInc) {
      setIncludeCategoryIds((prev) => prev.filter((id) => id !== catId));
      setExcludeCategoryIds((prev) => [...prev, catId]);
    } else {
      setExcludeCategoryIds((prev) => prev.filter((id) => id !== catId));
    }
  };

  const resetFeedFilters = () => {
    setIncludeCategoryIds([]);
    setExcludeCategoryIds([]);
  };

  const loadLibrary = useCallback(async () => {
    let groups = await fetchKnowledgeLibraryGrouped('videos', {
      search: debouncedSearch || undefined,
      hiddenCategoryIds
    });
    if (categoryId) {
      groups = groups.filter((g) => g.categoryId === categoryId);
    }
    setLibraryGroups(groups);
  }, [debouncedSearch, hiddenCategoryIds, categoryId]);

  useEffect(() => {
    if (section !== KNOWLEDGE_SECTION.LIBRARY) return;
    let cancelled = false;
    setLoading(true);
    loadLibrary()
      .catch(() => {
        if (!cancelled) setLibraryGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, loadLibrary]);

  const closePlayer = useCallback(() => {
    if (playUrlRef.current) {
      revokeKnowledgePlayUrl(playUrlRef.current);
      playUrlRef.current = null;
    }
    setPlayer({ video: null, playUrl: null, index: -1, list: [] });
  }, []);

  const openPlayer = async (video, index, list) => {
    if (playUrlRef.current) {
      revokeKnowledgePlayUrl(playUrlRef.current);
      playUrlRef.current = null;
    }
    setPlayer({ video, playUrl: null, index, list });
    touchRecentlyWatched(userId, video.id).catch(() => {});
    try {
      const { playUrl } = await fetchKnowledgeVideoPlayUrl(video.id);
      playUrlRef.current = playUrl;
      setPlayer({ video, playUrl, index, list });
    } catch {
      setPlayer({ video, playUrl: null, index, list });
    }
  };

  const handleUpload = async (payload) => {
    setUploading(true);
    try {
      await createKnowledgeVideo(payload);
      setShowUpload(false);
      setCategoryId('');
      setSearch('');
      if (section === KNOWLEDGE_SECTION.CATEGORIES) {
        setSection(KNOWLEDGE_SECTION.FEED);
      }
      setShortsRefreshKey((k) => k + 1);
      await loadLibrary();
      onCatalogReload?.();
    } catch (e) {
      console.error('[Knowledge] upload failed', e);
      throw e;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm(t('knowledge.confirmDeleteVideo', { title: video.title }))) return;
    await deleteKnowledgeVideo(video.id);
    setLibraryGroups((prev) =>
      prev
        .map((g) => ({
          ...g,
          items: g.items.filter((it) => it.id !== video.id)
        }))
        .filter((g) => g.items.length > 0)
    );
    setShortsRefreshKey((k) => k + 1);
    onCatalogReload?.();
  };

  const uploadButton = isAdmin ? (
    <button
      type="button"
      onClick={() => setShowUpload(true)}
      className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
    >
      <Upload size={16} />
      {t('knowledge.uploadVideo')}
    </button>
  ) : null;

  const showLibraryFilters = section === KNOWLEDGE_SECTION.LIBRARY;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <KnowledgeSectionTabs modes={KNOWLEDGE_VIDEO_SECTIONS} active={section} onChange={setSection} />
        </div>
        {section === KNOWLEDGE_SECTION.FEED && isAdmin ? uploadButton : null}
      </div>

      {showLibraryFilters ? (
        <>
          <KnowledgeSearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('knowledge.searchVideos')}
            action={uploadButton}
          />
          <KnowledgeCategoryChips
            categories={categories}
            activeId={categoryId}
            onSelect={setCategoryId}
            hiddenIds={hiddenCategoryIds}
          />
        </>
      ) : null}

      {section === KNOWLEDGE_SECTION.CATEGORIES ? (
        <KnowledgeCategoriesPanel
          isAdmin={isAdmin}
          categories={categories}
          hiddenCategoryIds={hiddenCategoryIds}
          onCatalogReload={onCatalogReload}
          toggleHiddenCategory={toggleHiddenCategory}
          type="videos"
          contentRevision={catalogRevision}
        />
      ) : section === KNOWLEDGE_SECTION.FEED ? (
        <div className="space-y-3">
          <KnowledgeShortsCategoryFilter
            categories={feedCategories}
            includeCategoryIds={includeCategoryIds}
            excludeCategoryIds={excludeCategoryIds}
            onCycleCategory={cycleFeedCategory}
            onReset={resetFeedFilters}
          />
          <KnowledgeShortsFeed
            userId={userId}
            hiddenCategoryIds={hiddenCategoryIds}
            includeCategoryIds={includeCategoryIds}
            excludeCategoryIds={excludeCategoryIds}
            refreshKey={shortsRefreshKey + catalogRevision}
          />
        </div>
      ) : loading ? (
        <KnowledgeLoading />
      ) : libraryGroups.length === 0 ? (
        <KnowledgeEmptyState title={t('knowledge.emptyLibrary')} hint={t('knowledge.emptyVideosHint')} />
      ) : (
        <div className="space-y-8">
          {libraryGroups.map((group) => (
            <section key={group.categoryId ?? '__none'}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-200">
                <span className="h-px flex-1 bg-violet-500/20" />
                <span>{group.categoryName || t('knowledge.uncategorized')}</span>
                <span className="h-px flex-1 bg-violet-500/20" />
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((video, index) => (
                  <VideoCardGrid
                    key={video.id}
                    video={video}
                    isAdmin={isAdmin}
                    onPlay={(v) => openPlayer(v, index, group.items)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <VideoPlayerModal
        video={player.video}
        playUrl={player.playUrl}
        onClose={closePlayer}
        hasPrev={player.index > 0}
        hasNext={player.index >= 0 && player.index < player.list.length - 1}
        onPrev={() => {
          const i = player.index - 1;
          if (i >= 0) openPlayer(player.list[i], i, player.list);
        }}
        onNext={() => {
          const i = player.index + 1;
          if (i < player.list.length) openPlayer(player.list[i], i, player.list);
        }}
      />

      <KnowledgeVideoUploadModal
        open={showUpload && isAdmin}
        onClose={() => setShowUpload(false)}
        onSubmit={handleUpload}
        uploading={uploading}
        categories={categories}
        onCategoryCreated={onCatalogReload}
      />
    </div>
  );
}
