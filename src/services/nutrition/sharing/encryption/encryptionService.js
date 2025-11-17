/**
 * encryptionService.js
 * 
 * ✅ PHASE 12.1 : Service d'export chiffré avec AES-256-CBC + PBKDF2
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
 * 
 * @module services/nutrition/sharing/encryption/encryptionService
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 6
 */

import CryptoJS from 'crypto-js';
import logger from '../../../../utils/logger';

const log = logger.module('encryptionService');

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
export class SecureExportService {
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


