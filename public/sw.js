/**
 * 🔔 SERVICE WORKER - BODY TRACKING NOTIFICATIONS
 * 
 * Service Worker pour gérer les notifications push hors ligne
 * et améliorer l'expérience utilisateur pour les rappels Body Tracking.
 * 
 * Fonctionnalités:
 * - Gestion notifications push
 * - Cache stratégique pour fonctionnement hors ligne
 * - Écoute messages depuis l'application principale
 */

const CACHE_NAME = 'body-tracking-notifications-v1';
const NOTIFICATION_ICON = '/logo.png';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installé');
  // Forcer l'activation immédiate (skipWaiting)
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé');
  // Prendre le contrôle immédiatement
  event.waitUntil(self.clients.claim());
});

// Gestion des messages depuis l'application principale
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu', event.data);
  
  if (event.data && event.data.type === 'notification-request') {
    // Créer une notification depuis le Service Worker
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        ...options,
        icon: options.icon || NOTIFICATION_ICON,
        badge: options.badge || NOTIFICATION_ICON
      })
    );
  }
});

// Gestion des notifications push (pour futures extensions)
self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu', event.data);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const { title, body, icon, tag, data: notificationData } = data;
      
      event.waitUntil(
        self.registration.showNotification(title || 'Rappel Body Tracking', {
          body: body || 'Nouveau rappel',
          icon: icon || NOTIFICATION_ICON,
          badge: NOTIFICATION_ICON,
          tag: tag || 'body-tracking-reminder',
          data: notificationData || {},
          requireInteraction: false,
          actions: [
            {
              action: 'open',
              title: 'Ouvrir',
              icon: NOTIFICATION_ICON
            },
            {
              action: 'snooze',
              title: 'Rappeler dans 1h',
              icon: NOTIFICATION_ICON
            }
          ]
        })
      );
    } catch (error) {
      console.error('[SW] Erreur parsing push data', error);
    }
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée', event.notification.tag, event.action);
  
  event.notification.close();
  
  const action = event.action || 'open';
  const notificationData = event.notification.data || {};
  
  // Gérer les actions
  if (action === 'snooze') {
    // Reporter le rappel de 1h
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
          clientList[0].postMessage({
            type: 'notification-action',
            action: 'snooze',
            reminderId: notificationData.reminderId
          });
        }
      })
    );
  } else if (action === 'complete') {
    // Marquer comme complété
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
          clientList[0].postMessage({
            type: 'notification-action',
            action: 'complete',
            reminderId: notificationData.reminderId
          });
        }
      })
    );
  } else {
    // Ouvrir l'application (action par défaut)
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focus
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        // Sinon, ouvrir une nouvelle fenêtre
        return clients.openWindow('/');
      }).then((client) => {
        // Envoyer message à l'application pour navigation
        if (client) {
          client.postMessage({
            type: 'notification-click',
            reminderId: notificationData.reminderId,
            reminderType: notificationData.type
          });
        }
      })
    );
  }
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée', event.notification.tag);
});

// Gestion des erreurs
self.addEventListener('error', (event) => {
  console.error('[SW] Erreur Service Worker', event.error);
});

