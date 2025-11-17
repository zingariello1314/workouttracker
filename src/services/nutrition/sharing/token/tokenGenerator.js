/**
 * tokenGenerator.js
 * 
 * ✅ PHASE 12.1 : Génération de tokens sécurisés cryptographiquement
 * 
 * ✅ PHASE 1.1 : Renforcement sécurité token
 * - Utilise uniquement Web Crypto API (pas de fallback non sécurisé)
 * - Vérifie collision avant retour
 * - Ajoute préfixe pour traçabilité
 * - Retry automatique en cas de collision (probabilité très faible)
 * 
 * @module services/nutrition/sharing/token/tokenGenerator
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 8
 */

import { getShareLink } from '../shareLinks';
import { EXPIRATION_OPTIONS } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('tokenGenerator');

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


