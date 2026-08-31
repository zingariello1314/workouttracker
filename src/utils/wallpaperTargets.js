/**
 * Cibles d’affichage des fonds : accueil vs verrouillage / écran d’intro.
 */

import {
  getHomepageImageFullSrc,
  normalizeHomepageImage,
  normalizeHomepageImages
} from './homepageImagePreferences';
import { DEFAULT_WALLPAPER_WEIGHT, LIKED_WALLPAPER_WEIGHT } from './wallpaperPlayback';

export function normalizeLockBackgroundItems(lockRecord) {
  const rawItems = Array.isArray(lockRecord?.lockBackgroundItems)
    ? lockRecord.lockBackgroundItems
    : [];
  if (rawItems.length > 0) {
    return rawItems
      .map((item) => {
        if (typeof item === 'string') {
          return { dataUrl: item, liked: false, hidden: false };
        }
        const dataUrl = item?.dataUrl || item?.url || '';
        if (!dataUrl) return null;
        return {
          dataUrl,
          liked: Boolean(item.liked),
          hidden: Boolean(item.hidden)
        };
      })
      .filter(Boolean);
  }

  const urls = Array.isArray(lockRecord?.lockBackgroundDataUrls)
    ? lockRecord.lockBackgroundDataUrls.filter(Boolean)
    : [];
  if (urls.length > 0) {
    return urls.map((dataUrl) => ({ dataUrl, liked: false, hidden: false }));
  }
  const legacy = lockRecord?.lockBackgroundDataUrl;
  return legacy ? [{ dataUrl: legacy, liked: false, hidden: false }] : [];
}

export function lockItemsToPersist(items) {
  const list = (Array.isArray(items) ? items : [])
    .map((item) => {
      const dataUrl = typeof item === 'string' ? item : item?.dataUrl;
      if (!dataUrl) return null;
      return {
        dataUrl,
        liked: Boolean(item?.liked),
        hidden: Boolean(item?.hidden)
      };
    })
    .filter(Boolean);
  return {
    lockBackgroundItems: list,
    lockBackgroundDataUrls: list.map((item) => item.dataUrl),
    lockBackgroundDataUrl: list[0]?.dataUrl || null
  };
}

/** @param {import('./appLockStorage').AppLockRecord|object|null} lockRecord */
export function getLockOnlyWallpaperUrls(lockRecord) {
  return normalizeLockBackgroundItems(lockRecord).map((item) => item.dataUrl);
}

/** Images bibliothèque marquées pour le verrouillage (hors masquées). */
export function getHomeWallpapersForLock(homeImages) {
  return resolveHomeLockEntries(homeImages).map((entry) => entry.url);
}

function resolveHomeLockEntries(homeImages) {
  const entries = [];
  normalizeHomepageImages(homeImages || []).forEach((img, i) => {
    if (!img.useOnLock || img.hidden) return;
    const src = getHomepageImageFullSrc(normalizeHomepageImage(img, i));
    if (!src || entries.some((e) => e.url === src)) return;
    entries.push({
      url: src,
      liked: Boolean(img.liked),
      weight: img.liked ? LIKED_WALLPAPER_WEIGHT : DEFAULT_WALLPAPER_WEIGHT
    });
  });
  return entries;
}

/** Entrées visibles pour le verrou / intro (verrou seul + bibliothèque, hors masquées). */
export function resolveLockWallpaperEntries(homeImages, lockRecord) {
  const entries = [];
  normalizeLockBackgroundItems(lockRecord).forEach((item) => {
    if (item.hidden || !item.dataUrl) return;
    if (entries.some((e) => e.url === item.dataUrl)) return;
    entries.push({
      url: item.dataUrl,
      liked: Boolean(item.liked),
      weight: item.liked ? LIKED_WALLPAPER_WEIGHT : DEFAULT_WALLPAPER_WEIGHT
    });
  });
  resolveHomeLockEntries(homeImages).forEach((entry) => {
    if (entries.some((e) => e.url === entry.url)) return;
    entries.push(entry);
  });
  return entries;
}

export function sameWallpaperUrlList(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((u, i) => u === b[i]);
}

/** Toutes les URLs effectives pour verrou / intro (verrou seul + bibliothèque, hors masquées). */
export function resolveLockWallpaperUrls(homeImages, lockRecord) {
  return resolveLockWallpaperEntries(homeImages, lockRecord).map((entry) => entry.url);
}

/** Images visibles sur la page d’accueil (rotation). */
export function getHomeRotationImages(homeImages) {
  return normalizeHomepageImages(homeImages || []).filter(
    (img) => img.useOnHome !== false && !img.hidden
  );
}
