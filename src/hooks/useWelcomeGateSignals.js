import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfileData } from '../services/profileCard/profileCardStorage';
import { rememberProfileCardWarm } from '../services/profileCard/profileCardWarmCache';
import { getVisibleHomepageImageIndices } from '../utils/homepageImagePreferences';
import { preloadImageUrl } from '../utils/lockWallpaperPreload';
import {
  getCoreSportTabsPreloadProgress,
  subscribeCoreSportTabsPreload
} from '../utils/preloadTabs';

function selectedHomeSrcs(images) {
  return getVisibleHomepageImageIndices(images)
    .map((index) => images[index]?.full)
    .filter((src) => typeof src === 'string' && src.length > 8);
}

function selectedHomeKey(images) {
  return selectedHomeSrcs(images)
    .map((src) => `${src.length}:${src.slice(-32)}`)
    .join('|');
}

function chunkPartial(chunkReady, viewPrepared) {
  if (viewPrepared) return 1;
  if (chunkReady) return 0.55;
  return 0.12;
}

/**
 * Chemin critique du bouton Déverrouiller : session, profil, avatar,
 * la photo d'accueil qui va s'afficher, le robot 3D, le fond animé.
 * Aujourd'hui, Récap, Calendrier et la banque n'empêchent pas le clic.
 */
export function useWelcomeGateSignals({
  homeImages = [],
  homeImagesLoading = true,
  chosenHomeImageReady = false,
  splineReady = false
} = {}) {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();

  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarPartial, setAvatarPartial] = useState(0);
  const [backgroundReleased, setBackgroundReleased] = useState(false);
  const [homeImagesReady, setHomeImagesReady] = useState(false);
  const [homeImagesPartial, setHomeImagesPartial] = useState(0);
  const [startup, setStartup] = useState(getCoreSportTabsPreloadProgress);

  useEffect(() => subscribeCoreSportTabsPreload(setStartup), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setBackgroundReleased(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

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
    setAvatarPartial(0.2);

    getProfileData(currentUser.username)
      .then((data) => {
        if (cancelled) return;
        rememberProfileCardWarm(currentUser.username, data);
        const avatarUrl = data?.avatarUrl;
        if (typeof avatarUrl !== 'string' || avatarUrl.length <= 20) {
          setAvatarPartial(1);
          setAvatarReady(true);
          return;
        }
        setAvatarPartial(0.55);
        preloadImageUrl(avatarUrl)
          .catch(() => {})
          .then(() => {
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

  const selectedKey = selectedHomeKey(homeImages);

  useEffect(() => {
    if (homeImagesLoading) {
      setHomeImagesReady(false);
      setHomeImagesPartial(homeImages.length > 0 ? 0.35 : 0.12);
      return undefined;
    }

    const srcs = selectedHomeSrcs(homeImages);
    if (srcs.length === 0 || chosenHomeImageReady) {
      setHomeImagesPartial(1);
      setHomeImagesReady(true);
      return undefined;
    }

    setHomeImagesPartial(0.65);
    setHomeImagesReady(false);
    return undefined;
  }, [homeImagesLoading, selectedKey, homeImages.length, chosenHomeImageReady]);

  const backgroundReady = startup.animatedBackgroundPrepared || backgroundReleased;

  const steps = useMemo(
    () => [
      { ready: !authLoading, partial: authLoading ? 0.12 : 1 },
      {
        ready: !authLoading && (isAuthenticated ? Boolean(currentUser) : true),
        partial: authLoading ? 0 : currentUser || !isAuthenticated ? 1 : 0.55
      },
      { ready: avatarReady, partial: avatarPartial },
      { ready: homeImagesReady, partial: homeImagesPartial },
      { ready: Boolean(splineReady), partial: splineReady ? 1 : 0.2 },
      {
        ready: backgroundReady,
        partial: startup.animatedBackgroundPrepared ? 1 : backgroundReleased ? 1 : 0.35
      }
    ],
    [
      authLoading,
      isAuthenticated,
      currentUser,
      avatarReady,
      avatarPartial,
      homeImagesReady,
      homeImagesPartial,
      splineReady,
      backgroundReady,
      backgroundReleased,
      startup.animatedBackgroundPrepared
    ]
  );

  const warmup = useMemo(
    () => [
      {
        id: 'today',
        label: 'Aujourd\u2019hui',
        partial: chunkPartial(startup.todayChunkReady, startup.todayViewPrepared)
      },
      {
        id: 'recap',
        label: 'Récap',
        partial: chunkPartial(startup.recapChunkReady, startup.recapViewPrepared)
      },
      {
        id: 'calendar',
        label: 'Calendrier',
        partial: chunkPartial(startup.calendarChunkReady, startup.calendarViewPrepared)
      },
      {
        id: 'exerciseBank',
        label: 'Banque',
        partial: startup.exerciseBankReady ? 1 : 0.12
      }
    ],
    [
      startup.todayChunkReady,
      startup.todayViewPrepared,
      startup.recapChunkReady,
      startup.recapViewPrepared,
      startup.calendarChunkReady,
      startup.calendarViewPrepared,
      startup.exerciseBankReady
    ]
  );

  return { steps, warmup };
}
