/**
 * Façade Base de connaissances — IndexedDB local (pas de serveur requis).
 * Sync cloud (R2 / Supabase) : à brancher plus tard sans changer les vues.
 */

import {
  createKnowledgeArticleLocal,
  createKnowledgeCategoryLocal,
  createKnowledgeNoteLocal,
  createKnowledgeVideoLocal,
  deleteKnowledgeArticleLocal,
  deleteKnowledgeCategoryLocal,
  deleteKnowledgeNoteLocal,
  deleteKnowledgeVideoLocal,
  generateVideoThumbnailBlob,
  getKnowledgeArticleLocal,
  getKnowledgeNoteLocal,
  getKnowledgeStatus,
  getKnowledgeStorageStatsLocal,
  getKnowledgeUserPrefsLocal,
  getKnowledgeVideoPlayUrlLocal,
  getKnowledgeVideoThumbnailUrlLocal,
  getRecentlyWatchedVideosLocal,
  listKnowledgeArticlesLocal,
  listKnowledgeCategories,
  listKnowledgeLibraryGroupedLocal,
  listKnowledgeNotesLocal,
  listKnowledgeVideosLocal,
  revokeKnowledgePlayUrl,
  saveKnowledgeUserPrefsLocal,
  touchRecentlyWatchedLocal,
  updateKnowledgeArticleLocal,
  updateKnowledgeNoteLocal,
  probeVideoDurationSec
} from './knowledgeIndexedDB';

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    })
  ]);
}

export {
  revokeKnowledgePlayUrl,
  probeVideoDurationSec,
  getKnowledgeVideoThumbnailUrlLocal as fetchKnowledgeVideoThumbnailUrl
};

export function fetchKnowledgeStorageStats() {
  return getKnowledgeStorageStatsLocal();
}

export function fetchKnowledgeLibraryGrouped(type, opts = {}) {
  return listKnowledgeLibraryGroupedLocal({ type, ...opts });
}

export function touchRecentlyWatched(userId, videoId) {
  return touchRecentlyWatchedLocal(userId, videoId);
}

export function fetchRecentlyWatchedVideos(userId, limit = 8) {
  return getRecentlyWatchedVideosLocal(userId, limit);
}

export function fetchKnowledgeStatus() {
  return getKnowledgeStatus();
}

export function fetchKnowledgeCategories() {
  return listKnowledgeCategories();
}

export function createKnowledgeCategory(name, color) {
  return createKnowledgeCategoryLocal(name, color);
}

export function deleteKnowledgeCategory(categoryId) {
  return deleteKnowledgeCategoryLocal(categoryId);
}

export function fetchKnowledgeVideos({
  categoryId,
  search,
  offset = 0,
  limit = 20,
  hiddenCategoryIds = [],
  includeCategoryIds = [],
  excludeCategoryIds = []
} = {}) {
  return listKnowledgeVideosLocal({
    categoryId,
    search,
    offset,
    limit,
    hiddenCategoryIds,
    includeCategoryIds,
    excludeCategoryIds
  });
}

export function fetchKnowledgeVideoPlayUrl(videoId) {
  return getKnowledgeVideoPlayUrlLocal(videoId);
}

/** @deprecated cloud — no-op côté IndexedDB */
export function requestKnowledgeVideoUploadUrl() {
  return Promise.resolve({ uploadUrl: null, objectKey: null });
}

/** @deprecated cloud — no-op */
export function uploadFileToPresignedUrl() {
  return Promise.resolve();
}

/**
 * Crée une vidéo : `{ title, file, categoryIds, description?, durationSec? }`
 * ou legacy cloud `{ title, objectKey, categoryIds }` sans file → rejeté.
 */
export async function createKnowledgeVideo(payload) {
  if (payload?.file) {
    const [durationSec, thumbnailBlob] = await Promise.all([
      payload.durationSec != null
        ? Promise.resolve(payload.durationSec)
        : withTimeout(probeVideoDurationSec(payload.file), 5000, null),
      withTimeout(generateVideoThumbnailBlob(payload.file), 8000, null)
    ]);
    return createKnowledgeVideoLocal({
      title: payload.title,
      file: payload.file,
      description: payload.description,
      categoryIds: payload.categoryIds || [],
      durationSec,
      thumbnailBlob
    });
  }
  throw new Error('Fichier vidéo requis (stockage local IndexedDB)');
}

export function deleteKnowledgeVideo(videoId) {
  return deleteKnowledgeVideoLocal(videoId);
}

export function fetchKnowledgeArticles(opts = {}) {
  return listKnowledgeArticlesLocal(opts);
}

export function fetchKnowledgeArticle(articleId) {
  return getKnowledgeArticleLocal(articleId);
}

export function createKnowledgeArticle(payload) {
  return createKnowledgeArticleLocal({
    title: payload.title,
    body: payload.body,
    externalUrl: payload.externalUrl,
    categoryIds: payload.categoryIds || []
  });
}

export function updateKnowledgeArticle(articleId, payload) {
  return updateKnowledgeArticleLocal(articleId, payload);
}

export function deleteKnowledgeArticle(articleId) {
  return deleteKnowledgeArticleLocal(articleId);
}

export function fetchKnowledgeNotes(opts = {}) {
  return listKnowledgeNotesLocal(opts);
}

export function fetchKnowledgeNote(noteId) {
  return getKnowledgeNoteLocal(noteId);
}

export function createKnowledgeNote(payload) {
  return createKnowledgeNoteLocal({
    title: payload.title,
    body: payload.body,
    sourceUrls: payload.sourceUrls || [],
    categoryIds: payload.categoryIds || []
  });
}

export function updateKnowledgeNote(noteId, payload) {
  return updateKnowledgeNoteLocal(noteId, payload);
}

export function deleteKnowledgeNote(noteId) {
  return deleteKnowledgeNoteLocal(noteId);
}

export function fetchKnowledgeUserPrefs(userId) {
  return getKnowledgeUserPrefsLocal(userId);
}

export function saveKnowledgeUserPrefs(userId, hiddenCategoryIds) {
  return saveKnowledgeUserPrefsLocal(userId, hiddenCategoryIds);
}
