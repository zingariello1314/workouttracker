/**
 * Service pour récupérer le prix de l'or
 * Utilise Fixer API avec cache
 */

import { getApiKey } from '../../config/apiKeys';
import logger from '../../utils/logger';

const log = logger.module('orPriceService');

class OrPriceService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60 * 60 * 1000; // 1h
  }

  async getCurrentPrice() {
    const cached = this.cache.get('current');
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      log.debug('Returning cached gold price');
      return cached.price;
    }

    try {
      const apiKey = getApiKey('FIXER');
      if (!apiKey) {
        log.debug('FIXER API key not found, using default price (65€/g)');
        return 65; // Prix par défaut en €/g
      }

      // Fixer API pour prix or (XAU = code or)
      // Note: Fixer free tier ne supporte pas XAU, utiliser alternative
      // Pour l'instant, utiliser prix fixe avec possibilité d'API alternative
      const response = await fetch(
        `https://api.fixer.io/latest?access_key=${apiKey}&base=EUR`
      );
      
      if (!response.ok) {
        throw new Error(`Fixer API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Fixer free tier ne supporte pas XAU directement
      // Utiliser prix approximatif basé sur USD/EUR si disponible
      // Pour production, utiliser API spécialisée (ex: metals-api.com)
      // Prix par défaut : ~65€/g (approximation)
      const prixParGramme = 65; // Prix approximatif, à remplacer par API métaux
      
      this.cache.set('current', { price: prixParGramme, timestamp: Date.now() });
      log.debug(`Gold price fetched: ${prixParGramme.toFixed(2)}€/g`);
      
      return prixParGramme;
    } catch (error) {
      log.error('Error fetching gold price:', error);
      // Fallback : dernière valeur cache ou prix par défaut
      return cached?.price || 65; // Prix par défaut en €/g
    }
  }

  async getHistoricalPrice(date) {
    // Pour l'instant, utiliser cache ou prix actuel
    // TODO: Implémenter endpoint historique si disponible
    return this.getCurrentPrice();
  }

  clearCache() {
    this.cache.clear();
  }
}

export const orPriceService = new OrPriceService();

