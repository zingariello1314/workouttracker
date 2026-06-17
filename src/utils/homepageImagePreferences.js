/**
 * Préférences des fonds d'accueil : like (poids rotation) et masquage temporaire.
 * @module homepageImagePreferences
 */

export const HOMEPAGE_LIKED_WEIGHT = 3;
export const HOMEPAGE_DEFAULT_WEIGHT = 1;

function hashPrefix(str, len = 40) {
  if (!str || typeof str !== 'string') return 'empty';
  return str.slice(22, 22 + len);
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

/** Normalise string v2 ou objet v3 avec id / liked / hidden. */
export function normalizeHomepageImage(image, index = 0) {
  if (typeof image === 'string') {
    return {
      full: image,
      id: getHomepageImageId(image, index),
      liked: false,
      hidden: false,
      useOnHome: true,
      useOnLock: false
    };
  }
  if (typeof image === 'object' && image !== null && image.full) {
    return {
      ...image,
      id: image.id || getHomepageImageId(image, index),
      liked: Boolean(image.liked),
      hidden: Boolean(image.hidden),
      useOnHome: image.useOnHome !== false,
      useOnLock: Boolean(image.useOnLock)
    };
  }
  return image;
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

/** Applique les préférences persistées (map id → { liked, hidden }). */
export function applyHomepageImagePreferences(images, preferences = {}) {
  const prefs = preferences && typeof preferences === 'object' ? preferences : {};
  return normalizeHomepageImages(images).map((img, i) => {
    const id = getHomepageImageId(img, i);
    const p = prefs[id];
    if (!p) return img;
    return {
      ...img,
      liked: Boolean(p.liked),
      hidden: Boolean(p.hidden),
      useOnHome: p.useOnHome !== false,
      useOnLock: Boolean(p.useOnLock)
    };
  });
}

/** Extrait la map de préférences depuis un tableau d'images. */
export function extractHomepageImagePreferences(images) {
  const out = {};
  normalizeHomepageImages(images).forEach((img, i) => {
    const id = getHomepageImageId(img, i);
    if (img.liked || img.hidden || img.useOnHome === false || img.useOnLock) {
      out[id] = {
        liked: Boolean(img.liked),
        hidden: Boolean(img.hidden),
        useOnHome: img.useOnHome !== false,
        useOnLock: Boolean(img.useOnLock)
      };
    }
  });
  return out;
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

/** Indices des images non masquées. */
export function getVisibleHomepageImageIndices(images) {
  return normalizeHomepageImages(images)
    .map((img, i) => (img.hidden || img.useOnHome === false ? -1 : i))
    .filter((i) => i >= 0);
}

/**
 * Pool pondéré pour la rotation (likées = plus de poids).
 * @returns {{ origIndex: number, weight: number }[]}
 */
export function buildHomepageWeightedPool(images) {
  const pool = [];
  normalizeHomepageImages(images).forEach((img, origIndex) => {
    if (img.hidden || img.useOnHome === false) return;
    pool.push({
      origIndex,
      weight: img.liked ? HOMEPAGE_LIKED_WEIGHT : HOMEPAGE_DEFAULT_WEIGHT
    });
  });
  return pool;
}

/** Prochain index (dans le tableau complet) selon les poids ; évite la répétition si possible. */
export function pickNextHomepageImageIndex(images, currentIndex) {
  const pool = buildHomepageWeightedPool(images);
  if (pool.length === 0) return -1;
  if (pool.length === 1) return pool[0].origIndex;

  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let r = Math.random() * totalWeight;
    for (const item of pool) {
      r -= item.weight;
      if (r <= 0) {
        if (item.origIndex !== currentIndex) return item.origIndex;
        break;
      }
    }
  }

  const alt = pool.find((p) => p.origIndex !== currentIndex);
  return alt ? alt.origIndex : pool[0].origIndex;
}

/** Index initial aléatoire pondéré parmi les images visibles. */
export function pickInitialHomepageImageIndex(images) {
  const pool = buildHomepageWeightedPool(images);
  if (pool.length === 0) return images?.length > 0 ? 0 : -1;
  const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of pool) {
    r -= item.weight;
    if (r <= 0) return item.origIndex;
  }
  return pool[0].origIndex;
}
