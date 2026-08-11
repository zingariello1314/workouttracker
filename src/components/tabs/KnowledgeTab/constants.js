/**
 * Sous-vues Base de connaissances.
 */
export const KNOWLEDGE_VIEW_IDS = {
  VIDEOS: 'videos',
  ARTICLES: 'articles',
  NOTES: 'notes'
};

export const KNOWLEDGE_VIEWS = [
  { id: KNOWLEDGE_VIEW_IDS.VIDEOS, labelKey: 'knowledge.views.videos', icon: '🎥' }
];

export const KNOWLEDGE_ACTIVE_VIEW_LS = 'knowledge.activeView';
export const KNOWLEDGE_PAGE_SIZE = 20;

export const KNOWLEDGE_SECTION = {
  FEED: 'feed',
  LIBRARY: 'library',
  CATEGORIES: 'categories'
};

export const KNOWLEDGE_VIDEO_SECTIONS = [
  { id: KNOWLEDGE_SECTION.FEED, labelKey: 'knowledge.sections.feed', icon: '📡' },
  { id: KNOWLEDGE_SECTION.LIBRARY, labelKey: 'knowledge.sections.library', icon: '📚' },
  { id: KNOWLEDGE_SECTION.CATEGORIES, labelKey: 'knowledge.sections.categories', icon: '🏷️' }
];

export const KNOWLEDGE_TEXT_SECTIONS = [
  { id: KNOWLEDGE_SECTION.FEED, labelKey: 'knowledge.sections.feed', icon: '📡' },
  { id: KNOWLEDGE_SECTION.LIBRARY, labelKey: 'knowledge.sections.library', icon: '📚' }
];

export const KNOWLEDGE_VIDEO_SECTION_LS = 'knowledge.videos.section';
export const KNOWLEDGE_LIBRARY_SORT_LS = 'knowledge.library.sort';

/** Tri bibliothèque vidéos par date d'import. */
export const KNOWLEDGE_LIBRARY_SORT = {
  NEWEST: 'newest',
  OLDEST: 'oldest'
};

export function readStoredLibrarySort() {
  try {
    const v = localStorage.getItem(KNOWLEDGE_LIBRARY_SORT_LS);
    if (v === KNOWLEDGE_LIBRARY_SORT.OLDEST) return KNOWLEDGE_LIBRARY_SORT.OLDEST;
  } catch {
    /* ignore */
  }
  return KNOWLEDGE_LIBRARY_SORT.NEWEST;
}

export function persistLibrarySort(sort) {
  try {
    localStorage.setItem(KNOWLEDGE_LIBRARY_SORT_LS, sort);
  } catch {
    /* ignore */
  }
}

export const KNOWLEDGE_ARTICLE_SECTION_LS = 'knowledge.articles.section';
export const KNOWLEDGE_NOTE_SECTION_LS = 'knowledge.notes.section';

export function readStoredSection(key, allowed, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v && allowed.some((x) => x.id === v)) return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

export const KNOWLEDGE_FEED_INCLUDE_LS = 'knowledge.feed.includeCategories';
export const KNOWLEDGE_FEED_EXCLUDE_LS = 'knowledge.feed.excludeCategories';

export function readStoredFeedCategoryFilters(userId) {
  const suffix = userId ? `_${userId}` : '';
  try {
    const include = JSON.parse(localStorage.getItem(`${KNOWLEDGE_FEED_INCLUDE_LS}${suffix}`) || '[]');
    const exclude = JSON.parse(localStorage.getItem(`${KNOWLEDGE_FEED_EXCLUDE_LS}${suffix}`) || '[]');
    return {
      includeCategoryIds: Array.isArray(include) ? include : [],
      excludeCategoryIds: Array.isArray(exclude) ? exclude : []
    };
  } catch {
    return { includeCategoryIds: [], excludeCategoryIds: [] };
  }
}

export function persistFeedCategoryFilters(userId, includeCategoryIds, excludeCategoryIds) {
  const suffix = userId ? `_${userId}` : '';
  try {
    localStorage.setItem(`${KNOWLEDGE_FEED_INCLUDE_LS}${suffix}`, JSON.stringify(includeCategoryIds));
    localStorage.setItem(`${KNOWLEDGE_FEED_EXCLUDE_LS}${suffix}`, JSON.stringify(excludeCategoryIds));
  } catch {
    /* ignore */
  }
}

export function readStoredKnowledgeView() {
  try {
    const v = localStorage.getItem(KNOWLEDGE_ACTIVE_VIEW_LS);
    if (v && KNOWLEDGE_VIEWS.some((x) => x.id === v)) return v;
  } catch {
    /* ignore */
  }
  return KNOWLEDGE_VIEW_IDS.VIDEOS;
}
