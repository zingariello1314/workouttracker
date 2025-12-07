/**
 * CrossModuleNotifications - Notifications intelligentes entre modules
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Info,
  X,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import Button from '../../ui/Button';

const CrossModuleNotifications = ({ 
  repartition, 
  previousRepartition,
  achatsLoisirs = [],
  onNavigate 
}) => {
  const t = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Générer notifications basées sur les changements
  useEffect(() => {
    if (!repartition || !previousRepartition) return;

    const newNotifications = [];

    // Changement budget loisirs
    if (repartition.loisirs !== previousRepartition.loisirs) {
      const diff = repartition.loisirs - previousRepartition.loisirs;
      const achatsImpactes = achatsLoisirs.filter(achat => {
        // Recalculer faisabilité avec nouveau budget
        return achat.statut === 'planifie';
      });

      newNotifications.push({
        id: `loisirs-${Date.now()}`,
        type: diff > 0 ? 'success' : 'warning',
        module: 'loisirs',
        title: diff > 0 
          ? `Budget loisirs augmenté de ${diff}€`
          : `Budget loisirs réduit de ${Math.abs(diff)}€`,
        message: achatsImpactes.length > 0
          ? `${achatsImpactes.length} achat${achatsImpactes.length > 1 ? 's' : ''} impacté${achatsImpactes.length > 1 ? 's' : ''}`
          : 'Aucun achat impacté',
        action: achatsImpactes.length > 0 ? {
          label: 'Voir les achats',
          target: 'loisirs'
        } : null,
        timestamp: new Date()
      });
    }

    // Changement investissement Or
    if (repartition.investissementOr !== previousRepartition.investissementOr) {
      const diff = repartition.investissementOr - previousRepartition.investissementOr;
      newNotifications.push({
        id: `or-${Date.now()}`,
        type: 'info',
        module: 'investissements',
        title: `DCA Or ${diff > 0 ? 'augmenté' : 'réduit'} de ${Math.abs(diff)}€`,
        message: `Nouveau montant mensuel : ${repartition.investissementOr}€`,
        action: {
          label: 'Voir investissements',
          target: 'investissements'
        },
        timestamp: new Date()
      });
    }

    // Changement investissement Bourse
    if (repartition.investissementBourse !== previousRepartition.investissementBourse) {
      const diff = repartition.investissementBourse - previousRepartition.investissementBourse;
      newNotifications.push({
        id: `bourse-${Date.now()}`,
        type: 'info',
        module: 'investissements',
        title: `DCA Bourse ${diff > 0 ? 'augmenté' : 'réduit'} de ${Math.abs(diff)}€`,
        message: `Nouveau montant mensuel : ${repartition.investissementBourse}€`,
        action: {
          label: 'Voir investissements',
          target: 'investissements'
        },
        timestamp: new Date()
      });
    }

    // Changement cash accumulation
    if (repartition.cashAccumulation !== previousRepartition.cashAccumulation) {
      const diff = repartition.cashAccumulation - previousRepartition.cashAccumulation;
      newNotifications.push({
        id: `cash-${Date.now()}`,
        type: 'info',
        module: 'investissements',
        title: `Épargne cash ${diff > 0 ? 'augmentée' : 'réduite'} de ${Math.abs(diff)}€`,
        message: `Nouveau montant mensuel : ${repartition.cashAccumulation}€`,
        action: {
          label: 'Voir investissements',
          target: 'investissements'
        },
        timestamp: new Date()
      });
    }

    // Surplus disponible
    if (repartition.surplus > 0 && repartition.surplus !== previousRepartition.surplus) {
      newNotifications.push({
        id: `surplus-${Date.now()}`,
        type: 'success',
        module: 'repartition',
        title: `Surplus disponible : ${repartition.surplus}€`,
        message: 'Vous pouvez allouer ce montant à une catégorie',
        action: {
          label: 'Ajuster répartition',
          target: 'repartition'
        },
        timestamp: new Date()
      });
    }

    setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Garder max 10
  }, [repartition, previousRepartition, achatsLoisirs]);

  // Filtrer notifications non-dismissées
  const visibleNotifications = useMemo(() => {
    return notifications.filter(notif => !dismissedIds.has(notif.id));
  }, [notifications, dismissedIds]);

  const handleDismiss = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleAction = (notification) => {
    if (notification.action && onNavigate) {
      onNavigate(notification.action.target);
    }
    handleDismiss(notification.id);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return {
        bg: 'bg-emerald-900/20',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        icon: 'text-emerald-400'
      };
      case 'warning': return {
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        icon: 'text-yellow-400'
      };
      case 'error': return {
        bg: 'bg-red-900/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        icon: 'text-red-400'
      };
      case 'info': return {
        bg: 'bg-blue-900/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        icon: 'text-blue-400'
      };
      default: return {
        bg: 'bg-slate-800/50',
        border: 'border-slate-600',
        text: 'text-slate-300',
        icon: 'text-slate-400'
      };
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="cross-module-notifications space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-blue-400" />
        <h4 className="text-lg font-semibold text-white">
          Notifications ({visibleNotifications.length})
        </h4>
      </div>

      <div className="space-y-2">
        {visibleNotifications.map(notification => {
          const Icon = getIcon(notification.type);
          const colors = getColors(notification.type);

          return (
            <div
              key={notification.id}
              className={`notification-card ${colors.bg} border-2 ${colors.border} rounded-lg p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-slate-900/50 ${colors.icon} flex-shrink-0`}>
                  <Icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h5 className={`font-semibold ${colors.text}`}>
                      {notification.title}
                    </h5>
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p className="text-sm text-slate-300 mb-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {notification.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>

                    {notification.action && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(notification)}
                        className={`${colors.text} hover:bg-slate-800/50`}
                      >
                        {notification.action.label}
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleNotifications.length > 3 && (
        <button
          onClick={() => setDismissedIds(new Set(notifications.map(n => n.id)))}
          className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-2"
        >
          Tout effacer
        </button>
      )}
    </div>
  );
};

export default CrossModuleNotifications;
