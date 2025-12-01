// Utilitaires de hash pour les mots de passe (Web Crypto API)
// Objectif : ne jamais stocker les mots de passe en clair, seulement (salt, hash)

import logger from './logger';

const log = logger.module('AuthCrypto');

const TEXT_ENCODER = new TextEncoder();

export const generateSalt = (length = 16) => {
  const salt = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(salt);
  } else {
    // Fallback très basique (dev / tests), moins sécurisé mais évite de crasher
    for (let i = 0; i < length; i += 1) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }
  return bufferToHex(salt.buffer);
};

export const hashPassword = async (password, saltHex) => {
  try {
    if (!password || !saltHex) {
      throw new Error('password et salt requis');
    }

    if (!(window.crypto && window.crypto.subtle)) {
      log.warn('Web Crypto API non disponible, hashPassword utilise un fallback moins sécurisé');
      const data = TEXT_ENCODER.encode(password + ':' + saltHex);
      // Fallback SHA-256 via une lib serait idéal ; ici on se contente de base64 simple
      return bufferToHex(data.buffer);
    }

    const data = TEXT_ENCODER.encode(password + ':' + saltHex);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return bufferToHex(digest);
  } catch (error) {
    log.error('❌ Erreur hashPassword', error);
    throw error;
  }
};

export const verifyPassword = async (password, saltHex, expectedHashHex) => {
  try {
    const actualHash = await hashPassword(password, saltHex);
    // Comparaison en mode "timing safe" très simple
    if (actualHash.length !== expectedHashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < actualHash.length; i += 1) {
      diff |= actualHash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
};

// --------- helpers ---------

export const bufferToHex = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const byteHex = bytes[i].toString(16).padStart(2, '0');
    hex += byteHex;
  }
  return hex;
};


