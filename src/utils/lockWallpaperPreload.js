/**
 * Préchargement mémoire pour fonds verrouillage / écran d’intro.
 * Les images ne s’affichent qu’une fois décodées en pleine qualité (pas de miniature floue).
 */

import { normalizeHomepageImages } from './homepageImagePreferences';

const LEGACY_BOOTSTRAP_KEY = 'momentum.lockWallpaper.bootstrap.v1';

/** @type {Map<string, HTMLImageElement>} */
const decodedCache = new Map();
/** @type {Map<string, Promise<HTMLImageElement>>} */
const inflight = new Map();

try {
  sessionStorage.removeItem(LEGACY_BOOTSTRAP_KEY);
} catch {
  /* ignore */
}

export function pickRandomWallpaperIndex(urls, excludeIdx = -1) {
  if (!Array.isArray(urls) || urls.length === 0) return 0;
  if (urls.length === 1) return 0;
  if (urls.length === 2) return excludeIdx === 0 ? 1 : 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * urls.length);
  } while (idx === excludeIdx);
  return idx;
}

/** Index de départ : aléatoire parmi les images déjà décodées, sinon aléatoire. */
export function pickInitialLockWallpaperIndex(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return 0;
  if (urls.length === 1) return 0;
  const ready = [];
  for (let i = 0; i < urls.length; i += 1) {
    if (isLockWallpaperDecoded(urls[i])) ready.push(i);
  }
  if (ready.length > 0) {
    return ready[Math.floor(Math.random() * ready.length)];
  }
  return pickRandomWallpaperIndex(urls);
}

export function isLockWallpaperDecoded(url) {
  return Boolean(url && decodedCache.has(url));
}

export function preloadImageUrl(url) {
  if (!url) return Promise.reject(new Error('URL manquante'));
  const cached = decodedCache.get(url);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(url);
  if (pending) return pending;

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') await img.decode();
      } catch {
        /* decode optionnel */
      }
      decodedCache.set(url, img);
      inflight.delete(url);
      resolve(img);
    };
    img.onerror = () => {
      inflight.delete(url);
      reject(new Error('Échec préchargement image'));
    };
    img.src = url;
  });

  inflight.set(url, promise);
  return promise;
}

/** Lecture synchrone des images accueil en cache (session/local) pour le verrou. */
export function readEmergencyHomeImages(scopeKey) {
  if (!scopeKey) return [];
  const tryParse = (raw) => {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.images && Array.isArray(parsed.images)) return parsed.images;
    if (Array.isArray(parsed)) return parsed;
    return null;
  };

  const keys = [
    [`homepage_images_emergency_${scopeKey}`, sessionStorage],
    [`homepage_images_sync_emergency_${scopeKey}`, localStorage],
    [`homepage_images_fallback_${scopeKey}`, localStorage]
  ];

  for (const [key, storage] of keys) {
    try {
      const raw = storage.getItem(key);
      const images = tryParse(raw);
      if (images?.length) return normalizeHomepageImages(images);
    } catch {
      /* ignore */
    }
  }
  return [];
}

export function preloadLockWallpaperUrls(urls) {
  if (!Array.isArray(urls)) return;
  urls.filter(Boolean).forEach((url) => {
    preloadImageUrl(url).catch(() => {});
  });
}

/**
 * Choisit une image aléatoire et la précharge ; retourne l’index + l’URL une fois prête.
 * @param {string[]} urls
 * @param {number} [excludeIdx]
 */
export async function preloadRandomLockWallpaper(urls, excludeIdx = -1) {
  if (!urls?.length) return { index: 0, url: null };

  const readyIndices = urls
    .map((u, i) => (isLockWallpaperDecoded(u) ? i : -1))
    .filter((i) => i >= 0 && i !== excludeIdx);

  const index =
    readyIndices.length > 0
      ? readyIndices[Math.floor(Math.random() * readyIndices.length)]
      : pickRandomWallpaperIndex(urls, excludeIdx);

  const url = urls[index];
  await preloadImageUrl(url);
  return { index, url };
}
