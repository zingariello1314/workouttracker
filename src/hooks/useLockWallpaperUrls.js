import { useEffect, useMemo } from 'react';
import { useAppLock } from '../context/AppLockContext';
import { useAuth } from '../context/AuthContext';
import { useHomepageImages } from './useHomepageImages';
import { preloadLockWallpaperUrls, readEmergencyHomeImages } from '../utils/lockWallpaperPreload';
import { resolveLockWallpaperEntries, resolveLockWallpaperUrls } from '../utils/wallpaperTargets';
import {
  resolveLockWallpaperAdvanceOnClick,
  resolveLockWallpaperOrder,
  resolveLockWallpaperRotationMs
} from '../utils/lockWallpaperImage';

function useLockWallpaperSource() {
  const { record } = useAppLock();
  const { currentUser, isAuthenticated } = useAuth();
  const { backgroundImages } = useHomepageImages();

  const scopeKey = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return 'guest';
    return `user-${currentUser.id}`;
  }, [currentUser?.id, isAuthenticated]);

  const effectiveHomeImages = useMemo(() => {
    return backgroundImages?.length > 0 ? backgroundImages : readEmergencyHomeImages(scopeKey);
  }, [backgroundImages, scopeKey]);

  return { record, effectiveHomeImages };
}

/** URLs effectives pour verrouillage + écran d’intro (bibliothèque + fonds verrou seuls). */
export function useLockWallpaperUrls() {
  const { record, effectiveHomeImages } = useLockWallpaperSource();

  const urls = useMemo(
    () => resolveLockWallpaperUrls(effectiveHomeImages, record),
    [
      effectiveHomeImages,
      record?.lockBackgroundDataUrls,
      record?.lockBackgroundDataUrl,
      record?.lockBackgroundItems
    ]
  );

  useEffect(() => {
    preloadLockWallpaperUrls(urls);
  }, [urls]);

  return urls;
}

export function useLockWallpaperPlayback() {
  const { record, effectiveHomeImages } = useLockWallpaperSource();

  const lockItemsKey = (record?.lockBackgroundItems || [])
    .map((item) => `${item?.dataUrl?.length || 0}:${item?.liked ? 1 : 0}${item?.hidden ? 1 : 0}`)
    .join('|');
  const homeLockKey = (effectiveHomeImages || [])
    .map((img, i) => `${img?.id || i}:${img?.useOnLock ? 1 : 0}${img?.hidden ? 1 : 0}${img?.liked ? 1 : 0}`)
    .join('|');

  const entries = useMemo(
    () => resolveLockWallpaperEntries(effectiveHomeImages, record),
    [effectiveHomeImages, record, lockItemsKey, homeLockKey]
  );

  const urls = useMemo(() => entries.map((entry) => entry.url), [entries]);
  const weights = useMemo(() => entries.map((entry) => entry.weight), [entries]);

  useEffect(() => {
    preloadLockWallpaperUrls(urls);
  }, [urls]);

  return {
    urls,
    weights,
    rotationMs: resolveLockWallpaperRotationMs(record),
    advanceOnClick: resolveLockWallpaperAdvanceOnClick(record),
    order: resolveLockWallpaperOrder(record)
  };
}
