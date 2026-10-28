/**
 * Préférences des fonds d'accueil : like (poids rotation) et masquage temporaire.
 * @module homepageImagePreferences
 */

import {
  DEFAULT_WALLPAPER_WEIGHT,
  LIKED_WALLPAPER_WEIGHT,
  pickInitialWallpaperIndex,
  pickNextWallpaperIndex
} from './wallpaperPlayback';

export const HOMEPAGE_LIKED_WEIGHT = LIKED_WALLPAPER_WEIGHT;
export const HOMEPAGE_DEFAULT_WEIGHT = DEFAULT_WALLPAPER_WEIGHT;

function hashPrefix(str, len = 40) {
  if (!str || typeof str !== 'string') return 'empty';
  return str.slice(22, 22 + len);
}

function getImageFullSrc(image) {
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image?.full) return image.full;
  return '';
}

/** Clé stable liée au contenu (survit à la perte de `id` au reload IndexedDB). */
export function homepageImageContentPrefKey(image) {
  return `src_${hashPrefix(getImageFullSrc(image), 48)}`;
}

function snapshotDisplayPrefs(img) {
  const prefs = {
    liked: Boolean(img.liked),
    hidden: Boolean(img.hidden),
    useOnHome: img.useOnHome !== false,
    useOnLock: Boolean(img.useOnLock),
  };
  if (getHomepageMediaType(img) === 'video') {
    prefs.mediaType = 'video';
    prefs.allowSound = Boolean(img.allowSound);
    prefs.loop = Boolean(img.loop);
    if (img.name) prefs.name = String(img.name);
  }
  return prefs;
}

function hasNonDefaultDisplayPrefs(img) {
  const isVideo = getHomepageMediaType(img) === 'video';
  return Boolean(
    img.liked ||
      img.hidden ||
      img.useOnHome === false ||
      img.useOnLock ||
      (isVideo && (img.allowSound || img.loop))
  );
}

/** Sources retirées de la banque (fichiers supprimés). */
const REMOVED_WELCOME_VIDEO_BASENAMES = new Set([
  'hous n fire.mp4',
  'hous%20n%20fire.mp4',
  'streetlife.mp4',
]);

export function isRemovedWelcomeVideoSrc(src) {
  if (typeof src !== 'string' || !src.includes('/welcome-videos/')) return false;
  const base = src.split('/').pop()?.split('?')[0] || '';
  let decoded = base;
  try {
    decoded = decodeURIComponent(base);
  } catch {
    /* keep */
  }
  return (
    REMOVED_WELCOME_VIDEO_BASENAMES.has(base.toLowerCase()) ||
    REMOVED_WELCOME_VIDEO_BASENAMES.has(decoded.toLowerCase())
  );
}

/** Retire de la collection les vidéos dont le fichier a été supprimé du dépôt. */
export function purgeRemovedWelcomeVideos(images) {
  if (!Array.isArray(images)) return [];
  return images.filter((img) => !isRemovedWelcomeVideoSrc(getImageFullSrc(img)));
}

/** Identifiant stable pour lier like / masquage à une image. */
export function getHomepageImageId(image, index = 0) {
  if (typeof image === 'object' && image?.id) return String(image.id);
  const full =
    typeof image === 'string'
      ? image
      : typeof image === 'object' && image?.full
        ? image.full
        : '';
  return `img_${index}_${hashPrefix(full)}`;
}

/** @returns {'image' | 'video'} */
export function getHomepageMediaType(image) {
  if (typeof image === 'object' && image !== null) {
    if (image.mediaType === 'video' || image.kind === 'video') return 'video';
    const src = String(image.full || image.src || '');
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(src)) return 'video';
  }
  return 'image';
}

/** Normalise string v2 ou objet v3 avec id / liked / hidden (+ vidéo). */
export function normalizeHomepageImage(image, index = 0) {
  if (typeof image === 'string') {
    return {
      full: image,
      id: getHomepageImageId(image, index),
      liked: false,
      hidden: false,
      useOnHome: true,
      useOnLock: false,
      mediaType: getHomepageMediaType({ full: image }),
      loop: false,
      muted: true,
      allowSound: false,
    };
  }
  if (typeof image === 'object' && image !== null && image.full) {
    const mediaType = getHomepageMediaType(image);
    const allowSound = mediaType === 'video' ? Boolean(image.allowSound) : false;
    return {
      ...image,
      id: image.id || getHomepageImageId(image, index),
      liked: Boolean(image.liked),
      hidden: Boolean(image.hidden),
      useOnHome: image.useOnHome !== false,
      useOnLock: Boolean(image.useOnLock),
      useAsAppStatic: Boolean(image.useAsAppStatic),
      mediaType,
      loop: mediaType === 'video' ? Boolean(image.loop) : false,
      // muted = lecture muette effective ; allowSound = l’utilisateur peut activer le son
      allowSound,
      muted: mediaType === 'video' ? (image.muted !== false && !allowSound ? true : Boolean(image.muted)) : true,
    };
  }
  return image;
}

export function isHomepageVideo(image) {
  return getHomepageMediaType(image) === 'video';
}

export function normalizeHomepageImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map((img, i) => normalizeHomepageImage(img, i));
}

export function getHomepageImageThumbSrc(image) {
  const norm = normalizeHomepageImage(image);
  if (typeof norm === 'object' && norm?.thumbnail) return norm.thumbnail;
  if (typeof norm === 'object' && norm?.full) return norm.full;
  return typeof norm === 'string' ? norm : '';
}

export function getHomepageImageFullSrc(image) {
  const norm = normalizeHomepageImage(image);
  if (typeof norm === 'object' && norm?.full) return norm.full;
  return typeof norm === 'string' ? norm : '';
}

/** Applique les préférences persistées (map id / src → prefs affichage + vidéo). */
export function applyHomepageImagePreferences(images, preferences = {}) {
  const prefs = preferences && typeof preferences === 'object' ? preferences : {};
  return normalizeHomepageImages(images).map((img, i) => {
    const id = getHomepageImageId(img, i);
    const p = prefs[id] || prefs[homepageImageContentPrefKey(img)];
    if (!p) return img;
    const next = {
      ...img,
      liked: Boolean(p.liked),
      hidden: Boolean(p.hidden),
      useOnHome: p.useOnHome !== false,
      useOnLock: Boolean(p.useOnLock),
    };
    if (p.mediaType === 'video' || getHomepageMediaType(img) === 'video') {
      if (p.allowSound !== undefined) next.allowSound = Boolean(p.allowSound);
      if (p.loop !== undefined) next.loop = Boolean(p.loop);
      if (p.name) next.name = String(p.name);
      next.mediaType = 'video';
    }
    return next;
  });
}

/** Extrait la map de préférences depuis un tableau d'images. */
export function extractHomepageImagePreferences(images) {
  const out = {};
  normalizeHomepageImages(images).forEach((img, i) => {
    if (!hasNonDefaultDisplayPrefs(img)) return;
    const prefs = snapshotDisplayPrefs(img);
    out[getHomepageImageId(img, i)] = prefs;
    out[homepageImageContentPrefKey(img)] = prefs;
  });
  return out;
}

/**
 * Reconstruit un objet image v3 depuis un enregistrement HomepageImagesDB.
 * Restaure id / liked / hidden / useOnHome / useOnLock s’ils ont été persistés.
 */
export function hydrateHomepageImageFromDbItem(item, index = 0) {
  if (!item) return null;

  const base =
    item.version === '3.0' && item.thumbnail
      ? {
          full: item.data,
          thumbnail: item.thumbnail,
          format: item.format,
          metadata: item.metadata
        }
      : typeof item.data === 'string'
        ? { full: item.data }
        : item.data && typeof item.data === 'object'
          ? item.data
          : null;

  if (!base || !base.full) {
    return typeof item.data === 'string' ? item.data : null;
  }

  return normalizeHomepageImage(
    {
      ...base,
      id: item.imageId || base.id,
      liked: item.liked ?? base.liked,
      hidden: item.hidden ?? base.hidden,
      useOnHome: item.useOnHome ?? base.useOnHome,
      useOnLock: item.useOnLock ?? base.useOnLock,
      mediaType: item.mediaType ?? base.mediaType,
      allowSound: item.allowSound ?? base.allowSound,
      loop: item.loop ?? base.loop,
      name: item.name ?? base.name,
      videoId: item.videoId ?? base.videoId,
    },
    index
  );
}

export function readHomepagePreferencesFromStorage(storageKey) {
  if (!storageKey) return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.preferences && typeof parsed.preferences === 'object' ? parsed.preferences : {};
  } catch {
    return {};
  }
}

export function writeHomepagePreferencesToStorage(storageKey, images, baseMeta = {}) {
  if (!storageKey) return;
  try {
    const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const metadata = {
      ...existing,
      ...baseMeta,
      preferences: extractHomepageImagePreferences(images),
      preferencesUpdated: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(metadata));
  } catch {
    // non bloquant
  }
}

function matchesHomeMediaKinds(img, mediaKinds) {
  if (!mediaKinds || mediaKinds === 'all') return true;
  const isVideo = getHomepageMediaType(img) === 'video';
  if (mediaKinds === 'videos') return isVideo;
  if (mediaKinds === 'images') return !isVideo;
  return true;
}

/**
 * Indices éligibles à la rotation accueil.
 * `hidden` / filtre photos|vidéos masquent l’affichage sans retirer la sélection.
 * @param {unknown[]} images
 * @param {{ mediaKinds?: string }} [options]
 */
export function getVisibleHomepageImageIndices(images, options = {}) {
  const mediaKinds = options.mediaKinds;
  return normalizeHomepageImages(images)
    .map((img, i) =>
      img.hidden || img.useOnHome === false || !matchesHomeMediaKinds(img, mediaKinds) ? -1 : i
    )
    .filter((i) => i >= 0);
}

/**
 * Pool pondéré pour la rotation (likées = plus de poids).
 * @param {unknown[]} images
 * @param {{ mediaKinds?: string }} [options]
 * @returns {{ origIndex: number, weight: number }[]}
 */
export function buildHomepageWeightedPool(images, options = {}) {
  const mediaKinds = options.mediaKinds;
  const pool = [];
  normalizeHomepageImages(images).forEach((img, origIndex) => {
    if (img.hidden || img.useOnHome === false) return;
    if (!matchesHomeMediaKinds(img, mediaKinds)) return;
    pool.push({
      origIndex,
      weight: img.liked ? HOMEPAGE_LIKED_WEIGHT : HOMEPAGE_DEFAULT_WEIGHT
    });
  });
  return pool;
}

/** Prochain index (dans le tableau complet) selon les poids ; évite la répétition si possible. */
export function pickNextHomepageImageIndex(images, currentIndex, options = {}) {
  const pool = buildHomepageWeightedPool(images, options);
  if (pool.length === 0) return -1;
  if (pool.length === 1) return pool[0].origIndex;

  const poolIdx = pickNextWallpaperIndex(
    pool.length,
    pool.findIndex((p) => p.origIndex === currentIndex),
    { order: options.order, weights: pool.map((p) => p.weight) }
  );
  return pool[poolIdx]?.origIndex ?? pool[0].origIndex;
}

/** Index initial parmi les images visibles (aléatoire pondéré ou premier selon l’ordre). */
export function pickInitialHomepageImageIndex(images, options = {}) {
  const pool = buildHomepageWeightedPool(images, options);
  // Pool vide (ex. « vidéos uniquement » sans vidéo) → -1, pas l’index 0 (souvent une photo).
  if (pool.length === 0) return -1;
  const poolIdx = pickInitialWallpaperIndex(pool.length, {
    order: options.order,
    weights: pool.map((p) => p.weight)
  });
  return pool[poolIdx]?.origIndex ?? pool[0].origIndex;
}
