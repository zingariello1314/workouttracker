/**
 * Service News Complet - Module Actualités Indépendant
 * 
 * Gère plusieurs sources d'actualités avec fallback intelligent :
 * - NewsAPI.org (France + général)
 * - Guardian API (monde, fallback)
 * - MediaStack (alternative)
 * - NewsData.io (alternative)
 * - Finnhub (financier)
 * - Reddit (communautaire)
 * 
 * @module services/news/newsService
 */

import { getApiKey, hasApiKey } from '../../config/apiKeys';
import { TokenBucket } from '../../utils/tokenBucket';
import { LRUCache } from '../../utils/lruCache';
import logger from '../../utils/logger';

const log = logger.module('newsService');

// ==================== CONFIGURATION ====================

/**
 * Configuration des quotas par API
 */
const QUOTA_CONFIG = {
  NEWSAPI: {
    requestsPerDay: 100,
    requestsPerMinute: 1 // Conservateur pour éviter dépassement
  },
  GUARDIAN: {
    requestsPerDay: 5000,
    requestsPerMinute: 10
  },
  MEDIASTACK: {
    requestsPerMonth: 1000,
    requestsPerMinute: 1
  },
  NEWSDATA: {
    requestsPerDay: 200,
    requestsPerMinute: 2
  },
  FINNHUB: {
    requestsPerMinute: 60
  },
  REDDIT: {
    requestsPerMinute: 60
  }
};

/**
 * TTL du cache selon le type de données
 */
const CACHE_TTL = {
  HEADLINES: 15 * 60 * 1000,      // 15 min (actualités chaudes)
  SEARCH: 30 * 60 * 1000,         // 30 min (recherches)
  FINANCIAL: 5 * 60 * 1000,       // 5 min (financier)
  REDDIT: 10 * 60 * 1000          // 10 min (communautaire)
};

// ==================== RATE LIMITING ====================

/**
 * Token buckets pour rate limiting
 */
const tokenBuckets = {
  NEWSAPI: new TokenBucket(1, 60000),      // 1 req/min (conservateur)
  GUARDIAN: new TokenBucket(10, 60000),    // 10 req/min
  MEDIASTACK: new TokenBucket(1, 60000),  // 1 req/min
  NEWSDATA: new TokenBucket(2, 60000),    // 2 req/min
  FINNHUB: new TokenBucket(60, 60000),    // 60 req/min
  REDDIT: new TokenBucket(60, 60000)      // 60 req/min
};

// ==================== CACHE ====================

/**
 * Cache mémoire pour actualités
 */
const memoryCache = new LRUCache(100); // 100 articles en cache

// ==================== CATÉGORIES ====================

/**
 * Catégories supportées
 */
export const CATEGORIES = {
  'tout': 'Toutes les actualités',
  'france': 'France',
  'monde': 'Monde',
  'bourse': 'Bourse',
  'crypto': 'Cryptomonnaies',
  'economie': 'Économie',
  'tech': 'Technologie',
  'sport': 'Sport',
  'culture': 'Culture',
  'politique': 'Politique',
  'sante': 'Santé',
  'environnement': 'Environnement'
};

/**
 * Mapping NewsAPI categories
 */
const NEWSAPI_CATEGORIES = {
  'france': { country: 'fr', category: null },
  'bourse': { country: null, category: 'business' },
  'tech': { country: null, category: 'technology' },
  'sport': { country: null, category: 'sports' },
  'sante': { country: null, category: 'health' },
  'monde': { country: null, category: 'general' }
};

// ==================== NEWSAPI.ORG ====================

/**
 * Récupère les actualités depuis NewsAPI.org
 */
async function fetchNewsAPI(options = {}) {
  const { category = 'tout', country = null, query = null, page = 1, pageSize = 20 } = options;
  
  if (!hasApiKey('NEWSAPI')) {
    throw new Error('NewsAPI key not configured');
  }
  
  const apiKey = getApiKey('NEWSAPI');
  let url;
  
  if (query) {
    // Recherche
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=fr&sortBy=publishedAt&page=${page}&pageSize=${pageSize}&apiKey=${apiKey}`;
  } else {
    // Top headlines
    const params = new URLSearchParams({
      apiKey,
      page: page.toString(),
      pageSize: pageSize.toString(),
      language: 'fr'
    });
    
    if (category === 'france') {
      params.append('country', 'fr');
    } else if (category in NEWSAPI_CATEGORIES) {
      const config = NEWSAPI_CATEGORIES[category];
      if (config.country) params.append('country', config.country);
      if (config.category) params.append('category', config.category);
    }
    
    url = `https://newsapi.org/v2/top-headlines?${params.toString()}`;
  }
  
  log.debug(`NewsAPI URL: ${url.replace(apiKey, '***')}`);
  
  await tokenBuckets.NEWSAPI.consume();
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    log.error(`NewsAPI HTTP error ${response.status}:`, errorText);
    if (response.status === 429) {
      throw new Error('NewsAPI rate limit exceeded');
    }
    if (response.status === 401) {
      throw new Error('NewsAPI unauthorized - check API key');
    }
    throw new Error(`NewsAPI error: ${response.status} - ${errorText.substring(0, 100)}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'ok') {
    log.error('NewsAPI API error:', data);
    throw new Error(`NewsAPI error: ${data.message || 'Unknown error'}`);
  }
  
  if (!data.articles || data.articles.length === 0) {
    log.warn('NewsAPI returned no articles');
    return [];
  }
  
  log.debug(`NewsAPI returned ${data.articles.length} articles`);
  
  return data.articles.map((article, index) => ({
    id: `newsapi_${article.url ? hashCode(article.url) : index}`,
    title: article.title,
    summary: article.description || '',
    source: article.source?.name || 'Unknown',
    category: mapNewsAPICategory(category, article),
    sentiment: analyzeSentiment(article.title, article.description),
    impact: 'medium', // Par défaut
    quality: calculateQuality(article),
    url: article.url,
    imageUrl: article.urlToImage,
    publishedAt: article.publishedAt,
    time: formatTimeAgo(article.publishedAt),
    author: article.author
  }));
}

/**
 * Map NewsAPI category to our category
 */
function mapNewsAPICategory(selectedCategory, article) {
  if (selectedCategory !== 'tout') return selectedCategory;
  
  // Détecter catégorie depuis le contenu
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const content = `${title} ${desc}`;
  
  if (content.includes('bitcoin') || content.includes('crypto') || content.includes('ethereum')) {
    return 'crypto';
  }
  if (content.includes('bourse') || content.includes('action') || content.includes('nasdaq') || content.includes('cac')) {
    return 'bourse';
  }
  if (content.includes('tech') || content.includes('ia') || content.includes('intelligence artificielle') || content.includes('apple') || content.includes('google')) {
    return 'tech';
  }
  if (content.includes('sport') || content.includes('football') || content.includes('tennis')) {
    return 'sport';
  }
  if (content.includes('politique') || content.includes('élection') || content.includes('gouvernement')) {
    return 'politique';
  }
  if (content.includes('santé') || content.includes('médecine') || content.includes('covid')) {
    return 'sante';
  }
  if (content.includes('environnement') || content.includes('climat') || content.includes('écologie')) {
    return 'environnement';
  }
  
  return 'monde';
}

// ==================== GUARDIAN API ====================

/**
 * Récupère les actualités depuis Guardian API
 */
async function fetchGuardian(options = {}) {
  const { category = 'tout', query = null, page = 1, pageSize = 20 } = options;
  
  if (!hasApiKey('GUARDIAN')) {
    throw new Error('Guardian API key not configured');
  }
  
  const apiKey = getApiKey('GUARDIAN');
  const params = new URLSearchParams({
    'api-key': apiKey,
    'page': page.toString(),
    'page-size': pageSize.toString(),
    'show-fields': 'thumbnail,trailText',
    'order-by': 'newest'
  });
  
  if (query) {
    params.append('q', query);
  } else if (category !== 'tout') {
    // Guardian sections
    const sectionMap = {
      'tech': 'technology',
      'sport': 'sport',
      'culture': 'culture',
      'politique': 'politics',
      'economie': 'business',
      'monde': 'world'
    };
    if (sectionMap[category]) {
      params.append('section', sectionMap[category]);
    }
  }
  
  await tokenBuckets.GUARDIAN.consume();
  
  const url = `https://content.guardianapis.com/search?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Guardian API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.response?.status !== 'ok') {
    throw new Error(`Guardian API error: ${data.response?.message || 'Unknown error'}`);
  }
  
  return data.response.results.map((article, index) => ({
    id: `guardian_${article.id || index}`,
    title: article.webTitle,
    summary: article.fields?.trailText || '',
    source: 'The Guardian',
    category: mapGuardianCategory(category, article),
    sentiment: analyzeSentiment(article.webTitle, article.fields?.trailText),
    impact: 'medium',
    quality: 85, // Guardian = qualité élevée
    url: article.webUrl,
    imageUrl: article.fields?.thumbnail,
    publishedAt: article.webPublicationDate,
    time: formatTimeAgo(article.webPublicationDate),
    author: null
  }));
}

function mapGuardianCategory(selectedCategory, article) {
  if (selectedCategory !== 'tout') return selectedCategory;
  return article.sectionId || 'monde';
}

// ==================== MEDIASTACK ====================

/**
 * Récupère les actualités depuis MediaStack
 */
async function fetchMediaStack(options = {}) {
  const { category = 'tout', country = 'fr', query = null, page = 1, pageSize = 20 } = options;
  
  if (!hasApiKey('MEDIASTACK')) {
    throw new Error('MediaStack API key not configured');
  }
  
  const apiKey = getApiKey('MEDIASTACK');
  const params = new URLSearchParams({
    access_key: apiKey,
    languages: 'fr',
    limit: pageSize.toString(),
    offset: ((page - 1) * pageSize).toString()
  });
  
  if (category === 'france' || country === 'fr') {
    params.append('countries', 'fr');
  }
  
  if (query) {
    params.append('keywords', query);
  }
  
  await tokenBuckets.MEDIASTACK.consume();
  
  const url = `https://api.mediastack.com/v1/news?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    // ✅ CORRECTION : Gestion spécifique des erreurs 429 (rate limit)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const errorMsg = retryAfter 
        ? `MediaStack API rate limit exceeded. Retry after ${retryAfter} seconds.`
        : 'MediaStack API rate limit exceeded. Please try again later.';
      throw new Error(errorMsg);
    }
    // ✅ CORRECTION : Gestion autres erreurs HTTP
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`MediaStack API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    // ✅ CORRECTION : Gestion erreur rate limit dans body
    if (data.error.code === 429 || data.error.info?.includes('rate limit')) {
      throw new Error('MediaStack API rate limit exceeded');
    }
    throw new Error(`MediaStack API error: ${data.error.info || 'Unknown error'}`);
  }
  
  return data.data.map((article, index) => ({
    id: `mediastack_${article.url ? hashCode(article.url) : index}`,
    title: article.title,
    summary: article.description || '',
    source: article.source,
    category: mapMediaStackCategory(category, article),
    sentiment: analyzeSentiment(article.title, article.description),
    impact: 'medium',
    quality: 75,
    url: article.url,
    imageUrl: article.image,
    publishedAt: article.published_at,
    time: formatTimeAgo(article.published_at),
    author: article.author
  }));
}

function mapMediaStackCategory(selectedCategory, article) {
  if (selectedCategory !== 'tout') return selectedCategory;
  return article.category?.[0] || 'monde';
}

// ==================== NEWSDATA.IO ====================

/**
 * Récupère les actualités depuis NewsData.io
 */
async function fetchNewsData(options = {}) {
  const { category = 'tout', country = 'fr', query = null, page = 1, pageSize = 20 } = options;
  
  if (!hasApiKey('NEWSDATA')) {
    throw new Error('NewsData.io API key not configured');
  }
  
  const apiKey = getApiKey('NEWSDATA');
  const params = new URLSearchParams({
    apikey: apiKey,
    language: 'fr',
    size: pageSize.toString()
  });
  
  if (category === 'france' || country === 'fr') {
    params.append('country', 'fr');
  }
  
  if (query) {
    params.append('q', query);
  } else if (category !== 'tout') {
    const categoryMap = {
      'tech': 'technology',
      'sport': 'sports',
      'sante': 'health',
      'economie': 'business',
      'bourse': 'business'
    };
    if (categoryMap[category]) {
      params.append('category', categoryMap[category]);
    }
  }
  
  await tokenBuckets.NEWSDATA.consume();
  
  const url = `https://newsdata.io/api/1/news?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    // ✅ CORRECTION : Gestion spécifique des erreurs 422 (requête invalide)
    if (response.status === 422) {
      const errorText = await response.text().catch(() => '');
      try {
        const errorData = JSON.parse(errorText);
        // Vérifier si c'est un problème de paramètres
        if (errorData.message?.includes('category') || errorData.message?.includes('country')) {
          log.warn(`NewsData.io invalid parameters for category=${category}, country=${country}`);
          // Retourner tableau vide plutôt que throw (fallback vers autre source)
          return [];
        }
      } catch (e) {
        // Ignorer erreur parsing
      }
      throw new Error(`NewsData.io API error: Invalid request parameters (422)`);
    }
    // ✅ CORRECTION : Gestion autres erreurs HTTP
    if (response.status === 429) {
      throw new Error('NewsData.io API rate limit exceeded');
    }
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`NewsData.io API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'success') {
    // ✅ CORRECTION : Si erreur mais pas critique, retourner tableau vide
    if (data.status === 'error' && data.results?.length === 0) {
      log.warn('NewsData.io returned no results');
      return [];
    }
    throw new Error(`NewsData.io API error: ${data.message || 'Unknown error'}`);
  }
  
  return data.results.map((article, index) => ({
    id: `newsdata_${article.article_id || index}`,
    title: article.title,
    summary: article.description || '',
    source: article.source_name,
    category: mapNewsDataCategory(category, article),
    sentiment: analyzeSentiment(article.title, article.description),
    impact: 'medium',
    quality: 80,
    url: article.link,
    imageUrl: article.image_url,
    publishedAt: article.pubDate,
    time: formatTimeAgo(article.pubDate),
    author: article.creator?.[0]
  }));
}

function mapNewsDataCategory(selectedCategory, article) {
  if (selectedCategory !== 'tout') return selectedCategory;
  return article.category?.[0] || 'monde';
}

// ==================== FINNHUB (FINANCIER) ====================

/**
 * Récupère les actualités financières depuis Finnhub
 */
async function fetchFinnhubNews(options = {}) {
  const { category = 'bourse', limit = 50 } = options;
  
  if (!hasApiKey('FINNHUB')) {
    throw new Error('Finnhub API key not configured');
  }
  
  const apiKey = getApiKey('FINNHUB');
  const categoryMap = {
    'bourse': 'general',
    'crypto': 'crypto',
    'economie': 'general'
  };
  
  const finnhubCategory = categoryMap[category] || 'general';
  
  await tokenBuckets.FINNHUB.consume();
  
  const url = `https://finnhub.io/api/v1/news?category=${finnhubCategory}&token=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.slice(0, limit).map((article, index) => ({
    id: `finnhub_${article.id || index}`,
    title: article.headline,
    summary: article.summary || '',
    source: article.source,
    category: finnhubCategory === 'crypto' ? 'crypto' : 'bourse',
    sentiment: analyzeSentiment(article.headline, article.summary),
    impact: 'high', // Financier = impact élevé
    quality: 90, // Finnhub = qualité très élevée
    url: article.url,
    imageUrl: article.image,
    publishedAt: new Date(article.datetime * 1000).toISOString(),
    time: formatTimeAgo(new Date(article.datetime * 1000).toISOString()),
    author: null
  }));
}

// ==================== REDDIT (COMMUNAUTAIRE) ====================

/**
 * Récupère les actualités depuis Reddit
 */
async function fetchRedditNews(options = {}) {
  const { category = 'tout', limit = 25 } = options;
  
  const subredditMap = {
    'tout': 'worldnews',
    'tech': 'technology',
    'crypto': 'CryptoCurrency',
    'economie': 'Economics',
    'sport': 'sports',
    'france': 'france',
    'monde': 'worldnews'
  };
  
  const subreddit = subredditMap[category] || 'worldnews';
  
  await tokenBuckets.REDDIT.consume();
  
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WorkoutTracker/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.data.children
    .filter(post => !post.data.stickied && post.data.selftext === '') // Exclure stickied et text posts
    .slice(0, limit)
    .map((post, index) => {
      const postData = post.data;
      return {
        id: `reddit_${postData.id || index}`,
        title: postData.title,
        summary: postData.selftext || '',
        source: `Reddit r/${subreddit}`,
        category: category,
        sentiment: analyzeRedditSentiment(postData.ups, postData.downs),
        impact: postData.ups > 1000 ? 'high' : postData.ups > 100 ? 'medium' : 'low',
        quality: Math.min(100, Math.floor(postData.upvote_ratio * 100)),
        url: `https://reddit.com${postData.permalink}`,
        imageUrl: postData.thumbnail && postData.thumbnail.startsWith('http') ? postData.thumbnail : null,
        publishedAt: new Date(postData.created_utc * 1000).toISOString(),
        time: formatTimeAgo(new Date(postData.created_utc * 1000).toISOString()),
        author: postData.author
      };
    });
}

// ==================== UTILITAIRES ====================

/**
 * Analyse le sentiment d'un article (simple)
 */
function analyzeSentiment(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  const positiveWords = ['hausse', 'croissance', 'succès', 'gagnant', 'positif', 'amélioration', 'record', 'fort', 'solide'];
  const negativeWords = ['baisse', 'chute', 'crise', 'perte', 'négatif', 'déclin', 'faible', 'problème', 'risque'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Analyse le sentiment Reddit depuis les votes
 */
function analyzeRedditSentiment(ups, downs) {
  const ratio = ups / (ups + downs || 1);
  if (ratio > 0.7) return 'positive';
  if (ratio < 0.3) return 'negative';
  return 'neutral';
}

/**
 * Calcule la qualité d'un article
 */
function calculateQuality(article) {
  let quality = 50; // Base
  
  // Source réputée
  const reputableSources = ['Reuters', 'Bloomberg', 'Le Monde', 'Le Figaro', 'BBC', 'The Guardian', 'Associated Press'];
  if (reputableSources.some(source => article.source?.includes(source))) {
    quality += 20;
  }
  
  // Description présente
  if (article.description && article.description.length > 100) {
    quality += 10;
  }
  
  // Image présente
  if (article.urlToImage || article.image) {
    quality += 10;
  }
  
  // Auteur présent
  if (article.author) {
    quality += 10;
  }
  
  return Math.min(100, quality);
}

/**
 * Formate le temps relatif
 */
function formatTimeAgo(dateString) {
  if (!dateString) return 'Il y a ?';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}

/**
 * Hash simple pour générer un ID depuis une URL
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ==================== SERVICE PRINCIPAL ====================

/**
 * Service News Principal
 */
class NewsService {
  constructor() {
    this.dailyCounters = {
      NEWSAPI: { count: 0, resetAt: this.getMidnightTimestamp() },
      GUARDIAN: { count: 0, resetAt: this.getMidnightTimestamp() },
      MEDIASTACK: { count: 0, resetAt: this.getMidnightTimestamp() },
      NEWSDATA: { count: 0, resetAt: this.getMidnightTimestamp() }
    };
    
    // ✅ CORRECTION : Circuit breaker pour éviter spammer les APIs
    this.circuitBreakers = {
      MEDIASTACK: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 },
      NEWSDATA: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 },
      NEWSAPI: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 }
    };
    
    this.loadCounters();
    this.checkDailyReset();
  }
  
  getMidnightTimestamp() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return midnight.getTime();
  }
  
  loadCounters() {
    try {
      const stored = localStorage.getItem('news_api_counters');
      if (stored) {
        const data = JSON.parse(stored);
        const midnight = this.getMidnightTimestamp();
        if (data.resetAt < midnight) {
          this.resetDailyCounters();
        } else {
          this.dailyCounters = data;
        }
      }
    } catch (error) {
      log.warn('Error loading news counters:', error);
    }
  }
  
  saveCounters() {
    try {
      localStorage.setItem('news_api_counters', JSON.stringify(this.dailyCounters));
    } catch (error) {
      log.warn('Error saving news counters:', error);
    }
  }
  
  resetDailyCounters() {
    const midnight = this.getMidnightTimestamp();
    Object.keys(this.dailyCounters).forEach(api => {
      this.dailyCounters[api] = { count: 0, resetAt: midnight };
    });
    this.saveCounters();
  }
  
  checkDailyReset() {
    const now = Date.now();
    const midnight = this.getMidnightTimestamp();
    if (now >= midnight + 24 * 60 * 60 * 1000) {
      this.resetDailyCounters();
    }
    const nextMidnight = midnight + 24 * 60 * 60 * 1000;
    const delay = nextMidnight - now;
    setTimeout(() => this.resetDailyCounters(), delay);
  }
  
  canUseAPI(apiName) {
    const counter = this.dailyCounters[apiName];
    if (!counter) return true; // Pas de limite journalière
    
    const config = QUOTA_CONFIG[apiName];
    if (!config) return true;
    
    const dailyLimit = config.requestsPerDay || config.requestsPerMonth || Infinity;
    return counter.count < dailyLimit;
  }
  
  recordAPIUsage(apiName) {
    if (this.dailyCounters[apiName]) {
      this.dailyCounters[apiName].count++;
      this.saveCounters();
    }
  }
  
  /**
   * Récupère les actualités avec fallback intelligent
   */
  async getNews(options = {}) {
    const {
      category = 'tout',
      country = null,
      query = null,
      page = 1,
      pageSize = 20,
      sources = ['newsapi', 'guardian', 'mediastack', 'newsdata'],
      useCache = true
    } = options;
    
    // Clé de cache
    const cacheKey = `news_${category}_${country || 'all'}_${query || 'all'}_${page}_${pageSize}`;
    
    // Vérifier cache
    if (useCache) {
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        log.debug('Cache hit for news:', cacheKey);
        return cached;
      }
    }
    
    const allNews = [];
    const errors = [];
    
    // Essayer chaque source avec fallback
    for (const source of sources) {
      try {
        // Vérifier si l'API est disponible
        const sourceUpper = source.toUpperCase();
        const hasKey = hasApiKey(sourceUpper);
        
        if (!hasKey && source !== 'reddit') {
          log.debug(`Skipping ${source}: API key not configured`);
          continue;
        }
        
        if (!this.canUseAPI(sourceUpper) && source !== 'reddit') {
          log.debug(`Skipping ${source}: daily quota exceeded`);
          continue;
        }
        
        // ✅ CORRECTION : Vérifier circuit breaker avant d'appeler l'API
        const breaker = this.circuitBreakers[sourceUpper];
        if (breaker) {
          if (breaker.state === 'OPEN') {
            if (Date.now() < breaker.nextAttempt) {
              log.debug(`Skipping ${source}: circuit breaker OPEN (retry after ${Math.round((breaker.nextAttempt - Date.now()) / 1000)}s)`);
              continue;
            } else {
              // Tenter de rouvrir le circuit (half-open)
              breaker.state = 'HALF_OPEN';
              log.debug(`Circuit breaker HALF_OPEN for ${source}, attempting request`);
            }
          }
        }
        
        let articles = [];
        
        switch (source.toLowerCase()) {
          case 'newsapi':
            if (hasKey) {
              log.debug('Fetching from NewsAPI...');
              articles = await fetchNewsAPI({ category, country, query, page, pageSize });
              this.recordAPIUsage('NEWSAPI');
              // ✅ CORRECTION : Réinitialiser circuit breaker en cas de succès
              if (breaker) {
                breaker.failures = 0;
                breaker.state = 'CLOSED';
              }
              log.debug(`NewsAPI returned ${articles.length} articles`);
            }
            break;
            
          case 'guardian':
            if (hasKey) {
              log.debug('Fetching from Guardian...');
              articles = await fetchGuardian({ category, query, page, pageSize });
              this.recordAPIUsage('GUARDIAN');
              log.debug(`Guardian returned ${articles.length} articles`);
            }
            break;
            
          case 'mediastack':
            if (hasKey) {
              log.debug('Fetching from MediaStack...');
              articles = await fetchMediaStack({ category, country, query, page, pageSize });
              this.recordAPIUsage('MEDIASTACK');
              // ✅ CORRECTION : Réinitialiser circuit breaker en cas de succès
              if (breaker) {
                breaker.failures = 0;
                breaker.state = 'CLOSED';
              }
              log.debug(`MediaStack returned ${articles.length} articles`);
            }
            break;
            
          case 'newsdata':
            if (hasKey) {
              log.debug('Fetching from NewsData...');
              articles = await fetchNewsData({ category, country, query, page, pageSize });
              this.recordAPIUsage('NEWSDATA');
              // ✅ CORRECTION : Réinitialiser circuit breaker en cas de succès
              if (breaker) {
                breaker.failures = 0;
                breaker.state = 'CLOSED';
              }
              log.debug(`NewsData returned ${articles.length} articles`);
            }
            break;
            
          case 'finnhub':
            if (hasKey && (category === 'bourse' || category === 'crypto' || category === 'economie')) {
              log.debug('Fetching from Finnhub...');
              articles = await fetchFinnhubNews({ category, limit: pageSize });
              log.debug(`Finnhub returned ${articles.length} articles`);
            }
            break;
            
          case 'reddit':
            log.debug('Fetching from Reddit...');
            articles = await fetchRedditNews({ category, limit: pageSize });
            log.debug(`Reddit returned ${articles.length} articles`);
            break;
        }
        
        if (articles && articles.length > 0) {
          allNews.push(...articles);
          log.debug(`Total articles so far: ${allNews.length}`);
        }
        
        // Si on a assez d'articles, arrêter
        if (allNews.length >= pageSize * 2) {
          log.debug(`Enough articles (${allNews.length}), stopping fetch`);
          break;
        }
      } catch (error) {
        errors.push({ source, error: error.message });
        
        // ✅ CORRECTION : Gérer circuit breaker en cas d'erreur
        const breaker = this.circuitBreakers[source.toUpperCase()];
        if (breaker) {
          // Si erreur rate limit (429), ouvrir le circuit breaker
          if (error.message.includes('rate limit') || error.message.includes('429')) {
            breaker.failures++;
            if (breaker.failures >= breaker.threshold) {
              breaker.state = 'OPEN';
              breaker.nextAttempt = Date.now() + (5 * 60 * 1000); // Réessayer dans 5 minutes
              log.warn(`Circuit breaker OPEN for ${source} (rate limit exceeded)`);
            } else {
              log.warn(`Circuit breaker: ${breaker.failures}/${breaker.threshold} failures for ${source}`);
            }
          }
        }
        
        // ✅ CORRECTION : Ne logger que les erreurs critiques (pas les 422 si on a d'autres sources)
        if (error.message.includes('422') && sources.length > 1) {
          log.debug(`Error fetching from ${source}: ${error.message} (skipping, trying other sources)`);
        } else {
          log.warn(`Error fetching from ${source}:`, error.message);
        }
        // Continuer avec la source suivante
      }
    }
    
    log.debug(`Total articles fetched: ${allNews.length}, errors: ${errors.length}`);
    
    // Dédupliquer par URL
    const uniqueNews = [];
    const seenUrls = new Set();
    
    for (const article of allNews) {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        uniqueNews.push(article);
      }
    }
    
    // Trier par date (plus récent en premier)
    uniqueNews.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0);
      const dateB = new Date(b.publishedAt || 0);
      return dateB - dateA;
    });
    
    // Limiter au nombre demandé
    const result = uniqueNews.slice(0, pageSize);
    
    // Mettre en cache
    if (useCache && result.length > 0) {
      memoryCache.set(cacheKey, result, CACHE_TTL.HEADLINES);
    }
    
    // Logger le résultat final
    log.info(`News fetch completed: ${result.length} articles (from ${allNews.length} total, ${errors.length} errors)`);
    if (errors.length > 0) {
      log.warn('Errors during fetch:', errors);
    }
    
    return {
      news: result,
      total: uniqueNews.length,
      page,
      pageSize,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Récupère le statut des APIs
   */
  getAPIStatus() {
    const status = {
      newsapi: hasApiKey('NEWSAPI') && this.canUseAPI('NEWSAPI') ? 'ok' : 'unavailable',
      guardian: hasApiKey('GUARDIAN') && this.canUseAPI('GUARDIAN') ? 'ok' : 'unavailable',
      mediastack: hasApiKey('MEDIASTACK') && this.canUseAPI('MEDIASTACK') ? 'ok' : 'unavailable',
      newsdata: hasApiKey('NEWSDATA') && this.canUseAPI('NEWSDATA') ? 'ok' : 'unavailable',
      finnhub: hasApiKey('FINNHUB') ? 'ok' : 'unavailable',
      reddit: 'ok' // Toujours disponible
    };
    
    // Log pour debug
    if (log.debug) {
      log.debug('API Status:', {
        newsapi: { hasKey: hasApiKey('NEWSAPI'), canUse: this.canUseAPI('NEWSAPI'), status: status.newsapi },
        guardian: { hasKey: hasApiKey('GUARDIAN'), canUse: this.canUseAPI('GUARDIAN'), status: status.guardian },
        mediastack: { hasKey: hasApiKey('MEDIASTACK'), canUse: this.canUseAPI('MEDIASTACK'), status: status.mediastack },
        newsdata: { hasKey: hasApiKey('NEWSDATA'), canUse: this.canUseAPI('NEWSDATA'), status: status.newsdata },
        finnhub: { hasKey: hasApiKey('FINNHUB'), status: status.finnhub }
      });
    }
    
    return status;
  }
  
  /**
   * Recherche d'actualités
   */
  async searchNews(query, options = {}) {
    return this.getNews({
      ...options,
      query,
      sources: ['newsapi', 'guardian', 'mediastack', 'newsdata']
    });
  }
  
  /**
   * Récupère les actualités par catégorie
   */
  async getNewsByCategory(category, options = {}) {
    const sources = category === 'bourse' || category === 'crypto' || category === 'economie'
      ? ['finnhub', 'newsapi', 'guardian']
      : ['newsapi', 'guardian', 'mediastack', 'newsdata'];
    
    return this.getNews({
      ...options,
      category,
      sources
    });
  }
  
  /**
   * Récupère les actualités France
   */
  async getFranceNews(options = {}) {
    return this.getNews({
      ...options,
      category: 'france',
      country: 'fr',
      sources: ['newsapi', 'mediastack', 'newsdata', 'reddit']
    });
  }
}

// Instance singleton
export const newsService = new NewsService();

export default newsService;

