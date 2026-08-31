import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfileData } from '../services/profileCard/profileCardStorage';
import { isLockWallpaperDecoded, preloadImageUrl } from '../utils/lockWallpaperPreload';
import { preloadCoreSportTabs } from '../utils/preloadTabs';

/**
 * Signaux réels pour la séquence de chargement de l'écran d'accueil.
 * Chaque entrée : { ready, partial } — partial ∈ [0,1] pour l'avancement intra-étape.
 */
export function useWelcomeGateSignals({
  layer0Src = null,
  layer0Loaded = false,
  isInitialImageLoaded = false,
  backgroundImages = [],
  homeImagesLoading = true,
  lockWallpaperUrls = []
}) {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();

  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarPartial, setAvatarPartial] = useState(0);

  useEffect(() => {
    if (authLoading) {
      setAvatarReady(false);
      setAvatarPartial(0);
      return undefined;
    }

    if (!isAuthenticated || !currentUser?.username) {
      setAvatarReady(true);
      setAvatarPartial(1);
      return undefined;
    }

    let cancelled = false;
    setAvatarPartial(0.15);

    getProfileData(currentUser.username)
      .then((data) => {
        if (cancelled) return;
        const url = data?.avatarUrl;
        if (!url || typeof url !== 'string') {
          setAvatarPartial(1);
          setAvatarReady(true);
          return;
        }
        setAvatarPartial(0.5);
        preloadImageUrl(url)
          .then(() => {
            if (!cancelled) {
              setAvatarPartial(1);
              setAvatarReady(true);
            }
          })
          .catch(() => {
            if (!cancelled) {
              setAvatarPartial(1);
              setAvatarReady(true);
            }
          });
      })
      .catch(() => {
        if (!cancelled) {
          setAvatarPartial(1);
          setAvatarReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, currentUser?.username]);

  useEffect(() => {
    if (authLoading) return;
    preloadCoreSportTabs();
  }, [authLoading]);

  const homeImagesPartial = useMemo(() => {
    if (!homeImagesLoading) return 1;
    let p = 0.08;
    if (backgroundImages.length > 0) p += 0.28;
    if (layer0Src) p += 0.28;
    if (isInitialImageLoaded || layer0Loaded) p += 0.3;
    return Math.min(0.97, p);
  }, [
    homeImagesLoading,
    backgroundImages.length,
    layer0Src,
    isInitialImageLoaded,
    layer0Loaded
  ]);

  const lockWallpaperPartial = useMemo(() => {
    if (!lockWallpaperUrls?.length) return 1;
    const decoded = lockWallpaperUrls.filter((u) => isLockWallpaperDecoded(u)).length;
    if (decoded > 0) return Math.min(1, 0.5 + (decoded / lockWallpaperUrls.length) * 0.5);
    return lockWallpaperUrls.length > 0 ? 0.4 : 1;
  }, [lockWallpaperUrls]);

  const steps = useMemo(
    () => [
      { ready: !authLoading, partial: authLoading ? 0.12 : 1 },
      {
        ready: !authLoading && (isAuthenticated ? Boolean(currentUser) : true),
        partial: authLoading ? 0 : currentUser || !isAuthenticated ? 1 : 0.55
      },
      { ready: avatarReady, partial: avatarPartial },
      {
        ready: !authLoading && (backgroundImages.length > 0 || !homeImagesLoading),
        partial: !authLoading && (backgroundImages.length > 0 || !homeImagesLoading) ? 1 : 0.45
      },
      {
        ready:
          !homeImagesLoading &&
          (backgroundImages.length === 0 || isInitialImageLoaded || layer0Loaded || Boolean(layer0Src)),
        partial: homeImagesPartial
      },
      {
        ready: !authLoading && !homeImagesLoading,
        partial: Math.max(homeImagesPartial, lockWallpaperPartial)
      }
    ],
    [
      authLoading,
      isAuthenticated,
      currentUser,
      avatarReady,
      avatarPartial,
      backgroundImages.length,
      homeImagesLoading,
      homeImagesPartial,
      isInitialImageLoaded,
      layer0Loaded,
      layer0Src,
      lockWallpaperPartial
    ]
  );

  return steps;
}
