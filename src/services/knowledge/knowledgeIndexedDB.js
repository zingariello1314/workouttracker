/**
 * Base de connaissances — persistance locale IndexedDB (catalogue + blobs vidéo).
 * Cloud (R2 / Supabase) : prévu plus tard ; ce module reste la source de vérité locale.
 */

export const KNOWLEDGE_DB_NAME = 'momentum_knowledge_v1';
export const KNOWLEDGE_DB_VERSION = 3;

export const STORE_CATEGORIES = 'categories';
export const STORE_VIDEOS = 'videos';
export const STORE_VIDEO_BLOBS = 'video_blobs';
export const STORE_VIDEO_THUMBNAILS = 'video_thumbnails';
export const STORE_ARTICLES = 'articles';
export const STORE_NOTES = 'notes';
export const STORE_USER_PREFS = 'user_prefs';

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function slugify(name) {
  const s = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'categorie';
}

function nowIso() {
  return new Date().toISOString();
}

function openKnowledgeDb() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const req = indexedDB.open(KNOWLEDGE_DB_NAME, KNOWLEDGE_DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VIDEOS)) {
        const vs = db.createObjectStore(STORE_VIDEOS, { keyPath: 'id' });
        vs.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_VIDEO_BLOBS)) {
        db.createObjectStore(STORE_VIDEO_BLOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_VIDEO_THUMBNAILS)) {
        db.createObjectStore(STORE_VIDEO_THUMBNAILS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ARTICLES)) {
        const as = db.createObjectStore(STORE_ARTICLES, { keyPath: 'id' });
        as.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        const ns = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
        ns.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_USER_PREFS)) {
        db.createObjectStore(STORE_USER_PREFS, { keyPath: 'userId' });
      }
      void event.oldVersion;
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function idbErrorMessage(err) {
  if (!err) return 'Transaction IndexedDB échouée';
  const name = err.name || '';
  if (name === 'QuotaExceededError') {
    return 'Espace de stockage navigateur insuffisant pour cette vidéo';
  }
  if (name === 'NotFoundError') {
    return 'Base de connaissances à mettre à jour — recharge la page';
  }
  return err.message || String(err);
}

/** Handlers AVANT les requêtes put/delete (requis par IndexedDB). */
function txPromise(db, storeNames, mode, fn) {
  return new Promise((resolve, reject) => {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    let tx;
    try {
      tx = db.transaction(names, mode);
    } catch (err) {
      reject(new Error(idbErrorMessage(err)));
      return;
    }
    const stores = Object.fromEntries(names.map((n) => [n, tx.objectStore(n)]));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(new Error(idbErrorMessage(tx.error)));
    tx.onabort = () => reject(new Error(idbErrorMessage(tx.error)));
    try {
      fn(stores, tx);
    } catch (err) {
      try {
        tx.abort();
      } catch {
        /* ignore */
      }
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

async function fileToPersistableBlob(file) {
  const mime = file?.type || 'video/mp4';
  try {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: mime });
  } catch {
    return file instanceof Blob ? file : new Blob([file], { type: mime });
  }
}

async function getAll(storeName) {
  const db = await openKnowledgeDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function getOne(storeName, key) {
  const db = await openKnowledgeDb();
  if (!db || key == null) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function matchesSearch(text, q) {
  if (!q) return true;
  return String(text || '').toLowerCase().includes(q.toLowerCase());
}

function applyHiddenFilter(item, hiddenSet) {
  if (!hiddenSet?.size) return true;
  const cats = item.categoryIds || [];
  if (cats.length === 0) return true;
  return !cats.some((id) => hiddenSet.has(id));
}

function filterByCategory(item, categoryId) {
  if (!categoryId) return true;
  return (item.categoryIds || []).includes(categoryId);
}

function applyIncludeExcludeCategories(item, includeIds, excludeIds) {
  const cats = item.categoryIds || [];
  const include = new Set(includeIds || []);
  const exclude = new Set(excludeIds || []);
  if (include.size > 0 && !cats.some((id) => include.has(id))) return false;
  if (exclude.size > 0 && cats.some((id) => exclude.has(id))) return false;
  return true;
}

function paginate(list, offset, limit) {
  const slice = list.slice(offset, offset + limit);
  return { items: slice, total: list.length, offset, limit };
}

/** @returns {Promise<{ ok: boolean, storage: 'indexeddb' }>} */
export async function getKnowledgeStatus() {
  const db = await openKnowledgeDb();
  return { ok: Boolean(db), storage: 'indexeddb' };
}

export async function listKnowledgeCategories() {
  const rows = await getAll(STORE_CATEGORIES);
  return rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
}

export async function createKnowledgeCategoryLocal(name, color = null) {
  const db = await openKnowledgeDb();
  if (!db) throw new Error('IndexedDB indisponible');
  const existing = await getAll(STORE_CATEGORIES);
  let slug = slugify(name);
  let n = 1;
  while (existing.some((c) => c.slug === slug)) {
    n += 1;
    slug = `${slugify(name)}-${n}`;
  }
  const record = {
    id: newId('cat'),
    name: String(name).trim(),
    slug,
    color,
    sortOrder: 0,
    createdAt: nowIso()
  };
  await txPromise(db, STORE_CATEGORIES, 'readwrite', (stores) => {
    stores[STORE_CATEGORIES].put(record);
  });
  return record;
}

export async function deleteKnowledgeCategoryLocal(categoryId) {
  const db = await openKnowledgeDb();
  if (!db) return false;
  const videos = await getAll(STORE_VIDEOS);
  const articles = await getAll(STORE_ARTICLES);
  const notes = await getAll(STORE_NOTES);
  await txPromise(db, [STORE_CATEGORIES, STORE_VIDEOS, STORE_ARTICLES, STORE_NOTES], 'readwrite', (stores) => {
    stores[STORE_CATEGORIES].delete(categoryId);
    [...videos, ...articles, ...notes].forEach((item) => {
      if (!(item.categoryIds || []).includes(categoryId)) return;
      const store =
        item.id.startsWith('vid_')
          ? STORE_VIDEOS
          : item.id.startsWith('art_')
            ? STORE_ARTICLES
            : STORE_NOTES;
      stores[store].put({
        ...item,
        categoryIds: item.categoryIds.filter((id) => id !== categoryId)
      });
    });
  });
  return true;
}

export async function listKnowledgeVideosLocal({
  categoryId,
  search,
  hiddenCategoryIds = [],
  includeCategoryIds = [],
  excludeCategoryIds = [],
  offset = 0,
  limit = 20
} = {}) {
  const hidden = new Set(hiddenCategoryIds || []);
  const q = search?.trim() || '';
  let rows = await getAll(STORE_VIDEOS);
  rows = rows.filter(
    (v) =>
      filterByCategory(v, categoryId) &&
      applyIncludeExcludeCategories(v, includeCategoryIds, excludeCategoryIds) &&
      applyHiddenFilter(v, categoryId ? null : hidden) &&
      (matchesSearch(v.title, q) || matchesSearch(v.description, q))
  );
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return paginate(rows, offset, limit);
}

export async function getKnowledgeVideoLocal(videoId) {
  return getOne(STORE_VIDEOS, videoId);
}

export async function getKnowledgeVideoBlobLocal(videoId) {
  const rec = await getOne(STORE_VIDEO_BLOBS, videoId);
  return rec?.blob ?? null;
}

export async function getKnowledgeVideoThumbnailBlobLocal(videoId) {
  const rec = await getOne(STORE_VIDEO_THUMBNAILS, videoId);
  return rec?.blob ?? null;
}

export async function getKnowledgeVideoThumbnailUrlLocal(videoId) {
  const blob = await getKnowledgeVideoThumbnailBlobLocal(videoId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * @returns {Promise<{ playUrl: string }>}
 */
export async function getKnowledgeVideoPlayUrlLocal(videoId) {
  const blob = await getKnowledgeVideoBlobLocal(videoId);
  if (!blob) throw new Error('Vidéo introuvable');
  return { playUrl: URL.createObjectURL(blob) };
}

export function revokeKnowledgePlayUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

export async function createKnowledgeVideoLocal({
  title,
  file,
  description = null,
  categoryIds = [],
  durationSec = null,
  thumbnailBlob = null
}) {
  const db = await openKnowledgeDb();
  if (!db || !file) throw new Error('IndexedDB ou fichier manquant');

  const persistableBlob = await fileToPersistableBlob(file);
  const id = newId('vid');
  const ts = nowIso();
  const meta = {
    id,
    title: String(title).trim(),
    description,
    categoryIds: [...categoryIds],
    durationSec,
    mimeType: persistableBlob.type || file.type || 'video/mp4',
    size: file.size || persistableBlob.size || null,
    hasThumbnail: Boolean(thumbnailBlob),
    createdAt: ts,
    updatedAt: ts
  };
  const blobRec = {
    id,
    blob: persistableBlob,
    mimeType: meta.mimeType,
    size: meta.size,
    updatedAt: ts
  };

  const writeVideo = async (withThumbnail) => {
    const storeList = [STORE_VIDEOS, STORE_VIDEO_BLOBS];
    if (withThumbnail && thumbnailBlob) storeList.push(STORE_VIDEO_THUMBNAILS);
    await txPromise(db, storeList, 'readwrite', (s) => {
      s[STORE_VIDEOS].put({ ...meta, hasThumbnail: Boolean(withThumbnail && thumbnailBlob) });
      s[STORE_VIDEO_BLOBS].put(blobRec);
      if (withThumbnail && thumbnailBlob) {
        s[STORE_VIDEO_THUMBNAILS].put({
          id,
          blob: thumbnailBlob,
          mimeType: 'image/jpeg',
          updatedAt: ts
        });
      }
    });
  };

  let savedWithThumbnail = false;
  try {
    await writeVideo(Boolean(thumbnailBlob));
    savedWithThumbnail = Boolean(thumbnailBlob);
  } catch (firstErr) {
    if (!thumbnailBlob) throw firstErr;
    try {
      await writeVideo(false);
    } catch {
      throw firstErr;
    }
  }

  return { ...meta, hasThumbnail: savedWithThumbnail };
}

export async function updateKnowledgeVideoLocal(videoId, patch) {
  const existing = await getKnowledgeVideoLocal(videoId);
  if (!existing) return null;
  const record = {
    ...existing,
    title: patch.title != null ? String(patch.title).trim() : existing.title,
    description: patch.description !== undefined ? patch.description : existing.description,
    categoryIds: patch.categoryIds != null ? [...patch.categoryIds] : existing.categoryIds,
    updatedAt: nowIso()
  };
  const db = await openKnowledgeDb();
  if (!db) return null;
  await txPromise(db, STORE_VIDEOS, 'readwrite', (stores) => {
    stores[STORE_VIDEOS].put(record);
  });
  return record;
}

export async function deleteKnowledgeVideoLocal(videoId) {
  const db = await openKnowledgeDb();
  if (!db) return false;
  await txPromise(
    db,
    [STORE_VIDEOS, STORE_VIDEO_BLOBS, STORE_VIDEO_THUMBNAILS],
    'readwrite',
    (stores) => {
      stores[STORE_VIDEOS].delete(videoId);
      stores[STORE_VIDEO_BLOBS].delete(videoId);
      stores[STORE_VIDEO_THUMBNAILS].delete(videoId);
    }
  );
  return true;
}

/** Stats catalogue pour badge UI. */
export async function getKnowledgeStorageStatsLocal() {
  const [videos, articles, notes, categories, blobs] = await Promise.all([
    getAll(STORE_VIDEOS),
    getAll(STORE_ARTICLES),
    getAll(STORE_NOTES),
    getAll(STORE_CATEGORIES),
    getAll(STORE_VIDEO_BLOBS)
  ]);
  const videoBytes = blobs.reduce((acc, b) => acc + (Number(b.size) || 0), 0);
  const fmt = (n) => {
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`;
  };
  return {
    videoCount: videos.length,
    articleCount: articles.length,
    noteCount: notes.length,
    categoryCount: categories.length,
    videoBytes,
    videoSizeLabel: fmt(videoBytes)
  };
}

/** Bibliothèque : contenu groupé par catégorie (+ sans catégorie). */
export async function listKnowledgeLibraryGroupedLocal({
  type = 'videos',
  search = '',
  hiddenCategoryIds = []
} = {}) {
  const hidden = new Set(hiddenCategoryIds || []);
  const q = search.trim().toLowerCase();
  const store =
    type === 'articles' ? STORE_ARTICLES : type === 'notes' ? STORE_NOTES : STORE_VIDEOS;
  const categories = await listKnowledgeCategories();
  let items = await getAll(store);
  items = items.filter((item) => {
    if (!applyHiddenFilter(item, hidden)) return false;
    if (!q) return true;
    const body = item.body || item.description || '';
    return matchesSearch(item.title, q) || matchesSearch(body, q);
  });
  items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const groups = [];
  const used = new Set();

  categories.forEach((cat) => {
    if (hidden.has(cat.id)) return;
    const inCat = items.filter((it) => (it.categoryIds || []).includes(cat.id));
    if (inCat.length === 0) return;
    inCat.forEach((it) => used.add(it.id));
    groups.push({ categoryId: cat.id, categoryName: cat.name, color: cat.color, items: inCat });
  });

  const uncategorized = items.filter((it) => !used.has(it.id));
  if (uncategorized.length > 0) {
    groups.push({ categoryId: null, categoryName: null, items: uncategorized });
  }
  return groups;
}

export async function touchRecentlyWatchedLocal(userId, videoId) {
  const row = (await getOne(STORE_USER_PREFS, userId)) || { userId, hiddenCategoryIds: [], recentVideoIds: [] };
  let recent = Array.isArray(row.recentVideoIds) ? row.recentVideoIds.filter((id) => id !== videoId) : [];
  recent.unshift(videoId);
  recent = recent.slice(0, 12);
  const db = await openKnowledgeDb();
  if (!db) return;
  await txPromise(db, STORE_USER_PREFS, 'readwrite', (stores) => {
    stores[STORE_USER_PREFS].put({
      ...row,
      userId,
      recentVideoIds: recent,
      lastUploadCategoryIds: row.lastUploadCategoryIds || [],
      updatedAt: nowIso()
    });
  });
}

export async function getRecentlyWatchedVideosLocal(userId, limit = 8) {
  const row = await getOne(STORE_USER_PREFS, userId);
  const ids = row?.recentVideoIds || [];
  const out = [];
  for (const id of ids.slice(0, limit)) {
    const v = await getKnowledgeVideoLocal(id);
    if (v) out.push(v);
  }
  return out;
}

export async function listKnowledgeArticlesLocal(opts = {}) {
  const { categoryId, search, hiddenCategoryIds = [], offset = 0, limit = 20 } = opts;
  const hidden = new Set(hiddenCategoryIds || []);
  const q = search?.trim() || '';
  let rows = await getAll(STORE_ARTICLES);
  rows = rows.filter(
    (a) =>
      filterByCategory(a, categoryId) &&
      applyHiddenFilter(a, categoryId ? null : hidden) &&
      (matchesSearch(a.title, q) || matchesSearch(a.body, q))
  );
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const paged = paginate(rows, offset, limit);
  paged.items = paged.items.map((a) => ({
    ...a,
    excerpt: (a.body || '').slice(0, 280)
  }));
  return paged;
}

export async function getKnowledgeArticleLocal(articleId) {
  return getOne(STORE_ARTICLES, articleId);
}

export async function createKnowledgeArticleLocal({ title, body = '', externalUrl = null, categoryIds = [] }) {
  const db = await openKnowledgeDb();
  if (!db) throw new Error('IndexedDB indisponible');
  const ts = nowIso();
  const record = {
    id: newId('art'),
    title: String(title).trim(),
    body,
    externalUrl,
    categoryIds: [...categoryIds],
    createdAt: ts,
    updatedAt: ts
  };
  await txPromise(db, STORE_ARTICLES, 'readwrite', (stores) => {
    stores[STORE_ARTICLES].put(record);
  });
  return record;
}

export async function updateKnowledgeArticleLocal(articleId, patch) {
  const existing = await getKnowledgeArticleLocal(articleId);
  if (!existing) return null;
  const record = {
    ...existing,
    title: patch.title != null ? String(patch.title).trim() : existing.title,
    body: patch.body != null ? patch.body : existing.body,
    externalUrl: patch.externalUrl !== undefined ? patch.externalUrl : existing.externalUrl,
    categoryIds: patch.categoryIds != null ? [...patch.categoryIds] : existing.categoryIds,
    updatedAt: nowIso()
  };
  const db = await openKnowledgeDb();
  if (!db) return null;
  await txPromise(db, STORE_ARTICLES, 'readwrite', (stores) => {
    stores[STORE_ARTICLES].put(record);
  });
  return record;
}

export async function deleteKnowledgeArticleLocal(articleId) {
  const db = await openKnowledgeDb();
  if (!db) return false;
  await txPromise(db, STORE_ARTICLES, 'readwrite', (stores) => {
    stores[STORE_ARTICLES].delete(articleId);
  });
  return true;
}

export async function listKnowledgeNotesLocal(opts = {}) {
  const { categoryId, search, hiddenCategoryIds = [], offset = 0, limit = 20 } = opts;
  const hidden = new Set(hiddenCategoryIds || []);
  const q = search?.trim() || '';
  let rows = await getAll(STORE_NOTES);
  rows = rows.filter(
    (n) =>
      filterByCategory(n, categoryId) &&
      applyHiddenFilter(n, categoryId ? null : hidden) &&
      (matchesSearch(n.title, q) || matchesSearch(n.body, q))
  );
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const paged = paginate(rows, offset, limit);
  paged.items = paged.items.map((n) => ({
    ...n,
    excerpt: (n.body || '').slice(0, 280)
  }));
  return paged;
}

export async function getKnowledgeNoteLocal(noteId) {
  return getOne(STORE_NOTES, noteId);
}

export async function createKnowledgeNoteLocal({ title, body = '', sourceUrls = [], categoryIds = [] }) {
  const db = await openKnowledgeDb();
  if (!db) throw new Error('IndexedDB indisponible');
  const ts = nowIso();
  const record = {
    id: newId('note'),
    title: String(title).trim(),
    body,
    sourceUrls: [...sourceUrls],
    categoryIds: [...categoryIds],
    createdAt: ts,
    updatedAt: ts
  };
  await txPromise(db, STORE_NOTES, 'readwrite', (stores) => {
    stores[STORE_NOTES].put(record);
  });
  return record;
}

export async function updateKnowledgeNoteLocal(noteId, patch) {
  const existing = await getKnowledgeNoteLocal(noteId);
  if (!existing) return null;
  const record = {
    ...existing,
    title: patch.title != null ? String(patch.title).trim() : existing.title,
    body: patch.body != null ? patch.body : existing.body,
    sourceUrls: patch.sourceUrls != null ? [...patch.sourceUrls] : existing.sourceUrls,
    categoryIds: patch.categoryIds != null ? [...patch.categoryIds] : existing.categoryIds,
    updatedAt: nowIso()
  };
  const db = await openKnowledgeDb();
  if (!db) return null;
  await txPromise(db, STORE_NOTES, 'readwrite', (stores) => {
    stores[STORE_NOTES].put(record);
  });
  return record;
}

export async function deleteKnowledgeNoteLocal(noteId) {
  const db = await openKnowledgeDb();
  if (!db) return false;
  await txPromise(db, STORE_NOTES, 'readwrite', (stores) => {
    stores[STORE_NOTES].delete(noteId);
  });
  return true;
}

export async function getKnowledgeUserPrefsLocal(userId) {
  const row = await getOne(STORE_USER_PREFS, userId);
  return {
    userId,
    hiddenCategoryIds: row?.hiddenCategoryIds || [],
    recentVideoIds: row?.recentVideoIds || [],
    lastUploadCategoryIds: row?.lastUploadCategoryIds || []
  };
}

export async function saveKnowledgeLastUploadCategoryIdsLocal(userId, categoryIds) {
  const db = await openKnowledgeDb();
  if (!db) return null;
  const existing = (await getOne(STORE_USER_PREFS, userId)) || { userId };
  const record = {
    ...existing,
    userId,
    hiddenCategoryIds: existing.hiddenCategoryIds || [],
    recentVideoIds: existing.recentVideoIds || [],
    lastUploadCategoryIds: [...(categoryIds || [])],
    updatedAt: nowIso()
  };
  await txPromise(db, STORE_USER_PREFS, 'readwrite', (stores) => {
    stores[STORE_USER_PREFS].put(record);
  });
  return record;
}

export async function saveKnowledgeUserPrefsLocal(userId, hiddenCategoryIds) {
  const db = await openKnowledgeDb();
  if (!db) throw new Error('IndexedDB indisponible');
  const existing = (await getOne(STORE_USER_PREFS, userId)) || {};
  const record = {
    userId,
    hiddenCategoryIds: [...(hiddenCategoryIds || [])],
    recentVideoIds: existing.recentVideoIds || [],
    lastUploadCategoryIds: existing.lastUploadCategoryIds || [],
    updatedAt: nowIso()
  };
  await txPromise(db, STORE_USER_PREFS, 'readwrite', (stores) => {
    stores[STORE_USER_PREFS].put(record);
  });
  return record;
}

/** Miniature JPEG depuis fichier vidéo. */
export function generateVideoThumbnailBlob(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    const finish = (blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(blob);
    };
    const cleanup = () => URL.revokeObjectURL(url);
    const timer = setTimeout(() => finish(null), 8000);
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(1, (video.duration || 1) * 0.1);
      } catch {
        capture();
      }
    };
    video.onseeked = () => capture();
    video.onerror = () => finish(null);
    function capture() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = Math.round((640 * video.videoHeight) / Math.max(1, video.videoWidth)) || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timer);
            finish(blob);
          },
          'image/jpeg',
          0.82
        );
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    }
    video.src = url;
  });
}

/** Durée vidéo (secondes) via élément HTML5 — best effort. */
export function probeVideoDurationSec(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    let settled = false;
    const finish = (d) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    const timer = setTimeout(() => finish(null), 5000);
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const d = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
      finish(d);
    };
    video.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };
    video.src = url;
  });
}
