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
    surplus: 800,
    categories: []
  });

  // Calcul total alloué (catégories fixes + personnalisées, hors surplus)
  const totalAlloue = useMemo(() => {
    const fixedTotal = ['loyer', 'investissementOr', 'investissementBourse', 'cashAccumulation', 'loisirs']
      .reduce((sum, key) => sum + (localRepartition[key] || 0), 0);
    const categoriesTotal = (localRepartition.categories || [])
      .reduce((sum, cat) => sum + (cat.montant || 0), 0);
    return fixedTotal + categoriesTotal;
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

  const REPARTITION_KEYS_SANS_SURPLUS = ['loyer', 'investissementOr', 'investissementBourse', 'cashAccumulation', 'loisirs'];

  // Mise à jour répartition avec validation et debounce
  const handleRepartitionChange = useCallback(
    async (change) => {
      // change = { kind: 'fixed' | 'custom', key?, id?, value }
      const valueNum = parseFloat(change.value) || 0;
      if (valueNum < 0) return;

      let baseRepartition = { ...localRepartition };

      if (change.kind === 'fixed') {
        if (change.key === 'surplus') return;
        baseRepartition = {
          ...baseRepartition,
          [change.key]: valueNum
        };
      } else if (change.kind === 'custom') {
        const categories = (baseRepartition.categories || []).map((cat) =>
          cat.id === change.id ? { ...cat, montant: valueNum } : cat
        );
        baseRepartition = {
          ...baseRepartition,
          categories
        };
      }

      const fixedTotal = REPARTITION_KEYS_SANS_SURPLUS
        .reduce((sum, k) => sum + (baseRepartition[k] || 0), 0);
      const categoriesTotal = (baseRepartition.categories || [])
        .reduce((sum, cat) => sum + (cat.montant || 0), 0);

      const totalSansSurplus = fixedTotal + categoriesTotal;
      const surplus = localSalaire - totalSansSurplus;

      const finalRepartition = {
        ...baseRepartition,
        surplus
      };

      setLocalRepartition(finalRepartition);

      if (totalSansSurplus > localSalaire) {
        showToast('Dépassement du salaire : ajustez les autres catégories ou acceptez un surplus négatif.', 'warning');
      }

      debouncedUpdateRepartition(finalRepartition);
    },
    [localRepartition, localSalaire, debouncedUpdateRepartition, showToast]
  );

  // Synchroniser avec les données chargées
  React.useEffect(() => {
    if (salaire?.netMensuel) {
      setLocalSalaire(salaire.netMensuel);
    }
  }, [salaire]);

  React.useEffect(() => {
    if (repartition) {
      const base = {
        loyer: repartition.loyer || 0,
        investissementOr: repartition.investissementOr || 0,
        investissementBourse: repartition.investissementBourse || 0,
        cashAccumulation: repartition.cashAccumulation || 0,
        loisirs: repartition.loisirs || 0,
        categories: repartition.categories || []
      };
      const salaireNum = salaire?.netMensuel || localSalaire;
      const totalSansSurplus = REPARTITION_KEYS_SANS_SURPLUS
        .reduce((sum, k) => sum + (base[k] || 0), 0);
      const surplus = typeof repartition.surplus === 'number'
        ? repartition.surplus
        : salaireNum - totalSansSurplus;

      setLocalRepartition({
        ...base,
        surplus
      });
    }
  }, [repartition, salaire, localSalaire]);

  // Création de catégorie personnalisée
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🧩');
  const [newCatType, setNewCatType] = useState('loisirs');
  const [newCatAmount, setNewCatAmount] = useState(0);

  const EMOJI_OPTIONS = [
    '🏠','🍔','🛒','🚗','🎮','🎧','📚','💻','💄','🐾','✈️','🎁','💡','📈','💰'
  ];

  const handleCreateCategory = useCallback(() => {
    const label = newCatLabel.trim();
    const amount = parseFloat(newCatAmount) || 0;
    if (!label || amount < 0) return;

    const id = `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const newCategory = {
      id,
      label,
      emoji: newCatEmoji || '🧩',
      type: newCatType,
      montant: amount
    };

    const updatedCategories = [...(localRepartition.categories || []), newCategory];

    const fixedTotal = REPARTITION_KEYS_SANS_SURPLUS
      .reduce((sum, k) => sum + (localRepartition[k] || 0), 0);
    const categoriesTotal = updatedCategories.reduce((sum, cat) => sum + (cat.montant || 0), 0);
    const totalSansSurplus = fixedTotal + categoriesTotal;
    const surplus = localSalaire - totalSansSurplus;

    const finalRepartition = {
      ...localRepartition,
      categories: updatedCategories,
      surplus
    };

    setLocalRepartition(finalRepartition);
    debouncedUpdateRepartition(finalRepartition);

    setShowNewCategory(false);
    setNewCatLabel('');
    setNewCatEmoji('🧩');
    setNewCatType('loisirs');
    setNewCatAmount(0);
  }, [REPARTITION_KEYS_SANS_SURPLUS, localRepartition, localSalaire, debouncedUpdateRepartition, newCatAmount, newCatEmoji, newCatLabel, newCatType]);

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
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 mb-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          onClick={() => setShowNewCategory(true)}
        >
          + Ajouter une catégorie
        </button>
      </div>

      {showNewCategory && (
        <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-slate-400 mb-1">Nom</label>
              <input
                type="text"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
                placeholder="Ex: Abonnement Apple Music"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-slate-400 mb-1">Emoji</label>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-5 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatEmoji(emoji)}
                      className={`h-8 w-8 flex items-center justify-center rounded-md text-lg ${
                        newCatEmoji === emoji ? 'bg-emerald-600' : 'bg-slate-900'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-center"
                  placeholder="Autre emoji"
                />
              </div>
            </div>
            <div className="w-40">
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
              >
                <option value="investissement">Investissement</option>
                <option value="loisirs">Loisirs</option>
                <option value="epargne">Épargne / Sécurité</option>
                <option value="charges">Charges fixes</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs text-slate-400 mb-1">Montant</label>
              <input
                type="number"
                min="0"
                value={newCatAmount}
                onChange={(e) => setNewCatAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs"
              onClick={() => setShowNewCategory(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs"
              onClick={handleCreateCategory}
            >
              Créer
            </button>
          </div>
        </div>
      )}

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
