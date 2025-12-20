/**
 * Service d'alertes intelligentes pour le portfolio
 */

import { financeStorage } from './financeStorage';
import logger from '../../utils/logger';
import { notificationService } from '../../utils/notifications';

const log = logger.module('financeAlerts');

class FinanceAlertsService {
  constructor() {
    this.alerts = [];
    this.subscribers = new Set();
    this.checkInterval = null;
  }

  /**
   * Vérifier toutes les alertes pour un portfolio
   */
  async checkAlerts(portfolio, historicalDataMap = {}) {
    const alerts = [];

    for (const position of portfolio) {
      // 1. Alertes seuils gains/pertes
      const gainLossAlerts = this.checkGainLossThresholds(position);
      alerts.push(...gainLossAlerts);

      // 2. Alertes techniques (avec historique si disponible)
      const historicalData = historicalDataMap[position.ticker] || [];
      const technicalAlerts = await this.checkTechnicalSignals(position, historicalData);
      alerts.push(...technicalAlerts);
    }

    // Trier par priorité
    alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.alerts = alerts;
    this.notifySubscribers();
    return alerts;
  }

  /**
   * Vérifier seuils gains/pertes avec seuils personnalisés
   */
  checkGainLossThresholds(position) {
    const alerts = [];
    const { plusValuePourcent } = position.calculs || {};
    const settings = position.settings || {};
    
    // Seuils personnalisés ou par défaut
    const seuils = {
      gain: settings.seuilGain || 20,
      perte: settings.seuilPerte || -10,
      perteSevere: settings.seuilPerteSevere || -20
    };

    if (plusValuePourcent === undefined) return alerts;

    // Alerte gain
    if (plusValuePourcent >= seuils.gain) {
      const alert = {
        id: `gain_${position.id}_${Date.now()}`,
        type: 'GAIN_THRESHOLD',
        priority: 'high',
        ticker: position.ticker,
        message: `${position.ticker} : Objectif gain atteint (+${plusValuePourcent.toFixed(2)}%)`,
        action: 'PRENDRE_PROFITS',
        timestamp: Date.now()
      };
      alerts.push(alert);
      
      // Notification navigateur
      if (settings.notifications !== false) {
        notificationService.showFinanceAlert(
          position.ticker,
          `Gain de +${plusValuePourcent.toFixed(2)}% atteint`,
          'high'
        );
      }
    }

    // Alerte perte
    if (plusValuePourcent <= seuils.perte) {
      const alert = {
        id: `perte_${position.id}_${Date.now()}`,
        type: 'LOSS_THRESHOLD',
        priority: 'critical',
        ticker: position.ticker,
        message: `${position.ticker} : Seuil perte atteint (${plusValuePourcent.toFixed(2)}%)`,
        action: 'SURVEILLANCE',
        timestamp: Date.now()
      };
      alerts.push(alert);
      
      // Notification navigateur
      if (settings.notifications !== false) {
        notificationService.showFinanceAlert(
          position.ticker,
          `Perte de ${plusValuePourcent.toFixed(2)}% détectée`,
          'critical'
        );
      }
    }

    // Alerte perte sévère
    if (plusValuePourcent <= seuils.perteSevere) {
      const alert = {
        id: `perte_severe_${position.id}_${Date.now()}`,
        type: 'LOSS_SEVERE',
        priority: 'critical',
        ticker: position.ticker,
        message: `${position.ticker} : Perte sévère (${plusValuePourcent.toFixed(2)}%) - Action requise`,
        action: 'REÉVALUER',
        timestamp: Date.now()
      };
      alerts.push(alert);
      
      // Notification navigateur
      if (settings.notifications !== false) {
        notificationService.showFinanceAlert(
          position.ticker,
          `Perte sévère de ${plusValuePourcent.toFixed(2)}% - Action requise`,
          'critical'
        );
      }
    }

    return alerts;
  }

  /**
   * Vérifier signaux techniques avec détection croisements MA
   */
  async checkTechnicalSignals(position, historicalData = []) {
    const alerts = [];
    const { prixActuel, ma50, ma200 } = position.yahooData || {};
    const { calculs } = position;
    const settings = position.settings || {};

    if (!prixActuel) return alerts;

    // Détection croisement MA (nécessite historique)
    if (historicalData && historicalData.length >= 2) {
      const recent = historicalData.slice(-2);
      const prevPrice = recent[0]?.close || recent[0]?.prixActuel;
      const currentPrice = recent[1]?.close || recent[1]?.prixActuel || prixActuel;
      
      // ✅ OPTIMISATION Phase 2.3 : Calcul MA optimisé (algorithme incrémental O(n))
      // Note: Accès par index est déjà O(1), mais on garde l'algorithme optimisé
      const { calculateMovingAverages } = require('./financeCalculations');
      const ma50Data = calculateMovingAverages(historicalData.slice(-51), 50);
      const ma200Data = calculateMovingAverages(historicalData.slice(-201), 200);
      
      // Accès O(1) par index (déjà optimal)
      if (ma50Data.data.length >= 2 && ma200Data.data.length >= 2) {
        const prevMA50 = ma50Data.data[ma50Data.data.length - 2]?.value;
        const currentMA50 = ma50Data.data[ma50Data.data.length - 1]?.value;
        const prevMA200 = ma200Data.data[ma200Data.data.length - 2]?.value;
        const currentMA200 = ma200Data.data[ma200Data.data.length - 1]?.value;
        
        // Détection croisement haussier (Golden Cross)
        if (prevMA50 <= prevMA200 && currentMA50 > currentMA200) {
          const alert = {
            id: `golden_cross_${position.id}_${Date.now()}`,
            type: 'GOLDEN_CROSS',
            priority: 'high',
            ticker: position.ticker,
            message: `${position.ticker} : Golden Cross détecté (MA50 > MA200) - Signal haussier`,
            action: 'SIGNAL_ACHAT',
            timestamp: Date.now()
          };
          alerts.push(alert);
          
          if (settings.notifications !== false) {
            notificationService.showFinanceAlert(
              position.ticker,
              'Golden Cross détecté - Signal haussier',
              'high'
            );
          }
        }
        
        // Détection croisement baissier (Death Cross)
        if (prevMA50 >= prevMA200 && currentMA50 < currentMA200) {
          const alert = {
            id: `death_cross_${position.id}_${Date.now()}`,
            type: 'DEATH_CROSS',
            priority: 'critical',
            ticker: position.ticker,
            message: `${position.ticker} : Death Cross détecté (MA50 < MA200) - Signal baissier`,
            action: 'SIGNAL_VENTE',
            timestamp: Date.now()
          };
          alerts.push(alert);
          
          if (settings.notifications !== false) {
            notificationService.showFinanceAlert(
              position.ticker,
              'Death Cross détecté - Signal baissier',
              'critical'
            );
          }
        }
      }
    }

    // Alerte cassure MA50 (basique)
    const signal = calculs?.signal;
    if (signal && signal.signal !== 'NEUTRE') {
      alerts.push({
        id: `signal_${position.id}_${Date.now()}`,
        type: 'TECHNICAL_SIGNAL',
        priority: signal.signal === 'ACHAT' ? 'medium' : 'high',
        ticker: position.ticker,
        message: `${position.ticker} : Signal technique ${signal.signal} détecté`,
        action: signal.signal === 'ACHAT' ? 'SIGNAL_ACHAT' : 'SIGNAL_VENTE',
        timestamp: Date.now()
      });
    }

    // Alerte position vs MA
    if (ma50) {
      const distanceMA50 = Math.abs((prixActuel - ma50) / ma50) * 100;
      if (distanceMA50 < 2) {
        alerts.push({
          id: `ma50_close_${position.id}_${Date.now()}`,
          type: 'MA_CLOSE',
          priority: 'low',
          ticker: position.ticker,
          message: `${position.ticker} : Prix très proche de la MA50 (${distanceMA50.toFixed(2)}%)`,
          action: 'SURVEILLANCE',
          timestamp: Date.now()
        });
      }
    }

    return alerts;
  }

  /**
   * Monitoring continu
   */
  startMonitoring(portfolio, interval = 60000) {
    this.stopMonitoring();
    this.checkInterval = setInterval(async () => {
      await this.checkAlerts(portfolio);
    }, interval);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Système abonnement (Observer pattern)
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.alerts);
      } catch (error) {
        log.error('Error in alert subscriber:', error);
      }
    });
  }
}

export const financeAlertsService = new FinanceAlertsService();

