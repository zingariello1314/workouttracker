import { useEffect, useMemo } from 'react';
import { useAppLock } from '../context/AppLockContext';
import { useAuth } from '../context/AuthContext';
import { useHomepageImages } from './useHomepageImages';
import { preloadLockWallpaperUrls, readEmergencyHomeImages } from '../utils/lockWallpaperPreload';
import { resolveLockWallpaperUrls } from '../utils/wallpaperTargets';

/** URLs effectives pour verrouillage + écran d’intro (bibliothèque + fonds verrou seuls). */
export function useLockWallpaperUrls() {
  const { record } = useAppLock();
  const { currentUser, isAuthenticated } = useAuth();
  const { backgroundImages } = useHomepageImages();

  const scopeKey = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return 'guest';
    return `user-${currentUser.id}`;
  }, [currentUser?.id, isAuthenticated]);

  const urls = useMemo(() => {
    const effectiveHomeImages =
      backgroundImages?.length > 0 ? backgroundImages : readEmergencyHomeImages(scopeKey);
    return resolveLockWallpaperUrls(effectiveHomeImages, record);
  }, [
    backgroundImages,
    record?.lockBackgroundDataUrls,
    record?.lockBackgroundDataUrl,
    scopeKey
  ]);

  useEffect(() => {
    preloadLockWallpaperUrls(urls);
  }, [urls]);

  return urls;
}
