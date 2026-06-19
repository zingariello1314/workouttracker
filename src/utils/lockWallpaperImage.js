/**
 * Traitement des fonds verrouillage seuls (IndexedDB app lock).
 * Réutilise le pipeline d’optimisation accueil + réduction si nécessaire pour le stockage.
 */

import { detectWebPSupport, processImageForStorage } from './imageFormatOptimizer';

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
export const LOCK_WALLPAPER_ROTATION_OPTIONS = [
  { value: 30_000, label: '30 secondes' },
  { value: 60_000, label: '1 minute' },
  { value: 120_000, label: '2 minutes (comme l’accueil)' },
  { value: 300_000, label: '5 minutes' },
  { value: 600_000, label: '10 minutes' },
  { value: 0, label: 'Pas de rotation' }
];

export const DEFAULT_LOCK_WALLPAPER_ROTATION_MS = 120_000;

export function resolveLockWallpaperRotationMs(record) {
  const raw = record?.lockWallpaperRotationMs;
  if (raw === 0) return 0;
  if (Number.isFinite(Number(raw)) && Number(raw) > 0) return Number(raw);
  return DEFAULT_LOCK_WALLPAPER_ROTATION_MS;
}

export function resolveLockWallpaperAdvanceOnClick(record) {
  return record?.lockWallpaperAdvanceOnClick === true;
}
