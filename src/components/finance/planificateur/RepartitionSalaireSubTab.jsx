import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import { planificateurSync } from '../../../services/finance/planificateurSync';
import logger from '../../../utils/logger';
import RepartitionControl from './RepartitionControl';
import RepartitionChart from './RepartitionChart';
import SkeletonLoader from '../bourse/SkeletonLoader';

const log = logger.module('RepartitionSalaireSubTab');

const RepartitionSalaireSubTab = () => {
  const t = useTranslation();
  const { salaire, repartition, updateSalaire, updateRepartition, loading } = usePlanificateur();
  const { showToast } = useToast();
  const [localSalaire, setLocalSalaire] = useState(salaire?.netMensuel || 3000);
  const [localRepartition, setLocalRepartition] = useState(repartition || {
    loyer: 800,
    investissementOr: 300,
    investissementBourse: 500,
    cashAccumulation: 200,
    loisirs: 400,
    surplus: 800
  });

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  // Calcul total alloué
  const totalAlloue = useMemo(() => {
    return Object.values(localRepartition).reduce((sum, val) => sum + (val || 0), 0);
  }, [localRepartition]);

  // Écart vs salaire
  const ecart = useMemo(() => {
    return localSalaire - totalAlloue;
  }, [localSalaire, totalAlloue]);

  // Mise à jour salaire
  const handleSalaireChange = useCallback(async (newSalaire) => {
    const salaireNum = parseFloat(newSalaire) || 0;
    if (salaireNum < 0) return;

    setLocalSalaire(salaireNum);
    try {
      await updateSalaire({ netMensuel: salaireNum });
      showToast('Salaire mis à jour', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  }, [updateSalaire, showToast]);

  // Mise à jour répartition avec validation
  const handleRepartitionChange = useCallback(async (key, value) => {
    const valueNum = parseFloat(value) || 0;
    if (valueNum < 0) return;

    const newRepartition = {
      ...localRepartition,
      [key]: valueNum
    };
    
    const newTotal = Object.values(newRepartition).reduce((sum, val) => sum + (val || 0), 0);
    
    // Validation : ne pas dépasser salaire
    if (newTotal <= localSalaire) {
      setLocalRepartition(newRepartition);
      
      // Calculer surplus automatiquement
      const surplus = localSalaire - newTotal;
      const finalRepartition = {
        ...newRepartition,
        surplus: surplus
      };
      
      try {
        await updateRepartition(finalRepartition);
        
        // Synchroniser avec autres modules
        try {
          await planificateurSync.propagateRepartitionChange(finalRepartition);
          const notifications = planificateurSync.getNotifications(finalRepartition);
          if (notifications.length > 0) {
            // Afficher la première notification
            const notif = notifications[0];
            showToast(`${notif.icon} ${notif.message}`, 'info');
          }
        } catch (syncError) {
          log.warn('Sync error (non-blocking):', syncError);
        }
      } catch (error) {
        showToast('Erreur lors de la mise à jour', 'error');
      }
    } else {
      showToast('Dépassement du salaire !', 'warning');
    }
  }, [localRepartition, localSalaire, updateRepartition, showToast]);

  // Synchroniser avec les données chargées
  React.useEffect(() => {
    if (salaire?.netMensuel) {
      setLocalSalaire(salaire.netMensuel);
    }
  }, [salaire]);

  React.useEffect(() => {
    if (repartition) {
      setLocalRepartition(repartition);
    }
  }, [repartition]);

  if (loading) {
    return <SkeletonLoader />;
  }

  const repartitionItems = [
    { key: 'loyer', label: 'Loyer', icon: '🏠', color: '#ef4444' },
    { key: 'investissementOr', label: 'Investissement Or', icon: '🥇', color: '#eab308' },
    { key: 'investissementBourse', label: 'Investissement Bourse', icon: '📈', color: '#3b82f6' },
    { key: 'cashAccumulation', label: 'Cash Accumulation', icon: '💰', color: '#10b981' },
    { key: 'loisirs', label: 'Loisirs', icon: '🎮', color: '#8b5cf6' },
    { key: 'surplus', label: 'Surplus/Sécurité', icon: '💎', color: '#6b7280' }
  ];

  return (
    <div className="repartition-salaire-sub-tab space-y-6">
      <h3 className="text-2xl font-bold text-white mb-6">
        {t('finance.planificateur.repartition.title')}
      </h3>

      {/* Configuration Salaire */}
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-lg font-semibold text-white">
            Salaire Net Mensuel
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={localSalaire}
              onChange={(e) => handleSalaireChange(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg font-bold w-40"
              min="0"
              step="50"
            />
            <span className="text-slate-400">€/mois</span>
          </div>
        </div>
      </div>

      {/* Contrôle Répartition */}
      <RepartitionControl
        salaire={localSalaire}
        repartition={localRepartition}
        ecart={ecart}
        onRepartitionChange={handleRepartitionChange}
        formatCurrency={formatCurrency}
      />

      {/* Sliders Interactifs */}
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Répartition Détaillée</h4>
        <div className="space-y-4">
          {repartitionItems.map((item) => {
            const value = localRepartition[item.key] || 0;
            const pourcent = localSalaire > 0 ? (value / localSalaire) * 100 : 0;

            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-slate-300">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{pourcent.toFixed(1)}%</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleRepartitionChange(item.key, e.target.value)}
                      className="px-3 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm font-semibold w-32 text-right"
                      min="0"
                      step="10"
                    />
                    <span className="text-slate-400 text-sm">€</span>
                  </div>
                </div>
                <input
                  type="range"
                  value={value}
                  min="0"
                  max={localSalaire}
                  step="10"
                  onChange={(e) => handleRepartitionChange(item.key, e.target.value)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, ${item.color} 0%, ${item.color} ${pourcent}%, #334155 ${pourcent}%, #334155 100%)`
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphique Répartition */}
      <RepartitionChart
        repartition={localRepartition}
        salaire={localSalaire}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default RepartitionSalaireSubTab;
