import {
  DEFAULT_WALLPAPER_ROTATION_MS,
  resolveWallpaperAdvanceOnClick,
  resolveWallpaperOrder,
  resolveWallpaperRotationMs,
  WALLPAPER_ORDER_RANDOM
} from './wallpaperPlayback';

/** Filtre d’affichage accueil : n’enlève rien de la collection, masque seulement à la rotation. */
export const HOME_MEDIA_KINDS_ALL = 'all';
export const HOME_MEDIA_KINDS_IMAGES = 'images';
export const HOME_MEDIA_KINDS_VIDEOS = 'videos';

export const HOME_MEDIA_KINDS_OPTIONS = [
  { value: HOME_MEDIA_KINDS_ALL, label: 'Photos et vidéos' },
  { value: HOME_MEDIA_KINDS_IMAGES, label: 'Photos uniquement' },
  { value: HOME_MEDIA_KINDS_VIDEOS, label: 'Vidéos uniquement' },
];

export function resolveHomeMediaKinds(value) {
  if (value === HOME_MEDIA_KINDS_IMAGES || value === HOME_MEDIA_KINDS_VIDEOS) return value;
  return HOME_MEDIA_KINDS_ALL;
}

export const DEFAULT_HOME_WALLPAPER_PLAYBACK = {
  rotationMs: DEFAULT_WALLPAPER_ROTATION_MS,
  advanceOnClick: true,
  order: WALLPAPER_ORDER_RANDOM,
  mediaKinds: HOME_MEDIA_KINDS_ALL,
};

export function normalizeHomeWallpaperPlayback(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    rotationMs: resolveWallpaperRotationMs(src.rotationMs, DEFAULT_WALLPAPER_ROTATION_MS),
    advanceOnClick:
      src.advanceOnClick === undefined
        ? DEFAULT_HOME_WALLPAPER_PLAYBACK.advanceOnClick
        : resolveWallpaperAdvanceOnClick(src.advanceOnClick),
    order: resolveWallpaperOrder(src.order),
    mediaKinds: resolveHomeMediaKinds(src.mediaKinds),
  };
}

export function readHomeWallpaperPlayback(storageKey) {
  if (!storageKey) return { ...DEFAULT_HOME_WALLPAPER_PLAYBACK };
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const raw = parsed.playback && typeof parsed.playback === 'object' ? parsed.playback : {};
    // Le clic accueil a toujours fait défiler le fond (via les citations).
    // L’ancienne valeur par défaut (false) ne reflétait pas ce comportement.
    if (raw.advanceOnClick === false && raw.advanceOnClickUserSet !== true) {
      return normalizeHomeWallpaperPlayback({ ...raw, advanceOnClick: true });
    }
    return normalizeHomeWallpaperPlayback(raw);
  } catch {
    return { ...DEFAULT_HOME_WALLPAPER_PLAYBACK };
  }
}

export function writeHomeWallpaperPlayback(storageKey, playback) {
  if (!storageKey) return;
  try {
    const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
    existing.playback = {
      ...normalizeHomeWallpaperPlayback(playback),
      advanceOnClickUserSet: true
    };
    existing.playbackUpdated = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch {
    /* quota / mode privé */
  }
}
