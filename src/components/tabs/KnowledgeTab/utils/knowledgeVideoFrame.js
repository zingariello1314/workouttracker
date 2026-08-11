/** Ratio par défaut (portrait type Short) avant chargement des métadonnées. */
export const DEFAULT_VIDEO_ASPECT = 9 / 16;

/** Style conteneur qui s’adapte au format réel tout en restant dans la zone disponible. */
export function fitVideoContainerStyle(aspectRatio, { fullscreen = false } = {}) {
  if (fullscreen) {
    return { width: '100%', height: '100%' };
  }
  const ratio = aspectRatio > 0 ? aspectRatio : DEFAULT_VIDEO_ASPECT;
  const isPortrait = ratio < 1;
  return {
    aspectRatio: String(ratio),
    ...(isPortrait ? { height: '100%', width: 'auto' } : { width: '100%', height: 'auto' }),
    maxHeight: '100%',
    maxWidth: '100%'
  };
}

export function readVideoAspectRatio(videoEl) {
  if (!videoEl?.videoWidth || !videoEl?.videoHeight) return null;
  return videoEl.videoWidth / videoEl.videoHeight;
}

export async function toggleElementFullscreen(el) {
  if (!el) return false;
  try {
    if (document.fullscreenElement === el) {
      await document.exitFullscreen();
      return false;
    }
    await el.requestFullscreen();
    return true;
  } catch {
    return Boolean(document.fullscreenElement === el);
  }
}

export function isElementFullscreen(el) {
  return Boolean(el && document.fullscreenElement === el);
}
