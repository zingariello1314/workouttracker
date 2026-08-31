/**
 * Traitement des fonds verrouillage seuls (IndexedDB app lock).
 * Réutilise le pipeline d’optimisation accueil + réduction si nécessaire pour le stockage.
 */

import { detectWebPSupport, processImageForStorage } from './imageFormatOptimizer';
import {
  DEFAULT_WALLPAPER_ROTATION_MS,
  WALLPAPER_ORDER_RANDOM,
  WALLPAPER_ROTATION_OPTIONS,
  resolveWallpaperAdvanceOnClick,
  resolveWallpaperOrder,
  resolveWallpaperRotationMs
} from './wallpaperPlayback';

const MAX_EDGE_PX = 2560;
const MAX_DATA_URL_CHARS = 5_500_000;

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Impossible de charger l’image'));
    img.src = dataUrl;
  });
}

async function downscaleDataUrl(dataUrl, maxEdge, quality = 0.92) {
  const img = await loadImageFromDataUrl(dataUrl);
  const { width, height } = img;
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return dataUrl;

  const scale = maxEdge / edge;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const supportsWebP = await detectWebPSupport();
  const mime = supportsWebP ? 'image/webp' : 'image/jpeg';
  return canvas.toDataURL(mime, quality);
}

/**
 * @param {File} file
 * @returns {Promise<string>} data URL prête pour lockBackgroundDataUrls
 */
export async function processLockWallpaperFile(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Choisissez une image (JPG, PNG, WebP…).');
  }

  const processed = await processImageForStorage(file, {
    createThumbnail: false,
    preserveQuality: true
  });

  let dataUrl = processed.full;
  const dims = processed.metadata?.dimensions;
  const tooLarge =
    dataUrl.length > MAX_DATA_URL_CHARS ||
    (dims && (dims.width > MAX_EDGE_PX || dims.height > MAX_EDGE_PX));

  if (tooLarge) {
    dataUrl = await downscaleDataUrl(dataUrl, MAX_EDGE_PX, 0.92);
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    dataUrl = await downscaleDataUrl(dataUrl, 1920, 0.88);
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error('Image encore trop lourde après optimisation — essayez une photo plus petite.');
  }

  return dataUrl;
}

/** Intervalles de rotation verrou (ms). 0 = pas de rotation automatique. */
export const LOCK_WALLPAPER_ROTATION_OPTIONS = WALLPAPER_ROTATION_OPTIONS;

export const DEFAULT_LOCK_WALLPAPER_ROTATION_MS = DEFAULT_WALLPAPER_ROTATION_MS;

export function resolveLockWallpaperRotationMs(record) {
  return resolveWallpaperRotationMs(record?.lockWallpaperRotationMs, DEFAULT_LOCK_WALLPAPER_ROTATION_MS);
}

export function resolveLockWallpaperAdvanceOnClick(record) {
  return resolveWallpaperAdvanceOnClick(record?.lockWallpaperAdvanceOnClick);
}

export function resolveLockWallpaperOrder(record) {
  return resolveWallpaperOrder(record?.lockWallpaperOrder || WALLPAPER_ORDER_RANDOM);
}
