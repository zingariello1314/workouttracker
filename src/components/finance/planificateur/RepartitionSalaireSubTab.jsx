import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import { planificateurSync } from '../../../services/finance/planificateurSync';
import { debounce, formatCurrency } from '../../../utils/planificateurUtils';
import logger from '../../../utils/logger';
import RepartitionInterface from './RepartitionInterface';
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

  // Debounced update pour éviter trop de requêtes
  const debouncedUpdateRepartition = useMemo(
    () => debounce(async (finalRepartition) => {
      try {
        await updateRepartition(finalRepartition);
        
        // Synchroniser avec autres modules
        try {
          await planificateurSync.propagateRepartitionChange(finalRepartition);
          const notifications = planificateurSync.getNotifications(finalRepartition);
          if (notifications.length > 0) {
            const notif = notifications[0];
            showToast(`${notif.icon} ${notif.message}`, 'info');
          }
        } catch (syncError) {
          log.warn('Sync error (non-blocking):', syncError);
        }
      } catch (error) {
        showToast('Erreur lors de la mise à jour', 'error');
      }
    }, 500), // Attendre 500ms après dernière modification
    [updateRepartition, showToast]
  );

  // Mise à jour répartition avec validation et debounce
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
      // Update UI immédiatement (optimistic)
      setLocalRepartition(newRepartition);
      
      // Calculer surplus automatiquement
      const surplus = localSalaire - newTotal;
      const finalRepartition = {
        ...newRepartition,
        surplus: surplus
      };
      
      // Debounced save (au lieu de await direct)
      debouncedUpdateRepartition(finalRepartition);
    } else {
      showToast('Dépassement du salaire !', 'warning');
    }
  }, [localRepartition, localSalaire, debouncedUpdateRepartition, showToast]);

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

      {/* Interface Révolutionnaire */}
      <RepartitionInterface
        salaire={localSalaire}
        repartition={localRepartition}
        onRepartitionChange={handleRepartitionChange}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default RepartitionSalaireSubTab;
