/**
 * Système de sanitization pour le module Apprentissage
 * Protection contre XSS et injection de code
 */

import DOMPurify from 'dompurify';

/**
 * Configuration DOMPurify pour notre cas d'usage
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [], // Pas de HTML autorisé par défaut
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitizer une chaîne de caractères (supprime HTML/JS)
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Nettoyer avec DOMPurify
  const cleaned = DOMPurify.sanitize(input, PURIFY_CONFIG);
  
  // Échapper les caractères spéciaux restants
  return cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizer un objet récursivement
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizer la clé aussi
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitizer le nom d'une matière
 */
export const sanitizeSubjectName = (name) => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return sanitizeString(name.trim());
};

/**
 * Sanitizer le résumé d'une matière
 */
export const sanitizeSummary = (summary) => {
  if (!summary || typeof summary !== 'string') {
    return '';
  }
  
  return sanitizeString(summary.trim());
};

/**
 * Sanitizer un nom de fichier
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  
  // Nettoyer le nom de fichier (supprimer caractères dangereux)
  const cleaned = sanitizeString(fileName);
  
  // Supprimer les caractères de chemin potentiellement dangereux
  return cleaned.replace(/[<>:"|?*\x00-\x1f]/g, '');
};

/**
 * Sanitizer les données d'une session
 */
export const sanitizeSession = (session) => {
  if (!session || typeof session !== 'object') {
    return session;
  }

  return {
    ...session,
    subject: sanitizeString(session.subject || ''),
    // Les autres champs numériques ne nécessitent pas de sanitization
  };
};

/**
 * Sanitizer les données d'une matière complète
 */
export const sanitizeSubject = (subject) => {
  if (!subject || typeof subject !== 'object') {
    return subject;
  }

  return {
    ...subject,
    name: sanitizeSubjectName(subject.name),
    summary: sanitizeSummary(subject.summary),
    files: (subject.files || []).map((file) => ({
      ...file,
      name: sanitizeFileName(file.name),
    })),
  };
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeSubjectName,
  sanitizeSummary,
  sanitizeFileName,
  sanitizeSession,
  sanitizeSubject,
};

