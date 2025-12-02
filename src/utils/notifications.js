/**
 * Service de notifications navigateur
 */

class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      this.permission = 'unsupported';
      return false;
    }

    this.permission = Notification.permission;
    return this.permission === 'granted';
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return null;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }
    }

    const defaultOptions = {
      body: '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'finance-alert',
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  async showFinanceAlert(ticker, message, type = 'info') {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      info: '🔵'
    };

    const icon = icons[type] || icons.info;

    return this.showNotification(`${icon} ${ticker}`, {
      body: message,
      tag: `finance-${ticker}-${Date.now()}`,
      requireInteraction: type === 'critical',
      data: { ticker, type }
    });
  }
}

export const notificationService = new NotificationService();

