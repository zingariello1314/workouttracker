/**
 * shareLinksCRUD.js
 * 
 * ✅ PHASE 12.1 : CRUD complet pour Share Links (IndexedDB)
 * 
 * Fonctions pour :
 * - saveShareLink : Sauvegarder un lien de partage
 * - getShareLink : Récupérer un lien par token
 * - getAllShareLinks : Récupérer tous les liens actifs
 * - deleteShareLink : Supprimer un lien
 * - lockShareLink : Bloquer un lien (sécurité)
 * - updateShareLinkAccess : Mettre à jour statistiques accès (avec transaction fusionnée)
 * - detectSuspiciousBehavior : Détecter comportements suspects
 * - cleanupExpiredLinks : Nettoyer liens expirés
 * - cleanupRevokedLinks : Nettoyer liens révoqués
 * 
 * @module services/nutrition/sharing/shareLinks/shareLinksCRUD
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 7
 */

import { openNutritionDB, STORE_SHARE_LINKS } from '../../../../hooks/nutritionDataUtils';
import {
  MAX_ACCESSES_PER_TOKEN,
  SUSPICIOUS_ACCESS_THRESHOLD,
  BURST_WINDOW_MS,
  BURST_THRESHOLD,
  MIN_ACCESS_INTERVAL_MS
} from '../constants';
import logger from '../../../../utils/logger';

const log = logger.module('shareLinksCRUD');

/**
 * Sauvegarde un lien de partage dans IndexedDB
 * 
 * @param {Object} shareLink - Lien de partage à sauvegarder
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
export function detectSuspiciousBehavior(shareLink) {
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
        log.debug('[cleanupExpiredLinks] Liens expirés nettoyés (fallback)', {
          count: expiredLinks.length
        });
      }
      
      await tx.complete;
      return expiredLinks.length;
    }
    
    // ✅ PHASE 7 : Utiliser index expiresAt si disponible (optimisé)
    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const request = index.getAll(range);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const expiredLinks = request.result || [];
        
        // ✅ PHASE 7 : Vérifier que expiredLinks est un tableau
        if (!Array.isArray(expiredLinks)) {
          log.warn('[cleanupExpiredLinks] expiredLinks n\'est pas un tableau:', typeof expiredLinks);
          resolve(0);
          return;
        }
        
        if (expiredLinks.length === 0) {
          resolve(0);
          return;
        }
        
        try {
          // Supprimer liens expirés
          const deletePromises = expiredLinks.map(link => store.delete(link.token));
          await Promise.all(deletePromises);
          
          if (expiredLinks.length > 0) {
            log.debug('[cleanupExpiredLinks] Liens expirés nettoyés', {
              count: expiredLinks.length
            });
          }
          
          await tx.complete;
          resolve(expiredLinks.length);
        } catch (error) {
          log.error('[cleanupExpiredLinks] Erreur suppression liens expirés:', error);
          reject(error);
        }
      };
      
      request.onerror = () => {
        log.error('[cleanupExpiredLinks] Erreur récupération liens expirés:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('[cleanupExpiredLinks] Erreur nettoyage liens expirés:', error);
    return 0;
  }
}

/**
 * ✅ PHASE 7 : Nettoie les liens révoqués (locked = true)
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
    
    // ✅ PHASE 7 : Fallback si index locked manquant (booléen non supporté partout)
    try {
      const index = store.index('locked');
      const range = IDBKeyRange.only(true);
      const request = index.getAll(range);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
          const revokedLinks = request.result || [];
          
          // ✅ PHASE 7 : Vérifier que revokedLinks est un tableau
          if (!Array.isArray(revokedLinks)) {
            log.warn('[cleanupRevokedLinks] revokedLinks n\'est pas un tableau:', typeof revokedLinks);
            resolve(0);
            return;
          }
          
          // Filtrer liens révoqués anciens (> 30 jours)
          const now = Date.now();
          const oldRevokedLinks = revokedLinks.filter(link => {
            const lockedAt = link.lockedAt || link.createdAt;
            const daysSinceLocked = (now - lockedAt) / (24 * 60 * 60 * 1000);
            return daysSinceLocked > 30; // Supprimer après 30 jours
          });
          
          if (oldRevokedLinks.length === 0) {
            resolve(0);
            return;
          }
          
          try {
            // Supprimer liens révoqués anciens
            const deletePromises = oldRevokedLinks.map(link => store.delete(link.token));
            await Promise.all(deletePromises);
            
            if (oldRevokedLinks.length > 0) {
              log.debug('[cleanupRevokedLinks] Liens révoqués nettoyés', {
                count: oldRevokedLinks.length
              });
            }
            
            await tx.complete;
            resolve(oldRevokedLinks.length);
          } catch (error) {
            log.error('[cleanupRevokedLinks] Erreur suppression liens révoqués:', error);
            reject(error);
          }
        };
        
        request.onerror = () => {
          log.error('[cleanupRevokedLinks] Erreur récupération liens révoqués:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      // Index manquant : utiliser getAll + filter (fallback)
      log.warn('[cleanupRevokedLinks] Index locked manquant, utilisation fallback');
      const allLinks = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => {
          log.error('[cleanupRevokedLinks] Erreur getAll (fallback):', request.error);
          reject(request.error);
        };
      });
      
      // ✅ PHASE 7 : Vérifier que allLinks est un tableau
      if (!Array.isArray(allLinks)) {
        log.warn('[cleanupRevokedLinks] allLinks n\'est pas un tableau:', typeof allLinks);
        return 0;
      }
      
      const now = Date.now();
      
      const oldRevokedLinks = allLinks.filter(link => {
        if (!link.locked) return false;
        const lockedAt = link.lockedAt || link.createdAt;
        const daysSinceLocked = (now - lockedAt) / (24 * 60 * 60 * 1000);
        return daysSinceLocked > 30; // Supprimer après 30 jours
      });
      
      if (oldRevokedLinks.length === 0) {
        return 0;
      }
      
      // Supprimer liens révoqués anciens
      const deletePromises = oldRevokedLinks.map(link => store.delete(link.token));
      await Promise.all(deletePromises);
      
      if (oldRevokedLinks.length > 0) {
        log.debug('[cleanupRevokedLinks] Liens révoqués nettoyés (fallback)', {
          count: oldRevokedLinks.length
        });
      }
      
      await tx.complete;
      return oldRevokedLinks.length;
    }
  } catch (error) {
    log.error('[cleanupRevokedLinks] Erreur nettoyage liens révoqués:', error);
    return 0;
  }
}


