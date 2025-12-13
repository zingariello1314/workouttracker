/**
 * Système de notifications d'erreur pour la sidebar
 * Affiche les notifications d'erreur de manière non-intrusive avec actions de récupération
 * 
 * Requirements: 14.5 - Notifications d'erreur utilisateur-friendly
 * 
 * @component ErrorNotificationSystem
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Settings, 
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * Types de notifications
 */
const NOTIFICATION_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
};

/**
 * Niveaux de sévérité
 */
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Configuration des icônes par type
 */
const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.ERROR]: XCircle,
  [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
  [NOTIFICATION_TYPES.INFO]: Info,
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircle
};

/**
 * Configuration des couleurs par sévérité
 */
const SEVERITY_STYLES = {
  [SEVERITY_LEVELS.LOW]: {
    container: 'bg-blue-900/20 border-blue-500/30',
    icon: 'text-blue-400',
    text: 'text-blue-100',
    button: 'bg-blue-600/50 hover:bg-blue-600/70 text-blue-100'
  },
  [SEVERITY_LEVELS.MEDIUM]: {
    container: 'bg-yellow-900/20 border-yellow-500/30',
    icon: 'text-yellow-400',
    text: 'text-yellow-100',
    button: 'bg-yellow-600/50 hover:bg-yellow-600/70 text-yellow-100'
  },
  [SEVERITY_LEVELS.HIGH]: {
    container: 'bg-red-900/20 border-red-500/30',
    icon: 'text-red-400',
    text: 'text-red-100',
    button: 'bg-red-600/50 hover:bg-red-600/70 text-red-100'
  },
  [SEVERITY_LEVELS.CRITICAL]: {
    container: 'bg-red-900/40 border-red-400/50',
    icon: 'text-red-300',
    text: 'text-red-100',
    button: 'bg-red-500/60 hover:bg-red-500/80 text-red-100'
  }
};

/**
 * Composant de notification individuelle
 */
const ErrorNotification = ({ 
  notification, 
  onAction, 
  onDismiss, 
  isExpanded, 
  onToggleExpand 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const severity = notification.severity || SEVERITY_LEVELS.MEDIUM;
  const styles = SEVERITY_STYLES[severity];
  const IconComponent = NOTIFICATION_ICONS[notification.type] || AlertTriangle;
  
  // Animation d'entrée
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Gestion de la fermeture avec animation
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, onDismiss]);
  
  // Auto-dismiss pour les notifications non-critiques
  useEffect(() => {
    if (notification.duration && severity !== SEVERITY_LEVELS.CRITICAL) {
      const timer = setTimeout(handleDismiss, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, severity, handleDismiss]);
  
  // Gestion des actions
  const handleAction = useCallback((action) => {
    onAction(notification.id, action);
    
    // Fermer automatiquement après certaines actions
    if (['dismiss', 'ok'].includes(action.action)) {
      handleDismiss();
    }
  }, [notification.id, onAction, handleDismiss]);
  
  return (
    <div
      className={`
        transform transition-all duration-300 ease-out mb-2
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${styles.container} border rounded-lg p-3 shadow-lg backdrop-blur-sm
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* Titre et message */}
          <div className={`${styles.text}`}>
            {notification.title && (
              <h4 className="font-medium text-sm mb-1 truncate">
                {notification.title}
              </h4>
            )}
            <p className="text-sm opacity-90">
              {notification.message}
            </p>
          </div>
          
          {/* Détails expandables */}
          {notification.details && (
            <div className="mt-2">
              <button
                onClick={onToggleExpand}
                className={`text-xs ${styles.text} opacity-70 hover:opacity-100 transition-opacity`}
              >
                {isExpanded ? 'Masquer les détails' : 'Voir les détails'}
              </button>
              
              {isExpanded && (
                <div className={`mt-2 p-2 bg-black/20 rounded text-xs ${styles.text} opacity-80 font-mono`}>
                  {notification.details}
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className={`
                    px-3 py-1 text-xs rounded transition-colors
                    ${styles.button}
                    ${action.primary ? 'font-medium' : 'opacity-80 hover:opacity-100'}
                  `}
                >
                  {action.icon && (
                    <action.icon className="w-3 h-3 mr-1 inline" />
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Bouton de fermeture */}
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${styles.icon} opacity-60 hover:opacity-100 transition-opacity`}
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Barre de progression pour auto-dismiss */}
      {notification.duration && severity !== SEVERITY_LEVELS.CRITICAL && (
        <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
          <div
            className={`h-full ${styles.icon.replace('text-', 'bg-')} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Composant principal du système de notifications
 */
const ErrorNotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Gestion de l'état de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Écouter les événements de notification
  useEffect(() => {
    const handleNotification = (event) => {
      const { detail } = event;
      
      const notification = {
        id: Date.now() + Math.random(),
        type: detail.type || NOTIFICATION_TYPES.ERROR,
        severity: detail.severity || SEVERITY_LEVELS.MEDIUM,
        title: detail.title,
        message: detail.message,
        details: detail.details,
        actions: detail.actions || [],
        duration: detail.duration || (detail.severity === SEVERITY_LEVELS.CRITICAL ? 0 : 5000),
        timestamp: Date.now()
      };
      
      setNotifications(prev => [...prev, notification]);
    };
    
    const handlePersistentNotification = (event) => {
      const { detail } = event;
      
      const notification = {
        id: Date.now() + Math.random(),
        type: detail.type || NOTIFICATION_TYPES.ERROR,
        severity: SEVERITY_LEVELS.CRITICAL,
        title: detail.title || 'Action requise',
        message: detail.message,
        details: detail.details,
        actions: detail.actions || [{ label: 'OK', action: 'dismiss' }],
        duration: 0, // Persistante
        timestamp: Date.now()
      };
      
      setNotifications(prev => [...prev, notification]);
    };
    
    // Événements du service d'erreur
    window.addEventListener('sidebar:notification:show', handleNotification);
    window.addEventListener('sidebar:notification:persistent', handlePersistentNotification);
    
    // Événements de connexion
    window.addEventListener('offline', () => {
      handleNotification({
        detail: {
          type: NOTIFICATION_TYPES.WARNING,
          severity: SEVERITY_LEVELS.MEDIUM,
          title: 'Connexion perdue',
          message: 'Mode hors ligne activé. Certaines fonctionnalités peuvent être limitées.',
          actions: [
            { label: 'Réessayer', action: 'retry', icon: RefreshCw },
            { label: 'OK', action: 'dismiss' }
          ],
          duration: 8000
        }
      });
    });
    
    window.addEventListener('online', () => {
      handleNotification({
        detail: {
          type: NOTIFICATION_TYPES.SUCCESS,
          severity: SEVERITY_LEVELS.LOW,
          title: 'Connexion rétablie',
          message: 'Toutes les fonctionnalités sont à nouveau disponibles.',
          duration: 3000
        }
      });
    });
    
    return () => {
      window.removeEventListener('sidebar:notification:show', handleNotification);
      window.removeEventListener('sidebar:notification:persistent', handlePersistentNotification);
    };
  }, []);
  
  // Gestion des actions de notification
  const handleNotificationAction = useCallback((notificationId, action) => {
    console.log(`[ErrorNotificationSystem] Action triggered:`, { notificationId, action });
    
    // Émettre l'événement d'action
    window.dispatchEvent(new CustomEvent('sidebar:notification:action', {
      detail: {
        notificationId,
        action: action.action,
        data: action.data
      }
    }));
    
    // Actions spéciales
    switch (action.action) {
      case 'retry':
        window.dispatchEvent(new CustomEvent('sidebar:error:retry', {
          detail: { notificationId }
        }));
        break;
        
      case 'reconnect':
        window.dispatchEvent(new CustomEvent('sidebar:sync:reconnect', {
          detail: { notificationId }
        }));
        break;
        
      case 'reload':
        window.dispatchEvent(new CustomEvent('sidebar:data:reload', {
          detail: { notificationId }
        }));
        break;
        
      case 'check_network':
        // Vérifier la connectivité
        if (navigator.onLine) {
          handleNotificationAction(notificationId, { action: 'dismiss' });
          window.dispatchEvent(new CustomEvent('sidebar:notification:show', {
            detail: {
              type: NOTIFICATION_TYPES.SUCCESS,
              message: 'Connexion réseau active',
              duration: 2000
            }
          }));
        } else {
          window.dispatchEvent(new CustomEvent('sidebar:notification:show', {
            detail: {
              type: NOTIFICATION_TYPES.ERROR,
              message: 'Aucune connexion réseau détectée',
              duration: 3000
            }
          }));
        }
        break;
        
      case 'report':
        // Ouvrir un formulaire de rapport d'erreur
        window.dispatchEvent(new CustomEvent('sidebar:error:report', {
          detail: { notificationId }
        }));
        break;
        
      case 'settings':
        // Naviguer vers les paramètres
        window.location.hash = '#/settings';
        break;
    }
  }, []);
  
  // Fermeture de notification
  const handleDismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, []);
  
  // Toggle expansion des détails
  const handleToggleExpand = useCallback((notificationId) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  }, []);
  
  // Nettoyer les anciennes notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoff = Date.now() - (10 * 60 * 1000); // 10 minutes
      setNotifications(prev => prev.filter(n => 
        n.timestamp > cutoff || n.severity === SEVERITY_LEVELS.CRITICAL
      ));
    }, 60 * 1000); // Chaque minute
    
    return () => clearInterval(cleanup);
  }, []);
  
  // Indicateur de connexion
  const ConnectionIndicator = () => (
    <div className={`
      fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-sm
      transition-all duration-300
      ${isOnline 
        ? 'bg-green-900/20 border border-green-500/30 text-green-100' 
        : 'bg-red-900/20 border border-red-500/30 text-red-100'
      }
    `}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-400" />
          <span>En ligne</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-400" />
          <span>Hors ligne</span>
        </>
      )}
    </div>
  );
  
  if (notifications.length === 0) {
    return <ConnectionIndicator />;
  }
  
  return (
    <>
      <ConnectionIndicator />
      
      {/* Container des notifications */}
      <div className="fixed top-16 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
        <div className="space-y-2">
          {notifications
            .sort((a, b) => {
              // Trier par sévérité puis par timestamp
              const severityOrder = {
                [SEVERITY_LEVELS.CRITICAL]: 4,
                [SEVERITY_LEVELS.HIGH]: 3,
                [SEVERITY_LEVELS.MEDIUM]: 2,
                [SEVERITY_LEVELS.LOW]: 1
              };
              
              const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
              if (severityDiff !== 0) return severityDiff;
              
              return b.timestamp - a.timestamp;
            })
            .map(notification => (
              <ErrorNotification
                key={notification.id}
                notification={notification}
                onAction={handleNotificationAction}
                onDismiss={handleDismissNotification}
                isExpanded={expandedNotifications.has(notification.id)}
                onToggleExpand={() => handleToggleExpand(notification.id)}
              />
            ))}
        </div>
      </div>
      
      {/* Styles CSS pour l'animation de la barre de progression */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
};

export default ErrorNotificationSystem;