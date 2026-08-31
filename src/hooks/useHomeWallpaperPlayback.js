import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  normalizeHomeWallpaperPlayback,
  readHomeWallpaperPlayback,
  writeHomeWallpaperPlayback
} from '../utils/homepageWallpaperSettings';

export function useHomeWallpaperPlayback() {
  const { currentUser, isAuthenticated } = useAuth();
  const scopeKey = useMemo(() => {
    if (!isAuthenticated || !currentUser?.id) return 'guest';
    return `user-${currentUser.id}`;
  }, [currentUser?.id, isAuthenticated]);
  const storageKey = useMemo(() => `homepage_images_metadata_${scopeKey}`, [scopeKey]);

  const [playback, setPlayback] = useState(() => readHomeWallpaperPlayback(storageKey));

  useEffect(() => {
    setPlayback(readHomeWallpaperPlayback(storageKey));
  }, [storageKey]);

  const updatePlayback = useCallback(
    (partial) => {
      const next = {
        ...readHomeWallpaperPlayback(storageKey),
        ...partial
      };
      writeHomeWallpaperPlayback(storageKey, next);
      setPlayback(normalizeHomeWallpaperPlayback({ ...next, advanceOnClickUserSet: true }));
      return next;
    },
    [storageKey]
  );

  return { playback, updatePlayback };
}
