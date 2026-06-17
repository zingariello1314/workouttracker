import { useMemo } from 'react';
import { useAppLock } from '../context/AppLockContext';
import { useHomepageImages } from './useHomepageImages';
import { resolveLockWallpaperUrls } from '../utils/wallpaperTargets';

/** URLs effectives pour verrouillage + écran d’intro (bibliothèque + fonds verrou seuls). */
export function useLockWallpaperUrls() {
  const { record } = useAppLock();
  const { backgroundImages } = useHomepageImages();
  return useMemo(
    () => resolveLockWallpaperUrls(backgroundImages, record),
    [backgroundImages, record?.lockBackgroundDataUrls, record?.lockBackgroundDataUrl]
  );
}
