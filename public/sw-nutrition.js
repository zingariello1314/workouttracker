/**
 * Service Worker pour Nutrition - Cache API Offline
 * 
 * Intercepte les requêtes vers OpenFoodFacts et USDA FoodData Central
 * et fournit un cache pour mode offline.
 * 
 * Stratégie :
 * - Network-first : tente d'abord le réseau, puis utilise le cache si échec
 * - Cache les réponses réussies pour fallback offline
 * - TTL configurable (24h par défaut pour produits, 7 jours pour recherches)
 * - Nettoyage automatique des entrées expirées
 * 
 * @module sw-nutrition
 * @see ../../nouvelongletnutritionplan.md Section 7.0
 */

const CACHE_NAME = 'nutrition-api-v1';
const MAX_CACHE_AGE_PRODUCT_MS = 24 * 60 * 60 * 1000; // 24 heures pour produits
const MAX_CACHE_AGE_SEARCH_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours pour recherches

// Domaines API à cacher
const API_DOMAINS = [
  'openfoodfacts.org',
  'api.nal.usda.gov',
  'fdc.nal.usda.gov'
];

/**
 * Vérifie si une URL correspond à une API nutrition à cacher
 */
function isNutritionAPI(url) {
  try {
    const urlObj = new URL(url);
    return API_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Détermine le TTL selon le type de requête
 */
function getCacheTTL(url) {
  // Recherches : cache plus long (7 jours)
  if (url.includes('/cgi/search.pl') || url.includes('/foods/search')) {
    return MAX_CACHE_AGE_SEARCH_MS;
  }
  // Produits spécifiques : cache plus court (24h)
  return MAX_CACHE_AGE_PRODUCT_MS;
}

/**
 * Nettoie les anciennes entrées du cache
 */
async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      const response = await cache.match(request);
      if (!response) continue;

      const cachedDate = response.headers.get('sw-cached-at');
      if (cachedDate) {
        const age = now - parseInt(cachedDate, 10);
        const ttl = getCacheTTL(request.url);
        
        if (age > ttl) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW Nutrition] Erreur lors du nettoyage du cache', error);
  }
}

/**
 * Ajoute des métadonnées à la réponse pour le cache
 */
function addCacheMetadata(response, url) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  headers.set('sw-cache-name', CACHE_NAME);
  headers.set('sw-cache-ttl', getCacheTTL(url).toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Gère les requêtes vers les APIs nutrition
 */
async function handleNutritionAPIRequest(event) {
  const { request } = event;
  const url = request.url;

  // Vérifier que c'est une API nutrition
  if (!isNutritionAPI(url)) {
    return fetch(request); // Laisser passer les autres requêtes
  }

  try {
    // Stratégie Network-first : tenter d'abord le réseau
    try {
      const networkResponse = await fetch(request.clone());

      if (networkResponse.ok) {
        // Mettre en cache la réponse réussie
        const cache = await caches.open(CACHE_NAME);
        const responseToCache = addCacheMetadata(networkResponse.clone(), url);
        
        try {
          await cache.put(request.clone(), responseToCache);
        } catch (cacheError) {
          // Si le cache échoue, continuer quand même
          console.warn('[SW Nutrition] Impossible de mettre en cache la réponse', cacheError);
        }

        // Nettoyer les anciennes entrées (en arrière-plan, non bloquant)
        cleanupCache().catch(err => {
          console.warn('[SW Nutrition] Erreur lors du nettoyage du cache (non bloquant)', err);
        });

        return networkResponse;
      }

      // Si la réponse n'est pas OK, essayer le cache
      throw new Error(`Network response not OK: ${networkResponse.status}`);
    } catch (networkError) {
      // Réseau indisponible ou erreur : utiliser le cache
      console.log('[SW Nutrition] Réseau indisponible, utilisation du cache', networkError.message);

      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        // Vérifier que le cache n'est pas expiré
        const cachedDate = cachedResponse.headers.get('sw-cached-at');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate, 10);
          const ttl = getCacheTTL(url);
          
          if (age > ttl) {
            // Cache expiré, retourner erreur
            return new Response(
              JSON.stringify({
                ok: false,
                error: 'Offline',
                message: 'Mode hors ligne et cache expiré. Veuillez vous connecter pour rechercher de nouveaux produits.',
                cached: false,
                expired: true
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                  'Content-Type': 'application/json',
                  'sw-served-from-cache': 'false',
                  'sw-offline': 'true',
                  'sw-cache-expired': 'true'
                }
              }
            );
          }
        }

        // Ajouter un header pour indiquer que c'est une réponse en cache
        const headers = new Headers(cachedResponse.headers);
        headers.set('sw-served-from-cache', 'true');
        headers.set('sw-network-error', networkError.message || 'unknown');

        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers
        });
      }

      // Pas de cache disponible : retourner une erreur gracieuse
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Offline',
          message: 'Mode hors ligne et aucune donnée en cache disponible. Veuillez vous connecter pour rechercher des produits.',
          cached: false
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json',
            'sw-served-from-cache': 'false',
            'sw-offline': 'true'
          }
        }
      );
    }
  } catch (error) {
    console.error('[SW Nutrition] Erreur lors du traitement de la requête API', error);

    // Erreur fatale : retourner une réponse d'erreur
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Service Worker Error',
        message: error.message || 'Erreur inconnue dans le Service Worker'
      }),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'application/json',
          'sw-error': 'true'
        }
      }
    );
  }
}

/**
 * Installation du Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW Nutrition] Service Worker installé pour Nutrition API cache');
  // Forcer l'activation immédiate
  self.skipWaiting();
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW Nutrition] Service Worker activé pour Nutrition API cache');
  // Prendre le contrôle de toutes les pages
  event.waitUntil(clients.claim());
  
  // Nettoyer les anciens caches lors de l'activation
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('nutrition-api-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW Nutrition] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
});

/**
 * Interception des requêtes fetch
 */
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ne gérer que les requêtes GET vers les APIs nutrition
  if (isNutritionAPI(url) && event.request.method === 'GET') {
    event.respondWith(handleNutritionAPIRequest(event));
  }
  // Laisser passer toutes les autres requêtes
});

/**
 * Gestion des messages depuis le client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
});

console.log('[SW Nutrition] Service Worker Nutrition API cache chargé');

