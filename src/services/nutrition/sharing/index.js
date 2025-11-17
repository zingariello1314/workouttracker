/**
 * sharing/index.js
 * 
 * ✅ PHASE 12.1 : Barrel export principal pour le module sharing
 * 
 * Permet d'importer facilement toutes les fonctionnalités de partage nutrition
 * depuis un seul point d'entrée.
 * 
 * @module services/nutrition/sharing
 */

// Constants
export * from './constants';

// Schemas
export * from './schemas';

// Validators
export { ImportValidator } from './validators';

// Migration
export { VersionMigrator } from './migration';

// Rate Limiting
export { RateLimiter, checkShareLinkCreationAllowed } from './rateLimiting';

// QR Code
export { generateQRCode, cleanupOrphanedQRCache } from './qrcode';

// Encryption
export { SecureExportService } from './encryption';

// Share Links CRUD
export * from './shareLinks';

// Token
export { generateSecureToken, parseDuration } from './token';

// Cleanup
export { CleanupService } from './cleanup';

// Data Preparation
export { prepareNutritionDataForShare } from './dataPreparation';

// Cache
export { ExportCacheService } from './cache';

// Export
export { exportNutritionDataForShare, decryptNutritionExport } from './export';

// Validator
export { validateShareToken } from './validator';

// Import
export { validateShareJson, parseShareJson, loadShareDataFromJson } from './import';


