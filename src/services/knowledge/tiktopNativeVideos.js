/**
 * Vidéos TikTop natives (dossier public/tiktop-videos), injectées dans IndexedDB
 * sans blob — lecture via URL statique.
 */
import {
  createKnowledgeCategoryLocal,
  listKnowledgeCategories,
  openKnowledgeDb,
  STORE_VIDEOS
} from './knowledgeIndexedDB';

const SEEDED_FLAG = 'momentum_tiktop_native_seed_v1';

function nowIso() {
  return new Date().toISOString();
}

async function txPutVideos(records) {
  const db = await openKnowledgeDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VIDEOS], 'readwrite');
    const store = tx.objectStore(STORE_VIDEOS);
    for (const rec of records) store.put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Crée les catégories manquantes et enregistre les vidéos natives (idempotent).
 * @returns {Promise<{ added: number, categories: number }>}
 */
export async function ensureTiktopNativeVideosSeeded() {
  let manifest;
  try {
    const res = await fetch('/tiktop-videos/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return { added: 0, categories: 0 };
    manifest = await res.json();
  } catch {
    return { added: 0, categories: 0 };
  }

  const videos = Array.isArray(manifest?.videos) ? manifest.videos : [];
  if (!videos.length) return { added: 0, categories: 0 };

  let categories = await listKnowledgeCategories();
  const byName = new Map(
    categories.map((c) => [String(c.name || '').trim().toLocaleLowerCase('fr'), c])
  );

  const themeToCategoryId = {};
  for (const theme of manifest.themes || []) {
    const label = theme.label || theme.id;
    const key = String(label).trim().toLocaleLowerCase('fr');
    let cat = byName.get(key);
    if (!cat) {
      cat = await createKnowledgeCategoryLocal(label);
      byName.set(key, cat);
      categories = [...categories, cat];
    }
    themeToCategoryId[theme.id] = cat.id;
  }

  const db = await openKnowledgeDb();
  if (!db) return { added: 0, categories: Object.keys(themeToCategoryId).length };

  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VIDEOS], 'readonly');
    const req = tx.objectStore(STORE_VIDEOS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  const existingIds = new Set(existing.map((v) => v.id));

  const toAdd = [];
  const ts = nowIso();
  for (const item of videos) {
    if (!item?.id || !item?.src) continue;
    if (existingIds.has(item.id)) continue;
    const categoryId = themeToCategoryId[item.theme];
    toAdd.push({
      id: item.id,
      title: item.title || item.file || item.id,
      description: `TikTop · ${item.themeLabel || item.theme}`,
      categoryIds: categoryId ? [categoryId] : [],
      durationSec: null,
      mimeType: 'video/mp4',
      size: null,
      hasThumbnail: false,
      source: 'native-tiktop',
      nativeSrc: item.src,
      theme: item.theme,
      createdAt: ts,
      updatedAt: ts,
    });
  }

  if (toAdd.length) await txPutVideos(toAdd);

  try {
    localStorage.setItem(
      SEEDED_FLAG,
      JSON.stringify({ at: ts, count: videos.length, added: toAdd.length })
    );
  } catch {
    /* ignore */
  }

  return { added: toAdd.length, categories: Object.keys(themeToCategoryId).length };
}
