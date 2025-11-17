/**
 * importValidator.js
 * 
 * ✅ PHASE 12.1 : ImportValidator avec validation profonde et détection malveillant
 * 
 * ✅ PHASE 4 : Validation robuste des imports
 * - Validation fichier (taille, extension)
 * - Validation JSON parsing
 * - Validation schema Zod profonde
 * - Détection contenu malveillant (XSS, injection, etc.)
 * - Support migration de versions
 * 
 * @module services/nutrition/sharing/validators/importValidator
 * @see ../../../../../docs/nutrition/PLAN_SPLIT_NUTRITION_SHARING.md - Étape 2
 */

import { z } from 'zod';
import { nutritionShareSchema } from '../schemas';
import logger from '../../../../utils/logger';

const log = logger.module('importValidator');

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
export class ImportValidator {
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


