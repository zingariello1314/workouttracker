/** URL d'un fond de la banque partagée (pas une data URL). */
const SHARED_WALLPAPER_SRC = /^\/wallpaper-bank\/(?:full|thumbs)\/[\w.-]+\.(jpe?g|png|webp)$/i;

/** Vidéo d’accueil servie depuis public/welcome-videos (espaces encodés ou non). */
const WELCOME_VIDEO_SRC =
  /^\/welcome-videos\/.+\.(mp4|webm|mov)(\?|#|$)/i;

export function isSharedWallpaperSrc(src) {
  return typeof src === 'string' && SHARED_WALLPAPER_SRC.test(src);
}

export function isWelcomeVideoSrc(src) {
  if (typeof src !== 'string' || !src) return false;
  if (WELCOME_VIDEO_SRC.test(src)) return true;
  try {
    return WELCOME_VIDEO_SRC.test(decodeURI(src));
  } catch {
    return false;
  }
}

/** Source homepage autorisée hors data:image (banque images ou vidéos d’accueil). */
export function isAllowedHomepageMediaSrc(src) {
  return isSharedWallpaperSrc(src) || isWelcomeVideoSrc(src);
}
