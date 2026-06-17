/**
 * Cibles d’affichage des fonds : accueil vs verrouillage / écran d’intro.
 */

import {
  getHomepageImageFullSrc,
  normalizeHomepageImage,
  normalizeHomepageImages
} from './homepageImagePreferences';

/** @param {import('./appLockStorage').AppLockRecord|object|null} lockRecord */
export function getLockOnlyWallpaperUrls(lockRecord) {
  const fromArray = Array.isArray(lockRecord?.lockBackgroundDataUrls)
    ? lockRecord.lockBackgroundDataUrls.filter(Boolean)
    : [];
  if (fromArray.length > 0) return fromArray;
  const legacy = lockRecord?.lockBackgroundDataUrl;
  return legacy ? [legacy] : [];
}

/** Images bibliothèque marquées pour le verrouillage. */
export function getHomeWallpapersForLock(homeImages) {
  const urls = [];
  normalizeHomepageImages(homeImages || []).forEach((img, i) => {
    if (!img.useOnLock) return;
    const src = getHomepageImageFullSrc(normalizeHomepageImage(img, i));
    if (src && !urls.includes(src)) urls.push(src);
  });
  return urls;
}

/** Toutes les URLs effectives pour verrou / intro (verrou seul + bibliothèque). */
export function resolveLockWallpaperUrls(homeImages, lockRecord) {
  const urls = [];
  getLockOnlyWallpaperUrls(lockRecord).forEach((u) => {
    if (!urls.includes(u)) urls.push(u);
  });
  getHomeWallpapersForLock(homeImages).forEach((u) => {
    if (!urls.includes(u)) urls.push(u);
  });
  return urls;
}

/** Images visibles sur la page d’accueil (rotation). */
export function getHomeRotationImages(homeImages) {
  return normalizeHomepageImages(homeImages || []).filter(
    (img) => img.useOnHome !== false && !img.hidden
  );
}
