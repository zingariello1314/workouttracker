/**
 * sharing/qrcode/index.js
 * 
 * Barrel exports pour la génération QR code
 * 
 * @module services/nutrition/sharing/qrcode
 */

export {
  generateQRCode,
  cleanupOrphanedQRCache,
  QR_CACHE_PREFIX,
  QR_CACHE_EXPIRY_MS,
  QR_CACHE_CLEANUP_INTERVAL_MS
} from './qrCodeGenerator';


