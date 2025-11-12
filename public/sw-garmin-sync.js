/**
 * Service Worker pour offline fallback sur /api/garmin/sync
 * 
 * Intercepte les requêtes vers /api/garmin/sync et fournit un fallback
 * en cas d'échec réseau ou de mode offline.
 * 
 * Stratégie :
 * - Network-first : tente d'abord le réseau, puis utilise le cache si échec
 * - Cache les dernières réponses réussies pour fallback
 * - Gère les erreurs réseau gracieusement
 * 
 * @module sw-garmin-sync
 */

const CACHE_NAME = 'garmin-sync-v1';
const SYNC_ENDPOINT = '/api/garmin/sync';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Nettoie les anciennes entrées du cache
 */
async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      // Les clés de cache sont des Request GET factices créées par createCacheKey
      const response = await cache.match(request);
      if (!response) continue;

      const cachedDate = response.headers.get('sw-cached-at');
      if (cachedDate) {
        const age = now - parseInt(cachedDate, 10);
        if (age > MAX_CACHE_AGE_MS) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Erreur lors du nettoyage du cache', error);
  }
}

/**
 * Ajoute des métadonnées à la réponse pour le cache
 */
function addCacheMetadata(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  headers.set('sw-cache-name', CACHE_NAME);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Crée une clé de cache pour une requête POST
 * L'API Cache ne supporte pas les requêtes POST, donc on crée une Request GET factice
 * avec la même URL + query params comme clé
 */
function createCacheKey(request) {
  const url = new URL(request.url);
  // Utiliser l'URL complète avec query params comme clé
  // Pour les POST, on ignore le body car l'API Cache ne le supporte pas
  return new Request(url.toString(), { method: 'GET' });
}

/**
 * Gère les requêtes vers /api/garmin/sync
 */
async function handleSyncRequest(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Ne gérer que les requêtes POST vers /api/garmin/sync
  if (url.pathname !== SYNC_ENDPOINT || request.method !== 'POST') {
    return fetch(request); // Laisser passer les autres requêtes
  }

  // Créer une clé de cache (Request GET avec la même URL)
  const cacheKey = createCacheKey(request);

  try {
    // Stratégie Network-first : tenter d'abord le réseau
    try {
      const networkResponse = await fetch(request.clone());

      if (networkResponse.ok) {
        // Mettre en cache la réponse réussie
        // ⚠️ L'API Cache ne supporte pas POST, donc on utilise une Request GET factice comme clé
        const cache = await caches.open(CACHE_NAME);
        const responseToCache = addCacheMetadata(networkResponse.clone());
        
        try {
          await cache.put(cacheKey, responseToCache);
        } catch (cacheError) {
          // Si le cache échoue (peut arriver avec certaines configurations), continuer quand même
          console.warn('[SW] Impossible de mettre en cache la réponse', cacheError);
        }

        // Nettoyer les anciennes entrées (en arrière-plan, non bloquant)
        cleanupCache().catch(err => {
          console.warn('[SW] Erreur lors du nettoyage du cache (non bloquant)', err);
        });

        return networkResponse;
      }

      // Si la réponse n'est pas OK, essayer le cache
      throw new Error(`Network response not OK: ${networkResponse.status}`);
    } catch (networkError) {
      // Réseau indisponible ou erreur : utiliser le cache
      console.log('[SW] Réseau indisponible, utilisation du cache', networkError);

      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
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
          message: 'Mode hors ligne et aucune donnée en cache disponible. Veuillez vous connecter pour synchroniser.',
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
    console.error('[SW] Erreur lors du traitement de la requête sync', error);

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
  console.log('[SW] Service Worker installé pour Garmin sync');
  // Forcer l'activation immédiate
  self.skipWaiting();
});

/**
 * Activation du Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé pour Garmin sync');
  // Prendre le contrôle de toutes les pages
  event.waitUntil(clients.claim());
});

/**
 * Interception des requêtes fetch
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne gérer que les requêtes vers /api/garmin/sync
  if (url.pathname === SYNC_ENDPOINT && event.request.method === 'POST') {
    event.respondWith(handleSyncRequest(event));
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
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('[SW] Service Worker Garmin sync chargé');

