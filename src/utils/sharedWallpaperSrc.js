/** URL d'un fond de la banque partagée (pas une data URL). */
const SHARED_WALLPAPER_SRC = /^\/wallpaper-bank\/(?:full|thumbs)\/[\w.-]+\.(jpe?g|png|webp)$/i;

export function isSharedWallpaperSrc(src) {
  return typeof src === 'string' && SHARED_WALLPAPER_SRC.test(src);
}
