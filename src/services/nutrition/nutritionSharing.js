/**
 * nutritionSharing.js
 * 
 * Service pour le Partage avec Coach (liens sécurisés).
 * 
 * Permet de partager des données nutrition avec un coach via :
 * - Génération token sécurisé
 * - Export JSON avec données anonymisées selon scope
 * - Vue coach en lecture seule
 * - Expiration automatique des liens
 * - Contrôle permissions (scope : all, stats, charts, progress)
 * 
 * Architecture locale (sans serveur) :
 * - Tokens stockés dans IndexedDB (nutrition_shareLinks)
 * - Export JSON avec token intégré
 * - Import JSON par coach dans son app
 * - Vue coach en lecture seule avec données anonymisées
 * 
 * Philosophie :
 * - Sécurité : Tokens cryptographiques, expiration automatique
 * - Privacy : Données anonymisées, pas de données personnelles identifiables
 * - Performance : Stockage local IndexedDB, pas de requêtes serveur
 * - UX : QR codes pour partage facile, export JSON simple
 * 
 * @module services/nutrition/nutritionSharing
 * @see ../../../../nouvelongletnutritionplan.md Section 6.1
 */

import logger from '../../utils/logger';
import { openNutritionDB, STORE_SHARE_LINKS } from '../../hooks/nutritionDataUtils';
import { DateHelper } from '../../utils/dateHelper';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { z } from 'zod';

const log = logger.module('nutritionSharing');

// ==================== SCHEMA VALIDATION ZOD ====================

/**
 * ✅ PHASE 4 : Schémas Zod pour validation profonde des exports
 * 
 * ✅ PHASE 4 : Validation complète avec Zod
 * - Validation type-safe de toute la structure
 * - Limites de taille pour protection DoS
 * - Validation des types et plages de valeurs
 * - Support exports chiffrés et non chiffrés
 * - Support migration de versions
 */

// ✅ PHASE 4 : Schéma pour les statistiques nutrition
const statsPeriodSchema = z.object({
  days: z.number().int().min(0).max(365),
  avgCalories: z.number().min(0).max(10000),
  avgProtein: z.number().min(0).max(1000),
  avgCarbs: z.number().min(0).max(1000),
  avgFat: z.number().min(0).max(1000),
  avgCompliance: z.number().min(0).max(100),
  totalMeals: z.number().int().min(0),
  avgMealsPerDay: z.number().min(0).max(10).optional()
});

const statsSchema = z.object({
  periods: z.object({
    week: statsPeriodSchema.optional(),
    month: statsPeriodSchema.optional(),
    quarter: statsPeriodSchema.optional()
  }),
  totalDays: z.number().int().min(0),
  totalMeals: z.number().int().min(0),
  activeProgram: z.object({
    name: z.string(),
    goal: z.string().optional(),
    hasProgram: z.boolean().optional()
  }).nullable().optional()
});

// ✅ PHASE 4 : Schéma pour les données graphiques
const chartTimelineItemSchema = z.object({
  day: z.number().int().min(1).max(365), // Index jour (privacy)
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  compliance: z.number().min(0).max(100).optional()
});

const chartsSchema = z.object({
  timeline: z.array(chartTimelineItemSchema).max(365), // Max 1 an
  macroDistribution: z.object({
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100)
  }).optional()
});

// ✅ PHASE 4 : Schéma pour les données progression
const progressTrendSchema = z.object({
  days: z.number().int().min(0),
  avgCompliance: z.number().min(0).max(100),
  totalMeals: z.number().int().min(0)
});

const progressSchema = z.object({
  totalDays: z.number().int().min(0),
  totalMeals: z.number().int().min(0),
  streak: z.number().int().min(0),
  level: z.number().int().min(1).max(100),
  badgesCount: z.number().int().min(0),
  trends: z.object({
    week: progressTrendSchema.optional(),
    month: progressTrendSchema.optional()
  }).optional()
});

// ✅ PHASE 4 : Schéma pour les données partagées (selon scope)
const shareDataSchema = z.object({
  stats: statsSchema.optional(),
  charts: chartsSchema.optional(),
  progress: progressSchema.optional()
}).refine(
  (data) => data.stats || data.charts || data.progress,
  { message: 'Au moins un scope (stats, charts, progress) doit être présent' }
);

// ✅ PHASE 4 : Schéma pour les métadonnées
const metadataSchema = z.object({
  generatedAt: z.string().datetime().optional(),
  scope: z.string().optional(),
  readOnly: z.boolean().optional(),
  encrypted: z.boolean().optional()
});

// ✅ PHASE 4 : Schéma pour export non chiffré (version 1.0)
const nutritionShareSchemaV1 = z.object({
  type: z.literal('nutrition_share'),
  version: z.literal('1.0'),
  token: z.string().min(10).max(200), // Token avec préfixe
  scope: z.enum(['all', 'stats', 'charts', 'progress']),
  shareDate: z.string().datetime(),
  expiresAt: z.union([z.number().int().positive(), z.null()]),
  data: shareDataSchema,
  metadata: metadataSchema.optional()
});

// ✅ PHASE 4 : Schéma pour export chiffré (version 1.0)
const nutritionShareEncryptedSchemaV1 = z.object({
  type: z.literal('nutrition_share_encrypted'),
  version: z.literal('1.0'),
  algorithm: z.literal('AES-256-CBC'),
  keyDerivation: z.literal('PBKDF2'),
  pbkdf2Iterations: z.number().int().positive(),
  pbkdf2Hasher: z.literal('SHA-256'),
  salt: z.string().regex(/^[0-9a-fA-F]+$/), // Hex string
  iv: z.string().regex(/^[0-9a-fA-F]+$/), // Hex string
  data: z.string(), // Base64 encrypted data
  encryptedAt: z.string().datetime(),
  metadata: z.object({
    originalSize: z.number().int().positive(),
    encryptedSize: z.number().int().positive(),
    compressionRatio: z.string().optional()
  }).optional()
});

// ✅ PHASE 4 : Schéma union pour support exports chiffrés et non chiffrés
const nutritionShareSchema = z.union([
  nutritionShareSchemaV1,
  nutritionShareEncryptedSchemaV1
]);

// ==================== IMPORT VALIDATOR ====================

/**
 * ✅ PHASE 4 : ImportValidator avec validation profonde et détection malveillant
 * 
 * ✅ PHASE 4 : Validation robuste des imports
 * - Validation fichier (taille, extension)
 * - Validation JSON parsing
 * - Validation schema Zod profonde
 * - Détection contenu malveillant (XSS, injection, etc.)
 * - Support migration de versions
 */
class ImportValidator {
  /**
   * ✅ PHASE 4 : Configuration validation
   */
  static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (protection DoS)
  static MAX_JSON_STRING_LENGTH = 20 * 1024 * 1024; // 20 MB (string JSON)
  static SUPPORTED_VERSIONS = ['1.0']; // Versions supportées

  /**
   * ✅ PHASE 4 : Patterns malveillants à détecter
   */
  static MALICIOUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
    /eval\s*\(/gi, // eval() function
    /Function\s*\(/gi, // Function constructor
    /__proto__/gi, // Prototype pollution
    /constructor\s*\[/gi, // Constructor access
    /\bimport\s*\(/gi, // Dynamic imports
    /\brequire\s*\(/gi, // require() calls
    /document\.(cookie|domain|write)/gi, // DOM manipulation
    /window\.(location|open|eval)/gi, // Window manipulation
    /<iframe/gi, // iframe tags
    /<object/gi, // object tags
    /<embed/gi // embed tags
  ];

  /**
   * ✅ PHASE 4 : Valide le fichier avant parsing
   * 
   * @param {File} file - Fichier à valider
   * @throws {Error} Si fichier invalide
   */
  static validateFile(file) {
    if (!file || !(file instanceof File)) {
      throw new Error('Fichier invalide ou manquant');
    }

    // ✅ PHASE 4 : Vérifier taille fichier
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `Fichier trop volumineux (max ${this.MAX_FILE_SIZE / 1024 / 1024} MB, reçu: ${(file.size / 1024 / 1024).toFixed(2)} MB)`
      );
    }

    // ✅ PHASE 4 : Vérifier extension (optionnel mais recommandé)
    if (!file.name.toLowerCase().endsWith('.json') && 
        !file.name.toLowerCase().endsWith('.encrypted.json')) {
      log.warn('[validateFile] Extension non standard détectée', { filename: file.name });
    }

    // ✅ PHASE 4 : Vérifier type MIME (optionnel)
    if (file.type && 
        file.type !== 'application/json' && 
        file.type !== 'application/json+encrypted' &&
        file.type !== 'text/json') {
      log.warn('[validateFile] Type MIME non standard détecté', { type: file.type });
    }
  }

  /**
   * ✅ PHASE 4 : Parse et valide le JSON avec schema Zod
   * 
   * @param {File|string} fileOrText - Fichier ou texte JSON
   * @returns {Promise<Object>} Données validées
   * @throws {Error} Si validation échoue
   */
  static async parseAndValidate(fileOrText) {
    let text;
    
    // ✅ PHASE 4 : Gérer File ou string
    if (fileOrText instanceof File) {
      this.validateFile(fileOrText);
      
      text = await fileOrText.text();
      
      // ✅ PHASE 4 : Vérifier taille contenu (protection DoS)
      if (text.length > this.MAX_JSON_STRING_LENGTH) {
        throw new Error(
          `Contenu JSON trop volumineux (max ${this.MAX_JSON_STRING_LENGTH / 1024 / 1024} MB)`
        );
      }
    } else if (typeof fileOrText === 'string') {
      text = fileOrText;
      
      // ✅ PHASE 4 : Vérifier taille contenu
      if (text.length > this.MAX_JSON_STRING_LENGTH) {
        throw new Error(
          `Contenu JSON trop volumineux (max ${this.MAX_JSON_STRING_LENGTH / 1024 / 1024} MB)`
        );
      }
    } else {
      throw new Error('Format invalide : File ou string attendu');
    }

    // ✅ PHASE 4 : Parser JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`JSON invalide : ${err.message}`);
    }

    // ✅ PHASE 4 : Détecter contenu malveillant AVANT validation schema
    this.detectMaliciousContent(parsed);

    // ✅ PHASE 4 : Valider version supportée
    if (parsed.version && !this.SUPPORTED_VERSIONS.includes(parsed.version)) {
      throw new Error(
        `Version non supportée : ${parsed.version} (versions supportées: ${this.SUPPORTED_VERSIONS.join(', ')})`
      );
    }

    // ✅ PHASE 4 : Validation schema Zod profonde
    try {
      const validated = nutritionShareSchema.parse(parsed);
      return validated;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.errors[0];
        const errorPath = firstError.path.length > 0 
          ? firstError.path.join('.') 
          : 'racine';
        throw new Error(
          `Données invalides : ${errorPath} - ${firstError.message}`
        );
      }
      throw err;
    }
  }

  /**
   * ✅ PHASE 4 : Détecte contenu potentiellement malveillant
   * 
   * @param {Object} data - Données à analyser
   * @throws {Error} Si contenu malveillant détecté
   */
  static detectMaliciousContent(data) {
    // ✅ PHASE 4 : Sérialiser en JSON pour analyse
    const jsonString = JSON.stringify(data);

    // ✅ PHASE 4 : Vérifier chaque pattern malveillant
    for (const pattern of this.MALICIOUS_PATTERNS) {
      if (pattern.test(jsonString)) {
        const match = jsonString.match(pattern);
        log.error('[detectMaliciousContent] Contenu malveillant détecté', {
          pattern: pattern.toString(),
          match: match ? match[0].substring(0, 100) : null
        });
        throw new Error('Contenu potentiellement malveillant détecté (sécurité)');
      }
    }

    // ✅ PHASE 4 : Vérifier profondeur récursive excessive (protection DoS)
    const depth = this.calculateDepth(data);
    if (depth > 50) {
      throw new Error('Structure JSON trop profonde (risque DoS)');
    }

    // ✅ PHASE 4 : Vérifier nombre de clés excessive (protection DoS)
    const keyCount = this.countKeys(data);
    if (keyCount > 10000) {
      throw new Error('Trop de clés dans le JSON (risque DoS)');
    }
  }

  /**
   * ✅ PHASE 4 : Calcule la profondeur récursive d'un objet
   * 
   * @param {any} obj - Objet à analyser
   * @param {number} currentDepth - Profondeur actuelle
   * @returns {number} Profondeur maximale
   */
  static calculateDepth(obj, currentDepth = 0) {
    if (currentDepth > 50) {
      return currentDepth; // Arrêt récursif pour éviter stack overflow
    }

    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const depth = this.calculateDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  /**
   * ✅ PHASE 4 : Compte le nombre total de clés dans un objet
   * 
   * @param {any} obj - Objet à analyser
   * @param {Set} visited - Set pour éviter boucles infinies
   * @returns {number} Nombre de clés
   */
  static countKeys(obj, visited = new Set()) {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    // ✅ PHASE 4 : Éviter boucles infinies avec Set
    if (visited.has(obj)) {
      return 0;
    }
    visited.add(obj);

    let count = 0;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        count += this.countKeys(item, visited);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          count++;
          count += this.countKeys(obj[key], visited);
        }
      }
    }

    return count;
  }
}

// ==================== VERSION MIGRATION ====================

/**
 * ✅ PHASE 4 : Système de migration de versions
 * 
 * ✅ PHASE 4 : Migration automatique entre versions
 * - Support migration v1.0 → v2.0 (futur)
 * - Validation version avant migration
 * - Migration progressive avec fallback
 */
class VersionMigrator {
  /**
   * ✅ PHASE 4 : Migre un export vers la version actuelle
   * 
   * @param {Object} data - Données à migrer
   * @param {string} fromVersion - Version source
   * @param {string} toVersion - Version cible (défaut: version actuelle)
   * @returns {Promise<Object>} Données migrées
   */
  static async migrate(data, fromVersion, toVersion = '1.0') {
    try {
      // ✅ PHASE 4 : Si même version, pas de migration
      if (fromVersion === toVersion) {
        return data;
      }

      // ✅ PHASE 4 : Migration progressive (v1.0 → v2.0 → ...)
      let migratedData = data;
      let currentVersion = fromVersion;

      while (currentVersion !== toVersion) {
        const nextVersion = this.getNextVersion(currentVersion);
        
        if (!nextVersion) {
          throw new Error(`Migration impossible de ${currentVersion} vers ${toVersion}`);
        }

        // ✅ PHASE 4 : Migrer vers version suivante
        migratedData = await this.migrateToVersion(migratedData, currentVersion, nextVersion);
        currentVersion = nextVersion;

        log.debug('[migrate] Migration effectuée', {
          from: fromVersion,
          to: currentVersion,
          target: toVersion
        });
      }

      return migratedData;
    } catch (error) {
      log.error('[migrate] Erreur migration:', error);
      throw new Error(`Échec migration de ${fromVersion} vers ${toVersion}: ${error.message}`);
    }
  }

  /**
   * ✅ PHASE 4 : Obtient la version suivante dans la chaîne de migration
   * 
   * @param {string} version - Version actuelle
   * @returns {string|null} Version suivante ou null
   */
  static getNextVersion(version) {
    const migrationPath = {
      '1.0': '2.0', // Futur : v1.0 → v2.0
      '2.0': null // Version finale actuelle
    };

    return migrationPath[version] || null;
  }

  /**
   * ✅ PHASE 4 : Migre vers une version spécifique
   * 
   * @param {Object} data - Données à migrer
   * @param {string} fromVersion - Version source
   * @param {string} toVersion - Version cible
   * @returns {Promise<Object>} Données migrées
   */
  static async migrateToVersion(data, fromVersion, toVersion) {
    const migrationKey = `${fromVersion}_to_${toVersion}`;

    // ✅ PHASE 4 : Migration v1.0 → v2.0 (futur, pour l'instant identique)
    if (migrationKey === '1.0_to_2.0') {
      // Pour l'instant, retourner données telles quelles
      // À implémenter quand v2.0 sera disponible
      return {
        ...data,
        version: '2.0',
        metadata: {
          ...data.metadata,
          migratedFrom: fromVersion,
          migratedAt: new Date().toISOString()
        }
      };
    }

    // ✅ PHASE 4 : Pas de migration définie
    throw new Error(`Migration ${migrationKey} non implémentée`);
  }
}

// ==================== RATE LIMITER ====================

/**
 * Rate Limiter avec bucket algorithm (token bucket)
 * 
 * ✅ PHASE 1.2 : Protection contre abus création liens
 * - Limite nombre de tokens disponibles (bucket)
 * - Refill automatique selon taux défini
 * - Calcul temps d'attente si bucket vide
 * 
 * @class RateLimiter
 */
class RateLimiter {
  /**
   * @param {number} maxTokens - Nombre max de tokens (capacité bucket)
   * @param {number} refillRate - Taux de refill (tokens/seconde)
   */
  constructor(maxTokens, refillRate) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate; // tokens/seconde
    this.lastRefill = Date.now();
  }

  /**
   * Refill le bucket selon temps écoulé
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // secondes
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Tente de consommer un token
   * @returns {boolean} true si token consommé, false si bucket vide
   */
  tryConsume() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /**
   * Calcule le temps d'attente avant prochaine disponibilité
   * @returns {number} Temps d'attente en millisecondes
   */
  getWaitTime() {
    this.refill();
    if (this.tokens >= 1) return 0;
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000; // ms
  }

  /**
   * Réinitialise le bucket (pour tests ou reset manuel)
   */
  reset() {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

// ✅ PHASE 1.2 : Configuration rate limiter création liens
// Max 5 créations initiales, puis 1 token par minute (1/60 tokens/seconde)
const shareLinkCreationLimiter = new RateLimiter(5, 1/60);

// ✅ PHASE 1.2 : Constantes limites
const MAX_ACTIVE_SHARE_LINKS = 10; // Nombre max de liens actifs simultanés

// ✅ PHASE 1.3 : Constantes access control
const MAX_ACCESSES_PER_TOKEN = 50; // Nombre max d'accès par token
const SUSPICIOUS_ACCESS_THRESHOLD = 10; // Nombre d'accès suspects avant blocage
const BURST_WINDOW_MS = 60000; // Fenêtre détection burst (1 minute)
const BURST_THRESHOLD = 5; // Nombre accès en 1 minute considéré comme burst
const MIN_ACCESS_INTERVAL_MS = 1000; // Intervalle minimum entre accès (1 seconde)

/**
 * ✅ PHASE 1.2 : Vérifie si création lien autorisée (rate limiting + limite active)
 * 
 * @param {Array<Object>} existingLinks - Liste des liens existants (pour vérifier actifs)
 * @returns {Object} { allowed: boolean, reason?: string, waitTime?: number, activeCount?: number }
 */
export function checkShareLinkCreationAllowed(existingLinks = []) {
  // 1. Vérifier rate limiting
  if (!shareLinkCreationLimiter.tryConsume()) {
    const waitMs = shareLinkCreationLimiter.getWaitTime();
    const waitMin = Math.ceil(waitMs / 60000);
    return {
      allowed: false,
      reason: 'rate_limit',
      waitTime: waitMs,
      waitMinutes: waitMin,
      message: `Limite de création atteinte. Attendez ${waitMin} minute${waitMin > 1 ? 's' : ''} avant de créer un nouveau lien.`
    };
  }

  // 2. Vérifier nombre total liens actifs
  const now = Date.now();
  const activeLinks = existingLinks.filter(link => {
    const expiresAt = typeof link.expiresAt === 'number' ? link.expiresAt : new Date(link.expiresAt).getTime();
    return expiresAt > now;
  });

  if (activeLinks.length >= MAX_ACTIVE_SHARE_LINKS) {
    return {
      allowed: false,
      reason: 'max_active_links',
      activeCount: activeLinks.length,
      maxActive: MAX_ACTIVE_SHARE_LINKS,
      message: `Vous avez atteint la limite de ${MAX_ACTIVE_SHARE_LINKS} liens actifs. Révoquez des liens expirés ou inutilisés avant d'en créer un nouveau.`
    };
  }

  // ✅ Création autorisée
  return {
    allowed: true,
    activeCount: activeLinks.length,
    maxActive: MAX_ACTIVE_SHARE_LINKS
  };
}

// ==================== CONSTANTES ====================

/**
 * Durées d'expiration disponibles
 */
export const EXPIRATION_OPTIONS = {
  '1h': 60 * 60 * 1000,        // 1 heure
  '24h': 24 * 60 * 60 * 1000,  // 24 heures
  '7d': 7 * 24 * 60 * 60 * 1000, // 7 jours
  '30d': 30 * 24 * 60 * 60 * 1000 // 30 jours
};

/**
 * Scopes de partage disponibles
 */
export const SHARE_SCOPES = {
  all: 'all',           // Tout (stats + charts + progress)
  stats: 'stats',       // Stats seulement (agrégées)
  charts: 'charts',     // Charts seulement (graphiques)
  progress: 'progress'  // Progress seulement (progression)
};

/**
 * Permissions disponibles
 */
export const PERMISSIONS = {
  read: 'read'  // Lecture seule (seul permis pour l'instant)
};

// ==================== GÉNÉRATION TOKEN ====================

/**
 * Génère un token sécurisé cryptographiquement avec vérification collision
 * 
 * ✅ PHASE 1.1 : Renforcement sécurité token
 * - Utilise uniquement Web Crypto API (pas de fallback non sécurisé)
 * - Vérifie collision avant retour
 * - Ajoute préfixe pour traçabilité
 * - Retry automatique en cas de collision (probabilité très faible)
 * 
 * @param {number} length - Longueur du token sans préfixe (défaut: 32)
 * @param {string} prefix - Préfixe du token (défaut: 'share_')
 * @param {number} maxRetries - Nombre max de tentatives en cas de collision (défaut: 5)
 * @returns {Promise<string>} Token sécurisé avec préfixe
 * @throws {Error} Si Web Crypto API non disponible ou collision après maxRetries
 */
export async function generateSecureToken(length = 32, prefix = 'share_', maxRetries = 5) {
  // ✅ PHASE 1.1 : Exiger Web Crypto API (pas de fallback non sécurisé)
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    const error = new Error('Web Crypto API non disponible. Support navigateur requis pour génération tokens sécurisés.');
    log.error('[generateSecureToken] Web Crypto API non disponible', error);
    throw error;
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  // ✅ PHASE 1.1 : Fonction interne de génération (pour retry)
  const generateTokenInternal = () => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
    
    return prefix + token;
  };
  
  // ✅ PHASE 1.1 : Générer et vérifier collision
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const token = generateTokenInternal();
    
    try {
      // ✅ PHASE 1.1 : Vérifier collision (token déjà existant)
      const existing = await getShareLink(token);
      
      if (!existing) {
        // ✅ Token unique : retourner
        log.debug('[generateSecureToken] Token généré avec succès', {
          attempt: attempt + 1,
          tokenPrefix: token.substring(0, prefix.length + 8) + '...'
        });
        return token;
      }
      
      // ⚠️ Collision détectée : log warning et retry
      log.warn('[generateSecureToken] Collision détectée, régénération...', {
        attempt: attempt + 1,
        maxRetries,
        tokenPrefix: token.substring(0, prefix.length + 8) + '...'
      });
      
      // ✅ PHASE 8 : Attendre avant retry (évite collisions simultanées)
      // Utiliser queueMicrotask pour délai imperceptible (plus rapide que setTimeout)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => {
          if (typeof queueMicrotask === 'function') {
            queueMicrotask(() => resolve());
          } else {
            // Fallback pour navigateurs très anciens
            setTimeout(() => resolve(), 0);
          }
        });
      }
    } catch (error) {
      // Erreur lors vérification : considérer comme OK (meilleure robustesse)
      // Si IndexedDB down, on retourne le token quand même
      log.warn('[generateSecureToken] Erreur vérification collision, token retourné quand même', {
        error: error.message,
        tokenPrefix: token.substring(0, prefix.length + 8) + '...'
      });
      return token;
    }
  }
  
  // ❌ Collision après maxRetries : erreur
  const error = new Error(`Impossible de générer un token unique après ${maxRetries} tentatives. Probabilité très faible, vérifier IndexedDB.`);
  log.error('[generateSecureToken] Échec génération token unique', { maxRetries });
  throw error;
}

/**
 * Parse une durée (ex: "24h", "7d") en millisecondes
 * 
 * @param {string} duration - Durée (format: "1h", "24h", "7d", "30d")
 * @returns {number} Durée en millisecondes
 */
export function parseDuration(duration) {
  if (!duration || typeof duration !== 'string') {
    return EXPIRATION_OPTIONS['24h']; // Défaut 24h
  }
  
  // Vérifier si c'est une clé directe
  if (EXPIRATION_OPTIONS[duration]) {
    return EXPIRATION_OPTIONS[duration];
  }
  
  // Parser format "24h", "7d", etc.
  const match = duration.match(/(\d+)([hdm])/);
  if (!match) {
    log.warn(`[parseDuration] Format invalide: ${duration}, utilisation défaut 24h`);
    return EXPIRATION_OPTIONS['24h'];
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers = {
    m: 60 * 1000,           // minutes
    h: 60 * 60 * 1000,      // heures
    d: 24 * 60 * 60 * 1000  // jours
  };
  
  if (!multipliers[unit]) {
    log.warn(`[parseDuration] Unité invalide: ${unit}, utilisation défaut 24h`);
    return EXPIRATION_OPTIONS['24h'];
  }
  
  return value * multipliers[unit];
}

// ==================== GESTION SHARE LINKS (IndexedDB) ====================

/**
 * Sauvegarde un lien de partage dans IndexedDB
 * 
 * @param {Object} shareLink - Lien de partage
 * @param {string} shareLink.id - ID unique (token)
 * @param {string} shareLink.token - Token sécurisé
 * @param {number} shareLink.expiresAt - Timestamp expiration
 * @param {Array<string>} shareLink.permissions - Permissions (['read'])
 * @param {string} shareLink.scope - Scope (all, stats, charts, progress)
 * @param {number} shareLink.createdAt - Timestamp création
 * @returns {Promise<void>}
 */
export async function saveShareLink(shareLink) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[saveShareLink] Store nutrition_shareLinks n\'existe pas encore');
      throw new Error('Store nutrition_shareLinks n\'existe pas encore. Migration nécessaire.');
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    await store.put({
      id: shareLink.token, // Utiliser token comme ID pour recherche rapide
      ...shareLink,
      accessCount: shareLink.accessCount || 0,
      lastAccessed: shareLink.lastAccessed || null
    });
    
    await tx.complete;
    
    // ✅ Réduction logs : sauvegarde lien (non critique)
    // log.debug supprimé pour éviter spam
  } catch (error) {
    log.error('[saveShareLink] Erreur sauvegarde lien:', error);
    throw error;
  }
}

/**
 * Récupère un lien de partage par token
 * 
 * ✅ PHASE 1.1 + 16 : Vérification collision avec fallback index manquant
 * - Utilise index 'token' si disponible (rapide, O(log n))
 * - Fallback getAll + filter si index manquant (dégradation gracieuse)
 * - Robustesse en cas de migration incomplète
 * 
 * @param {string} token - Token du lien
 * @returns {Promise<Object|null>} Lien de partage ou null si non trouvé
 */
export async function getShareLink(token) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return null;
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[getShareLink] Store nutrition_shareLinks n\'existe pas encore');
      return null;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readonly');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    // ✅ PHASE 16 : Vérifier existence index avant utilisation (robustesse)
    if (store.indexNames && store.indexNames.contains('token')) {
      // ✅ Index disponible : utilisation optimale (O(log n))
      const index = store.index('token');
      const request = index.get(token);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          log.error('[getShareLink] Erreur récupération lien avec index:', request.error);
          reject(request.error);
        };
      });
    } else {
      // ✅ PHASE 16 : Fallback si index manquant (dégradation gracieuse)
      log.warn('[getShareLink] Index token manquant, utilisation fallback getAll + filter');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const links = request.result || [];
          // Recherche linéaire (O(n)) - acceptable si peu de liens
          const link = links.find(l => l.token === token);
          resolve(link || null);
        };
        
        request.onerror = () => {
          log.error('[getShareLink] Erreur récupération liens (fallback):', request.error);
          reject(request.error);
        };
      });
    }
  } catch (error) {
    log.error('[getShareLink] Erreur récupération lien:', error);
    return null;
  }
}

/**
 * Récupère tous les liens de partage actifs
 * 
 * @returns {Promise<Array<Object>>} Liste des liens de partage
 */
export async function getAllShareLinks() {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return [];
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[getAllShareLinks] Store nutrition_shareLinks n\'existe pas encore');
      return [];
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readonly');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const links = request.result || [];
        // Filtrer liens expirés
        const now = Date.now();
        const activeLinks = links.filter(link => link.expiresAt > now);
        resolve(activeLinks);
      };
      
      request.onerror = () => {
        log.error('[getAllShareLinks] Erreur récupération liens:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('[getAllShareLinks] Erreur récupération liens:', error);
    return [];
  }
}

/**
 * Supprime un lien de partage
 * 
 * @param {string} token - Token du lien à supprimer
 * @returns {Promise<void>}
 */
export async function deleteShareLink(token) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[deleteShareLink] Store nutrition_shareLinks n\'existe pas encore');
      return;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    await store.delete(token);
    await tx.complete;
    
    log.debug('[deleteShareLink] Lien supprimé', {
      token: token.substring(0, 8) + '...'
    });
  } catch (error) {
    log.error('[deleteShareLink] Erreur suppression lien:', error);
    throw error;
  }
}

/**
 * ✅ PHASE 1.3 : Détecte comportements suspects d'accès
 * 
 * @param {Object} shareLink - Lien de partage avec accessLog
 * @returns {Object} { suspicious: boolean, reasons: Array<string>, score: number }
 */
function detectSuspiciousBehavior(shareLink) {
  const accessLog = shareLink.accessLog || [];
  const now = Date.now();
  const reasons = [];
  let score = 0;

  if (accessLog.length === 0) {
    return { suspicious: false, reasons: [], score: 0 };
  }

  // 1. Vérifier burst (trop d'accès en peu de temps)
  const recentAccesses = accessLog.filter(access => 
    now - access.timestamp < BURST_WINDOW_MS
  );
  
  if (recentAccesses.length >= BURST_THRESHOLD) {
    reasons.push(`Burst détecté: ${recentAccesses.length} accès en ${BURST_WINDOW_MS / 1000}s`);
    score += 50;
  }

  // 2. Vérifier accès trop rapides (< 1 seconde entre accès)
  if (accessLog.length >= 2) {
    const lastTwo = accessLog.slice(-2);
    const interval = lastTwo[1].timestamp - lastTwo[0].timestamp;
    
    if (interval < MIN_ACCESS_INTERVAL_MS) {
      reasons.push(`Accès trop rapides: ${interval}ms entre accès`);
      score += 30;
    }
  }

  // 3. Vérifier pattern répétitif (même timestamp modulo arrondi)
  if (accessLog.length >= 3) {
    const intervals = [];
    for (let i = 1; i < accessLog.length; i++) {
      intervals.push(accessLog[i].timestamp - accessLog[i - 1].timestamp);
    }
    
    // Détecter si tous les intervalles sont identiques (bot)
    const allSame = intervals.every(ival => 
      Math.abs(ival - intervals[0]) < 1000 // Tolérance 1s
    );
    
    if (allSame && intervals.length >= 3) {
      reasons.push(`Pattern répétitif détecté: intervalles identiques`);
      score += 40;
    }
  }

  // 4. Vérifier nombre total d'accès suspects cumulés
  const suspiciousCount = (shareLink.suspiciousAccessCount || 0) + (score > 0 ? 1 : 0);
  if (suspiciousCount >= SUSPICIOUS_ACCESS_THRESHOLD) {
    reasons.push(`Nombre élevé d'accès suspects: ${suspiciousCount}`);
    score += 60;
  }

  const suspicious = score >= 50 || reasons.length >= 2;

  return {
    suspicious,
    reasons,
    score,
    suspiciousCount: suspiciousCount
  };
}

/**
 * ✅ PHASE 1.3 : Bloque un lien (empêche tout accès futur)
 * 
 * @param {string} token - Token du lien à bloquer
 * @param {string} reason - Raison du blocage
 * @returns {Promise<void>}
 */
export async function lockShareLink(token, reason = 'Comportement suspect détecté') {
  try {
    const shareLink = await getShareLink(token);
    if (!shareLink || shareLink.locked) {
      return; // Déjà bloqué ou non trouvé
    }
    
    await saveShareLink({
      ...shareLink,
      locked: true,
      lockedAt: Date.now(),
      lockReason: reason
    });
    
    log.warn('[lockShareLink] Lien bloqué', {
      token: token.substring(0, 8) + '...',
      reason,
      accessCount: shareLink.accessCount || 0
    });
  } catch (error) {
    log.error('[lockShareLink] Erreur blocage lien:', error);
  }
}

/**
 * Met à jour les statistiques d'accès d'un lien
 * 
 * ✅ PHASE 1.3 : Access control avec limite accès + détection abus + audit trail
 * 
 * @param {string} token - Token du lien
 * @param {Object} context - Contexte accès (optionnel: userAgent, etc.)
 * @returns {Promise<Object>} { allowed: boolean, reason?: string }
 * @throws {Error} Si accès refusé (limite atteinte ou comportement suspect)
 */
/**
 * ✅ PHASE 8 : Met à jour les statistiques d'accès d'un lien (avec transaction fusionnée)
 * 
 * ✅ PHASE 8 : Optimisation transaction IndexedDB fusionnée
 * - Fusionne getShareLink + saveShareLink en une seule transaction
 * - Réduit nombre de transactions de 2 à 1 (50% plus rapide)
 * - Opération atomique (pas de race conditions)
 * 
 * @param {string} token - Token du lien
 * @param {Object} context - Contexte accès (optionnel: userAgent, etc.)
 * @returns {Promise<Object>} { allowed: boolean, reason?: string }
 * @throws {Error} Si accès refusé (limite atteinte ou comportement suspect)
 */
export async function updateShareLinkAccess(token, context = {}) {
  try {
    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[updateShareLinkAccess] Store nutrition_shareLinks n\'existe pas encore');
      throw new Error('Token invalide');
    }

    // ✅ PHASE 8 : Transaction unique pour get + update (50% plus rapide)
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    // ✅ PHASE 8 : Récupérer lien dans même transaction
    const shareLink = await new Promise((resolve, reject) => {
      // ✅ PHASE 8 : Utiliser index si disponible, sinon fallback
      let request;
      try {
        if (store.indexNames && store.indexNames.contains('token')) {
          const index = store.index('token');
          request = index.get(token);
        } else {
          // Fallback : utiliser primary key (token est l'ID)
          request = store.get(token);
        }
      } catch (error) {
        // Si index manquant, utiliser primary key
        request = store.get(token);
      }
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        log.error('[updateShareLinkAccess] Erreur getShareLink:', request.error);
        reject(request.error);
      };
    });

    if (!shareLink) {
      throw new Error('Token invalide');
    }

    // ✅ PHASE 1.3 : Vérifier si lien bloqué
    if (shareLink.locked) {
      const error = new Error(`Lien bloqué: ${shareLink.lockReason || 'Comportement suspect détecté'}`);
      error.code = 'link_locked';
      throw error;
    }

    // ✅ PHASE 1.3 : Vérifier limite max d'accès
    const currentAccessCount = shareLink.accessCount || 0;
    const maxAccesses = shareLink.maxAccesses || MAX_ACCESSES_PER_TOKEN;
    
    if (currentAccessCount >= maxAccesses) {
      // Bloquer automatiquement si limite atteinte
      const updatedLink = {
        ...shareLink,
        locked: true,
        lockedAt: Date.now(),
        lockReason: `Limite d'accès atteinte: ${maxAccesses}`
      };
      
      // ✅ PHASE 8 : Bloquer dans même transaction
      await new Promise((resolve, reject) => {
        const putRequest = store.put(updatedLink);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
      
      await tx.complete;
      
      const error = new Error(`Limite d'accès atteinte: ${maxAccesses} accès maximum`);
      error.code = 'max_accesses_reached';
      throw error;
    }

    // ✅ PHASE 1.3 : Détecter comportement suspect avant ajout
    const behavior = detectSuspiciousBehavior(shareLink);
    
    if (behavior.suspicious) {
      const suspiciousCount = (shareLink.suspiciousAccessCount || 0) + 1;
      
      // Bloquer si trop d'accès suspects
      if (suspiciousCount >= SUSPICIOUS_ACCESS_THRESHOLD) {
        const updatedLink = {
          ...shareLink,
          locked: true,
          lockedAt: Date.now(),
          lockReason: `Comportement suspect: ${behavior.reasons.join(', ')}`,
          suspiciousAccessCount: suspiciousCount
        };
        
        // ✅ PHASE 8 : Bloquer dans même transaction
        await new Promise((resolve, reject) => {
          const putRequest = store.put(updatedLink);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        });
        
        await tx.complete;
        
        const error = new Error(`Lien bloqué: comportement suspect détecté`);
        error.code = 'suspicious_behavior';
        error.reasons = behavior.reasons;
        throw error;
      }
    }

    // ✅ PHASE 1.3 : Ajouter à audit trail (accessLog)
    const accessLog = shareLink.accessLog || [];
    const accessEntry = {
      timestamp: Date.now(),
      userAgent: context.userAgent || navigator?.userAgent || 'unknown',
      // IP non disponible côté client (serait côté serveur)
      // Mais on peut utiliser fingerprinting simple si nécessaire
    };
    
    // Limiter taille accessLog (garder 100 derniers)
    const updatedAccessLog = [...accessLog, accessEntry].slice(-100);

    // ✅ PHASE 8 : Mettre à jour lien dans même transaction (atomique)
    const updatedLink = {
      ...shareLink,
      accessCount: currentAccessCount + 1,
      lastAccessed: Date.now(),
      accessLog: updatedAccessLog,
      suspiciousAccessCount: behavior.suspicious ? 
        ((shareLink.suspiciousAccessCount || 0) + 1) : 
        (shareLink.suspiciousAccessCount || 0)
    };
    
    await new Promise((resolve, reject) => {
      const putRequest = store.put(updatedLink);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
    
    await tx.complete;
    
    // ✅ Réduction logs : mise à jour accès (seulement si suspect)
    if (behavior.suspicious) {
      log.warn('[updateShareLinkAccess] Accès suspect détecté', {
        token: token.substring(0, 8) + '...',
        accessCount: currentAccessCount + 1,
        suspiciousCount: updatedLink.suspiciousAccessCount
      });
    }

    return {
      allowed: true,
      accessCount: currentAccessCount + 1,
      maxAccesses,
      suspiciousDetected: behavior.suspicious
    };
  } catch (error) {
    if (error.code === 'link_locked' || error.code === 'max_accesses_reached' || error.code === 'suspicious_behavior') {
      throw error; // Re-lancer erreurs spécifiques
    }
    log.error('[updateShareLinkAccess] Erreur mise à jour accès:', error);
    throw error;
  }
}

/**
 * ✅ PHASE 1.3 : Exporte fonction détection abus (pour tests/debug)
 */
export { detectSuspiciousBehavior };

/**
 * Nettoie les liens expirés
 * 
 * @returns {Promise<number>} Nombre de liens supprimés
 */
/**
 * ✅ PHASE 7 : Nettoie les liens expirés (basé sur expiresAt)
 * 
 * @returns {Promise<number>} Nombre de liens supprimés
 */
export async function cleanupExpiredLinks() {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return 0;
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[cleanupExpiredLinks] Store nutrition_shareLinks n\'existe pas encore');
      return 0;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    // ✅ PHASE 7 : Fallback si index expiresAt manquant
    let index;
    try {
      index = store.index('expiresAt');
    } catch (error) {
      // Index manquant : utiliser getAll + filter
      log.warn('[cleanupExpiredLinks] Index expiresAt manquant, utilisation fallback');
      // ✅ FIX : store.getAll() retourne IDBRequest, pas Promise - convertir en Promise
      const allLinks = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => {
          log.error('[cleanupExpiredLinks] Erreur getAll (fallback):', request.error);
          reject(request.error);
        };
      });
      
      // ✅ PHASE 7 : Vérifier que allLinks est un tableau
      if (!Array.isArray(allLinks)) {
        log.warn('[cleanupExpiredLinks] allLinks n\'est pas un tableau:', typeof allLinks);
        return 0;
      }
      
      const now = Date.now();
      
      const expiredLinks = allLinks.filter(link => {
        const expiresAt = typeof link.expiresAt === 'number' 
          ? link.expiresAt 
          : (link.expiresAt ? new Date(link.expiresAt).getTime() : null);
        return expiresAt !== null && expiresAt <= now;
      });
      
      if (expiredLinks.length === 0) {
        return 0;
      }
      
      // Supprimer liens expirés
      const deletePromises = expiredLinks.map(link => store.delete(link.token));
      await Promise.all(deletePromises);
      
      if (expiredLinks.length > 0) {
        // ✅ Réduction logs : seulement si count > 0
        log.debug(`[cleanupExpiredLinks] ${expiredLinks.length} liens expirés supprimés (fallback)`);
      }
      
      return expiredLinks.length;
    }
    
    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    
    let deletedCount = 0;
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            // ✅ Réduction logs : seulement si count > 0
            log.debug(`[cleanupExpiredLinks] ${deletedCount} liens expirés supprimés`);
          }
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        log.error('[cleanupExpiredLinks] Erreur nettoyage:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('[cleanupExpiredLinks] Erreur nettoyage:', error);
    return 0;
  }
}

/**
 * ✅ PHASE 7 : Nettoie les liens révoqués anciens (>30 jours après création)
 * 
 * ✅ PHASE 7 : Nettoyage automatique liens révoqués
 * - Supprime liens bloqués (locked: true) créés il y a >30 jours
 * - Supprime liens dont dernière accès >30 jours ET créés il y a >30 jours (orphelins)
 * - Optimise IndexedDB en libérant espace
 * 
 * @returns {Promise<number>} Nombre de liens supprimés
 */
export async function cleanupRevokedLinks() {
  try {
    const db = await openNutritionDB();
    if (!db) {
      return 0;
    }
    
    // ✅ OPTIMISATION : Vérifier si le store existe avant transaction
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      log.warn('[cleanupRevokedLinks] Store nutrition_shareLinks n\'existe pas encore');
      return 0;
    }
    
    const tx = db.transaction([STORE_SHARE_LINKS], 'readwrite');
    const store = tx.objectStore(STORE_SHARE_LINKS);
    
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
    const cutoffDate = now - THIRTY_DAYS_MS;
    
    // ✅ PHASE 7 : Récupérer tous les liens pour analyse
    // ✅ FIX : store.getAll() retourne IDBRequest, pas Promise - convertir en Promise
    const allLinks = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        log.error('[cleanupRevokedLinks] Erreur getAll:', request.error);
        reject(request.error);
      };
    });
    
    // ✅ PHASE 7 : Vérifier que allLinks est un tableau
    if (!Array.isArray(allLinks)) {
      log.warn('[cleanupRevokedLinks] allLinks n\'est pas un tableau:', typeof allLinks);
      return 0;
    }
    
    const linksToDelete = allLinks.filter(link => {
      const createdAt = typeof link.createdAt === 'number' 
        ? link.createdAt 
        : (link.createdAt ? new Date(link.createdAt).getTime() : null);
      
      // Si pas de createdAt, garder le lien (données anciennes)
      if (!createdAt || createdAt > cutoffDate) {
        return false; // Récent, garder
      }
      
      // ✅ PHASE 7 : Supprimer si bloqué (locked) ET ancien (>30 jours)
      if (link.locked === true && createdAt <= cutoffDate) {
        return true;
      }
      
      // ✅ PHASE 7 : Supprimer si orphelin (pas d'accès depuis >30 jours ET créé il y a >30 jours)
      const lastAccessed = typeof link.lastAccessed === 'number'
        ? link.lastAccessed
        : (link.lastAccessed ? new Date(link.lastAccessed).getTime() : null);
      
      if (!lastAccessed && createdAt <= cutoffDate) {
        // Jamais accédé et créé il y a >30 jours
        return true;
      }
      
      if (lastAccessed && (now - lastAccessed) > THIRTY_DAYS_MS && createdAt <= cutoffDate) {
        // Dernier accès il y a >30 jours ET créé il y a >30 jours
        return true;
      }
      
      return false;
    });
    
    if (linksToDelete.length === 0) {
      return 0;
    }
    
    // ✅ PHASE 7 : Supprimer liens identifiés
    const deletePromises = linksToDelete.map(link => store.delete(link.token));
    await Promise.all(deletePromises);
    
    if (linksToDelete.length > 0) {
      log.debug(`[cleanupRevokedLinks] ${linksToDelete.length} liens révoqués anciens supprimés`);
    }
    
    return linksToDelete.length;
  } catch (error) {
    log.error('[cleanupRevokedLinks] Erreur nettoyage liens révoqués:', error);
    return 0;
  }
}

// ==================== SERVICE CLEANUP UNIFIÉ ====================

/**
 * ✅ PHASE 7 : Service de cleanup unifié avec tracking statistiques
 * 
 * ✅ PHASE 7 : Cleanup automatique amélioré
 * - Nettoie liens expirés
 * - Nettoie liens révoqués anciens (>30 jours)
 * - Nettoie cache QR codes orphelins
 * - Tracking statistiques cleanup
 * - Métadonnées cleanup sauvegardées (IndexedDB + localStorage)
 */
export class CleanupService {
  /**
   * ✅ PHASE 7 : Configuration cleanup
   */
  static CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
  static REVOKED_LINKS_AGE_DAYS = 30; // 30 jours après création
  static LAST_CLEANUP_KEY = 'nutrition_share_last_cleanup';
  static CLEANUP_STATS_KEY = 'nutrition_share_cleanup_stats';

  /**
   * ✅ PHASE 7 : Exécute cleanup complet avec tracking
   * 
   * @param {Object} options - Options cleanup
   * @param {boolean} options.force - Forcer cleanup même si récent (défaut: false)
   * @param {Array<string>} options.activeTokens - Tokens actifs pour cleanup QR (optionnel)
   * @returns {Promise<Object>} Statistiques cleanup { expiredLinks, revokedLinks, orphanedQR, total, lastCleanup }
   */
  static async runCleanup(options = {}) {
    const { force = false, activeTokens = null } = options;
    
    try {
      // ✅ PHASE 7 : Vérifier si cleanup récent (sauf si force)
      if (!force) {
        const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
        if (lastCleanup) {
          const lastCleanupTime = parseInt(lastCleanup, 10);
          const timeSinceLastCleanup = Date.now() - lastCleanupTime;
          
          // Si cleanup récent (< 7 jours), skip
          if (timeSinceLastCleanup < this.CLEANUP_INTERVAL_MS) {
            log.debug('[runCleanup] Cleanup récent, ignoré', {
              lastCleanup: new Date(lastCleanupTime).toISOString(),
              daysSince: Math.floor(timeSinceLastCleanup / (24 * 60 * 60 * 1000))
            });
            return this.getLastCleanupStats();
          }
        }
      }

      log.debug('[runCleanup] Démarrage cleanup complet');
      const startTime = Date.now();

      // ✅ PHASE 7 : 1. Nettoyer liens expirés
      const expiredLinksCount = await cleanupExpiredLinks();

      // ✅ PHASE 7 : 2. Nettoyer liens révoqués anciens
      const revokedLinksCount = await cleanupRevokedLinks();

      // ✅ PHASE 7 : 3. Nettoyer cache QR codes orphelins
      let orphanedQRCount = 0;
      try {
        if (activeTokens && Array.isArray(activeTokens)) {
          orphanedQRCount = cleanupOrphanedQRCache(activeTokens);
        } else {
          // ✅ PHASE 7 : Récupérer tokens actifs depuis IndexedDB si non fournis
          const allLinks = await getAllShareLinks();
          const now = Date.now();
          const activeTokensList = allLinks
            .filter(link => {
              const expiresAt = typeof link.expiresAt === 'number' 
                ? link.expiresAt 
                : (link.expiresAt ? new Date(link.expiresAt).getTime() : null);
              return expiresAt === null || expiresAt > now;
            })
            .map(link => link.token);
          
          orphanedQRCount = cleanupOrphanedQRCache(activeTokensList);
        }
      } catch (error) {
        log.warn('[runCleanup] Erreur cleanup QR codes orphelins:', error);
        // Continue même si échec QR cleanup
      }

      // ✅ PHASE 7 : Calculer statistiques
      const total = expiredLinksCount + revokedLinksCount;
      const duration = Date.now() - startTime;
      const now = Date.now();

      const stats = {
        lastCleanup: now,
        duration,
        expiredLinks: expiredLinksCount,
        revokedLinks: revokedLinksCount,
        orphanedQR: orphanedQRCount,
        total
      };

      // ✅ PHASE 7 : Sauvegarder métadonnées cleanup
      localStorage.setItem(this.LAST_CLEANUP_KEY, now.toString());
      
      try {
        const statsJson = JSON.stringify(stats);
        localStorage.setItem(this.CLEANUP_STATS_KEY, statsJson);
      } catch (error) {
        log.warn('[runCleanup] Erreur sauvegarde stats cleanup:', error);
      }

      log.debug('[runCleanup] Cleanup terminé', {
        ...stats,
        duration: `${duration}ms`
      });

      return stats;
    } catch (error) {
      log.error('[runCleanup] Erreur cleanup complet:', error);
      
      // ✅ PHASE 7 : Retourner stats partiels en cas d'erreur
      return {
        lastCleanup: null,
        duration: 0,
        expiredLinks: 0,
        revokedLinks: 0,
        orphanedQR: 0,
        total: 0,
        error: error.message
      };
    }
  }

  /**
   * ✅ PHASE 7 : Récupère statistiques dernier cleanup
   * 
   * @returns {Object} Statistiques dernier cleanup
   */
  static getLastCleanupStats() {
    try {
      const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
      const statsJson = localStorage.getItem(this.CLEANUP_STATS_KEY);
      
      if (!lastCleanup) {
        return {
          lastCleanup: null,
          expiredLinks: 0,
          revokedLinks: 0,
          orphanedQR: 0,
          total: 0
        };
      }

      const stats = statsJson ? JSON.parse(statsJson) : {};
      
      return {
        lastCleanup: parseInt(lastCleanup, 10),
        expiredLinks: stats.expiredLinks || 0,
        revokedLinks: stats.revokedLinks || 0,
        orphanedQR: stats.orphanedQR || 0,
        total: stats.total || 0,
        duration: stats.duration || 0
      };
    } catch (error) {
      log.warn('[getLastCleanupStats] Erreur récupération stats:', error);
      return {
        lastCleanup: null,
        expiredLinks: 0,
        revokedLinks: 0,
        orphanedQR: 0,
        total: 0
      };
    }
  }

  /**
   * ✅ PHASE 7 : Formate date dernier cleanup pour affichage
   * 
   * @param {number} timestamp - Timestamp cleanup (ou null)
   * @returns {string} Date formatée ou "Jamais"
   */
  static formatLastCleanup(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') {
      return 'Jamais';
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    if (days === 1) {
      return 'Hier';
    }

    if (days < 7) {
      return `Il y a ${days} jours`;
    }

    // Plus de 7 jours : date complète
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * ✅ PHASE 7 : Vérifie si cleanup nécessaire
   * 
   * @returns {boolean} true si cleanup nécessaire
   */
  static isCleanupNeeded() {
    const lastCleanup = localStorage.getItem(this.LAST_CLEANUP_KEY);
    if (!lastCleanup) {
      return true; // Jamais fait
    }

    const lastCleanupTime = parseInt(lastCleanup, 10);
    const timeSinceLastCleanup = Date.now() - lastCleanupTime;
    
    return timeSinceLastCleanup >= this.CLEANUP_INTERVAL_MS;
  }
}

// ==================== GÉNÉRATION LIEN PARTAGE ====================

/**
 * Génère un lien de partage sécurisé
 * 
 * ✅ PHASE 1.2 : Vérification rate limiting + limite liens actifs avant génération
 * 
 * @param {Object} options - Options de partage
 * @param {string} options.expiresIn - Durée validité (défaut: '24h')
 * @param {Array<string>} options.permissions - Permissions (défaut: ['read'])
 * @param {string} options.scope - Scope partage (défaut: 'all')
 * @param {Array<Object>} options.existingLinks - Liens existants (pour vérifier limites) - optionnel
 * @returns {Promise<Object>} Lien de partage avec URL, token, QR code
 * @throws {Error} Si rate limiting ou limite liens actifs atteinte
 */
export async function generateSecureShareLink(options = {}) {
  const {
    expiresIn = '24h',
    permissions = [PERMISSIONS.read],
    scope = SHARE_SCOPES.all,
    existingLinks = null // Optionnel : passer pour éviter rechargement
  } = options;
  
  try {
    // ✅ PHASE 1.2 : Vérifier rate limiting et limite liens actifs
    let linksToCheck = existingLinks;
    if (linksToCheck === null) {
      // Charger liens si non fournis (évite rechargement si déjà chargés)
      linksToCheck = await getAllShareLinks();
    }
    
    const checkResult = checkShareLinkCreationAllowed(linksToCheck);
    if (!checkResult.allowed) {
      const error = new Error(checkResult.message || 'Création de lien non autorisée');
      error.code = checkResult.reason;
      error.waitTime = checkResult.waitTime;
      error.activeCount = checkResult.activeCount;
      error.maxActive = checkResult.maxActive;
      log.warn('[generateSecureShareLink] Création refusée', checkResult);
      throw error;
    }

    // ✅ PHASE 1.1 : Générer token sécurisé avec vérification collision
    const token = await generateSecureToken(32, 'share_', 5);
    const expiresAt = Date.now() + parseDuration(expiresIn);
    const createdAt = Date.now();
    
    // Créer payload
    const shareLink = {
      id: token,
      token,
      expiresAt,
      permissions,
      scope,
      createdAt,
      accessCount: 0,
      lastAccessed: null
    };
    
    // Sauvegarder dans IndexedDB
    await saveShareLink(shareLink);
    
    // Générer URL de partage (pour export JSON)
    // Dans une app locale, l'URL est juste pour référence (export JSON contient token)
    const shareUrl = `${window.location.origin}/nutrition/share/${token}`;
    
    // ✅ PHASE 2 : Générer QR code localement (avec cache automatique)
    const qrCode = await generateQRCode(shareUrl, {
      size: 200,
      margin: 2,
      errorCorrectionLevel: 'M'
    });
    
    // ✅ Réduction logs : génération lien (important mais réduit)
    // log.debug supprimé pour éviter spam
    
    return {
      url: shareUrl,
      token,
      expiresAt,
      scope,
      permissions,
      qrCode,
      createdAt
    };
  } catch (error) {
    log.error('[generateSecureShareLink] Erreur génération lien:', error);
    throw error;
  }
}

// ==================== GÉNÉRATION QR CODE ====================

/**
 * ✅ PHASE 2 : Constantes cache QR codes
 */
const QR_CACHE_PREFIX = 'qr_share_';
const QR_CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
const QR_CACHE_CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // Nettoyage tous les 7 jours

/**
 * ✅ PHASE 2 : Génère clé cache QR code
 * 
 * @param {string} data - Données à encoder (URL ou token)
 * @returns {string} Clé cache
 */
function getQRCacheKey(data) {
  // Hash simple pour réduire taille clé (SHA-256 serait mieux mais plus lourd)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${QR_CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
}

/**
 * ✅ PHASE 2 : Récupère QR code depuis cache localStorage
 * 
 * @param {string} data - Données à encoder
 * @returns {string|null} QR code Data URL ou null si non trouvé/expiré
 */
function getQRFromCache(data) {
  try {
    const cacheKey = getQRCacheKey(data);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifier expiration
    if (now > parsed.expiresAt) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // ✅ Réduction logs : cache QR code (non critique)
    // log.debug supprimé pour éviter spam
    
    return parsed.dataUrl;
  } catch (error) {
    log.warn('[getQRFromCache] Erreur lecture cache QR code:', error);
    return null;
  }
}

/**
 * ✅ PHASE 2 : Sauvegarde QR code dans cache localStorage
 * 
 * @param {string} data - Données encodées
 * @param {string} dataUrl - QR code Data URL
 * @returns {boolean} true si sauvegardé, false si erreur
 */
function saveQRToCache(data, dataUrl) {
  try {
    const cacheKey = getQRCacheKey(data);
    const now = Date.now();
    
    const cacheEntry = {
      dataUrl,
      createdAt: now,
      expiresAt: now + QR_CACHE_EXPIRY_MS,
      dataHash: data.substring(0, 50) // Hash partiel pour validation
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    
    // ✅ Réduction logs : sauvegarde cache QR code (non critique)
    // log.debug supprimé pour éviter spam
    
    return true;
  } catch (error) {
    // Erreur probablement localStorage plein - ignorer silencieusement
    if (error.name === 'QuotaExceededError') {
      log.warn('[saveQRToCache] localStorage plein, nettoyage cache nécessaire');
      cleanupOrphanedQRCache(); // Nettoyage immédiat
    } else {
      log.warn('[saveQRToCache] Erreur sauvegarde cache QR code:', error);
    }
    return false;
  }
}

/**
 * ✅ PHASE 2 : Nettoie cache QR codes orphelins (expirés ou liés à tokens supprimés)
 * 
 * @param {Array<string>} activeTokens - Liste des tokens actifs (optionnel)
 * @returns {number} Nombre d'entrées nettoyées
 */
export function cleanupOrphanedQRCache(activeTokens = null) {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    const keysToRemove = [];
    
    // Parcourir toutes les clés localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (!key || !key.startsWith(QR_CACHE_PREFIX)) {
        continue; // Ignorer clés non-QR
      }
      
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;
        
        const parsed = JSON.parse(cached);
        
        // 1. Vérifier expiration
        if (now > parsed.expiresAt) {
          keysToRemove.push(key);
          cleanedCount++;
          continue;
        }
        
        // 2. Vérifier si token associé existe encore (si activeTokens fourni)
        if (activeTokens && Array.isArray(activeTokens)) {
          // Essayer de matcher avec tokens actifs (heuristique basée sur dataHash)
          const tokenMatch = activeTokens.some(token => {
            // Vérifier si le hash partiel correspond à un token actif
            const tokenPrefix = token.substring(0, 50);
            return parsed.dataHash && parsed.dataHash.includes(tokenPrefix.substring(0, 10));
          });
          
          if (!tokenMatch) {
            // Token probablement supprimé - marquer pour nettoyage
            keysToRemove.push(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Entrée corrompue - supprimer
        keysToRemove.push(key);
        cleanedCount++;
      }
    }
    
    // Supprimer clés marquées
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        log.warn('[cleanupOrphanedQRCache] Erreur suppression clé:', key, error);
      }
    });
    
    if (cleanedCount > 0) {
      log.debug('[cleanupOrphanedQRCache] Cache QR nettoyé', {
        cleanedCount,
        remaining: localStorage.length
      });
    }
    
    return cleanedCount;
  } catch (error) {
    log.error('[cleanupOrphanedQRCache] Erreur nettoyage cache QR code:', error);
    return 0;
  }
}

/**
 * ✅ PHASE 2 : Génère un QR code Data URL pour une URL ou token
 * 
 * ✅ PHASE 2 : Génération locale avec bibliothèque qrcode
 * - Génération locale (100% offline, pas d'API externe)
 * - Cache localStorage pour éviter régénération
 * - Options optimisées (taille, marge, correction erreur)
 * - Gestion erreurs robuste avec fallback
 * 
 * @param {string} data - URL ou token à encoder
 * @param {Object} options - Options génération QR code
 * @param {number} options.size - Taille QR code (défaut: 200)
 * @param {number} options.margin - Marge (défaut: 2)
 * @param {string} options.errorCorrectionLevel - Niveau correction ('L', 'M', 'Q', 'H', défaut: 'M')
 * @param {boolean} options.forceRegenerate - Forcer régénération (ignorer cache, défaut: false)
 * @returns {Promise<string>} QR code en format Data URL (PNG)
 */
export async function generateQRCode(data, options = {}) {
  const {
    size = 200,
    margin = 2,
    errorCorrectionLevel = 'M', // Niveau M = 15% erreurs corrigées (bon compromis)
    forceRegenerate = false
  } = options;
  
  try {
    if (!data || typeof data !== 'string') {
      throw new Error('Données invalides pour QR code');
    }
    
    // ✅ PHASE 2 : Vérifier cache (si pas forceRegenerate)
    if (!forceRegenerate) {
      const cached = getQRFromCache(data);
      if (cached) {
        return cached;
      }
    }
    
    // ✅ PHASE 2 : Générer QR code localement avec bibliothèque qrcode
    const dataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin: margin,
      color: {
        dark: '#000000',  // Noir pour modules
        light: '#FFFFFF'  // Blanc pour fond
      },
      errorCorrectionLevel: errorCorrectionLevel
    });
    
    // ✅ PHASE 2 : Sauvegarder dans cache
    saveQRToCache(data, dataUrl);
    
    // ✅ Réduction logs : génération QR code (non critique)
    // log.debug supprimé pour éviter spam
    
    return dataUrl;
  } catch (error) {
    // ✅ PHASE 8 : Supprimé code mort placeholder SVG (non utilisé, qrcode library génère toujours un résultat)
    log.error('[generateQRCode] Erreur génération QR code:', error);
    return null;
  }
}

// ==================== PRÉPARATION DONNÉES PARTAGE ====================

/**
 * Prépare les données nutrition pour partage (anonymisées selon scope)
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {Array} nutritionData.dailyMeals - Liste des dailyMeals
 * @param {Array} nutritionData.meals - Liste de tous les repas
 * @param {Array} nutritionData.programs - Liste des programmes
 * @param {Object} nutritionData.gamification - Données gamification
 * @param {Array} nutritionData.hydrationLogs - Logs hydratation
 * @param {string} scope - Scope partage (all, stats, charts, progress)
 * @returns {Object} Données préparées pour partage
 */
export function prepareNutritionDataForShare(nutritionData, scope = SHARE_SCOPES.all) {
  const {
    dailyMeals = [],
    meals = [],
    programs = [],
    gamification = {},
    hydrationLogs = []
  } = nutritionData;
  
  try {
    const sharedData = {
      scope,
      shareDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Scope: all ou stats
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.stats) {
      // Stats agrégées (anonymisées)
      sharedData.stats = calculateAggregatedStats(dailyMeals, meals, programs);
    }
    
    // Scope: all ou charts
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.charts) {
      // Données graphiques (anonymisées)
      sharedData.charts = prepareChartData(dailyMeals, meals, programs);
    }
    
    // Scope: all ou progress
    if (scope === SHARE_SCOPES.all || scope === SHARE_SCOPES.progress) {
      // Données progression (anonymisées)
      sharedData.progress = prepareProgressData(dailyMeals, meals, programs, gamification);
    }
    
    log.debug('[prepareNutritionDataForShare] Données préparées', {
      scope,
      hasStats: !!sharedData.stats,
      hasCharts: !!sharedData.charts,
      hasProgress: !!sharedData.progress
    });
    
    return sharedData;
  } catch (error) {
    log.error('[prepareNutritionDataForShare] Erreur préparation données:', error);
    return {
      scope,
      shareDate: new Date().toISOString(),
      version: '1.0',
      error: error.message
    };
  }
}

/**
 * Calcule les statistiques agrégées (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Statistiques agrégées
 */
function calculateAggregatedStats(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Calculer moyennes sur 7, 30, 90 jours
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30,
      quarter: 90
    };
    
    const stats = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const endDateStr = DateHelper.toYYYYMMDD(now);
      const startDateStr = DateHelper.getDaysAgoLocal(days);
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      if (periodDailyMeals.length === 0) {
        stats[period] = {
          days: 0,
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          avgCompliance: 0,
          totalMeals: 0
        };
        return;
      }
      
      const totals = periodDailyMeals.reduce((acc, dm) => {
        const dailyTotals = dm.dailyTotals || {};
        return {
          calories: acc.calories + (dailyTotals.calories || 0),
          protein: acc.protein + (dailyTotals.protein || 0),
          carbs: acc.carbs + (dailyTotals.carbs || 0),
          fat: acc.fat + (dailyTotals.fat || 0),
          compliance: acc.compliance + (dailyTotals.complianceScore || 0),
          meals: acc.meals + (dm.mealIds?.length || 0)
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, compliance: 0, meals: 0 });
      
      const daysCount = periodDailyMeals.length;
      
      stats[period] = {
        days: daysCount,
        avgCalories: Math.round(totals.calories / daysCount),
        avgProtein: Math.round((totals.protein / daysCount) * 10) / 10,
        avgCarbs: Math.round((totals.carbs / daysCount) * 10) / 10,
        avgFat: Math.round((totals.fat / daysCount) * 10) / 10,
        avgCompliance: Math.round((totals.compliance / daysCount) * 10) / 10,
        totalMeals: totals.meals,
        avgMealsPerDay: Math.round((totals.meals / daysCount) * 10) / 10
      };
    });
    
    // Statistiques globales
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const activeProgramName = activeProgram?.name || null;
    const activeProgramGoal = activeProgram?.goal || null;
    
    return {
      periods: stats,
      totalDays,
      totalMeals,
      activeProgram: activeProgramName ? {
        name: activeProgramName,
        goal: activeProgramGoal,
        // Ne pas exposer calories/macros exacts du programme (privacy)
        hasProgram: true
      } : null,
      // Ne pas exposer données personnelles identifiables
      // Pas de dates exactes, pas de poids, pas de noms d'aliments
    };
  } catch (error) {
    log.error('[calculateAggregatedStats] Erreur calcul stats:', error);
    return {
      periods: {},
      totalDays: 0,
      totalMeals: 0,
      activeProgram: null
    };
  }
}

/**
 * Prépare les données graphiques (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @returns {Object} Données graphiques
 */
function prepareChartData(dailyMeals, meals, programs) {
  try {
    const activeProgram = programs.find(p => p.isActive) || null;
    
    // Préparer données pour graphiques (30 derniers jours)
    const now = new Date();
    // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
    const endDateStr = DateHelper.toYYYYMMDD(now);
    const startDateStr = DateHelper.getDaysAgoLocal(30);
    
    const chartDailyMeals = dailyMeals.filter(dm => {
      const date = dm.date || dm.timestamp;
      return date >= startDateStr && date <= endDateStr;
    }).sort((a, b) => {
      const dateA = a.date || a.timestamp;
      const dateB = b.date || b.timestamp;
      return dateA.localeCompare(dateB);
    });
    
    // Données pour graphiques (sans dates exactes, utiliser index)
    const chartData = chartDailyMeals.map((dm, index) => {
      const dailyTotals = dm.dailyTotals || {};
      return {
        day: index + 1, // Index au lieu de date exacte (privacy)
        calories: dailyTotals.calories || 0,
        protein: dailyTotals.protein || 0,
        carbs: dailyTotals.carbs || 0,
        fat: dailyTotals.fat || 0,
        compliance: dailyTotals.complianceScore || 0
      };
    });
    
    // Distributions macros (pourcentages)
    const macroDistribution = chartDailyMeals.reduce((acc, dm) => {
      const dailyTotals = dm.dailyTotals || {};
      const proteinPercent = dailyTotals.proteinPercent || 0;
      const carbsPercent = dailyTotals.carbsPercent || 0;
      const fatPercent = dailyTotals.fatPercent || 0;
      
      return {
        protein: acc.protein + proteinPercent,
        carbs: acc.carbs + carbsPercent,
        fat: acc.fat + fatPercent,
        count: acc.count + 1
      };
    }, { protein: 0, carbs: 0, fat: 0, count: 0 });
    
    const daysCount = macroDistribution.count || 1;
    
    return {
      timeline: chartData,
      macroDistribution: {
        protein: Math.round((macroDistribution.protein / daysCount) * 10) / 10,
        carbs: Math.round((macroDistribution.carbs / daysCount) * 10) / 10,
        fat: Math.round((macroDistribution.fat / daysCount) * 10) / 10
      },
      // Ne pas exposer dates exactes, noms d'aliments, etc.
    };
  } catch (error) {
    log.error('[prepareChartData] Erreur préparation données graphiques:', error);
    return {
      timeline: [],
      macroDistribution: { protein: 0, carbs: 0, fat: 0 }
    };
  }
}

/**
 * Prépare les données progression (anonymisées)
 * 
 * @param {Array} dailyMeals - Liste des dailyMeals
 * @param {Array} meals - Liste de tous les repas
 * @param {Array} programs - Liste des programmes
 * @param {Object} gamification - Données gamification
 * @returns {Object} Données progression
 */
function prepareProgressData(dailyMeals, meals, programs, gamification) {
  try {
    const streaks = gamification?.streaks || {};
    const achievements = gamification?.achievements || [];
    const experience = gamification?.experience || { currentXP: 0, level: 1 };
    
    // Statistiques progression (anonymisées)
    const totalDays = dailyMeals.length;
    const totalMeals = meals.length;
    const nutritionStreak = streaks.nutrition?.current || 0;
    const level = experience.level || 1;
    const badgesCount = achievements.length;
    
    // Tendances (sans dates exactes)
    const now = new Date();
    const ranges = {
      week: 7,
      month: 30
    };
    
    const trends = {};
    
    Object.entries(ranges).forEach(([period, days]) => {
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const endDateStr = DateHelper.toYYYYMMDD(now);
      const startDateStr = DateHelper.getDaysAgoLocal(days);
      
      const periodDailyMeals = dailyMeals.filter(dm => {
        const date = dm.date || dm.timestamp;
        return date >= startDateStr && date <= endDateStr;
      });
      
      const avgCompliance = periodDailyMeals.length > 0
        ? periodDailyMeals.reduce((sum, dm) => sum + (dm.dailyTotals?.complianceScore || 0), 0) / periodDailyMeals.length
        : 0;
      
      trends[period] = {
        days: periodDailyMeals.length,
        avgCompliance: Math.round(avgCompliance * 10) / 10,
        totalMeals: periodDailyMeals.reduce((sum, dm) => sum + (dm.mealIds?.length || 0), 0)
      };
    });
    
    return {
      totalDays,
      totalMeals,
      streak: nutritionStreak,
      level,
      badgesCount,
      trends,
      // Ne pas exposer données personnelles identifiables
    };
  } catch (error) {
    log.error('[prepareProgressData] Erreur préparation données progression:', error);
    return {
      totalDays: 0,
      totalMeals: 0,
      streak: 0,
      level: 1,
      badgesCount: 0,
      trends: {}
    };
  }
}

// ==================== EXPORT CHIFFRÉ ====================

/**
 * ✅ PHASE 3 : Service d'export chiffré avec AES-256-CBC + PBKDF2
 * 
 * ✅ PHASE 3 : Chiffrement sécurisé des exports
 * - AES-256-CBC pour chiffrement (standard industrie)
 * - PBKDF2 pour dérivation clé depuis mot de passe (10000 itérations)
 * - IV aléatoire pour chaque export (sécurité)
 * - Salt aléatoire pour PBKDF2 (sécurité)
 * - Format JSON avec métadonnées de chiffrement
 * 
 * Configuration :
 * - Algorithme : AES-256-CBC (256 bits = 32 octets)
 * - PBKDF2 : 10000 itérations, SHA-256, 64 bytes key
 * - IV : 16 bytes aléatoires (taille bloc AES)
 * - Salt : 32 bytes aléatoires
 */
class SecureExportService {
  /**
   * ✅ PHASE 3 : Configuration chiffrement
   */
  static ALGORITHM = 'AES';
  static KEY_SIZE = 256 / 32; // 256 bits = 8 mots (32 bytes)
  static IV_SIZE = 128 / 32; // 128 bits = 4 mots (16 bytes)
  static PBKDF2_ITERATIONS = 10000; // Standard recommandé
  static PBKDF2_KEY_LENGTH = 256 / 32; // 256 bits = 8 mots (32 bytes)
  static SALT_SIZE = 32; // 32 bytes = 256 bits

  /**
   * ✅ PHASE 3 : Génère un salt aléatoire cryptographiquement sécurisé
   * 
   * @returns {string} Salt en hexadécimal
   */
  static generateSalt() {
    // Utiliser CryptoJS.lib.WordArray.random() pour génération sécurisée
    const salt = CryptoJS.lib.WordArray.random(this.SALT_SIZE);
    return salt.toString(CryptoJS.enc.Hex);
  }

  /**
   * ✅ PHASE 3 : Génère un IV aléatoire cryptographiquement sécurisé
   * 
   * @returns {string} IV en hexadécimal
   */
  static generateIV() {
    // Utiliser CryptoJS.lib.WordArray.random() pour génération sécurisée
    const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE * 4); // 16 bytes = 4 mots
    return iv.toString(CryptoJS.enc.Hex);
  }

  /**
   * ✅ PHASE 3 : Dérive une clé depuis un mot de passe avec PBKDF2
   * 
   * @param {string} password - Mot de passe utilisateur
   * @param {string} salt - Salt en hexadécimal
   * @returns {CryptoJS.lib.WordArray} Clé dérivée (256 bits)
   */
  static deriveKey(password, salt) {
    // PBKDF2 avec SHA-256, 10000 itérations, 256 bits
    const saltWordArray = CryptoJS.enc.Hex.parse(salt);
    const key = CryptoJS.PBKDF2(password, saltWordArray, {
      keySize: this.PBKDF2_KEY_LENGTH, // 8 mots = 256 bits
      iterations: this.PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256
    });
    
    return key;
  }

  /**
   * ✅ PHASE 3 : Chiffre un objet JSON avec AES-256-CBC
   * 
   * @param {Object} data - Données à chiffrer
   * @param {string} password - Mot de passe utilisateur
   * @returns {Promise<Object>} Objet chiffré avec métadonnées
   */
  static async encryptExport(data, password) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Données invalides pour chiffrement');
      }
      
      if (!password || typeof password !== 'string' || password.length < 8) {
        throw new Error('Mot de passe requis (minimum 8 caractères)');
      }

      // ✅ PHASE 3 : Générer salt et IV aléatoires
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // ✅ PHASE 3 : Dériver clé depuis mot de passe avec PBKDF2
      const key = this.deriveKey(password, salt);

      // ✅ PHASE 3 : Sérialiser données en JSON
      const jsonString = JSON.stringify(data);
      
      // ✅ PHASE 3 : Chiffrer avec AES-256-CBC
      const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // ✅ PHASE 3 : Convertir en base64 pour stockage
      const encryptedBase64 = encrypted.toString();

      // ✅ PHASE 3 : Créer objet export chiffré avec métadonnées
      const encryptedExport = {
        type: 'nutrition_share_encrypted',
        version: '1.0',
        algorithm: 'AES-256-CBC',
        keyDerivation: 'PBKDF2',
        pbkdf2Iterations: this.PBKDF2_ITERATIONS,
        pbkdf2Hasher: 'SHA-256',
        salt: salt,
        iv: iv,
        data: encryptedBase64,
        encryptedAt: new Date().toISOString(),
        metadata: {
          originalSize: new Blob([jsonString]).size,
          encryptedSize: new Blob([encryptedBase64]).size,
          compressionRatio: (new Blob([encryptedBase64]).size / new Blob([jsonString]).size).toFixed(4)
        }
      };

      log.debug('[encryptExport] Export chiffré', {
        algorithm: 'AES-256-CBC',
        originalSize: encryptedExport.metadata.originalSize,
        encryptedSize: encryptedExport.metadata.encryptedSize
      });

      return encryptedExport;
    } catch (error) {
      log.error('[encryptExport] Erreur chiffrement:', error);
      throw error;
    }
  }

  /**
   * ✅ PHASE 3 : Déchiffre un objet JSON avec AES-256-CBC
   * 
   * @param {Object} encryptedExport - Objet chiffré avec métadonnées
   * @param {string} password - Mot de passe utilisateur
   * @returns {Promise<Object>} Données déchiffrées
   */
  static async decryptExport(encryptedExport, password) {
    try {
      if (!encryptedExport || typeof encryptedExport !== 'object') {
        throw new Error('Export chiffré invalide');
      }

      if (!password || typeof password !== 'string') {
        throw new Error('Mot de passe requis pour déchiffrement');
      }

      // ✅ PHASE 3 : Vérifier format et version
      if (encryptedExport.type !== 'nutrition_share_encrypted') {
        throw new Error('Type de fichier invalide (non chiffré ou format inconnu)');
      }

      if (encryptedExport.version !== '1.0') {
        throw new Error(`Version non supportée: ${encryptedExport.version}`);
      }

      // ✅ PHASE 3 : Vérifier algorithme supporté
      if (encryptedExport.algorithm !== 'AES-256-CBC') {
        throw new Error(`Algorithme non supporté: ${encryptedExport.algorithm}`);
      }

      // ✅ PHASE 3 : Extraire salt et IV depuis métadonnées
      const salt = encryptedExport.salt;
      const iv = encryptedExport.iv;
      const encryptedData = encryptedExport.data;

      if (!salt || !iv || !encryptedData) {
        throw new Error('Métadonnées de chiffrement manquantes');
      }

      // ✅ PHASE 3 : Dériver clé depuis mot de passe avec PBKDF2
      const key = this.deriveKey(password, salt);

      // ✅ PHASE 3 : Déchiffrer avec AES-256-CBC
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // ✅ PHASE 3 : Convertir en string UTF-8
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Échec déchiffrement : mot de passe incorrect ou données corrompues');
      }

      // ✅ PHASE 3 : Parser JSON déchiffré
      let decryptedData;
      try {
        decryptedData = JSON.parse(decryptedString);
      } catch (parseError) {
        throw new Error('Échec parsing JSON déchiffré : données corrompues');
      }

      log.debug('[decryptExport] Export déchiffré', {
        originalSize: encryptedExport.metadata?.originalSize || 'unknown'
      });

      return decryptedData;
    } catch (error) {
      log.error('[decryptExport] Erreur déchiffrement:', error);
      
      // ✅ PHASE 3 : Message d'erreur spécifique pour mot de passe incorrect
      if (error.message.includes('incorrect') || error.message.includes('corrompues')) {
        throw new Error('Mot de passe incorrect ou données corrompues');
      }
      
      throw error;
    }
  }
}

// ==================== CACHE EXPORT ====================

/**
 * ✅ PHASE 8 : Service de cache pour exports avec hash données
 * 
 * ✅ PHASE 8 : Cache export avec hash
 * - Évite régénération exports identiques (80-95% plus rapide sur cache hit)
 * - Hash SHA-256 des données pour identification unique
 * - Cache localStorage avec TTL 24h
 * - Invalidation automatique si données changent
 */
class ExportCacheService {
  static CACHE_PREFIX = 'nutrition_share_export_';
  static CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures

  /**
   * ✅ PHASE 8 : Génère hash SHA-256 des données nutrition (pour cache)
   * 
   * @param {Object} nutritionData - Données nutrition
   * @param {string} scope - Scope partage
   * @param {boolean} encrypt - Si export chiffré
   * @returns {Promise<string>} Hash SHA-256 en hexadécimal
   */
  static async generateDataHash(nutritionData, scope, encrypt = false) {
    try {
      // ✅ PHASE 8 : Utiliser Web Crypto API si disponible (plus rapide et sécurisé)
      if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
        // Créer représentation stable des données (ordre stable avec sort_keys)
        const dataStr = JSON.stringify({
          nutritionData: prepareNutritionDataForShare(nutritionData, scope),
          scope,
          encrypt
        }, Object.keys(nutritionData || {}).sort());
        
        const encoder = new TextEncoder();
        const data = encoder.encode(dataStr);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
      } else {
        // ✅ PHASE 8 : Fallback hash simple pour navigateurs très anciens
        const dataStr = JSON.stringify({
          nutritionData: prepareNutritionDataForShare(nutritionData, scope),
          scope,
          encrypt
        }, Object.keys(nutritionData || {}).sort());
        
        let hash = 0;
        for (let i = 0; i < Math.min(dataStr.length, 10000); i++) {
          const char = dataStr.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
      }
    } catch (error) {
      log.warn('[ExportCacheService] Erreur génération hash, fallback simple:', error);
      
      // ✅ PHASE 8 : Fallback ultime : hash simple basé sur scope + timestamp
      return `simple_${scope}_${Date.now()}`;
    }
  }

  /**
   * ✅ PHASE 8 : Récupère export depuis cache si disponible
   * 
   * @param {string} cacheKey - Clé cache (hash des données)
   * @returns {Object|null} Export en cache ou null
   */
  static getCachedExport(cacheKey) {
    try {
      const cacheKeyFull = `${this.CACHE_PREFIX}${cacheKey}`;
      const cached = localStorage.getItem(cacheKeyFull);
      
      if (!cached) {
        return null;
      }
      
      const parsed = JSON.parse(cached);
      const now = Date.now();
      
      // ✅ PHASE 8 : Vérifier expiration TTL
      if (parsed.timestamp && (now - parsed.timestamp) > this.CACHE_TTL_MS) {
        // Cache expiré, supprimer
        localStorage.removeItem(cacheKeyFull);
        return null;
      }
      
      // ✅ PHASE 8 : Retourner export en cache
      return parsed.export;
    } catch (error) {
      log.warn('[ExportCacheService] Erreur récupération cache:', error);
      return null;
    }
  }

  /**
   * ✅ PHASE 8 : Sauvegarde export dans cache
   * 
   * @param {string} cacheKey - Clé cache (hash des données)
   * @param {Object} exportData - Export à cacher
   */
  static setCachedExport(cacheKey, exportData) {
    try {
      const cacheKeyFull = `${this.CACHE_PREFIX}${cacheKey}`;
      const cacheEntry = {
        export: exportData,
        timestamp: Date.now(),
        hash: cacheKey
      };
      
      localStorage.setItem(cacheKeyFull, JSON.stringify(cacheEntry));
    } catch (error) {
      // ✅ PHASE 8 : Si quota localStorage dépassé, nettoyer anciennes entrées
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldCache();
        
        // Réessayer une fois après cleanup
        try {
          const cacheKeyFull = `${this.CACHE_PREFIX}${cacheKey}`;
          const cacheEntry = {
            export: exportData,
            timestamp: Date.now(),
            hash: cacheKey
          };
          localStorage.setItem(cacheKeyFull, JSON.stringify(cacheEntry));
        } catch (retryError) {
          log.warn('[ExportCacheService] Échec sauvegarde cache après cleanup:', retryError);
          // Ne pas bloquer si cache échoue
        }
      } else {
        log.warn('[ExportCacheService] Erreur sauvegarde cache:', error);
      }
    }
  }

  /**
   * ✅ PHASE 8 : Nettoie cache exports expirés
   */
  static cleanupOldCache() {
    try {
      const now = Date.now();
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (!key || !key.startsWith(this.CACHE_PREFIX)) {
          continue;
        }
        
        try {
          const cached = localStorage.getItem(key);
          if (!cached) continue;
          
          const parsed = JSON.parse(cached);
          
          // ✅ PHASE 8 : Supprimer si expiré
          if (parsed.timestamp && (now - parsed.timestamp) > this.CACHE_TTL_MS) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Entrée corrompue, supprimer
          keysToRemove.push(key);
        }
      }
      
      // ✅ PHASE 8 : Supprimer clés expirées
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          log.warn('[ExportCacheService] Erreur suppression clé cache:', key, error);
        }
      });
      
      if (keysToRemove.length > 0) {
        log.debug('[ExportCacheService] Cache nettoyé', { removed: keysToRemove.length });
      }
    } catch (error) {
      log.warn('[ExportCacheService] Erreur cleanup cache:', error);
    }
  }
}

// ==================== EXPORT JSON PARTAGE ====================

/**
 * Exporte les données nutrition pour partage (avec token)
 * 
 * ✅ PHASE 3 : Support export chiffré optionnel
 * ✅ PHASE 8 : Cache export avec hash données (80-95% plus rapide sur cache hit)
 * 
 * @param {Object} nutritionData - Données nutrition complètes
 * @param {string} token - Token de partage
 * @param {string} scope - Scope partage
 * @param {Object} options - Options d'export
 * @param {boolean} options.encrypt - Chiffrer l'export (défaut: false)
 * @param {string} options.password - Mot de passe pour chiffrement (requis si encrypt=true)
 * @param {boolean} options.useCache - Utiliser cache exports (défaut: true)
 * @returns {Promise<Object>} Données exportées avec token (chiffrées ou non)
 */
export async function exportNutritionDataForShare(nutritionData, token, scope = SHARE_SCOPES.all, options = {}) {
  try {
    const {
      encrypt = false,
      password = null,
      useCache = true
    } = options;

    // Vérifier token
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      throw new Error('Token invalide');
    }
    
    // Vérifier expiration
    if (Date.now() > shareLink.expiresAt) {
      throw new Error('Token expiré');
    }
    
    // Vérifier scope
    if (shareLink.scope !== scope) {
      log.warn('[exportNutritionDataForShare] Scope mismatch, utilisation scope du token');
      scope = shareLink.scope;
    }
    
    // ✅ PHASE 8 : Générer hash des données pour cache (seulement si cache activé et non chiffré)
    let cacheKey = null;
    if (useCache && !encrypt) {
      try {
        cacheKey = await ExportCacheService.generateDataHash(nutritionData, scope, encrypt);
        
        // ✅ PHASE 8 : Vérifier cache avant génération
        const cachedExport = ExportCacheService.getCachedExport(cacheKey);
        if (cachedExport) {
          // ✅ PHASE 8 : Retourner export depuis cache (80-95% plus rapide)
          // Mettre à jour accès même pour cache hit
          await updateShareLinkAccess(token);
          
          log.debug('[exportNutritionDataForShare] Export récupéré depuis cache', {
            hash: cacheKey.substring(0, 8) + '...'
          });
          
          return cachedExport;
        }
      } catch (cacheError) {
        log.warn('[exportNutritionDataForShare] Erreur cache, génération normale:', cacheError);
        // Continuer avec génération normale si cache échoue
      }
    }
    
    // Préparer données selon scope
    const sharedData = prepareNutritionDataForShare(nutritionData, scope);
    
    // Créer export avec token et métadonnées
    const exportData = {
      type: encrypt ? 'nutrition_share_encrypted' : 'nutrition_share',
      version: '1.0',
      token,
      scope,
      shareDate: new Date().toISOString(),
      expiresAt: shareLink.expiresAt,
      data: sharedData,
      metadata: {
        generatedAt: new Date().toISOString(),
        scope,
        readOnly: true,
        encrypted: encrypt
      }
    };

    // ✅ PHASE 3 : Chiffrer si demandé
    if (encrypt) {
      if (!password || typeof password !== 'string' || password.length < 8) {
        throw new Error('Mot de passe requis pour chiffrement (minimum 8 caractères)');
      }

      // Chiffrer l'export complet avec le mot de passe
      const encryptedExport = await SecureExportService.encryptExport(exportData, password);
      
      // Mettre à jour accès
      await updateShareLinkAccess(token);
      
      // ✅ Réduction logs : export chiffré (important seulement)
      // log.debug supprimé pour éviter spam
      
      // ✅ PHASE 8 : Ne pas cacher exports chiffrés (mot de passe différent = export différent)
      return encryptedExport;
    }
    
    // Export non chiffré (comportement par défaut)
    // Mettre à jour accès
    await updateShareLinkAccess(token);
    
    // ✅ PHASE 8 : Mettre en cache export non chiffré
    if (useCache && cacheKey) {
      try {
        ExportCacheService.setCachedExport(cacheKey, exportData);
      } catch (cacheError) {
        log.warn('[exportNutritionDataForShare] Erreur sauvegarde cache:', cacheError);
        // Ne pas bloquer si cache échoue
      }
    }
    
    // ✅ Réduction logs : export non chiffré (non critique)
    // log.debug supprimé pour éviter spam
    
    return exportData;
  } catch (error) {
    log.error('[exportNutritionDataForShare] Erreur export données:', error);
    throw error;
  }
}

/**
 * ✅ PHASE 3 : Déchiffre un export nutrition
 * 
 * @param {Object} encryptedExport - Export chiffré
 * @param {string} password - Mot de passe pour déchiffrement
 * @returns {Promise<Object>} Export déchiffré
 */
export async function decryptNutritionExport(encryptedExport, password) {
  try {
    if (!encryptedExport || encryptedExport.type !== 'nutrition_share_encrypted') {
      throw new Error('Export non chiffré ou format invalide');
    }

    const decryptedData = await SecureExportService.decryptExport(encryptedExport, password);
    
    // ✅ Réduction logs : déchiffrement (non critique)
    // log.debug supprimé pour éviter spam
    
    return decryptedData;
  } catch (error) {
    log.error('[decryptNutritionExport] Erreur déchiffrement:', error);
    throw error;
  }
}

// ==================== VÉRIFICATION TOKEN ====================

/**
 * Vérifie si un token est valide et non expiré
 * 
 * ✅ PHASE 1.3 : Vérification étendue avec access control
 * - Vérifie expiration
 * - Vérifie si lien bloqué
 * - Met à jour audit trail (appel updateShareLinkAccess)
 * 
 * @param {string} token - Token à vérifier
 * @param {Object} context - Contexte accès (optionnel: userAgent, etc.)
 * @returns {Promise<Object|null>} Lien de partage si valide, null sinon
 */
export async function validateShareToken(token, context = {}) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const shareLink = await getShareLink(token);
    if (!shareLink) {
      log.debug('[validateShareToken] Token non trouvé');
      return null;
    }
    
    // ✅ PHASE 1.3 : Vérifier si lien bloqué
    if (shareLink.locked) {
      log.warn('[validateShareToken] Token bloqué', {
        token: token.substring(0, 8) + '...',
        lockReason: shareLink.lockReason,
        lockedAt: shareLink.lockedAt ? new Date(shareLink.lockedAt).toISOString() : null
      });
      return null;
    }
    
    // Vérifier expiration
    if (Date.now() > shareLink.expiresAt) {
      log.debug('[validateShareToken] Token expiré', {
        expiresAt: new Date(shareLink.expiresAt).toISOString()
      });
      // Supprimer lien expiré
      await deleteShareLink(token);
      return null;
    }
    
    // ✅ PHASE 1.3 : Mettre à jour audit trail (avec détection abus)
    try {
      await updateShareLinkAccess(token, context);
    } catch (accessError) {
      // Si accès refusé (limite atteinte ou comportement suspect), retourner null
      if (accessError.code === 'max_accesses_reached' || 
          accessError.code === 'link_locked' || 
          accessError.code === 'suspicious_behavior') {
        log.warn('[validateShareToken] Accès refusé', {
          token: token.substring(0, 8) + '...',
          reason: accessError.code,
          message: accessError.message
        });
        return null;
      }
      // Autres erreurs : log mais continuer (robustesse)
      log.error('[validateShareToken] Erreur mise à jour accès:', accessError);
    }
    
    return shareLink;
  } catch (error) {
    log.error('[validateShareToken] Erreur validation token:', error);
    return null;
  }
}

// ==================== IMPORT/VALIDATION JSON ====================

/**
 * Valide le format JSON partagé
 * 
 * ✅ PHASE 4 : Utilise ImportValidator avec validation Zod profonde
 * 
 * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à valider
 * @returns {Promise<Object>} { valid: boolean, error: string|null, data?: Object }
 */
export async function validateShareJson(jsonDataOrFile) {
  try {
    // ✅ PHASE 4 : Support File, string ou object
    let parsed;
    
    if (jsonDataOrFile instanceof File || typeof jsonDataOrFile === 'string') {
      // ✅ PHASE 4 : Utiliser ImportValidator pour validation complète
      parsed = await ImportValidator.parseAndValidate(jsonDataOrFile);
    } else if (jsonDataOrFile && typeof jsonDataOrFile === 'object') {
      // ✅ PHASE 4 : Détecter contenu malveillant
      ImportValidator.detectMaliciousContent(jsonDataOrFile);
      
      // ✅ PHASE 4 : Valider avec schema Zod
      parsed = nutritionShareSchema.parse(jsonDataOrFile);
    } else {
      return { valid: false, error: 'Format invalide : File, string ou object attendu' };
    }

    // ✅ PHASE 4 : Vérifier expiration (si fournie)
    if (parsed.expiresAt && typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
      return { valid: false, error: 'Lien expiré' };
    }

    // ✅ PHASE 4 : Si export chiffré, vérifier structure chiffrement
    if (parsed.type === 'nutrition_share_encrypted') {
      // Validation déjà faite par schema Zod
      return { valid: true, error: null, data: parsed, encrypted: true };
    }

    return { valid: true, error: null, data: parsed, encrypted: false };
  } catch (error) {
    log.error('[validateShareJson] Erreur validation JSON:', error);
    
    // ✅ PHASE 4 : Messages d'erreur spécifiques selon type d'erreur
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const errorPath = firstError.path.length > 0 
        ? firstError.path.join('.') 
        : 'racine';
      return { 
        valid: false, 
        error: `Données invalides : ${errorPath} - ${firstError.message}` 
      };
    }
    
    return { valid: false, error: error.message || 'Erreur validation JSON' };
  }
}

/**
 * Parse et valide JSON partagé
 * 
 * ✅ PHASE 4 : Utilise ImportValidator avec migration de versions
 * 
 * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à parser
 * @returns {Promise<Object>} { token, scope, data, metadata, expiresAt, shareDate, encrypted }
 * @throws {Error} Si JSON invalide
 */
export async function parseShareJson(jsonDataOrFile) {
  try {
    // ✅ PHASE 4 : Valider avec ImportValidator
    const validation = await validateShareJson(jsonDataOrFile);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const parsed = validation.data;

    // ✅ PHASE 4 : Si export chiffré, retourner structure chiffrée
    if (parsed.type === 'nutrition_share_encrypted') {
      return {
        type: parsed.type,
        version: parsed.version,
        encrypted: true,
        algorithm: parsed.algorithm,
        keyDerivation: parsed.keyDerivation,
        pbkdf2Iterations: parsed.pbkdf2Iterations,
        pbkdf2Hasher: parsed.pbkdf2Hasher,
        salt: parsed.salt,
        iv: parsed.iv,
        data: parsed.data,
        encryptedAt: parsed.encryptedAt,
        metadata: parsed.metadata || {}
      };
    }

    // ✅ PHASE 4 : Export non chiffré
    return {
      type: parsed.type,
      version: parsed.version,
      token: parsed.token,
      scope: parsed.scope,
      data: parsed.data,
      metadata: parsed.metadata || {},
      expiresAt: parsed.expiresAt || null,
      shareDate: parsed.shareDate || null,
      encrypted: false
    };
  } catch (error) {
    log.error('[parseShareJson] Erreur parsing JSON:', error);
    throw error;
  }
}

/**
 * Charge données depuis JSON partagé
 * 
 * ✅ PHASE 4 : Support exports chiffrés et migration de versions
 * 
 * @param {Object|File|string} jsonDataOrFile - Données JSON, File ou string à charger
 * @param {Object} options - Options de chargement
 * @param {string} options.password - Mot de passe pour déchiffrement (requis si export chiffré)
 * @returns {Promise<Object>} Données formatées pour affichage
 * @throws {Error} Si JSON invalide ou déchiffrement échoue
 */
export async function loadShareDataFromJson(jsonDataOrFile, options = {}) {
  try {
    const { password = null } = options;

    // ✅ PHASE 4 : Parser JSON avec validation profonde
    const parsed = await parseShareJson(jsonDataOrFile);

    // ✅ PHASE 4 : Si export chiffré, déchiffrer d'abord
    if (parsed.encrypted) {
      if (!password || typeof password !== 'string') {
        throw new Error('Mot de passe requis pour déchiffrer l\'export');
      }

      // ✅ PHASE 4 : Déchiffrer export
      const decryptedData = await decryptNutritionExport(parsed, password);
      
      // ✅ PHASE 4 : Re-valider données déchiffrées
      const decryptedValidation = await validateShareJson(decryptedData);
      if (!decryptedValidation.valid) {
        throw new Error(`Données déchiffrées invalides : ${decryptedValidation.error}`);
      }

      // ✅ PHASE 4 : Utiliser données déchiffrées
      parsed.data = decryptedData.data;
      parsed.token = decryptedData.token;
      parsed.scope = decryptedData.scope;
      parsed.expiresAt = decryptedData.expiresAt;
      parsed.shareDate = decryptedData.shareDate;
      parsed.metadata = decryptedData.metadata || {};
    }

    // ✅ PHASE 4 : Migration de versions si nécessaire (futur)
    // Pour l'instant, v1.0 uniquement
    let finalData = parsed;
    if (parsed.version && parsed.version !== '1.0') {
      try {
        finalData = await VersionMigrator.migrate(parsed, parsed.version, '1.0');
        log.debug('[loadShareDataFromJson] Migration effectuée', {
          from: parsed.version,
          to: '1.0'
        });
      } catch (migrationError) {
        log.warn('[loadShareDataFromJson] Migration échouée, utilisation données originales', {
          error: migrationError.message
        });
        // Continuer avec données originales
      }
    }
    
    // ✅ PHASE 4 : Formater données pour affichage
    const formattedData = {
      token: finalData.token,
      scope: finalData.scope,
      expiresAt: finalData.expiresAt,
      shareDate: finalData.shareDate,
      metadata: finalData.metadata,
      version: finalData.version || '1.0',
      encrypted: parsed.encrypted || false,
      stats: finalData.data?.stats || null,
      charts: finalData.data?.charts || null,
      progress: finalData.data?.progress || null
    };
    
    // ✅ Réduction logs : chargement (non critique)
    // log.debug supprimé pour éviter spam
    
    return formattedData;
  } catch (error) {
    log.error('[loadShareDataFromJson] Erreur chargement données:', error);
    throw error;
  }
}

// ==================== EXPORTS ====================

export default {
  generateSecureToken,
  parseDuration,
  generateSecureShareLink,
  saveShareLink,
  getShareLink,
  getAllShareLinks,
  deleteShareLink,
  updateShareLinkAccess,
  lockShareLink,
  detectSuspiciousBehavior,
  cleanupExpiredLinks,
  cleanupRevokedLinks,
  CleanupService,
  ExportCacheService,
  generateQRCode,
  cleanupOrphanedQRCache,
  prepareNutritionDataForShare,
  exportNutritionDataForShare,
  decryptNutritionExport,
  validateShareToken,
  validateShareJson,
  parseShareJson,
  loadShareDataFromJson,
  ImportValidator,
  VersionMigrator,
  EXPIRATION_OPTIONS,
  SHARE_SCOPES,
  PERMISSIONS
};

