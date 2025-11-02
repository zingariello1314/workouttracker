/**
 * 🔔 SERVICE DE NOTIFICATIONS - BODY TRACKING
 * 
 * Service sophistiqué pour gérer les notifications réelles via Browser Notification API
 * et Service Worker pour notifications push même hors ligne.
 * 
 * Fonctionnalités:
 * - Gestion permissions utilisateur (demande, vérification, fallback)
 * - Notifications programmées basées sur nextTrigger des rappels
 * - Actions sur notifications (ouvrir app, snooze, compléter)
 * - Son de notification optionnel
 * - Mode silencieux / do not disturb
 * - Synchronisation avec Service Worker pour fonctionnement hors ligne
 * 
 * Niveau: Professionnel - Système robuste digne des meilleures applications
 */

import logger from '../../../utils/logger';

const log = logger.module('NotificationService');

/**
 * État des permissions de notification
 */
export const NOTIFICATION_PERMISSION = {
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default' // Pas encore demandé
};

/**
 * Types de notifications Body Tracking
 */
export const NOTIFICATION_TYPES = {
  WEIGHT_REMINDER: 'weight_reminder',
  MEASUREMENTS_REMINDER: 'measurements_reminder',
  PHOTO_REMINDER: 'photo_reminder',
  IMPEDANCE_REMINDER: 'impedance_reminder'
};

/**
 * Vérifie si les notifications sont supportées par le navigateur
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Vérifie l'état actuel des permissions
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return null;
  }
  return Notification.permission;
};

/**
 * Demande la permission de notification à l'utilisateur
 * @returns {Promise<string>} 'granted', 'denied', ou 'default'
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    log.warn('Notifications non supportées par le navigateur');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    log.debug('Permission notifications', { permission });
    return permission;
  } catch (error) {
    log.error('Erreur lors de la demande de permission', error);
    return null;
  }
};

/**
 * Crée une notification du navigateur
 * @param {Object} options - { title, body, icon, tag, data, actions }
 * @returns {Notification|null} Notification créée ou null si erreur
 */
export const createNotification = (options = {}) => {
  const {
    title = 'Rappel Body Tracking',
    body = '',
    icon = '/logo.png',
    badge = '/logo.png',
    tag = 'body-tracking-reminder',
    data = {},
    requireInteraction = false,
    silent = false,
    sound = null,
    actions = []
  } = options;

  if (!isNotificationSupported()) {
    log.warn('Notifications non supportées');
    return null;
  }

  const permission = getNotificationPermission();
  if (permission !== NOTIFICATION_PERMISSION.GRANTED) {
    log.debug('Permission non accordée', { permission });
    return null;
  }

  try {
    const notificationOptions = {
      body,
      icon,
      badge,
      tag, // Permet de remplacer notifications avec même tag
      data,
      requireInteraction, // Notification reste jusqu'à action utilisateur
      silent,
      // Actions sur la notification (selon support navigateur)
      ...(actions.length > 0 && 'actions' in Notification.prototype ? { actions } : {})
    };

    const notification = new Notification(title, notificationOptions);

    // Gérer clic sur notification
    notification.onclick = (event) => {
      event.preventDefault();
      log.debug('Notification cliquée', { tag, data });
      
      // Ouvrir l'application (focus window si déjà ouverte)
      if (window.focus) {
        window.focus();
      }
      
      // Naviguer vers l'onglet Body Tracking si possible
      if (data.reminderId) {
        // Émettre événement personnalisé pour navigation
        window.dispatchEvent(new CustomEvent('bodyTracking:reminderClick', {
          detail: { reminderId: data.reminderId, type: data.type }
        }));
      }

      notification.close();
    };

    // Gérer fermeture notification
    notification.onclose = () => {
      log.debug('Notification fermée', { tag });
    };

    // Gérer erreur notification
    notification.onerror = (error) => {
      log.error('Erreur notification', error);
    };

    // Jouer son si spécifié et non silencieux
    if (sound && !silent) {
      playNotificationSound(sound);
    }

    return notification;
  } catch (error) {
    log.error('Erreur création notification', error);
    return null;
  }
};

/**
 * Crée une notification pour un rappel Body Tracking
 * @param {Object} reminder - Rappel avec { id, type, title, description, nextTrigger }
 * @returns {Notification|null}
 */
export const createReminderNotification = (reminder) => {
  if (!reminder || !reminder.enabled) {
    return null;
  }

  const notificationConfig = {
    title: `⏰ ${reminder.title}`,
    body: reminder.description || 'Rappel pour votre suivi corporel',
    tag: `reminder-${reminder.id}`,
    data: {
      reminderId: reminder.id,
      type: reminder.type,
      reminderType: reminder.type
    },
    requireInteraction: false,
    silent: reminder.methods && !reminder.methods.includes('sound'),
    sound: reminder.methods && reminder.methods.includes('sound') ? 'default' : null,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/logo.png'
      },
      {
        action: 'snooze',
        title: 'Rappeler dans 1h',
        icon: '/logo.png'
      },
      {
        action: 'complete',
        title: 'Fait',
        icon: '/logo.png'
      }
    ].filter((_, index) => index < 2) // Limiter à 2 actions (max supporté)
  };

  return createNotification(notificationConfig);
};

/**
 * Vérifie et déclenche les notifications pour les rappels échus
 * @param {Array} reminders - Liste des rappels depuis IndexedDB
 * @returns {Array} Rappels dont les notifications ont été déclenchées
 */
export const checkAndTriggerNotifications = (reminders = []) => {
  if (!isNotificationSupported()) {
    return [];
  }

  const permission = getNotificationPermission();
  if (permission !== NOTIFICATION_PERMISSION.GRANTED) {
    return [];
  }

  const now = new Date();
  const triggeredReminders = [];

  reminders.forEach(reminder => {
    if (!reminder.enabled || !reminder.nextTrigger) {
      return;
    }

    // Convertir nextTrigger en Date si c'est une string ISO
    let nextTriggerDate;
    if (reminder.nextTrigger instanceof Date) {
      nextTriggerDate = reminder.nextTrigger;
    } else if (typeof reminder.nextTrigger === 'string') {
      nextTriggerDate = new Date(reminder.nextTrigger);
    } else {
      return;
    }

    // Vérifier si le rappel doit être déclenché (marge de 1 minute pour éviter multi-déclenchements)
    const timeDiff = nextTriggerDate.getTime() - now.getTime();
    const oneMinute = 60 * 1000;

    if (timeDiff >= 0 && timeDiff <= oneMinute) {
      // Déclencher notification
      const notification = createReminderNotification(reminder);
      
      if (notification) {
        triggeredReminders.push(reminder);
        log.info('Notification déclenchée', { 
          reminderId: reminder.id, 
          title: reminder.title,
          type: reminder.type 
        });
      }
    }
  });

  return triggeredReminders;
};

/**
 * Planifie les notifications pour les rappels actifs
 * Utilise setInterval pour vérifier périodiquement les rappels
 * @param {Array} reminders - Liste des rappels
 * @param {Function} onReminderTriggered - Callback appelé quand un rappel est déclenché
 * @returns {Function} Fonction pour arrêter la planification
 */
export const scheduleNotifications = (reminders = [], onReminderTriggered = null) => {
  if (!isNotificationSupported()) {
    return () => {}; // Fonction no-op si non supporté
  }

  // Vérifier toutes les minutes si un rappel doit être déclenché
  const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

  const checkInterval = setInterval(() => {
    const triggered = checkAndTriggerNotifications(reminders);
    
    if (triggered.length > 0 && onReminderTriggered) {
      triggered.forEach(reminder => {
        onReminderTriggered(reminder);
      });
    }
  }, CHECK_INTERVAL_MS);

  // Vérifier immédiatement au démarrage
  const immediateTriggered = checkAndTriggerNotifications(reminders);
  if (immediateTriggered.length > 0 && onReminderTriggered) {
    immediateTriggered.forEach(reminder => {
      onReminderTriggered(reminder);
    });
  }

  // Retourner fonction pour arrêter
  return () => {
    clearInterval(checkInterval);
    log.debug('Planification notifications arrêtée');
  };
};

/**
 * Joue un son de notification
 * @param {string} soundType - 'default', 'gentle', 'urgent'
 */
export const playNotificationSound = (soundType = 'default') => {
  try {
    // Créer audio context pour son
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Fréquence selon type
    const frequencies = {
      default: 800,
      gentle: 600,
      urgent: 1000
    };
    
    const frequency = frequencies[soundType] || frequencies.default;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    log.error('Erreur lecture son notification', error);
  }
};

/**
 * Gère les actions sur les notifications
 * @param {string} action - 'open', 'snooze', 'complete'
 * @param {Object} notificationData - Données de la notification
 */
export const handleNotificationAction = (action, notificationData = {}) => {
  log.debug('Action notification', { action, data: notificationData });

  switch (action) {
    case 'open':
      // Ouvrir app et naviguer vers rappel
      if (window.focus) {
        window.focus();
      }
      window.dispatchEvent(new CustomEvent('bodyTracking:reminderClick', {
        detail: notificationData
      }));
      break;

    case 'snooze':
      // Reporter le rappel de 1 heure
      window.dispatchEvent(new CustomEvent('bodyTracking:reminderSnooze', {
        detail: { ...notificationData, snoozeHours: 1 }
      }));
      break;

    case 'complete':
      // Marquer le rappel comme complété et reprogrammer
      window.dispatchEvent(new CustomEvent('bodyTracking:reminderComplete', {
        detail: notificationData
      }));
      break;

    default:
      log.warn('Action notification inconnue', { action });
  }
};

/**
 * Enregistre le Service Worker pour notifications push hors ligne
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    log.warn('Service Worker non supporté');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    log.info('Service Worker enregistré', { 
      scope: registration.scope,
      active: registration.active ? 'actif' : 'non actif'
    });

    // Attendre que le Service Worker soit actif
    if (registration.installing) {
      registration.installing.addEventListener('statechange', () => {
        if (registration.installing?.state === 'activated') {
          log.info('Service Worker activé et prêt');
        }
      });
    } else if (registration.waiting) {
      registration.waiting.addEventListener('statechange', () => {
        if (registration.waiting?.state === 'activated') {
          log.info('Service Worker activé et prêt');
        }
      });
    }

    // Écouter les messages du Service Worker (pour notifications push)
    navigator.serviceWorker.addEventListener('message', (event) => {
      log.debug('Message Service Worker', event.data);
      
      if (event.data && event.data.type === 'notification-action') {
        const { action, reminderId } = event.data;
        handleNotificationAction(action || 'open', { reminderId });
      } else if (event.data && event.data.type === 'notification-click') {
        handleNotificationAction('open', event.data);
      }
    });

    return registration;
  } catch (error) {
    // Erreur silencieuse si Service Worker non disponible (404, CORS, etc.)
    // Les notifications Browser API fonctionnent toujours sans Service Worker
    log.debug('Service Worker non disponible (fonctionne toujours sans)', { 
      message: error.message 
    });
    return null;
  }
};

/**
 * Calcule le prochain déclenchement pour un rappel
 * @param {Object} reminder - Rappel
 * @returns {Date} Date du prochain déclenchement
 */
export const calculateNextTriggerForReminder = (reminder) => {
  if (!reminder || !reminder.enabled) {
    return null;
  }

  const now = new Date();
  const [hours, minutes] = (reminder.time || '08:00').split(':').map(Number);
  
  let nextDate = new Date();
  nextDate.setHours(hours, minutes, 0, 0);
  
  switch (reminder.frequency) {
    case 'daily':
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = reminder.dayOfWeek != null ? reminder.dayOfWeek : 1;
      const currentDay = nextDate.getDay();
      let daysUntilTarget = (targetDay - currentDay + 7) % 7;
      if (daysUntilTarget === 0 && nextDate <= now) {
        daysUntilTarget = 7;
      }
      nextDate.setDate(nextDate.getDate() + daysUntilTarget);
      break;
      
    case 'biweekly':
      const targetDayBi = reminder.dayOfWeek != null ? reminder.dayOfWeek : 1;
      const currentDayBi = nextDate.getDay();
      let daysUntilTargetBi = (targetDayBi - currentDayBi + 7) % 7;
      if (daysUntilTargetBi === 0 && nextDate <= now) {
        daysUntilTargetBi = 14;
      }
      nextDate.setDate(nextDate.getDate() + daysUntilTargetBi);
      break;
      
    case 'monthly':
      const dayOfMonth = reminder.dayOfMonth != null ? reminder.dayOfMonth : 1;
      nextDate.setDate(dayOfMonth);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
      
    default:
      return null;
  }
  
  return nextDate;
};

